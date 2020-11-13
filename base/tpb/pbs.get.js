//! $Id: pbs.on.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
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
import { Ease } from "./tools/ease.js";
import { bindMethod, DataStore, Templater, ChainStore, DEBUG, hostSet, namedExtend } from "./config.js";
import { Process } from "./pbs.base.js";
import { Stack } from "./core.js";


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

    // 归类键区。
    // 用于 iskey 方法判断键位（Event.key）。
    __keyArea = {
        1:  /^F[0-9]+$/,
        2:  /^F[0-9]+$|^Escape$/,
        3:  /^Home|End|PgUp|PgDn$/,
        4:  /^Arrow(?:Up|Left|Down|Right)$/,
    },

    // 修饰键属性名。
    // 注：按名称有序排列。
    __modKeys = [
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

    // 内容滚动值存储键（横向）。
    __scrolledX = Symbol('scroll-horizontal'),

    // 内容滚动值存储键（垂直）。
    __scrolledY = Symbol('scroll-vertical');


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
     * 无实参调用取事件对象自身入栈。
     * 传递单个名称时返回单个值，否则为一个数组。
     * @param  {String} name 事件属性名（序列）
     * @return {Value|[Value]} 值或值集
     */
    ev( evo, name ) {
        return name == null ?
            evo.event : namesValue( name, evo.event );
    },

    __ev: null,


    /**
     * 从目标上取成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称，返回一个值数组。
     * 单个名称时返回一个值。
     * @param  {String} name 名称（序列）
     * @return {Value|[Value]}
     */
    get( evo, name ) {
        return namesValue( name, evo.data );
    },

    __get: 1,


    /**
     * 从目标集上取成员值。
     * 目标：暂存区/栈顶1项。
     * name支持空格分隔的多个名称，取值为一个数组，
     * 整个返回集则是一个二维数组。
     * @param  {String} name 属性名（序列）
     * @return {[Value]|[[Value]]}
     */
    gets( evo, name ) {
        return evo.data.map( o => namesValue(name, o) );
    },

    __gets: 1,


    /**
     * 获取数据长度。
     * 目标：暂存区/栈顶1项。
     * 目标可能是数组、字符串或类数组。
     */
    length( evo ) {
        return evo.data.length;
    },

    __length: 1,


    /**
     * 获取集合大小。
     * 目标：暂存区/栈顶1项。
     * 目标通常是 Set、Map 等实例。
     */
    size( evo ) {
        return evo.data.size;
    },

    __size: 1,


    /**
     * 调用目标的方法。
     * 目标：暂存区/栈顶1项。
     * 目标是一个调用方法的宿主（数组作为单个对象看待）。
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {Value} 方法调用的返回值
     */
    call( evo, meth, ...rest ) {
        return evo.data[meth]( ...rest );
    },

    __call: 1,


    /**
     * 调用目标的方法（集合）。
     * 目标：暂存区/栈顶1项。
     * 目标需要是一个数组或支持.map方法的对象。
     * @param  {String} meth 方法名
     * @param  {...Value} rest 实参序列
     * @return {[Value]} 全部调用的返回值集
     */
    calls( evo, meth, ...rest ) {
        return evo.data.map( o => o[meth](...rest) );
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


    /**
     * 获取当前选取范围。
     * 目标：无。
     * 即获取用户在页面中的划选部分。
     * 严格约束下，选区首尾需在同一容器元素内（完整嵌套）。
     * 无选取时返回 null。
     * 严格约束下非完整嵌套返回 false。
     * @param  {Boolean} loose 非严格约束
     * @return {Range|null|false}
     */
    Range( evo, loose = false ) {
        let _sel = window.getSelection(),
            _rng = null;

        if ( _sel.rangeCount > 0 ) {
            _rng = _sel.getRangeAt(0);
        }
        if ( loose ) {
            return _rng;
        }
        return _rng && _rng.startContainer.parentNode === _rng.endContainer.parentNode && _rng;
    },

    __Range: null,


    /**
     * 选取目标节点为一个范围（Range）。
     * 目标：暂存区/栈顶1项。
     * collapse: {
     *      true    折叠到元素前端
     *      false   折叠到元素末端
     *      undefined 元素为选取状态（无折叠）
     * }
     * @data: Element
     * @param  {Boolean} collapse 选区折叠位置，可选
     * @return {Range}
     */
    nodeRange( evo, collapse ) {
        let _rng = document.createRange();
        _rng.selectNode( evo.data );

        if ( collapse != null ) {
            _rng.collapse( !!collapse );
        }
        return _rng;
    },

    __nodeRange: 1,



    // 类型转换&构造。
    // 目标：暂存区/栈顶1项。
    // 注意：返回值类型而非该类型的对象。
    //-----------------------------------------------------

    /**
     * 转为整数（parseInt）。
     * 注意：空串转换为 NaN 而非数值 0。
     * @param  {Number} radix 进制基数
     * @return {Number}
     */
    int( evo, radix ) {
        return mapCall( evo.data, v => parseInt(v, radix) );
    },

    __int: 1,


    /**
     * 将目标转为浮点数（parseFloat）。
     * 注意：空串转换为 NaN 而非数值 0。
     * @return {Number}
     */
    float( evo ) {
        return mapCall( evo.data, v => parseFloat(v) );
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
        return mapCall( evo.data, v => RegExp(v, flag) );
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
        if ( all ) {
            return mapCall( evo.data, v => !!hasValue(v) );
        }
        return mapCall( evo.data, v => !!v );
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
        return mapCall( evo.data, v => `${pre}${v}${suf}` );
    },

    __str: 1,


    /**
     * 转换为数组。
     * 如果数据源本就是一个数组则简单返回。
     * 传递wrap为真会封装无法转为数组的值为一个单成员数组。
     * 注：$$ 有类似能力，但始终会创建为一个新集合。
     * @param  {Boolean} wrap 强制封装，可选
     * @return {Array|data}
     */
    arr( evo, wrap ) {
        if ( $.isArray(evo.data) ) {
            return evo.data;
        }
        let _new = Array.from( evo.data );

        return wrap && !_new.length ? Array.of( evo.data ) : _new;
    },

    __arr: 1,


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
     * 如果目标有值，作为创建元素的文本内容。
     * 目标可以是数组，成员值按顺序作为元素集成员的内容。
     * @param  {String} tag 元素标签名
     * @param  {Number} n 元素数量
     * @return {[Element]}
     */
    els( evo, tag, n ) {
        let v = evo.data;

        if ( !$.isArray(v) ) {
            v = [v];
        }
        return arrayFill( v, n ).map( d => $.elem(tag, d) );
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
        return $mapCall( evo.data, 'clone', event, deep, eventdeep );
    },

    __clone: 1,


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
     * 生成元素基本信息。
     * 目标：暂存区/栈顶1项。
     * @data: Element|[Element]|Collector
     * @param  {Boolean} hasid 包含ID信息
     * @param  {Boolean} hascls 包含类名信息
     * @return {String|[String]|Collector}
     */
    einfo( evo, hasid, hascls ) {
        return mapCall( evo.data, el => elemInfo(el, hasid, hascls) );
    },

    __einfo: 1,


    /**
     * 检查是否容纳选区。
     * 目标：暂存区/栈顶1项。
     * 检查选区对象是否完全在目标容器元素之内。
     * @data: Range
     * @param  {Element|String} el 容器元素或其选择器
     * @return {Boolean}
     */
    hasRange( evo, el ) {
        if ( typeof el === 'string' ) {
            el = Util.find( el, evo.delegate );
        }
        return $.contains( el, evo.data.commonAncestorContainer );
    },

    __hasRange: 1,


    /**
     * 修饰键按下检测集。
     * 修饰键指 shift/ctrl/alt/meta 4个键。
     * 目标：无。
     * 如果指定键名则为检查，否则简单返回按下键名集（全小写）。
     * names支持空格分隔的多个名称，And关系。
     * 例：
     * scam('shift ctrl')  // 是否同时按下了Shift和Ctrl键。
     * scam('Ctrl', true)  // 是否只按下了Ctrl键。
     * @param  {String} names 键名序列，可选
     * @param  {Boolean} strict 是否为严格匹配（排他性）
     * @return {Set|Boolean}
     */
    scam( evo, names, strict ) {
        let _ks = new Set( scamKeys(evo.event) );
        if ( !names ) return _ks;

        let _ns = names.split( __reSpace ),
            _ok = _ns.every( n => _ks.has(n.toLowerCase()) );

        return strict ? _ok && _ns.length === _ks.size : _ok;
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
     * 3. 即便没有修饰键按下，目标键名之前的冒号依然需要。如 ":a"。
     * @return {String}
     */
    acmsk( evo ) {
        let _ks = scamKeys( evo.event );

        return `${_ks.join('+')}:${evo.event.key.toLowerCase()}`;
    },

    __acmsk: null,


    /**
     * 是否为目标键之一。
     * 目标：无。
     * 指定数字键时需要包含引号，而不是直接的数值。
     * 数值实参表达约定的键区：
     * - 1: F1-F12 功能键系列。
     * - 2: F1-F12 功能键系列（含ESC键）。
     * - 3: Home/End/PgUp/PgDn 4个页面键。
     * - 4: 四个箭头键（← → ↑ ↓）。
     * @param  {...String|Number} keys 键名序列或键区值
     * @return {Boolean}
     */
    iskey( evo, ...keys ) {
        let _k = evo.event.key;

        return keys.some( v =>
            typeof v === 'number' ? __keyArea[v].test(_k) : _k === v
        );
    },

    __key: null,


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
     * @param  {Boolean} clone 是否克隆，可选
     * @return {Cell|reject}
     */
    chain( evo, evnid, clone ) {
        let _map = ChainStore.get( evo.data ),
            _cel = _map && _map.get( evnid );

        if ( _cel ) {
            return clone ? cloneChain(_cel) : _cel;
        }
        return Promise.reject( chainUnfound2 );
    },

    __chain: 1,


    /**
     * 预绑定调用链提取（批量）。
     * 目标：暂存区/栈顶1项。
     * 提取目标元素上预绑定的调用链集。
     * 主要用于预绑定调用链的不同元素间转存（模板定义复用）。
     * evnid 支持空格分隔多个名称指定。
     * evnid 为空或假值表示通配，匹配目标元素上的全部预存储。
     * clone 克隆会让调用链拥有一个新的数据栈。
     * 错误：
     * 如果目标元素没有预绑定存储，返回错误并中断。
     * @param  {String} evnid 事件名标识/序列
     * @param  {Value|[Value]} ival 初始赋值，可选
     * @param  {Boolean} clone 是否克隆，可选
     * @return {Map<evnid:Cell>}
     */
    chains( evo, evnid, clone ) {
        let _src = ChainStore.get( evo.data );

        if ( !_src ) {
            return Promise.reject( chainUnfound );
        }
        if ( !evnid ) {
            return mapAll( _src, clone );
        }
        return chainMap( _src, evnid.split(__reSpace), clone );
    },

    __chains: 1,


    /**
     * 创建/清除定时器。
     * 目标：暂存区/栈顶1项。
     * 创建时目标为函数，可以是Cell实例（自动调用.handleEvent）。
     * 清除时目标为定时器ID。
     * 创建和清除由 delay 实参表达: 数值时为创建，null时为清除。
     * 创建时返回一个定时器ID，清除时无返回值。
     * 注：setTimeout 的定时器只执行一次。
     * @data: {Function|Cell|timemotID}
     * @param  {Number|null} delay 延迟时间或清除标记
     * @param  {...Value} args 目标函数调用时的实参
     * @return {timeoutID|void}
     */
    timeOut( evo, delay, ...args ) {
        let x = evo.data;

        if ( delay === null ) {
            return window.clearTimeout( x );
        }
        // 通用支持Cell实例。
        if ( $.isFunction(x.handleEvent) ) {
            return window.setTimeout( (ev, elo) => x.handleEvent(ev, elo), delay, evo.event, newElobj(evo) );
        }
        return window.setTimeout( x, delay, ...args );
    },

    __timeOut: 1,


    /**
     * 创建/清除持续定时器。
     * 目标：暂存区/栈顶1项。
     * 目标为函数或之前存储的定时器ID，说明参考上面timeOut。
     * 注：
     * 每一次都会创建一个定时器，因此通常在单次事件中使用。
     * setInterval 的定时器会持续执行。
     * @param  {Number|null} dist 间隔时间（毫秒）
     * @param  {...Value} args 目标函数调用时的实参
     * @return {intervalID|void}
     */
    timeTick( evo, dist, ...args ) {
        let x = evo.data;

        if ( dist === null ) {
            return window.clearInterval( x );
        }
        // 通用支持Cell实例。
        if ( $.isFunction(x.handleEvent) ) {
            return window.setInterval( (ev, elo) => x.handleEvent(ev, elo), dist, evo.event, newElobj(evo) );
        }
        return window.setInterval( x, dist, ...args );
    },

    __timeTick: 1,


    /**
     * 创建缓动对象。
     * 目标：暂存区1项可选。
     * 目标为迭代总次数定义，可通过count实参覆盖。
     * count的假值视为无穷大。
     * 提示：新建的缓动对象可用 data 存储。
     * @param  {String} name 缓动名称（如 Cubic）
     * @param  {String} kind 缓动方式（如 InOut）
     * @param  {Number} count 总迭代次数，可选
     * @return {Ease} 缓动实例
     */
    ease( evo, name, kind, count ) {
        return new Ease(
            name,
            kind,
            count || evo.data || Infinity
        );
    },

    __ease: -1,


    /**
     * 获取当前缓动值。
     * 目标：暂存区/栈顶1项。
     * @data {Ease}
     * @param  {Number} total 总值，可选
     * @param  {Number} base 基数值，可选
     * @return {Number}
     */
    easing( evo, total = 1, base = 0 ) {
        return evo.data.value() * total + base;
    },

    __easing: 1,


    /**
     * 创建一个动画实例。
     * 目标：暂存区/栈顶1项。
     * 在目标元素上创建一个动画实例（Element.animate()）。
     * 目标支持多个元素，但共用相同的实参。
     * 提示：
     * 作为 To:Query 的目标可用于绑定事件处理。
     * 可用 data 存储以备其它事件控制使用。
     *
     * @param  {[Object]} kfs 关键帧对象集
     * @param  {Object} opts 动画配置对象
     * @return {Animation|[Animation]}
     */
    animate( evo, kfs, opts ) {
        return mapCall( evo.data, el => el.animate(kfs, opts) );
    },

    __animate: 1,



    // 元素自身行为。
    //-------------------------------------------


    /**
     * 移除元素。
     * 目标：暂存区/栈顶1项。
     * 如果传递back为真，则移除的元素返回入栈。
     * 选择器slr仅适用于集合，但单元素版传递无害。
     * @param  {String|Boolean} slr 选择器或入栈指示，可选
     * @param  {Boolean} back 入栈指示，可选
     * @return {Element|Collector|void}
     */
    remove( evo, slr, back ) {
        if ( typeof slr === 'boolean' ) {
            [back, slr] = [slr];
        }
        let _v = $mapCall( evo.data, 'remove', slr );
        if ( back ) return _v;
    },

    __remove: 1,


    /**
     * 文本节点规范化。
     * 目标：暂存区/栈顶1项。
     * @return {void}
     */
    normalize( evo ) {
        $mapCall( evo.data, 'normalize' );
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
        let x = evo.data;

        if ( !$.isArray(x) ) {
            x = [ x ];
        }
        x.forEach( el => $.val(el, null) );
    },

    __clear: 1,


    /**
     * 滚动到当前视口。
     * y, x: {
     *     0   就近显示（如果需要）（nearest）
     *     1   视口起点位置（start）
     *    -1   视口末尾位置（end）
     *     2   居中显示，默认（center）
     * }
     * @param  {Number|String|true|false} y 垂直位置标识
     * @param  {Number|String} x 水平位置标识
     * @return {void}
     */
    intoView( evo, y, x ) {
        $.intoView( evo.data, y, x );
    },

    __intoView: 1,



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
        let _el = evo.current;

        if ( nil !== null ) {
            let _v = _el[__movementX];
            // n - undefined == NaN => 0
            return ( _el[__movementX] = evo.event.pageX ) - _v || 0;
        }
        delete _el[__movementX];
    },

    __movementX: null,


    /**
     * 鼠标垂直移动量。
     * 目标：无。
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    movementY( evo, nil ) {
        let _el = evo.current;

        if ( nil !== null ) {
            let _v = _el[__movementY];
            return ( _el[__movementY] = evo.event.pageY ) - _v || 0;
        }
        delete _el[__movementY];
    },

    __movementY: null,


    /**
     * 内容横向滚动量。
     * 目标：暂存区1项可选。
     * 支持指定目标滚动元素，如果目标为空，则取事件当前元素。
     * 前值存储在事件当前元素上，因此目标元素的滚动量是特定于当前事件的。
     * 通常在事件解绑时移除该存储（传递null）。
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrolledX( evo, nil ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( nil !== null ) {
            let _v = _box[__scrolledX];
            return ( _box[__scrolledX] = _its.scrollLeft ) - _v || 0;
        }
        delete _box[__scrolledX];
    },

    __scrolledX: -1,


    /**
     * 内容垂直滚动量。
     * 目标：暂存区1项可选。
     * 说明：（同上）
     * @param  {null} nil 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrolledY( evo, nil ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( nil !== null ) {
            let _v = _box[__scrolledY];
            return ( _box[__scrolledY] = _its.scrollTop ) - _v || 0;
        }
        delete _box[__scrolledY];
    },

    __scrolledY: -1,

};



//
// PB专项取值。
// 目标：暂存区/栈顶1项。
// 即目标元素上 data-pbo|pba 特性的格式值。
// 注：简单调用 Util.pba/pbo 即可。
//////////////////////////////////////////////////////////////////////////////
[
    'pbo',  // 选项词序列
    'pba',  // 有序的参数词序列
]
.forEach(function( name ) {

    // @return {[String]|[[String]]}
    _Gets[name] = function( evo ) {
        return mapCall( evo.data, el => Util[name](el) );
    };

    _Gets[`__${name}`] = 1;

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
                    // 单元素版参数说明
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
    'is',           // ( slr:String|Element ): Boolean

    // To部分存在同名接口
    // 放在此处方便构造新元素（实用性考虑）。
    'wrap',         // ( box:String ): Element | Collector
    'wrapInner',    // ( box:String ): Element | Collector
]
.forEach(function( meth ) {

    // @data:  {Node|Array|Collector}
    // @return {Value|Collector}
    _Gets[meth] = function( evo, arg ) {
        return $mapCall( evo.data, meth, arg );
    };

    _Gets[`__${meth}`] = 1;

});


//
// 参数固定：0
// 目标：暂存区/栈顶1项。
// 注：无参数以限定为取值。
//===============================================
[
                    // 单元素版参数说明
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

    // @data:  {Element|Array|Collector}
    // @return {Value|Collector}
    _Gets[meth] = function( evo ) {
        return $mapCall( evo.data, meth );
    };

    _Gets[`__${meth}`] = 1;

});


//
// 参数不定（0-n）。
// 目标：暂存区/栈顶1项。
// 注：多余实参无副作用。
//===============================================
[
                    // 单元素版参数说明
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

    'Text',         // ( sep?:String, doc?:Document ): Text
    'fragment',     // ( clean?:Function|true, doc?:Document ): DocumentFragment
]
.forEach(function( meth ) {

    // @data:  {Element|Collector}
    _Gets[meth] = function( evo, ...args ) {
        return $mapCall( evo.data, meth, ...args );
    };

    _Gets[`__${meth}`] = 1;

});


//
// 元素创建。
// 目标：暂存区1项可选。
// 目标作为元素的内容或属性配置。
//===============================================
[
    'Element',  // data: String|Object|Map
    'elem',     // data: String
    'svg',      // data: String|Object|Map
]
.forEach(function( meth ) {

    // @return {Element|Collector}
    _Gets[meth] = function( evo, tag ) {
        return $.isArray( evo.data ) ?
            $(evo.data)[meth]( tag ) : $[meth]( tag, evo.data );
    };

    _Gets[`__${meth}`] = -1;

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
    'table',        // ( cols?, rows?, th0?, doc? ): $.Table
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
    'paths',        // ( end?, slp?, slr? ): [Number]

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
// 目标通常为一个Collector，普通集合会被自动转换。
//////////////////////////////////////////////////////////////////////////////
[
    'first',    // ( slr? ): Value
    'last',     // ( slr? ): Value
    'item',     // ( idx? ): Value | [Value]
]
.forEach(function( meth ) {
    /**
     * 集合成员取值。
     * @param  {Number|String} its 位置下标或选择器
     * @return {Value|[Value]|Collector}
     */
    _Gets[meth] = function( evo, its ) { return $(evo.data)[meth]( its ) };

    _Gets[`__${meth}`] = 1;

});


