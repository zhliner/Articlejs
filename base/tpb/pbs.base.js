//! $Id: pbs.js 2019.08.19 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  OBT 基础集定义。
//
//  约定：{
//      __[name]    表达[name]方法的取栈条目数。
//      __[name]_x  指定[name]是否为特权方法（可取用数据栈stack）。
//  }
//
//  接口参数：
//  - 首个实参为事件关联对象（evo），在模板中被隐藏。
//  - 如果接口需要直接操作数据栈（特权），数据栈对象会作为第二个实参传入（对模板隐藏）。
//
///////////////////////////////////////////////////////////////////////////////
//

import { bindMethod, EXTENT, ACCESS, PREVCELL, Globals } from "./config.js";


const
    $ = window.$,

    // 字符串空白清理方法集。
    trimFunc = {
        '1':    'trimLeft',
        '0':    'trim',
        '-1':   'trimRight',
    },

    // 空白分隔符。
    __reSpace = /\s+/,

    // 至少1个空白。
    // 注：clean专用。
    __reSpace1n = /\s+/g,

    // 至少2个空白。
    // 注：clean专用。
    __reSpace2n = /\s\s+/g,

    // 颜色值：rgb(0, 0, 0)
    __rgbDecimal = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/,

    // 颜色值：rgba(0, 0, 0, 0.n)
    __rgbaDecimal = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.0-9]+)\)/,

    // 选取对象暂存。
    // 由rangeKeep操作，供exeCmd方法使用。
    __tmpRanges = [];



