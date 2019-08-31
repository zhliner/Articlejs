//! $Id: pbs.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT 基础集定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { _On } from "./pbs.on.js";
import { _By } from "./pbs.by.js";
import { _To } from "./pbs.to.js";


const
    $ = window.$,

    // 指令配置属性
    EXTENT = Symbol('stack-amount'),  // 自动取栈计数
    ACCESS = Symbol('stack-access');  // 特权方法


//
// 友好：evo成员名数值键。
//
const evoIndex = {
        0:  'origin',       // 事件起点元素（event.target）
        1:  'current',      // 触发事件的当前元素（event.currentTarget|matched）
        2:  'delegate',     // 事件相关联元素（event.relatedTarget）
        3:  'related',      // 委托绑定的元素（event.currentTarget）
        8:  'selector',     // 委托匹配选择器（for match）]
        9:  'event',        // 原生事件对象（未侵入）
        10: 'data',         // 自动获取的流程数据
        11: 'target',       // To目标元素（集）向后延续
    };



//
// 全局顶层方法。
// 适用 On/By/To 三个域。
//
const _Base = {

    // 基础集
    //===============================================

    /**
     * 单元素检索入栈。
     * 目标：当前条目，不自动取栈。
     * rid: {
     *      String  以当前条目（如果有）或事件当前元素（ev.current）为起点。
     *      null    以当前条目为rid，事件当前元素为起点。
     * }
     * @param {Object} evo 事件关联对象
     * @param  {String|null} rid 相对ID
     * @return {Element}
     */
    $( evo, rid ) {
        let _beg = evo.current;

        if ( rid == null ) {
            rid = evo.data;
        } else {
            _beg = evo.data || _beg;
        }
        return Util.find( rid, _beg, true );
    },

    __$: 0,


    /**
     * 多元素检索入栈。
     * 目标：当前条目，不自动取栈。
     * rid: {
     *      String  同上。
     *      null    同上，但当前条目也可能非字符串类型。
     *      Value   Collector封装，支持数组。
     * }
     * 当前条目的权重低于rid实参，因此如果rid为Collector封装，当前条目会被忽略。
     * 明确取当前条目时，也可能为Collector封装。

     * @param  {Object} evo 事件关联对象
     * @param  {String|null|Value} rid 相对ID或待封装值
     * @return {Collector}
     */
    $$( evo, rid ) {
        let _beg = evo.current;

        if ( rid == null ) {
            rid = evo.data;
        } else {
            _beg = evo.data || _beg;
        }
        return typeof rid == 'string' ? Util.find( rid, _beg ) : $(rid);
    },

    __$$: 0,


    /**
     * evo成员取值入栈。
     * 目标：无。
     * @param  {String|Number} name 成员名称或代码
     * @return {Element|Collector|Value}
     */
    evo( evo, name ) {
        return evo[ evoIndex[name] || name ];
    },

    __evo: null,


    /**
     * 从事件对象上取值。
     * 多个实参取值会自动展开入栈。
     * 如果需要入栈一个属性值集合，可以传递名称数组。
     * 目标：无。
     * 特权：是。this为数据栈实例。
     * @param  {...String} names 事件属性名
     * @return {void} 自操作入栈
     */
    ev( evo, ...names ) {
        let _vs = names.map( name =>
            $.isArray(name) ? name.map( n => evo.event[n] ) : evo.event[name]
        );
        this.push( ..._vs );
    },

    __ev: null,
    __ev_x: true,


    // 空指令。
    // 目标：无。
    nil( evo ) {},

    __nil: null,


    /**
     * 删除数据栈任意区段条目。
     * 目标：无。
     * 特权：是。this为数据栈实例。
     * 注：
     * 与暂存区赋值类指令不同，这只是纯粹的删除功能。
     * 可能并不常用。
     * @param  {Number} start 起始位置
     * @param  {Number} count 删除数量
     * @return {void}
     */
    del( evo, start, count ) {
        this.del( start, count );
    },

    __del: null,
    __del_x: true,


    /**
     * 向控制台打印消息。
     * 目标：当前条目，不自动取栈。
     * 实参显示在前（如果有），当前条目显示在后（如果有）。
     * 注：测试用途。
     * @param  {...String} msg 消息序列
     * @return {void}
     */
    hello( evo, ...msg ) {
        if ( evo.data !== undefined ) {
            msg.push( evo.data );
        }
        window.console.info( ...msg );
    },

    __hello: 0,



    // 控制类
    //===============================================

    /**
     * 通过性检查。
     * 目标：当前条目/栈顶1项。
     * 检查目标值是否为真（非假）或是否与val相等（===）。
     * 结果为假会中断执行流。
     * @param  {Value} val 对比值，可选
     * @return {Promise:void}
     */
    pass( evo, val ) {
        let _v = evo.data;

        if ( val !== undefined ) {
            _v = val === _v;
        }
        return new Promise( (ok, fail) => _v ? ok() : fail(_v) );
    },

    __pass: 1,


    /**
     * 停止事件默认行为。
     * 目标：当前条目，不自动取值。
     * 如果当前条目非空，则真值停止，否则无条件停止。
     * back为执行之后的返回值（入栈），如果未执行则无用。
     * @param  {Value} back 执行结果，可选
     * @return {back|void}
     */
    avoid( evo, back ) {
        let _v = this.data;

        if ( _v === undefined || _v ) {
            evo.event.preventDefault();
            return back;
        }
    },

    __avoid: 0,


    /**
     * 停止事件冒泡。
     * 目标：当前条目，不自动取栈。
     * 如果当前条目非空，则真值执行（停止），否则无条件执行。
     * back为执行之后的返回值，如果未执行则无用。
     * 例：
     * 执行后同时终止执行流：stop(false) pass
     *
     * @param  {Value} back 执行结果，可选
     * @return {back|void}
     */
    stop( evo, back ) {
        let _v = this.data;

        if ( _v === undefined || _v ) {
            evo.event.stopPropagation();
            return back;
        }
    },

    __stop: 0,


    /**
     * 停止事件冒泡并阻止本事件其它处理器的执行。
     * 目标：当前条目，不自动取栈。
     * 如果当前条目非空，则真值执行（停止），否则无条件执行。
     * back为执行之后的返回值，如果未执行则无用。
     *
     * @param  {Value} back 执行结果，可选
     * @return {back|void}
     */
     stopAll( evo, back ) {
        let _v = this.data;

        if ( _v === undefined || _v ) {
            evo.event.stopImmediatePropagation();
            return back;
        }
    },

    __stopAll: 0,


    /**
     * 流程终止。
     * 目标：当前条目，不自动取栈。
     * 如果当前条目非空，则真值终止，否则无条件终止。
     * @return {void}
     */
    end( evo ) {
        let _v = evo.data;

        if ( _v !== undefined && _v ) {
            return;
        }
        return new Promise( (_, fail) => fail() );
    },

    __end: 0,



    // 暂存区赋值
    // 目标：赋值非取值，无。
    // __[name]: null （略）
    //===============================================

    pop( evo, n ) {
        //
    },

    __pop_x: true,


    slice( evo, beg, end ) {
        //
    },

    __slice_x: true,


    index( evo, n ) {
        //
    },

    __index_x: true,


    shift( evo, n ) {
        //
    },

    __shift_x: true,


    splice( evo, start, count ) {
        //
    },

    __splice_x: true,


    pick( evo, i ) {
        //
    },

    __pick_x: true,

};


