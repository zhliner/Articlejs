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
import { selectTop } from "./base.js";


const
    $ = window.$,

    // 路径单元存储键。
    // 在路径序列元素上存储源元素。
    pathsKey = Symbol(),

    // 元素选取集实例。
    __ESet = new ESet( Setup.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Setup.focusClass ),

    // 光标实现实例。
    // 仅用于内容元素的微编辑。
    __elemCursor = new ElemCursor(),

    // DOM节点变化历史实例。
    __TQHistory = new $.Fx.History( Limit.history );



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
     * 记录一个操作实例。
     * @param  {Instance|[Instance]} obj 操作实例（集）
     * @return {Instance|[Instance]|false} 头部被移出的操作实例
     */
    push( obj ) {
        // 新入截断。
        this._buf.length = ++this._idx;
        return (this._buf.push(obj) - this._max) > 0 && this._shift();
    }


    /**
     * 撤销一步。
     * 操作实例可能是一个数组。
     */
    undo() {
        if ( this._idx < 0 ) {
            return warn('[undo] overflow.');
        }
        let _obj = this._buf[ this._idx-- ];

        $.isArray(_obj) ? _obj.reverse().forEach( o => o.undo() ) : _obj.undo();
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
// 注记：
// 选取集成员需要保持原始的顺序，较为复杂，
// 因此这里简化取操作前后的全集成员存储。
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

        this._el0 = this._focus( focus );
        this._el1 = focus;
    }


    /**
     * 撤销选取。
     * 先移除新添加的，然后添加被移除的。
     */
    undo() {
        __ESet.removes( this._els ).pushes( this._old );
        setFocus( this._el0 );
        this._focus( this._el0 );
    }


    /**
     * 重新选取。
     * 先移除需要移除的，然后添加新添加的。
     */
    redo() {
        __ESet.removes( this._old ).pushes( this._els );
        setFocus( this._el1 );
        this._focus( this._el1 );
    }


    /**
     * 记录当前焦点。
     * @param  {Element} el 焦点元素
     * @return {Element} 之前的焦点元素
     */
    _focus( el ) {
        let _old = ESEdit.currentFocus;
        ESEdit.currentFocus = el;
        return _old;
    }
}


//
// 当前焦点元素记录。
// 仅记录选取操作执行时的焦点（焦点自身的移动被忽略）。
//
ESEdit.currentFocus = null;


//
// 选区编辑。
// 用于鼠标划选创建内联单元时。
// 注记：
// 使用DOM原生接口，避免tQuery定制事件激发记录。
//
class RngEdit {
    /**
     * 外部条件：
     * 范围的首尾点需要在同一父元素内（正确嵌套）。
     * @param {Range} rng 范围对象
     * @param {Element} el 内联元素（数据）
     */
    constructor( rng, el ) {
        this._old = [
            ...rng.extractContents().childNodes
        ];
        rng.insertNode( el );
        this._el = el;
        // this._tmp = null;
    }


    undo() {
        let _box = this._el.parentElement;
        this._el.replaceWith( ...this._old );

        // 碎片化记录
        this._tmp = new RngEdit.Normalize( _box );
        _box.normalize();
    }


    redo() {
        this._tmp.back();
        this._old[0].replaceWith( this._el );

        this._old.slice(1).forEach( nd => nd.remove() );
    }
}

//
// 规范化回退实现。
// 注：撤销操作通常带来文本节点的碎片化。
//
RngEdit.Normalize = $.Fx.History.Normalize;


//
// 微编辑进出管理。
// 管理初始进入微编辑状态以及确认或取消。
// 提供完整内容的撤销和重做。
// 注记：
// 用一个新的元素执行微编辑以保持撤销后的引用有效。
// 外部可能需要先插入光标元素（考虑预先normalize），合并进入历史栈。
// 注意使用原生DOM接口，避免tQuery相关事件激发记录。
//
class MiniEdit {
    /**
     * 创建管理实例。
     * 管理元素的可编辑状态，在进入微编辑前构造。
     * @param {Element} el 内容元素
     */
    constructor( el ) {
        this._cp = $.clone( el, true, true, true );
        this._el = el;

        el.replaceWith( this._cp );
        this._cp.setAttribute( 'contenteditable', true );

        __elemCursor.cursor( this._cp );
    }


