//! $ID: main.js 2022.01.06 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件开发说明：
//
//  考虑安全性和避免全局环境污染，插件以 Worker 的方式运行。
//  Worker环境包含两个全局变量：
//      HTML:[String]   当前选取集源码集（干净）
//      TEXT:[String]   当前选取集文本集
//  注：
//  如果当前没有选取集，则内容针对全文（顶层子元素集）。
//  还有一个全局变量 INFO:Object，但目前暂无内容。
//
//  脚本需向调用者返回一个对象，定义如下：{
//      result:Value    插件运行的结果数据，
//      error:String    错误信息
//      node:String     打开UI界面的根模板节点名
//      title:String    展示框标题条文本
//  }
//  其中的结果数据会被递送到 node 指定的模板节点上，由 vinit 事件传递。
//
//  提示：
//  脚本需要在 onmessage 事件处理器中执行，上级数据在 event.data 属性上。
//  如果需要用结果数据渲染模板，可用 By|Update:render 接口。
//
//
///////////////////////////////////////////////////////////////////////////////
//


// 示例
onmessage = function( ev ) {
    let _o = ev.data,
        _tmp = {
            node:   null,
            result: `HTML ${_o.HTML.length} bytes, TEXT ${_o.TEXT.length} bytes.`,
            title:  'HELLO TEST'
        };
    postMessage( _tmp );
};
