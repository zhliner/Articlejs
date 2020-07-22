//! $Id: pbs.on.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  OBT:On 方法集。
//
//  一些基础取值操作和 tQuery/Collector 中取值方法的封装。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./tools/util.js";
import { bindMethod, DataStore, Templater, ChainStore, DEBUG } from "./config.js";
import { Process } from "./pbs.base.js";


const
    $ = window.$,

    // evo成员名/值键。
    evoIndex = {
        0: 'event',     // 原生事件对象（注：ev指令可直接获取）
        1: 'target',    // 事件起点元素（event.target）
        2: 'current',   // 触发事件的当前元素（event.currentTarget|matched）
        3: 'delegate',  // 委托绑定的元素（event.currentTarget）
        4: 'selector',  // 委托匹配选择器（for match）]
        6: 'data',      // 自动获取的流程数据
        7: 'entry',     // 中段入口（迭代重入）
        8: 'primary',   // To检索结果
        9: 'updated',   // To更新目标/集（动态变化）
    },

    // 修饰键属性名。
    // 注：按名称有序排列。
    modKeys = [
        'altKey',
        'ctrlKey',
        'metaKey',
        'shiftKey',
    ],

    // 空白匹配。
    __reSpace = /\s+/,

    // 鼠标移动存储键（横向）。
    __movementX = Symbol('mouse-movementX'),

    // 鼠标移动存储键（纵向）。
    __movementY = Symbol('mouse-movementY'),

    // 内容滚动存储键（横向）。
    __scrollX = Symbol('scroll-horizontal'),

    // 内容滚动存储键（垂直）。
    __scrollY = Symbol('scroll-vertical');


// 几个出错中断提示信息。
const
    dataUnfound = 'data-store is undefined.',
    chainUnfound = 'err:pre-store chain is unfound.',
    chainUnfound2 = 'err:chain-store is undefined or chain unfound.';