//
// 控制类。
// 适用 On/By/To:NextStage 三个域。
//
const _Control = {

    // 基本控制。
    //-----------------------------------------------------

    /**
     * 通过性检查。
     * 目标：暂存区/栈顶1项。
     * 检查目标值是否为真（非假）或是否为实参序列之一（===），
     * 结果为假会中断执行流。
     * @param  {...Value} vals 对比值集，可选
     * @return {void|reject}
     */
    pass( evo, ...vals ) {
        let _v = evo.data;

        if ( vals.length ) {
            _v = vals.includes( _v );
        }
        if ( !_v ) return Promise.reject();
    },

    __pass: 1,


    /**
     * 流程结束。
     * 目标：暂存区/栈顶1项。
     * 检查目标值是否为真（非假）或是否为实参序列之一（===），
     * 结果为真会结束执行流。
     * @param  {...Value} vals 对比值集，可选
     * @return {void|reject}
     */
    end( evo, ...vals ) {
        let _v = evo.data;

        if ( vals.length ) {
            _v = vals.includes( _v );
        }
        if ( _v ) return Promise.reject();
    },

    __end: 1,


    /**
     * 阻止事件默认行为。
     * 目标：暂存区1项。
     * 如果目标非空，则真值停止，否则无条件阻止。
     * back为执行之后的返回值（入栈），如果未执行则忽略。
     * 注：
     * - 该指令需要在异步指令之前使用。
     * - 如果调用链包含元素方法调用（如submit()），还应当在立即Promise之前调用。
     * 例：
     * - push(1) pop avoid('ok') 目标值1为真，停止并入栈 'ok'
     * - push(0) avoid('ok') 目标为空，无条件停止，入栈 'ok'
     *
     * @param  {Value} back 执行后结果，可选
     * @return {void|back}
     */
    avoid( evo, back ) {
        let _v = evo.data;

        if ( _v === undefined || _v ) {
            evo.event.preventDefault();
            return back;
        }
    },

    __avoid: -1,


    /**
     * 停止事件冒泡。
     * 目标：暂存区1项。
     * 如果目标非空，则真值执行，否则无条件执行。
     * back为执行之后的返回值，如果未执行则忽略。
     * 注：该指令需要在异步指令之前使用。
     * @param  {Value} back 执行后结果，可选
     * @return {void|back}
     */
    stop( evo, back ) {
        let _v = evo.data;

        if ( _v === undefined || _v ) {
            evo.event.stopPropagation();
            return back;
        }
    },

    __stop: -1,


    /**
     * 停止事件冒泡并阻止本事件其它处理器的执行。
     * 目标：暂存区1项。
     * 如果目标非空，则真值执行，否则无条件执行。
     * back为执行之后的返回值，如果未执行则忽略。
     * 注：该指令需要在异步指令之前使用。
     * @param  {Value} back 执行后结果，可选
     * @return {void|back}
     */
    stopAll( evo, back ) {
        let _v = evo.data;

        if ( _v === undefined || _v ) {
            evo.event.stopImmediatePropagation();
            return back;
        }
    },

    __stopAll: -1,


    /**
     * 睡眠延时。
     * 目标：暂存区1项可选。
     * 目标为延时毫秒数，实参ms可覆盖暂存区数据。
     * 这会让执行流暂停（可用于动效）。
     * @param  {Number} ms 延时毫秒数
     * @return {void}
     */
    sleep( evo, ms ) {
        return new Promise(
            resolve => window.setTimeout( resolve, ms || evo.data )
        );
    },

    __sleep: -1,



    // 暂存区赋值。
    // 目标：无。
    // 特权：是，自行操作数据栈。
    // @return {void}
    //-----------------------------------------------------

    /**
     * 弹出栈顶n项。
     * 弹出n项压入暂存区，无实参调用视为1项。
     * n负值无用（简单忽略）。
     * @param {Stack} stack 数据栈
     * @param {Number} n 弹出的条目数
     */
    pop( evo, stack, n = 1 ) {
        n == 1 ? stack.tpop() : stack.tpops( n );
    },

    __pop_x: true,


    /**
     * 取出栈底n项。
     * 移除栈底n项压入暂存区，无实参调用视为1项。
     * n负值无用（简单忽略）。
     * @param {Stack} stack 数据栈
     * @param {Number} n 移除条目数
     */
    shift( evo, stack, n = 1 ) {
        n == 1 ? stack.tshift() : stack.tshifts( n );
    },

    __shift_x: true,


    /**
     * 引用目标位置项。
     * 下标位置支持负数从末尾算起。
     * 注意：非法的下标位置会导入一个undefined值。
     * @param {Stack} stack 数据栈
     * @param {...Number} ns 位置下标序列
     */
    index( evo, stack, ...ns ) {
        stack.tindex( ns );
    },

    __index_x: true,



    // 数据栈操作。
    //-----------------------------------------------------

    /**
     * 空值入栈。
     * 压入特殊值undefined。
     * 特权：是，特殊操作。
     * 可用于向栈内填充无需实参的占位值。
     * @param {Stack} stack 数据栈
     */
    nil( evo, stack ) {
        stack.undefined();
    },

    __nil_x: true,


    /**
     * 数据直接入栈。
     * 目标：暂存区条目可选。
     * 特权：是，自行入栈。
     * 多个实参会自动展开入栈，数组实参视为单个值。
     * 如果目标有值，会附加（作为单一值）在实参序列之后。
     * 例：
     * - push('abc', 123)  // 分别入栈字符串'abc'和数值123两个值
     * - pop(3) push(true) // 入栈布尔值true和暂存区条目（3项一体）两个值
     * 友好：
     * 系统支持空名称指代，即：('hello') => push('hello') 相同。
     * 这让数据入栈更简洁（如果无需明确的push表意）。
     * @param  {Stack} stack 数据栈
     * @param  {...Value} vals 值序列
     * @return {void} 自行入栈
     */
    push( evo, stack, ...vals ) {
        if ( evo.data !== undefined ) {
            vals.push( evo.data );
        }
        stack.push( ...vals );
    },

    __push: 0,
    __push_x: true,


    /**
     * 栈顶复制（浅）。
     * 复制栈顶n项并入栈（原样展开）。
     * 目标：无。
     * 特权：是，灵活取栈&自行入栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数，可选
     * @return {void}
     */
    dup( evo, stack, n = 1 ) {
        if ( n > 0 ) {
            stack.push( ...stack.tops(n) );
        }
    },

    __dup_x: true,


    /**
     * 栈顶复制（深度）。
     * 深度克隆栈顶n项并入栈（原样展开）。
     * 目标：无。
     * 特权：是，灵活取栈&自行入栈。
     * 注：非数组项保持原值/引用。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数，可选
     * @return {void}
     */
    ddup( evo, stack, n = 1 ) {
        if ( n > 0 ) {
            stack.push(
                ...stack.tops(n).map(v => $.isArray(v) ? deepArray(v) : v)
            );
        }
    },

    __ddup_x: true,


    /**
     * 栈顶条目打包封装。
     * 取出栈顶的n项打包为一个数组入栈。
     * 目标：无。
     * 特权：是，自行操作数据栈。
     * 始终返回一个数组，非法值返回一个空数组。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {[Value]}
     */
    pack( evo, stack, n = 1 ) {
        return n > 0 ? stack.pops( n ) : [];
    },

    __pack_x: true,


    /**
     * 任意区段打包（克隆）。
     * 目标：无。
     * 特权：是，自行操作数据栈。
     * 两个位置下标支持负值从末尾倒算。
     * @param {Stack} stack 数据栈
     * @param {Number} beg 起始位置，可选
     * @param {Number} end 结束位置（不含），可选
     */
    slice( evo, stack, beg, end ) {
        return stack.slice( beg, end );
    },

    __slice_x: true,


    /**
     * 将条目展开入栈。
     * 目标：暂存区/栈顶1项。
     * 特权：是，自行入栈。
     * 目标若为字符串，会展开为单个字符序列入栈。
     * 注：目标中的undefined值会被丢弃。
     * @data: [Value]|Iterator|String
     * @param {Stack} stack 数据栈
     */
    spread( evo, stack ) {
        stack.push( ...evo.data );
    },

    __spread: 1,
    __spread_x: true,


    /**
     * 丢弃栈顶多余的项。
     * 主要用于无用返回值自动入栈的情况。
     * 负的n值会从栈底算起（绝对值下标开始）。
     * @param {Stack} stack 数据栈
     * @param  {Number} n 项数
     * @return {void}
     */
    vain( evo, stack, n = 1 ) {
        n == 1 ? stack.pop() : stack.pops( n );
    },

    __vain_x: true,



    // 简单值操作。
    //-----------------------------------------------------

    /**
     * 设置/获取全局变量。
     * 目标：无。
     * 存储值非空时为设置，否则为取值入栈。
     * 传递val为null时为删除目标值。
     * @param  {String} name 键名
     * @param  {Value} val 存储值，可选
     * @return {Value|void}
     */
    env( evo, name, val ) {
        if ( val === undefined ) {
            return Globals.get(name);
        }
        val === null ? Globals.delete(name) : Globals.set(name, val);
    },

    __env: null,


    /**
     * 设置/取值浏览器会话数据。
     * 目标：无。
     * val非空时为设置，否则为取值入栈。
     * val传递null可清除name项的值。
     * 传递name为null，可清除整个Storage存储（谨慎）。
     * 注：存储的值会被转换为字符串。
     * @param  {String} name 存储键名
     * @param  {Value} val 存储值，可选
     * @return {Value|void}
     */
    sess( evo, name, val ) {
        if ( val === undefined ) {
            return window.sessionStorage.getItem(name);
        }
        storage( window.sessionStorage, name, val );
    },

    __sess: null,


    /**
     * 设置/取值浏览器本地数据。
     * 目标：无。
     * 说明：参考sess指令。
     * @param  {String} name 存储键名
     * @param  {Value} val 存储值，可选
     * @return {Value|void}
     */
    local( evo, name, val ) {
        if ( val === undefined ) {
            return window.localStorage.getItem(name);
        }
        storage( window.localStorage, name, val );
    },

    __local: null,


    /**
     * 条件赋值。
     * 目标：暂存区/栈顶1项。
     * 如果目标值为真（广义），val入栈，否则elseval入栈。
     * @param  {Value} val IF赋值
     * @param  {Boolean} elseval ELSE赋值，可选
     * @return {Value}
     */
    $if( evo, val, elseval ) {
        return evo.data ? val : elseval;
    },

    __$if: 1,


    /**
     * CASE分支比较。
     * 目标：暂存区/栈顶1项。
     * 目标与实参一一相等（===）比较，结果入栈。
     * 需要在$switch指令之前先执行。
     * @param  {...Value} vals 实参序列
     * @return {[Boolean]} 结果集
     */
    $case( evo, ...vals ) {
        return vals.map( v => v === evo.data );
    },

    __$case: 1,


    /**
     * SWITCH分支判断。
     * 目标：暂存区/栈顶1项。
     * 测试目标集内某一成员是否为真，是则取相同下标的vals成员返回。
     * 目标通常是$case执行的结果，但也可以是任意值集。
     * 注：
     * 仅取首个真值对应的实参值入栈。
     * 目标集大小通常与实参序列长度相同，但容许超出（会被忽略）。
     * @data: [Boolean]
     * @param  {...Value} vals 入栈值候选
     * @return {Value}
     */
    $switch( evo, ...vals ) {
        for (const [i, b] of evo.data.entries()) {
            if ( b ) return vals[i];
        }
    },

    __$switch: 1,

};



