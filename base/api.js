//! $ID: api.js 2020.03.08 Articlejs.Base $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  编辑器开发Api定义&实现。
//  主要包含内容区各种内容条目的引用提取、大纲列表内容和帮助侧栏部分。
//
//  Api不应当修改编辑器本身（及其功能），主要用于插件开发。
//
//  注记：
//  内容区内容单元结构规范，因此可以为Api提供稳定的目标定位。
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 根元素集：{
//      outline,    大纲元素根（<aside>）
//      editor,     编辑器容器根（<div>）
//      help,       帮助面板根（<aside>）
//      beeptip,    提示音元素（<audio>）
// }
//
let __ROOTS = null;


const Api = {
    /**
     * 初始数据设置。
     * @param  {Object} roots 根元素集
     * @return {this}
     */
    init( roots ) {
        __ROOTS = roots;
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
