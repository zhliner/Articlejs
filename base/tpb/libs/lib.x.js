//! $Id: lib.x.js 2019.09.07 Tpb.Libs $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	By:X 扩展库设计。
//
//  用户使用（模板中）：
//      x.[name].[meth]         // 例：x.Effect.line
//      x.[name].[xxx].[meth]   // 例：x.App.Example.run
//
//  静态扩展：
//      import { X } from 'libs/lib.x.js'
//      X.register( name, {...} )   注册新的子域
//      X.extend( name, {...} )     在name子域上扩展指令
//
//  动态扩展：
//      Tpb.Lib.X.register( name, {...} )       注册新的子域。
//      Tpb.Lib.X.extend( name, {...}, acell )  在name子域上扩展指令
//
//  注：
//  扩展库指令支持方法名前置双下划线（__）定义自动取栈数，默认会被设置为0。
//  指令默认会被绑定宿主对象后存储到X子域空间，除非传递acell为真。
//  支持嵌套的普通对象递归处理。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { EXTENT } from "../config.js";

const $ = window.$;


// X扩展存储区。
const _X = {
    // 功能函数区。
    // 主要用于By系中顶层指令对X库的引用。
    Fun: {}
};


//
// 绑定方法到X宿主对象。
// 支持对象子集嵌套，会递进处理。
// 注：
// 取栈数默认会设置为0，除非明确设置为null。
//
function bindMethod( f, k, obj ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign({}, f, bindMethod) ];
    }
    if ( !$.isFunction(f) ) {
        return [ f ];
    }
    if ( !f.name.startsWith('bound ') ) {
        f = f.bind( obj );
    }
    let _n = obj[`__${k}`];

    return ( f[EXTENT] = _n === undefined ? 0 : _n ), [ f ];
}


/**
 * 设置方法到X宿主对象。
 * 支持对象子集嵌套，会递进处理。
 * 取栈数默认会设置为0，除非明确设置为null。
 * 注：这是 bindMethod 的非绑定版。
 * @param {Function} f 方法
 * @param {String|Symbol} k 属性键
 * @param {Object} obj 源对象
 */
function setMethod( f, k, obj ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign({}, f, setMethod) ];
    }
    if ( !$.isFunction(f) ) {
        return [ f ];
    }
    let _n = obj[`__${k}`];

    return ( f[EXTENT] = _n === undefined ? 0 : _n ), [ f ];
}


/**
 * 接口：子域注册。
 * @param {String} name 子域名
 * @param {Object} obj 子域对象
 */
function register( name, obj ) {

    if ( _X[name] != null ) {
        throw new Error(`[${name}] is already exist.`);
    }
    _X[name] = obj;
}


/**
 * 接口：子域扩展。
 * 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * 子域是一级分组，内部的重名成员会被覆盖。
 * 注：
 * 如果扩展到一个尚未存在的子域，会自动新建该子域。
 * 如果方法需要访问指令单元（this:Cell），传递acell为真。
 *
 * @param  {String} name 扩展域
 * @param  {Object} exts 扩展集
 * @param  {Boolean} acell 需要访问Cell实例，可选。
 * @return {void}
 */
function extend( name, exts, acell = false ) {
    let _o = _X[name];

    if ( !_o ) {
        window.console.warn(`add a new X.${name} scope.`);
        _X[name] = _o = {};
    }
    // 保护顶层函数。
    else if ( $.type(_o) != 'Object' ) {
        throw new Error(`the ${name} field is not a Object.`);
    }
    let _f = acell ? setMethod : bindMethod;

    $.assign( _o, exts, _f );
}



//
// 导出。
///////////////////////////////////////////////////////////////////////////////

//
// 用原型空间存储。
//
export const X = $.proto( { register, extend }, _X );
