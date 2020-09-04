//! $Id: create.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元创建。
//
//  单元的容器和内容条目分开创建，以便于容器可以接收既有的内容条目（如移动传入）。
//  单元容器的创建是通用的（依配置），内容插入则有各自的限定。
//
//  注记：
//  从简化和宽容性考虑，分级片区和行块内容可以同时存在于同一层级（相同父元素）。
//  虽然传统上或从清晰的逻辑上看不应如此，但CSS样式的能力可以让它们被清晰区分开来。
//
//  这种宽容可以提供编辑时的便捷：
//  - 可以在内容片区插入合法的分级片区，方便将内容行块移入该新片区。
//  - 可以将分级片区解包到当前位置成为内容，这样其它兄弟分级片区的转换就很正常了。
//  - 是否在最终的文档中让两者混合出现是作者的选择，作者可以选择清晰的分层结构，抑或不。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { processProxy } from "./tpb/pbs.by.js";
import * as T from "./types.js";
import { getType, setType, tableObj } from "./base.js";
import { Local } from "../config.js";


const
    $ = window.$,

    // 片区选择器。
    // 不包含role约束，因为nth-of-type()只支持标签区分。
    __slrSect = 'section';


//
// 简单默认消息。
//
const
    __msgAudio = "Sorry, your browser doesn't support embedded audios.",
    __msgVideo = "Sorry, your browser doesn't support embedded videos.";



//
// 标签定义集。
// 可能附带角色配置（\分隔）。
// { 单元类型值： 标签 | 标签\角色 }
//////////////////////////////////////////////////////////////////////////////
const Tags = {
    //
    // 内联结构元素
    /////////////////////////////////////////////
    [ T.AUDIO ]:        'audio',
    [ T.VIDEO ]:        'video',
    [ T.PICTURE ]:      'picture',
    [ T.SVG ]:          'svg',
    [ T.RUBY ]:         'ruby',
    [ T.METER ]:        'meter',
    [ T.SPACE ]:        'span\\space',
    [ T.IMG ]:          'img',
    [ T.BR ]:           'br',
    [ T.WBR ]:          'wbr',
    //
    // 内联结构子
    /////////////////////////////////////////////
    [ T.SVGITEM ]:      null,
    [ T.TRACK ]:        'track',
    [ T.SOURCE ]:       'source',
    [ T.EXPLAIN ]:      'span\\explain',
    [ T.RB ]:           'rb',
    [ T.RT ]:           'rt',
    [ T.RP ]:           'rp',
    [ T.RBPT ]:         null,
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ T.A ]:            'a',
    [ T.STRONG ]:       'strong',
    [ T.EM ]:           'em',
    [ T.Q ]:            'q',
    [ T.ABBR ]:         'abbr',
    [ T.CITE ]:         'cite',
    [ T.TIME ]:         'time',
    [ T.SMALL ]:        'small',
    [ T.DEL ]:          'del',
    [ T.INS ]:          'ins',
    [ T.SUB ]:          'sub',
    [ T.SUP ]:          'sup',
    [ T.MARK ]:         'mark',
    [ T.CODE ]:         'code',
    [ T.ORZ ]:          'code\\orz',
    [ T.DFN ]:          'dfn',
    [ T.SAMP ]:         'samp',
    [ T.KBD ]:          'kbd',
    [ T.S ]:            's',
    [ T.U ]:            'u',
    [ T.VAR ]:          'var',
    [ T.BDO ]:          'bdo',

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ T.P ]:            'p',
    [ T.NOTE ]:         'p\\note',
    [ T.TIPS ]:         'p\\tips',
    [ T.ADDRESS ]:      'address',
    [ T.PRE ]:          'pre',
    //
    // 块内结构子
    /////////////////////////////////////////////
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
    [ T.TR ]:           'tr',
    [ T.TH ]:           'th',
    [ T.TD ]:           'td',
    [ T.TBODY ]:        'tbody',
    [ T.THEAD ]:        'thead',
    [ T.TFOOT ]:        'tfoot',
    // 定制结构（无role）。
    [ T.CODELI ]:       'li',
    [ T.ALI ]:          'li',
    [ T.AH4 ]:          'h4',
    [ T.ULXH4LI ]:      'li',
    [ T.OLXH4LI ]:      'li',
    [ T.CASCADEH4LI ]:  'li',
    [ T.CASCADEAH4LI ]: 'li',
    [ T.FIGIMGP ]:      'p',

    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ T.HGROUP ]:       'hgroup',
    [ T.ABSTRACT ]:     'header\\abstract',
    [ T.TOC ]:          'nav\\toc',
    [ T.SEEALSO ]:      'ul\\seealso',
    [ T.REFERENCE ]:    'ol\\reference',
    [ T.HEADER ]:       'header',
    [ T.FOOTER ]:       'footer',
    [ T.ARTICLE ]:      'article',
    [ T.S1 ]:           'section\\s1',
    [ T.S2 ]:           'section\\s2',
    [ T.S3 ]:           'section\\s3',
    [ T.S4 ]:           'section\\s4',
    [ T.S5 ]:           'section\\s5',
    [ T.UL ]:           'ul',
    [ T.OL ]:           'ol',
    [ T.CODELIST ]:     'ol\\codelist',
    [ T.ULX ]:          'ul\\ulx',
    [ T.OLX ]:          'ol\\olx',
    [ T.CASCADE ]:      'ol\\cascade',
    [ T.DL ]:           'dl',
    [ T.TABLE ]:        'table',
    [ T.FIGURE ]:       'figure',
    [ T.BLOCKQUOTE ]:   'blockquote',
    [ T.ASIDE ]:        'aside',
    [ T.DETAILS ]:      'details',
    [ T.CODEBLOCK ]:    'pre\\codeblock',
    [ T.HR ]:           'hr',
    [ T.BLANK ]:        'div\\blank',

    //
    // 特殊用途。
    /////////////////////////////////////////////
    [ T.B ]:            'b',
    [ T.I ]:            'i',
};


