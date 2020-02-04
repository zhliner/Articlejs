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
import { bindMethod, EXTENT } from "../config.js";


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
    DataStore   = new WeakMap(),

    // 预定义调用链存储。
    // 与元素无关，因此便于实现处理器（调用链）的共享定义。
    // {String: Chain}
    __ChainPool = new Map(),

    // 调用链绑定记录。
    // 同一元素上相同的事件名/选择器不重复绑定。
    // Element: Map{
    //      chainHandle: Set{ String(evn+slr) }
    // }
    // 注：相同调用链可能应用到多个事件上。
    __BoundSets = new WeakMap();



//
// 全局模板存储。
//
let __TplStore = null;



//
// 全局顶层方法。
// 适用 On/By/To 三个域。
//
const _Base = {

    // 基础集
    //===============================================

    /**
     * 单元素检索入栈。
     * 目标：当前条目，可选。
     * rid: {
     *      String  以当前条目（如果有）或事件当前元素（ev.current）为起点。
     *      null|undefined  以当前条目为rid，事件当前元素为起点。
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
     * 目标：当前条目，可选。
     * rid: {
     *      String          同上。
     *      null|undefined  同上，但如果当前条目非字符串则简单$(..)封装。
     *      Value           Collector封装，支持单值和数组。
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
     * 多个实参取值会自动展开入栈。
     * 如果需要入栈一个属性值集合，name可用空格分隔多个名称。
     * 无实参调用取事件对象自身入栈。
     * 目标：无。
     * 特权：是。需要展开入栈。
     * @param  {Stack} stack 数据栈
     * @param  {...String} names 事件属性名
     * @return {void} 自操作入栈
     */
    ev( evo, stack, ...names ) {
        if ( names.length == 0 ) {
            return evo.event;
        }
        let _vs = names.map( name =>
            __reSpace.test(name) ? name.split(__reSpace).map( n => evo.event[n] ) : evo.event[name]
        );
        stack.push( ..._vs );
    },

    __ev_x: true,


    /**
     * 获取模板节点。
     * 目标：当前条目，条件取栈。
     * 特权：是。自行取栈。
     * 如果实参name为空（null|undefined），取当前条目为名称。
     * 注意克隆时是每次都克隆（应当很少使用）。
     * @param  {Stack} stack 数据栈
     * @param  {String} name 模板名，可选
     * @param  {Boolean} clone 是否克隆，可选
     * @return {Promise}
     */
    tpl( evo, stack, name, clone ) {
        if ( name == null ) {
            name = stack.data(1);
        }
        return __TplStore[clone ? 'get' : 'tpl'](name);
    },

    __tpl_x: true,



    // 控制类
    //===============================================

    /**
     * 通过性检查。
     * 目标：当前条目/栈顶1项。
     * 检查目标值是否为真（非假）或是否与val相等（===）。
     * 结果为假会中断执行流。
     * @param  {Value} val 对比值，可选
     * @return {Promise|void}
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
     * 结束流程。
     * 目标：当前条目，可选。
     * 如果当前条目非空，则比较或真值测试，真则终止。
     * 如果当前条目为空，val通常无值，无条件终止。
     * @return {void}
     */
    exit( evo, val ) {
        if ( evo.data === val ||
            (val === undefined && evo.data) ) {
            return new Promise.reject();
        }
    },

    __exit: 0,


    /**
     * 停止事件默认行为。
     * 目标：当前条目，可选。
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
     * 目标：当前条目，可选。
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
     * 目标：当前条目，可选。
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



    // 暂存区赋值
    // 目标：赋值非取值，无。
    // 特权：是。需要直接操作数据栈。
    // 注：简单调用Stack实例相应接口方法即可。
    // @return {void}
    //===============================================

    /**
     * 弹出栈顶n项。
     * 无实参调用弹出单项赋值，否则构造为一个数组赋值。
     * 即：pop() 和 pop(1) 是不一样的。
     * pop(0) 有效，构造一个空集赋值。
     * @param {Stack} stack 数据栈
     * @param {Number} n 弹出的条目数
     */
    pop( evo, stack, n ) {
        stack.pop( n );
    },

    __pop: null,
    __pop_x: true,


    /**
     * 复制（浅）数据栈区段。
     * 两个位置下标支持负值从末尾倒算。
     * @param {Stack} stack 数据栈
     * @param {Number} beg 起始位置，可选
     * @param {Number} end 结束位置（不含），可选
     */
    slice( evo, stack, beg, end ) {
        stack.slice( beg, end );
    },

    __slice: null,
    __slice_x: true,


    /**
     * 引用数据栈目标值。
     * 下标位置支持负值指定。
     * @param {Stack} stack 数据栈
     * @param {Number} n 位置下标
     */
    index( evo, stack, n ) {
        stack.index ( n );
    },

    __index: null,
    __index_x: true,


    /**
     * 引用数据栈多个位置值。
     * 仅支持简单的位置下标序列（非数组）。
     * 注：下标位置支持负值。
     * @param {Stack} stack 数据栈
     * @param {...Number} ns 位置下标序列
     */
    indexes( evo, stack, ...ns ) {
        stack.indexes( ...ns );
    },

    __indexes: null,
    __indexes_x: true,


    /**
     * 移除栈底n项。
     * 无实参调用移除单项赋值，否则构造为一个数组赋值。
     * 即：shift() 和 shift(1) 是不一样的。
     * @param {Stack} stack 数据栈
     * @param {Number} n 移除条目数
     */
    shift( evo, stack, n ) {
        stack.shift( n );
    },

    __shift: null,
    __shift_x: true,


    /**
     * 移除数据栈区段条目。
     * 起始下标支持负数从末尾倒算。
     * @param {Stack} stack 数据栈
     * @param {Number} start 起始位置
     * @param {Number} count 移除数量
     */
    splice( evo, stack, start, count ) {
        stack.splice( start, count );
    },

    __splice: null,
    __splice_x: true,


    /**
     * 移除数据栈目标位置条目。
     * 位置下标支持负数倒数。
     * @param {Stack} stack 数据栈
     * @param {Number} i 位置下标
     */
    pick( evo, stack, i ) {
        stack.pick( i );
    },

    __pick: null,
    __pick_x: true,



    // 事件处理。
    // 目标：当前条目/栈顶1项。
    // 流程数据：{Element|[Element]}
    // @return {void}
    //===============================================

    /**
     * 检索调用链并绑定事件。
     * 绑定的目标可能是一个元素集。
     * @param  {String} key 检索键（与存储时同名）
     * @param  {String} name 事件名。可选，默认即key
     * @param  {String} slr 委托选择器。可选，默认null
     * @return {void}
     */
    bind( evo, key, name, slr ) {
        let _els = evo.data;

        if ( $.isArray(_els) ) {
            return _els.forEach( e => bindChain(e, key, name, slr) );
        }
        bindChain( _els, key, name, slr );
    },

    __bind: 1,


    /**
     * 解绑目标元素（集）上的调用链绑定。
     * @param  {String} key 检索键（与存储时同名）
     * @param  {String} name 事件名。可选，默认即key
     * @param  {String} slr 委托选择器。可选，默认null
     * @return {void}
     */
    unbind( evo, key, name, slr ) {
        let _els = evo.data;

        if ( $.isArray(_els) ) {
            return _els.forEach( e => unbindChain(e, key, name, slr) );
        }
        unbindChain( _els, key, name, slr );
    },

    __unbind: 1,


    /**
     * 检索调用链并单次绑定。
     * @param  {String} key 检索键（与存储时同名）
     * @param  {String} name 事件名。可选，默认即key
     * @param  {String} slr 委托选择器。可选，默认null
     * @return {void}
     */
    once( evo, key, name, slr ) {
        let _els = evo.data;

        if ( $.isArray(_els) ) {
            return _els.forEach( e => onceBind(e, key, name, slr) );
        }
        onceBind( _els, key, name, slr );
    },

    __once: 1,



    // 其它
    //===============================================

    // 空指令。
    // 目标：无。
    // 包含清空暂存区的唯一功能。
    nil() {},

    __nil: 0,


    /**
     * 删除数据栈任意区段条目。
     * 目标：无。
     * 特权：是。需要直接操作数据栈。
     * 注：
     * 与暂存区赋值类指令不同，这只是纯粹的删除功能。
     * 应该不常用。
     * @param  {Stack} stack 数据栈
     * @param  {Number} start 起始位置
     * @param  {Number} count 删除数量
     * @return {void}
     */
    del( evo, stack, start, count ) {
        stack.del( start, count );
    },

    __del: null,
    __del_x: true,


    /**
     * 设置目标成员值。
     * 目标：当前条目/栈顶1项。
     * 如果名称和值都为数组，则为一一对应设置。
     * 否则为一对多（单值对多名称），或一对一设置（值数组视为一个单元）。
     * 注：操作目标本身，无返回值入栈。
     * @param  {String|[String]} name 名称或名称集
     * @param  {Value|[Value]} val 目标值或值集
     * @return {void}
     */
    set( evo, name, val ) {
        let _o = evo.data;

        if ( !$.isArray(name) ) {
            _o[name] = val;
        }
        else if ( $.isArray(val) ) {
            name.forEach( (n, i) => _o[n] = val[i] );
        }
        else {
            name.forEach( n => _o[n] = val );
        }
    },

    __set: 1,


    /**
     * 测试打印（控制台）。
     * 目标：当前条目，可选。
     * 返回传入的值（优先）或当前条目值（如果有）。
     * @param  {Value} msg 消息值
     * @return {Value}
     */
    hello( evo, msg ) {
        if ( evo.data !== undefined ) {
            window.console.dir(evo.data);
        }
        window.console.info( msg );

        return msg !== undefined ? msg : evo.data;
    },

    __hello: 0,

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
     * @data: {Value|LikeArray}
     * @param  {Boolean} ext 扩展模式
     * @return {Array}
     */
    Arr( evo, ext ) {
        return ext ? Array.from( evo.data ) : Array.of( evo.data );
    },

    __Arr: 1,


    /**
     * 将目标转为字符串。
     * @data: {Value}
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
     * @data: {Value}
     * @return {Boolean}
     */
    Bool( evo ) {
        return Boolean( evo.data );
    },

    __Bool: 1,


    /**
     * 将目标转为整数（parseInt）。
     * @data: {String}
     * @param  {Number} radix 进制基数
     * @return {Number}
     */
    Int( evo, radix ) {
        return parseInt( evo.data, radix );
    },

    __Int: 1,


    /**
     * 将目标转为浮点数（parseFloat）。
     * @data: {String}
     * @return {Number}
     */
    Float( evo ) {
        return parseFloat( evo.data );
    },

    __Float: 1,


    /**
     * 转化为正则表达式。
     * 如果提供了flag，肯定会返回一个新的正则对象。
     * 否则如果源本来就是一个正则对象，则不变。
     * @data: {String|RegExp}
     * @param  {String} flag 正则修饰符
     * @return {RegExp}
     */
    RE( evo, flag ) {
        return RegExp( evo.data, flag );
    },

    __RE: 1,


    /**
     * 将目标转换为普通对象。
     * 仅适用包含entries接口的对象，如：Set/Map实例。
     * 如果目标不包含entries成员，返回Object()的简单封装。
     * @return {Object}
     */
    Obj( evo ) {
        if ( !$.isFunction(evo.data.entries) ) {
            return Object(evo.data);
        }
        return Object.fromEntries( evo.data.entries() );
    },

    __Obj: 1,



    // 简单值操作
    //===============================================

    /**
     * 直接数据入栈。
     * 目标：可选当前条目，可选。
     * 特权：是。自行入栈操作。
     * 多个实参会自动展开入栈，数组实参视为单个值。
     * 无实参调用时入栈当前条目（作为单一值）。
     * 如果暂存区有值同时也传入了实参，则实参有效，当前条目忽略。
     * 注：
     * 可以入栈当前条目，使得可以将栈条目重新整理打包。
     * @param  {Stack} stack 数据栈
     * @param  {...Value} vals 值序列
     * @return {void} 自行入栈
     */
    push( evo, stack, ...vals ) {
        stack.push(
            ...(vals.length ? vals : [evo.data])
        );
    },

    __push: 0,
    __push_x: true,


    /**
     * 设置/获取全局变量。
     * 目标：当前条目，可选。
     * 目标非空或its有值时为设置，目标为空且its未定义时为取值入栈。
     * 设置时：
     * - 目标为空：取its本身为值（必然存在）。
     * - 目标非空：取目标的its属性值，或者目标本身（its无值）。
     * @param  {String} name 键名（序列）
     * @param  {Value|String} its 存储值或成员名/序列，可选
     * @return {Value|void}
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
     * 存储元素（evo.delegate）关联的数据项或取出数据项。
     * 目标：当前条目，可选。
     * 目标非空或its有值时为存储，目标为空且its未定义时为取值入栈。
     * 存储时状况参考env设置说明。
     * @param  {String} name 键名/序列
     * @param  {Value|String} its 存储值或成员名/序列，可选
     * @return {Value|void}
     */
    data( evo, name, its ) {
        let _e = evo.delegate,
            _m = DataStore.get(_e) || DataStore.set( _e, new Map() ),
            _o = evo.data;

        if ( _o === undefined && its === undefined ) {
            return getItem( _m, name );
        }
        setItem( _m, name, objectItem(_o, its) );
    },

    __data: 0,


    /**
     * 设置/取值浏览器会话数据。
     * 目标为空且its未定义时为取值入栈，否则为设置值（参考evn说明）。
     * 目标：当前条目。不自动取栈。
     * 传递its为null可清除目标项的值。
     * 如果传递name为null，会清除整个Storage存储。
     * 注意：存储的值会被转换为字符串。
     * @param {String} name 存储键名
     * @param {Value|String} its 存储值或成员名，可选
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
     * 目标：当前条目。不自动取栈。
     * 注：参考sess()说明。
     * @param {String} name 存储键名
     * @param {Value|String} its 存储值或成员名，可选
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
     * 特权：是。自行压入数据栈。
     * name支持空格分隔的多个名称，此时值为一个集合。
     * 多个名称实参取值会自动展开入栈。
     * @param  {Stack} stack 数据栈
     * @param  {...String} names 属性名序列
     * @return {void} 自行入栈
     */
    get( evo, stack, ...names ) {
        let _vs = names.map( name =>
            __reSpace.test(name) ? name.split(__reSpace).map( n => evo.data[n] ) : evo.data[name]
        );
        stack.push( ..._vs );
    },

    __get: 1,
    __get_x: true,


    /**
     * 调用目标的方法执行。
     * 目标：当前条目/栈顶1项。
     * @param {String} meth 方法名
     * @param {...any} rest 实参序列
     */
    call( evo, meth, ...rest ) {
        return evo.data[meth]( ...rest );
    },

    __call: 1,


    /**
     * 条件赋值。
     * 如果目标值为真，返回val入栈，否则跳过。
     * 目标：当前条目/栈顶1项。
     * 特权：是。可能两次入栈。
     * ielse：是否构造else逻辑（后续再跟一个$if）。
     * - 目标为真，赋值。补充追加一个false（待后续$if取值）。
     * - 目标为假，不赋值val。赋值一个true（后续$if必然执行）。
     * @param  {Stack} stack 数据栈
     * @param  {Value} val 待赋值
     * @param  {Boolean} ielse 是否构造else结构，可选
     * @return {Value|Boolean}
     */
    $if( evo, stack, val, ielse ) {
        if ( evo.data ) {
            stack.push( val );
        }
        if ( ielse ) return !evo.data;
    },

    __$if: 1,
    __$if_x: true,



    // 集合操作
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
                `return ${fltr};`
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
                `return ${fltr};`
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
     * 如果目标是Collector，deep可以为true（去重排序）。
     * @param  {Stack} stack 数据栈
     * @param  {Number|true} deep 深度或去重排序
     * @param  {Boolean} spread 展开入栈
     * @return {[Value]|void}
     */
    flat( evo, stack, deep, spread ) {
        let _vs = evo.data.flat( deep );

        if ( !spread ) {
            return _vs;
        }
        stack.push( ..._vs );
    },

    __flat: 1,
    __flat_x: true,


    /**
     * 数组成员序位反转。
     * 目标：当前条目/栈顶1项。
     * 注：
     * 简单操作。返回一个新的数组入栈。
     */
    reverse( evo ) {
        return Array.from(evo.data).reverse();
    },

    __reverse: 1,


    /**
     * 连接数组各成员。
     * @param {String} chr 连接字符串
     */
    join( evo, chr ) {
        return evo.data.join( chr );
    },

    __join: 1,


    /**
     * 调用目标对象 .values() 接口构造值数组。
     * 注：也适用普通对象。
     */
    values( evo ) {
        if ( $.type(evo.data) == 'Object' ) {
            return Object.values(evo.data);
         }
         return [ ...evo.data.values() ];
    },

    __values: 1,


    /**
     * 调用目标对象 .keys() 接口构造键数组。
     * 注：也适用普通对象。
     */
    keys( evo ) {
        if ( $.type(evo.data) == 'Object' ) {
            return Object.keys(evo.data);
         }
         return [ ...evo.data.keys() ];
    },

    __keys: 1,


    /**
     * 集合串接。
     * 目标：当前条目/栈顶1-2项。
     * 特权：是。选择性取栈。
     * 如果当前条目为空，取栈顶2项（实参为空）或1项。
     * 如果当前条目非空，以当前条目为合并目标（实参非空）或展开合并当前条目成员。
     * @param  {...Array|Value} vals 值或数组
     * @return {Array}
     */
    concat( evo, stack, ...vals ) {
        let _vs = vals.length > 0 ?
            stack.data(1) :
            stack.data(2);

        if ( vals.length > 0 ) {
            return _vs.concat(...vals);
        }
        return _vs.shift().concat(..._vs);
    },

    __concat_x: true,


    /**
     * 创建预填充值集合。
     * 如果当前条目有值，先填充当前条目值（可能解构）。
     * 最后一个值用于剩余重复填充。
     * @param {Number} size 集合大小
     * @param {...Value} vals 填充值序列，可选
     */
    array( evo, size, ...vals ) {
        if ( evo.data !== undefined ) {
            vals.unshift(
                ...($.isArray(evo.data) ? evo.data : [evo.data])
            );
        }
        let _i = vals.length,
            _v = vals[ _i-1 ];

        vals.length = size;
        return _i < size ? vals.fill(_v, _i) : vals;
    },

    __array: 0,



    // 简单运算
    // 支持集合成员一一对应运算，返回结果值的集合。
    // 注：以前一个实参集合大小为结果集大小。
    //===============================================

    /**
     * 加运算。
     * 同时适用数值和字符串。
     * 目标：当前条目/栈顶2项
     * 注记：Collector的同名方法没有被使用。
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number|String}
     */
    add( evo, deep ) {
        let [x, y] = evo.data;
        return deep ? x.map( (v, i) => v + y[i] ) : x + y;
    },

    __add: 2,


    /**
     * 减运算。
     * 目标：当前条目/栈顶2项
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number}
     */
    sub( evo, deep ) {
        let [x, y] = evo.data;
        return deep ? x.map( (v, i) => v - y[i] ) : x - y;
    },

    __sub: 2,


    /**
     * 乘运算。
     * 目标：当前条目/栈顶2项
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number}
     */
    mul( evo, deep ) {
        let [x, y] = evo.data;
        return deep ? x.map( (v, i) => v * y[i] ) : x * y;
    },

    __mul: 2,


    /**
     * 除运算。
     * 目标：当前条目/栈顶2项
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number}
     */
    div( evo, deep ) {
        let [x, y] = evo.data;
        return deep ? x.map( (v, i) => v / y[i] ) : x / y;
    },

    __div: 2,


    /**
     * 模运算。
     * 目标：当前条目/栈顶2项
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number}
     */
    mod( evo, deep ) {
        let [x, y] = evo.data;
        return deep ? x.map( (v, i) => v % y[i] ) : x % y;
    },

    __mod: 2,


    /**
     * 除并求余。
     * 目标：当前条目/栈顶2项
     * 返回值：[商数, 余数]
     * @param  {Boolean} deep 是否集合成员运算
     * @return {[Number, Number]}
     */
    divmod( evo, deep ) {
        let [x, y] = evo.data;

        if ( !deep ) {
            return [ Math.floor(x/y), x%y ];
        }
        return x.map( (v, i) => [ Math.floor(v/y[i]), v%y[i] ] );
    },

    __divmod: 2,


    /**
     * 数值取负。
     * 目标：当前条目/栈顶1项。
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Number|[Number]}
     */
    nneg( evo, deep ) {
        let _v = evo.data;
        return deep ? _v.map( v => -v ) : -_v;
    },

    __nneg: 1,


    /**
     * 逻辑取反。
     * 目标：当前条目/栈顶1项。
     * @param  {Boolean} deep 是否集合成员运算
     * @return {Boolean|[Boolean]}
     */
    vnot( evo, deep ) {
        let _v = evo.data;
        return deep ? _v.map( v => !v ) : !_v;
    },

    __vnot: 1,



    // 简单克隆
    //===============================================

    /**
     * 栈顶复制。
     * 支持多项自动展开，为引用浅复制。
     * 目标：可选当前条目为克隆数。
     * 特权：是。多条目获取并展开压入。
     * 注：
     * 无实参调用取默认值1，即复制栈顶1项。
     * 若当前条目有值，视为克隆数量。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {void}
     */
    dup( evo, stack, n = 1 ) {
        if ( evo.data !== undefined ) {
            n = +evo.data;
        }
        if ( n ) stack.push( ...stack.tops(n) );
    },

    __dup: 0,
    __dup_x: true,


    /**
     * 元素克隆。
     * 可同时克隆元素上绑定的事件处理器。
     * 目标：当前条目/栈顶1项。
     * 注：目标需要是元素（集）类型（Element|[Element]|Collector）。
     * @param {Boolean} event 包含事件处理器
     * @param {Boolean} deep 深层克隆（含子元素）
     * @param {Boolean} eventdeep 包含子元素的事件处理器
     */
    clone( evo, event, deep, eventdeep ) {
        let _el = evo.data;

        if ( $.isArray(_el) ) {
            return $(_el).clone( event, deep, eventdeep );
        }
        return $.clone( _el, event, deep, eventdeep );
    },

    __clone: 1,


    /**
     * 对象赋值。
     * 数据源对象内的属性/值赋值到接收对象。
     * 目标：当前条目/栈顶1项。
     * 当前条目可为对象的集合，会自动展开取值。
     * @param {Object} to 接收对象
     */
    assign( evo, to ) {
        let _v = evo.data;
        return $.assign( to, ...( $.isArray(_v) ? _v : [_v] ) );
    },

    __assign: 1,


    /**
     * 数组合并创建对象。
     * 目标：当前条目/栈顶1项。
     * 传入的实参作为键名称，目标应当是一个数组（否则值无对应）。
     * @param  {[String]} keys 对象键名集
     * @return {Object}
     */
    merge( evo, keys ) {
        return keys.reduce(
                (o, k, i) => (o[k] = evo.data[i], o), {}
            );
    },

    __merge: 1,



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


    /**
     * 数组相等比较。
     * 目标：当前条目/栈顶1-2项。
     * 如果传递了a1，则取当前条目或栈顶1项。
     * 如果未传递a1，则取当前条目或栈顶2项。
     * @param {Stack} stack 数据栈
     * @param {[Value]} a1 对比值
     */
    arrayEqual( evo, stack, a1 ) {
        if ( !a1 ) {
            return arrayEqual( ...(evo.data || stack.data(2)) );
        }
        return arrayEqual( a1, evo.data || stack.data(1) );
    },

    __arrayEqual: null,
    __arrayEqual_x: true,



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
     * @param {*} evo
     * @param  {...Value} vals 实参序列
     */
    include( evo, ...vals ) {
        return vals.includes( evo.data );
    },

    __include: 1,


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
     * 测试表达式可选，默认真值测试。
     * 注：
     * 目标需要是一个集合，支持各种集合（参考$.every）。
     * 表达式无需return语法词。
     *
     * @param {String|Function} expr 测试表达式或函数，可选
     */
    every( evo, expr ) {
        return $.every( evo.data, boolTester(expr), null );
    },

    __every: 1,


    /**
     * 是否有任一项为真。
     * 目标：当前条目/栈顶1项。
     * 测试表达式返回真该项即为真，接口：function(v, i, o): Boolean。
     * 测试表达式可选，默认真值测试。
     * 注：参考同上。
     * @param {String|Function} expr 测试表达式或函数，可选
     */
    some( evo, expr ) {
        return $.some( evo.data, boolTester(expr), null );
    },

    __some: 1,


    /**
     * 目标对象内成员测试。
     * 目标：当前条目/栈顶1项。
     * name为属性名，支持空格分隔的多个属性名指定。
     * val为对比值，用于与目标属性值做全等比较。可选，默认为存在性测试（非undefined）。
     * 如果name为多名称指定，val可以是一个数组（一一对应）或undefined。
     * 当所有的检查/比较都为真时，返回true。
     * 例：
     * - inside('shift ctrl', true) // 是否shift和ctrl成员值为真。
     * - inside('selector') // 是否selector成员在目标内。
     * - inside('AA BB', [1, 2]) // 是否AA成员值为1且BB成员值为2。
     *
     * @param {String} name 成员名称（集）
     * @param {Value|[Value]} val 对比值或值集
     */
    inside( evo, name, val ) {
        let _o = evo.data,
            _f = n => existValue(_o, n, val);

        if ( $.isArray(val) ) {
            _f = (n, i) => existValue(_o, n, val[i]);
        }
        return name.split(__reSpace).every(_f);
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
     * @param  {...Value} rest 实参序列
     * @return {Value}
     */
    exec( evo, ...rest ) {
        if ( $.isFunction(evo.data) ) {
            return evo.data( ...rest );
        }
        throw new Error( `${evo.data} is not a function.` );
    },

    __exec: 1,


    /**
     * 计算JS表达式。
     * 目标：当前条目，可选。
     * 目标可成为数据源，表达式内通过dn定义的变量名引用。
     * 例：calc('($[0] + $[1]) * $[2]')
     * @param  {String} expr JS表达式
     * @param  {String} varn 数据源变量名。可选，默认 $
     * @return {Value}
     */
    calc( evo, expr, varn = '$' ) {
        return new Function(
            varn,
            `return ${expr};` )( evo.data );
    },

    __calc: 0,

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


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
    if ( !__reSpace.test(its) ) {
        return obj[its];
    }
    return its.split(__reSpace).map( n => obj[n] );
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
 * @param {Map} map 存储容器
 * @param {String} name 存储名称/序列
 * @param {Value} val 存储值
 */
function setItem( map, name, val ) {
    if ( !__reSpace.test(name) ) {
        return map.set( name, val );
    }
    name = name.split(__reSpace);

    if ( $.isArray(val) ) {
        name.forEach( (n, i) => map.set(n, val[i]) );
    } else {
        name.forEach( n => map.set(val[n]) );
    }
}


/**
 * 设置存储器（sessionStorage|localStorage）。
 * @param {Storage} 存储器
 * @param {String} name 存储键
 * @param {Value|String} its 存储值或成员名
 * @param {Object|undefined} 当前条目
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
 * 创建布尔测试函数。
 * 如果表达式未定义，则为真值测试。
 * @param  {String|Function} expr 测试表达式或函数
 * @return {Function}
 */
function boolTester( expr ) {
    if ( expr === undefined ) {
        return v => v;
    }
    if ( typeof expr == 'function' ) {
        return expr;
    }
    return new Function( 'v', 'i', 'o', `return ${expr};` );
}


/**
 * 对象属性值测试。
 * 检查目标属性是否在目标对象内或是否与测试值全等。
 * 注：如果测试值未定义，则为存在性检查。
 * @param {Object} obj 目标对象
 * @param {String} name 属性名
 * @param {Value} val 测试值
 */
function existValue( obj, name, val ) {
    return val === undefined ? obj[name] !== undefined : obj[name] === val;
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
// 预定义调用链。
// 调用链：一个解析构造后的指令序列（执行流）。
//===============================================


/**
 * 存储调用链。
 * 如果存在同名键会抛出异常（问题严重）。
 * @param  {String} key 存储键/事件名
 * @param  {EventListener} chain 处理器入口
 * @return {void}
 */
function chainStore( key, chain ) {
    if ( __ChainPool.has(key) ) {
        throw new Error(`chain-store[${key}] is already exists.`);
    }
    __ChainPool.set(key, chain);
}


/**
 * 获取元素绑定（.bind/.once）状态集。
 * 用于预定义调用链的避免重复绑定。
 * @param  {Element} el 关联元素
 * @param  {Function} ch 调用链启动句柄
 * @return {Set} 存储集
 */
function chainSets( el, ch ) {
	let _map = __BoundSets.get( el ) ||
		__BoundSets.set( el, new Map() );

	return _map.get(ch) || _map.set(ch, new Set());
}


/**
 * 检查并设置绑定标记。
 * 如果已经绑定，返回false，否则设置并返回true。
 * 注：
 * 标记串可能用 事件名+选择器 表示。
 *
 * @param  {Set} sets 标志集
 * @param  {String} flag 标记串
 * @return {Boolean} 是否已绑定
 */
function setBound( sets, flag ) {
	return sets.has(flag) ? false : !!sets.add(flag);
}


/**
 * 调用链绑定到事件。
 * 从延迟绑定存储中检索调用链实例并绑定到目标事件。
 * 重复的绑定不会执行，除非已解绑（unbind）。
 * @param  {Element} el 关联元素
 * @param  {String} key 存储键
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function bindChain( el, key, evn = key, slr = null ) {
    let _ch = __ChainPool.get(key),
        _flg = evn + slr;

    if ( !_ch ) {
        return window.console.error(`chain-store[${key}] not found.`);
    }
    if ( setBound(chainSets(el, _ch), _flg) ) $.on(el, evn, slr, _ch);
}


/**
 * 调用链目标事件解绑。
 * @param  {Element} el 关联元素
 * @param  {String} key 存储键
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function unbindChain( el, key, evn = key, slr = null ) {
    let _ch = __ChainPool.get(key),
        _flg = evn + slr;

    if ( !_ch ) {
        return window.console.error(`chain-store[${key}] not found.`);
    }
    if ( chainSets(el, _ch).delete(_flg) ) $.off(el, evn, slr, _ch);
}


/**
 * 单次绑定。
 * 允许重复执行，因此无需存储标记。
 * @param  {Element} el 关联元素
 * @param  {String} key 存储键
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function onceBind( el, key, evn = key, slr = null ) {
    let _ch = __ChainPool.get(key);

    if ( !_ch ) {
        return window.console.error(`chain-store[${key}] not found.`);
    }
    $.one( el, evn, slr, _ch );
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



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


// 基础集I（On/By/To共享）。
const Base = $.assign( {}, _Base, bindMethod );


// 特殊控制。
// 避免预绑定处理。this: {Cell}
Base.prune = prune;
Base.prunes = prunes;
Base.entry = entry;
Base.reenter = reenter;


// 基础集II（On/By共享）。
const Base2 = $.assign( {}, _Base2, bindMethod );


/**
 * 设置模板管理器。
 * @param {Templater} tstore 模板管理器
*/
Base.tplStore = tstore => { __TplStore = tstore; };


export { Base, Base2, chainStore };
