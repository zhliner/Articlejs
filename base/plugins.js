//! $ID: plugins.js 2021.09.23 Cooljed.Plugins $
// +++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件基础实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Tpb, obtBuilder, BaseOn, BaseBy } from "./tpb/tpb.esm.js";
import { Templater } from "./tpb/tools/templater.js";

import { ROOT, Local } from "../config.js";
import { Loader, TplLoader } from "./tpb/tools/tloader.js";


const
    // 插件专用On定义集
    // 用于所有插件，可能在外部被扩展。
    PlugOn = Object.create( BaseOn ),

    // 插件专用By定义集
    // （说明同上）
    PlugBy = Object.create( BaseBy ),

    // OBT构建器
    // 针对插件On/By定义集。
    __obter = obtBuilder( PlugOn, PlugBy ),

    // 通用载入器。
    __loader = new Loader( ROOT ),

    // 插件按钮缓存
    // 在按名称卸载插件时有用。
    // { name => button:Element }
    __Pool = new Map(),

    // 插件名记忆
    // 在单击按钮执行插件时有用。
    // {Element => name:String}
    __btnPool = new WeakMap();



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 载入插件配置。
 * 在插件安装时调用。
 * @param  {String} dir 插件目录（相对于安装根）
 * @param  {String} file 配置文件名
 * @return {Promise<Templater>}
 */
function plugConf( dir, file ) {
    return __loader
        .json( `${dir}/${file}` )
        .then( obj => plugStyle(dir, obj) )
        .then( obj => plugTpls(dir, obj) );
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
        return $.style( {href: `${ROOT}${dir}/${conf.style}`} ).then( () => conf );
    }
    return conf;
}


/**
 * 导入并解析模板节点。
 * - 导入模板节点清单文件配置。
 * - 导入主模板文件并执行系列（子模版）解析构建。
 * 返回模板管理器实例，以便于插件的卸载。
 * @param  {String} dir 插件目录
 * @param  {Object} conf 插件配置对象
 * @return {Promise<Templater>|null}
 */
function plugTpls( dir, conf ) {
    if ( !conf.maps ) {
        return null;
    }
    let _tplr = new Templater( __obter, new TplLoader(dir, __loader) );

    return _tplr.config( conf.maps )
        .then( () => __loader.node(`${dir}/${conf.node}`) )
        .then( frg => _tplr.build(frg, conf.node) );
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
        return Promise.resolve( null );
    }
    let _dir = `${Local.plugRoot}/${name}`,
        _img = $.Element( 'img', { src: `${ROOT}${_dir}/${Local.plugLogo}` } ),
        _btn = $.wrap( _img, $.Element('button', {title: tips}) );

    return plugConf( _dir, Local.plugConf )
        .then( tr => __Pool.set(name, _btn) && Tpb.templater(name, tr) || __btnPool.set(_btn, name) && _btn );
}


/**
 * 移除插件。
 * 同时会清除插件导入的模板节点（全局缓存中）。
 * 如果目标插件不存在，返回null。
 * 返回按钮以用于UI中移除。
 * @param  {String} name 插件名
 * @return {Element|null} 插件按钮
 */
export function pluginsDelete( name ) {
    let _btn = __Pool.get( name );

    if ( _btn ) {
        __Pool.delete( name );
        Tpb.templater( name, null );
    }
    return _btn || null;
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
