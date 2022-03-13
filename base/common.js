//! $ID: common.js 2019.09.07 Cooljed.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  通用基本工具集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import * as T from "./types.js";
import { beforeFixed, afterFixed, isEmpty, isContent, isInlines, getType } from "./base.js";
import { Scripter } from "../config.js";
import { Render } from "./tpb/tools/render.js";
import { Spliter, UmpCaller, UmpString } from "./tpb/tools/spliter.js";

import { MdLine } from "./hlparse/languages/mdline.js";

const
    // ID标识字符限定
    __reIDs = /(?:\\.|[\w-]|[^\0-\xa0])+/g,

    // OBT顶层分组分隔符。
    __chrDlmt   = ';',

    // OBT顶层分组切分器。
    __dlmtSplit = new Spliter( __chrDlmt, new UmpCaller(), new UmpString() ),

    // 单行MD解析器。
    __mdLine = new MdLine();



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
     * mark为类名，不参与节点的vary事件处理。
     * @param {String} mark 选取标记类
     */
    constructor( mark ) {
        super();
        this._cls = mark;

        // 焦点巡游支持
        this._n2 = null;
        this._p2 = null;
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
        // 清理游标
        if ( el === this._n2 ) this._n2 = null;
        if ( el === this._p2 ) this._p2 = null;

        return el;
    }


    /**
     * 清空集合。
     * 注记：即便是空集，也会清除游标。
     * @return {this}
     */
    clear() {
        this.forEach(
            el => $.removeClass( el, this._cls )
        )
        super.clear();
        this._n2 = null
        this._p2 = null;

        return this;
    }


    /**
     * 返回首个成员。
     * @return {Element|void}
     */
    first() {
        for (const el of this) return el;
    }


    /**
     * 返回el的下一个成员。
     * 如果未找到或抵达末尾则返回首个成员。
     * 支持巡视游标，即便当前元素取消选取，依然可以延续巡视。
     * 提示：
     * 巡游按选取顺序移动，这可能看起来有点乱，
     * 如果想按DOM节点顺序来，可以简单的执行一下排序（s按键）。
     * @param  {Element} el 起点元素
     * @return {Element|undefined}
     */
    next( el ) {
        let _els = [ ...this ],
            _cur = this._next( _els, el ) || this._n2 || _els[0];

        this._n2 = this._next( _els, _cur );
        this._p2 = this._prev( _els, _cur );

        return _cur;
    }


    /**
     * 返回el的前一个成员。
     * 如果未找到或抵达头部则返回最后一个成员。
     * 同上支持巡视游标。
     * 注意：
     * 如果正向巡视时取消当前元素选取，此时初始逆向巡视会从集合末尾开始。
     * 如果已逆向巡视过，则切换后可原地延续。
     * @param  {Element} el 起点元素
     * @return {Element|undefined}
     */
    prev( el ) {
        let _els = [ ...this ],
            _cur = this._prev( _els, el ) || this._p2 || _els[_els.length-1];

        this._p2 = this._prev( _els, _cur );
        this._n2 = this._next( _els, _cur );

        return _cur;
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
            el => this.delete( el )
        );
        return this;
    }


    /**
     * 获取/设置巡游游标。
     * 传递null值可以清除巡游游标。
     * @param  {[Element]|null} el2 元素对
     * @return {[Element]|void}
     */
    cruise( el2 ) {
        if ( el2 === undefined ) {
            return [ this._p2, this._n2 ];
        }
        [this._p2, this._n2] = el2 || [null, null];
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 获取el下一个成员。
     * @param  {[Element]} els 目标元素集
     * @param  {Element} el 起点元素
     * @return {Element|null|undefined}
     */
    _next( els, el ) {
        let _i = els.indexOf( el );
        return _i < 0 ? null : els[ _i+1 ];
    }


    /**
     * 获取el的前一个成员。
     * @param  {[Element]} els 目标元素集
     * @param  {Element} el 起点元素
     * @return {Element|null|undefined}
     */
    _prev( els, el ) {
        let _i = els.indexOf( el );
        return _i < 0 ? null : els[ _i-1 ];
    }

}