//
// 定制创建（空元素）。
// 覆盖默认的 elem() 创建方法。
// 返回 null 表示无法独立创建（如<tr>）。
// 接口：function( tag, role ): Element | false
//////////////////////////////////////////////////////////////////////////////
const CustomMaker = {
    //
    // 音频：嵌入不支持提示。
    //
    [ T.AUDIO ]: function( tag ) {
        return $.elem( tag, __msgAudio );
    },


    //
    // 视频：嵌入不支持提示。
    //
    [ T.VIDEO ]: function( tag ) {
        return $.elem( tag, __msgVideo );
    },


    //
    // 名称空间不同，特别创建。
    //
    [ T.SVG ]: function() {
        return $.svg();
    },
};

//
// 不支持直接简单创建。
// 接口：function(): null
// 注记：调用children()才是正确的场景。
///////////////////////////////////////
[
    [ T.SVGITEM ],  // 通用标识，手动创建
    [ T.RBPT ],     // 抽象类型，无创建
    [ T.TR ],       // 由专用接口创建（Table）
    [ T.TBODY ],    // 注记：多个<tbody>由移动/克隆产生（如果兼容）
]
.forEach( key => CustomMaker[key] = () => null );


//
// 子内容创建集。
// 创建目标应有的子节点，可能是一个节点序列（如<tr>: <th>|<td>...）。
// 返回值：{
//      node: 新插入的子节点（集）
//      end:  构建结束，无需进入下一步（Builder）。
// }
// function( box:Element, opts:Object, data:Value ): Object
// - Object: { node: Node|[Node], end: Boolean }
//////////////////////////////////////////////////////////////////////////////
//
const Children = {
    //
    // 内联结构元素
    /////////////////////////////////////////////


    /**
     * SVG内容插入。
     * 内容支持源码和节点数据。
     * 无特性配置。
     * @param {Element} svg SVG根元素
     * @param {Node|[Node]|String} data
     * @node: {[Node]|data}
     */
    [ T.SVG ]: function( svg, _, data ) {
        return result( null, svgInsert(svg, data), true );
    },


    /**
     * SVG子单元内容插入。
     * 内容支持源码和节点数据。
     * 无特性配置。
     * @param {Element} sel 普通SVG容器元素
     * @param {Node|[Node]|String} data
     * @node: {[Node]|data}
     */
    [ T.SVGITEM ]: function( sel, _, data ) {
        return result( null, svgInsert(sel, data), true );
    },


    /**
     * 空元素由下阶处理（下同）。
     * @param {Element} ruby 注音元素
     * @node: {[Element]}
     */
    [ T.RUBY ]: function( ruby ) {
        return result(
            null,
            $.append( ruby, elements(T.RB, T.RP, T.RT, T.RP) )
        );
    },

    [ T.RBPT ]: function( ruby ) {
        return result(
            null,
            $.append( ruby, elements(T.RB, T.RP, T.RT, T.RP) )
        );

    },


    //
    // 块内结构子
    /////////////////////////////////////////////


    /**
     * 单元格已经存在。
     * @node: {[Element]} <th>,<td>
     */
    [ T.TR ]: function( tr ) {
        return result( null, [...tr.children] );
    },


    /**
     * 数据集仅需大小信息。
     * 无元素特性配置。下同。
     * @param {[Value]} data 数据集
     * @node: {Element|[Element]} 行元素/集
     */
    [ T.TBODY ]: function( body, _, data ) {
        return result(
            null,
            appendRows( body, size(data) )
        );
    },

    [ T.THEAD ]: function( head, _, data ) {
        return result(
            null,
            appendRows( head, size(data), true )
        );
    },

    [ T.TFOOT ]: function( foot, _, data ) {
        return result(
            null,
            appendRows( foot, size(data) )
        );
    },


    /**
     * 级联标题链接条目。
     * 标题内容应当是一个构建好的链接元素，
     * 因为标题不在正常的递进构建流程里。
     * 注：主要用于目录小标题项。
     * @param {Element} li 列表项容器
     * @param {Element} h4 链接内容
     */
    [ T.CASCADEAH4LI ]: function( li, {h4} ) {
        return result(
            insertHeading( li, T.AH4, h4 ),
            $.append( li, elem(T.OL) )
        );
    },


    /**
     * 仅返回图片元素供递进构建。
     * 注记：讲解可选故由属性配置。
     * @param {Element} p 段落容器
     * @param {String|Node|[Node]} explain 图片讲解，可选
     * @node: {Element}
     */
    [ T.FIGIMGP ]: function( p, {explain} ) {
        return result(
            explain && $.append( p, elem(T.EXPLAIN, explain) ),
            $.prepend( p, elem(T.IMG) )
        );
    },


    //
    // 行块结构元素
    /////////////////////////////////////////////


    /**
     * @param {Element} hgroup
     * @node: {[Element]}
     */
    [ T.HGROUP ]: function( hgroup ) {
        return result(
            null,
            $.append( hgroup, elements(T.H1, T.H2) )
        );
    },


    /**
     * 仅构建标签和级联表根。
     * 注记：目录内容由专用函数构建和更新。
     * @param {Element} toc 目标根元素
     * @param {String} h3 目录显示标签
     */
    [ T.TOC ]: function( toc, {h3} ) {
        return result(
            insertHeading( toc, T.H3, h3 ),
            $.append( toc, elem(T.CASCADE) ),
            true
        );
    },


    /**
     * 两个子单元位置确定。
     * 仅为容器创建，需向后续传递进构建。
     * @param {Element} art 文章元素
     * @param {Boolean} header 有无导言
     * @param {Boolean} footer 有无结语
     * @node: {Element|[Element]}
     */
    [ T.ARTICLE ]: function( art, {header, footer} ) {
        let _buf = [];

        if ( header  ) {
            _buf.push( insertHeader(art) );
        }
        if ( footer ) {
            _buf.push( appendFooter(art) );
        }
        return result( null, _buf.filter(v => v) );
    },


    /**
     * 代码表内容。
     * 根容器已经设置了必要特性。
     * @param {Element} ol 代码表容器
     * @param {String} lang 语言编码
     * @param {[String]} data 源码行集
     */
    [ T.CODELIST ]: function( ol, _, data ) {
        return result(
            null,
            appendNodes( ol, size(data), () => elem(T.CODELI) )
        );
    },


    /**
     * 允许创建一个标题项。
     * 如果未传递标题内容，表示只创建数据条目（<dd>）。
     * data仅取成员数量特性。
     * @param {Element} dl 定义列表根容器
     * @param {String|Node|[Node]} dt 标题内容，可选
     * @param {Value|[Value]} dd 数据条目（集）
     * @head: {Element|null}
     * @node: {Element|[Element]}
     */
    [ T.DL ]: function( dl, {dt}, data ) {
        return result(
            dt && $.append( dl, elem(T.DT, dt) ),
            appendNodes( dl, size(data), () => elem(T.DD) )
        );
    },


    /**
     * 表格子单元创建。
     * 标题内容作为选项成员出现。
     * 表头/表脚仅创建为空元素，返回忽略。
     * 注记：
     * 仅需返回表体单元供递进的行元素处理。
     * 不提供删除选项子单元的能力。
     * @param {Element} tbl 表格元素
     * @param {String|Node|[Node]} caption 表标题内容
     * @param {Boolean} head 添加表头
     * @param {Boolean} foot 添加表脚
     * @node: {Element} 表体元素
     */
    [ T.TABLE ]: function( tbl, {caption, head, foot} ) {
        let _tbo = tableObj( tbl ),
            _buf = [];

        if ( caption ) {
            _buf.push( _tbo.caption(caption) );
        }
        if ( head ) {
            _buf.push( _tbo.head(true) );
        }
        if ( foot ) {
            _buf.push( _tbo.foot(true) );
        }
        return result( _buf, _tbo.body(true) );
    },


    /**
     * 插图标题可选。
     * 注：仅测试标题有效性，由下一阶构建。
     * @param {Element} fig 插图根元素
     * @node: {Element|[Element]}
     */
    [ T.FIGURE ]: function( fig, {figcaption} ) {
        return result(
            figcaption && insertHeading( fig, T.FIGCAPTION, figcaption ),
            $.append( fig, elem(T.FIGIMGP) )
        );
    },


    /**
     * 内容简介必需。
     * data无值会创建一个空段落，除非传递一个空数组。
     * 支持在现有<details>上添加内容。
     * @param {Element} box 容器元素
     * @param {String|Node|[Node]} summary 简介
     * @param {Value|[Value]} data 数据集
     * @node: {Element|[Element]}
     */
    [ T.DETAILS ]: function( box, {summary}, data ) {
        return result(
            insertHeading( box, T.SUMMARY, summary ),
            appendNodes( box, size(data), () => elem(T.P) )
        );
    },

};


