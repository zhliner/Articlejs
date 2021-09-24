//! $ID: config.js 2021.09.23 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件默认配置
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Setup } from "../config.js";


const
    $ = window.$,

    // 插件缓存集
    // {name: Element}
    __Pool = new Map(),

    // 插件配置集
    // {Element: String}
    __btnPool = new WeakMap();



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 插入插件。
 * 外部应当保证插件（目录）已经存在。
 * 如果插件已经安装，则返回null。
 * @param  {String} name 插件名
 * @param  {String} tips 按钮提示（title），可选
 * @return {Element|null} 插件按钮（<button/img>）
 */
export function pluginsInsert( name, tips = null ) {
    if ( __Pool.has(name) ) {
        return null;
    }
    let _img = $.Element(
            'img',
            { src: `${Setup.root}${Setup.plugdir}/${name}/logo.png` }
        ),
        _btn = $.wrap( _img, $.Element('button', {title: tips}) );

    __Pool.set( name, _btn );
    __btnPool.set( _btn, name );

    return _btn;
}


/**
 * 移除插件。
 * 如果目标插件不存在，返回null。
 * @param  {String} name 插件名
 * @return {Element|null} 插件按钮
 */
export function pluginsDelete( name ) {
    let _el = __Pool.get( name );

    if ( _el ) {
        __Pool.delete( name );
        __btnPool.delete( _el );
    }
    return _el || null;
}


/**
 * 插件执行。
 * @param  {Element} btn 插件按钮
 * @return {Promise<Object>}
 */
export function pluginsRun( btn ) {
    let _name = __btnPool.get( btn );
    //
}


/**
 * 插件集初始化。
 * @param  {[Array2]} 插件清单
 * @return {[Element]} 插件按钮集
 */
export function pluginsInit( list ) {
    return $.map( list, vv => pluginsInsert(vv[0], vv[1]) );
}