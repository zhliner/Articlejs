//! $ID: extend.js 2022.01.05 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件 OnBy 扩展
//  导出的对象中需包含 On 和 By 两个成员。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { BaseOn, BaseBy } from "../../base/tpb/tpb.esm.js";

const
    $ = window.$,

    On = Object.create( BaseOn ),
    By = Object.create( BaseBy ),

    // 引用块行前缀
    __blockquote = '>',

    // 单元格分隔序列
    __tableCell = ' §§ ',   // 单元格之间
    __cellStart = '§ ',     // 首个单元格开头
    __cellEnd   = ' §',     // 最后单元格末尾

    // 片区间隔（双空行）。
    __spaceSection = '\n\n\n';


//
// 全局变量：
// 可以由外部配置修改。
//
let
    // 小标题级别
    __miniLevel = 5,

    // 一个缩进的空格数。
    __indentSpace = 4;


//
// 行块标签操作映射。
// 不同的标签对应各自的转换处理器。
// 如果没有处理器，则仅取其纯文本内容（而非outerHTML输出）。
// { String: Function }
//
const __blockFunc =
{
    // 内容行
    P:          conLine,
    ADDRESS:    conLine,
    DD:         conLine,
    TR:         cellsTr,
    TH:         conLine,
    TD:         conLine,
    LI:         convLi,

    // 标题系列
    H1:         el => `# ${el.textContent}`,
    H2:         el => `## ${el.textContent}`,
    H3:         el => `### ${el.textContent}`,
    H4:         el => `#### ${el.textContent}`,
    H5:         el => `##### ${el.textContent}`,
    H6:         el => `###### ${el.textContent}`,

    // 其它标题
    DT:         miniTitle,
    SUMMARY:    miniTitle,
    FIGCAPTION: miniTitle,
    CAPTION:    miniTitle,

    // 结构块
    HGROUP:     blockIgnore,
    HEADER:     convBlockquote,
    FOOTER:     convBlockquote,
    ARTICLE:    blockIgnore,
    SECTION:    convSection,
    UL:         convList,
    OL:         convList,
    DL:         convDl,
    TABLE:      convTable,
    TBODY:      convTable,
    THEAD:      convTable,
    TFOOT:      convTable,
    FIGURE:     convFigure,
    BLOCKQUOTE: convBlockquote,
    ASIDE:      smallBlock,
    DETAILS:    smallBlock,
    HR:         () => '------',
}


//
// 内联标签操作映射
// 注：仅支持编辑器支持的部分。
// 如果没有处理器，仅取其纯文本内容。
// { String: Function }
//
const __inlineFunc =
{
    // MarkDown标准支持
    CODE:   convCode,
    EM:     el => `*${el.textContent}*`,
    I:      el => `*${el.textContent}*`,
    STRONG: el => `**${el.textContent}**`,
    B:      el => `**${el.textContent}**`,
    A:      el => `[${el.textContent}](${el.href}${el.title ? ` "${el.title}"` : ''})`,
    IMG:    el => `![${el.alt}](${el.src}${el.title ? ` "${el.title}"` : ''})`,

    // 支持合法的特性名
    // {cite}
    Q:      el => `<q${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</q>`,
    // {title}
    ABBR:   el => `<abbr${el.title ? ` title="${el.title}"` : ''}>${el.textContent}</abbr>`,
    DFN:    el => `<dfn${el.title ? ` title="${el.title}"` : ''}>${el.textContent}</dfn>`,
    // {datetime, cite}
    DEL:    el => `<del${el.datetime ? ` datetime="${el.datetime}"` : ''}${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</del>`,
    INS:    el => `<ins${el.datetime ? ` datetime="${el.datetime}"` : ''}${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</ins>`,
    // {dir}
    BDO:    el => `<dbo${el.dir ? ` dir="${el.dir}"` : ''}>${el.textContent}</dbo>`,
    // {datetime}
    TIME:   el => `<time${el.datetime ? ` datetime="${el.datetime}"` : ''}>${el.textContent}</time>`,

    // 无特性仅内容
    // 注：不支持内联样式延续。
    cite:   el => `<cite>${el.textContent}</cite>`,
    small:  el => `<small>${el.textContent}</small>`,
    sub:    el => `<sub>${el.textContent}</sub>`,
    sup:    el => `<sup>${el.textContent}</sup>`,
    mark:   el => `<mark>${el.textContent}</mark>`,
    samp:   el => `<samp>${el.textContent}</samp>`,
    kbd:    el => `<kbd>${el.textContent}</kbd>`,
    s:      el => `<s>${el.textContent}</s>`,
    u:      el => `<u>${el.textContent}</u>`,
    var:    el => `<var>${el.textContent}</var>`,
};


