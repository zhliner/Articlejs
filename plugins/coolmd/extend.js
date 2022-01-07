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
    By = Object.create( BaseBy );


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
    HGROUP:     null,
    HEADER:     null,
    FOOTER:     null,
    ARTICLE:    null,
    SECTION:    null,
    UL:         null,
    OL:         null,
    DL:         null,
    TABLE:      null,
    FIGURE:     null,
    BLOCKQUOTE: null,
    ASIDE:      null,
    DETAILS:    null,
    HR:         null,
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
 * @param  {Number} n 设定级别，可选
 * @return {String}
 */
function miniTitle( el, n = 5 ) {
    let _tt = conLine( el );
    return n ? `${''.padStart(n, '#')} ${_tt}` : _tt;
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
 * @param  {String} 前导字符，可选
 * @return {String}
 */
function conLine( el, previx = '' ) {
    let _tts = [];

    for ( const nd of $.contents(el, null, false, true) ) {
        if ( nd.nodeType === 3 ) {
            _tts.push( nd.textContent )
            continue;
        }
        _tts.push( convNormal(el, __inlineFunc) );
    }
    return previx + _tts.join( '' );
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