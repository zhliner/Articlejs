//! $Id: base.js 2021.01.19 Articlejs.Plugins.hlcolor $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用框架。
//
//  各语言继承 Hicode 基类，定义匹配器序列（Object3）或实现定制处理。
//  如果需要复用其它语言的实现，创建 Hicolor 实例即可，
//  比如 HTML 中对 Javascript 或 CSS 的嵌入处理。
//
//  定制处理也可以实现一个内部的 Hicode 子类，然后创建 Hicolor 实例并传递子类实例，
//  比如内部对注释或字符串类型更细粒度的解析。此时并非复用外部实现。
//
//  Object3: {
//      begin: RegExp 起始匹配式。
//      end:   RegExp 结束匹配式，可选。
//      type:  {String|Function} 类型名或进阶处理器（如子块分析、转义）。
//  }
//  .begin
//      定义起点。取值从匹配串之后开始。
//      如果end缺失，视为匹配式取值，取匹配串本身。
//  .end
//      结束匹配式。取值终点为匹配串之前，若无匹配则取测试串本身。
//  .type: {
//      String   语法类型名，如：keyword, string, operator...
//      Function 进阶处理器，传递匹配集，返回处理后的结果。
//  }
//  进阶处理器：
//  - begin (无end)
//    function(beg:String, ...subs:String): Object2|Hicolor|[Object2|Hicolor]
//    参数：匹配串, 子匹配集序列
//  - begin, end
//    function(beg:[String], text:String, end:[String]): Object2|Hicolor|[Object2|Hicolor]
//    参数：起始匹配集, 中间截取串, 结束匹配集
//  返回值：
//  Object2 {
//      text: String 匹配串。可为HTML。
//      type: String 类型名。可选，未定义时text视为普通文本。
//  }
//
//  进阶处理器用例：
//  1.
//  HTML源码中嵌入的CSS代码：范围标签为<style></style>，但它们本身依然还属于HTML，
//  此时返回集应当是 Object2 和CSS处理器 Hicolor 实例的混合。
//  2.
//  源码中的注释如果需要进阶标记，注释的范围标识 /*...*/ 属于注释本身，
//  此时处理器应当返回一个 Object2 的集合。
//
//  注记：
//  Object3.type 可作为进阶处理，因此可以支持复杂的嵌入逻辑。
//  Hicolor/Hicode 提供了基础性的解析和构造HTML能力，简单复用即可。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { languageClass } from "./main.js";