//
// 焦取独立处理器。
// 对目标选取集成员和焦点元素进行选取切换。
// 1. 初次触发时，暂存目标选取成员（保持原有顺序和巡游状态），返回独选焦点元素。
// 2. 再次触发时，恢复暂存的原始选取集，并恢复其内部巡游状态。
// 注意：
// 恢复时会忽略已经不在DOM节点树上的成员。
// 这样用户在独选焦点元素后，实际上可以执行多步编辑操作，包括编辑原选取成员本身。
// 用途：
// 在用户批量选取多个元素（如搜索后），巡游检查每个成员并需要单独修改时很有用。
// 不然单独的编辑需要单独选取，会破坏原有巡游逻辑。
//
export class ESetHot {
    /**
     * @param {ESet} eset 选取集实例
     */
    constructor( eset ) {
        this._set = eset;

        // 巡游游标对
        this._np2 = null;
        // 选取集暂存
        this._tmp = null;
    }


    /**
     * 焦取切换。
     * 如果初次使用则为独选，否则为恢复。
     * 返回最终选取的元素（集）。
     * @param  {Element} hot 焦点元素
     * @return {Element|[Element]}
     */
    pickback( hot ) {
        return this._tmp ? this._restore() : this._pick( hot );
    }


    /**
     * 是否可执行。
     * 条件（任一）：
     * - 选取集包含多个成员。
     * - 选取集虽然只有一个成员，但其不是焦点元素。
     * - 处于恢复状态时。
     * @param  {Element} hot 焦点元素
     * @return {Boolean}
     */
    cando( hot ) {
        if ( !!this._tmp || this._set.size > 1 ) {
            return true;
        }
        return this._set.size === 1 && !this._set.has(hot);
    }


