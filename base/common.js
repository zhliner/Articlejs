//! $Id: common.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	通用基本工具类集。
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 编辑历史处理器。
// - 管理编辑历史的通用处理。
// - 内部管理的对象需要实现 undo/redo/destroy 接口。
// - 支持成组的源操作合并为一个操作组单元。
//
class History {

    constructor() {
        //
    }
}


//
// 通用节点编辑类。
// 实现节点编辑的撤销和重做操作。
// 注记：
// 从 DOMLister 实例获取当前变化段。
// 用当前的变化段批量操作 DOMListener 的逐条记录。
//
class DOMEdit {

    constructor( ) {
        //
    }


    undo() {
        //
    }


    redo() {
        //
    }


    destroy() {
        //
    }

}


//
// 元素选取集编辑。
// 注记：
// 选取集成员需要保持原始的顺序，较为复杂，
// 因此这里简化取操作前后的全集成员存储。
//
class ElemSels {
    /**
     * 创建一个操作单元。
     * @param {ElemQueue} queue 选取集实例
     * @param {[Element]} old 操作之前的元素集
     * @param {[Element]} els 操作之后的元素集
     */
    constructor( queue, old, els ) {
        this._old = old;
        this._new = els;
        this._set = queue;
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


    /**
     * 销毁：切断引用。
     */
    destroy() {
        this._set = null;
        this._new = null;
        this._del = null;
    }

}
