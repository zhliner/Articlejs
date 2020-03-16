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

import { Util } from "./util.js";
import { bindMethod, EXTENT, ACCESS, Templater, Globals } from "../config.js";


const
    $ = window.$,

    // evo成员名/值键。
    evoIndex = {
        event:      0 ,     // 原生事件对象（注：ev指令可直接获取）
        0:          0,
        origin:     1 ,     // 事件起点元素（event.target）
        1:          1,
        current:    2 ,     // 触发事件的当前元素（event.currentTarget|matched）
        2:          2,
        delegate:   3 ,     // 事件相关联元素（event.relatedTarget）
        3:          3,
        related:    4 ,     // 委托绑定的元素（event.currentTarget）
        4:          4,
        selector:   5 ,     // 委托匹配选择器（for match）]
        5:          5,
        data:       10,     // 自动获取的流程数据
        10:         10,
        entry:      11,     // 中段入口（迭代重入）
        11:         11,
        targets:    12,     // To目标元素/集，向后延续
        12:         12,
    },

    // 空白分隔符。
    __reSpace = /\s+/;



//
// 全局顶层方法。
// 适用 On/To 两个域。
//
const _Base = {

    // 基础集。
    //===========================================

    /**
     * 单元素检索入栈。
     * 目标：暂存区1项/判断取值。
     * 特权：是，判断取值。
     * 如果实参为空，取目标为rid，如果目标为空，自动取栈顶1项。
     * 如果实参非空，目标有值则为起点元素。
     * rid: {
     *      undefined  以目标为rid，事件当前元素为起点。
     *      String  以目标（如果有）或事件当前元素（ev.current）为起点。
     * }
     * @param  {Object} evo 事件关联对象
     * @param  {Stack} stack 数据栈
     * @param  {String} rid 相对ID，可选
     * @return {Element}
     */
    $( evo, stack, rid ) {
        let _beg = evo.current;

        if ( rid == null ) {
            rid = evo.data === undefined ? stack.data(1) : evo.data;
        } else {
            _beg = evo.data || _beg;
        }
        return Util.find( rid, _beg, true );
    },

    __$: -1,
    __$_x: true,


    /**
     * 多元素检索入栈。
     * 目标：暂存区1项/判断取值。
     * 特权：是，判断取值。
     * rid: {
     *      undefined  同上，但如果目标非字符串则为Collector封装。
     *      String     同上。
     *      Value      Collector封装，支持单值和数组。
     * }
     * 注：如果实参传递非字符串，前阶pop的值会被丢弃。
     * @param  {Stack} stack 数据栈
     * @param  {String|Value} rid 相对ID或待封装值
     * @return {Collector}
     */
    $$( evo, stack, rid ) {
        let _beg = evo.current;

        if ( rid == null ) {
            // 兼容前阶主动pop
            rid = evo.data === undefined ? stack.data(1) : evo.data;
        } else {
            _beg = evo.data || _beg;
        }
        return typeof rid == 'string' ? Util.find(rid, _beg) : $(rid);
    },

    __$$: -1,
    __$$_x: true,


    /**
     * evo成员取值入栈。
     * 目标：无。
     * 特权：是，判断取值。
     * 如果name未定义或为null，取evo自身入栈。
     * 注意：如果明确取.data属性，会取暂存区全部成员（清空）。
     * @param  {Stack} stack 数据栈
     * @param  {String|Number} name 成员名称或代码
     * @return {Element|Collector|Value}
     */
    evo( evo, stack, name ) {
        name = evoIndex[name];

        if ( name == null ) {
            return evo;
        }
        return name == 10 ? stack.data(0) : evo[name];
    },

    __evo_x: true,


    /**
     * 从事件对象上取值。
     * 目标：无。
     * name可用空格分隔多个名称（返回一个值数组）。
     * 无实参调用取事件对象自身入栈。
     * @param  {String} name 事件属性名（序列）
     * @return {Value|[Value]} 值或值集
     */
    ev( evo, name ) {
        return name == null ?
            evo.event : namesValue( name, evo.event );
    },

    __ev: null,


    /**
     * 获取模板节点。
     * 目标：无。
     * 特权：是，自行取值。
     * 如果实参name为空（null|undefined），自行取值1项为名称。
     * 注意克隆时是每次都克隆（应当很少使用）。
     * 注记：
     * 因为返回Promise实例（异步），故通常用在调用链后段。
     * @param  {Stack} stack 数据栈
     * @param  {String|null} name 模板名，可选
     * @param  {Boolean} clone 是否克隆，可选
     * @return {Promise}
     */
    tpl( evo, stack, name, clone ) {
        if ( name == null ) {
            name = stack.data(1);
        }
        return Templater[clone ? 'get' : 'tpl'](name);
    },

    __tpl_x: true,



    // 控制类
    //===============================================
    // 注记：
    // 返回Promise.reject()不会异步化正常执行流。


    /**
     * 通过性检查。
     * 目标：暂存区/栈顶1项。
     * 检查目标值是否为真（非假）或是否与val相等（===）。
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
     * 停止事件默认行为。
     * 目标：暂存区1项。
     * 如果目标非空，则真值停止，否则无条件停止。
     * back为执行之后的返回值（入栈），如果未执行则忽略。
     * 注：该指令必须在异步指令之前使用。
     * @param  {Value} back 执行后结果，可选
     * @return {void|back}
     */
    avoid( evo, back ) {
        let _v = this.data;

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
        let _v = this.data;

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
        let _v = this.data;

        if ( _v === undefined || _v ) {
            evo.event.stopImmediatePropagation();
            return back;
        }
    },

    __stopAll: -1,


    /**
     * 流程终止。
     * 目标：暂存区/栈顶1项，可选。
     * 特权：是，判断取值。
     * 如果传递val有值，则与目标比较，真值终止。
     * 否则无条件终止。
     * @param  {Stack} stack 数据栈
     * @param  {Value} val 对比值，可选
     * @return {void}
     */
    end( evo, stack, val ) {
        if ( val === undefined || val === stack.data(1) ) {
            return Promise.reject();
        }
    },

    __end_x: true,



    // 暂存区赋值。
    // 目标：无。
    // 特权：是，自行操作数据栈。
    // @return {void}
    //===============================================


    /**
     * 弹出栈顶n项。
     * 弹出n项压入暂存区，无实参调用视为1项。
     * @param {Stack} stack 数据栈
     * @param {Number} n 弹出的条目数
     */
    pop( evo, stack, n = 1 ) {
        n == 1 ? stack.pop() : stack.pops( n );
    },

    __pop_x: true,


    /**
     * 取出栈底n项。
     * 移除栈底n项压入暂存区，无实参调用视为1项。
     * @param {Stack} stack 数据栈
     * @param {Number} n 移除条目数
     */
    shift( evo, stack, n = 1 ) {
        n == 1 ? stack.shift() : stack.shifts( n );
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
        stack.index( ns );
    },

    __index_x: true,



    // 数据栈操作。
    //===============================================

    /**
     * 栈顶条目打包封装。
     * 取出栈顶的n项打包为一个数组入栈。
     * 目标：无。
     * 特权：是，自行操作数据栈。
     * 必然会返回一个数组，非法值返回一个空数组。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {[Value]}
     */
    pack( evo, stack, n ) {
        return n > 0 ? stack.dels(-n) : [];
    },

    __pack_x: true,


    /**
     * 任意区段打包。
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
     * 注：目标中的undefined值会被忽略。
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
     * 目标：无。
     * 特权：是，直接操作数据栈。
     * 如果count未指定，表示删除start之后全部。
     * 注：可能用于移除多余的初始传送数据。
     * @param  {Stack} stack 数据栈
     * @param  {Number} start 起始位置
     * @param  {Number} count 删除数量，可选
     * @return {void}
     */
    scrap( evo, stack, start, count ) {
        stack.dels( start, count );
    },

    __scrap_x: true,



    // 其它
    //===============================================

    /**
     * 空值指令。
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
     * 设置目标成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称。
     * 值为数组时，多个名称分别对应到数组成员，否则对应到单一值。
     * 注：会修改目标本身。
     * @param  {String} name 名称/序列
     * @param  {Value|[Value]} val 值或值集
     * @return {@data}
     */
    set( evo, name, val ) {
        let _ns = name.split(__reSpace);

        if ( _ns.length == 1 ) {
            evo.data[name] = val;
            return evo.data;
        }
        if ( !$.isArray(val) ) {
            val = new Array(_ns.length).fill(val);
        }
        return kvsObj( _ns, val, evo.data );
    },

    __set: 1,

};



