//! $Id: history.js 2020.06.18 tQuery.Plugins $
//+++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: dom-history v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	节点树修改监听/记录历史。
//  跟踪节点的各种改变，创建历史记录以便于撤销操作。改变包含：
//
//  特性变化：attrvary
//  属性变化：propvary
//  样式变化：cssvary
//  类名变化：classvary
//  内容变化：nodevary
//      type: [
//          append, prepend, before, after, replace,
//          empty, remove, removes, normalize
//      ]
//  事件处理绑定变化：bound, unbound, boundone
//
//  适用前提
//  --------
//  仅限于tQuery接口调用，如果用户直接调用DOM接口修改节点则无法跟踪。
//
//  使用：
//  将事件处理器绑定到根元素上，即可追踪该元素及其下子元素（target）的变化。
//
//
///////////////////////////////////////////////////////////////////////////////
//


(function( $ ) {

    //
    // 变化处理器映射。
    // event-name: process-handler
    // process-handler: function(event): {.back()}
    //
    const __varyHandles = {
        // 特性处理器。
        attrvary:   ev => new Attr( ev.target, ev.detail[0] ),

        // 属性处理器。
        propvary:   ev => new Prop( ev.target, ev.detail[0] ),

        // 样式处理器。
        cssvary:    ev => new Style( ev.target ),

        // 类名处理器。
        classvary:  ev => new Class( ev.target ),

        // 事件绑定处理器。
        bound:      ev => new Bound( ev.target, ...ev.detail ),

        // 事件解绑处理器。
        unbound:    ev => new Unbound( ev.target, ...ev.detail ),

        // 事件单次绑定处理器。
        boundone:   ev => new Boundone( ev.target, ...ev.detail ),

        // 节点变化处理器。
        nodevary:   ev => new NodeVary( ev.detail ),
    };



//
// 历史记录器。
// 汇集节点改变的回溯（.undo）操作实例。
//
class History {
    /**
     * 构造一个记录器。
     * @param {Number} size 历史长度
     */
    constructor( size ) {
        this._buf = [];
        this._max = size;
    }


    /**
     * 事件触发处理器。
     * @param {CustomEvent} ev 定制事件对象
     */
    handleEvent( ev ) {
        this.push(
            __varyHandles[ev.type]( ev )
        );
    }


    /**
     * 撤销操作。
     * @param {Number} n 撤销项数
     */
    undo( n ) {
        this._buf.splice( -n )
            .forEach( obj => obj.back() );
    }


    /**
     * 压入一个操作实例。
     * 会维护缓存池长度不超出上限。
     * @param {.back()} its 操作实例
     */
    push( its ) {
        if ( this._buf.push(its) > this._max ) {
            this._buf.shift();
        }
    }


    /**
     * 获取当前缓存池大小。
     * @return {Number}
     */
    size() {
        return this._buf.length;
    }


    /**
     * 获取缓存池大小上限。
     * @return {Number}
     */
    limit() {
        return this._max;
    }


    /**
     * 清空缓存池。
     * @return {void}
     */
    clear() {
        this._buf.length = 0;
    }
}


//
// 基础操作类。
// 注意：调用回退（.back）接口时需要关闭定制事件激发。
///////////////////////////////////////////////////////////////////////////////


//
// 元素特性修改。
// 关联事件：attrvary
//
class Attr {
    /**
     * @param {Element} el 目标元素
     * @param {String} name 目标特性名
     */
    constructor( el, name ) {
        this._el = el;
        this._name = name;
        this._old = $.attr( el, name );
    }


    back() {
        $.attr( this._el, this._name, this._old );
    }
}


//
// 元素属性修改。
// 关联事件：propvary
// 注记：
// select名称是操作<select>控件的定制名。
// $.val()实际上是$.prop()逻辑，也是在有变化后才会触发事件。
//
class Prop {
    /**
     * @param {Element} el 目标元素
     * @param {String} name 目标属性名
     */
    constructor( el, name ) {
        this._el = el;
        this._name = name;
        this._old = name == 'select' ? $.val(el) : $.prop(el, name);
    }


    back() {
        if ( this._name == 'select' ) {
            return $.val( this._el, this._old );
        }
        $.prop( this._el, this._name, this._old );
    }
}


//
// 内联样式修改。
// 关联事件：cssvary
//
class Style {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
        // 简化处理且保持内容顺序。
        this._old = el.style.cssText;
    }


    back() {
        this._el.style.cssText = this._old;
    }
}


//
// 元素类名修改。
//
class Class {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
        this._old = $.classAll( el );
    }


    back() {
        $.removeClass( this._el );

        if ( this._old.length > 0 ) {
            $.addClass( this._el, this._old );
        }
    }
}


