//! $Id: edit.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	基本编辑。
//
//  包含普通模式下的选取、移动、样式/源码的设置，以及临时态的操作。
//
//  注记：
//  元素选取包含在编辑历史的记录里（可Undo/Redo），但选取焦点的移动不包含。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { ESet, EHot, ElemCursor } from './common.js';
import { Setup, Limit } from "../config.js";
import { processExtend } from "./tpb/pbs.by.js";
import { isContent, isInlines, isEmpty, canDelete, selectTop, contentBoxes } from "./base.js";
import cfg from "./shortcuts.js";


const
    $ = window.$,

    Normalize = $.Fx.History.Normalize,

    // 路径单元存储键。
    // 在路径序列元素上存储源元素。
    pathsKey = Symbol(),

    // 编辑需要监听的变化事件。
    varyEvents = 'attrvary cssvary varyprepend varyappend varybefore varyafter varyreplace varyempty varyremove varynormalize',

    // 元素选取集实例。
    __ESet = new ESet( Setup.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Setup.focusClass ),

    // 光标实现实例。
    // 仅用于内容元素的微编辑。
    __elemCursor = new ElemCursor(),

    // DOM节点变化历史实例。
    __TQHistory = new $.Fx.History();



//
// 编辑历史管理器。
// 管理内部实现了 undo/redo 接口的编辑处理实例。
// 支持成组的编辑实例一次性操作。
//
class History {
    /**
     * 构造一个编辑实例。
     * @param {Number} size 编辑历史长度
     */
    constructor( size ) {
        this._max = size;
        this._buf = [];
        this._idx = -1;  // 游标
    }


    /**
     * 入栈一个操作。
     * 仅作为单个实体压入。
     * @param  {...Instance} obj 操作实例序列
     * @return {[Instance]|false} 头部被移出的操作实例序列
     */
    push( ...obj ) {
        // 新入截断。
        this._buf.length = ++this._idx;

        let _len = this._buf.push(
            obj.length == 1 ? obj[0] : obj
        );
        return ( _len - this._max ) > 0 && this._shift();
    }


    /**
     * 撤销一步。
     */
    undo() {
        if ( this._idx < 0 ) {
            return warn('[undo] overflow.');
        }
        let _obj = this._buf[ this._idx-- ];

        if ( !$.isArray(_obj) ) {
            return _obj.undo();
        }
        // 副本避免被修改。
        _obj.slice().reverse().forEach( o => o.undo() );
    }


    /**
     * 重做一步。
     * 操作实例可能是一个数组。
     */
    redo() {
        if ( this._idx >= this._buf.length - 1 ) {
            return warn('[redo] overflow.');
        }
        let _obj = this._buf[ ++this._idx ];

        $.isArray(_obj) ? _obj.forEach( o => o.redo() ) : _obj.redo();
    }


    /**
     * 是否可执行撤销。
     * 注记：撤销在当前实例上执行。
     * @return {Boolean}
     */
    canUndo() {
        return this._idx >= 0;
    }


    /**
     * 是否可执行重做。
     * 注记：重做在下一个实例上开启。
     * @return {Boolean}
     */
    canRedo() {
        return this._idx < this._buf.length - 1;
    }


    /**
     * 历史栈头部移除。
     * 游标从头部算起，因此需要同步减1。
     * 注记：
     * 仅 DOMEdit 实例包含 count 属性。
     */
    _shift() {
        let _obj = this._buf.shift();
        this._idx --;

        if ( !$.isArray(_obj) ) {
            _obj = [_obj];
        }
        _obj.forEach( o => o.count && __TQHistory.prune(o.count) );
    }
}


//
// 节点编辑类。
// 封装用户的单次DOM编辑（可能牵涉多个节点变化）。
// 实际上为操作全局的 __TQHistory 实例。
// 注记：
// 用户需要配置 tQuery:config() 启用节点变化事件通知机制。
//
class DOMEdit {
    /**
     * 构造一个编辑实例。
     * @param {Function} handle 操作函数
     */
    constructor( handle ) {
        this._func = handle;

        // 外部只读
        this.count = null;
        this.redo();
    }


    undo() {
        if ( this.count > 0 ) {
            __TQHistory.back( this.count );
        }
    }


    redo() {
        let _old = __TQHistory.size();

        this._func();
        this.count = __TQHistory.size() - _old;
    }
}


//
// 元素选取集编辑。
// 包含焦点元素的当前设置。
// 注记：
// 选取集成员需要保持原始的顺序，较为复杂，因此这里简化为全集成员存储。
// @ElementSelect
//
class ESEdit {
    /**
     * 创建一个操作单元。
     * @param {[Element]} old 操作之前的元素集
     * @param {Element} focus 焦点元素
     */
    constructor( old, focus ) {
        this._old = old;
        this._els = [...__ESet];

        this._el0 = setFocus( focus );
        this._el1 = focus;
    }


    /**
     * 撤销选取。
     * 先移除新添加的，然后添加被移除的。
     */
    undo() {
        setFocus( this._el0 );
        __ESet.removes( this._els ).pushes( this._old );
    }


    /**
     * 重新选取。
     * 先移除需要移除的，然后添加新添加的。
     */
    redo() {
        setFocus( this._el1 );
        __ESet.removes( this._old ).pushes( this._els );
    }
}


