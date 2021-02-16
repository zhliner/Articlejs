//! $Id: base.js 2020.05.10 Articlejs.Libs $
// +++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基础方法集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

//
// 注意：
// ./types.js 中引用了本模块中的 getType() 方法，
// 因此本模块应当先于 ./types.js 加载。
//
import * as T from "./types.js";


const
    $ = window.$,

    // 类型值存储键。
    // 数值的类型存储在元素对象上。
    __typeKey = Symbol('type-value'),

    // SVG系名称空间。
    __svgNS = 'http://www.w3.org/2000/svg',

    // 表格实例缓存。
    // { Element: $.Table }
    __tablePool = new WeakMap();



//
// 逻辑单元名。
// 用于判断role值是否为正式的逻辑单元名。
//
const LogicRoles = new Set([
    'abstract',
    'toc',
    'seealso',
    'reference',
    's1',
    's2',
    's3',
    's4',
    's5',
    'codelist',
    'ulx',
    'olx',
    'cascade',
    'codeblock',
    'note',
    'tips',
    'blank',
    'orz',
    'space',
    'explain',
]);


//
// 唯一子结构成员。
// 较为宽松的约束（不含大部分小标题）。
//
const OnlyChild = new Set([
    T.THEAD,
    T.TFOOT,
    T.H1,
    T.SUMMARY,
    T.ABSTRACT,
    T.TOC,
    T.TOCCASCADE,
    T.REFERENCE,
    T.ARTICLE,
    T.EXPLAIN,
]);


//
// 定制结构单元取值。
// 含非独立的中间结构。
// {tagName: function(Element): Number}
//
const CustomStruct = {
    /**
     * 多种列表项判断。
     * - CODELI: 代码表条目（li/code）：唯一子元素
     * - ALI: 目录表普通条目（li/a）：唯一子元素
     * - XH4LI: 无序级联表项标题（li/h4, ol|ul）
     * - CASCADEH4LI: 级联编号表项标题（li/h4, ol）
     * - CASCADEAH4LI: 目录表标题条目（li/[h4/a], ol）
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    LI( el ) {
        let _sub = el.firstElementChild;

        if ( el.childElementCount <= 1 ) {
            return this._liChild( _sub ) || T.LI;
        }
        return el.childElementCount === 2 && _sub.tagName === 'H4' ? this._liParent(el.parentElement, _sub) : T.LI;
    },


    /**
     * 副标题&块标题。
     * 存在于<hgroup>内为副标题。
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    H3( el ) {
        return el.parentElement.tagName === 'HGROUP' ? T.H3X : T.H3;
    },


    /**
     * 列表项小标题。
     * - AH4: 链接列表项标题（h4/a）：唯一子元素
     * - H4: 普通列表项标题（h4）
     * 注：AH4 通常用于目录内的父条目（li/h4/a）。
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    H4( el ) {
        let _sub = el.firstElementChild;

        return el.childElementCount === 1 && _sub.tagName === 'A' && $.siblingNodes(_sub).length === 0 ?
            T.AH4 : T.H4
    },


    /**
     * 仅两种可能：
     * - SPACE 空白。
     * - FIGIMGBOX 插图子结构（figure/span/img, i:explain）
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    SPAN( el ) {
        return el.parentElement.tagName === 'FIGURE' ? T.FIGIMGBOX : T.SPACE
    },


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 从列表项子元素判断取值。
     * 注：兼容<h4>从父元素判断取值。
     * @param  {Element} el 列表项子元素
     * @return {Number}
     */
    _liChild( el ) {
        if ( !el || $.siblingNodes(el).length ) {
            return;
        }
        switch ( el.tagName ) {
            case 'CODE':
                return T.CODELI;
            case 'A':
                return T.ALI;
        }
    },


    /**
     * 从父元素判断列表项值。
     * - 无序级联表小标题
     * - 有序级联表小标题
     * - 级联编号表小标题
     * - 级联编号表链接小标题
     * - 普通列表项（默认）
     * @param  {Element} el 列表元素
     * @param  {Element} h4 小标题元素
     * @return {Number}
     */
    _liParent( el, h4 ) {
        let _nxt = h4.nextElementSibling;

        if ( _nxt.tagName !== 'OL' && _nxt.tagName !== 'UL' ) {
            return T.LI;
        }
        switch ( name(listRoot(el)) ) {
            case 'ULX':
            case 'OLX':
                return T.XH4LI;
            case 'CASCADE':
                return this.H4( h4 ) === T.AH4 ? T.CASCADEAH4LI : T.CASCADEH4LI;
        }
        return T.LI;
    },

};


