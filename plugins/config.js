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
import { processExtend } from "../base/tpb/pbs.by.js";


const
    $ = window.$,

    // 插件图标文件名
    __logo = 'logo.png',

    // 插件主文件名
    __file = 'main.js',

    // 插件缓存集
    // {name: Element}
    __Pool = new Map(),

    // 插件配置集
    // {Element: String}
    __btnPool = new WeakMap();



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 插件文件导入（执行）。
 * 将插件的执行封装在一个Worker中（沙盒）。
 * 插件内需要通过 postMessage 向外部递送数据或请求。
 * 数据属性的含义：{
 *      result:Value    插件运行的结果数据
 *      error:String    错误信息
 *      load:String     导入的模板名
 *      build:Boolean   模板是否即时构建（默认true）
 * }
 * 注记：
 * 插件按钮实际上只是一个入口，之后如果需要DOM交互，只能由模板实现。
 * 模板中的OBT格式简单且固定，因此便于安全性审核。
 * @param  {String} url 主文件路径
 * @param  {Object} info 系统全局信息
 * @return {Promise<Object>}
 */
function plugLoad( url, info ) {
    let _wk = new Worker( url );

    return new Promise( (resolve, reject) => {
        _wk.onmessage = ev => {
            ev.data.error ? reject( ev.data.error) : resolve( ev.data );
        }
        _wk.postMessage( info || {} );
    });
}


/**
 * 插件结果处理。
 * - 插件需要申请模板来显示结果或UI交互。
 * - 结果对象中的.result会用于模板渲染的源数据。
 * obj: {
 *      result, load, build
 * }
 * @param  {Object} obj 结果数据对象
 * @return {void}
 */
function plugResult( obj ) {
    //
}


/**
 * 插件执行。
 * 在用户单击插件面板中的目标插件按钮时发生。
 * - 模态框会被自动关闭。
 * - 如果插件中请求了导入模板，则导入并构建。
 * @data: Element 插件按钮
 * @return {void}
 */
function pluginsRun( evo ) {
    let _name = __btnPool.get( evo.data );
    plugLoad( `${Setup.root}${Setup.plugdir}/${_name}/${__file}` ).then( plugResult );
}



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
            { src: `${Setup.root}${Setup.plugdir}/${name}/${__logo}` }
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
 * 插件集初始化。
 * @param  {[Array2]} 插件清单
 * @return {[Element]} 插件按钮集
 */
export function pluginsInit( list ) {
    // 插件需要的OBT扩展
    // ...
    return $.map( list, vv => pluginsInsert(vv[0], vv[1]) );
}


//
// OBT:By 扩展（模板中用）
//
processExtend( 'Kit.plugRun', pluginsRun.bind(null), 1 );