//
// 简单的子单元创建。
//-----------------------------------------------
[
    [ T.CODELI,     T.CODE ],
    [ T.ALI,        T.A ],
    [ T.AH4,        T.A ],
    [ T.CODEBLOCK,  T.CODE ],
]
.forEach(function( its ) {
    /**
     * @param {Element} box 容器元素
     * @node: {Element}
     */
    Children[ its[0] ] = box => result(
        null,
        $.append( box, elem(its[1]) )
    );
});


//
// 级联表标题项创建。
//-----------------------------------------------
[
    [ T.ULXH4LI,     T.UL ],
    [ T.OLXH4LI,     T.OL ],
    [ T.CASCADEH4LI, T.OL ],
]
.forEach(function( its ) {
    /**
     * 标题项为必需。
     * 仅创建一个空列表容器。
     * @param {Element} li 列表项容器
     * @param {String|Node|[Node]} h4 列表标题项
     * @node: {Element}
     */
    Children[ its[0] ] = function( li, {h4} ) {
        return result(
            insertHeading( li, T.H4, h4 ),
            $.append( li, elem(its[1]) )
        );
    };
});


//
// 小行块创建。
// 结构：[ <h3>, <p>... ]
// 标题在最前，智能补足（不存在则创建，否则忽略）。
// 主体内容支持多个段落。
//-----------------------------------------------
[
    T.ABSTRACT,
    T.HEADER,
    T.FOOTER,
    T.BLOCKQUOTE,
    T.ASIDE,
]
.forEach(function( it ) {
    /**
     * 标题项为可选。
     * data仅取数据条目数。
     * @param {Element} box 容器元素
     * @param {String|Node|[Node]} h3 标题内容，可选
     * @param {Value|[Value]} data 条目数据
     * @node: {Element|[Element]}
     */
    Children[ it ] = function( box, {h3}, data ) {
        return result(
            h3 && insertHeading( box, T.H3, h3 ),
            appendNodes( box, size(data), () => elem(T.P) )
        );
    };
});


