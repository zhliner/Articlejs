//! $Id: lib.x.js 2019.09.07 Tpb.Libs $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	By:X 扩展库设计。
//  使用：Tpb.Lib.X({...})。
//
//  扩展库方法支持方法名前置双下划线（__）定义自动取栈数，默认会被设置为0。
//  嵌套的普通对象会被递进解析处理。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { EXTENT, NOBIND } from "../config.js";

const $ = window.$;


// X扩展库存储根。
const _X = {};


//
// 方法绑定宿主对象。
// 支持对象子集嵌套，会递进预处理。
//
function bindMethod( f, k, obj ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign({}, f, bindMethod) ];
    }
    if ( !$.isFunction(f) ) {
        return [ f ];
    }
    if ( !f[NOBIND] && !f.name.startsWith('bound ') ) {
        f = f.bind( obj );
    }
    return ( f[EXTENT] = obj[`__${k}`] || 0 ), [ f ];
}


/**
 * 接口：外部扩展。
 * 扩展被预处理后存储到 _X 局部域空间。
 * 局部域是一些命名的子域，重名成员会被覆盖。
 * @param  {String} name 扩展域
 * @param  {Object} exts 扩展集
 * @return {void}
 */
function extend( name, exts ) {
    let _o = _X[name];

    if ( !_o ) {
        _X[name] = _o = {};
    }
    // 保护顶层函数。
    else if ( $.type(_o) != 'Object' ) {
        throw new Error(`the ${name} field is not a Object.`);
    }
    $.assign( _o, exts, bindMethod );
}


// 原型空间（X）。
export const X = $.proto( extend, _X );
