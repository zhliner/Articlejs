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
import { TLoader } from "./libs/tloader.js";
import { OBTA, tplsMap, DEBUG, InitTpl, storeChain } from "./config.js";

// 无需模板支持。
// import { Templater } from "./libs/templater.x.js";
// 模板功能支持。
import { Templater } from "./libs/templater.js";


const
    $ = window.$,

    // 用户库空间。
    Lib = { extend, App },

    // On属性选择器
    __onSlr = `[${OBTA.on}]`,

    // OBT属性取值序列。
    __obts = `${OBTA.on} ${OBTA.by} ${OBTA.to}`;



//
// 基础支持。
//===============================================


// OBT 构造器
const _obter = new Builder( {
        on:     On,
        by:     By,
        update: To.Update,
        next:   To.NextStage,
    },
    storeChain
);


/**
 * 目标OBT构建。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * 手动传递OBT配置（obts）视为仅处理目标本身。
 * obts可以传递布尔值，此时表示是否清除元素上的OBT定义。
 *
 * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
 * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
 * @return {Element...} root
 */
function obtBuild( root, obts = true ) {
    // 单目标
    if ( typeof obts != 'boolean' ) {
        return _obter.build( root, obts );
    }
    $.find( __onSlr, root, true )
    .forEach(
        el => _obter.build( el, obtAttr(el, obts) )
    );
    return root;
}


// 模板对象。
const __Tpl = InitTpl( new Templater(obtBuild, TLoader.load.bind(TLoader)) );



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取目标元素的OBT配置。
 * @param  {Element} el 目标元素
 * @param  {Boolean} clear 是否清除OBT属性
 * @return {Object3} OBT配置（{on,by,to}）
 */
function obtAttr( el, clear ) {
    let _obj = {
        on: el.getAttribute( OBTA.on ) || '',
        by: el.getAttribute( OBTA.by ) || '',
        to: el.getAttribute( OBTA.to ) || '',
    };
    if ( clear ) {
        $.removeAttr(el, __obts);
    }
    return _obj;
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
         * @param  {String} 友好缩进占位字符
         * @return {void}
         */
        findTpls: function( files, space = '\t' ) {
            let _buf = {};

            Promise.all( files.map(
                f => TLoader.fetch(f)
                    .then( frag => $.find('[tpl-name]', frag).map( el => el.getAttribute('tpl-name') ) )
                    .then( ns => _buf[f] = ns )
                )
            ).then( () => window.console.info(JSON.stringify(_buf, null, space)) );
        }
    };
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////

//
// 模板节点配置初始化标记。
//
let _tplsDone = false;


/**
 * OBT构建封装。
 * 包含模板节点配置的初始化。
 * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
 * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
 * @return {Promise|void}
 */
function Build( root, obts ) {
    if ( _tplsDone ) {
        return __Tpl.build( root, obts );
    }
    return TLoader.init(tplsMap)
        .then(
            () => ( _tplsDone = true, __Tpl.build(root, obts) )
        );
}


export default { Lib, Build };