    /**
     * 状态重置。
     * 主要用于编辑历史栈的撤销处理。
     */
    reset() {
        this._tmp = null;
        this._np2 = null;
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 焦点独选。
     * 会暂存原有选取集。
     * @param  {Element} hot 焦点元素
     * @return {Element}
     */
    _pick( hot ) {
        this._tmp = [ ...this._set ];
        this._np2 = this._set.cruise();

        return this._set.clear().add( hot );
    }


    /**
     * 恢复暂存的选取集。
     * 会同时恢复内部巡游游标（也需在DOM内）。
     * @return {[Element]}
     */
    _restore() {
        this._set.clear()
        .pushes(
            this._tmp.filter( el => el.isConnected )
        );
        this._set
        .cruise(
            this._np2.map( el => el && el.isConnected ? el : null )
        );
        this._np2 = null;
        this._tmp = null;

        return [ ...this._set ];
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
        return this._its || null;
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
        if ( el == null ) {
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
export class ECursor {
    /**
     * 内部会维护一个光标元素（实例级），
     * 用于插入占位和定位。
     * @param {String} prefix 属性名前缀
     */
    constructor( prefix = '_cursor_' ) {
        let _val = prefix +
            (Date.now() % 0xffffffff).toString(16);

        this._cel = $.attr( $.elem('i'), _val, '' );
        this._slr = `[${ _val }]`;
    }


    /**
     * 植入光标。
     * 在容器元素内植入光标占位元素。
     * 如果范围对象不在容器元素内则不会置入（返回false）。
     * @param  {Element} box 容器元素
     * @param  {Range} rng 范围对象
     * @return {Element|false} box
     */
    cursor( box, rng ) {
        let _cc = rng.commonAncestorContainer,
            _ok = $.contains( box, _cc );

        if ( _ok ) {
            if ( _cc.nodeType === 3 && rng.endOffset === 0 ) {
                // 技巧：向后移动一个字符。
                // 避免移除光标元素时，内部规范化导致外部规范化的引用失效。
                rng.setEnd( rng.endContainer, 1 );
            }
            rng.collapse( false );

            // 上面已保证插入点前存在文本，不会新建空文本节点。
            rng.insertNode( this._cel );
        }
        rng.detach();

        return _ok && box;
    }


    /**
     * 激活光标或全选。
     * 对可编辑的容器元素创建并激活一个光标。
     * 元素属性：contenteditable=true
     * 前提：
     * 实参元素应当已经包含了光标占位元素。
     * @param  {Element} el 容器元素
     * @return {Element} el
     */
    active( el ) {
        let _cur = $.get( this._slr, el ),
            _rng = document.createRange();

        if ( _cur ) {
            _rng.selectNode( _cur );
            _rng.deleteContents();
            el.normalize();
        } else {
            _rng.selectNodeContents( el );
        }
        return this._active( _rng, el );
    }


    /**
     * 激活光标到首/尾。
     * 默认激活光标到末尾。
     * @param {Element} el 容器元素
     * @param {Boolean} start 到元素内容前端，可选
     */
    active2( el, start = false ) {
        let _cur = $.get( this._slr, el ),
            _rng = document.createRange();

        if ( _cur ) {
            _cur.remove();
            el.normalize();
        }
        _rng.selectNodeContents( el )
        _rng.collapse( start );

        return this._active( _rng, el );
    }


    /**
     * 元素光标清理。
     * 移除插入的光标元素并规范化元素文本。
     * 返回false表示无占位光标元素。
     * 注记：
     * 原生DOM接口调用，不会进入变化历史栈。
     * @param  {Element} el 容器元素
     * @return {Element|false}
     */
    clean( el ) {
        let _cur = $.get( this._slr, el );

        if ( _cur ) {
            _cur.remove();
            // 内部规范化，
            // _cur前已存在有效文本节点，因此不会破坏外部引用。
            el.normalize();
        }
        return _cur && el;
    }


    /**
     * 激活到文档。
     * @param  {Range} rng 范围对象
     * @param  {Element} box 待编辑元素
     * @return {Element} box
     */
    _active( rng, box ) {
        let _ss = window.getSelection();

        _ss.removeAllRanges();
        _ss.addRange( rng );
        rng.detach();

        return box.focus(), box;
    }

}


//
// ESC取消逻辑栈。
// 实现为Map结构，加入/推出时目标明确。
// 注记：
// 使用Set结构需要依赖于加入的顺序，如果样式中存在动画，容易影响到时间线。
// 而Map结构中的移除由键标识，不受顺序影响。
//
export class ESCStack extends Map {
    /**
     * 加入一项。
     * @param  {Value} val 目标对象
     * @param  {String} key 目标键
     * @return {void}
     */
    add( val, key ) {
        super.set( key, val );
    }


    /**
     * 获取栈顶值。
     * 注：数据不弹出。
     * @return {Value|null}
     */
    top() {
        let _kv;
        for ( _kv of this );
        return _kv ? _kv[1] : null;
    }
}


//
// 代码存储器。
// 当前仅用localStorage简单实现。
//
export class CStorage {
    /**
     * 创建一个存储实例。
     * @param {String} prefix 键值前缀
     */
    constructor( prefix = '' ) {
        this._fix = prefix;
    }


    /**
     * 获取目标存储。
     * @param  {String} id 存储ID
     * @return {Value|null}
     */
    get( id ) {
        return window.localStorage.getItem( this._fix + id );
    }


    /**
     * 添加一个存储。
     * @param  {String} id 存储ID
     * @param  {Value} val 存储值
     * @return {Storage}
     */
    set( id, val ) {
        window.localStorage.setItem( this._fix + id, val );
        return this;
    }


    /**
     * 删除目标存储。
     * @param  {String} id 存储ID
     * @return {void}
     */
    del( id ) {
        window.localStorage.removeItem( this._fix + id );
    }


    /**
     * 是否存在目标id的存储。
     * @param  {String} id 存储ID
     * @return {Boolean}
     */
    has( id ) {
        return !!window.localStorage.getItem( this._fix + id );
    }


    /**
     * 清除全部存储。
     */
    clear() {
        window.localStorage.clear();
    }


    /**
     * 获取存储键集。
     * 返回的键名不包含键前缀部分。
     * @return {[String]}
     */
    keys() {
        let _ks = Object.keys( window.localStorage ),
            _sz = this._fix.length;

        return _ks.filter( k => k.startsWith(this._fix) ).map( k => k.substring(_sz) );
    }
}


//
// 编辑历史管理器。
// 管理内部实现了 undo/redo 接口的编辑处理实例。
// 支持成组的编辑实例一次性操作。
//
export class History {
    /**
     * 构造一个编辑实例。
     * @param {Number} size 编辑历史长度
     * @param {$.Fx.History} history DOM编辑历史栈
     */
    constructor( size, history ) {
        this._max = size;
        this._buf = [];
        this._idx = -1;  // 游标
        this._hist = history;
    }


    /**
     * 入栈一个操作序列。
     * 多个实体会被同时处理，因此单次压入。
     * @param  {...Instance} objs 操作实例序列
     * @return {[Instance]|false} 头部被移出的操作实例序列
     */
    push( ...objs ) {
        if ( !objs.length ) return;

        // 新入截断。
        this._buf.length = ++this._idx;
        let _len = this._buf.push( objs );

        return ( _len - this._max ) > 0 && this._shift();
    }


    /**
     * 栈顶弹出并执行。
     * 用于模拟“取消”行为（微编辑）。
     */
    pop() {
        let _obj = this._buf.pop();
        this._idx --;

        _obj.slice().reverse().forEach( o => o.undo() );
    }


    /**
     * 撤销一步。
     */
    undo() {
        if ( this._idx < 0 ) {
            return warn('[undo] overflow.');
        }
        let _obj = this._buf[ this._idx ],
            _pas = this._confirm( _obj );

        if ( _pas ) {
            this._idx--;
            _obj.slice().reverse().forEach( o => o.undo() );
        }
    }


    /**
     * 重做一步。
     * 操作实例可能是一个数组。
     */
    redo() {
        if ( this._idx >= this._buf.length - 1 ) {
            return warn('[redo] overflow.');
        }
        this._buf[ ++this._idx ].forEach( o => o.redo() );
    }


    /**
     * 清空历史记录栈。
     * 注：类似于重置。
     */
    clear() {
        this._buf.length = 0;
        this._idx = -1;
        this._hist.clear();
    }


    /**
     * 是否可执行撤销。
     * 注记：撤销在当前实例上执行。
     * @return {Boolean}
     */
    canUndo() {
        return this._idx >= 0;
    }


    /**
     * 是否可执行重做。
     * 注记：重做在下一个实例上开启。
     * @return {Boolean}
     */
    canRedo() {
        return this._idx < this._buf.length - 1;
    }


    /**
     * 确认是否撤销。
     * 检查操作实例集内是否包含需警告实例，征求用户选择决定是否撤销。
     * 如有多个需警告实例，只要其中之一取消，则不可撤销。
     * @param  {[Object]} objs 操作实例集
     * @return {Boolean} 确实撤销
     */
    _confirm( objs ) {
        let _pass = true;

        for ( const o of objs ) {
            if ( o.warn ) {
                _pass = window.confirm( o.warn() );
                if ( !_pass ) break;
            }
        }
        return _pass;
    }


    /**
     * 历史栈头部移除。
     * 游标从头部算起，因此需要同步减1。
     * 注记：
     * 仅 DOMEdit 实例包含 count 属性。
     */
    _shift() {
        let _obj = this._buf.shift();
        this._idx--;

        _obj.forEach( o => o.count && this._hist.prune(o.count) );
    }
}


//
// 数据分页器。
// 根据数据id集的分页逻辑提供每页面id清单。
//
export class DPage {
    /**
     * @param {[String]} data 数据ID总集
     * @param {Number} psize 单页大小
     */
    constructor( data, psize ) {
        this._data = data;
        this._size = psize;
        // 当前页次
        this._idx = 0;
    }


    /**
     * 下一页清单。
     * @return {[String]|null}
     */
    next() {
        let _end = this.pages() - 1;
        return this._idx < _end ? this.page( this._idx + 1 ) : null;
    }


    /**
     * 前一页清单。
     * @return {[String]|null}
     */
    prev() {
        return this._idx > 0 ? this.page( this._idx - 1 ) : null;
    }


    /**
     * 首页清单。
     * @return {[String]}
     */
    first() {
        return this.page( 0 );
    }


    /**
     * 最后一页清单。
     * @return {[String]}
     */
    last() {
        return this.page( this.pages() - 1 );
    }


    /**
     * 获取特定目标页次。
     * @param  {Number} idx 目标页次（从0开始）
     * @return {[String]} ID清单
     */
    page( idx ) {
        let _beg = idx * this._size;

        this._idx = idx;
        return this._data.slice( _beg, _beg + this._size );
    }


    /**
     * 更新或返回当前页下标。
     * @return {Number|void}
     */
    index( idx ) {
        if ( idx === undefined ) {
            return this._idx;
        }
        this._idx = idx;
    }


    /**
     * 重置数据集。
     * 当前页也会重置为首页。
     * @param  {[String]} data 数据ID总集
     * @return {this}
     */
    reset( data ) {
        this._idx = 0;
        this._data = data;
        return this;
    }


    /**
     * 获取页数
     * @return {Number}
     */
    pages() {
        return Math.ceil( this._data.length / this._size );
    }
}


//
// 分页器。
// 负责新页面DOM的渲染逻辑。
// 每页作为一个子列表（root的副本）提供。
// 注记：
// 包含一个缓存池，用于保留DOM节点的引用，
// 避免条目删除的撤销和重做失效。
//
export class Pager {
    /**
     * @param {Element} root 渲染模板根
     */
    constructor( root ) {
        this._tpl = root;

        // [页次] = 列表根
        this._pool = [];
    }


    /**
     * 创建页面。
     * @param  {Number} i 目标页次。
     * @param  {[Object]} data 目标页渲染数据，可选
     * @return {Element} 新页面
     */
    page( i, data ) {
        return this._pool[i] ||
            this._render( i, this._clone(this._tpl), data );
    }


    /**
     * 清除缓存池。
     */
    reset() {
        this._pool.length = 0;
        return this;
    }


    /**
     * 渲染目标页。
     * 会缓存渲染的目标元素。
     * @param  {Number} i 目标页次
     * @param  {Element} tpl 模板根
     * @param  {[Object]} data 渲染数据集
     * @return {Element} tpl 渲染后的元素
     */
    _render( i, tpl, data ) {
        return ( this._pool[i] = Render.update(tpl, data) );
    }


    /**
     * 元素克隆。
     * 包括子节点、事件处理器和渲染文法。
     * @param  {Element} tpl 模板节点
     * @return {Element} 新元素
     */
    _clone( tpl ) {
        return Render.clone( tpl, $.clone(tpl, true, true, true) );
    }
}



//
// 辅助工具。
//////////////////////////////////////////////////////////////////////////////


//
// 通用缓存池。
//
class Pool extends Set {
    /**
     * @param {Function} valuer 值创建器
     */
    constructor( valuer ) {
        super();
        this._make = valuer;
    }


    /**
     * 提取一个成员。
     * 提取的成员会从集合中移除，没有则简单创建一个返回。
     * 注记：
     * 新建的值无需进入缓存集，它应当由外部回送。
     * @return {Value}
     */
    pick( ...args ) {
        return this._pick() || this._make( ...args );
    }


    /**
     * 提取集合成员。
     * 提取的成员会从集合中移除。
     * @return {Value}
     */
    _pick() {
        let _v;
        for ( _v of this ) break;

        if (_v !== undefined) this.delete(_v);
        return _v;
    }
}


// Worker缓存池。
// 仅限于相同 URL 的 Worker，避免冗余创建。
const __poolWorker = new Pool( Scripter );


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


/**
 * 控制台警告。
 * @param  {String} msg 输出消息
 * @param  {Value} data 关联数据
 * @return {void}
 */
function warn( msg, data ) {
    window.console.warn( msg, data || '' );
}


/**
 * 标签封装。
 * @param  {String} tag 标签名，可选
 * @param  {String} html 待封装源码文本
 * @return {String} 结果源码
 */
function tagWrap( tag, html ) {
    return tag ? `<${tag}>${html}</${tag}>` : html;
}


//
// HTML格式化
//----------------------------------------------------------------------------


/**
 * 元素自身格式化。
 * - 内联元素自身和内部不起新行。
 * - 块级元素自身强制起新行。
 * - 块级元素内仅含单个文本节点时不起新行。
 * @param  {Element} el 当前元素
 * @param  {Boolean} clean 空白清理
 * @param  {String} ind 缩进字符串
 * @param  {String} prefix 前阶缩进字符串
 * @return {String} 格式串
 */
function stringElement( el, clean, ind, prefix ) {
	let _tag = el.tagName.toLowerCase(),
		_html = `<${_tag}${stringAttr(el.attributes, ind, prefix)}`,
        _con = '';

    if ( isEmpty(el) ) {
		return _html + ' />';
	}
    _html += '>';

    for ( const nd of el.childNodes ) {
        _con += niceHtml( nd, clean, ind, prefix + ind );
    }
	return _html + _con + newLineClose(el, prefix) + `</${_tag}>`;
}


/**
 * 构造元素特性序列。
 * - 指目标元素内的属性序列，不含内容和结尾标签。
 * - 空值属性保持为单属性标志状态（无=）。
 * - 支持OBT标准特性名（on/by/to）换行书写（在最后）。
 * @param  {NamedNodeMap} attrs 元素属性集
 * @param  {String} ind 一个缩进串
 * @param  {String} prefix 属性名前置缩进（含头部换行）
 * @return {String} 全部特性名值串
 */
function stringAttr( attrs, ind, prefix ) {
	let _ats = '',
        _obt = new Map([ ['on'], ['by'], ['to'] ]);

	for ( let i = 0; i < attrs.length; i++ ) {
        let _at = attrs[i];

        if ( _obt.has(_at.name) ) {
            _obt.set( _at.name, _at.value );
            continue;
        }
		_ats += ` ${_at.name}` + (_at.value === '' ? '' : `="${quoteEscape(_at.value)}"`);
	}
	return _ats + obtsNice( _obt, ind, prefix );
}


/**
 * 新行缩进（开始标签）。
 * 用于块级元素自身换行&缩进。
 * @param  {Element} el 目标元素
 * @param  {String} indent 缩进字符串（前阶）
 * @return {String}
 */
function newLineStart( el, indent ) {
	return el.nodeType === 3 || el.nodeType === 1 && isInlines( el ) ? '' : '\n' + indent;
}


/**
 * 新行缩进（结束标签）
 * 内容元素的关闭标签不需要换行。
 * <li>被用作定制结构（非通用内容元素）时也无需换行关闭。
 * @param  {Element} el 目标元素
 * @param  {String} indent 缩进字符串
 * @return {String}
 */
function newLineClose( el, indent ) {
    return el.nodeType === 3 || isInlines( el ) || isContent( el ) || inlineBox( el ) ?
        '' :
        '\n' + indent;
}


/**
 * 返回原始保持内容。
 * - 仅用于<code>和<pre>元素。
 * - 源码取outerHTML，故返回空串表示元素不匹配。
 * @param  {Element} el 目标元素
 * @return {String} 源码
 */
function keepHTML( el ) {
	let _tag = el.nodeName;
	return _tag == 'CODE' || _tag == 'PRE' ? $.prop(el, 'outerHTML') : '';
}


/**
 * 双引号转换为HTML实体。
 * 仅用于属性值串构造HTML源码。
 * @param  {String} str 属性值字符串
 * @return {String}
 */
function quoteEscape( str ) {
    return str.replace( /"/g, '&quot;' );
}


/**
 * OBT特性集格式化。
 * 换行书写，比所在元素多一个缩进。
 * @param  {Map} obt3 OBT名值对集
 * @param  {String} ind 一个缩进串
 * @param  {String} prefix 所属元素缩进串
 * @return {String} 节点名值序列串
 */
function obtsNice( obt3, ind, prefix ) {
    let _buf = [];
    prefix = `${prefix}${ind}`;

    for ( const [k, v] of obt3 ) {
        if ( !v ) {
            continue;
        }
        _buf.push( `${k}="${obtNice(v, ind, prefix)}"` );
    }
    return _buf.length ? `\n${prefix}` + _buf.join( `\n${prefix}` ) : '';
}


/**
 * OBT特性值格式化。
 * 按顶级分隔符（;）切分，每段一行，比特性名多一个缩进。
 * @param  {String} fmt 原格式串
 * @param  {String} ind 一个缩进串
 * @param  {String} prefix 属性名前置缩进
 * @return {String}
 */
function obtNice( fmt, ind, prefix ) {
    __dlmtSplit.reset();

    return [ ...__dlmtSplit.split(fmt) ]
        .map( s => quoteEscape(s.trim()) )
        .join( `${__chrDlmt}\n${prefix}${ind}` );
}


/**
 * 其它内联容器。
 * 适用定制<li>单元是否仅包含内联内容（结束不换行）。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
function inlineBox( el ) {
    let _last = $.contents( el, -1, false, true );
    return _last.nodeType === 3 || isInlines( _last );
}


/**
 * 是否为合法内容子单元。
 * 指可以被包含在内容元素里的单元，包括：
 * - 文本节点
 * - 内联元素
 * - 代码内特用单元（<b><i>）
 * 注记：
 * 仅允许<code>内的<b>和<i>，因为普通内容元素内微编辑时，<strong>可能会被浏览器转换为<b>，
 * 此情况应当消除以保证元素的语义逻辑。
 * 但副作用是，划选创建的特用单元，微编辑后也会被清除。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
function isConitem( el ) {
    let _tv = getType( el );
    return T.isInlines( _tv ) || ( el.parentElement.tagName === 'CODE' && T.isSpecial(_tv) );
}


/**
 * 文本节点清理。
 * 连续的空白压缩为单个空格。
 * - 如果node是首个节点，清理后移除头部空格。
 * - 如果node已经是最后一个节点，清理后移除末尾空白。
 * @param  {Text} node 文本节点
 * @return {String|''}
 */
function cleanText( node ) {
    // 单个 \s 可能匹配 &nbsp;
    // 替换之
    let _txt = node.textContent.replace( /\s+/g, ' ' );

    if ( !node.nextSibling ) {
        _txt = _txt.trimEnd();
    }
    if ( !node.previousSibling ) {
        _txt = _txt.trimStart();
    }
    return _txt;
}



//
// 基本函数集。
//////////////////////////////////////////////////////////////////////////////


/**
 * JSON 安全解析。
 * 采用Worker解析，支持任意合法的JS表示。
 * @param  {String} str 目标的字符串表示
 * @return {Promise<Object|Value>}
 */
export function parseJSON( str ) {
    let _wk = __poolWorker.pick();

    return new Promise( resolve => {
        _wk.onmessage = ev => {
            _wk.onmessage = null;
            __poolWorker.add( _wk );

            if ( ev.data.error ) {
                throw ev.data.error;
            }
            resolve( ev.data.result );
        }
        _wk.postMessage( `return ${str}` );
    });
}


/**
 * 脚本执行。
 * 递送的对象包含固定的结构，参见 scripter.js
 * 注：原样传递，不用return封装。
 * @param  {Object} data 递送的对象
 * @return {Promise<Value>}
 */
export function scriptRun( data ) {
    let _wk = __poolWorker.pick();

    return new Promise( (resolve, reject) => {
        _wk.onmessage = ev => {
            _wk.onmessage = null;
            __poolWorker.add( _wk );
            ev.data.error ? reject( ev.data.error) : resolve( ev.data.result );
        }
        _wk.postMessage( data );
    });
}


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
 * 日期/时间显示。
 * 未传递时间实参时取当前时间。
 * 返回值：YYYY-mm-dd hh:mm:ss
 * @param  {Date|Number} dt 时间对象或时间戳（毫秒），可选
 * @return {String}
 */
export function datetime( dt ) {
    if ( dt === undefined ) {
        dt = new Date();
    }
    else if ( typeof dt === 'number' ) {
        dt = new Date( dt );
    }
    return dt.toJSON().substring(0, 19).replace( 'T', ' ' );
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
 * 如果一开始就被阻挡，返回null。
 * 注记：
 * 用于移动插入到目标位置之前。
 * @param  {Node} beg 起始节点
 * @param  {Number} n 向前步进计数，可选（默认1）
 * @return {Node|null}
 */
export function prevNodeN( beg, n = 1 ) {
    let nodes = $.prevNodes( beg, false, true ),
        i = 0;

    for ( ; i < nodes.length; i++ ) {
        let _nd = nodes[i];
        if ( --n < 0 || beforeFixed(_nd) ) {
            break;
        }
    }
    return nodes[ i-1 ] || null;
}


/**
 * 是否为向前移动结束。
 * @param  {Element} el 待移动元素
 * @return {Boolean}
 */
export function prevMoveEnd( el ) {
    let _nd = $.prevNode( el, false, true );
    return !_nd || beforeFixed( _nd );
}


/**
 * 向后获取目标位置节点。
 * 说明参考同上。
 * 注记：用于移动插入到目标位置之后。
 * @param  {Node} beg 起始节点
 * @param  {Number} n 向后步进计数，可选（默认1）
 * @return {Node|null}
 */
export function nextNodeN( beg, n = 1 ) {
    let nodes = $.nextNodes( beg, false, true ),
        i = 0;

    for ( ; i < nodes.length; i++ ) {
        let _nd = nodes[i];
        if ( --n < 0 || afterFixed(_nd) ) {
            break;
        }
    }
    return nodes[ i-1 ] || null;
}


/**
 * 是否为向后移动结束。
 * @param  {Element} el 待移动元素
 * @return {Boolean}
 */
export function nextMoveEnd( el ) {
    let _nd = $.nextNode( el, false, true );
    return !_nd || afterFixed( _nd );
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


/**
 * 生成换行/缩进良好的源码。
 * - 行块单元内不换行，内联单元间不换行。
 * - 0空格数是有效的，表示不缩进。非数值空格数缩进为一个Tab字符。
 * 注记：
 * 不适用任意元素的源码美化，因为单元类型判断涉及父子结构逻辑。
 * 如果目标元素是一个完整的单元则没有问题。
 * @param  {Node} node 目标节点
 * @param  {Boolean} clean 空白清理
 * @param  {String} tabs 缩进字符串（对应一个Tab）
 * @param  {String} prefix 前阶缩进字符串，可选
 * @return {String} 格式良好的源码
 */
export function niceHtml( node, clean, tabs, prefix = '' ) {
    let _n = node.nodeType,
        _nl = newLineStart( node, prefix );

    if ( _n === 1 ) {
        return _nl + ( keepHTML(node) || stringElement(node, clean, tabs, prefix) )
    }
    if ( _n === 3 ) {
        // 纯空自动清理。
        // 注：代码类单元不会至此。
        return node.textContent.trim() && $.html( clean ? cleanText(node) : node.textContent );
    }
    if ( _n === 8 ) {
        return _nl + `<!--${node.data}-->`;
    }
    return node.outerHTML || node + '';
}


/**
 * MarkDown单行解析。
 * 用于自动处理录入框中粘贴的MD标记源码。
 * 注记：
 * MdLine只支持顶层标记，因此解析结果是平的（无嵌套子语法块）。
 * @param  {String} code MD源码
 * @return {String} 解析并构造的HTML源码
 */
export function markdownLine( code ) {
    return __mdLine.parse( code ).map( o => tagWrap(o.type, o.text) ).join( '' );
}


/**
 * 清理非合法内联元素。
 * 仅合法的内联元素被保留，非此则仅取其文本。
 * 注释节点被简单保留。
 * @param  {Element} el 内容元素
 * @return {Element|String}
 */
export function cleanInline( el ) {
    let _buf = [];

    for ( const nd of el.childNodes ) {
        let _t = nd.nodeType;

        if ( _t === 3 || _t === 8 || nd.tagName === 'svg' ) {
            _buf.push( nd );
        }
        else if ( _t === 1 ) {
            _buf.push( cleanInline(nd) );
        }
    }
    if ( _buf.length ) {
        $.fill( el, _buf );
    }
    return isConitem( el ) ? el : el.textContent;
}