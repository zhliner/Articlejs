//! $ID: main.js 2019.11.16 Articlejs.User $
// +++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 - 2022 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  入口文件。
//
//  汇聚需要的模块，设置编辑器全局环境，执行初始化并构建。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $, { Web, Templates, DEBUG } from "./base/tpb/config.js";
import { Tpb } from "./base/tpb/tpb.js";
import cfg from "./base/shortcuts.js";
import { HotKey, ObjKey } from './base/tpb/tools/hotkey.js';
import { Edit, init, Kit } from "./base/edit.js";
import { ESCStack } from "./base/common.js";
import { Sys, On, By } from "./config.js";

window.GHK = new HotKey().config( cfg.Global );
window.SHK = new HotKey().config( cfg.Slave );
window.DHK = new HotKey().config( cfg.Modal );
window.CHK = new ObjKey(Edit).config( cfg.Content );

// 供模板中直接使用。
// 主要用于调用链中使用其方法。
window.Sys = Sys;
window.Kit = Kit;
window.KM = cfg.Keys;
window.edInit = init;

// 取消实例栈。
window.ESC = new ESCStack();

// 开启tQuery变化事件监听。
$.config({
    varyevent: true,
    // bindevent: true
});
Tpb.Init( On, By );
Tpb.build( document, Web.tplmap ).then( () => $.trigger(document.body, 'finish') );


if ( DEBUG ) {
    window.On = On;
    window.By = By;
    window.Tpls = Templates;
}
