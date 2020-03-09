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
//      Lib:   {Object}     库空间，供外部动态扩展：Tpb.Lib.X.extend(...)
//  }
//
//  可支持模板和模板渲染（依全局配置而定）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Base, BaseOn } from "./libs/pbs.base.js";
import { On } from "./libs/pbs.on.js";
import { By } from "./libs/pbs.by.js";
import { To, chainStore } from "./libs/pbs.to.js";

import { Builder } from "./libs/obter.js";
import { Loader } from "./libs/tloader.js";
import { X } from "./libs/lib.x.js";
import { Support, OBTA, tplsMap, DEBUG, InitTpl } from "./config.js";

// 模板支持，可选
// 如果无支持，可简单删除。
import { Templater } from "./libs/templater.js";


const
    $ = window.$,

    // 库空间。
    Lib = { X },

    // On属性选择器
    __onSlr = `[${OBTA.on}]`,

    // OBT属性取值序列。
    __obts = `${OBTA.on} ${OBTA.by} ${OBTA.to}`;



// 基础集继承。
$.proto( On, BaseOn ),
$.proto( By, Base );
$.proto( To.Stage, Base );


//
// 基础支持。
//===============================================


// OBT 构造器
const _obter = new Builder( {
        on:     On,
        by:     By,
        update: To.Update,
        stage:  To.Stage,
    },
    chainStore
);


/**
 * 目标OBT构建。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * 手动传递OBT配置（obts）视为仅处理目标本身。
 * obts可以传递布尔值，此时表示是否清除元素上的OBT定义。
 *
 * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
 * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
 * @return {void}
 */
function obtBuild( root, obts = true ) {
    // 单目标
    if ( typeof obts != 'boolean' ) {
        _obter.build( root, obts );
        return;
    }
    // 节点树
    for ( const el of $.find(__onSlr, root, true) ) {
        _obter.build( el, obtAttr(el, obts) );
    }
}


// 模板对象。
let __Tpl = null;

// 一个空类占位。
// 如果取消模板支持，可用此空类避免错误。
// class Templater {}


//
// 模板支持初始化。
//
if ( Support.template ) {
    __Tpl = InitTpl( new Templater( Loader.load.bind(Loader), obtBuild ) );
}



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
        on: el.getAttribute( OBTA.on ),
        by: el.getAttribute( OBTA.by ),
        to: el.getAttribute( OBTA.to ),
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
        Stage:  To.Stage,
        Tpl:    __Tpl,

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
                f => Loader.fetch(f)
                    .then( root => $.find('[tpl-name]', root).map( el => el.getAttribute('tpl-name') ) )
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
// OBT构建函数。
// 支持模板时包含模板的解析构建。
//
const _Build = __Tpl ? __Tpl.build.bind(__Tpl) : obtBuild;


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
        return _Build( root, obts );
    }
    return Loader.init(tplsMap)
        .then(
            () => ( _tplsDone = true, _Build(root, obts) )
        );
}


export default { Lib, Build };
