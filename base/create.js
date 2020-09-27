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
import { getType, setType, tableObj, contents, isValidTR, sectionContents } from "./base.js";


const
    $ = window.$;


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
    [ T.SVGITEM ]:      null,  // 异常阻断（不合理使用）
    [ T.TRACK ]:        'track',
    [ T.SOURCE ]:       'source',
    [ T.EXPLAIN ]:      'i\\explain',
    [ T.RB ]:           'rb',
    [ T.RT ]:           'rt',
    [ T.RP ]:           'rp',
    [ T.RBPT ]:         null,  // 异常阻断。
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
    [ T.XH4LI ]:        'li',
    [ T.CASCADEH4LI ]:  'li',
    [ T.CASCADEAH4LI ]: 'li',
    [ T.TOCCASCADE ]:   'ol\\cascade',
    [ T.FIGIMGBOX ]:    'span',

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
    [ T.AUDIO ]: function() {
        return $.elem( 'audio', __msgAudio );
    },


    //
    // 视频：嵌入不支持提示。
    //
    [ T.VIDEO ]: function() {
        return $.elem( 'video', __msgVideo );
    },


    //
    // 名称空间不同，特别创建。
    //
    [ T.SVG ]: function() {
        return $.svg();
    },
};


//
// 子内容创建集。
// 创建目标应有的子节点，可能是一个节点序列（如<tr>: <th>|<td>...）。
// 返回值：{
//      head: 标题部分，可选
//      body: 主体部分，新插入的子节点（集）
//      end:  构建结束，无需下一步（Builder）的迭代
// }
// function( box:Element, opts:Object, data:Value ): Object3
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
     * @param {Element} box 普通SVG容器元素
     * @param {Node|[Node]|String} data
     * @node: {[Node]|data}
     */
    [ T.SVGITEM ]: function( box, _, data ) {
        return result( null, svgInsert(box, data), true );
    },


    /**
     * 留到下阶内容元素段处理。
     * @node: {[Element]}
     * @param {Element} ruby 注音元素
     */
    [ T.RUBY ]: function( ruby ) {
        return result(
            null,
            $.append( ruby, elements(T.RB, T.RP, T.RT, T.RP) )
        );
    },

    // 同上。
    [ T.RBPT ]: function( ruby ) {
        return result(
            null,
            $.append( ruby, elements(T.RB, T.RP, T.RT, T.RP) )
        );

    },


    /**
     * 代码单元。
     * 源代码应当已经处理好Tab和语法高亮。
     * 注记：
     * 只接受源码数据，不接受不同代码内容的混入。
     * 这可以保证代码语言和Tab的一致性，
     * 且代码被设计为特例编辑（高亮解析，严格语法合规）。
     * @param {Element} code 代码元素
     * @param {String} html 已解析源码
     */
    [ T.CODE ]: function( code, _, html ) {
        if ( typeof html !== 'string' ) {
            return result( null, null, true );
        }
        $.append( code, $.fragment(data, false) );

        return result( null, code, true );
    },


    //
    // 块内结构子
    /////////////////////////////////////////////


    /**
     * 单元格已经存在。
     * 单元格内容插入留到后阶内容元素段处理。
     * @node: {[Element]}
     * @param {Element} tr 表格行元素
     */
    [ T.TR ]: function( tr ) {
        return result( null, [...tr.cells] );
    },


    /**
     * 表体行元素。
     * 如果数据行合法，则简单添加后结束递进。
     * 数据可能是一个集合，此时视为单元格数据集。
     * 注记：
     * 仅在表体处理时提供添加列头的能力，
     * 因为需要先有行元素才能插入列头。
     * @param {Element} body 表体元素
     * @param {Boolean} th0 添加列表头
     * @param {[Value]|Element} data 单元格数据集或表格行元素
     */
    [ T.TBODY ]: function( body, {th0}, data ) {
        let _tbo = tableObj( body.parentElement ),
            _new = appendRow( _tbo, body, data );

        if ( th0 && _tbo.rows() > 0 ) {
            _tbo.insertColumn( _tbo.newColumn(true), 0 );
        }
        return result( null, _new, !_new );
    },


    /**
     * 表头行元素。
     * @param {Element} head 表头元素
     * @param {[Value]|Element} data 单元格数据集或表格行元素
     */
    [ T.THEAD ]: function( head, _, data ) {
        let _new = appendRow(
            tableObj( head.parentElement ),
            head, data, true
        );
        return result( null, _new, !_new );
    },


    /**
     * 表脚行元素。
     * @param {Element} foot 表脚元素
     * @param {[Value]|Element} data 单元格数据集或表格行元素
     */
    [ T.TFOOT ]: function( foot, _, data ) {
        let _new = appendRow(
            tableObj( foot.parentElement ),
            foot, data
        );
        return result( null, _new, !_new );
    },


    /**
     * 级联表标题项。
     * 如果没有传递 h4，取<li>容器内容创建。
     * 如果传递了 h4，原<li>内容会被清空丢弃。
     * 子列表有则插入，不支持自动递进（不确定为OL或UL）。
     * 注记：
     * 子列表只能由既有的列表传入构建。
     *
     * @param {Element} li 列表项元素
     * @param {String|Node|[Node]} h4 标题内容
     * @param {Element} data 子列表，可选
     */
    [ T.XH4LI ]: function( li, {h4}, data ) {
        if ( !data ) {
            return result( null, data, true );
        }
        let _h4 = $.empty( li );

        return result(
            insertHeading( li, T.H4, h4 || _h4 ),
            // 合法插入时返回供选取。
            appendChild(li, data) === null && data,
            true
        );
    },


    /**
     * 级联编号表标题项。
     * 如果没有传递 h4，取<li>容器内容创建。
     * 如果传递了 h4，原<li>内容会被清空丢弃。
     * @param {Element} li 列表项元素
     * @param {String|Node|[Node]} h4 标题内容，可选
     * @param {Element} data 子列表，可选
     */
    [ T.CASCADEH4LI ]: function( li, {h4}, data ) {
        let _h4 = $.empty( li ),
            _ol = appendChild(
                li,
                data,
                () => elem(T.OL)
            );
        return result( insertHeading(li, T.H4, h4 || _h4), _ol || data, !_ol );
    },


    /**
     * 级联标题链接条目。
     * 标题内容应当是一个构建好的链接元素，
     * 因为标题不在正常的递进构建流程里。
     * @param {Element} li 列表项容器
     * @param {Element} h4a 链接内容（<a>），可选
     * @param {Element} data 子列表（<ol>），可选
     */
    [ T.CASCADEAH4LI ]: function( li, {h4a}, data ) {
        let _ol = appendChild(
            li,
            data,
            () => elem( T.OL )
        );
        return result( h4a && insertHeading(li, T.AH4, h4a), _ol || data, !_ol );
    },


    /**
     * 目录级联编号表。
     * 与普通级联表不同，列表条目为链接（单击定位目标）。
     * 注：定制创建，不参与编辑。
     * @param {Element} ol 级联表根元素
     * @param {Element} root 正文根元素（<article）
     * @node: {[Element]} [<li>]
     */
    [ T.TOCCASCADE ]: function( ol, _, root ) {
        let _ses = $.children(
            root,
            // 不含role，需要nth-of-type()
            'section'
        );
        return result( null, $.append(ol, tocList(_ses)), true );
    },


    /**
     * 仅返回图片元素供递进构建。
     * @param {Element} box 图片容器
     * @param {String|Node|[Node]} explain 图片讲解，可选
     * @param {Element} data 主体内容（<img>, <svg>）
     */
    [ T.FIGIMGBOX ]: function( box, {explain}, data ) {
        let _img = appendChild(
            box,
            data,
            () => elem( T.IMG )
        );
        return result( explain && $.append(box, elem(T.EXPLAIN, explain)), _img || data, !_img );
    },


    //
    // 行块结构元素
    /////////////////////////////////////////////


    /**
     * 留待下阶填充内容。
     * @param {Element} hgroup
     */
    [ T.HGROUP ]: function( hgroup ) {
        return result(
            null,
            $.append( hgroup, elements(T.H1, T.H3) )
        );
    },


    /**
     * 仅构建标签和级联表根。
     * 注记：下阶专用函数构建目录内容。
     * @param {Element} toc 目标根元素
     * @param {String} h3 目录显示标签
     */
    [ T.TOC ]: function( toc, {h3} ) {
        return result(
            insertHeading( toc, T.H3, h3 ),
            $.append( toc, elem(T.TOCCASCADE) ),
        );
    },


    /**
     * 两个子单元位置确定。
     * 仅为容器创建，需向后续传递进构建。
     * @param {Element} art 文章元素
     * @param {Boolean} header 有无导言
     * @param {Boolean} footer 有无结语
     * @param {Element} data 子单元数据，可选
     */
    [ T.ARTICLE ]: function( art, {header, footer}, data ) {
        let _buf = [];

        if ( header  ) {
            _buf.push( insertHeader(art) );
        }
        let _new = appendChild( art, data, () => elem(T.P) );

        if ( footer ) {
            _buf.push( appendFooter(art) );
        }
        return result( _buf, _new || data, !_new );
    },


    /**
     * 代码表内容。
     * 根容器已经设置了必要特性。
     * @param {Element} ol 代码表容器
     * @param {String} data 源码行
     */
    [ T.CODELIST ]: function( ol, _, data ) {
        let _el = appendChild(
            ol,
            data,
            () => elem( T.CODELI )
        );
        return result( null, _el || data, !_el );
    },


    /**
     * 允许创建一个标题项。
     * @param {Element} dl 定义列表根容器
     * @param {String|Node|[Node]} dt 标题内容，可选
     * @param {Element} data 数据条目，可选
     */
    [ T.DL ]: function( dl, {dt}, data ) {
        let _dd = appendChild(
            dl,
            data,
            () => elem( T.DD )
        );
        return result( dt && $.append(dl, elem(T.DT, dt)), _dd || data, !_dd );
    },


    /**
     * 表格子单元创建。
     * 允许外部插入表体元素（同列数）。
     * 表头/表脚仅创建为空元素。
     * 注记：
     * 仅提供表体单元的递进处理（表格行）。
     * 不提供删除选项子单元的能力。
     * @param {Element} tbl 表格元素
     * @param {String|Node|[Node]} caption 表标题内容
     * @param {Boolean} head 添加表头
     * @param {Boolean} foot 添加表脚
     * @param {Element} body 兼容表体元素
     */
    [ T.TABLE ]: function( tbl, {caption, head, foot}, body ) {
        let _tbo = tableObj( tbl ),
            _buf = [], _tbd;

        if ( caption ) {
            _buf.push( _tbo.caption(caption) );
        }
        if ( head ) {
            _buf.push( _tbo.head(true) );
        }
        if ( foot ) {
            _buf.push( _tbo.foot(true) );
        }
        if ( body && body.tagName === 'TBODY' ) {
            _tbd = _tbo.bodies( 0, body );
        }
        // 合法插入返回表体元素，结束递进。
        return result( _buf, _tbd || _tbo.body(true), !!_tbd );
    },


    /**
     * 插图/标题。
     * 合法插入则终止，否则创建默认单元并继续。
     * @param {Element} fig 插图根元素
     * @param {Element} data 子单元数据
     */
    [ T.FIGURE ]: function( fig, {figcaption}, data ) {
        let _el = appendChild(
            fig,
            data,
            () => elem( T.FIGIMGBOX )
        );
        return result( figcaption && insertHeading(fig, T.FIGCAPTION, figcaption), _el || data, !_el );
    },


    /**
     * 详细内容/简介。
     * @param {Element} box 容器元素
     * @param {String|Node|[Node]} summary 简介
     * @param {Element} data 子单元数据
     */
    [ T.DETAILS ]: function( box, {summary}, data ) {
        let _el = appendChild(
            box,
            data,
            () => elem( T.P )
        );
        return result( summary && insertHeading(box, T.SUMMARY, summary), _el || data, !_el );
    },

};


