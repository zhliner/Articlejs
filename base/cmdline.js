//! $ID: cmdline.js 2021.08.08 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  命令行模块
//  接口：
//  - .exec() 执行指令，返回恰当的值。
//  - .type() 返回值类型。返回值含义如下：
//      nodes   表示 exec() 返回节点集，外部执行重新选取。
//      value   表示 exec() 返回普通值，会回显到命令行处。
//      null    外部没有任何额外的操作。
//
//  支持如下几种不同类型的命令。以一个特殊的字符开启：
//      >   选取：内容为选择器。全局上下文为编辑器内容区。
//      |   过滤：内容为过滤条件。对当前选取集执行过滤。
//      /   搜索：内容为目标文本。在选取集或全文搜索目标文本并标记（<mark>）。
//      :   命令：内容为编辑器支持的命令。主要是一些基本的工具函数。
//      =   计算：将内容视为JS表达式，执行计算并返回到当前位置。
//      !   扩展：一些高级的指令，待开发。
//  开启：
//  在非编辑区域键入目标字符，光标会自动聚焦到命令行，同时会切换到该模式。
//  这些字符只是快捷键和标识，并不需要在命令行键入它们。
//
//
//  - 选取（>）
//  支持以焦点元素为起点的二阶检索（斜线分隔上/下阶选择器）。格式参考 Util.find() 接口。
//  无条件多元素检索，没有单一检索的格式。
//
//
//  - 过滤（|）
//  以当前选取集为总集，支持选择器、数组范围/下标、和过滤函数格式。
//      String      选择器。
//      [n : m]     数组下标范围（空格可选）。
//      [a,b,c]     数组下标定点。
//      {function}  过滤函数。如果以句点（.）开始，视为Collector成员函数。
//
//  注意：
//  Collector成员函数主要针对 .fiter|.has|.not 等专用过滤。返回值会被重新选取。
//  也可以使用其它函数，但不应当是会改变DOM节点的操作，且返回值也需要是DOM中的元素。
//
//
//  - 搜索（/）
//  搜索词以当前选取集内文本节点为上下文，不支持跨节点词汇的搜索。注：节点被视为意义域。
//  支持正则表达式匹配文本搜索，上下文边界同上。
//      String      普通搜索文本词。
//      /.../x      正则表达式搜索。
//
//
//  - 命令（:）
//  基础性工具集：
//      plug-ins    插件安装。
//      plug-del    插件移除。
//      theme       列出当前可用主题，或应用目标主题。
//      style       列出当前可用内容样式，或应用目标样式。
//      help        开启帮助窗口并定位到指定的关键字条目。
//      setconfig   系统配置运行时调整。
//
//
//  另外：
//  系统保留了问号（?）用于未来可能的交互逻辑领域。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { processExtend } from "./tpb/pbs.by.js";


// const $ = window.$,

let __Root;


//
// 选择指令实现。
//
class Select {
    /**
     * @param {Element} root 全局上下文
     */
    constructor( root ) {
        //
    }


    /**
     * 执行指令。
     * @param  {String} slr 选择器
     * @return {[Element]} 新选取集
     */
    exec( slr ) {
        //
    }


    /**
     * 返回值类型。
     * @return {String}
     */
    type() {
        return 'nodes';  // 节点操作类
    }
}


//
// 选取集过滤实现。
//
class Filter {

    constructor() {
        //
    }


    /**
     * 返回值类型。
     * @return {String}
     */
    type() {
        return 'nodes';
    }
}


class Search {
    /**
     * @param {Element} root 全局上下文
     */
    constructor( root ) {
        //
    }


    /**
     * 返回值类型。
     * @return {String}
     */
    type() {
        return 'nodes';
    }
}


class Command {

    constructor() {
        //
    }


    /**
     * 返回值类型。
     * @return {String}
     */
    type() {
        return null;
    }
}


class Calcuate {

    constructor() {
        //
    }


    /**
     * 返回值类型。
     * @return {String}
     */
    type() {
        return 'value';
    }
}



//
// 命令行配置。
//
const __Cmdx = {
    '>':    new Select( __Root ),
    '|':    new Filter(),
    '/':    new Search( __Root ),
    ':':    new Command(),
    '=':    new Calcuate(),
};


//
// 命令行处理集。
//
const __Cmds = {
    /**
     * 命令行执行。
     * @param  {String} key 指令类型键
     * @return [String, Value] [返回值类型, 运行结果]
     */
    run( evo, key ) {
        let _op = __Cmdx[key];
        return [ _op.type(), _op.exec(evo.data) ];
    },

    __run: 1,
};


//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 初始化变量赋值。
 * @param {Element} ebox 编辑器内容区根
 */
export function cmdInit( ebox ) {
    __Root = ebox;
}


processExtend( 'Cmd', __Cmds, [
    'run',
]);