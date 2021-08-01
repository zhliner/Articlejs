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
//  各语言继承 Hicode 基类，定义匹配器序列（Object5）或实现定制处理（Object5.handle）。
//  如果需要复用其它语言的实现，创建 Hicolor 实例即可，
//  比如 HTML 中对 Javascript 或 CSS 的嵌入处理。
//
//  定制处理也可以实现一个内部的 Hicode 子类，然后创建 Hicolor 实例并传递子类实例，
//  比如内部对注释或字符串类型更细粒度的解析。此时并非复用外部实现。
//
//
//  配置对象
//  --------
//  Object5 {
//      type:   {String}    类型名，约定俗成的规范名，可选
//      begin:  {RegExp}    起始匹配式
//      end:    {Function}  匹配结束检测器，可选
//      handle: {Function}  匹配结果进阶处理器，可选
//      block:  [String, String] 块数据边界标识对，辅助代码表中行的标注，可选
//  }
//  .type:
//      语法类型名。如：keyword, string, operator ...
//      如果是匹配一个内部子语法块，type即为可选。
//  .begin
//      起始匹配。独立词汇本身或包含子域的起始匹配式，子域数据取值从匹配之后开始。
//      如果end缺失，取值为匹配结果本身或交由进阶处理器（handle）处理。
//  .end
//      子域数据的匹配结束检测函数，接受两个实参：(后段文本, 起始匹配集)
//      返回一个二成员数组：[子域数据段, 结束匹配集]
//      其中：
//      - 后段文本指起始匹配串之后的原串部分。
//      - 子域数据段作为取值文本。如果 handle 有定义，它是传入的第二个实参。
//      - 结束匹配集是一个字符串数组，其中首个成员为结束匹配串本身（类似exec()的结果）。
//        它会作为 handle（如果有） 的第三个实参传入。
//  .block: [
//      0   数据起始标识（如块注释的 /*）
//      1   数据结尾标识（如块注释的 */）
//  ]
//
//
//  进阶处理器：
//  进一步检查&处理匹配的文本，如果不合法应当返回false，让当前轮匹配测试继续。
//  这可以弥补复杂情况下单纯正则表达式无法应对的情况（如 JS 里正则封装与除法符相同）。
//  - begin (无end)
//    function( ...beg:String ): String|Hicolor|Object3|[...]
//    参数：匹配结果序列
//  - begin, end
//    function( beg:[String], text:String, end:[String] ): String|Hicolor|Object3|[...]
//    参数：起始匹配集, 中间段文本, 结束匹配集
//
//  返回值：
//  - String        匹配目标类型（type）的文本。应已转义。
//  - Hicolor       子语法块的高亮处理器。
//  - Object3       单个配置对象（{type, text, block}）。
//    混合数组成员：
//  - [String]      匹配目标类型（type）的文本串，type已知。
//  - [Object3]     既成的配置对象集。需要包含自身的type名称。
//                  参考：/languages/css.js 属性选择器实现（[data-pbo~=fulled]）。
//  - [Hicolor]     也可以是子语法块高亮处理器。
//
//
//  解析结果
//  --------
//  Object3 {
//      text:  {String|[Object3]} 匹配的文本或进阶解析结果（集）
//      type?: {String}           类型名，未定义时text视为普通文本，可选
//      block?:[String, String]   块数据边界标识对，可选
//  }
//  成员.text:
//  - 当匹配目标拥有嵌入的语法子块时，text 即为嵌入子块的解析结果集（[Object3]）。
//  - 所有层级/子块的解析结果（Object3）结构相同，因此逻辑上可无限递进。
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


