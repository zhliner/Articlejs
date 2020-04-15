//! $Id: shortcuts.js 2019.10.11 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++++
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
//      这只是一种名称标识，实际上是关联到某元素的某目标事件（及其调用链）。
//      支持空格分隔多个名称，这样就可以从一个快捷键同时触发多个行为。
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

export default {

//
// 绑定目标指令。
//
Bound: [
    {
        // 隐/显大纲面板
        "key":      ":f2",
        "command":  "panel.outline",
    },
    {
        // 隐/显主面板
        "key":      ":f3",
        "command":  "panel.slave"
    },
    {
        // 隐/显帮助面板
        "key":      ":f4",
        "command":  "panel.help"
    },
    {
        "key":      ":f7",
        "command":  "panel.plugins"
    },
    {
        // 隐/显当前显示的面板
        // 若本无显示则针对全部面板。
        "key":      ":f9",
        "command":  "panel.clearall"
    },
    {
        // 同编辑器最大化按钮
        "key":      ":f10",
        "command":  "panel.maximize"
    },
    {
        // 录入框充满面板
        "key":      "alt:f",
        "command":  "input.tofull",
        // 仅适用主面板下的<textarea>
        "when":     ".Slave textarea"
    },
    {
        // 内容提交（同插入按钮）
        "key":      "ctrl:enter",
        "command":  "input.submit"
    },
    {
        // 内容提交后恢复正常
        // 注：录入框满面板时。
        "key":      "alt:enter",
        "command":  "input.submit2"
    },
],


//
// 功能键配置。
// 用于模板中引用目标键。
//
maps: {

    // 主面板高度调整
    // 修饰键+鼠标拖动改变面板高度。
    // 键名：[shift|ctrl|alt|meta] 大小写忽略。
    // 多个键名空格分隔。
    slaveSize:  'Alt',

}

};