//
// 计算&加工类。
// 仅用于 On 域。
//
const _Process = {

    // 集合处理。
    //-----------------------------------------------------
    // 另见末尾部分接口。

    /**
     * 集合成员去重&排序。
     * 目标：暂存区/栈顶1项。
     * 集合如果不是Collector，可为对象（取其值集），返回一个数组。
     * 默认为去重功能，如果传递comp实参则增加排序能力。
     * comp:
     * - true DOM节点排序
     * - null 默认排序规则，适用非节点数据
     * comp接口：function(a, b): Boolean
     * @param  {Function|true|null} comp 排序函数，可选
     * @return {[Value]|Collector}
     */
    unique( evo, comp ) {
        return $.isCollector(evo.data) ?
            evo.data.unique(evo.data, comp) : $.unique(evo.data, comp);
    },

    __unique: 1,


    /**
     * 集合排序。
     * 目标：暂存区/栈顶1项。
     * 对于元素Collector集合，comp应当为空获得默认的排序算法。
     * 对于普通值Collector集合，comp可传递null获得JS环境默认排序规则。
     * comp接口：function(a, b): Boolean
     * @param  {Function|null} comp 排序函数，可选
     * @return {[Value]|Collector}
     */
    sort( evo, comp ) {
        return $.isCollector(evo.data) ?
            evo.data.sort(comp) : Array.from(evo.data).sort(comp);
    },

    __sort: 1,


    /**
     * 集合成员序位反转。
     * 目标：暂存区/栈顶1项。
     * 注意数组会在原值上修改并返回。
     * 注记：
     * 兼容动画对象上的同名方法（无返回值）。
     * @return {[Value]|Collector|void}
     */
    reverse( evo ) {
        let x = evo.data;

        if ( $.isFunction(x.reverse) ) {
            return x.reverse();
        }
        return Array.from(x).reverse();
    },

    __reverse: 1,


    /**
     * 数组扁平化。
     * 将目标内可能嵌套的子数组扁平化。
     * 目标：暂存区/栈顶1项。
     * 如果是元素Collector集合，deep可以为true附加去重排序（1级扁平化）。
     * @data: Array
     * @param  {Number|true} deep 深度或去重排序，可选
     * @return {[Value]|Collector}
     */
    flat( evo, deep ) {
        return evo.data.flat( deep );
    },

    __flat: 1,


    /**
     * 数组串接。
     * 目标：暂存区/栈顶1项。
     * 返回一个新的数组。
     * @param  {...Value} vals 值或数组
     * @return {[Value]}
     */
    concat( evo, ...vals ) {
        return evo.data.concat( ...vals );
    },

    __concat: 1,


    /**
     * 连接数组各成员。
     * 目标：暂存区/栈顶1项。
     * @data: Array
     * @param  {String} chr 连接字符串
     * @return {String}
     */
    join( evo, chr = '' ) {
        return evo.data.join( chr );
    },

    __join: 1,


    /**
     * 集合混合。
     * 目标：无。
     * 特权：是，自行取项。
     * 多个数组按相同下标取值的子数组构成二维数组。
     * 即：各数组成员平行对应，以首个数组的大小为大小。
     * @data: [Array]
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 取项数量
     * @return {[ArrayN]} n项二维数组
     */
    mix( evo, stack, n ) {
        let _as = stack.data(n);
        return _as[0].map( (_, i) => _as.map( a => a[i] ) );
    },

    __mix_x: true,


    /**
     * 合计集合成员的值。
     * @data: [Number]
     * @return {Number}
     */
    sum( evo ) {
        return evo.data.reduce( (sum, n) => sum + n, 0 );
    },

    __sum: 1,



    // 数学运算。
    // 多数方法有一个集合版（对成员计算）。
    //-----------------------------------------------------

    /**
     * 加运算。
     * 同时适用数值和字符串。
     * 目标：暂存区/栈顶1项
     * 注记：Collector的同名方法没有被使用。
     * @param  {Number|String} y 第二个操作数
     * @return {Number|[Number]|String|[String]}
     */
    add( evo, y ) {
        return mapCall( evo.data, x => x + y );
    },

    __add: 1,


    /**
     * 减运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    sub( evo, y ) {
        return mapCall( evo.data, x => x - y );
    },

    __sub: 1,


    /**
     * 乘运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    mul( evo, y ) {
        return mapCall( evo.data, x => x * y );
    },

    __mul: 1,


    /**
     * 除运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    div( evo, y ) {
        return mapCall( evo.data, x => x / y );
    },

    __div: 1,


    /**
     * 整除运算。
     * 目标：暂存区/栈顶1项。
     * 注：简单的截断小数部分。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    idiv( evo, y ) {
        return mapCall( evo.data, x => parseInt(x/y) );
    },

    __idiv: 1,


    /**
     * 模运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    mod( evo, y ) {
        return mapCall( evo.data, x => x % y );
    },

    __mod: 1,


    /**
     * 幂运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    pow( evo, y ) {
        return mapCall( evo.data, x => x ** y );
    },

    __pow: 1,


    /**
     * 数值取负。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    neg( evo ) {
        return mapCall( evo.data, n => -n );
    },

    __neg: 1,


    /**
     * 逻辑取反。
     * 目标：暂存区/栈顶1项。
     * @return {Boolean|[Boolean]}
     */
    vnot( evo ) {
        return mapCall( evo.data, v => !v );
    },

    __vnot: 1,


    /**
     * 除并求余。
     * 目标：暂存区/栈顶1项
     * 注记：|商| * |y| + |余| == |x|
     * @param  {Number} y 第二个操作数
     * @return {[Number, Number]|[[Number, Number]]} [商数, 余数]
     */
    divmod( evo, y ) {
        return mapCall( evo.data, x => [parseInt(x/y), x%y] );
    },

    __divmod: 1,


    //
    // Math大部分方法。
    // @data: Number|[Number]
    /////////////////////////////////////////////


    /**
     * 计算绝对值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    abs( evo ) {
        return mapCall( evo.data, n => Math.abs(n) );
    },

    __abs: 1,


    /**
     * 返回向上取整后的值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    ceil( evo ) {
        return mapCall( evo.data, n => Math.ceil(n) );
    },

    __ceil: 1,


    /**
     * 返回小于目标的最大整数。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    floor( evo ) {
        return mapCall( evo.data, n => Math.floor(n) );
    },

    __floor: 1,


    /**
     * 返回目标四舍五入后的整数。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    round( evo ) {
        return mapCall( evo.data, n => Math.round(n) );
    },

    __round: 1,


    /**
     * 返回实参的整数部分。
     * 目标：暂存区/栈顶1项。
     * 与 Get:int 方法稍有不同，空串的结果为数值0。
     * @return {Number|[Number]}
     */
    trunc( evo ) {
        return mapCall( evo.data, n => Math.trunc(n) );
    },

    __trunc: 1,


    /**
     * 返回自然对数（logE，即ln）。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    log( evo ) {
        return mapCall( evo.data, n => Math.log(n) );
    },

    __log: 1,


    /**
     * 返回以2为底数的对数。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    log2( evo ) {
        return mapCall( evo.data, n => Math.log2(n) );
    },

    __log2: 1,


    /**
     * 返回以10为底数的对数。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    log10( evo ) {
        return mapCall( evo.data, n => Math.log10(n) );
    },

    __log10: 1,


    /**
     * 计算正弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    sin( evo ) {
        return mapCall( evo.data, n => Math.sin(n) );
    },

    __sin: 1,


    /**
     * 计算余弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    cos( evo ) {
        return mapCall( evo.data, n => Math.cos(n) );
    },

    __cos: 1,


    /**
     * 计算正切值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    tan( evo ) {
        return mapCall( evo.data, n => Math.tan(n) );
    },

    __tan: 1,


    /**
     * 计算平方根。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    sqrt( evo ) {
        return mapCall( evo.data, n => Math.sqrt(n) );
    },

    __sqrt: 1,


    /**
     * 计算立方根。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    cbrt( evo ) {
        return mapCall( evo.data, n => Math.cbrt(n) );
    },

    __cbrt: 1,


    /**
     * 计算双曲正弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    sinh( evo ) {
        return mapCall( evo.data, n => Math.sinh(n) );
    },

    __sinh: 1,


    /**
     * 计算双曲余弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    cosh( evo ) {
        return mapCall( evo.data, n => Math.cosh(n) );
    },

    __cosh: 1,


    /**
     * 计算双曲正切值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    tanh( evo ) {
        return mapCall( evo.data, n => Math.tanh(n) );
    },

    __tanh: 1,


    /**
     * 计算反余弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    acos( evo ) {
        return mapCall( evo.data, n => Math.acos(n) );
    },

    __acos: 1,


    /**
     * 计算反双曲余弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    acosh( evo ) {
        return mapCall( evo.data, n => Math.acosh(n) );
    },

    __acosh: 1,


    /**
     * 计算反正弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    asin( evo ) {
        return mapCall( evo.data, n => Math.asin(n) );
    },

    __asin: 1,


    /**
     * 计算反双曲正弦值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    asinh( evo ) {
        return mapCall( evo.data, n => Math.asinh(n) );
    },

    __asinh: 1,


    /**
     * 计算反正切值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    atan( evo ) {
        return mapCall( evo.data, n => Math.atan(n) );
    },

    __atan: 1,


    /**
     * 计算反双曲正切值。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    atanh( evo ) {
        return mapCall( evo.data, n => Math.atanh(n) );
    },

    __atanh: 1,


    /**
     * 创建伪随机数。
     * 目标：无。
     * 如果未传递max值，返回一个 [0,1) 区间的随机数。
     * 注：随机数不包含上限值。
     * @param  {Number} max 上限值，可选
     * @param  {Number} n 创建个数，可选
     * @return {Number|[Number]}
     */
    random( evo, max, n = 1 ) {
        if ( n > 1 ) {
            return randoms( n, max );
        }
        if ( max === undefined ) {
            return Math.random();
        }
        return Math.floor( Math.random() * Math.floor(max) );
    },

    __random: null,


    /**
     * 取最大值。
     * 目标：暂存区/栈顶1项。
     * 目标本身即为数值集合，但容错单值。
     * @param  {Number} v 对比值
     * @return {Number}
     */
    max( evo, v ) {
        return Math.max( ...[].concat(evo.data), v );
    },

    __max: 1,


    /**
     * 取最小值。
     * 目标：暂存区/栈顶1项。
     * 目标本身即为数值集合，但容错单值。
     * @param  {Number} v 对比值
     * @return {Number}
     */
    min( evo, v ) {
        return Math.min( ...[].concat(evo.data), v );
    },

    __min: 1,



    // 比较运算。
    // 目标：暂存区/栈顶1项。
    // 模板传递的实参为比较操作的第二个操作数。
    // @data: Value|[Value]
    // @return {Boolean|[Boolean]}
    //-----------------------------------------------------


    /**
     * 相等比较（===）。
     */
    eq( evo, val ) {
        return mapCall( evo.data, x => x === val );
    },

    __eq: 1,


    /**
     * 不相等比较（!==）。
     */
    neq( evo, val ) {
        return mapCall( evo.data, x => x !== val );
    },

    __neq: 1,


    /**
     * 小于比较。
     */
    lt( evo, val ) {
        return mapCall( evo.data, x => x < val );
    },

    __lt: 1,


    /**
     * 小于等于比较。
     */
    lte( evo, val ) {
        return mapCall( evo.data, x => x <= val );
    },

    __lte: 1,


    /**
     * 大于比较。
     */
    gt( evo, val ) {
        return mapCall( evo.data, x => x > val );
    },

    __gt: 1,


    /**
     * 大于等于比较。
     */
    gte( evo, val ) {
        return mapCall( evo.data, x => x >= val );
    },

    __gte: 1,


    /**
     * 数组相等比较。
     * 目标：暂存区/栈顶1项。
     * 注：仅对数组成员自身做相等（===）比较。
     * @param {[Value]} arr 对比数组
     */
    eqarr( evo, arr ) {
        return arrayEqual( evo.data, arr );
    },

    __eqarr: 1,


    /**
     * 测试是否包含。
     * 目标：暂存区/栈顶2项。
     * 前者是否为后者的上级容器元素。
     * @data: [Element, Node]
     * @param  {Boolean} strict 是否严格子级约束
     * @return {Boolean}
     */
    contains( evo, strict ) {
        return $.contains( evo.data[0], evo.data[1], strict );
    },

    __contains: 2,


    /**
     * 匹配测试。
     * @data: RegExp
     * @param {String} str 测试串
     */
    test( evo, str ) {
        return evo.data.test( str );
    },

    __test: 1,



    // 逻辑运算
    // @return {Boolean}
    //-----------------------------------------------------

    /**
     * 是否在[min, max]之内（含边界）。
     * 目标：暂存区/栈顶1项。
     * 注：全等（===）比较。
     * @param {Number} min 最小值
     * @param {Number} max 最大值
     */
    within( evo, min, max ) {
        return min <= evo.data && evo.data <= max;
    },

    __within: 1,


    /**
     * 目标是否在实参序列中。
     * 目标：暂存区/栈顶1项。
     * 注：与其中任一值相等（===）。
     * @param {...Value} vals 实参序列
     */
    include( evo, ...vals ) {
        return vals.includes( evo.data );
    },

    __include: 1,


    /**
     * 是否两者为真。
     * 目标：暂存区/栈顶2项。
     * 如果传递strict为真则与true全等（===）比较。
     */
    both( evo, strict ) {
        let [x, y] = evo.data;
        return strict ? x === true && y === true : !!(x && y);
    },

    __both: 2,


    /**
     * 是否任一为真。
     * 目标：暂存区/栈顶2项。
     * 如果传递strict为真则与true全等（===）比较。
     */
    either( evo, strict ) {
        let [x, y] = evo.data;
        return strict ? x === true || y === true : !!(x || y);
    },

    __either: 2,


    /**
     * 是否每一项都为真。
     * 目标：暂存区/栈顶1项。
     * 测试函数可选，默认非严格真值测试。
     * test接口：function(value, key, obj): Boolean
     *
     * @data: Array|Object|Collector|[.entries]
     * @param {Function} test 测试函数，可选
     */
    every( evo, test ) {
        return $.every( evo.data, test || (v => v), null );
    },

    __every: 1,


    /**
     * 是否有任一项为真。
     * 目标：暂存区/栈顶1项。
     * 说明参考every。
     * @param {Function} test 测试函数，可选
     */
    some( evo, test ) {
        return $.some( evo.data, test || (v => v), null );
    },

    __some: 1,


    /**
     * 目标对象内成员测试。
     * 目标：暂存区/栈顶1项。
     * name为属性名，支持空格分隔的多个属性名指定。
     * val为对比值，与目标属性值做全等比较，可选，默认存在性测试（非undefined）。
     * 如果name为多名称指定，val可以是一个数组（一一对应）。
     * 当所有的检查/比较都为真时，返回true。
     * 例：
     * - inside('shift ctrl', true) // 是否shift和ctrl成员值都为true。
     * - inside('selector') // 是否selector成员在目标内。
     * - inside('AA BB', [1, 2]) // 是否AA成员值为1且BB成员值为2。
     * 注意：
     * 对比值通常只是简单类型，对象或数组只取引用本身。
     *
     * @param {String} name 成员名称（集）
     * @param {Value|[Value]} val 对比值或值集
     */
    inside( evo, name, val ) {
        if ( __reSpace.test(name) ) {
            return name.split(__reSpace).every( existHandle(evo.data, val) );
        }
        return existValue( evo.data, name, val );
    },

    __inside: 1,



    // String简单处理。
    // 目标：暂存区/栈顶1项。
    // @data: {String|[String]}
    //-----------------------------------------------

    /**
     * 空白修整。
     * where: {
     *      0   两端（trim）
     *      1   前端（trimLeft）
     *     -1   后端（trimRight）
     * }
     * @param  {Number} where 清理位置
     * @return {String|[String]}
     */
    trim( evo, where = 0 ) {
        return mapCall(
            evo.data,
            (ss, fn) => ss[ fn ](),
            trimFunc[ where ]
        );
    },

    __trim: 1,


    /**
     * 空白清理。
     * 将字符串内多个空白替换为单个空格或删除。
     * 字符串首尾空白会被清除。
     * @param  {Boolean} all 全部删除
     * @return {String|[String]}
     */
    clean( evo, all ) {
        return mapCall(
            evo.data,
            (s, r, v) => s.replace(r, v),
            all ? __reSpace1n : __reSpace2n,
            all ? '' : ' '
        );
    },

    __clean: 1,


    /**
     * 内容替换。
     * 对String.replace的简单封装。
     * @param  {...Value} args 参数序列
     * @return {String|[String]}
     */
    replace( evo, ...args ) {
        return mapCall( evo.data, s => s.replace(...args) );
    },

    __replace: 1,


    /**
     * 切分字符串为数组。
     * 支持4子节Unicode字符空白切分。
     * @param  {String} sep 分隔符，可选
     * @param  {Number} cnt 最多切分数量，可选
     * @return {[String]|[[String]]}
     */
    split( evo, sep, cnt ) {
        return mapCall( evo.data, s => $.split(s, sep, cnt) );
    },

    __split: 1,


    /**
     * 转为大写。
     * 目标：暂存区/栈顶1项。
     * @param  {Boolean|1} n 首字母大写，可选
     * @return {String}
     */
    caseUpper( evo, n ) {
        return mapCall( evo.data, s => upperCase(s, n) );
    },

    __caseUpper: 1,


    /**
     * 转为全小写。
     * 目标：暂存区/栈顶1项。
     * @return {String}
     */
    caseLower( evo ) {
        return mapCall( evo.data, s => s.toLowerCase() );
    },

    __caseLower: 1,


    /**
     * RGB 16进制颜色值转换。
     * rgb(n, n, n) => #rrggbb。
     * @return {String}
     */
    rgb16( evo ) {
        return mapCall( evo.data, s => rgb16Val(s) );
    },

    __rgb16: 1,


    /**
     * RGBA 16进制值转换。
     * rgba(n, n, n, a) => #rrggbbaa。
     * @return {String}
     */
    rgba16( evo ) {
        return mapCall( evo.data, s => rgba16Val(s) );
    },

    __rgba16: 1,



    // 增强运算
    //-----------------------------------------------------

    /**
     * 函数执行。
     * 目标：暂存区/栈顶1项。
     * 视目标为函数，传递实参执行并返回结果。
     * @param  {...Value} args 实参序列
     * @return {Any}
     */
    exec( evo, ...args ) {
        return evo.data( ...args );
    },

    __exec: 1,


    /**
     * 表达式/函数运算。
     * 目标：暂存区/栈顶1项。
     * 目标为源数据。
     * JS表达式支持一个默认的变量名$，源数据即为其实参。
     * 例：
     * push('123456') calc('$[0]+$[2]+$[4]')
     * => '135'
     * Date calls('getMonth getDate getFullYear') calc('`${$[0]+1}/${$[1]}-${$[2]}`')
     * => '3/17-2020'
     * @param  {String|Function} expr 表达式或函数
     * @return {Any}
     */
    calc( evo, expr ) {
        if ( $.isFunction(expr) ) {
            return expr( evo.data );
        }
        return new Function( '$', `return ${expr};` )( evo.data );
    },

    __calc: 1,


    /**
     * 应用目标的方法。
     * 目标：暂存区/栈顶1项。
     * 注：
     * 无返回值，用于目标对象的设置类操作。
     * @param  {String} meth 方法名
     * @param  {...Value} args 实参序列
     * @return {void}
     */
    apply( evo, meth, ...args ) {
        evo.data[meth]( ...args );
    },

    __apply: 1,


    /**
     * 应用目标的方法（多次）。
     * 目标：暂存区/栈顶1项。
     * 实参组成员是每次调用时传入的实参。
     * 如果成员是一个数组，它们会被展开传入，
     * 因此，如果方法需要一个数组实参，需要预先封装。
     * 注：
     * 无返回值，用于目标对象的批量设置。
     * @param  {String} meth 方法名
     * @param  {...[Value]} args 实参组
     * @return {void}
     */
    applies( evo, meth, ...args ) {
        args.forEach(
            rest => evo.data[meth]( ...[].concat(rest) )
        );
    },

    __applies: 1,


    /**
     * 设置目标成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称。
     * 如果名称为多个，值应当是一个序列且与名称一一对应。
     * 注：会改变原对象自身。
     * @param  {String} name 名称/序列
     * @param  {...Value} vals 值序列
     * @return {@data}
     */
    set( evo, name, ...vals ) {
        name
        .split(__reSpace)
        .forEach(
            (n, i) => evo.data[n] = vals[i]
        );
        return evo.data;
    },

    __set: 1,



    // 实用工具
    //-----------------------------------------------------


    /**
     * 热键触发。
     * 目标：暂存区/栈顶1项。
     * 用法：
     *      <html on="keydown|(GHK) acmsk ev('key') hotKey(_2)">
     * 其中：
     * - keydown 捕获键盘按下事件（使得可屏蔽浏览器默认行为）。
     * - GHK 为操作目标，是一个 Hotkey 实例，创建：new HotKey().config(...)。
     * - acmsk ev('key') 为键序列和键值（辅助）实参。
     *
     * @param  {String} key 快捷键序列
     * @param  {...Value} args 发送的数据或实参序列
     * @return {Boolean} 是否已捕获激发
     */
    hotKey( evo, key, ...args ) {
        return evo.data.fire( key, evo.event, ...args );
    },

    __hotKey: 1,


    /**
     * 活动选取记忆。
     * 目标：无。
     * 自动更新全局Range集存储。
     * 通常绑定在离可编辑元素最近的容器元素上。
     * 如：
     * <main on="mouseup keyup input|rangeKeep stop">
     *      <p contenteditable>可编辑区域...</p>
     * </main>
     * @return {void}
     */
    rangeKeep() {
        let _sln = window.getSelection();
        __tmpRanges.length = 0;

        for (let i = 0; i < _sln.rangeCount; i++) {
            __tmpRanges.push( _sln.getRangeAt(i) );
        }
        // 用于重新聚焦。
        __tmpRanges.active = document.activeElement;
    },

    __rangeKeep: null,


    /**
     * 执行document命令。
     * 目标：暂存区1项可选。
     * 目标为待使用的数据（部分命令不需要）。
     * 需配合rangeKeep使用（定位编辑区）。
     * 用法：
     *      on="click(b)|evo(2) text pop exeCmd('insertText')"
     * 说明：
     * - 绑定单击元素内的<b>元素事件。
     * - 取当前目标元素内的文本，提取至暂存区。
     * - 执行 insertText 命令，内容为暂存区数据。
     * 注：
     * 插入的内容可受浏览器自身撤销/重做操作的影响。
     *
     * @param  {String} name 命令名称
     * @return {Boolean} 调用命令返回的值
     */
    exeCmd( evo, name ) {
        let _sln = window.getSelection();

        _sln.removeAllRanges();
        _sln.addRange( __tmpRanges[0] );

        __tmpRanges.active.focus();

        return document.execCommand( name, false, evo.data );
    },

    __exeCmd: -1,

};