const Base = $.assign( {}, _Base, getMethod );



//
// 运算层基础方法。
// 仅用于 On/By 两个域。
//
const _Base2 = {

    // 类型转换
    //===============================================

    Arr( evo, ext ) {
        //
    },

    __Arr: 1,


    Str( evo, prefix = '', suffix = '' ) {
        //
    },

    __Str: 1,


    Bool( evo ) {
        //
    },

    __Bool: 1,


    Int( evo, radix ) {
        //
    },

    __Int: 1,


    Float( evo ) {
        //
    },

    __Float: 1,


    // 简单值操作
    //===============================================

    evn( evo, name, its ) {
        //
    },

    __evn: 0,


    data( evo, name, its ) {
        //
    },

    __data: 0,


    push( evo, ...val ) {
        //
    },

    __push: 0,


    value( evo, ...name ) {
        //
    },

    __value: 1,


    // 集合筛选
    //===============================================

    filter( evo, $expr ) {
        //
    },

    __filter: 1,


    not( evo, $expr ) {
        //
    },

    __not: 1,


    has( evo, $expr ) {
        //
    },

    __has: 1,


    flat( evo, deep ) {
        //
    },

    __flat: 1,


    // 简单运算
    //===============================================

    add( evo ) {
        //
    },

    __add: 2,


    sub( evo ) {
        //
    },

    __sub: 2,


    mul( evo ) {
        //
    },

    __mul: 2,


    div( evo ) {
        //
    },

    __div: 2,


    mod( evo ) {
        //
    },

    __mod: 2,


    divmod( evo ) {
        //
    },

    __divmod: 2,


    nneg( evo ) {
        //
    },

    __nneg: 1,


    vnot( evo ) {
        //
    },

    __vnot: 1,


    dup( evo ) {
        //
    },

    __dup: 1,


    clone( evo, event, deep, eventdeep ) {
        //
    },

    __clone: 3,


    // 比较运算
    //===============================================

    equal( evo ) {
        //
    },

    __equal: 2,


    nequal( evo ) {
        //
    },

    __nequal: 2,


    lt( evo ) {
        //
    },

    __lt: 2,


    lte( evo ) {
        //
    },

    __lte: 2,


    gt( evo ) {
        //
    },

    __gt: 2,


    gte( evo ) {
        //
    },

    __gte: 2,


    // 逻辑运算
    //===============================================

    within( evo ) {
        //
    },

    __within: 1,


    inside( evo ) {
        //
    },

    __inside: 1,


    both( evo ) {
        //
    },

    __both: 2,


    either( evo ) {
        //
    },

    __either: 2,


    every( evo ) {
        //
    },

    __every: 1,


    some( evo, n ) {
        //
    },

    __some: 1,


    // 判断执行。
    //===============================================

    vtrue( evo, $expr, ...rest ) {
        //
    },

    __vtrue: 1,


    vfalse( evo, $expr, ...rest ) {
        //
    },

    __vfalse: 1,


    // 其它
    //===============================================

    tpl( evo, name, timeout ) {
        //
    },

    __tpl: 0,

};


