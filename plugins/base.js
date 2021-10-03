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
import { XLoader, TLoader, Templater } from "../base/tpb/config.js";


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
 * 导入并解析模板节点。
 * - 导入模板节点清单文件并配置全局载入器。
 * - 导入主模板文件并构建解析。
 * 返回节点名数组承诺。
 * @param  {String} path 目标插件根（全路径）
 * @return {Promise<[String]|null>}
 */
function plugTpls( path ) {
    let _maps = `${path}${Setup.plugMaps}`,
        _file = `${path}${Setup.plugTpl}`;

    return TLoader.config( _maps )
        .then( maps => [...maps.keys()] )
        // 未配置时不会执行下面的.then
        .then( tpls => [XLoader.node(_file), tpls] )
        // 无模板或未配置，静默通过。
        .catch( () => null )
        .then( vv => vv && Templater.build(vv[0], Setup.plugTpl).then(() => vv[1]) );
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
    let _dir = `${Setup.root}${Setup.plugDir}/${name}/`,
        _img = $.Element( 'img', {src: `${_dir}${Setup.plugLogo}`} ),
        _btn = $.wrap( _img, $.Element('button', {title: tips}) );

    return plugTpls( _dir ).then( ns => __Pool.set(name, { button:_btn, tpls:ns }) && __btnPool.set(_btn, name) && _btn );
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
        _conf.tpls && _conf.tpls.forEach( name => Templater.del(name) );
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
    return list.reduce( (buf, vv) => pluginsInsert(vv[0], vv[1]).then(el => buf.push(el) && buf), [] );
}


/**
 * 获取插件名。
 * @param  {Element} btn 插件按钮
 * @return {String} 插件名
 */
export function pluginsName( btn ) {
    return __btnPool.get( btn ) || null;
}
