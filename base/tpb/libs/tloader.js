// $Id: tloader.js 2019.09.02 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板文件载入器。
//
// 	用法：
//  let loader = new TplLoader(...);
// 	const tpl = new Templater( loader.load.bind(loader), ... );
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Web, DEBUG } from "../config.js";


const $ = window.$;


class TplLoader {
	/**
	 * @param {String} base Web路径跟
     * @param {String} dir 模板根目录
	 */
	constructor( base, dir ) {
		this._root = dir;
		this._path = new URL(dir, base);

        // 已载入存储 {file: Promise}
        // 多个 tpl-load 目标可能属于同一文件。
		this._pool = new Map();

		// 节点名：所在文件名映射。
		// { tpl-name: file }
		this._tmap = Object.create(null);
	}


	/**
	 * 配置初始化。
     * fmap内容: {file: [tpl-name]}
     * 文件名为相对于模板根的路径，含子目录和扩展名。
	 * @param  {String} fmap 映射配置文件（全路径）
	 * @return {Promise}
	 */
	init( fmap ) {
		if ( !fmap ) {
			return Promise.resolve();
		}
		return fetch( fmap )
			.then( resp => resp.ok && resp.json() )
			.then( json => this.tplMap(json) );
	}


	/**
	 * 接口：载入节点组。
	 * 如果已经载入，返回缓存的承诺对象。
	 * Promise:then( DocumentFragment )
	 * 注记：
	 * 由后续在单线程中处理重复解析的问题。
	 *
	 * @param  {String} name 节点名称
	 * @return {Promise<DocumentFragment>} 承诺对象
	 */
	load( name ) {
		let _file = this.file(name);

		if ( !_file ) {
			return Promise.reject( `[${name}] not in any file.` );
		}
		if ( !this._pool.has(_file) ) {
			if ( DEBUG ) {
				window.console.log( `[${name}] loading file "${this._root}/${_file}"` );
			}
			this._pool.set( _file, this.fetch(_file) );
		}
		return this._pool.get( _file );
    }


	/**
	 * 设置/提取节点所属文件名。
	 * @param  {String} name 节点名
	 * @param  {String} file 节点所在文件名
	 * @return {String} 文件名
	 */
	file( name, file ) {
		if (file === undefined) {
			return this._tmap[name] || null;
		}
		this._tmap[name] = file;
	}


	/**
	 * 设置模板 节点名：文件名 映射。
	 * 注：外部也可在运行期动态灌入配置。
	 * @param  {Object} conf 映射配置
	 * @return {Map} 节点/文件映射集
	 */
	tplMap( conf ) {
		Object.entries(conf)
		.forEach(
			([file, names]) => names.forEach( name => this.file(name, file) )
		);
		return this._tmap;
	}


	/**
	 * 载入节点所属模板文件。
	 * @param  {String} file 模板文件名
	 * @return {Promise<DocumentFragment>} 承诺对象
	 */
	fetch( file ) {
        return fetch( this._path + '/' + file )
			.then( resp => resp.ok ? resp.text() : Promise.reject(resp.statusText) )
			.then( html => $.create(html) )
			.catch( e => window.console.error(e) );
	}

}


//
// 导出
///////////////////////////////////////////////////////////////////////////////

export const TLoader = new TplLoader( Web.base, Web.tpls );
