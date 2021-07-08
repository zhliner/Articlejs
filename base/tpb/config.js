//! $Id: config.js 2019.09.28 Tpb.Config $
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

import { Util } from "./tools/util.js";
import { Loader, TplLoader } from "./tools/tloader.js";


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

        // 拉取数据根目录
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
 * 绑定方法到原宿主对象（obj）。
 * 支持对象子集嵌套，会递进处理。
 * - 处理取栈条目数（[EXTENT]），由前置两个下划线的属性表达。
 * - 处理特权设置（[ACCESS]），由前置两个下划线和_x结尾的属性表达。
 * 注记：
 * 这是 $.assign() 函数的处理器。
 * 创建已绑定的方法供全局共享，而不是每次创建一个绑定的新方法。
 *
 * @param  {Function} f 源方法
 * @param  {String} k 方法名
 * @param  {Object} obj 源宿主对象
 * @param  {Object} to 目标宿主对象
 * @return {[Function,]} 值/键对（键忽略）
 */
 function bindMethod( f, k, obj, to ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign(to[k] || {}, f, bindMethod) ];
    }
    if ( !$.isFunction(f) ) {
        return null;
    }
    if ( !f.name.startsWith('bound ') ) {
        f = f.bind( obj );
    }
    return [ funcSets(f, obj[`__${k}`], obj[`__${k}_x`]) ];
}


/**
 * 简单地获取方法（未绑定）。
 * 支持对象子集嵌套，会递进处理。
 * - 处理取栈条目数（[EXTENT]），由前置两个下划线的属性表达。
 * - 处理特权设置（[ACCESS]），由前置两个下划线和_x结尾的属性表达。
 * 注：这是 $.assign() 函数的非绑定处理器。
 * @param  {Function} f 源方法
 * @param  {String} k 方法名
 * @param  {Object} obj 源对象
 * @param  {Object} to 目标宿主对象
 * @return {[Function,]} 值/键对（键忽略）
 */
function getMethod( f, k, obj, to ) {
    if ( $.type(f) == 'Object' ) {
        return [ $.assign(to[k] || {}, f, getMethod) ];
    }
    if ( !$.isFunction(f) ) {
        return null;
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
 * 宿主成员简单赋值。
 * @param  {Object} host 宿主对象
 * @param  {String} name 名称序列（句点分隔）
 * @param  {Proxy|Function} item 代理对象或操作句柄
 * @param  {Number} n 取栈数量
 * @return {void}
 */
function hostSet( host, name, item, n ) {
    let _ns = name.split( '.' ),
        _nx = _ns.pop();

    if ( n !== undefined ) {
        item[EXTENT] = n;
    }
    ( subObj(_ns, host) || host )[ _nx ] = item;
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
 * 获取目标子域。
 * 如果目标子域不存在，则自动创建。
 * 子域链上的子域必须是普通对象类型（Object）。
 * @param {[String]} names 子域链
 * @param {Object} obj 取值域对象
 */
function subObj( names, obj ) {
    let _sub = obj;

    for ( const name of names || '' ) {
        _sub = obj[name];

        if ( !_sub ) {
            obj[name] = _sub = {};
            obj = _sub;
        }
        else if ( $.type(_sub) !== 'Object' ) {
            throw new Error(`the ${name} field is not a Object.`);
        }
    }
    return _sub;
}


/**
 * 深度扩展。
 * 对待扩展集内的所有方法进行扩展，支持对象嵌套（递进处理）。
 * 被扩展的方法默认会绑定（bind）到所属宿主对象（父容器）。
 * 接受扩展的目标子域可以是深层的（句点连接），重名方法会被覆盖。
 * 注记：
 * 如果目标子域不存在，会自动创建，包括中间层级的子域。
 * 如果方法需要访问指令单元（this:Cell），可以传递nobind为真。
 * 可无exts实参调用，返回子域本身。
 * 源定义支持取栈数量（__[name]）和特权（__[name]_x）配置。
 * @param  {String} name 接受域标识
 * @param  {Object} exts 待扩展目标集，可选
 * @param  {Boolean} nobind 无需绑定，可选。
 * @param  {Object} base 扩展根域
 * @return {Object} 目标子域
 */
function deepExtend( name, exts, nobind, base ) {
    let _f = nobind ?
        getMethod :
        bindMethod;

    return $.assign( subObj(name.split('.'), base), exts || {}, _f );
}


/**
 * 具名扩展。
 * 需要指定待扩展的目标方法，且仅限于成员的直接引用。
 * 适用普通对象和任意直接使用的类实例。
 * 如果从类实例扩展，通常需要传递一个统一的取栈数量n实参。
 * 通过方法名前置双下划线设置的取栈数量可以覆盖默认的n值。
 * 如果接收域标识为空字符串或假值，则接收域为base本身。
 * 注记同上。
 * @param {String} name 接收域标识
 * @param {Instance} obj 待扩展对象或类实例
 * @param {[String]} methods 方法名集
 * @param {Number} n 默认取栈数量，可选
 * @param {Object} base 扩展根域
 */
function namedExtend( name, obj, methods, n, base ) {
    let host = subObj(
            name && name.split('.'),
            base
        );
    for ( const m of methods ) {
        let _n = obj[ `__${m}` ];

        if ( _n === undefined ) {
            _n = n;
        }
        host[ m ] = funcSets( obj[m].bind(obj), _n, obj[`__${m}_x`] )
    }
}


//
// 获取对象方法自身。
// 方法名支持句点（.）分隔的多级引用。
// 仅能获取已经存在的成员。
//
function methodSelf( name, obj ) {
    name = name.split('.');
    return name.length > 1 ? Util.subObj( name, obj ) : obj[ name[0] ];
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
    JUMPCELL,
    PREVCELL,
    HEADCELL,
    bindMethod,
    getMethod,
    funcSets,
    hostSet,
    subObj,
    deepExtend,
    namedExtend,
    methodSelf,
    Globals,
    DataStore,
    ChainStore,
    XLoader,
    TLoader,
    storeChain,
    Templater,
    InitTpl,
};


//:debug
window.DataStore = DataStore;