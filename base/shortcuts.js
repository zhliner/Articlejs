//! $Id: shortcuts.js 2019.10.11 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键系统默认配置。
//  格式：{
//      key:     映射键（支持数组）,
//      command: 指令标识,
//      when:    匹配选择器（匹配则执行）,
//      not:     不匹配选择器（匹配则不执行）,
//  }
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
//      shift:a         按 Shift 和 A 键（大写A）
//
//  说明：
//  支持多个键序列映射到同一指令标识，此时键序列为数组。
//  外部的用户配置可覆盖此处的默认值，经 HotKey.bind|config 接口设置。
//
///////////////////////////////////////////////////////////////////////////////
//

export default {

//
// 全局快捷指令。
// 可从任意焦点元素启动触发。
/////////////////////////////////////////////////

Global: [
    //
    // 各面板隐/显切换
    //-----------------------------------------------------
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
        // 录入框充满（通用）
        "key":      "alt:f",
        "command":  "input.tofull",
        "when":     "textarea"
    },


    //
    // 命令行直达
    // 键与系统功能固定相关，不可修改！
    //-----------------------------------------------------
    {
        "key": [
            ":/",       // /  选择器
            "shift::",  // :  普通命令
            ":=",       // =  简单计算
            "shift:|",  // |  选取集过滤
            "shift:?",  // ?  文本搜索
            "shift:!",  // !  扩展指令
        ],
        "command":  "cmdline.active",
        "not":      "textarea,[type=text],[contenteditable]",
    },
],


//
// 菜单快捷直达。
// 触发焦点元素在编辑器内。
/////////////////////////////////////////////////

Menu: [
],


//
// 内容区编辑。
// 普通模式下的快捷操作。
/////////////////////////////////////////////////

Content: [
],


//
// 主面板操作。
// 触发焦点在主面板内。
/////////////////////////////////////////////////

Slave: [
    {
        // 内容提交（同插入按钮）
        "key":      "ctrl:enter",
        "command":  "input.submit",
        "when":     "textarea"
    },
    {
        // 内容提交后恢复正常
        // 注：录入框满面板时。
        "key":      "alt:enter",
        "command":  "input.submit2",
        "when":     "textarea"
    },


    //
    // 选单条目直达
    // 共享相同的配置（不会同时存在于DOM中）。
    // 注：键与<option data-k="?">?相关，不可配置。
    //-----------------------------------------------------
    {
        //-----------------元素单元     | 字符种类      | 行块单元
        "key": [
            ":g",       // <img>        | geometric
            "shift:a",  // <audio>
            "shift:v",  // <video>
            ":a",       // <a>          | alphabet      | address
            ":c",       // <code>       | custom        | codeblock
            ":s",       // <strong>     | special       | section
            ":e",       // <em>         | emotion
            ":q",       // <q>
            ":t",       // <time>       | ...           | table
            ":i",       // <ins>        | ipa87
            ":d",       // <del>        | ...           | details
            ":m",       // <mark>       | math
            ":r",       // <ruby>       | radical       | reference
            ":o",       // <code:orz>   | ...           | ol
            ":f",       // <dfn>        | ...           | figure
            ":p",       // <samp>       | punctuation   | p
            ":k",       // <kbd>
            ":u",       // <u>          | unit          | ul
            ":v",       // <var>
            ":b",       // <bdo>        | ...           | blockquote
            ":n",       // ...          | number        | p:note
            ":z",       // ...          | phonetic
            ":h",       // ...          | ...           | header
            ":l",       // ...          | ...           | codelist
        ],
        "command":  "input.select",
        "when":     ".Input select._list",
    },

],


//
// 模态框操作。
// 会屏蔽全局快捷键（stop）。
/////////////////////////////////////////////////

Modal: [
    {
        "key":      ":escape",
        "command":  "modal.escape",
    }
],


//
// 功能键配置。
// 用于模板中引用目标键。
/////////////////////////////////////////////////

Keys: {

    // 主面板高度调整
    // 修饰键+鼠标拖动改变面板高度。
    // 键名：[shift|ctrl|alt|meta] 大小写忽略。
    // 多个键名空格分隔。
    slaveSize:  'Alt',

},

};
