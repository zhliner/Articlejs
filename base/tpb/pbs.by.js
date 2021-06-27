//! $Id: pbs.by.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
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

import { bindMethod, Web, deepExtend, namedExtend, subObj, hostSet, funcSets } from "./config.js";
import { Get } from "./pbs.get.js";
import { App__ } from "./app.js";

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

};


//
// 预处理/导出。
//////////////////////////////////////////////////////////////////////////////


// 绑定：this固化。
// @proto: Get < Process < Control
export const By = $.proto(
    $.assign( {}, _By, bindMethod ),
    Get
);


/**
 * 接口：用户扩展。
 * 对象：
 * - 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * - 支持多层嵌套的子域，子域是一种分组，由普通的Object封装。
 * - 扩展时会自动创建不存在的中间子域。
 * - 如果方法需要访问指令单元（this:Cell），传递args为true。
 * 类实例：
 * 支持扩展类实例的方法，此时args需要是一个方法名数组。
 * 函数：
 * 支持单个函数扩展到目标子域，此时args为取栈数量实参。
 *
 * @param  {String} name 目标域或名称序列（子域可由句点分隔）
 * @param  {Object|Instance|Function} exts 扩展集或类实例或操作句柄
 * @param  {Boolean|[String]|Number} args 是否无需绑定或方法名集或取栈数量，可选。
 * @return {void}
 */
export function processExtend( name, exts, args ) {
    if ( $.isFunction(exts) ) {
        return hostSet( By, name, exts, args );
    }
    if ( $.isArray(args) ) {
        return namedExtend( name, exts, args, By );
    }
    deepExtend( name, exts, args, By );
}


/**
 * 接口：代理扩展。
 * 仅支持取值代理：function( name ): Function。
 * 通常，取值代理会返回一个操作函数或结果值。
 * @param  {String} name 目标域（子域由句点分隔）
 * @param  {Function} getter 取值函数
 * @param  {Number} n 取栈数量
 * @return {void}
 */
export function processProxy( name, getter, n ) {
    let _pro = new Proxy(
            {},
            { get: (_, k) => funcSets(getter(k), n) }
        );
    hostSet( By, name, _pro );
}


/**
 * 接口：创建CMV程序。
 * 每个程序遵循 CMV（Control/Model/View）三层划分，
 * 三层逻辑各自实现，依靠相同的方法名称达成关联。
 *
 * 模板调用：[MyApp].run([meth], ...)
 * 可传递 methods 构造友好的调用集：[MyApp].[meth](...)。
 * 注意 run 为总调用方法，不应覆盖（除非你希望这样）。
 *
 * 每一层逻辑实现为一个调用集。
 * conf: {
 *      control: Object[n]:function( data, ...rest ): Promise,
 *      model:   Object[n]:function( data ): Value,
 *      view:    Object[n]:function( data ): Value,
 * }
 * 注：
 * 与By普通用户扩展一样，占用By顶层空间。
 * 如果程序名称（name）重复，会抛出异常（而非静默覆盖）。
 *
 * @param  {String} name 程序名
 * @param  {Object} conf CMV配置对象
 * @param  {[String]} meths 方法名序列，可选
 * @return {void}
 */
export function cmvApp( name, conf, meths = [] ) {
    if ( By[name] != null ) {
        throw new Error(`By[${name}] is already exist.`);
    }
    let app = new App__( conf.control, conf.model, conf.view ),
        obj = subObj( name, By );

    obj.run = app.run.bind(app);

    // 可能覆盖.run
    meths.forEach( m => obj[m] = app.call.bind(app, m) );
}
