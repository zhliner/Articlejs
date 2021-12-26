//! $ID: html.js 2021.01.25 Cooljed.Highlight $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  XML/HTML语言的高亮配置实现。
//
//  主要包含标签名、属性名、属性值（字符串）和注释段。
//  另外还有代码块（<![CDATA[...]]>）和实体（如 &gt;）。
//
//  内嵌代码块：
//  - <style> CSS 样式代码 </style>
//  - <script> JavaScript 代码 </script>
//
//  说明：
//  标签名不再检查是否为HTML规范中的具体名称，只要满足格式即认可（< 开头）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "../../tpb/config.js";

import { Hicode, htmlEscape, regexpEscape } from "../base.js";
import { Hicolor } from "../main.js";
import { CSSAttr } from "./css.js";


const
    // HTML 实体模式。
    __reEntity = /^&(\w+|#\d+|#x[0-9a-fA-F]+);/g,

    // 结束标记（>）检索器。
    __Split = new $.Spliter();


// 标签名
// const xmltag = reWords(`
//     DOCTYPE
//     a abbr address area article aside audio
//     b base bdi bdo blockquote body br button
//     canvas caption cite code col colgroup content
//     data datalist dd del details dfn dialog div dl dt
//     em embed
//     fieldset figcaption figure footer form
//     h1 h2 h3 h4 h5 h6 head header hgroup hr html
//     i iframe img input ins
//     kbd keygen
//     label legend li link
//     main map mark menu menuitem meta meter
//     nav noscript
//     object ol optgroup option output
//     p param picture pre progress
//     q
//     rb rp rt rtc ruby
//     s samp script section select slot small source span strong style sub summary sup
//     table tbody td textarea tfoot th thead time title tr track template
//     u ul
//     var video
//     wbr
// `);



class HTML extends Hicode {

    constructor() {
        super([
            {
                type:   'comments',
                begin:  /^<!--[^]*?-->/,
                handle: htmlEscape,
            },

            // 样式元素（<style>）处理
            {
                type:   'xmltag',
                begin:  /^(<)(style)\b/i,
                end:    toEndTag,
                handle: (beg, txt, end) => langHandle( beg, txt, end, 'css' ),
            },

            // 脚本元素（<script>）处理
            {
                type:   'xmltag',
                begin:  /^(<)(script)\b/i,
                end:    toEndTag,
                handle: (beg, txt, end) => langHandle( beg, txt, end, 'javascript' ),
            },

            // 普通元素处理
            {
                type:   'xmltag',
                // 起始标签
                begin:  /^(<)([a-zA-Z][\w.:-]*)/,
                // 至标签结束匹配
                end:    toTagEnd,
                handle: tagHandle,
            },
            {
                type:   'xmltag',
                // 结束标签
                begin:  /^<\/(\w[\w.:-]*)/,
                handle: (_, $1) => [ {text: '&lt;/'}, $1 ],
            },
            {
                // 执行器，如 <!DOCTYPE
                type:   'important',
                begin:  /^(<!)([a-zA-Z][\w.:-]*)/,
                end:    toTagEnd,
                handle: tagHandle,
            },
            {
                // <![CDATA[ ... ]]>
                type:   'important',
                begin:  /^(<!\[CDATA\[)([^]+?)(\]\]>)/i,
                handle: (_, $1, $2, $3) => [ $1, {text: htmlEscape($2)}, $3 ],
            },
            {
                // HTML 实体
                type:   'literal',
                begin:  new RegExp( __reEntity, '' ),
            }
        ]);
    }
}


//
// 标签内属性解析器。
// 分解出属性名和属性值、以及样式属性内的CSS语法。
//
class Attr extends Hicode {

    constructor() {
        super([
            // 样式属性特别处理
            {
                type:   'attribute',
                begin:  /^(style)=(["'])/i,
                end:    styleCode,

                // 引号视为普通文本。
                handle: (beg, txt, end) => [
                    beg[1],
                    { text: '=' },
                    inlineStyles( beg[2], txt, end[0] ),
                ],
            },
            // 普通属性处理。
            {
                type:   'attribute',
                // 合法属性名
                begin:  /^[$a-zA-Z][$\w-]*/,
            },

            {
                // 双引号包围
                type:   'string',
                begin:  /^"([^]*?)"/,
                handle: escapeEntity,
            },
            {
                // 单引号包围
                type:   'string',
                begin:  /^'([^]*?)'/,
                handle: escapeEntity,
            },
        ]);
    }

}


/**
 * 标签结束查找匹配。
 * 查找标签结束字符排除属性值内的“>”。
 * @param  {String} txt 标签后文本
 * @return {[String, [String]]} [属性文本段, 结束匹配集]
 */
function toTagEnd( txt ) {
    let _i = __Split.index( txt, '>' );
    // 按位置截取“>”。
    return [ txt.substring(0, _i), [txt.substring(_i, _i+1)] ];
}


/**
 * 标签匹配处理。
 * 元素属性序列作为一个单独的类实现
 * 目标类型：xmltag
 * @param  {[String]} beg 起始匹配集
 * @param  {String} txt 标签内属性序列
 * @param  {[String]} end 结束匹配集
 * @return {[String|Object3|Hicolor]} 解析结果集
 */
function tagHandle( beg, txt, end ) {
    return [
        { text: htmlEscape(beg[1]) },
        beg[2],
        txt && new Hicolor( txt, new Attr() ) || null,
        { text: htmlEscape(end[0]) }
    ];
}


/**
 * 结束标签查找匹配。
 * 注意查找的是结束标签（</style>）而非起始标签结束。
 * @param  {String} txt 起始标签后文本
 * @param  {[String]} beg 起始匹配集
 * @return {[String, [String]]} [属性文本段, 结束匹配集]
 */
function toEndTag( txt, beg ) {
    let _end = new RegExp( `(</)(${beg[2]})(>)`, 'i' ),
        _val = _end.exec( txt );

    if ( !_val ) {
        return [ txt, [''] ];
    }
    return [ txt.substring(0, _val.index), _val.slice() ];
}


/**
 * 子语法块处理。
 * 包含三个部分：
 * - 起始标签内属性和标签结束。
 * - 标签包含的子内容部分（子语法块）。
 * - 结束标签本身。
 * @param  {[String]} beg 起始匹配集
 * @param  {String} txt 标签内属性序列
 * @param  {[String]} end 结束匹配集
 * @param  {String} lang 子语言名（css|js）
 * @return {[String|Object3|Hicolor]} 解析结果集
 */
function langHandle( beg, txt, end, lang ) {
    let [tac, tend] = toTagEnd( txt ),
        _code = txt.substring( tac.length + tend[0].length ),
        _lang = _code.trim() && new Hicolor( _code, lang );

    return tagHandle( beg, tac, tend )
        .concat([
            // 可能不含内容
            _lang || ( _code.length ? {text: _code} : null ),
            // 结束标签
            end[1] && { text: htmlEscape(end[1]) },
            end[2],
            end[3] && { text: htmlEscape(end[3]) }
        ]);
}


/**
 * 内联样式属性代码提取。
 * @param  {String} txt 样式属性文本
 * @param  {[String]} beg 样式属性名匹配集（含等号和引号）
 * @return {[String, [String]]} [样式代码, 结束字符匹配集]
 */
function styleCode( txt, beg ) {
    let ch = beg[2],
        _i = txt.indexOf( ch );
    // ch: ["']
    return [ txt.substring(0, _i), [ch] ];
}


/**
 * 内联样式解析集。
 * 由字符串类型封装。
 * @param  {String} q1 起始引号
 * @param  {String} txt 样式文本
 * @param  {String} q2 结束引号
 * @return {[String|Object3]}
 */
function inlineStyles( q1, txt, q2 ) {
    return {
        type: 'string',
        text: [ q1, ...new Hicolor( txt, new CSSAttr() ).effect(), q2 ]
    };
}


/**
 * 文本内容提取实体解析。
 * @param  {String} txt 目标文本
 * @return {String|[String|Object]}
 */
function escapeEntity( txt ) {
    return regexpEscape( txt, __reEntity, 'literal' );
}


export { HTML };
