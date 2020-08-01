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
// 基本类定义。
//////////////////////////////////////////////////////////////////////////////


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
        if ( el === this._its ) {
            return;
        }
        if ( !el ) {
            return this.cancel();
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


//
// 元素光标类。
// 用于在编辑元素内容时定位并激活一个插入点。
// 注记：
// 通常只需要一个全局的类实例。
//
export class ElemCursor {
    /**
     * 内部会维护一个光标元素（实例级），
     * 用于插入占位和定位。
     * @param {String} prefix 属性名前缀
     */
    constructor( prefix = '_cursor_' ) {
        let _val = prefix +
            (Date.now() % 0xffffffff).toString(16);

        this._src = $.attr( $.element('i'), _val );
        this._slr = `[${ _val }]`;
    }


    /**
     * 插入光标。
     * 正常的插入光标通常不需要删除选区内容，
     * 但提供一个可选的明确指定。
     * @param  {Range} rng 范围对象
     * @param  {Boolean} rep 替换选区，可选
     * @return {this}
     */
    insert( rng, rep = false ) {
        if ( rep ) {
            rng.deleteContents();
        }
        rng.insertNode( this._src );
        return this;
    }


    /**
     * 创建光标。
     * 对可编辑的容器元素创建并激活一个光标。
     * 元素属性：contenteditable=true
     * 前提：
     * - 实参元素应当是调用insert时rng实参的容器元素或其克隆版本，
     *   即已经包含了光标元素。
     * - 如果容器元素内没有光标元素，则定位到末尾。
     *
     * @param  {Element} el 容器元素
     * @return {Element} el
     */
    cursor( el ) {
        let _cur = $.get( this._slr, el ),
            _rng = document.createRange();

        if ( _cur ) {
            _rng.selectNode( _cur );
        } else {
            this._activeEnd( el, _rng );
        }
        _rng.deleteContents();

        return el;
    }


    /**
     * 元素光标清理。
     * 移除插入的光标元素并规范化元素文本。
     * 如果用户只是使用了容器元素的克隆副本，可以对原本执行清理。
     * 注意：
     * 外部可能需要执行规范化（normalize）操作。
     * @param  {Element} el 容器元素
     * @return {this}
     */
    clean( el ) {
        let _cur = $.get( this._slr, el );

        if ( _cur ) {
            _cur.remove();
        }
        return this;
    }


    /**
     * 激活光标到末尾。
     * @param {Element} el 容器元素
     * @param {Range} rng 一个范围对象
     */
    _activeEnd( el, rng ) {
        rng.selectNode(
            el.childNodes[ el.childNodes.length - 1 ]
        );
        rng.collapse( false );
    }

}



//
// 基本函数集。
//////////////////////////////////////////////////////////////////////////////
