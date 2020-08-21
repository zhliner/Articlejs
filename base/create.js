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
import { indentSpace } from "./common.js";


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
    [ T.TIME ]:         'time',
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
// 创建目标应有的的内容节点，可能是一个节点序列（如<tr>: <th>|<td>...）。
// 返回的元素皆没有内容，内容应当由外部插入（$.append）。
// 仅包含部分目标的定义，内容元素无需定制创建子元素。
// 注记：
// 如果返回的是内容元素，则可以接收内联节点插入（移动/克隆时）。
// 返回子元素类型值表示无法直接创建，需后阶create创建。
//////////////////////////////////////////////////////////////////////////////
// function( box:Element ): Element | [Element] | Number
//
const Children = {
    //
    // 内联结构元素
    /////////////////////////////////////////////

    // @return {Number}
    [ T.SVG ]: function() {
        return T.SVGITEM;
    },

    // @return {[Element]}
    [ T.RUBY ]: function() {
        return elements( T.RB, T.RP, T.RT, T.RP );
    },

    // @return {[Element]}
    [ T.RBPT ]: function() {
        return elements( T.RB, T.RP, T.RT, T.RP );
    },

    //
    // 内联结构子
    /////////////////////////////////////////////

    // 注记：
    // 当用户直接向内插入时用到（children()）。
    // @return {Number}
    [ T.SVGITEM ]: function() {
        return T.SVGITEM;
    },

    //
    // 块内结构子
    /////////////////////////////////////////////

    // 注记：单元格已经存在。
    // @return {[Element]} <th>,<td>
    [ T.TR ]: function( tr ) {
        return [ ...tr.children ];
    },

    // @return {Element} <tr>
    [ T.TBODY ]: function( body ) {
        return tableObj( body.parentElement ).newTR();
    },

    // @return {Element} <tr>
    [ T.THEAD ]: function( head ) {
        return tableObj( head.parentElement ).newTR( true );
    },

    // @return {Element} <tr>
    [ T.TFOOT ]: function( foot ) {
        return tableObj( foot.parentElement ).newTR();
    },

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

    [ T.TABLE ]: function( tbl ) {
        let _tbo = tableObj( tbl );
        return _tbo.body() || _tbo.insertBody( _tbo.body(true) );
    },

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
// 定制创建。
// 涉及复杂的配置参数或异类创建，简化模板用法。
// 密封单元也在此创建。
// 接口：function( Element, Object ): Element | DocumentFragment
//////////////////////////////////////////////////////////////////////////////
// 通用创建：
//      element( create(), data, shift );
//      $.attribute( el, opts );
//
const Creater = {

    //-- 内联单元 ------------------------------------------------------------

    /**
     * 注记：直接创建时会用。
     * @param {Element} el 空<svg>元素
     * @param {String} param1 SVG源码
     */
    [ T.SVG ]: function( el, {html} ) {
        $.html( el, html );
        return svgItem( el );
    },


    /**
     * SVG子单元。
     * 注记：应当只在children场景使用。
     * @param  {false} _ 实参占位
     * @param  {String} html SVG源码
     * @return {DocumentFragment}
     */
    [ T.SVGITEM ]: function( _, {html} ) {
        return svgItem( $.fragment(html, true) );
    },


    /**
     * 时间单元。
     * 文本为空时即默认为datetime的标准格式文本。
     * date/time通常至少需要一个有值。
     * @param  {Element} el 时间空元素
     * @param  {String} date 日期表达串，可选
     * @param  {String} time 时间表达串，可选
     * @param  {String} text 时间表达文本，可选
     * @return {Element}
     */
    [ T.TIME ]: function( el, {date, time}, text ) {
        date = date || '';

        if ( time ) {
            date = date ? `${date} ${time}` : `${time}`;
        }
        return $.attribute( el, { text: text || date, datetime: date || null } );
    },


    /**
     * 空白段。
     * @param  {String} width 宽度
     * @return {Element}
     */
    [ T.SPACE ]: function( el, {width} ) {
        if ( width != null ) {
            $.css( el, 'width', width );
        }
        return el;
    },


    /**
     * 代码单元。
     * 如果tab有值，源代码应当已经替换处理。
     * 如果lang有值，源代码应当已经解析为高亮代码。
     * @attr: [data-lang, data-tab]
     * @param  {String} lang 代码语言，可选
     * @param  {Number} tabs Tab置换空格数，可选
     * @return {Element}
     */
    [ T.CODE ]: function( el, {html, lang, tab} ) {
        if ( lang ) {
            $.attr( el, '-lang', lang );
        }
        if ( tab ) {
            $.attr( el, '-tab', tab );
        }
        return $.append( el, $.fragment(html, false) );
    },


    //-- 块内结构元素 --------------------------------------------------------


    /**
     * 创建表格行。
     * 内容可以是一个二维数组，一维成员对应到各单元格。
     * @param  {Table} tbl 表格实例（$.Table）
     * @param  {[Node|[Node]|String]} cons 内容集
     * @param  {TableSection} tsec 表格片区（<thead>|<tbody>|<tfoot>）
     * @param  {Number} idx 位置下标，可选
     * @return {Collector} 新行元素集
     */
    tr( tbl, cons, tsec, idx ) {
        let _rows = Math.ceil( cons.length / tbl.columns() ),
            _trs = null;

        switch (tsec.tagName) {
            case 'THEAD':
                _trs = tbl.head(_rows, idx);
                break;
            case 'TFOOT':
                _trs = tbl.foot(_rows, idx);
                break;
            case 'TBODY':
                _trs = tbl.body(_rows, idx, tsec);
        }
        _trs.find('th,td').flat().fill( cellWraps(cons) );
        return _trs;
    },


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
// 包含取text特性值设置文本内容。
//-------------------------------------
[
    // 规范特性。
    [ T.AUDIO,      ['src', 'autoplay', 'loop', 'controls'] ],
    [ T.VIDEO,      ['src', 'autoplay', 'loop', 'controls'] ],
    [ T.IMG,        ['src', 'alt', 'width', 'height'] ],
    [ T.TRACK,      ['kind', 'src', 'srclang', 'label', 'default'] ],
    [ T.SOURCE,     ['src', 'type'] ],
    [ T.METER,      ['value', 'max', 'min', 'high', 'low', 'optimum'] ],
    [ T.CODELIST,   ['-lang', '-tab'] ],
    [ T.CODELI,     ['start'] ],

    // 规范特性+文本。
    [ T.A,          ['text', 'href', 'target'] ],
    [ T.Q,          ['text', 'cite'] ],
    [ T.ABBR,       ['text', 'title'] ],
    [ T.DEL,        ['text', 'datetime', 'cite'] ],
    [ T.INS,        ['text', 'datetime', 'cite'] ],
    [ T.DFN,        ['text', 'title'] ],
    [ T.BDO,        ['text', 'dir'] ],
]
.forEach(function( its ) {
    // @return {Element}
    Creater[ its[0] ] = (el, opts) => $.attribute( el, attrPicks(opts, its[1]) );
});


//
// 内容元素设置。
// 取数据实参作为内容，可兼容节点和文本。
// 注记：text同时也被设置在特性集上。
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
    // @param  {Node|String|[Node|String]} data
    // @return {Element}
    Creater[ its ] = (el, _, data) => ( $.append(el, data), el );
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
    return ($.isArray(els) ? els[0] : els).isConnected;
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
 * 视情况取数据。
 * @param {[Value]} data 数据集
 * @param {Boolean} shift 前端提取
 */
function dataItem( data, shift ) {
    return shift ? data && data.shift() : data;
}


/**
 * 检索并设置SVG子元素类型值。
 * @param  {Element|DocumentFragment} box SVG容器
 * @return {box}
 */
function svgItem( box ) {
    $.find( '*', box )
        .forEach(
            el => setType( el, T.SVGITEM )
        );
    return box;
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 空元素创建。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 返回null表示无法创建元素。
 * @param  {Number} tval 类型值
 * @return {Element|null|false}
 */
export function element( tval ) {
    let _el = ( CustomMaker[tval] || _element )(
            ...Tags[tval].split( '\\' )
        );
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
 * 元素创建（含内容）。
 * 如果是结构性容器，会获取子元素序列并插入。
 * el支持元素类型值，因为有的元素不能直接创建（如 Children:SVG）。
 * 适用初始新建或节点树迭代完成。
 * opts: {
 *      text:   纯文本（文本节点）
 *      html:   源码（$.html()方式插入）
 *      date:   日期
 *      time:   时间
 *      lang:   代码语言
 *      tab:    Tab键空格数
 *      ....    正常的元素特性
 * }
 * @param  {Element|Number} el 空元素或元素类型值
 * @param  {Object} opts 特性配置集
 * @param  {Node|[Node]|[String]} data 数据源
 * @param  {Boolean} more 需要创建更多
 * @return {Element}
 */
export function create( el, opts, data, more ) {
    let _tv = isNaN(el) ? getType(el) : el,
        _fn = Creater[ _tv ];

    if ( _fn ) {
        el = _fn( el, opts, dataItem(data, more) );
    }
    if ( Children[_tv] ) {
        $.append( el, children(el, opts, data, more) || '' );
    }
    return el;
}


/**
 * 创建子条目。
 * 由父容器限定，用户无法指定目标类型。
 * 如果子节点已经插入，则返回false（外部无需插入）。
 * 适用：
 * 1. 由create新建开始的子结构迭代完成。
 * 2. 移动插入中间结构位置时的直接使用。
 * opts: 同上。
 * @param  {Element} box 父容器元素
 * @param  {Object} opts 子元素特性配置集
 * @param  {Node|[Node]|[String]} data 数据源
 * @param  {Boolean} more 需要创建更多
 * @return {Element|[Element]|false}
 */
export function children( box, opts, data, more ) {
    let tval = getType( box ),
        subs = Children[tval]( box );

    if ( $.isArray(subs) ) {
        subs = subs.map( el => create(el, opts, data, more) );
    } else {
        subs = create( subs, opts, data, more );
    }
    return isDetached(subs) && subs;
}


//
// By扩展：
// New.[cell-name](...)
//
processExtend( 'New', Content );


