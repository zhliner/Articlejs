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


export const Setup = {

    // 元素选取态类名。
    selectedClass:  '_selected',

    // 选取焦点类名。
    focusClass: '_focus',


    // 撤销/重做事件名。
    // 在用户执行撤销/重做操作时，向内容区元素发送该事件，
    // 上层可根据发送信息修改按钮状态。
    undoEvent: 'button.undo',

    redoEvent: 'button.redo',

};


export const Limit = {

    // 历史栈长度
    history:    999,

}


export const Local = {
    // 本地化信息
};
