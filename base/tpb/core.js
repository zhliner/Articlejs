//! $Id: core.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  OBT 解析器。
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

import { Util } from "./tools/util.js";
import { Spliter, UmpString, UmpCaller, UmpChars } from "./tools/spliter.js";
import { ACCESS, EXTENT, PREVCELL, DEBUG, methodSelf } from "./config.js";


const
    $ = window.$,

    // OBT构建完成事件
    // 可便于共享的预定义调用链及时绑定。
    __obtDone   = 'obted',

    // 标识字符
    __chrDlmt   = ';',  // 并列分组
    __chrCmd    = ' ',  // 指令/事件名并列分隔
    __chrZero   = '-',  // 空白占位符
    __chrPipe   = '|',  // 进阶分隔（事件名|指令链）

    // 事件名标识
    __evnOnce   = '^',  // 绑定单次处理
    __evnStore  = '@',  // 调用链预定义存储

    // To
    __toqOrig   = '~',  // 事件起始元素（evo.target）
    __toqCurr   = '=',  // 事件当前元素（evo.current）
    __tosAttr   = '@',  // 特性指定
    __tosProp   = '$',  // 属性指定
    __tosCSS    = '%',  // 样式指定
    __tosToggle = '^',  // 特性（Attribute）切换

    // To:Update
    // 友好方法名映射。
    __updateMethod = {
        [__tosAttr]:    'attr',
        [__tosProp]:    'prop',
        [__tosCSS]:     'css',
        [__tosToggle]:  'toggleAttr',
    },

    // 空名称指代。
    // 仅限于调用（Call）指令。
    __zeroName  = 'push',

    // 并列分组切分器。
    // 注：属性选择器内分号不可用（无需包含）。
    __dlmtSplit = new Spliter( __chrDlmt, new UmpCaller(), new UmpString() ),

    // 指令切分器。
    // 注意：多出的空格被切分为空串。
    __cmdSplit  = new Spliter( __chrCmd, new UmpCaller() ),

    // 进阶定义切分器。
    // 需要区分属性选择器、调用式。
    // 注：字符串不在属性值或调用式之外（无需包含）。
    __pipeSplit = new Spliter( __chrPipe, new UmpCaller, new UmpChars('[', ']') ),


    // On事件定义模式。
    // 事件名支持字母、数字和 [._:-] 字符（-可用于占位符匹配）。
    // 支持事件名前置 @ 或 ^ 标识字符。
    // 委托选择器无需引号包围。
    __onEvent   = /^[@^]?(\w[\w.:-]*)(?:\(([^]*?)\))?$/,

    // 调用模式匹配。
    // 方法名支持字母、数字和 [$._-] 字符。
    // 参数段支持任意字符（包括换行），可选。
    // 特例：允许空名称（之后应当为括号）。
    __obtCall   = /^(^|[$\w][$\w.-]*)(?:\(([^]*)\))?$/,

    // To:Query
    // 多元素检索表达式。
    // 注：由一对小括号包围选择器，后跟可选的过滤部分。
    __toQuery   = /^\(([^]*?)\)\s*([([{][^]+[)\]}])?$/,

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
    // 更新方法调用模式，名称仅为简单单词。
    __toUpdate  = /^(\w+)(?:\(([^]*)\))?$/,

    // 从流程中获取实参标记（key）。
    // 用于模板中的取值表达（最后一个实参）。
    __fromStack = {
        _:  Symbol(0),  // 取流程数据1项（展开）。
        _1: Symbol(1),  // 取流程数据1项。
        _2: Symbol(2),  // 取流程数据2项。
        _3: Symbol(3),  // ...
        _4: Symbol(4),  // ...
        _5: Symbol(5),  // ...
        _6: Symbol(6),  // ...
        _7: Symbol(7),  // ...
        _8: Symbol(8),  // ...
        _9: Symbol(9),  // ...
    },

    // 流程数据取项数量映射。
    // { Symbol(0):0, Symbol(1):1, ... }
    __flowCnts = Object.keys(__fromStack)
    .reduce( (o, k) => (o[__fromStack[k]] = +k.substring(1), o), {} );



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
     * @param  {Object3} conf OBT配置集（{on,by,to}）
     * @return {Iterator<Object3>} 单组配置迭代器
     */
    *obts( conf ) {
        let bys = [...__dlmtSplit.split(conf.by)],
            tos = [...__dlmtSplit.split(conf.to)],
            i = 0;

        for (let on of __dlmtSplit.split(conf.on)) {
            // 容错末尾;
            if ( !(on = zeroPass(on)) ) {
                continue;
            }
            yield {
                on: on,
                by: zeroPass( bys[i] ),
                to: zeroPass( tos[i] ),
            };
            i++;
        }
    },


    /**
     * On解析。
     * 格式：evn(slr) evn|call(...) call...
     * 返回值：[
     *      [Evn]       // 事件名定义集
     *      [Call]|''   // 指令调用定义集
     * ]
     * @param  {String} fmt On配置串
     * @return {Array2}
     */
    on( fmt ) {
        let [_ev, _ca] = __pipeSplit.split(fmt, 1);

        return [
            this.evns( _ev ),
            this.calls( zeroPass(_ca) )
        ];
    },


    /**
     * By解析。
     * @param  {String} fmt By配置串
     * @return {[Call]|''}
     */
    by( fmt ) {
        return this.calls( fmt );
    },


    /**
     * To解析。
     * 注：空串合法但无用。
     * @param  {String} fmt To配置串
     * @return {[Query, [Update]|'', [Call]|'']|''}
     */
    to( fmt ) {
        if ( !fmt ) return '';

        let [_q, _w, _n] = [...__pipeSplit.split(fmt, 2)].map( zeroPass );

        return [
            new Query( _q ),
            this.updates( _w ),
            this.calls( _n ),
        ];
    },


    /**
     * 分解事件名定义。
     * @param  {String} fmt 事件名定义序列
     * @return {[Evn]|''}
     */
    evns( fmt ) {
        return fmt && this._parse( fmt, Evn );
    },


    /**
     * 解析调用指令定义。
     * @param  {String} fmt 指令调用序列
     * @return {[Call]|''}
     */
    calls( fmt ) {
        return fmt && this._parse( fmt, Call );
    },


    /**
     * 解析更新指令定义。
     * @param  {String} fmt 更新指令序列
     * @return {[Update]|''}
     */
    updates( fmt ) {
        return fmt && this._parse( fmt, Update );
    },


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 解析构建目标类型实例集。
     * @param  {String} fmt 调用定义串
     * @param  {Class} T 目标类型
     * @return {[Class]}
     */
    _parse( fmt, T ) {
        let _buf = [];

        for (const s of __cmdSplit.split(fmt)) {
            // 忽略多余空格
            if ( s ) _buf.push( new T(s) );
        }
        return _buf;
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
     *      next:   Object,
     * }
     * @param {Object} pbs OBT指令集
     * @param {Function} store 调用链存储回调（storeChain）
     */
    constructor( pbs, store ) {
        this._pbson = pbs.on;
        this._pbsby = pbs.by;
        this._pbst2 = pbs.update;
        this._pbst3 = pbs.next;
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

        for (const obt of Parser.obts(conf) ) {
            let _on = Parser.on(obt.on),
                _by = Parser.by(obt.by),
                _to = Parser.to(obt.to);

            this.bind(
                obj,
                _on[0],
                this.chain(_on, _by, _to[0], _to[1], _to[2])
            );
        }
        $.trigger(obj, __obtDone, null, false, false);
        return obj;
    }


    /**
     * 构建调用链。
     * @param  {[[Evn],[Call]]} ons On调用序列
     * @param  {[Call]} bys By调用序列
     * @param  {Query} query To查询配置实例
     * @param  {[Update]} updates To更新调用序列
     * @param  {[Call]} nexts To下一阶调用序列
     * @return {Cell} EventListener
     */
    chain( ons, bys, query, updates, nexts ) {
        let _stack = new Stack(),
            _first = Evn.apply( new Cell(_stack), ons[0] ),
            _prev = this._on( _first, _stack, ons[1] );

        _prev = this._by( _prev, _stack, bys );
        _prev = this._query( _prev, _stack, query );
        _prev = this._update( _prev, _stack, updates );
        this._nextStage( _prev, _stack, nexts );

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
                prev = call.apply( new Cell(stack, prev), this._pbson, prev );
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
                prev = call.apply( new Cell(stack, prev), this._pbsby, prev );
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
     * 返回最后一个Cell实例，接续To:NextStage。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {[Update]} updates To更新配置实例集
     * @return {Cell}
     */
    _update( prev, stack, updates ) {
        if ( updates ) {
            for (const update of updates) {
                prev = update.apply( new Cell(stack, prev), this._pbst2 );
            }
        }
        return prev;
    }


    /**
     * To:Stage构造。
     * 返回最后一个Cell实例（结束）。
     * @param  {Cell} prev 前一个指令单元
     * @param  {Stack} stack 数据栈实例
     * @param  {[Call]} nexts To下一阶实例集
     * @return {Cell}
     */
    _nextStage( prev, stack, nexts ) {
        if ( nexts ) {
            for (const ns of nexts) {
                prev = ns.apply( new Cell(stack, prev), this._pbst3, prev );
            }
        }
        return prev;
    }

}