//
// 根列表（顶级）。
// 只是简单的构建<li>条目。
//-----------------------------------------------
[
    T.SEEALSO,
    T.REFERENCE,
    T.UL,
    T.OL,
    T.ULX,
    T.OLX,
    T.CASCADE,
]
.forEach(function( it ) {
    /**
     * data仅取数据集大小。
     * @param {Element} box 容器元素
     * @param {Value|[Value]} data 数据（集）
     * @node: {Element|[Element]}
     */
    Children[ it ] = function( box, _, data ) {
        return result(
            null,
            appendNodes( box, size(data), () => elem(T.LI) )
        )
    };
});


//
// 5级片区。
// 此为通用容器，内容自由，因此无返回值。
// 选项集：
// - h2     标题，必需，唯一
// - header 导言，可选，唯一
// - footer 结语，可选，唯一
//-----------------------------------------------
[
    T.S1,
    T.S2,
    T.S3,
    T.S4,
    T.S5,
]
.forEach(function( it ) {
    /**
     * 标题为必需。
     * @param {Element} sec 片区元素
     * @param {String|Node|[Node]} h2 标题内容
     * @param {Boolean} header 创建导言，可选
     * @param {Boolean} footer 创建结语，可选
     * @node: {Element|[Element]}
     */
    Children[ it ] = function( sec, {h2, header, footer}) {
        let _h2 = insertHeading( sec, T.H2, h2 ),
            _buf = [];

        if ( header ) {
            _buf.push( insertHeader(sec, sec.firstElementChild) );
        }
        if ( footer ) {
            _buf.push( appendFooter(sec) );
        }
        return result( _h2, _buf.filter( v => v ) );
    };
});