//
// 子单元唯一性约束。
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
     * @param {Element} data 子单元数据，可选
     * @node: {Element}
     */
    Children[ its[0] ] = function( box, _, data ) {
        if ( box.childElementCount > 0 ) {
            // 后阶内容处理。
            return result( null, box.firstElementChild );
        }
        let _new = appendChild(
            box,
            data,
            () => elem( its[1] )
        );
        return result( null, _new || data, !_new );
    };

});


//
// 小行块创建。
// 结构：[ <h3>, <p>... ]
// 标题在最前，智能补足（不存在则创建，否则忽略）。
// 注记：一次只处理一个段落数据。
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
     * @param {Element} box 容器元素
     * @param {String|Node|[Node]} h3 小标题内容，可选
     * @param {Element} data 子单元数据
     */
    Children[ it ] = function( box, {h3}, data ) {
        let _el = appendChild(
            box,
            data,
            () => elem( T.P )
        );
        return result( h3 && insertHeading(box, T.H3, h3), _el || data, !_el );
    };
});


//
// 根列表（顶级）。
// 如果子单元不合法，简单构建<li>条目。
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
     * @param {Element} box 容器元素
     * @param {Element} data 列表项元素
     */
    Children[ it ] = function( box, _, data ) {
        let _new = appendChild(
            box,
            data,
            () => elem( T.LI )
        );
        return result( null, _new || data, !_new );
    };
});


