// $ID: templater.x.js 2020.03.10 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器（占位）。
//
//  用于不支持模板时，相关调用返回兼容的值。
//  该占位模板可以执行构建（Tpb.BUild）逻辑，只是不处理模板语法（tpl-[name|node|source]）。
//
//  注记：
//  即便没有模板支持，也可以进行渲染支持（页面既有元素的渲染定义）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

// 无渲染支持。
// import { Render } from "./render.x.js";
// 有渲染支持。
import { Render } from "./render.js";


const $ = window.$;


class Templater {
    /**
     * 注：仅需obter实参。
     * @param {Function} obter OBT解析回调
     */
    constructor( obter ) {
        this._obter = obter;
    }


    /**
     * 获取模板节点（原始）。
     * @return {Promise} 承诺对象
     */
    get() {
        return Promise.resolve();
    }


    /**
     * 获取模板节点（副本）。
     * @return {Promise} 承诺对象
     */
    clone() {
        return Promise.resolve();
    }


    /**
     * 获取模板节点。
     * @return {Element|void}
     */
    node() {
        return;
    }


    /**
     * 模板构建。
     * @param  {Element|DocumentFragment|Document} root 构建根
     * @return {Promise}
     */
    build( root ) {
        this._obter( root );
        Render.parse( root );

        return Promise.resolve();
    }

}


export { Templater };
