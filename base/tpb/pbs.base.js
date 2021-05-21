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

import { bindMethod, EXTENT, ACCESS, Globals, DEBUG, JUMPCELL, PREVCELL } from "./config.js";


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
    // 保留首个匹配字符和剩余部分记忆。
    // 注：clean专用。
    __reSpace1n = /(\s)(\s*)/g,

    // 颜色值：RGB|RGBA
    __reRGBa = [
        // rgb(128.0, 128, 128, 0.6)
        /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.%]+))?\s*\)/,
        // rgb(34 12 64 / 0.6)
        /rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/,
    ],

    // RGBA十六进制表示。
    // 兼容3位安全色表示（如：#999）。
    __reRGB16 = /^#(?:[0-9A-F]{3}|[0-9A-F]{6}(?:[0-9A-F]{2})?)$/i,

    // 选区对象存储池。
    __tmpRanges = {},

    // 选区默认存储键。
    __rngKey = Symbol( 'Range-store' );



//
// 控制类。
// 适用 On/By/To:Next 三个域。
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
     * 循环执行启动。
     * 从entry指令定义的入口处执行。
     * 目标：暂存区/栈顶1项。
     * 目标值用于判断是否继续循环（假值终止）。
     * 传送的入栈值ival效果类似于entry指令的返回值。
     * @param {Value} ival 起始入栈值
     */
    loop( evo, ival ) {
        if ( DEBUG ) {
            propectLoop( 0, '[loop] too many cycles.' );
        }
        evo.data && evo.entry( ival );
    },

    __loop: 1,


    /**
     * 动效循环启动。
     * 从entry指令定义的入口处执行。
     * 目标：暂存区/栈顶1项。
     * 说明参考上面loop指令。
     * 每次执行受限于硬件刷新率。
     * @param  {Value} ival 起始入栈值
     * @return {void}
     */
    effect( evo, ival ) {
        if ( DEBUG ) {
            propectLoop( 1, '[effect] too many cycles.' );
        }
        evo.data && requestAnimationFrame( () => evo.entry(ival) );
    },

    __effect: 1,



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
     * 引用数据栈目标位置项。
     * 下标位置支持负数从末尾算起。
     * 注意：非法的下标位置会导入一个null值。
     * @param {Stack} stack 数据栈
     * @param {...Number} ns 位置下标序列
     */
    index( evo, stack, ...ns ) {
        stack.tindex( ns );
    },

    __index_x: true,


    /**
     * 剪取数据栈目标位置条目（单项）。
     * idx负值从末尾算起（-1为栈顶1项）。
     * 例：
     * pick(-1)  同 pop
     * pick(-2)  取栈顶之下1项。
     * @param {Stack} stack 数据栈
     * @param {Number} idx 位置下标（支持负数）
     */
    pick( evo, stack, idx ) {
        stack.tpick( idx );
    },

    __pick_x: true,


    /**
     * 剪取数据栈任意区段。
     * @param {Stack} stack 数据栈
     * @param {Number} idx 起始位置
     * @param {Number} cnt 移除计数，可选
     */
    clip( evo, stack, idx, cnt = 1 ) {
        stack.tsplice( idx, cnt );
    },

    __clip_x: true,



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
     * 复制栈顶项入栈，支持复制多份。
     * 目标：暂存区/栈顶1项。
     * 特权：是，自行入栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} cnt 复制份数，可选
     * @return {void}
     */
    dup( evo, stack, cnt = 1 ) {
        let _val = stack.tops(1)[0];
        while ( cnt-- > 0 ) stack.push( _val );
    },

    __dup_x: true,


    /**
     * 栈顶复制（浅）。
     * 复制栈顶n项并入栈（原样展开）。
     * 目标：无。
     * 特权：是，灵活取栈&自行入栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数，可选
     * @return {void}
     */
    dups( evo, stack, n = 1 ) {
        if ( n > 0 ) {
            stack.push( ...stack.tops(n) );
        }
    },

    __dups_x: true,


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
    ddups( evo, stack, n = 1 ) {
        if ( n <= 0 ) {
            return;
        }
        stack.push(
            ...stack.tops(n).map(v => $.isArray(v) ? deepArray(v) : v)
        );
    },

    __ddups_x: true,


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
    part( evo, stack, beg, end ) {
        return stack.slice( beg, end );
    },

    __part_x: true,


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
     * 注记：
     * undefined值无法入栈，因此返回null，这与设置时的null值功能相符。
     * @param  {String} name 键名
     * @param  {Value} val 存储值，可选
     * @return {Value|void}
     */
    env( evo, name, val ) {
        if ( val === undefined ) {
            let _v = Globals.get(name);
            return _v === undefined ? null : _v;
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
     * 注意：
     * 存储的值会被自动转换为字符串。
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
     * 条件判断传值。
     * 目标：暂存区/栈顶1项。
     * 如果目标值为真（广义），val入栈，否则elseval入栈。
     * @param  {Value} val 为真传值
     * @param  {Boolean} elseval ELSE传值，可选
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
     * 实参序列通常与目标集长度相同，若末尾多出一个，视为无匹配时的默认值。
     * @data: [Boolean]
     * @param  {...Value} vals 入栈值候选
     * @return {Value}
     */
    $switch( evo, ...vals ) {
        let i, b;

        for ( [i, b] of evo.data.entries() ) {
            if ( b ) return vals[ i ];
        }
        return vals[ i+1 ];
    },

    __$switch: 1,


    /**
     * 假值替换。
     * 目标：暂存区/栈顶1项。
     * 如果目标为假，返回传递的替换值。
     * @param  {Value} val 替换值
     * @param  {Boolean} strict 严格相等比较（===）
     * @return {Value} 替换值或原始值
     */
    or( evo, val, strict ) {
        if ( strict ) {
            return evo.data === false ? val : evo.data;
        }
        return evo.data || val;
    },

    __or: 1,


    /**
     * 真值替换。
     * 目标：暂存区/栈顶1项。
     * 如果目标为真，返回传递的替换值。
     * @param  {Value} val 替换值
     * @param  {Boolean} strict 严格相等比较（===）
     * @return {Value} 替换值或原始值
     */
    and( evo, val, strict ) {
        if ( strict ) {
            return evo.data === true ? val : evo.data;
        }
        return evo.data && val;
    },

    __and: 1,

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
     * 排序不影响原集合。
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
     * 反转不影响原始集合。
     * 兼容动画对象上的同名方法（无返回值）。
     * @return {[Value]|Collector|void}
     */
    reverse( evo ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            return $.isCollector(x) ? x.reverse() : Array.from(x).reverse();
        }
        // 动画对象。
        return x.reverse();
    },

    __reverse: 1,


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
     * 数组长度相同且成员相等（===）即为相等。
     * @param {[Value]} arr 对比数组
     */
    eqarr( evo, arr ) {
        if ( evo.data.length != arr.length ) {
            return false;
        }
        return evo.data.every( (v, i) => v === arr[i] );
    },

    __eqarr: 1,


    /**
     * 是否为一个NaN值。
     * @return {Boolean|[Boolean]}
     */
    isNaN( evo ) {
        return mapCall( evo.data, v => isNaN(v) );
    },

    __isNaN: 1,


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
    //-----------------------------------------------------

    /**
     * 是否在[min, max]之内（含边界）。
     * 目标：暂存区/栈顶1项。
     * 注：全等（===）比较。
     * @param  {Number} min 最小值
     * @param  {Number} max 最大值
     * @return {Boolean}
     */
    within( evo, min, max ) {
        return min <= evo.data && evo.data <= max;
    },

    __within: 1,


    /**
     * 目标是否在实参序列中。
     * 目标：暂存区/栈顶1项。
     * 注：与其中任一值相等（===）。
     * @param  {...Value} vals 实参序列
     * @return {Boolean}
     */
    include( evo, ...vals ) {
        return vals.includes( evo.data );
    },

    __include: 1,


    /**
     * 是否两者为真。
     * 目标：暂存区/栈顶2项。
     * @param  {Boolean} strict 严格相等比较（===）
     * @return {Boolean}
     */
    both( evo, strict ) {
        let [x, y] = evo.data;
        return strict ? x === true && y === true : !!(x && y);
    },

    __both: 2,


    /**
     * 是否任一为真。
     * 目标：暂存区/栈顶2项。
     * @param  {Boolean} strict 严格相等比较（===）
     * @return {Boolean}
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
     * @param  {Function} test 测试函数，可选
     * @return {Boolean}
     */
    every( evo, test ) {
        return $.every( evo.data, test || (v => v), null );
    },

    __every: 1,


    /**
     * 是否有任一项为真。
     * 目标：暂存区/栈顶1项。
     * 说明参考every。
     * @param  {Function} test 测试函数，可选
     * @return {Boolean}
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
     * - inside('selector') // 是否selector属性在目标内。
     * - inside('AA BB', [1, 2]) // 是否AA成员值为1且BB成员值为2。
     * 注意：
     * 对比值通常只是简单类型，对象或数组只取引用本身。
     * @data: Object
     * @param  {String} name 成员名称（集）
     * @param  {Value|[Value]} val 对比值或值集
     * @return {Boolean}
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
     * 将字符串内连续的空白替换为指定的字符序列，
     * 首尾空白只会在传递 rch 为空串时才有清除的效果。
     * 默认替换为空白匹配序列的首个空白。
     * @param  {String|Function} rch 空白替换符，可选
     * @return {String|[String]}
     */
    clean( evo, rch = '$1' ) {
        return mapCall( evo.data, s => s.replace(__reSpace1n, rch) );
    },

    __clean: 1,


    /**
     * 提取子串。
     * 这是对.slice方法的封装（而不是 String.substr）。
     * 结束位置支持负数从末尾算起。
     * @param  {Number} start 起始位置下标
     * @param  {Number} end 结束位置下标，可选
     * @return {String}
     */
    substr( evo, start, end ) {
        return mapCall( evo.data, s => s.slice(start, end) );
    },

    __substr: 1,


    /**
     * 内容替换。
     * 对String:replace的简单封装但支持数组。
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
     * @param  {String|RegExp} sep 分隔符，可选
     * @param  {Number} cnt 最多切分数量，可选
     * @return {[String]|[[String]]}
     */
    split( evo, sep, cnt ) {
        return mapCall( evo.data, s => $.split(s, sep, cnt) );
    },

    __split: 1,


    /**
     * 字符串重复串连。
     * @param  {Number} cnt 重复数量
     * @return {String|[String]}
     */
    repeat( evo, cnt ) {
        return mapCall( evo.data, s => s.repeat(cnt) );
    },

    __repeat: 1,


    /**
     * 转为大写。
     * 目标：暂存区/栈顶1项。
     * @param  {Boolean|1} A 首字母大写，可选
     * @return {String}
     */
    caseUpper( evo, A ) {
        return mapCall( evo.data, s => upperCase(s, A) );
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
     * 如果源串已经是一个正确的表示，则简单返回。
     * rgb|rgba(n, n, n / a) => #rrggbbaa。
     * rgb|rgba(n, n, n, a) => #rrggbbaa。
     * @return {String|[String]}
     */
    rgb16( evo ) {
        if ( __reRGB16.test(evo.data) ) {
            return evo.data;
        }
        return mapCall( evo.data, s => rgb16str(s) );
    },

    __rgb16: 1,


    /**
     * 构造RGBA格式串。
     * 目标：暂存区/栈顶1项。
     * 目标为一个十六进制格式的颜色值串。
     * 如果目标串已经包含Alpha，则用实参的alpha替换。
     * 如果实参alpha非数值，则简单忽略（不应用）。
     * @data: String
     * @param  {Number} alpha 透明度（0-255）
     * @return {String}
     */
    rgba( evo, alpha ) {
        if ( isNaN(alpha) ) {
            return evo.data;
        }
        return mapCall( evo.data, s => toRGBA(s, alpha) );
    },

    __rgba: 1,



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
     * @data: Object
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {void}
     */
    apply( evo, meth, ...rest ) {
        evo.data[meth]( ...rest );
    },

    __apply: 1,


    /**
     * 应用目标的方法（多次）。
     * 目标：暂存区/栈顶1项。
     * 目标是一个接受调用的单个对象。
     * 实参组成员是每次调用时传入的实参。
     * 数组成员会被展开传入，因此实参可能需要预先封装（二维）。
     * 注：
     * 无返回值，用于目标对象的批量设置。
     * @data: Object
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
     * @data: Object
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
     * @data: HotKey
     * @param  {String} key 快捷键序列
     * @param  {...Value} args 发送的数据或实参序列
     * @return {Boolean} 是否已捕获激发
     */
    hotKey( evo, key, ...args ) {
        return evo.data.fire( key, evo.event, ...args );
    },

    __hotKey: 1,


    /**
     * 选取范围记忆与提取。
     * 目标：暂存区1项可选。
     * 目标有值时为 Range 对象存储，否则为取值。
     * 通常绑定在离可编辑元素较近的容器元素上。
     * 如：
     * <main on="mouseup keyup input|sRange pop xRange stop">
     *      <p contenteditable>可编辑区域...</p>
     * </main>
     * @data: Range?
     * @param  {String|Symbol} key 存储键
     * @return {Range|void}
     */
    xRange( evo, key = __rngKey ) {
        if ( evo.data === undefined ) {
            return __tmpRanges[ key ];
        }
        if ( evo.data ) __tmpRanges[ key ] = evo.data;
    },

    __xRange: -1,


    /**
     * 将选取范围添加到浏览器全局Selection上。
     * 目标：暂存区/栈顶1项。
     * 目标为待添加的选取范围（Range）实例。
     * @param  {Boolean} clear 清除之前的选取，可选
     * @return {Range} 被添加的选区
     */
    addRange( evo, clear = true ) {
        let _sln = window.getSelection();

        if ( clear ) {
            _sln.removeAllRanges();
        }
        return _sln.addRange(evo.data), evo.data;
    },

    __addRange: 1,


    /**
     * 执行document命令。
     * 目标：暂存区/栈顶1项。
     * 目标为用户划选或定义的选取范围（Range）。
     * 仅适用特性被设置为 contenteditable="true" 的可编辑元素。
     * 示例：
     * click(b)|xRange addRange evo(2) text exeCmd('insertText', _1)
     * 说明：
     * 提取预先存储/记忆的选区，添加到全局Selection上。
     * 激活选区所在可编辑容器元素，执行命令。
     * 注：
     * 插入的内容可进入浏览器自身撤销/重做栈。
     * @data: Element:contenteditable
     * @param  {String} name 命令名称
     * @param  {Value} data 待使用的数据
     * @return {Boolean} 是否支持目标命令
     */
    exeCmd( evo, name, data ) {
        evo.data.focus();
        return document.execCommand( name, false, data );
    },

    __exeCmd: 1,


    /**
     * 剪贴板操作（取值/设置）。
     * 目标：暂存区1项可选。
     * 目标为待设置数据，有值时为设置，无值时为取值。
     * 提示：
     * - 取值适用粘贴（paste）事件。
     * - 设置适用复制或剪切（copy|cut）事件。
     * 注记：
     * 仅支持在直接的事件调用链中使用。
     * @data: Value|void
     * @param  {String} fmt 数据类型，可选（默认纯文本）
     * @return {String|void}
     */
    clipboard( evo, fmt = 'text/plain' ) {
        if ( evo.data === undefined ) {
            return evo.event.clipboardData.getData( fmt );
        }
        evo.event.clipboardData.setData( fmt, evo.data );
    },

    __clipboard: -1,

};



//
// Collector操作（部分兼容数组）。
// 目标：暂存区/栈顶1项。
// 注：map、each方法操作的目标支持Object。
//////////////////////////////////////////////////////////////////////////////
[
    'not',      // ( fltr?: String|Function )
    'has',      // ( slr?: String )
    'filter',   // ( fltr?: String|Function ) 兼容数组
    'map',      // ( proc?: Function ) 兼容数组
    'each',     // ( proc?: Function )
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
// 数组操作（兼容Collector）。
// 目标：暂存区/栈顶1项。
// 目标已经为数组或Collector实例。
// 注记：pop/shift/push 方法被数据栈处理占用。
//////////////////////////////////////////////////////////////////////////////
[
    'slice',    // (beg, end?: Number): Array | Collector
    'flat',     // (deep?: Number|true): Array | Collector
    'concat',   // (...Value): Array | Collector
    'splice',   // (start, delcnt, ...): Array
]
.forEach(function( meth ) {
    /**
     * @param  {...Value} args 模板实参序列
     * @return {[Value]|Collector}
     */
    _Process[meth] = function( evo, ...args ) {
        return evo.data[meth]( ...args );
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
 * 值传递null会清除目标值。
 * 名称传递null会清除全部存储！
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
 * 获取之后第n个指令。
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
 * 合成RGBA格式串。
 * 如：#369 => #33669980
 * @param  {String} c16 十六进制颜色值串
 * @param  {Number} alpha 透明度值（0-1）
 * @return {String}
 */
function toRGBA( c16, alpha ) {
    if ( c16.length === 4 ) {
        c16 = rgb3_6( c16 );
    }
    else if ( c16.length === 9 ) {
        c16 = c16.substring(0, 7);
    }
    return c16 + n16c2( alpha );
}


/**
 * 3位安全色转到6位值。
 * 如：#369 => #336699
 * @param  {String} str 3位颜色串值
 * @return {String}
 */
function rgb3_6( str ) {
    return '#' +
        str.substring(1).split('').map( c => c+c ).join('');
}


/**
 * 获取RGB 16进制值。
 * 主要用于设置颜色控件（input:color）的有效值。
 * rgb(n, n, n) => #rrggbb。
 * rgba(n, n, n, n) => #rrggbbaa
 * @param  {String} val 颜色值
 * @return {String}
 */
function rgb16str( val ) {
    let _vs = null;

    for ( const re of __reRGBa ) {
        _vs = val.match( re );
        if ( _vs ) break;
    }
    return _vs && rgb16val( ..._vs.slice(1) );
}


/**
 * RGBA 16进制值构造。
 * 透明度a实参是一个百分数或 0-1 的小数。
 * @param  {String} r Red
 * @param  {String} g Green
 * @param  {String} b Blue
 * @param  {String} a 透明度，可选
 * @return {String}
 */
function rgb16val( r, g, b, a = '' ) {
    if ( a ) {
        let _n = parseFloat( a );
        a = (a.includes('%') ? _n/100 : _n) * 255;
    }
    return `#${n16c2(+r)}${n16c2(+g)}${n16c2(+b)}` + ( a && n16c2(a) );
}


/**
 * 转为16进制字符串。
 * 注：两位字符，不足2位前置0。
 * @param  {Number} n 数值（可为浮点数）
 * @return {String}
 */
function n16c2( n ) {
    n = Math.floor( n );
    return n < 16 ? `0${n.toString(16)}` : n.toString(16);
}



//
// 特殊指令（Control）。
// this: {Cell} （无预绑定）
///////////////////////////////////////////////////////////////////////////////


/**
 * 延迟并跳跃。
 * 这会让执行流的连续性中断，跳过当前的事件处理流。
 * 这在摆脱事件流的连贯性时有用。
 * 也可用于简单的延迟某些UI表达（如延迟隐藏）。
 * 注记：
 * 在当前指令单元（Cell）上暂存计数器。
 * @param  {Number} ms 延时毫秒数
 * @return {void}
 */
function delay( evo, ms = 1 ) {
    return new Promise(
        resolve => {
            window.clearTimeout( this._delay );
            this._delay = window.setTimeout( resolve, ms );
        }
    );
}

// delay[EXTENT] = null;


/**
 * 指令序列截断。
 * 后续指令会自然执行一次。
 */
function prune() {
    this._prev.next = null;
}

prune[PREVCELL] = true;
// prune[EXTENT] = null;



const
    // 保护计数器。
    __propectLoop = [0, 0],

    // 保护上限值。
    __propectMax = 1 << 16;


/**
 * 跳过指令序列段。
 * 目标：暂存区/栈顶1项。
 * 目标值为真时，执行cn/dn两个实参的配置。
 * 用于模拟代码中的 if 分支执行逻辑。
 * 注记：
 * 跳过后移除栈顶的数据是必要的，因为它们通常需要由跳过的那些指令处理。
 * this: Cell
 * @param  {Stack} stack 数据栈
 * @param  {Number} cn 跳过的指令数
 * @param  {Number} dn 从栈顶移除的条目数
 * @return {void}
 */
function jump( evo, stack, cn, dn ) {
    if ( !evo.data ) {
        this.next = this._next;
        return;
    }
    if ( dn > 0 ) {
        stack.pops( dn );
    }
    this.next = lastCell( this._next, cn );
}

jump[EXTENT] = 1;
jump[ACCESS] = true;
jump[JUMPCELL] = true;


/**
 * 创建入口。
 * 目标：无。
 * 在执行流中段创建一个入口，使得可以从该处启动执行流。
 * 可用于动画类场景：前阶收集数据，至此开启循环迭代。
 * 模板用法：
 *      entry       // 设置入口。
 *      effect(...) // 从entry处开始执行。
 * 注：
 * 一个effect之前应当只有一个入口（或最后一个有效）。
 * @return {void}
 */
function entry( evo ) {
    if ( DEBUG ) {
        __propectLoop[0] = 0;
        __propectLoop[1] = 0;
    }
    evo.entry = this.call.bind( this.next, evo );
}

// entry[EXTENT] = null;


/**
 * 循环保护。
 * 避免loop/effect指令执行时间过长。
 * @param {Number} i 计数位置（0|1）
 * @param {String} msg 抛出的信息
 */
function propectLoop( i, msg ) {
    if ( __propectLoop[i]++ < __propectMax ) {
        return;
    }
    throw new Error( msg );
}


/**
 * 控制台信息打印。
 * 传递消息为false，显示信息并中断执行流。
 * 传递消息为true，设置断点等待继续。
 * 特殊：是，this为Cell实例，查看调用链。
 * 目标：无。
 * 特权：是，数据栈显示。
 * @param  {Value|false|true} msg 显示消息，传递false中断执行流
 * @return {void|reject}
 */
function debug( evo, stack, msg = '' ) {
    window.console.info( msg, {
        ev: evo.event,
        evo,
        next: this.next,
        tmp: stack._tmp.slice(),
        buf: stack._buf.slice()
    });
    if ( msg === true ) {
        // eslint-disable-next-line no-debugger
        debugger;
    }
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
Control.delay = delay;
Control.prune = prune;
Control.jump  = jump;
Control.entry = entry;
Control.debug = debug;


//
// 计算/加工集。
// @proto: Control
//
const Process = $.proto(
    $.assign({}, _Process, bindMethod), Control
);


export { Process, debug };
