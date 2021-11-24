//! $ID: api.js 2021.10.21 Cooljed.Base $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  编辑器基础Api定义集。
//  主要包含内容区各条目的提取/设置、大纲列表内容和帮助侧栏等部分。
//
//  注意：
//  如果对内容区执行了设置操作，会清空编辑历史栈。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Local } from "../config.js";
import { resetState } from "./edit.js";


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
     * 获取/设置主标题。
     * 仅指标题内容，不含标题元素（<h1>）自身。
     * @param  {String} cons 标题源码
     * @return {String|void}
     */
    heading( cons ) {
        //
    },


    /**
     * 获取/设置副标题。
     * 仅指标题内容，不含副标题元素（<h3>）自身。
     * @param  {String|[String]} cons 副标题源码（组）
     * @return {[String]|void}
     */
    subtitle( cons ) {
        //
    },


    /**
     * 获取/设置文章提要。
     * 返回值是一个两成员数组，其中：
     * [0] 提要名称源码。
     * [1] 内容源码（顶层outerHTML）。
     * @param  {String} h3 提要名称
     * @param  {String} cons 内容源码（顶层outerHTML）
     * @return {[String]|void}
     */
    abstract( h3, cons ) {
        //
    },


    /**
     * 获取/设置文章主区内容。
     * 不含封装内容的<article>容器元素自身。
     * @param  {String} cons 内容源码
     * @return {String|void}
     */
    article( cons ) {
        //
    },


    /**
     * 获取/设置另见条目集。
     * @param  {[String]} cons 内容源码集
     * @return {[String]|void}
     */
    seealso( cons ) {
        //
    },


    /**
     * 获取/设置参考条目集。
     * @param  {[String]} cons 内容源码集
     * @return {[String]|void}
     */
    reference( cons ) {
        //
    },


    /**
     * 获取全部内容
     * 包括主/副标题、提要、文章主体（<article>）和另见/参考等。
     * 为各部分的outerHTML源码本身。
     * 注意：
     * 此处不再强约束，内容应当符合文章结构规范。
     * @param  {String} html 全部内容源码
     * @return {String|void}
     */
    content( html ) {
        //
    },


    theme( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Local.themes}/${name}/${Local.themeFile}`
    },


    style( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Local.styles}/${name}/${Local.styleFile}`
    },


    codes( name, isurl ) {
        if ( name === undefined ) {
            //
        }
        // isurl ? name : `${this._path}/${Local.styles}/${name}/${Local.styleCode}`
    },

};


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


// expose
//////////////////////////////////////////////////////////////////////////////

export default Api;
