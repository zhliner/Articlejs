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
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./libs/util.js";
import { bindMethod, EXTENT } from "../globals.js";


const
    $ = window.$,

    // evo成员名数值键。
    evoIndex = {
        0:  'event',        // 原生事件对象（未侵入）
        1:  'origin',       // 事件起点元素（event.target）
        2:  'current',      // 触发事件的当前元素（event.currentTarget|matched）
        3:  'delegate',     // 事件相关联元素（event.relatedTarget）
        4:  'related',      // 委托绑定的元素（event.currentTarget）
        5:  'selector',     // 委托匹配选择器（for match）]
        10: 'data',         // 自动获取的流程数据
        11: 'entry',        // 中段入口（迭代重入）
        12: 'targets',      // To目标元素/集，向后延续
    };


const
    // 全局变量空间。
    Globals     = {},

    // 关联数据空间。
    // Element: Map{ String: Value }
    DataStore   = new WeakMap();


//
// 全局模板存储。
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
     *      null|undefined  同上，但当前条目也可能非字符串类型。
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
     * 如果需要入栈一个属性值集合，可以传递名称数组。
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
            $.isArray(name) ? name.map( n => evo.event[n] ) : evo.event[name]
        );
        stack.push( ..._vs );
    },

    __ev: null,
    __ev_x: true,


    /**
     * 获取模板并命名。
     * 目标：当前条目，可选。
     * name优先从实参获取，如果未定义或为null，则取目标值。
     * 行为：
     * 从原始源模板获取一个副本，这个副本被命名为name的值，
     * 如果在其它地方需要再次引用这个副本，仅传递name即可。
     * name可与from相同，但不同的副本应当名称不同。
     *
     * @param  {String} name 模板名/命名
     * @param  {String} from 原始来源模板名，可选
     * @return {Promise}
     */
    tpl( evo, name, from ) {
        if ( name == null ) {
            name = evo.data;
        }
        if ( typeof name != 'string' ) {
            return Promise.reject(`invalid tpl-name: ${name}`);
        }
        return TplStore.get( name, from );
    },

    __tpl: 0,



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


    /**
     * 流程终止。
     * 目标：当前条目，可选。
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
     * 向控制台打印消息。
     * 目标：当前条目，可选。
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
     * 设置/获取全局变量。
     * 目标：当前条目，可选。
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
     * 存储元素（evo.delegate）关联的数据项或取出数据项。
     * 目标：当前条目，可选。
     * 目标非空或its有值时为存储，目标为空且its未定义时为取值入栈。
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
     * 从目标上取值入栈。
     * 目标：当前条目/栈顶1项。
     * 特权：是。自行压入数据栈。
     * 注：
     * 多个名称实参取值会自动展开入栈。
     * 如果需要入栈值集合，需要明确传递名称数组。
     * @param  {Stack} stack 数据栈
     * @param  {...String} names 属性名序列
     * @return {void} 自行入栈
     */
    get( evo, stack, ...names ) {
        let _vs = names.map( name =>
            $.isArray(name) ? name.map( n => evo.data[n] ) : evo.data[name]
        );
        stack.push( ..._vs );
    },

    __gets: 1,
    __gets_x: true,


    /**
     * 调用目标的方法执行。
     * 目标：当前条目/栈顶1项。
     * @param {*} evo
     * @param {String} meth 方法名
     * @param  {...any} rest 实参序列
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
     * @param  {Stack} stack 数据栈
     * @param  {Number} deep 深度
     * @param  {Boolean} ext 展开入栈
     * @return {[Value]|void}
     */
    flat( evo, stack, deep, ext ) {
        let _vs = evo.data.flat( deep );

        if ( !ext ) {
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



    // 简单克隆
    //===============================================

    /**
     * 栈顶复制。
     * 为引用浅复制，支持多项（自动展开）。
     * 目标：当前条目，可选。
     * 特权：是。多条目获取并展开压入。
     * 注：
     * 无实参调用取默认值1，即复制栈顶1项。
     * 若实参n明确传递为null，从当前条目获取克隆数。
     * @param  {Stack} stack 数据栈
     * @param  {Number} n 条目数
     * @return {void}
     */
    dup( evo, stack, n = 1 ) {
        if ( n === null ) {
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
     * 数组合并。
     * 目标：当前条目/栈顶1项。
     * 注：目标需要是一个数组。
     * @param  {Array|Value} src 数据源（数组或值）
     * @return {Array}
     */
    merge( evo, src ) {
        return evo.data.concat( src );
    },

    __merge: 1,


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
     * 测试表达式可选，默认真值测试。
     * 注：参考同上。
     * @param {String} expr 测试表达式，可选
     */
    some( evo, expr ) {
        return $.some( evo.data, boolTester(expr), null );
    },

    __some: 1,


    /**
     * 目标对象内成员测试。
     * 检查name是否在目标对象内，且与val相等。
     * 目标：当前条目/栈顶1项。
     * name支持空格分隔的多个名称指定。
     * 如果val未定义，则为存在性检查（非undefined）。
     * ext只有在val为数组时才有意义，指定val成员与多个名称一一对应测试。
     * 注：
     * 当所有的检查/比较都为真时，返回真。
     * 例：
     * - inside('shift ctrl', true) // 是否shift和ctrl成员值为真。
     * - inside('selector') // 是否selector成员在目标内。
     * - inside('AA BB', [1, 2], true) // 是否AA成员值为1且BB成员值为2。
     *
     * @param {String} name 成员名称（集）
     * @param {Value|[Value]} val 对比值或值集
     * @param {Boolean} ext val是否扩展一一对应匹配
     */
    inside( evo, name, val, ext ) {
        let _o = evo.data,
            _f = n => existValue(_o, n, val);

        if ( ext ) {
            _f = (n, i) => existValue(_o, n, val[i]);
        }
        return name.split(/\s+/).every(_f);
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
    return new Function( 'v', 'i', 'o', `return ${expr};` );
}


/**
 * 对象属性值测试。
 * 检查目标属性是否在目标对象内或是否与测试值相等。
 * 注：如果测试值未定义，则为存在性检查。
 * @param {Object} obj 目标对象
 * @param {String} name 属性名
 * @param {Value} val 测试值
 */
function existValue( obj, name, val ) {
    return val === undefined ? obj[name] !== undefined : obj[name] === val;
}



//
// 特殊指令。
// 会操作调用链本身，需要访问指令单元（this:Cell）。
//===============================================


// 单次剪除属性。
const __PRUNE = Symbol('prune-count');


/**
 * 剪除后端跟随指令（单次）。
 * 允许后端指令执行cnt次，之后再移除。
 * 目标：无。
 * 注：cnt传递负值没有效果，传递0值立即移除。
 * @param  {Number} cnt 执行次数
 * @return {void}
 */
function prune( evo, cnt = 1 ) {
    if ( this[__PRUNE] < 0 ) {
        return;
    }
    if ( this[__PRUNE] == null ) {
        this[__PRUNE] = +cnt || 0;
    }
    if ( this[__PRUNE] == 0 && this.next ) {
        // 后阶移除
        this.next = this.next.next;
    }
    -- this[__PRUNE];
}

// 目标：无。
// prune[EXTENT] = null;


// 持续剪除属性。
const __PRUNES = Symbol('prunes-count');


/**
 * 剪除后端跟随指令（持续）。
 * 允许后端指令执行cnt次，之后再移除。
 * 目标：无。
 * 注：cnt传递负值没有效果，传递0值单次立即移除（同prune）。
 * @param  {Number} cnt 执行次数
 * @return {void}
 */
function prunes( evo, cnt = 1 ) {
    if ( this[__PRUNES] < 0 ) {
        return;
    }
    if ( this[__PRUNES] == null ) {
        this[__PRUNES] = +cnt || 0;
    }
    if ( this[__PRUNES] == 0 && this.next ) {
        this.next = this.next.next;
        this[__PRUNES] = +cnt || 0;
    }
    -- this[__PRUNES];
}

// 目标：无。
// prunes[EXTENT] = null;



// entry/animate标记属性。
const __ANIMATE = Symbol('animate-count');


/**
 * 创建入口。
 * 创建一个方法，使得可以从该处开启执行流。
 * 目标：无。
 * 主要用于动画类场景：前阶段收集初始数据，后阶段循环迭代执行动画。
 * 使用：
 *      entry           // 模板中主动设置（前提）。
 *      animate(...)    // 从entry下一指令开始执行。
 *      evo.entry(val)  // 指令/方法内使用。
 * 注：
 * 不作预绑定，this为当前指令单元（Cell）。
 * 一个执行流中只能有一个入口（多个时，后面的有效）。
 * @return {void}
 */
function entry( evo ) {
    // 初始标记。
    // 注记：执行流重启时复位。
    evo[__ANIMATE] = true;

    // 容错next无值。
    evo.entry = this.call.bind( this.next, evo );
}

// 目标：无。
// entry[EXTENT] = null;


/**
 * 开启动画。
 * 实际上就是执行 entry 入口函数。
 * count 为迭代次数，负值表示无限。
 * val 为初次迭代传入 evo.entry() 的值（如果有，否则为当前条目）。
 * 每次重入会传入当前条目数据（如果有）。
 * 注：
 * 不作预绑定，this为当前指令单元（Cell）。
 *
 * @param  {Value} val 初始值
 * @param  {Number} count 迭代次数
 * @return {void}
 */
function animate( evo, count, val ) {
    if ( evo[__ANIMATE] ) {
        if ( val !== undefined ) {
            evo.data = val;
        }
        delete evo[__ANIMATE];
        this[__ANIMATE] = +count || 0;
    }
    if ( this[__ANIMATE] == 0 ) {
        return;
    }
    if ( this[__ANIMATE] > 0 ) {
        -- this[__ANIMATE];
    }
    requestAnimationFrame( () => evo.entry(evo.data) );
}

// 目标：当前条目，可选。
animate[EXTENT] = 0;



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


const Base = {}, Base2 = {};


//
// PB环境初始化。
// @param {Templater} tplstore 模板管理器
//
Base.init = function( tplstore ) {
    // 绑定共享。
    $.assign( Base, _Base, bindMethod );
    $.assign( Base2, _Base2, bindMethod );

    // 特殊指令引入。
    // this: {Cell}
    Base.prune   = prune;
    Base.prunes  = prunes;
    Base.entry   = entry;
    Base.animate = animate;

    // 设置模板管理器。
    if ( tplstore ) TplStore = tplstore;
}


export { Base, Base2 };
