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

import { Base, Base2 } from "./libs/pbs.base.js";
import { On } from "./libs/pbs.on.js";
import { By } from "./libs/pbs.by.js";
import { To } from "./libs/pbs.to.js";


const $ = window.$;


//
// 运算全局。
// 适用：On/By。
// 注：赋值方式减少一个搜寻层级。
//
const PB2 = Object.assign( Base2, Base );


//
// 基础集继承（原型）。
//
$.proto( On, PB2 ),
$.proto( By, PB2 ),
$.proto( To, Base );



export { On, By, To };
