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
import { bindMethod, EXTENT, ACCESS, Templater } from "../config.js";


const
    $ = window.$,

    // evo成员名数值键。
    evoIndex = {
        0:  'event',        // 原生事件对象（注：ev指令可直接获取）
        1:  'origin',       // 事件起点元素（event.target）
        2:  'current',      // 触发事件的当前元素（event.currentTarget|matched）
        3:  'delegate',     // 事件相关联元素（event.relatedTarget）
        4:  'related',      // 委托绑定的元素（event.currentTarget）
        5:  'selector',     // 委托匹配选择器（for match）]
        10: 'data',         // 自动获取的流程数据
        11: 'entry',        // 中段入口（迭代重入）
        12: 'targets',      // To目标元素/集，向后延续
    },

    // 空白分隔符。
    __reSpace = /\s+/;



const
    // 全局变量空间。
    Globals     = new Map(),

    // 关联数据空间。
    // Element: Map{ String: Value }
    DataStore   = new WeakMap();



//
// 全局顶层方法。
// 适用 On/To 两个域。
//
const _Base = {

    // 基础集。
    //===========================================

    /**
     * 单元素检索入栈。
     * 目标：当前条目可选。
     * 特权：是，灵活取栈。
     * 如果实参为空，会自动取栈（无需前阶pop）。
     * 如果实参非空，前阶pop可定义检索起点元素。
     * rid: {
     *      undefined  以当前条目为rid，事件当前元素为起点。
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
            rid = stack.data(1);
        } else {
            _beg = evo.data || _beg;
        }
        return Util.find( rid, _beg, true );
    },

    __$: 0,
    __$_x: true,


    /**
     * 多元素检索入栈。
     * 目标：当前条目可选。
     * 特权：是，灵活取栈。
     * rid: {
     *      undefined  同上，但如果目标非字符串则为Collector封装。
     *      String     同上。
     *      Value      Collector封装，支持单值和数组。
     * }
     * 注：如果实参传递非字符串，前阶pop的值会被丢弃。
     * @param  {Object} evo 事件关联对象
     * @param  {Stack} stack 数据栈
     * @param  {String|Value} rid 相对ID或待封装值
     * @return {Collector}
     */
    $$( evo, stack, rid ) {
        let _beg = evo.current;

        if ( rid == null ) {
            rid = stack.data(1);
        } else {
            _beg = evo.data || _beg;
        }
        return typeof rid == 'string' ? Util.find(rid, _beg) : $(rid);
    },

    __$$: 0,
    __$$_x: true,


    /**
     * evo成员取值入栈。
     * 如果name未定义或为null，取evo自身入栈。
     * 目标：当前条目，可选。
     * @param  {String|Number} name 成员名称或代码
     * @return {Element|Collector|Value}
     */
    evo( evo, name ) {
        if ( name == null ) {
            return evo;
        }
        return evo[ evoIndex[name] || name ];
    },

    __evo: 0,


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
     * 特权：是，自行取栈。
     * 如果实参name为空（null|undefined），取栈顶1项为名称。
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
     * 目标：当前条目/栈顶1项。
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
        if ( !_v ) return new Promise.reject();
    },

    __pass: 1,


    /**
     * 停止事件默认行为。
     * 目标：当前条目，可选。
     * 如果当前条目非空，则真值停止，否则无条件停止。
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

    __avoid: 0,


    /**
     * 停止事件冒泡。
     * 目标：当前条目，可选。
     * 如果当前条目非空，则真值执行，否则无条件执行。
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

    __stop: 0,


    /**
     * 停止事件冒泡并阻止本事件其它处理器的执行。
     * 目标：当前条目，可选。
     * 如果当前条目非空，则真值执行，否则无条件执行。
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

    __stopAll: 0,


    /**
     * 流程终止。
     * 目标：当前条目，可选。
     * 如果目标非空，则真值终止或与val比较真则终止。
     * 目标无值时无条件终止。
     * 注：val仅在目标有值时才有意义。
     * @return {void}
     */
    end( evo, val ) {
        if ( evo.data === val ||
            (val === undefined && evo.data) ) {
            return new Promise.reject();
        }
    },

    __end: 0,



    // 暂存区赋值。
    // 目标：赋值非取值，无。
    // 特权：是。需要直接操作数据栈。
    // @return {void}
    //===============================================


    /**
     * 弹出栈顶n项。
     * 无实参调用弹出单项赋值，否则构造为一个数组赋值。
     * 即：pop() 和 pop(1) 是不一样的。
     * @data: Value|[Value]
     * pop(0) 有效，构造一个空集赋值。
     * @param {Stack} stack 数据栈
     * @param {Number} n 弹出的条目数
     */
    pop( evo, stack, n ) {
        n == null ? stack.pop() : stack.pops(n);
    },

    __pop_x: true,


    /**
     * 复制（浅）数据栈区段。
     * 两个位置下标支持负值从末尾倒算。
     * @data: [Value] 值集
     * @param {Stack} stack 数据栈
     * @param {Number} beg 起始位置，可选
     * @param {Number} end 结束位置（不含），可选
     */
    slice( evo, stack, beg, end ) {
        stack.slice( beg, end );
    },

    __slice_x: true,


    /**
     * 引用数据栈目标值。
     * 下标位置支持负值指定。
     * @data: Value|[Value]
     * @param {Stack} stack 数据栈
     * @param {...Number} ns 位置下标序列
     */
    index( evo, stack, ...ns ) {
        ns.length == 1 ? stack.index ( ns[0] ) : stack.indexes( ...ns );
    },

    __index_x: true,


    /**
     * 取出栈底n项。
     * 无实参调用移除单项赋值，否则构造为一个数组赋值。
     * 即：shift() 和 shift(1) 是不一样的。
     * @data: Value|[Value]
     * @param {Stack} stack 数据栈
     * @param {Number} n 移除条目数
     */
    shift( evo, stack, n ) {
        n == null ? stack.shift() : stack.shifts(n);
    },

    __shift_x: true,


    /**
     * 取出目标位置条目。
     * 位置下标支持负数倒数。
     * @data: Value 单值
     * @param {Stack} stack 数据栈
     * @param {Number} i 位置下标
     */
    pick( evo, stack, i ) {
        stack.pick( i );
    },

    __pick_x: true,


    /**
     * 取出目标区段条目。
     * 起始下标支持负数从末尾倒算。
     * @data: [Value] 值集
     * @param {Stack} stack 数据栈
     * @param {Number} start 起始位置
     * @param {Number} count 移除数量
     */
    splice( evo, stack, start, count ) {
        stack.splice( start, count );
    },

    __splice_x: true,



    // 数据栈操作。
    //===============================================

    /**
     * 打包条目。
     * 栈顶的n项会被取出后打包为一个数组。
     * 目标：当前条目，可选。
     * 特权：是，自主操作数据栈。
     * 如果当前条目有值（数组|字符串），取它的末尾n个单元打包。
     * 例：
     * pack(3)      // 同 pop(3), push 序列
     * pop(3) pack  // 同上
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {[Value]}
     */
    pack( evo, stack, n ) {
        return evo.data === undefined ?
            stack.dels(-n) : evo.data.slice(-n);
    },

    __pack: 0,
    __pack_x: true,


    /**
     * 将条目展开入栈。
     * 目标：当前条目/栈顶1项。
     * 特权：是，自主操作数据栈。
     * 如果目标不是数组则简单返回。
     * @param {Stack} stack 数据栈
     */
    spread( evo, stack ) {
        if ( !$.isArray(evo.data) ) {
            return evo.data;
        }
        stack.push( ...evo.data );
    },

    __spread: 1,
    __spread_x: true,


    /**
     * 删除数据栈任意区段条目。
     * 目标：无。
     * 特权：是，直接操作数据栈。
     * 注意：
     * 这只是纯粹的删除功能，应该不常用。
     * 如果count未指定，表示删除start之后全部。
     * @param  {Stack} stack 数据栈
     * @param  {Number} start 起始位置
     * @param  {Number} count 删除数量，可选
     * @return {void}
     */
    del( evo, stack, start, count ) {
        stack.dels( start, count );
    },

    __del_x: true,



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
     * 目标：当前条目/栈顶1项。
     * name支持空格分隔的多个名称。
     * 多个名称对应值为数组时，是一一对应设置，否则单值对应到多个名称。
     * 会修改目标对象本身。
     * 操作：Value|[Value] => Object
     * @param  {String} name 名称（序列）
     * @param  {Value|[Value]} val 值或值集
     * @return {@data}
     */
    set( evo, name, val ) {
        let _ns = name.split(__reSpace);

        if ( _ns.length == 1 ) {
            return evo.data[name] = val, evo.data;
        }
        if ( !$.isArray(val) ) {
            val = new Array(_ns.length).fill(val);
        }
        return namesObj( _ns, val, evo.data );
    },

    __set: 1,

};