//
// 数组处理（兼容Collector）。
// 目标：暂存区/栈顶1项。
// 目标需要是一个数组，返回一个具体的值。
//////////////////////////////////////////////////////////////////////////////
[
    'join',         // (chr?: String): String
    'includes',     // (val: Value, beg?: Number): Boolean
    'indexOf',      // (val: Value, beg?: Number): Number
    'lastIndexOf',  // (val: Value, beg?: Number): Number
]
.forEach(function( meth ) {
    /**
     * 集合成员取值。
     * 注：v1 默认空串为 join 优化。
     * @param  {Value} v1 首个实参，可选
     * @param  {Value} v2 第二个实参，可选
     * @return {Value}
     */
    _Gets[meth] = function( evo, v1 = '', v2 ) {
        return evo.data[meth]( v1, v2 );
    };

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
//      1|true  状态执行，默认
//      0|false 状态取消
//      2       状态切换
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

    // @return {void}
    _Gets[names[0]] = function( evo, s = 1 ) {
        eachCall(
            evo.data,
            el => Util.pbo( el, [__uiState[+s] + names[1]] )
        );
    };

    _Gets[`__${names[0]}`] = 1;

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

    // @return {Boolean|[Boolean]}
    _Gets[name] = function( evo ) {
        return mapCall( evo.data, el => Util.pbo(el).includes(name) );
    };

    _Gets[`__${name}`] = 1;

});


