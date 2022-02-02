//! $ID: shortcuts.js 2019.10.11 Cooljed.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键系统默认配置。
//  格式：{
//      key:     映射键（支持数组）,
//      command: 指令标识,
//      exclude: 排除选择器（事件起点元素匹配则不执行）,
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
//  键名称忽略大小写，容错空格分隔阅读友好。注：空格键本身用 Space（忽略大小写）标识。
//
//  提示：
//  如果有匹配的快捷键定义，触发后会自动取消浏览器默认行为。
//  因此如果快捷键采用可输入字符，通常应当设置排除项如：'textarea, input, [contenteditable]'
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

    // 功能面板切换（隐/显）
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

    // 编辑器最大化切换
    {
        "key":      ":f10",
        "command":  "panel.maximize"
    },

    // 录入框铺满
    // 需由样式定义容器范围（position:relative）。
    // 适用：主面板、模态框。
    // 提示：
    // 主面板模板中有操作提示，如果修改注意同步信息。
    {
        "key": [
            "alt:f",    // windows, ...
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
        "key":      ":f8",
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
    // 不可修改。键与系统功能固定相关。
    //-----------------------------------------------------
    {
        "key": [
            "shift:>",  // >  选择器（焦点元素为起点）
            "shift:|",  // |  选取集过滤
            ":/",       // /  文本搜索
            "shift::",  // :  普通命令
            ":=",       // =  简单计算
        ],
        "command":  "cmdline.active",
        "exclude":  "textarea,input,[contenteditable]"
    },


    //
    // 内容区功能
    //-----------------------------------------------------

    // 章节跳转。
    // 由用户键入的前置数字表达（如：3.2.5）。
    {
        "key":      ":g",
        "command":  "main.chapter",
        "exclude":  "textarea,input,[contenteditable]"
    },

    // 手动暂存。
    // 保存到 localStorage 空间。
    {
        "key":      "ctrl:s",
        "command":  "main.saving"
    },

    // 源码导出。
    // 如果没有选取元素，则针对全部内容。
    {
        "key":      "alt:p",
        "command":  "main.export",
    },
    // 同上导出但包含目录。
    // 仅适用导出全部内容，会忽略已选取元素。
    {
        "key":      "alt+shift:p",
        "command":  "main.export2",
    },

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
        // 到顶元素。
        "key":      ":t",
        "command":  "focusItemTop"
    },

    {
        // 按顺序下一个
        "key":      ":tab",
        "command":  "focusSetNext"
    },

    {
        // 按顺序前一个
        "key":      "shift:tab",
        "command":  "focusSetPrev"
    },


    //
    // 元素选取
    // 原地扩展，焦点不会移动。
    //-----------------------------------------------------

    // 切换选取
    {
        // 空格键用 Space 占位。
        // 注记：实际上的 Event.key 为 ' ' 字符。
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

    // 取消焦点同级兄弟元素选取。
    // 保留或选取焦点元素本身。
    {
        "key":      ":q",
        "command":  "cleanSiblings"
    },

    // 取消全部已选取。
    // 保留或选取焦点元素本身。
    {
        "key":      "shift:q",
        "command":  "cleanOthers"
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
        "key":      ":w",
        "command":  "contentBoxes"
    },

    // 选取单元的内容根元素集。
    // 注：新元素集插入选取集头部。
    {
        "key":      "shift:w",
        "command":  "contentBoxesStart"
    },


    //
    // 单选游走
    // 焦点移动到目标元素。
    //-----------------------------------------------------

    // 同级向前（↑）
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "shift:k",
        "command":  "onlyPrevious"
    },

    // 同级向后（↓）
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "shift:j",
        "command":  "onlyNext"
    },

    // 父级选取（←）
    // 支持前置数字指定上升层级（准确值）。
    {
        "key":      "shift:h",
        "command":  "onlyParent"
    },

    // 子级选取（→）
    // 支持前置数字指定子元素下标，
    // 下标支持负数从末尾算起（-1表示末尾一个）。
    {
        "key":      "shift:l",
        "command":  "onlyChild"
    },

    // 顶元素选取。
    {
        "key":      "shift:t",
        "command":  "onlyItemTop"
    },


    //
    // 选取扩展
    // 焦点会移动到扩展目标。
    //-----------------------------------------------------

    // 同级向前（↑）扩选
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "ctrl+shift:k",
        "command":  "previous"
    },

    // 同级向后（↓）扩选
    // 接受前置数字指定扩展距离（默认值1）。
    {
        "key":      "ctrl+shift:j",
        "command":  "next"
    },

    // 父级换选（←）
    // 支持前置数字指定上升层级（准确值）。
    {
        "key":      "ctrl+shift:h",
        "command":  "parent"
    },

    // 子级换选（→）
    // 支持前置数字指定子元素下标，
    // 下标支持负数从末尾算起（-1表示末尾一个）。
    {
        "key":      "ctrl+shift:l",
        "command":  "child"
    },

    // 选取顶元素。
    // - 内联元素的顶元素为内容行元素（或<td>,<th>）。
    // - 结构元素的顶元素为所属单元的根元素。
    {
        "key":      "ctrl+shift:t",
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
        "key":      "alt:w",
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
    // 选取集排序（DOM）
    //-----------------------------------------------------

    // 正序。
    // 同时焦点移到首个成员。
    {
        "key":      ":s",
        "command":  "selectSort"
    },

    // 逆序。
    // 同时焦点移到首个成员。
    {
        "key":      "shift:s",
        "command":  "selectReverse"
    },


    //
    // 杂项
    //-----------------------------------------------------


    // 撤销（Undo）
    {
        "key":      ":u",
        "command":  "editUndo"
    },

    // 重做（Redo）
    {
        "key":      ":r",
        "command":  "editRedo"
    },


    //
    // 编辑操作
    ///////////////////////////////////////////////////////

    // 智能删除。
    // - 完整的逻辑单元（行块、内联）。
    // - 删除不影响结构逻辑的元素（如：<li>、<tr>等）。
    {
        "key":      ":delete",
        "command":  "deletes"
    },

    // 内容删除。
    // 删除元素内的可编辑内容（内容根元素的内容）。
    {
        "key":      "shift:delete",
        "command":  "deleteContents"
    },

    // 强制删除。
    // 删除任意已选取元素，有破坏性（不保护中间结构逻辑）。
    {
        "key":      "alt+shift:delete",
        "command":  "deleteForce"
    },


    // 原地克隆（成组）。
    // 选取集内相邻元素分组克隆，插入原组之后（after）。
    // 注：与焦点元素无关。
    {
        "key":      ":c",
        "command":  "elementCloneTeam"
    },

    // 原地克隆（各别）。
    // 选取集成员克隆插入原元素之后（after），各自独立。
    // 注：与焦点元素无关。
    {
        "key":      "shift:c",
        "command":  "elementCloneSelf"
    },


    // 移动填充。
    // 将选取元素或其内容填充到焦点元素内。
    {
        "key":      ":f",
        "command":  "elementFill"
    },

    // 克隆填充。
    {
        "key":      "shift:f",
        "command":  "elementCloneFill"
    },


    // 移动内插入。
    // 即普通子单元添加，将选取元素或其内容添加到焦点元素内。
    {
        "key":      ":d",
        "command":  "elementAppend"
    },

    // 克隆内插入。
    {
        "key":      "shift:d",
        "command":  "elementCloneAppend"
    },


    // 移动式前插入。
    // 将选取元素插入到焦点元素之前，如果位置非法，会提取内容构建默认单元插入。
    // 焦点元素不可选取。
    {
        "key":      ":i",
        "command":  "elementBefore"
    },

    // 克隆式前插入。
    // 同上规则。但焦点元素可以作为数据源。
    {
        "key":      "shift:i",
        "command":  "elementCloneBefore"
    },


    // 移动式后插入。
    // 将选取元素插入到焦点元素之后，如果位置非法，自动提取内容构建默认单元插入。
    // 焦点元素不可选取。
    {
        "key":      ":b",
        "command":  "elementAfter"
    },

    // 克隆式后插入。
    // 同上规则，但焦点元素可以作为数据源。
    {
        "key":      "shift:b",
        "command":  "elementCloneAfter"
    },


    //
    // 大小写转换
    //-----------------------------------------------------

    {
        "key":      "ctrl:u",
        "command":  "toUpperCase",
    },

    // 仅首个字母转为大写
    {
        "key":      "alt+ctrl:u",
        "command":  "toUpperCase1",
    },

    {
        "key":      "ctrl:l",
        "command":  "toLowerCase",
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
        "command":  "indentReduce"
    },

    // 增加缩进（→）。
    // 每次增加一层，不支持同上。
    {
        "key":      ["alt:l", "alt:ArrowRight"],
        "command":  "indentIncrease"
    },


    // 同级兄弟逆序。
    {
        "key":      ":x",
        "command":  "reversePlaces"
    },

    // 内容合并。
    // 以首个被选取元素为容器，仅限于内容元素。
    {
        "key":      ":z",
        "command":  "contentsMerge"
    },

    // 内容区规范化
    // 连续文本节点合并。
    {
        "key":      "alt:z",
        "command":  "normalize"
    },


    //
    // 定位移动。
    // 普通：1px/键次   Ctrl + 箭头键
    // 增强：10px/键次  Ctrl + Shift + 箭头键
    //-----------------------------------------------------

    // 向左移动。
    {
        "key":      "Ctrl:ArrowLeft",
        "command":  "moveToLeft"
    },

    {
        "key":      "Ctrl+Shift:ArrowLeft",
        "command":  "moveToLeftTen"
    },


    // 向右移动。
    {
        "key":      "Ctrl:ArrowRight",
        "command":  "moveToRight"
    },

    {
        "key":      "Ctrl+Shift:ArrowRight",
        "command":  "moveToRightTen"
    },


    // 向上移动。
    {
        "key":      "Ctrl:ArrowUp",
        "command":  "moveToUp"
    },

    {
        "key":      "Ctrl+Shift:ArrowUp",
        "command":  "moveToUpTen"
    },


    // 向下移动。
    {
        "key":      "Ctrl:ArrowDown",
        "command":  "moveToDown"
    },

    {
        "key":      "Ctrl+Shift:ArrowDown",
        "command":  "moveToDownTen"
    },


    // 杂项
    //-----------------------------------------------------

    // 进入微编辑。
    // 支持当前单击点为光标。
    {
        "key":      ":m",
        "command":  "miniedIn"
    },

    // 进入微编辑。
    // 内容元素末尾光标。
    {
        "key":      "shift:m",
        "command":  "miniedInEnd"
    },


    // 属性编辑。
    // 打开选取元素的属性编辑面板，
    // 如果选取的是多个元素，则编辑结果全部应用（批量）。
    {
        "key":      ":p",
        "command":  "properties"
    },


    // 元素选取。
    // 范围划选，仅适用于内联元素。
    // 主要为精确选取后创建链接（如图片不方便划选）。
    {
        "key":      "alt:s",
        "command":  "elementRange"
    },

],


