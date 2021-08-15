//! $ID: cmdline.js 2021.08.08 Articlejs.Config $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  命令行模块
//  支持几种不同类型的命令，以一个特殊字符开启：
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
//  也可以使用其它函数（如 find、get 等），但不应当是会改变DOM节点的操作。
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
//      plugIns     插件安装。
//      plugDel     插件移除。
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

import { Util } from "./tpb/tools/util.js";
import { Spliter, UmpCaller, UmpChars } from "./tpb/tools/spliter.js";


const
    $ = window.$,

    // 数值定位匹配
    // [x:y] 或 [m,n,...]
    // 取值：[1]
    __reNumber = /^\[([\d:,\s]*)\]$/,

    // 范围分隔符
    // 在 __reNumber 之内
    __reRange = /\s*:\s*/,

    // 表达式匹配
    // {expression|.func}
    // 取值：[1]
    __reFilter = /^\{(.*)\}$/,

    // 当前选取集变量名
    __chrSels = '$$',

    // 当前焦点元素变量名
    __chrHot  = '$',

    // 内容区根元素变量名
    __chrRoot = '_',

    // 进阶过滤切分器。
    // 排除属性选择器、调用式和表达式内值。
    __pipeSplit = new Spliter( '|', new UmpCaller(), new UmpChars('[', ']'), new UmpChars('{', '}') );



//
// 选择指令实现。
//
class Select {
    /**
     * @param {Element} root 全局上下文
     */
    constructor( root ) {
        this._ctx = root;
    }


    /**
     * 执行指令。
     * @param  {String} slr 选择器
     * @param  {Element} hot 焦点元素
     * @return {Collector} 新选取集
     */
    exec( slr, hot ) {
        let _ss = [
                ...__pipeSplit.reset().split( slr.trim() )
            ];
        return filters( _ss, Util.find(_ss.shift(), hot, false, this._ctx) );
    }
}


//
// 元素集过滤实现。
//
class Filter {
    /**
     * @param {Set} set 初始集合引用
     */
    constructor( set ) {
        this._set = set;
    }


    /**
     * 执行指令。
     * 支持多段过滤表达式（| 分隔）。
     * @param  {String} str 筛选表达式
     * @return {Collector} 结果集
     */
    exec( str ) {
        let _ss = [
            ...__pipeSplit.reset().split( str.trim() )
        ]
        return filters( _ss, this._set );
    }


    /**
     * 执行指令。
     * 筛选表达式为单个过滤表示。
     * @param  {String} str 筛选表达式
     * @param  {[Element]} els 待过滤集
     * @return {Collector} 结果集
     */
    execOne( str, els ) {
        let _fun = this._handle( str.trim() );
        return _fun( $(els) );
    }


    // -- 私有辅助 -----------------------------------------------------------


    /**
     * 创建过滤函数。
     * 接口：function( all:Collector ): Collector|[Element]
     * @param  {String} fmt 格式串
     * @return {Function} 取值函数
     */
    _handle( fmt ) {
        if ( __reNumber.test(fmt) ) {
            return this._number( fmt.match(__reNumber)[1] );
        }
        if ( __reFilter.test(fmt) ) {
            return this._filter( fmt.match(__reFilter)[1] );
        }
        // 选择器模式。
        return all => all.filter( fmt );
    }


    /**
     * 数值定位提取。
     * @param  {String} fmt 定位串：[x:y]|[m,n,...]
     * @return {Function}
     */
    _number( fmt ) {
        let _vs = fmt.split(__reRange);

        if ( _vs.length > 1 ) {
            return this._range( _vs );
        }
        _vs = JSON.parse( `[${fmt}]` );

        // 越界下标的值被滤除。
        return all => _vs.map( i => all[i] ).filter( v => v );
    }


    /**
     * 按范围提取。
     * @param  {String} beg 起始下标，可选
     * @param  {String} end 终点下标，可选
     * @return {Function}
     */
    _range( [beg, end] ) {
        beg = Math.trunc( beg ) || 0;
        end = end.trim() ? Math.trunc( end ) : undefined;

        return all => all.slice( beg, end );
    }


