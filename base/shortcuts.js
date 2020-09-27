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
//      exclude: 排除选择器（匹配则不执行）,
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
//  映射键是一个修饰键加键名称的序列（有序）。
//  修饰键之间以加号（+）连接，而与键名称的连接则采用冒号（:）。
//  例：
//      alt:alt         单纯按 Alt 键
//      ctrl:control    单纯按 ctrl 键
//      alt+ctrl:f      组合按 Alt+Ctrl+F 三个键（注意顺序）
//      :a              单纯按 A 键
//      shift:a         按 Shift 和 A 键（即大写A）
//
//  说明：
//  支持多个键序列映射到同一指令标识，此时键序列为数组。
//  键名称忽略大小写，容错空格分隔友好阅读（注：空格键本身用 Space 标识）。
//  如果有外部的用户配置，可参考：'tpb/tools/hotkey.js:HotKey.bind|config'。
//
///////////////////////////////////////////////////////////////////////////////
//

export default {

//
// 全局快捷指令。
// 应该可从任意焦点元素启动触发。
///////////////////////////////////////////////////////////

Global: [
    // 大纲面板切换（隐/显）
    {
        "key":      ":f2",
        "command":  "panel.outline",
    },

    // 主面板切换（隐/显）
    {
        "key":      ":f3",
        "command":  "panel.slave"
    },

    // 帮助面板切换（隐/显）
    {
        "key":      ":f4",
        "command":  "panel.help"
    },

    // 当前已显示面板切换（全隐/全显）
    // 注：若无任何显示的面板，则针对全部面板。
    {
        "key":      ":f9",
        "command":  "panel.clearall"
    },

    // 显示插件面板
    {
        "key":      ":f7",
        "command":  "panel.plugins"
    },

    // 编辑器最大化
    {
        "key":      ":f10",
        "command":  "panel.maximize"
    },

    // 录入框铺满
    // 需由样式定义容器范围（position:relative）。
    {
        "key": [
            "alt:f",    // windows
            "meta:f"    // MacOS
        ],
        "command":  "input.full",
    },

    // 焦点元素路径信息显示切换
    {
        "key":      ":f6",
        "command":  "toggle.path"
    },

    // 内容区聚焦
    // 便于对内容区的快捷键操作。
    {
        "key":      "shift:f6",
        "command":  "focus.content"
    },


    // 逐次取消
    // 注：此配置不应修改。
    {
        "key":      ":escape",
        "command":  "escape.cancel",
    },

    //
    // 命令行直达
    // 不可修改！键与系统功能固定相关。
    //-----------------------------------------------------
    {
        "key": [
            ":/",       // /  选择器（全局上下文）
            "shift:|",  // |  选取集过滤
            "shift:?",  // ?  文本搜索
            "shift::",  // :  普通命令
            ":=",       // =  简单计算
            "shift:!",  // !  扩展指令
        ],
        "command":  "cmdline.active",
        "exclude":  "textarea,input,[contenteditable]",
    },
],


//
// 菜单快捷直达。
// 触发焦点元素在编辑器内。
///////////////////////////////////////////////////////////

Menu: [
],


//
// 内容区编辑。
// 普通模式下的键盘快捷操作。
// 注记：
// 对应的操作映射到一个集中管理的处理集。
// 热键处理器：new ObjKey( obj )
///////////////////////////////////////////////////////////

Content: [
    //
    // 焦点移动
    //-----------------------------------------------------

    {
        // ArrowUp（↑）
        "key":      ":k",
        "command":  "focusPrevious"
    },

    {
        // ArrowDown（↓）
        "key":      ":j",
        "command":  "focusNext"
    },

    {
        // ArrowLeft（←）
        "key":      ":h",
        "command":  "focusParent"
    },

    {
        // ArrowRight（→）
        "key":      ":l",
        "command":  "focusChild"
    },

    {
        "key":      ":t",
        "command":  "focusItemTop"
    },


    //
    // 元素选取
    // 原地扩展，焦点不会移动。
    //-----------------------------------------------------

    // 切换选取
    {
        // 空格键用 Space 占位符。
        // 注：实际上的 Event.key 为 ' ' 字符。
        "key":      [":Space", ":enter"],
        "command":  "turn",
    },

    // 同级反选
    {
        "key":      ":v",
        "command":  "reverse"
    },

    // 同级全选
    {
        "key":      ":a",
        "command":  "siblings"
    },

    // 取消焦点所在兄弟元素选取
    {
        "key":      ":q",
        "command":  "cleanSiblings"
    },

    // 同级同类兄弟元素
    {
        "key":      ":e",
        "command":  "tagsame"
    },

    // 叔伯元素内同类子元素
    // 用途：
    // - 基于当前标题，选取同层级章节标题（父章节内）。
    // - 基于当前单元格，选取表格<tbody>内的列头（<th>）或全部<td>。
    {
        "key":      "shift:e",
        "command":  "tagsame2"
    },

    // 叔伯元素内同类同位置子元素
    // 用途：
    // 基于当前单元格，选取表格<tbody>内单个列（<th>或<td>）。
    {
        "key":      "alt+shift:e",
        "command":  "tagsame2x"
    },

    // 选取单元的内容根元素集。
    {
        "key":      ":z",
        "command":  "contentBoxes"
    },

    // 选取单元的内容根元素集。
    // 注：新元素集插入选取集头部。
    {
        "key":      "shift:z",
        "command":  "contentBoxesStart"
    },


    //
    // 单选游走
    // 焦点移动到目标元素。
    //-----------------------------------------------------

    // 同级向前（↑）
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "ctrl+shift:k",
        "command":  "onlyPrevious"
    },

    // 同级向后（↓）
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "ctrl+shift:j",
        "command":  "onlyNext"
    },

    // 父级选取（←）
    // 支持前置数字指定上升层级（准确值）。
    {
        "key":      "ctrl+shift:h",
        "command":  "onlyParent"
    },

    // 子级选取（→）
    // 支持前置数字指定子元素下标，
    // 下标支持负数从末尾算起（-1表示末尾一个）。
    {
        "key":      "ctrl+shift:l",
        "command":  "onlyChild"
    },

    // 顶元素选取。
    {
        "key":      "ctrl+shift:t",
        "command":  "onlyItemTop"
    },


    //
    // 选取扩展
    // 焦点会移动到扩展目标。
    //-----------------------------------------------------

    // 同级向前（↑）扩选
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "shift:k",
        "command":  "previous"
    },

    // 同级向后（↓）扩选
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "shift:j",
        "command":  "next"
    },

    // 父级换选（←）
    // 支持前置数字指定上升层级（准确值）。
    {
        "key":      "shift:h",
        "command":  "parent"
    },

    // 子级换选（→）
    // 支持前置数字指定子元素下标，
    // 下标支持负数从末尾算起（-1表示末尾一个）。
    {
        "key":      "shift:l",
        "command":  "child"
    },

    // 选取顶元素。
    // - 内联元素的顶元素为内容行元素（或<td>,<th>）。
    // - 结构元素的顶元素为所属单元的根元素。
    {
        "key":      "shift:t",
        "command":  "itemTop"
    },


    //
    // 虚焦点相关
    // 注记：原相关操作键上 +Alt
    //-----------------------------------------------------

    // 兄弟全选。
    {
        "key":      "alt:a",
        "command":  "siblingsVF"
    },

    // 兄弟反选。
    {
        "key":      "alt:v",
        "command":  "reverseVF"
    },

    // 兄弟同类全选。
    {
        "key":      "alt:e",
        "command":  "tagsameVF"
    },

    // 向前扩选。
    {
        "key":      "alt+shift:k",
        "command":  "previousVF"
    },

    // 向后扩选。
    {
        "key":      "alt+shift:j",
        "command":  "nextVF"
    },

    // 向下内容根子集。
    {
        "key":      "alt:z",
        "command":  "contentBoxesVF"
    },

    // 父级选取。
    {
        "key":      "alt+shift:h",
        "command":  "parentVF"
    },

    // 子元素定位。
    {
        "key":      "alt+shift:l",
        "command":  "childVF"
    },

    // 上级顶元素。
    {
        "key":      "alt+shift:t",
        "command":  "itemTopVF"
    },


    //
    // 编辑操作
    //-----------------------------------------------------

    // 智能删除。
    // - 完整的逻辑单元（行块、内联）。
    // - 删除不影响结构逻辑的元素（如：<li>、<tr>等）。
    {
        "key": [
            ":d",
            ":delete"
        ],
        "command":  "deletes"
    },


    // 内容删除。
    // 删除元素内的可编辑内容（内容根元素的内容）。
    {
        "key": [
            "shift:d",
            "shift:delete"
        ],
        "command":  "deleteContents"
    },


    // 强制删除。
    // 删除任意已选取元素，有破坏性（不保护中间结构逻辑）。
    {
        "key": [
            "alt+shift:d",
            "alt+shift:delete"
        ],
        "command":  "deleteForce"
    },


    // 移动填充。
    // 将选取元素或其内容移动填充到焦点元素内。
    // 注记：目标焦点不应当被选取。
    {
        "key":      ":f",
        "command":  "elementFill"
    },


    // 克隆填充。
    // 将选取元素或其内容克隆填充到焦点元素内。
    // 注记：目标焦点可以被选取作为内容之一。
    {
        "key":      "shift:f",
        "command":  "elementCloneFill"
    },


    // 移动式前插入。
    // 将选取元素移动到焦点元素之前。
    // 如果位置非法，自动提取内容构建默认单元插入。
    // 注记：目标焦点不应当被选取。
    {
        "key":      ":i",
        "command":  "elementBefore"
    },


    // 克隆式前插入。
    // 说明：参考 elementBefore。
    // 注记：目标焦点可以被选取作为内容之一。
    {
        "key":      "shift:i",
        "command":  "elementCloneBefore"
    },


    // 移动式后插入。
    // 将选取元素移动到焦点元素之后。
    // 如果位置非法，自动提取内容构建默认单元插入。
    // 注记：目标焦点不应当被选取。
    {
        "key":      ":b",
        "command":  "elementAfter"
    },


    // 克隆式后插入。
    // 说明：参考 elementAfter
    // 注记：目标焦点可以被选取作为内容之一。
    {
        "key":      "shift:b",
        "command":  "elementCloneAfter"
    },


    // 原地克隆（成组）。
    // 选取集内相邻元素分组克隆，插入原组之前（before）。
    // 注记：与焦点元素无关。
    {
        "key":      ":c",
        "command":  "elementCloneTeam"
    },


    // 原地克隆（各别）。
    // 选取集成员克隆插入原元素之前（before），各自独立。
    // 注记：与焦点元素无关。
    {
        "key":      "shift:c",
        "command":  "elementCloneSelf"
    },


    //
    // 移动&缩进
    //-----------------------------------------------------
    // 同时支持 kjhl 和箭头键。

    // 向前移动（↑）。
    // 支持数字指定移动距离。
    // 并列兄弟元素逐个移动，因此超出限度的距离会导致部分或全部反序排列。
    {
        "key":      ["alt:k", "alt:ArrowUp"],
        "command":  "movePrevious"
    },

    // 向后移动（↓）。
    // 支持数字指定移动距离，说明同上。
    {
        "key":      ["alt:j", "alt:ArrowDown"],
        "command":  "moveNext"
    },

    // 减少缩进（←）。
    // 每次缩减一层，不支持数字指定层级数。
    {
        "key":      ["alt:h", "alt:ArrowLeft"],
        "command":  "indentLess"
    },

    // 增加缩进（→）。
    // 每次增加一层，不支持同上。
    {
        "key":      ["alt:l", "alt:ArrowRight"],
        "command":  "indentMore"
    },


    //
    // 杂项编辑
    //-----------------------------------------------------

    // 编辑撤销（含选取）
    {
        "key":      ":u",
        "command":  "editUndo"
    },

    // 编辑重做（含选取）
    {
        "key":      ":r",
        "command":  "editRedo"
    },


    //
    // 定位移动
    // 普通：1px/键次
    // 增强：10px/键次
    //-----------------------------------------------------

    {
        "key":      "Ctrl:ArrowLeft",
        "command":  "moveToLeft"
    },

    {
        "key":      "Ctrl+Shift:ArrowLeft",
        "command":  "moveToLeftTen"
    },


    {
        "key":      "Ctrl:ArrowRight",
        "command":  "moveToRight"
    },

    {
        "key":      "Ctrl+Shift:ArrowRight",
        "command":  "moveToRightTen"
    },


    {
        "key":      "Ctrl:ArrowUp",
        "command":  "moveToUp"
    },

    {
        "key":      "Ctrl+Shift:ArrowUp",
        "command":  "moveToUpTen"
    },


    {
        "key":      "Ctrl:ArrowDown",
        "command":  "moveToDown"
    },

    {
        "key":      "Ctrl+Shift:ArrowDown",
        "command":  "moveToDownTen"
    },


    //
    // 系统功能
    //-----------------------------------------------------

    // 新建关联。
    // 显示焦点元素关联的新建面板（并聚焦到列表栏）。
    {
        "key":      ":n",
        "command":  "listNewOne"
    },


    // 本地暂存。
    // 手动保存到 window.localStorage 空间。
    {
        "key":      ":s",
        "command":  "localSave"
    },


    // 属性编辑。
    // 打开选取元素的属性编辑面板，
    // 如果选取的是多个元素，则编辑结果全部应用（批量）。
    {
        "key":      ":p",
        "command":  "properties"
    },


    // 章节跳转。
    // 由用户键入的前置数字表达（如：3.2.5）。
    {
        "key":      ":g",
        "command":  "gotoChapter"
    },

],