//
// 定制类型转换。
// 主要用于代码块/代码表单元。
//
const __roleFunc =
{
    // 代码块
    codeblock:  convCodeblock,

    // 代码表
    codelist:   convCodelist,
}



// 定制转换
//////////////////////////////////////////////////////////////////////////////


/**
 * 内联代码转换。
 * 只保留顶层元素，内部嵌套的子单元忽略。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function convCode( el ) {
    let _txt = el.textContent,
        _chx = '`';

    if ( /`.*`/.test(_txt) ) {
        _chx = '``';
    }
    return `${_chx}${_txt}${_chx}`;
}


/**
 * 列表项转换。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function convLi( el ) {
    if ( el.parentElement.tagName === 'UL' ) {
        return conLine( el, '- ' );
    }
    return conLine( el, `${$.siblingNth(el)}. ` );
}


/**
 * 其它小标题。
 * 可由外部设定级别，支持内容包含内联单元。
 * 如果n为零，表示转为普通文本行。
 * 注记：
 * 编辑器支持的区块小标题为<h3>，但在MarkDown中这样的级别明显偏大。
 * 通常合理的设计为第5级，避免对大纲造成干扰。
 * @param  {Element} el 目标元素
 * @param  {Number} n 标题层级数
 * @return {String}
 */
function miniTitle( el, n = __miniLevel ) {
    let _tt = conLine( el );
    return n ? `${''.padStart(n, '#')} ${_tt}` : _tt;
}


/**
 * 片区转换。
 * 内部的<h2>标题转换为合适层级。
 * 对于无role定义的深片区，内部的<h2>转为第6级。
 * 注记：
 * 片区只存在于顶层，故返回一个合并了的字符串。
 * @param  {Element} el 片区元素
 * @return {String}
 */
function convSection( el ) {
    let _hx = $.get( 'h2', el ),
        _sx = $.attr( el, 'role' ) || '_6',
        _buf = [];

    if ( _hx ) {
        _buf.push( miniTitle(_hx, +_sx.slice(-1)) );
    }
    for ( const sub of el.children ) {
        _buf.push(
            convNormal( sub, __blockFunc )
        );
    }
    return _buf.join( __spaceSection );
}


/**
 * 列表转换。
 * 支持有序和无需列表，以及由这两种列表组成的级联表。
 * 注：级联表用缩进表示。
 * @param  {Element} el 列表元素
 * @return {[String]} 行集
 */
function convList( el ) {
    let _n = cascadeNth( el.parentElement ),
        _ind = '',
        _buf = [];

    if ( _n ) {
        _ind = ''.padStart( _n*__indentSpace, ' ' );
    }
    for ( const li of el.children ) {
        _buf.push( _ind + convLi(li) );
    }
    return _buf;
}


