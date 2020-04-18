// $Id: templater.x.js 2020.03.10 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器（占位）。
//
//  用于不支持模板时，相关调用返回兼容的值。
//  注：
//  即便没有模板支持，也可以进行渲染支持（页面既有元素）。
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
     * 获取模板节点（副本）。
     * @return {Promise} 承诺对象
     */
    get() {
        return Promise.resolve();
    }


    /**
     * 获取模板节点（原始）。
     * @return {Promise} 承诺对象
     */
    tpl() {
        return Promise.resolve();
    }


    /**
     * 模板构建。
     * @param  {Element|DocumentFragment|Object} root 构建根
     * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
     * @return {Promise}
     */
    build( root, obts = true) {
        this._obter( root, obts );
        // 可渲染支持。
        if (root.nodeType) Render.parse( root );

        return Promise.resolve();
    }


    /**
     * 克隆模板节点。
     * @param  {Element} 源模板节点
     * @return {Element}
     */
    clone( tpl ) {
        return Render.clone(
            tpl,
            $.clone(tpl, true, true, true)
        );
    }

}


export { Templater };
