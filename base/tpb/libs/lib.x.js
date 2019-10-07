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
//      X.extend( name, {...}, nobind ) 在name子域上扩展指令
//
//  动态扩展：
//      Tpb.Lib.X.extend( name, {...}, nobind ) 在name子域上扩展指令
//
//  注：
//  单纯获取目标子域：X.extend( name, null )
//
//  说明：
//  - 扩展指令支持名称前置双下划线（__）定义自动取栈数，默认会被设置为0。
//  - 默认会将指令绑定到宿主对象后存储，除非nobind为真，此时指令的this为当前指令对象（Cell）。
//  - 内嵌的子集指令（普通对象封装）会被递进处理（合并方式）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { EXTENT } from "../config.js";

const $ = window.$;


// X扩展存储区。
// 预置部分功能域。
const _X = {
    Fun:  {},   // 功能函数区（主要用于By系引用）
    App:  {},   // 网页App域（.pull, .[Xxx].run...）
    Math: {},   // 数学算法区
    Ease: {},   // 缓动计算区（.Linear...）
    Eff:  {},   // 特效目标区（.fade|slide|delay|width...）。注：与Ease分离
    Grid: {},   // CSS网格布局域（.Area）
    Flow: {},   // CSS弹性布局域
};


//
// 绑定方法到X宿主对象。
// 支持对象子集嵌套，会递进处理。
// 注：
// 取栈数默认会设置为0，除非明确设置为null。
//
function bindMethod( f, k, obj, to ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign(to[k] || {}, f, bindMethod) ];
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
 * 获取目标子域。
 * 如果目标子域不存在，则自动创建。
 * 子域链上的子域必须都是普通对象类型（Object）。
 * @param {[String]} names 子域链
 * @param {Object} obj 取值顶级域
 */
function subObj( names, obj ) {
    let _sub;

    for (const name of names) {
        _sub = obj[name];
        if ( !_sub ) {
            obj[name] = _sub = {};
            window.console.info(`add a new ${name}{} scope.`);
        }
        // 函数保护。
        else if ( $.type(_sub) != 'Object' ) {
            throw new Error(`the ${name} field is not a Object.`);
        }
    }
    return _sub;
}


/**
 * 接口：子域扩展。
 * 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * 子域是一种分组，支持句点分隔的子域链。
 * 最终的目标子域内的成员是赋值逻辑，重名会被覆盖。
 * 注：
 * 如果目标子域不存在，会自动创建，包括中间层级的子域。
 * 如果方法需要访问指令单元（this:Cell），传递nobind为真。
 *
 * @param  {String} name 扩展域
 * @param  {Object} exts 扩展集
 * @param  {Boolean} nobind 需要访问Cell实例，可选。
 * @return {Object} 目标子域
 */
function extend( name, exts, nobind ) {
    let _f = nobind ?
        setMethod :
        bindMethod;

    return $.assign( subObj(name.split('.'), _X), exts, _f );
}



//
// 导出。
///////////////////////////////////////////////////////////////////////////////

//
// 用原型空间存储。
//
export const X = $.proto( { extend }, _X );

