//! $Id: base.js 2020.05.10 Articlejs.Libs $
// +++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	基本方法库。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import * as T from "./types.js";


const $ = window.$;


//
// 内联元素集。
// 可用于提取内容时判断是否为内联单元。
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
// 逻辑内容单元名
// 用于判断role值是否为逻辑单元名。
// 注：全小写。
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
//
const typeStruct = {
    /**
     * 段落判断。
     * - 插图：figure/p/img,span
     * - 段落（p）。
     * - 注解（p:note）。
     * - 提示（p:tips）。
     * 注：插图仅需检查父元素类型即可。
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    P( el ) {
        let name = getName( el );

        return name === 'P' && el.parentElement.tagName === 'FIGURE' ?
            T.FIGIMGP : T[name];
    },


    /**
     * 多种列表项判断。
     * - 代码表条目（li/code）：唯一子元素
     * - 目录表普通条目（li/a）：唯一子元素
     * - 目录表标题条目（li/h4/a）：唯一子单元
     * - 无序级联表项标题（li/h4, ol|ul）
     * - 有序级联表项标题（li/h4, ul|ol）
     * - 级联编号表项标题（li/h4, ol）
     * @param  {Element} el 当前元素
     * @return {Number} 单元值
     */
    LI( el ) {
        let _sub = el.firstElementChild;

        if ( el.childElementCount === 1 ) {
            return this._liChild(_sub) || T.LI;
        }
        return el.childElementCount === 2 && _sub.tagName === 'H4' ? this._liParent(el.parentElement) : T.LI;
    },


    /**
     * 链接小标题。
     * 结构：h4/a。唯一子元素<a>。
     * 注：通常指目录内的父条目（li/h4/a）。
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
        switch (el.tagName) {
            case 'CODE':
                return T.CODELI;
            case 'A':
                return T.ALI;
            case 'H4':
                return this.H4(el) === T.AH4 ? T.AH4LI : this._liParent(li.parentElement);
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
        switch ( getName(listRoot(el)) ) {
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
 * 获取元素类型值。
 * 注：仅处理文本节点和元素。
 * @param  {Element|Text} el 目标节点
 * @return {Number}
 */
function getType( el ) {
    if ( el.nodeType == 3 ) {
        return T.$TEXT;
    }
    // ...
}


/**
 * 获取元素名称。
 * 全大写，兼容role合法名称。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function getName( el ) {
    let _role = el.getAttribute('role');
    return (LogicRoles.has(_role) ? _role :  el.tagName).toUpperCase();
}


/**
 * 获取目标元素的内容。
 * 仅限非空文本节点和内联节点。
 * @param  {Element|Text} el 目标节点
 * @return {[Node]|Node}
 */
function inlineContents( el ) {
    if ( el.nodeType == 3 && el.textContent.trim() ) {
        return el;
    }
    if ( InlineTags.has(el.tagName) ) {
        return el;
    }
    return $.contents(el).map( nd => inlineContents(nd) ).flat();
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
 * 测试并返回<li>支持的几种类型。
 * @param  {Element} li 列表项元素
 * @return {String} Codeli|Cascadeli|Li
 */
function customLi( li ) {
    // codelist: li/code/
    if ( isCodeli(li) ) return 'Codeli';

    // cascade: li/h5, ol/
    if ( isCascadeli(li) ) return 'Cascadeli';

    if ( isTocItem(li) ) return 'Ali';

    return 'Li';
}


/**
 * 测试并返回<h5>支持的两种类型。
 * @param {Element} h5 标题元素
 */
function customH5( h5 ) {
    return isH5a( h5 ) ? 'H5a' : 'H5';
}


/**
 * 转为首字母大写。
 * @param  {String} name 名称串
 * @return {String}
 */
function camelCase( name ) {
    return name[0].toUpperCase() + name.substring(1);
}


/**
 * 获取级联表根元素。
 * @param  {Element} li 起点元素
 * @return {<ul>|<ol>}
 */
function cascadeRoot( el ) {
    let _prev = el;

    while ( el ) {
        let _n = el.nodeName.toLowerCase();
        if ( _n != 'ol' && _n != 'li' ) {
            break;
        }
        _prev = el;
        el = el.parentElement;
    }
    return $.attr(_prev, 'role') == 'cascade' ? _prev : null;
}


/**
 * 测试是否在级联编号表内。
 * 主要用于插入时的目标判断并进行正确的处理。
 * @param  {Element} el 目标元素
 * @return {Boolean|null}
 */
function inCascade( el ) {
     return !!cascadeRoot( el );
}


/**
 * 是否在目录内。
 * @param  {Element} el 起点元素
 * @return {Boolean}
 */
function inToc( el ) {
    let _ol = cascadeRoot( el ),
        _pe = _ol && _ol.parentElement;

    return !!_pe && $.attr(_pe, 'role') == 'toc';
}


/**
 * 测试是否在代码表内。
 * 仅用于测试 <li> 和 <code> 元素。
 * 结构：codelist/li/code
 * @param  {Element} el 目标元素
 * @return {Boolean|null}
 */
function inCodelist( el ) {
    let _n = el.nodeName.toLowerCase();

    if ( _n == 'code' ) {
        el = el.parentElement;
    }
    return $.attr(el.parentElement, 'role') == 'codelist';
}


/**
 * 是否为内容件。
 * @param {String|Element} its 测试目标
 */
function isConitem( its ) {
    return CONTENT &
        Types[ its.nodeType ? conName(its) : its ];
}


/**
 * 是否为代码列表项。
 * @param  {Element} li 列表项
 * @return {Boolean}
 */
function isCodeli( li ) {
    return li.childElementCount == 1 &&
        $.is(li.firstElementChild, 'code');
}


/**
 * 是否为目录普通列表项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isTocItem( li ) {
    return li.childElementCount == 1 &&
        $.is(li.firstElementChild, 'a');
}


/**
 * 是否为级联编号表标题项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isCascadeli( li ) {
    return li.childElementCount == 2 &&
        $.is(li.firstElementChild, 'h5') &&
        $.is(li.lastElementChild, 'ol');
}


/**
 * 是否为级联标题链接（目录）项。
 * @param  {Element} h5 标题元素
 * @return {Boolean}
 */
function isH5a( h5 ) {
    return h5.childElementCount == 1 &&
        $.is(h5.firstElementChild, 'a');
}


/**
 * 是否为目录列表标题项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isTocHeading( li ) {
    return isCascadeli( li ) && isH5a( li.firstElementChild );
}


/**
 * 获取元素/节点的内容名。
 * 返回名称为首字母大写（区别于标签）。
 * 非标准内容返回首字母大写的标签名（通用）。
 * @param  {Element|Text} el 目标元素或文本节点
 * @return {String}
 */
function conName( el ) {
    if ( el.nodeType == 3 ) {
        return '$text';
    }
    let _n = $.attr(el, 'role') || el.nodeName.toLowerCase();

    switch ( _n ) {
        case 'li':
            return customLi( el );
        case 'h5':
            return customH5( el );
    }
    return camelCase( _n );
}


/**
 * 测试是否为合法子单元。
 * @param  {String} name 目标内容名
 * @param  {Element} sub 待测试子单元根元素
 * @return {Boolean}
 */
function goodSub( name, sub ) {
    return !!( typeSubs[name] & Types[conName(sub)] );
}


/**
 * 合法子单元检测。
 * 合法的内容结构很重要，因此抛出错误（更清晰）。
 * @param  {String} name 内容名称
 * @param  {[Node]} nodes 子单元集
 * @return {Error|true}
 */
function isGoodSubs( name, nodes ) {
    for (const nd of nodes) {
        if ( !goodSub(name, nd) ) {
            throw new Error(`[${nd.nodeName}] is invalid in ${name}.`);
        }
    }
    return true;
}


/**
 * 是否不可包含子单元。
 * @param  {String} name 内容名
 * @return {Boolean}
 */
function nilSub( name ) {
    return typeSubs[name] === 0;
}


/**
 * 是否为内容件集。
 * 片区有严格的层次结构，因此判断标题和<section>即可。
 * 注：空集视为内容件集。
 * @param  {[Element]|''} els 子片区集或内容件集
 * @return {Boolean}
 */
function isConItems( els ) {
    return els.length == 0 ||
        !els.some( el => $.is(el, 'h2,h3,h4,h5,h6,section') );
}


/**
 * 测试表格行是否相同。
 * @param  {Element} tr1 表格行
 * @param  {Element} tr2 表格行
 * @return {Boolean}
 */
function sameTr( tr1, tr2 ) {
    if ( tr1.cells.length != tr2.cells.length ) {
        return false;
    }
    return Array.from( tr1.cells )
    .every(
        (td, i) => td.nodeName == tr2.cells[i].nodeName
    );
}


/**
 * 检查元素是否同类。
 * 注：是否可用于简单合并。
 * @param {Element} e1 目标元素
 * @param {Element} e2 对比元素
 */
function sameType( e1, e2 ) {
    let _n1 = e1.nodeNode.toLowerCase(),
        _n2 = e2.nodeNode.toLowerCase();

    return _n1 == _n2 && (_n1 == 'tr' ? sameTr(e1, e2) : true);
}


/**
 * 是否为自取单元。
 * @param  {Node} node 目标节点
 * @return {Boolean}
 */
function isOuter( node ) {
    return node.nodeType == 3 ||
        __outerTags.has( node.nodeName.toLowerCase() );
}


/**
 * 获取内联节点集。
 * @param  {Node} node 测试节点
 * @param  {Array} 内联节点存储区
 * @return {[Node]}
 */
function inlines( node, buf = [] ) {
    if ( !node ) {
        return buf;
    }
    if ( isOuter(node) ) {
        buf.push( node );
    } else {
        $.contents(node).forEach( nd => inlines(nd, buf) );
    }
    return buf;
}


/**
 * 错误提示&回馈。
 * 友好的错误提示并关联帮助。
 * @param {Number} help 帮助ID
 * @param {String} msg 错误消息
 */
function error( help, msg ) {
    // 全局：
    // - 消息显示
    // - 关联帮助
}
