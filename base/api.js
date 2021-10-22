//! $ID: api.js 2021.10.21 Articlejs.Base $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  编辑器开发Api定义集。
//  主要包含内容区各种内容条目的引用提取、大纲列表内容和帮助侧栏部分。
//
//  注记：
//  内容区内容单元结构规范，因此可以为Api提供稳定的目标定位。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Setup } from "../config.js";


// 各主要区域根元素集
const ROOTS = {};


const Api = {
    /**
     * 初始数据设置。
     * @param  {String} outline 大纲元素根（<aside>）选择器
     * @param  {String} editor 编辑器容器根（<div>）选择器
     * @param  {String} content 编辑器内容根（<main>）选择器
     * @param  {String} help 帮助面板根（<aside>）选择器
     * @param  {String} beeptip 提示音元素（<audio>）选择器
     * @return {void}
     */
    init( outline, editor, content, help, beeptip ) {
        ROOTS.outline = $.get( outline );
        ROOTS.editor  = $.get( editor );
        ROOTS.content = $.get( content );
        ROOTS.help    = $.get( help );
        ROOTS.beeptip = $.get( beeptip );
    },


    /**
     * 获取/设置标题。
     * @param {String} html 源码
     */
    heading( html ) {
        //
    },


    subtitle( html ) {
        //
    },


    abstract( html ) {
        //
    },


    content( html ) {
        //
    },


    seealso( html ) {
        //
    },


    reference( html ) {
        //
    },


    theme( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Setup.themes}/${name}/${Setup.themeFile}`
    },


    style( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Setup.styles}/${name}/${Setup.styleFile}`
    },


    codes( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Setup.styles}/${name}/${Setup.styleCode}`
    },

};


// expose
//////////////////////////////////////////////////////////////////////////////

export default Api;