//
// 自我修改。
// 目标：暂存区/栈顶1项。
// 如果传递实参clean有值（非undefined），则结果入栈。
// 注记：
// 明确要求结果集是否清理，表示需要该结果集。
//===============================================
[
    'empty',
    'unwrap',
]
.forEach(function( meth ) {

    // 注意：集合版返回的是数组集。
    // @param  {Boolean} clean 结果集清理指示
    // @return {[Node]|Collector|void}
    _Gets[meth] = function( evo, clean ) {
        let _vs = $mapCall( evo.data, meth, clean );
        if ( clean !== undefined ) return _vs;
    };

    _Gets[`__${meth}`] = 1;

});


//
// 原生事件调用。
// 目标：暂存区/栈顶1项（激发元素）。
// 注：To:NextStage部分存在同名方法（目标不同）。
// 理解：重在“调用”。
//===============================================
[
    'click',
    'blur',
    'focus',
    'select',
    'reset',
    'submit',
    'load',
    'play',
    'pause',
    'finish',
    'cancel',
]
.forEach(function( meth ) {

    // @return {void}
    _Gets[meth] = function( evo ) {
        eachCall( evo.data, el => $[meth](el) );
    };

    _Gets[`__${meth}`] = 1;

});



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * 单值/集合调用封装。
 * @param  {Value|[Value]} data 数据/集
 * @param  {Function} handle 回调函数
 * @return {Value|[Value]}
 */
