//! $ID: tpb.js 2019.08.19 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基础定义集。
//
//  Tpb {
//      build: {Function}   节点树OBT构建函数
//      Lib:   {Object}     OBT库扩展动态调用集
//  }
//  动态扩展：
//  - 普通处理器：Tpb.Lib.extend( ... )
//  - App 创建：Tpl.Lib.App( ... )
//
//  支持模板的动态导入、模板和既有DOM元素的渲染。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { On, customGetter } from "./pbs.get.js";
import { By, processExtend, cmvApp, processProxy } from "./pbs.by.js";
import { To } from "./pbs.to.js";

import { DEBUG, TLoader, XLoader, TplPool, Web, Templates, tplInit } from "./config.js";
import { storeChain } from "./base.js";

import { Builder } from "./core.js";

// 无模板支持。
// import { Templater } from "./tools/templater.x.js";
// 模板功能支持。
import { Templater } from "./tools/templater.js";


const
    $ = window.$,

    // OBT库扩展调用集
    // 主要用于第三方插件动态扩展所需的OBT库。
    Lib = {
        App: cmvApp,
        extend: processExtend,
        extendProxy: processProxy,
        customGet: customGetter,
    };



//
// 调试工具
//////////////////////////////////////////////////////////////////////////////


if ( DEBUG ) {

    window.On = On;
    window.By = By;
    window.Update = To.Update;
    window.Next = To.Next;
    window.Tpl = Templates;
    window.Lib = Lib;
    window.namedTpls = namedTpls;
    window.TLoader = TLoader;

}


/**
 * 输出模板节点定义。
 * 提取模板文件中定义的模板节点配置。
 * 用于模板开发结束后配置模板映射文件（templates/maps.json）。
 * 注：在浏览器控制台执行。
 * @param  {[String]} files 模板文件名集
 * @param  {Boolean} sort 是否排序
 * @return {void}
 */
function namedTpls( files, sort ) {
    let _buf = new Map();

    if ( !$.isArray(files) ) {
        files = [files];
    }
    // 先插入以保留原始顺序。
    files.forEach( f => _buf.set(f, null) );

    // 避免之前构建影响。
    XLoader.clear();

    Promise.all(
        files.map( f =>
            XLoader.node(`${Web.tpldir}/${f}`)
            .then( frag => $.find('[tpl-name]', frag).map(el => $.attr(el, 'tpl-name')) )
            .then( ns => _buf.set(f, sort ? orderList(ns) : ns) )
        )
    ).then(
        () => tplsOuts(_buf)
    );
}


// 输出配置对象。
function tplsOuts( map ) {
    let _obj = {};
    for (const [f, vs] of map) _obj[f] = vs;

    window.console.info( JSON.stringify(_obj, null, '\t') );
}


// 有序清单（标记重复）。
function orderList( vals ) {
    let _p;
    return vals.sort().map(
        v => {
            let _v = v === _p ? `[__REPEATED__]: ${v}` : v;
            _p = v;
            return _v;
        }
    );
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取OBT构建器。
 * 注记：
 * To部分不支持用户扩展，因此无参数传入。
 * @param  {Object} on On定义集，可选
 * @param  {Object} by By定义集，可选
 * @return {Builder}
 */
function obtBuilder( on = On, by = By ) {
    return new Builder({
            on,
            by,
            update: To.Update,
            next:   To.Next,
        },
        storeChain
    );
}


/**
 * Tpb初始化。
 * 设置全局模板管理器，在一个应用启动之前调用。
 * 强制模板存放在默认配置的目录内（TLoader）。
 * @param  {Object} on On定义集，可选
 * @param  {Object} by By定义集，可选
 * @return {void}
*/
function Init( on, by ) {
    tplInit( new Templater(TLoader, obtBuilder(on, by), TplPool) );
}


/**
 * 单元素OBT构建。
 * 可用于即时测试外部的OBT配置，或构建无法直接定义OBT的对象（如Documet）。
 * 仅OBT处理，不包含渲染语法的解析。
 * @param  {Element} el 目标元素
 * @param  {Object} conf OBT配置对象（{on, by, to}）
 * @param  {Object} ob On/By方法集，可选
 * @return {Element} el
 */
function buildNode( el, conf, ob = {} ) {
    return obtBuilder( ob.on, ob.by ).build( el, conf );
}


/**
 * 通用OBT全构建。
 * 包括节点树内引入的子模版的连锁解析构建。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * - 单纯传递 root 可用于页面中既有OBT构建（没有子模版逻辑）。
 * - 如果 root 中包含模板语法且需要引入外部子模版，则 conf 是必需的。
 * - 如果模板存放在非默认目录内，可以传递一个自定义的模板管理器实例（tplr）。
 * 注意：
 * conf为子模板配置对象时，格式参考 templates/maps.json。
 * 返回的承诺对象承诺了根元素及其子模板内的所有构建。
 * @param  {Element|Document|Object} root 根容器或处理对象
 * @param  {String|Object} conf 模板节点配置文件或配置对象，可选
 * @param  {Templater} tplr 模板管理器实例，可选
 * @return {Promise<void>}
 */
function build( root, conf, tplr = Templates ) {
    return tplr.tloader()
        .config( conf || {} ).then( () => tplr.build(root) );
}


export default { Lib, Init, obtBuilder, buildNode, build };