    /**
     * 微编辑完成。
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
     * 注记：
     * 无需重新进入微编辑，新的元素用于之后的引用。
     */
    redo() {
        this._el.replaceWith( this._cp );
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
     * 兄弟元素扩展添加/移出。
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
        return !this._set.has(el) && this._set.add( el );
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
// 大多数操作针对全局选取集实例（__ESet）。
//
class NodeVary {
    /**
     * @param {ESet} eset 全局选取集实例
     */
    constructor( eset ) {
        this._set = eset;
    }


    //
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
    pathContainer = null;




//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


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
    return _els.reverse().map( el => pathElem( $.element('b', elemInfo(el)), el ) );
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
 * @param  {Element} el 焦点元素
 * @param  {Element} root 终止根元素
 * @param  {Element} box 路径序列容器
 * @return {void}
 */
function setFocus( el ) {
    __EHot.set( el );
    if ( el == null ) {
        return $.empty( pathContainer );
    }
    scrollIntoView( el );
    $.fill( pathContainer, pathList(el, contentElem) );
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
 * 友好：会简单忽略无效的操作。
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

    setFocus( hot );
    __History.push( new ESEdit(_old, hot) );
}


/**
 * 兄弟元素选取封装。
 * 注：焦点不变。
 * @param {[Element]} els 选取集
 * @param {Element} hot 焦点元素
 */
function siblingsSelect( els, hot ) {
    let _old = [...__ESet];
    __Selects.cleanUp( hot );

    if ( __Selects.adds(els) === false ) {
        return;
    }
    __History.push( new ESEdit(_old, hot) );
}


/**
 * 普通元素集选取封装。
 * 需要检查每一个成员的父级选取并清除之。
 * 注：焦点不变。
 * @param {[Element]} els 选取集
 * @param {Element} hot 焦点元素
 */
function elementsSelect( els, hot ) {
    let _old = [...__ESet];

    els.forEach(
        el => __Selects.cleanUp(el)
    );
    if ( __Selects.adds(els) === false ) {
        return;
    }
    __History.push( new ESEdit(_old, hot) );
}


/**
 * 单元素选取封装。
 * 不检查目标元素的父子选取情况。
 * 注：焦点移动到目标元素。
 * @param {Element} to 目标元素
 */
function elementSelect( to ) {
    let _old = [...__ESet];

    if ( __Selects.add(to) === false ) {
        return;
    }
    setFocus( to );
    __History.push( new ESEdit(_old, to) );
}


/**??
 * 节点处理封装（含历史功能）。
 * 引用全局__Elemedit实例并执行其操作（方法）。
 * 友好：选取集为空时忽略用户操作。
 * @param {String} op 操作名
 * @param {...Value} args 参数序列
 */
function histNodes( op, ...args ) {
    if ( __ESet.size == 0 ) {
        return;
    }
    __History.push( new DOMEdit( () => __Elemedit[op](...args) ) );
}


function warn( msg ) {
    window.console.warn( msg );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 初始化全局数据。
 * 用于编辑器设置此模块中操作的全局目标。
 * @param {Element} content 编辑器容器（根元素）
 * @param {Element} pathbox 路径蓄力容器
 */
export function init( content, pathbox ) {
    contentElem = content;
    pathContainer = pathbox;
}


//
// By扩展集。
//
const _Edit = {
    /**
     * 选取集。
     * 适用方法：only, turn, safeAdd
     * 注：仅用于鼠标点选。
     * @param  {String} op 操作名
     * @return {void}
     */
    mouse( evo, op ) {
        let _old = [...__ESet];

        // 无条件改变焦点
        setFocus( evo.data );

        if ( __Selects[op](evo.data) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, evo.data) );
    },

    __mouse: 1,


    /**
     * 节点操作。
     * @param  {String} op 操作名
     * @return {void}
     */
    nodes( evo, op ) {
        // histNodes( op, evo.data );
    },

    __nodes: 1,


    /**
     * 撤销操作。
     * 注记：
     * 为避免一次大量撤销（可能为误操作）浏览器假死，
     * 仅支持单步逐次撤销。
     */
    undo() {
        __History.undo();
    },


    /**
     * 重做操作。
     */
    redo() {
        __History.redo();
    },

}

// 扩展到By。
processExtend( 'Ed', _Edit );



//
// 内容区快捷键处理集。
// 包含：
// - 焦点移动。无需进入编辑历史记录。
// - 元素选取。进入历史记录（可撤销），有混合操作。
// - 元素编辑。移动、克隆、删除等。
// 注记：
// 会使用全局对象进行处理。
//
export const MainOps = {

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


    //-- 元素选取 ------------------------------------------------------------


    // 切换选取
    turn() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];
        if ( __Selects.turn(_el) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 集合反选。
    reverse() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];
        __Selects.cleanUp( _el );

        if ( __Selects.reverse(_el.parentElement.children) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 全部兄弟元素。
    // 注记：焦点元素可能尚未选取。
    siblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        siblingsSelect( _el.parentElement.children, _el );
    },


    // 同类兄弟元素。
    // 注记：焦点元素可能尚未选取。
    tagsame() {
        let _el = __EHot.get();
        if ( !_el ) return;

        siblingsSelect( $.find(`>${_el.tagName}`, _el.parentElement), _el );
    },


    // 叔伯元素内的同类子元素。
    // 注：主要用于同章节内的子章节标题选取。
    sibling2x() {
        let _el = __EHot.get();
        if ( !_el ) return;

        elementsSelect( $.find(`>* >${_el.tagName}`, _el.parentElement.parentElement), _el );
    },


    // 前端兄弟元素添加/移出。
    // 选取焦点会移动到目标集最后一个元素。
    previousN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        n = isNaN(n) ? 1 : n;

        expandSelect( _el, $.prevAll(_el, (_, i) => i <= n) );
    },


    // 前端兄弟元素添加/移出。
    // 选取焦点会移动到目标集最后一个元素。
    nextN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        n = isNaN(n) ? 1 : n;

        expandSelect( _el, $.nextAll(_el, (_, i) => i <= n) );
    },


