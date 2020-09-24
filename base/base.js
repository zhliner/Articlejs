//! $Id: base.js 2020.05.10 Articlejs.Libs $
// +++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	基础方法集。
//
//
///////////////////////////////////////////////////////////////////////////////
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
// 定制结构单元取值。
// 含非独立的中间结构。
// {tagName: function(Element): Number}
//
const CustomStruct = {
    /**
     * 段落判断。
     * - FIGIMGP: 插图子结构（figure/p/img,span）
     * - P: 段落（p）。
     * - NOTE: 注解（p:note）。
     * - TIPS: 提示（p:tips）。
     * 注：插图仅需检查父元素类型即可。
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    P( el ) {
        let _name = name( el );

        return _name === 'P' && el.parentElement.tagName === 'FIGURE' ?
            T.FIGIMGP : T[_name];
    },


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
            return this._liChild(_sub) || T.LI;
        }
        return el.childElementCount === 2 && _sub.tagName === 'H4' ? this._liParent(el.parentElement, _sub) : T.LI;
    },


    /**
     * 小标题。
     * - AH4: 链接小标题（h4/a）：唯一子元素
     * - H4: 普通小标题（h4）
     * 注：AH4 通常用于目录内的父条目（li/h4/a）。
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    H4( el ) {
        return el.childElementCount === 1 && el.firstElementChild.tagName === 'A' ?
            T.AH4 : T.H4
    },


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 从列表项子元素判断取值。
     * 注：兼容<h4>从父元素判断取值。
     * @param  {Element} el 列表项子元素
     * @return {Number}
     */
    _liChild( el ) {
        if ( !el ) return;

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
// - DLITEM  定义列表项：  {<dt>|<dd>}
// - SECTED  分级片区，有严格的嵌套层级，转换时可能需要修改role值。
//
const
    TBLCELL = Symbol( 'tblcell' ),      // 表格单元元件
    DLITEM  = Symbol( 'dlitem' ),       // 定义列表项
    SECTED  = Symbol( 'sections' ),     // 分级片区单元
    XLIST   = Symbol( 'normal-list'),   // 列表
    XBLOCK  = Symbol( 'small-block'),   // 小区块
    XCODES  = Symbol( 'code-block');    // 行块代码


//
// 兼容类型定义。
// - 视为同类单元可在平级位置插入。
// - 可原地相互转换。
// 注记：
// 原地转换通常由上下文菜单激发。
//
const Compatible = {
    // 快速平级插入
    [ T.DT ]:       DLITEM,
    [ T.DD ]:       DLITEM,

    // 简单转换
    [ T.TH ]:       TBLCELL,
    [ T.TD ]:       TBLCELL,

    // 片区转移
    // 相同标签结构，修正层级（role）即可。
    [ T.S1 ]:       SECTED,
    [ T.S2 ]:       SECTED,
    [ T.S3 ]:       SECTED,
    [ T.S4 ]:       SECTED,
    [ T.S5 ]:       SECTED,

    // 小区块转换
    // 结构相似：小标题加段落内容集。
    [ T.BLOCKQUOTE ]:   XBLOCK,
    [ T.ASIDE ]:        XBLOCK,
    [ T.DETAILS ]:      XBLOCK,

    // 行块代码转换
    // 虽然标签结构迥异，但外观逻辑相似。
    [ T.CODELIST ]:     XCODES,
    [ T.CODEBLOCK ]:    XCODES,

    // 列表转换
    // 根级改变或递进处理（级联编号表时）。
    [ T.UL ]:       XLIST,
    [ T.OL ]:       XLIST,
    [ T.ULX ]:      XLIST,
    [ T.OLX ]:      XLIST,
    [ T.CASCADE ]:  XLIST, // 递进处理
};


//
// 兼容类型转换处理器。
// 将源单元转换到目标单元。
//
const compatibleConvert = {
    /**
     * 片区转换。
     * 将源片区转换为正确的层级，调整包含所有的子片区。
     * 子片区层级超过s5时，移除role值。
     * @param  {Element} src 源片区
     * @param  {Number} n 目标层级（1-5）
     * @return {Element} 修改后的源片区
     */
    [ T.SECTED ]: function( src, n ) {
        //
    },
};


//
// 兼容类型移动处理器。
// 少部分需要根据目标位置执行转换。
// 未定义者可直接移动到目标位置。
//
const compatibleMovement = {
    //
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
    if ( el.namespaceURI === __svgNS ) {
        return el.tagName === 'svg' ? T.SVG : T.SVGITEM;
    }
    let _fn = CustomStruct[ el.tagName ];

    return _fn ? _fn(el) : nameType( name(el) );
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
    let _val = getType(beg);

    if ( !T.isInlines(_val) ) {
        // 容错部分定制结构：
        // 如：CODELI/code, FIGIMGP/img
        // 由内联上溯而来，但到此却非内容元素。
        return T.isContent(_val) ? beg : entityRoot( beg, end );
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
 * 获取章节标识名（s1-s5）。
 * @param  {String} sx 章节名（role）
 * @param  {Number} n 增减层级
 * @return {String|false}
 */
function sectionRole( sx, n ) {
    n = +sx.substring(1) + n;
    return n > 0 && n < 6 && `s${n}`;
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
 * 判断元素是否可正常删除。
 * @param {Element} el 目标元素
 */
export function canDelete( el ) {
    let _tv = getType( el );
    return T.isBlocks( _tv ) || T.isInlines( _tv ) || T.isStructX( _tv );
}


/**
 * 是否可以内容文本化。
 * - 允许内容元素。
 * - 允许非单结构的内联元素（无害），如对<ruby>解构。
 * @param  {Element} el 容器元素
 * @return {Boolean}
 */
export function canTotext( el ) {
    let _tv = getType( el );
    return T.isContent( _tv ) || ( T.isInlines(_tv) && !T.isEmpty(_tv) );
}


/**
 * 是否可以内容提升。
 * 专用：Edit.unWrap 操作。
 * 宽容：
 * 应当允许纯内容的元素向上展开，即便不是内容元素，
 * 如编辑过程中的破坏性操作（如<ruby>）。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
export function canUnwrap( el ) {
    return isContent( el.parentElement ) &&
        (
            isContent( el ) ||
            // 宽容：纯内容元素
            ( el.childElementCount === 0 && el.innerText.trim() )
        );
}


/**
 * 是否为代码的合法内容。
 * @param  {[Node]} nodes 节点集
 * @return {Boolean}
 */
export function isCodeCons( nodes ) {
    return nodes.every(
        nd => nd.nodeType === 3 || T.isSpecial( getType(nd) )
    );
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
 * 所以单元格都为<th>。
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
    return __tablePool.get(tbl) || __tablePool.set( tbl, $.table(tbl) ).get( tbl )
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
 * - 起点为行块根时，无行为（返回null）。
 * 注：
 * 这是一种用户友好，以便直达内容行元素或单元根。
 *
 * @param  {Element} beg 起点元素
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
 * 会递进提取子章节的内容。
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
 * 章节层级修改。
 * - 修改 role 特性值。
 * - 移除元素的类型值。
 * 注记：
 * 移除类型值以简化处理，避免撤销重做的复杂性。
 * @param  {Element} sec 章节元素
 * @param  {Number} n 增减层级数
 * @return {Element} sec
 */
export function sectionChange( sec, n ) {
    let _sx = sectionRole( $.attr(sec, 'role'), n );

    if ( !_sx ) {
        throw new Error( 'invalid section level.' );
    }
    return Reflect.deleteProperty( $.attr(sec, 'role', _sx), __typeKey );
}