    /**
     * 过滤器提取。
     * @param  {String} fmt 过滤表达式
     * @return {Function}
     */
    _filter( fmt ) {
        if ( fmt[0] === '.' ) {
            return new Function( __chrSels, `return $$${fmt}` );
        }
        let _fn = new Function( `return ${fmt}` )();

        return all => all.filter( _fn );
    }
}


//
// 搜索目标词
// 返回的是检索词的Range对象集，以便于外部构造<mark>元素。
//
class Search {
    /**
     * @param {Element} root 全局上下文
     */
    constructor( root ) {
        this._ctx = root;
        this._doc = root.ownerDocument;
    }


    /**
     * 执行指令。
     * 外部应当先执行一次 $.normalize() 规范化，
     * 以合并无意中创建的片段文本。
     * @param  {String} word 待搜索词
     * @param  {[Text]} nodes 目标节点集（文本节点）
     * @return {[Range]} 搜索词范围对象集
     */
    exec( word, nodes ) {
        let _buf = [];

        for ( const nd of nodes ) {
            _buf.push( ...this._ranges(nd, word) );
        }
        return _buf;
    }


    /**
     * 构造检索词范围。
     * @param  {Text} txt 待检索文本节点
     * @param  {String} word 检索词
     * @return {[Range]} 范围对象集
     */
    _ranges( txt, word ) {
        let _buf = [],
            _len = word.length,
            _i = 0;

        while ( _i >= 0 ) {
            _i = txt.textContent.indexOf( word, _i );
            if ( _i < 0 ) {
                break;
            }
            _buf.push( this._range(txt, _i, _len) );
            _i += _len;
        }
        return _buf;
    }


    /**
     * 创建一个范围。
     * @param  {Text} txt 文本节点
     * @param  {Number} i 起点位置
     * @param  {Number} len 范围长度
     * @return {Range}
     */
    _range( txt, i, len ) {
        let _rng = this._doc.createRange();

        _rng.setStart( txt, i );
        _rng.setEnd( txt, i+len );

        return _rng;
    }
}


//
// 内置命令执行器。
//
class Command {

    constructor() {
        // 支持的命令清单
        this._cmds = new Set([
            'help',
            'plugIns',
            'plugDel',
            'theme',
            'style',
            'setconfig',
        ]);
    }


    /**
     * 执行指令。
     * @param  {String} str 命令调用串
     * @return {String} 回显信息（状态）
     */
    exec( str ) {
        return '开发中....谢谢！';
    }
}


//
// 简单计算器。
// 支持 $$ 引用当前选取集（Collector），因此可以执行较多的功能。
// 但应当仅使用读取类接口，而不要改变DOM本身。
//
// 执行结果会回显到命令行，这是另一种便捷。
//
class Calcuate {
    /**
     * @param {Set} set 当前选取集引用
     */
    constructor( set, root ) {
        this._set = set;
        this._ctx = root;
    }


    /**
     * 执行指令。
     * 表达式内可使用如下变量名：
     * - $$ 指代当前选取集（Collector）。
     * - $  指代当前焦点元素（覆盖全局 $ 变量）。
     * - _  指代内容区根元素（<main>）
     * @param  {String} expr 表达式串
     * @return {Value} 执行结果
     */
    exec( expr, hot ) {
        return new Function(
            __chrSels, __chrHot, __chrRoot, `return ${expr}`
        )(
            $(this._set), hot, this._ctx
        );
    }
}



/**
 * 连续过滤。
 * 比如通过管道符（|）的选取集过滤。
 * @param {[String]} strs 过滤标识串集
 * @param {[Element]} els0 初始集合
 */
function filters( strs, els0 ) {
    return strs.reduce(
        (els, flr) => new Filter().execOne( flr, els ), els0
    );
}


export { Select, Filter, Search, Command, Calcuate };