//
// 选区编辑。
// 用于鼠标划选创建内联单元时。
// 外部：
// - 范围的首尾点需要在同一父元素内（正确嵌套）。
// - 范围所在的容器元素normalize（文本节点连续）。
// 注记：
// 使用DOM原生接口，避免tQuery定制事件激发记录。
//
class RngEdit {
    /**
     * @param {Range} rng 范围对象
     * @param {Element} el 内联元素（数据）
     */
    constructor( rng, el ) {
        this._old = [
            ...rng.extractContents().childNodes
        ];
        rng.insertNode( el );
        this._el = el;
        this._tmp = null;
    }


    undo() {
        let _box = this._el.parentElement;
        this._el.replaceWith( ...this._old );

        // 碎片记忆（便于redo）。
        this._tmp = new Normalize( _box );

        // 复原，会丢失引用。
        _box.normalize();
    }


    redo() {
        // 碎片复原使_old系有效。
        this._tmp.back();

        this._old.slice(1).forEach( nd => nd.remove() );
        this._old[0].replaceWith( this._el );
    }
}


//
// 微编辑管理。
// 管理初始进入微编辑状态以及确认或取消。
// 提供完整内容的撤销和重做。
// 提供单击点即为活动插入点（rng无效时插入点位于末尾）。
// 外部：
// 被编辑的内容元素应当已规范（文本节点连续，如被normalize过）。
// 注记：
// 用一个新的元素执行微编辑以保持撤销后的引用有效。
// 使用原生DOM接口，避免tQuery相关事件激发记录。
//
class MiniEdit {
    /**
     * 创建管理实例。
     * 管理元素的可编辑状态，在进入微编辑前构造。
     * @param {Element} el 内容元素
     * @param {Range} rng 范围对象（插入点）
     */
    constructor( el, rng ) {
        this._cp = this._clone( el, rng );
        this._el = el;

        el.replaceWith( this._cp );
        this._cp.setAttribute( 'contenteditable', true );

        // 激活光标。
        __elemCursor.cursor( this._cp );
    }


    /**
     * 微编辑完成。
     * 注记：光标元素已经不存在了。
     */
    done() {
        this._cp.normalize();
        this._cp.removeAttribute( 'contenteditable' );
    }


    /**
     * 取消编辑。
     * 通常在用户键入ESC键时执行，逻辑同undo。
     */
    cancel() {
        this._cp.replaceWith( this._el );
    }


    /**
     * 撤销微编辑的结果。
     */
    undo() {
        this._cp.replaceWith( this._el );
    }


    /**
     * 恢复微编辑的结果。
     * 不再进入微编辑，新的元素用于之后的引用。
     */
    redo() {
        this._el.replaceWith( this._cp );
    }


    /**
     * 创建用于微编辑的新元素。
     * 包含可能需要的光标标记元素。
     * @param {Element} el 内容元素
     * @param {Range} rng 范围对象，可选
     */
    _clone( el, rng ) {
        // 插入光标元素。
        if ( rng ) {
            __elemCursor.insert( rng );
        }
        let _new = $.clone( el, true, true, true );

        // 恢复原元素状态。
        if ( __elemCursor.clean(el) ) {
            el.normalize();
        }
        // 含可能的光标标记。
        return _new;
    }
}



//
// 操作单元。
//////////////////////////////////////////////////////////////////////////////


//
// 元素选取操作。
// 各方法对应到用户的快捷选取操作类型。
//
class ElemSels {
    /**
     * @param {ESet} eset 选取集实例引用
     */
    constructor( eset ) {
        this._set = eset;
    }


    //-- 基本操作 ------------------------------------------------------------
    // 注：返回false表示操作无效


    /**
     * 排它选取。
     * 会先清空整个集合。
     * 友好：忽略简单的重复单击。
     * @行为：单击
     * @param {Element} el 目标元素
     */
    only( el ) {
        if ( this._set.size == 1 && this._set.has(el) ) {
            return false;
        }
        this._set.clear();
        this._set.add( el );
    }


    /**
     * 切换选取。
     * 已存在则移除，否则为添加。
     * 注：添加时仍需考虑父子包含关系。
     * @行为：Ctrl+单击
     * @param {Element} el 焦点/目标元素
     */
    turn( el ) {
        if ( this._set.has(el) ) {
            this._set.delete(el);
        } else {
            this.clean(el)._set.add(el);
        }
    }


    /**
     * 集合反选。
     * 已经存在的移除，否则添加。
     * 添加的元素中，其子元素可能已经选取（故需滤除）。
     * @param {[Element]} els 元素集
     */
    reverse( els ) {
        for ( const el of els ) {
            this._set.has(el) ? this._set.delete(el) : this._parentAdd(el);
        }
    }


    /**
     * 元素扩展：添加/移出。
     * 假设父容器未选取，外部需要保证此约束。
     * @param  {[Element]} els 元素序列
     * @param  {Element} hot 焦点元素引用
     * @return {Boolean} 是否实际执行
     */
    expand( els, hot ) {
        return els.length > 0 &&
            ( this._set.has(hot) ? this.adds(els) : this.removes(els) );
    }


    /**
     * 元素集添加。
     * 新成员可能是集合内成员的父元素。
     * 约束：假设父容器未选取，外部需要保证此约束。
     * @param  {[Element]} els 兄弟元素集
     * @return {Boolean} 是否实际执行
     */
    adds( els ) {
        let _does = false;

        for ( const el of els ) {
            if ( this._set.has(el) ) {
                continue;
            }
            _does = true;
            this._parentAdd( el );
        }
        return _does;
    }


