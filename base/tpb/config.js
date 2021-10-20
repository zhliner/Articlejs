//! $ID: config.js 2019.09.28 Tpb.Config $
// +++++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Tpb 框架全局配置。
//
///////////////////////////////////////////////////////////////////////////////
//

import { Loader } from "./tools/tloader.js";


//
// 用户配置。
//////////////////////////////////////////////////////////////////////////////

const
    DEBUG = true,

    Web = {
        // URL根
        // 如果是子路径，必须包含末尾斜线（/）。
        base:   'http://localhost:8080/',


        // 模板根目录
        // 相对于base
        tpldir: 'templates',

        // 模板映射集配置
        // 相对于模板根目录（tpldir）。
        tplmap: `maps.json`,

        // 拉取数据根目录
        // 注：相对于base
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
    };



//
// 共享配置：请勿修改。
//////////////////////////////////////////////////////////////////////////////


const
    // 指令属性：自动取栈数量
    EXTENT = Symbol( 'stack: want-items' ),

    // 指令属性：需操作数据栈（特权）
    ACCESS = Symbol( 'stack: accessible' ),

    // jump指令标记。
    // 用于指令解析时判断赋值原始next。
    JUMPCELL = Symbol( 'jump Cell' ),

    // 设置前阶指令标记。
    // 主要用于To.Next:lone指令。
    PREVCELL = Symbol( 'set prev Cell'),

    // 调用链头实例标记。
    HEADCELL = Symbol( 'first-cell' ),

    // 全局变量空间。
    Globals = new Map(),

    // 关联数据空间。
    // Element: Map{ String: Value }
    DataStore = new WeakMap(),

    // 预定义调用链存储。
    // 与元素关联，便于分组管理，同时支持空事件名通配。
    // { Element: Map{evn:String: Chain} }
    ChainStore = new WeakMap(),

    // 通用载入器。
    XLoader = new Loader( Web.base ),

    // 模板节点共享存储。
    // 供第三方模板引用并存储（new Templater(...)）。
    // { name:String: Element }
    TplPool = new Map();



//
// 全局模板存储。
//
let Templates = null;


/**
 * 设置全局模板管理器。
 * @param  {Templater} tplr 模板管理器
 * @return {Templater} tplr
 */
const tplInit = tplr => Templates = tplr;



//
// 导出。
///////////////////////////////////////////////////////////////////////////////


export {
    DEBUG,
    Web,
    OBTA,
    EXTENT,
    ACCESS,
    JUMPCELL,
    PREVCELL,
    HEADCELL,
    Globals,
    DataStore,
    ChainStore,
    XLoader,
    TplPool,
    Templates,
    tplInit,
};


//
// 供统一引用。
//
export default window.$;