function mapCall( data, handle ) {
    if ( $.isArray(data) ) {
        return data.map( v => handle(v) );
    }
    return handle( data );
}


/**
 * 单值/集合调用封装。
 * @param {Value|[Value]} data 数据/集
 * @param {Function} handle 调用句柄
 */
function eachCall( data, handle ) {
    if ( !$.isArray(data) ) {
        return handle( data );
    }
    data.forEach( v => handle(v) );
}


/**
 * 单值/集合调用封装（tQuery版）。
 * 数据为集合时，返回的集合会封装为Collector。
 * @param  {Element|[Element]|Collector} data 数据（集）
 * @param  {String} meth 方法名
 * @param  {...Value} args 实参序列
 * @return {Value|Collector}
 */
function $mapCall( data, meth, ...args ) {
    return $.isArray( data ) ?
        $(data)[meth]( ...args ) : $[meth]( data, ...args );
}


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
            _buf.set( nid, clone ? cloneChain(_cell) : _cell );
        }
    }
    return _buf;
}


/**
 * 调用链存储集。
 * @param  {Map} map 源存储集
 * @param  {Boolean} clone 克隆方式
 * @return {Map}
 */
function mapAll( map, clone ) {
    let _buf = new Map();

    for (const [n, cel] of map) {
        _buf.set(
            n,
            clone ? cloneChain(cel) : cel
        );
    }
    return _buf;
}


