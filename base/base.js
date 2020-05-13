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


const $ = window.$;


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
// 方法集。
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取单元类型值。
 * 注：返回null表示非法类型（不支持）。
 * @param  {String} name 单元名
 * @return {Number|null}
 */
function nameType( name ) {
    let _v = +T[ name ];

    if ( isNaN(_v) ) {
        throw new Error(`unsupported element: [${name}].`);
    }
    return _v;
}


/**
 * 获取元素类型值。
 * 仅处理文本节点和元素。
 * @param  {Element|Text} el 目标节点
 * @return {Number}
 */
function getType( el ) {
    if ( el.nodeType === 3 ) {
        return T.$TEXT;
    }
    let _fn = typeStruct[ el.tagName ];

    return _fn ? _fn(el) : nameType( simpleName(el) );
}


/**
 * 获取目标元素的内容。
 * 仅限非空文本节点和内联节点。
 * @param  {Element|Text} el 目标节点
 * @return {[Node]|Node}
 */
function contents( el ) {
    if ( el.nodeType == 3 && el.textContent.trim() ) {
        return el;
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
    return !!( T.Types[tval] & T.EMPTY );
}


/**
 * 是否位置固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isFixed( tval ) {
    return !!( T.Types[tval] & T.EMPTY );
}


/**
 * 是否为表格区段元素。
 * 即：<thead>|<tbody>|<tfoot>
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isTblSect( tval ) {
    return !!( T.Types[tval] & T.TBLSECT );
}


/**
 * 是否为表格单元格。
 * 即：<th>|<td>
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isTblCell( tval ) {
    return !!( T.Types[tval] & T.TBLCELL );
}


/**
 * 是否为定义列表项。
 * 即：<dt>|<dd>
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isDlItem( tval ) {
    return !!( T.Types[tval] & T.DLITEM );
}


/**
 * 是否为普通列表。
 * 即：<ul>|<ol>|...（<li>子元素）。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isList( tval ) {
    return !!( T.Types[tval] & T.LIST );
}


/**
 * 是否为密封单元。
 * 可修改但不可新插入，除非已为空。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isSealed( tval ) {
    return !!( T.Types[tval] & T.SEALED );
}


/**
 * 是否为分级片区（S1-S5）。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isSected( tval ) {
    return !!( T.Types[tval] & T.SECTED );
}


/**
 * 是否为行块单元。
 * 可作为各片区单元的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isBlocks( tval ) {
    return !!( T.Types[tval] & T.BLOCKS );
}


/**
 * 是否为内联单元。
 * 可作为内容元素里的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isInlines( tval ) {
    return !!( T.Types[tval] & T.INLINES );
}


/**
 * 是否为内容元素。
 * 可直接包含文本和内联单元。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isContent( tval ) {
    return !!( T.Types[tval] & T.CONTENT );
}


/**
 * 是否为结构元素。
 * 包含固定逻辑的子元素结构。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isStruct( tval ) {
    return !!( T.Types[tval] & T.STRUCT );
}


/**
 * 是否为特别用途元素。
 * 即：<b>|<i>，用于代码内逻辑封装。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
function isSpecial( tval ) {
    return !!( T.Types[tval] & T.SPECIAL );
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
 * 是否为相同的表格行。
 * @param  {Element} tr1 表格行
 * @param  {Element} tr2 表格行
 * @return {Boolean}
 */
function sameTr( tr1, tr2 ) {
    let _c1 = tr1.cells,
        _c2 = tr2.cells;

    return _c1.length == _c2.length &&
        Array.from(_c1).every( (td, i) => td.nodeName == _c2[i].nodeName );
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
 * 仅限于标签名和role定义名，全大写。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function simpleName( el ) {
    let _role = el.getAttribute('role');
    return (LogicRoles.has(_role) ? _role :  el.tagName).toUpperCase();
}


//
// 导出。
//////////////////////////////////////////////////////////////////////////////

export {
    nameType,
}