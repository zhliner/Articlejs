//! $ID: exts/config.js 2022.01.26 Cooljed.Extension $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Cooljed 扩展基础配置。
//
///////////////////////////////////////////////////////////////////////////////
//

import { ROOT } from "../tpb/user.js";
import { Loader } from "../tpb/tools/tloader.js";


//
// 公共基础配置
//////////////////////////////////////////////////////////////////////////////

const
    // 根目录限定。
    XLoader = new Loader( `${ROOT}base/exts/` );


//
// 供统一引用。
//
export default window.$;
