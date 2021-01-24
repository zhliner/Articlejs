//! $Id: plugins/hlcolor 2021.01.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用实现。
//  各语言继承 Hicode 基类，定义匹配器序列（Object3）。
//
//  Object3: {
//      begin: {RegExp|[RegExp,Boolean] 起始匹配式。
//      end:   {RegExp|[RegExp,Boolean] 结束匹配式，可选。
//      type:  {String|Function} 类型名或进阶处理器。
//  }
//  .begin
//      定义起点，布尔真值表示取值文本包含匹配文本，否则从匹配文本之后算起。
//      如果end缺失，视为匹配式取值，取匹配结果的[1]子项。
//  .end
//      定义结束点，布尔真值表示取值文本包含匹配文本，否则结束于匹配式之前。
//  .type: {
//      String   语法词，如：keyword, string, operator...
//      Function 进阶处理器：function(text): Hicolor|Object2|[Object2]
//  }
//
//  begin/end 中的第二项 Boolean 配置，
//  用例：
//  - HTML源码中嵌入的CSS代码的范围标签为<style></style>，它们不应当包含在CSS处理中，
//    因此此时的 包含 应为 false（或省略）。
//  - 源码中的注释如果需要进阶标记，注释的范围标识 /*...*/ 应当包含在注释的逻辑里，
//    此时配置中的 包含 就需要为 true。
//
//  匹配式取值[1]
//  如果没有end匹配式，begin中的匹配式取值采用子匹配式（首个）提取。
//  这样就把匹配和取值分开了，如函数调用式：
//      funame(...)
//  - 匹配式应当包含起始括号(，如：/^([a-zA-Z]\w+)\(/
//  - 而取值仅取函数名，因此需要与完整匹配式分开。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$,

    // HTML 待转换字符。
    __escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };


//
// 代码解析器。
// 实现默认的解析匹配处理。
// 如果需要，通过进阶处理器可以很容易实现定制调整。
//
class Hicode {
    /**
     * Object3说明见页顶。
     * @param {[Object3]} reall 总匹配器集
     * @param {[Object3]} reword 词分析匹配器集，可选
     */
    constructor( reall, reword ) {
        // 避免/gy标记
        for ( const {begin, end} of reall ) {
            let _err = this._check(begin) || this._check(end);
            if ( _err ) {
                throw new Error( `[${_err}] global or sticky flag cannot be set.` );
            }
        }
        this._rall = this._config( reall );
        this._rsub = this._config( reword ) || this._rall;
    }


    /**
     * 源码解析。
     * Object2: {
     *      text: {String} 代码文本
     *      type: {String} 代码类型，可选。无此项时即为普通文本
     * }
     * text:
     * - 如果存在end匹配式，返回begin和end之间的文本（不含匹配文本本身）。
     * - 如果没有end匹配式，则取begin中的首个子匹配（[1]）。
     *
     * @param  {String} code 源码文本
     * @return {[Object2|Hicolor]} 解析结果对象集
     */
    parse( code ) {
        let _chs = [], _buf = [];

        while ( code ) {
            let _v2 = this._parseOne( code ),
                _len = 0;

            if ( _v2 ) {
                this._plain( _chs, _buf );
                _buf.push( _v2[0] );
                _len = _v2[1];
            }
            else {
                let _ch = this._first( code );
                _chs.push( _ch );
                _len = _ch.length;
            }
            code = code.substring( _len );
        }
        this._plain( _chs, _buf );

        return _buf.flat();
    }


