//! $ID: cmdline.js 2021.08.08 Articlejs.Libs $
// ++++++++++++++++++++++++++++++++++++++++++++++
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
//      !   扩展：一些高级指令（待定）。
//  开启：
//  在非编辑区域键入目标字符，光标会自动聚焦到命令行，同时会切换到该模式。
//  这些字符只是快捷键和标识，并不需要在命令行键入它们。
//
//
//  - 选取（>）
//  在当前选取集或内容区内检索目标选择器匹配的元素集。
//  支持二阶检索选择器（斜线分隔上/下阶选择器），此时以焦点元素为起点。
//  注：格式参考 Util.find()，无条件多元素检索。
//
//  支持竖线分隔的过滤表达式（见下）。
//
//
//  - 过滤（|）
//  以当前选取集为总集，过滤出目标元素集。
//  支持选择器、数组范围/下标、以及过滤函数的筛选形式。
//      String      选择器。
//      [n : m]     数组下标范围（空格可选）。
//      [a,b,c]     数组下标定点。
//      {function}  过滤函数。如箭头函数（参考 tQuery.filter）。
//                  如果以句点（.）开始，视为Collector成员函数。
//  注意：
//  Collector成员函数主要针对 .fiter|.has|.not 等专用过滤。返回值会被重新选取。
//  也可以使用其它函数（如 find、get 等），但不应当是会改变DOM节点的操作。
//
//
//  - 搜索（/）
//  搜索词以当前选取集内文本节点为上下文，不支持跨节点词汇的搜索。注：节点被视为意义域。
//  支持正则表达式匹配文本搜索，上下文边界同上。
//      String      普通搜索文本词。
//      /.../x      正则表达式搜索，x必须为合法的标志字符。
//
//
//  - 命令（:）
//  基本工具集：
//      plug-ins    插件安装。
//      plug-del    插件移除。
//      theme       列出当前可用主题，或应用目标主题。
//      style       列出当前可用内容样式，或应用目标样式。
//      help        开启帮助窗口并定位到指定的关键字条目。
//      config      显示系统配置值。
//
//
//  - 计算（=）
//  用户的输入会直接在顶层（window）执行，用户需要注意指令内容的安全性。
//  如不应当在表达式中修改文档的树结构（DOM）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Util } from "./tpb/tools/util.js";
import { Spliter, UmpCaller, UmpChars } from "./tpb/tools/spliter.js";
import { Cmdx, Tips, Setup, Limit, Sys } from "../config.js";

// 工具支持
import { pluginsInit, pluginsInsert, pluginsDelete } from "../plugins/base.js";


