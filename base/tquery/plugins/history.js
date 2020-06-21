//! $Id: history.js 2020.06.18 tQuery.Plugins $
//+++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: dom-history v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	DOM 节点树修改监听器。
//  跟踪节点的各种改变，创建历史记录以便于撤销或重做。改变包含：
//
//  特性变化：attrvary, attrfail | attrdone
//  属性变化：propvary, propfail | propdone
//  样式变化：cssvary, cssfail | cssdone
//  类名变化：classvary, classfail | classdone
//
//  内容变化：nodevary, nodefail | nodedone
//  type: [
//      append, prepend, before, after, replace,
//      empty, remove, removes, normalize
//  ]
//  复合操作：fill, wrap, wrapInner, wrapAll, unwrap, html, text
//
//  适用前提
//  --------
//  仅限于tQuery接口调用，如果用户直接调用DOM接口修改节点则无法跟踪。
//
//  使用：
//  将事件处理器注册到根元素上，接口追踪该元素及其下子元素的变化。
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 节点监听器。
// 汇集节点改变事件的回溯实例（.back()接口实现者）。
// 即实现 .undo() 逻辑。
// 注记：
// redo() 由上层管理者 History 实例实现。
//
class NodeListener {
    /**
     * 构造一个监听器。
     * @param {Number} size 历史长度
     */
    constructor( size ) {
        this._max = size;
        this._buf = [];
    }


    /**
     * 事件触发处理器。
     * @param {CustomEvent} ev 定制事件对象
     * @param {Object} elo 事件关联对象（tQuery）
     */
    handleEvent( ev, elo ) {
        //
    }


    /**
     * 特性变化处理。
     * 目标元素为特性发生变化的元素（target）。
     * @param {Element} el 目标元素
     */
    attrvary( el, data ) {
        //
    }


    attrdone( el, data ) {
        //
    }


    attrfail( el, data ) {
        //
    }

}


//
// 历史记录器。
// 汇集节点改变的操作实例。
// 管理内部的
//
class History {

    constructor() {
        this._buf = __History;
    }


    /**
     * 嵌入代理并开启追踪。
     * @return {$Proxy}
     */
    startup() {
        $.embedProxy(proxyHandle);
        return this;
    }


    /**
     * 回退。
     * @param  {Number} cnt 回退步数
     * @param  {Array} buf  回退数据存储，可选
     * @return {Array|this} 回退数据或this
     */
    back( cnt = 1, buf = null ) {
        while (0 < cnt-- && this._buf.length) {
            let _dt = this._buf.pop().back();
            if (buf) buf.push(_dt);
        }
        return buf || this;
    }


    /**
     * 跳转到。
     * - 支持负数从末尾计算，-1为末尾；
     * - 跳转到的下标位置的操作已经被回退（pop）；
     *
     * @param  {Number} idx 操作历史下标
     * @param  {Array} buf  回退数据存储，可选
     * @return {Array|this} 回退数据或this
     */
    goto( idx, buf ) {
        let _cnt = idx < 0 ? -idx : this._buf.length - idx;
        return this.back(_cnt, buf);
    }


    /**
     * 修改操作历史栈大小。
     * @return {Number}
     */
    size() {
        return this._buf.length;
    }


    /**
     * 清空修改操作历史栈。
     * @return {this}
     */
    clear() {
        return this._buf.length = 0, this;
    }


    /**
     * 清除头部数据段。
     * @param  {Number} len 清除长度
     * @return {Array} 清除的部分
     */
    shift( len = 1 ) {
        return this._buf.splice(0, len);
    }


    /**
     * 外部压入接口。
     * - 压入一个函数或包含back接口的对象；
     * - 供外部补充$系之外的回退操作；
     * - 返回压入后栈的大小或无接口时返回false；
     * 注：
     * - 接口返回的数据可以在回退时被收集；
     *
     * @param  {Object|Function} item 目标对象
     * @return {Number|false}
     */
    push( item ) {
        let _obj = item;

        if (typeof _obj == 'function') {
            _obj = { back: item };
        }
        return _obj.back ? this._buf.push(_obj) : false;
    }


