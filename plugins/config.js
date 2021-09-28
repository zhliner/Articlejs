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

    TLoader.config( _maps )
        .then( maps => [...maps.keys()] )
        // 未配置时不会执行下面的.then
        .then( tpls => [XLoader.node(_file), tpls] )
        // 无模板或未配置，静默通过。
        .catch( () => null )
        .then( vv => vv && Templater.build(vv[0], Setup.plugTpl).then(() => vv[1]) );
}


/**
 * 插件文件导入（执行）。
 * 将插件的执行封装在一个Worker中（沙盒）。
 * 插件内需要通过 postMessage 向外部递送请求和数据。
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
 * @param  {Object} data 编辑器数据（HTML, TEXT, INFO）
 * @return {Promise<Object>}
 */
function plugLoad( url, data ) {
    let _wk = new Worker( url );

    return new Promise( (resolve, reject) => {
        _wk.onmessage = ev => {
            ev.data.error ? reject( ev.data.error) : resolve( ev.data );
        }
        _wk.postMessage( data );
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
 * @param  {Object} data 编辑器数据（HTML, TEXT, INFO）
 * @return {void}
 */
function pluginsRun( evo, data ) {
    let _name = __btnPool.get( evo.data );

    plugLoad( `${Setup.root}${Setup.plugDir}/${_name}/${Setup.plugMain}`, data ).then( plugResult );
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
 * @return {Promise<Element>|null} 插件按钮（<button/img>）
 */
export function pluginsInsert( name, tips = null ) {
    if ( __Pool.has(name) ) {
        return null;
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
 * @return {[Element]} 插件按钮集
 */
export function pluginsInit( list ) {
    // 插件需要的OBT扩展
    // ...
    return $.map( list, vv => pluginsInsert(vv[0], vv[1]) );
}


/**
 * 获取插件名。
 * @param  {Element} btn 插件按钮
 * @return {String} 插件名
 */
export function pluginsName( btn ) {
    return __btnPool.get( btn ) || null;
}
