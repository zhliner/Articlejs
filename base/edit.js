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

import { Sys, Limit, Help } from "../config.js";
import { processExtend } from "./tpb/pbs.by.js";
import { isContent, canDelete, canTotext, canUnwrap, virtualBox, contentBoxes, tableObj, cloneElement, getType } from "./base.js";
import { ESet, EHot, ElemCursor, prevNode, nextNode, siblingIndex } from './common.js';
import { children } from "./create.js";
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
    __ESet = new ESet( Sys.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Sys.focusClass ),

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


    /**
     * 记录了本次操作关联的全部变化，
     * 内部的变化可以在任何地方发生。
     */
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
     * 友好：未传递新的焦点元素表示焦点不变。
     * @param {[Element]} old 操作之前的元素集
     * @param {Element} focus 焦点元素，可选
     */
    constructor( old, focus = __EHot.get() ) {
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
// 焦点编辑。
// 用于编辑中的焦点取消和恢复。
// 注：
// 用户选取焦点无需进入历史栈。
//
class HotEdit {
    /**
     * @param {Element} hot 新焦点
     */
    constructor( hot ) {
        this._hot = hot;
        this._old = __EHot.set(hot);
    }


    undo() {
        __EHot.set( this._old );
    }


    redo() {
        __EHot.set( this._hot );
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
        // 原生调用，不影响编辑历史。
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
     * 普通添加。
     * 会检查父子包含关系并清理。
     * 如果已经选取则无行为。
     * @param  {Element} el 目标元素
     * @return {el|false}
     */
    add( el ) {
        return !this._set.has(el) && this.clean(el)._set.add(el);
    }


    /**
     * 安全添加。
     * 外部需要自行清理父子已选取。
     * @param  {Element} el 选取元素
     * @return {el|false}
     */
    safeAdd( el ) {
        return !this._set.has(el) && this._set.add(el);
    }


    /**
     * 安全添加元素集。
     * 外部保证父子选取已清理。
     * @param {[Element]} els 元素集
     */
    safeAdds( els ) {
        this._set.pushes( els );
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
     * 即清理目标元素的上级已选取。
     * 如果不存在上级选取，返回 false。
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
     * 即清理目标元素的子级已选取，可能包含多个成员。
     * 如果未实际执行清理，返回 false。
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


    /**
     * 各别前插。
     * 将新元素（集）一一对应下标插入目标元素之前。
     * 注：两个集合大小一样。
     * @param {Collector} $els 目标集
     * @param {Collector} $new 新元素集（支持二维）
     */
    befores( $els, $new ) {
        $els.forEach(
            (el, i) => $.before(el, $new[i] )
        );
    }


    /**
     * 定位前插。
     * 将同级兄弟元素向前移动/克隆到指定距离。
     * 零值距离表示端部，汇集插入。
     * @param {[Element]} els 目标元素集
     * @param {Number} n 前端距离
     */
    insertPrev( els, n ) {
        for ( const el of els ) {
            let _ref = prevNode( el, n );

            if ( _ref ) {
                $.before( _ref, el );
            } else {
                $.prepend( el.parentElement, el );
            }
        }
    }


    /**
     * 汇聚前插。
     * 每一组元素移动插入到自身容器最前端。
     * @param {[[Element]]} els2 兄弟元素集组
     */
    prepends( els2 ) {
        els2.forEach(
            subs => $.prepend( subs[0].parentElement, subs )
        );
    }


    /**
     * 定位后添加。
     * 将同级兄弟元素向后移动/克隆到指定距离。
     * 零值距离表示端部，汇集添加。
     * @param {[Element]} els 目标元素集
     * @param {Number} n 后端距离
     */
    appendNext( els, n ) {
        for ( const el of els ) {
            let _ref = nextNode( el, n );

            if ( _ref ) {
                $.after( _ref, el );
            } else {
                $.append( el.parentElement, el );
            }
        }
    }


    /**
     * 汇聚后添加。
     * 每一组元素移动插入到自身容器末端。
     * @param {[[Element]]} els2 兄弟元素集组
     */
    appends( els2 ) {
        els2.forEach(
            subs => $.append( subs[0].parentElement, subs )
        );
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
    $.trigger( contentElem, Sys.undoEvent, true, true );
    $.trigger( contentElem, Sys.redoEvent, false, true );
}


/**
 * 状态重置。
 * 设置 Undo/Redo 按钮为失效状态（初始）。
 */
function undoRedoReset() {
    $.trigger( contentElem, Sys.undoEvent, false, true );
    $.trigger( contentElem, Sys.redoEvent, false, true );
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
        $.intoView( el, 0 );
        $.fill( pathContainer, pathList(el, contentElem) );
    }
    return __EHot.set( el );
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
 * 内容子单元可能属于不同的父容器，而焦点元素也可能未选取，
 * 因此需要逐一清理。
 * @param {[Element]} els 内容子元素
 * @param {Element} hot 焦点元素
 * @param {Boolean} start 是否头部插入，可选
 */
function elementsSelect( els, hot, start ) {
    let _old = [...__ESet],
        _fn = start ? 'unshift' : 'adds';

    els.forEach(
        el => __Selects.cleanUp( el )
    );
    if ( __Selects[_fn](els) === false ) {
        return;
    }
    historyPush( new ESEdit(_old, hot) );
}


/**
 * 单元素简单操作。
 * 通过 clean 回调自行必要的清理（如果需要）。
 * 注：焦点移动到目标元素。
 * @param {Element} el 目标元素
 * @param {String} meth 操作方法（turn|only|add|safeAdd）
 * @param {Function} clean 前置清理回调，可选
 */
function elementOne( el, meth, clean ) {
    let _old = [...__ESet];
    clean && clean();
    __Selects[meth](el) !== false && historyPush( new ESEdit(_old, el) );
}


/**
 * 添加元素集选取。
 * 假定父级未选取，会自动清理子级已选取成员。
 * 用途：虚焦点系列操作。
 * @param  {[Element]} els 当前选取集
 * @param  {Function} gets 获取新元素集回调
 * @return {ESEdit|void}
 */
function elementAdds( els, gets ) {
    if ( theSibling(els) ) {
        return;
    }
    for ( const el of els ) {
        __Selects.cleanUp( el );

        // 当前el可能已被叔伯清理掉。
        __Selects.adds( gets(el) );
    }
    return new ESEdit( els );
}


/**
 * 平级：向前端移动。
 * n: 0值会移动到头部首个元素。
 * handle:
 * function( els:[Element], beg:Element ): void
 * 注记：
 * 只有状态合适时才会调用 handle，下同。
 * @param {Element} hot 焦点元素
 * @param {Number} n 移动距离
 * @param {Function} handle 调用句柄
 */
function previousCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n || Infinity;

    if (!hot || n < 0) {
        return;
    }
    handle( $.prevAll(hot, (_, i) => i <= n), hot );
}


/**
 * 平级：向后端移动。
 * n: 0值会移动到末尾元素。
 * @param {Element} hot 焦点元素
 * @param {Number} n 移动距离
 * @param {Function} handle 调用句柄
 */
function nextCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n || Infinity;

    if (!hot || n < 0) {
        return;
    }
    handle( $.nextAll(hot, (_, i) => i <= n), hot );
}


/**
 * 纵深：上级元素。
 * 返回false表示目标超出范围。
 * 注意：需要提供准确距离值，0值没有特殊含义。
 * @param {Element} hot 焦点元素
 * @param {Number} n 上升层级数
 * @param {Function} handle 调用句柄
 */
function parentCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n;

    if (!hot || n <= 0) {
        return;
    }
    let _to = $.closest( hot, (el, i) => i == n || el === contentElem );

    handle( _to !== contentElem && _to);
}


/**
 * 纵深：目标子元素。
 * handle: function( to, hot:Element ): null
 * @param {Element} hot 焦点元素
 * @param {Number} n 子元素位置下标（从0开始，支持负值）
 * @param {Function} handle 调用句柄
 */
function childCall( hot, n, handle ) {
    n = n || 0;

    if ( !hot || n < 0 ) {
        return;
    }
    handle( $.children(hot, n) );
}


/**
 * 纵深：顶元素操作。
 * @param {Element} hot 焦点元素
 * @param {Function} handle 调用句柄
 */
function topCall( hot, handle ) {
    hot && handle( virtualBox(hot, contentElem) );
}


/**
 * 检查选取集是否变化。
 * @param  {[Element]} old 原选取集
 * @return {Boolean}
 */
function stillSame( old ) {
    if ( old.length !== __ESet.size ) {
        return false;
    }
    return $.every( __ESet, (el, i) => old[i] === el );
}


/**
 * 设置元素位置。
 * 外部需要预先设置元素的 position:absolute 样式。
 * @param  {Collector} $els 目标元素集
 * @param  {String} name 样式名（left|top|right|bottom）
 * @param  {Number} inc 递增像素值
 * @return {DOMEdit|void}
 */
function elementsPostion( $els, name, inc ) {
    if ( !$els.length ) {
        return;
    }
    let _fx = v => `${(parseFloat(v) || 0) + inc}px`;

    return new DOMEdit( () => $els.css(name, _fx) );
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
 * 清除元素集的选取。
 * 返回的选取编辑实例需要进入历史栈。
 * @param  {[Element]} els 待删除元素集
 * @param  {Boolean} xhot 是否移除元素焦点
 * @return {ESEdit} 选取操作实例
 */
function clearSelected( els, xhot ) {
    let _hot = __EHot.get();

    if ( xhot && els.includes(_hot) ) {
        _hot = null;
    }
    __ESet.removes( els );

    return new ESEdit( els, _hot );
}


/**
 * 压入元素选取。
 * @param  {[Element]} els 目标元素集
 * @param  {Element} hot 当前焦点元素，可选
 * @return {ESEdit} 选取操作实例
 */
function pushesSelect( els, hot ) {
    let _old = [...__ESet];
    __ESet.pushes( els );
    return new ESEdit( _old, hot );
}


/**
 * 相邻元素集分组。
 * 相邻判断忽略中间间隔的纯文本节点。
 * @param  {[Element]} els 有序元素集
 * @return {[[Element]]} 相邻元素集组
 */
function adjacentTeam( els ) {
    let _sub = [ els.shift() ],
        _buf = [ _sub ];

    for ( const el of els ) {
        if ( el.previousElementSibling === last(_sub) ) {
            _sub.push( el );
        } else {
            _buf.push( (_sub = [el]) );
        }
    }
    return _buf;
}


/**
 * 克隆元素集组。
 * 克隆的新元素依然保持原样的分组模式。
 * @param  {[[Element]]} els2 相邻元素集组
 * @return {[[Element]]} 克隆集
 */
function cloneTeam( els2 ) {
    return els2.map(
        els => els.map( el => cleanedClone(el) )
    );
}


/**
 * 兄弟节点分组。
 * @param  {[Element]} els 元素集
 * @return {[[Element]]}
 */
function siblingTeam( els ) {
    let _map = new Map();

    for ( const el of els ) {
        let _pel = el.parentElement;

        ( _map.get(_pel) || _map.set(_pel, []).get(_pel) )
        .push( el );
    }
    return [ ..._map.values() ];
}


/**
 * 元素干净克隆。
 * 避免焦点元素的状态被克隆。
 * @param  {Element} el 目标元素
 * @return {Element} 新元素
 */
function cleanedClone( el ) {
    let _hot = __EHot.get();
    try {
        if ( _hot === el ) __EHot.set( null );
        return cloneElement( el );
    }
    finally {
        if ( _hot === el ) __EHot.set( _hot );
    }
}


/**
 * 检索集合中首个不能删除的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function deleteBadit( els ) {
    for ( const el of els ) {
        if ( !canDelete(el) ) return el;
    }
}


/**
 * 检索集合中首个不能文本化的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function totextBadit( els ) {
    for ( const el of els ) {
        if ( !canTotext(el) ) return el;
    }
}


/**
 * 检索集合中首个不能解封装的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function unwrapBadit( els ) {
    for ( const el of els ) {
        if ( !canUnwrap(el) ) return el;
    }
}


/**
 * 选取单元格所属列。
 * 局限于同一表区域之内。
 * @param  {Element} cell 单元格
 * @param  {$.Table} tbo 表格实例
 * @param  {TableSection} tsec 表区域（<tbody>|<thead>|<tfoot>），可选
 * @return {[Element]} 单元格集
 */
function columnCells( cell, tbo, tsec ) {
    let _idx = tbo.cellIndex( cell );

    if ( $.isArray(_idx) ) {
        return columnCells2( tbo, _idx, tsec );
    }
    return tbo.column( _idx, tsec );
}


/**
 * 获取多列单元格。
 * 可以正常处理跨列的情况。
 * 结果集成员为按列纵向顺序。
 * @param  {$.Table} tbo 表格实例
 * @param  {Number} beg 起始下标
 * @param  {Number} end 终点下标（不含）
 * @param  {TableSection} tsec 表区域
 * @return {[Element]}
 */
function columnCells2( tbo, [beg, end], tsec ) {
    let _buf = new Set();

    for (let i = beg; i < end; i++) {
        tbo.column( i, tsec ).forEach( el => _buf.add(el) );
    }
    return [ ..._buf ];
}


/**
 * 获取首个互为兄弟的元素。
 * 如果在集合中找到为其它成员兄弟的元素，返回该元素。
 * 空集或所有成员都是其父元素内唯一子元素时，返回 true。
 * 如果集合成员都是平级单一选取元素时，返回 false。
 * 注记：
 * 用于虚焦点平级操作前的合法性检测，返回真值即不可继续。
 * @param  {[Element]} els 元素集
 * @return {Element|Boolean}
 */
function theSibling( els ) {
    let _set = new Set(),
        _cnt = 0;

    for ( const [i, el] of els.entries() ) {
        let _box = el.parentElement;
        _cnt += _box.childElementCount;

        if ( _set.add(_box).size === i ) {
            // 返回元素可用于帮助提示。
            return warn('repeat sibling:', el) || el;
        }
    }
    return _cnt === els.length;
}


/**
 * 集合成员是否为相同单元。
 * 如果tval无值，取首个成员类型即可。
 * 用于相同类型的属性批量修改。
 * @param  {[Element]} els 元素集
 * @param  {Number} tval 单元类型值，可选
 * @return {Boolean}
 */
function sameType( els, tval ) {
    tval = tval || getType( els[0] );
    return els.every( el => getType(el) === tval );
}


/**
 * 集合成员是否为相同类型元素。
 * 如果tag无值，取首个成员取值即可。
 * 如用于判断片区类型（s1-s5）。
 * @param  {[Element]} els 元素集
 * @param  {Number} tag 单元标签名，可选
 * @return {Boolean}
 */
function sameTag( els, tag ) {
    tag = tag || els[0].tagName;
    return els.every( el => el.tagName === tag );
}


/**
 * 构建“元素:位置”选择器。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function nthSelector( el ) {
    return `${ el.tagName }:nth-child(${ $.prevAll(el).length + 1 })`;
}


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
 * @param  {[Number]} chsn 章节序列
 * @return {String} 片区标题（<h2>）的选择器
 */
function h2PathSelector( chsn ) {
    return chsn.map( n => `>section:nth-of-type(${+n})` ).join( ' ' ) + ' >h2';
}


/**
 * 返回集合末尾成员。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function last( els ) {
    return els[ els.length - 1 ];
}


/**
 * 帮助：
 * 提示错误并提供帮助索引。
 * 帮助ID会嵌入到提示链接中，并显示到状态栏。
 * 如果有关联元素，鼠标指向可背影提示，单击设置焦点。
 * @param {String} hid 帮助ID
 * @param {String} msg 提示信息
 * @param {Element} el 关联元素，可选
 */
function help( hid, msg, el ) {
    if ( hid === null ) {
        return $.trigger( errContainer, 'off' );
    }
    // 构造链接……

    $.trigger( errContainer, 'on' );
}


/**
 * 控制台警告。
 * @param {String} msg 输出消息
 */
function warn( msg, data ) {
    window.console.warn( msg, data );
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
        previousCall(
            __EHot.get(),
            n,
            els => els.length && setFocus( last(els) )
        );
    },


    /**
     * 平级：后端元素。
     * n: 0值会移动到末尾元素。
     * @param {Number} n 移动距离
     */
    focusNext( n ) {
        nextCall(
            __EHot.get(),
            n,
            els => els.length && setFocus( last(els) )
        );
    },


    /**
     * 纵深：上级元素。
     * 超出范围的目标指定被忽略。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param {Number} n 上升层级数
     */
    focusParent( n ) {
        parentCall(
            __EHot.get(),
            n,
            el => el && setFocus(el)
        );
    },


    /**
     * 纵深：目标子元素。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 位置下标
     */
    focusChild( n ) {
        childCall(
            __EHot.get(),
            n,
            el => el && setFocus(el)
        );
    },


    /**
     * 纵深：顶元素。
     * 注记：不支持计数逻辑。
     */
    focusItemTop() {
        topCall(
            __EHot.get(),
            el => el && setFocus(el)
        );
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
        elementOne( evo.data, isTurnSelect(keys) ? 'turn' : 'only' );
    },

    __click: 1,


    /**
     * [By] 从路径添加关联元素。
     * 需要检查父子包含关系并清理。
     * @param {Object} keys 辅助键状态
     */
    pathTo( evo, keys ) {
        // 仅移动焦点。
        if ( isElemFocus(keys) ) {
            return setFocus( evo.data );
        }
        elementOne( evo.data, 'add' );
    },

    __pathTo: 1,



    /**
     * 选取切换。
     * 键盘快捷键选取切换（Space）。
     */
    turn() {
        let _el = __EHot.get();
        return _el && elementOne( _el, 'turn' );
    },


    /**
     * 集合成员反选。
     */
    reverse() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];

        // 可能为已选取元素子元素。
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
     * 用途：同章节内的子章节标题选取/取消选取。
     * 注记：父级叔伯可能已选取。
     */
    tagsame2() {
        let _el = __EHot.get();
        if ( !_el ) return;

        elementsUnify( $.find(`>* >${_el.tagName}`, _el.parentElement.parentElement), _el );
    },


    /**
     * 同态叔伯元素内的同类同位置子元素。
     * 用途：对表区域（如<tbody>）内同列单元格选取或取消选取。
     * 注记：父级叔伯可能已选取。
     */
    tagsame2x() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _pel = _el.parentElement;

        if ( _pel.tagName !== 'TR' ) {
            return elementsUnify( $.find( `>* >${ nthSelector(_el) }`, _pel.parentElement ), _el );
        }
        // 单元格单独处理。
        // 因为存在跨列单元格的逻辑列问题。
        let _tsec = _pel.parentElement;

        elementsUnify( columnCells(_el, tableObj(_tsec.parentElement), _tsec), _el );
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
     * 同态：前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    previous( n ) {
        previousCall(
            __EHot.get(),
            n,
            (els, beg) => expandSelect( beg, els )
        );
    },


    /**
     * 同态：前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    next( n ) {
        nextCall(
            __EHot.get(),
            n,
            (els, beg) => expandSelect( beg, els )
        );
    },


    /**
     * 父级元素选取。
     * 可能存在同级兄弟元素选取，因此需要向下清理。
     * 焦点元素可能在已选取父级元素内，而目标父级元素并未抵达该选取元素，
     * 因此也需要向上级清理。
     * @param {Number} n 上升层数
     */
    parent( n ) {
        return parentCall(
            __EHot.get(),
            n,
            el => el && elementOne( el, 'safeAdd', () => __Selects.clean(el) )
        );
    },


    /**
     * 子元素选取。
     * 焦点元素可能在已选取父级元素之内，因此需要向上清理。。
     * @param {Number} n 子元素位置下标（从0开始）
     */
    child( n ) {
        return childCall(
            __EHot.get(),
            n,
            el => el && elementOne( el, 'safeAdd', () => __Selects.cleanUp(el) )
        );
    },


    /**
     * 选取顶元素。
     * - 内联单元：行内容元素或单元格元素。
     * - 行块单元：单元逻辑根元素。
     * - 内联内结构：所属内联元素。
     * 注记：清理逻辑同.parentN。
     */
    itemTop() {
        topCall(
            __EHot.get(),
            el => el && elementOne( el, 'safeAdd', () => __Selects.clean(el) )
        );
    },


    //-- 移动选取 ------------------------------------------------------------
    // 单选：焦点移动到目标元素


    /**
     * 单选：平级前端元素。
     * n: 0值会移动到头部首个元素。
     * @param {Number} n 移动距离
     */
    onlyPrevious( n ) {
        previousCall(
            __EHot.get(),
            n,
            els => els.length && elementOne( last(els), 'only' )
        );
    },


    /**
     * 单选：平级后端元素。
     * n: 0值会移动到末尾元素。
     * @param {Number} n 移动距离
     */
    onlyNext( n ) {
        nextCall(
            __EHot.get(),
            n,
            els => els.length && elementOne( last(els), 'only' )
        );
    },


    /**
     * 单选：上级元素。
     * 返回false表示目标超出范围。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param {Number} n 移动距离
     */
    onlyParent( n ) {
        parentCall(
            __EHot.get(),
            n, el => el && elementOne(el, 'only')
        );
    },


    /**
     * 单选：目标子元素。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 移动距离
     */
    onlyChild( n ) {
        childCall(
            __EHot.get(),
            n, el => el && elementOne(el, 'only')
        );
    },


    /**
     * 单选：顶元素。
     */
    onlyItemTop() {
        topCall(
            __EHot.get(),
            el =>  el && elementOne(el, 'only')
        );
    },


    //-- 虚焦点相关 ----------------------------------------------------------
    // 实际焦点不变了。


    /**
     * 兄弟全选（a）。
     * 注记：
     * 如果选取集成员存在叔侄关系，就会有清理覆盖，
     * 后选取的元素会清理掉先选取的元素。
     */
    siblingsVF() {
        let _op = elementAdds(
            [...__ESet],
            el => el.parentElement.children
        );
        _op && historyPush( _op );
    },


    /**
     * 兄弟同类选取（e）
     * 注记同上。
     */
    tagsameVF() {
        let _op = elementAdds(
            [...__ESet],
            el => $.find( `>${el.tagName}`, el.parentElement )
        );
        _op && historyPush( _op );
    },


    /**
     * 前向扩选。
     * 注记同前。
     */
    previousVF( n ) {
        n = isNaN(n) ? 1 : n;

        let _op = elementAdds(
            [...__ESet],
            el => $.prevAll( el, (_, i) => i <= n )
        );
        _op && historyPush( _op );
    },


    /**
     * 后向扩选。
     * 注记同前。
     */
    nextVF( n ) {
        n = isNaN(n) ? 1 : n;

        let _op = elementAdds(
            [...__ESet],
            el => $.nextAll( el, (_, i) => i <= n )
        );
        _op && historyPush( _op );
    },


    /**
     * 向下内容根（z）。
     * 注记：向内检索各自独立，先移除自身即可。
     */
    contentBoxesVF() {
        let _old = [ ...__ESet ];

        for ( const el of _old ) {
            __Selects.delete( el );
            __Selects.safeAdds( contentBoxes(el) );
        }
        // 元素自身即可能为内容根（无改选）。
        stillSame(_old) || historyPush( new ESEdit(_old) );
    },


    /**
     * 子元素定位。
     * 注记同上。
     */
    childVF( n ) {
        let _old = [ ...__ESet ];
        n = n || 0;

        for ( const el of _old ) {
            let _sub = $.children( el, n );

            if ( _sub ) {
                __Selects.delete( el );
                __Selects.safeAdd( _sub );
            }
        }
        // 可能无子元素（无改选）。
        stillSame(_old) || historyPush( new ESEdit(_old) );
    },


    /**
     * 父级选取。
     * 注记：叔伯元素选取重叠，需上下清理。
     */
    parentVF( n ) {
        let _old = [ ...__ESet ];

        for ( const el of _old ) {
            parentCall(
                el,
                n,
                box => box && __Selects.add( box )
            );
        }
        // 顶层再向上无效（无改选）。
        stillSame(_old) || historyPush( new ESEdit(_old) );
    },


    /**
     * 上级顶元素。
     * 注记同上。
     */
    itemTopVF() {
        let _old = [ ...__ESet ];

        for ( const el of _old ) {
            topCall(
                el,
                top => top && __Selects.add( top )
            );
        }
        // 顶层再向上无效（无改选）。
        stillSame(_old) || historyPush( new ESEdit(_old) );
    },


    //-- 元素编辑 ------------------------------------------------------------


    /**
     * 内容文本化。
     * 会忽略集合中都没有子元素的情形。
     * 注记：
     * 扩展到By部分，但此不需要evo实参。
     */
    toText() {
        let $els = $(__ESet);

        if ( $els.length === 0 || !hasChildElement($els) ) {
            return;
        }
        if ( !$els.every(canTotext) ) {
            // 选取集包含非内容元素。
            return help(
                Help.hasNotCons[0],
                Help.hasNotCons[1],
                totextBadit( $els )
            );
        }
        historyPush( new DOMEdit( () => __Elemedit.toText($els) ) );
    },

    __toText: null,


    /**
     * 内容提升（unwrap）。
     * 目标和目标的父元素都必须是内容元素。
     * - 被操作的元素取消选取。
     * - 如果焦点在目标元素上，取消焦点。
     * 注记：（同上）
     */
    unWrap() {
        let $els = $(__ESet);

        if ( $els.length === 0 ) {
            return;
        }
        if ( !$els.every(canUnwrap) ) {
            // 选取元素及其父元素都必须为内容元素。
            return help(
                Help.bothCons[0],
                Help.bothCons[1],
                unwrapBadit( $els )
            );
        }
        historyPush( clearSelected($els, true), new DOMEdit(() => __Elemedit.unWrap($els)) );
    },

    __unWrap: null,


    /**
     * 智能删除。
     * - 完整的逻辑单元（行块、内联）。
     * - 删除不影响结构逻辑的元素（如：<li>、<tr>等）。
     * 注：
     * 删除会破坏结构的中间结构元素不受影响（简单忽略）。
     */
    deletes() {
        let $els = $(__ESet);

        if ( $els.length === 0 ) {
            return;
        }
        if ( !$els.every(canDelete) ) {
            // 包含了不能被删除的元素。
            return help(
                Help.hasNotDels[0],
                Help.hasNotDels[1],
                deleteBadit( $els )
            );
        }
        historyPush( clearSelected($els, true), new DOMEdit(() => $els.remove()) );
    },


    /**
     * 强制删除。
     * 不再保护结构单元的结构。
     */
    deleteForce() {
        let $els = $(__ESet);

        if ( $els.length === 0 ) {
            return;
        }
        historyPush( clearSelected($els, true), new DOMEdit(() => $els.remove()) );
    },


    /**
     * 内容删除。
     * 内部内容根元素的内容（文本、内联等）。
     */
    deleteContents() {
        let $cons = $(__ESet)
            .map( el => contentBoxes(el) ).flat();

        if ( $cons.length === 0 ) {
            return;
        }
        historyPush( clearSelected($cons, true), new DOMEdit(() => $cons.empty()) );
    },


    elementFill() {
        //
    },


    elementCloneFill() {
        //
    },


    elementBefore() {
        //
    },


    elementCloneBefore() {
        //
    },


    elementAfter() {
        //
    },


    elementCloneAfter() {
        //
    },


    /**
     * 原地克隆（各别）。
     * 与焦点元素无关。
     * 注记：
     * 出于编辑灵活性，允许任意中间结构元素克隆。
     */
    elementCloneSelf() {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        let $new = $els.map( el => cleanedClone(el) );

        historyPush(
            clearSelected( $els ),
            new DOMEdit( () => __Elemedit.befores($els, $new) ),
            pushesSelect( $new )
        );
    },


    /**
     * 原地克隆（分组）。
     * 与焦点元素无关。
     */
    elementCloneTeam() {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        let _els2 = adjacentTeam( $els.sort() ),
            _refs = _els2.map( els => els[0] ),
            _new2 = cloneTeam( _els2 );

        historyPush(
            clearSelected( $els ),
            new DOMEdit( () => __Elemedit.befores(_refs, _new2) ),
            pushesSelect( _new2.flat() )
        );
    },


    //-- 移动&缩进 -----------------------------------------------------------
    // 操作选取集，与焦点元素无关。
    // 当前选取不变。

    /**
     * 向前移动（平级）。
     * 并列兄弟元素按DOM节点顺序移动，
     * 距离超出范围会导致部分或全部兄弟元素反序排列。
     * n: {
     *      0: 正序端部，离散节点会汇聚
     *     -n: 负数表示极大数（到顶端且全反序）
     * }
     * @param {Number} n 移动距离
     */
    movePrevious( n ) {
        let $els = $(__ESet).sort();

        if ( !$els.length || !prevNode($els[0]) ) {
            return;
        }
        n = isNaN(n) ? 1 : n;

        if ( n === 0 ) {
            let _els2 = siblingTeam( $els );
            return historyPush( new DOMEdit(() => __Elemedit.prepends(_els2)) );
        }

        historyPush( new DOMEdit(() => __Elemedit.insertPrev($els, n)) );
    },


    /**
     * 向后移动（平级）。
     * 并列兄弟元素按DOM节点逆序移动，
     * 距离超出范围会导致部分或全部兄弟元素反序排列。
     * n: 参考同 movePrevious
     * @param {Number} n 移动距离
     */
    moveNext( n ) {
        let $els = $(__ESet).sort();

        if ( !$els.length || !nextNode(last($els)) ) {
            return;
        }
        n = isNaN(n) ? 1 : n;

        if ( n === 0 ) {
            let _els2 = siblingTeam( $els );
            return historyPush( new DOMEdit(() => __Elemedit.appends(_els2)) );
        }

        historyPush( new DOMEdit(() => __Elemedit.appendNext($els, n)) );
    },


    /**
     * 减少缩进。
     * 仅适用章节（section）单元。
     * 当前章节提升一级插入到原所属章节之前。
     */
    indentLess() {
        let $els = $( __ESet );

        if ( !$els.length || !sameTag($els, 'SECTION') ) {
            return;
        }
        // ...
    },


    /**
     * 增加缩进。
     * 仅适用章节（section）单元。
     * 当前章节降一级，插入原地构造的一个平级空章节。
     */
    indentMore() {
        //
    },


    //-- 杂项编辑 ------------------------------------------------------------

    /**
     * 撤销操作。
     * 注记：
     * 为避免一次性大量撤销可能导致浏览器假死，仅支持单步逐次撤销。
     * 因为共用按钮，微编辑状态下的撤销也集成于此，虽然它们逻辑上是独立的。
     */
    editUndo() {
        $.trigger(
            contentElem,
            Sys.undoEvent,
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
            Sys.redoEvent,
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


    //-- 定位移动 ------------------------------------------------------------
    // 前提：position:absolute
    // 普通移动为 1px/次，增强移动为 10px/次
    // 操作的是 left/top 两个样式，与 right/bottom 无关。


    moveToLeft() {
        let _op = elementsPostion( $(__ESet), 'left', -1 );
        _op && historyPush( _op );
    },


    moveToLeftTen() {
        let _op = elementsPostion( $(__ESet), 'left', -10 );
        _op && historyPush( _op );
    },


    moveToRight() {
        let _op = elementsPostion( $(__ESet), 'left', 1 );
        _op && historyPush( _op );
    },


    moveToRightTen() {
        let _op = elementsPostion( $(__ESet), 'left', 10 );
        _op && historyPush( _op );
    },


    moveToUp() {
        let _op = elementsPostion( $(__ESet), 'top', -1 );
        _op && historyPush( _op );
    },


    moveToUpTen() {
        let _op = elementsPostion( $(__ESet), 'top', -10 );
        _op && historyPush( _op );
    },


    moveToDown() {
        let _op = elementsPostion( $(__ESet), 'top', 1 );
        _op && historyPush( _op );
    },


    moveToDownTen() {
        let _op = elementsPostion( $(__ESet), 'top', 10 );
        _op && historyPush( _op );
    },


    //-- 杂项功能 ------------------------------------------------------------

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
        historyPush( new ESEdit(_old) );
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