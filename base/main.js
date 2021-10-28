//! $ID: main.js 2019.11.16 Cooljed.User $
// +++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
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

import $, { Web, TplrName, TplsPool, DEBUG } from "./tpb/config.js";
import { Tpb } from "./tpb/tpb.js";
import cfg from "./shortcuts.js";
import { HotKey, ObjKey } from './tpb/tools/hotkey.js';
import { Edit, init, Kit } from "./edit.js";
import { ESCStack } from "./common.js";
import { Sys, On, By } from "../config.js";
import Api from "./api.js";

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
window.Api = Api;
// 取消实例栈。
window.ESC = new ESCStack();

// 开启tQuery变化事件监听。
$.config({
    varyevent: true,
    // bindevent: true
});

// 当前On/By空间
Tpb.Init( On, By );

// 构建&完成
Tpb.build( document, Web.tplmap )
    .then( () => $.trigger(document.body, 'finish') )
    .then( () => Api.init('#outline', '#editor', '#content', '#help', '#beeptip') )
    .then( () => Sys.readyCall() )
    .catch( e => Sys.failCall(e) );


if ( DEBUG ) {
    window.On = On;
    window.By = By;
    // Tpb.Init() 之后
    window.Tpls = TplsPool.get( TplrName );
}
