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

    // SVG系名称空间。
    __svgNS = 'http://www.w3.org/2000/svg',

    // 表格实例缓存。
    // { Element: $.Table }
    __tablePool = new WeakMap();


//
// 内联元素集。
// 用于提取内容时判断是否为内联单元。
//
const InlineTags = new Set([
    'AUDIO',
    'VIDEO',
    'PICTURE',
    'A',
    'STRONG',
    'EM',
    'Q',
    'ABBR',
    'CITE',
    'SMALL',
    'TIME',
    'DEL',
    'INS',
    'SUB',
    'SUP',
    'MARK',
    'CODE',
    'RUBY',
    'DFN',
    'SAMP',
    'KBD',
    'S',
    'U',
    'VAR',
    'BDO',
    'METER',
    'IMG',
    'BR',
    'WBR',
    'SPAN',
    'B',
    'I',
    'svg',  // 小写
]);


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
const typeStruct = {
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
        let name = simpleName( el );

        return name === 'P' && el.parentElement.tagName === 'FIGURE' ?
            T.FIGIMGP : T[name];
    },


    /**
     * 多种列表项判断。
     * - CODELI: 代码表条目（li/code）：唯一子元素
     * - ALI: 目录表普通条目（li/a）：唯一子元素
     * - AH4LI: 目录表标题条目（li/h4/a）：唯一子单元
     * - ULXH4LI: 无序级联表项标题（li/h4, ol|ul）
     * - OLXH4LI: 有序级联表项标题（li/h4, ul|ol）
     * - CASCADEH4LI: 级联编号表项标题（li/h4, ol）
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    LI( el ) {
        let _sub = el.firstElementChild;

        if ( el.childElementCount <= 1 ) {
            return this._liChild(_sub) || T.LI;
        }
        return el.childElementCount === 2 && _sub.tagName === 'H4' ? this._liParent(el.parentElement) : T.LI;
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
     * @param  {Element} li 列表项元素
     * @return {Number}
     */
    _liChild( el, li ) {
        if ( el ) {
            switch (el.tagName) {
            case 'CODE':
                return T.CODELI;
            case 'A':
                return T.ALI;
            case 'H4':
                return this.H4(el) === T.AH4 ? T.AH4LI : this._liParent(li.parentElement);
            }
        }
    },


    /**
     * 从父元素判断列表项值。
     * - 无序级联表项
     * - 有序级联表项
     * - 级联编号表项
     * - 普通列表项（默认）
     * @param  {Element} el 列表元素
     * @return {Number}
     */
    _liParent( el ) {
        switch ( simpleName(listRoot(el)) ) {
            case 'ULX':
                return T.ULXH4LI;
            case 'OLX':
                return T.OLXH4LI;
            case 'CASCADE':
                return T.CASCADEH4LI;
        }
        return T.LI;
    },

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
// 方法集。
//////////////////////////////////////////////////////////////////////////////


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
function type( el ) {
    if ( el.nodeType === 3 ) {
        return T.$TEXT;
    }
    if ( el.namespaceURI === __svgNS ) {
        return el.tagName === 'svg' ? T.SVG : T.SVGITEM;
    }
    let _fn = typeStruct[ el.tagName ];

    return _fn ? _fn(el) : nameType( simpleName(el) );
}


/**
 * 获取目标元素的内容。
 * 仅限内联节点和非空文本节点。
 * 如果初始即传入一个空文本节点，会返回null。
 * @param  {Element|Text} el 目标节点
 * @return {[Node]|Node|null}
 */
function contents( el ) {
    if ( el.nodeType == 3 ) {
        return el.textContent.trim() ? el : null;
    }
    if ( InlineTags.has(el.tagName) ) {
        return el;
    }
    return $.contents(el).map( nd => contents(nd) ).flat();
}


/**
 * 是否为合法子单元。
 * @param  {Number} sub 测试目标
 * @param  {Number} box 容器单元
 * @return {Boolean}
 */
function inSubs( sub, box ) {
    return T.ChildTypes[ box ].includes( sub );
}


