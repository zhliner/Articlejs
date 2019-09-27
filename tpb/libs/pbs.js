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
//  可能支持模板和模板渲染（视全局配置而定）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Base, Base2 } from "./pbs.base.js";
import { On } from "./pbs.on.js";
import { By, chainStore } from "./pbs.by.js";
import { To } from "./pbs.to.js";

import { Builder } from "./obter.js";
import { Templater } from "./templater.js";
import { Render } from "./render.js";
import { tplLoad } from "./tloader.js";
import { Support } from "../globals.js";


const $ = window.$;


// 运算全局。
// 适用：On/By。
$.proto( Base2, Base );


// 基础集继承（原型）。
$.proto( On, Base2 ),
$.proto( By, Base2 ),

$.proto( To.Where, Base );
$.proto( To.Stage, Base );



let tplStore;

//
// 模板支持。
//
if ( Support.template ) {
    // OBT 构造器
    const obter = new Builder(
            {
                on:     On,
                by:     By,
                where:  To.Where,
                stage:  To.Stage,
            },
            chainStore
        );

    // 模板管理器
    tplStore = new Templater(
        tplLoad,
        obter.build.bind(obter),
        Support.render && Render
    );
}


Base.init( tplStore );