/**
 * 克隆调用链。
 * 会更新调用链全部指令上的数据栈引用。
 * @param  {Cell} cell 链头实例
 * @return {Cell} cell
 */
function cloneChain( cell ) {
    let _stack = new Stack(),
        _first = cell.clone( _stack ),
        _cell = _first;

    while ( (cell = cell.next) ) {
        _cell.next = cell.clone( _stack );
        _cell = _cell.next;
    }
    return _first;
}


/**
 * 创建一个新的初始事件关联对象。
 * 注：用于.handleEvent()调用中的elo实参。
 * @param  {Object} evo 事件关联对象
 * @return {Object}
 */
function newElobj( evo ) {
    return {
        target:     evo.target,
        current:    evo.current,
        selector:   evo.selector,
        delegate:   evo.delegate,
    };
}


/**
 * 获取修饰键真值集。
 * 状态为真的键才记录，名称为全小写。
 * @param  {Event} ev 事件对象
 * @return {[String]}
 */
function scamKeys( ev ) {
    return __modKeys
        .filter( n => ev[n] ).map( n => n.slice(0, -3) );
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


/**
 * 提取元素简单信息。
 * 格式：tag#id.className
 * @param  {Element} el 目标元素
 * @param  {Boolean} hasid 包含ID信息
 * @param  {Boolean} hascls 包含类名信息
 * @return {String}
 */
function elemInfo( el, hasid, hascls ) {
    let _s = el.tagName.toLowerCase();

    if ( hasid && el.id ) {
        _s += `#${el.id}`;
    }
    if ( hascls && el.classList.length ) {
        _s += '.' + [...el.classList].join('.');
    }
    return _s;
}



//
// 预处理，导出。
// 注记：
// 指令集预先绑定所属名称空间以固化this，便于全局共享。
///////////////////////////////////////////////////////////////////////////////


//
// 取值指令集。
// @proto: Process < Control
//
export const Get = $.proto(
    $.assign( {}, _Gets, bindMethod ), Process
);


//
// On指令集。
// 结构：{ 取值 < 处理 < 控制 }。
//
export const On = Get;


//
// 用户自定义取值方法空间。
//
Get.v = {};


/**
 * 自定义取值方法。
 * 对象/类实例：
 * - 方法默认会绑定（bind）到所属宿主对象。
 * - 可以注入到深层子域，但扩展集本身不支持深层嵌套（不用于By）。
 * - 如果目标中间子域不存在，会自动创建。
 * 函数：
 * 支持单个函数扩展到目标子域，此时args为取栈数量实参。
 * 注记：
 * - 这是简化版的 By:processExtend 逻辑。
 * - 只能在 On.v 空间设置。
 * @param  {String} name 目标域（可由句点分隔子域）
 * @param  {Object|Function} exts 扩展集或取值函数
 * @param  {[String]|Number} args 方法名集或取栈数量，可选。
 * @return {void}
 */
export function customGetter( name, exts, args ) {
    if ( $.isFunction(exts) ) {
        return hostSet( Get.v, name, exts, args );
    }
    namedExtend( name, exts, args, Get.v );
}