//
// 主面板操作。
// 触发焦点在主面板内。
///////////////////////////////////////////////////////////

Slave: [
    {
        // 内容提交（同插入按钮）
        "key":      "ctrl:enter",
        "command":  "input.submit",
    },
    {
        // 内容提交后恢复正常
        // 注：录入框满面板时。
        "key":      "alt:enter",
        "command":  "input.submit2",
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
        "exclude":  "textarea, input"
    },

],


//
// 模态框操作。
// 会屏蔽全局快捷键（stop）。
///////////////////////////////////////////////////////////

Modal: [
],




//
// 功能键配置。
// 键名：[shift|ctrl|alt|meta]
// 注意：键名大小写忽略，但多个键名用“空格”分隔。
///////////////////////////////////////////////////////////

Keys: {

    // 主面板大小调整
    // [Key] + 鼠标拖动。
    slaveResize:  'Alt',

    // 切换选取辅助
    // [Key] + 单击
    // 注：不能为空。
    turnSelect: 'Ctrl',

    // 聚焦辅助。
    // 单纯的设置元素为焦点元素（不选取）。
    // [Key] + 单击
    // 支持内容区目标和路径关联方式。
    elemFocus: 'Alt',


    // 跨选（同态）。
    // 从焦点元素至目标元素之间平级选取。
    // [Key] + 单击
    acrossSelect: 'Shift',

    // 浮选（同态）。
    // 与焦点元素同级，选取目标的父级同级元素。
    // [Key] + 单击
    smartSelect: 'Ctrl Alt',

},

};