//
// 兼容类型标记：
// 用于简单判断并同级插入（可能需要微调），
// 或者单元自身的类型转换。
// - TBLSECT 表格区段元件：{<thead>|<tbody>|<tfoot>}
// - TBLCELL 表格单元元件：{<th>|<td>}
// - DLITEM  描述列表项：  {<dt>|<dd>}
// - SECTED  分级片区，有严格的嵌套层级，转换时可能需要修改role值。
//
const
    NORMALLIST  = Symbol( 'normal-list'),    // 普通列表
    SMALLBLOCK  = Symbol( 'small-block'),    // 普通小区块
    BCODEITEM   = Symbol( 'blockcode-item'); // 块代码条目


//
// 兼容行块定义。
// 可简单合并，取子单元直接插入。
//
const Compatibles = {
    [ T.HEADER ]:       SMALLBLOCK,
    [ T.FOOTER ]:       SMALLBLOCK,
    [ T.BLOCKQUOTE ]:   SMALLBLOCK,
    [ T.ASIDE ]:        SMALLBLOCK,
    [ T.DETAILS ]:      SMALLBLOCK,

    [ T.CODELI ]:       BCODEITEM,
    [ T.CODEBLOCK ]:    BCODEITEM,

    [ T.UL ]:           NORMALLIST,
    [ T.OL ]:           NORMALLIST,
    [ T.ULX ]:          NORMALLIST,
    [ T.OLX ]:          NORMALLIST,
    [ T.CASCADE ]:      NORMALLIST,
};


//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取单元名称。
 * 仅限于标签名和role定义名。
 * @param  {Element} el 目标元素
 * @return {String} 名称，全大写
 */
function name( el ) {
    let _role = el.getAttribute('role');
    return (LogicRoles.has(_role) ? _role :  el.tagName).toUpperCase();
}


/**
 * 单元名称对应类型值。
 * @param  {String} name 单元名
 * @return {Number}
 */
function nameType( name ) {
    let _v = +T[ name ];

    if ( isNaN(_v) ) {
        // 注记：
        // 可能用弹出框询问操作方式（允许|取消）。
        throw new Error(`unsupported type: [${name}].`);
    }
    return _v;
}


/**
 * 分析节点类型值。
 * 仅处理文本节点和元素。
 * @param  {Element|Text} el 目标节点
 * @return {Number} 类型值
 */
function parseType( el ) {
    if ( el.nodeType === 3 ) {
        return T.$TEXT;
    }
    if ( el.nodeType !== 1 ) {
        return null;
    }
    let _tag = el.tagName;

    if ( el.namespaceURI === __svgNS ) {
        return _tag === 'svg' ? T.SVG : T.SVGITEM;
    }
    return CustomStruct[_tag] ? CustomStruct[_tag](el) : nameType( name(el) );
}


/**
 * 获取列表根元素。
 * 处理包含3种级联表类型。
 * @param  {Element} el 起点列表
 * @return {<ol>|<ul>}
 */
function listRoot( el ) {
    let _li = el.parentElement;
    return _li.tagName !== 'LI' ? el : listRoot( _li.parentElement );
}


/**
 * 计算表格行逻辑列数。
 * @param  {Element} tr 表格行元素
 * @return {Number} 列数
 */
function columnCells( tr ) {
    return [ ...tr.cells ].reduce( (n, td) => n + td.colSpan, 0 );
}


/**
 * 向上获取首个内容行。
 * 向上找到首个非内联的内容元素即可。
 * 注：包含单元格和插图讲解等。
 * @param  {Element} beg 起点元素
 * @param  {Element} end 终点限定元素
 * @return {Element|null} 内容行元素
 */
