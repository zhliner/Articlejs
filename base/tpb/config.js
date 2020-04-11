//! $Id: config.js 2019.09.28 Tpb.Config $
// ++++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Tpb 框架全局配置。
//
///////////////////////////////////////////////////////////////////////////////
//

import { HotKey } from "./libs/hotkey.js";
import { Loader, TplLoader } from "./libs/tloader.js";


//
// 用户配置。
//////////////////////////////////////////////////////////////////////////////

const
    DEBUG = true,

    Web = {
        // URL根
        base:   'http://localhost:8080/',

        //---------------------
        // 子路径（相对于base）
        //---------------------

        // 模板根目录
        tpldir: 'templates',

        // 模板映射集文件
        // 格式：{文件: [节点]}
        tplmap: 'templates/maps.json',

        // OBT独立定义存放目录
        // 即 obt-src 根
        obtdir: 'templates/obts',

        // x.pull根目录
        pulls:  'xdata',
    };



//
// 系统配置：谨慎修改。
//////////////////////////////////////////////////////////////////////////////

const
    // OBT属性名定义
    OBTA = {
        on:     'on',
        by:     'by',
        to:     'to',
        src:    'obt-src',
    },

    // 渲染标识属性。
    // 用于高效检索渲染元素（如配置克隆）。
    // 注：这一属性名会保留在DOM元素上。
    HasRender   = '_';



//
// 共享配置：请勿修改。
//////////////////////////////////////////////////////////////////////////////


const
    $ = window.$,

    // 指令属性：自动取栈数量
    EXTENT = Symbol('stack: want-items'),

    // 指令属性：特权方法（操作数据栈）
    ACCESS = Symbol('stack: accessible'),

    // PBS方法获取接口键。
    // 使用Symbol避免名称冲突。
    method = Symbol('api-method'),

    // 前阶指令存储标记。
    PREVCELL = Symbol('previous Cell'),

    // 全局变量空间。
    Globals = new Map(),

    // 关联数据空间。
    // Element: Map{ String: Value }
    DataStore = new WeakMap(),

    // 预定义调用链存储。
    // 与元素关联，便于分组管理，同时支持空事件名通配。
    // { Element: Map{evn:String: Chain} }
    ChainStore = new WeakMap(),

    // 快捷键处理器。
    Hotkey = new HotKey(),

    // 通用载入器。
    XLoader = new Loader( Web.base ),

    // 模板载入器。
    TLoader = new TplLoader( Web.tpldir, XLoader);



//
// 全局模板存储。
//
let Templater = null;



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取绑定的（bound）方法。
 * - 处理取栈条目数（[EXTENT]），由前置两个下划线的属性表达。
 * - 处理特权设置（[ACCESS]），由前置两个下划线和_x结尾的属性表达。
 * 注记：
 * 创建已绑定的全局方法共享，节省内存。
 *
 * @param  {Function} f 方法
 * @param  {String} k 方法名
 * @param  {Object} obj 宿主对象
 * @return {[Function,]} 值/键对（键忽略）
 */
 function bindMethod( f, k, obj ) {
    if ( !$.isFunction(f) ) {
        return null;
    }
    if ( !f.name.startsWith('bound ') ) {
        f = f.bind( obj );
    }
    return [ funcSets(f, obj[`__${k}`], obj[`__${k}_x`]) ];
}


/**
 * 指令/方法属性设置：{
 *  - [ACCESS] 是否为特权方法。
 *  - [EXTENT] 自动取栈条目数。
 * }
 * @param  {Function} f 目标指令
 * @param  {Number} n 自动取栈数量
 * @param  {Boolean} ix 是否为特权指令
 * @return {Function}
 */
function funcSets( f, n, ix ) {
    if ( ix ) f[ACCESS] = true;
    return ( f[EXTENT] = n, f );
}


/**
 * 存储调用链。
 * 如果存在相同事件名，后者会覆盖前者。
 * 只有chain非假时才会存储，但空操作可以创建存储集。
 * @param  {Element} el 存储元素（定义所在）
 * @param  {String} evnid 事件名标识
 * @param  {EventListener} chain 调用链
 * @return {Map|Boolean} 存储集
 */
 function storeChain( el, evnid, chain ) {
    let _map = ChainStore.get(el);

    if ( !_map ) {
        _map = new Map();
        ChainStore.set( el, _map );
    }
    return chain && _map.set( evnid, chain );
}


/**
 * 设置模板管理器（全局可用）。
 * @param  {Templater} tplr 模板管理器
 * @return {Templater} tplr
*/
const InitTpl = tplr => Templater = tplr;



//
// 导出。
///////////////////////////////////////////////////////////////////////////////

export {
    DEBUG,
    Web,
    HasRender,
    OBTA,
    EXTENT,
    ACCESS,
    method,
    PREVCELL,
    bindMethod,
    funcSets,
    Globals,
    DataStore,
    ChainStore,
    Hotkey,
    XLoader,
    TLoader,
    storeChain,
    Templater,
    InitTpl,
};