const Base2 = $.assing( {}, _Base2, getMethod );



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取指令/方法。
 * 非特权方法会绑定方法内this为原生宿主对象。
 * 会在目标方法上设置取栈条目数（[EXTENT]）。
 * 注记：
 * 创建已绑定的全局方法，可以节省内存。
 *
 * @param {String} k 方法名
 * @param {Function} f 方法
 * @param {Object} obj 宿主对象
 */
function getMethod( f, k, obj ) {
    try {
        if ( k.startsWith('__') ) return;
    }
    catch (e) {
        return; // Symbol
    }
    let _n = obj[ `__${k}` ];

    return [ obj[ `__${k}_x` ] ? funcSets( f, _n, true ) : funcSets( f.bind(obj), _n ) ];
}


/**
 * 指令/方法属性设置：{
 *  - [ACCESS] 是否为特权方法。
 *  - [EXTENT] 自动取栈条目数。
 * }
 * @param {Function} f 目标指令
 * @param {Number} n 自动取栈数量
 * @param {Boolean} ix 是否为特权指令
 */
function funcSets( f, n, ix ) {
    if ( ix ) f[ACCESS] = true;
    return ( f[EXTENT] = n, f );
}



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


const
    PB2 = Object.assign( Base2, Base ),
    On  = $.proto( _On, PB2 ),
    By  = $.proto( _By, PB2 ),
    To  = $.proto( _To, Base );


export {
    On,
    By,
    To,
    EXTENT,
    ACCESS,
};
