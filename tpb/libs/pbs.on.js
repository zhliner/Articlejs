//! $Id: pbs.on.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:On 方法集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";


const $ = window.$;


const _On = {
    /**
     * 构建正则表达式。
     * 目标：可选当前条目，不取栈。
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
     * 目标：当前条目，不自动取栈。
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
     * 修饰键状态封装。
     * 即：shift/ctrl/alt/meta 键是否按下。
     * 按下为true，否则为false。
     */
    scam( evo ) {
        return {
            'shift': evo.event.shiftKey,
            'ctrl':  evo.event.ctrlKey,
            'alt':   evo.event.altKey,
            'meta':  evo.event.metaKey,
        };
    },

    __scam: null,



    // Collector专有
    //===========================================

    item( evo ) {
        //
    },


    eq( evo ) {
        //
    },


    first( evo ) {
        //
    },


    last( evo ) {
        //
    },



    // 简单处理
    // 目标：当前条目/栈顶1项。
    // 注：只是目标自身的操作，无需By/To逻辑。
    //===========================================

    detach( evo, slr ) {
        //
    },


    remove( evo, slr ) {
        //
    },


    unwrap( evo ) {
        //
    },


    empty( evo ) {
        //
    },


    normalize( evo ) {
        //
    },
};


[
    'pba',
    'pbo',
]
.forEach(function( name ) {
    /**
     * PB参数/选项取值。
     * 目标：当前条目/栈顶1项。
     * @return {[String]} 有序的参数词序列
     * @return {[String]} 选项词序列
     */
     _On[name] = function( evo ) {
        if ( evo.data.nodeType == 1 ) return Util[name]( evo.data );
        if ( $.isArray(evo.data) ) return evo.data.map( el => Util[name](el) );
    };

    // 取栈条目数。
    _On[`__${name}`] = 1;
});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////





export { _On };
