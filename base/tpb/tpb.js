//! $Id: tpb.js 2019.08.19 Tpb.Base $
//
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基础定义集。
//
//  Tpb {
//      Build: {Function}   节点树OBT构建函数（页面既有元素）
//      Lib:   {Object}     库空间，提供外部X扩展接口：Tpb.Lib.X.extend(...)
//  }
//
//  可能支持模板和模板渲染（视全局配置而定）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Base, Base2 } from "./libs/pbs.base.js";
import { On } from "./libs/pbs.on.js";
import { By, chainStore } from "./libs/pbs.by.js";
import { To } from "./libs/pbs.to.js";

import { Builder } from "./libs/obter.js";
import { Templater } from "./libs/templater.js";
import { Render } from "./libs/render.js";
import { tplLoad } from "./libs/tloader.js";
import { X } from "./libs/lib.x.js";
import { App } from "./libs/x/app.js";
import { Support, OBTA } from "./config.js";


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
 * 目标对象/节点树的OBT构建。
 * 可用于DOM节点树和可绑定事件的普通对象（如window）。
 * 普通对象可手动传递OBT配置（否则从对象上获取）。
 * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
 * @param  {Boolean|Array3} 清除指示或OBT配置（[on,by,to]）
 * @return {void}
 */
function Build( root, obts = true ) {
    if ( !root.nodeType ) {
        return _obter.build(
            root,
            typeof obts == 'boolean' ? obtProp(root, obts) : obts
        );
    }
    for ( const el of $.find(root, __onSlr, true) ) {
        _obter.build( el, obtAttr(el, !!obts) );
    }
}


(function () {

    if ( Support.template ) {
        Base.tplStore(
            new Templater( tplLoad, Build, Support.render && Render )
        );
    }

})();


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取待处理对象的OBT配置。
 * 适用非元素类可绑定事件的普通对象（如window）。
 * @param  {Object} obj 处理对象
 * @param  {Boolean} clear 是否清除OBT属性
 * @return {Array3} OBT配置（[on,by,to]）
 */
function obtProp( obj, clear ) {
    let _buf = [];

    if ( obj[OBTA.on] ) {
        _buf[0] = obj[OBTA.on];
        _buf[1] = obj[OBTA.by];
        _buf[2] = obj[OBTA.to];
    }
    if ( clear ) {
        delete obj[OBTA.on];
        delete obj[OBTA.by];
        delete obj[OBTA.to];
    }
    return _buf;
}


/**
 * 获取目标元素的OBT配置。
 * @param  {Element} el 目标元素
 * @param  {Boolean} clear 是否清除OBT属性
 * @return {Array3} OBT配置（[on,by,to]）
 */
function obtAttr( el, clear ) {
    let _buf = [
        el.getAttribute( OBTA.on ),
        el.getAttribute( OBTA.by ),
        el.getAttribute( OBTA.to ),
    ];
    if ( clear ) {
        $.removeAttr( el, __obts );
    }
    return _buf;
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////

export const Tpb = { Build, Lib };
