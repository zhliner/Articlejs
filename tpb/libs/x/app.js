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
//      App.extend( {control, model, view}} );
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { pullRoot } from "../../config.js";


class _App {
    /**
     * 构建一个App。
     * 传递三个阶段的回调函数。
     * 回调函数接口：
     * ctrl: function( name:String, data:Value ): Promise
     * model/view: function( name:String, data:Value ): Value
     * 说明：
     * - 首个参数为方法名，其次为上一阶段来的值（确定值，非Promise）。
     *   即：仅在上一阶段完成后，才会进入下一阶段。
     * - model和view调用接口的返回值任意，若返回Promise遵循同样的逻辑。
     *
     * @param {Function} ctrl 控制调用
     * @param {Function} model 模型调用
     * @param {Function} view 视图调用
     */
    constructor( ctrl, model, view ) {
        this.control = ctrl  || ( (n, v) => Promise.resolve(v) );
        this.model   = model || ( (n, v) => v );
        this.view    = view  || ( (n, v) => v );
    }


    /**
     * 程序运行。
     * @param  {String} meth 请求方法，可选
     * @return {Promise}
     */
    run( evo, meth = 'index' ) {
        return this.control( meth, evo.data )
            .then( d => this.model( meth, d ) )
            .then( d => this.view( meth, d ) );
    }
}



/**
 * 数据检取（Fetch）。
 * 暂存区的流程数据会作为查询串上传。
 * 注：仅支持 GET 方法。
 * @param {String} meth 请求方法。可选，默认index
 */
function Puller( evo, meth = 'index' ) {
    let _url = `${pullRoot}/${meth}`;

    if ( evo.data != null ) {
        _url += '?' + new URLSearchParams(evo.data);
    }
    return fetch(_url).then(
        resp => resp.ok ? resp.json() : Promise.reject(resp.statusText)
    );
}


//
// App存储区。
//
const AppStore = { pull: Puller };


//
// X库扩展（App子域）。
//
window.Tpb.Lib.X( 'App', AppStore );



//
// 导出。
// 供外部扩展的具体实现用。
///////////////////////////////////////////////////////////////////////////////


/**
 * CMV扩展实现。
 * 每个扩展就是一个独立的程序。
 * 注：一个页面中可以同时使用多个App。
 *
 * @param {String} name 程序名
 * @param {Object} obj 扩展集 {control, model, view}
 * @param {Number} cnt 自动取栈条目数。可选，默认0
 */
function extend( name, obj, cnt = 0 ) {
    if ( name == 'pull' ) {
        throw new Error(`${name} is the reserved name.`);
    }
    let _app = new _App(
            obj.control,
            obj.model,
            obj.view
        );
    // 普通对象封装：预绑定。
    AppStore[ name ] = { run: _app.run.bind(_app), __run: cnt };
}


export const App = { extend };
