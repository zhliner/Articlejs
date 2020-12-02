//! $Id: templates.js 2020.05.09 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板配置集。
//
//  主面板：新建插入类型条目的模板名映射，<option>条目。
//  模态框：可编辑属性的单元的属性编辑模板名映射，<li>条目。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import * as T from "./types.js";


//
// 插入条目：{
//      单元值：模板名
// }
// 普通模式下待插入条目的 选单/模板名 映射。
//////////////////////////////////////////////////////////////////////////////
// 注记：
// <option value="[录入模板名]">[条目名]</option>
// 用户单击选单，OBT提取录入模板并在录入区显示，供用户录入内容。
//
const InputOptions = {
    [ T.$TEXT ]:        'option:text',

    [ T.AUDIO ]:        'option:audio',
    [ T.VIDEO ]:        'option:video',
    [ T.PICTURE ]:      'option:picture',
    [ T.SVG ]:          'option:svg',
    [ T.RUBY ]:         'option:ruby',
    [ T.METER ]:        'option:meter',
    [ T.SPACE ]:        'option:space',
    [ T.IMG ]:          'option:img',
    [ T.BR ]:           'option:br',
    [ T.WBR ]:          'option:wbr',

    [ T.TRACK ]:        'option:track',
    [ T.SOURCE ]:       'option:source',
    [ T.EXPLAIN ]:      'option:explain',
    [ T.RBPT ]:         'option:rbpt',
    [ T.SVGITEM ]:      'option:svgitem',

    [ T.A ]:            'option:a',
    [ T.Q ]:            'option:q',
    [ T.ABBR ]:         'option:abbr',
    [ T.DEL ]:          'option:del',
    [ T.INS ]:          'option:ins',
    [ T.DFN ]:          'option:dfn',
    [ T.BDO ]:          'option:bdo',
    [ T.TIME ]:         'option:time',
    [ T.CODE ]:         'option:code',
    [ T.STRONG ]:       'option:strong',
    [ T.EM ]:           'option:em',
    [ T.CITE ]:         'option:cite',
    [ T.SMALL ]:        'option:small',
    [ T.SUB ]:          'option:sub',
    [ T.SUP ]:          'option:sup',
    [ T.MARK ]:         'option:mark',
    [ T.ORZ ]:          'option:orz',
    [ T.SAMP ]:         'option:samp',
    [ T.KBD ]:          'option:kbd',
    [ T.S ]:            'option:s',
    [ T.U ]:            'option:u',
    [ T.VAR ]:          'option:var',
    // 不支持单独创建
    // [ T.B ]:         '',
    // [ T.I ]:         '',

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
    [ T.TR ]:           'option:tr',
    [ T.THEAD ]:        'option:thead',
    [ T.TBODY ]:        'option:tbody',
    [ T.TFOOT ]:        'option:tfoot',

    [ T.CODELI ]:       'option:codeli',
    [ T.ALI ]:          'option:ali',
    [ T.AH4 ]:          'option:ah4',
    [ T.XH4LI ]:        'option:xh4li',
    [ T.CASCADEH4LI ]:  'option:cascadeh4li',
    [ T.CASCADEAH4LI ]: 'option:cascadeah4li',
    [ T.FIGIMGBOX ]:    'option:figimgbox',

    [ T.HGROUP ]:       'option:hgroup',
    [ T.S1 ]:           'option:s1',
    [ T.S2 ]:           'option:s2',
    [ T.S3 ]:           'option:s3',
    [ T.S4 ]:           'option:s4',
    [ T.S5 ]:           'option:s5',
    [ T.ABSTRACT ]:     'option:abstract',
    [ T.SEEALSO ]:      'option:seealso',
    [ T.REFERENCE ]:    'option:reference',
    [ T.HEADER ]:       'option:header',
    [ T.FOOTER ]:       'option:footer',
    [ T.SECTION ]:      'option:section',
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



//
// 单元属性：{
//      单元值：模板名,
// }
// 即上下文菜单中“属性”条目匹配的模板。
// 不是所有的单元都有属性可编辑。
//////////////////////////////////////////////////////////////////////////////
// 注记：选取集单元必须相同，才能调出属性编辑框。
//
const Properties = {
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
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取允许的子单元值集。
 * @param  {Number} v 父单元值
 * @return {[Number]}
 */
function childCanTypes(v) {
    return OptionCustom[v] || ChildTypes[v] || [];
}


/**
 * 获取可插入选单集。
 * 根据参考单元值返回可插入子单元的值集。
 * 如果参考是一个集合，返回各成员子单元值集的交集。
 * 用于可插入项选单构建。
 * 注意：传入的数组实参会被修改。
 * @param  {Number|[Number]} ref 参考单元值（集）
 * @return {[Number]}
 */
export function options( ref ) {
    if ( !$.isArray(ref) ) {
        return childCanTypes( ref );
    }
    return ref.reduce(
        (vs, p) => vs.filter( v => childCanTypes(p).includes(v) ),
        childCanTypes( ref.shift() )
    );
}
