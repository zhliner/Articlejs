//! $Id: common.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  通用基本工具集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Render } from "./tpb/tools/render.js";
import { beforeFixed, afterFixed } from "./base.js";
import { Scripter } from "../config.js";

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
     * mark为类名，不参与节点的vary事件处理。
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
     * @return {this}
     */
    clear() {
        for ( const el of this ) {
            $.removeClass( el, this._cls );
        }
        return super.clear(), this;
    }


    /**
     * 返回首个成员。
     * @return {Element|void}
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
     * 如果范围对象不在容器元素内则不会植入（返回false）。
     * @param  {Element} box 容器元素
     * @param  {Range} rng 范围对象
     * @return {Element|false} box
     */
    cursor( box, rng ) {
        let _ok = $.contains( box, rng.commonAncestorContainer );

        if ( _ok ) {
            rng.collapse( false );
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
     * @param  {Element} el 容器元素
     * @return {Element|false}
     */
    clean( el ) {
        let _cur = $.get( this._slr, el );

        if ( _cur ) {
            _cur.remove();
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
     * @param  {String} key 目标键
     * @param  {Value} val 目标对象
     * @return {void}
     */
    add( key, val ) {
        super.set( key, val );
    }


    /**
     * 删除一项。
     * @param  {String} key 目标键
     * @return {void}
     */
    del( key ) {
        super.delete( key );
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
        let _obj = this._buf[ this._idx-- ];

        // 副本避免被修改。
        _obj.slice().reverse().forEach( o => o.undo() );
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
// 页面管理器。
// 生成并缓存分页以供换页和复用。
// - 保留渲染根，每页的创建从一个副本渲染。
// - 外部取页时先从缓存中获取，没有则新建。
//
// 缓存的是页面根元素（内含列表条目），可提高效率并保持引用。
// 若有条目编辑直接操作子元素，自然体现增减。
//
export class Pages {
    /**
     * @param {Element} root 渲染根
     * @param {[Object]} data 数据集
     * @param {Number} psize 单页大小
     */
    constructor( root, data, psize ) {
        this._root = root;
        this._data = data;
        this._size = psize;

        this._idx  = 0;  // 当前页次
        this._pool = []; // 缓存池
    }


    /**
     * 返回下一页。
     * @return {Element|null}
     */
    next() {
        let _end = this.pages() - 1;
        return this._idx < _end ? this._page( ++this._idx ) : null;
    }


    /**
     * 返回前一页。
     * @return {Element|null}
     */
    prev() {
        return this._idx > 0 ? this._page( --this._idx ) : null;
    }


    /**
     * 返回首页。
     * @return {Element}
     */
    first() {
        this._idx = 0;
        return this._page( 0 );
    }


    /**
     * 返回最后一页。
     * @return {Element}
     */
    last() {
        this._idx = this.pages() - 1;
        return this._page( this._idx );
    }


    /**
     * 获取当前页次。
     * @return {Element} 列表根
     */
    current() {
        return this._page( this._idx );
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
     * 设置新数据集。
     * 注意：
     * 设置数据集后缓存区会清空，当前页重置为首页。
     * @param  {[Object]} objs 条目对象集
     * @return {this}
     */
    data( objs ) {
        this._data = objs;
        this._idx = 0;
        this._pool.length = 0;
        return this;
    }


    /**
     * 返回页数
     * @return {Number}
     */
    pages() {
        return Math.ceil( this._data.length / this._size );
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 获取目标页次的页。
     * @param  {Number} idx 目标页次（从0开始）
     * @return {Element} 列表根
     */
    _page( idx ) {
        this._idx = idx;
        return this._pool[ idx ] || ( this._pool[idx] = this._build(idx) );
    }


    /**
     * 构造目标页次。
     * @param  {Number} idx 页次
     * @return {Element} 目标页根元素
     */
    _build( idx ) {
        let _beg = idx * this._size;
        return Render.update( this._clone(this._root), this._data.slice(_beg, _beg + this._size) );
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
// 实例共享，避免冗余创建。
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
            __poolWorker.add( _wk );
            ev.data.error ? reject( ev.data.error) : resolve( ev.data.result );
        }
        _wk.postMessage( data );
    })
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
    let nodes = $.prevNodes( beg ),
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
    let _nd = $.prevNode( el );
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
    let nodes = $.nextNodes( beg ),
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
    let _nd = $.nextNode( el );
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