const
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

    // 正则表达式格式串
    __reRegExp = /^\/(.*)\/([imsugy]*)$/,

    // 字符串形式匹配
    __reString = /^(['"`])(.*)\1$/,

    // 实参序列分隔符（单字符）
    __chrArgs = ' ',

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
// 全局变量存储
//
let
    // 帮助按钮
    __helpBtn = null,

    // 插件面板
    __plugPanel = null;



//
// 选择指令实现。
// 支持选择器之后直接附加过滤表达式（| 分隔）。
//
class Select {
    /**
     * @param {Set} eset 当前选取集
     * @param {Element} root 全局上下文
     */
    constructor( eset, root ) {
        this._set = eset;
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
            ],
            _slr = _ss.shift(),
            _els = this._set.size > 0 ? this._finds(_slr, hot, [...this._set]) : this._find(_slr, hot, this._ctx);

        return filters( _ss, _els );
    }


    /**
     * 获取目标元素集。
     * @param  {String} slr 选择器
     * @param  {Element} hot 焦点元素（起点）
     * @param  {Element} ctx 查询上下文
     * @return {[Element]}
     */
    _find( slr, hot, ctx ) {
        return Util.find( slr, hot, false, ctx );
    }


    /**
     * 获取目标元素集。
     * @param  {String} slr 选择器
     * @param  {Element} hot 焦点元素（起点）
     * @param  {[Element]} els 查询上下文集
     * @return {[Element]}
     */
    _finds( slr, hot, els ) {
        return els.map( el => Util.find(slr, hot, false, el) ).flat();
    }
}


//
// 元素集过滤实现。
// 支持多段过滤表达式（| 分隔）。
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
     * @param  {String} str 筛选表达式
     * @return {Collector} 结果集
     */
    exec( str ) {
        let _ss = [
            ...__pipeSplit.reset().split( str.trim() )
        ]
        return filters( _ss, $(this._set) );
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
        // fmt 为一个完整的函数表达式。
        let _fn = new Function( `return (${fmt});` )();

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

        if ( __reRegExp.test(word) ) {
            word = this._regexp( word );
        }
        for ( const nd of nodes ) {
            _buf.push( ...this._ranges(nd, word) );
        }
        return _buf;
    }


    /**
     * 构造检索词范围。
     * 技巧：
     * 如果需要搜索一个正则表达式本身（文本），
     * 可以在前或后附加一个空格，这样它就不会被视为一个正则表达式了。
     * @param  {Text} txt 待检索文本节点
     * @param  {String|RegExp} word 检索词或正则表达式
     * @return {[Range]} 范围对象集
     */
    _ranges( txt, word ) {
        let _buf = [],
            i = 0,
            len = 0;

        /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
        while ( true ) {
            [i, len] = this._search(txt.textContent, word, i);
            if ( i < 0 ) {
                break;
            }
            _buf.push( this._range(txt, i, len) );
            i += len;
        }
        return _buf;
    }


    /**
     * 目标搜索。
     * @param  {String} text 目标文本
     * @param  {String|RegExp} word 待搜索词或正则表达式
     * @param  {Number} i 起始检索位置
     * @return {[Number, Number]} 目标词起点和长度
     */
    _search( text, word, i ) {
        if ( typeof word === 'string' ) {
            return [ text.indexOf(word, i), word.length ];
        }
        let _s = text.substring( i ),
            _v = _s && _s.match( word );

        return _v ? [ i+_v.index, _v[0].length ] : [ -1, 0 ];
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


    /**
     * 构造正则表达式。
     * 需要除去全局标志（g），以约束返回值格式。
     * @param  {String} word 正则式字符串
     * @return {RegExp}
     */
    _regexp( word ) {
        let [main, flag] = word.match(__reRegExp).slice(1);

        if ( flag ) {
            flag = flag.split('').filter( s => s !== 'g' ).join('');
        }
        return new RegExp( main, flag );
    }
}


//
// 内置命令执行器。
// 命令之后为空格分隔的实参序列。
//
class Command {

    constructor() {
        // 命令清单映射：{命令名：操作函数}
        this._cmds = new Map([
            [ 'help',       this._help ],
            [ 'plug-ins',   this._plugIns ],
            [ 'plug-del',   this._plugDel ],
            [ 'theme',      this._theme ],
            [ 'style',      this._style ],
            [ 'config',     this._config ],
        ]);
    }


    /**
     * 执行指令。
     * @param  {String} str 命令调用串
     * @return {String} 回显信息（状态）
     */
    exec( str ) {
        let [name, args] = this._cmdArgs( str ),
            _fun = this._cmds.get( name );

        if ( !name ) {
            return Tips.commandInvalid;
        }
        try {
            return _fun( ...args ) || '';
        }
        catch ( e ) {
            return `[${e.name}] ${e.message}`;
        }
    }


    /**
     * 提取命令和实参序列。
     * @param  {String} str 命令行序列
     * @return {[String, [String]|'']} [命令名, [实参序列]]
     */
    _cmdArgs( str ) {
        for ( const n of this._cmds.keys() ) {
            if ( str === n || str.startsWith(n + ' ') ) {
                return [
                    n,
                    this._args( str.substring(n.length+1) )
                ];
            }
        }
        return [];
    }


    /**
     * 获取实参序列。
     * 切分的值为字符串，容错字符串包围字符（"'`）的字符串。
     * @param  {String} str 实参序列字符串
     * @return {[String]}
     */
    _args( str ) {
        return $.split( str, __chrArgs, Infinity, true )
            .filter( s => s )
            .map( s => __reString.test(s) ? s.match(__reString)[2] : s );
    }



    //-- 命令操作 ----------------------------------------------------------------


    /**
     * 打开帮助提示
     * 会直接打开帮助侧栏，因此不应当返回提示。
     * 注记：
     * 如果没有目标条目的帮助信息，会在帮助面板中提示。
     * @param  {String} key 索引键
     * @return {void|String} 静默通过或错误提示
     */
    _help( key ) {
        $.trigger( __helpBtn, 'open' );
        $.trigger( __helpBtn, 'help', key );
    }


    /**
     * 插件安装。
     * 用户需先将插件文件存放到/plugins目录内。
     * 注记：
     * 考虑安全性和避免全局环境污染，插件以worker方式执行。
     * 因此这里的安装只是插入一个目标定位。
     * @param  {String} name 插件名
     * @param  {String} tips 按钮提示
     * @return {String} 状态信息（成功|失败）
     */
    _plugIns( name, tips ) {
        $.trigger( __plugPanel, Sys.plugIns, pluginsInsert(name, tips) );
    }


    /**
     * 插件移除。
     * @param  {String} name 插件名
     * @return {String} 提示信息
     */
    _plugDel( name ) {
        $.trigger( __plugPanel, Sys.plugDel, pluginsDelete(name) );
    }


    /**
     * 罗列或设置编辑器主题。
     * @param  {String} name 主题名称
     * @return {[String]|String} 主题清单或结果提示
     */
    _theme( name ) {
        if ( !name ) {
            // 待开发
            return "请键入准确的主题ID，目前暂不支持清单罗列。";
        }
        insertStyle(
            `#${Setup.styleTheme}`,
            {
                id:  Setup.styleTheme,
                url: `${Setup.root}${Setup.themes}/${name}/style.css`,
            }
        );
        return `[${name}] theme installed.`
    }


    /**
     * 罗列或设置内容样式。
     * 如果只需要改变代码着色样式，可传递main实参为null。
     * @param  {String} main 主样式名（文件夹），可选
     * @param  {String} code 代码着色样式名（文件夹），可选
     * @return {[String]|String} 样式清单或结果提示
     */
    _style( main, code ) {
        if ( !main && !code ) {
            // 待开发
            return "请键入准确的样式ID，目前暂不支持清单罗列。";
        }
        if ( main ) {
            insertStyle(
                `#${Setup.styleMain}`,
                {
                    id:  Setup.styleMain,
                    url: `${Setup.root}${Setup.styles}/${main}/main.css`,
                }
            );
        }
        if ( code ) {
            insertStyle(
                `#${Setup.styleCodes}`,
                {
                    id:  Setup.styleCodes,
                    url: `${Setup.root}${Setup.styles}/${code}/codes.css`,
                }
            );
        }
        return `[${main} ${code}] style installed.`
    }


    /**
     * 部分系统变量查看。
     * @param  {String} name 变量名
     * @return {Value} 结果值
     */
    _config( name ) {
        return Limit[ name ] || Tips.configNothing;
    }
}


//
// 简单计算器。
// 支持 $$ 引用当前选取集（Collector），因此可以执行较多的功能。
// 但应当仅使用读取类接口，而不要改变DOM本身。
//
// 执行结果会回显到命令行，这是另一种便捷。
//
// 安全性：
// 用户不应当在该模式下执行修改DOM的操作，这可能改变编辑器的结构和功能。
//
class Calcuate {
    /**
     * @param {Set} set 当前选取集引用
     * @param {Element} root 内容区根元素
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
        let _fun = new Function(
                __chrSels,
                __chrHot,
                __chrRoot,
                `return ${expr};`
            ),
            _val = null;

        try {
            _val = _fun( $(this._set), hot, this._ctx );
        }
        catch (e) {
            _val = `[${e.name}]: ${e.message}`;
        }
        return '' + _val;
    }
}



//
// 工具类
//////////////////////////////////////////////////////////////////////////////


//
// 指令执行记录器
// 注记：
// 指令的历史记录仅在当前窗口下有效，无本地存储。
//
class Record {

    constructor() {
        this._buf = [];
    }


    /**
     * 添加一条指令。
     * 友好：连续的相同指令仅记录一条。
     * @param  {String} cmd 指令序列
     * @return {void}
     */
    add( cmd ) {
        let _last = this._buf[ this._buf.length-1 ];
        _last !== cmd && this._buf.push( cmd );
    }


    /**
     * 查找匹配的目标指令记录集。
     * 逆向查找，返回一个匹配的集合。
     * 返回集已按时间近远排序（最新的指令在前）。
     * 注：头部匹配。
     * @param  {String} val 匹配值
     * @return {[String]}
     */
    find( val ) {
        let _all = this._buf.slice().reverse(),
            _buf = [],
            _i = 0;

        while ( _i >= 0 ) {
            _i = this._indexOf( val, _all, _i )

            if ( _i >= 0 ) {
                _buf.push( _all[_i++] );
            }
        }
        return _buf;
    }


    /**
     * 记录集大小。
     * @return {Number}
     */
    size() {
        return this._buf.length;
    }


    /**
     * 检索匹配的目标。
     * 头部/前端匹配，返回匹配目标的下标，或者返回-1。
     * @param  {String} val 待匹配串
     * @param  {[String]} buf 待查找源串集
     * @param  {Number} i 集合起始位置
     * @return {Number} 位置下标
     */
    _indexOf( val, buf, i = 0 ) {
        for ( ; i < buf.length; i++ ) {
            if ( buf[i].startsWith(val) ) return i;
        }
        return -1;
    }
}


//
// 指令导航器。
// 仅支持简单的向前/向后逐条导航，以及头部和末尾条目提取。
// 注记：
// 由指令记录器（Record）即时检索（.finds）后创建，
// 供上下箭头和Home/End键导航历史。
//
class CmdNav {
    /**
     * @param {[String]} list 导航集
     */
    constructor( list ) {
        this._buf = list;
        this._idx = 0;
    }


    /**
     * 提取下一条记录。
     * 返回null表示已到达末尾。
     * @return {Value|null}
     */
    next() {
        let _end = this.size() - 1;
        return this._idx < _end ? this._buf[++this._idx] : null;
    }


    /**
     * 提取前一条记录。
     * 返回null表示已到达头部。
     * @return {Value|null}
     */
    prev() {
        return this._idx > 0 ? this._buf[--this._idx] : null;
    }


    /**
     * 提取第一项。
     * 如果集合本来为空，返回null。
     * @return {Value|null}
     */
    first() {
        this._idx = 0;
        return this._buf[ 0 ] || null;
    }


    /**
     * 提取最后一项。
     * 如果集合本来为空，返回null。
     * @return {Value|null}
     */
    last() {
        this._idx = this._buf.length - 1;
        return this._buf[ this._idx ] || null;
    }


    /**
     * 重置内部游标。
     * @return {CmdNav} this
     */
    reset() {
        this._idx = 0;
        return this;
    }


    /**
     * 内部集合大小。
     * @return {Number}
     */
    size() {
        return this._buf.length;
    }
}


//
// 五类指令历史记录器。
// 仅在当前窗口（内存）中有效，不提供本地存储。
//
const __cmdBuffer = {
    [ Cmdx.select ]:    new Record(),
    [ Cmdx.filter ]:    new Record(),
    [ Cmdx.search ]:    new Record(),
    [ Cmdx.command ]:   new Record(),
    [ Cmdx.calcuate ]:  new Record(),
};



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


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


/**
 * 替换/插入样式元素。
 * 存在目标则替换，否则为新插入。
 * @param  {String} slr 原样式元素选择器
 * @param  {Object} conf 新元素配置对象（{href, id}）
 * @return {boid}
 */
function insertStyle( slr, conf ) {
    let _el = $.get( slr );

    $.style(
        conf,
        _el && _el.nextElementSibling
    );
    _el && $.remove( _el );
}



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 模块初始化。
 * @param {Element} help 帮助面板
 * @param {Element} plug 插件面板
 */
export function cmdlineInit( help, plug ) {
    __helpBtn = help;
    __plugPanel = plug;

    // 初始插件清单构建
    $.trigger( plug, Sys.plugInit, pluginsInit(Setup.plugList) );
}


/**
 * 获取目标类型的记录器。
 * @param  {String} type 指令类型标识符
 * @return {Record} 记录器
 */
export function typeRecord( type ) {
    return __cmdBuffer[ type ];
}


export { Select, Filter, Search, Command, Calcuate, CmdNav };