//
// 运算层基础方法。
//
const _BaseOn = {

    // 类型转换
    // 目标：暂存区/栈顶1项。
    // 返回值而非该类型的对象。
    //===============================================

    /**
     * 转为整数（parseInt）。
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


    /**
     * 转化为正则表达式。
     * 如果提供了flag，肯定会返回一个新的正则对象。
     * 如果源本来就是一个正则对象，则原样返回。
     * @param  {String} flag 正则修饰符
     * @return {RegExp}
     */
    RE( evo, flag ) {
        return RegExp( evo.data, flag );
    },

    __RE: 1,


    /**
     * 转为布尔值（true|false）。
     * 假值：'', 0, false, null, undefined
     * 如果传递all为真，假值包含空对象（[], {}）。
     * @param  {Boolean} all 是否测试空对象/数组
     * @return {Boolean}
     */
    Bool( evo, all ) {
        return !!(all ? hasValue(evo.data) : evo.data);
    },

    __Bool: 1,


    /**
     * 转为字符串。
     * 可以选择性的添加前/后缀。
     * @param  {String} pre 前缀，可选
     * @param  {String} suf 后缀，可选
     * @return {String}
     */
    Str( evo, pre = '', suf = '' ) {
        return `${pre}${evo.data}${suf}`;
    },

    __Str: 1,


    /**
     * 转换为数组。
     * 类数组才会被转换为一个真正的数组。
     * 如果要封装为一个单成员数组，可传递wrap为真。
     * @data: {Value|LikeArray}
     * @param  {Boolean} wrap 简单封装，可选
     * @return {Array}
     */
    Arr( evo, wrap ) {
        return wrap ? Array.of( evo.data ) : Array.from( evo.data );
    },

    __Arr: 1,


    /**
     * 转换为普通对象。
     * 主要针对目标的entries接口，可用于Set/Map实例。
     * 如果目标不包含entries，返回Object()的简单封装。
     * @return {Object}
     */
    Obj( evo ) {
        if ( !$.isFunction(evo.data.entries) ) {
            return Object( evo.data );
        }
        return Object.fromEntries( evo.data.entries() );
    },

    __Obj: 1,



    // 简单值操作
    //===============================================

    /**
     * 直接数据入栈。
     * 目标：当前条目，可选。
     * 特权：是，自行入栈。
     * 多个实参会自动展开入栈，数组实参视为单个值。
     * 如果目标有值，会附加（作为单一值）在实参序列之后。
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
     * 设置/获取全局变量。
     * 目标：当前条目，可选。
     * 目标非空或its有值时为设置，否则为取值入栈。
     * 设置时：
     * - 目标为空：取its本身为值（必然存在）。
     * - 目标非空：取目标的its属性值或目标本身（its未定义时）。
     * its支持空格分隔多个名称指定目标属性。
     * @param  {String} name 键名
     * @param  {Value|String} its 存储值或成员名，可选
     * @return {Value|void}
     */
    env( evo, name, its ) {
        let _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return Globals.get(name);
        }
        Globals.set( name, objectItem(_o, its) );
    },

    __env: 0,


    /**
     * 设置/取值浏览器会话数据。
     * 目标为空且its未定义时为取值入栈，否则为设置。
     * 目标：当前条目，可选。
     * 传递its为null可清除name项的值。
     * 传递name为null，可清除整个Storage存储（小心）。
     * 注：存储的值会被转换为字符串。
     * @param  {String} name 存储键名
     * @param  {Value|String} its 存储值或成员名，可选
     * @return {Value|void}
     */
    sess( evo, name, its ) {
        let _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return window.sessionStorage.getItem(name);
        }
        storage( window.sessionStorage, name, its, _o );
    },

    __sess: 0,


    /**
     * 设置/取值浏览器本地数据。
     * 目标：当前条目，可选。
     * 说明：参考sess指令。
     * @param  {String} name 存储键名
     * @param  {Value|String} its 存储值或成员名，可选
     * @return {Value|void}
     */
    local( evo, name, its ) {
        let _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return window.localStorage.getItem(name);
        }
        storage( window.localStorage, name, its, _o );
    },

    __local: 0,


    /**
     * 从目标上取值入栈。
     * 目标：当前条目/栈顶1项。
     * 特权：是，自行入栈。
     * name支持空格分隔的多个名称，此时值为一个数组。
     * 多个名称实参取值会自动展开入栈。
     * @data: Object => Value|[Value]
     * @param  {Stack} stack 数据栈
     * @param  {...String} names 属性名序列
     * @return {void} 自行入栈
     */
    get( evo, stack, ...names ) {
        stack.push(
            ...names.map( n => namesValue(n, evo.data) )
        );
    },

    __get: 1,
    __get_x: true,


    /**
     * 调用目标的方法执行。
     * 目标：当前条目/栈顶1项。
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {Value} 方法调用的返回值
     */
    call( evo, meth, ...rest ) {
        return evo.data[meth]( ...rest );
    },

    __call: 1,


    /**
     * 条件赋值。
     * 目标：当前条目/栈顶1项。
     * 如果目标值为真（广义），val入栈，否则入栈elseval。
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
     * 目标：当前条目/栈顶1项。
     * 目标与实参一一相等（===）比较，结果入栈。
     * 这是$switch指令的先期执行。
     * @param  {...Value} vals 实参序列
     * @return {Boolean} 结果集
     */
    $case( evo, ...vals ) {
        return vals.map( v => v === evo.data );
    },

    __$case: 1,


    /**
     * SWITCH分支判断。
     * 目标：当前条目/栈顶1项。
     * 取栈顶通常是$case执行的结果（一个数组），
     * 测试集合成员值是否为真，真值返回相同下标实参值入栈。
     * 注：
     * 仅取首个真值对应的实参值入栈。
     * 目标集大小通常与实参序列长度相同，但容许超出（被简单忽略）。
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



    // 集合操作。
    //===============================================

    /**
     * 创建预填充值集合。
     * 目标：当前条目，可选。
     * 如果目标有值，会合并到实参序列之后（数组会被解构）。
     * 最后一个值用于剩余重复填充。
     * @param  {Number} size 集合大小
     * @param  {...Value} vals 填充值序列，可选
     * @return {[Value]}
     */
    array( evo, size, ...vals ) {
        if ( evo.data !== undefined ) {
            vals = vals.concat(evo.data);
        }
        let _i = vals.length,
            _v = vals[ _i-1 ];

        vals.length = size;
        return _i < size ? vals.fill(_v, _i) : vals;
    },

    __array: 0,


    /**
     * 构造键数组。
     * 主要为调用目标对象的.keys()接口。
     * 也适用于普通对象。
     * @data: {Array|Collector|Map|Set|Object}
     * @return {[Value]}
     */
    keys( evo ) {
        if ( $.isFunction(evo.data.keys) ) {
            return [...evo.data.keys()];
        }
        return Object.keys( evo.data );
    },

    __keys: 1,


    /**
     * 构造值数组。
     * 主要为调用目标对象的.values()接口。
     * 也适用于普通对象。
     * @data: {Array|Collector|Map|Set|Object}
     * @return {[Value]}
     */
    values( evo ) {
        if ( $.isFunction(evo.data.values) ) {
             return [...evo.data.values()];
        }
        return Object.values(evo.data);
    },

    __values: 1,


    /**
     * 连接数组各成员。
     * @param  {String} chr 连接字符串
     * @return {String}
     */
    join( evo, chr ) {
        return evo.data.join( chr );
    },

    __join: 1,


    /**
     * 集合串接。
     * 目标：当前条目/栈顶1-2项。
     * 特权：是，灵活取栈。
     * 如果实参非空，取栈顶1项（合并到的目标集）。
     * 如果实参为空，取栈顶2项：[目标集, ...合并序列]。
     * 注意：
     * 取栈顶2项时，第二个成员会展开后再连接（即最终有2级展开）。
     * 例：
     * [].concat('abcd') => ['abcd']
     * [].concat(...'abcd') => ['a', 'b', 'c', 'd'] // 2级
     * [].concat(...['abcd']) => ['abcd'] // 2级
     * [].concat(...[['abcd']])  // 同上
     *
     * @param  {...Value|Array} vals 值或数组
     * @return {[Value]}
     */
    concat( evo, stack, ...vals ) {
        let [list, args] = vals.length ?
            [stack.data(1), vals] : stack.data(2);

        return list.concat( ...args );
    },

    __concat_x: true,


    /**
     * 切分字符串为数组。
     * 支持4子节Unicode字符空白切分。
     * @param  {String} sep 分隔符
     * @return {[String]}
     */
    split( evo, sep ) {
        return sep ? evo.data.split( sep ) : [...evo.data];
    },

    __split: 1,



    // 简单运算
    // 支持前一个操作数是数组的情况（取成员计算）。
    //===============================================

    /**
     * 加运算。
     * 同时适用数值和字符串。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * 注记：Collector的同名方法没有被使用。
     * @param  {Stack} stack 数据栈
     * @param  {Number|String} val 第二个操作数，可选
     * @return {Number|String|[Number|String]}
     */
    add( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v+y ) : x+y;
    },

    __add_x: true,


    /**
     * 减运算。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {Number|[Number]}
     */
    sub( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v-y ) : x-y;
    },

    __sub_x: true,


    /**
     * 乘运算。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {Number|[Number]}
     */
    mul( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v*y ) : x*y;
    },

    __mul_x: true,


    /**
     * 除运算。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {Number|[Number]}
     */
    div( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v/y ) : x/y;
    },

    __div_x: true,


    /**
     * 模运算。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {Number|[Number]}
     */
    mod( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v%y ) : x%y;
    },

    __mod_x: true,


    /**
     * 幂运算。
     * 目标：当前条目/栈顶1-2项
     * 特权：是，灵活取栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {Number|[Number]}
     */
    pow( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return $.isArray(x) ? x.map( v => v**y ) : x**y;
    },

    __pow_x: true,


    /**
     * 数值取负。
     * 目标：当前条目/栈顶1项。
     * @return {Number|[Number]}
     */
    neg( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => -v ) : -x;
    },

    __neg: 1,


    /**
     * 逻辑取反。
     * 目标：当前条目/栈顶1项。
     * @return {Boolean|[Boolean]}
     */
    vnot( evo ) {
        let x = evo.data;
        return $.isArray(x) ? x.map( v => !v ) : !x;
    },

    __vnot: 1,


    /**
     * 除并求余。
     * 目标：当前条目/栈顶2项
     * 特权：是，灵活取栈。
     * 注：不支持首个参数为数组。
     * @param  {Stack} stack 数据栈
     * @param  {Number} val 第二个操作数，可选
     * @return {[Number, Number]} [商数, 余数]
     */
    divmod( evo, stack, val ) {
        let [x, y] = stackArg2(stack, val);
        return [ Math.floor(x/y), x%y ];
    },

    __divmod_x: true,



    // 简单克隆
    //===============================================

    /**
     * 栈顶复制。
     * 复制栈顶n项并展开入栈。
     * 目标：可选当前条目作为复制数量。
     * 特权：是，灵活取栈&自行入栈。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {void}
     */
    dup( evo, stack, n = 1 ) {
        if ( evo.data !== undefined ) {
            n = +evo.data;
        }
        if ( n > 0 ) stack.push( ...stack.tops(n) );
    },

    __dup: 0,
    __dup_x: true,


    /**
     * 元素克隆。
     * 可同时克隆元素上绑定的事件处理器。
     * 目标：当前条目/栈顶1项。
     * @data: Element|[Element]|Collector
     * @param  {Boolean} event 包含事件处理器
     * @param  {Boolean} deep 深层克隆（含子元素）
     * @param  {Boolean} eventdeep 包含子元素的事件处理器
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
     * 对象克隆赋值。
     * 目标：当前条目/栈顶1项。
     * 数据源对象自身的属性/值赋值到接收对象。
     * 仅包含对象自身（非继承）的可枚举属性。
     * 空名称可匹配全部可枚举属性名（含Symbol）。
     * @data: Object => Object
     * @param  {Object} to 接收对象
     * @param  {String} names 取名称序列，可选
     * @return {Object}
     */
    assign( evo, to, names ) {
        if ( !names ) {
            return Object.assign(to, evo.data);
        }
        let _ns = new Set( names.split(__reSpace) );

        return $.assign( to, evo.data, (v, n) => _ns.has(n) && [v] );
    },

    __assign: 1,


    /**
     * 集合映射聚集。
     * 目标：当前条目/栈顶1项。
     * 把集合（数组|字符串）成员映射到一个键值对对象。
     * 集合成员按名称顺序下标被提取，不足部分值为undefined。
     * names支持空格分隔的多个名称。
     * @data: [Value] => Object
     * @param  {String} names 属性名序列
     * @return {Object}
     */
    gather( evo, names ) {
        return kvsObj( names.split(__reSpace), evo.data );
    },

    __merge: 1,



    // 比较运算。
    // 目标：当前条目/栈顶1-2项。
    // 特权：是，灵活取栈。
    // 注：模板传递的实参为比较操作的第二个操作数。
    // @return {Boolean}
    //===============================================

    /**
     * 相等比较（===）。
     */
    equal( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 === v2;
    },

    __equal_x: true,


    /**
     * 不相等比较（!==）。
     */
    nequal( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 !== v2;
    },

    __nequal_x: true,


    /**
     * 小于比较。
     */
    lt( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 < v2;
    },

    __lt_x: true,


    /**
     * 小于等于比较。
     */
    lte( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 <= v2;
    },

    __lte_x: true,


    /**
     * 大于比较。
     */
    gt( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 > v2;
    },

    __gt_x: true,


    /**
     * 大于等于比较。
     */
    gte( evo, stack, val ) {
        let [v1, v2] = stackArg2(stack, val);
        return v1 >= v2;
    },

    __gte_x: true,


    /**
     * 数组相等比较。
     * 目标：当前条目/栈顶1-2项。
     * 如果传递了a1，则取当前条目或栈顶1项。
     * 如果未传递a1，则取当前条目或栈顶2项。
     * @param {Stack} stack 数据栈
     * @param {[Value]} arr 对比数组
     */
    arrayEqual( evo, stack, arr ) {
        let [a1, a2] = stackArg2(stack, arr);
        return arrayEqual( a1, a2 );
    },

    __arrayEqual_x: true,


    /**
     * 测试是否包含。
     * 目标：当前条目/栈顶2项。
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
     * 目标是否在实参序列中。
     * 目标：当前条目/栈顶1项。
     * 注：与其中任一值相等。
     * @param {...Value} vals 实参序列
     */
    include( evo, ...vals ) {
        return vals.includes( evo.data );
    },

    __include: 1,


    /**
     * 是否都为真。
     * 目标：当前条目/栈顶2项。
     * 注：真假值为广义。
     */
    both( evo ) {
        return evo.data[0] && evo.data[1];
    },

    __both: 2,


    /**
     * 是否任一为真。
     * 目标：当前条目/栈顶2项。
     * 注：真假值为广义。
     */
    either( evo ) {
        return evo.data[0] || evo.data[1];
    },

    __either: 2,


    /**
     * 是否每一项都为真。
     * 目标：当前条目/栈顶1项。
     * 测试函数可选，默认真值（广义）测试。
     * 注：
     * 目标不仅适用于数组，也可用于其它集合（如Object）。
     * 测试函数接口：function(value, key, obj): Boolean
     * @param {Function|undefined} test 测试函数，可选
     */
    every( evo, test ) {
        return $.every(
                evo.data,
                test === undefined ? v => v : test,
                null
            );
    },

    __every: 1,


    /**
     * 是否有任一项为真。
     * 目标：当前条目/栈顶1项。
     * 说明参考every。
     * @param {Function|undefined} test 测试函数，可选
     */
    some( evo, test ) {
        return $.some(
                evo.data,
                test === undefined ? v => v : test,
                null
            );
    },

    __some: 1,


    /**
     * 目标对象内成员测试。
     * 目标：当前条目/栈顶1项。
     * name为属性名，支持空格分隔的多个属性名指定。
     * val为对比值，用于与目标属性值做全等比较。可选，默认为存在性测试。
     * 如果name为多名称指定，val可以是一个数组（一一对应）。
     * 当所有的检查/比较都为真时，返回true。
     * 例：
     * - inside('shift ctrl', true) // 是否shift和ctrl成员值为真。
     * - inside('selector') // 是否selector成员在目标内。
     * - inside('AA BB', [1, 2]) // 是否AA成员值为1且BB成员值为2。
     * 注意：
     * 测试对比值只能是简单类型（不支持对象或数组等）。
     *
     * @param {String} name 成员名称（集）
     * @param {Value|[Value]} val 对比值或值集
     */
    inside( evo, name, val ) {
        if ( !__reSpace.test(name) ) {
            return existValue(evo.data, name, val);
        }
        return name.split(__reSpace).every( existHandle(evo.data, val) );
    },

    __inside: 1,



    // 增强运算
    //===============================================

    /**
     * 创建函数入栈。
     * 目标：当前条目/栈顶1项。
     * 取目标为函数体表达式（无需return）构造函数。
     * 可以传递参数名序列。
     * @param  {...String} argn 参数名序列
     * @return {Function}
     */
    func( evo, ...argn ) {
        return new Function(
                ...argn,
                `return ${evo.data};`
            );
    },

    __func: 1,


    /**
     * 函数执行。
     * 把目标视为函数，传递实参执行并返回结果。
     * 目标：当前条目/栈顶1项。
     * 注：通常配合func使用。
     * @param  {...Value} args 实参序列
     * @return {Value}
     */
    exec( evo, ...args ) {
        if ( $.isFunction(evo.data) ) {
            return evo.data( ...args );
        }
        throw new Error( `${evo.data} is not a function.` );
    },

    __exec: 1,


    /**
     * 计算JS表达式。
     * 目标：当前条目/栈顶1项。
     * 目标为JS表达式，通过vn指定变量名（单个，默认$）。
     * 例：push('($[0] + $[1]) * $[2]') calc
     * 注：
     * 这是func和exec的合并版，但仅支持单个参数定义。
     *
     * @param  {String} vn 变量名，可选
     * @param  {...Value} args 实参序列
     * @return {Value}
     */
    calc( evo, vn = '$', ...args ) {
        return new Function( vn, `return ${evo.data};` )(...args);
    },

    __calc: 1,

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 对象成员取值。
 * name可能由空格分隔为多个名称。
 * 单名称时返回值，多个名称时返回值集。
 * @param  {String} name 名称/序列
 * @param  {Object} obj 取值对象
 * @return {Value|[Value]} 值（集）
 */
