//! $Id: tpb.js 2019.08.19 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++
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

import { Base, Base2, chainStore } from "./libs/pbs.base.js";
import { On } from "./libs/pbs.on.js";
import { By } from "./libs/pbs.by.js";
import { To } from "./libs/pbs.to.js";

import { Builder } from "./libs/obter.js";
import { Templater } from "./libs/templater.js";
import { tplLoad } from "./libs/tloader.js";
import { X } from "./libs/lib.x.js";
import { Support, OBTA, DEBUG } from "./config.js";


const
    $ = window.$,

    // 库空间。
    Lib = { X },

    // On属性选择器
    __onSlr = `[${OBTA.on}]`,

    // OBT属性取值序列。
    __obts = `${OBTA.on} ${OBTA.by} ${OBTA.to}`;



// 运算全局。
// 适用：On/By。
$.proto( Base2, Base );


// 基础集继承（原型）。
$.proto( On, Base2 ),
$.proto( By, Base2 ),

$.proto( To.Where, Base );
$.proto( To.Stage, Base );


//
// 基础支持。
//===============================================


// OBT 构造器
const _obter = new Builder( {
        on:     On,
        by:     By,
        where:  To.Where,
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
        return _obter.build( root, obts );
    }
    // 节点树
    for ( const el of $.find(__onSlr, root, true) ) {
        _obter.build( el, obtAttr(el, obts) );
    }
}


// 模板对象。
let __Tpl = null;



//
// 模板支持初始化。
//
(function () {

    if ( Support.template ) {
        __Tpl = Base.tplStore( new Templater( tplLoad, obtBuild ) );
    }

})();


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
        Where: To.Where,
        Stage: To.Stage,
        Tpl: __Tpl,
    };
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////

export default {
    Lib,
    Build: __Tpl ? __Tpl.build.bind(__Tpl) : obtBuild,
};