//
// 事件绑定操作。
// 关联事件：bound
//
class Bound {
    /**
     * @param {Element} el 目标元素
     * @param {String} evn 目标事件名
     * @param {String} slr 委托选择器
     * @param {Function|EventListener} handle 事件处理器（用户）
     */
    constructor( el, evn, slr, handle ) {
        this._el = el;
        this._evn = evn;
        this._slr = slr;
        this._handle = handle;
    }


    back() {
        $.off( this._el, this._evn, this._slr, this._handle );
    }
}


//
// 事件解绑操作。
// 关联事件：unbound
//
class Unbound {
    /**
     * @param {Element} el 目标元素
     * @param {String} evn 目标事件名
     * @param {String} slr 委托选择器
     * @param {Function|EventListener} handle 事件处理器（用户）
     * @param {Boolean} once 是否为单次绑定
     */
    constructor( el, evn, slr, handle, once ) {
        this._el = el;
        this._evn = evn;
        this._slr = slr;
        this._handle = handle;
        this._once = once;
    }


    back() {
        let _fn = this._once ?
            'one' :
            'on';
        $[_fn]( this._el, this._evn, this._slr, this._handle );
    }
}


//
// 单次绑定事件操作。
// 关联事件：boundone
// 注记：
// 可能已经由于事件触发自动解绑，不过这里的解绑是无害的。
//
class Boundone {
    /**
     * @param {Element} el 目标元素
     * @param {String} evn 目标事件名
     * @param {String} slr 委托选择器
     * @param {Function|EventListener} handle 事件处理器（用户）
     */
    constructor( el, evn, slr, handle ) {
        this._el = el;
        this._evn = evn;
        this._slr = slr;
        this._handle = handle;
    }


    back() {
        $.off( this._el, this._evn, this._slr, this._handle );
    }
}


//
// 节点操作类。
// 因为DOM节点是移动式操作，故仅需记录节点的脱离行为。
//////////////////////////////////////////////////////////////////////////////


//
// 节点通用操作封装。
// 关联事件：nodevary
//
class NodeVary {
    /**
     * @param {Object} detail 事件数据
     */
    constructor( detail ) {
        this._obj = this._init( detail.data, detail.method );
    }


    back() {
        this._obj.back();
    }


    /**
     * @param {Node|[Node]} data 数据节点/集
     * @param {String} meth 插入方法
     */
    _init( data, meth ) {
        // 兄弟关系。
        if ( meth == 'removes' || meth == 'empty' ) {
            return new Siblings( data );
        }
        if ( meth == 'normalize' ) {
            return new Normalize( data );
        }
        return $.isArray(data) ? new Nodes(data) : new Node(data);
    }
}


//
// 单节点操作。
//
class Node {
    /**
     * @param {Node} node 数据节点
     */
    constructor( node ) {
        this._prev = node.previousSibling;
        this._box  = node.parentElement;
        this._data = node;
    }


    back() {
        if ( this._prev ) {
            $.after( this._prev, this._data );
        }
        else if (this._box) {
            $.prepend( this._box, this._data );
        }
        // 原为游离节点
        else this._data.remove();
    }
}


