//! $Id: lib.x.js 2019.09.07 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 20120 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  By:X 扩展库。
//
//  扩展：
//      import { Xextend } from './lib.x.js'
//      Xextend( 'Fun', ... ) 在 Fun 子域上扩展
//
//  说明：
//  - 扩展指令支持名称前置双下划线（__）定义自动取栈数。
//  - 默认会将指令绑定到宿主对象后存储，除非nobind为真，此时指令的this为当前指令对象（Cell）。
//  - 内嵌的子指令集（需用普通对象封装）会被递进处理（合并）。
//
//  模板使用：
//      x.[name].[meth]
//      x.[name].[xxx].[meth]
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { processExtend, By } from "./pbs.by.js";
import { Util } from "./tools/util.js";


//
// X扩展存储区。
// 预置部分功能子域（名称空间）。
//
const X = {
    Math:   {},     // 数学算法区
    Fun:    {},     // 功能函数区

    /**
     * 获取X库成员本身。
     * 目标：无。
     * 例：x.val('Fun.hello')
     * 解：获取 Fun 内的 hello 函数或值。
     * @param  {String} name 名称引用（句点分隔）
     * @return {Value}
     */
    val: (evo, name) => Util.subObj( name.split('.'), X ),
};


//
// X引入。
// 模板中使用小写形式。
//
By.x = X;


// 导出
//////////////////////////////////////////////////////////////////////////////

export function Xextend( name, exts, args ) {
    processExtend( `x.${name}`, exts, args );
}
