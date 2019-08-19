//! $Id: pbs.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT 基础集定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { _On } from "./pbs.on.js";
import { _By } from "./pbs.by.js";
import { _To } from "./pbs.to.js";


const $ = window.$;


//
// 全局顶层方法。
// 适用 On/By/To 三个域。
//
const Top = {
    //
};


//
// 运算层基础方法。
// 仅用于 On/By 两个域。
//
const Base = {
    //
};



const
    PB2 = Object.assign( Top, Base ),
    On  = $.proto( _On, PB2 ),
    By  = $.proto( _By, PB2 ),
    To  = $.proto( _To, Top );


export { On, By, To };