//
// 集合操作。
// 目标：暂存区/栈顶1项。
// 注：map、each方法操作的目标支持Object。
//////////////////////////////////////////////////////////////////////////////
[
    'filter',   // ( fltr?: String|Function )
    'not',      // ( fltr?: String|Function )
    'has',      // ( slr?: String )
    'map',      // ( proc?: Function ) 会忽略proc返回的undefined或null值。
    'each',     // ( proc?: Function ) 返回操作目标。处理器返回false会中断迭代。
]
.forEach(function( meth ) {
    /**
     * @param  {...} arg 模板实参，可选
     * @return {[Value]|Collector}
     */
    _Process[meth] = function( evo, arg ) {
        return $.isCollector(evo.data) ?
            evo.data[meth]( arg ) : $[meth]( evo.data, arg );
    };

    _Process[`__${meth}`] = 1;

});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 单值/集合调用封装。
 * @param  {Value|[Value]} data 数据/集
 * @param  {Function} handle 调用句柄
 * @param  {...Value} rest 剩余实参序列
 * @return {Value|[Value]}
 */
function mapCall( data, handle, ...rest ) {
    if ( $.isArray(data) ) {
        return data.map( v => handle(v, ...rest) );
    }
    return handle( data, ...rest );
}


/**
 * 创建n个伪随机数。
 * 如果max值为null或undefined，随机数在 [0,1) 区间。
 * 注：随机数不包含上限值。
 * @param  {Number} n 数量
 * @param  {Number} max 上限值，可选
 * @return {[Number]}
 */