//
// 流程数据栈。
// 每一个执行流包含一个数据栈实例。
//
class Stack {

    constructor() {
        this._buf = []; // 数据栈
        this._tmp = []; // 暂存区
    }


    /**
     * 通用取值。
     * 暂存区：按正序（队列）取值。
     * 数据栈：按逆序（栈顶）取值。
     * n：{
     *  0   暂存区有值则取出全部，不自动取栈
     *  1   暂存区有值则取出1项，否则取栈顶1项
     *  n   暂存区有值则取出n项（可能不足n项），否则取栈顶n项
     * -n   暂存区有值则取出n项（可能不足n项），不自动取栈
     * }
     * 注：n大于1时，确定返回一个数组（可能为空）。
     *
     * @param  {Number} n 取栈条目数
     * @return {Value|[Value]} 值/值集
     */
    data( n ) {
        if ( n === 0 ) {
            return this._tmpall();
        }
        if ( this._tmp.length ) {
            return this._tmpval(n);
        }
        if ( n > 0 ) {
            return n > 1 ? this._buf.splice(-n) : this._buf.pop();
        }
    }


    /**
     * 指令调用返回值入栈。
     * 注：undefined 表示无返回值，不入栈。
     * @param {...Value} vals 入栈数据
     */
    push( ...vals ) {
        vals.forEach ( v => v !== undefined && this._buf.push(v) );
    }


