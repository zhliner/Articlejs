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
import { setType, tableObj } from "./base.js";


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
// 可能附带角色配置（冒号分隔）。
// { 单元类型值： 标签 | 标签\角色 }
//
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
// 定制创建集。
// 覆盖默认的简单创建方式（element()）。
// 返回null表示需手动创建。
// 接口：function(tag, role): Element|null
//
const customMaker = {
    //
    // 音频：嵌入不支持提示。
    //
    [ T.AUDIO ]: function() {
        let _el = element( T.AUDIO );
        return _el.append( __msgAudio ), _el;
    },


    //
    // 视频：嵌入不支持提示。
    //
    [ T.VIDEO ]: function() {
        let _el = element( T.VIDEO );
        return _el.append( __msgVideo ), _el;
    },


    //
    // 名称空间不同，特别创建。
    //
    [ T.SVG ]: function() {
        return $.svg();
    },


    //
    // SVG子系通用。
    // 不支持无数据创建，交由手动创建。
    //
    [ T.SVGITEM ]: function() {
        return null;
    },


    //
    // 抽象组。交由手动创建。
    //
    [ T.RBPT ]: function() {
        return null;
    },
};


//
// 子内容生成器。
// 创建目标应有的的内容节点，可能是一个节点序列（如<tr>: <th>|<td>...）。
// 返回的元素皆没有内容，内容应当由外部插入（$.append）。
// 仅包含部分目标的定义，内容元素无需定制创建子元素。
// 注记：
// - 不涉及多层中间结构，其应当自动迭代生成。
// - 返回null表示不支持内容创建（需手动创建）。
// - 仅有特性设置的元素也无需在这里定义（由外部 $.attribute() 实现）。
// - 如果返回的是内容元素，则可以接收内联节点插入（移动/克隆时）。
//////////////////////////////////////////////////////////////////////////////
// function( self:Element ): Element | [Element]
//
const Children = {
    //
    // 内联结构元素
    /////////////////////////////////////////////

    // 注记：
    // 子元素自由，故定义限定。
    [ T.SVG ]: function() {
        return null;
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
    // 子元素自由，故定义限定。
    [ T.SVGITEM ]: function() {
        return null;
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
    [ T.TBODY ]: function( tsec ) {
        let _tbl = tsec.parentElement;
        // 如果表格被清空（无<tr>），
        // 则从缓存中获取（列配置有效）。
        return ( $.table(_tbl) || tableObj(_tbl) ).newTR();
    },

    // @return {Element} <tr>
    [ T.THEAD ]: function( tsec ) {
        let _tbl = tsec.parentElement;
        return ( $.table(_tbl) || tableObj(_tbl) ).newTR( true );
    },

    // @return {Element} <tr>
    [ T.TFOOT ]: function( tsec ) {
        let _tbl = tsec.parentElement;
        return ( $.table(_tbl) || tableObj(_tbl) ).newTR();
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
// 定制创建。
// 涉及复杂的配置参数或异类创建，简化模板用法。
// 密封单元也在此创建。
// 返回值：{Element|[Element]|DocumentFragment}
//
const Creater = {

    //-- 内联单元 ------------------------------------------------------------


    /**
     * 创建SVG子单元。
     * @param  {String} xml SVG源码
     * @return {DocumentFragment}
     */
    svgitem( xml ) {
        let _frg = $.fragment( xml, true );

        $.find('*', _frg)
        .forEach( el => setType(el, T.SVGITEM) );

        return _frg;
    },


    /**
     * 创建时间单元。
     * 文本为空时即默认为datetime的标准格式文本。
     * date/time通常至少需要一个有值。
     * @param  {String} text 时间表达文本，可选
     * @param  {String} date 日期表达串，可选
     * @param  {String} time 时间表达串，可选
     * @return {Element}
     */
    time( text, date, time ) {
        date = date || '';

        if ( time ) {
            date = date ? `${date} ${time}` : `${time}`;
        }
        return $.attribute(
            element( T.TIME ),
            { text: text || date, datetime: date || null }
        );
    },


    /**
     * 创建量度标示。
     * 注：!!'0' => true
     * @param  {String} val 数量
     * @param  {String} max 最大值，可选
     * @param  {String} min 最小值，可选
     * @param  {String} high 高值，可选
     * @param  {String} low 低值，可选
     * @param  {String} opm 最优值，可选
     * @return {Element}
     */
    meter( val, max, min, high, low, opm ) {
        let opts = { value: val };

        if ( max ) opts.max = max;
        if ( min ) opts.min = min;
        if ( high ) opts.high = high;
        if ( low ) opts.low = low;
        if ( opm ) opts.optimum = opm;

        return $.attribute( element(T.METER), opts );
    },


    /**
     * 创建空白段。
     * @param  {Number} n 数量
     * @param  {String} width 宽度
     * @return {[Element]}
     */
    space( n, width ) {
        let _els = elements(
            ...new Array(n).fill( T.SPACE )
        );
        if ( width != null ) {
            _els.forEach( el => $.css(el, 'width', width) );
        }
        return _els;
    },


    /**
     * 创建换行。
     * @param  {Number} n 数量
     * @return {[Element]}
     */
    br( n ) {
        return elements( ...new Array(n).fill(T.BR) );
    },


    /**
     * 创建软换行。
     * @param  {Number} n 数量
     * @return {[Element]}
     */
    wbr( n ) {
        return elements( ...new Array(n).fill(T.WBR) );
    },


    /**
     * 创建代码单元。
     * 这里只是创建一个代码容器，并设置必要的特性配置。
     * 注记：
     * 外部插入内容时，根据容器配置即时解析。
     *
     * @attr: [data-lang, data-tab]
     * @param  {String} lang 代码语言，可选
     * @param  {Number} tabn Tab置换空格数，可选
     * @return {Element}
     */
    code( lang, tabn ) {
        let _el = element( T.CODE ),
            _op = {};

        if ( lang ) _op['-lang'] = lang;
        if ( tabn ) _op['-tab'] = tabn;

        return $.attribute( _el, _op );
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
// 空元素创建。
// 仅涉及设置元素特性集操作。
// tag == NAME
/////////////////////////////////////////////////
[
    'img',
    'track',
    'source',
]
.forEach(function( tag ) {
    /**
     * @param  {Object} opts 属性配置集
     * @return {Element}
     */
    Content[ tag ] = function( opts ) {
        return create( tag, opts );
    };
});


//
// 内容单元创建。
// 内容：纯文本（text）或内联单元/集。
// 包含元素特性设置。
// tag == NAME
/////////////////////////////////////////////////
[
    'a',            // cons, {href, target}
    'strong',       // cons
    'em',           // cons
    'q',            // cons, {cite}
    'abbr',         // text, {title}
    'cite',         // cons
    'small',        // cons
    'del',          // cons, {datetime, cite}
    'ins',          // cons, {datetime, cite}
    'sub',          // cons
    'sup',          // cons
    'mark',         // cons
    'dfn',          // cons, {title}
    'samp',         // cons
    'kbd',          // text
    's',            // cons
    'u',            // cons
    'var',          // text
    'bdo',          // cons, {dir}
    'rb',           // text
    'rt',           // text
    'rp',           // text
    'p',            // cons
    'pre',          // cons
    'address',      // cons
    'h1',           // cons
    'h2',           // cons
    'h3',           // cons
    'h4',           // cons
    'h5',           // cons
    'h6',           // cons
    'summary',      // cons
    'figcaption',   // cons
    'caption',      // cons
    'li',           // cons, {value:Number} // 当前起始编号
    'dt',           // cons
    'dd',           // cons
    'th',           // cons // 暂不支持任何属性设置
    'td',           // cons // 同上
]
.forEach(function( name ) {
    /**
     * 字符串实参优化为数组。
     * @param {Node|[Node]|String} cons 内容（集）
     * @param {Object} opts 属性配置，可选
     */
    Content[ name ] = function( cons, opts ) {
        if ( typeof cons === 'string' ) {
            cons = [cons];
        }
        let _el = create( name, opts );

        return $.append( _el, cons ), _el;
    };
});


//
// 定制内容元素创建。
// 内容：纯文本或内联节点（集）。
// [ role/NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'explain',    'span' ],
    [ 'orz',        'code' ],
    [ 'note',       'p' ],
    [ 'tips',       'p' ],
]
.forEach(function( names ) {
    /**
     * 字符串实参优化为数组。
     * @param {Node|[Node]|String} cons 内容（集）
     */
    Content[ names[0] ] = function( cons ) {
        if ( typeof cons === 'string' ) {
            cons = [cons];
        }
        let _el = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        $.append( _el, cons );

        return $.attr( _el, 'role', names[0] );
    };
});


//
// 定制结构元素创建。
// 内容：结构子元素（非源码）。
// [ role/NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'abstract',   'header' ],     // header/h3, p...
    [ 'toc',        'nav' ],        // nav/h3, ol:cascade/li/h4, ol
    [ 'seealso',    'ol' ],         // ul/li/#text
    [ 'reference',  'ul' ],         // ol/li/#text
    [ 's1',         'section' ],    // section/h2, header?, s2 | {content}, footer?
    [ 's2',         'section' ],    // section/h2, header?, s3 | {content}, footer?
    [ 's3',         'section' ],    // section/h2, header?, s4 | {content}, footer?
    [ 's4',         'section' ],    // section/h2, header?, s5 | {content}, footer?
    [ 's5',         'section' ],    // section/h2, header?, {content}, footer?
    [ 'codelist',   'ol' ],         // ol/li/code
    [ 'ulx',        'ul' ],         // ul/li/h4, ul|ol
    [ 'olx',        'ol' ],         // ol/li/h4, ol|ul
    [ 'cascade',    'ol' ],         // ol/li/h4, ol
    [ 'codeblock',  'pre' ],        // pre/code
    [ 'blank',      'div' ],        // div
    [ 'space',      'span' ],       // span
]
.forEach(function( names ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ names[0] ] = function( ...nodes ) {
        let _box = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        if ( nodes.length ) {
            $.append( _box, nodes );
        }
        return $.attr( _box, 'role', names[0] );
    };
});


//
// 中间定制结构元素创建。
// 内容：结构子元素（非源码或文本）。
// [ NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'codeli',      'li' ],  // li/code
    [ 'ali',         'li' ],  // li/a
    [ 'ah4li',       'li' ],  // li/h4/a
    [ 'ah4',         'h4' ],  // h4/a
    [ 'ulxh4li',     'li' ],  // li/h4, ul|ol
    [ 'olxh4li',     'li' ],  // li/h4, ol|ul
    [ 'cascadeh4li', 'li' ],  // li/h4, ol
    [ 'figimgp',     'p' ],   // p/img, span
]
.forEach(function( names ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ names[0] ] = function( ...nodes ) {
        let _box = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        return $.append( _box, nodes ), _box;
    };
});


//
// 结构单元创建。
// 内容：结构子元素。
// tag/NAME
/////////////////////////////////////////////////
[
    'header',       // h3, p...
    'footer',       // h3, p...
    'article',      // header?, s1 | {content}, footer?, hr?
    'ul',           // li...
    'ol',           // li...
    'dl',           // dt, dd...
    'figure',       // figcaption, p/img, span:explain
    'blockquote',   // h3, p...
    'aside',        // h3, p...
    'details',      // summary, p...
]
.forEach(function( name ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ name ] = function( ...nodes ) {
        let _box = create( name );
        $.append( _box, nodes );
        return _box;
    };
});



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 创建元素（通用）。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 返回null表示无法创建元素。
 * @param  {Number} tval 类型值
 * @return {Element|null}
 */
function element( tval ) {
    let _el = ( customMaker[tval] || create )(
            ...Tags[tval].split( '\\' )
        );
    return _el && setType( _el, tval );
}


/**
 * 创建元素序列。
 * @param  {...Number} types 类型值序列
 * @return {[Element]}
 */
function elements( ...types ) {
    return types.map( tv => element(tv) );
}


/**
 * 简单创建元素。
 * @param {String} tag 标签名
 * @param {String} role 角色名
 */
function create( tag, role ) {
    let _el = $.element( tag );
    return role && _el.setAttribute( 'role', role ) || _el;
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
 * 插入一个新表格行。
 * @param  {Element} ts 表体元素（<tbody>|<thead>|<tfoot>）
 * @return {Element} <tr>
 */
function appendTR( ts ) {
    let _tbo = tableObj( ts.parentElement );

    switch ( ts.tagName ) {
        case 'THEAD':
            return _tbo.head(1);
        case 'TFOOT':
            return _tbo.foot(1);
    }
    return _tbo.body(1);
}



//
// 扩展&导出。
//////////////////////////////////////////////////////////////////////////////


//
// By扩展：
// New.[cell-name](...)
//
processExtend( 'New', Content );


export { create };
