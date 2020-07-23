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

import { ESet, EHot } from './common.js';
import { Setup, Limit } from "../config.js";
import { processExtend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // 元素选取集实例。
    __ESet = new ESet( Setup.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Setup.focusClass ),

    // DOM节点变化历史实例。
    __TQHistory = new $.Fx.History( Limit.history );



//
// 编辑历史管理器。
// 管理内部实现了 undo/redo 接口的编辑处理实例。
//
class History {
    /**
     * 构造一个编辑实例。
     * @param {Number} size 编辑历史长度
     */
    constructor( size ) {
        this._max = size;
        this._buf = [];
        this._idx = -1;
    }


    /**
     * 记录一个操作实例。
     * @param  {.undo/.redo} obj 操作实例
     * @return {.undo/.redo|false} 头部被移出的操作实例
     */
    push( obj ) {
        this._buf.lenght = ++this._idx;

        let _len = this._buf.push(obj) - this._max;

        return _len > 0 && this._buf.shift();
    }


    undo() {
        this._buf[ this._idx-- ].undo();
    }


    redo() {
        this._buf[ this._idx++ ].redo();
    }
}


//
// 节点编辑类。
// 封装用户的单次DOM编辑（可能牵涉多个节点变化）。
// 注记：
// 用户需要配置 tQuery:config() 启用节点变化事件通知机制。
//
class DOMEdit {
    /**
     * 构造一个编辑实例。
     * @param {Function} handle 操作函数
     * @param {Fx.History} xhist 节点变化历史对象
     */
    constructor( handle, xhist ) {
        this._dom = xhist;
        this._fun = handle;
        this._cnt = null;
        this.redo();
    }


    undo() {
        if ( this._cnt > 0 ) {
            this._dom.back( this._cnt );
        }
    }


    redo() {
        let _old = this._dom.size();

        this._fun();
        this._cnt = this._dom.size() - _old;

        // 准确调校。
        this._dom.limit( this._dom.limit() + this._cnt - 1 );
    }
}


//
// 元素选取集编辑。
// 注记：
// 选取集成员需要保持原始的顺序，较为复杂，
// 因此这里简化取操作前后的全集成员存储。
//
class ESEdit {
    /**
     * 创建一个操作单元。
     * @param {[Element]} old 操作之前的元素集
     * @param {ESet} eset 选取集实例引用
     */
    constructor( old, eset ) {
        this._old = old;
        this._set = eset;
        this._cur = [...eset];
    }


    /**
     * 撤销选取。
     * 先移除新添加的，然后添加被移除的。
     */
    undo() {
        this._set.removes( this._cur ).pushes( this._old );
    }


    /**
     * 重新选取。
     * 先移除需要移除的，然后添加新添加的。
     */
    redo() {
        this._set.removes( this._old ).pushes( this._cur );
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


    //-- 用户操作 ------------------------------------------------------------
    // @data:  {Element|[Element, Number]}
    // @return {void|false} 返回false表示操作无效


    /**
     * 排它添加。
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
            this._clean(el)._set.add(el);
        }
    }


    /**
     * 同级反选。
     * 已经存在的移除，否则添加。
     * 添加的元素中，其子元素可能已经选取（故需滤除）。
     * @param {Element} el 焦点元素
     */
    reverse( el ) {
        Array.from( el.parentElement.children )
        .forEach(
            el => this._set.has(el) ? this._set.delete(el) : this._parentAdd(el)
        )
    }


    /**
     * 前端兄弟元素添加/移出。
     * 友好：前端无兄弟元素时忽略。
     * @param {Element} el 焦点元素
     * @param {Number} n 延伸个数
     */
    prevn( el, n ) {
        let _els = $.prevAll( el, (_, i) => i <= n );

        if ( _els.length == 0 ) {
            return false;
        }
        this._set.has(el) ? this._addSiblings(_els) : this._delSiblings(_els);
    }


    /**
     * 后端兄弟元素添加/移出。
     * 友好：后端无兄弟元素时忽略。
     * @param {Element} el 焦点元素
     * @param {Number} n 延伸个数
     */
    nextn( el, n ) {
        let _els = $.nextAll( el, (_, i) => i <= n );

        if ( _els.lenght == 0 ) {
            return false;
        }
        this._set.has(el) ? this._addSiblings(_els) : this._delSiblings(_els);
    }


    /**
     * 子元素添加。
     * 仅递进到首个子元素。
     * 友好：无子元素时简单忽略。
     * @param {Element} el 焦点元素
     * @param {Number} n 递进最大深度
     */
    child( el, n ) {
        let _end = deepChild( el, n );

        if ( _end === el ) {
            return false;
        }
        this.delete( el );
        this._set.add( _end );
    }


    /**
     * 父元素添加。
     * 会清除集合中所包含的子元素。
     * 友好：抵达限定根元素时简单忽略。
     * @param {Element} el 焦点元素
     * @param {Number} n 上升最大层级数
     * @param {Element} root 终止根元素
     */
    parent( el, n, root ) {
        let _to = $.closest(
            el,
            (e, i) => i == n || e === root
        );
        return _to !== root && this._parentAdd( _to );
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


    //-- 辅助接口 ------------------------------------------------------------


    /**
     * 安全添加。
     * 会检查与集合内成员的父子包含关系。
     * 如果元素已经存在则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        if ( !this._set.has(el) ) {
            this._clean(el)._set.add(el);
        }
    }


    /**
     * 安全删除。
     * 如果元素不存在，无任何行为。
     * @param {Element} el 目标元素
     */
    delete( el ) {
        if ( this._set.has(el) ) {
            this._set.delete( el );
        }
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 注：不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素（待添加）
     * @return {this} 当前实例
     */
    _clean( el ) {
        let _box = this._containItem(el);

        if ( _box ) {
            this._set.delete( _box );
            return this;
        }
        for (const sub of this._parentFilter(el)) {
            this._set.delete( sub );
        }
        return this;
    }


    /**
     * 兄弟元素集添加。
     * 新成员可能是集合内成员的父元素。
     * 因为焦点元素为同级兄弟，共同的父元素不会在集合内。
     * @param {[Element]} els 兄弟元素集
     */
    _addSiblings( els ) {
        els.forEach(
            el => this._set.has(el) || this._parentAdd(el)
        );
    }


    /**
     * 兄弟元素移出。
     * @param {[Element]} els 兄弟元素集
     */
    _delSiblings( els ) {
        els.forEach(
            el => this._set.has(el) && this._set.delete(el)
        );
    }


    /**
     * 父级添加。
     * 会清除集合内属于子级元素的选取。
     * @param {Element} el 父元素
     */
    _parentAdd( el ) {
        this._parentFilter( el )
            .forEach(
                el => this._set.delete( el )
            )
        this._set.add( el );
    }


    /**
     * 子包含过滤。
     * 找出集合中包含目标子节点的成员。
     * 原集合中成员不存在父子关系，因此仅需一次匹配。
     * 返回null表示无成员匹配。
     * 用途：
     * 选取子元素后清除父级选取成员。
     *
     * @param  {Element} sub 子节点
     * @return {Element|null}
     */
    _containItem( sub ) {
        for ( const el of this._set ) {
            if ( $.contains(el, sub, true) ) return el;
        }
        return null;
    }


    /**
     * 父包含过滤。
     * 找出集合中父级元素为目标元素的成员。
     * 一个父目标元素内可能包含多个集合成员。
     * 用途：
     * 选取父级元素后清除集合中的子级选取。
     *
     * @param  {Element} el 父元素
     * @return {[Element]}
     */
    _parentFilter( el ) {
        let _buf = [];

        this._set.forEach(
            it => $.contains(el, it, true) && _buf.push(it)
        );
        return _buf;
    }

}


//
// 元素节点操作。
// - 节点删除、移动、克隆。
// - 元素样式设置、清除等。
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



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 提取深层子元素。
 * 如果目标层数超出范围，则返回最终递进到的元素。
 * 注：仅沿首个子元素递进。
 * @param  {Element} el 目标元素
 * @param  {Number} n 递进层数
 * @return {Element}
 */
function deepChild( el, n ) {
    let _sub = el.firstElementChild;

    if ( n <= 0 || !_sub ) {
        return el;
    }
    return deepChild( _sub, --n );
}


/**
 * 元素选取封装（含历史功能）。
 * 引用全局__Selects实例并执行其操作（方法）。
 * 友好：会简单忽略无效的操作。
 * @param {String} op 操作名
 * @param {...Value} args 参数序列
 */
function histSelect( op, ...args ) {
    let _old = [...__ESet];

    if ( __Selects[op](...args) === false ) {
        return;
    }
    __History.push( new ESEdit(_old, __ESet) );
}


/**
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
    __History.push( new DOMEdit( () => __Elemedit[op](...args), __TQHistory ) );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


//
// By扩展集。
//
const _Edit = {
    /**
     * 选取集。
     * 适用方法：only, turn
     * 注：仅用于鼠标点选。
     * @param  {String} op 操作名
     * @return {void}
     */
    mouse( evo, op ) {
        histSelect( op, evo.data );
        __EHot.set( evo.data );
    },

    __mouse: 1,


    /**
     * 节点操作。
     * @param  {String} op 操作名
     * @return {void}
     */
    nodes( evo, op ) {
        histNodes( op, evo.data );
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
//
export const MainOps = {

    //-- 焦点移动 ------------------------------------------------------------

    /**
     * 平级：前端元素。
     * @param {Number} n 移动距离
     */
    focusPrev( n ) {
        n = n || 1;
        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        __EHot.set( $.prev(_beg, (_, i) => i == n, true) || _beg.parentElement.firstElementChild );
    },


    /**
     * 平级：后端元素。
     * @param {Number} n 移动距离
     */
    focusNext( n ) {
        n = n || 1;
        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        __EHot.set( $.next(_beg, (_, i) => i == n, true) || _beg.parentElement.lastElementChild );
    },


    /**
     * 纵深：上级元素。
     * 返回false表示目标超出范围。
     * 注意：需要提供准确距离值。
     * @param  {Number} n 移动距离
     * @param  {Element} root 终止根元素
     * @return {false|void}
     */
    focusUp( n, root ) {
        n = n || 1;
        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        let _to = $.closest( _beg, (el, i) => i == n || el === root );

        return _to !== root && __EHot.set( _to );
    },


    /**
     * 纵深：下级元素。
     * 注：向下容错超出的层级数。
     * @param {Number} n 移动距离
     */
    focusDown( n ) {
        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        __EHot.set( deepChild(_beg, n || 1) );
    },


    //-- 元素选取 ------------------------------------------------------------

    turn() {
        histSelect( 'turn', __EHot.get() );
    },


    reverse() {
        histSelect( 'reverse', __EHot.get() );
    },


    prevn( n ) {
        histSelect( 'prevn', __EHot.get(), n || 1 );
    },


    nextn( n ) {
        histSelect( 'nextn', __EHot.get(), n || 1 );
    },


    child( n ) {
        histSelect( 'child', __EHot.get(), n || 1 );
    },


    parent( n, root ) {
        histSelect( 'parent', __EHot.get(), n || 1, root );
    },


    empty() {
        histSelect( 'empty' );
    },


    //-- 混合操作 ------------------------------------------------------------
    // 移动焦点的同时进行选取。


    //-- 元素编辑 ------------------------------------------------------------

}



// debug:
window.ESet = __ESet;