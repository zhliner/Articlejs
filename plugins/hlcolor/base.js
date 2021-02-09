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
//  各语言继承 Hicode 基类，定义匹配器序列（Object4）或实现定制处理。
//  如果需要复用其它语言的实现，创建 Hicolor 实例即可，
//  比如 HTML 中对 Javascript 或 CSS 的嵌入处理。
//
//  定制处理也可以实现一个内部的 Hicode 子类，然后创建 Hicolor 实例并传递子类实例，
//  比如内部对注释或字符串类型更细粒度的解析。此时并非复用外部实现。
//
//
//  配置对象
//  --------
//  Object4 {
//      begin:  {RegExp} 起始匹配式。
//      end:    {RegExp} 结束匹配式，可选。
//      type:   {String|Function} 类型名或进阶处理器，约定俗成的规范名称。
//      block:  [String, String] 块数据边界标识对，可选
//  }
//  .begin
//      定义起点。取值从匹配串之后开始。
//      如果end缺失，视为匹配式取值，取匹配串本身。
//  .end
//      结束匹配式。取值终点为匹配串之前，若无匹配则取测试串本身。
//  .type: {
//      String   语法类型名，如：keyword, string, operator...
//      Function 进阶处理器，实参传递为匹配集，返回处理后的结果（集）。
//  }
//  .block: [
//      0   数据起始标识（如块注释的 /*）
//      1   数据结尾标识（如块注释的 */）
//  ]
//  进阶处理器：
//  - begin (无end)
//    function(beg:String, ...subs:String): Object3|Hicolor|[Object3|Hicolor]
//    参数：匹配串, ...子匹配序列
//  - begin, end
//    function(beg:[String], text:String, end:[String]): Object3|Hicolor|[Object3|Hicolor]
//    参数：起始匹配集, 中间截取串, 结束匹配集
//
//
//  解析结果
//  --------
//  Object3 {
//      text:{String|[Object3]} 匹配的文本或进阶解析结果（集）
//      type?:{String}          类型名，未定义时text视为普通文本，可选
//      block?:[String, String] 块数据边界标识对，可选
//  }
//  .text:{[Object3]}
//  当目标类型拥有嵌入的语法解析时，即为嵌入解析的结果集。
//  注意，所有解析结果 Object3 结构相同，因此逻辑上可无限递进。
//
//
//  进阶处理器用例：
//  1.
//  HTML源码中嵌入的CSS代码：范围标签为<style></style>，但它们本身依然还属于HTML，
//  此时返回集应当是 Object2 和CSS处理器 Hicolor 实例的混合。
//  2.
//  源码中的注释如果需要进阶标记，注释的范围标识 /*...*/ 属于注释本身，
//  此时处理器可能返回一个 Object2 的集合。
//
//  注记：
//  Object4.type 作为进阶处理可以支持复杂的嵌入逻辑。
//  Hicolor/Hicode 提供了基础性的解析和管理，可以简单复用。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { languageClass } from "./main.js";


