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
    // 注记：
    // 主要用于外部undo/redo操作。
    // 可分别取调用之前/后的集合成员存储。


    /**
     * 压入元素序列。
     * 不检查原集合中是否已经存在。
     * @param  {[Element]} els 目标元素集
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
     * 假定目标元素已全部存在于集合内。
     * @param  {[Element]} els 目标元素集
     * @return {ElemQueue} 当前实例
     */
    removes( els ) {
        els.forEach(
            el => this._delete(el)
        );
        return this;
    }


    //-- 操作集 --------------------------------------------------------------
    // 用户操作接口。
    // @return {void}


    /**
     * 添加一个元素成员。
     * 如果元素已经存在则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        if ( !super.has(el) ) {
            this._clean(el)._add(el);
        }
    }


    /**
     * 删除一个元素成员。
     * 如果元素不存在，无任何行为。
     * @param {Element} el 目标元素
     */
    delete( el ) {
        if ( super.has(el) ) {
            this._delete( el );
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
     * 添加元素成员。
     * 会设置成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {Element} el
     */
    _add( el ) {
        super.add(
            $.addClass(el, this._cls)
        );
        return el;
    }


    /**
     * 移除元素成员。
     * 会清除成员的选取标记类名。
     * @param  {Element} el 目标元素
     * @return {Element} el
     */
    _delete( el ) {
        super.delete(
            $.removeClass(el, this._cls)
        )
        return el;
    }


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素（待添加）
     * @return {ElemQueue} 当前实例
     */
    _clean( el ) {
        let _box = this._containItem(el);
        if ( _box ) {
            this._delete( _box );
            return this;
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
