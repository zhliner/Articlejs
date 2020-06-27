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
//
///////////////////////////////////////////////////////////////////////////////
//

import { ESet } from './common.js';
import { Setup } from "../config.js";


const
    $ = window.$,

    // DOM节点变化历史实例。
    __History = new $.Fx.History(),

    // 元素选取集实例。
    __Selectx = new ESet( Setup.selectedClass );


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

        // 初始上限相同。
        __History.limit( size );
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
//
class DOMEdit {
    /**
     * 构造一个编辑实例。
     * @param {Function} handle 操作函数
     * @param {History} obj 全局历史对象引用
     */
    constructor( handle, obj ) {
        this._dom = obj;
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
     * @param {[Element]} els 操作之后的元素集
     * @param {ESet} eset 选取集实例
     */
    constructor( old, els, eset ) {
        this._old = old;
        this._new = els;
        this._set = eset;
    }


    /**
     * 撤销选取。
     * 先移除新添加的，然后添加被移除的。
     */
    undo() {
        this._set.removes( this._new ).pushes( this._old );
    }


    /**
     * 重新选取。
     * 先移除需要移除的，然后添加新添加的。
     */
    redo() {
        this._set.removes( this._old ).pushes( this._new );
    }
}


//
// 操作单元。
//////////////////////////////////////////////////////////////////////////////


//
// 元素选取集操作类。
// 使用：
// 声明一个全局实例用于 Tpb:By 扩展。
//
class ElemSels {
    /**
     * @param {String} mark 标记类名
     */
    constructor( mark ) {
        this._set = new ESet( mark );
    }


    /**
     * 添加一个元素成员。
     * 如果元素已经存在则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        if ( !this._set.has(el) ) {
            this._clean(el)._set.add(el);
        }
    }


    /**
     * 删除一个元素成员。
     * 如果元素不存在，无任何行为。
     * @param {Element} el 目标元素
     */
    delete( el ) {
        if ( this._set.has(el) ) {
            this._set.delete( el );
        }
    }


    /**
     * 排它添加一个元素成员。
     * 会先清空整个集合。
     * @param {Element} el 目标元素
     */
    only( el ) {
        for (const el of this) {
            $.removeClass(el, this._cls);
        }
        super.clear();
        this._add( el );
    }


    /**
     * 切换选取。
     * 已存在则移除，否则为添加。
     * 注：添加时仍需考虑父子包含关系。
     * @param {Element} el 目标元素
     */
    turn( el ) {
        if ( super.has(el) ) {
            this._delete(el);
        } else {
            this._clean(el)._add(el);
        }
    }


    /**
     * 兄弟元素添加。
     * 不检查父子包含关系，但排除已存在成员。
     * @param {Element} els 元素序列
     */
    siblings( els ) {
        els.forEach(
            el => super.has(el) || this._add(el)
        );
    }


    /**
     * 同级反选。
     * 已经存在的移除，否则添加。
     * 总集为兄弟元素，添加时不检查父子包含关系。
     * @param {[Element]} all 总集
     */
    reverse( all ) {
        all.forEach(
            el => super.has(el) ? this._delete(el) : this._add(el)
        )
    }


    /**
     * 清除全部选取。
     */
    empty() {
        super.forEach(
            el => this._delete( el )
        );
    }


    /**
     * 子级添加。
     * 明确知道为集合中某成员的子元素。
     * 会移除所属的父元素。
     * 注：如键盘改选。
     * @param {Element} el 子元素
     */
    child( el ) {
        let _box = this._containItem(el);

        if ( _box ) {
            this._delete( _box );
        }
        this._add( el );
    }


    /**
     * 父级添加。
     * 明确知道为集合中某成员的父元素。
     * 会清除集合中所包含的子元素。
     * 注：如键盘改选。
     * @param {Element} el 父元素
     */
    parent( el ) {
        this._parentFilter(el)
        .forEach(
            el => this._delete(el)
        )
        this._add( el );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 不存在目标元素同时是集合内成员的子元素和父元素的情况。
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
