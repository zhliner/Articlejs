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

import { EXTENT } from "../pbs.js";

const $ = window.$;


// X扩展库存储根。
const _X = {};


//
// 方法绑定宿主对象。
// 对普通对象会递进处理（绑定）。
//
function bindMethod( f, k, obj ) {
    if ( $.type(f) == 'Object' ) {
        return $.assign({}, f, bindMethod);
    }
    // 排除Symbol类型
    if ( k.length == null || k.startsWith('__') || !$.isFunction(f) ) {
        return;
    }
    f = f.bind( obj );
    return (f[EXTENT] = obj[`__${k}`] || 0), f;
}


/**
 * 外部扩展赋值接口。
 * @param  {Object} exts 扩展集
 * @return {void}
 */
function assign( exts ) {
    $.assign( _X, exts, bindMethod );
}


// 用原型存储/引用。
export const X = $.proto( assign, _X );
