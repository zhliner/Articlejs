//! $Id: config.js 2019.09.28 Tpb.Config $
//
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  全局配置。
//
///////////////////////////////////////////////////////////////////////////////


const
    // 测试模式
    DEBUG = true,

    // 根目录配置
    Dir = {
        // 安装根路径。
        // 注意：子级路径末尾需有/。如：http://abc.com/news/
        setup: 'http://localhost:8080',

        // 模板根目录
        // 相对于安装根路径。
        template: 'templates',

        // App.pull根目录
        // 相对于安装根路径。
        pull: 'data/pull',
    },

    // 特性支持
    Support = {
        // 模板（tpl-name|load）
        template: true,

        // 渲染（tpb-each|if...）
        render:   true,
    },

    // 模板根路径。
    tplRoot = new URL(Dir.template, Dir.setup),

    // 模板映射。
    // { 文件名：[模板名] }
    // 注：用于从模板名查询所属文件。
    tplsMap = `${tplRoot}/_fmap.json`,

    // X扩展专用
    // App.pull 根路径。
    pullRoot = new URL(Dir.pull, Dir.setup);



//
// 下面的定义请勿轻易修改。
///////////////////////////////////////////////////////////////////////////////


const
    $ = window.$,

    // OBT属性名定义
    OBTA = {
        on:     'on',   // On-Attr
        by:     'by',   // By-Attr
        to:     'to',   // To-Attr
    },

    // 指令属性：自动取栈计数
    EXTENT = Symbol('stack-amount'),

    // 指令属性：特权方法（操作数据栈）
    ACCESS = Symbol('stack-access'),

    // PBS方法获取接口键。
    // 使用Symbol避免名称冲突。
    method = Symbol('api-method');



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
        return [ f ];
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



//
// 导出。
///////////////////////////////////////////////////////////////////////////////

export {
    Dir,
    DEBUG,
    OBTA,
    EXTENT,
    ACCESS,
    method,
    bindMethod,
    Support,
    tplRoot,
    tplsMap,
    pullRoot,
};