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
import { Templater } from "./templater.js";

import { _On } from "./pbs.on.js";
import { _By } from "./pbs.by.js";
import { _To } from "./pbs.to.js";


const
    $ = window.$,

    // X函数库名称引用标识。
    chrXmethod  = '?',

    // 指令配置属性
    EXTENT = Symbol('stack-amount'),  // 自动取栈计数
    ACCESS = Symbol('stack-access'),  // 特权方法

    // evo成员名数值键。
    evoIndex = {
        0:  'origin',       // 事件起点元素（event.target）
        1:  'current',      // 触发事件的当前元素（event.currentTarget|matched）
        2:  'delegate',     // 事件相关联元素（event.relatedTarget）
        3:  'related',      // 委托绑定的元素（event.currentTarget）
        8:  'selector',     // 委托匹配选择器（for match）]
        9:  'event',        // 原生事件对象（未侵入）
        10: 'data',         // 自动获取的流程数据
        11: 'target',       // To目标元素（集）向后延续
    };


const
    // 全局变量空间。
    Globals     = {},

    // 关联数据空间。
    DataStore   = new WeakMap();


//
// 全局模板存储。
// init: new Templater(...)
//
let TplStore = null;



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

    __evo: 0,


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

    __ev: 0,
    __ev_x: true,


    // 空指令。
    // 目标：无。
    nil() {},

    __nil: 0,


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

    __del: 0,
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
        if ( evo.data === undefined || evo.data ) {
            return new Promise.reject();
        }
    },

    __end: 0,



    // 暂存区赋值
    // 目标：赋值非取值，无。
    // 特权：是。this为Stack实例，直接操作数据栈。
    // 注：简单调用Stack实例相应接口方法即可。
    // @return {void}
    //===============================================

    /**
     * 弹出栈顶n项。
     * 无实参调用弹出单项赋值，否则构造为一个数组赋值。
     * 即：pop() 和 pop(1) 是不一样的。
     * pop(0) 有效，构造一个空集赋值。
     * @param {Number} n 弹出的条目数
     */
    pop( evo, n ) {
        this.pop( n );
    },

    __pop: null,
    __pop_x: true,


    /**
     * 复制（浅）数据栈区段。
     * 两个位置下标支持负值从末尾倒算。
     * @param {Number} beg 起始位置，可选
     * @param {Number} end 结束位置（不含），可选
     */
    slice( evo, beg, end ) {
        this.slice( beg, end );
    },

    __slice: null,
    __slice_x: true,


    /**
     * 引用数据栈目标值。
     * 下标位置支持负值指定。
     * @param {Number} n 位置下标
     */
    index( evo, n ) {
        this.index ( n );
    },

    __index: null,
    __index_x: true,


    /**
     * 引用数据栈多个位置值。
     * 仅支持简单的位置下标序列（非数组）。
     * 注：下标位置支持负值。
     * @param {...Number} ns 位置下标序列
     */
    indexes( evo, ...ns ) {
        this.indexes( ...ns );
    },

    __indexes: null,
    __indexes_x: true,


    /**
     * 移除栈底n项。
     * 无实参调用移除单项赋值，否则构造为一个数组赋值。
     * 即：shift() 和 shift(1) 是不一样的。
     * @param {Number} n 移除条目数
     */
    shift( evo, n ) {
        this.shift( n );
    },

    __shift: null,
    __shift_x: true,


    /**
     * 移除数据栈区段条目。
     * 起始下标支持负数从末尾倒算。
     * @param {Number} start 起始位置
     * @param {Number} count 移除数量
     */
    splice( evo, start, count ) {
        this.splice( start, count );
    },

    __splice: null,
    __splice_x: true,


    /**
     * 移除数据栈目标位置条目。
     * 位置下标支持负数倒数。
     * @param {Number} i 位置下标
     */
    pick( evo, i ) {
        this.pick( i );
    },

    __pick: null,
    __pick_x: true,

};