function randoms(n, max) {
    let _ns = new Array(n).fill();

    if (max == null) {
        return _ns.map(() => Math.random());
    }
    return _ns.map(() => Math.floor(Math.random() * Math.floor(max)));
}


/**
 * 本地存储（sessionStorage|localStorage）。
 * 设置null值为清除目标值。
 * @param  {Storage} buf 存储器
 * @param  {String|null} name 存储键
 * @param  {Value|null} val 存储值
 * @return {void}
 */
function storage( buf, name, its ) {
    if ( name === null) {
        return buf.clear();
    }
    if ( its === null ) {
        return buf.removeItem( name );
    }
    buf.setItem( name, its );
}


/**
 * 对象属性值测试。
 * 检查目标属性是否在目标对象内或是否与测试值全等。
 * 注：如果测试值未定义，则为存在性检查。
 * @param  {Object} obj 目标对象
 * @param  {String} name 属性名
 * @param  {Value} val 测试值
 * @return {Boolean}
 */
function existValue( obj, name, val ) {
    return val === undefined ? obj[name] !== undefined : obj[name] === val;
}


/**
 * 创建属性/值检查函数。
 * 如果对比值是一个数组，则按名称顺序对比检查测试。
 * @param  {Object} obj 检查对象
 * @param  {Value|[Value]} val 对比值（集）
 * @return {Function} 比较函数
 */
