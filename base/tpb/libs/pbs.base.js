//! $Id: pbs.js 2019.08.19 Tpb.Core $
//
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2017 - 2019 铁皮工作室  MIT License
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

import { bindMethod, EXTENT, ACCESS, PREVCELL, Globals, Hotkey } from "../config.js";


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
    __rgbDecimal = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;



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
     * 检查目标值是否为真（非假）或是否与val相等（===），
     * 结果为假会中断执行流。
     * @param  {Value} val 对比值，可选
     * @return {void|reject}
     */
    pass( evo, val ) {
        let _v = evo.data;

        if ( val !== undefined ) {
            _v = val === _v;
        }
        if ( !_v ) return Promise.reject();
    },

    __pass: 1,


    /**
     * 流程结束。
     * 目标：暂存区/栈顶1项。
     * 检查目标值是否为真（true）或是否与val相等（===），
     * 结果为true会结束执行流。
     * 注：与pass逻辑相反，但用严格真值（true）判断。
     * @param  {Value} val 对比值，可选
     * @return {void|reject}
     */
    end( evo, val ) {
        let _v = evo.data;

        if ( val !== undefined ) {
            _v = val === _v;
        }
        if ( _v === true ) return Promise.reject();
    },

    __end: 1,


    /**
     * 阻止事件默认行为。
     * 目标：暂存区1项。
     * 如果目标非空，则真值停止，否则无条件阻止。
     * back为执行之后的返回值（入栈），如果未执行则忽略。
     * 注：该指令必须在异步指令之前使用。
     * 例：
     * push(1) avoid('ok') 无条件停止，入栈 'ok'
     * push(1) pop avoid('ok') 1为真故停止，入栈 'ok'
     * push('ok') push(1) pop avoid(_) 同上。
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
     * 注：该指令必须在异步指令之前使用。
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
     * 注：该指令必须在异步指令之前使用。
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
     * 栈顶复制。
     * 复制栈顶n项并入栈（原样展开）。
     * 目标：无。
     * 特权：是，灵活取栈&自行入栈。
     * 传递n为true表示深度克隆栈顶1项（需为数组）。
     * 可对栈顶多项深度克隆（非数组项取原值/引用）。
     * @param  {Stack} stack 数据栈
     * @param  {Number|true} n 条目数或深层克隆指示，可选
     * @param  {Boolean} deep 是否深度克隆，可选
     * @return {void}
     */
    dup( evo, stack, n = 1, deep = false ) {
        if ( n === true ) {
            [n, deep] = [1, n];
        }
        if ( n > 0 ) stack.push( ...arrayDeeps(stack.tops(n), deep) );
    },

    __dup_x: true,


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
     * 剔除任意区段条目。
     * 目标：暂存区1项可选。
     * 特权：是。
     * 如果count未指定，表示删除start之后全部。
     * 如果目标有值，真值才会执行。
     * @param  {Stack} stack 数据栈
     * @param  {Number} start 起始位置
     * @param  {Number} count 删除数量，可选
     * @return {void}
     */
    scrap( evo, stack, start, count ) {
        if ( evo.data === undefined || evo.data ) {
            stack.dels( start, count );
        }
    },

    __scrap: -1,
    __scrap_x: true,



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
        let _o = evo.data;

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
     * 返回的是一个新的集合（保留原始类型）。
     * @return {[Value]|Collector}
     */
    reverse( evo ) {
        return $.isCollector(evo.data) ?
            evo.data.reverse() : Array.from(evo.data).reverse();
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

        if ( n < 2 ) {
            return _as;
        }
        return _as[0].map( (_, i) => _as.map( a => a[i] ) );
    },

    __mix_x: true,



    // 数学运算。
    // 大部分支持前一个操作数是数组的情况（对成员计算）。
    //-----------------------------------------------------

    /**
     * 加运算。
     * 同时适用数值和字符串。
     * 目标：暂存区/栈顶1项
     * 注记：Collector的同名方法没有被使用。
     * @param  {Number|String} y 第二个操作数
     * @return {Number|String|[Number|String]}
     */
    add( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v+y ) : x+y;
    },

    __add: 1,


    /**
     * 减运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    sub( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v-y ) : x-y;
    },

    __sub: 1,


    /**
     * 乘运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    mul( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v*y ) : x*y;
    },

    __mul: 1,


    /**
     * 除运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    div( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v/y ) : x/y;
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
        let x = evo.data;
        return $.isArray(x) ? x.map( v => parseInt(v/y) ) : parseInt(x/y);
    },

    __idiv: 1,


    /**
     * 模运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    mod( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v%y ) : x%y;
    },

    __mod: 1,


    /**
     * 幂运算。
     * 目标：暂存区/栈顶1项。
     * @param  {Number} y 第二个操作数
     * @return {Number|[Number]}
     */
    pow( evo, y ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => v**y ) : x**y;
    },

    __pow: 1,


    /**
     * 数值取负。
     * 目标：暂存区/栈顶1项。
     * @return {Number|[Number]}
     */
    neg( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => -v ) : -x;
    },

    __neg: 1,


    /**
     * 逻辑取反。
     * 目标：暂存区/栈顶1项。
     * @return {Boolean|[Boolean]}
     */
    vnot( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => !v ) : !x;
    },

    __vnot: 1,


    /**
     * 除并求余。
     * 目标：暂存区/栈顶1项
     * 注记：|商| * |y| + |余| == |x|
     * @param  {Number} y 第二个操作数，可选
     * @return {[Number, Number]} [商数, 余数]
     */
    divmod( evo, y ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            return x.map( v => [parseInt(v/y), v%y] );
        }
        return [ parseInt(x/y), x%y ];
    },

    __divmod: 1,


    /**
     * 计算绝对值。
     * 目标：暂存区/栈顶1项。
     * @data Number
     */
    abs( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => Math.abs(v) ) : Math.abs(x);
    },

    __abs: 1,


    /**
     * 返回向上取整后的值。
     * 目标：暂存区/栈顶1项。
     * @data Number
     */
    ceil( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => Math.ceil(v) ) : Math.ceil(x);
    },

    __ceil: 1,


    /**
     * 返回小于目标最大整数。
     * 目标：暂存区/栈顶1项。
     * @data Number
     */
    floor( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => Math.floor(v) ) : Math.floor(x);
    },

    __floor: 1,


    /**
     * 返回目标四舍五入后的整数。
     * 目标：暂存区/栈顶1项。
     * @data Number
     */
    round( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => Math.round(v) ) : Math.round(x);
    },

    __round: 1,


    /**
     * 返回实参的整数部分。
     * 目标：暂存区/栈顶1项。
     */
    trunc( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => Math.trunc(v) ) : Math.trunc(x);
    },

    __log10: 1,


    /**
     * 取最大值。
     * 目标：暂存区/栈顶1项。
     * @data Number|[Number]
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
     * @data Number|[Number]
     * @param  {Number} v 对比值
     * @return {Number}
     */
    min( evo, v ) {
        return Math.min( ...[].concat(evo.data), v );
    },

    __min: 1,


    /**
     * 创建一个0~1之间的伪随机数。
     * 目标：无。
     */
    random( evo ) {
        return Math.random();
    },

    __random: null,


    /**
     * 返回自然对数（loge，即ln）。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    log( evo, ...x ) {
        x = x.map( v => Math.log(v) );
        return x.length > 1 ? x : x[0];
    },

    __log: null,


    /**
     * 返回以2为底数的对数。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    log2( evo, ...x ) {
        x = x.map( v => Math.log2(v) );
        return x.length > 1 ? x : x[0];
    },

    __log2: null,


    /**
     * 返回以10为底数的对数。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    log10( evo, ...x ) {
        x = x.map( v => Math.log10(v) );
        return x.length > 1 ? x : x[0];
    },

    __log10: null,


    /**
     * 计算正弦值。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    sin( evo, ...x ) {
        x = x.map( v => Math.sin(v) );
        return x.length > 1 ? x : x[0];
    },

    __sin: null,


    /**
     * 计算余弦值。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    cos( evo, ...x ) {
        x = x.map( v => Math.cos(v) );
        return x.length > 1 ? x : x[0];
    },

    __cos: null,


    /**
     * 计算正切值。
     * 目标：无。
     * 如果实参为多个，返回一个值数组，否则返回单个值。
     * @param {...Number} x 待计算值/序列
     */
    tan( evo, ...x ) {
        x = x.map( v => Math.tan(v) );
        return x.length > 1 ? x : x[0];
    },

    __tan: null,



    // 比较运算。
    // 目标：暂存区/栈顶1项。
    // 模板传递的实参为比较操作的第二个操作数。
    // 注：支持数组操作（与成员逐一比较）。
    // @return {Boolean|[Boolean]}
    //-----------------------------------------------------

    /**
     * 相等比较（===）。
     */
    eq( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v === val) : x === val;
    },

    __eq: 1,


    /**
     * 不相等比较（!==）。
     */
    neq( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v !== val) : x !== val;
    },

    __neq: 1,


    /**
     * 小于比较。
     */
    lt( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v < val) : x < val;
    },

    __lt: 1,


    /**
     * 小于等于比较。
     */
    lte( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v <= val) : x <= val;
    },

    __lte: 1,


    /**
     * 大于比较。
     */
    gt( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v > val) : x > val;
    },

    __gt: 1,


    /**
     * 大于等于比较。
     */
    gte( evo, val ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => v >= val) : x >= val;
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
     * @return {Boolean}
     */
    contains( evo ) {
        return $.contains( evo.data[0], evo.data[1] );
    },

    __contains: 2,



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
     * 注：适用于数组和其它集合（如Object）。
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
    // 支持集合成员逐一处理，返回一个新集合。
    // @return {String|[String]}
    //-----------------------------------------------

    /**
     * 首尾空白修整。
     * where: {
     *      0   两端（trim）
     *      1   前端（trimLeft）
     *     -1   后端（trimRight）
     * }
     * @param {Number} where 清理位置
     */
    trim( evo, where = 0 ) {
        let _fn = trimFunc[where];

        return $.isArray(evo.data) ?
            evo.data.map( s => s[_fn]() ) : evo.data[_fn]();
    },

    __trim: 1,


    /**
     * 空白清理。
     * 将字符串内多个空白替换为单个空格或删除。
     * 字符串首尾空白会被清除。
     * @param {Boolean} all 全部删除
     */
    clean( evo, all ) {
        let x = evo.data,
            r = all ? __reSpace1n : __reSpace2n,
            v = all ? '' : ' ';

        return $.isArray(x) ?
            x.map( s => s.trim().replace(r, v) ) : x.trim().replace(r, v);
    },

    __clean: 1,


    /**
     * 内容替换。
     * 对String.replace的简单封装（但支持集合）。
     * @param  {...Value} args 参数序列
     */
    replace( evo, ...args ) {
        if ( $.isArray(evo.data) ) {
            return evo.data.map( s => s.replace(...args) );
        }
        return evo.data.replace( ...args );
    },

    __replace: 1,


    /**
     * 切分字符串为数组。
     * 支持4子节Unicode字符空白切分。
     * 如果目标是一个字符串数组，会返回一个二维数组。
     * @param {String} sep 分隔符，可选
     * @param {Number} cnt 切分数量，可选
     */
    split( evo, sep, cnt ) {
        if ( $.isArray(evo.data) ) {
            return evo.data.map( s => $.split(s, sep, cnt) );
        }
        return $.split( evo.data, sep, cnt );
    },

    __split: 1,


    /**
     * 转为大写。
     * 目标：暂存区/栈顶1项。
     * @data: String|[String]
     * @param  {Boolean|1} n 首字母大写，可选
     * @return {String|[String]}
     */
    caseUpper( evo, n ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(s => upperCase(s, n)) : upperCase(x, n);
    },

    __caseUpper: 1,


    /**
     * 转为全小写。
     * 目标：暂存区/栈顶1项。
     * @data: String|[String]
     * @return {String|[String]}
     */
    caseLower( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(s => s.toLowerCase()) : x.toLowerCase();
    },

    __caseLower: 1,


    /**
     * RGB 16进制颜色值转换。
     * rgb(n, n, n) => #rrggbb。
     */
    rgb16( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map(v => rgb16Val(v)) : rgb16Val(x);
    },

    __rgb16: 1,



    // 增强运算
    //-----------------------------------------------------

    /**
     * 元素克隆。
     * 目标：暂存区/栈顶1项。
     * 可选择同时克隆元素上绑定的事件处理器。
     * 如果目标为一个集合，会返回Collector。
     * @data: Element|[Element]|Collector
     * @param  {Boolean} event 包含事件处理器，可选
     * @param  {Boolean} deep 深层克隆（含子元素），可选（默认true）
     * @param  {Boolean} eventdeep 包含子元素的事件处理器，可选
     * @return {Element|Collector}
     */
    clone( evo, event, deep, eventdeep ) {
        if ( $.isArray(evo.data) ) {
            return $(evo.data).clone( event, deep, eventdeep );
        }
        return $.clone( evo.data, event, deep, eventdeep );
    },

    __clone: 1,


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
     * date calc('`${$.getMonth()+1}/${$.getDate()}-${$.getFullYear()}`')
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
     * 调用目标的方法（多次）。
     * 目标：暂存区/栈顶1项。
     * 视实参组成员为每次调用的实参。
     * 注：
     * 单目标单实参：不同实参多次调用。
     * @param  {String} meth 方法名
     * @param  {...Value} args 实参组
     * @return {void}
     */
    calls( evo, meth, ...args ) {
        args.forEach(
            arg => evo.data[meth](arg)
        );
    },

    __calls: 1,


    /**
     * 调用目标的方法（多次）。
     * 目标：暂存区/栈顶1项。
     * 视实参组成员为每次调用的实参（自动展开）。
     * 注：
     * 单目标多实参：不同实参序列多次调用。
     * @param  {String} meth 方法名
     * @param  {...[Value]} args 实参组（二维）
     * @return {void}
     */
    callx( evo, meth, ...args ) {
        args.forEach(
            rest => evo.data[meth](...rest)
        );
    },

    __callx: 1,



    // 实用工具
    //-----------------------------------------------------

    /**
     * 热键触发。
     * 目标：暂存区/栈顶1项。
     * 目标为热键序列，用于触发特定的功能。
     * 依赖：Hotkey实例。
     * @param  {Value} extra 发送数据
     * @return {void}
     */
    hotkey( evo, extra ) {
        Hotkey.fire( evo.data, evo.event, extra );
    },

    __hotkey: 1,

};



