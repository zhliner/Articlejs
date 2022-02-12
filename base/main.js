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

import $, { tplMaps, TplrName, TplsPool, DEBUG } from "./tpb/config.js";
import { Tpb } from "./tpb/tpb.esm.js";
import { HotKey, ObjKey } from './tpb/tools/hotkey.js';
import { Sys, On, By } from "../config.js";
import cfg from "./shortcuts.js";
import { ESCStack } from "./common.js";
import { Edit, init, Kit } from "./edit.js";
import Api from "./api.js";

export { PlugOn, PlugBy } from "./plugins.js"


// 元素选择器配置
const
    __content = 'main.content',
    __outline = '#g-refresh';


window.GHK = new HotKey().config( cfg.Global );
window.SHK = new HotKey().config( cfg.Slave );
window.DHK = new HotKey().config( cfg.Modal );
window.CHK = new ObjKey(Edit).config( cfg.Content );

// 全局变量输出
// 用于模板中在调用链中提取&使用。
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

// 接口：
// 本地恢复通知。
// 注：会同时触发大纲更新按钮的点击事件。
Tpb.build(
    window,
    {
        on: `${Sys.recover}|savedhtml dup pass`,
        to: `${__content}|html|fire('${__outline}', 'click')`
    },
    On, By
);

// 当前On/By空间
Tpb.init( On, By )
    .config( tplMaps )
    .then( tr => tr.build(document) )
    .then( () => $.trigger(document.body, 'finish') )
    .then( () => Api.init($.get(__content)) )
    .then( () => Sys.readyCall() )
    .catch( e => Sys.failCall(e) )
    // 初始内容填充
    // 特殊值null/undefined表示不填充。
    .then( () => Sys.contenter() )
    .then( html => html != null && $.html($.get(__content), html) );


if ( DEBUG ) {
    window.On = On;
    window.By = By;
    window.Tpls = TplsPool.get( TplrName );
}
