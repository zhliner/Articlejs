//! $Id: defined.js 2020.05.09 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	模板名定义集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import * as T from "./types.js";


const $ = window.$;


//
// 单元属性编辑：{
//      单元值：模板名,
// }
// 上下文菜单中“属性”条目匹配的模板。
// 注：不是所有的单元都有属性可编辑。
//
export const PropItems = {
    [ T.AUDIO ]:        'property:audio',       // source, track, text
    [ T.VIDEO ]:        'property:video',       // 同上
    [ T.PICTURE ]:      'property:picture',     // img, source...
    [ T.SVG ]:          'property:svg',         // width, height, html
    [ T.IMG ]:          'property:img',         // src, width, height, alt
    [ T.RUBY ]:         'property:ruby',        // rb, rt, rp
    [ T.TIME ]:         'property:time',        // datetime, text
    [ T.METER ]:        'property:meter',       // max, min, high, low, value, optimum
    [ T.SPACE ]:        'property:space',       // width
    [ T.A ]:            'property:a',           // href, target, download[checkbox, text]
    [ T.Q ]:            'property:q',           // cite
    [ T.ABBR ]:         'property:abbr',        // title
    [ T.DEL ]:          'property:del',         // datetime
    [ T.INS ]:          'property:ins',         // 同上
    [ T.CODE ]:         'property:code',        // data-lang, data-tab
    [ T.DFN ]:          'property:dfn',         // title
    [ T.BDO ]:          'property:bdo',         // dir
    [ T.CODELIST ]:     'property:codelist',    // data-lang, data-tab, start
    [ T.OL ]:           'property:ol',          // start, type, reversed
    [ T.OLX ]:          'property:olx',         // 同上
    [ T.TABLE ]:        'property:table',       // rows, cols, caption
    [ T.HR ]:           'property:hr',          // thick, length, height
    [ T.BLANK ]:        'property:blank',       // width, height
};


//
// 插入条目选单：{
//      单元值：模板名
// }
// 普通插入模式下待插入条目的 选单=>模板名 映射。
//
export const InputOption = {
    [ T.$TEXT ]:        'option:text',  // 单行文本
    [ T.AUDIO ]:        'option:audio',
    [ T.VIDEO ]:        'option:video',
    [ T.PICTURE ]:      'option:picture',
    [ T.SVG ]:          'option:svg',
    [ T.IMG ]:          'option:img',
    [ T.RUBY ]:         'option:ruby',
    [ T.TIME ]:         'option:time',
    [ T.METER ]:        'option:meter',
    [ T.BR ]:           'option:br',
    [ T.WBR ]:          'option:wbr',
    [ T.SPACE ]:        'option:space',

    [ T.TRACK ]:        'option:track',
    [ T.SOURCE ]:       'option:source',
    [ T.RBPT ]:         'option:rbpt',

    [ T.A ]:            'option:a',
    [ T.STRONG ]:       'option:strong',
    [ T.EM ]:           'option:em',
    [ T.Q ]:            'option:q',
    [ T.ABBR ]:         'option:abbr',
    [ T.CITE ]:         'option:cite',
    [ T.SMALL ]:        'option:small',
    [ T.DEL ]:          'option:del',
    [ T.INS ]:          'option:ins',
    [ T.SUB ]:          'option:sub',
    [ T.SUP ]:          'option:sup',
    [ T.MARK ]:         'option:mark',
    [ T.CODE ]:         'option:code',
    [ T.ORZ ]:          'option:orz',
    [ T.DFN ]:          'option:dfn',
    [ T.SAMP ]:         'option:samp',
    [ T.KBD ]:          'option:kbd',
    [ T.S ]:            'option:s',
    [ T.U ]:            'option:u',
    [ T.VAR ]:          'option:var',
    [ T.BDO ]:          'option:bdo',

    [ T.P ]:            'option:p',
    [ T.NOTE ]:         'option:note',
    [ T.TIPS ]:         'option:tips',
    [ T.PRE ]:          'option:pre',
    [ T.ADDRESS ]:      'option:address',

    [ T.H1 ]:           'option:h1',
    [ T.H2 ]:           'option:h2',
    [ T.H3 ]:           'option:h3',
    [ T.H4 ]:           'option:h4',
    [ T.H5 ]:           'option:h5',
    [ T.H6 ]:           'option:h6',
    [ T.SUMMARY ]:      'option:summary',
    [ T.FIGCAPTION ]:   'option:figcaption',
    [ T.CAPTION ]:      'option:caption',
    [ T.LI ]:           'option:li',
    [ T.DT ]:           'option:dt',
    [ T.DD ]:           'option:dd',
    [ T.TH ]:           'option:th',
    [ T.TD ]:           'option:td',
    [ T.CODELI ]:       'option:codeli',
    [ T.ALI ]:          'option:ali',
    [ T.AH4LI ]:        'option:ah4li',
    [ T.AH4 ]:          'option:ah4',
    [ T.ULXH4LI ]:      'option:ulxh4li',
    [ T.OLXH4LI ]:      'option:olxh4li',
    [ T.CASCADEH4LI ]:  'option:cascadeh4li',
    [ T.TR ]:           'option:tr',
    [ T.THEAD ]:        'option:thead',
    [ T.TBODY ]:        'option:tbody',
    [ T.TFOOT ]:        'option:tfoot',

    [ T.HGROUP ]:       'option:hgroup',
    [ T.ABSTRACT ]:     'option:abstract',
    [ T.TOC ]:          'option:toc',
    [ T.SEEALSO ]:      'option:seealso',
    [ T.REFERENCE ]:    'option:reference',
    [ T.HEADER ]:       'option:header',
    [ T.FOOTER ]:       'option:footer',
    [ T.ARTICLE ]:      'option:article',
    [ T.S1 ]:           'option:s1',
    [ T.S2 ]:           'option:s2',
    [ T.S3 ]:           'option:s3',
    [ T.S4 ]:           'option:s4',
    [ T.S5 ]:           'option:s5',
    [ T.UL ]:           'option:ul',
    [ T.OL ]:           'option:ol',
    [ T.CODELIST ]:     'option:codelist',
    [ T.ULX ]:          'option:ulx',
    [ T.OLX ]:          'option:olx',
    [ T.CASCADE ]:      'option:cascade',
    [ T.DL ]:           'option:dl',
    [ T.TABLE ]:        'option:table',
    [ T.FIGURE ]:       'option:figure',
    [ T.BLOCKQUOTE ]:   'option:blockquote',
    [ T.ASIDE ]:        'option:aside',
    [ T.DETAILS ]:      'option:details',
    [ T.CODEBLOCK ]:    'option:codeblock',

    [ T.HR ]:           'option:hr',
    [ T.BLANK ]:        'option:blank',
};