    /**
     * 压入一个undefined。
     * 注：正常的入栈不包含undefined。
     */
    undefined() {
        this._buf.push( undefined );
    }


    /**
     * 栈顶多项引用。
     * 注：始终返回一个集合。
     * @param  {Number} n 条目数
     * @return {[Value]}
     */
    tops( n ) {
        return this._buf.slice( -n );
    }


    /**
     * 复制特定范围的成员。
     * @param {Number} beg 起始位置
     * @param {Number} end 结束位置（不含）
     */
    slice( beg, end ) {
        return this._buf.slice( beg, end );
    }


    /**
     * 弹出数据栈顶1项。
     */
    pop() {
        return this._buf.pop();
    }


    /**
     * 弹出数据栈顶n项。
     * @param  {Number} n 栈顶项数
     * @return {Array} 被删除集
     */
    pops( n ) {
        return this._buf.splice( -n );
    }


    /**
     * 数据栈重置。
     * 用于执行流再次开启前使用。
     */
    reset() {
        this._buf.length = 0;
        this._tmp.length = 0;
    }


    //-- 暂存区赋值 -----------------------------------------------------------
    // 按顺序添加到暂存区队列中。
    // @return {void}


    /**
     * 弹出栈顶单项。
     * 注记：
     * 如果数据栈已为空，压入取出的undefined是有意义的，
     * 这是一种明确取值，在后阶指令需要多项时有区别（undefined或[]）。
     */
    tpop() {
        this._tmp.push( this._buf.pop() );
    }


    /**
     * 弹出栈顶n项。
     * 小于2的值无效。
     * 注记：
     * 实际压入的项数可能不足（数据栈不足），但这对用户来说是明确的。
     * @param {Number} n 弹出数量
     */
    tpops( n ) {
        if ( n > 1 ) {
            this._tmp.push( ...this._buf.splice(-n) );
        }
    }


    /**
     * 移除栈底项。
     * 注记参考pop()。
     */
    tshift() {
        this._tmp.push( this._buf.shift() );
    }


    /**
     * 移除栈底多项。
     * 小于2的值无效。
     * 注记参考pops()。
     * @param {Number} n 移除数量
     */
    tshifts( n ) {
        if ( n > 1 ) {
            this._tmp.push( ...this._buf.splice(0, n) );
        }
    }


