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

import { Base, Base2 } from "./pbs.base.js";
import { On } from "./pbs.on.js";
import { By, chainStore } from "./pbs.by.js";
import { To } from "./pbs.to.js";


const $ = window.$;


//
// 运算全局。
// 适用：On/By。
// 注：Base是一个代理对象。
//
$.proto( Base2, Base );


//
// 基础集继承（原型）。
//
$.proto( On, Base2 ),
$.proto( By, Base2 ),

$.proto( To.Where, Base );
$.proto( To.Stage, Base );



export { On, By, To, chainStore };
