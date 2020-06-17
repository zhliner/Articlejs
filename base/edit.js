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


const
    $ = window.$;


//
// 选取元素队列。
//
// 包含选取集的各个操作方法，返回值：[
//      [Element],  新添加的元素
//      [Element]   被移除的元素
// ]
// 这个返回集对可用于辅助撤销/重做编码。
//
class ElemQueue extends Set {
    /**
     * 创建选取元素集。
     * 注：mark为类名，不参与节点的vary事件处理。
     * @param {String} mark 选取标记类
     */
    constructor( mark ) {
        super();
        this._cls = mark;
    }


    //-- 批量接口 ------------------------------------------------------------
    // 用于外部undo/redo操作。


    /**
     * 压入元素序列。
     * @param  {[Element]} els 元素集
     * @return {ElemQueue} 当前实例
     */
    pushes( els ) {
        els.forEach(
            el => this._add( el )
        );
        return this;
    }


    /**
     * 移除元素序列。
     * @param  {[Element]} els 元素集
     * @return {ElemQueue} 当前实例
     */
    removes( els ) {
        els.forEach(
            el => this._delete( el )
        );
        return this;
    }


    //-- 操作集 --------------------------------------------------------------
    // 用户操作接口。
    // @return {Array2} 集对


    /**
     * 添加一个元素成员。
     * @param {Element} el 目标元素
     */
    add( el ) {
        if ( super.has(el) ) {
            return [];
        }
        this._clean(el)._add(el);

        return [ [el], null ];
    }


    /**
     * 删除一个元素成员。
     * @param {Element} el 目标元素
     */
    delete( el ) {
        if ( !super.has(el) ) {
            return [];
        }
        this._delete(el);

        return [ null, [el] ];
    }


    /**
     * 排它添加一个元素成员。
     * 会先清空整个集合。
     * @param {Element} el 目标元素
     */
    only( el ) {
        let _old = [];

        for (const el of this) {
            _old.push( $.removeClass(el, this._cls) );
        }
        super.clear();
        this._add( el );

        return [ [el], _old ];
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 添加元素成员。
     * 会设置成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {ElemQueue} 当前实例
     */
    _add( el ) {
        super.add(
            $.addClass(el, this._cls)
        );
        return this;
    }


    /**
     * 移除元素成员。
     * 会清除成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {ElemQueue} 当前实例
     */
    _delete( el ) {
        super.delete(
            $.removeClass(el, this._cls)
        )
        return this;
    }


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素（待添加）
     * @return {ElemQueue} 当前实例
     */
    _clean( el ) {
        let _box = this._containItem( el );
        if ( _box ) {
            return this._delete( _box );
        }
        for (const sub of this._parentFilter(el)) {
            this._delete( sub );
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
        for (const el of this) {
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

        super.forEach(
            it => $.contains(el, it, true) && _buf.push(it)
        );
        return _buf;
    }

}