const
    // 高亮名:角色映射。
    // 高亮名用于具体语言中使用，角色名用于封装元素<b>中的role值。
    // 此处的高亮名用于语言实现中的规范名称（type）。
    __Roles = {
        'keyword':      'kw',   // 关键字
        'literal':      'lit',  // 字面值（如 true, iota）
        'string':       'str',  // 字符串
        'number':       'num',  // 数值
        'function':     'fn',   // 函数名
        'operator':     'op',   // 运算符
        'datatype':     'dt',   // 数据类型
        'xmltag':       'tag',  // 标签名
        'attribute':    'atn',  // 属性名（attribute-name）
        'regex':        're',   // 正则表达式
        'selector':     'slr',  // 选择器（ID, class, 伪类）
        'rgba':         'rgb',  // RGB, RGBA: #fff, #f0f0f0, rgb(214, 86, 0)
        'hsla':         'hsl',  // HSL, HSLA: hsl(24deg, 100%, 42%)
        'unit':         'un',   // CSS单位
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释（单独封装）
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 注释类型名。
    __cmtName = 'comments',

    // HTML转义字符。
    __escapeMap = {
        '<':    '&lt;',
        '>':    '&gt;',
        '&':    '&amp;',
    };



//
// 语法高亮处理器。
// 使用 LangMap 中配置的具体实现。
//
class Hicolor {
    /**
     * lang:
     * 实例实参在特定语言有内部子块实现时有用，
     * 此时仅限于结构性子块（如注释内容），而不是语言子块。
     * 注：语言子块只能复用全局实现集。
     * text:
     * 方便嵌入块封装，如果仅为了实时分析，可省略。
     * @param {String|Hicode} lang 语言名或实现实例
     * @param {String} text 待解析文本，可选
     */
    constructor( lang, text ) {
        let _inst;

        if ( typeof lang === 'string' ) {
            _inst = new ( languageClass(lang) )();
        }
        if ( _inst ) {
            this._lang = lang;
        }
        this._code = text;
        this._inst = _inst || lang;
    }


    /**
     * 解析获取HTML源码。
     * 如果文本中嵌入了其它语言代码，结果集里会包含对象成员。
     * String: 已解析源码字符串（含HTML标签）
     * Object2: {
     *      lang: 子块语言
     *      html: 子块源码集{[String|Object2]}，可含子块嵌套
     * }
     * @return {[String|Object2]} 源码集
     */
    html() {
        let _buf = [], _tmp = [];

        for ( const obj of this._inst.parse(this._code) ) {
            let _hi = obj instanceof Hicolor;
            if ( !_hi ) {
                _tmp.push( codeHTML(obj) );
                continue;
            }
            this._string( _tmp, _buf );
            _buf.push( {lang: obj.lang(), html: obj.html()} );
        }

        return this._string( _tmp, _buf );
    }


    /**
     * 返回语法解析器。
     * 主要用于调用其analyze()实时解析。
     * @return {Hicode} 解析实例（子类）
     */
    parser() {
        return this._inst;
    }


    /**
     * 返回语言名。
     * @return {string|null}
     */
    lang() {
        return this._lang || null;
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 添加字符串成员。
     * 从子串存储区提取合并添加到结果存储区。
     * 成功提取后会清空原存储区。
     * @param  {[String]} tmp 子串存储区引用
     * @param  {Array} buf 结果存储区引用
     * @return {Array} buf
     */
    _string( tmp, buf ) {
        if ( tmp.length ) {
            buf.push( tmp.join('') );
            tmp.length = 0;
        }
        return buf;
    }

}


//
// 代码解析器。
// 实现默认的解析匹配处理。
// 如果需要，通过进阶处理器可以很容易实现定制调整。
// 注意：
// 这里并不对匹配的值进行HTML转义，这由语言实现自己负责。
// 因此也就支持处理器返回HTML（不常见）。
//
class Hicode {
    /**
     * Object3说明见页顶。
     * @param {[Object3]} matches 匹配器集
     */
    constructor( matches ) {
        // 避免/gy标记
        for ( const {begin, end} of matches ) {
            let _err = this._check(begin) || this._check(end);
            if ( _err ) {
                throw new Error( `[${_err}] global or sticky flag cannot be set.` );
            }
        }
        this._re2s = matches;
    }


    /**
     * 源码解析。
     * 返回值 Object2: {
     *      text: {String} 代码文本，应当已转义
     *      type: {String} 代码类型，可选。未定义时text为普通文本
     * }
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
     * 不支持结束匹配式。
     * 提示：
     * 可以处理有上下文的子集，比如在注释内更细的分析，
     * 此时传递res为一个更特定的子集即可。
     * @param  {String} word 目标词
     * @param  {[RegExp]} res 匹配式集合，可选
     * @return {Object2|null} 解析结果对象
     */
    analyze( word, res ) {
        res = res || this._re2s;

        for ( const {begin, type} of res ) {
            let _beg = begin.exec( word );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            // 定制处理传递匹配集序列。
            return typeof type === 'function' ? type(..._beg) : {text: _beg[0], type};
        }
        return null;
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 单轮匹配解析。
     * 迭代每一个正则配置对象，从子串头部开始且仅测试一次。
     * 返回null表示全无匹配。
     * 返回数组中第二个值为上级可跳过的文本长度。
     * @param  {String} ss 目标子串
     * @return {[Object2|[Object2]|Hicolor, Number]|null}
     */
    _parseOne( ss ) {
        for ( let {begin, end, type} of this._re2s ) {
            let _beg = begin.exec( ss );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            if ( end ) {
                return this._range( _beg.slice(), ss.substring(_beg[0].length), end, type );
            }
            return this._alone( _beg, type );
        }
        return null;
    }


    /**
     * 含结束点的范围处理。
     * - 如果有定制处理，传递3个实参：中间截取串, 起始匹配集, 结束匹配集。
     * - 如果没有定制处理，取值文本为中间截取串。
     * @param  {[String]} beg 起始匹配集
     * @param  {String} ss 待处理截取串
     * @param  {RegExp} rend 终止匹配式
     * @param  {String|Function} type 类型名或处理器
     * @return {[[Object2]|Hicolor, Number]}
     */
    _range( beg, ss, rend, type ) {
        let [text, end] = this._text( ss, rend ),
            _obj = typeof type === 'function' ? type(beg, text, end) : {text, type},
            _len = end ? end[0].length : 0;

        return [ _obj, beg[0].length + text.length + _len ];
    }


    /**
     * 无结束匹配式处理。
     * 处理器实参为匹配集序列。
     * @param  {String} beg 起始匹配集
     * @param  {String} type 类型名或处理器
     * @return {[Object2|[Object2]|Hicolor, Number]}
     */
    _alone( beg, type ) {
        let _obj = typeof type === 'function' ? type(...beg) : {text: beg[0], type};
        return [ _obj, beg[0].length ];
    }


    /**
     * 文本截取。
     * 无终点匹配时子串为目标串本身。
     * @param  {String} str 目标串
     * @param  {RegExp} end 终止匹配式
     * @return {[String, [String]|null]} 截取串和匹配集
     */
    _text( str, end ) {
        let _v = end.exec( str );
        if ( !_v ) {
            return [ str, null ];
        }
        return [ str.substring(0, _v.index), _v.slice() ];
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
        buf.push( {text: escape( chs.join('') )} );
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
     * @param  {RegExp} re 匹配式
     * @return {RegExp|false|void}
     */
    _check( re ) {
        return re && (re.global || re.sticky) && re;
    }
}


//
// 共享定义集。
// 以基础性为原则，不同语言多出的部分自行补充。
// 注：
// 首个子匹配即为完整匹配。
//
const RE = {
    // 行注释
    COMMENTS:   /^(\/\/.*)$/m,
    // 块注释
    COMMENT_B:  /^(\/\*[^]*\*\/)/,
    // 偶数\\合法
    STRING:     /^("(?:(?:\\\\)*|.*?(?:[^\\](?:\\\\)+|[^\\]))")/,
    // 正则表达式
    REGEX:      /^(\/[^/].*\/[gimsuy]*)/,
    // 简单数字
    NUMBER:     /^(-?\d+(?:\.\d+)?)\b/,
    // 复杂数字 0x..., 0..., decimal, float
    NUMBER_C:   /^(-?(?:0x[a-f0-9]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?))\b/i,
    // 二进制 0b..
    NUMBER_B:   /^(0b[01]+)\b/,
    // 基础操作符
    // 注意复杂表示在前（不含?）。
    OPERATOR:   /^(!=|!|%=|%|&&|&=|&|\*=|\*|\+\+|\+=|\+|--|-=|-|\/=|\/|<<=|<<|<=|<|==|=|>>=|>=|>>|>|\^=|\^|\|\||\|=|\||,|:)/,
    // 出错消息，前置：
    // - error:
    // - err:
    // - [error]:
    // - [err]:
    ERROR:      /^("(?:\[?(?:error|err)\]?):.*?[^\\]")/i,
};


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
    escapeOperator: op => ({ text: escape(op), type: 'operator' }),

    // 正则表达式转义。
    // @return {Object2}
    escapeRegex: val => ({ text: escape(val), type: 'regex' }),

    // 错误提示内容转义。
    // @return {Object2}
    escapeError: msg => ({ text: escape(msg), type: 'error' }),
}


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * HTML转义处理。
 * @param  {String} val 目标字符串
 * @return {String}
 */
function escape( val ) {
    return val.replace( /[&<>]/gm, ch => __escapeMap[ch] );
}


/**
 * 构建高亮源码。
 * 注释包含在<i>元素内。
 * Object2: {
 *      text: {String} 代码文本，应当已转义
 *      type: {String} 代码类型，可选。无此项时即为普通文本
 * }
 * @param  {Object2} obj 解析结果对象
 * @return {String} 封装的源码
 */
function codeHTML( obj ) {
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

export { Hicolor, Hicode, RE, Fx, escape };


//:debug
window.Hicolor = Hicolor;
