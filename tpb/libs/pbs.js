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
     * 目标：当前条目，不自动取栈。
     * rid: {
     *      String          同上。
     *      null|undefined  同上，但当前条目也可能非字符串类型。
     *      Value           Collector封装，支持数组。
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
     * 目标：无。
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
     * 特权：是。this为数据栈实例。
     * @param  {...String} names 事件属性名
     * @return {void} 自操作入栈
     */
    ev( evo, ...names ) {
        if ( names.length == 0 ) {
            return evo.event;
        }
        let _vs = names.map( name =>
            $.isArray(name) ? name.map( n => evo.event[n] ) : evo.event[name]
        );
        this.push( ..._vs );
    },

    __ev: 0,
    __ev_x: true,



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



    // 其它
    //===============================================

    // 空指令，无目标。
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
        return flag ? RegExp( evo.data, flag ) : RegExp( evo.data );
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
     * 存储元素（evo.delegate）关联的数据项或取出数据项。
     * 目标：当前条目，不自动取栈。
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
     * 目标：可选当前条目，不自动取栈。
     * 特权：是。自行入栈操作。
     * 多个实参会自动展开入栈，数组实参视为单个值。
     * 无实参调用时入栈当前条目（作为单一值）。
     * 如果暂存区有值同时也传入了实参，则实参有效，当前条目忽略。
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


    /**
     * 从目标上取值入栈。
     * 目标：当前条目/栈顶1项。
     * 特权：是。自行压入数据栈。
     * 注：
     * 多个名称实参取值会自动展开入栈。
     * 如果需要入栈值集合，需要明确传递名称数组。
     *
     * @param  {...String} names 属性名序列
     * @return {void} 自行入栈
     */
    get( evo, ...names ) {
        let _vs = names.map( name =>
            $.isArray(name) ? name.map( n => evo.data[n] ) : evo.data[name]
        );
        this.push( ..._vs );
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
     * 特权：是。可能两次赋值。
     * ielse：是否构造else逻辑（后续再跟一个$if）。
     * - 目标为真，赋值。补充追加一个false（待后续$if取值）。
     * - 目标为假，不赋值val。赋值一个true（后续$if必然执行）。
     * @param  {Value} val 待赋值
     * @param  {Boolean} ielse 是否构造else结构，可选
     * @return {Value|Boolean}
     */
    $if( evo, val, ielse ) {
        if ( evo.data ) {
            this.push( val );
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
     * 目标：当前条目，不取栈。
     * 特权：是。多条目获取并展开压入。
     * 注：
     * 无实参调用取默认值1，即复制栈顶1项。
     * 若实参n明确传递为null，从当前条目获取克隆数。
     * @param  {Number} n 条目数
     * @return {void}
     */
    dup( evo, n = 1 ) {
        if ( n === null ) {
            n = evo.data;
        }
        if ( n ) this.push( ...this.tops(n) );
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
     * 检查name或name数组单元是否在目标对象内，且与val相等。
     * 目标：当前条目/栈顶1项。
     * 如果name和val都为数组，则一一对应比较。
     * 如果val未定义，则为存在性检查（非undefined）。
     * 注：
     * 当所有的检查/比较都为真时，返回真。
     * 例：
     * - inside(['shift', 'ctrl'], true) // 是否shift和ctrl成员值为真。
     * - inside('selector') // 是否selector成员在目标内。
     * - inside(['AA', 'BB'], [1, 2]) // 是否AA成员值为1且BB成员值为2。
     *
     * @param {String|[String]} name 成员名称或名称集
     * @param {Value|[Value]} val 对比值或值集
     */
    inside( evo, name, val ) {
        let _o = evo.data;

        if ( !$.isArray(name) ) {
            return val === undefined ? _o[name] !== undefined : _o[name] === val;
        }
        let _f = val === undefined ?
            ( n => _o[n] !== undefined ) :
            ( n => _o[n] === val );

        return name.every( _f );
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
     * 目标：当前条目，不自动取栈。
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



    // 其它
    //===============================================

    /**
     * 从模板管理器获取模板。
     * 目标：当前条目，不自动取栈。
     * 优先取实参传递的名称，如果name未定义，则取当前条目为名称。
     * @param  {String} name 模板名称
     * @return {Promise}
     */
    tpl( evo, name ) {
        if ( name == null ) {
            name = evo.data;
        }
        if ( typeof name != 'string' ) {
            return Promise.reject(`invalid tpl-name: ${name}`);
        }
        return TplStore.get( name );
    },

    __tpl: 0,

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取指令/方法（基础集）。
 * 处理取栈条目数（[EXTENT]）。
 * 处理特权设置（[ACCESS]），不锁定this（由解析者绑定到数据栈对象）。
 * 注记：
 * 创建已绑定的全局方法共享，以节省内存。
 *
 * @param {Function} f 方法
 * @param {String} k 方法名
 * @param {Object} obj 宿主对象
 */
function baseMethod( f, k, obj ) {
    if ( !k.length || k.startsWith('__') ) {
        return;
    }
    let _n = obj[ `__${k}` ];

    return [ obj[ `__${k}_x` ] ? funcSets( f, _n, true ) : funcSets( f.bind(obj), _n ) ];
}


/**
 * 获取普通指令/方法。
 * 仅处理取栈条目数，无特权逻辑。
 * @param {Function} f 方法
 * @param {String} k 方法名
 * @param {Object} obj 宿主对象
 */
function bindMethod( f, k, obj ) {
    if ( !k.length || k.startsWith('__') ) {
        return;
    }
    return funcSets( f.bind(obj), obj[ `__${k}` ] );
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
    return new Function( 'v', 'i', 'o', `return ${expr};` );
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
    // 特权方法标记但不绑定（会被绑定到数据栈）。
    //
    Base = $.assign( {}, _Base, baseMethod ),
    Base2 = $.assign( {}, _Base2, baseMethod ),

    //
    // 普通方法绑定宿主对象。
    //
    On = $.assign( {}, _On, bindMethod ),
    By = $.assign( {}, _By, bindMethod ),
    To = $.assign( {}, _To, bindMethod ),

    //
    // 支持顶层和次顶层。
    // 适用：On/By。
    //
    PB2 = Object.assign( Base2, Base );



//
// 基础集继承（原型）。
//
$.proto( On, PB2 ),
$.proto( By, PB2 ),
$.proto( To, Base );


// To特例。
// 特权允许：target更新。
To.usurp = funcSets( _To.usurp, _To['__usurp'], true );



export {
    On,
    By,
    To,
    EXTENT,
    ACCESS,
    init,
};
