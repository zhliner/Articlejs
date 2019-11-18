//! $Id: app.js 2019.08.10 Tpb.Page $
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//          Copyright (c) 铁皮工作室 2017 MIT License
//
//          @project: Tpb v0.3.2
//          @author:  风林子 zhliner@gmail.com
//////////////////////////////////////////////////////////////////////////////
//
//  页面App实现（CMV）。
//
//  和服务器交互，提交数据并获取响应。
//
//  - Control
//      对提交的数据进行前置控制和预处理，数据实参（data）为当前条目（前阶主动提取）。
//      接口：function( meth:String, data:Value ): Promise
//
//  - Model
//      业务模型处理，控制部分的返回值传递到此（data）。
//      接口：function( meth:String, data:Value ): Value
//
//  - View
//      视图部分的数据整理，可与控制部分呼应，接收模型的返回值。
//      注：该部分的返回值回入执行流（返回数据栈）。
//      接口：同 Model。
//
//
//  开发：
//      import { App } from 'app.js'
//      App.register( 'MyApp', conf:Object(c,m,v), [meth...] );
//      // conf为CMV配置对象：
//      // - 包含三个入口函数，局部可选。
//      // - 可包含其它任意指令或指令子集（Object封装），可选
//
//  模板使用：
//      by="x.MyApp.run('xxx')" // xxx为方法名，方法的实参为当前条目
//      by="x.MyApp.xxx"        // 同上，友好使用形式
//      by="x.MyApp.xyz.abc"    // 其它任意指令/子集指令
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { X } from "../lib.x.js";


class _App {
    /**
     * 构建一个App。
     * 需传入三个阶段的入口函数。
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


    /**
     * 方法调用封装。
     * 注：bind()专用。
     */
    methrun( meth, evo ) {
        return this.run( evo, meth );
    }
}


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
 * @param {Object} extra 附带成员集
 */
function appScope( app, meths, extra ) {
    let _obj = {
        run: app.run.bind(app)
    };
    meths.forEach(
        meth => _obj[meth] = app.methrun.bind(app, meth)
    );
    return Object.assign(_obj, extra);
}


// 清除CMV配置项。
function clear( conf ) {
    delete conf.control;
    delete conf.model;
    delete conf.view;
    return conf;
}


/**
 * 注册CMV小程序。
 * 每个程序遵循CMV（Control/Model/View）三层划分逻辑。
 * 模板中调用需要传递方法名：x.[MyApp].run([meth])，用于区分不同的调用。
 * 不同方法的实参是前阶主动提取的当前条目。
 * 注：
 * 传递meths可以构造友好的调用集：x.[MyApp].[meth]。
 * 注意不应覆盖run名称，除非你希望这样（如固定方法集）。
 *
 * conf:Object {
 *      control: function(meth, data ): Promise,
 *      model:   function(meth, data ): Value,
 *      view:    function(meth, data ): Value,
 *      ...      // 可附带任意指令子集
 * }
 * @param {String} name 程序名
 * @param {Object} conf CMV配置对象
 * @param {[String]} meths 方法名序列，可选
 */
function register( name, conf, meths = [] ) {
    let _app = X[name];

    if ( _app != null ) {
        throw new Error(`[${name}]:${_app} is already exist.`);
    }
    let _cmv = [
            conf.control,
            conf.model,
            conf.view
        ];
    X.extend( name, appScope(new _App(..._cmv), meths, clear(conf)) );
}


//
// 注册App。
//
export const App = { register };
