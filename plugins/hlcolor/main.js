//! $Id: plugins/hlcolor.js 2021.01.19 Articlejs.Plugins $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用框架。
//
//  对字符串进行有序的迭代解析。按顺序剥离特定的语法结构后，剩余部分将更容易处理。
//  各语言继承 Hicode 实现，初始传递匹配器序列（Object3）。
//
//  Object3: {
//      begin: {RegExp} 起始匹配式。取[1]为文本，可为空。
//      end:   {RegExp} 结束匹配式。同上，可选。
//      type:  {String|Function} 类型名或进阶处理器。
//  }
//  Object3.type: {
//      String   语法词，如：keyword, string, operator...
//      Function 进阶处理器：function(text): Hicolor | [Object2]
//  }
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    //
    // 高亮名:角色映射。
    // 高亮名清单见../plugins/hicolor，角色名为高亮元素<b>中的role值。
    //
    __Roles = {
        'keyword':      'kw',   // 关键字
        'literal':      'lit',  // 字面值（如 true, iota）
        'string':       'str',  // 字符串
        'function':     'fn',   // 函数名
        'operator':     'op',   // 运算符
        'datatype':     'dt',   // 数据类型
        'xmltag':       'tag',  // 标签名
        'attribute':    'an',   // 属性名（attribute-name）
        'selector':     'slr',  // CSS选择器
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'xmlcdata':     'cd',   // <![CDATA[...
        'regexp':       're',   // 正则表达式
        'color16':      'c16',  // CSS 16进制颜色 #fff #f0f0f0
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释内容
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 注释类型名。
    __cmtName = 'comments';



//
// 语法高亮类。
// 1. 源码按正则式解析为“未匹配串+匹配封装对象”的数组。
// 2. 按目标语言配置的正则集顺序，迭代处理前阶的未匹配串。
// 3. 压平结果数组，包装输出字符串和封装对象代码。
// 注记：
// 解析形成一个数组树，不会打乱源码顺序，压平输出即可。
// @param {string} code 待解析源码
// @param {array} regs  目标正则配置集
// @param {string} lang 源码所属语言注明，可选
//
class Hicolor {
    /**
     * @param {String} lang 语言名
     */
    constructor( lang ) {
        this._lang = lang || '';
    }


    /**
     * 解析获取HTML源码。
     * 如果文本中嵌入了其它语言代码，结果集里会包含对象成员。
     * Object: {
     *      lang: 子块语言
     *      html: 子块源码，可能包含更深层的子块嵌套
     * }
     * @param  {String} text 待解析文本
     * @return {[String|Object]} 结果集
     */
    html( text ) {
        //
    }


    /**?
     * 解析获取高亮代码。
     * - 空白字符串无需进一步匹配处理；
     * - 返回直接文本和标识包装的混合串；
     * 返回值：[
     *      {string},  // 高亮代码字符串
     *      {
     *      lang: {string}  // 嵌入语言名
     *          data: {array}      // 迭代封装：[string, object]
     *      },...
     * ]
     * @return {array} 高亮代码集
     */
    get() {
        if (!this._regs || !this._code.trim()) {
            return [this._code];
        }
        var _buf = this._parse([this._code], this._regs);

        return __U.arrFlat(_buf).map(function(it) {
            // 最终未匹配字串无封装
            if (typeof it == 'string') {
                return it;
            }
            return it.lang
                ? { 'lang': it.lang(), 'data': it.get() }
                : it.html();
        });
    }


    /**
     * 返回语言名。
     * @return {string}
     */
    lang() {
        return this._lang;
    }


    //-- 私有辅助 -------------------------------------------------------------

}



//
// 代码解析器。
// 实现默认的解析匹配处理。
// 具体语言可简单继承并配置匹配集即可。
// 如果需要，通过进阶处理器可以很容易实现定制调整。
//
class Hicode {
    /**
     * 注：实参类型参考页顶说明。
     * @param {[Object3]} matches 匹配器集
     */
    constructor( matches ) {
        // 避免/gy标记
        for ( const {begin, end} of matches ) {
            if (begin.global || end.global ||
                begin.sticky || end.sticky) {
                throw new Error( `[${begin}, ${end}] global or sticky flag cannot be set.` );
            }
        }
        this._cfg = matches;
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
     * 注记：
     * 匹配器集应当是构造函数中所传递集合的子集。
     * 也可以处理有上下文的子集，比如在注释内更细的分析，
     * 此时matches就是一个更细的子集。
     *
     * @param  {String} word 目标词
     * @param  {[Object3]} 匹配器集（不含进阶处理）
     * @return {Object2} 解析结果对象
     */
    analyze( word, matches ) {
        for ( const {begin, end, type} of matches ) {
            let _beg = begin.exec( word );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            return { text: end ? this._text(word.substring(_beg[0].length))[0] : _beg[1], type };
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
        for ( let {begin, end, type} of this._cfg ) {
            let _beg = begin.exec( ss );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            let [text, len] = end ? this._text(ss.substring(_beg[0].length)) : [_beg[1], 0],
                _len = len + _beg[0].length;

            return typeof type === 'function' ? [type(text), _len] : [{text, type}, _len];
        }
        return null;
    }


    /**
     * 文本截取。
     * 子串终止于匹配开始的位置。
     * 无匹配时子串为目标串本身。
     * @param  {String} str 目标串
     * @param  {RegExp} end 终止匹配式
     * @return {[String, Number]} 子串和匹配长度
     */
    _text( str, end ) {
        let _v = end.exec( str );

        if ( _v ) {
            return [ str.substring(0, _v.index), _v.index + _v[0].length ];
        }
        return [ str, str.length ];
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

}


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 构建高亮源码。
 * 注：注释包含在<i>元素内。
 * Object: {
 *      text: {String} 代码文本
 *      type: {String} 代码类型，可选。无此项时即为普通文本
 * }
 * @param  {Object} obj 解析结果对象
 * @return {String}
 */
export function codeHTML( obj ) {
    if ( obj.type == null ) {
        return obj.text;
    }
    if ( obj.type == __cmtName ) {
        return `<i>${obj.text}</i>`;
    }
    return `<b role="${__Roles[obj.type] || __nonRole}">${obj.text}</b>`;
}



//
// 导出
//////////////////////////////////////////////////////////////////////////////

export { Hicolor };
