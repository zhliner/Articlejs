//! $Id: pbs.by.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  OBT:By 方法集。
//
//  仅包含少量的几个顶级基础指令。
//  主要功能依赖于用户定义的库和系统内置的X库。
//
//  用户的扩展存在于By的顶层（By对象自身），但也可以扩展到任意子域上。
//
//  用户扩展：
//      import { processExtend } from "./pbs.by.js";
//      processExtend( 'Name', extobj );
//      processExtend( 'Name.Sub', extobj );  // 扩展到 Sub 子域
//
//  App创建：
//      import { cmvApp } from "./pbs.by.js";
//      cmvApp( 'MyApp', conf, meths );
//      // processExtend(...)
//      // 也可以在MyApp域上用 processExtend 扩展任意普通方法。
//
//      模板使用：
//      by="MyApp.run('meth', ...)"
//      by="MyApp.meth(...)"  // 同上，形式友好。
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./tools/util.js";
import { X } from "./lib.x.js";
import { App__ } from "./app.js";
import { bindMethod, Web, subExtend } from "./config.js";
import { Control } from "./pbs.base.js";

// 无渲染占位。
// import { Render } from "./tools/render.x.js";
import { Render } from "./tools/render.js";


const
    $ = window.$,

    // 请求根路径。
    pullRoot = new URL( Web.pulls, Web.base );


const _By = {
    /**
     * 数据拉取（简单）。
     * 目标：暂存区1项可选。
     * 暂存区的流程数据会作为查询串上传。
     * 注：仅支持 GET 方法。
     * @data: [[key, value]]|{key: value}
     * @param  {String} meth 请求方法。可选，默认index
     * @return {Promise} data:json
     */
    pull( evo, meth = 'index' ) {
        let _url = `${pullRoot}/${meth}`;

        if ( evo.data != null ) {
            _url += '?' + new URLSearchParams(evo.data);
        }
        return fetch(_url).then(
            resp => resp.ok ? resp.json() : Promise.reject(resp.statusText)
        );
    },

    __pull: -1,


    /**
     * 元素渲染（单个）。
     * 目标：暂存区/栈顶1项。
     * 仅支持单个元素渲染，因为数据与元素紧密相关（也易于封装为单个元素）。
     * 如果多次使用，可用不同的数据渲染不同的目标。
     * 如果需要同一数据对多个元素分别渲染，可用To:render。
     * @param  {Object|Value|[Value]} vals 渲染数据
     * @return {Element} 被渲染节点
     */
    render( evo, vals ) {
        return Render.update( evo.data, vals );
    },

    __render: 1,


    /**
     * 导入X库成员。
     * 目标：无。
     * 注意：有一个小写的 x 名称空间。
     * @param  {String} path 引用路径（句点分隔）
     * @return {Value}
     */
    X( evo, path ) {
        return Util.subObj( path.split('.'), X );
    },

    __X: null,

};



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 创建一个App调用域。
 * @param  {App__} app 一个App实例
 * @param  {Array} meths 方法名集
 * @return {Object}
 */
function appScope( app, meths ) {
    return meths.reduce(
        (obj, m) => ( obj[m] = app.call.bind(app, m), obj ),
        { run: app.run.bind(app) }
    );
}



//
// 预处理/导出。
//////////////////////////////////////////////////////////////////////////////


// 绑定：this固化。
// @proto: Control
export const By = $.proto(
    $.assign( {}, _By, bindMethod ), Control
);

//
// X引入。
// 模板中使用小写形式。
//
By.x = X;


/**
 * 接口：普通扩展。
 * 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * 支持多层嵌套的子域，子域是一种分组，由普通的Object封装。
 * 扩展时会自动创建不存在的中间子域。
 * 如果方法需要访问指令单元（this:Cell），传递nobind为真。
 * @param  {String} name 子域/链（多级由句点分隔）
 * @param  {Object} exts 扩展集
 * @param  {Boolean} nobind 无需绑定（可访问Cell实例），可选。
 * @return {Object} 目标子域
 */
export function processExtend( name, exts, nobind ) {
    return subExtend( name, exts, nobind, By );
}


/**
 * 接口：创建CMV小程序。
 * 每个程序遵循CMV（Control/Model/View）三层划分逻辑。
 * 模板中调用需要传递方法名：[MyApp].run([meth], ...)，用于区分不同的调用。
 * 传递meths可以构造友好的调用集：[MyApp].[meth](...)。
 * 注意不应覆盖run名称，除非你希望这样（如固定方法集）。
 * conf: {
 *      control: function(meth, data, ...rest ): Promise,
 *      model:   function(meth, data ): Value,
 *      view:    function(meth, data ): Value,
 * }
 * 注记：与By普通用户扩展一样，占用By顶层空间。
 * @param {String} name 程序名
 * @param {Object} conf CMV配置对象
 * @param {[String]} meths 方法名序列，可选
 */
export function cmvApp( name, conf, meths ) {
    let _app = By[name];

    if ( _app != null ) {
        throw new Error(`[${name}]:${_app} is already exist.`);
    }
    let _cmv = [
            conf.control,
            conf.model,
            conf.view
        ];
    processExtend( name, appScope(new App__(..._cmv), meths) );
}
