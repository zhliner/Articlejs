//! $Id: scripter.js 2021.02.01 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码执行器（Worker环境）
//
//  用于封装js代码在较为安全的环境下执行，避免影响主程序。
//  代码中通过 return 语句向外面返回值。
//
//  代码中支持两个数据集：
//  - TEXT  选取集的文本数据
//  - HTML  选举权的源码数据：内容行元素的 innerHTML，内联单元的 outerHTML
//
//  安全性：
//  Worker 不能访问 window 和文档对象（DOM）。
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 执行传递过来的代码。
// 源数据 ev.data
// - text:[String]  选取集内容文本（TEXT）
// - html:[String]  选取集源码（outerHTML）
// - code:String    需要执行的代码
// 容错：
// 可直接传递字符串代码执行，此时没有TEXT/HTML两个数据集。
//
// 返回值：{
//      result  正常的执行结果
//      error   异常的错误对象，出错时才有
// }
//
onmessage = function( ev ) {
    let _o = ev.data,
        _tmp = {};
    try {
        _tmp.result = new Function(
            'TEXT',
            'HTML',
            _o.code || _o
        )( _o.text || [], _o.html || [] );
    }
    catch (err) {
        _tmp.error = err;
    }
    postMessage( _tmp );
};
