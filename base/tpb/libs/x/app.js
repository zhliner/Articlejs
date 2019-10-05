//! $Id: app.js 2019.08.10 Tpb.Page $
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//          Copyright (c) 铁皮工作室 2017 MIT License
//
//          @project: Tpb v0.3.2
//          @author:  风林子 zhliner@gmail.com
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
//  实现：
//      import { App } from 'app.js'
//      App.register( appName, [control, model, view], methods? );
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { pullRoot } from "../../config.js";
import { X } from "../lib.x.js";


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
 * @param  {String} meth 请求方法。可选，默认index
 * @return {Promise} data:json
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
let AppStore = null;


//
// 扩展注入X库。
//
(function() {
    AppStore = X.extend( 'App', { pull: Puller } );
})();


//
// 导出。
// 供外部扩展的具体实现用。
///////////////////////////////////////////////////////////////////////////////


/**
 * 创建一个App调用域。
 * 友好支持方法名直接调用：x.App.[meth]
 * 注：普通的调用：x.App.run('[meth]')
 * @param {_App} app 一个App实例
 * @param {Array} meths 方法名序列
 */
function appScope( app, meths ) {
    let _obj = {
        run: app.run.bind(app)
    };
    meths.forEach(
        meth => _obj[meth] = app.run.bind(app, meth)
    );
    return _obj;
}


/**
 * 注册CMV小程序。
 * 每个程序遵循CMV（Control/Model/View）三层划分逻辑。
 * 模板中调用需要传递方法名：x.App.run([meth])，用于区分不同的调用。
 * 不同方法的实参是前阶提取的当前条目（流程数据）。
 * 注：
 * 传递meths可以构造友好的调用集：x.App.[meth]。
 * 注意不应覆盖run名称，除非你希望这样（如固定方法集）。
 *
 * @param {String} name 程序名
 * @param {[Function]} conf CMV定义
 * @param {[String]} meths 方法名序列，可选
 */
function register( name, conf, meths = [] ) {
    let _a = AppStore[name];

    if ( _a != null ) {
        throw new Error(`[${name}]:${_a} is already exist.`);
    }
    AppStore[name] = appScope( new _App(...conf), meths );
}


// 注册App。
// 可用于运行时的动态注册。
export const App = { register };
