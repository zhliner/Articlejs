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

    // 可用插件清单
    // [目录, 提示]
    __List = [
        [ 'example',    '示例插件' ],
    ],

    // 插件缓存集
    // {name: Element}
    __Pool = new Map();



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
        { src: `${Setup.root}${Setup.plugins}/${name}/logo.png` }
    );
    return $.wrap( _img, $.Element('button', {title: tips}) );
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
    }
    return _el || null;
}


/**
 * 插件集初始化。
 * @return {[Element]} 插件按钮集
 */
export function pluginsInit() {
    return $.map( __List, vv => pluginsInsert(vv[0], vv[1]) );
}