    /**
     * 元素集移出。
     * @param  {[Element]} els 元素集
     * @return {Boolean} 是否实际执行
     */
    removes( els ) {
        let _does = false;

        for ( const el of els ) {
            if ( this._set.has(el) ) {
                _does = true;
                this._set.delete( el );
            }
        }
        return _does;
    }


    /**
     * 获取父级元素。
     * 获取有效父元素后会清除其所包含的子元素选取。
     * 抵达限定根元素时返回false。
     * @param  {Element} el 焦点元素
     * @param  {Number} n 上升最大层级数
     * @param  {Element} end 终止边界元素（不含）
     * @return {Element|false}
     */
    parent( el, n, end ) {
        let _to = $.closest(
            el,
            (e, i) => i == n || e === end
        );
        return _to !== end && ( this.cleanDown(_to), _to );
    }


    /**
     * 获取子元素。
     * 获取到有效子元素后会移出父元素的选取。
     * @param  {Element} el 焦点元素
     * @param  {Number} n 子元素位置下标（从0开始，支持负值）
     * @return {Element|void}
     */
    child( el, n ) {
        let _sub = $.children( el, n );
        return _sub && ( this._set.delete(el), _sub );
    }


    /**
     * 清除全部选取。
     * 友好：空集时简单忽略。
     */
    empty() {
        if ( this._set.size == 0 ) {
            return false;
        }
        this._set.clear();
    }


    /**
     * 简单添加。
     * 外部需要自行清理父子已选取。
     * @param  {Element} el 选取元素
     * @return {el|false}
     */
    add( el ) {
        return !this._set.has(el) && this._set.add(el);
    }


    /**
     * 简单移除。
     * @param  {Element} el 选取元素
     * @return {el|false}
     */
    delete( el ) {
        return this._set.has(el) && this._set.delete(el);
    }


    /**
     * 安全添加。
     * 会检查父子包含关系并清理。
     * 如果已经选取则无行为。
     * @param  {Element} el 目标元素
     * @return {el|false}
     */
    safeAdd( el ) {
        return !this._set.has(el) && this.clean(el)._set.add(el);
    }


    /**
     * 头部添加。
     * 将新元素集插入到集合的头部。
     * 注记：
     * 容许新集合中的元素与选取集内的成员重合。
     *
     * @param {[Element]} els 元素集
     */
    unshift( els ) {
        if ( els.length === 0 ) {
            return false;
        }
        let _tmp = [...this._set];

        if ( _tmp.length ) {
            this._set.clear();
        }
        this.adds( els.concat(_tmp) );
    }


    /**
     * 向上父级清理。
     * 检索集合内包含目标子元素的成员并清除其选取。
     * 即：清理目标元素的上级已选取。
     * @param  {Element} el 目标子元素
     * @return {this|false}
     */
    cleanUp( el ) {
        let _box = this._parentItem(el);

        if ( !_box ) {
            return false;
        }
        return this._set.delete( _box ), this;
    }


    /**
     * 向下子级清理。
     * 检索集合内为目标元素子元素的成员并清除其选取。
     * 即：清理目标元素的子级已选取，可能包含多个成员。
     * @param  {Element} el 目标父元素
     * @return {this|false}
     */
    cleanDown( el ) {
        let _els = this._contains(el);

        if ( !_els.length ) {
            return false;
        }
        _els.forEach(
            sub => this._set.delete( sub )
        )
        return this;
    }


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 注记：不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素
     * @return {this|false} 当前实例
     */
    clean( el ) {
        return this.cleanUp(el) || this.cleanDown(el) || this;
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 父级添加。
     * 会清除集合内属于子级元素的选取。
     * @param {Element} el 父元素
     */
    _parentAdd( el ) {
        this.cleanDown( el );
        this._set.add( el );
    }


    /**
     * 父级选取检索。
     * 找出集合中包含目标子节点的成员。
     * 原集合中成员不存在父子关系，因此仅需一次匹配。
     * 返回null表示无成员匹配。
     * 用途：
     * 选取子元素后清除父级选取成员。
     *
     * @param  {Element} sub 子节点
     * @return {Element|null}
     */
    _parentItem( sub ) {
        for ( const el of this._set ) {
            if ( $.contains(el, sub, true) ) return el;
        }
        return null;
    }


    /**
     * 子包含过滤。
     * 找出集合中为目标元素子孙元素的成员。
     * @param  {Element} el 父元素
     * @return {[Element]}
     */
    _contains( el ) {
        let _buf = [];

        this._set.forEach(
            it => $.contains(el, it, true) && _buf.push(it)
        );
        return _buf;
    }

}


//
// 元素节点操作。
// 节点删除、移动、克隆，元素的样式设置、清除等。
//
class NodeVary {
    /**
     * 内容文本化。
     * @param {Collector} $els 处理集
     */
    toText( $els ) {
        $els.text( $els.text() );
    }


    /**
     * 内容提升。
     * 会对成员的公共父元素执行文本规范化。
     * 注记：集合成员本身不会有嵌套。
     * @param {Collector} $els 处理集
     */
    unWrap( $els ) {
        let _set = new Set();

        $els.forEach(
            el => _set.add( el.parentElement )
        );
        $els.unwrap();

        $(_set).normalize();
    }

}


//
// 全局操作对象。
//////////////////////////////////////////////////////////////////////////////


const
    // 元素选取集操作实例。
    __Selects = new ElemSels( __ESet ),

