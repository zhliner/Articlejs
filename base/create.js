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

import { type, nameType, tableObj } from "./base.js";
import { SVG, SVGITEM } from "./types.js";
import { extend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // ID标识字符限定
    __reIDs = /(?:\\.|[\w-]|[^\0-\xa0])+/g,

    // 类型值存储键。
    __typeKey = Symbol('type-value');


//
// 简单默认消息。
//
const
    __msgAudio = "Sorry, your browser doesn't support embedded audios.",
    __msgVideo = "Sorry, your browser doesn't support embedded videos.";



//
// 单元创建集。
// 包含全部中间结构单元。
// 用于主面板中的新单元构建和复制/移动时的默认单元创建。
//////////////////////////////////////////////////////////////////////////////
// 注记：
// 除非为最基本单元，实参尽量为节点/集以便于移动转换适用。
// 返回节点集时，如果目标为集合，可实现一一对应插入。
//
const Content = {

    //-- 内联单元 ------------------------------------------------------------

    /**
     * 创建音频单元。
     * @param  {Object} opts 属性配置集
     * @return {Element}
     */
    audio( opts = {} ) {
        opts.text = __msgAudio;
        return create( 'audio', opts );
    },


    /**
     * 创建视频单元。
     * @param  {Object} opts 属性配置集
     * @return {Element}
     */
    video( opts = {} ) {
        opts.text = __msgVideo;
        return create( 'video', opts );
    },


    /**
     * 创建兼容图片。
     * @param  {Element} img 图片元素
     * @param  {[Element]} sources 兼容图片源元素
     * @return {Element}
     */
    picture( img, sources ) {
        let _el = create( 'picture' );

        $.append( _el, sources.concat(img) );
        return _el;
    },


    /**
     * 创建SVG单元。
     * opts通常是必须的。
     * @param  {Object} opts 属性配置集
     * @param  {String} xml SVG源码，可选
     * @return {Element}
     */
    svg( opts = {}, xml = '' ) {
        if ( xml ) {
            opts.html = xml;
        }
        let _el = $.svg( opts );

        $.find('*', _el)
        .forEach( el => setType(el, SVGITEM) );

        return setType( _el, SVG );
    },


    /**
     * 创建注音单元。
     * 注意实参传递的顺序。
     * @param  {Element} rb 注音字
     * @param  {Element} rt 注音
     * @param  {Element} rp1 左包围
     * @param  {Element} rp2 右包围
     * @return {Element}
     */
    ruby( rb, rt, rp1, rp2 ) {
        let _el = create( 'ruby' );

        $.append( _el, [rb, rp1, rt, rp2] )
        return _el;
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
        let dt = '';

        if ( date ) dt = date;
        if ( time ) dt = dt ? `${dt} ${time}` : `${time}`;

        return create( 'time', {text: text || dt, datetime: dt || null} );
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

        return create( 'meter', opts );
    },


    /**
     * 创建空白段。
     * @param  {Number} n 数量
     * @param  {String} width 宽度
     * @return {Element|[Element]}
     */
    space( n, width ) {
        let _els = handleCalls( n, create, 'space' );

        if ( width != null ) {
            _els.forEach( el => $.css(el, 'width', width) );
        }
        return _els.length == 1 ? _els[0] : _els;
    },


    /**
     * 创建换行。
     * @param  {Number} n 数量
     * @return {Element|[Element]}
     */
    br( n ) {
        let _els = handleCalls( n, create, 'br' );
        return _els.length == 1 ? _els[0] : _els;
    },


    /**
     * 创建软换行。
     * @param  {Number} n 数量
     * @return {Element|[Element]}
     */
    wbr( n ) {
        let _els = handleCalls( n, create, 'wbr' );
        return _els.length == 1 ? _els[0] : _els;
    },


    /**
     * 创建注音内容组。
     * 返回集成员顺序与ruby()实参顺序一致。
     * rp1和rp2必须成对出现。
     * 注记：
     * 仅用于ruby完整子单元封装，不存储单元类型值（因为无法从DOM中选取）。
     * 具体各子单元的创建由相应的方法完成。
     * @param  {Element} rb 注音文本
     * @param  {Element} rt 注音拼音
     * @param  {Element} rp1 左包围，可选
     * @param  {Element} rp2 右包围，可选
     * @return {[Element]}
     */
    rbpt( rb, rt, rp1, rp2 ) {
        let _els = [ rb, rt ];

        if ( rp1 && rp2 ) {
            _els.push( rp1, rp2 );
        }
        return _els;
    },


    /**
     * 创建代码单元。
     * 对内部的<b><i>不设置类型值，
     * 因为内部的语法单元是即时解析和构建的。
     * opts: {data-lang, data-tab}
     * @param  {Node|[Node]|String} cons 单元内容
     * @param  {Object} opts 属性配置，可选
     * @return {Element}
     */
    code( cons, opts ) {
        let _el = create( 'code', opts ),
            _fn = typeof cons === 'string' ? 'html' : 'append';

        return $[_fn]( _el, cons ), _el;
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
 * 创建单元（通用）。
 * 类型值会被存储，以使得不需要每次都检查判断。
 * 注：不含文本节点和svg创建。
 * @param  {String} tag 标签名
 * @param  {Object} opts 特性配置对象，可选
 * @param  {String} name 单元类型名，可选
 * @return {Element}
 */
function create( tag, opts, name ) {
    let _el = $.Element( tag );

    if ( opts ) {
        $.attribute( _el, opts );
    }
    return setType( _el, nameType(name || tag.toUpperCase()) );
}


/**
 * 存储元素类型值。
 * 注：用一个Symbol键存储在元素对象上，非枚举。
 * @param  {Element} el 目标元素
 * @param  {Number} tval 类型值
 * @return {Element} el
 */
function setType( el, tval ) {
    Reflect.defineProperty(el, __typeKey, {
        value: tval,
        enumerable: false,
    });
    return el;
}


/**
 * 提取元素类型值。
 * 如果值未知，即时分析获取并存储。
 * @param  {Element} el 目标元素
 * @return {Number}
 */
function getType( el ) {
    let _v = el[ __typeKey ];

    if ( _v === undefined ) {
        setType( el, (_v = type(el)) );
    }
    return _v;
}


/**
 * 单元克隆（深度）。
 * 包括元素上绑定的事件处理器和类型值。
 * @param  {Element} src 源元素
 * @return {Element} 新元素
 */
function clone( src ) {
    let _new = $.clone( src, true, true, true ),
        _els = $.find( '*', src );

    $.find( '*', _new )
    .forEach(
        (to, i) => setType( to, getType(_els[i]) )
    );
    return setType( _new, getType(src) );
}


/**
 * 填充源码。
 * 会对插入构成的元素节点设置类型值。
 * @param  {Element} box 容器元素
 * @param  {String} html 源码
 * @return {Element} box
 */
function html( box, html ) {
    $.html( box, html );

    $.find( '*', box )
    .forEach( el => setType( el, type(el) ) );

    return box;
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



//
// 扩展&导出。
//////////////////////////////////////////////////////////////////////////////


//
// By扩展：
// New.[cell-name](...)
//
extend( 'New', Content );


export { create };
