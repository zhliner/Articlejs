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
//  格式：{路径标识: 映射键}
//  映射键：
//      [alt+][ctrl+][meta+][shift]:[event.key]
//
//  键序列：
//  映射键名全小写，修饰键之间 "+" 连接，":" 连接键名称，包括修饰键自身。
//  例：
//      alt:alt         单纯按 Alt 键
//      ctrl:control    单纯按 ctrl 键
//      alt+ctrl:f      组合按 Alt+Ctrl+F 三个键
//      :a              单纯按 A 键
//
//  用户配置：
//  外部可由用户配置覆盖此处的默认值，格式相同。
//
///////////////////////////////////////////////////////////////////////////////
//

export default {
    "panel.help":       ":f1",
    "panel.outline":    ":f3",
    "panel.slave":      ":f4",
    "panel.plugins":    ":f9",
    "panel.maximize":   ":f11",

    "input.textfull":   "alt:f",
    "input.submit":     "ctrl:enter"
}
