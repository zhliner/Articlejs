//! $Id: api.js 2020.03.08 Articlejs.Base $
// ++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
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

const Api = {
    /**
     * 初始数据设置。
     * 根元素：{
     *      outline,    大纲元素根（<aside>）
     *      editor,     编辑器容器根（<div>）
     *      help,       帮助面板根（<aside>）
     *      beeptip,    提示音元素（<audio>）
     * }
     * @param  {Object} roots 根元素集
     * @return {this}
     */
    init( roots ) {
        //
        return Api;
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

export default { Api };
