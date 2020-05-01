//! $Id: lib.x.js 2019.09.07 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 - 20120 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  By:X 扩展库。
//
//  扩展：
//      import { X } from './lib.x.js'
//      X.extend( name, {...}, nobind ) 在name子域上扩展
//
//  注：单纯获取目标子域：X.extend( name )
//
//  说明：
//  - 扩展指令支持名称前置双下划线（__）定义自动取栈数。
//  - 默认会将指令绑定到宿主对象后存储，除非nobind为真，此时指令的this为当前指令对象（Cell）。
//  - 内嵌的子指令集（需用普通对象封装）会被递进处理（合并）。
//
//
//  模板使用：
//      x.[name].[meth] // 例：x.Eff.line
//      x.[name].[xxx].[meth]
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { bindMethod, getMethod } from "./config.js";


const $ = window.$;


/**
 * 获取目标子域。
 * 如果目标子域不存在，则自动创建。
 * 子域链上的子域必须是普通对象类型（Object）。
 * @param {[String]} names 子域链
 * @param {Object} obj 取值顶级域
 */
function subObj( names, obj ) {
    let _sub;

    for (const name of names) {
        _sub = obj[name];

        if ( !_sub ) {
            obj[name] = _sub = {};
        }
        else if ( $.type(_sub) != 'Object' ) {
            throw new Error(`the ${name} field is not a Object.`);
        }
    }
    return _sub;
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////

/**
 * 接口：子域扩展。
 * 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * 子域是一种分组，支持句点分隔的子域链。
 * 最终的目标子域内的成员是赋值逻辑，重名会被覆盖。
 * 注：
 * 如果目标子域不存在，会自动创建，包括中间层级的子域。
 * 如果方法需要访问指令单元（this:Cell），传递nobind为真。
 * 可无exts实参调用返回子域本身。
 *
 * @param  {String} name 扩展域
 * @param  {Object} exts 扩展集，可选
 * @param  {Boolean} nobind 无需绑定（可能需要访问Cell实例），可选。
 * @return {Object} 目标子域
 */
export function extend__( name, exts, nobind, host ) {
    let _f = nobind ?
        getMethod :
        bindMethod;

    return $.assign( subObj(name.split('.'), host), exts || {}, _f );
}


//
// X扩展存储区。
// 预置部分功能子域（名称空间）。
//
export const X = {
    Ease:   {},     // 缓动计算区（.Linear...）
    Eff:    {},     // 特效目标区（.fade|slide|delay|width...）。注：与Ease分离
    Math:   {},     // 数学算法区
    Fun:    {},     // 功能函数区（用户使用）

    // X库扩展接口。
    // 向对象自身扩展（不可覆盖）。
    extend: (name, exts, nobind) => extend__(name, exts, nobind, X),
};