//
// 运算层基础方法。
//
const _BaseOn = {

    // 类型转换
    // 目标：当前条目/栈顶1项。
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
     * @param  {Boolean} all 是否测试空对象/数组
     * @return {Boolean}
     */
    Bool( evo, all ) {
        return !!(all ? isEmpty(evo.data) : evo.data);
    },

    __Bool: 1,


    /**
     * 转为字符串。
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
     * 如果要强制打包目标为一个单成员数组，可传递one为真。
     * @data: {Value|LikeArray}
     * @param  {Boolean} one 单成员转换，可选
     * @return {Array}
     */
    Arr( evo, one ) {
        return one ? Array.of( evo.data ) : Array.from( evo.data );
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
     * 如果实参和目标都有值，则目标作为单一值附加在实参序列之后。
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
     * 目标非空或its有值时为设置，目标为空且its未定义时为取值入栈。
     * 设置时：
     * - 目标为空：取its本身为值（必然存在）。
     * - 目标非空：取目标的its属性值或目标本身（its未定义时）。
     * its也支持空格分隔多个键名，对应到目标各成员。
     * 如果name是多个名称序列，最后的取值目标应当是一个数组。
     * @param  {String} name 键名/序列
     * @param  {Value|String} its 存储值或成员名/序列，可选
     * @return {Value|[Value]|void}
     */
    env( evo, name, its ) {
        let _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return getItem( Globals, name );
        }
        setItem( Globals, name, objectItem(_o, its) );
    },

    __env: 0,


    /**
     * 关联数据存储/取出。
     * 目标：当前条目，可选。
     * 存储集对应到委托元素（evo.delegate），其它说明参考evn。
     * - 目标无值为取值，目标有值为存储。
     * - 目标有值且实参为空，则为取值，目标为名称。
     * - 目标有值且实参为null，则为设置，从目标[1]取名称。
     * @param  {String} name 键名/序列
     * @param  {Value|String} its 存储值或成员名/序列，可选
     * @return {Value|[Value]|void}
     */
    data( evo, name, its ) {
        let _m = getMap(DataStore, evo.delegate);

        if ( evo.data === undefined && its === undefined ) {
            return getItem( _m, name );
        }
        setItem( _m, name, objectItem(evo.data, its) );
    },

    __data: 0,


    $data( evo, name ) {
        //
    },

    __$data: 0,


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
     * @param  {String} sep 分隔符
     * @return {[String]}
     */
    split( evo, sep ) {
        return evo.data.split( sep );
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        let [x, y] = stackArgs(stack, val);
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
        return namesObj( names.split(__reSpace), evo.data );
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
        let [v1, v2] = stackArgs(stack, val);
        return v1 === v2;
    },

    __equal_x: true,


    /**
     * 不相等比较（!==）。
     */
    nequal( evo, stack, val ) {
        let [v1, v2] = stackArgs(stack, val);
        return v1 !== v2;
    },

    __nequal_x: true,


    /**
     * 小于比较。
     */
    lt( evo, stack, val ) {
        let [v1, v2] = stackArgs(stack, val);
        return v1 < v2;
    },

    __lt_x: true,


    /**
     * 小于等于比较。
     */
    lte( evo, stack, val ) {
        let [v1, v2] = stackArgs(stack, val);
        return v1 <= v2;
    },

    __lte_x: true,


    /**
     * 大于比较。
     */
    gt( evo, stack, val ) {
        let [v1, v2] = stackArgs(stack, val);
        return v1 > v2;
    },

    __gt_x: true,


    /**
     * 大于等于比较。
     */
    gte( evo, stack, val ) {
        let [v1, v2] = stackArgs(stack, val);
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
        let [a1, a2] = stackArgs(stack, arr);
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
 * 属性取值。
 * name可能由空格分隔为多个名称。
 * 单名称时返回值，多个名称时返回值集。
 * @param  {String} name 名称（序列）
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
function namesObj( names, val, obj = {} ) {
    return names.reduce( (o, k, i) => (o[k] = val[i], o), obj );
}


/**
 * 获取存储集。
 * 如果存储池中不存在目标键的存储集，会自动新建。
 * @param  {Map|WeakMap} pool 存储池
 * @param  {Object} key 存储键
 * @return {Map}
 */
function getMap( pool, key ) {
    let _map = pool.get(key);

    if ( !_map ) {
        pool.set( key, _map = new Map() );
    }
    return _map;
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
    if ( its === undefined ) {
        return obj;
    }
    if ( obj === undefined ) {
        return its;
    }
    return namesValue( its, obj );
}


/**
 * 获取关联数据条目。
 * 如果不存在关联条目，会返回undefined。
 * 单个名称时返回单条数据项，多个名称时返回一个数据项数组。
 * @param  {Map} map 存储容器
 * @param  {String} name 取值名称/序列
 * @return {Value|[Value]}
 */
function getItem( map, name ) {
    if ( !__reSpace.test(name) ) {
        return map.get(name);
    }
    return name.split(__reSpace).map( n => map.get(n) );
}


/**
 * 存储关联数据项。
 * 如果不存在元素的关联集合，会自动创建。
 * 如果为多个名称，存储值应当是一个集合/数组。
 * @param  {Map} map 存储容器
 * @param  {String} name 存储名/序列
 * @param  {Value|[Value]} val 存储值/集
 * @return {void}
 */
function setItem( map, name, val ) {
    if ( !__reSpace.test(name) ) {
        return map.set( name, val );
    }
    name.split(__reSpace)
    .forEach( (n, i) => map.set(n, val[i]) );
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
 * 是否为空对象。
 * 如果实参不是对象，原值原样返回。
 * 注：空数组或空对象。
 * @param  {Object|Array} obj 测试对象
 * @return {Boolean|obj}
 */
function isEmpty( obj ) {
    return typeof obj == 'object' ? Object.keys(obj).length == 0 : obj;
}


/**
 * 数据栈实参取值。
 * 如果实参未传递，则取数据栈2项，否则取1项。
 * @param  {Stack} stack 数据栈
 * @param  {Value} val 模板参数，可选
 * @return {Array2} 实参值对
 */
function stackArgs( stack, val ) {
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
 * 移除n个跟随指令。
 * @param  {Cell} cell 当前指令单元
 * @param  {Symbol} key 计数存储键
 * @param  {Number} cnt 初始计数定义
 * @param  {Number} n 指令数量
 * @return {Boolean} 是否已移除
 */
function pruneOne( cell, key, cnt, n ) {
    if ( cell[key] < 0 ) {
        return true;
    }
    if ( cell[key] == null ) {
        cell[key] = +cnt || 0;
    }
    if ( cell[key] == 0 ) {
        // 后阶移除
        cell.next = cellNext( cell, n );
    }
    return --cell[key], false;
}


/**
 * 获取指令链下阶指令。
 * 可指定需要跳跃的单元数。
 * @param {Cell} cell 指令单元
 * @param {Number} n 跳跃计数。
 */
function cellNext( cell, n ) {
    if ( n > 0 ) {
        while ( n-- && cell ) cell = cell.next;
    }
    return cell && cell.next;
}



//
// 特殊指令。
// 不预绑定处理，this: {Cell}
///////////////////////////////////////////////////////////////////////////////

const
    // 单次剪除属性。
    __PRUNE = Symbol('prune-count'),

    // 持续剪除属性。
    __PRUNES = Symbol('prunes-count'),

    // entry/animate标记属性。
    __REENTER = Symbol('reenter-count');


/**
 * 剪除后端跟随指令。
 * 允许后端指令执行cnt次，之后再移除。
 * 可以指定移除的指令的数量（n）。
 * 目标：无。
 * 注：cnt传递负值没有效果，传递0值立即移除。
 * @param  {Number} cnt 执行次数。可选，默认1
 * @param  {Number} n 移除的指令数.可选，默认1
 * @return {void}
 */
function prune( evo, cnt = 1, n = 1 ) {
    if ( this.next) {
        pruneOne( this, __PRUNE, cnt, n );
    }
}

// prune[EXTENT] = null;


/**
 * 剪除后端跟随指令（持续）。
 * 允许后端指令执行cnt次，之后再移除。
 * 目标：无。
 * 注：cnt传递负值没有效果，传递0值单次立即移除（同prune）。
 * @param  {Number} cnt 执行次数
 * @return {void}
 */
function prunes( evo, cnt = 1 ) {
    if ( !this.next ) return;

    if ( pruneOne(this, __PRUNES, cnt, 1) ) {
        delete this[__PRUNES];
        pruneOne( this, __PRUNES, cnt, 1 );
    }
}

// prunes[EXTENT] = null;


/**
 * 创建入口。
 * 创建一个方法，使得可以从该处开启执行流。
 * 目标：无。
 * 主要用于动画类场景：前阶段收集初始数据，后阶段循环迭代执行动画。
 * 使用：
 *      entry           // 模板中主动设置（前提）。
 *      reenter(...)    // 从entry下一指令开始执行。
 *      evo.entry(val)  // 指令/方法内使用。
 * 注：
 * 不作预绑定，this为当前指令单元（Cell）。
 * 一个执行流中只能有一个入口（多个时，后面的有效）。
 * @return {void}
 */
function entry( evo ) {
    // 初始标记。
    // 注记：执行流重启时复位。
    evo[__REENTER] = true;

    // 容错next无值。
    evo.entry = this.call.bind( this.next, evo );
}

// entry[EXTENT] = null;


/**
 * 重入流程。
 * 即：执行 entry 入口函数。
 * cnt 为迭代次数，负值表示无限。
 * val 为初次迭代传入 evo.entry() 的值（如果有，否则为当前条目）。
 * 每次重入会传入当前条目数据（如果有）。
 * 注：
 * 不作预绑定，this为当前指令单元（Cell）。
 *
 * @param  {Value} val 初始值
 * @param  {Number} cnt 迭代次数
 * @return {void}
 */
function reenter( evo, cnt, val ) {
    if ( evo[__REENTER] ) {
        // 初始覆盖。
        if ( val !== undefined ) {
            evo.data = val;
        }
        delete evo[__REENTER];
        this[__REENTER] = +cnt || 0;
    }
    if ( this[__REENTER] == 0 ) {
        return;
    }
    if ( this[__REENTER] > 0 ) {
        -- this[__REENTER];
    }
    requestAnimationFrame( () => evo.entry(evo.data) );
}

// 目标：当前条目，不自动取栈。
reenter[EXTENT] = 0;


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
// 避免预绑定处理。this: {Cell}
Base.prune = prune;
Base.prunes = prunes;
Base.entry = entry;
Base.reenter = reenter;
Base.debug = debug;


// 基础集II（On域）。
const BaseOn = $.assign( {}, _BaseOn, bindMethod );

// 合并。
// 注：不用原型继承（效率）。
Object.assign( BaseOn, Base );


export { Base, BaseOn };
