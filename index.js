//! $ID: index.js 2021.12.25 Cooljed.User $
// ++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  上层用户页的基础工具定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { ROOT, Local } from "./config.js";
import { Tpb, BaseOn, BaseBy, customGetter, processExtend } from "./base/tpb/tpb.esm.js";


const
    On = Object.create( BaseOn ),
    By = Object.create( BaseBy );


//
// 编辑器实例存储。
// 用于调用Api接口设置样式等操作。
//
let __editor = null;


const Kit = {
    /**
     * 获取主题样式文件URL。
     * @param  {String} name 主题名
     * @return {String}
     */
    themeURL: function( name ) {
        return `${ROOT}${Local.themes}/${name}/${Local.themeStyle}`;
    },


    /**
     * 获取内容样式文件URL。
     * @param  {String} 内容样式名
     * @return {String}
     */
    mainURL: function( name ) {
        return `${ROOT}${Local.styles}/${name}/${Local.mainStyle}`;
    },


    /**
     * 获取代码样式文件URL。
     * @param  {String} name 代码样式名
     * @return {String}
     */
    codesURL: function( name ) {
        return `${ROOT}${Local.styles}/${name}/${Local.codeStyle}`;
    },


    //-- By ------------------------------------------------------------------


    /**
     * 设置样式。
     * 包括主题、内容和代码风格的样式。
     * @data: String 样式文件URL
     * @param {String} name 风格名
     */
    style( evo, name ) {
        __editor[ name ]( evo.data );
    },

    __style: 1,

};


//
// 导入Tpb支持。
// 自动从<body>开始OBT构建。
//
Tpb.init( On, By )
    .build( document.body )
    .then( tr => window.console.info('build done!', tr) );



//
// On/By 扩展
//////////////////////////////////////////////////////////////////////////////


// 简单取值
customGetter( On, null, Kit, [
    'themeURL',
    'mainURL',
    'codesURL',
]);


// 简单设置。
processExtend( By, 'Kit', Kit, [
    'style',
]);



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 保存编辑器实例。
 * @param  {Editor} ed 编辑器实例
 * @return {Editor} ed
 */
export const saveEditor = ed => ( __editor = ed );


//:debug
window.On = On;
window.By = By;