//
// 功能面板操作。
// 触发焦点在功能面板内。
///////////////////////////////////////////////////////////

Slave: [
    {
        // 内容直接提交。
        // 提示：
        // 主面板模板中有操作提示，如果修改注意同步信息。
        "key":      "ctrl:enter",
        "command":  "input.submit",
    },
    {
        // 内容直接提交。
        // 若录入框充满则恢复正常。
        // 提示：（同上）
        "key":      "alt+ctrl:enter",
        "command":  "input.submit2",
    },


    //
    // 选单条目直达
    // 共享相同的配置（不会同时存在于DOM中）。
    // 注：键与<option data-k="?">?相关，不可配置。
    //-----------------------------------------------------
    {
        //_________________内联单元______|_字符种类______|_行块单元
        "key": [
            ":a",       // <a>          | alphabet      | address
            ":b",       // <bdo>        | ...           | blockquote
            ":c",       // <code>       | custom        | codeblock
            ":d",       // <del>        | ...           | details
            ":e",       // <em>         | emotion
            ":f",       // ...          | ...           | figure
            ":g",       // ...          | geometric
            ":h",       // ...          | ...           | header
            ":i",       // <img>        | ipa87
            ":k",       // <kbd>
            ":l",       // ...          | ...           | codelist
            ":m",       // <mark>       | math
            ":n",       // ...          | number        | p:note
            ":o",       // <code:orz>   | ...           | ol
            ":p",       // <picture>    | punctuation   | p
            ":q",       // <q>
            ":r",       // <ruby>       | radical       | reference
            ":s",       // <strong>     | special       | section
            ":t",       // <time>       | ...           | table
            ":u",       // <u>          | unit          | ul
            ":v",       // <video>
            ":w",       // <wbr>
            ":z",       // ...          | phonetic（拼音）
        ],
        "command":  "input.select",
        "exclude":  "textarea,input,[contenteditable]"
    },

],