//
// 多节点操作。
//
class Nodes {
    /**
     * @param {[Node]} data 数据节点集
     */
    constructor( data ) {
        this._buf = data.map( nd => new Node(nd) );
    }


    back() {
        this._buf.forEach( obj => obj.back() );
    }
}


//
// 兄弟节点操作。
// 注记：确定为非游离节点数据。
//
class Siblings {
    /**
     * 容错空集忽略。
     * @param {Node} nodes 数据节点集（兄弟）
     */
    constructor( nodes ) {
        if ( nodes.length ) {
            this._prev = nodes[0].previousSibling;
            this._box  = nodes[0].parentElement;
            this._data = nodes;
        }
    }


    back() {
        if ( this._prev ) {
            $.after( this._prev, this._data );
        } else {
            $.prepend( this._box, this._data );
        }
    }
}


//
// 元素规范化恢复。
// 处理normalize的回退。
//
class Normalize {
    /**
     * 准备：
     * 1. 提取相邻文本节点集分组（并克隆）。
     * 2. 记录位置参考节点。
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._buf = adjacentTexts(el)
            .map( nodes => new Texts(nodes) );
    }


    /**
     * 恢复：
     * 1. 根据参考节点找到被规范文本节点。
     * 2. 用备份节点替换目标节点。
     */
    back() {
        this._buf.forEach( obj => obj.back() );
    }
}


//
// 相邻文本节点处理。
// 辅助处理normalize的回退。
// 注意：
// 原文本节点上附加的额外（用户）数据无法保持，
// 当然，这样的数据通常不存在。
//
class Texts {
    /**
     * nodes为一组相邻文本节点集。
     * @param {[Text]} nodes 节点集
     */
    constructor( nodes ) {
        this._prev = nodes[0].previousSibling;
        this._box  = nodes[0].parentElement;

        // 原节点会被修改，故克隆。
        this._data = nodes.map( nd => nd.cloneNode() );
    }


    back() {
        let _new = this._prev ?
            this._prev.nextSibling : this._box.firstChild;
        // 原始接口
        _new.replaceWith( ...this._data );
    }
}


//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取元素内的文本节点。
 * @param  {Element} el 容器元素
 * @param  {Array} buf 缓存区
 * @return {[Node]}
 */
function textNodes( el, buf = [] ) {
    for (const nd of el.childNodes) {
        let _t = nd.nodeType;
        if ( _t === 1 ) textNodes( nd, buf );
        else if ( _t === 3 ) buf.push( nd );
    }
    return buf;
}


/**
 * 相邻节点过滤器。
 * 检查集合中的节点是否为相邻节点。
 * @param {Node} cur 当前节点
 * @param {Node|undefined} prev 集合中前一个节点
 * @param {Node|undefined} next 集合中下一个节点
 */
function adjacent( cur, prev, next ) {
    // null !== undefined
    return cur.previousSibling === prev || cur.nextSibling === next;
}


/**
 * 相邻节点集分组。
 * @param  {[Node]} nodes 相邻节点集
 * @return {[Array]}
 */
function adjacentTeam( nodes ) {
    let _sub = [nodes.shift()],
        _buf = [_sub];

    for ( const nd of nodes ) {
        if ( nd.previousSibling === _sub[_sub.length-1] ) {
            _sub.push( nd );
            continue;
        }
        _buf.push( (_sub = [nd]) );
    }
    return _buf;
}


/**
 * 提取相邻文本节点集组。
 * @param  {Element} el 容器元素
 * @return {[[Text]]}
 */
function adjacentTexts( el ) {
    return adjacentTeam(
        textNodes(el)
        .filter( (nd, i, arr) => adjacent(nd, arr[i-1], arr[i+1]) )
    );
}



// Expose
///////////////////////////////////////////////////////////////////////////////

$.Fx.History = History;


})( window.$ );
