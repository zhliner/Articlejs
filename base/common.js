//! $Id: common.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	通用基本工具集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$;


//
// 元素选取集。
// 封装类名设置/取消逻辑。
// 注：继承自Set可获取展开特性。
//
export class ESet extends Set {
    /**
     * 创建选取元素集。
     * 注：mark为类名，不参与节点的vary事件处理。
     * @param {String} mark 选取标记类
     */
    constructor( mark ) {
        super();
        this._cls = mark;
    }


    /**
     * 添加元素成员。
     * 会设置成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {Element} el
     */
    add( el ) {
        super.add(
            $.addClass( el, this._cls )
        );
        return el;
    }


    /**
     * 移除元素成员。
     * 会清除成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {Element} el
     */
    delete( el ) {
        super.delete(
            $.removeClass( el, this._cls )
        )
        return el;
    }


    /**
     * 清空集合。
     */
    clear() {
        for ( const el of this ) {
            $.removeClass( el, this._cls );
        }
        super.clear();
    }


    //-- 批量接口 ------------------------------------------------------------
    // 主要用于外部undo/redo操作。


    /**
     * 压入元素序列。
     * 不检查原集合中是否已经存在。
     * @param  {[Element]} els 目标元素集
     * @return {ESet} 当前实例
     */
    pushes( els ) {
        els.forEach(
            el => this.add( el )
        );
        return this;
    }


    /**
     * 移除元素序列。
     * 假定目标元素已全部存在于集合内。
     * @param  {[Element]} els 目标元素集
     * @return {ESet} 当前实例
     */
    removes( els ) {
        els.forEach(
            el => this.delete(el)
        );
        return this;
    }
}


//
// 元素选取焦点。
// 封装类名设置、取消逻辑。
//
export class EHot {
    /**
     * @param {String} mark 焦点标记类
     */
    constructor( mark ) {
        this._cls = mark;
        this._its = null;
    }


    set( el ) {
        if ( !el || el === this._its ) {
            return;
        }
        if ( this._its ) {
            $.removeClass( this._its, this._cls );
        }
        this._its = $.addClass( el, this._cls );
    }


    get() {
        return this._its;
    }


    cancel() {
        if ( this._its ) {
            $.removeClass( this._its, this._cls );
            this._its = null;
        }
    }
}
