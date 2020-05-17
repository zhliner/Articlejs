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
// 属性条目配置：{
//      单元值：模板名,
// }
// 上下文菜单中“属性”条目匹配的模板。
// 注：不是所有的单元都有属性可编辑。
//
export const PropItems = {
    [ T.AUDIO ]:        'audio',    // source, track, text
    [ T.VIDEO ]:        'video',    // 同上
    [ T.PICTURE ]:      'picture',  // img, source...
    [ T.SVG ]:          'svg',      // width, height, html
    [ T.IMG ]:          'img',      // src, width, height, alt
    [ T.RUBY ]:         'ruby',     // rb, rt, rp
    [ T.TIME ]:         'time',     // datetime, text
    [ T.METER ]:        'meter',    // max, min, high, low, value, optimum
    [ T.SPACE ]:        'space',    // width
    [ T.A ]:            'a',        // href, target, download[checkbox, text]
    [ T.Q ]:            'q',        // cite
    [ T.ABBR ]:         'abbr',     // title
    [ T.DEL ]:          'del',      // datetime
    [ T.INS ]:          'ins',      // 同上
    [ T.CODE ]:         'code',     // data-lang, data-tab
    [ T.DFN ]:          'dfn',      // title
    [ T.BDO ]:          'bdo',      // dir
    [ T.CODELIST ]:     'codelist', // data-lang, data-tab, start
    [ T.OL ]:           'ol',       // start, type, reversed
    [ T.OLX ]:          'olx',      // 同上
    [ T.TABLE ]:        'table',    // rows, cols, caption
    [ T.HR ]:           'hr',       // thick, length, height
    [ T.BLANK ]:        'blank',    // width, height
};

$.each(
    PropItems, (v, k, o) => o[k] = `property:${v}`
);


//
// 插入条目选单映射：{
//      单元值：[平级模板, 子级模板]
// }
// 普通插入模式下关联条目的 选单=>模板名 映射。
//
export const InputOption = {
    [ T.$TEXT ]:        'text',  // 单行文本
    [ T.AUDIO ]:        'audio',
    [ T.VIDEO ]:        'video',
    [ T.PICTURE ]:      'picture',
    [ T.SVG ]:          'svg',
    [ T.IMG ]:          'img',
    [ T.RUBY ]:         'ruby',
    [ T.TIME ]:         'time',
    [ T.METER ]:        'meter',
    [ T.BR ]:           'br',
    [ T.WBR ]:          'wbr',
    [ T.SPACE ]:        'space',

    [ T.TRACK ]:        'track',
    [ T.SOURCE ]:       'source',
    [ T.RBPT ]:         'rbpt',

    [ T.A ]:            'a',
    [ T.STRONG ]:       'strong',
    [ T.EM ]:           'em',
    [ T.Q ]:            'q',
    [ T.ABBR ]:         'abbr',
    [ T.CITE ]:         'cite',
    [ T.SMALL ]:        'small',
    [ T.DEL ]:          'del',
    [ T.INS ]:          'ins',
    [ T.SUB ]:          'sub',
    [ T.SUP ]:          'sup',
    [ T.MARK ]:         'mark',
    [ T.CODE ]:         'code',
    [ T.ORZ ]:          'orz',
    [ T.DFN ]:          'dfn',
    [ T.SAMP ]:         'samp',
    [ T.KBD ]:          'kbd',
    [ T.S ]:            's',
    [ T.U ]:            'u',
    [ T.VAR ]:          'var',
    [ T.BDO ]:          'bdo',

    [ T.P ]:            'p',
    [ T.NOTE ]:         'note',
    [ T.TIPS ]:         'tips',
    [ T.PRE ]:          'pre',
    [ T.ADDRESS ]:      'address',

    [ T.H1 ]:           'h1',
    [ T.H2 ]:           'h2',
    [ T.H3 ]:           'h3',
    [ T.H4 ]:           'h4',
    [ T.H5 ]:           'h5',
    [ T.H6 ]:           'h6',
    [ T.SUMMARY ]:      'summary',
    [ T.FIGCAPTION ]:   'figcaption',
    [ T.CAPTION ]:      'caption',
    [ T.LI ]:           'li',
    [ T.DT ]:           'dt',
    [ T.DD ]:           'dd',
    [ T.TH ]:           'th',
    [ T.TD ]:           'td',
    [ T.CODELI ]:       'codeli',
    [ T.ALI ]:          'ali',
    [ T.AH4LI ]:        'ah4li',
    [ T.AH4 ]:          'ah4',
    [ T.ULXH4LI ]:      'ulxh4li',
    [ T.OLXH4LI ]:      'olxh4li',
    [ T.CASCADEH4LI ]:  'cascadeh4li',
    [ T.TR ]:           'tr',
    [ T.THEAD ]:        'thead',
    [ T.TBODY ]:        'tbody',
    [ T.TFOOT ]:        'tfoot',

    [ T.HGROUP ]:       'hgroup',
    [ T.ABSTRACT ]:     'abstract',
    [ T.TOC ]:          'toc',
    [ T.SEEALSO ]:      'seealso',
    [ T.REFERENCE ]:    'reference',
    [ T.HEADER ]:       'header',
    [ T.FOOTER ]:       'footer',
    [ T.ARTICLE ]:      'article',
    [ T.S1 ]:           's1',
    [ T.S2 ]:           's2',
    [ T.S3 ]:           's3',
    [ T.S4 ]:           's4',
    [ T.S5 ]:           's5',
    [ T.UL ]:           'ul',
    [ T.OL ]:           'ol',
    [ T.CODELIST ]:     'codelist',
    [ T.ULX ]:          'ulx',
    [ T.OLX ]:          'olx',
    [ T.CASCADE ]:      'cascade',
    [ T.DL ]:           'dl',
    [ T.TABLE ]:        'table',
    [ T.FIGURE ]:       'figure',
    [ T.BLOCKQUOTE ]:   'blockquote',
    [ T.ASIDE ]:        'aside',
    [ T.DETAILS ]:      'details',
    [ T.CODEBLOCK ]:    'codeblock',

    [ T.HR ]:           'hr',
    [ T.BLANK ]:        'blank',
};

$.each(
    InputOption, (v, k, o) => o[k] = `option:${v}`
);