//
// 元素构建集。
// 对已经创建的元素（可能为空）设置特性或插入内容。
// 插入方法为 append，如果需要 fill，应当由外部保证清空。
// 无需构建的中间结构简单返回自身即可。
// 接口：function( Element, Object, Value|[Value] ): Element | null
// 注记：
// 返回假值表示终结且未实际构建，
// 这是对调用者的反馈，通常是用于滤除作为新目标的选取。
//////////////////////////////////////////////////////////////////////////////
//
const Builder = {

    //-- 内联单元 ------------------------------------------------------------

    /**
     * SVG 根元素。
     * 通用特性设置，由用户控制配置集。
     * 注记：应该只用于单独新建。
     * @param  {Element} svg 目标元素
     * @param  {Object} opts 特性配置集
     * @param  {String} xml SVG源码
     * @return {Element} svg
     */
    [ T.SVG ]: function( svg, opts, xml ) {
        svgInsert(
            $.attribute(svg, opts), xml
        );
        return svg;
    },


    /**
     * SVG 子单元。
     * 通用特性设置，由用户控制配置集。
     * 注记：应该只用于单独新建。
     * @param  {Element} el 目标元素
     * @param  {Object} opts 特性配置集
     * @param  {String} xml SVG源码
     * @return {Element} el
     */
    [ T.SVGITEM ]: function( el, opts, xml ) {
        svgInsert(
            $.attribute(el, opts), xml
        );
        return el;
    },


    /**
     * 时间单元。
     * 文本为空时即默认为datetime的标准格式文本。
     * date/time通常至少需要一个有值。
     * @param  {Element} el 时间空元素
     * @param  {String} date 日期表达串，可选
     * @param  {String} time 时间表达串，可选
     * @param  {String} text 时间表达文本，可选
     * @return {Element} el
     */
    [ T.TIME ]: function( el, {date, time}, text ) {
        date = date || '';

        if ( time ) {
            date = date ? `${date} ${time}` : `${time}`;
        }
        return $.attribute(
            el,
            { text: text || date, datetime: date || null }
        );
    },


    /**
     * 空白段。
     * 如果未作设置，返回null。
     * @param  {Element} el 目标元素
     * @param  {String} width 宽度
     * @return {Element|null} el
     */
    [ T.SPACE ]: function( el, {width} ) {
        return width != null ?
            $.css(el, 'width', width) : null;
    },


    /**
     * 代码单元。
     * 如果tab有值，源代码应当已经替换处理。
     * 如果lang有值，源代码应当已经解析为高亮代码。
     * @attr: [data-lang, data-tab]
     * @param  {Element} code 代码元素
     * @param  {String} lang 代码语言，可选
     * @param  {Number} tabs Tab置换空格数，可选
     * @param  {String|Node|[Node]} data 源码或数据集
     * @return {Element} code
     */
    [ T.CODE ]: function( code, {lang, tab}, data ) {
        if ( typeof data === 'string' ) {
            data = $.fragment( data, false );
        }
        $.append( code, data );

        return $.attribute( code, '-lang -tab', [lang, tab] );
    },


    /**
     * 间隔元素。
     * @param  {Element} hr 间隔元素
     * @param  {String} thick 厚度
     * @param  {String} length 长度
     * @param  {String} space 中间空白高
     * @return {Element} hr
     */
    [ T.HR ]: function( hr, {thick, length, space} ) {
        return $.cssSets(
            hr,
            'borderWidth width height',
            [ thick, length, space ]
        );
    },


    /**
     * 表格元素构建。
     * 注记：无需在此缓存 Table 实例。
     * @param  {Element} tbl 表格元素
     * @param  {Number} cols 列数
     * @param  {Number} rows 行数
     * @param  {Boolean} th0 是否添加列头
     * @return {Element} tbl
     */
    [ T.TABLE ]: function( tbl, {cols, rows, th0} ) {
        let _tbo = new $.Table( tbl );
        _tbo.build( cols, rows );

        if ( th0 ) {
            _tbo.insertColumn( _tbo.newColumn(true), 0 );
        }
        return tbl;
    },


    //-- 特别用途元素 --------------------------------------------------------
    // 代码内标注，由特定的函数解析构建。

    // [ T.B ]: null,
    // [ T.I ]: null,

};


//
// 单纯特性设置。
//-----------------------------------------------
[
    // 规范特性。
    [ T.AUDIO,      ['src', 'autoplay', 'loop', 'controls'] ],
    [ T.VIDEO,      ['src', 'autoplay', 'loop', 'controls'] ],
    [ T.IMG,        ['src', 'alt', 'width', 'height'] ],
    [ T.TRACK,      ['kind', 'src', 'srclang', 'label', 'default'] ],
    [ T.SOURCE,     ['src', 'type'] ],
    [ T.METER,      ['value', 'max', 'min', 'high', 'low', 'optimum'] ],
    [ T.CODELIST,   ['-lang', '-tab', 'start'] ],
    [ T.CODELI,     ['value'] ],
    [ T.BLOCKQUOTE, ['cite'] ],
    [ T.DETAILS,    ['open'] ],
]
.forEach(function( its ) {
    /**
     * @param {Element} el 目标根元素
     * @param {Object} opts 特性配置集
     * @return {Element} el
     */
    Builder[ its[0] ] = (el, opts) =>
        $.attribute( el, attrPicks(opts, its[1]) );

});


//
// 特性+内容设置。
//-----------------------------------------------
[
    // 规范特性+文本。
    [ T.A,          ['href', 'target'] ],
    [ T.Q,          ['cite'] ],
    [ T.ABBR,       ['title'] ],
    [ T.DEL,        ['datetime', 'cite'] ],
    [ T.INS,        ['datetime', 'cite'] ],
    [ T.DFN,        ['title'] ],
    [ T.BDO,        ['dir'] ],
]
.forEach(function( its ) {
    /**
     * @param  {Element} el 内容根元素
     * @param  {Object} opts 特性配置集
     * @param  {Node|[Node]|String} cons 内容
     * @return {Element} el
     */
    Builder[ its[0] ] = (el, opts, cons) => {
        $.append(
            $.attribute( el, attrPicks(opts, its[1]) ),
            cons
        );
        return el;
    };
});