    /**
     * 引用特定目标位置值。
     * 下标值支持负数从末尾算起。
     * 注：非法的下标位置会导入一个undefined值。
     * @param {[Number]} ns 下标集
     */
    tindex( ns ) {
        this._tmp.push( ...ns.map( i => this._index(i) ) );
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
     * 暂存区取值。
     * n为负值合法（不取栈）。
     * 如果|n|大于1，返回一个数组，否则返回一个值。
     * 注：|n|大于1时取出的成员可能不足n项。
     * @param  {Number} n 取出数量
     * @return {Value|[Value]}
     */
    _tmpval( n ) {
        if ( n < 0 ) n = -n;
        return n > 1 ? this._tmp.splice(0, n) : this._tmp.shift();
    }


    /**
     * 取出暂存区全部成员。
     * 如果只有1项或为空，返回其值或undefined。
     * @return {Value|[Value]|undefined}
     */
    _tmpall() {
        let _v = this._tmp.splice(0);
        return _v.length > 1 ? _v : _v[0];
    }
}


// 保护Stack实例。
const _SID = Symbol('stack-key');

//
// 指令调用单元。
// 包含一个单向链表结构，实现执行流的链式调用逻辑。
// 调用的方法大多是一个bound-function。
// 另有一个count值指定取栈数量。
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

        // 惰性成员（按需添加）：
        // this._args;  // 实参序列
        // this._want;  // 取项数量
        // this._rest;  // 补充模板实参数量
        // this._extra; // 初始启动传值
        // this.prev;   // 前阶单元（prune指令需要）

        if (prev) prev.next = this;
    }


    /**
     * 设置初始值。
     * 注：仅绑定类指令（bind）可能会传递该值。
     * @param  {Value} val 初始值
     * @return {this}
     */
    initVal( val ) {
        if ( val !== undefined ) {
            this._extra = val;
        }
        return this;
    }


    /**
     * 从流程取模板实参配置。
     * 处理模板实参中 _[n] 标识名。
     * @param  {Array} args 参数序列
     * @return {this}
     */
    setRest( args ) {
        if ( !args ) {
            return this;
        }
        let _rest = __flowCnts[ args[args.length-1] ];

        if ( _rest !== undefined ) {
            args.pop();
            // 0 ~ 9
            this._rest = _rest;
        }
        return this;
    }


    /**
     * 设置前阶指令单元。
     * 注：仅极少数控制类指令需要（prune）。
     * @param {Cell} cell 指令单元
     */
    setPrev( cell ) {
        this.prev = cell;
    }


    /**
     * 克隆当前指令实例。
     * @return {Cell}
     */
    clone() {
        return Object.assign( new Cell(), this );
    }


    /**
     * 事件处理器接口。
     * 即：EventListener.handleEvent()
     * 返回同步序列最后一个指令单元调用的返回值。
     * @param  {Event} ev 事件对象
     * @param  {Object} elo 事件关联对象
     * @return {Value}
     */
    handleEvent( ev, elo ) {
        elo.event = ev;
        this[_SID].reset();

        return this.call( elo, this._extra );
    }


    /**
     * 方法/参数设置。
     * 特权方法的数据栈对象自动插入到实参序列首位。
     * @param  {Array|null} args 模板配置的参数序列
     * @param  {Function} meth 目标方法
     * @param  {Boolean} isx 是否为特权方法。
     * @param  {Number} n 取条目数，可选
     * @return {this}
     */
    bind( args, meth, isx, n = null ) {
        if ( isx ) {
            args = [this[_SID]].concat(args ? args : []);
        }
        this._meth = meth;

        // 惰性添加。
        if ( args ) {
            this._args = args;
        }
        if ( n != null ) {
            this._want = n;
        }
        return this.setRest( this._args );
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
        val = this._meth(
            evo,
            ...this.args(evo, this._args || [], this._rest)
        );
        return this.nextCall( evo, val );
    }


    /**
     * 获取最终模板实参序列。
     * 处理 _[n] 标识从流程数据中补充模板实参。
     * @param  {Object} evo 数据引用
     * @param  {Array} args 原实参集
     * @param  {Number|undefined} rest 提取项数
     * @return {Array} 最终实参集
     */
    args( evo, args, rest ) {
        if ( rest === 0 ) {
            // 强制展开
            args = args.concat( ...this[_SID].pop() );
        }
        else if ( rest > 0 ) {
            args = args.concat( this[_SID].pops(rest) );
        }
        evo.data = this.data( this._want );

        return args;
    }


    /**
     * 下一阶方法调用。
     * @param  {Object} evo 事件相关对象
     * @param  {Value|Promise} val 当前方法执行的结果
     * @return {Value|void}
     */
    nextCall( evo, val ) {
        if ( !this.next ) {
            return val;
        }
        if ( $.type(val) !== 'Promise' ) {
            // 保持线性！
            // 否则后续对事件默认行为的取消操作（avoid）会延后，
            // 影响事件名同是方法的调用链（如submit）。
            return this.next.call(evo, val);
        }
        val.then( v => this.next.call(evo, v), rejectInfo );
    }


    /**
     * 从暂存区/数据栈获取流程数据。
     * 如果要从流程取实参，非零项数取值仅为1项（模板用户负责打包）。
     * 注：无取值项数指令也可取值。
     * @param  {Number|null} n 取值项数
     * @return {Value|[Value]|undefined}
     */
    data( n ) {
        if ( n != null ) return this[_SID].data( n );
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
     * @param  {[Evn]} evns 事件名定义集
     * @return {Cell} cell
     */
    static apply( cell, evns ) {
        let fn = empty;

        if ( DEBUG ) {
            fn = fn.bind( evns ); // 信息查看。
        }
        return cell.bind( null, fn );
    }

}