function existHandle( obj, val ) {
    return $.isArray(val) ?
        (n, i) => existValue(obj, n, val[i]) : n => existValue(obj, n, val);
}


/**
 * 对比两个数组是否相等。
 * 仅为数组成员的浅层相等对比。
 * @param {[Value]} a1 数组1
 * @param {[Value]} a2 数组2
 */
function arrayEqual( a1, a2 ) {
    if ( a1.length != a2.length ) {
        return false;
    }
    a1.every( (v, i) => v === a2[i] );
}


/**
 * 数组深层复制。
 * @param {Array} arr 源数组
 * @param {Array} buf 存储区，可选
 */
function deepArray( arr, buf = [] ) {
    for (const v of arr) {
        buf.push( $.isArray(v) ? deepArray(v) : v );
    }
    return buf;
}


/**
 * 获取剪除段之后首个指令。
 * @param  {Cell} cell 起始指令单元
 * @param  {Number} n 指令数量
 * @return {Cell|null} 待衔接指令单元
 */
function lastCell( cell, n ) {
    while ( n-- && cell ) cell = cell.next;
    return cell;
}


/**
 * 字符串大写。
 * @param  {String} str 字符串
 * @param  {Boolean|1} first 仅首字母
 * @return {String}
 */
function upperCase( str, first ) {
    return first ?
        str.replace( /^[a-z]/g, c => c.toUpperCase() ) :
        str.toUpperCase();
}