//
// 单纯内容设置。
//-----------------------------------------------
[
    // 内联单元。
    T.STRONG,
    T.EM,
    T.CITE,
    T.SMALL,
    T.SUB,
    T.SUP,
    T.MARK,
    T.ORZ,
    T.SAMP,
    T.KBD,
    T.S,
    T.U,
    T.VAR,

    // 内容行单元。
    T.P,
    T.NOTE,
    T.TIPS,
    T.PRE,
    T.ADDRESS,

    // 内容元素
    T.H1,
    T.H2,
    T.H3,
    T.H4,
    T.H5,
    T.H6,
    T.SUMMARY,
    T.FIGCAPTION,
    T.CAPTION,
    T.LI,
    T.DT,
    T.DD,
    T.TH,
    T.TD,
]
.forEach(function( its ) {
    /**
     * 数据为空时内容不会被改变，此时返回空串。
     * 注记：
     * 如果需要 fill 方式，应当由用户作特定操作。
     * @param  {Element} el 内容根元素
     * @param  {String|Node|[Node]} cons 内容
     * @return {Element|null} el
     */
    Builder[ its ] = (el, _, cons) => $.append(el, cons) && el;
});


//
// 无需特别构建的结构元素。
// 简单返回实参即可。
//-----------------------------------------------
[
    T.THEAD,
    T.TBODY,
    T.TFOOT,
    T.TR,
    T.CODELI,
    T.ALI,
    T.AH4,
    T.ULXH4LI,
    T.OLXH4LI,
    T.CASCADEH4LI,
    T.CASCADEAH4LI,
    T.FIGIMGP,
    T.HGROUP,
    T.ABSTRACT,
    T.TOC,
    T.SEEALSO,
    T.REFERENCE,
    T.HEADER,
    T.FOOTER,
    T.ARTICLE,
    T.S1,
    T.S2,
    T.S3,
    T.S4,
    T.S5,
    T.UL,
    T.OL,
    T.ULX,
    T.OLX,
    T.CASCADE,
    T.DL,
    T.TABLE,
    T.FIGURE,
    T.ASIDE,
    T.CODEBLOCK,
    T.BLANK,
]
.forEach( it => Builder[ it ] = el => el );



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 简单创建元素。
 * @param {String} tag 标签名
 * @param {String} role 角色名
 */
function _element( tag, role ) {
    let _el = $.elem( tag );
    return role && _el.setAttribute( 'role', role ) || _el;
}


/**
 * 提取成员构建新对象。
 * 仅有定义的成员才进入新对象中。
 * @param {Object} obj 源对象
 * @param {[String]} names 键名序列
 */
function attrPicks( obj, names ) {
    let _o = {};

    names.forEach(
        k => obj[k] !== undefined && ( _o[k] = obj[k] )
    );
    return _o;
}


/**
 * 插入唯一标题。
 * 标题在内部最前端，如果不存在则新建并插入。
 * 如果已有标题且内容非假，则填充更新。
 * 如果新建标题且内容有值，则构建更新。
 * 如果已有标题且未更新，返回假值data。
 * @param  {Element} box 容器元素
 * @param  {Number} tval 标题类型值
 * @param  {String|Node|[Node]} data 插入内容，可选
 * @return {Element|data} 新插入或更新的标题元素
 */
function insertHeading( box, tval, data ) {
    let _hx = box.firstElementChild;

    if ( _hx && getType(_hx) === tval ) {
        return data && $.fill(_hx, data) && _hx;
    }
    return $.prepend( box, elem(tval, data) );
}


/**
 * 创建目录列表项集。
 * @param  {[Element]} secs 片区集
 * @return {[Element]} [<li>] 目录条目集
 */
function tocList( secs ) {
    return secs.map( sec => tocItem(sec) );
}


/**
 * 创建目录列表条目。
 * 容忍片区标题不在最前端（非首个子元素）。
 * 结构：article/section:s1, .../h2, section:s2, ...
 * @param {Element} sec 片区元素
 */
function tocItem( sec ) {
    let _h2 = $.get( '>h2', sec ),
        _ss = $.children( sec, 'section' );

    if ( !_ss.length ) {
        return tocLi( _h2 );
    }
    let _li = tocH4li( _h2 );

    $.append(
        _li.lastElementChild, tocList( _ss )
    );
    return _li;
}


/**
 * 创建目录子片区标题项。
 * 结构：li/[h4/a], ol（含一个空<ol>）。
 * @param  {Element} h2 片区标题
 * @param  {[Element]} ses 跟随子片区集
 * @return {Element} 列表标题项
 */
function tocH4li( h2 ) {
    let _a = build(
        elem( T.AH4 ),
        { href: h2.id ? `#${h2.id}` : null },
        h2.innerText
    );
    return build( elem(T.CASCADEAH4LI), { h4: _a } );
}


/**
 * 创建目录列表项。
 * @param  {Element} h2 标题元素
 * @return {Element} 列表项（<li>）
 */
function tocLi( h2 ) {
    return build(
        elem( T.ALI ),
        { href: h2.id ? `#${h2.id}` : null },
        h2.innerText
    );
}


/**
 * 插入导言（如果没有）。
 * 容忍既有导言不在前端。
 * 新插入导言在标题之后或容器内最前端
 * 如果未新建，则无返回值。
 * @param  {Element} box 导言父元素
 * @param  {Element} hx 章节标题，可选
 * @return {Element|void} 新建的导言
 */