    // 元素修改操作实例。
    __Elemedit = new NodeVary( __ESet ),

    // 编辑器操作历史。
    __History = new History( Limit.history );


let
    // 内容根元素。
    contentElem = null,

    // 路径信息容器。
    pathContainer = null,

    // 出错信息容器
    errContainer = null,

    // 当前微编辑对象暂存。
    currentMinied = null;




//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 历史栈压入。
 * - 封装 Undo/Redo 状态通知。
 * - 清除出错帮助提示。
 * @param {...Instance} obj 操作实例序列
 */
function historyPush( ...obj ) {
    stateNewEdit();
    help( null );
    __History.push( ...obj );
}


/**
 * 执行了一个新编辑。
 * 更新 Undo/Redo 按钮状态：重做不可用。
 */
function stateNewEdit() {
    $.trigger( contentElem, Setup.undoEvent, true, true );
    $.trigger( contentElem, Setup.redoEvent, false, true );
}


/**
 * 状态重置。
 * 设置 Undo/Redo 按钮为失效状态（初始）。
 */
function undoRedoReset() {
    $.trigger( contentElem, Setup.undoEvent, false, true );
    $.trigger( contentElem, Setup.redoEvent, false, true );
}


/**
 * 构建元素路径序列。
 * 返回沿DOM树正向逐层元素信息的一个<b>封装序列。
 * @param  {Element} el 起点元素
 * @param  {Element} root 终止根元素
 * @return {[Element]}
 */
function pathList( el, root ) {
    let _els = [el].concat(
            $.parentsUntil( el, e => e === root )
        );
    return _els.reverse().map( el => pathElem( $.elem('b', elemInfo(el)), el ) );
}


/**
 * 存储/获取路径元素上的源目标元素。
 * - 存储时返回路径元素自身。
 * - 取值时返回路径上存储的源目标。
 * @param  {Element} to 路径元素
 * @param  {Element} src 源目标元素
 * @return {Element} 源目标或路径元素
 */
function pathElem( to, src ) {
    if ( src === undefined ) {
        return to[ pathsKey ];
    }
    return to[ pathsKey ] = src, to;
}


/**
 * 获取元素信息。
 * - 支持role特性，与标签名用分号分隔。
 * - 不支持其它如类名和ID。
 * @param {Element} el 目标元素
 */
function elemInfo( el ) {
    let _s = el.tagName.toLowerCase();

    if ( el.hasAttribute('role') ) {
        _s += ':' + el.getAttribute( 'role' );
    }
    return _s;
}


/**
 * 设置元素焦点。
 * 会同时设置焦点元素的路径提示序列。
 * 注记：
 * 如果无需跟踪焦点移动历史，则无需更新全局存储（如单纯的移动焦点）。
 * 选取类操作全局更新已在 ESEdit 内实现，无需在此处理。
 * 此处的更新主要用于元素编辑类需要处理焦点时。
 *
 * @param  {Element|null} el 待设置焦点元素
 * @return {Element|null} 之前的焦点
 */
function setFocus( el ) {
    if ( el == null ) {
        $.empty( pathContainer );
    } else {
        scrollIntoView( el );
        $.fill( pathContainer, pathList(el, contentElem) );
    }
    return __EHot.set( el );
}


/**
 * 焦点元素滚动到视口（就近显示）。
 * 注记：
 * - Safari 包含 scrollIntoViewIfNeeded 但不包含 scrollIntoView。
 * - Firefox 包含 scrollIntoView 但不包含 scrollIntoViewIfNeeded。
 * - Chrome, Edge 则同时包含两者。
 * @param {Element} el 目标元素
 */
function scrollIntoView( el ) {
    if ( el.scrollIntoViewIfNeeded ) {
        return el.scrollIntoViewIfNeeded( false );
    }
    el.scrollIntoView( {block: 'nearest'} );
}


/**
 * 扩展选取封装。
 * 包含两种状态：选取/取消选取。
 * 选取焦点会移动到集合最后一个元素上（如果已执行）。
 * @param {Element} hot 焦点元素
 * @param {[Element]} els 扩展集
 */
function expandSelect( hot, els ) {
    let _old = [...__ESet];
    __Selects.cleanUp( hot );

    if ( __Selects.expand(els, hot) === false ) {
        return;
    }
    hot = els[ els.length-1 ];

    historyPush( new ESEdit(_old, hot) );
}


/**
 * 兄弟元素同态（选取/取消选取）封装。
 * 注：焦点不变。
 * @param {[Element]} els 选取集
 * @param {Element} hot 焦点元素
 */
function siblingsUnify( els, hot ) {
    let _old = [...__ESet];
    __Selects.cleanUp( hot );

    if ( __Selects.expand(els, hot) === false ) {
        return;
    }
    historyPush( new ESEdit(_old, hot) );
}


/**
 * 普通元素集同态（选取/取消选取）封装。
 * 需要检查每一个成员的父级选取并清除之。
 * 注：焦点不变。
 * @param {[Element]} els 选取集
 * @param {Element} hot 焦点元素
 */
function elementsUnify( els, hot ) {
    let _old = [...__ESet];

    els.forEach(
        el => __Selects.cleanUp(el)
    );
    if ( __Selects.expand(els, hot) === false ) {
        return;
    }
    historyPush( new ESEdit(_old, hot) );
}


/**
 * 元素集选取封装。
 * 集合内的成员可能属于不同的父元素，
 * 因此需要逐一清理。
 * @param {[Element]} els 内容子元素
 * @param {Element} hot 焦点元素
 * @param {Boolean} start 是否头部插入，可选
 */
function elementsSelect( els, hot, start ) {
    let _old = [...__ESet],
        _fn = start ? 'unshift' : 'adds';

    els.forEach(
        el => __Selects.cleanUp(el)
    );
    if ( __Selects[_fn](els) === false ) {
        return;
    }
    historyPush( new ESEdit(_old, hot) );
}


/**
 * 单元素选取封装。
 * 不检查目标元素的父子选取情况（假定已合法）。
 * 注：焦点移动到目标元素。
 * @param {Element} to 目标元素
 * @param {[Element]} els 之前的选取集
 */
function elementSelect( to, els ) {
    if ( __Selects.add(to) === false ) {
        return;
    }
    historyPush( new ESEdit(els, to) );
}


/**
 * 微编辑开始。
 * 会重置 Undo/Redo 按钮为失效状态。
 * 非内容元素简单忽略。
 * @param  {Element} el 内容元素
 * @return {MiniEdit|null} 微编辑实例
 */
function miniedStart( el ) {
    if ( !el || !isContent(el) ) {
        return null;
    }
    let _rng = window.getSelection.getRangeAt(0),
        _obj = new MiniEdit(
            el,
            $.contains(el, _rng.commonAncestorContainer) && _rng
        );
    undoRedoReset();

    return __History.push(_obj), _obj;
}


/**
 * 提取选取集首个成员。
 * 注：用于Tab逐个微编辑各选取元素。
 * @param  {Boolean} blur 取消焦点，可选
 * @return {Element|void}
 */
function esetShift( blur ) {
    let _el = __ESet.first();
    if ( !_el ) return;

    if ( blur && __EHot.is(_el) ) {
        __EHot.cancel();
    }
    return __ESet.delete( _el );
}


/**
 * 普通模式：撤销。
 * @return {Boolean} 是否可以再撤销
 */
function undoNormal() {
    __History.undo();
    return __History.canUndo();
}


/**
 * 普通模式：重做。
 * @return {Boolean} 是否可以再重做
 */
function redoNormal() {
    __History.redo();
    return __History.canRedo();
}


/**
 * 修订模式：撤销。
 * @return {Boolean} 是否可以再撤销
 */
function undoMinied() {
    document.execCommand( 'undo' );
    return document.queryCommandEnabled( 'undo' );
}


/**
 * 修订模式：重做。
 * @return {Boolean} 是否可以再重做
 */
function redoMinied() {
    document.execCommand( 'redo' );
    return document.queryCommandEnabled( 'redo' );
}


/**
 * 是否包含子元素。
 * 集合中任一成员满足要求即可。
 * @param  {[Element]} els 元素集
 * @return {Boolean}
 */
function hasChildElement( els ) {
    for ( const el of els ) {
        if ( el.childElementCount > 0 ) return true;
    }
    return false;
}


/**
 * 是否按下元素焦点辅助键。
 * obj: { shift, ctrl, alt, meta }
 * @param {Object} obj 辅助键状态集
 */
function isElemFocus( obj ) {
    return cfg.Keys.elemFocus
        .split( /\s+/ ).every( n => obj[n.toLowerCase()] );
}


/**
 * 是否按下切换选取辅助键。
 * obj: { shift, ctrl, alt, meta }
 * @param {Object} obj 辅助键状态集
 */
function isTurnSelect( obj ) {
    return cfg.Keys.turnSelect
        .split( /\s+/ ).every( n => obj[n.toLowerCase()] );
}


/**
 * 是否可以内容文本化。
 * - 允许内容元素。
 * - 允许非单结构的内联元素（无害），如对<ruby>解构。
 * @param  {Element} el 容器元素
 * @return {Boolean}
 */
function canTotext( el ) {
    return isContent( el ) || (
        isInlines( el ) && !isEmpty( el )
    );
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
function canUnwrap( el ) {
    return isContent( el.parentElement ) && (
        isContent( el ) ||
        ( el.childElementCount === 0 && el.innerText.trim() )
    );
}


/**
 * 清除被删除元素的选取。
 * 返回false表示目标集为空，后续的编辑没有意义。
 * 返回的选取编辑实例需要进入历史栈。
 * @param  {[Element]} els 元素集
 * @return {ESEdit|false}
 */
function clearDeletes( els ) {
    if ( els.length == 0 ) {
        return false;
    }
    let _old = [...__ESet],
        _hot = __EHot.get();

    if ( els.includes(_hot) ) {
        _hot = setFocus( null );
    }
    __ESet.removes( els );

    return new ESEdit( _old, _hot );
}


/**
 * 构造兄弟元素集组。
 * 用于选取集分组执行相同操作。
 * @param  {Set} sels 选取集
 * @return {[[Element]]} 元素集组
 */
function teamSiblings( sels ) {
    let _map = new Map();

    for ( const el of sels ) {
        childSet( _map, el.parentElement ).push( el );
    }
    return [ ..._map.values() ];
}


/**
 * 获取子元素存储集。
 * 以父元素为键，如果不存在则自动创建。
 * @param  {Map} 存储集映射集
 * @param  {Element} key 存储键
 * @return {Set} 存储集
 */
function childSet( map, key ) {
    return map.get( key ) || map.set( key, [] ).get( key );
}


/**
 * 返回集合末尾成员。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function last( els ) {
    return els[ els.length - 1 ];
}


//
// 目录定位工具
//----------------------------------------------------------------------------


/**
 * 获取目录条目表达的章节序列。
 * @param  {Element} li 目录条目元素
 * @return {[Number]} 章节序列
 */
function pathsFromToc( li ) {
    return $.paths( li, 'nav[role=toc]', 'li' );
}


/**
 * 获取片区章节序列。
 * @param  {Element} h2 片区标题或片区元素
 * @return {[Number]} 章节序列
 */
function sectionPaths( h2 ) {
    return $.paths( h2, 'article', 'section' );
}


/**
 * 构建片区标题的目录条目选择路径。
 * 用途：
 * - 在标题元素微编辑时实时更新相应目录条目。
 * - 在新片区插入后在目录相应位置添加条目。
 * 注意：
 * 检索时需要提供直接父容器元素作为上下文（<nav:toc>）。
 * @param  {[Number]} chsn 章节序列
 * @return {String} 目录条目（<li>）的选择器
 */
function tocLiSelector( chsn ) {
    return chsn.map( n => `>ol>li:nth-child(${n})` ).join( ' ' );
}


/**
 * 构建片区标题选择路径。
 * 可用于数字章节序号定位到目标片区。
 * 也可用于单击目录条目时定位显示目标片区（不用ID）。
 * 注意：
 * 检索时需要提供直接父容器元素作为上下文（<article>）。
 * nth-of-type()只支持标签区分，故无role约束。
 *
 * @param  {[Number]|String} chsn 章节序列（兼容字符串表示）
 * @param  {String} sep 章节序列分隔符（仅在ns为字符串时有用）
 * @return {String} 片区标题（<h2>）的选择器
 */
function h2PathSelector( chsn, sep = '.' ) {
    if ( typeof chsn === 'string' ) {
        chsn = chsn.split( sep );
    }
    return chsn.map( n => `>section:nth-of-type(${+n})` ).join( ' ' ) + ' >h2';
}


//
// 通用工具。
//----------------------------------------------------------------------------


/**
 * 控制台警告。
 * @param {String} msg 输出消息
 */
function warn( msg ) {
    window.console.warn( msg );
}


/**
 * 帮助：
 * 提示错误并提供帮助索引。
 * 帮助ID会嵌入到提示链接中，并显示到状态栏。
 * @param {Number} hid 帮助ID
 * @param {String} msg 提示信息
 */
function help( hid, msg ) {
    if ( hid === null ) {
        return $.trigger( errContainer, 'off' );
    }
    // 构造链接……

    $.trigger( errContainer, 'on' );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 初始化全局数据。
 * 用于编辑器设置此模块中操作的全局目标。
 * @param {Element} content 编辑器容器（根元素）
 * @param {Element} pathbox 路径蓄力容器
 * @param {Element} errbox 出错信息提示容器
 */
export function init( content, pathbox, errbox ) {
    contentElem = content;
    pathContainer = pathbox;
    errContainer = errbox;

    // 开启tQuery变化事件监听。
    $.config({
        varyevent: true,
        // bindevent: true
    });
    $.on( content, varyEvents, null, __TQHistory );
}



//
// 内容区编辑处理集。
// 注：仅供快捷键映射对应。
// 2. 可供导入执行流直接调用（其方法）。
//
export const Edit = {

    //-- 焦点移动 ------------------------------------------------------------
    // n注记：空串会被转换为NaN。

    /**
     * 平级：前端元素。
     * n: 0值会移动到头部首个元素。
     * @param {Number} n 移动距离
     */
    focusPrevious( n ) {
        n = isNaN(n) ? 1 : n;

        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        setFocus( $.prev(_beg, (_, i) => i == n, true) || _beg.parentElement.firstElementChild );
    },


    /**
     * 平级：后端元素。
     * n: 0值会移动到末尾元素
     * @param {Number} n 移动距离
     */
    focusNext( n ) {
        n = isNaN(n) ? 1 : n;

        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        setFocus( $.next(_beg, (_, i) => i == n, true) || _beg.parentElement.lastElementChild );
    },


    /**
     * 纵深：上级元素。
     * 返回false表示目标超出范围。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param  {Number} n 上升层级数
     * @return {false|void}
     */
    focusUp( n ) {
        n = isNaN(n) ? 1 : n;

        let _beg = __EHot.get();

        if ( !_beg || n <= 0 ) {
            return;
        }
        let _to = $.closest( _beg, (el, i) => i == n || el === contentElem );

        return _to !== contentElem && setFocus( _to );
    },


    /**
     * 纵深：子元素序列。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 位置下标
     */
    focusDown( n ) {
        let _beg = __EHot.get(),
            _sub = _beg && $.children( _beg, n || 0 );

        return _sub && setFocus( _sub );
    },


    /**
     * 纵深：顶元素。
     * 注记：不支持计数逻辑。
     */
    focusTop() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _to = selectTop( _el, contentElem );

        return _to && setFocus( _to );
    },


    //-- 元素选取 ------------------------------------------------------------
    // 原地扩展，焦点不会移动。


    /**
     * [By] 单击聚焦/选取。
     * @param {Object} keys 辅助键状态
     */
    click( evo, keys ) {
        // 仅设置焦点。
        if ( isElemFocus(keys) ) {
            return setFocus( evo.data );
        }
        let _fn = isTurnSelect(keys) ? 'turn' : 'only',
            _old = [...__ESet];

        if ( __Selects[_fn](evo.data) === false ) {
            return;
        }
        historyPush( new ESEdit(_old, evo.data) );
    },

    __click: 1,


    /**
     * [By] 从路径添加。
     * 当用户单击路径上的目标时选取其关联元素。
     * 会检查父子包含关系并清理。
     * 如果辅助键匹配，仅移动焦点而非选取。
     * @param {Object} keys 辅助键状态
     */
    pathTo( evo, keys ) {
        // 仅移动焦点。
        if ( isElemFocus(keys) ) {
            return setFocus( evo.data );
        }
        let _old = [...__ESet];

        if ( __Selects.safeAdd(evo.data) === false ) {
            return;
        }
        historyPush( new ESEdit(_old, evo.data) );
    },

    __pathTo: 1,



    /**
     * 选取切换。
     * 键盘快捷键选取切换（Space）。
     */
    turn() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];
        if ( __Selects.turn(_el) === false ) {
            return;
        }
        historyPush( new ESEdit(_old, _el) );
    },


