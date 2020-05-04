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

import { subExtend } from "./config.js";


//
// X扩展存储区。
// 预置部分功能子域（名称空间）。
//
export const X = {
    Ease:   {},     // 缓动计算区（.Linear...）
    Eff:    {},     // 特效目标区（.fade|slide|delay|width...）。注：与Ease分离
    Math:   {},     // 数学算法区
    Fun:    {},     // 功能函数区

    // X库扩展。
    extend: (name, exts, nobind) => subExtend(name, exts, nobind, X),
};
