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
//
///////////////////////////////////////////////////////////////////////////////
//


const
    $ = window.$,
    log = window.console.log;


class TplLoader {
	/**
     * @param {String} 载入根路径
	 */
	constructor( dir ) {
        this._root = dir;

        // 已载入缓存 {file: Promise}
        // 多个 tpl-load 目标可能属于同一文件。
		this._pool = new Map();

		// 节点名：所在文件名映射。
		// { tpl-name: file }
		this._fmap = Object.create(null);
	}


	/**
	 * 配置初始化。
     * fmap: {file: [tpl-name]}
     * 文件名为相对于模板根的路径，含子目录和扩展名。
	 * @param {Object} fmap
	 */
	init( fmap ) {
        Object.entries(fmap).forEach(
            (file, names) => names.forEach( name => this.file(name, file) )
        );
	}


	/**
	 * 载入节点组并提取目标节点。
	 * 如果已经载入，返回缓存的承诺对象。
	 * @param  {String} name 节点名称
	 * @return {Promise} 承诺对象
	 */
	load( name ) {
		let _file = this.file(name);

		if ( !_file ) {
			return Promise.reject(`[${name}] not in any file.`);
		}
		if ( !this._pool.has(_file) ) {
            this._pool.set(
                _file, this._load(_file)
            );
            // debug:
            log(`"${_file}" loading with [${name}]`);
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
			return this._fmap[name] || null;
		}
		this._fmap[name] = file;
	}


	//-- 私有辅助 -----------------------------------------------------------------


	/**
	 * 载入节点所属模板文件。
	 * @param  {String} file 模板文件名
	 * @return {Promise} 承诺对象
	 */
	_load( file ) {
        return fetch( this._root + '/' + file )
            .then( resp => resp.ok ? resp.text() : Promise.reject() )
            .then( html => $.create(html) );
	}

}


export { TplLoader };
