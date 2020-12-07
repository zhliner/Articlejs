// $Id: tloader.js 2019.09.02 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Loader 远端数据载入器
//  --------------------
//  实现 Promise<...> 数据的临时缓存，避免短时间内的重复请求。
//  如果全部载入完毕，可以调用.clear()清空缓存。或者在新的请求阶段前clear。
//
//
//  TplLoader 模板节点载入器
//  -----------------------
//  载入模板根目录下的模板文件。
//  用于 Tpb:Templater 中即时载入尚未缓存的模板节点。
//
//
//  用法：
//  let loader = new TplLoader(...);
//  const tpl = new Templater( ..., loader.load.bind(loader) );
//
//  注：
//  可以实时添加新的映射（.config(...)），使得模板节点的自动载入持续有效。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { DEBUG } from "../config.js";


const $ = window.$;


export class Loader {
    /**
     * 如果存在子路径，末尾应当包含/
     * @param {String} base Web路径跟
     */
    constructor( base ) {
        // URL请求根
        this._base = base;

        // 已载入暂存。
        // 避免短时间内的重复请求。
        // {file: Promise}
        this._pool = new Map();
    }


    /**
     * 载入JSON文件。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<json>}
     */
    json( file ) {
        return this._load( this._url(file), 'json' );
    }


    /**
     * 载入普通文件。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<String>}
     */
    text( file ) {
        return this._load( this._url(file), 'text' );
    }


    /**
     * 载入HTML源码并构造为文档片段。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<DocumentFragment>}
     */
    node( file ) {
        return this._load( this._url(file), 'node' );
    }


    /**
     * 获取Blob数据。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<String>}
     */
    blob( file ) {
        return this._load( this._url(file), 'blob' );
    }


    /**
     * 获取formData数据。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<fromData>}
     */
    formData( file ) {
        return this._load( this._url(file), 'formData' );
    }


    /**
     * 获取arrayBuffer数据。
     * @param  {String|URL} file 文件名/URL
     * @return {Promise<fromData>}
     */
    arrayBuffer( file ) {
        return this._load( this._url(file), 'arrayBuffer' );
    }


    /**
     * 获取URL根。
     * @return {String}
     */
    base() {
        return new URL('', this._base).href;
    }


    /**
     * 清空文件承诺池。
     * 此承诺池主要为避免短时间内的重复请求，
     * 如果数据已经完全获取，可以清空以节省内存。
     */
    clear() {
        return this._pool.clear(), this;
    }


    // -- 私有辅助 ---------------------------------------------------------------


    /**
     * 获取文件URL（全）。
     * @param {String|URL} file 文件名/URL
     */
    _url( file ) {
        return typeof file == 'string' ? new URL( file, this._base ) : file;
    }


    /**
     * 载入目标数据。
     * type: "json|text|formData|blob|arrayBuffer|node"
     * @param  {URL} url 目标URL
     * @param  {String} type 载入类型
     * @return {Promise<...>}
     */
    _load( url, type ) {
        let _pro = this._pool.get(url.href);

        if ( !_pro ) {
            if ( DEBUG ) {
                window.console.log( `loading for "${url}"` );
            }
            _pro = this._fetch( url, type );

            this._pool.set( url.href, _pro );
        }
        return _pro;
    }


    /**
     * 拉取目标数据。
     * @param  {URL} url 目标URL
     * @param  {String} type 载入类型
     * @param  {Boolean} node 是否构造节点
     * @return {Promise<...>}
     */
    _fetch( url, type, node = false ) {
        if ( type == 'node' ) {
            node = true;
            type = 'text';
        }
        let _pro = fetch(url).then(
                resp => resp.ok ? resp[type]() : Promise.reject(resp.statusText)
            );
        return node ? _pro.then( html => $.fragment(html) ) : _pro;
    }

}


export class TplLoader {
    /**
     * @param {String} dir 模板根目录
     * @param {Loader} loader URL载入器
     */
    constructor( dir, loader ) {
        this._loader = loader;

        if ( !dir.endsWith('/') ) {
            dir += '/';
        }
        this._path = loader.base() + dir;

        // 节点名:文件名映射。
        // { tpl-name: file }
        this._tmap = Object.create(null);
    }


    /**
     * 模板节点映射集配置。
     * 映射文件名可以是字符串，相对于URL根。
     * 也可以是URL实例，此时为全路径。
     * 可以传递一个现成的配置对象，格式：{file: [tpl-name]}
     * @param  {String|URL|Object} maps 映射文件或配置对象
     * @return {Promise<map>}
     */
    config( maps ) {
        if ( !maps ) {
            return Promise.resolve();
        }
        if ( $.type(maps) == 'Object' ) {
            return Promise.resolve( this._config(maps) );
        }
        return this._loader.json(maps).then( cfg => this._config(cfg) );
    }


    /**
     * 载入节点（组）。
     * 如果已经载入，返回缓存的承诺对象。
     * 注记：
     * 由后续在单线程中处理重复解析的问题。
     * @param  {String} name 节点名称
     * @return {Promise<DocumentFragment>} 承诺对象
     */
    load( name ) {
        let _file = this._file(name);

        if ( !_file ) {
            return Promise.reject( `[${name}] not in any file.` );
        }
        if ( DEBUG ) {
            // window.console.log( `get [${name}] template-node.` );
        }
        return this._loader.node( this._url(_file) );
    }


    // -- 私有辅助 ---------------------------------------------------------------


    /**
     * 获取文件URL（全）。
     * @param {String|URL} file 文件名/URL
     */
    _url( file ) {
        return typeof file == 'string' ? new URL( file, this._path ) : file;
    }


    /**
     * 设置/提取节点所属文件名。
     * @param  {String} name 节点名
     * @param  {String} file 节点所在文件名
     * @return {String} 文件名
     */
    _file(name, file) {
        if (file === undefined) {
            return this._tmap[name] || null;
        }
        this._tmap[name] = file;
    }


    /**
     * 设置节点/文件映射配置。
     * map: {文件名: [节点名]}
     * 转换为：{节点名: 文件名}
     * @param  {Object} map 映射配置
     * @return {Map} 节点/文件映射集
     */
    _config( map ) {
        for ( const [file, names] of Object.entries(map) ) {
            names
            .forEach( name => this._file(name, file) );
        }
        return this._tmap;
    }
}
