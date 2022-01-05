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

import { BaseOn, BaseBy } from "../../base/tpb/tpb.esm.js";

const
    On = Object.create( BaseOn ),
    By = Object.create( BaseBy );


export { On, By };