function insertHeader( box, hx ) {
    let _el = $.get( '>header', box );
    if ( _el ) return;

    if ( hx ) {
        return $.after( hx, elem(T.HEADER) );
    }
    return $.prepend( box, elem(T.HEADER) );
}


/**
 * 插入结语（如果没有）。
 * 将新结语添加在容器末端，但容忍既有结语不在末端。
 * 如果未新建，则无返回值。
 * @param  {Element} box 结语父元素
 * @return {Element|void} 新建的结语
 */
function appendFooter( box ) {
    let _el = $.get( '>footer', box );

    if ( !_el ) {
        return $.append( box, elem(T.FOOTER) );
    }
}


/**
 * 返回数据集大小。
 * @param  {Value|[Value]|Set} data 数据（集）
 * @return {Number}
 */
function size( data ) {
    if ( data == null ) {
        return 0;
    }
    if ( data.nodeType ) {
        return 1;
    }
    if ( $.isArray(data) ) {
        return data.length;
    }
    return data.size === undefined ? 1 : data.size;
}


/**
 * 插入表格行。
 * 注意：返回值区分数组与单个值。
 * @param  {TableSection} tsec 表格片区
 * @param  {Number} rows 新建行数
 * @param  {Boolean} head 是否表头
 * @return {Element|[Element]} 新行（集）
 */
function appendRows( tsec, rows, head ) {
    if ( rows === 0 ) return;

    let _tbo = tableObj( tsec.parentElement );
    return appendNodes( tsec, rows, () => _tbo.newTR(head) );
}


/**
 * 插入指定数量的子元素。
 * 主要用于平级自由（无标题项）元素的构建，如<tr>, <li>。
 * 注记：
 * 有标题项时，标题无法与后续内容元素一起递进构建。
 *
 * @param  {Element} box 容器元素
 * @param  {Nunber} num 创建数量
 * @param  {Function} maker 创建器
 * @return {[Element]} 新元素集
 */
function appendNodes( box, num, maker ) {
    if ( num === 0 ) return;

    let _els = new Array(num)
            .fill()
            .map( (_, i) => maker(i) );

    return $.append( box, _els );
}


/**
 * 检索并设置SVG子元素类型值。
 * @param  {Element|DocumentFragment} box SVG容器
 * @return {...} box
 */
function svgItem( box ) {
    $.find( '*', box )
        .forEach(
            el => setType( el, T.SVGITEM )
        );
    return box;
}


/**
 * 插入SVG子内容。
 * 可能需要检索子单元设置类型值。
 * @param  {Element} box SVG容器元素
 * @param  {Node|[Node]|String} data 数据（集），可选
 * @return {Element|[Element]} 新插入的节点集
 */
function svgInsert( box, data ) {
    if ( typeof data === 'string' ) {
        data = svgItem( $.fragment(data, true) );
    }
    return $.append( box, data );
}


/**
 * 构造返回结果。
 * - head 表达标题头是否新建或修改，用于决定是否再选取。
 *        也包含除主体内容之外无需递进构建的部分。
 * - body 携带可能需要递进构建的内容单元序列。
 * - end  表示已经构建完成，body部分无需再递进处理。
 *
 * @param  {Element|[Element]} head 标题头或内容额外部分
 * @param  {Element|[Element]} main 内容主体
 * @param  {Boolean} end 是否结束（构建），可选
 * @return {Object3}
 */
function result( head, body, end = false ) {
    if ( $.isArray(body) && body.length === 1 ) {
        body = body[0];
    }
    return { head: head || null, body, end };
}


/**
 * 构造结果集（数组）。
 * 主要用于整理最终结果供自动选取。
 * @param  {Element} head 标题头
 * @param  {Element|[Element]} body 主体内容
 * @return {[Element]} 结果集
 */
function resultEnd( head, body ) {
    if ( !head ) {
        return $.isArray(body) ? body : [body];
    }
    return ( $.isArray(head) ? head : [head] ).concat( body );
}


/**
 * 返回创建目标名称单元的函数。
 * @param  {Object} _ 代理目标占位（target）
 * @param  {String} name 单元名称
 * @return {Function} 创建函数
 */