function namesValue( name, obj ) {
    return __reSpace.test(name) ?
        name.split(__reSpace).map( n => obj[n] ) : obj[name];
}


/**
 * 构造名值对对象。
 * @param  {[String]} names 名称序列
 * @param  {[Value]} val 值集
 * @return {Object}
 */
function kvsObj( names, val, obj = {} ) {
    return names.reduce( (o, k, i) => (o[k] = val[i], o), obj );
}


/**
 * 获取对象/成员/值。
 * - 如果成员名未定义，返回容器对象自身。
 * - 如果容器对象未定义，成员名视为值返回。
 * - 如果两者都定义，返回容器内的成员值。
 * @param  {Object} obj 容器对象
 * @param  {Value|String} its 目标值或成员名
 * @return {Value|[Value]}
 */
function objectItem( obj, its ) {
    if ( obj === undefined ) {
        return its;
    }
    if ( its === undefined ) {
        return obj;
    }
    return namesValue( its, obj );
}


/**
 * 设置存储器（sessionStorage|localStorage）。
 * @param {Storage} buf 存储器
 * @param {String} name 存储键
 * @param {Value|String} its 存储值或成员名
 * @param {undefined|Value|Object} 当前条目（evo.data）
 */
function storage( buf, name, its, obj ) {
    if ( name === null) {
        return buf.clear();
    }
    if ( its === null ) {
        return buf.removeItem( name );
    }
    buf.setItem( name, objectItem(obj, its) );
}


