//! $Id: app.js 2019.08.10 Tpb.Page $
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//			Copyright (c) 铁皮工作室 2017 MIT License
//
//			@project: Tpb v0.3.2
//			@author:  风林子 zhliner@gmail.com
//////////////////////////////////////////////////////////////////////////////
//
//	页面小程序。
//
//	和服务器交互，提交数据并获取响应。从复杂性分为两个级别：
//  1. pull 提交请求获取响应数据，直接简单入栈。
//  2. cmv  Control/Model/View 的简写，提供架构供外部具体实现。
//
//  CMV:
//  - Control   对提交的数据进行前置控制和预处理。
//  - Model     设计业务模型，与控制部分相关联。
//  - View      数据的视图结构整理（仅指数据），也包含对前置控制的呼应。
//
//  扩展实现：
//      import { App } from 'app.js'
//      App.extend( {...} );
//
//
///////////////////////////////////////////////////////////////////////////////
//


class _App {
    /**
     * @param {String} root 根路径
     */
    constructor( root ) {
        //
    }


    /**
     * 程序运行。
     * meth为相对于根路径的请求目标。
     * @param  {String} meth 请求方法（可含?查询）
     * @return {Promise} .then( data:Object )
     */
    run( meth ) {
        //
    }
}



/**
 * 数据检取。
 * @param {Value|[Value]} data 待提交数据
 */
function Puller( data ) {
    //
}



//
// App存储区（模板）。
//
const AppStore = { pull: Puller };


/**
 * CMV扩展实现。
 * 每个扩展就是一个独立的程序。
 * 注：一个页面中可以同时使用多个App。
 * @param {String} name 程序名
 * @param {Object} obj 扩展集
 */
function extend( name, obj ) {
    // AppStore[name] =
}



//
// X库扩展。
//
window.Tpb.Lib.X({ App: AppStore });



//
// 导出。
// 供外部扩展的具体实现用。
///////////////////////////////////////////////////////////////////////////////

export const App = { extend };