//
// 运算层基础方法。
// 仅用于 On/By 两个域。
//
const _Base2 = {

    // 类型转换
    // 目标：当前条目/栈顶1项。
    //===============================================

    /**
     * 将目标转换为数组。
     * 如果ext为真，表示调用Array.from()展开为一个数组。
     * 否则调用Array.of()简单转为数组（单个成员）。
     * @param  {Boolean} ext 扩展模式
     * @return {Array}
     */
    Arr( evo, ext ) {
        return ext ? Array.from( evo.data ) : Array.of( evo.data );
    },

    __Arr: 1,


    /**
     * 将目标转为字符串。
     * @param  {String} prefix 前缀，可选
     * @param  {String} suffix 后缀，可选
     * @return {String}
     */
    Str( evo, prefix = '', suffix = '' ) {
        return prefix + String( evo.data ) + suffix;
    },

    __Str: 1,


    /**
     * 将目标转为布尔值（true|false）。
     * @return {Boolean}
     */
    Bool( evo ) {
        return Boolean( evo.data );
    },

    __Bool: 1,


    /**
     * 将目标转为整数（parseInt）。
     * @param  {Number} radix 进制基数
     * @return {Number}
     */
    Int( evo, radix ) {
        return parseInt( evo.data, radix );
    },

    __Int: 1,


    /**
     * 将目标转为浮点数（parseFloat）。
     * @return {Number}
     */
    Float( evo ) {
        return parseFloat( evo.data );
    },

    __Float: 1,



    // 简单值操作
    //===============================================

    /**
     * 设置/获取全局变量。
     * 目标：当前条目，不自动取栈。
     * 目标非空或its有值时为设置，目标为空且its未定义时为取值入栈。
     * 设置时：
     * - 目标为空：取its本身为值（必然存在）。
     * - 目标非空：取目标的its属性值，或者目标本身（its无值）。
     * @param  {String} name 变量名
     * @param  {Value|String} its 变量值/成员名，可选
     * @return {Value|void}
     */
    env( evo, name, its ) {
        let _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return Globals[name];
        }
        Globals[name] = objectItem( _o, its );
    },

    __env: 0,


    /**
     * 关联数据存储/取出。
     * 存储元素（evo.delegate）关联的数据项或取出数据项入栈。
     * 目标：当前条目，不自动取栈。
     * 目标非空或its有值时为存储，目标为空且its未定义时为取值。
     * 存储时状况参考env设置说明。
     * @param  {String} name 变量名
     * @param  {Value|String} its 变量值/成员名，可选
     * @return {Value|void}
     */
    data( evo, name, its ) {
        let _e = evo.delegate,
            _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return getStore( _e, name );
        }
        saveStore( _e, name, objectItem(_o, its) );
    },

    __data: 0,


    /**
     * 从目标上取值入栈。
     * 如果name是方法，会无参数调用取值。
     * 目标：当前条目/栈顶1项。
     * 特权：是。自行压入数据栈。
     * 注：
     * 多个名称取值会自动展开入栈。
     * 如果需要入栈值集合，需要明确传递名称数组。
     *
     * @param  {...String} names 属性或方法名序列
     * @return {void} 自行入栈
     */
    gets( evo, ...names ) {
        let _vs = names.map( name =>
            $.isArray(name) ? name.map( n => evo.data[n] ) : evo.data[name]
        );
        this.push( ..._vs );
    },

    __gets: 1,
    __gets_x: true,


    /**
     * 直接数据入栈。
     * 目标：可选当前条目，不自动取栈。
     * 特权：是。自行入栈操作。
     * 多个实参会自动展开入栈，数组实参视为单个值。
     * 无实参调用时入栈当前条目（作为单一值）。
     * 如果暂存区有值同时也传入了实参，则实参有效，当前条目作废。
     * 注：
     * 可以入栈当前条目，使得可以将栈条目重新整理打包。
     * @param  {...Value} vals 值序列
     * @return {void} 自行入栈
     */
    push( evo, ...vals ) {
        this.push(
            ...(vals.length ? vals : [evo.data])
        );
    },

    __push: 0,
    __push_x: true,



    // 集合筛选
    //===============================================

    /**
     * 值集过滤。
     * 匹配者构建为一个新数组入栈。适用元素和普通值集。
     * 目标：当前条目/栈顶1项（集合）。
     * fltr 若为表达式，固定参数名：(v, i, o)。
     * 注：
     * 表达式无需包含 return。
     * @param  {String} fltr 选择器或表达式
     * @param  {Boolean} js fltr为JS表达式
     * @return {[Value]}
     */
    filter( evo, fltr, js ) {
        if ( js ) {
            fltr = new Function(
                'v',
                'i',
                'o',
                `return ${fltr}`
            );
        }
        return $.filter( evo.data, fltr );
    },

    __filter: 1,


    /**
     * 值集排除。
     * 匹配者被排除，剩余成员创建为一个新数组。适用元素和普通值集。
     * 目标：当前条目/栈顶1项（集合）。
     * 参数说明同 filter。
     * @param  {String} fltr 选择器或排除表达式
     * @param  {Boolean} js fltr为JS表达式
     * @return {[Value]}
     */
    not( evo, fltr, js ) {
        if ( js ) {
            fltr = new Function(
                'v',
                'i',
                'o',
                `return ${fltr}`
            );
        }
        return $.not( evo.data, fltr );
    },

    __not: 1,


    /**
     * 子元素包含过滤。
     * 专用于元素集合（普通值集无效）。
     * 目标：当前条目/栈顶1项（集合）。
     * @param  {String} slr CSS选择器
     * @return {[Element]}
     */
    has( evo, slr ) {
        return $.has( evo.data, slr );
    },

    __has: 1,


    /**
     * 数组扁平化。
     * 将目标内可能嵌套的数组扁平化处理。
     * 目标：当前条目/栈顶1项（集合）。
     * 特权：是。自行展开入栈。
     * 注：
     * deep零值有效，此时ext应当为true，表示目标展开入栈。
     *
     * @param  {Number} deep 深度
     * @param  {Boolean} ext 展开入栈
     * @return {[Value]|void}
     */
    flat( evo, deep, ext ) {
        let _vs = evo.data.flat( deep );

        if ( !ext ) {
            return _vs;
        }
        this.push( ..._vs );
    },

    __flat: 1,
    __flat_x: true,



    // 简单运算
    //===============================================

    /**
     * 加运算。
     * 同时适用数值和字符串。
     * 目标：当前条目/栈顶2项
     * 注记：Collector的同名方法没有被使用。
     * @return {Number|String}
     */
    add( evo ) {
        return evo.data[0] + evo.data[1];
    },

    __add: 2,


    /**
     * 减运算。
     * 目标：当前条目/栈顶2项
     * @return {Number}
     */
    sub( evo ) {
        return evo.data[0] - evo.data[1];
    },

    __sub: 2,


    /**
     * 乘运算。
     * 目标：当前条目/栈顶2项
     * @return {Number}
     */
    mul( evo ) {
        return evo.data[0] * evo.data[1];
    },

    __mul: 2,


    /**
     * 除运算。
     * 目标：当前条目/栈顶2项
     * @return {Number}
     */
    div( evo ) {
        return evo.data[0] / evo.data[1];
    },

    __div: 2,


    /**
     * 模运算。
     * 目标：当前条目/栈顶2项
     * @return {Number}
     */
    mod( evo ) {
        return evo.data[0] % evo.data[1];
    },

    __mod: 2,


    /**
     * 除并求余。
     * 目标：当前条目/栈顶2项
     * 返回值：[商数, 余数]
     * @return {[Number, Number]}
     */
    divmod( evo ) {
        let [n, d] = evo.data;
        return [ n / d, n % d ];
    },

    __divmod: 2,


    /**
     * 数值取负。
     * 支持值数组处理（每一个成员取负）。
     * 目标：当前条目/栈顶1项。
     * @return {Number|[Number]}
     */
    nneg( evo ) {
        let _v = evo.data;
        return $.isArray(_v) ? _v.map( v => -v ) : -_v;
    },

    __nneg: 1,


    /**
     * 逻辑取反。
     * 支持值数组处理（每一个成员取反）。
     * 目标：当前条目/栈顶1项。
     * @return {Boolean|[Boolean]}
     */
    vnot( evo ) {
        let _v = evo.data;
        return $.isArray(_v) ? _v.map( v => !v ) : !_v;
    },

    __vnot: 1,


    /**
     * 栈顶复制。
     * 为引用浅复制，支持多项（自动展开）。
     * 目标：无。
     * 特权：是。多条目获取并展开压入。
     * 注记：不支持暂存区条目（可用push实现）。
     * @param  {Number} n 条目数
     * @return {void}
     */
    dup( evo, n = 1 ) {
        this.push( ...this.tops(n) );
    },

    __dup: 0,
    __dup_x: true,


    /**
     * 元素克隆。
     * 可同时克隆元素上绑定的事件处理器。
     * 目标：当前条目/栈顶1项。
     * 注：目标需要是元素类型（Element|[Element]|Collector）。
     * @param {Boolean} event 包含事件处理器
     * @param {Boolean} deep 深层克隆（含子元素）
     * @param {Boolean} eventdeep 包含子元素的事件处理器
     */
    clone( evo, event, deep, eventdeep ) {
        let _el = evo.data;

        if ( _el.nodeType == 1 ) {
            return $.clone( _el, event, deep, eventdeep );
        }
        if ( $.isArray(_el) ) {
            return $(_el).clone( event, deep, eventdeep );
        }
    },

    __clone: 1,


    /**
     * 计算JS表达式。
     * 目标：当前条目，不自动取栈。
     * 表达式内可通过vn定义的变量名引用当前条目数据。
     * 注：如果表达式出错，会返回null值。
     * 例：calc('($[0] + $[1]) * $[2]')
     * @param  {String} expr JS表达式
     * @param  {String} varn 流程数据变量名。可选，默认 $
     * @return {Value|null}
     */
    calc( evo, expr, varn = '$' ) {
        try {
            return new Function( varn, `return ${expr}` )( evo.data );
        }
        // 不终止执行流。
        catch (e) {
            window.console.error(e);
        }
        return null;
    },

    __calc: 0,


    /**
     * 对象赋值。
     * 数据源对象内的属性/值赋值到接收对象。
     * 目标：当前条目，不自动取栈。
     * 当前条目可为对象的集合，会被展开赋值。
     * @param {Object} to 接收对象
     */
    assign( evo, to ) {
        let _v = evo.data;
        return $.assign( to, ...( $.isArray(_v) ? _v : [_v] ) );
    },

    __assign: 1,



    // 比较运算
    // 目标：当前条目/栈顶2项。
    // @return {Boolean}
   //===============================================

    /**
     * 相等比较（===）。
     */
    equal( evo ) {
        return evo.data[0] === evo.data[1];
    },

    __equal: 2,


    /**
     * 不相等比较（!==）。
     */
    nequal( evo ) {
        return evo.data[0] !== evo.data[1];
    },

    __nequal: 2,


    /**
     * 小于比较。
     */
    lt( evo ) {
        return evo.data[0] < evo.data[1];
    },

    __lt: 2,


    /**
     * 小于等于比较。
     */
    lte( evo ) {
        return evo.data[0] <= evo.data[1];
    },

    __lte: 2,


    /**
     * 大于比较。
     */
    gt( evo ) {
        return evo.data[0] > evo.data[1];
    },

    __gt: 2,


    /**
     * 大于等于比较。
     */
    gte( evo ) {
        return evo.data[0] >= evo.data[1];
    },

    __gte: 2,



    // 逻辑运算
    // @return {Boolean}
    //===============================================

    /**
     * 是否在[min, max]之内（包含边界）。
     * 目标：当前条目/栈顶1项。
     * @param {Number} min 最小值
     * @param {Number} max 最大值
     */
    within( evo, min, max ) {
        return min <= evo.data && evo.data <= max;
    },

    __within: 1,


    /**
     * 是否在实参序列中。
     * 注：与其中任一值相等。
     * @param {*} evo
     * @param  {...Value} vals 实参序列
     */
    inside( evo, ...vals ) {
        return vals.includes( evo.data );
    },

    __inside: 1,


    /**
     * 是否都为真。
     * 目标：当前条目/栈顶2项。
     */
    both( evo ) {
        return evo.data[0] && evo.data[1];
    },

    __both: 2,


    /**
     * 是否任一为真。
     * 目标：当前条目/栈顶2项。
     */
    either( evo ) {
        return evo.data[0] || evo.data[1];
    },

    __either: 2,


    /**
     * 是否每一项都为真。
     * 目标：当前条目/栈顶1项。
     * 测试表达式返回真，该项即为真。接口：function(v, i, o): Boolean。
     * 注：
     * 目标需要是一个集合，支持各种集合（参考$.every）。
     * 表达式无需return语法词。
     *
     * @param {String} expr 测试表达式，可选
     */
    every( evo, expr ) {
        return $.every( evo.data, boolTester(expr), null );
    },

    __every: 1,


    /**
     * 是否有任一项为真。
     * 目标：当前条目/栈顶1项。
     * 测试表达式返回真该项即为真，接口：function(v, i, o): Boolean。
     * 注：参考同上。
     * @param {String} expr 测试表达式，可选
     */
    some( evo, expr ) {
        return $.some( evo.data, boolTester(expr), null );
    },

    __some: 1,



    // 判断执行。
    //===============================================

    /**
     * 真值执行，否则跳过。
     * 目标：当前条目/栈顶1项。
     * 目标值为真值时执行表达式或方法，执行结果入栈。
     *
     * expr 可以为X函数库方法名引用（前置?字符标识）。
     * rest 为X函数库方法调用时的实参序列。
     *
     * @param  {String} expr 执行体表达式
     * @param  {...Value} rest 实参序列
     * @return {Value}
     */
    vtrue( evo, expr, ...rest ) {
        if ( evo.data ) {
            return exprCall( expr, rest );
        }
    },

    __vtrue: 1,


    /**
     * 假值执行，否则跳过。
     * 目标：当前条目/栈顶1项。
     * 目标值为假值时执行表达式或方法，执行结果入栈。
     * expr/rest 说明同上。
     * @param  {String} expr 执行体表达式
     * @param  {...Value} rest 实参序列
     * @return {Value}
     */
    vfalse( evo, expr, ...rest ) {
        if ( !evo.data ) {
            return exprCall( expr, rest );
        }
    },

    __vfalse: 1,



    // 其它
    //===============================================

    /**
     * 从模板管理器获取模板。
     * 目标：当前条目，不自动取栈。
     * 实参名优先于当前条目传递的名称，如果想采用当前条目，实参可为任意假值。
     * @param  {String} name 模板名称
     * @return {Promise}
     */
    tpl( evo, name ) {
        let _n = name || evo.data;

        if ( !_n ) {
            return Promise.reject(`invalid tpl-name: ${_n}`);
        }
        return TplStore.get( _n );
    },

    __tpl: 0,

};



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
    if ( !k.length || k.startsWith('__') ) {
        return;
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



/**
 * 获取对象/成员/值。
 * - 如果成员名未定义，返回容器对象自身。
 * - 如果容器对象未定义，成员名视为值返回。
 * - 如果两者都定义，返回容器内的成员值。
 * @param {Object} obj 容器对象
 * @param {Value|String} its 目标值或成员名
 */
function objectItem( obj, its ) {
    if ( its === undefined ) {
        return obj;
    }
    return obj === undefined ? its : obj[ its ];
}



/**
 * 获取关联数据条目。
 * 如果不存在关联条目，会返回undefined。
 * @param {Element} el 关联元素
 * @param {String} name 取值名称
 */
function getStore( el, name ) {
    let _map = DataStore.get( el );
    return _map && _map.get( name );
}


/**
 * 存储关联数据值。
 * 注：如果不存在元素的关联集合，会自动创建。
 * @param {Element} el 关联元素
 * @param {String} name 存储名称
 * @param {Value} val 存储的值
 */
function saveStore( el, name, val ) {
    let _map = DataStore.get( el );

    if ( !_map ) {
        _map = DataStore.set( el, new Map() );
    }
    _map.set( name, val );
}


/**
 * 创建布尔测试函数。
 * 如果表达式未定义，则为真值测试。
 * @param  {String} expr 测试表达式
 * @return {Function}
 */
function boolTester( expr ) {
    if ( expr === undefined ) {
        return v => v;
    }
    return new Function( 'v', 'i', 'o', `return ${expr}` );
}


/**
 * 执行表达式。
 * 支持前置?引用X函数库方法调用。
 * rest 为X函数库方法的实参序列。
 * @param  {String} str 表达式串
 * @param  {Value} rest 实参序列
 * @return {Value}
 */
function exprCall( str, rest ) {
    if ( str[0] == chrXmethod ) {
        return _By.X[str.substring(1)]( ...rest );
    }
    try {
        return new Function( `return ${str}` )();
    }
    // 容许出错，返回null。
    catch (e) {
        window.console.error(e);
    }
    return null;
}



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


/**
 * PB环境初始化。
 * loader: function( name:String ): Promise:then(Element)
 * obter: function( Element ): Boolean
 *
 * @param {Function} loader 模板元素载入函数
 * @param {Function} obter OBT解析函数
 */
function init( loader, obter ) {
    if ( TplStore ) {
        return false;
    }
    return TplStore = new Templater( loader, obter );
}



const
    //
    // 构造指令方法。
    // 普通方法绑定宿主对象，避免this误用。
    // 特权方法标记但不绑定（解析应用时会被绑定到数据栈）。
    //
    Base = $.assign( {}, _Base, getMethod ),
    Base2 = $.assign( {}, _Base2, getMethod ),


    // 支持顶层和次顶层。
    PB2 = Object.assign( Base2, Base ),
    On  = $.proto( _On, PB2 ),
    By  = $.proto( _By, PB2 ),

    // 仅支持顶层方法。
    To  = $.proto( _To, Base );


export {
    On,
    By,
    To,
    EXTENT,
    ACCESS,
    init,
};
