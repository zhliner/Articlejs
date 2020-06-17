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
// 节点树监听器。
// 监听并记录DOM节点树的内容/节点特性变化等。
// 即：tQuery:XXXvary 系列事件。
//
class DOMListener {

    constructor( ) {
        //
    }


    /**
     * 事件触发处理器。
     * @param {CustomEvent} ev 定制事件对象
     * @param {Object} elo 事件关联对象（tQuery）
     */
    handleEvent( ev, elo ) {
        //
    }

}


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


    done() {
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
// 主要为对全局 ElemQueue 实例的操作。
//
class ElemSels {
    /**
     * 创建一个操作单元。
     * @param {ElemQueue} queue 选取集实例
     */
    constructor( queue ) {
        //
    }


    /**
     * 初始完成。
     * 注：op实际上就是ElemQueue的方法。
     * @param {String} op 操作名
     * @param {[Element]} els 操作元素集
     */
    done( op, els ) {
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
