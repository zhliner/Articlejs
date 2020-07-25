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
        let _len = this._buf.push(obj) - this._max;

        return _len > 0 && this._buf.shift();
    }


    undo() {
        let _obj = this._buf[ this._idx-- ];
        $.isArray(_obj) ? _obj.reverse().forEach( o => o.undo() ) : _obj.undo();
    }


    redo() {
        let _obj = this._buf[ this._idx++ ];
        $.isArray(_obj) ? _obj.forEach( o => o.redo() ) : _obj.redo();
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
        this._fun = handle;
        this._cnt = null;
        this.redo();
    }


    undo() {
        if ( this._cnt > 0 ) {
            __TQHistory.back( this._cnt );
        }
    }


    redo() {
        let _old = __TQHistory.size();

        this._fun();
        this._cnt = __TQHistory.size() - _old;

        // 准确调校。
        __TQHistory.limit( __TQHistory.limit() + this._cnt - 1 );
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
        __EHot.set( this._el0 );
        this._focus( this._el0 );
    }


    /**
     * 重新选取。
     * 先移除需要移除的，然后添加新添加的。
     */
    redo() {
        __ESet.removes( this._old ).pushes( this._els );
        __EHot.set( this._el1 );
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
        els.forEach(
            el => this._set.has(el) ? this._set.delete(el) : this.parentAdd(el)
        )
    }


    /**
     * 前端兄弟元素添加/移出。
     * 友好：前端无兄弟元素时忽略。
     * @param  {Element} el 焦点元素
     * @param  {Number} n 延伸个数
     * @return {Boolean} 是否实际执行
     */
    prevn( el, n ) {
        let _els = $.prevAll( el, (_, i) => i <= n );

        if ( _els.length == 0 ) {
            return false;
        }
        return this._set.has(el) ? this._addSiblings(_els) : this._delSiblings(_els);
    }


    /**
     * 后端兄弟元素添加/移出。
     * 友好：后端无兄弟元素时忽略。
     * @param  {Element} el 焦点元素
     * @param  {Number} n 延伸个数
     * @return {Boolean} 是否实际执行
     */
    nextn( el, n ) {
        let _els = $.nextAll( el, (_, i) => i <= n );

        if ( _els.length == 0 ) {
            return false;
        }
        return this._set.has(el) ? this._addSiblings(_els) : this._delSiblings(_els);
    }


    /**
     * 子元素添加。
     * 错误定位子元素时简单忽略。
     * @param {Element} el 焦点元素
     * @param {Number} n 子元素位置下标（从0开始，支持负值）
     */
    child( el, n ) {
        let _end = $.children( el, n );

        if ( !_end ) {
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
        return _to !== root && this.parentAdd( _to );
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
     * 兄弟元素集添加。
     * 新成员可能是集合内成员的父元素。
     * 注记：假设父容器未选取，外部需要保证此约束。
     * @param  {[Element]} els 兄弟元素集
     * @return {Boolean} 是否实际执行
     */
    siblings( els ) {
        let _does = false;

        for ( const el of els ) {
            if ( this._set.has(el) ) {
                continue;
            }
            _does = true;
            this.parentAdd( el );
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
     * 安全添加。
     * 会检查父子包含关系并清理。
     * 如果已经选取则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        if ( !this._set.has(el) ) {
            this.clean(el)._set.set(el);
        }
    }


    /**
     * 父级添加。
     * 会清除集合内属于子级元素的选取。
     * @param {Element} el 父元素
     */
    parentAdd( el ) {
        this._contains( el )
            .forEach(
                el => this._set.delete( el )
            )
        this._set.add( el );
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
        return this.cleanUp(el) || this.cleanDown(el);
    }


    //-- 私有辅助 ------------------------------------------------------------


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



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 元素选取封装（含历史功能）。
 * 引用全局__Selects实例并执行其操作（方法）。
 * 友好：会简单忽略无效的操作。
 * @param {String} op 操作名
 * @param {Element} el 焦点元素
 * @param {...Value} rest 其它参数序列
 */
function histSelect( op, el, ...rest ) {
    let _old = [...__ESet];

    if ( __Selects[op](el, ...rest) === false ) {
        return;
    }
    __History.push( new ESEdit(_old, el) );
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
        __EHot.set( evo.data );
        histSelect( op, evo.data );
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
//
export const MainOps = {

    //-- 焦点移动 ------------------------------------------------------------
    // n注记：空串会被转换为NaN。

    /**
     * 平级：前端元素。
     * n: 0值会移动到头部首个元素。
     * @param {Number} n 移动距离
     */
    focusPrev( n ) {
        n = isNaN(n) ? 1 : n;

        let _beg = __EHot.get();

        if ( !_beg || n < 0 ) {
            return;
        }
        __EHot.set( $.prev(_beg, (_, i) => i == n, true) || _beg.parentElement.firstElementChild );
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
        __EHot.set( $.next(_beg, (_, i) => i == n, true) || _beg.parentElement.lastElementChild );
    },


    /**
     * 纵深：上级元素。
     * 返回false表示目标超出范围。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param  {Number} n 上升层级数
     * @param  {Element} root 终止根元素
     * @return {false|void}
     */
    focusUp( n, root ) {
        n = isNaN(n) ? 1 : n;

        let _beg = __EHot.get();

        if ( !_beg || n <= 0 ) {
            return;
        }
        let _to = $.closest( _beg, (el, i) => i == n || el === root );

        return _to !== root && __EHot.set( _to );
    },


    /**
     * 纵深：子元素序列。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 位置下标
     */
    focusDown( n ) {
        let _beg = __EHot.get();

        // NaN为默认值0
        return _beg && __EHot.set( $.children(_beg, n || 0) );
    },


    //-- 元素选取 ------------------------------------------------------------


    // 切换选取
    turn() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...ESet];
        if ( __Selects.turn(_el) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 集合反选。
    reverse() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...ESet];
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

        let _old = [...ESet];
        __Selects.cleanUp( _el );

        if ( __Selects.siblings(_el.parentElement.children) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 同类兄弟元素。
    // 注记：焦点元素可能尚未选取。
    tagsame() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...ESet],
            _els = $.find( `>${_el.tagName}`, _el.parentElement );

        __Selects.cleanUp( _el );

        if ( __Selects.siblings(_els) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    // 叔伯元素内的同类子元素。
    // 主要用于同章节内的子章节标题选取。
    sibling2x() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _old = [...ESet],
            _els = $.find( `>* >${_el.tagName}`, _el.parentElement.parentElement );

        // 不共父元素，因此需要逐一清理。
        _els.forEach(
            el => __Selects.cleanUp( el )
        );
        if ( __Selects.siblings(_els) === false ) {
            return;
        }
        __History.push( new ESEdit(_old, _el) );
    },


    prevn( n ) {
        histSelect( 'prevn', __EHot.get(), n );
    },


    nextn( n ) {
        histSelect( 'nextn', __EHot.get(), n );
    },


    child( n ) {
        histSelect( 'child', __EHot.get(), n );
    },


    parent( n, root ) {
        histSelect( 'parent', __EHot.get(), n, root );
    },


    empty() {
        histSelect( 'empty', __EHot.get() );
    },


    //-- 混合操作 ------------------------------------------------------------
    // 移动焦点的同时进行选取。


    //-- 元素编辑 ------------------------------------------------------------

}



// debug:
window.ESet = __ESet;