const
    $ = window.$,

    // 忽略匹配式
    // 用户匹配式之外的普通文本简单跳过，避免局部匹配。
    __reIgnore = /^(\w+|\s\s+)/,

    // 字符串转义序列（基础）
    __escStr = /\\(?:0|a|b|f|n|r|t|v|'|"|\\|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/g,

    // HTML转义字符。
    __escapeMap = {
        '<':    '&lt;',
        '>':    '&gt;',
        '&':    '&amp;',
    };



//
// 代码解析器。
// 实现默认的解析匹配处理。
// 如果需要，通过进阶处理器可以很容易实现定制处理，如子语法块，HTML转义等。
// 内部接口：
// 由 languages/ 中的各语言继承实现自身语法解析。
//
class Hicode {
    /**
     * Object5说明见页顶。
     * @param {[Object5]} matches 匹配器集
     * @param {RegExp|[RegExp]} skip 简单跳过匹配式（集）
     */
    constructor( matches, skip = __reIgnore ) {
        // 避免/gy标记
        for ( const {begin, end} of matches ) {
            let _err = this._check(begin) || this._check(end);
            if ( _err ) {
                throw new Error( `[${_err}] global or sticky flag cannot be set.` );
            }
        }
        this._rexs = matches.concat( this._skipObj(skip) );
    }


    /**
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
        res = res || this._rexs;
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
     * 创建注释。
     * 默认实现为C语言风格的行注释和块注释。
     * 具体的语言可覆盖本实现。
     * 可用于代码编辑中即时注释目标内容。
     * 返回值：
     * 块注释返回单个字符串，行注释返回一个行集合。
     * @param  {String} text 待注释文本
     * @param  {Boolean} block 为块注释，可选
     * @return {String|[String]}
     */
    comment( text, block ) {
        if ( block ) {
            return `/* ${text} */`;
        }
        return text.split( '\n' ).map( s => `// ${s}` );
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 单轮匹配解析。
     * 迭代正则配置对象集，按顺序测试匹配式，首个匹配者有效。
     * 返回null表示全部不匹配。
     * 返回数组：
     * [0]  解析后封装的对象、对象集或子块Hicolor实例。
     * [1]  已封装的文本长度（告诉上级跳过量）。
     * @param  {String} ss 目标子串
     * @param  {[RegExp]} res 匹配式集合
     * @return {[Object3|Hicolor|[Object3|Hicolor], Number]|null}
     */
    _parseOne( ss, res ) {
        for ( let {type, begin, end, handle, block} of res ) {
            let _beg = begin.exec( ss ),
                _sure;

            // 仅从开头匹配，容错不规范正则式。
            if ( _beg && _beg.index === 0 ) {
                _sure = end ?
                    this._range( _beg.slice(), ss.substring(_beg[0].length), end, type, handle, block ) :
                    this._alone( _beg, type, handle, block );
            }
            if ( _sure ) return _sure;
        }
        return null;
    }


    /**
     * 含结束点的范围处理。
     * - 如果有进阶处理，传递3个实参：起始匹配集, 中间截取串, 结束匹配集。
     * - 如果没有进阶处理，取值文本为中间截取串。
     * @param  {[String]} beg 起始匹配集
     * @param  {String} ss 待处理截取串（起始匹配之后）
     * @param  {Function} fend 匹配终止检测器
     * @param  {String} type 类型名
     * @param  {Function} handle 进阶处理器，可选
     * @param  {[String]} pair 块数据边界标识对，可选
     * @return {[Object3|[Object3]|Hicolor, Number]|false}
     */
    _range( beg, ss, fend, type, handle, pair ) {
        let [text, end] = fend( ss, beg ),
            _txt = handle && handle( beg, text, end );

        return _txt !== false &&
        [
            this._custom( _txt, type, text, pair ),
            beg[0].length + text.length + (end ? end[0].length : 0)
        ];
    }


    /**
     * 无结束匹配式处理。
     * 处理器实参为匹配集序列。
     * @param  {String} beg 起始匹配集
     * @param  {String} type 类型名
     * @param  {Function} handle 进阶处理器，可选
     * @param  {[String]} pair 块数据边界标识对，可选
     * @return {[Object3|[Object3]|Hicolor, Number]|false}
     */
    _alone( beg, type, handle, pair ) {
        let _txt = handle && handle( ...beg );

        return _txt !== false &&
        [
            this._custom( _txt, type, beg[0], pair ),
            beg[0].length
        ];
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
        buf.push( {text: htmlEscape( chs.join('') )} );
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


    /**
     * 跳过匹配式对象构建。
     * @param  {RegExp|[RegExp]} res 匹配式（集）
     * @return {Object5|[Object5]}
     */
    _skipObj( res ) {
        if ( $.isArray(res) ) {
            return res.map( re => ({ begin: re }) );
        }
        return res ? { begin: res } : [];
    }


    /**
     * 定制处理结果判断构造。
     * @param  {String|[String]|Hicolor} result 定制处理返回值
     * @param  {String} type 类型名
     * @param  {String} text 原匹配文本
     * @param  {[String]} block 块数据标识符对，可选
     * @return {Object3|Hicolor|[Object3|Hicolor]}
     */
    _custom( result, type, text, block ) {
        // 未处理
        if ( result === undefined ) {
            return { type, text, block };
        }
        if ( $.isArray(result) ) {
            return this._obj3s( result, type, block );
        }
        // 源码或子语法块（Hicolor）或 Object3
        return typeof result === 'string' ? { type, text: result, block } : result;
    }


    /**
     * 数值返回集处理。
     * 如果成员为字符串，表示其为匹配目标类型的文本。
     * 否则应当是一个 Object3 对象（包含 type 定义）。
     * 会滤除值为 null|undefined 的成员。
     * @param  {[String]} vals 三段文本集
     * @param  {String} type 目标类型名
     * @param  {[String]} block 块数据标识符对
     * @return {[Object3]}
     */
    _obj3s( vals, type, block ) {
        return $.map(
            vals,
            it => typeof it === 'string' ? { type, text: it, block } : it
        );
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
    COMMENT_B:  /^\/\*[^]*?\*\//,
    // 双引号包围
    // 偶数 \\ 可正确匹配。
    STRING:     /^"(?:(?:\\\\)*|.*?(?:[^\\](?:\\\\)+|[^\\]))"/,
    // 原生字符串（撇号）
    STRING_RAW: /^`[^]*?`/,
    // 单引号包围
    STRING_1:   /^'(?:(?:\\\\)*|.*?(?:[^\\](?:\\\\)+|[^\\]))'/,
    // 简单数字
    NUMBER:     /^(-?\d+(?:\.\d+)?)\b/,
    // 复杂数字 0x..., 0..., decimal, float
    NUMBER_C:   /^(-?(?:0x[a-f0-9]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?))\b/i,
    // 二进制 0b..
    NUMBER_B:   /^(0b[01]+)\b/i,
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


/**
 * HTML转义处理。
 * @param  {String} txt 目标字符串
 * @return {String}
 */
function htmlEscape( txt ) {
    return txt.replace( /[&<>]/gm, ch => __escapeMap[ch] );
}


/**
 * 词序列转为正则表达式。
 * 所有的空白都会被清除，词区分大小写。
 * 返回值：
 * 仅匹配单个词，且从头部开始。
 * @param  {String} str 词序列（空白分隔）
 * @param  {String} fix 后端修饰/隔离符，可选
 * @return {RegExp} 单词匹配式
 */
function reWords( str, fix = '\\b' ) {
    return new RegExp(
        '^(' + str.trim().split( /\s+/ ).join( '|' ) + ')' + fix
    );
}


/**
 * 按模式匹配切分封装。
 * 将目标文本内的模式文本切分提取出来，标记为目标类型Object3。
 * 返回的文本已经进行了HTML转义。
 * 注记：
 * 用于外部用户简单的分解目标模式文本。
 * @param  {String} txt 目标文本
 * @param  {RegExp} re  匹配模式
 * @param  {String} type 模式类型名
 * @return {String|[String|Object]}
 */
function regexpEscape( txt, re, type ) {
    let _buf = [],
        _arr,
        _i = 0;

    while ( (_arr = re.exec(txt)) !== null ) {
        if ( _arr.index > 0 ) {
            _buf.push(
                htmlEscape( txt.substring(_i, _arr.index) )
            );
        }
        _buf.push( {type, text: _arr[0]} );
        _i = re.lastIndex;
    }
    if ( _i > 0 ) {
        _buf.push( htmlEscape( txt.substring(_i) ) );
    }

    return _buf.length ? _buf : htmlEscape( txt );
}


/**
 * 字符串转义序列封装。
 * 实现基本的转义序列标记（操作符：operator）。
 * 参见 __escStr 定义。
 * \0       空字符
 * \a       响铃
 * \b       退格
 * \f       换页
 * \n       换行
 * \r       回车
 * \t       制表符
 * \v       垂直制表符
 * \'       单引号
 * \"       双引号
 * \\       反斜杠
 * \xhh     十六进制的 Latin-1
 * \uXXXX   十六进制的 Unicode 码点
 * 注：
 * 结果中的字符串部分已经进行了HTML转义。
 * @param  {String} str 目标字符串
 * @return {String|[String|Object]}
 */
function stringEscape( str ) {
    return regexpEscape( str, __escStr, 'operator' );
}


//
// 导出（内部接口）
//////////////////////////////////////////////////////////////////////////////


export { Hicode, RE, htmlEscape, reWords, regexpEscape, stringEscape };