// 空占位函数。
function empty() {}


//
// 通用调用定义解析。
// 模板中指令/方法调用的配置解析存储。
// 注记：
// 仅调用类指令支持对链自身的控制（prune）。
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
        // 特例：
        // 友好支持空名称为push指令。
        this._meth = _vs[1] || __zeroName;
        this._args = arrArgs(_vs[2]);
    }


    /**
     * 应用到指令集。
     * 两个特别标记：
     * - [EXTENT] 自动取栈条目数
     * - [ACCESS] 可访问数据栈（特权）
     * 需要检查处理前阶指令存储标记：
     * - [PREVCELL] 极少数指令需要（目前仅prune）。
     * @param  {Cell} cell 指令单元
     * @param  {Object} pbs 指令集
     * @param  {Cell} prev 前阶指令
     * @return {Cell} cell
     */
    apply( cell, pbs, prev ) {
        let _f = methodSelf(this._meth, pbs);

        if ( !_f ) {
            throw new Error(`${this._meth} is not in pbs:calls.`);
        }
        if ( _f[PREVCELL] ) {
            cell.setPrev( prev );
        }
        return cell.bind( this._args, _f, _f[ACCESS], _f[EXTENT] );
    }

}


//
// To查询配置。
// 格式 {
//      xxx   // 单元素检索：$.get(...): Element | null
//      (xxx) // 小括号包围，多元素检索：$(...): Collector
//
//      (xxx)( Number, Number )       // 范围：slice()
//      (xxx)[ Number, Number, ... ]  // 定点取值：[n]
//      (xxx){ Filter-Expression }    // 过滤表达式：(v:Element, i:Number, o:Collector): Boolean
//
//      ~   // 事件起始元素（evo.target）
//      #   // 事件当前元素（evo.current）
// }
// 起点元素：支持暂存区1项可选（可为任意值），否则为事件绑定/委托元素。
//
class Query {
    /**
     * 构造查询配置。
     * 注：空值合法（目标将为起点元素）。
     * @param {String} qs 查询串
     */
    constructor( qs ) {
        this._slr = qs;
        this._one = true;
        this._flr = null;

        this._matchMore( qs.match(__toQuery) );
    }


    /**
     * 应用查询。
     * 绑定指令的方法和参数序列。
     * @param  {Cell} cell 指令单元
     * @return {Cell} cell
     */
    apply( cell ) {
        // n:-1 支持暂存区1项可选
        return cell.bind( [this._slr, this._one, this._flr], query, false, -1 );
    }


    /**
     * 多检索匹配处理。
     * 需要处理进阶成员提取部分的定义。
     * @param {Array} result 多检索选择器匹配结果
     */
     _matchMore( result ) {
        if ( result ) {
            this._slr = result[1];
            this._flr = this._handle(result[2]);
            this._one = false;
        }
    }


