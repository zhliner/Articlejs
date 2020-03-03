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
import { bindMethod, method } from "../config.js";


const
    $ = window.$,

    // 空白匹配。
    __reSpace = /\s+/,

    // 鼠标移动量存储键（横向）。
    __movementX = Symbol('mouse-movementX'),

    // 鼠标移动量存储键（纵向）。
    __movementY = Symbol('mouse-movementY');



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
        let [els, d] = stackArgs(stack, deep);
        return els.flat( d );
    },

    __flat_x: true,



    // 专有补充。
    //-------------------------------------------
    // 注记：
    // 事件对象中 movementX/movementY 值在缩放显示屏下有较大误差，
    // 因此这里用绝对像素（event.pageX/pageY）成员重新实现。
    // 主要用于鼠标移动（mousemove）事件的取值。


    /**
     * 鼠标水平移动量。
     * 目标：无。
     * 注记：前值存储在事件当前元素上，必要时应当重置（null）。
     * @param  {null} 清除存储
     * @return {Number} 变化量（像素）
     */
    movementX( evo, val ) {
        if ( val !== null ) {
            let _v = evo.current[__movementX];
            // n - undefined == NaN
            // => 0
            return ( evo.current[__movementX] = evo.event.pageX ) - _v || 0;
        }
        delete evo.current[__movementX];
    },


    /**
     * 鼠标垂直移动量。
     * 目标：无。
     * @param  {null} 清除存储
     * @return {Number} 变化量（像素）
     */
    movementY( evo, val ) {
        if ( val !== null ) {
            let _v = evo.current[__movementY];
            return ( evo.current[__movementY] = evo.event.pageY ) - _v || 0;
        }
        delete evo.current[__movementY];
    },

};



//
// PB专项取值。
// 目标：当前条目/栈顶1项。
// 注：简单调用 Util.pba/pbo/pbv 即可。
///////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////


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
///////////////////////////////////////////////////////////////////////////////

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
///////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////
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
        let [o, v] = stackArgs(stack, arg);
        return $.isCollector(o) ? o[meth]( v ) : $[meth]( o, v );
    };

    _On[`__${meth}_x`] = true;

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
function stackArgs( stack, val ) {
    return val === undefined ?
        stack.data(2) : [ stack.data(1), val ];
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
