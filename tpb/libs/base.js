//! $Id: base.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT 基础集定义。
//
//  可能支持模板和模板渲染（视全局配置而定）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Base, Base2 } from "./pbs.base.js";
import { On } from "./pbs.on.js";
import { By, chainStore } from "./pbs.by.js";
import { To } from "./pbs.to.js";

import { Builder } from "./obter.js";
import { Templater } from "./templater.js";
import { Render } from "./render.js";
import { tplLoad } from "./tloader.js";
import { Support, OBTA } from "../globals.js";


const
    $ = window.$,

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


// OBT 构造器
const obter = new Builder(
    {
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
function OBTBuild( root ) {
    $.find( root, _onSlr, true )
    .forEach( el => obter.build( el ) );
}


let tplStore = null;


(function () {

    // 模板支持。
    if ( Support.template ) {
        tplStore = new Templater(
            tplLoad, OBTBuild, Support.render && Render
        );
    }

    Base.init( tplStore );

})();


//
// 导出。
// 用于正常的初始页面解析&构建。
///////////////////////////////////////////////////////////////////////////////

export { OBTBuild };
