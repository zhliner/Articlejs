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
import { bindMethod } from "../globals.js";


const $ = window.$;


const _On = {
    /**
     * 构建正则表达式。
     * 目标：当前条目，可选。
     * 如果val明确传递null，采用目标值构建。
     * 参考：RE() 正则转换。
     * @param {String} val 字符串表示
     * @param {String} flag 正则修饰符
     */
    re( evo, val, flag ) {
        if ( val == null) {
            val = evo.data;
        }
        return new RegExp( val, flag );
    },

    __re: 0,


    /**
     * 构造日期对象。
     * 目标：当前条目，可选。
     * 目标有值时自动解包（如果为数组）传递到构造函数。
     * 注：无实参无目标时构造一个当前时间对象。
     * @param  {...Value} vals 实参值
     * @return {Date}
     */
    date( evo, ...vals ) {
        let _v = evo.data;

        if ( vals.length == 0 && _v != null ) {
            vals = $.isArray(_v) ? _v : [_v];
        }
        return new Date( ...vals );
    },

    __date: 0,


    /**
     * 修饰键状态封装/检查。
     * 即：shift/ctrl/alt/meta 键是否按下。按下为true，否则为false。
     * 目标：当前条目，可选。
     * 如果传递键名或暂存区有值，则为检查，否则简单封装4个键的状态。
     * 例：
     * scam('shift ctrl')  // 是否同时按下了Shift和Ctrl键。
     * scam, inside('shift ctrl', true)  // 捕获修饰键状态，检查同上
     *
     * @param {String} names 键名序列
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


    /**
     * 创建数值/字符范围序列。
     * 目标：当前条目，可选。
     * 明确传递beg为null，表示取流程数据。
     * @param  {Number|String} beg 起始数值/字符
     * @param  {Number|String} size 范围大小/终止字符
     * @param  {Number} step 步进值
     * @return {[Number|String]}
     */
    range( evo, beg, size, step ) {
        if ( beg == null ) {
            beg = evo.data;
        }
        return [...$.range( beg, size, step )];
    },

    __range: 0,

};



//
// 注：目标为首个实参，注释中忽略。
/////////////////////////////////////////////////


//
// pba/pbo专项取值。
// 目标：当前条目/栈顶1项。
// 注：简单调用 Util.pba/pbo 即可。
///////////////////////////////////////////////////////////////////////////////
[
    'pba',  // (): [String] | [[String]] 有序的参数词序列
    'pbo',  // (): [String] | [[String]] 选项词序列
]
.forEach(function( name ) {

    // 集合时返回一个值数组的数组。
    _On[name] = function( evo ) {
        if ( evo.data.nodeType == 1 ) return Util[name]( evo.data );
        if ( $.isArray(evo.data) ) return evo.data.map( el => Util[name](el) );
    };

    _On[`__${name}`] = 1;

});



//
// tQuery|Collector通用
///////////////////////////////////////////////////////////////////////////////
// 如果目标为元素，返回一个值、值集或null。
// 如果目标为Collector，返回一个值数组或一个新的Collector实例。
// 注：
// 下面注释中仅说明了目标为元素时的情况。


//
// 参数固定：1
// 目标：当前条目/栈顶1项。
//===============================================
[
    'attr',     // ( name ): String | null
    'prop',     // ( name ): String | Number | Boolean | undefined
    'css',      // ( name ): String
]
.forEach(function( meth ) {

    _On[meth] = function( evo, name ) {
        if ( $.isCollector(evo.data) ) return evo.data[meth]( name );
        if ( evo.data.nodeType == 1 ) return $[meth]( evo.data, name );
    };

    _On[`__${meth}`] = 1;

});


//
// 参数固定：0
// 目标：当前条目/栈顶1项。
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
        if ( $.isCollector(evo.data) ) return evo.data[meth]();
        if ( evo.data.nodeType == 1 ) return $[meth]( evo.data );
    };

    _On[`__${meth}`] = 1;

});


