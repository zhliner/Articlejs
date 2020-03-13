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
import { bindMethod, method, DataStore, ChainStore } from "../config.js";


const
    $ = window.$,

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



const _On = {
    /**
     * 构造日期对象。
     * 目标：当前条目，可选。
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
     * 关联数据获取。
     * 目标：当前条目/栈顶1-2项。
     * 特权：是，灵活取栈。
     * 从流程元素关联的存储区取值。
     * 当name实参为空时，取栈顶2项：[Element, name]。
     * @param {Stack} stack 数据栈
     * @param  {String} name 键名/序列
     * @param  {Value|[Value]} val 存储值，可选
     * @return {Value|void}
     */
    data( evo, stack, name ) {
        let [el, k] = stackArg2(stack, name),
            _m = DataStore.get(el);

        if ( _m ) return _m.get( k );
    },

    __data_x: true,


    /**
     * 关联数据多名称取值。
     * 目标：当前条目/栈顶1-2项。
     * 特权：是，灵活取栈。
     * 从流程元素关联的存储区同时取多个值。
     * 无关联存储时无返回值，否则始终返回一个数组（大小相同）。
     * 当names实参为空时，取栈顶2项：[Element, names]。
     * @param  {Stack} stack 数据栈
     * @param  {String} names 名称序列（空格分隔）
     * @return {[Value]|void}
     */
    xdata( evo, stack, names ) {
        let [el, ns] = stackArg2(stack, names),
            _m = DataStore.get(el)

        if ( _m ) return ns.split(__reSpace).map( n => _m.get(n) );
    },

    __xdata_x: true,


    /**
     * 修饰键状态检查|封装。
     * 即 shift/ctrl/alt/meta 键是否按下。
     * 目标：当前条目，可选。
     * 如果传递键名或暂存区有值，则为检查，否则简单封装4个键的状态。
     * 例：
     * scam('shift ctrl')  // 是否同时按下了Shift和Ctrl键。
     * scam, inside('shift ctrl', true)  // 效果同上
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

    __scam: 0,


    /**
     * 预绑定调用链提取。
     * 目标：当前条目/栈顶1项。
     * 提取目标元素上预绑定的调用链（链头指令实例）。
     *
     * 提取的是单个调用链，可直接用于实时的事件绑定/解绑（on|off|one）。
     * 也可以转存到新的元素（可用不同的事件名标识）便于绑定使用（bind|once）。
     * 注：
     * 克隆参数可用于新链头接收不同的初始值。
     *
     * @param  {String} evnid 事件名标识
     * @param  {Boolean} clone 是否克隆
     * @return {Cell|null}
     */
    chain( evo, evnid, clone ) {
        let _map = ChainStore.get( evo.data ),
            _cel = _map && _map.get( evnid );

        // 返回null有确定性。
        return _cel ? (clone ? _cel.clone() : _cel) : null;
    },

    __chain: 1,


    /**
     * 预绑定调用链提取。
     * 目标：当前条目/栈顶1项。
     * 提取目标元素上预绑定的调用链集。
     * 主要用于预绑定调用链的不同元素间转存（模板定义复用）。
     * 与chain不同，此处会保持原始名称（名值对对象）。
     * evnid 支持空格分隔多个名称指定。
     * evnid 为空或假值表示通配，匹配目标元素上的全部预存储。
     * @param  {String} evnid 事件名标识/序列
     * @param  {Boolean} clone 是否克隆
     * @return {Map<evnid:Cell>}
     */
    chains( evo, evnid, clone ) {
        let _src = ChainStore.get( evo.data );
        if ( !_src ) return;

        if ( !evnid ) {
            return clone ? cloneMap( _src ) : _src;
        }
        return chainMap( _src, evnid.split(__reSpace), clone );
    },

    __chains: 1,



    // 集合操作。
    //-------------------------------------------
    // 另：见末尾部分接口。

    /**
     * 集合成员去重&排序。
     * 目标：当前条目/栈顶1项。
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
     * 目标：当前条目/栈顶1项。
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
     * 目标：当前条目/栈顶1项。
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
     * 目标：当前条目/栈顶1-2项。
     * 特权：是，灵活取栈。
     * 如果是元素Collector集合，deep可以为true附加去重排序（1级扁平化）。
     * 如果实参未传递，取栈顶2项：[集合, 深度值]
     * @param  {Stack} stack 数据栈
     * @param  {Number|true} deep 深度或去重排序，可选
     * @return {[Value]|Collector}
     */
    flat( evo, stack, deep ) {
        let [els, d] = stackArg2(stack, deep);
        return els.flat( d );
    },

    __flat_x: true,



    // 专有补充。
    //-------------------------------------------


    /**
     * 鼠标水平移动量。
     * 目标：无。
     * 前值存储在事件当前元素上，解绑时应当重置（null）。
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
     * 目标：当前条目，可选。
     * 支持指定目标滚动元素，如果目标为空，则取事件当前元素。
     * 前值存储在事件当前元素上，因此目标元素的滚动量是特定于当前事件的。
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

    __scrollX: 0,


    /**
     * 内容垂直滚动量。
     * 目标：当前条目，可选。
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

    __scrollY: 0,

};



//
// PB专项取值。
// 目标：当前条目/栈顶1项。
// 注：简单调用 Util.pba/pbo/pbv 即可。
//////////////////////////////////////////////////////////////////////////////
[
    'pba',  // (): [String] | [[String]] 有序的参数词序列
    'pbo',  // (): [String] | [[String]] 选项词序列
    'pbv',  // (): String | [String] 属性值
]
.forEach(function( name ) {

    _On[name] = function( evo ) {
        if ( evo.data.nodeType == 1 ) return Util[name]( evo.data );
        if ( $.isArray(evo.data) ) return evo.data.map( el => Util[name](el) );
    };

    _On[`__${name}`] = 1;

});



//
// tQuery|Collector通用
//////////////////////////////////////////////////////////////////////////////


//
// 参数固定：1
// 目标：当前条目/栈顶1项。
// 注：固定参数为1以限定为取值。
//===============================================
[
    'attribute',    // ( name ): String | null
    'attr',         // ( name ): String | Object | null
    'property',     // ( name ): Value | undefined
    'prop',         // ( name ): Value | Object | undefined
    'css',          // ( name ): String
    'cssGets',      // ( name ): Object
]
.forEach(function( meth ) {

    _On[meth] = function( evo, name ) {
        return $.isArray(evo.data) ?
            $(evo.data)[meth]( name ) : $[meth]( evo.data, name );
    };

    _On[`__${meth}`] = 1;

});


//
// 参数固定：0
// 目标：当前条目/栈顶1项。
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

    _On[meth] = function( evo ) {
        return $.isArray(evo.data) ? $(evo.data)[meth]() : $[meth](evo.data);
    };

    _On[`__${meth}`] = 1;

});


//
// 参数不定。
// 目标：当前条目/栈顶1项。
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
    _On[meth] = function( evo, ...args ) {
        return $.isArray(evo.data) ?
            $(evo.data)[meth]( ...args ) : $[meth]( evo.data, ...args );
    };

    _On[`__${meth}`] = 1;

});



//
// tQuery专有
//////////////////////////////////////////////////////////////////////////////

//
// 灵活创建。
// 目标：当前条目，可选。
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
    _On[meth] = function( evo, ...args ) {
        if ( evo.data !== undefined ) {
            args = args.concat( evo.data );
        }
        return $[meth]( ...args );
    };

    _On[`__${meth}`] = 0;

});


//
// 目标：当前条目/栈顶1项。
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

    _On[meth] = function( evo, ...args ) {
        return $[meth]( evo.data, ...args );
    };

    _On[`__${meth}`] = 1;

});



//
// Collector专有。
// 目标：当前条目/栈顶1项。
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
    _On[meth] = function( evo, its ) {
        return $(evo.data)[meth]( its );
    };

    _On[`__${meth}`] = 1;

});



//
// 集合操作。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 如果实参未传递，取栈顶2项：[集合, 实参]
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
     * @data: [Value]|Collector
     * @param  {Stack} stack 数据栈
     * @param  {...} arg 模板实参，可选
     * @return {[Value]|Collector}
     */
    _On[meth] = function( evo, stack, arg ) {
        let [o, v] = stackArg2(stack, arg);
        return $.isCollector(o) ? o[meth]( v ) : $[meth]( o, v );
    };

    _On[`__${meth}_x`] = true;

});



//
// 元素自身行为。
//////////////////////////////////////////////////////////////////////////////

//
// 元素表现。
// 目标：当前条目/栈顶1项。
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
    _On[names[0]] = function( evo, sure = true ) {
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

    _On[`__${names[0]}`] = 1;

});


//
// 节点封装。
// 目标：当前条目/栈顶1项。
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
    _On[meth] = function( evo, box ) {
        let x = evo.data;
        return $.isArray(x) ? $(x)[meth](box) : $[meth](x, box);
    };

    _On[`__${meth}`] = 1;

});


//
// 自我修改。
// 目标：当前条目/栈顶1项。
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
    _On[meth] = function( evo, slr, back ) {
        if ( typeof slr == 'boolean' ) {
            [back, slr] = [slr];
        }
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth](slr) : $[meth](_x, slr);

        if ( back ) return _d;
    };

    _On[`__${meth}`] = 1;

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
    _On[meth] = function( evo, back ) {
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth]() : $[meth](_x);

        if ( back ) return _d;
    };

    _On[`__${meth}`] = 1;

});



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


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

const On = $.assign( {}, _On, bindMethod );


//
// 接口：
// 提供预处理方法。
//
On[method] = name => On[name];


export { On };