/**
 * 获取RGB 16进制值。
 * 主要用于设置颜色控件（input:color）的有效值。
 * rgb(n, n, n) => #rrggbb。
 * @param  {String} val 颜色值
 * @return {String}
 */
function rgb16Val( val ) {
    return '#' +
        val.match(__rgbDecimal).slice(1, 4).map(n => num16ch2(+n)).join('');
}


/**
 * 获取RGBA 16进制值。
 * rgba(n, n, n, a) => #rrggbbaa。
 * @param  {String} val 颜色值
 * @return {String}
 */
function rgba16Val( val ) {
    let _ns = val.match(__rgbaDecimal),
        _al = parseInt(_ns[4]*256);

    return '#' + _ns.slice(1, 4).map(n => num16ch2(+n)).join('') + num16ch2(_al);
}


/**
 * 转为16进制字符串。
 * 注：两位字符，不足2位前置0。
 * @param  {Number} n 数值
 * @return {String}
 */
function num16ch2( n ) {
    return n < 16 ? `0${n.toString(16)}` : n.toString(16);
}


/**
 * 迭代计数处理。
 * - 初始化。
 * - 递增。
 * - 完成后重置。
 * @param  {Cell} self 指令单元
 * @param  {Number} cnt 迭代次数
 * @return {true|void} 迭代结束返回true
 */
