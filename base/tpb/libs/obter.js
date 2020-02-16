//! $Id: obter.js 2019.08.19 Tpb.Core $
// +++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT 解析器。
//
//  完成元素（单个）的OBT逻辑，
//  包括：
//  - On/By/To配置解析。
//  - 创建调用链绑定到元素事件定义。
//  - 存储延迟绑定的调用链。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { Spliter } from "./spliter.js";
import { ACCESS, EXTENT, DEBUG, method } from "../config.js";


const
    $           = window.$,
    SSpliter    = new Spliter(),
    ASpliter    = new Spliter(true);


const
    // OBT构建完成事件
    // 可便于共享的预定义调用链及时绑定。
    __obtDone   = 'obted',

    // 标识字符
    __chrDlmt   = ';',  // 并列分组
    __chrList   = ',',  // 指令/方法并列分隔
    __chrZero   = '-',  // 空白占位符
    __chrPipe   = '|',  // 进阶分隔（事件名|指令链）

    // 事件名标识
    __evnOnce   = '^',  // 绑定单次处理
    __evnStore  = '@',  // 调用链预定义存储

    // To
    __toqMore   = '+',  // 多元素检索前置标志
    __toqExtra  = '!',  // 进阶提取标志
    __toqOrig   = '~',  // 事件起始元素（evo.origin）
    __toqRoot   = '&',  // 事件委托元素（evo.delegate）
    __tosAttr   = '@',  // 特性指定
    __tosProp   = '$',  // 属性指定
    __tosCSS    = '%',  // 样式指定
    __tosToggle = '^',  // 特性（Attribute）切换


    // On事件定义模式。
    // 事件名支持字母、数字和 [._-] 字符（-可用于占位符匹配）。
    // 支持事件名前置 @ 或 ^ 标识字符。
    // 委托选择器的引号包围（单/双引号和撇号）为可选。
    // 注：支持小括号内换行。
    __onEvent   = /^[@^]?(\w[\w.-]*)(?:\(["'`]?([^]*?)["'`]?\))?$/,

    // 调用模式匹配。
    // 方法名支持字母、数字和 [$._-] 字符。
    // 参数段支持任意字符（包括换行），可选。
    __obtCall   = /^([$\w][$\w.-]*)(?:\(([^]*)\))?$/,

    // To:Query
    // 完整的检索表达式。
    // 首尾的引号包围是可选的。
    __toQuery     = /^['"`]?([^]*?)['"`]?$/,

    // To:Query
    // 集合范围子集匹配：( beg, end )。
    // 取值：[1]
    __toRange   = /^\(([\d,\s]*)\)$/,

    // To:Query
    // 集合定位取值匹配：[ 0, 2, 5... ]。
    // 取值：[0]
    __toIndex   = /^\[[\d,\s]*\]$/,

    // To:Query
    // 集合过滤表达式匹配：{ filter-expr }。
    // 取值：[1]
    __toFilter  = /^\{([^]*)\}$/,

    // To:Update
    // 更新方法调用模式。
    // 支持前置4个特殊字符，名称为简单单词。
    __toUpdate  = /^([@&%^]?\w+)(?:\(([^]*)\))?$/;



//
// 元素OBT解析器。
//
const Parser = {
    /**
     * 提取分组对应集。
     * 以On为前置依据，By/To依赖于On的存在。
     * 返回值：单组 {
     *      on: String
     *      by: String
     *      to: String
     * }
     * @param  {Element} el 目标元素
     * @param  {Object3} conf OBT配置集（{on,by,to}）
     * @return {Iterator<Object3>} 单组配置迭代器
     */
    obts( el, conf ) {
        let { on, by, to } = conf;

        return this._teams(
            ASpliter.split(on, __chrDlmt),
            by && [...ASpliter.split(by, __chrDlmt)] || [],
            to && [...ASpliter.split(to, __chrDlmt)] || []
        );
    },


    /**
     * On解析。
     * 格式：evn(slr) evn|call(...),call...
     * 返回值：[
     *      [Evn]       // 事件名定义集
     *      [Call]|null // 指令调用定义集
     * ]
     * @param  {String} fmt On配置串
     * @return {Array2}
     */
    on( fmt ) {
        let [_ev, _ca] = ASpliter.split(fmt, __chrPipe, 1);

        return [
            this._evns( _ev.trim() ),
            _ca ? this._calls( _ca.trim() ) : null
        ];
    },


    /**
     * By解析。
     * @param  {String} fmt By配置串
     * @return {[Call]|null}
     */
    by( fmt ) {
        return fmt ? this._calls( fmt.trim() ) : null;
    },


    /**
     * To解析。
     * 注：空串合法但无用。
     * @param  {String} fmt To配置串
     * @return {[Query, Update|null, [Call]|null]}
     */
    to( fmt ) {
        if ( !fmt ) return [];

        let [_q, _w, _n] = ASpliter.split(fmt, __chrPipe);

        if ( _w ) _w = _w.trim();
        if ( _n ) _n = _n.trim();

        return [
            new Query(_q.trim()),
            _w && _w != __chrZero ? new Update(_w) : null,
            _n && _n != __chrZero ? this._calls(_n) : null,
        ];
    },


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 提取分组对应集。
     * 以On为前置依据，By/To依赖于On的存在。
     * 单组：{
     *      on: String
     *      by: String
     *      to: String
     * }
     * @param  {Iterator<String>} ons On属性值提取器
     * @param  {[String]} bys By属性值定义
     * @param  {[String]} tos To属性值定义
     * @return {Iterator<Object3>} 单组配置迭代器
     */
    *_teams( ons, bys, tos ) {
        let _i = 0;

        for ( const on of ons ) {
            let by = bys[_i],
                to = tos[_i];

            yield {
                on: on && on != __chrZero ? on : null,
                by: by && by != __chrZero ? by : null,
                to: to && to != __chrZero ? to : null,
            };
            _i++;
        }
    },


    /**
     * 分解事件名定义。
     * @param  {String} fmt 事件名定义序列
     * @return {[Evn]|''}
     */
    _evns( fmt ) {
        if ( !fmt ) return '';

        return [...ASpliter.split(fmt, ' ')]
            .map(
                s => new Evn(s.trim())
            );
    },


    /**
     * 分解指令调用定义。
     * @param  {String} fmt 指令调用序列
     * @return {[Call]|null}
     */
    _calls( fmt ) {
        if ( !fmt ) return null;

        return [...ASpliter.split(fmt, __chrList)]
            .map(
                s => new Call(s.trim())
            );
    },

}



//
// OBT 构造器。
// 用法：
// 外部创建一个实例后，即可应用任意元素。
//
class Builder {
    /**
     * 创建一个OBT构造器。
     * 基础库 pbs: {
     *      on:     Object,
     *      by:     Object,
     *      update: Object,
     *      stage:  Object,
     * }
     * @param {Object} pbs OBT指令集
     * @param {Function} store 调用链存储回调（chainStore）
     */
    constructor( pbs, store ) {
        this._pbson = pbs.on;
        this._pbsby = pbs.by;
        this._pbst2 = pbs.update;
        this._pbst3 = pbs.stage;
        this._store = store;
    }


    /**
     * 构建OBT逻辑（元素/对象自身）
     * OBT解析、创建调用链、绑定，存储预定义等。
     * 返回已解析绑定好的原始元素。
     * 注：构建完毕后会向元素发送结束事件（obted）。
     * @param  {Element|Object} obj 绑定目标
     * @param  {Object3} conf OBT配置集（{on,by,to}）
     * @return {Element|Object} obj
     */
    build( obj, conf ) {
        if ( !conf.on ) return;

        for (const obt of Parser.obts(obj, conf) ) {
            let _on = Parser.on(obt.on),
                _by = Parser.by(obt.by),
                _to = Parser.to(obt.to);

            this.bind(
                obj,
                _on[0],
                this.chain(_on[1], _by, _to[0], _to[1], _to[2])
            );
        }
        $.trigger(obj, __obtDone, null, false, false);
        return obj;
    }


    /**
     * 构建调用链。
     * @param  {[Call]} on On调用序列
     * @param  {[Call]} by By调用序列
     * @param  {Query} query To查询配置实例
     * @param  {Update} update To赋值配置实例
     * @param  {[Call]} stage To下一阶调用序列
     * @return {Cell} EventListener
     */
    chain( on, by, query, update, stage ) {
        let _stack = new Stack(),
            _first = Evn.apply( new Cell(_stack) ),
            _prev = null;

        _prev = this._on( _first, _stack, on );
        _prev = this._by( _prev, _stack, by );

        _prev = this._query( _prev, _stack, query );
        _prev = this._update( _prev, _stack, update );
        this._stage( _prev, _stack, stage );

        return _first;
    }


    /**
     * 绑定事件到调用链。
     * 可能多个事件名定义对应一个调用链。
     * @param  {Element|Object} its 绑定目标
     * @param  {[Evn]} evns 事件名定义序列
     * @param  {Cell} chain 起始指令单元
     * @return {void}
     */
    bind( its, evns, chain ) {
        for (const evn of evns) {
            if ( evn.store ) {
                this._store(its, evn.name, chain);
                continue;
            }
            let _fn = evn.once ?
                'one' :
                'on';
            $[_fn](its, evn.name, evn.selector, chain);
        }
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * On构建。
     * 返回最后一个Cell实例，接续By/To。
     * @param  {Cell} prev 前一个指令单元（首个）
     * @param  {Stack} stack 数据栈实例
     * @param  {[Call]} calls 调用配置序列
     * @return {Cell} prev
     */
    _on( prev, stack, calls ) {
        if ( calls ) {
            for (const call of calls) {
                prev = call.apply( new Cell(stack, prev), this._pbson );
            }
        }
        return prev;
    }


    /**
     * By构建。
     * 返回最后一个Cell实例，接续To。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {[Call]} calls 调用配置序列
     * @return {Cell}
     */
    _by( prev, stack, calls ) {
        if ( calls ) {
            for (const call of calls) {
                prev = call.apply( new Cell(stack, prev), this._pbsby );
            }
        }
        return prev;
    }


    /**
     * To:Query构造。
     * 返回最后一个Cell实例，接续To:Update。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {Query} query To查询配置实例
     * @return {Cell}
     */
    _query( prev, stack, query ) {
        return query ?
            query.apply( new Cell(stack, prev) ) : prev;
    }


    /**
     * To:Update构造。
     * 返回最后一个Cell实例，接续To:Stage。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {Update} update To更新配置实例
     * @return {Cell}
     */
    _update( prev, stack, update ) {
        return update ?
            update.apply( new Cell(stack, prev), this._pbst2 ) : prev;
    }


    /**
     * To:Stage构造。
     * 返回最后一个Cell实例（结束）。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {[Call]} stages To下一阶实例集
     * @return {Cell}
     */
    _stage( prev, stack, stages ) {
        if ( stages ) {
            for (const stage of stages) {
                prev = stage.apply( new Cell(stack, prev), this._pbst3 );
            }
        }
        return prev;
    }

}


//
// 流程数据栈。
// 每一个执行流对应一个数据栈实例。
//
class Stack {

    constructor() {
        this._buf = [];     // 数据栈
        this._item;         // 当前条目（暂存区）
        this._done = false; // 是否已暂存
    }


    /**
     * 暂存区取值。
     * 可能自动取栈顶项，视n值而定：{
     *      0   暂存区有值则返回，不自动取栈
     *      1   暂存区有值则返回，否则取栈顶1项（值）
     *      n   暂存区有值则返回，否则取栈顶n项（Array）
     * }
     * 注：取值后暂存区会重置。
     * @param  {Number} n 取栈条目数
     * @return {Value|[Value]} 值/值集
     */
    data( n ) {
        try {
            if ( this._done ) {
                return this._item;
            }
            // 自动取栈
            if ( n == 1 ) this._pop();
            else if ( n > 1 ) this._pops( n );

            return this._item;
        }
        finally {
            this._done = false;
            this._item = undefined;
        }
    }


    /**
     * 指令调用返回值入栈。
     * 注：undefined 表示无返回值，不入栈。
     * @param {Value} val 入栈数据
     */
    push( ...val ) {
        val.forEach ( v => v !== undefined && this._buf.push(v) );
    }


    /**
     * 栈顶多项引用。
     * @param  {Number} n 条目数
     * @return {[Value]}
     */
    tops( n ) {
        return this._buf.slice( -n );
    }


    /**
     * 数据栈成员删除。
     * 注：纯删除功能，被删除的数据不进入暂存区。
     * @param {Number} start 起始下标
     * @param {Number} count 删除数量
     */
    dels( start, count ) {
        this._buf.splice( start, count );
    }


    /**
     * 数据栈重置。
     * 用于执行流再次开启前使用。
     */
    reset() {
        this._buf.length = 0;
        this._done = false;
        this._item = undefined;
    }


    //-- 暂存区赋值 -----------------------------------------------------------

    /**
     * 栈顶弹出赋值。
     * 无实参传调用取出单个值。
     * 否则取出n个（0有效）值并构造为一个数组赋值。
     * 注：用于pop指令。
     * @param {Number|null} n 弹出数量
     * @data: Value | [Value]
     */
    pop( n ) {
        return n == null ? this._pop() : this._pops(n);
    }


    /**
     * 引用范围值赋值。
     * @param {Number} beg 起始位置
     * @param {Number} end 结束位置（不含）
     */
    slice( beg, end ) {
        this._done = true;
        this._item = this._buf.slice( beg, end );
    }


    /**
     * 引用目标位置值赋值。
     * @param {Number} i 下标位置
     */
    index( i ) {
        this._done = true;
        this._item = this._index( i );
    }


    /**
     * 引用多个目标位置值。
     * @param  {...Number} ii 下标序列
     */
    indexes( ...ii ) {
        this._done = true;
        this._item = ii.map( i => this._index(i) );
    }


    /**
     * 栈底移出赋值。
     * 无实参调用移出单个值。
     * 否则移出n个（0有效）值并构造为一个数组赋值。
     * @param {Number} n 移出条目数
     * @data: Value | [Value]
     */
    shift( n ) {
        return n == null ? this._shift() : this._shifts(n);
    }


    /**
     * 移除任意范围条目赋值。
     * @param {Number} start 起始位置
     * @param {Number} count 移除数量
     */
    splice( start, count ) {
        this._done = true;
        this._item = this._buf.splice( start, count );
    }


    /**
     * 移除任意位置值赋值。
     * @param {Number} i 下标位置
     */
    pick( i ) {
        this._done = true;
        this._item = this._buf.splice(i, 1)[0];
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 获取目标位置值。
     * 支持负值下标从末尾算起。
     * @param {Number} i 下标位置
     */
    _index( i ) {
        return this._buf[ i < 0 ? this._buf.length+i : i ];
    }


    /**
     * 移除栈底项暂存。
     * @data: Value
     */
    _shift() {
        this._done = true;
        this._item = this._buf.shift();
    }


    /**
     * 移除栈底多个条目暂存。
     * 0数量会创建一个空集，负值数量无效。
     * @param {Number} n 移除数量
     * @data: [Value]
     */
    _shifts( n ) {
        this._done = true;
        this._item = n > 0 ? this._buf.splice( 0, n ) : [];
    }


    /**
     * 弹出栈顶值暂存。
     * @data: Value
     */
    _pop() {
        this._done = true;
        this._item = this._buf.pop();
    }


    /**
     * 弹出栈顶多个条目暂存。
     * 0数量会创建一个空集，负值数量无效。
     * @param {Number} n 弹出数量
     * @data: [Value]
     */
    _pops( n ) {
        this._done = true;
        this._item = n > 0 ? this._buf.splice( -n ) : [];
    }
}


// 保护Stack实例。
const _SID = Symbol('stack-key');

//
// 指令调用单元。
// 包含一个单向链表结构，实现执行流的链式调用逻辑。
// 调用的方法是一个bound-function，另有一个count值指定取栈数量。
//
class Cell {
    /**
     * 构造指令单元。
     * @param {Stack} stack 当前链数据栈
     * @param {Cell} prev 前一个单元
     */
    constructor( stack, prev = null ) {
        this.next = null;
        this[_SID] = stack;
        this._meth = null;
        this._args = null;
        this._want = null;

        if (prev) prev.next = this;
    }


    /**
     * 事件处理器接口。
     * 即：EventListener.handleEvent()
     * 返回同步序列最后一个指令单元调用的返回值。
     * @param  {Event} ev 事件对象
     * @param  {Object} elo 事件关联对象
     * @param  {Value} extra 初始传递值，可选
     * @return {Value}
     */
    handleEvent( ev, elo, extra ) {
        elo.event = ev;
        this[_SID].reset();

        return this.call( elo, extra );
    }


    /**
     * 方法/参数设置。
     * 特权方法的数据栈对象自动插入到实参序列首位。
     * @param  {Array} args 模板配置的参数序列
     * @param  {Function} meth 目标方法
     * @param  {Boolean} isx 是否为特权方法。
     * @param  {Number|null} n 取栈条目数
     * @return {this}
     */
    bind( args, meth, isx, n ) {
        if ( isx ) {
            args.unshift[this[_SID]];
        }
        this._args = args || '';
        this._meth = meth;
        this._want = $.isNumeric(n) ? +n : null;

        return this;
    }


    /**
     * 承接前阶结果，调用当前。
     * val是前阶方法执行的结果，将被压入数据栈。
     * @param  {Object} evo 事件相关对象
     * @param  {Value} val 上一指令的结果
     * @return {Value}
     */
    call( evo, val ) {
        if ( val !== undefined) {
            this[_SID].push( val );
        }
        evo.data = this._data( this._want );

        // 当前方法执行/续传。
        return this._call( evo, this._meth(evo, ...this._args) );
    }


    /**
     * 下一阶方法调用。
     * 当前方法调用的返回值可能是一个Promise对象。
     * @param  {Object} evo 事件相关对象
     * @param  {Value|Promise} val 当前方法执行的结果
     * @return {Value|void}
     */
    _call( evo, val ) {
        if ( !this.next ) {
            return val;
        }
        if ( $.type(val) !== 'Promise' ) {
            // 非异步！
            // 否则影响有默认行为方法（如submit）的调用。
            return this.next.call(evo, val);
        }
        val.then( v => this.next.call(evo, v), rejectInfo );
    }


    /**
     * 获取流程数据。
     * 注：非数值表示无暂存区取值需求。
     * @param  {Number} 取栈条目数
     * @return {Value|undefined}
     */
    _data( n ) {
        if ( n != null ) {
            return this[_SID].data( n );
        }
    }

}


//
// On事件名定义。
// 针对单个事件的定义，由外部分解提取。
//
class Evn {
    /**
     * 解析格式化事件名。
     * - 前置 ^ 表示绑定单次执行。
     * - 前置 @ 表示预存储事件处理器（调用链）。
     * - 支持括号内指定委托选择器。
     * @param {String} name 格式化名称
     */
    constructor( name ) {
        let _vs = name.match(__onEvent);
        if ( !_vs ) {
            throw new Error('on-attr config is invalid.');
        }
        this.name     = _vs[1];
        this.selector = _vs[2] || null;
        this.once     = name[0] == __evnOnce;
        this.store    = name[0] == __evnStore;
    }


    /**
     * 起始指令对象绑定。
     * 注：实际上只是一个空调用。
     * @param  {Cell} cell 指令单元
     * @return {Cell} cell
     */
    static apply( cell ) {
        return cell.bind( '', empty );
    }

}


// 空占位函数。
function empty() {}


//
// 通用调用定义解析。
// 模板中指令/方法调用的配置解析存储。
//
class Call {
    /**
     * call支持句点引用子集成员。
     * 如：x.math.abs()
     * @param {String} fmt 调用格式串
     */
    constructor( fmt ) {
        let _vs = fmt.match(__obtCall);
        if ( !_vs ) {
            throw new Error('call-attr config is invalid.');
        }
        this._meth = _vs[1];
        this._args = Util.arrArgs(_vs[2]) || [];
    }


    /**
     * 应用到指令集。
     * 方法由接口 [method](name) 提供。
     * 注：特权方法需要绑定数据栈，因此应当是一个未bound函数。
     * - [EXTENT] 自动取栈条目数
     * - [ACCESS] 可访问数据栈（特权）
     * @param  {Cell} cell 指令单元
     * @param  {Object} pbs 指令集
     * @return {Cell} cell
     */
    apply( cell, pbs ) {
        let _f = pbs[method]( this._meth );

        if ( !_f ) {
            throw new Error(`${this._meth} is not in the sets.`);
        }
        return cell.bind( this._args, _f, _f[ACCESS], _f[EXTENT] );
    }

}


//
// To查询配置。
// 格式 {
//      xxx   // 单元素检索：$.get(): Element | null
//      +xxx  // 前置+字符，多元素检索：$(): Collector
//
//      +xxx!( Number, Number )       // 范围：slice()
//      +xxx![ Number, Number, ... ]  // 定点取值：[n]
//      +xxx!{ Filter-Expression }    // 过滤表达式：(v:Element, i:Number, o:Collector): Boolean
//
//      ~   // 事件起始元素（evo.origin）
//      $   // 事件委托元素（evo.delegate）
// }
// 起点元素：支持当前条目（Element），否则为事件当前元素。
//
class Query {
    /**
     * 构造查询配置。
     * 注：空值合法（目标将为起点元素）。
     * @param {String} qs 查询串
     */
    constructor( qs = '' ) {
        this._slr = qs.match(__toQuery)[1];
        this._one = true;

        // 进阶获取。
        // function( Collector ): Collector
        this._fltr = null;

        if (qs[0] == __toqMore) {
            this._slr = qs.substring(1);
            this._one = false;
        }
        this._init( this._slr );
    }


    /**
     * 应用查询。
     * 绑定指令的方法和参数序列。
     * @param  {Cell} cell 指令单元
     * @return {Cell} cell
     */
    apply( cell ) {
        return cell.bind(
            // n:0 支持当前条目，不自动取栈。
            [ this._slr, this._one, this._fltr ], query.bind(null), false, 0
        );
    }


    /**
     * 初始解析构造。
     * 需要处理进阶成员提取部分的定义。
     * @param {String} slr 选择器串
     */
     _init( slr ) {
        if ( !slr ) return;

        let _vs = [...SSpliter.split(slr, __toqExtra, 1)];
        if (_vs.length == 1) {
            return;
        }
        this._slr = _vs[0];
        this._fltr = this._handle( _vs[1].trim() );
    }


    /**
     * 创建提取函数。
     * 接口：function( all:Collector ): Collector|[Element]
     * @param  {String} fmt 格式串
     * @return {Function} 取值函数
     */
    _handle( fmt ) {
        if ( !fmt ) {
            return null;
        }
        if ( __toRange.test(fmt) ) {
            return this._range( fmt.match(__toRange)[1] );
        }
        if ( __toIndex.test(fmt) ) {
            return this._index( fmt.match(__toIndex)[0] );
        }
        if ( __toFilter.test(fmt) ) {
            return this._filter( fmt.match(__toFilter)[1] );
        }
    }


    /**
     * 范围成员提取。
     * @param  {String} fmt 参数串：beg, end
     * @return {Function}
     */
    _range( fmt ) {
        let _n2 = JSON.parse( `[${fmt}]` );
        return all => all.slice( _n2[0], _n2[1] );
    }


    /**
     * 定点成员提取。
     * @param  {String} fmt 定位串：[m, n, ...]
     * @return {Function}
     */
    _index( fmt ) {
        let _nx = JSON.parse( fmt );
        return all => _nx.map( i => all[i] ).filter( v => v );
    }


    /**
     * 过滤器提取。
     * @param  {String} fmt 过滤表达式
     * @return {Function}
     */
    _filter( fmt ) {
        let _fn = new Function(
                'v', 'i', 'o', `return ${fmt};`
            );
        return all => all.filter( _fn );
    }
}


//
// To:Update配置。
// 大多数方法为简单的规范名称，如：before, after, wrap, height 等。
// 特性/属性/样式三种配置较为特殊，采用前置标志字符表达：{
//      @   特性（attribute），如：@title => $.attribute(el, 'title', ...)
//      &   属性（property），如：&value => $.property(el, 'value', ...)
//      %   样式（css）， 如：%font-size => $.css(el, 'font-size', ...)
//      ^   特性切换，如：^-val => $.toggleAttr(el, '-val', ...)
// }
// 支持多方法并列定义，用逗号（__chrList）分隔。
// 注：并列的方法数量即是自动取栈的数量。
//
class Update {
    /**
     * 构造设置器。
     * @param {String} fmt 定义格式串
     */
    constructor( fmt ) {
        let _ns = [...ASpliter.split(fmt, __chrList)]
            .map( s => s.trim() );

        this._names = _ns;
        // 即自动取栈数
        this._count = _ns.length;
    }


    /**
     * 应用更新设置。
     * 提供绑定的参数为一个更新函数集。
     * 更新函数接口：function(Element | Collector, Value): void
     *
     * @param  {Cell} cell 指令单元
     * @param  {Object} pbs 更新方法集
     * @return {Cell} cell
     */
    apply( cell, pbs ) {
        let _fs = this._names
            .map( ss => this._caller(ss, pbs) );

        return cell.bind( _fs, update, false, this._count );
    }


    /**
     * 构造更新调用。
     * 四个常用方法友好：{
     *      @   特性（attribute）
     *      &   属性（property）
     *      %   样式（css）
     *      ^   特性切换（toggleAttr）
     * }
     * 返回值：function(
     *      to:Element|Collector,   Query检索目标
     *      its:Value,              流程数据对应条目
     *      args:[Value]            模板定义实参序列
     * ): Any
     * 注：返回函数的返回值任意，无副作用。
     *
     * @param  {String} call 调用格式串
     * @param  {Object} pbs 更新方法集
     * @return {Function} 更新方法
     */
    _caller( call, pbs ) {
        let [_m, _args] = methodArgs(call);
        return (to, its) => pbs[_m]( to, its, ..._args );
    }

}



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * Promise失败显示。
 * 按前置标志字符串识别层级。
 * 注：无信息不显示。
 * @param {String} msg 显示的消息
 */
function rejectInfo( msg ) {
    if ( !msg || !DEBUG ) {
        return;
    }
    if ( typeof msg != 'string' ) {
        return window.console.dir( msg );
    }
    if ( msg.startsWith('warn:') ) {
        return window.console.warn( msg.substring(5) );
    }
    if ( msg.startsWith('err:') ) {
        return window.console.error( msg.substring(4) );
    }
    window.console.info( msg );
}


/**
 * To：目标检索方法。
 * 支持二阶检索和相对ID属性（见 Util.find）。
 * 支持暂存区当前条目为目标/起点（应由前阶末端指令取栈），
 * 否则检索起点元素为事件当前元素。
 *
 * @param  {Object} evo 事件关联对象
 * @param  {String} slr 选择器串（二阶支持）
 * @param  {Boolean} one 是否单元素版
 * @param  {Function} fltr 进阶过滤提取
 * @return {void}
 */
function query( evo, slr, one, fltr ) {
    let _beg = evo.data;

    if (_beg === undefined) {
        _beg = evo.current;
    }
    evo.targets = query2( evo, slr, _beg, one, fltr );
}


/**
 * To：元素检索（辅助）。
 * 从起点元素上下检索目标元素（集）。
 * 进阶过滤：function( Collector ): Collector
 * 注记：
 * beg可能从暂存区取值为一个集合，已要求slr部分为空，因此代码工作正常。
 *
 * @param  {Object} evo 事件关联对象
 * @param  {String} slr 双阶选择器
 * @param  {Element|null} beg 起点元素
 * @param  {Boolean} one 是否单元素查询
 * @param  {Function} fltr 进阶过滤函数
 * @return {Element|Collector}
 */
function query2( evo, slr, beg, one, fltr ) {
    switch ( slr ) {
        case __toqOrig: return evo.origin;
        case __toqRoot: return evo.delegate;
    }
    let _v = Util.find( slr, beg, one );

    return one ? _v : ( fltr ? fltr(_v) : _v );
}


//
// 友好方法映射。
// 即：特性/属性/样式 的操作方法。
//
const usualMeth = {
    [__tosAttr]:    'attribute',
    [__tosProp]:    'property',
    [__tosCSS]:     'css',
    [__tosToggle]:  'toggleAttr',
};


/**
 * 提取更新方法及实参序列。
 * @param  {String} call 调用格式串
 * @return {[meth, [arg...]]}
 */
 function methodArgs( call ) {
    let _m = usualMeth[ call[0] ];

    if ( _m ) {
        return [ _m, [call.substring(1)] ];
    }
    let _vs = call.match(__toUpdate);

    return [ _vs[1], Util.arrArgs(_vs[2]) || '' ];
}


/**
 * To：更新方法（总）。
 * 如果有并列多个更新，流程数据为数组时会分别对应。
 * 注记：this无关性，可被共享。
 *
 * @param  {Object} evo 事件关联对象
 * @param  {...Function} funs 更新方法集
 * @return {void}
 */
function _update( evo, ...funs ) {
    let _its = evo.targets,
        _val = evo.data;

    if ( _its == null ) return;

    if ( funs.length == 1 ) {
        funs[0]( _its, _val );
        return;
    }
    // _val必然为数组（Query清空暂存）。
    return funs.forEach( (f, i) => f(_its, _val[i]) );
}

//
// 共享方法（bound）。
//
const update = _update.bind(null);



//
// 导出
///////////////////////////////////////////////////////////////////////////////


export { Builder }