//
// 集合处理。
// 目标：暂存区/栈顶1项。
// 注：map、each方法操作的目标支持Object。
//////////////////////////////////////////////////////////////////////////////
[
    'filter',   // ( fltr?: String|Function )
    'not',      // ( fltr?: String|Function )
    'has',      // ( slr?: String )
    'map',      // ( proc?: Function )
                // 普通集合版会忽略proc返回的undefined或null值。
    'each',     // ( proc?: Function )
                // 返回操作目标。处理器返回false会中断迭代。
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
    buf.setItem( name, val );
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
 * 数组集深度克隆。
 * 注：容错非数组的成员（简单取原值/引用）。
 * @param {Array} arrs 数组集
 * @param {Boolean} deep 是否深度克隆
 */
function arrayDeeps( arrs, deep ) {
    if ( deep ) {
        return arrs.map( v => $.isArray(v) ? deepArray(v) : v );
    }
    return arrs;
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
 * rgb(n, n, n) => #rrggbb。
 * @param {String} val 颜色值
 */
function rgb16Val( val ) {
    return '#' +
        val.match(__rgbDecimal).slice(1, 4).map(n => num16str2(+n)).join('');
}


/**
 * 转为16进制字符串。
 * 注：两位字符，不足2位前置0。
 * @param  {Number} n 数值
 * @return {String}
 */
function num16str2( n ) {
    return n < 16 ? `0${n.toString(16)}` : n.toString(16);
}



//
// 特殊指令（Control）。
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
 * this: {Cell}
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
 * this为当前指令单元（Cell）。
 * 一个loop之前应当只有一个入口（或最后一个有效）。
 * @return {void}
 */
function entry( evo ) {
    evo.entry = this.call.bind( this.next, evo );
}

// entry[EXTENT] = null;


/**
 * 区段循环。
 * 目标：暂存区条目，可选
 * 执行前面entry指令设置的入口函数。
 * cnt 为迭代次数，0值与1相同，负值表示无限。
 * val 为每次迭代传入起始指令的值，可选。
 * 注：
 * - 每次重入会清空暂存区（全部取出）。
 * - 如果val为空则暂存区的值会传入起始指令。
 * 注意：
 * - 循环结束之后并不会移除入口，后面依然可以启动循环。
 * - 若后面启动循环，会同时激活当前循环（嵌套关系）。
 * @param  {Number} cnt 迭代次数
 * @param  {Value} val 起始指令初始值
 * @return {void}
 */
function loop( evo, cnt, val = evo.data ) {
    if ( this[__ENTRY] == 0 ) {
        delete this[__ENTRY];
        return;
    }
    if ( this[__ENTRY] === undefined ) {
        this[__ENTRY] = +cnt || 1;
    }
    if ( cnt > 0 ) this[__ENTRY]--;

    requestAnimationFrame( () => evo.entry(val) );
}

//
// 目标：暂存区条目，可选。
// 注记：
// loop之后的指令应当从一个干净的暂存区开始。
//
loop[EXTENT] = 0;


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
Control.debug  = debug;


//
// 计算/加工集。
// @proto: Control
//
const Process = $.proto(
    $.assign({}, _Process, bindMethod), Control
);


export { Control, Process, debug };