//
// 参数不定。
// 目标：当前条目/栈顶1项。
//===============================================
[
    'innerHeight',  // (): Number
    'innerWidth',   // (): Number
    'outerWidth',   // ( margin? ): Number
    'outerHeight',  // ( margin? ): Number
    'next',         // ( slr? ): Element | null
    'nextAll',      // ( slr? ): [Element]
    'nextUntil',    // ( slr? ): [Element]
    'prev',         // ( slr? ): Element | null
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
    _On[meth] = function( evo, ...rest ) {
        if ( $.isCollector(evo.data) ) return evo.data[meth]( ...rest );
        if ( evo.data.nodeType == 1 ) return $[meth]( evo.data, ...rest );
    };

    _On[`__${meth}`] = 1;

});



//
// tQuery专有
///////////////////////////////////////////////////////////////////////////////

//
// 灵活创建。
// 目标如果有值，跟随在实参之后。
// 目标：当前条目，可选。
// 实参数：不定。
//===============================================
[
    'table',        // ( rows, cols, caption?, th0? ): $.Table
    'selector',     // ( tag, attr?, val?, op? ): String
    'now',          // ( json? ): Number | String
]
.forEach(function( meth ) {

    // 多余实参无副作用
    _On[meth] = function( evo, ...rest ) {
        if ( evo.data !== undefined ) rest = rest.concat(evo.data);
        return $[meth]( ...rest );
    };

    _On[`__${meth}`] = 0;

});


//
// 目标：当前条目，可选。
// 固定参数：2。
//===============================================
[
    'Element',  // ( tag, data? ): Element
    'svg',      // ( tag, opts? ): Element
]
.forEach(function( meth ) {

    // 实参可选：its
    _On[meth] = function( evo, tag, its ) {
        if ( its === undefined ) its = evo.data;
        return $[meth]( tag, its );
    };

    _On[`__${meth}`] = 0;

});


//
// 目标：当前条目，可选。
// 固定参数：1。
//===============================================
[
    'Text',     // ( text? ): Text
    'create',   // ( html? ): DocumentFragment
    'dataName', // ( attr? ): String
    'tags',     // ( code? ): String
]
.forEach(function( meth ) {

    // 实参可选：code
    _On[meth] = function( evo, code ) {
        if ( code === undefined ) code = evo.data;
        return $[meth]( code );
    };

    _On[`__${meth}`] = 0;

});


//
// 目标：当前条目/栈顶1项。
//===============================================
[
    'is',           // ( slr ): Boolean
    'isXML',        // (): Boolean
    'controls',     // (): [Element]
    'serialize',    // ( exclude? ): [Array2]
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
    _On[meth] = function( evo, its ) { return $[meth]( evo.data, its ); };

    _On[`__${meth}`] = 1;

});



//
// Collector专有
// 目标：当前条目/栈顶1项。
///////////////////////////////////////////////////////////////////////////////
[
    'item',     // ( idx? ): Value | [Value]
    'eq',       // ( idx ):  Collector
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
        if ( $.isCollector(evo.data) ) return evo.data[meth]( its );
    };

    _On[`__${meth}`] = 1;

});



//
// 自我修改。
// 目标：当前条目/栈顶1项。
// 注：目标元素自身操作，无需 By/To 逻辑。
///////////////////////////////////////////////////////////////////////////////
[
    'detach',       // ( slr? ): void
    'remove',       // ( slr? ): void
    'unwrap',       // (): void
    'empty',        // (): void
    'normalize',    // (): void
]
.forEach(function( meth ) {
    /**
     * 部分方法需要slr实参。
     * 多余实参无副作用。
     * 注：外部可能需要预先封装为Collector实例。
     * @return {void}
     */
    _On[meth] = function( evo, slr ) {
        if ( $.isCollector(evo.data) ) evo.data[meth]( slr );
        if ( evo.data.nodeType ) $[meth]( evo.data, slr );
    };

    _On[`__${meth}`] = 1;

});



//
// 预处理，导出。
///////////////////////////////////////////////////////////////////////////////

const On = $.assign( {}, _On, bindMethod );


//
// 接口：提供预处理方法。
//
On.method = function( name ) {
    return name != 'method' && On[name];
};


export { On };