const
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
     * text:
     * 方便嵌入块封装，如果仅为了创建特定语言实现实例则可省略。
     * @param {String} lang 语言名
     * @param {String} text 待解析文本，可选
     */
    constructor( lang, text ) {
        this._lang = lang;
        this._code = text;
        this._inst = lang && new ( languageClass(lang) )();
    }


    /**
     * 执行语法着色解析。
     * 源文本中可能嵌入其它语言代码，会执行其Hicolor解析，
     * 因此结果集里可能包含子块封装。
     * 返回值：
     * Object3 {
     *      // 见页顶说明
     * }
     * Object2 {
     *      // 子块封装
     *      lang: 子块语言。
     *      data: 子块解析集{[Object3|Object2]}，结构相同。
     * }
     * @return {[Object3|Object2]} 结果集
     */
    effect() {
        let _buf = [];

        for ( const obj of this._inst.parse(this._code) ) {
            let _hi = obj instanceof Hicolor;
            if ( !_hi ) {
                _buf.push( obj );
                continue;
            }
            _buf.push( {lang: obj.lang(), data: obj.effect()} );
        }

        return _buf;
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
     * Object4说明见页顶。
     * @param {[Object4]} matches 匹配器集
     */
    constructor( matches ) {
        // 避免/gy标记
        for ( const {begin, end} of matches ) {
            let _err = this._check(begin) || this._check(end);
            if ( _err ) {
                throw new Error( `[${_err}] global or sticky flag cannot be set.` );
            }
        }
        this._re4s = matches;
    }


    /**
     * 公用：
     * 源码解析。
     * 可用于已有源码解析，也可用于代码编辑时的实时分析着色。
     * 对于后者，工作在已高亮代码内，子语言已成块，因此code为单语言。
     *
     * 附：实时分析：
     * code提取：
     * - 前端以空格或换行符或兄弟节点为分隔。
     * - 后端以兄弟节点或换行符或解包节点末尾为结束。
     * - 前后端的分隔标识内容都不包含在code内。
     * 提示：
     * 可以处理有上下文的子集，比如在注释内作更细的分析，
     * 此时传递res为一个更特定的子集即可（需扩展__Roles支持）。
     * 注记：
     * 重点是code提取的合理性（范围和效率）。
     * code所属语言可从代码容器上获取，可从Hicolor创建Hicode实例。
     *
     * 返回值：见页顶 Object3 说明。
     * @param  {String} code 源码文本
     * @param  {[RegExp]} res 定制匹配式集合，可选
     * @return {[Object3|Hicolor]} 解析结果对象集
     */
    parse( code, res ) {
        res = res || this._re4s;
        let _chs = [],
            _buf = [];

        while ( code ) {
            let _v2 = this._parseOne( code, res ),
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
     * 重载：
     * 创建注释接口。
     * 默认实现为C类型行注释和块注释。
     * 具体的语言可覆盖实现。
     * 主要用于代码编辑中即时注释目标内容。
     * 返回值约定：
     * 块注释返回单个字符串，行注释返回一个多行集合。
     * @param  {String} text 待注释文本
     * @param  {Boolean} block 为块注释，可选
     * @return {String|[String]}
     */
    comment( text, block ) {
        if ( block ) {
            return `/* ${text} */`;
        }
        return text.split('\n').map( s => `// ${s}` );
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 单轮匹配解析。
     * 迭代每一个正则配置对象，从子串头部开始且仅测试一次。
     * 返回null表示全无匹配。
     * 返回数组：
     * [0]  解析后封装的对象，对象集或Hicolor由处理器带来。
     * [1]  上级可跳过的文本长度（已封装）。
     * @param  {String} ss 目标子串
     * @param  {[RegExp]} res 匹配式集合
     * @return {[Object3|[Object3]|Hicolor, Number]|null}
     */
    _parseOne( ss, res ) {
        for ( let {begin, end, type, block} of res ) {
            let _beg = begin.exec( ss );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            if ( end ) {
                return this._range( _beg.slice(), ss.substring(_beg[0].length), end, type, block );
            }
            return this._alone( _beg, type, block );
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
     * @param  {[String]} pair 块数据边界标识对，可选
     * @return {[Object3|[Object3]|Hicolor, Number]}
     */
    _range( beg, ss, rend, type, pair ) {
        let [text, end] = this._text( ss, rend ),
            _obj = typeof type === 'function' ? type(beg, text, end) : this._obj(text, type, pair),
            _len = end ? end[0].length : 0;

        return [ _obj, beg[0].length + text.length + _len ];
    }


    /**
     * 无结束匹配式处理。
     * 处理器实参为匹配集序列。
     * @param  {String} beg 起始匹配集
     * @param  {String} type 类型名或处理器
     * @param  {[String]} pair 块数据边界标识对，可选
     * @return {[Object3|[Object3]|Hicolor, Number]}
     */
    _alone( beg, type, pair ) {
        let _obj = typeof type === 'function' ? type(...beg) : this._obj(beg[0], type, pair);
        return [ _obj, beg[0].length ];
    }


    /**
     * 构建结果对象。
     * @param  {String} text 待封装文本
     * @param  {String} type 封装类型，可选
     * @param  {[String]} pair 块数据边界标识对，可选
     * @return {Object3} 结果对象
     */
    _obj( text, type, pair ) {
        let _obj = { text };

        if ( type ) _obj.type = type;
        if ( pair ) _obj.block = pair;

        return _obj;
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
     * @param  {[Object3]} buf 结果缓存引用
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
    // 行注释 //
    COMMENTS:   /^\/\/.*$/m,
    // 块注释 /**/
    COMMENT_B:  /^\/\*[^]*\*\//,
    // 偶数\\合法
    STRING:     /^"(?:(?:\\\\)*|.*?(?:[^\\](?:\\\\)+|[^\\]))"/,
    // 原生字符串
    STRING_RAW: /^`[^]*`/,
    // 正则表达式（JS）
    REGEX:      /^\/[^/].*\/[gimsuy]*/,
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


/**
 * HTML转义处理。
 * @param  {String} val 目标字符串
 * @return {String}
 */
function escape( val ) {
    return val.replace( /[&<>]/gm, ch => __escapeMap[ch] );
}


//
// 导出
//////////////////////////////////////////////////////////////////////////////

export { Hicolor, Hicode, RE, Fx, escape };


//:debug
window.Hicolor = Hicolor;