    /**
     * 即时语法分析。
     * 主要用于源码编辑时的实时分析着色。
     * 注意matches中的正则表达式也不应当包含g或y标记。
     * 此时不支持结束匹配式。
     * 注记：
     * 匹配器集应当是构造函数中所传递集合的子集。
     * 也可以处理有上下文的子集，比如在注释内更细的分析，
     * 此时matches就是一个更特定的子集。
     *
     * @param  {String} word 目标词
     * @return {Object2|null} 解析结果对象
     */
    analyze( word ) {
        for ( const {begin, type} of this._rsub ) {
            let _beg = begin[0].exec( word );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            let text = begin[1] ? _beg[0] : _beg[1];

            return typeof type === 'function' ? type(text) : {text, type};
        }
        return null;
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 单轮匹配解析。
     * 迭代每一个正则配置对象，从子串头部开始且仅测试一次。
     * 返回null表示全无匹配。
     * 返回数组中第二个值为截取的文本长度。
     * @param  {String} ss 目标子串
     * @return {[Object2|[Object2]|Hicolor, Number]|null}
     */
    _parseOne( ss ) {
        for ( let {begin, end, type} of this._rall ) {
            let _beg = begin[0].exec( ss );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            if ( !end ) {
                return this._alone( _beg[0], _beg[1], type, begin[1] );
            }
            if ( begin[1] ) {
                return this._range( ss, end, type );
            }
            return this._range2( _beg[0], ss.substring(_beg[0].length), end, type );
        }
        return null;
    }


    /**
     * 含结束点的范围处理（包含起始匹配）。
     * @param  {String} ss 待处理截取串（含起始匹配段）
     * @param  {[RegExp, Boolean]} end 终止匹配定义
     * @param  {String|Function} type 类型名或处理器
     * @return {[[Object2]|Hicolor, Number]}
     */
    _range( ss, end, type ) {
        let text = this._text( ss, ...end ),
            _obj = typeof type === 'function' ? type(text) : {text, type};

        return [ _obj, text.length ];
    }


    /**
     * 含结束点的范围处理（不含起始匹配）。
     * 起始匹配的子串不包含在进阶处理中，因此依然需要上级处理。
     * @param  {String} beg 起始匹配串
     * @param  {String} ss 待处理截取串
     * @param  {[RegExp, Boolean]} end 终止匹配定义
     * @param  {String|Function} type 类型名或处理器
     * @return {[[Object2]|Hicolor, Number]}
     */
    _range2( beg, ss, end, type ) {
        let _pre = this._parseOne( beg ),
            text = this._text( ss, ...end ),
            _cur = typeof type === 'function' ? type(text) : {text, type};

        return [ [_pre, _cur].flat(), beg.length + text.length ];
    }


    /**
     * 无结束匹配式处理。
     * @param  {String} beg 起始匹配串
     * @param  {String} text 匹配取值串（[1]）
     * @param  {String} type 类型名或处理器
     * @param  {Boolean} all 传递完整匹配串，可选
     * @return {[Object2|[Object2]|Hicolor, Number]}
     */
    _alone( beg, text, type, all ) {
        if ( all ) {
            text = beg;
        }
        let _obj = typeof type === 'function' ? type(text) : {text, type};

        return [ _obj, beg.length ];
    }


    /**
     * 文本截取。
     * 无匹配时子串为目标串本身。
     * 截取可能终于匹配串起点，因此匹配串本身可以忽略。
     * @param  {String} str 目标串
     * @param  {RegExp} end 终止匹配式
     * @param  {Boolean} has 包含匹配串
     * @return {String} 截取串
     */
    _text( str, end, has ) {
        let _v = end.exec( str );
        if ( !_v ) {
            return str;
        }
        return str.substring( 0, _v.index + (has ? _v[0].length : 0) );
    }


    /**
     * 添加纯文本对象。
     * 如果添加了对象，原字符缓存会被清空。
     * @param  {[String]} chs 字符缓存引用
     * @param  {[Object]} buf 结果缓存引用
     * @return {void}
     */
    _plain( chs, buf ) {
        if ( !chs.length ) {
            return;
        }
        buf.push( {text: chs.join('')} );
        chs.length = 0;
    }


    /**
     * 获取字符串的首个字符。
     * 支持码值大于0xFFFF的Unicode字符。
     * @param  {String} str 目标字符串
     * @return {String} 单个字符
     */
    _first( str ) {
        for ( const ch of str ) return ch;
        return '';
    }


    /**
     * 检查是否包含gy标记。
     * 不包含时返回false（通过），否则返回匹配式。
     * @param  {RegExp|[RegExp,Boolean]} its 匹配式配置
     * @return {RegExp|false|void}
     */
    _check( its ) {
        let _re = $.isArray( its ) ?
            its[0] :
            its;
        return _re && (_re.global || _re.sticky) && _re;
    }


    /**
     * 配置格式规范化。
     * @param  {[Object3]} objs 原始配置集
     * @return {objs} 规范配置集
     */
    _config( objs ) {
        if ( !objs ) return;

        for ( const obj of objs ) {
            obj.begin = this._arr2( obj.begin );

            if ( obj.end ) {
                obj.end = this._arr2( obj.end );
            }
        }
        return objs;
    }


    /**
     * 返回数组封装。
     * 原为数组时原样返回。
     * @param  {Value|[Value]} its 检测值
     * @return {[Value]}
     */
    _arr2( its ) {
        return $.isArray( its ) ? its : [ its ];
    }
}


/**
 * HTML转义处理。
 * @param  {String} val 目标字符串
 * @return {String}
 */
function escape( val ) {
    return val.replace( /[&<>]/gm, ch => __escapeMap[ch] );
}


//
// 简单工具函数。
//
const Fx = {
    // 字符串转义。
    // @return {Object2}
    escapeString: str => ({ text: escape(str), type: 'string' }),

    // 注释转义。
    // @return {Object2}
    escapeComment: str => ({ text: escape(str), type: 'comments' }),

    // 操作符转义。
    // @return {Object2}
    escapeOperator: str => ({ text: escape(str), type: 'operator' }),
}


//
// 共享定义集。
// 以基础性为原则，不同语言多出的部分自行补充。
// 注：
// Object3可定义多个相同的类型（不同匹配式）。
//
const RE = {
    // 行注释
    COMMENTS:   /^(\/\/.*)$/m,
    // 块注释
    COMMENT_B:  /^(\/\*[^]*\*\/)/,
    // 偶数\\合法
    STRING:     /^("(?:(?:\\\\)*|.*?(?:[^\\](?:\\\\)+|[^\\]))")/,
    // 简单数字
    NUMBER:     /^(-?\d+(?:\.\d+)?)\b/,
    // 复杂数字 0x..., 0..., decimal, float
    NUMBER_C:   /^(-?(?:0x[a-f0-9]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?))\b/i,
    // 二进制 0b..
    NUMBER_B:   /^(0b[01]+)\b/,
    // 基础操作符
    // 注意复杂表示在前（不含?）。
    OPERATOR:   /^(!=|!|%=|%|&&|&=|&|\*=|\*|\+\+|\+=|\+|--|-=|-|\/=|\/|<<=|<<|<=|<|==|=|>>=|>=|>>|>|\^=|\^|\|\||\|=|\||,|:)/,
};


export { Hicode, escape, RE, Fx };
