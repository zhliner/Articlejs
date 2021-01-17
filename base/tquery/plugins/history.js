//! $Id: history.js 2020.06.18 tQuery.Plugins $
//+++++++++++++++++++++++++++++++++++++++++++++++
//  Project: dom-history v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  节点树修改监听/记录历史。
//  利用 tQuery 节点变化定制事件机制，跟踪对节点的修改，创建历史记录以便于撤销。
//
//  改变包含：
//  - 特性变化：attrvary
//  - 属性变化：propvary
//  - 样式变化：stylevary
//  - 类名变化：classvary
//  - 内容变化：nodein, detach, replace, empty, normalize
//
//  事件处理绑定变化：evbound, evunbound, evclone
//
//  适用前提
//  --------
//  限于tQuery接口调用，如果用户直接调用DOM接口修改节点则无法跟踪。
//
//  使用：
//  - 配置 tQuery.config() 以支持定制事件的激发。
//  - 创建一个全局的 History 实例作为事件处理器，绑定上面的事件到目标根元素上。
//  - 籍由事件的触发，会自动记录该元素及其子孙元素的变化历史。
//  - 调用 .back(n) 即可回退 DOM 的变化。
//
//  注意：
//  back即为undo的逻辑，redo需要用户自己编写（比如操作实例化）。
//  监听事件通常绑定在上层容器上，因此脱离节点树的节点的变化会无法监听。
//
//
///////////////////////////////////////////////////////////////////////////////
//


