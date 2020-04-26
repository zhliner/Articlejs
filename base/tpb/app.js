//! $Id: app.js 2019.08.10 Tpb.Base $
//+++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  页面App实现（CMV）。
//
//  和服务器交互，提交数据并获取响应。
//
//  - Control
//      对提交的数据进行前置控制和预处理，数据实参（data）为当前条目（前阶主动取出）。
//      接口：function( meth:String, data, ...rest:Value ): Promise
//
//  - Model
//      业务模型处理，控制部分的返回值传递到此（data）。
//      接口：function( meth:String, data:Value ): Value
//
//  - View
//      视图部分的数据整理，可与控制部分呼应，接收模型的返回值。
//      注：该部分的返回值回到执行流（数据栈）。
//      接口：function( meth:String, data:Value ): Value
//
//
///////////////////////////////////////////////////////////////////////////////
//


export class App__ {
    /**
     * 构建一个App。
     * 仅ctrl接口接受额外模板实参，其它接口接受ctrl的返回值。
     * 无ctrl实现时，默认返回流程数据供后续接口使用。
     * @param {Function} ctrl 控制调用
     * @param {Function} model 模型调用
     * @param {Function} view 视图调用
     */
    constructor( ctrl, model, view ) {
        this.control = ctrl  || ( (n, ...vs) => Promise.resolve(vs[0]) );
        this.model   = model || ( (n, d) => d );
        this.view    = view  || ( (n, d) => d );
    }


    /**
     * 程序运行。
     * @data: Any
     * @param  {String} meth 运行方法
     * @param  {...Value} rest 剩余参数
     * @return {Promise}
     */
    run( evo, meth, ...rest ) {
        return this.control( meth, evo.data, ...rest )
            .then( d => this.model( meth, d ) )
            .then( d => this.view( meth, d ) );
    }


    /**
     * 方法调用封装。
     * 注：绑定专用。
     * @param  {String} meth 运行方法
     * @param  {...Value} rest 剩余参数
     * @return {Promise}
     */
    call( meth, evo, ...rest ) {
        return this.run( evo, meth, ...rest );
    }
}
