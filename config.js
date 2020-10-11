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
    history:    999,

};


//
// 系统级提示信息。
// 注：可视情况进行本地化。
//
export const Tips = {

    // 章节空标题占位
    sectionH2:      '[ Empty heading ]',

    // 顶层章节不可再提升
    sectionNotUp:   'section:s1 can not up again.',

    // 末级章节不可再降级。
    sectionNotDown: 'section:s5 can not down again.',

    // 本地暂存完成提示。
    localStoreDone: 'saving done.'

};


//
// 帮助提示集。
// key: [hid, msg]
// 消息段（msg）可以作本地化修改。
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
        '插入操作的目标元素不可为选取'
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


    // 撤销/重做事件名。
    // 在用户执行撤销/重做操作时，向内容区元素发送该事件，
    // 上层可根据发送信息修改按钮状态。
    undoEvent: 'button.undo',
    redoEvent: 'button.redo',


    // 微编辑关联事件
    // 在模板中定义，由程序中激发。
    medIn:  'medin',
    medOk:  'medok',


    // 本地暂存键
    // window.localStorage
    //-------------------------------------------

    // 内容主体
    storeMain: '__cooljHTML',

    // 编辑器主题
    storeTheme: '__cooljTheme',

    // 内容样式
    storeStyle: '__cooljStyle',

};
