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
// 	loader.init(...);
//
// 	const tpl = new Templater( loader.load.bind(loader), ... );
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { tplRoot, tplsMap, DEBUG } from "../globals.js";


const $ = window.$;


class TplLoader {
	/**
     * @param {String} 载入根路径
	 */
	constructor( dir ) {
        this._root = dir;

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
		return fetch( fmap )
			.then( resp => resp.json() )
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
	 * @return {Promise} 承诺对象
	 */
	load( name ) {
		let _file = this.file(name);

		if ( !_file ) {
			return Promise.reject( `[${name}] not in any file.` );
		}
		if ( !this._pool.has(_file) ) {
			if ( DEBUG ) {
				window.console.log( `[${_file}] loading for [${name}]` );
			}
			this._pool.set( _file, this._load(_file) );
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
	 * @param {Object} conf 映射配置
	 */
	tplMap( conf ) {
		Object.entries(conf).forEach(
			(file, names) => names.forEach( name => this.file(name, file) )
		);
	}


	//-- 私有辅助 -----------------------------------------------------------------


	/**
	 * 载入节点所属模板文件。
	 * @param  {String} file 模板文件名
	 * @return {Promise} 承诺对象
	 */
	_load( file ) {
        return fetch( this._root + '/' + file )
			.then( resp => resp.ok ? resp.text() : Promise.reject(resp.statusText) )
			.then( html => $.create(html) )
			.catch( e => window.console.error(e) );
	}

}


//
// 导出
///////////////////////////////////////////////////////////////////////////////

const loader = new TplLoader( tplRoot );

// 前提保证。
loader.init( tplsMap ).catch( err => { throw err } );


export const tplLoad = loader.load.bind(loader);