/**
 * 是否为空元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isEmpty( tval ) {
    return !!( T.Specials[tval] & T.EMPTY );
}


/**
 * 是否位置固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isFixed( tval ) {
    return !!( T.Specials[tval] & T.FIXED );
}


/**
 * 是否为密封单元。
 * 可修改但不可新插入，除非已为空。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isSealed( tval ) {
    return !!( T.Specials[tval] & T.SEALED );
}


/**
 * 是否为行块单元。
 * 可作为各片区单元的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isBlocks( tval ) {
    return !!( T.Specials[tval] & T.BLOCKS );
}


/**
 * 是否为内联单元。
 * 可作为内容元素里的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isInlines( tval ) {
    return !!( T.Specials[tval] & T.INLINES );
}


/**
 * 是否为内容元素。
 * 可直接包含文本和内联单元。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isContent( tval ) {
    return !!( T.Specials[tval] & T.CONTENT );
}


/**
 * 是否为结构容器。
 * 包含固定逻辑的子元素结构。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isStruct( tval ) {
    return !!( T.Specials[tval] & T.STRUCT );
}


/**
 * 是否为结构子单元。
 * 自身为结构容器元素内的子元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isStructX( tval ) {
    return !!( T.Specials[tval] & T.STRUCTX );
}


/**
 * 是否为特别用途元素。
 * 即：<b>|<i>，用于代码内逻辑封装。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isSpecial( tval ) {
    return !!( T.Specials[tval] & T.SPECIAL );
}


/**
 * 缓存/检索表格实例。
 * 如果传递元素，则为检索，否则为设置。
 * @param  {Element|Table} tbl 表格元素或$.Table实例
 * @return {Table|void}
 */
function tableObj( tbl ) {
    if ( tbl.nodeType ) {
        let _tbo = __tablePool.get(tbl);

        if ( !_tbo ) {
            __tablePool.set( tbl, new $.Table(tbl) );
        }
        return _tbo;
    }
    __tablePool.set( tbl.element(), tbl );
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
 * 获取元素选取根。
 * 即当用于执行Top选取操作时的目标元素。
 * - 起点为内联元素时，向上获取内容行元素。
 * - 起点为结构子时，向上获取单元根元素（内联或行块）。
 * - 起点为行块根时，无行为（返回null）。
 * 注：
 * 这是一种用户友好，以便直达内容行元素或单元根。
 *
 * @param  {Element} beg 起点元素
 * @return {Element} 顶元素
 */
function selectRoot( beg ) {
    let _tv = getType( beg );

    if ( isInlines(_tv) ) {
        return parentContent( beg );
    }
    if ( isStructX(_tv) ) {
        return parentRoot( beg );
    }
    return null;
}


/**
 * 获取错误提示。
 * 友好的错误提示和详细帮助链接。
 * @param  {Number} hid 帮助ID
 * @return {[String, String]} [msg, link]
 */
function errorMsg( hid ) {
    //
}


//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////

/**
 * 简单获取单元名称。
 * 仅限于标签名和role定义名。
 * @param  {Element} el 目标元素
 * @return {String} 名称，全大写
 */
function simpleName( el ) {
    let _role = el.getAttribute('role');
    return (LogicRoles.has(_role) ? _role :  el.tagName).toUpperCase();
}


/**
 * 是否为同类表格行。
 * 检查表格行所属表格Table实例的列头和列数，
 * 以及所属表格片区类型是否相同。
 * @param  {Element} tr1 表格行
 * @param  {Element} tr2 表格行
 * @return {Boolean}
 */
function sameTr( tr1, tr2 ) {
    let _s1 = tr1.parentElement,
        _s2 = tr2.parentElement;

    return _s1.tagName == _s2.tagName &&
        alikeTable( _s1.parentElement, _s2.parentElement );
}


/**
 * 是否为同规格的表格。
 * 即：列数相同且列头位置相同。
 * @param {Element} t1 表格1
 * @param {Element} t2 表格2
 */
function alikeTable( t1, t2 ) {
    let _t1 = tableObj( t1 ),
        _t2 = tableObj( t2 );

    return _t1.columns() == _t2.columns() && _t1.vth() == _t2.vth();
}


/**
 * 向上获取首个内容行。
 * 特例：
 * 单元格属于其内部节点的内容行元素。
 *
 * @param  {Element} beg 起点元素
 * @return {Element} 内容行元素
 */
function parentContent( beg ) {
    //
}


/**
 * 向上获取单元根元素。
 * 完整单元指内联或行块两种逻辑独立的单元。
 * @param  {Element} beg 起点元素
 * @return {Element} 根元素
 */
function parentRoot( beg ) {
    //
}


//
// 导出。
//////////////////////////////////////////////////////////////////////////////

export {
    type,
    nameType,
    tableObj,
    selectRoot,
}