function createHandler( _, name ) {
    let _tv = T[ name.toUpperCase() ];

    if ( _tv == null ) {
        throw new Error( 'invalid target name.' );
    }
    return (opts, data) => build( elem(_tv), opts, data );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 目录构建。
 * 结构：nav:toc/h3, cascade/...
 * 注记：目录仅能构建或更新，不能编辑。
 * @param  {Element} root 文章根元素
 * @return {Element} 目录元素（nav:toc/...）
 */
export function createToc( root ) {
    let _toc = build( elem(T.TOC), {} );

    $.append(
        _toc.firstElementChild,
        Local.tocLabel || 'Contents'
    );
    $.append(
        _toc.lastElementChild,
        tocList( $.children(root, 'section') )
    )
    return _toc;
}


/**
 * 获取目录条目表达的章节序列。
 * @param  {Element} li 目录条目元素
 * @return {[Number]} 章节序列
 */
export function pathsFromToc( li ) {
    return $.paths( li, 'nav[role=toc]', 'li' );
}


/**
 * 获取片区章节序列。
 * @param  {Element} h2 片区标题或片区元素
 * @return {[Number]} 章节序列
 */
export function sectionPaths( h2 ) {
    return $.paths( h2, 'article', __slrSect );
}


/**
 * 构建片区标题的目录条目选择路径。
 * 用途：
 * - 在标题元素微编辑时实时更新相应目录条目。
 * - 在新片区插入后在目录相应位置添加条目。
 * 注意：
 * 检索时需要提供直接父容器元素作为上下文（<nav:toc>）。
 * @param  {[Number]} chsn 章节序列
 * @return {String} 目录条目（<li>）的选择器
 */
export function tocLiSelector( chsn ) {
    return chsn.map( n => `>ol>li:nth-child(${n})` ).join( ' ' );
}


/**
 * 构建片区标题选择路径。
 * 可用于数字章节序号定位到目标片区。
 * 也可用于单击目录条目时定位显示目标片区（而不用ID）。
 * 注意：
 * 检索时需要提供直接父容器元素作为上下文（<article>）。
 *
 * @param  {[Number]|String} chsn 章节序列（兼容字符串表示）
 * @param  {String} sep 章节序列分隔符（仅在ns为字符串时有用）
 * @return {String} 片区标题（<h2>）的选择器
 */
export function h2PathSelector( chsn, sep = '.' ) {
    if ( typeof chsn === 'string' ) {
        chsn = chsn.split( sep );
    }
    return chsn.map( n => `>${__slrSect}:nth-of-type(${+n})` ).join( ' ' ) + ' >h2';
}


/**
 * 元素简单创建。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 返回null表示无法创建元素。
 * 注意data必须是目标类型的合法子元素内容。
 * @param  {Number} tval 类型值
 * @param  {Node|[Node]|String} data 元素内容，可选
 * @return {Element|null}
 */
export function elem( tval, data ) {
    let _el = ( CustomMaker[tval] || _element )(
        ...Tags[tval].split( '\\' )
    );
    if ( data ) {
        $.append( _el, data );
    }
    return _el && setType( _el, tval );
}


/**
 * 空元素序列创建。
 * @param  {...Number} types 类型值序列
 * @return {[Element]}
 */
export function elements( ...types ) {
    return types.map( tv => elem(tv) );
}


/**
 * 单元构建，包含节点树。
 * 适用初始新建或节点树迭代构建。
 * opts: {
 *      date:   {String}    日期
 *      time:   {String}    时间
 *      lang:   {String}    代码语言
 *      tab:    {Number}    Tab键空格数
 *      ....    正常的元素特性
 *
 *      thick:  {String}    分割线厚度（CSS: border-width）
 *      length: {String}    分割线长度（CSS: width）
 *      space:  {String}    分割线空白（CSS: height）
 *
 *      cols:   {Number}    表格列数
 *      rows:   {Number}    表格行数
 *      th0:    {Boolean}   添加列表头
 * }
 * @param  {Element} el 待构建的目标元素
 * @param  {Object} opts 特性配置集
 * @param  {Node|[Node]|String} data 源数据
 * @return {Element|null} el或null
 */
export function build( el, opts, data ) {
    let _tv = getType( el );

    if ( !Builder[_tv](el, opts, data) ) {
        return null;
    }
    // 返回el，以确保children返回值正确
    return Children[_tv] && children(el, opts, data), el;
}


/**
 * 创建子条目。
 * 由父容器限定，用户无法指定目标类型。
 * 内容元素不应当作为父容器在此使用（无定义导致抛出异常）。
 * 适用：
 * 1. 由create新建开始的子结构迭代完成。
 * 2. 移动插入中间结构位置时的直接使用。
 * opts: {
 *      caption:    {Value}   表标题
 *      head:       {Boolean} 添加表头元素
 *      foot:       {Boolean} 添加表脚元素
 *      figcaption: {Value}   插图标题
 *      summary     {Value}   详细简介
 *      h3:         {Value}   行块小标题
 *      h4:         {Value}   级联表标题
 *      explain:    {Value}   图片讲解
 *      h2:         {Value}   片区（section）标题
 *      header:     {Boolean} 创建导言部分
 *      footer:     {Boolean} 创建结语部分
 *      dt:         {Value}   定义列表标题项
 * }
 * @param  {Element} box 父容器元素
 * @param  {Object} opts 子元素特性配置集
 * @param  {Node|[Node]|[String]} data 数据源
 * @return {[Element]} 构建的子元素集
 */
export function children( box, opts, data ) {
    let _tv = getType( box ),
        _vs = Children[_tv]( box, opts, data );

    if ( _vs.end ) {
        return resultEnd( _vs.head, _vs.body )
    }
    if ( $.isArray(_vs.body) ) {
        // 滤除掉未构建者。
        return resultEnd(
            _vs.head,
            $.map( _vs.body, (el, i) => build(el, opts, data[i]) )
        );
    }
    return resultEnd( _vs.head, build(_vs.body, opts, data) );
}


//
// By扩展：
// New.[cell-name](...)
//
processProxy( 'New', createHandler );