(function( $ ) {

    //
    // 变化处理器映射。
    // event-name: function(event): {.back}
    //
    const __varyHandles = {
        // 简单值变化处理器。
        attrvary:   ev => new Attr( ev.target, ev.detail[0] ),
        propvary:   ev => new Prop( ev.target, ev.detail[0] ),
        stylevary:  ev => new Style( ev.target ),
        classvary:  ev => new Class( ev.target ),

        // 节点变化处理器。
        // 注：共5个事件类型。
        nodedone:   ev => new Nodedone( ev.target ),
        detach:     ev => new Remove( ev.target ),
        empty:      ev => new Empty( ev.target ),
        replace:    ev => new Replace( ev.target, ev.detail ),
        normalize:  ev => new Normalize( ev.target ),

        // 事件绑定变化处理器。
        evbound:    ev => new Bound( ev.target, ...ev.detail ),
        evunbound:  ev => new Unbound( ev.target, ...ev.detail ),
        evclone:    ev => new EventClone( ...ev.detail ),
    };



//
// 历史记录器。
// 汇集节点改变的回溯（.back）操作实例。
//
class History {
    /**
     * 构造一个记录器。
     * 注：缓存池长度由外部管理（.prune）。
     */
    constructor() {
        this._buf = [];
    }


    /**
     * 事件触发处理器。
     * @param {CustomEvent} ev 定制事件对象
     */
    handleEvent( ev ) {
        // 仅记录一次。
        ev.stopPropagation();
        this.push( __varyHandles[ev.type](ev) );
    }


    /**
     * 回溯操作。
     * @param {Number} n 回溯项数
     */
    back( n ) {
        if ( n <= 0 ) return;

        callBack( () =>
            this._buf.splice( -n )
                .reverse()
                .forEach( obj => obj.back() )
        );
    }


    /**
     * 压入一个操作实例。
     * @param  {.back} its 操作实例
     * @return {Array|false} 被移除的实例集。
     */
    push( its ) {
        return this._buf.push( its );
    }


    /**
     * 获取当前缓存池大小。
     * @return {Number}
     */
    size() {
        return this._buf.length;
    }


    /**
     * 缓存池头部剪除。
     * @param {Number} n
     */
    prune( n ) {
        if ( n > 0 ) {
            this._buf.splice( 0, -n );
        }
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
//
class Prop {
    /**
     * @param {Element} el 目标元素
     * @param {String} name 目标属性名
     */
    constructor( el, name ) {
        this._el = el;
        this._name = name;
        this._old = $.prop( el, name );
    }


    back() {
        $.prop( this._el, this._name, this._old );
    }
}


//
// 内联样式修改。
// 关联事件：stylevary
// 注记：使用原生接口。
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
// 关联事件：classvary
// 注记：使用原生接口。
//
class Class {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
        this._old = el.className;
    }


    back() {
        if ( !this._old ) {
            return this._el.removeAttribute( 'class' );
        }
        this._el.className = this._old;
    }
}


//
// 事件绑定操作。
// 关联事件：bound
//
class Bound {
    /**
     * 注记：
     * 无需区分是否为单次（one）绑定，所以once参数仅为占位用。
     * @param {Element} el 目标元素
     * @param {String} evn 目标事件名
     * @param {String} slr 委托选择器
     * @param {Function|EventListener} handle 事件处理器（用户）
     * @param {Boolean} once 是否单次逻辑，忽略
     * @param {Element} src 克隆源元素，可选
     */
    constructor( el, evn, slr, handle, once, src ) {
        this._el = el;
        this._evn = evn;
        this._slr = slr;
        this._handle = handle;
        this._clone = !!src;
    }


    /**
     * 如果为克隆绑定，由EventClone处理。
     */
    back() {
        if ( !this._clone ) {
            $.off( this._el, this._evn, this._slr, this._handle );
        }
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
// 事件克隆处理。
// 克隆的目标（受者）可能为游离状态，其Bound无法冒泡，
// 因此在源处理中即无差别解绑。
//
class EventClone {
    /**
     * 无需区分是否为单次（one）绑定。
     * @param {String} evn 目标事件名
     * @param {String} slr 委托选择器
     * @param {Function|EventListener} handle 事件处理器（用户）
     * @param {Boolean} once 是否单次，占位忽略
     * @param {Element} to 克隆目标元素（受者）
     */
    constructor( evn, slr, handle, once, to ) {
        this._el = to;
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
// 节点进入完成。
// 确定数据节点已事先脱离DOM。
// 适用方法：.prepend, .append, .before, .after
//
class Nodedone {
    /**
     * @param {Node|[Node]} data 待插入节点（集）
     */
    constructor( data ) {
        this._nodes = $.isArray( data ) ? data : [ data ];
    }


    back() {
        this._nodes.forEach( node => node.remove() );
    }
}


//
// 节点移除操作。
// 确定节点在DOM中（否则不会触发）。
//
class Remove {
    /**
     * @param {Node} node 待移除节点
     */
    constructor( node ) {
        this._node = node;
        // 兼容DocumentFragment
        this._prev = node.previousSibling;
        this._box = node.parentNode;
    }


    back() {
        if ( this._prev ) {
            return this._prev.after( this._node );
        }
        this._box.prepend( this._node );
    }
}


//
// 节点替换操作。
// 包含了两个行为：
// 1. 数据节点的插入。
// 2. 原节点的移除。
// 注记：
// $.replace实现为数据节点已先脱离。
//
class Replace {
    /**
     * @param {Element} el 事件主元素
     * @param {Node|[Node]} data 数据节点/集
     */
    constructor( el, data ) {
        this._op0 = new Remove( el );
        this._op1 = new Nodedone( data );
    }


    /**
     * 数据先脱离，之后再插入恢复原节点。
     * 注记：
     * 如果有 remove 先回退，重复回退无副作用。
     */
    back() {
        this._op1.back();
        this._op0.back();
    }
}


//
// 元素清空操作。
// 注记：
// 已经为空的元素不会触发事件。
//
class Empty {
    /**
     * @param {Element} el 容器元素
     */
    constructor( el ) {
        this._box = el;
        this._data = [...el.childNodes];
    }


    back() {
        this._box.prepend( ...this._data );
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
     * @param {Element} el 事件主元素
     */
    constructor( el ) {
        let _all = textNodes( el )
            .filter(
                (nd, i, arr) => adjacent(nd, arr[i - 1], arr[i + 1])
            );
        this._buf = adjacentTeam(_all).map( nodes => new Texts(nodes) );
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
// 注记：
// 需要保持原文本节点的引用（其它节点可能依赖于它）。
//
class Texts {
    /**
     * nodes为一组相邻文本节点集。
     * @param {[Text]} nodes 节点集
     */
    constructor( nodes ) {
        this._prev = nodes[0].previousSibling;
        this._box  = nodes[0].parentNode;

        this._orig = nodes;
        this._data = nodes.map( nd => nd.textContent );
    }


    /**
     * 注记：
     * ref实际上是首个原始文本节点（this._orig[0]）。
     * 但这不影响替换操作（实现会忽略相同的替换目标）。
     */
    back() {
        let _ref = this._prev ?
            this._prev.nextSibling : this._box.firstChild;

        this._orig.forEach(
            (e, i) => e.textContent = this._data[i]
        );
        _ref.replaceWith( ...this._orig );
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
 * @param  {Node} cur 当前节点
 * @param  {Node|undefined} prev 集合中前一个节点
 * @param  {Node|undefined} next 集合中下一个节点
 * @return {Boolean}
 */
function adjacent( cur, prev, next ) {
    // null !== undefined
    return cur.previousSibling === prev || cur.nextSibling === next;
}


/**
 * 相邻节点集分组。
 * 源节点集中包含了多组不同的相邻节点。
 * @param  {[Node]} nodes 有序节点集
 * @return {[[Node]]}
 */
function adjacentTeam( nodes ) {
    if ( nodes.length == 0 ) {
        return [];
    }
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
 * 调用回溯函数。
 * 需要临时关闭节点变化跟踪。
 * @param {Function} handle 回调操作
 */
function callBack( handle ) {
    let _old = $.config({
        varyevent: false,
        bindevent: false,
    });
    try {
        return handle();
    }
    finally { $.config( _old ) }
}



// Expose
///////////////////////////////////////////////////////////////////////////////

$.Fx.History = History;

// 友好导出备用。
$.Fx.History.Normalize = Normalize;


})( window.$ );
