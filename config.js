//! $Id: config.js 2020.04.05 $
// +++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  用户配置定义。
//
//  安装根路径（URL）和模板根目录配置文件：base/tpb/config.js。
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 限制配置集。
//
export const Limit = {

    // 历史栈长度
    // 注意定位移动可能会占据大量的步数。
    history:        999,

    // 弹出菜单边距友好（像素）
    // 顶部距划选文本和右侧靠时距容器边框距离。
    popupGapTop:    10,
    popupGapRight:  3,

};


//
// 系统级提示信息。
// 注：可视情况进行本地化。
//
export const Tips = {

    // 章节空标题占位
    sectionH2:      '[ Empty heading ]',

    // 本地暂存完成提示。
    localStoreDone: 'saving done.',

    // 顶层章节不可再提升
    sectionNotUp:   'section:s1 can not up again.',

};


//
// 帮助提示集。
// key: [hid, msg]
// 仅消息段（msg）可以作本地化修改，其余不可。
//
export const Help = {

    'need_conelem': [
        'type:contents',
        '目标必须为内容元素'
    ],

    'both_conelem': [
        'type:contents',
        '选取元素及其父元素都必须为内容元素'
    ],

    'merge_types': [
        'type:merges',
        '元素集成员必需为可合并类型'
    ],


    'has_cannot_del': [
        'edit:deletes',
        '包含了不能被删除的元素'
    ],

    'has_fixed': [
        'edit:fixed',
        '包含有固定不可以被移动的元素'
    ],

    'cannot_selected': [
        'edit:insert',
        '插入的目标元素不可为已选取'
    ],

    'cannot_append': [
        'edit:insert',
        '不能向元素内插入内容'
    ],

    'only_section': [
        'edit:indent',
        '仅章节单元（section）支持缩进操作'
    ],

    'only_child': [
        'edit:onlyone',
        '只能作为唯一子元素存在'
    ],

    'not_property': [
        'edit:property',
        '没有可编辑的属性'
    ]

};


//
// 系统配置集。
// 注：不可修改！
//////////////////////////////////////////////////////////////////////////////

export const Sys = {

    // 元素选取态类名。
    selectedClass: '_selected',

    // 选取焦点类名。
    focusClass: '_focus',


    // <rt>包围定义（<rp>）。
    // 全局定义以支持<ruby>解析式创建。
    rpLeft:     '(',
    rpRight:    ')',


    // 撤销/重做事件名。
    // 在用户执行撤销/重做操作时，向内容区元素发送该事件，
    // 上层可根据发送信息修改按钮状态。
    undoEvent:  'button.undo',
    redoEvent:  'button.redo',


    // 事件名定义
    // 在模板中定义，由程序中激发。
    medIn:      'medin',    // 进入微编辑
    medOk:      'medok',    // 完成微编辑
    insWhere:   'update',   // 插入位置选单更新
    insType:    'edtype',   // 编辑类型更新（普通插入|微编辑）


    // 模板名定义
    // 在模板中定义，在程序中发送。
    miniedTpl:  'slave:minied',     // 微编辑
    normalTpl:  'slave:input',      // 普通录入
    modalProp:  'modal:prop',       // 属性编辑模态框


    // 转换类型标识名
    // 用于区分内联转换或是行块转换（会引入不同的子菜单）。
    convBlocks:  'blocks',
    convInlines: 'inlines',


    // 插入位置名称约定。
    // 在模板和程序中协同使用。
    whereName1: 'siblings', // 平级
    whereName2: 'children', // 向内


    // 本地暂存键
    // 内容存储到 window.localStorage 的键名。
    //-------------------------------------------

    // 内容主体
    storeMain: '__cooljHTML',

    // 编辑器主题
    storeTheme: '__cooljTheme',

    // 内容样式
    storeStyle: '__cooljStyle',

};
