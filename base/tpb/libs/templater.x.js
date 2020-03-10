// $Id: templater.x.js 2019.09.02 Tpb.Kits $
// ++++++++++++++++++++++++++++++++++++++++++
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
        return Promise.resolve(null);
    }


    /**
     * 获取模板节点（原始）。
     * @return {Promise} 承诺对象
     */
    tpl() {
        return Promise.resolve(null);
    }


    /**
     * 模板构建。
     * 如果已经开始构建，返回子模版的承诺对象。
     * 注：
     * - 需要处理OBT的解析/绑定逻辑。
     * - 存储构建好的模板节点备用。
     * - 可能需要多次异步载入（tpl-node）。
     * - 如果root不是文档/元素类型，返回undefined。
     * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
     * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
     * @return {Promise|void}
     */
    build( root, obts = true) {
        this._obter( root, obts );
        // 可渲染支持。
        if (root.nodeType) Render.parse( root );

        return Promise.resolve(null);
    }


    /**
     * 克隆模板节点。
     * @param  {Element} 源模板节点
     * @return {Element}
     */
    clone( tpl ) {
        return Render.clone(
            $.clone(tpl, true, true, true), tpl
        );
    }

}


export { Templater };
