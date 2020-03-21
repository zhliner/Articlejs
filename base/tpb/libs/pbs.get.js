//! $Id: pbs.on.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:On 方法集。
//  主要是 tQuery/Collector 库里的取值方法封装。
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { bindMethod, method, DataStore, Templater, ChainStore } from "../config.js";
import { Control, Process } from "./pbs.base.js";


const
    $ = window.$,

    // evo成员名/值键。
    evoIndex = {
        0:  'event',    // 原生事件对象（注：ev指令可直接获取）
        1:  'origin',   // 事件起点元素（event.target）
        2:  'current',  // 触发事件的当前元素（event.currentTarget|matched）
        3:  'delegate', // 事件相关联元素（event.relatedTarget）
        4:  'related',  // 委托绑定的元素（event.currentTarget）
        5:  'selector', // 委托匹配选择器（for match）]
        10: 'data',     // 自动获取的流程数据
        11: 'entry',    // 中段入口（迭代重入）
        12: 'targets',  // To目标元素/集，向后延续
    },

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
    dataUnfound = 'err:data-store is undefined.',
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
     * 直接数据入栈。
     * 目标：暂存区条目可选。
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



    // 类型转换&构造。
    // 目标：暂存区/栈顶1项。
    // 返回值而非该类型的对象。
    //-----------------------------------------------------

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


    /**
     * 创建预填充值集合。
     * 目标：暂存区条目可选。
     * 如果目标有值，会合并到实参序列之后（数组会被解构）。
     * 最后一个值用于剩余重复填充。
     * 如果完全没有填充值，数组成员会填充为undefined。
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
     * 对象属性赋值。
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
        return kvsObj( names.split(__reSpace), evo.data );
    },

    __gather: 1,



    // 复杂取值。
    //-----------------------------------------------


    /**
     * 从目标上取值入栈。
     * 目标：暂存区/栈顶1项。
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
        return Object.values(evo.data);
    },

    __values: 1,


    /**
     * 函数创建。
     * 目标：暂存区/栈顶1项。
     * 取目标为函数体表达式（无return）构造函数。
     * 实参即为函数参数名序列。
     * @param  {...String} argn 参数名序列
     * @return {Function}
     */
    func( evo, ...argn ) {
        return new Function( ...argn, `return ${evo.data};` );
    },

    __func: 1,


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


    /**
     * 特性提取并删除。
     * 提取特性值之后移除特性，通常用于数据一次性存储和提取。
     * this: On
     * @param  {String} names 名称/序列
     * @return {String|Object|[String]|[Object]}
     */
    xattr( evo, names ) {
        let _val = __reSpace.test(names) ?
            this.attr(evo, names) : this.attribute(evo, names);

        return $(evo.data).removeAttr(names), _val;
    },

    __xattr: 1,


    /**
     * 关联数据提取。
     * 目标：暂存区/栈顶1-2项。
     * 特权：是，灵活取值。
     * 从流程元素关联的存储区取值。
     * name支持空格分隔的名称序列，如果为空，取目标：[Element, name]。
     * 若目标存储集不存在，返回错误并中断。
     * 注记：
     * 因为主要是直接使用（如插入DOM），故返回值数组（而不是键值对象）。
     * 如chains主要用于转储，所以保留键信息。
     * @param {Stack} stack 数据栈
     * @param  {String} name 名称/序列
     * @param  {Value|[Value]} val 存储值，可选
     * @return {Value|[Value]|reject}
     */
    data( evo, stack, name ) {
        let [el, ns] = stackArg2(stack, name),
            _m = DataStore.get(el);

        return _m ? getData(_m, ns) : Promise.reject(dataUnfound);
    },

    __data_x: true,


    /**
     * 构造日期对象。
     * 目标：暂存区条目可选。
     * 目标有值时自动解包（如果为数组）为构造函数的补充实参。
     * 注：无实参无目标时构造一个当前时间对象。
     * @param  {...Value} vals 实参值
     * @return {Date}
     */
    date( evo, ...vals ) {
        if ( evo.data !== undefined ) {
            vals = vals.concat( evo.data );
        }
        return new Date( ...vals );
    },

    __date: 0,


    /**
     * 修饰键状态检查|封装。
     * 即 shift/ctrl/alt/meta 键是否按下。
     * 目标：暂存区1项可选。
     * 如果指定键名则为检查，否则简单封装4个键的状态。
     * 可从暂存区获取键名指定。
     * names支持空格分隔的多个名称，全小写，And关系。
     * 例：
     * scam('shift ctrl')  // 是否同时按下了Shift和Ctrl键。
     * push('shift ctrl') pop scam      // 同上
     * scam inside('shift ctrl', true)  // 效果同上
     *
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
        if ( !names ) {
            names = evo.data;
        }
        return names ? name.split(__reSpace).every( n => _map[n] ) : _map;
    },

    __scam: -1,


    /**
     * 预绑定调用链提取（单个）。
     * 目标：暂存区/栈顶1项。
     * 提取目标元素上预绑定的调用链（链头指令实例）。
     *
     * 提取的调用链可直接用于实时的事件绑定/解绑（on|off|one）。
     * 也可改为不同的事件名标识转存到新的元素便于使用（bind|once）。
     * 注：
     * 克隆参数可用于新链头接收不同的初始值。
     * 错误：
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
     * @param  {null} 清除存储
     * @return {Number|void} 变化量（像素）
     */
    movementX( evo, val ) {
        if ( val !== null ) {
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
     * @param  {null} 清除存储
     * @return {Number|void} 变化量（像素）
     */
    movementY( evo, val ) {
        if ( val !== null ) {
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
     * @param  {null} 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrollX( evo, val ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( val !== null ) {
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
     * @param  {null} 清除存储
     * @return {Number|void} 变化量（像素）
     */
    scrollY( evo, val ) {
        let _box = evo.current,
            _its = evo.data || _box;

        if ( val !== null ) {
            let _v = _box[__scrollY];
            return ( _box[__scrollY] = _its.scrollTop ) - _v || 0;
        }
        delete _box[__scrollY];
    },

    __scrollY: -1,

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

    _Gets[name] = function( evo ) {
        if ( $.isArray(evo.data) ) {
            return evo.data.map( el => Util[name](el) );
        }
        return Util[name]( evo.data );
    };

    _Gets[`__${name}`] = 1;

});



//
// tQuery|Collector通用
//////////////////////////////////////////////////////////////////////////////


//
// 参数固定：1
// 目标：暂存区/栈顶1项。
// 注：固定参数为1以限定为取值。
// @return {String|Object|[String]|[Object]}
//===============================================
[
    'attribute',    // ( name:String ): String | null
    'attr',         // ( name:String ): String | Object | null
    'property',     // ( name:String ): Value | undefined
    'prop',         // ( name:String ): Value | Object | undefined
    'css',          // ( name:String ): String
    'cssGets',      // ( name:String ): Object
]
.forEach(function( meth ) {

    _Gets[meth] = function( evo, name ) {
        return $.isArray(evo.data) ?
            $(evo.data)[meth]( name ) : $[meth]( evo.data, name );
    };

    _Gets[`__${meth}`] = 1;

});


//
// 参数固定：0
// 目标：暂存区/栈顶1项。
// 注：无参数以限定为取值。
//===============================================
[
    'height',       // (): Number
    'width',        // (): Number
    'scroll',       // (): {top, left}
    'scrollTop',    // (): Number
    'scrollLeft',   // (): Number
    'offset',       // (): {top, left}
    'val',          // (): Value | [Value]
    'html',         // (): String   // 目标可为字符串（源码转换）
    'text',         // (): String   // 同上
]
.forEach(function( meth ) {

    _Gets[meth] = function( evo ) {
        return $.isArray(evo.data) ? $(evo.data)[meth]() : $[meth](evo.data);
    };

    _Gets[`__${meth}`] = 1;

});


//
// 参数不定。
// 目标：暂存区/栈顶1项。
// 注：多余实参无副作用。
//===============================================
[
    'innerHeight',  // (): Number
    'innerWidth',   // (): Number
    'outerWidth',   // ( margin? ): Number
    'outerHeight',  // ( margin? ): Number
    'next',         // ( slr?, until? ): Element | null
    'nextAll',      // ( slr? ): [Element]
    'nextUntil',    // ( slr? ): [Element]
    'prev',         // ( slr?, until? ): Element | null
    'prevAll',      // ( slr? ): [Element]
    'prevUntil',    // ( slr? ): [Element]
    'children',     // ( slr? ): [Element] | Element
    'contents',     // ( idx? ): [Node] | Node
    'siblings',     // ( slr? ): [Element]
    'parent',       // ( slr? ): Element | null
    'parents',      // ( slr? ): [Element]
    'parentsUntil', // ( slr ): [Element]
    'closest',      // ( slr ): Element | null
    'offsetParent', // (): Element
    'hasClass',     // ( name ): Boolean
    'classAll',     // (): [String]
    'position',     // (): {top, left}
]
.forEach(function( meth ) {
    /**
     * @data：Element|[Element]|Collector
     * @return {Element|Collector}
     */
    _Gets[meth] = function( evo, ...args ) {
        return $.isArray(evo.data) ?
            $(evo.data)[meth]( ...args ) : $[meth]( evo.data, ...args );
    };

    _Gets[`__${meth}`] = 1;

});



//
// tQuery专有
//////////////////////////////////////////////////////////////////////////////

//
// 灵活创建。
// 目标：暂存区1项可选。
// 如果目标有值，会合并到实参序列之后传递。
// 注：多余实参无副作用。
//===============================================
[
    'Element',      // ( tag?, data?, ns?, doc? ): Element
    'svg',          // ( tag?, opts?, doc? ): Element
    'Text',         // ( text?, sep?, doc? ): Text
    'create',       // ( html?, clean?, doc? ): DocumentFragment
    'table',        // ( rows?, cols?, th0?, doc? ): $.Table
    'dataName',     // ( attr? ): String
    'tags',         // ( code? ): String
    'selector',     // ( tag?, attr?, val?, op? ): String
    'range',        // ( beg?, size?, step? ): [Number]|[String]
    'now',          // ( json? ): Number|String
]
.forEach(function( meth ) {

    // 多余实参无副作用
    _Gets[meth] = function( evo, ...args ) {
        if ( evo.data !== undefined ) {
            args = args.concat( evo.data );
        }
        return $[meth]( ...args );
    };

    _Gets[`__${meth}`] = -1;

});


//
// 目标：暂存区/栈顶1项。
// 内容：参考tQuery相关接口的首个参数说明。
// 注：多余实参无副作用。
//===============================================
[
    'is',           // ( slr|Element ): Boolean
    'isXML',        // (): Boolean
    'controls',     // (): [Element]
    'serialize',    // ( ...names ): [Array2]
    'queryURL',     // (): String
    'isArray',      // (): Boolean
    'isNumeric',    // (): Boolean
    'isFunction',   // (): Boolean
    'isCollector',  // (): Boolean
    'type',         // (): String
    'kvsMap',       // ( kname?, vname? ): [Object2]
]
.forEach(function( meth ) {

    _Gets[meth] = function( evo, ...args ) {
        return $[meth]( evo.data, ...args );
    };

    _Gets[`__${meth}`] = 1;

});



//
// Collector专有。
// 目标：暂存区/栈顶1项。
// 注：如果目标不是Collector实例，会被自动转换。
//////////////////////////////////////////////////////////////////////////////
[
    'item',     // ( idx? ): Value | [Value]
    'eq',       // ( idx? ): Collector
    'first',    // ( slr? ): Collector
    'last',     // ( slr? ): Collector
]
.forEach(function( meth ) {
    /**
     * 集合成员取值。
     * @param {Number} its:idx 位置下标（支持负数）
     * @param {String} its:slr 成员选择器
     */
    _Gets[meth] = function( evo, its ) {
        return $(evo.data)[meth]( its );
    };

    _Gets[`__${meth}`] = 1;

});



//
// 元素自身行为。
//////////////////////////////////////////////////////////////////////////////

//
// 元素表现。
// 目标：暂存区/栈顶1项。
//===============================================
[
    ['hide',     'hidden'],
    ['lose',     'lost'],
    ['disable',  'disabled'],
    ['fold',     'folded'],
    ['truncate', 'truncated'],
]
.forEach(function( names ) {
    /**
     * 解除状态通常可传递实参null。
     * @param  {Boolean|null} sure 状态执行
     * @return {void}
     */
    _Gets[names[0]] = function( evo, sure = true ) {
        let _els = evo.data,
            _val = names[1];

        if ( !sure ) {
            _val = `-${_val}`;
        }
        if ( !$.isArray(_els) ) {
            _els = [_els];
        }
        _els.forEach( el => Util.pbo(el, [_val]) );
    };

    _Gets[`__${names[0]}`] = 1;

});


//
// 节点封装。
// 目标：暂存区/栈顶1项。
// 注：与To部分的同名方法不同，这里只接收字符串实参。
//===============================================
[
    'wrap',
    'wrapInner',
    'wrapAll',
]
.forEach(function( meth ) {
    /**
     * @param  {String} box 封装元素的HTML结构串
     * @return {Element|Collector} 包裹的容器元素（集）
     */
    _Gets[meth] = function( evo, box ) {
        let x = evo.data;
        return $.isArray(x) ? $(x)[meth](box) : $[meth](x, box);
    };

    _Gets[`__${meth}`] = 1;

});


//
// 自我修改。
// 目标：暂存区/栈顶1项。
// 执行结果可能入栈，由布尔实参（slr|back）决定。
// 注：多余实参无副作用。
//===============================================
[
    'remove',           // ( slr?, back? )
    'removeSiblings',   // ( slr?, back? )
    'normalize',        // ( depth?, back? )
]
.forEach(function( meth ) {
    /**
     * @param  {String|Number|Boolean} slr 选择器/影响深度或入栈指示
     * @param  {Boolean} back 入栈指示
     * @return {Element|Collector|void}
     */
    _Gets[meth] = function( evo, slr, back ) {
        if ( typeof slr == 'boolean' ) {
            [back, slr] = [slr];
        }
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth](slr) : $[meth](_x, slr);

        if ( back ) return _d;
    };

    _Gets[`__${meth}`] = 1;

});

[
    'empty',
    'unwrap',
]
.forEach(function( meth ) {
    /**
     * @param  {Boolean} back 入栈指示
     * @return {Element|Collector|void}
     */
    _Gets[meth] = function( evo, back ) {
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth]() : $[meth](_x);

        if ( back ) return _d;
    };

    _Gets[`__${meth}`] = 1;

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
 * 构造名值对对象。
 * @param  {[String]} names 名称序列
 * @param  {[Value]} val 值集
 * @return {Object}
 */
function kvsObj( names, val, obj = {} ) {
    return names.reduce( (o, k, i) => (o[k] = val[i], o), obj );
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
 * 是否为有值对象（非空）。
 * 注：空数组或空对象。
 * @param  {Object|Array} obj 测试对象
 * @return {Boolean|obj}
 */
function hasValue( obj ) {
    return typeof obj == 'object' ? obj && Object.keys(obj).length > 0 : obj;
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



//
// 预处理，导出。
///////////////////////////////////////////////////////////////////////////////


//
// 取值指令集。
// 注：供To:NextStage集成。
//
export const Get = $.assign( {}, _Gets, bindMethod );


//
// On指令集。
// 支持取值/控制/运算&加工集。
//
export const On = Object.assign( {}, Get, Control, Process );

//
// 接口：
// 提供预处理方法。
//
On[method] = name => On[name];


// window.console.info( 'Gets:', Object.keys(Get).length );