/**
 * 引用块转换。
 * 内部的<h3>小标题级别需要调整。
 * 注记：
 * 其它小区块也使用引用块语法封装。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convBlockquote( el ) {
    let _h3 = $.get( '>h3:first-child', el ),
        _buf = [];

    if ( _h3 ) {
        // 后附一空行
        _buf.push( miniTitle(_h3), '' );
    }
    for ( const sub of el.children ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return _buf;
}


/**
 * 小区块转换。
 * 主要针对<aside>、<details>等单元。
 * 内部各子单元以一个前缀封装字符（空行）分隔。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function smallBlock( el ) {
    let _buf = [];

    for ( const sub of el.children ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return _buf;
}


/**
 * 定义列表转换。
 * 各 <dd> 行之间以一个换行符分隔。
 * 各 <dt><dd>+ 块之间用一个空行分隔。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convDl( el ) {
    let _buf = [];

    for ( const sub of el.children ) {
        // 非首个<dt>之前插入一个空行
        if ( sub.tagName === 'DT' && _buf.length > 0 ) {
            _buf.push( '' );
        }
        _buf.push( convNormal(sub, __blockFunc) );
    }
    return _buf;
}


/**
 * 插图转换。
 * 每一个图片&讲解转换为一个普通段落（<img>+<i>）文本。
 * 参考：<figure/figcaption, [span/img, i]+
 * 注：
 * 插图标题可能在底部，统一提取到上部首行。
 * @param  {Element} el 插图元素
 * @return {[String]} 行集
 */
function convFigure( el ) {
    let _cap = $.get( 'figcaption', el ),
        _els = _cap ? $.siblings(_cap) : [...el.children],
        _buf = [];

    if ( _cap ) {
        _buf.push( miniTitle(_cap), '' );
    }
    for ( const sub of _els ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return _buf;
}


/**
 * 表格数据转换。
 * 适用表格及其内部的块单元（tbody|tfoot|thead）。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convTable( el ) {
    let _cap = $.get( 'caption', el ),
        _trs = $.find( 'tr', el ),
        _buf = [];

    if ( _cap ) {
        _buf.push( miniTitle(_cap), '' );
    }
    for ( const tr of _trs ) {
        _buf.push( cellsTr(tr) );
    }
    return _buf;
}


/**
 * 代码块转换。
 * 结构：<pre role="codeblock">/<code>+
 * @param  {Element} el 根元素
 * @return {String}
 */
function convCodeblock( el ) {
    //
}


/**
 * 代码表转换。
 * 结构：<ol role="codelist">/[<li>/<code>]+
 * @param  {Element} el 根元素
 * @return {String}
 */
function convCodelist( el ) {
    //
}



// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 通用的处理器。
 * 如果不存在目标处理器，则取其纯文本返回。
 * @param  {Element} el 目标元素
 * @param  {Object} cobj 处理器集
 * @return {String}
 */
function convNormal( el, cobj ) {
    let _fn = cobj[ el.tagName ];
    return _fn ? _fn( el ) : el.textContent.trim();
}


/**
 * 内容行元素转换。
 * 比如<p>、<li>、<dd>、<td>等可直接包含文本内容的元素。
 * @param  {Element} el 目标元素
 * @param  {String} prefix 前导字符，可选
 * @return {String}
 */
function conLine( el, prefix = '' ) {
    let _tts = [];

    for ( const nd of $.contents(el, null, false, true) ) {
        if ( nd.nodeType === 3 ) {
            _tts.push( nd.textContent )
            continue;
        }
        _tts.push( convNormal(el, __inlineFunc) );
    }
    return prefix + _tts.join( '' );
}


/**
 * 表格行转换。
 * - 单元格之间以一个特殊序列 §§ 分隔。
 * - 首尾单元格外围则只有单个 § 包围。
 * @param  {Element} tr 表格行元素
 * @return {String} 一行文本
 */
function cellsTr( tr ) {
    return __cellStart +
        [...tr.children].map( conLine ).join( __tableCell ) +
        __cellEnd;
}


/**
 * 结构块忽略。
 * @return {String}
 */
function blockIgnore() { return ''; }


/**
 * 获取级联表所在层级。
 * 即子列表在<li>元素之内。
 * @param  {Element} el 列表容器元素
 * @return {Number}
 */
function cascadeNth( el ) {
    let _n = 0;

    while ( el.tagName === 'LI' ) {
        _n++;
        el = el.parentElement;
    }
    return _n;
}



// 扩展&导出
//////////////////////////////////////////////////////////////////////////////

/**
 * 转换为MarkDown源码。
 * @data: [String] 选取集HTML源码
 * @return {String}
 */
function mdblock( evo ) {
    //
}


export { On, By };