//
// 模态框操作。
// 会屏蔽全局快捷键（stop）。
///////////////////////////////////////////////////////////

Modal: [
],




//
// 辅助功能键。
// 键名：[shift|ctrl|alt|meta]
// 键名大小写任意，多个键名用空格分隔，顺序任意。
///////////////////////////////////////////////////////////

Keys: {
    // 主面板部分

    // 主面板高度调整
    // [Key] + 鼠标拖动。
    slaveResize:  'Alt',

    // 表格单元格列向切换
    // [Key] + 上下箭头键
    tableCellx: 'Shift',

    // 特性OBT行移动辅助
    // [Key] + 上下箭头键
    obtRowMove: 'Ctrl',

    // 特性OBT行删除辅助
    // [Key] + Delete
    // 先删除内容（可撤销），空行直接删除（不可撤销）。
    obtRowDel: 'Ctrl Shift',

    // BackSpace增强
    // 代码框里加按该键向前删除全部缩进。
    backspaceMore: 'Ctrl',


    // 以下适用编辑器内容区

    // 多选/切换
    // [Key] + 单击
    turnSelect: 'Ctrl',

    // 仅聚焦。
    // 单纯的设置元素为焦点元素。
    // [Key] + 单击
    elemFocus: 'Alt',


    // 跨选（同态）。
    // 范围：[焦点元素 ~ 同级目标元素]
    // [Key] + 单击
    acrossSelect: 'Shift',

    // 浮选（切换）。
    // 定位：与焦点元素平级的目标元素的父级元素。
    // 提示：与焦点元素不在同一父容器内（跨节点）时无效。
    // [Key] + 单击
    smartSelect: 'Ctrl Shift',


    // 父聚焦。
    // 定位：目标元素的父元素。
    // [Key] + 单击
    parentFocus: 'Alt Shift',

    // 父多选（切换）。
    // 定位：目标元素的父元素。
    // [Key] + 单击
    parentSelect: 'Ctrl Alt',

    // 父单选
    // 定位：目标元素的父元素。
    // [Key] + 单击
    onlyParent: 'Ctrl Shift Alt',


    // 微编辑同类行创建辅助。
    // 支持：<li>, <dt>, <dd> 和 <p:...> 系列。
    miniedSameLine: 'Ctrl',

    // 微编辑逻辑行创建辅助。
    // 支持 <dt>到<dd>, <h4>到<p> 等（不支持<td|th>到<tr>）。
    // 注：
    // 如果无逻辑新行的逻辑，则与创建同类行相同。
    miniedLogicLine: 'Alt',

},

};
