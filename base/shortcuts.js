//! $Id: shortcuts.js 2019.10.11 Articlejs.Config $
// +++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键系统默认配置。
//
//  格式：{指令标识: 映射键}
//
//  指令标识：
//      表达特定程序行为的ID，通常按归类分级（句点连接）。
//      这只是一种名称标识（字符串），由事件处理器注册（调用链中）。
//      支持空格分隔多个名称，这样就可以从一个位置（快捷键）同时触发多个行为。
//
//  映射键：
//      [alt+][ctrl+][meta+][shift]:[event.key]
//
//  映射键是一个修饰键加键名称的序列，全小写。
//  修饰键之间以加号（+）连接，而与键名称的连接则采用冒号（:）。注：修饰键也有键名称。
//  例：
//      alt:alt         单纯按 Alt 键
//      ctrl:control    单纯按 ctrl 键
//      alt+ctrl:f      组合按 Alt+Ctrl+F 三个键
//      :a              单纯按 A 键
//
//  用户配置：
//  外部可由用户配置覆盖此处的默认值，可经 HotKey.bind() 接口设置。
//
///////////////////////////////////////////////////////////////////////////////
//

export default [
    {
        "key":      ":f1",
        "command":  "panel.outline"
    },
    {
        "key":      ":f2",
        "command":  "panel.help"
    },
    {
        "key":      ":f3",
        "command":  "panel.outline panel.help"
    },
    {
        "key":      ":f4",
        "command":  "panel.slave"
    },
    {
        "key":      ":f10",
        "command":  "panel.clearAll"
    },
    {
        "key":      ":f9",
        "command":  "panel.plugins"
    },
    {
        "key":      ":f11",
        "command":  "panel.maximize"
    },
    {
        "key":      "alt:f",
        "command":  "input.textfull"
    },
    {
        "key":      "ctrl:enter",
        "command":  "input.submit"
    },
]