/**
 * 是否为有值对象（非空）。
 * 注：空数组或空对象。
 * @param  {Object|Array} obj 测试对象
 * @return {Boolean|obj}
 */
function hasValue( obj ) {
    return typeof obj == 'object' ? obj && Object.keys(obj).length > 0 : obj;
}


/**
 * 数据栈实参取值。
 * 如果实参未传递，则取数据栈2项，否则取1项。
 * @param  {Stack} stack 数据栈
 * @param  {Value} val 模板参数，可选
 * @return {Array2} 实参值对
 */
function stackArg2( stack, val ) {
    return val === undefined ?
        stack.data(2) : [ stack.data(1), val ];
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
 * 获取剪除段最后一个指令。
 * 即：衔接段的第一个指令单元。
 * @param  {Cell} self 当前指令单元
 * @param  {Symbol} key 计数存储键
 * @param  {Number} n 指令数量
 * @return {Cell|null} 待衔接的指令单元
 */
function lastCell( self, key, n ) {
    let cell = self.next;

    if ( --self[key] === 0 ) {
        while ( n-- && cell ) cell = cell.next;
    }
    return cell;
}



//
// 特殊指令（Base）。
///////////////////////////////////////////////////////////////////////////////


const
    // 单次剪除标记。
    __PRUNE = Symbol('prune-count'),

    // 持续剪除标记。
    __PRUNES = Symbol('prunes-count'),

    __ENTRY = Symbol('entry-loop');


/**
 * 剪除后端跟随指令（单次）。
 * 目标：无。
 * 允许后端指令执行cnt次，之后再移除。
 * 可以指定移除的指令的数量n，-1表示后续全部指令。
 * cnt传递负值无效果（剪除失效），0值与1相同。
 * @param  {Number} cnt 执行次数。可选，默认1
 * @param  {Number} n 移除的指令数.可选，默认1
 * @return {void}
 */
function prune( evo, cnt, n = 1 ) {
    if ( !this.next || this[__PRUNE] <= 0 ) {
        return;
    }
    if ( this[__PRUNE] === undefined ) {
        this[__PRUNE] = +cnt || 1;
    }
    this.next = lastCell( this, __PRUNE, n );
}

// prune[EXTENT] = null;


/**
 * 剪除后端跟随指令（持续）。
 * 目标：无。
 * 允许后端指令执行cnt次，之后再移除。
 * 注：每次剪除一个直到链末尾。cnt值说明同上（prune）。
 * @param  {Number} cnt 执行次数
 * @return {void}
 */
function prunes( evo, cnt ) {
    if ( !this.next ) return;

    if ( this[__PRUNES] <= 0 ) {
        delete this[__PRUNES];
    }
    if ( this[__PRUNES] === undefined ) {
        this[__PRUNES] = +cnt || 1;
    }
    this.next = lastCell( this, __PRUNES, 1 );
}

// prunes[EXTENT] = null;


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
 * @param  {false} keep 流程保持，传递false中断执行流
 * @return {void|reject}
 */
function debug( evo, stack, keep ) {
    let _stack = {
            done: stack._done,
            data: stack._item,
            heap: stack._buf.slice(),
        };

    window.console.info({
        evo,
        cell: this,
        stack: _stack,
    });
    if ( keep === false ) return Promise.reject();
}

debug[ACCESS] = true;



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


// 基础集（On/To共享）。
const Base = $.assign( {}, _Base, bindMethod );


// 特殊控制。
// 无预绑定处理。this:{Cell}
Base.prune  = prune;
Base.prunes = prunes;
Base.entry  = entry;
Base.loop   = loop;
Base.debug  = debug;


// 基础集II（On域）。
const BaseOn = $.assign( {}, _BaseOn, bindMethod );

// 合并。
// 注：不用原型继承（效率）。
Object.assign( BaseOn, Base );


export { Base, BaseOn };