//
// 5级片区。
// 此为通用容器，内容自由。
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
     * 如果data无内容或已合法插入，则停止迭代。
     * 否则创建一个默认子单元后继续。
     * @param {Element} sec 片区元素
     * @param {String|Node|[Node]} h2 标题内容
     * @param {Boolean} header 创建导言，可选
     * @param {Boolean} footer 创建结语，可选
     * @param {Element} data 子单元数据，可选
     */
    Children[ it ] = function( sec, {h2, header, footer}, data ) {
        let _buf = [
            h2 && insertHeading( sec, T.H2, h2 ),
            header && insertHeader( sec )
        ];
        let _new = appendChild( sec, data, () => sectionAppend(sec, data) );

        if ( footer ) {
            _buf.push( appendFooter(sec) );
        }
        return result( _buf.filter(v => v), _new || data, !_new );
    };

});


//
// 内容设置。
// 会检查数据源的匹配性或提取其内容。
//-----------------------------------------------
[
    // 内联结构内容元素。
    T.METER,
    T.RB,
    T.RT,
    T.RP,
    T.EXPLAIN,

    // 内联内容元素。
    T.A,
    T.Q,
    T.ABBR,
    T.DEL,
    T.INS,
    T.DFN,
    T.BDO,
    T.TIME,
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
     * 到内容元素后会终止向下迭代。
     * 返回内容元素自身而非插入的子节点。
     * 注记：
     * 此为添加方式，如果需要 fill，用户可先清空操作。
     * 可能有游离文本节点，需要规范化（最近）。
     * @param {Element} el 内容根元素
     * @param {String|Node} data 内容数据
     */
    Children[ its ] = function( el, _, data ) {
        $.append(
            el,
            dataCons( data, getType(el) )
        );
        return result( null, $.normalize(el), true );
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
     * 注记：内容留待 Children 段处理（否则重复）。
     * @param  {Element} svg 目标元素
     * @param  {Object} opts 特性配置集
     * @return {Element} svg
     */
    [ T.SVG ]: function( svg, opts ) {
        return $.attribute( svg, opts );
    },


    /**
     * SVG 子单元。
     * 通用特性设置，由用户控制配置集。
     * 注记：应该只用于单独新建。
     * @param  {Element} el 目标元素
     * @param  {Object} opts 特性配置集
     * @return {Element} el
     */
    [ T.SVGITEM ]: function( el, opts ) {
        return $.attribute( el, opts );
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
    [ T.TIME ]: function( el, {date, time} ) {
        date = date || '';

        if ( time ) {
            date = date ? `${date} ${time}` : `${time}`;
        }
        return $.attr( el, 'datetime', date || null );
    },


    /**
     * 空白段。
     * @param  {Element} el 目标元素
     * @param  {String} width 宽度
     * @return {Element} el
     */
    [ T.SPACE ]: function( el, {width} ) {
        if ( width != null ) {
            $.css( el, 'width', width );
        }
        return el;
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
     * 注意缓存 Table 实例。
     * 注记：
     * 列头在 Children:T.TBODY 处处理。
     * 行数体现在数据集上（每条一行）。
     * @param  {Element} tbl 表格元素（空）
     * @param  {Number} cols 列数
     * @return {Element} tbl
     */
    [ T.TABLE ]: function( tbl, {cols, border} ) {
        let _tbo = new $.Table( tbl );

        if ( border != null ) {
            $.attr( tbl, 'border', border );
        }
        // 非空表格自然忽略。
        _tbo.build( cols, 0 );

        return tableObj( tbl, _tbo ), tbl;
    },


    // 定制构建。
    // [ T.B ]: null,
    // [ T.I ]: null,

};


//
// 正常特性设置。
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
    [ T.A,          ['href', 'target'] ],
    [ T.Q,          ['cite'] ],
    [ T.ABBR,       ['title'] ],
    [ T.DEL,        ['datetime', 'cite'] ],
    [ T.INS,        ['datetime', 'cite'] ],
    [ T.DFN,        ['title'] ],
    [ T.BDO,        ['dir'] ],
    [ T.CODE,       ['-lang', '-tab'] ],
]
.forEach(function( its ) {
    /**
     * @param  {Element} el 目标根元素
     * @param  {Object} opts 特性配置集
     * @return {Element} el
     */
    Builder[ its[0] ] = (el, opts) => $.attribute( el, attrPicks(opts, its[1]) );
});


//
// 自身无需特别构建，
// 简单返回实参即可。
// 注记：默认处理无需定义，罗列供参考。
//-----------------------------------------------
[
    // 结构元素
    // T.TR,
    // T.THEAD,
    // T.TBODY,
    // T.TFOOT,
    // T.CODELI,
    // T.ALI,
    // T.AH4,
    // T.XH4LI,
    // T.CASCADEH4LI,
    // T.CASCADEAH4LI,
    // T.TOCCASCADE,
    // T.FIGIMGBOX,
    // T.HGROUP,
    // T.ABSTRACT,
    // T.TOC,
    // T.SEEALSO,
    // T.REFERENCE,
    // T.HEADER,
    // T.FOOTER,
    // T.ARTICLE,
    // T.S1,
    // T.S2,
    // T.S3,
    // T.S4,
    // T.S5,
    // T.UL,
    // T.OL,
    // T.ULX,
    // T.OLX,
    // T.CASCADE,
    // T.DL,
    // T.FIGURE,
    // T.ASIDE,
    // T.CODEBLOCK,
    // T.BLANK,

    // 内联内容元素
    // T.STRONG,
    // T.EM,
    // T.CITE,
    // T.SMALL,
    // T.SUB,
    // T.SUP,
    // T.MARK,
    // T.ORZ,
    // T.SAMP,
    // T.KBD,
    // T.S,
    // T.U,
    // T.VAR,

    // 内容行单元。
    // T.P,
    // T.NOTE,
    // T.TIPS,
    // T.PRE,
    // T.ADDRESS,

    // 内容元素
    // T.H1,
    // T.H2,
    // T.H3,
    // T.H4,
    // T.H5,
    // T.H6,
    // T.SUMMARY,
    // T.FIGCAPTION,
    // T.CAPTION,
    // T.LI,
    // T.DT,
    // T.DD,
    // T.TH,
    // T.TD,
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
 * 更新标题内容并返回标题元素。
 * @param  {Element} box 容器元素
 * @param  {Number} tval 标题类型值
 * @param  {String|Node|[Node]} data 插入内容
 * @return {Element|null} 新插入或更新的标题元素
 */
function insertHeading( box, tval, data ) {
    let _hx = box.firstElementChild;

    if ( !_hx || getType(_hx) !== tval ) {
        _hx = $.prepend( box, elem(tval) );
    }
    return $.fill( _hx, data ), _hx;
}


/**
 * 插入导言（如果没有）。
 * 容忍既有导言不在前端。
 * 新插入导言在标题之后或容器内最前端。
 * @param  {Element} box 导言父元素
 * @param  {String} hslr 依附标题选择器
 * @return {Element} 既有或新建的导言
 */
function insertHeader( box, hslr = '>h2' ) {
    let _el = $.get( '>header', box );
    if ( _el ) return _el;

    let _hx = $.get( hslr, box );

    return _hx ? $.after( _hx, elem(T.HEADER) ) : $.prepend( box, elem(T.HEADER) );
}


/**
 * 判断插入结语并返回。
 * 如果没有就新建插入（到容器末端）。
 * 容忍既有结语不在末端。
 * @param  {Element} box 结语父元素
 * @return {Element} 结语元素
 */
function appendFooter( box ) {
    let _el = $.get( '>footer', box );
    return _el || $.append( box, elem(T.FOOTER) );
}


/**
 * 子单元判断插入或新建。
 * 如果子单元合法会插入，不创建默认单元，返回null。
 * 如果子单元为假，无任何行为，返回undefined。
 * @param  {Element} box 容器元素
 * @param  {Node|String} sub 子单元
 * @param  {Function} maker 创建默认单元回调，可选
 * @return {Element|null|void} maker创建的单元
 */
function appendChild( box, sub, maker ) {
    if ( !sub ) return;

    let _tv0 = getType( box ),
        _tv1 = sub.nodeType ? getType( sub ) : 0;

    if ( T.isChildType(_tv0, _tv1) ) {
        return $.append( box, sub ) && null;
    }
    return maker && $.append( box, maker() );
}


/**
 * 章节内容提取添加。
 * 如果插入内容是不同层级的章节，提取纯粹的章节内容。
 * 否则创建一个默认段落继续。
 * @param  {Element} box 容器元素
 * @param  {Element|Value} sub 子单元内容
 * @return {Element|void} 新建默认单元
 */
function sectionAppend( box, sub ) {
    if ( sub.tagName !== 'SECTION' ) {
        return elem( T.P );
    }
    // void for end.
    $.append( box, sectionContents(sub) );
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
 * 注记：section不含role约束，便于构造nth-of-type()定位。
 * @param  {Element} sec 片区元素
 * @return {Element} 目录条目项<li>
 */
function tocItem( sec ) {
    let _h2 = $.get( '>h2', sec ),
        _ss = $.children( sec, 'section' );

    if ( !_h2 ) {
        error( '<H2> is missed...!!', sec );
    }
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
 * @return {Element} 列表标题项<li/h4/a>
 */
function tocH4li( h2 ) {
    let _h4a = build(
        elem( T.A ),
        { href: h2.id ? `#${h2.id}` : null },
        h2.innerText
    );
    return build( elem(T.CASCADEAH4LI), { h4a: _h4a }, elem(T.OL) );
}


/**
 * 创建目录列表项。
 * @param  {Element} h2 标题元素
 * @return {Element} 列表项（<li/a>）
 */
function tocLi( h2 ) {
    return build(
        elem( T.ALI ),
        { href: h2.id ? `#${h2.id}` : null },
        h2.innerText
    );
}


/**
 * 获取数据项。
 * 如果是数组则按下标取值，否则返回该值。
 * @param  {Value|[Value]} data 数据（集）
 * @param  {Number} i 值下标
 * @return {Value}
 */
function data( data, i ) {
    return $.isArray(data) ? data[i] : data;
}


/**
 * 插入表格行。
 * @param  {$.Table} tbo 表格实例
 * @param  {TableSection} tsec 表格片区
 * @param  {Element} row 行元素
 * @param  {Boolean} head 是否在表头
 * @return {Element} 新行
 */
function appendRow( tbo, tsec, row, head ) {
    if ( !row ) return;

    if ( row.tagName === 'TR' && isValidTR(row, tbo) ) {
        return tbo.insertTR(row, null, tsec), null;
    }
    // 可能不是一个元素。
    return tbo.newTR( head );
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
 * 检查提取数据内容。
 * 汇集符合目标元素子元素类型的数据。
 * 如果不符合子元素类型，则取其文本内容。
 * 注：仅用于内容元素。
 * @param  {String|Node} data 目标数据
 * @param  {Number} tval 容器元素类型
 * @return {Node|String|[Node|String]} 合法数据（集）
 */
function dataCons( data, tval ) {
    if ( data.nodeType !== 1 && data.nodeType !== 11 ) {
        return data || '';
    }
    if ( T.onlyText(tval) ) {
        return data.textContent;
    }
    return contents( data ).map(
        nd => T.isChildType( tval, getType(nd) ) ? nd : nd.textContent
    );
}


/**
 * 子单元创建调用。
 * @param {Element} el 容器元素
 * @param {Object} opts 选项集
 * @param {Value|[Value]} data 子单元数据（集）
 * @param {Boolean} more 是否多条创建
 */
function childrenCalls( el, opts, data, more ) {
    if ( more ) {
        return data.forEach( dd => children(el, opts, dd) );
    }
    children( el, opts, data );
}


/**
 * 构造返回结果。
 * - head 表达标题头是否新建或修改，用于决定是否再选取。
 *        也包含除主体内容之外无需递进构建的部分。
 * - body 携带可能需要递进构建的内容单元序列。
 * - end  表示已经构建完成，body部分无需再递进处理。
 *
 * @param  {Element|[Element]} head 标题头或内容额外部分
 * @param  {Element|[Element]} body 内容主体
 * @param  {Boolean} end 是否结束（构建），可选
 * @return {Object3}
 */
function result( head, body, end = false ) {
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
 * 抛出错误。
 * @param {String} msg 错误消息
 * @param {Value} data 提示关联数据
 */
function error( msg, data ) {
    if ( data ) {
        window.console.info( data );
    }
    throw new Error( msg );
}


//
// 基本工具。
//----------------------------------------------------------------------------


/**
 * 元素简单创建。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 返回null表示无法创建元素。
 * 注意data必须是目标类型的合法子元素内容。
 * @param  {Number} tval 类型值
 * @param  {Node|[Node]|String} data 元素内容，可选
 * @return {Element|null}
 */
function elem( tval, data ) {
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
function elements( ...types ) {
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
 *      cols:   {Number}    表格列数（注：无rows）
 *      border: {String}    边框类型
 * }
 * 注记：
 * 如果需要创建多条子单元，data必须是一个数据集（数组）。
 * 多条创建指重复的子单元而非一个子单元包含多个元素，如：
 * - <tr>   包含多个单元格，但一行的单元格仅视为一次创建
 * - <ruby> 包含固定结构的多个子元素，但一组也只是一次创建
 *
 * 如要重复创建这样的单元，data通常是一个二维数组。
 *
 * @param  {Element} el 待构建的目标元素
 * @param  {Object} opts 特性配置集
 * @param  {Node|[Node]|String} data 源数据
 * @param  {Boolean} more 是否重复子单元创建
 * @return {Element|null} el或null
 */
function build( el, opts, data, more ) {
    let _tv = getType( el ),
        _fx = Builder[ _tv ];

    if ( _fx ) {
        el = _fx( el, opts );
    }
    if ( Children[_tv] ) {
        childrenCalls( el, opts, data, more );
    }
    return el;  // 关联到children
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
 *      h4a:        {Element} 级联表标题链接（<a>）
 *      explain:    {Value}   图片讲解
 *      h2:         {Value}   片区（section）标题
 *      header:     {Boolean} 创建导言部分
 *      footer:     {Boolean} 创建结语部分
 *      dt:         {Value}   定义列表标题项
 *      th0:        {Boolean} 表格列表头
 * }
 * @param  {Element} box 父容器元素
 * @param  {Object} opts 子元素特性配置集
 * @param  {Node|[Node]|[String]} cons 内容数据
 * @return {[Element]} 构建的子元素集
 */
function children( box, opts, cons ) {
    let _tv = getType( box ),
        _vs = Children[_tv]( box, opts, cons );

    if ( _vs.end ) {
        return resultEnd( _vs.head, _vs.body )
    }
    if ( $.isArray(_vs.body) ) {
        return resultEnd(
            _vs.head,
            _vs.body.map( (el, i) => build(el, opts, data(cons, i)) )
        );
    }
    return resultEnd( _vs.head, build(_vs.body, opts, cons) );
}


/**
 * 创建单元。
 * 支持字符串名称指定。
 * @param  {String|Number} name 目标名或类型值
 * @param  {Object} opts 特性配置集
 * @param  {Node|[Node]|String} data 源数据
 * @param  {Boolean} more 是否重复子单元创建
 * @return {Element} 目标单元
 */
function create( name, opts, data, more ) {
    if ( typeof name === 'string' ) {
        name = T[ name.toUpperCase() ];
    }
    if ( name == null ) {
        throw new Error( 'invalid target name.' );
    }
    return build( elem(name), opts, data, more );
}


/**
 * 单元创建器。
 * 返回创建目标名称单元的函数。
 * @param  {String} name 单元名称
 * @return {Function} 创建函数
 */
function creater( name ) {
    let _tv = T[ name.toUpperCase() ];

    if ( _tv == null ) {
        throw new Error( 'invalid target name.' );
    }
    return (evo, opts = {}, more) => build( elem(_tv), opts, evo.data, more );
}



//
// By扩展：
// New.[cell-name](...)
//////////////////////////////////////////////////////////////////////////////


//
// 取栈数量：1
//
processProxy( 'New', creater, 1 );


//
// 导出。
//////////////////////////////////////////////////////////////////////////////

export { children, create };
