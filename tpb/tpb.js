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
//      Build: {Function}   节点树OBT构建函数
//      Lib:   {Object}     库空间，包含扩展库X接口，X(...)
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
import { Support, OBTA } from "./config.js";


const
    $ = window.$,

    // 库空间。
    Lib = { X },

    // On属性选择器
    _onSlr = `[${OBTA.on}]`;


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
 * 节点树OBT构建。
 * 注：OBT配置独立，无DOM树逻辑关联。
 * @param  {Element|DocumentFragment} root 根容器
 * @return {void}
 */
function Build( root ) {
    $.find( root, _onSlr, true )
    .forEach( el => _obter.build( el ) );
}


let tplStore = null;


(function () {

    // 模板支持。
    if ( Support.template ) {
        tplStore = new Templater(
            tplLoad, Build, Support.render && Render
        );
    }

    Base.init( tplStore );

})();


//
// 导出。
// 用于正常的初始页面解析&构建。
///////////////////////////////////////////////////////////////////////////////

export const Tpb = { Build, Lib };