    /**
     * 设置/获取排除清单。
     * - 传递list为null，清空排除名单；
     * @param  {String} type 排除类型（func|attr|prop）
     * @param  {Array|Set} list 名称清单
     * @return {Array}
     */
    exclude( type, list ) {
        if (list === undefined) {
            return [ ...__Exclude[type] ];
        }
        if (list === null) {
            return __Exclude[type].clear();
        }
        list.forEach( n => __Exclude[type].add(n) );
    }
}





/**
 * 获取键名（集）。
 * @param  {String|Object} item 提取目标
 * @return {String|Array}
 */
function keyNames( item ) {
    return typeof item == 'string' ? item : Object.keys(item);
}


/**
 * 从位置获取被移除数据。
 * - 其它位置不会有节点数据被移除；
 * @param  {Node|Element} el
 * @param  {String|Number} where 位置值
 * @return {Node|Element|Array|null}
 */
function whereData( el, where ) {
    switch (where) {
        case 'fill':
        case 0: return $.contents(el);
        case 'replace':
        case '': return el;
    }
    return null;
}


/**
 * 提取集合中的首个成员。
 * @param  {Set|Iterator} set 集合/迭代器
 * @return {Value} 首个成员
 */
function first( set ) {
    return set.values().next().value;
}


/**
 * 相邻文本节点集。
 * - 若文本节点相邻则提取；
 * - 检测容器节点内全部文本节点；
 * 注：$.normalize操作的跟踪；
 * @param  {Element} box 容器元素
 * @param  {Boolean} all 包含全部子元素内
 * @return {[Set]} 相邻节点集数组
 */
function abutTexts( box, all ) {
    let _buf = [],
        _set = new Set(),
        _pre;  // undefined

    $.each(
        textNodes(box, all),
        tn => {
            _set = abutPush(_buf, abutSet(tn, _pre, _set), _set);
            _pre = tn;
        }
    );
    // 最后一个补入
    if (_set.size) _buf.push(_set);

    return _buf.length && _buf;
}


/**
 * 相邻节点添加。
 * @param  {Node} cur 当前节点
 * @param  {Node} pre 前一个节点
 * @param  {Set} set  存储容器
 * @return {Set|false}
 */
function abutSet( cur, pre, set ) {
    return cur.previousSibling === pre && set.add(pre).add(cur);
}


/**
 * 节点集压入。
 * - 如果节点不再相邻，cur为假；
 * - 原集合有值时才压入存储；
 * - 返回原空集合或一个新集合（如果压入）；
 * @param  {Array} buf 外部存储
 * @param  {Set|false} cur 当前集合或否
 * @param  {Set} set 原节点集合
 * @return {Set} 存储节点的集合
 */
function abutPush( buf, cur, set ) {
    if (cur || !set.size) {
        return set;
    }
    return buf.push(set) && new Set();
}


/**
 * 获取文本节点。
 * @param  {Element} box 容器元素
 * @param  {Boolean} all 包含全部子孙节点
 * @return {Queue} 文本节点集
 */
function textNodes( box, all ) {
    let $els = all ?
        $('*', box).add(box) : $(box);

    return $els.contents( nd => nd.nodeType == 3 ? nd : null );
}


/**
 * 提取节点引用参考。
 * @param  {Node} node 目标节点
 * @return {Array} [prev, parend]
 */
function nodeRefs( node ) {
    return [
        node.previousSibling,
        node.previousSibling || node.parentNode
    ];
}


/**
 * 操作实例压入历史栈。
 * - 返回操作实例可用于原始调用后赋值；
 *   （需要处理改变后值的情况）
 * 操作类：{
 *   	Node, Node2, NormText/Texts,
 *   	Attr, Prop, Value, Style,
 *   	Scroll, Event
 * }
 * @param  {Node|Node2...} obj 修改操作实例
 * @return {Node|Node2...} 操作实例
 */
function pushStack( obj ) {
    return __History.push(obj), obj;
}


/**
 * 名称清理。
 * - 清除包含在排除名单中的条目；
 * @param  {Array} names 名称集
 * @param  {String} type 名称类型（attr|prop）
 * @return {Array}
 */
 function cleanList( names, type ) {
    if (!$.isArray(names)) {
        return names;
    }
    let _set = __Exclude[type];

    return names.filter( n => _set && !_set.has(n) );
}


/**
 * 代理调用。
 * __Handles中的代理仅追踪修改操作（追踪变化）。
 * @param  {Mixed} args 原生参数序列
 * @return {Value|$}
 */