    /**
     * 创建提取函数。
     * 接口：function( all:Collector ): Collector|[Element]
     * @param  {String} fmt 格式串
     * @return {Function} 取值函数
     */
    _handle( fmt ) {
        if ( !fmt ) return null;

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
     * 越界下标的值会被忽略。
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
//      @   特性（attribute），如：@title => $.attr(el, 'title', ...)
//      &   属性（property），如：&value => $.prop(el, 'value', ...)
//      %   样式（css）， 如：%font-size => $.css(el, 'font-size', ...)
//      ^   特性切换，如：^-val => $.toggleAttr(el, '-val', ...)
// }
// 注记：
// Updata方法取值条目数强制为1，不适用集成控制指令集。
//
class Update {
    /**
     * 构造设置器。
     * @param {String} fmt 定义格式串
     */
    constructor( fmt ) {
        let _vs = this.methArgs(fmt);

        this._meth = _vs[0];
        this._args = arrArgs(_vs[1]);
    }


    /**
     * 应用更新设置。
     * 更新函数接口：function(Element|Collector, Value, ...): Value|void
     * 注：取值数量默认为1。
     * @param  {Cell} cell 指令单元
     * @param  {Object} pbs 更新方法集
     * @return {Cell} cell
     */
    apply( cell, pbs ) {
        let _f = methodSelf(this._meth, pbs),
            _n, _x;

        if ( !_f ) {
            throw new Error(`${this._meth} is not in pbs:updates.`);
        }
        if ( _f[EXTENT] === undefined ) {
            _n = 1;
        }
        if ( _f[ACCESS] === undefined ) {
            _x = false;
        }
        return cell.bind( this._args, update.bind(_f), _x, _n );
    }


    /**
     * 提取更新方法及实参序列。
     * 友好方法：{
     *      @   特性（attribute）
     *      &   属性（property）
     *      %   样式（css）
     *      ^   特性切换（toggleAttr）
     * }
     * @param  {String} fmt 调用格式串
     * @return {[meth, args]}
     */
    methArgs( fmt ) {
        let _m = __updateMethod[ fmt[0] ];

        if (_m) {
            return [ _m, `'${fmt.substring(1)}'` ];
        }
        // :result[1~]
        return fmt.match(__toUpdate).slice(1);
    }
}



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * 占位字符处理。
 * 如果原字符串为假或占位符，则返回null，
 * 否则返回一个整理后（trim）的字符串。
 * @param  {String} chr 原字符串
 * @return {String}
 */
function zeroPass( chr ) {
    chr = chr && chr.trim();
    return !chr || chr == __chrZero ? '' : chr;
}


/**
 * 解析模板参数序列。
 * 支持模板实参“_[n]”特别标识名表示从流程数据取值。
 * @param  {String} args 参数序列串
 * @return {Array|null}
 */
function arrArgs( args ) {
    if ( !args ) return null;

    return new Function( ...Object.keys(__fromStack), `return [${args}]` )(
        ...Object.values(__fromStack)
    );
}



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
 * 支持暂存区1项为检索起点（由前阶末端指令取出），
 * 否则检索起点元素为事件绑定/委托元素。
 * @param  {Object} evo 事件关联对象
 * @param  {String} slr 选择器串（二阶支持）
 * @param  {Boolean} one 是否单元素版
 * @param  {Function} flr 进阶过滤提取
 * @return {void}
 */
function query( evo, slr, one, flr ) {
    let _beg = evo.data;

    if ( _beg === undefined ) {
        _beg = evo.delegate;
    }
    evo.updated = evo.primary = query2(evo, slr, _beg, one, flr);
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
 * @param  {Function} flr 进阶过滤函数
 * @return {Element|Collector}
 */
function query2( evo, slr, beg, one, flr ) {
    switch ( slr ) {
        case __toqOrig: return evo.target;
        case __toqCurr: return evo.current;
    }
    let _v = Util.find( slr, beg, one );

    return one ? _v : ( flr ? flr(_v) : _v );
}


/**
 * To：更新方法（单个）。
 * 注：非undefined返回值会更新目标自身。
 * @param  {Object} evo 事件关联对象
 * @param  {...Value} rest 剩余实参序列（最终）
 * @return {void}
 */
function update( evo, ...rest ) {
    let _val = this(
        evo.updated, evo.data, ...rest
    );
    if ( _val !== undefined ) evo.updated = _val;
}



//
// 导出
///////////////////////////////////////////////////////////////////////////////


export { Builder }
