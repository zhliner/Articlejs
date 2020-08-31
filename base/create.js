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

import { processExtend } from "./tpb/pbs.by.js";
import * as T from "./types.js";
import { getType, setType, tableObj } from "./base.js";
import { mapCall } from "./common.js";


const
    $ = window.$,

    // ID标识字符限定
    __reIDs = /(?:\\.|[\w-]|[^\0-\xa0])+/g;


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
    [ T.AH4LI ]:        'li',
    [ T.AH4 ]:          'h4',
    [ T.ULXH4LI ]:      'li',
    [ T.OLXH4LI ]:      'li',
    [ T.CASCADEH4LI ]:  'li',
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
// 覆盖默认的 create() 创建方法。
// 返回 null 表示无法独立创建（如<tr>）。
// 接口：function( tag, role ): Element | false
//////////////////////////////////////////////////////////////////////////////
const CustomMaker = {
    //
    // 音频：嵌入不支持提示。
    //
    [ T.AUDIO ]: function( tag ) {
        return $.element( tag, __msgAudio );
    },


    //
    // 视频：嵌入不支持提示。
    //
    [ T.VIDEO ]: function( tag ) {
        return $.element( tag, __msgVideo );
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
     * @param {Node|[Node]|String} data
     * @node: {[Node]|data}
     */
    [ T.SVG ]: function( svg, _, data ) {
        return { node: svgInsert(svg, data), end: true }
    },


    /**
     * SVG子单元内容插入。
     * 内容支持源码和节点数据。
     * 无特性配置。
     * @param {Node|[Node]|String} data
     * @node: {[Node]|data}
     */
    [ T.SVGITEM ]: function( box, _, data ) {
        return { node: svgInsert(box, data), end: true }
    },


    /**
     * 空元素由下阶处理（下同）。
     * @node: {[Element]}
     */
    [ T.RUBY ]: function() {
        return { node: elements(T.RB, T.RP, T.RT, T.RP) };
    },

    [ T.RBPT ]: function() {
        return { node: elements(T.RB, T.RP, T.RT, T.RP) };
    },


    //
    // 块内结构子
    /////////////////////////////////////////////


    /**
     * 单元格已经存在。
     * @node: {[Element]} <th>,<td>
     */
    [ T.TR ]: function( tr ) {
        return { node: [...tr.children] };
    },


    /**
     * 数据集仅需大小信息。
     * 无元素特性配置。
     * 下同。
     * @param {[Value]} data 数据集
     * @node: {Element|[Element]} 行元素/集
     */
    [ T.TBODY ]: function( body, _, data ) {
        return { node: appendRows(body, size(data)) };
    },

    [ T.THEAD ]: function( head, _, data ) {
        return { node: appendRows(head, size(data), true) };
    },

    [ T.TFOOT ]: function( foot, _, data ) {
        return { node: appendRows(foot, size(data)) };
    },


    /**
     * 仅返回图片元素供递进构建。
     * 注记：讲解可选，故由属性配置。
     * @param {String|Node|[Node]} explain 图片讲解，可选
     * @node: {Element}
     */
    [ T.FIGIMGP ]: function( box, {explain} ) {
        if ( explain ) {
            $.append( box, element(T.EXPLAIN, explain) );
        }
        return { node: $.prepend(box, element(T.IMG)) };
    },


    //
    // 行块结构元素
    /////////////////////////////////////////////


    /**
     * @node: {[Element]}
     */
    [ T.HGROUP ]: function() {
        return { node: elements(T.H1, T.H2) };
    },


    // 单独创建，内容不可编辑。
    // [ T.TOC ]:  null,


    /**
     * 两个子单元位置确定。
     * 仅为容器创建，需向后续传递进构建。
     * @param {Boolean} header 有无导言
     * @param {Boolean} footer 有无结语
     * @node: {Element|[Element]|[]}
     */
    [ T.ARTICLE ]: function( box, {header, footer} ) {
        let _buf = [];

        if ( header  ) {
            _buf.push( insertHeader(box) );
        }
        if ( footer ) {
            _buf.push( appendFooter(box) );
        }
        _buf = _buf.filter( v => v != null );

        return { node: itemArray(_buf), end: !_buf.length };
    },


    /**
     * 允许创建一个标题项。
     * 如果未传递标题内容，表示只创建数据条目（<dd>）。
     * 按数据量一次性创建完毕，无递进构建。
     * @param {String|Node|[Node]} dt 标题内容，可选
     * @param {Value|[Value]} dd 数据条目（集）
     * @node: {Element|[Element]}
     */
    [ T.DL ]: function( box, {dt}, data ) {
        let _buf = [];

        if ( dt ) {
            _buf.push( element(T.DT, dt) );
        }
        if ( data ) {
            _buf.push(
                ...dataElement( data, dd => element(T.DD, dd) )
            );
        }
        return { node: $.append(box, _buf), end: true };
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
        let _tbo = tableObj( tbl );

        if ( caption ) {
            _tbo.caption( caption );
        }
        if ( head ) {
            _tbo.head( true );
        }
        if ( foot ) {
            _tbo.foot( true );
        }
        return { node: _tbo.body(true) };
    },


    /**
     * 插图标题可选。
     * 注：仅测试标题有效性，由下一阶构建。
     * @node: {Element|[Element]}
     */
    [ T.FIGURE ]: function( box, {figcaption} ) {
        let _buf = [];

        if ( figcaption ) {
            _buf.push( insertHeading(box, T.FIGCAPTION) );
        }
        _buf.push( $.append(box, element(T.FIGIMGP)) );

        return { node: itemArray(_buf) };
    },


    // 内容简介必需。
    // data如果没有值，会创建一个空段落，
    // 除非data传递一个空数组。
    // - 内容构建，终止递进。
    // - 支持在现有<details>上添加内容。
    // @node {Element|[Element]}
    [ T.DETAILS ]: function( box, {summary}, data ) {
        let _sel = insertHeading( box, T.SUMMARY, summary ),
            _buf = [];

        if ( _sel ) {
            _buf.push( _sel );
        }
        _buf.push(
            ...$.append( box, dataElement(data, dd => element(T.P, dd)) )
        );
        return { node: _buf, end: true };
    },


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
// 简单的子单元创建。
//-----------------------------------------------
[
    [ T.CODELI,     T.CODE ],
    [ T.ALI,        T.A ],
    [ T.AH4LI,      T.AH4 ],
    [ T.AH4,        T.A ],
]
.forEach(function( its ) {
    // @return {Element}
    Children[ its[0] ] = () => element( its[1] );
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
    // @param  {Element} li 列表项容器
    // @param  {String|Node|[Node]} h4 列表标题项
    // @return {Element}
    Children[ its[0] ] = function( li, {h4} ) {
        insertHeading(
            li, T.H4, h4
        );
        return element( its[1] );
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
    // @param  {Element} box 容器元素
    // @param  {String|Node|[Node]} h3 标题内容，可选
    // @param  {Value|[Value]} data 条目数据
    // @return {Element}
    Children[ it ] = function( box, {h3} ) {
        insertHeading(
            box, T.H3, h3
        );
        return element( T.P );
    };
});


//
// 顶层列表。
// 只是简单的构建<li>条目。
//-----------------------------------------------
[
    T.SEEALSO,
    T.REFERENCE,
    T.UL,
    T.OL,
    T.CODELIST,
    T.ULX,
    T.OLX,
    T.CASCADE,
]
.forEach(function( it ) {
    Children[ it ] = () => element( T.LI );
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

    // @node {Element|[Element]|void}
    Children[ it ] = function( box, {h2, header, footer}) {
        let _hel = insertHeading( box, T.H2, h2 ),
            _buf = [];

        if ( header ) {
            _buf.push( insertHeader(box, box.firstElementChild) );
        }
        if ( footer ) {
            _buf.push( appendFooter(box) );
        }
        if ( !_buf.length ) {
            return { node: _hel, end: true };
        }
        return { node: _hel ? [_hel].concat(_buf) : _buf };
    };
});


//
// 元素构建集。
// 对已经创建的元素（空）设置特性或插入内容。
// 无需构建的中间结构简单返回自身即可。
// 接口：function( Element, Object, Value|[Value] ): Element | null
// 注记：
// 返回 null 或 undefined 表示终结且未实际构建，
// 这是对调用者的反馈，通常是用于滤除作为新目标的选取。
//////////////////////////////////////////////////////////////////////////////
//
const Builder = {

    //-- 内联单元 ------------------------------------------------------------

    /**
     * 仅提供了两个基本特性。
     * 注记：应该只用于单独新建。
     * @param  {Element} svg 目标元素
     * @param  {Number} width 宽度
     * @param  {Number} height 高度
     * @param  {String} xml SVG源码
     * @return {void}
     */
    [ T.SVG ]: function( svg, {width, height}, xml ) {
        svgInsert(
            $.attribute( svg, 'width height', [width, height] ),
            xml,
            'fill'
        );
    },


    /**
     * SVG子单元。
     * 通用特性设置，由用户控制配置集。
     * 注记：应该只用于单独新建。
     * @param  {Element} el 目标元素
     * @param  {Object} opts 特性配置集
     * @param  {String} xml SVG源码
     * @return {void}
     */
    [ T.SVGITEM ]: function( el, opts, xml ) {
        svgInsert( $.attribute(el, opts), xml, 'fill' );
    },


    /**
     * 时间单元。
     * 文本为空时即默认为datetime的标准格式文本。
     * date/time通常至少需要一个有值。
     * @param  {Element} el 时间空元素
     * @param  {String} date 日期表达串，可选
     * @param  {String} time 时间表达串，可选
     * @param  {String} text 时间表达文本，可选
     * @return {void}
     */
    [ T.TIME ]: function( el, {date, time}, text ) {
        date = date || '';

        if ( time ) {
            date = date ? `${date} ${time}` : `${time}`;
        }
        $.attribute( el, { text: text || date, datetime: date || null } );
    },


    /**
     * 空白段。
     * @param  {String} width 宽度
     * @return {void}
     */
    [ T.SPACE ]: function( el, {width} ) {
        if ( width != null ) {
            $.css( el, 'width', width );
        }
    },


    /**
     * 代码单元。
     * 如果tab有值，源代码应当已经替换处理。
     * 如果lang有值，源代码应当已经解析为高亮代码。
     * @attr: [data-lang, data-tab]
     * @param  {String} lang 代码语言，可选
     * @param  {Number} tabs Tab置换空格数，可选
     * @return {void}
     */
    [ T.CODE ]: function( el, {html, lang, tab} ) {
        if ( lang ) {
            $.attr( el, '-lang', lang );
        }
        if ( tab ) {
            $.attr( el, '-tab', tab );
        }
        $.append( el, $.fragment(html, false) );
    },


    //-- 块内结构元素 --------------------------------------------------------

    /**
     * 创建/更新表头元素。
     * 需要实际的表格行数据，可作为重复添加接口。
     * @param  {Table} tbl 表格实例（$.Table）
     * @param  {[Node|[Node]|String]} cons 内容集
     * @param  {Number} idx 插入位置下标
     * @return {Collector} 新行元素集
     */
    thead( tbl, cons, idx ) {
        let _rows = Math.ceil( cons.length / tbl.columns() ),
            _trs = tbl.head( _rows, idx );

        _trs.find('th').flat().fill( cellWraps(cons) );
        return _trs;
    },


    /**
     * 创建表格行。
     * 内容可以是一个二维数组，一维成员对应到各单元格。
     * @param  {Table} tbl 表格实例（$.Table）
     * @param  {[Node|[Node]|String]} cons 内容集
     * @param  {Number} idx 位置下标，可选
     * @param  {TableSection} tsec 表体片区（<tbody>[n]），可选
     * @return {Collector} 新行元素集
     */
    tbody( tbl, cons, idx, tsec ) {
        let _rows = Math.ceil( cons.length / tbl.columns() ),
            _trs = tbl.body( _rows, idx, tsec );

        _trs.find('th,td').flat().fill( cellWraps(cons) );
        return _trs;
    },


    /**
     * 创建/更新表脚元素。
     * 需要实际的表格行数据，可作为重复添加接口。
     * @param  {Table} tbl 表格实例（$.Table）
     * @param  {[Node|[Node]|String]} cons 内容集
     * @param  {Number} idx 插入位置下标
     * @return {Collector} 新行元素集
     */
    tfoot( tbl, cons, idx ) {
        let _rows = Math.ceil( cons.length / tbl.columns() ),
            _trs = tbl.foot( _rows, idx );

        _trs.find('th,td').flat().fill( cellWraps(cons) );
        return _trs;
    },


    //-- 行块结构元素 --------------------------------------------------------


    /**
     * 创建标题/组。
     * 如果未传递副标题，简单返回<h1>元素。
     * @param {Element} h1 主标题
     * @param {Element} h2 副标题，可选
     */
    hgroup( h1, h2 ) {
        if ( h2 == null ) {
            return h1;
        }
        let _hg = create( 'hgroup' );

        $.prepend( _hg, [h1, h2] );
        return _hg;
    },


    /**
     * 创建表格。
     * 会缓存$.Table实例。
     * @param  {Element} caption 表标题
     * @param  {Number} rows 行数
     * @param  {Number} cols 列数
     * @param  {Number} vth 列表头（1|-1），可选
     * @return {Element}
     */
    table( caption, rows, cols, vth ) {
        let _tbo = $.table( rows, cols, vth ),
            _tbl = _tbo.element();

        if ( caption ) {
            $.prepend( _tbl, caption );
        }
        return tableObj( _tbo ), _tbl;
    },


    /**
     * 创建隔断。
     * css:
     * - borderWidth 厚度
     * - width 长度
     * - height 空白
     * @param  {Object} css 样式配置
     * @return {Element}
     */
    hr( css ) {
        let _hr = create( 'hr' );
        return $.cssSets( _hr, css );
    },


    //-- 特别用途元素 --------------------------------------------------------
    // 代码内标注，由特定的函数解析构建。

    // b( text ) {},
    // i( text ) {},

};


//
// 单纯特性设置。
//-------------------------------------
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
]
.forEach(function( its ) {
    // @return {Element}
    Builder[ its[0] ] = (el, opts) => $.attribute( el, attrPicks(opts, its[1]) );
});


//
// 特性+内容设置。
//-------------------------------------
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
    // @return {void}
    Builder[ its[0] ] = (el, opts, cons) => {
        $.append(
            $.attribute( el, attrPicks(opts, its[1]) ),
            cons
        );
    };
});


