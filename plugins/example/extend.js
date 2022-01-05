//! $ID: extend.js 2022.01.05 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件OnBy扩展
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { BaseOn, BaseBy } from "../../base/tpb/tpb.esm.js";

const
    On = Object.create( BaseOn ),
    By = Object.create( BaseBy );


On.test = "example On";
By.test = "example By";


export { On, By };