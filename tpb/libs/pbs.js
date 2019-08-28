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

import { _On } from "./pbs.on.js";
import { _By } from "./pbs.by.js";
import { _To } from "./pbs.to.js";


const $ = window.$;


//
// 全局顶层方法。
// 适用 On/By/To 三个域。
//
const _Base = {

    // 基础集
    /////////////////////////////////////////////////

    $( evo, rid ) {
        //
    },

    __$: 0,


    $$( evo, rid ) {
        //
    },

    __$$: 0,


    evo( evo, name ) {
        //
    },

    __evo: null,


    ev( evo, ...name ) {
        //
    },

    __ev: null,


    nil( evo ) {},

    __nil: null,


    del( evo, start, count ) {
        //
    },

    __del: null,


    hello( evo, msg ) {
        //
    },

    __hello: 1,


    // 控制类
    //===============================================

    pass( evo, val ) {
        //
    },

    __pass: 1,


    avoid( evo ) {
        //
    },

    __avoid: 0,


    stop( evo, end ) {
        //
    },

    __stop: 0,


    stopAll( evo, end ) {
        //
    },

    __stopAll: 0,


    // 暂存区赋值
    // 目标：赋值非取值，无。
    //===============================================

    pop( evo, n ) {
        //
    },

    __pop: null,


    slice( evo, beg, end ) {
        //
    },

    __slice: null,


    index( evo, n ) {
        //
    },

    __index: null,


    shift( evo, n ) {
        //
    },

    __shift: null,


    splice( evo, start, count ) {
        //
    },

    __splice: null,


    pick( evo, i ) {
        //
    },

    __pick: null,

};


const Base = $.assign( {}, _Base, bindMethod );



//
// 运算层基础方法。
// 仅用于 On/By 两个域。
//
const _Base2 = {

    // 类型转换
    //===============================================

    Arr( evo, ext ) {
        //
    },

    __Arr: 1,


    Str( evo, prefix = '', suffix = '' ) {
        //
    },

    __Str: 1,


    Bool( evo ) {
        //
    },

    __Bool: 1,


    Int( evo, radix ) {
        //
    },

    __Int: 1,


    Float( evo ) {
        //
    },

    __Float: 1,


    // 简单值操作
    //===============================================

    evn( evo, name, its ) {
        //
    },

    __evn: 0,


    data( evo, name, its ) {
        //
    },

    __data: 0,


    push( evo, ...val ) {
        //
    },

    __push: 0,


    value( evo, ...name ) {
        //
    },

    __value: 1,


    // 集合筛选
    //===============================================

    filter( evo, $expr ) {
        //
    },

    __filter: 1,


    not( evo, $expr ) {
        //
    },

    __not: 1,


    has( evo, $expr ) {
        //
    },

    __has: 1,


    flat( evo, deep ) {
        //
    },

    __flat: 1,


    // 简单运算
    //===============================================

    add( evo ) {
        //
    },

    __add: 2,


    sub( evo ) {
        //
    },

    __sub: 2,


    mul( evo ) {
        //
    },

    __mul: 2,


    div( evo ) {
        //
    },

    __div: 2,


    mod( evo ) {
        //
    },

    __mod: 2,


    divmod( evo ) {
        //
    },

    __divmod: 2,


    nneg( evo ) {
        //
    },

    __nneg: 1,


    vnot( evo ) {
        //
    },

    __vnot: 1,


    dup( evo ) {
        //
    },

    __dup: 1,


    clone( evo, event, deep, eventdeep ) {
        //
    },

    __clone: 3,


    // 比较运算
    //===============================================

    equal( evo ) {
        //
    },

    __equal: 2,


    nequal( evo ) {
        //
    },

    __nequal: 2,


    lt( evo ) {
        //
    },

    __lt: 2,


    lte( evo ) {
        //
    },

    __lte: 2,


    gt( evo ) {
        //
    },

    __gt: 2,


    gte( evo ) {
        //
    },

    __gte: 2,


    // 逻辑运算
    //===============================================

    within( evo ) {
        //
    },

    __within: 1,


    inside( evo ) {
        //
    },

    __inside: 1,


    both( evo ) {
        //
    },

    __both: 2,


    either( evo ) {
        //
    },

    __either: 2,


    every( evo ) {
        //
    },

    __every: 1,


    some( evo, n ) {
        //
    },

    __some: 1,


    // 判断执行。
    //===============================================

    vtrue( evo, $expr, ...rest ) {
        //
    },

    __vtrue: 1,


    vfalse( evo, $expr, ...rest ) {
        //
    },

    __vfalse: 1,


    // 其它
    //===============================================

    tpl( evo, name, timeout ) {
        //
    },

    __tpl: 0,

};


const Base2 = $.assing( {}, _Base2, bindMethod );



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 创建绑定方法。
 * 会同时在bound方法上设置取值条目数（.targetCount）。
 * 取栈条目数命名约定：前置2个下划线。
 * 注记：
 * 创建已绑定的全局方法，可以节省内存。
 *
 * @param {String} k 方法名
 * @param {Function} f 方法
 * @param {Object} obj 宿主对象
 */
function bindMethod( k, f, obj ) {

    if ( !k.startsWith('__') ) {
        let _bf = f.bind( obj );
        return ( _bf.targetCount = obj[ `__${k}` ], _bf );
    }
}



//
// 合并/导出
///////////////////////////////////////////////////////////////////////////////


const
    PB2 = Object.assign( Base2, Base ),
    On  = $.proto( _On, PB2 ),
    By  = $.proto( _By, PB2 ),
    To  = $.proto( _To, Base );


export { On, By, To };
