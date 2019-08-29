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


const
    $ = window.$,

    // 指令属性名
    // 用于配置指令特性。
    __fxCount   = 'targetCount',    // 自动取栈计数
    __fxAccess  = 'stackAccess';    // 特权方法



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

    __$_n: 0,


    $$( evo, rid ) {
        //
    },

    __$$_n: 0,


    evo( evo, name ) {
        //
    },

    __evo_n: null,


    ev( evo, ...name ) {
        //
    },

    __ev_n: null,


    nil( evo ) {},

    __nil_n: null,


    del( evo, start, count ) {
        //
    },

    __del_n: null,


    hello( evo, msg ) {
        //
    },

    __hello_n: 1,


    // 控制类
    //===============================================

    pass( evo, val ) {
        //
    },

    __pass_n: 1,


    avoid( evo ) {
        //
    },

    __avoid_n: 0,


    stop( evo, end ) {
        //
    },

    __stop_n: 0,


    stopAll( evo, end ) {
        //
    },

    __stopAll_n: 0,


    // 暂存区赋值
    // 目标：赋值非取值，无。
    //===============================================

    pop( evo, n ) {
        //
    },

    __pop_x: true,
    __pop_n: null,


    slice( evo, beg, end ) {
        //
    },

    __slice_x: true,
    __slice_n: null,


    index( evo, n ) {
        //
    },

    __index_x: true,
    __index_n: null,


    shift( evo, n ) {
        //
    },

    __shift_x: true,
    __shift_n: null,


    splice( evo, start, count ) {
        //
    },

    __splice_x: true,
    __splice_n: null,


    pick( evo, i ) {
        //
    },

    __pick_x: true,
    __pick_n: null,

};


const Base = $.assign( {}, _Base, getMethod );



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

    __Arr_n: 1,


    Str( evo, prefix = '', suffix = '' ) {
        //
    },

    __Str_n: 1,


    Bool( evo ) {
        //
    },

    __Bool_n: 1,


    Int( evo, radix ) {
        //
    },

    __Int_n: 1,


    Float( evo ) {
        //
    },

    __Float_n: 1,


    // 简单值操作
    //===============================================

    evn( evo, name, its ) {
        //
    },

    __evn_n: 0,


    data( evo, name, its ) {
        //
    },

    __data_n: 0,


    push( evo, ...val ) {
        //
    },

    __push_n: 0,


    value( evo, ...name ) {
        //
    },

    __value_n: 1,


    // 集合筛选
    //===============================================

    filter( evo, $expr ) {
        //
    },

    __filter_n: 1,


    not( evo, $expr ) {
        //
    },

    __not_n: 1,


    has( evo, $expr ) {
        //
    },

    __has_n: 1,


    flat( evo, deep ) {
        //
    },

    __flat_n: 1,


    // 简单运算
    //===============================================

    add( evo ) {
        //
    },

    __add_n: 2,


    sub( evo ) {
        //
    },

    __sub_n: 2,


    mul( evo ) {
        //
    },

    __mul_n: 2,


    div( evo ) {
        //
    },

    __div_n: 2,


    mod( evo ) {
        //
    },

    __mod_n: 2,


    divmod( evo ) {
        //
    },

    __divmod_n: 2,


    nneg( evo ) {
        //
    },

    __nneg_n: 1,


    vnot( evo ) {
        //
    },

    __vnot_n: 1,


    dup( evo ) {
        //
    },

    __dup_n: 1,


    clone( evo, event, deep, eventdeep ) {
        //
    },

    __clone_n: 3,


    // 比较运算
    //===============================================

    equal( evo ) {
        //
    },

    __equal_n: 2,


    nequal( evo ) {
        //
    },

    __nequal_n: 2,


    lt( evo ) {
        //
    },

    __lt_n: 2,


    lte( evo ) {
        //
    },

    __lte_n: 2,


    gt( evo ) {
        //
    },

    __gt_n: 2,


    gte( evo ) {
        //
    },

    __gte_n: 2,


    // 逻辑运算
    //===============================================

    within( evo ) {
        //
    },

    __within_n: 1,


    inside( evo ) {
        //
    },

    __inside_n: 1,


    both( evo ) {
        //
    },

    __both_n: 2,


    either( evo ) {
        //
    },

    __either_n: 2,


    every( evo ) {
        //
    },

    __every_n: 1,


    some( evo, n ) {
        //
    },

    __some_n: 1,


    // 判断执行。
    //===============================================

    vtrue( evo, $expr, ...rest ) {
        //
    },

    __vtrue_n: 1,


    vfalse( evo, $expr, ...rest ) {
        //
    },

    __vfalse_n: 1,


    // 其它
    //===============================================

    tpl( evo, name, timeout ) {
        //
    },

    __tpl_n: 0,

};


const Base2 = $.assing( {}, _Base2, getMethod );



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取指令/方法。
 * 非特权方法会绑定方法内this为原生宿主对象。
 * 会在目标方法上设置取值条目数（.targetCount）。
 * 注记：
 * 创建已绑定的全局方法，可以节省内存。
 *
 * @param {String} k 方法名
 * @param {Function} f 方法
 * @param {Object} obj 宿主对象
 */
function getMethod( k, f, obj ) {

    if ( k.startsWith('__') ) {
        return;
    }
    let _n = obj[ `__${k}_n` ];

    return [ obj[ `__${k}_x` ] ? funcSets( f, _n, true ) : funcSets( f.bind(obj), _n ) ];
}


/**
 * 指令/方法属性设置：{
 *  - stackAccess 是否为特权方法。
 *  - targetCount 自动取栈条目数。
 * }
 * @param {Function} f 目标指令
 * @param {Number} n 自动取栈数量
 * @param {Boolean} ix 是否为特权指令
 */
function funcSets( f, n, ix ) {
    if ( ix ) f[__fxAccess] = true;
    return ( f[__fxCount] = n, f );
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