    // 父级元素选取。
    // 焦点会同时移动到目标元素。
    parentN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        n = isNaN(n) ? 1 : n;
        _el = __Selects.parent( _el, n, contentElem );

        if ( _el ) elementSelect( _el );
    },


    // 子元素选取。
    // 焦点会同时移动到目标元素。
    childN( n ) {
        let _el = __EHot.get();
        if ( !_el ) return;

        _el = __Selects.child( _el, n || 0 );

        if ( _el ) elementSelect( _el );
    },


    // 取消同级兄弟元素选取。
    cleanSiblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...__ESet];

        if ( __Selects.removes(_el.parentElement.children) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 选取内容顶元素。
    // - 内联单元：行内容元素或单元格元素。
    // - 行块单元：单元逻辑根元素。
    // 注：焦点会同时移动。
    contentTop() {
        let _el = __EHot.get(),
            _to = _el && selectTop(_el, contentElem);

        if ( _to ) {
            __Selects.clean( _to );
            elementSelect( _to );
        }
    },


    //-- 混合操作 ------------------------------------------------------------
    // 移动焦点的同时进行选取。


    //-- 元素编辑 ------------------------------------------------------------


    //-- 杂项功能 ------------------------------------------------------------
    // 供模板中直接取值使用


    // 获取焦点元素。
    // 用途：如内容区mouseout重置焦点信息。
    focusElem() {
        return __EHot.get();
    },


    // 清空选取集。
    // 用途：ESC键最底层取消操作。
    selsEmpty() {
        let _old = [...__ESet];

        if ( __Selects.empty() === false ) {
            return;
        }
        __History.push( new ESEdit(_old, __EHot.get()) );
    },


    // 获取选取集大小。
    // 用途：状态栏友好提示。
    esetSize() {
        return __ESet.size;
    },


    // 获取路径上存储的源目标。
    // 用途：鼠标指向路径时提示源目标（友好）。
    pathElem( box ) {
        return box[ pathsKey ];
    },


    /**
     * 撤销操作。
     * 注记：
     * 为避免一次大量撤销（可能为误操作）浏览器假死，
     * 仅支持单步逐次撤销。
     */
    editUndo() {
        __History.undo();
    },


    /**
     * 重做操作。
     */
    editRedo() {
        __History.redo();
    },
}



// debug:
window.ESet = __ESet;