function contentRoot( beg, end ) {
    if ( beg === end ) {
        return null;
    }
    let _tv = getType( beg );

    if ( !T.isInlines(_tv) ) {
        // 容错定制结构：
        // 如：CODELI/code, FIGIMGBOX/img 子单元为内联，但父容器非内容元素。
        // 因此转为单元根获取。
        return T.isContent(_tv) ? beg : entityRoot( beg, end );
    }
    return contentRoot( beg.parentElement );
}


/**
 * 向上获取单元根元素。
 * 完整单元指内联或行块两种逻辑独立的单元。
 * @param  {Element} beg 起点元素
 * @param  {Element} end 终点限定元素
 * @return {Element|null} 根元素
 */
function entityRoot( beg, end ) {
    if ( beg === end ) {
        return null;
    }
    if ( isEntity(beg) ) {
        return beg;
    }
    return entityRoot( beg.parentElement );
}


/**
 * 是否为代码内容。
 * 需要检查内部嵌套的子节点。
 * @param  {Node|Fragment} node 待检查节点
 * @param  {Set} subs 合法类型集
 * @return {Boolean}
 */
function isCodeCon( node, subs ) {
    return $.find( '*', node, true )
        .every( nd => subs.has(getType(nd)) );
}


/**
 * 获取元素内的内容容器。
 * 如果初始传入一个文本节点，会返回null（不能作为内容容器使用）。
 * 注：会忽略混嵌的文本节点。
 * @param  {Element} el 目标元素
 * @return {[Element]|Element|null}
 */
function _contentBoxes( el ) {
    if ( el.nodeType == 3 ) {
        return null;
    }
    if ( isContent(el) ) {
        return el;
    }
    return $.children(el).map( el => _contentBoxes(el) ).flat();
}


/**
 * 找到首个不同类型的元素。
 * @param  {Element} ref 参考元素
 * @param  {[Element]} els 测试元素集
 * @return {Element}
 */
