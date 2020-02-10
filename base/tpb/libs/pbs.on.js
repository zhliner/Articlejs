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


const $ = window.$;


const _On = {
    /**
     * 构建正则表达式。
     * 目标：当前条目，可选。
     * 特权：是，灵活取栈。
     * 如果val未定义，采用目标值构建。
     * @param  {String} flag 正则修饰符
     * @param  {String} val 正则式的字符串表示，可选
     * @return {RegExp}
     */
    re( evo, stack, flag, val ) {
        if ( val == null) {
            val = stack.data(1);
        }
        return new RegExp( val, flag );
    },

    __re_x: true,


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
     * 即：shift/ctrl/alt/meta 键是否按下。按下为true，否则为false。
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
        return names ? name.trim().split(/\s+/).every( n => _map[n] ) : _map;
    },

    __scam: 0,



    // tQuery定制
    //===========================================


    /**
     * 测试是否包含。
     * 前者是否为后者的上级容器元素。
     * 目标：当前条目/栈顶2项。
     * @return {Boolean}
     */
    contains( evo ) {
        return $.contains( evo.data[0], evo.data[1] );
    },

    __contains: 2,

};



//
// 注：目标为首个实参，注释中忽略。
/////////////////////////////////////////////////


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
        if ( evo.data.nodeType == 1 ) {
            return $[meth]( evo.data, name );
        }
        return $(evo.data)[meth]( name );
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
        if ( evo.data.nodeType == 1 ) {
            return $[meth]( evo.data );
        }
        return $(evo.data)[meth]();
    };

    _On[`__${meth}`] = 1;

});


//
// 参数不定。
// 目标：当前条目/栈顶1项。
// 内容：{Element|[Element]|Collector}
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

    // 多余实参无副作用
    _On[meth] = function( evo, ...args ) {
        if ( evo.data.nodeType == 1 ) {
            return $[meth]( evo.data, ...args );
        }
        return $(evo.data)[meth]( ...args );
    };

    _On[`__${meth}`] = 1;

});



//
// tQuery专有
///////////////////////////////////////////////////////////////////////////////

//
// 灵活创建。
// 目标：当前条目，可选。
// 如果目标有值，合并在实参之后传递。
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
    'is',           // ( slr ): Boolean
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
    // 多余实参无副作用。
    _On[meth] = function( evo, ...args ) {
        return $[meth]( evo.data, ...args );
    };

    _On[`__${meth}`] = 1;

});



//
// Collector专有
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
// 预处理，导出。
///////////////////////////////////////////////////////////////////////////////

const On = $.assign( {}, _On, bindMethod );


//
// 接口：
// 提供预处理方法。
//
On[method] = name => On[name];


export { On };