    /**
     * 集合成员反选。
     */
    reverse() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];
        __Selects.cleanUp( _el );

        if ( __Selects.reverse(_el.parentElement.children) === false ) {
            return;
        }
        historyPush( new ESEdit(_old, _el) );
    },


    /**
     * 同态全部兄弟元素。
     */
    siblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        siblingsUnify( _el.parentElement.children, _el );
    },


    /**
     * 取消同级兄弟元素选取。
     */
    cleanSiblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];

        if ( __Selects.removes(_el.parentElement.children) === false ) {
            return;
        }
        historyPush( new ESEdit(_old, _el) );
    },


    /**
     * 同态同类兄弟元素。
     * 同态：保持与焦点元素状态相同（选取/取消选取）。
     */
    tagsame() {
        let _el = __EHot.get();
        if ( !_el ) return;

        siblingsUnify( $.find(`>${_el.tagName}`, _el.parentElement), _el );
    },


    /**
     * 同态叔伯元素内的同类子元素。
     * 主要用于同章节内的子章节标题选取/取消选取。
     */
    tagsame2x() {
        let _el = __EHot.get();
        if ( !_el ) return;

        elementsUnify( $.find(`>* >${_el.tagName}`, _el.parentElement.parentElement), _el );
    },


    /**
     * 选取焦点元素内顶层内容元素。
     * 注记：
     * 当用户选取了非内容元素时，微编辑跳转仅定位为焦点，
     * 用户可以立即执行该操作以选取内部的内容根元素。
     */
    contentBoxes() {
        let _el = __EHot.get();
        if ( !_el ) return;

        elementsSelect( contentBoxes(_el), _el );
    },


    /**
     * 获取焦点元素内顶层内容元素，
     * 但新的元素集插入到集合的头部（unshift）。
     * 注记：（同上）
     */
    contentBoxesStart() {
        let _el = __EHot.get();
        if ( !_el ) return;

        elementsSelect( contentBoxes(_el), _el, true );
    },


    //-- 选取扩展 ------------------------------------------------------------
    // 焦点会移动到扩展目标。


    /**
     * 前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    previousN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        n = isNaN(n) ? 1 : n;

        expandSelect( _el, $.prevAll(_el, (_, i) => i <= n) );
    },


    /**
     * 前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    nextN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        n = isNaN(n) ? 1 : n;

        expandSelect( _el, $.nextAll(_el, (_, i) => i <= n) );
    },


    /**
     * 父级元素选取。
     * @param {Number} n 上升层数
     */
    parentN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];

        n = isNaN(n) ? 1 : n;
        _el = __Selects.parent( _el, n, contentElem );

        if ( _el ) elementSelect( _el, _old );
    },


    /**
     * 子元素选取。
     * @param {Number} n 子元素位置下标（从0开始）
     */
    childN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];
        _el = __Selects.child( _el, n || 0 );

        if ( _el ) elementSelect( _el, _old );
    },


    /**
     * 选取内容顶元素。
     * - 内联单元：行内容元素或单元格元素。
     * - 行块单元：单元逻辑根元素。
     */
    contentTop() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _to = selectTop( _el, contentElem );
        if ( !_to ) return;

        let _old = [...__ESet];

        __Selects.clean( _to );
        elementSelect( _to, _old );
    },


    //-- 元素编辑 ------------------------------------------------------------


    /**
     * 内容文本化。
     * 会忽略集合中都没有子元素的情形。
     * 影响：
     * - 对焦点和选取集不产生影响。
     * 注记：
     * 扩展到By部分，但此不需要evo实参。
     */
    toText() {
        let $els = $(__ESet).filter( canTotext );

        if ( $els.length !== __ESet.size ) {
            // 选取集包含非内容元素。
            help();
        }
        if ( $els.length === 0 || !hasChildElement($els) ) {
            return;
        }
        historyPush( new DOMEdit( () => __Elemedit.toText($els) ) );
    },


    /**
     * 内容提升（unwrap）。
     * 目标和目标的父元素都必须是内容元素。
     * 影响：
     * - 被操作的元素取消选取。
     * - 如果焦点在目标元素上，取消焦点。
     * 注记：（同上）
     */
    unWrap() {
        let $els = $(__ESet).filter( canUnwrap );

        if ( $els.length !== __ESet.size ) {
            // 选取元素及其父元素都必须为内容元素。
            help();
        }
        let _op = clearDeletes( $els );

        if ( _op ) historyPush( _op, new DOMEdit(() => __Elemedit.unWrap($els)) );
    },


    /**
     * 智能删除。
     * - 完整的逻辑单元（行块、内联）。
     * - 删除不影响结构逻辑的元素（如：<li>、<tr>等）。
     * 注：
     * 删除会破坏结构的中间结构元素不受影响（简单忽略）。
     */
    deletes() {
        let $els = $(__ESet)
            .filter( el => canDelete(el) );

        if ( $els.length !== __ESet.size ) {
            // 删除的元素必须是完整的单元。
            help();
        }
        let _op = clearDeletes( $els );

        if ( _op ) historyPush( _op, new DOMEdit(() => $els.remove()) );
    },


    /**
     * 强制删除。
     * 不再保护结构单元的结构。
     */
    deletesForce() {
        let $els = $(__ESet),
            _op = clearDeletes( $els );

        if ( _op ) {
            historyPush( _op, new DOMEdit(() => $els.remove()) );
        }
    },


    /**
     * 内容删除。
     * 目标内部内容根元素的文本、内联等内容（即可编辑内容）。
     */
    deleteContents() {
        let $cons = $(__ESet)
            .map( el => contentBoxes(el) ).flat(),
            _op = clearDeletes( $cons );

        if ( _op ) {
            historyPush( _op, new DOMEdit(() => $cons.empty()) );
        }
    },


    elementFill() {
        //
    },


    elementCloneFill() {
        //
    },


    /**
     * 撤销操作。
     * 注记：
     * 为避免一次性大量撤销可能导致浏览器假死，仅支持单步逐次撤销。
     * 因为共用按钮，微编辑状态下的撤销也集成于此，虽然它们逻辑上是独立的。
     */
    editUndo() {
        $.trigger(
            contentElem,
            Setup.undoEvent,
            currentMinied ? undoMinied() : undoNormal(),
            true
        );
    },


    /**
     * 重做操作。
     * 注记：（同上）
     */
    editRedo() {
        $.trigger(
            contentElem,
            Setup.redoEvent,
            currentMinied ? redoMinied() : redoNormal(),
            true
        );
    },


    /**
     * 进入微编辑。
     * 如果目标不是内容元素，会移动焦点到目标元素上。
     * 注记：
     * 内容元素应当已预先移出选取集。
     * 这样既清理了元素上的视觉表现（焦点/选取/路径提示），
     * 也使得克隆更干净。
     * @param {Element} el 内容元素
     */
    miniedIn( el ) {
        currentMinied = miniedStart( el );

        if ( !currentMinied ) {
            // 友好提示，
            // 同时也便于向下选取内容子元素。
            return __EHot.set( el );
        }
        currentMinied.cursor( el );
    },


    /**
     * 微编辑完成。
     * 同一时间最多只有一个元素处于微编辑态。
     * @param {Element} el 内容元素
     * @param {Boolean} done 是否为确认（否则为取消）
     */
    miniedOut( done = true ) {
        stateNewEdit();
        currentMinied[done ? 'done' : 'cancel']()
        currentMinied = null;
    },


    /**
     * 逐次微编辑。
     * - 对选取集成员进行逐个修订编辑。
     * - 选取成员需要全部是内容元素，否则忽略。
     * - 可能首个成员已经进入微编辑。
     * 注记：
     * 通常是在按Tab键，在多个已选取目标间跳转编辑时。
     * 友好：
     * 如果目标不是内容元素，会移动焦点到目标元素上。
     */
    miniEdits() {
        // 前阶结束。
        if ( currentMinied ) {
            currentMinied.done();
        }
        let _el = esetShift( true );

        if ( !(currentMinied = miniedStart(_el)) ) {
            stateNewEdit();
            return __EHot.set( _el );
        }
        currentMinied.cursor( _el );
    },

};


//
// 模板辅助工具集。
// 仅供模板中在调用链中使用。
//
export const Kit = {
    /**
     * 清空选取集。
     * ESC键最底层取消操作。
     * 注记：固定配置不提供外部定制。
     */
    selsEmpty() {
        let _old = [...__ESet];

        if ( __Selects.empty() === false ) {
            return;
        }
        historyPush( new ESEdit(_old, __EHot.get()) );
    },


    /**
     * 撤销：工具栏按钮。
     */
    undo() {
        Edit.editUndo();
    },


    /**
     * 重做：工具栏按钮。
     */
    redo() {
        Edit.editRedo();
    },


    /**
     * 获取选取集大小。
     * 用途：状态栏友好提示。
     * @return {Number}
     */
    esetSize() {
        return __ESet.size;
    },


    /**
     * 获取路径上存储的源目标。
     * 用途：鼠标指向路径时提示源目标（友好）。
     * @param  {Element} box 路径元素（容器）
     * @return {Element}
     */
    pathElem( box ) {
        return box[ pathsKey ];
    },
};


//
// 扩展到By（仅部分）。
//
processExtend( 'Ed', Edit, [
    'click',
    'pathTo',
    'toText',
    'unWrap'
]);


// debug:
window.ESet = __ESet;