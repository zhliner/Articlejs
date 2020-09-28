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

import { beforeFixed, afterFixed } from "./base.js";

const
    $ = window.$,

    // ID标识字符限定
    __reIDs = /(?:\\.|[\w-]|[^\0-\xa0])+/g;


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


    /**
     * 返回首个成员。
     */
    first() {
        for (const el of this) return el;
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


    /**
     * 设置焦点元素。
     * @param  {Element|null} el 目标元素
     * @return {Element|null} 之前的焦点
     */
    set( el ) {
        let _its = this._its;
        if ( _its !== el ) this._set(el);
        return _its;
    }


    /**
     * 获取焦点元素。
     */
    get() {
        return this._its;
    }


    /**
     * 判断是否为焦点。
     * @param  {Element} el 测试元素
     * @return {Boolean}
     */
    is( el ) {
        return !!el && el === this._its;
    }


    /**
     * 取消焦点。
     * @return {null}
     */
    cancel() {
        if ( this._its ) {
            $.removeClass( this._its, this._cls );
        }
        return this._its = null;
    }


    /**
     * 设置焦点元素。
     * @param  {Element|null} el 目标元素
     * @return {void}
     */
    _set( el ) {
        if ( el === null ) {
            return this.cancel();
        }
        if ( this._its ) {
            $.removeClass( this._its, this._cls );
        }
        this._its = $.addClass( el, this._cls );
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

        this._cel = $.attr( $.elem('i'), _val );
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
        rng.insertNode( this._cel );
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
     * 返回false表示无光标元素，外部无需规范化（normalize）。
     * @param  {Element} el 容器元素
     * @return {el|false}
     */
    clean( el ) {
        let _cur = $.get( this._slr, el );

        if ( _cur ) {
            _cur.remove();
        }
        return _cur && el;
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
// 唯一成员集。
// 实现几个基本的数组/集合方法。
// 注记：可用于ESC逐层取消栈功能。
//
export class ArrSet extends Set {
    /**
     * 逐个入栈。
     * 重复的值会被忽略。
     * @param  {...Value} vals 值序列
     * @return {Number} 栈大小
     */
    push( ...vals ) {
        vals.forEach( v => super.add(v) );
        return this.size;
    }


    /**
     * 弹出末尾值。
     * @return {Value}
     */
    pop() {
        let _v = this.last();
        super.delete( _v );
        return _v;
    }


    /**
     * 移除头部值。
     * @return {Value}
     */
    shift() {
        let _v = this.first();
        super.delete( _v );
        return _v;
    }


    /**
     * 返回首个成员。
     */
    first() {
        for (const it of this) return it;
    }


    /**
     * 返回最后一个成员。
     */
    last() {
        let it;
        for ( it of this );
        return it;
    }
}



//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 是否为可视节点。
 * @param  {Node} node 测试节点
 * @return {Boolean}
 */
function visibleNode( node ) {
    let _nt = node.nodeType;

    if ( _nt === 1 ) {
        return true;
    }
    return _nt === 3 && node.textContent.trim() ? true : false;
}



//
// 基本函数集。
//////////////////////////////////////////////////////////////////////////////


/**
 * 构造ID标识。
 * 提取源文本内的合法片段用短横线（-）串接。
 * @param  {String} text 源文本
 * @param  {String} prefix ID前缀
 * @return {String} 标识串
 */
export function createID( text, prefix = '' ) {
    return prefix + text.match(__reIDs).join('-');
}


/**
 * 空格缩进替换。
 * 包含前导的缩进和文内的Tab键。
 * 码值小于 0xff 的视为1个字节宽度。
 * @param  {String} text 源文本（单行）
 * @param  {String} tabs Tab空格序列
 * @return {String} 处理后的文本
 */
export function indentSpace( text, tabs ) {
    let _mod = tabs.length,
        _idx = 0,
        _str = '';

    for ( const ch of text ) {
        if ( ch === '\t' ) {
            _str += tabs.substring( _idx );
            _idx = 0;
        } else {
            _str += ch;
            _idx = (_idx + (ch.codePointAt(0) < 0xff ? 1 : 2)) % _mod;
        }
    }
    return _str;
}


/**
 * 获取节点所在父元素内下标位置。
 * 忽略空文本节点和注释节点，位置计数从0开始。
 * @param  {Node} node 目标元素
 * @return {Number} 所在下标
 */
export function siblingIndex( node ) {
    let _n = 0;
    while ( (node = node.previousSibling) ) {
        visibleNode(node) && _n ++;
    }
    return _n;
}


/**
 * 向前获取目标位置节点。
 * 位置计数仅限于可视节点（元素和非空文本节点）。
 * 固定属性单元视为端头阻挡，返回后阶节点。
 * 如果一开始就被阻挡，则返回者为起点元素自身。
 * 注记：
 * 用于移动插入到目标位置之前。
 * @param  {Node} beg 起始节点
 * @param  {Number} n 向前步进计数，可选（默认1）
 * @return {Node}
 */
export function prevNode( beg, n = 1 ) {
    let nodes = $.prevNodes( beg ),
        i = 0;

    for ( ; i < nodes.length; i++ ) {
        let _nd = nodes[i];
        if ( --n < 0 || beforeFixed(_nd) ) {
            break;
        }
    }
    return nodes[i-1] || beg;
}


/**
 * 向后获取目标位置节点。
 * 说明参考同上。
 * 注记：用于移动插入到目标位置之后。
 * @param  {Node} beg 起始节点
 * @param  {Number} n 向后步进计数，可选（默认1）
 * @return {Node}
 */
export function nextNode( beg, n = 1 ) {
    let nodes = $.nextNodes( beg ),
        i = 0;

    for ( ; i < nodes.length; i++ ) {
        let _nd = nodes[i];
        if ( --n < 0 || afterFixed(_nd) ) {
            break;
        }
    }
    return nodes[i-1] || beg;
}


/**
 * 交换DOM中两个元素。
 * @param {Element} a 元素a
 * @param {Element} b 元素b
 */
export function elem2Swap( a, b ) {
    let _box = b.parentNode,
        _ref = b.previousSibling;

    $.replace( a, b );
    return _ref ? $.after( _ref, a ) : $.prepend( _box, a );
}