function countStage( self, cnt ) {
    if ( self[__ENTRY] == 0 ) {
        delete self[__ENTRY];
        return true;
    }
    if ( self[__ENTRY] === undefined ) {
        self[__ENTRY] = +cnt || 1;
    }
    if ( cnt > 0 ) self[__ENTRY]--;
}



//
// 特殊指令（Control）。
// this: {Cell} （无预绑定）
///////////////////////////////////////////////////////////////////////////////


const
    // 剪除：跳过计数属性。
    __PRUNE = Symbol('prune-count'),

    // 入口/循环计数属性。
    __ENTRY = Symbol('entry-loop');


/**
 * 剪除后端跟随指令。
 * 目标：无。
 * 允许后端指令执行cnt次，之后再剪除衔接。
 * 可以指定移除的指令数量，-1表示后续全部指令，0表示当前指令（无意义）。
 * 非法的cnt值无效，取默认值1。
 * 注记：仅适用 On/By/To:NextStage 链段。
 * @param  {Number} cnt 执行次数，可选
 * @param  {Number} n 移除的指令数，可选
 * @return {void}
 */
function prune( evo, cnt = 1, n = 1 ) {
    if ( this[__PRUNE] === undefined ) {
        this[__PRUNE] = cnt > 0 ? cnt : 1;
    }
    if ( --this[__PRUNE] > 0 ) {
        return;
    }
    // 不影响当前继续
    this.prev.next = lastCell( this.next, n );
}

// prune[EXTENT] = null;

// 需要前阶指令。
// 注：在指令解析时判断赋值。
prune[PREVCELL] = true;


/**
 * 创建入口。
 * 目标：无。
 * 在执行流中段创建一个入口，使得可以从该处启动执行流。
 * 可用于动画类场景：前阶收集数据，至此开启循环迭代。
 * 模板用法：
 *      entry       // 设置入口。
 *      loop(...)   // 从entry处开始执行。
 * 注：
 * 一个loop之前应当只有一个入口（或最后一个有效）。
 * @return {void}
 */
function entry( evo ) {
    evo.entry = this.call.bind( this.next, evo );
}

// entry[EXTENT] = null;


/**
 * 区段循环（=> entry）。
 * 目标：暂存区条目，可选
 * 执行前面entry指令设置的入口函数。
 * cnt 为迭代次数，0值与1相同，负值表示无限。
 * val 为每次迭代传入起始指令的值，可选。
 * 注：
 * - 每次重入会清空暂存区（全部取出）。
 * - 如果val为空则暂存区的值会传入起始指令。
 * 注意：
 * - 循环结束之后并不会移除入口，后面依然可以启动循环。
 * - 若后面启动循环，会连带激活当前循环（嵌套）。
 * @param  {Number} cnt 迭代次数
 * @param  {Value} val 起始指令初始值，可选
 * @return {void}
 */
function loop( evo, cnt, val = evo.data ) {
    countStage( this, cnt ) || evo.entry( val );
}

//
// 暂存区条目可选。
// 注记：
// loop之后的指令从一个干净的暂存区开始。
//
loop[EXTENT] = 0;


/**
 * 动效启动（=> entry）
 * 目标：暂存区条目，可选
 * 说明参考loop指令。
 * 注记：
 * 循环迭代的频率受限于浏览器的重绘频率（硬件相关）。
 * 可以结合 sleep 指令获得较为确定的时间控制。
 * 主要在 To.NextStage 段使用，但定义在此可全局共享。
 *
 * @param  {Number} cnt 迭代次数
 * @param  {Value} val 起始指令初始值，可选
 * @return {void}
 */
function effect( evo, cnt, val = evo.data ) {
    countStage( this, cnt ) ||
    // 循环速率受限。
    requestAnimationFrame( () => evo.entry(val) );
}

//
// 暂存区条目可选。
//
effect[EXTENT] = 0;


/**
 * 控制台调试打印。
 * 特殊：是，this为Cell实例，查看调用链。
 * 目标：无。
 * 特权：是，数据栈显示。
 * @param  {Value|false} msg 显示消息，传递false中断执行流
 * @return {void|reject}
 */
function debug( evo, stack, msg = '' ) {
    window.console.info( msg, {
        evo,
        cmd: this,
        tmp: stack._tmp.slice(),
        buf: stack._buf.slice()
    });
    if ( msg === false ) return Promise.reject();
}

debug[ACCESS] = true;
debug[EXTENT] = null;



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////

//
// 控制集。
//
const Control = $.assign( {}, _Control, bindMethod );

//
// 特殊控制。
// 无预绑定处理。this:{Cell}
//
Control.prune  = prune;
Control.entry  = entry;
Control.loop   = loop;
Control.effect = effect;
Control.debug  = debug;


//
// 计算/加工集。
// @proto: Control
//
const Process = $.proto(
    $.assign({}, _Process, bindMethod), Control
);


export { Process, debug };
