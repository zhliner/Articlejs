//! $ID: extend.js 2022.01.05 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件 OnBy 扩展
//  导出的对象中需包含 On 和 By 两个成员。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { PlugOn, PlugBy } from "../../base/plugins.js";

const
    On = Object.create( PlugOn ),
    By = Object.create( PlugBy );


On.test = "example On";
By.test = "example By";

//:debug
window.console.info( On, By );


export { On, By };