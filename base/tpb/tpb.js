//! $Id: tpb.js 2019.08.19 Tpb.Base $
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
//      Lib:   {Object}     用户库空间
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

import { Builder } from "./core.js";
import { OBTA, DEBUG, InitTpl, storeChain, TLoader, XLoader, Web } from "./config.js";

// 无需模板支持。
// import { Templater } from "./tools/templater.x.js";
// 模板功能支持。
import { Templater } from "./tools/templater.js";


const
    $ = window.$,

    // 用户库空间。
    Lib = {
        App: cmvApp,
        extend: processExtend,
        extendProxy: processProxy,
        customGet: customGetter,
    },

    // obt-src并列分隔符。
    // 各部分路径独立（都相对于根路径）。
    __sepPath = ',',

    // OBT属性选择器
    __obtSlr = `[${OBTA.on}], [${OBTA.src}]`,

    // OBT名称序列。
    __obtName = `${OBTA.on} ${OBTA.by} ${OBTA.to} ${OBTA.src}`;



//
// 基础支持
//=========================================================


// OBT构造器
const __obter = new Builder( {
        on:     On,
        by:     By,
        update: To.Update,
        next:   To.Next,
    },
    storeChain
);


/**
 * 获取目标元素的OBT配置。
 * - 本地（节点）配置优先，因此会先绑定本地定义。
 * - 会移除元素上的OBT属性，如果需要请预先取出。
 * @param  {Element} el 目标元素
 * @return {[Promise<Object3>]} OBT配置<{on, by, to}>
 */
function obtAttr( el ) {
    let _buf = [];

    if ( el.hasAttribute(OBTA.on) ) {
        _buf.push( _obtattr(el) );
    }
    if ( el.hasAttribute(OBTA.src) ) {
        _buf.push( ..._obtjson($.attr(el, OBTA.src)) )
    }
    $.removeAttr( el, __obtName );

    return Promise.all( _buf );
}


/**
 * 取OBT特性值。
 * @param  {Element} el 取值元素
 * @return {Object3}
 */
function _obtattr( el ) {
    return {
        on: $.attr(el, OBTA.on) || '',
        by: $.attr(el, OBTA.by) || '',
        to: $.attr(el, OBTA.to) || '',
    };
}


/**
 * 从远端载入OBT配置。
 * 支持逗号分隔的多目标并列导入，如：obt-src="obts/aaa.json, obts/bbb.json"。
 * @param  {String} src 源定义
 * @return [Promise<Object3>]
 */
function _obtjson( src ) {
    return src
        .split( __sepPath )
        .map( url => XLoader.json(url) );
}


/**
 * 节点OBT构建。
 * 返回承诺以支持外部OBT配置（obt-src）导入。
 * @param  {Element|DocumentFragment} root 根节点
 * @return {Promise<void>}
 */
function nodeBuild( root ) {
    let _buf = [];

    for ( const el of $.find(__obtSlr, root, true) ) {
        _buf.push(
            obtAttr( el )
            .then( obts => obts.forEach(obt => __obter.build(el, obt)) )
        );
    }
    return Promise.all( _buf );
}


// 模板对象。
const __Tpl = InitTpl( new Templater(nodeBuild, TLoader.load.bind(TLoader)) );



//
// 调试工具
//////////////////////////////////////////////////////////////////////////////


if (DEBUG) {

    window.On = On;
    window.By = By;
    window.Update = To.Update;
    window.Next = To.Next;
    window.Tpl = __Tpl;
    window.Lib = Lib;
    window.namedTpls = namedTpls;

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

    // 重置。
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
 * OBT构建封装。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * - 单纯传递 root 可用于页面中既有OBT构建。
 * - 传递 conf 为 OBT 配置对象（必含on）可用于即时测试外部的OBT配置，
 *   或构建无法直接定义OBT的对象（如Documet）。
 * - 如果 root 中包含模板语法且需要引入外部子模版，则 conf 可以是配置文件路径或配置对象（{file:[node-name]}）。
 * 注意：
 * 如果conf为子模板配置对象，文件名应当包含扩展名（参考 templates/maps.json）。
 * 返回的承诺对象承诺了根元素及其子模板内的所有构建。
 * @param  {Element|Document|Object} root 根容器或处理对象
 * @param  {String|Object3} conf 模板节点配置文件路径或配置对象，可选
 * @return {Promise<void>|root}
 */
function build( root, conf ) {
    if ( conf && conf.on ) {
        return __obter.build( root, conf );
    }
    return TLoader.config(conf).then( () => __Tpl.build(root) );
}


export default { Lib, build };
