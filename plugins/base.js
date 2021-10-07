//! $ID: base.js 2021.09.23 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件基础实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Setup } from "../config.js";
import Tpb from "../base/tpb/tpb.js";
import { XLoader, Templates, TplPool } from "../base/tpb/config.js";
import { TplLoader } from "../base/tpb/tools/tloader.js";
import { Templater } from "../base/tpb/tools/templater.js";


const
    $ = window.$,

    // 插件配置缓存
    // {name: {button:Element, tpls:[String]}}
    __Pool = new Map(),

    // 插件名记忆
    // {Element: String}
    __btnPool = new WeakMap();



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 载入插件配置。
 * @param  {String} dir 插件目录（相对于安装根）
 * @param  {String} file 配置文件名
 * @return {Promise<>}
 */
function plugConf( dir, file ) {
    return XLoader.json( `${dir}/${file}` )
        .then( obj => plugStyle(dir, obj) )
        .then( obj => plugTpls(dir, obj) )
}


/**
 * 载入插件样式。
 * 原样返回配置对象以便于下一步的模板解析。
 * @param  {String} dir 插件目录
 * @param  {Object} conf 插件配置对象
 * @return {Promise<Object>}
 */
function plugStyle( dir, conf ) {
    if ( conf.style ) {
        return $.style( {href: `${dir}/${conf.style}`} ).then( () => conf );
    }
    return conf;
}


/**
 * 导入并解析模板节点。
 * - 导入模板节点清单文件配置。
 * - 导入主模板文件并执行系列（子模版）解析构建。
 * 返回节点名数组以记录插件的模板安装。
 * @param  {String} dir 插件目录
 * @param  {Object} conf 插件配置对象
 * @return {Promise<[String]>|null}
 */
function plugTpls( dir, conf ) {
    if ( !conf.maps ) return null;

    let _load = new TplLoader( dir, XLoader ),
        _Tpls = new Templater( _load, Tpb.buildNode, TplPool );

    return _load.config( conf.maps )
        .then( maps => [...maps.keys()] )
        .then( names => XLoader.node(`${dir}/${conf.node}`).then(frg => [frg, names]) )
        .then( vv => vv && _Tpls.build(vv[0], conf.node).then(() => vv[1]) );
}



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 插件安装。
 * 会导入模板配置和模板，并自动构建模板的OBT逻辑。
 * 如果插件已经安装，则返回null。
 * 注意：
 * 外部应当保证插件（目录）已经存在。
 * @param  {String} name 插件名
 * @param  {String} tips 按钮提示（title），可选
 * @return {Promise<Element|null>} 插件按钮（<button/img>）
 */
export function pluginsInsert( name, tips = null ) {
    if ( __Pool.has(name) ) {
        return Promise.resolve(null);
    }
    let _dir = `${Setup.plugDir}/${name}`,
        _img = $.Element('img', { src: `${Setup.root}${_dir}/${Setup.plugLogo}`} ),
        _btn = $.wrap( _img, $.Element('button', {title: tips}) );

    return plugConf( _dir, Setup.plugConf ).then( ns => __Pool.set(name, { button:_btn, tpls:ns }) && __btnPool.set(_btn, name) && _btn );
}


/**
 * 移除插件。
 * 同时会清除插件导入的模板节点（全局缓存器内）。
 * 如果目标插件不存在，返回null。
 * @param  {String} name 插件名
 * @return {Element|null} 插件按钮
 */
export function pluginsDelete( name ) {
    let _conf = __Pool.get( name );

    if ( _conf ) {
        __Pool.delete( name );
        __btnPool.delete( _conf.button );
        _conf.tpls && _conf.tpls.forEach( name => Templates.del(name) );
    }
    return _conf ? _conf.button : null;
}


/**
 * 插件集初始化。
 * @param  {[Array2]} 插件清单
 * @return {Promise<[Element]>} 插件按钮集
 */
export function pluginsInit( list ) {
    // 注意：
    // 需要提前导入插件所需的OBT扩展。
    // null成员添加到数组中无害（会被$.append自动滤除）。
    return list.reduce(
        (bp, vv) => bp.then( buf => pluginsInsert(vv[0], vv[1]).then(el => buf.push(el) && buf) ),
        Promise.resolve( [] )
    );
}


/**
 * 获取插件名。
 * @param  {Element} btn 插件按钮
 * @return {String} 插件名
 */
export function pluginsName( btn ) {
    return __btnPool.get( btn ) || null;
}
