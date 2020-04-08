//! $Id: tpb.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基础定义集。
//
//  Tpb {
//      Build: {Function}   节点树OBT构建函数
//      Lib:   {Object}     用户库空间
//  }
//  用户扩展：
//  - 普通扩展：Tpb.Lib.extend( ... )
//  - App 创建：Tpl.Lib.App( ... )
//
//  支持模板的动态导入、模板和既有DOM元素的渲染。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { On } from "./libs/pbs.get.js";
import { By, extend, App } from "./libs/pbs.by.js";
import { To } from "./libs/pbs.to.js";

import { Builder } from "./libs/obter.js";
import { Web, OBTA, DEBUG, InitTpl, storeChain, TLoader, XLoader } from "./config.js";

// 无需模板支持。
// import { Templater } from "./libs/templater.x.js";
// 模板功能支持。
import { Templater } from "./libs/templater.js";


const
    $ = window.$,

    // 用户库空间。
    Lib = { extend, App },

    // OBT属性选择器
    __onSlr = `[${OBTA.on}], [${OBTA.src}]`,

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
        next:   To.NextStage,
    },
    storeChain
);


/**
 * 节点OBT构建。
 * @param  {Element|DocumentFragment} root 根节点
 * @param  {Boolean} clear 是否清除OBT属性
 * @return {root}
 */
function nodeBuild( root, clear ) {
    for ( const el of $.find(__onSlr, root, true) ) {
        obtAttr(el, clear)
        .then( obt => __obter.build(el, obt) );
    }
    return root;
}


// 模板对象。
const __Tpl = InitTpl( new Templater(nodeBuild, TLoader.load.bind(TLoader)) );



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取目标元素的OBT配置。
 * 可能会移除元素上的OBT属性本身。
 * @param  {Element} el 目标元素
 * @param  {Boolean} clear 是否清除OBT属性
 * @return {Promise<Object3>} OBT配置<{on, by, to}>
 */
function obtAttr( el, clear ) {
    let _obt = _obtattr(el);

    if ( clear ) {
        $.removeAttr(el, __obtName);
    }
    return Promise.resolve(_obt);
}


/**
 * 获取OBT配置。
 * 如果存在src配置，会忽略元素自身的OBT配置。
 * 注：两者不应同时定义。
 * @param  {Element} el 目标元素
 * @return {Promise<Object>|Object}
 */
function _obtattr( el ) {
    if ( el.hasAttribute(OBTA.src) ) {
        return XLoader
            .json( `${Web.obtdir}/${$.attr(el, OBTA.src)}` );
    }
    return {
        on: $.attr(el, OBTA.on) || '',
        by: $.attr(el, OBTA.by) || '',
        to: $.attr(el, OBTA.to) || '',
    };
}



// 调试：
if (DEBUG) {

    window.Debug = {
        On,
        By,
        Update: To.Update,
        Nexts:  To.NextStage,
        Tpl:    __Tpl,
        Lib,
        /**
         * 输出模板节点定义:
         * 提取模板文件中定义的模板节点配置。
         * 用于模板开发结束后配置模板映射文件（templates/maps.json）。
         * 注：在浏览器控制台执行。
         * @param  {[String]} files 模板文件名集
         * @param  {Boolean} sort 是否排序
         * @return {void}
         */
        findTpls: function( files, sort ) {
            let _buf = new Map();

            if ( !$.isArray(files) ) {
                files = [files];
            }
            // 先插入以保留原始顺序。
            files.forEach( f => _buf.set(f, null) );

            Promise.all(
                files.map( f =>
                    TLoader.fetch(f)
                    .then( frag => $.find('[tpl-name]', frag).map(el => $.attr(el, 'tpl-name')) )
                    .then( ns => _buf.set(f, sort ? orderList(ns) : ns) )
                )
            ).then(
                () => tplsOuts(_buf)
            );
        }
    };


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
            (v, i) => {
                let _v = v === _p ? `[__REPEATED__]: ${v}` : v;
                _p = v;
                return _v;
            }
        );
    }
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * OBT构建封装。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * - 单纯传递 root 可用于页面中既有OBT构建（效果测试）。
 * - 传递 obts 可用于即时测试外部的OBT配置。
 * - 如果 root 中包含模板语法且需要引入外部子模版，则传递 maps 实参。
 * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
 * @param  {Boolean|Object3} obts 清除OBT属性标记或OBT配置（{on,by,to}），可选
 * @param  {String|Object} maps 模板节点配置文件（相对于URL根）或配置对象，可选
 * @return {Promise<void>|root}
 */
function Build( root, obts = true, maps = null ) {
    if ( typeof obts != 'boolean' ) {
        return __obter.build( root, obts );
    }
    return TLoader.config(maps).then( () => __Tpl.clear(obts).build(root) );
}


export default { Lib, Build };