//
// 取值类。
// 适用于 On/To:NextStage 两个域。
//
const _Gets = {

    // 基本取值。
    //-----------------------------------------------

    /**
     * 单元素检索入栈。
     * 目标：暂存区1项可选。
     * 如果目标有值，视为起点元素，否则为事件绑定/委托元素。
     * 例：
     * 1. $('/p')  // 检索事件绑定元素内的首个<p>子元素
     * 2. evo(1) pop $('/a')  // 检索事件起始元素内的首个<a>元素
     * 4. push('/p') $(_1)    // rid从流程获取，效果同1
     * 5. push('/a') evo(1) pop $(_1)  // 效果同2
     * 6. $  // 起点元素自身
     * @param  {Object} evo 事件关联对象
     * @param  {String} rid 相对ID，可选
     * @return {Element}
     */
    $( evo, rid ) {
        return Util.find(rid, evo.data || evo.delegate, true);
    },

    __$: -1,


    /**
     * 多元素检索入栈。
     * 目标：暂存区1项可选。
     * 如果目标有值，视为起点元素，否则为事件绑定/委托元素。
     * 如果rid非字符串，则返回简单的Collector封装。
     * 例：
     * 1. push(['a','b','c']) $$(_1) // 从流程取1个实参：封装数组 $(['a','b','c'])
     * 2. push('abc') $$(_1)  // 从流程取相对ID，rid为'abc'
     * 2. push('abc') $$(_)   // 从流程取不定数量实参，'abc'会被展开传递，实际上rid仅为'a'
     * @param  {Object} evo 事件关联对象
     * @param  {String|Value} rid 相对ID或待封装值
     * @return {Collector}
     */
    $$( evo, rid ) {
        if ( typeof rid !== 'string' ) {
            return $( rid );
        }
        return Util.find( rid, evo.data || evo.delegate );
    },

    __$$: -1,


    /**
     * evo成员取值入栈。
     * 目标：无。
     * 特权：是，判断取值。
     * 如果name未定义或为null，取evo自身入栈。
     * 如果明确取.data属性，会取暂存区全部成员（清空）。
     * @param  {Stack} stack 数据栈
     * @param  {String|Number} name 成员名称或代码
     * @return {Element|Value|[Value]}
     */
    evo( evo, stack, name ) {
        if ( name == null ) {
            return evo;
        }
        name = evoIndex[name] || name;

        return name == 'data' ? stack.data(0) : evo[name];
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
     * 从目标上取成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称，返回一个值数组。
     * @param  {String} name 名称/序列
     * @return {Value|[Value]}
     */
    get( evo, name ) {
        return namesValue( name, evo.data );
    },

    __get: 1,


    /**
     * 从目标上取值集。
     * 目标：暂存区/栈顶1项。
     * 特权：是，自行入栈。
     * name支持空格分隔的多个名称，此时值为一个数组。
     * 多个名称实参取值会自动展开入栈。
     * @param  {Stack} stack 数据栈
     * @param  {...String} names 属性名序列
     * @return {void} 自行入栈
     */
    gets( evo, stack, ...names ) {
        stack.push(
            ...names.map( n => namesValue(n, evo.data) )
        );
    },

    __gets: 1,
    __gets_x: true,


    /**
     * 调用目标的方法。
     * 目标：暂存区/栈顶1项。
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {Value} 方法调用的返回值
     */
    call( evo, meth, ...rest ) {
        return evo.data[meth]( ...rest );
    },

    __call: 1,


    /**
     * 调用目标的多个方法。
     * 目标：暂存区/栈顶1项。
     * 方法名为空格分隔的多个名称序列。
     * 实参序列与名称序列一一对应，如果是数组会自动展开。
     * @param  {String} meths 方法名序列
     * @param  {...Value} args 实参组
     * @return {[Value]} 值集
     */
    calls( evo, meths, ...args ) {
        return methsCall( meths.split(__reSpace), evo.data, ...args );
    },

    __calls: 1,


    /**
     * 获取表单控件值集。
     * 目标：暂存区/栈顶1项。
     * 注意控件需要包含name属性。
     * @data: <form>
     * @param  {...String} names 控件名序列
     * @return {Object}
     */
    vals( evo, ...names ) {
        return $.controls(evo.data, ...names)
            .reduce(
                (o, el) => (o[el.name] = $.val(el), o), {}
            );
    },

    __vals: 1,



    // 类型转换&构造。
    // 目标：暂存区/栈顶1项。
    // 注意：返回值类型而非该类型的对象。
    //-----------------------------------------------------

    /**
     * 转为整数（parseInt）。
     * @param  {Number} radix 进制基数
     * @return {Number}
     */
    int( evo, radix ) {
        return parseInt( evo.data, radix );
    },

    __int: 1,


    /**
     * 将目标转为浮点数（parseFloat）。
     * @return {Number}
     */
    float( evo ) {
        return parseFloat( evo.data );
    },

    __float: 1,


    /**
     * 转化为正则表达式。
     * 如果提供了flag，肯定会返回一个新的正则对象。
     * 如果源本来就是一个正则对象，则原样返回。
     * @param  {String} flag 正则修饰符
     * @return {RegExp}
     */
    re( evo, flag ) {
        return RegExp( evo.data, flag );
    },

    __re: 1,


    /**
     * 转为布尔值（true|false）。
     * 假值：'', 0, false, null, undefined
     * 如果传递all为真，假值包含空对象（[], {}）。
     * @param  {Boolean} all 是否测试空对象/数组
     * @return {Boolean}
     */
    bool( evo, all ) {
        return all ? !!hasValue( evo.data ) : !!evo.data;
    },

    __bool: 1,


    /**
     * 转为字符串。
     * 可以选择性的添加前/后缀。
     * @param  {String} pre 前缀，可选
     * @param  {String} suf 后缀，可选
     * @return {String}
     */
    str( evo, pre = '', suf = '' ) {
        return `${ pre }${ evo.data }${ suf }`;
    },

    __str: 1,


    /**
     * 转换为数组。
     * 如果已经是数组则原样返回。
     * 注：无法转换不能转为数组的值（会是一个空数组）。
     * @data: {LikeArray|Symbol.iterator}
     * @return {Array|data}
     */
    arr( evo ) {
        return $.isArray(evo.data) ? evo.data : Array.from(evo.data);
    },

    __arr: 1,


    /**
     * 转换/构造为数组。
     * 如果不是数组则构造为数组。
     * 如果已经是数组，返回一个浅复制的新数组或封装数组（二维）。
     * 注：
     * 如果流程数据为 LikeArray|Symbol.iterator，则与arr行为一致。
     * 如果需要原值为数组时原样保持，则应当使用arr方法。
     * 与arr不同，始终会返回一个新的数组。
     *
     * @data: {LikeArray|Symbol.iterator|Value|Array}
     * @param  {Boolean} wrap 简单封装，可选
     * @return {Array|[Array]} 新数组
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
    obj( evo ) {
        if ( !$.isFunction(evo.data.entries) ) {
            return Object( evo.data );
        }
        return Object.fromEntries( evo.data.entries() );
    },

    __obj: 1,


    /**
     * 创建预填充值集合。
     * 目标：暂存区条目可选。
     * 如果目标有值，会合并到实参序列之后（数组会展开）。
     * 最后一个值用于剩余重复填充。
     * 如果完全没有填充值，数组成员会填充为undefined。
     * 例：
     * - array(3, 'a', 'b')  // ['a', 'b', 'b']
     * - array(3)  // [undefined, undefined, undefined]
     * - push([10,11]) array(3, _)  // [10, 11, 11]
     * - push([10,11]) push('xyz') pop array(4, _)  // [10, 11, 'xyz', 'xyz]
     * @param  {Number} size 集合大小
     * @param  {...Value} vals 填充值序列，可选
     * @return {[Value]}
     */
    array( evo, size, ...vals ) {
        if ( evo.data !== undefined ) {
            vals = vals.concat(evo.data);
        }
        return arrayFill( vals, size );
    },

    __array: 0,


    /**
     * 对象赋值（属性复制）。
     * 目标：暂存区/栈顶1项。
     * 目标作为提供属性值的数据源对象。
     * 属性仅限于对象自身（非继承）的可枚举属性。
     * 支持由空格分隔的多名称限定，空名称匹配全部属性（含Symbol）。
     * @data: Object => Object
     * @param  {Object} to 接收对象
     * @param  {String} names 取名称序列，可选
     * @return {Object}
     */
    assign( evo, to, names ) {
        if ( !names ) {
            return Object.assign( to, evo.data );
        }
        let _ns = new Set( names.split(__reSpace) );

        return $.assign( to, evo.data, (v, n) => _ns.has(n) && [v] );
    },

    __assign: 1,


    /**
     * 数组映射聚集。
     * 目标：暂存区/栈顶1项。
     * 把数组成员映射为一个键值对对象，键名序列由外部提供。
     * 数组成员和名称序列按下标顺序提取，值不足的部分为undefined值。
     * 注：支持下标运算的任意数据源皆可（如字符串）。
     * @data: [Value] => Object
     * @param  {String} names 属性名序列（空格分隔）
     * @return {Object}
     */
    gather( evo, names ) {
        return names.split(__reSpace)
            .reduce( (o, k, i) => (o[k] = evo.data[i], o), {} );
    },

    __gather: 1,


    /**
     * 创建元素集。
     * 目标：暂存区条目可选。
     * 如果目标有值，作为创建元素的源码或配置对象。
     * 目标可以是数组，成员值按顺序作为元素集成员的内容。
     * 注：
     * 这是 ...array(size) pop a.Element(tag) 的简洁版。
     * @param  {String} tag 元素标签名
     * @param  {Number} n 元素数量
     * @return {[Element]}
     */
    els( evo, tag, n ) {
        let v = evo.data;

        if ( !$.isArray(v) ) {
            v = [v];
        }
        return arrayFill( v, n ).map( d => $.Element(tag, d) );
    },

    __els: 0,


    /**
     * 元素克隆。
     * 目标：暂存区/栈顶1项。
     * 可选择同时克隆元素上绑定的事件处理器。
     * 注记：
     * 同时支持Collector实例，下同。
     * 数组版也支持Collector，但仅采用.map方法逐个操作。
     *
     * @param  {Boolean} event 包含事件处理器，可选
     * @param  {Boolean} deep 深层克隆（含子元素），可选（默认true）
     * @param  {Boolean} eventdeep 包含子元素的事件处理器，可选
     * @return {Element|Collector}
     */
    clone( evo, event, deep, eventdeep ) {
        return $.isCollector(evo.data) ?
            evo.data.clone(event, deep, eventdeep) : $.clone(evo.data, event, deep, eventdeep);
    },

    __clone: 1,


    /**
     * 创建元素。
     * 目标：暂存区1项可选。
     * 目标作为元素的内容或属性配置。
     * @param  {String} tag 标签名
     * @return {Element}
     */
    Element( evo, tag ) {
        return $.isCollector(evo.data) ?
            evo.data.Element(tag) : $.Element(tag, evo.data);
    },

    __Element: -1,


    /**
     * 创建一个SVG域元素。
     * 目标：暂存区1项可选。
     * 目标为SVG元素的内容或配置对象。
     * 注：tag无值时创建<svg>元素。
     * @param  {String} tag 标签名，可选
     * @return {Element|Collector}
     */
    svg( evo, tag = 'svg' ) {
        return $.isCollector(evo.data) ? evo.data.svg(tag) : $.svg(tag, evo.data);
    },

    __svg: -1,


    /**
     * 元素集封装。
     * 目标：暂存区/栈顶1项。
     * 目标只能是节点元素，非集合会被自动转为Collector。
     * 注：
     * 与To部分的同名方法不同，这里box仅支持字符串，
     * 即便是通过(_1)标识取元素实参，也不支持克隆选项。
     * @param  {String} box 封装容器HTML
     * @return {Collector}
     */
    wrapAll( evo, box ) {
        return $(evo.data).wrapAll( box );
    },

    __wrapAll: 1,



    // 复杂取值。
    //-----------------------------------------------

    /**
     * 获取模板节点。
     * 目标：暂存区1项可选。
     * 如果目标有值，取目标为模板名，此时name充当clone实参。
     * 注意克隆时是每次都克隆（应当很少使用）。
     * 返回Promise实例，注意调用顺序（应当在avoid等之后）。
     * 例：
     * 1. tpl('abc')  // 模板名为'abc'，clone未定义（假）
     * 2. push('xyz') pop tpl(true)  // 模板名为xyz，clone为真
     * @param  {String|Boolean} name 模板名或克隆指示
     * @param  {Boolean} clone 是否克隆，可选
     * @return {Promise}
     */
    tpl( evo, name, clone ) {
        if ( evo.data !== undefined ) {
            [name, clone] = [evo.data, name];
        }
        return Templater[clone ? 'clone' : 'get'](name);
    },

    __tpl: -1,


    /**
     * 获取模板节点（集）。
     * 目标：暂存区1项可选。
     * 如果目标有值，取目标为模板名，此时name充当clone实参。
     * 注意克隆是每次事件都会克隆一组新的节点。
     * 返回节点元素本身（而不是一个承诺）。
     * 如果只请求单个节点且未找到，返回null（数组成员中未找到的也为null）。
     * name支持空格分隔的多个名称序列。
     *
     * 注记：
     * 用户请求节点时应当知道节点载入情况，节点预先载入有3种方式：
     * 1. 在主页面中预先导入（通过隐藏的tpl-source或tpl-node语法）。
     * 2. 其它先构建（Tpb.Build）的模板导致节点已经自动载入。
     * 3. 主动使用tpl载入单个节点，于是与该节点定义在同一文件中的其它节点就会自动载入。
     * 例：
     * 主动载入并合并。
     * - tpl(x) arr node(...) concat(_1)  // x节点在数组前端
     * - tpl(x) node(...) pop concat(_1)  // x节点在数组末尾
     *
     * @param  {String} name 名称/序列
     * @param  {Boolean} clone 是否克隆
     * @return {Element|[Element|null]|null}
     */
    node( evo, name, clone ) {
        if ( evo.data !== undefined ) {
            [name, clone] = [evo.data, name];
        }
        if ( __reSpace.test(name) ) {
            return Templater.nodes( name.split(__reSpace), clone );
        }
        return Templater.node( name, clone );
    },

    __node: -1,


    /**
     * 获得键数组。
     * 目标：暂存区/栈顶1项。
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
     * 获取值数组。
     * 目标：暂存区/栈顶1项。
     * 主要为调用目标对象的.values()接口。
     * 也适用于普通对象。
     * @data: {Array|Collector|Map|Set|Object}
     * @return {[Value]}
     */
    values( evo ) {
        if ( $.isFunction(evo.data.values) ) {
             return [...evo.data.values()];
        }
        return Object.values( evo.data );
    },

    __values: 1,


    /**
     * 函数创建。
     * 目标：暂存区/栈顶1项。
     * 取目标为函数体表达式（无return）构造函数。
     * 实参即为函数参数名序列。
     * @param  {...String} names 参数名序列
     * @return {Function}
     */
    func( evo, ...names ) {
        return new Function( ...names, `return ${evo.data};` );
    },

    __func: 1,


    /**
     * 元素关联数据提取。
     * 目标：暂存区1项可选。
     * 若目标有值，则视为关联元素，否则关联当前委托元素。
     * name支持空格分隔的名称序列。
     * 如果不存在关联存储（Map），返回null。
     * 注记：
     * 因为主要是直接使用（如插入DOM），故返回值数组（而不是键值对象）。
     * 如chains主要用于转储，所以保留键信息。
     * 返回null可用于判断状况，但无法区分本来就存储的null。
     * @data: Element
     * @param  {String} name 名称/序列
     * @return {Value|[Value]|null}
     */
    data( evo, name ) {
        let _el = evo.data || evo.delegate,
            _m = DataStore.get(_el);

        if ( DEBUG && !_m ) {
            window.console.warn('key:', _el, dataUnfound);
        }
        return _m ? getData(_m, name) : null;
    },

    __data: -1,


    /**
     * 构造日期对象。
     * 目标：暂存区条目可选。
     * 目标如果有值，补充到模板实参序列之后（数组会展开）。
     * 无实参无目标时构造一个当前时间对象。
     * @param  {...Value} vals 实参值
     * @return {Date}
     */
    Date( evo, ...vals ) {
        return new Date( ...vals );
    },

    __Date: null,


    /**
     * 创建Map实例。
     * 目标：暂存区1项可选。
     * 目标作为创建实例的初始数据。
     * 注：多个实例会初始化为相同的数据。
     * @param  {Number} n 实例数量
     * @return {Map|[Map]}
     */
    Map( evo, n = 1 ) {
        if ( n == 1 ) {
            return new Map( evo.data );
        }
        return Array(n).fill().map( () => new Map(evo.data) );
    },

    __Map: -1,


    /**
     * 创建Set实例。
     * 目标：暂存区1项可选。
     * 目标作为创建实例的初始数据。
     * 注：多个实例会初始化为相同的数据。
     * @param  {Number} n 实例数量
     * @return {Set|[Set]}
     */
    Set( evo, n = 1 ) {
        if ( n == 1 ) {
            return new Set( evo.data );
        }
        return Array(n).fill().map( () => new Set(evo.data) );
    },

    __Set: -1,


    /**
     * 修饰键状态检查|封装。
     * 即 shift/ctrl/alt/meta 键是否按下。
     * 目标：无。
     * 如果指定键名则为检查，否则简单封装4个键的状态。
     * names支持空格分隔的多个名称，And关系。
     * 例：
     * scam('shift ctrl')  // 是否同时按下了Shift和Ctrl键。
     * push('shift ctrl') scam(_1)      // 同上
     * scam inside('shift ctrl', true)  // 效果同上
     * @param  {String} names 键名序列，可选
     * @return {Object|Boolean}
     */
    scam( evo, names ) {
        let _map = {
                'shift': evo.event.shiftKey,
                'ctrl':  evo.event.ctrlKey,
                'alt':   evo.event.altKey,
                'meta':  evo.event.metaKey,
            };
        return names ? names.split(__reSpace).every(n => _map[n.toLowerCase()]) : _map;
    },

    __scam: null,


    /**
     * 构建组合键序列。
     * 目标：无。
     * 将按下键键位串接为一个键名序列。
     * 如：alt+ctrl:f，表示同时按下Alt+Ctrl和F键。
     * 修饰键名有序排列后用+号连接，冒号之后为目标键名。
     * 注意：
     * 1. 单纯的修饰键也有目标键名，形如：alt:alt。
     * 2. 所有名称皆为小写形式以保持良好约定。
     * 3. 即便没有修饰键按下，目标键名之前的冒号依然保持。如 ":a"。
     * @return {String}
     */
    acmsk( evo ) {
        let _ks = modKeys
            .filter( n => evo.event[n] )
            .map( n => n.slice(0, -3) );

        return `${_ks.join('+')}:${evo.event.key.toLowerCase()}`;
    },

    __acmsk: null,


    /**
     * 预绑定调用链提取（单个）。
     * 目标：暂存区/栈顶1项。
     * 提取目标元素上预绑定的调用链（链头指令实例）。
     *
     * 提取的调用链可直接用于实时的事件绑定/解绑（on|off|one）。
     * 也可改为不同的事件名标识转存到新的元素便于使用（bind|once）。
     * 注：
     * 克隆参数可用于新链头接收不同的初始值。
     * 如果没有目标存储集或目标调用链，返回错误并中断。
     *
     * @param  {String} evnid 事件名标识
     * @param  {Boolean} clone 是否克隆
     * @return {Cell|reject}
     */
    chain( evo, evnid, clone ) {
        let _map = ChainStore.get( evo.data ),
            _cel = _map && _map.get( evnid );

        if ( _cel ) {
            return clone ? _cel.clone() : _cel;
        }
        return Promise.reject( chainUnfound2 );
    },

    __chain: 1,


    /**
     * 预绑定调用链提取。
     * 目标：暂存区/栈顶1项。
     * 提取目标元素上预绑定的调用链集。
     * 主要用于预绑定调用链的不同元素间转存（模板定义复用）。
     * 与chain不同，此处会保持原始名称（名值对对象）。
     * evnid 支持空格分隔多个名称指定。
     * evnid 为空或假值表示通配，匹配目标元素上的全部预存储。
     * 错误：
     * 如果目标元素没有预绑定存储，返回错误并中断。
     * @param  {String} evnid 事件名标识/序列
     * @param  {Boolean} clone 是否克隆
     * @return {Map<evnid:Cell>}
     */
    chains( evo, evnid, clone ) {
        let _src = ChainStore.get( evo.data );

        if ( !_src ) {
            return Promise.reject( chainUnfound );
        }
        if ( !evnid ) {
            return clone ? cloneMap( _src ) : _src;
        }
        return chainMap( _src, evnid.split(__reSpace), clone );
    },

    __chains: 1,



    // 元素自身行为。
    //-------------------------------------------


    /**
     * 移除元素。
     * 目标：暂存区/栈顶1项。
     * 如果传递back为真，则移除的元素返回入栈。
     * @param  {String|Boolean} slr 选择器或入栈指示，可选
     * @param  {Boolean} back 入栈指示
     * @return {Element|Collector|void}
     */
    remove( evo, slr, back ) {
        if ( typeof slr === 'boolean' ) {
            [back, slr] = [slr];
        }
        let _v = $.isCollector(evo.data) ?
            evo.data.remove() : $.remove( evo.data );

        if ( back ) return _v;
    },

    __remove: 1,


    /**
     * 文本节点规范化。
     * 目标：暂存区/栈顶1项。
     * 目标为操作的元素（集），不会改变原引用本身。
     * @param  {Number} depth 影响深度
     * @return {void}
     */
    normalize( evo, depth ) {
        $.isCollector(evo.data) ?
            evo.data.normalize( depth ) : $.normalize( evo.data, depth );
    },

    __normalize: 1,


    /**
     * 表单控件清空。
     * 目标：暂存区/栈顶1项。
     * 目标为待清空的表单元素。
     * 选取类控件为取消选取，其它为清除value值。
     * @return {void}
     */
    clear( evo ) {
        $.val( evo.data, null );
    },

    __clear: 1,



    // 专有补充。
    //-------------------------------------------


    /**
     * 鼠标水平移动量。
     * 目标：无。
     * 前值存储在事件当前元素上，解绑时应当重置（null）。
     * 注记：
     * mousemove事件中movementX/Y的值在缩放显示屏下有误差（chrome），
     * 因此用绝对像素值（event.pageX/pageY）重新实现。
     * 前值存储在事件当前元素（evo.current）上，解绑时应当重置（null）。
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    movementX( evo, nil ) {
        if ( nil !== null ) {
            let _v = evo.current[__movementX];
            // n - undefined == NaN => 0
            return ( evo.current[__movementX] = evo.event.pageX ) - _v || 0;
        }
        delete evo.current[__movementX];
    },

    __movementX: null,


    /**
     * 鼠标垂直移动量。
     * 目标：无。
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    movementY( evo, nil ) {
        if ( nil !== null ) {
            let _v = evo.current[__movementY];
            return ( evo.current[__movementY] = evo.event.pageY ) - _v || 0;
        }
        delete evo.current[__movementY];
    },

    __movementY: null,


    /**
     * 内容横向滚动量。
     * 目标：暂存区1项可选。
     * 支持指定目标滚动元素，如果目标为空，则取事件当前元素。
     * 前值存储在事件当前元素上，因此目标元素的滚动量是特定于当前事件的。
     * 通常在事件解绑时移除该存储（传递null）。
     * 注记：
     * 文档内容的滚动有多种途径，鼠标的wheel不能响应键盘对内容的滚动。
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrollX( evo, nil ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( nil !== null ) {
            let _v = _box[__scrollX];
            return ( _box[__scrollX] = _its.scrollLeft ) - _v || 0;
        }
        delete _box[__scrollX];
    },

    __scrollX: -1,


    /**
     * 内容垂直滚动量。
     * 目标：暂存区1项可选。
     * 说明：（同上）
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrollY( evo, nil ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( nil !== null ) {
            let _v = _box[__scrollY];
            return ( _box[__scrollY] = _its.scrollTop ) - _v || 0;
        }
        delete _box[__scrollY];
    },

    __scrollY: -1,

};



//
// 集合版处理器。
// 流程数据为数组，对成员逐个执行同样的单独处理（.map(...)）。
// 也支持Collector实例，但仅按普通数组对待。
// @return {[Value]|Collector}
//////////////////////////////////////////////////////////////////////////////

const _arrayGets = {
    /**
     * 取对象成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称，返回一个二维数组。
     * @param  {String} name 名称/序列
     * @return {[Value]|[[Value]]}
     */
    get( evo, name ) {
        return evo.data.map( o => namesValue(name, o) );
    },

    __get: 1,


    /**
     * 调用目标的方法。
     * 目标：暂存区/栈顶1项。
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {[Value]}
     */
    call( evo, meth, ...rest ) {
        return evo.data.map( o => o[meth](...rest) );
    },

    __call: 1,


    /**
     * 调用目标的多个方法。
     * 目标：暂存区/栈顶1项。
     * @param  {String} meths 方法名序列
     * @param  {...Value} args 实参组
     * @return {[[Value]]} 值集数组
     */
    calls( evo, meths, ...args ) {
        meths = meths.split(__reSpace);
        return evo.data.map( obj => methsCall(meths, obj, ...args) );
    },

    __calls: 1,



    // 类型转换。
    //-----------------------------------------------------

    /**
     * 转为整数（parseInt）。
     * @param  {Number} radix 进制基数
     * @return {[Number]}
     */
    int( evo, radix ) {
        return evo.data.map( v => parseInt(v, radix) );
    },

    __int: 1,


    /**
     * 将目标转为浮点数（parseFloat）。
     * @return {[Number]}
     */
    float( evo ) {
        return evo.data.map( v => parseFloat(v) );
    },

    __float: 1,


    /**
     * 转化为正则表达式。
     * @param  {String} flag 正则修饰符
     * @return {[RegExp]}
     */
    re( evo, flag ) {
        return evo.data.map( v => RegExp(v, flag) );
    },

    __re: 1,


    /**
     * 转为布尔值（true|false）。
     * @param  {Boolean} all 是否测试空对象/数组
     * @return {[Boolean]}
     */
    bool( evo, all ) {
        return all ? evo.data.map(v => !!hasValue(v)) : evo.data.map(v => !!v);
    },

    __bool: 1,


    /**
     * 转为字符串。
     * @param  {String} pre 前缀，可选
     * @param  {String} suf 后缀，可选
     * @return {[String]}
     */
    str( evo, pre = '', suf = '' ) {
        return evo.data.map( v => `${pre}${v}${suf}` );
    },

    __str: 1,



    // 元素集操作。
    // 返回类型与目标类型相同。
    //-----------------------------------------------------

    /**
     * 元素克隆。
     * @return {[Element]|Collector}
     */
    clone( evo, event, deep, eventdeep ) {
        return evo.data.map( el => $.clone(el, event, deep, eventdeep) );
    },

    __clone: 1,


    /**
     * 创建元素集。
     * @param  {String} tag 标签名
     * @return {[Element]|Collector}
     */
    Element( evo, tag ) {
        return evo.data.map( data => $.Element(tag, data) );
    },

    __Element: -1,


    /**
     * 创建SVG元素集。
     * @param  {String} tag 标签名，可选
     * @return {[Element]|Collector}
     */
    svg( evo, tag = 'svg' ) {
        return evo.data.map( opts => $.svg(tag, opts) );
    },

    __svg: -1,


    /**
     * 移除元素集。
     * @param  {Boolean} back 入栈指示，可选
     * @return {[Element]|Collector|void}
     */
    remove( evo, back ) {
        let _vs = evo.data.map( el => $.remove(el) );
        if ( back ) return _vs;
    },

    __remove: 1,


    /**
     * 文本节点规范化。
     * @return {void}
     */
    normalize( evo, depth ) {
        evo.data.forEach( el => $.normalize(el, depth) );
    },

    __normalize: 1,


    /**
     * 表单控件集清空。
     * @return {void}
     */
    clear( evo ) {
        evo.data.forEach( el => $.val(el, null) );
    },

    __clear: 1,

};



//
// PB专项取值。
// 目标：暂存区/栈顶1项。
// 即目标元素上data-pb特性的格式值（-分隔表示参数，空格分隔表示选项）。
// 注：简单调用 Util.pba/pbo/pbv 即可。
//////////////////////////////////////////////////////////////////////////////
[
    'pba',  // (): [String] | [[String]] 有序的参数词序列
    'pbo',  // (): [String] | [[String]] 选项词序列
    'pbv',  // (): String | [String] 属性值
]
.forEach(function( name ) {
    // 单元素版。
    // @return {[String]|String}
    _Gets[name] = function( evo ) { return Util[name](evo.data) };

    _Gets[`__${name}`] = 1;


    // 集合版。
    // @return {[[String]]|[String]}
    _arrayGets[name] = function( evo ) { evo.data.map(el => Util[name](el)) };

    _arrayGets[`__${name}`] = 1;
});



//
// tQuery|Collector通用
// 集合版会预先封装目标为一个Collector，以便获得其接口的优点。
//////////////////////////////////////////////////////////////////////////////


//
// 参数固定：1
// 目标：暂存区/栈顶1项。
// 注：固定参数为1以限定为取值。
//===============================================
[
    'attr',         // ( name:String ): String | null
    'attribute',    // ( name:String ): String | Object | null
    'xattr',        // ( name:String|[String]): String | Object | [String|null] | [Object] | null
    'prop',         // ( name:String ): Value | undefined
    'property',     // ( name:String ): Value | Object | undefined
    'css',          // ( name:String ): String
    'cssGets',      // ( name:String ): Object
    'hasClass',     // ( name:String ): Boolean
    'parentsUntil', // ( slr:String|Function ): [Element]
    'closest',      // ( slr:String|Function ): Element | null
    'is',           // ( slr|Element ): Boolean
]
.forEach(function( meth ) {

    // @data:  {Node|Collector}
    // @return {Value|Collector}
    _Gets[meth] = function( evo, arg ) {
        return $.isCollector(evo.data) ?
            evo.data[meth](arg) : $[meth](evo.data, arg);
    };

    _Gets[`__${meth}`] = 1;


    // 集合版。
    // @data:  {Array|Collector}
    // @return {[Value]}
    _arrayGets[meth] = function( evo, arg ) {
        return Array.prototype.map.call( evo.data, el => $[meth](el, arg) );
    };

    _arrayGets[`__${meth}`] = 1;

});


//
// 参数固定：0
// 目标：暂存区/栈顶1项。
// 注：无参数以限定为取值。
//===============================================
[
    'height',       // (): Number
    'width',        // (): Number
    'innerHeight',  // (): Number
    'innerWidth',   // (): Number
    'scroll',       // (): {top, left}
    'scrollTop',    // (): Number
    'scrollLeft',   // (): Number
    'offset',       // (): {top, left}
    'val',          // (): Value | [Value] // 注意控件需要有name特性
    'html',         // (): String   // 目标可为字符串（源码转换）
    'text',         // (): String   // 同上
    'classAll',     // (): [String]
    'position',     // (): {top, left}
    'offsetParent', // (): Element
]
.forEach(function( meth ) {

    // @data:  {Element|Collector}
    // @return {Value|Collector}
    _Gets[meth] = function( evo ) {
        return $.isCollector(evo.data) ?
            evo.data[meth]() : $[meth](evo.data);
    };

    _Gets[`__${meth}`] = 1;


    // 集合版。
    // @data:  {Array|Collector}
    // @return {[Value]}
    _arrayGets[meth] = function( evo ) {
        return Array.prototype.map.call( evo.data, el => $[meth](el) );
    };

    _arrayGets[`__${meth}`] = 1;

});


//
// 参数不定（0-n）。
// 目标：暂存区/栈顶1项。
// 注：多余实参无副作用。
//===============================================
[
    'outerWidth',   // ( margin? ): Number
    'outerHeight',  // ( margin? ): Number
    'next',         // ( slr?, until? ): Element | null
    'prev',         // ( slr?, until? ): Element | null
    'nextAll',      // ( slr? ): [Element]
    'nextUntil',    // ( slr? ): [Element]
    'prevAll',      // ( slr? ): [Element]
    'prevUntil',    // ( slr? ): [Element]
    'children',     // ( slr? ): [Element] | Element
    'contents',     // ( idx? ): [Node] | Node
    'siblings',     // ( slr? ): [Element]
    'parent',       // ( slr? ): Element | null
    'parents',      // ( slr? ): [Element]
]
.forEach(function( meth ) {

    // @data:  {Element|Collector}
    // @return {Value|Collector}
    _Gets[meth] = function( evo, ...args ) {
        return $.isCollector(evo.data) ?
            evo.data[meth](...args) : $[meth](evo.data, ...args);
    };

    _Gets[`__${meth}`] = 1;


    // 集合版：
    // @data:  {Array|Collector}
    // @return {[Value]}
    _arrayGets[meth] = function( evo, ...args ) {
        return Array.prototype.map.call( evo.data, el => $[meth](el, ...args) );
    };

    _arrayGets[`__${meth}`] = 1;

});


//
// 节点创建。
// 目标：暂存区/栈顶1项。
// 目标作为元素内容（text|html）。
//===============================================
[
    'Text',     // ( sep? ): Text
    'create',   // ( clean? ): DocumentFragment
]
.forEach(function( meth ) {

    // @data:  {String|Collector}
    // @return {Text|DocumentFragment|Collector}
    _Gets[meth] = function( evo, arg ) {
        return $.isCollector(evo.data) ?
            evo.data[meth](arg) : $[meth](evo.data, arg);
    };

    _Gets[`__${meth}`] = 1;


    // 集合版：
    // @data:  {Array|Collector}
    // @return {[Node|DocumentFragment]}
    _arrayGets[meth] = function( evo, arg ) {
        return Array.prototype.map.call( evo.data, con => $[meth](con, arg) );
    };

    _arrayGets[`__${meth}`] = 1;

});



//
// tQuery专有
//////////////////////////////////////////////////////////////////////////////


//
// 简单工具。
// 目标：无。
// 注：多余实参无副作用。
//===============================================
[
    'table',        // ( rows?, cols?, th0?, doc? ): $.Table
    'dataName',     // ( attr? ): String
    'tags',         // ( code? ): String
    'slr',          // ( tag, attr?, val?, op? ): String
    'range',        // ( beg?, size?, step? ): [Number]|[String]
    'now',          // ( json? ): Number|String
]
.forEach(function( meth ) {

    // @return {Value}
    _Gets[meth] = function( evo, ...args ) { return $[meth](...args) };

    _Gets[`__${meth}`] = null;

});


//
// 杂项工具。
// 目标：暂存区/栈顶1项。
// 目标作为方法的首个实参。多余实参无副作用。
//===============================================
[
    'isXML',        // (): Boolean
    'controls',     // ( ...names ): [Element]
    'serialize',    // ( ...names ): [Array2]
    'queryURL',     // (): String
    'isArray',      // (): Boolean
    'isNumeric',    // (): Boolean
    'isFunction',   // (): Boolean
    'isCollector',  // (): Boolean
    'type',         // (): String
    'kvsMap',       // ( kname?, vname? ): [Object2]

    // 与concat效果类似，但会改变目标本身。
    'mergeArray',   // ( ...src ): Array
]
.forEach(function( meth ) {
    /**
     * @return {Value}
     */
    _Gets[meth] = function( evo, ...rest ) { return $[meth](evo.data, ...rest) };

    _Gets[`__${meth}`] = 1;

});



//
// Collector专有。
// 目标：暂存区/栈顶1项。
// 目标通常为一个Collector，但也适用普通集合（会被自动转换）。
// 注记：
// 不支持.slice方法，已被用于数据栈操作。等价：call('slice', ...)
// 不支持.eq方法，已被用于比较操作。等价：item(i) $$(_1)
//////////////////////////////////////////////////////////////////////////////
[
    'item',     // ( idx? ): Value | [Value]
    'first',    // ( slr? ): Collector
    'last',     // ( slr? ): Collector
]
.forEach(function( meth ) {
    /**
     * 集合成员取值。
     * @param  {Number|String} its 位置下标或选择器
     * @return {Value|[Value]|Collector}
     */
    _Gets[meth] = function( evo, its ) { return $(evo.data)[meth](its) };

    _Gets[`__${meth}`] = 1;

});



//
// 元素自身行为。
//////////////////////////////////////////////////////////////////////////////

//
// 状态标识符。
//
const __uiState = [ '-', '', '^' ];


//
// 元素表现。
// 目标：暂存区/栈顶1项。
// 目标为元素或元素集。
// 状态标识 s：
//      1  状态执行，默认
//      0  状态取消
//      2  状态切换
// @return {void}
//===============================================
[
    ['hide',     'hidden'],
    ['lose',     'lost'],
    ['disable',  'disabled'],
    ['fold',     'folded'],
    ['truncate', 'truncated'],
    ['full',     'fulled'],
]
.forEach(function( names ) {

    // 单元素版。
    _Gets[names[0]] = function( evo, s = 1 ) {
        Util.pbo( evo.data, [`${__uiState[s]}${names[1]}`] );
    };

    _Gets[`__${names[0]}`] = 1;


    // 集合版。
    _arrayGets[names[0]] = function( evo, s = 1 ) {
        evo.data.forEach(
            el => Util.pbo(el, [`${__uiState[s]}${names[1]}`])
        );
    };

    _arrayGets[`__${names[0]}`] = 1;

});


//
// 状态判断。
//-------------------------------------
[
    'hidden',
    'lost',
    'disabled',
    'folded',
    'truncated',
    'fulled',
]
.forEach(function( name ) {

    // 单元素版。
    // @return {Boolean}
    _Gets[name] = function( evo ) {
        return Util.pbo( evo.data ).includes(name);
    };

    _Gets[`__${name}`] = 1;


    // 集合版。
    // @return {[Boolean]}
    _arrayGets[name] = function( evo ) {
        return Array.prototype.map.call(
            evo.data,
            el => Util.pbo(el).includes(name)
        );
    };

    _arrayGets[`__${name}`] = 1;

});


//
// 节点封装。
// 目标：暂存区/栈顶1项。
// wrap目标可以为元素或文本内容。
// 注记：
// 与To部分的同名方法不同，这里只接收字符串实参。
// 将封装接口放在这里（On）是一种实用的便利考虑。
//===============================================
[
    'wrap',
    'wrapInner',
]
.forEach(function( meth ) {

    // @param  {String} box 封装元素的HTML结构串
    // @return {Element|Collector} 包裹的容器根元素（集）
    _Gets[meth] = function( evo, box ) {
        return $.isCollector(evo.data) ?
            evo.data[meth](box) : $[meth](evo.data, box)
    };

    _Gets[`__${meth}`] = 1;


    // 集合版：
    // @param  {String} box 封装结构（同上）
    // @return {[Element]} 包裹的容器根元素集
    _arrayGets[meth] = function( evo, box ) {
        return Array.prototype.map.call( evo.data, el => $[meth](el, box) );
    };

    _arrayGets[`__${meth}`] = 1;

});


//
// 自我修改。
// 目标：暂存区/栈顶1项。
// 执行结果可能入栈，由布尔实参（back）决定。
//===============================================
[
    'empty',
    'unwrap',
]
.forEach(function( meth ) {

    // @param  {Boolean} back 入栈指示
    // @return {[Node]|Collector|void}
    _Gets[meth] = function( evo, back ) {
        let vs = $.isCollector(evo.data) ?
            evo.data[meth]() : $[meth]( evo.data );

        if ( back ) return vs;
    };

    _Gets[`__${meth}`] = 1;


    // @param  {Boolean} back 入栈指示
    // @return {[[Node]]|void}
    _arrayGets[meth] = function( evo, back ) {
        let vs = Array.prototype.map.call( evo.data, el => $[meth](el) );
        if ( back ) return vs;
    };

    _arrayGets[`__${meth}`] = 1;

});


//
// 原生事件调用。
// 目标：暂存区/栈顶1项（激发元素）。
// 注：To:NextStage部分存在同名方法（目标不同）。
// 理解：重在“调用”。
// @return {void}
//===============================================
[
    'blur',
    'click',
    'focus',
    'pause',
    'play',
    'reset',
    'select',
    'load',
    'submit',
]
.forEach(function( meth ) {

    _Gets[meth] = function( evo ) {
        $.isCollector(evo.data) ?
            evo.data[meth]() : $[meth](evo.data);
    };

    _Gets[`__${meth}`] = 1;


    _arrayGets[meth] = function( evo ) {
        evo.data.forEach( el => $[meth](el) );
    };

    _arrayGets[`__${meth}`] = 1;

});



//
// 工具函数。
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
 * 调用对象的多个方法。
 * 实参组成员与名称集成员一一对应，数组成员会自动展开。
 * @param  {[String]} names 方法名集
 * @param  {Object} obj 目标对象
 * @param  {...Value} args 实参组
 * @return {[Value]} 结果集
 */
function methsCall( names, obj, ...args ) {
    return names.map(
            (n, i) => obj[n]( ...[].concat(args[i]) )
        );
}


/**
 * 是否为有值对象（非空）。
 * 注：空数组或空对象。
 * @param  {Object|Array} obj 测试对象
 * @return {null|Number|obj}
 */
function hasValue( obj ) {
    return typeof obj == 'object' ? obj && Object.keys(obj).length : obj;
}


/**
 * 获取关联数据。
 * @param  {Map} map 存储集
 * @param  {String} name 名称序列（空格分隔）
 * @return {Value|[Value]} 值或值集
 */
function getData( map, name ) {
    if ( !__reSpace.test(name) ) {
        return map.get( name );
    }
    return name.split(__reSpace).map( n => map.get(n) );
}


/**
 * 获取调用链名值对。
 * @param  {Map} src 源存储集
 * @param  {[String]} evns 事件名标识集
 * @param  {Boolean} clone 是否克隆
 * @return {Map<evnid:Cell>}
 */
function chainMap( src, evns, clone ) {
    let _buf = new Map();

    for (const nid of evns) {
        let _cell = src.get( nid );

        if ( _cell ) {
            _buf.set( nid, clone ? _cell.clone() : _cell );
        }
    }
    return _buf;
}


/**
 * 克隆调用链存储集。
 * 注：若Cell无需克隆则源存储集可直接引用。
 * @param  {Map} map 源存储集
 * @return {Map}
 */
function cloneMap( map ) {
    let _buf = new Map();

    for (const [n, cel] of map) {
        _buf.set( n, cel.clone() );
    }
    return _buf;
}


/**
 * 填充数组到目标大小。
 * 注：用最后一个有效值填充。
 * @param {Array} arr 原数组
 * @param {Number} size 数组大小
 */
function arrayFill( arr, size ) {
    let i = arr.length,
        v = arr[ i-1 ];

    arr.length = size;
    return i < size ? arr.fill(v, i) : arr;
}



//
// 预处理，导出。
// 注记：
// 指令集预先绑定所属名称空间以固化this，便于全局共享。
///////////////////////////////////////////////////////////////////////////////


// 集合版命名空间。
_Gets.a = _arrayGets;

//
// 取值指令集。
// @proto: Process < Control
//
export const Get = $.proto(
    $.assign( {}, _Gets, bindMethod ), Process
);

// 原型桥接。
$.proto( Get.a, Process.a );


//
// On指令集。
// 结构：{ 取值 < 处理 < 控制 }。
//
export const On = Get;


// window.console.info( 'Gets:', Object.keys(Get).length );