//
// 内容元素设置。
//-------------------------------------
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
    // @param  {Node|String|[Node|String]} cons
    // @return {false}
    Builder[ its ] = (el, _, cons) => $.append( el, cons ) && false;
});



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 简单创建元素。
 * @param {String} tag 标签名
 * @param {String} role 角色名
 */
function _element( tag, role ) {
    let _el = $.element( tag );
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
 * 是否为游离元素。
 * 外部保证els为平级兄弟关系。
 * @param  {Element|[Element]} els 元素（集）
 * @return {Boolean}
 */
function isDetached( els ) {
    return !($.isArray(els) ? els[0] : els).parentElement;
}


/**
 * 插入唯一标题。
 * 标题在内部最前端，如果不存在则新建并插入。
 * 如果内容有值，则填充更新标题。
 * @param  {Element} box 容器元素
 * @param  {Number} tval 标题类型值
 * @param  {String|Node|[Node]} data 插入内容，可选
 * @return {Element} 原有或新插入的标题元素
 */
function insertHeading( box, tval, data ) {
    let _hx = box.firstElementChild;

    if ( !_hx || getType(_hx) !== tval ) {
        _hx = $.prepend( box, element(tval) );
    }
    return data && $.fill(_hx, data), _hx;
}


/**
 * 多次调用。
 * 返回多次调用的返回值集。
 * @param  {Number} n 次数
 * @param  {Function} handle 回调函数
 * @param  {...Value} ...rest 回调实参
 * @return {[Value]}
 */
function handleCalls( n, handle, ...rest ) {
    let _buf = [];

    for (let i = 0; i < n; i++) {
        _buf.push( handle(...rest) );
    }
    return _buf;
}


/**
 * 单元格数据封装。
 * 将内容集中的字符串成员封装为子数组（优化）。
 * 适用：Collector节点插入类接口（.fill|.append|...）。
 * @param  {[Node|[Node]|String]} cons 内容集
 * @return {[Node|[Node]|[String]]}
 */
function cellWraps( cons ) {
    return cons.map( d => typeof d == 'string' ? [d] : d );
}


/**
 * 构建目录。
 * 用于初始创建，不牵涉复制粘贴的逻辑。
 * 注：label可能是一个指向主标题的链接元素。
 * @param  {Element} article 文章元素
 * @param  {String|Node|[Node]} label 目录标题（h3/...）
 * @return {Element} 目录元素（nav:toc/...）
 */
function createToc( article, label ) {
    return Content.toc(
        Content.h3( label ),
        secList( Content.cascade(), article )
    );
}


/**
 * 创建目录列表（单层）。
 * 注意：仅取片区标题之后的<section>元素处理。
 * @param  {Element} ol 列表容器
 * @param  {Element} box 片区容器（父片区或<article>）
 * @return {Element} ol
 */
function secList( ol, box ) {
    let _h2 = $.get( '>h2', box ),
        _els = $.nextAll( _h2, 'section[role]' ),
        _li = _els.length ? tocH4li( _h2 ) : tocLi( _h2 );

    $.append( ol, _li );

    if ( _els.length ) {
        let _ol = _li.lastElementChild;
        _els.forEach( sec => secList(_ol, sec) );
    }
    return ol;
}


/**
 * 创建目录列表项（单个）。
 * 如果片区内包含子片区（非纯内容），会递进处理。
 * @param  {Element} h2 标题元素
 * @return {Element} 列表项（<li>）
 */
function tocLi( h2 ) {
    return Content.ali(
        Content.a( h2.textContent, {href: h2.id ? `#${h2.id}` : ''} )
    );
}


/**
 * 创建目录子片区标题。
 * 结构：li/[h4/a], ol（含一个空<ol>）。
 * @param {Element} h2 片区标题
 */
function tocH4li( h2 ) {
    return Content.ah4li(
        Content.ah4(
            Content.a( h2.textContent, { href: h2.id ? `#${h2.id}` : '' } )
        ),
        create( 'ol' )
    );
}


/**
 * 构造ID标识。
 * 提取源文本内的合法片段用短横线（-）串接。
 * @param  {String} text 源文本
 * @return {String} 标识串
 */
function createID(text) {
    return text.match(__reIDs).join('-');
}


/**
 * 插入导言（如果必要）。
 * 新插入在标题之后或容器的最前端，但容忍既有导言不在前端。
 * 如果未新建，则无返回值。
 * @param  {Element} box 导言父元素
 * @param  {Element} hx 章节标题，可选
 * @return {Element|void} 新建的导言
 */
function insertHeader( box, buf, hx ) {
    let _el = $.get( '>header', box );
    if ( _el ) return;

    if ( hx ) {
        return $.after( hx, element(T.HEADER) );
    }
    return $.prepend( box, element(T.HEADER) );
}


/**
 * 插入结语（如果必要）。
 * 将新结语添加在容器末端，但容忍既有结语不在末端。
 * 如果未新建，则无返回值。
 * @param  {Element} box 结语父元素
 * @return {Element|void} 新建的结语
 */
function appendFooter( box ) {
    let _el = $.get( '>footer', box );

    if ( !_el ) {
        return $.append( box, element(T.FOOTER) );
    }
}


/**
 * 返回数据集大小。
 * @param  {Value|[Value]|Set} data 数据（集）
 * @return {Number}
 */
function size( data ) {
    if ( data.nodeType ) {
        return 1;
    }
    return $.isArray(data) ? data.length : data.size || 0;
}


/**
 * 取值或值集。
 * 如果值集只有一个成员，提取并返回。
 * 注记：
 * 值和值集的不同会导致数据条目的取值方式不同。
 *
 * @param  {[Value]} buf 值集
 * @return {Value|[Value]}
 */
function itemArray( buf ) {
    return buf.length === 1 ? buf[0] : buf;
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
    let _tbo = tableObj( tsec.parentElement ),
        _els = appendNodes( tsec, rows, () => _tbo.newTR(head) );

    return itemArray( _els );
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
    let _els = new Array(num)
            .fill()
            .map( (_, i) => maker(i) );

    return $.append( box, _els );
}


/**
 * 用数据创建子条目。
 * 始终返回一个值数组。
 * @param  {Value|[Value]} data 内容数据（集）
 * @param  {Function} maker 创建器
 * @return {[Value]}
 */
function dataElement( data, maker ) {
    if ( !$.isArray(data) ) {
        data = [ data ];
    }
    return data.map( dd => maker(dd) );
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
function svgInsert( box, data, meth = 'append' ) {
    if ( typeof data === 'string' ) {
        data = svgItem( $.fragment(data, true) );
    }
    return $[meth]( box, data );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 元素创建。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 返回null表示无法创建元素。
 * 注意data必须是目标类型的合法子元素内容。
 * @param  {Number} tval 类型值
 * @param  {Node|[Node]|String} data 元素内容，可选
 * @return {Element|null}
 */
export function element( tval, data ) {
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
    return types.map( tv => element(tv) );
}


/**
 * 单元创建，包含节点树。
 * 适用初始新建或节点树迭代构建。
 * opts: {
 *      date:   日期
 *      time:   时间
 *      lang:   代码语言
 *      tab:    Tab键空格数
 *      ....    正常的元素特性
 * }
 * @param  {Element} el 待构建的目标元素
 * @param  {Object} opts 特性配置集
 * @param  {Node|[Node]|String} data 源数据
 * @return {Element|null} 构建结果
 */
export function create( el, opts, data ) {
    let _tv = getType( el );

    el = Builder[_tv]( el, opts, data );

    if ( el && Children[_tv] ) {
        children( el, opts, data );
    }
    return el || null;
}


/**
 * 创建子条目。
 * 由父容器限定，用户无法指定目标类型。
 * 如果子节点已经插入，则返回false（外部无需插入）。
 * 适用：
 * 1. 由create新建开始的子结构迭代完成。
 * 2. 移动插入中间结构位置时的直接使用。
 * opts: {
 *      caption:    {Value}   创建表标题
 *      head:       {Boolean} 添加表头元素
 *      foot:       {Boolean} 添加表脚元素
 *      figcaption: {Value}   创建插图标题
 *      h3:         {Value}   创建行块小标题
 *      h4:         {Value}   创建级联表标题
 *      explain:    {Value}   创建图片讲解
 *      h2:         {Value}   创建片区（section）标题
 *      header:     {Boolean} 创建导言部分
 *      footer:     {Boolean} 创建结语部分
 *      dt:         {Value}   定义列表标题项
 * }
 * @param  {Element} box 父容器元素
 * @param  {Object} opts 子元素特性配置集
 * @param  {Node|[Node]|[String]} data 数据源
 * @return {Element|[Element]}
 */
export function children( box, opts, data ) {
    let _tv = getType( box ),
        _vs = Children[_tv]( box, opts, data );

    if ( _vs.end ) {
        return _vs.node;
    }
    if ( $.isArray(_vs.node) ) {
        // 滤除掉未构建者。
        return $.map(_vs.node, (el, i) => create(el, opts, data[i]) );
    }
    return create( _vs.node, opts, data );
}


//
// By扩展：
// New.[cell-name](...)
//
processExtend( 'New', Content );


