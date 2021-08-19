//! $ID: api.js 2020.03.08 Articlejs.Base $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  编辑器基本Api定义/实现。
//
//  1.
//  包含几个普通用户接口（如标题获取/设置、内容获取/设置等）。
//
//  2.
//  包含编辑器一些主要元件的根元素获取，用于插件开发的基础定位。
//  编辑器的DOM结构基本稳定，内容的元素结构也有规范，因此可以稳定地定位各子目标。
//
//
///////////////////////////////////////////////////////////////////////////////
//

// 模板管理器实例。
import { Templater } from "./tpb/config.js";


const $ = window.$;


// 根元素存储。
// {
//      outline,    大纲元素根（<aside>）
//      editor,     编辑器容器根（<div>）
//      help,       帮助面板根（<aside>）
//      beeptip,    提示音元素（<audio>）
// }
let __ROOTS = null;


const Api = {
    /**
     * 初始数据设置。
     * @param  {Object} roots 根元素集
     * @return {this}
     */
    init( roots ) {
        __ROOTS = roots;
        return this;
    },


    /**
     * 获取根元素。
     * name {
     *      outline, editor, help, beeptip
     * }
     * @param  {String} name 标识名
     * @return {Element}
     */
    root( name ) {
        return __ROOTS[name] || null;
    },


    /**
     * 获取特定面板元素。
     * 限于编辑器本身（不含侧面板）。
     * name: {
     *      tools   工具栏
     *      slave   功能区
     *      status  状态栏
     *      content 内容区
     * }
     * @param  {String} name 面板名
     * @return {Promise<Element>}
     */
    panel( name ) {
        if ( name == 'content' ) {
            return Promise.resolve( $.get('#content') );
        }
        return Templater.get( `main:${name}` );
    },


    /**
     * 获取弹出菜单。
     * name: selection|context
     * @param  {String} name 菜单名
     * @return {Promise<Element>|null}
     */
    menu( name ) {
        switch (name) {
            case 'selection':
                return Templater.get( 'menu:cells' );
            case 'context':
                return Templater.get( 'menu:cmenu' );
        }
        return null;
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
        //
    },


    style( name, isurl ) {
        //
    },

};


// expose
/////////////////////////////////////////////////

export default Api;