function _typeNoit( ref, els ) {
    let _tv = getType( ref );

    for ( const el of els ) {
        if ( _tv !== getType(el) ) return el;
    }
    return null;
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 提取节点类型值。
 * 如果值未知，即时分析获取并存储。
 * 注记：
 * 返回 $TEXT 是有意义的，可用于合法子单元判断。
 * @param  {Node} el 目标节点
 * @return {Number}
 */
export function getType( el ) {
    if ( el.nodeType === 3 ) {
        return T.$TEXT;
    }
    let _v = el[ __typeKey ];

    if ( _v === undefined ) {
        setType( el, (_v = parseType(el)) );
    }
    return _v;
}


/**
 * 存储元素类型值。
 * 注：用一个Symbol键存储在元素对象上，非枚举。
 * @param  {Element} el 目标元素
 * @param  {Number} tval 类型值
 * @return {Element} el
 */
export function setType( el, tval ) {
    Reflect.defineProperty(el, __typeKey, {
        value: tval,
        enumerable: false,
        // 可移除
        configurable: true,
    });
    return el;
}


/**
 * 单元克隆（深度）。
 * 包括元素上绑定的事件处理器和类型值。
 * @param  {Element} src 源元素
 * @return {Element} 新元素
 */
export function cloneElement( src ) {
    let _new = $.clone( src, true, true, true ),
        _els = $.find( '*', src );

    $.find( '*', _new )
    .forEach(
        (to, i) => setType( to, getType(_els[i]) )
    );
    return setType( _new, getType(src) );
}


/**
 * 源码填充。
 * 会对插入构成的元素节点设置类型值。
 * @param  {Element} box 容器元素
 * @param  {String} html 源码
 * @return {Element} box
 */
export function htmlFill( box, html ) {
    $.html( box, html );

    $.find( '*', box )
    .forEach( el => setType( el, parseType(el) ) );

    return box;
}


/**
 * 获取目标元素的内容。
 * 仅限内联节点和非空文本节点。
 * 注记：$.contents()会滤除空文本和注释节点。
 * @param  {Element} el 目标元素
 * @return {[Node]} 节点集
 */
export function contents( el ) {
    if ( isInlines(el) ) {
        return [ el ];
    }
    return $.contents( el )
        .map( nd => nd.nodeType === 1 ? contents(nd) : nd )
        .flat();
}


/**
 * 是否为单标签元素。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isEmpty( el ) {
    return T.isEmpty( getType(el) );
}


/**
 * 是否为内容元素。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isInlines( el ) {
    return T.isInlines( getType(el) );
}


/**
 * 是否为内容元素。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isBlocks( el ) {
    return T.isBlocks( getType(el) );
}


/**
 * 是否为内容元素。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isContent( el ) {
    return T.isContent( getType(el) );
}


/**
 * 是否为完整逻辑单元。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isEntity( el ) {
    let _tv = getType( el );
    return T.isBlocks( _tv ) || T.isInlines( _tv );
}


/**
 * 是否向前固定。
 * 新的内容不可插入其前。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function beforeFixed( el ) {
    return T.isFixed1( getType(el) );
}


/**
 * 是否向后固定。
 * 新的内容不可插入其后。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function afterFixed( el ) {
    return T.isFixed2( getType(el) );
}


/**
 * 是否为固定（不可移动）。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isFixed( el ) {
    let _tv = getType( el );
    return T.isFixed1( _tv ) || T.isFixed2( _tv );
}


/**
 * 是否为章节片区元素（s1-s5）。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function isChapter( el ) {
    let _tv = getType( el );
    return _tv >= T.S1 && _tv <= T.S5;
}


/**
 * 是否为代码的合法内容。
 * @param  {[Node]|Node} nodes 节点集
 * @return {Boolean}
 */
export function isCodeCons( nodes ) {
    let _subs = T.childTypes( T.CODE );

    if ( $.isArray(nodes) ) {
        return nodes.every( nd => isCodeCon(nd, _subs) );
    }
    return isCodeCon( nodes, _subs );
}


/**
 * 是否为块内代码。
 * 即代码元素是否包含在代码块和代码表单元内。
 * @param  {Element} code 代码元素
 * @return {Boolean}
 */
export function isBlockCode( code ) {
    let _pe = code.parentElement,
        _tv = getType( _pe );

    return _tv === T.CODEBLOCK || _tv === T.CODELI;
}


/**
 * 是否仅为一个成员。
 * 严格排他性子结构（如<thead>、<h1>等）。
 * 主要用于判断是否可原地克隆。
 * 注记：
 * 出于编辑的灵活性，大部分的标题允许重复。
 * @param {Element} el 目标元素
 */
export function isOnly( el ) {
    return OnlyChild.has( getType(el) );
}


/**
 * 是否为合法表格行。
 * 列数相同即可，不要求逐列同类。
 * @param  {Element} tr 目标表格行
 * @param  {$.Table} tbo 表格类实例
 * @return {Boolean}
 */
export function isValidTR( tr, tbo ) {
    return columnCells( tr ) === tbo.cols();
}


/**
 * 是否可为表头行。
 * 所有单元格都为<th>。
 * @param  {Element} tr 表格行元素
 * @return {Boolean}
 */
export function isHeadTR( tr ) {
    return [ ...tr.cells ].every( c => c.tagName === 'TH' );
}


/**
 * 缓存/检索表格实例。
 * 如果tbo有值，表示仅存储。
 * 容错没有主动缓存的表格实例，即时解析（应当非空<table>）。
 * @param  {Element} tbl 表格元素
 * @param  {$.Table} 表格实例
 * @return {Table|null}
 */
export function tableObj( tbl, tbo ) {
    if ( tbo ) {
        return __tablePool.set( tbl, tbo );
    }
    return __tablePool.get(tbl) || __tablePool.set( tbl, $.table(tbl) ).get( tbl );
}


/**
 * 获取所属表格元素。
 * @param  {Element} el 表格子级元素
 * @return {Element} <table>
 */
export function tableNode( el ) {
    switch ( el.tagName ) {
        case 'TR':
            return el.parentElement.parentElement;
        case 'TBODY':
        case 'THEAD':
        case 'TFOOT':
        case 'CAPTION':
            return el.parentElement;
        case 'TH':
        case 'TD':
            return el.parentElement.parentElement.parentElement;
        case 'TABLE':
            return el;
    }
    throw new Error( 'not in table element.' );
}


/**
 * 获取元素内的内容根容器。
 * 始终会返回一个数组（可能为空）。
 * @param  {Element} el 目标元素
 * @return {[Element]}
 */
export function contentBoxes( el ) {
    let _els = _contentBoxes(el);

    if ( !_els ) {
        return [];
    }
    return $.isArray(_els) ? _els : [_els];
}


/**
 * 获取元素虚拟根容器。
 * 即当用于执行Top选取操作时的目标元素。
 * - 起点为内联元素时，向上获取内容行元素。
 * - 起点为结构子时，向上获取单元根元素（内联或行块）。
 * - 起点为行块根时，向上获取最近上级根。
 * - 起点为特用单元时（<b|i>），向上获取代码元素。
 * 注：
 * 这是一种用户友好，以便直达内容行元素或单元根。
 *
 * @param  {Element} beg 起始节点
 * @param  {Element} end 终点限定元素
 * @return {Element} 顶元素
 */
export function virtualBox( beg, end ) {
    if ( isInlines(beg) ) {
        return contentRoot( beg.parentElement, end );
    }
    return entityRoot( beg.parentElement, end );
}


/**
 * 获取章节的内容。
 * 会递进提取全部子章节的内容。
 * @param  {Element} root 章节根元素
 * @return {[Element]} 行块单元集
 */
export function sectionContents( root ) {
    let _buf = [];

    for ( const el of root.children ) {
        if ( el.tagName !== 'SECTION' ) {
            _buf.push( el );
        } else {
            _buf.push( ...sectionContents(el) );
        }
    }
    return _buf;
}


/**
 * 计算章节层级。
 * @param  {Element} el 章节元素
 * @return {Number}
 */
export function sectionLevel( el ) {
    let _sx = $.attr( el, 'role' );

    if ( _sx ) {
        return +_sx.substring(1);
    }
    if ( !el.parentElement ) {
        return 6;
    }
    return $.parentsUntil( el, 'section[role=s5]' ).length + 6;
}


/**
 * 章节层级修改。
 * - 修改 role 特性值，超出层级的深片区无role特性。
 * - 移除元素的类型值（简化处理，避免Undo/Redo的复杂性）。
 * 返回false表示超过顶层章节（无修改）。
 * @param  {Element} sec 章节元素
 * @param  {Number} n 增减层级数
 * @return {void|false}
 */
export function sectionChange( sec, n ) {
    n += sectionLevel( sec );
    let _v = n < 6 ? `s${n}` : null;

    if ( n === 0 ) {
        return false;
    }
    Reflect.deleteProperty( $.attr(sec, 'role', _v), __typeKey );
}


/**
 * 检查章节内容状态。
 * 返回值：{
 *      0   仅包含通用项（h2, header, footer, hr）
 *      1   除通用项外，纯内容件
 *      2   除通用项外，纯子片区
 *      3   子片区和内容件混杂状态
 * }
 * @param  {Element} sec 章节/片区元素
 * @return {Number} 状态码
 */
export function sectionState( sec ) {
    let _els = $.not( $.children(sec), 'h2,header,footer,hr' ),
        _ses = $.filter( _els, 'section' );

    // 未定
    if ( !_els.length ) return 0;
    // 纯内容件
    if ( !_ses.length ) return 1;
    // 纯片区
    if ( _els.length === _ses.length ) return 2;
    // 混杂
    return 3;
}


/**
 * 是否为兼容集合。
 * 相同类型的元素为兼容（不含表格）。
 * 注：兼容指内容可以合并。
 * @param  {Number} ref 目标参考类型
 * @param  {[Number]} tvs 元素类型值集
 * @return {Boolean}
 */
export function isCompatibled( ref, tvs ) {
    let _ctv = Compatibles[ref];

    if ( _ctv === undefined ) {
        return !T.isEmpty(ref) &&
            !T.isSealed(ref) &&
            tvs.every( tv => tv === ref );
    }
    return tvs.every( tv => _ctv === Compatibles[tv] );
}


/**
 * 找到首个与ref不兼容元素。
 * 如果没有兼容定义，则必需为相同类型（不含表格）。
 * @param  {Element} ref 参考元素
 * @param  {[Element]} els 元素集
 * @return {Element|null}
 */
export function compatibleNoit( ref, els ) {
    let _ctv = Compatibles[ getType(ref) ];

    if ( _ctv === undefined ) {
        return _typeNoit( ref, els );
    }
    for ( const el of els ) {
        if ( _ctv !== Compatibles[getType(el)] ) return el;
    }
    return null;
}