function proxyCall( ...args ) {
    let _x = __Handles[this](...args),
        _v = $[this](...args);

    // 未拦截
    if (_x === false) {
        return _v;
    }
    // 代理返回操作实例
    if (_x) {
        _x.value = _v; // 从外赋值
        return _v;     // 返回原调用结果
    }
    return $;  // 默认行为，x == undefined
}



/**
 * 调用回溯接口。
 * 封装定制事件激发的关闭和开启。
 * 这在调用回溯接口时需要。
 * @param {Function} handle 回调函数
 */
function callBack( handle ) {
    let _old = $.config({
        varyevent: false, bindevent: false
    });
    try {
        return handle();
    }
    finally {
        $.config( _old );
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
     */
    constructor( el ) {
        this._el = el;
    }


    vary( name ) {
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
//
class Prop {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
    }


    vary( name ) {
        this._name = name;

        if ( name == 'select' ) {
            this._old = $.val( this._el );
        } else {
            this._old = $.prop( this._el, name );
        }
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
    }


    vary() {
        // 简化处理且保持内容顺序。
        this._old = this._el.style.cssText;
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
    }


    vary() {
        this._old = $.classAll( this._el );
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
     */
    constructor( el ) {
        this._el = el;
    }


    back() {
    }
}


//
// 事件解绑操作。
// 关联事件：unbound
//
class Unbound {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
    }


    back() {
    }
}


//
// 单次绑定事件操作。
// 关联事件：boundone
//
class Boundone {
    /**
     * @param {Element} el 目标元素
     */
    constructor( el ) {
        this._el = el;
    }


    back() {
    }
}



//
// 节点单操作。
// - 仅包含恢复到DOM中的行为；
// @data {Node} 节点元素
//
class Node {
    /**
     * @param {Node|null} data 数据节点
     */
    constructor( data ) {
        if (data) {
            [this._prev, this._box] = nodeRefs(data);
        }
        this._data = data;
    }


    back() {
        if (this._prev) {
            $.after(this._prev, this._data);
        }
        // 可能为离散节点
        else if (this._box) {
            $.prepend(this._box, this._data);
        }
        return this._data;
    }
}


//
// 节点双操作。
// - 包含新内容的移除和原节点的恢复；
// @data  {Array} 节点集
// @value {Node[s]} 调用返回值存储（外部赋值）
//
class Node2 {
    /**
     * @param {Node|Array|null} data 数据（集）
     */
    constructor( data ) {
        this._data = data;

        if (!$.isArray(data)) {
            data = [data];
        }
        this._sets = data.map( nd => new Node(nd) );

        this.value = null;
    }


    back() {
        if (this.value) {
            $(this.value).remove();
        }
        this._sets.forEach( it => it.back() );

        return this._data;
    }
}


//
// 文本节点恢复。
// 处理normalize的回退（单个）。
// @data {Set} 文本节点集
//
class Texts {
    /**
     * 节点数据为集合时，会传递first求取参考节点；
     * 否则为单个节点，直接求取其参考。
     * @param {Set} set 文本节点集
     */
    constructor( set ) {
        [this._prev, this._box] = nodeRefs( first(set) );
        this._data = set;
    }


    //
    // 规范化后的文本节点只有一个，
    // 先删除后恢复，UI动静较小。
    //
    back() {
        if (this._prev) {
            $.remove(this._prev.nextSibling);
            $.after(this._prev, this._data);
        } else {
            $.remove(this._box.firstChild);
            $.prepend(this._box, this._data);
        }
        return this._data;
    }
}


//
// 规范化文本。
// 处理normalize的回退。
//
class NormText {
    /**
     * 相邻文本节点集序列。
     * @param {[Set]} sets 节点集数组
     */
    constructor( sets ) {
        this._data = sets;
        this._sets = sets.map( it => new Texts(it) );
    }


    back() {
        this._sets.forEach( it => it.back() );
        return this._data;
    }
}


//
// 值属性操作。
// @data {String|Boolean|Number|Array} value属性值
//
class Value {
    constructor( el ) {
        this._data = $.val(el);
        this._el = el;
    }


    back() {
        $.val(this._el, this._data);
        return this._data;
    }
}


// Expose
///////////////////////////////////////////////////////////////////////////////

$.Fx.Tracker = new History().startup();
