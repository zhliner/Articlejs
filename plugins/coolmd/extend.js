//! $ID: extend.js 2022.01.05 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件 OnBy 扩展
//  规范的文章格式（Coolj）转换为 MarkDown 文档格式。
//
//  除了列表、表格和代码块/表外，所有的小区块都以引用块格式（>）封装：
//      > 引用块（<blockquote>）
//      > 结语（<footer>）
//      > 详细块（<details>）
//      > 批注块（<aside>）
//      > 插图（<figure>）
//      > 表格（<table>）
//      > 定义列表（<dl/dt,dd>）
//      > 导言（<header>，有小标题时）
//  注意：
//  如果选取的目标仅为小区块内部条目，则不会按引用块封装。
//
//  导出的对象中需包含 On 和 By 两个成员。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { PlugOn, PlugBy } from "../../base/plugins.js";
import { customGetter } from "../../base/tpb/tpb.esm.js";


const
    $ = window.$,

    On = Object.create( PlugOn ),
    By = Object.create( PlugBy ),

    // 单元格分隔序列
    __tableCell = ' ][ ',   // 单元格之间
    __cellStart = '[ ',     // 首个单元格开头
    __cellEnd   = ' ]',     // 最后单元格末尾

    // 代码块包围标识串
    __codeRound = "```",

    // 片区间隔（双空行）。
    __spaceSection = '\n\n\n',

    // 小标题级别
    __miniLevel = 4,

    // 一个缩进的空格序列。
    __indentSpace = '    ';


//
// 行块转换映射。
// 不同的标签对应各自的转换处理器。
// { tag|role:String: Function }
// 接口：function(el:Element): String|Block
//
const __blockFunc =
{
    // 内容行
    // function(el:Element): String
    //-----------------------------------------------------
    P:          conLine,
    ADDRESS:    conLine,
    DD:         conLine,
    TH:         conLine,
    TD:         conLine,
    LI:         convLi,
    TR:         cellsTr,

    // 标题系列
    H1:         el => `# ${el.textContent}`,
    H2:         el => `## ${el.textContent}`,
    H3:         el => `### ${el.textContent}`,
    H4:         el => `#### ${el.textContent}`,
    H5:         el => `##### ${el.textContent}`,
    H6:         el => `###### ${el.textContent}`,

    // 其它标题
    SUMMARY:    heading,
    FIGCAPTION: heading,
    CAPTION:    heading,
    DT:         __blockFunc.H5,

    HR:         () => '------',


    // 结构块
    // function(el:Element): Block
    //-----------------------------------------------------
    HGROUP:     blockNormal,
    HEADER:     convHeader,
    FOOTER:     (el, lev) => new SmallBlock( el, lev ),
    ARTICLE:    blockNormal,
    SECTION:    el => new Section( el ),
    UL:         (el, lev, ind) => new List( el, lev, ind ),
    OL:         (el, lev, ind) => new List( el, lev, ind ),
    DL:         (el, lev) => new DlBlock( el, lev ),
    TABLE:      (el, lev) => new Table( el, lev ),
    TBODY:      (el, lev) => new Table( el, lev ),
    THEAD:      (el, lev) => new Table( el, lev ),
    TFOOT:      (el, lev) => new Table( el, lev ),
    FIGURE:     (el, lev) => new FigureBlock( el, lev ),
    BLOCKQUOTE: (el, lev) => new SmallBlock( el, lev ),
    ASIDE:      (el, lev) => new SmallBlock( el, lev ),
    DETAILS:    (el, lev) => new SmallBlock( el, lev ),

    // 代码区块
    // key: role
    codeblock:  convCodeblock,
    codelist:   convCodelist,
}


//
// 内联单元转换映射
// 如果没有处理器，仅取其纯文本内容。
// { tag:String: Function }
// 接口：function(el:Element): String
//
const __inlineFunc =
{
    // MD标准支持
    CODE:   convCode,
    EM:     el => `*${el.textContent}*`,
    I:      el => `*${el.textContent}*`,
    STRONG: el => `**${el.textContent}**`,
    B:      el => `**${el.textContent}**`,
    A:      el => `[${el.textContent}](${el.href}${el.title ? ` "${el.title}"` : ''})`,
    IMG:    el => `![${el.alt}](${el.src}${el.title ? ` "${el.title}"` : ''})`,

    // 合法特性名
    // 注：不支持内联样式延续。

    // {cite}
    Q:      el => `<q${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</q>`,
    // {title}
    ABBR:   el => `<abbr${el.title ? ` title="${el.title}"` : ''}>${el.textContent}</abbr>`,
    DFN:    el => `<dfn${el.title ? ` title="${el.title}"` : ''}>${el.textContent}</dfn>`,
    // {datetime, cite}
    DEL:    el => `<del${el.datetime ? ` datetime="${el.datetime}"` : ''}${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</del>`,
    INS:    el => `<ins${el.datetime ? ` datetime="${el.datetime}"` : ''}${el.cite ? ` cite="${el.cite}"` : ''}>${el.textContent}</ins>`,
    // {dir}
    BDO:    el => `<dbo${el.dir ? ` dir="${el.dir}"` : ''}>${el.textContent}</dbo>`,
    // {datetime}
    TIME:   el => `<time${el.datetime ? ` datetime="${el.datetime}"` : ''}>${el.textContent}</time>`,

    // 纯内容
    CITE:   el => `<cite>${el.textContent}</cite>`,
    SMALL:  el => `<small>${el.textContent}</small>`,
    SUB:    el => `<sub>${el.textContent}</sub>`,
    SUP:    el => `<sup>${el.textContent}</sup>`,
    MARK:   el => `<mark>${el.textContent}</mark>`,
    // SAMP:   el => `<samp>${el.textContent}</samp>`,
    SAMP:   convCode,
    // KBD:    el => `<kbd>${el.textContent}</kbd>`,
    KBD:    convCode,
    S:      el => `<s>${el.textContent}</s>`,
    U:      el => `<u>${el.textContent}</u>`,
    VAR:    el => `<var>${el.textContent}</var>`,
};



//
// 块单元转换。
// 定义两个共用的接口：conv, done。
//
class Block {
    /**
     * @param {Element} el 块单元根
     * @param {...Value} rest 额外参数，可选
     */
    constructor( el, ...rest ) {
        this._el = el;
        this._vs = rest;
    }


    /**
     * 单元转换。
     * 仅限于内容行单元，子区块自行负责。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        return [ ...this._el.children ]
            .map( sub => convert(sub, __blockFunc, ...this._vs) );
    }


    /**
     * 转换完成。
     * 将子单元合并返回，如果子单元是区块实例，则递进合并。
     * 子单元实例需遵循.done()接口。
     * 默认一个空行连接。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .join( '\n\n' );
    }
}


//
// 通用小区块。
// 使用MD引用块语法。
// 嵌套小区块的前置标识（>）与嵌套层级数相同。
//
class SmallBlock extends Block {
    /**
     * @param {Element} el 区块根元素
     * @param {Number} lev 区块层级，顶层小区块为1
     */
    constructor( el, lev ) {
        super( el, lev+1 );
        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 转换补充。
     * 仅限于内容行单元，子区块忽略（自负责）。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        let _buf = super.conv();

        _buf.forEach( (v, i) =>
            typeof v === 'string' && ( _buf[i] = `${this._bch} ${v}` )
        );
        return _buf;
    }


    /**
     * 完成覆盖。
     * 小区块内空行连接，空行需前置标识符（>）。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .join( `\n${this._bch}\n` );
    }
}


//
// 定义列表区块。
// <dt>与之前的<dd>...序列之间隔一空行。
//
class DlBlock extends Block {
    /**
     * @param {Element} el 根容器
     * @param {Number} lev 区块层级，顶层小区块为1
     */
    constructor( el, lev ) {
        // 子单元无递进包含逻辑，
        // 故无需向上传递lev实参。后同。
        super( el );

        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 转换覆盖。
     * 返回集成员已经前置可能有的小区块标识前缀。
     * @return {[String]} 行集
     */
    conv() {
        let _buf = [];

        for ( const sub of this._el.children ) {
            // 非首个<dt>之前插入一个空行
            if ( sub.tagName === 'DT' && _buf.length > 0 ) {
                _buf.push( this._bch );
            }
            _buf.push( `${this._bch} ${convert(sub, __blockFunc)}` );
        }
        return _buf;
    }


    /**
     * 转换完成。
     * @param  {[String]} list 列表行集
     * @return {String}
     */
    done( list ) {
        return list.join( `\n` );
    }
}


//
// 插图区块。
// 插图标题（<figcaption>）与图片行之间相隔一个空行。
// 插图标题转换到头部（可能原在底部）。
//
class FigureBlock extends Block {
    /**
     * @param {Element} el 根容器
     * @param {Number} lev 区块层级，顶层小区块为1
     */
    constructor( el, lev ) {
        super( el );
        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 转换覆盖。
     * 返回集成员已经前置小区块标识前缀。
     * @return {[String]} 行集
     */
    conv() {
        let _cap = $.get( 'figcaption', this._el ),
            _els = _cap ? $.siblings(_cap) : [...this._el.children],
            _buf = [];

        if ( _cap ) {
            _buf.push( `${this._bch} ${__blockFunc.FIGCAPTION(_cap)}` );
            _buf.push( this._bch );
        }
        for ( const el of _els ) {
            _buf.push( `${this._bch} ${conLine(el)}` );
        }
        return _buf;
    }


    /**
     * 转换完成。
     * @param  {[String]} list 列表行集
     * @return {String}
     */
    done( list ) {
        return list.join( `\n` );
    }
}


//
// 章节区块。
// 绝对顶层，无法被小区块包含。
// 内部可能包含子章节。
// 需要对标题重构层级。
//
class Section extends Block {
    /**
     * @param {Element} el 根容器
     */
    constructor( el ) {
        super( el );
        this._lev = +( $.attr(el, 'role') || '_5' ).slice(-1) + 1;
    }


    /**
     * 转换覆盖。
     * 返回集内的字符串为标题项和可能的简单段落，
     * 其它成员都应当是一个Block实例。
     * @return {[String|Block]} 标题项和子单元实例
     */
    conv() {
        let _hx = $.get( 'h2', this._el ),
            _buf = [ heading(_hx, this._lev) ];

        for ( const sub of $.siblings(_hx) ) {
            _buf.push( convert(sub, __blockFunc) );
        }
        return _buf;
    }


    /**
     * 完成覆盖。
     * 内容片区时，各子单元以一个空行连接。
     * 子章节片区时，各子章节以二个空行连接。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        let _buf = [];

        for ( const [i, it] of list.entries() ) {
            // 无导言时，
            // 首个子章节与标题之间依然只间隔一行。
            if ( (it instanceof Section) && i > 1 ) {
                _buf.push( '\n' );
            }
            _buf.push(
                typeof it === 'string' ? it : it.done( it.conv() )
            );
        }
        return _buf.join( '\n\n' );
    }
}


//
// 列表区块。
// 使用有序（<ol>）和无序（<ul>）列表。
//
class List extends Block {
    /**
     * @param {Element} el 列表元素
     * @param {Number} lev 所在区块层级，无所在区块时为0
     * @param {String} ind 前置缩进（子表时）
     */
    constructor( el, lev = 0, ind = '' ) {
        super( el, lev, ind + __indentSpace );

        this._bch = ''.padStart( lev, '>' );
        this._ind = ind;
        this._chx = el.tagName === 'UL' && '- ';
    }


    /**
     * 转换覆盖。
     * 包含子表的列表项会返回一个二成员数组，其中：
     * [0]  子表标题（String）。
     * [1]  子表转换实例（List）
     * 所以结果集需要扁平化展开。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        let _buf = super.conv().flat();

        for ( const [i, v] of _buf.entries() ) {
            if ( typeof v !== 'string' ) {
                continue;
            }
            let _pf = this._ind + ( this._chx || `${i+1}. ` );

            _buf[i] = (this._bch ? `${this._bch} ${_pf}` : _pf) + v;
        }
        return _buf;
    }


    /**
     * 完成覆盖。
     * 列表项间换行分隔。
     * 如果处于小区块内，前置标识（>）已经添加。
     * 注：可能存在子表（级联表）。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .join( `\n` );
    }
}


//
// 表格区块。
// 各表格行之间仅以换行分隔符（没有空行）。
// 与列表List类似，视为顶层实体（不以引用块封装）。
// 注记：
// 继承Block仅为接口相同的意思，会被全覆盖。
//
class Table extends Block {
    /**
     * @param {Element} el 根容器（<table>|<tbody>...）
     * @param {Number} lev 所在区块层级，未在小区块内时为0
     */
    constructor( el, lev = 0 ) {
        super( el );
        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 表格行转换。
     * 需考虑表格是否存在于小区块内。
     * 注：
     * 不考虑单元格内再嵌入的小区块逻辑。
     * @return {[String]} 表格行集
     */
    conv() {
        let _buf = this._caption();

        for ( const tr of this._el.rows ) {
            let _row = cellsTr( tr );
            _buf.push( this._bch ? `${this._bch} ${_row}` : _row );
        }
        return _buf;
    }


    /**
     * 转换完成。
     * 表格行之间仅以换行分隔。
     * 如果存在表标题，标题与行集间隔一空行。
     * @param  {[String]} list 表格行集
     * @return {String}
     */
    done( list ) {
        if ( !this._el.caption ) {
            return list.join( `\n` );
        }
        let _cap = list.shift();

        return _cap + `\n${this._bch}\n` + list.join( '\n' );
    }


    /**
     * 处理表格标题。
     * 返回的集合用于后续表格行的存储。
     * 没有表标题时返回一个空集，可适用<table>和<tbody>等单元。
     * @return {[String]}
     */
    _caption() {
        let _cap = this._el.caption;
        if ( !_cap ) return [];

        let _txt = __blockFunc.H5( _cap );

        return this._bch ? [ `${this._bch} ${_txt}` ] : [ _txt ];
    }
}



// 转换集
//////////////////////////////////////////////////////////////////////////////


/**
 * 内联代码转换。
 * 格式：`xxx`、``xxx`yyzz``
 * @param  {Element} el 目标元素
 * @return {String}
 */
function convCode( el ) {
    let _chx = '`';

    if ( /[^`]`[^`]/.test(el.textContent) ) {
        _chx = '``';
    }
    return `${_chx}${el.textContent}${_chx}`;
}


/**
 * 内容行转换。
 * 适用可直接包含文本内容的元素。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function conLine( el ) {
    return $.contents( el, null, false, true )
        .map( sub => sub.nodeType === 3 ? sub.textContent : convert(sub, __inlineFunc) )
        .join( '' );
}


/**
 * 列表项转换。
 * @param  {Element} li 列表项
 * @param  {Number} lev 所在小区块层级
 * @param  {String} ind 前置缩进串
 * @return {String|[String, ListBlock]} 条目文本或子表（标题和子表实例）
 */
function convLi( el, lev, ind ) {
    if ( !el.parentElement ) {
        return aloneLi( el );
    }
    return isCascadeLi( el ) ? cascadeLi( el, lev, ind ) : conLine( el );
}


/**
 * 表格行转换。
 * - 单元格之间以一个特殊序列 §§ 分隔。
 * - 首尾单元格外围则只有单个 § 包围。
 * @param  {Element} tr 表格行元素
 * @return {String} 一行文本
 */
function cellsTr( tr ) {
    return __cellStart +
        [...tr.children].map( conLine ).join( __tableCell ) +
        __cellEnd;
}


/**
 * 标题转换器。
 * 可用于任意级别标题转换。
 * 默认4级，适用内含标题的小区块（如<details>）。
 * 包容标题内的内联小单元。
 * @param  {Element} el 目标元素
 * @param  {Number} n 标题层级数
 * @return {String}
 */
function heading( el, n = __miniLevel ) {
    let _tt = conLine( el );
    return n ? `${''.padStart(n, '#')} ${_tt}` : _tt;
}


/**
 * 小区块转换（H4小标题）。
 * 其中的<h4>小标题级别不能原样保留。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convH4Block( el ) {
    let _h4 = $.get( '>h4:first-child', el ),
        _els = $.not( [...el.children], 'h4' ),
        _buf = [];

    if ( _h4 ) {
        // 后附一空行
        _buf.push( heading(_h4), '' );
    }
    for ( const sub of _els ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return blockPrefix( _buf.flat() );
}


/**
 * 导言转换。
 * 如果没有小标题，且跟随子片区单元，则按普通段落集转换。
 * 否则按小区块转换（前置>）。
 * 注记：
 * 如果跟随的是普通内容件（非子章节），必须封装才显示出差异。
 * 如果跟随子章节，则位于首个子章节之前，可区分。
 * @param  {Element} el 导言元素
 * @return {[String]}
 */
function convHeader( el ) {
    let _hx = $.get( 'h4', el ),
        _nx = $.next( el );

    if ( !_hx && _nx && _nx.tagName === 'SECTION' ) {
        return blockNormal( el );
    }
    return convH4Block( el );
}


/**
 * 小区块转换。
 * 主要针对如<details>有自有小标题的单元。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function smallBlock( el ) {
    let _buf = [];

    for ( const sub of el.children ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return blockPrefix( _buf.flat() );
}


/**
 * 定义列表转换。
 * 各 <dd> 行之间以一个换行符分隔。
 * 各 <dt><dd>+ 块之间用一个空行分隔。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convDl( el ) {
    let _buf = [];

    for ( const sub of el.children ) {
        // 非首个<dt>之前插入一个空行
        if ( sub.tagName === 'DT' && _buf.length > 0 ) {
            _buf.push( '' );
        }
        _buf.push( convNormal(sub, __blockFunc) );
    }
    return blockPrefix( _buf.flat() );
}


/**
 * 插图转换。
 * 每一个图片&讲解转换为一个普通段落（<img>+<i>）文本。
 * 参考：<figure/figcaption, [span/img, i]+
 * 注：
 * 插图标题可能在底部，统一提取到上部首行。
 * @param  {Element} el 插图元素
 * @return {[String]} 行集
 */
function convFigure( el ) {
    let _cap = $.get( 'figcaption', el ),
        _els = _cap ? $.siblings(_cap) : [...el.children],
        _buf = [];

    if ( _cap ) {
        _buf.push( heading(_cap), '' );
    }
    for ( const sub of _els ) {
        // 后附一空行
        _buf.push( convNormal(sub, __blockFunc), '' );
    }
    return blockPrefix( _buf.flat() );
}


/**
 * 表格数据转换。
 * 适用表格及其内部的块单元（tbody|tfoot|thead）。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convTable( el ) {
    let _cap = $.get( 'caption', el ),
        _trs = $.find( 'tr', el ),
        _buf = [];

    if ( _cap ) {
        _buf.push( heading(_cap), '' );
    }
    for ( const tr of _trs ) {
        _buf.push( cellsTr(tr) );
    }
    return blockPrefix( _buf.flat() );
}


/**
 * 普通结构块转换。
 * @param  {Element} el 块元素
 * @return {[String]}
 */
function blockNormal( el ) {
    return [ ...el.children ]
        .map( sub => convNormal(sub, __blockFunc) ).flat();
}


/**
 * 代码块转换。
 * 各个子语法块分别转换，
 * 代码块由3个撇号包围。
 * 结构：<pre role="codeblock">/<code>+
 * @param  {Element} el 根元素
 * @return {[String]}
 */
function convCodeblock( el ) {
    return $.find( 'code', el ).map( codeBlock );
}


/**
 * 代码表转换。
 * 内部的子语法块不被区分，相同对待。
 * 转换效果与代码块相同。
 * 结构：<ol role="codelist">/[<li>/<code>]+
 * @param  {Element} el 根元素
 * @return {String}
 */
function convCodelist( el ) {
    let _lang = $.attr( el, '-lang' ) || '',
        _rows = $.children( el ).map( li => li.textContent );

    return `${__codeRound}${_lang}\n` + `${_rows.join('\n')}\n${__codeRound}`;
}



// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 通用的处理器。
 * 如果不存在目标处理器，则取其纯文本返回。
 * @param  {Element} el 目标元素
 * @param  {Object} cobj 处理器集
 * @param  {...Value} rest 附加参数，可选
 * @return {String|[String]}
 */
function convert( el, cobj, ...rest ) {
    let _rk = $.attr( el, 'role' ),
        _fn = cobj[ _rk ] || cobj[ el.tagName ];

    return _fn ? _fn( el, ...rest ) : el.textContent.trim();
}


/**
 * 独立列表项转换。
 * 在用户单独转换列表项时适用。
 * 此时父容器为一个文档片段，视为顶层有序列表。
 * 包含子表时返回一个二成员数组。
 * 注记：
 * 有序列表可以提供更多的信息，是一种用户友好。
 * 列表项结果包含前置标识符，因为没有父容器来添加它。
 * @param  {Element} el 目标元素
 * @return {String|[String, ListBlock]}
 */
function aloneLi( el ) {
    let _pfix = `${$.siblingNth(el)}. `;
    return isCascadeLi( el ) ? cascadeLi( el, 0, '' ) : _pfix + conLine(el);
}


/**
 * 是否为级联表项。
 * 容错标题内容无<h5>封装。
 * @param  {Element} li 列表项
 * @return {Boolean}
 */
function isCascadeLi( li ) {
    let _xl = li.lastElementChild;
    return _xl && ( _xl.tagName === 'UL' || _xl.tagName === 'OL' );
}


/**
 * 提取级联表项标题文本。
 * 在无<h5>明确封装时，使用除子表之外的全部文本。
 * @param  {Element} li 列表项元素
 * @return {Number}
 */
function cascadeHx( li ) {
    let _tts = $.not( $.contents(li), 'ul,ol' );
    return `##### ${ _tts.join('').trim() }`;
}


/**
 * 级联表项转换。
 * @param  {Element} li 列表项
 * @param  {Number} lev 所在小区块层级
 * @param  {String} ind 前置缩进串
 * @return {[String, ListBlock]} 标题项和子表实例
 */
function cascadeLi( li, lev, ind ) {
    let _h5 = $.get( '>h5', li ),
        _ttl;

    if ( _h5 ) {
        _ttl = __blockFunc.H5( _h5 );
    } else {
        _ttl = cascadeHx( li );
    }
    return [ _ttl, new ListBlock(li.lastElementChild, lev, ind + __indentSpace) ];
}


/**
 * 小区块前缀字符设置。
 * 如果行文本已经有前缀字符，则新设置的无跟随空格。
 * 即：行集为递进小区块所转换。
 * @param  {[String]} list 文本行集
 * @return {[String]}
 */
function blockPrefix( list ) {
    return list.map(
        tt => tt[0] === '>' ? `>${tt}` : `> ${tt}`
    );
}


/**
 * 转换一个代码块。
 * 首尾三个撇号包围，含可选的语言指定。
 * @param  {Element} code 代码元素
 * @return {String}
 */
function codeBlock( code ) {
    let _lang = $.attr( code, '-lang' ) || '';
    return `${__codeRound}${_lang}\n` + `${code.textContent}\n${__codeRound}`;
}



// 扩展&导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 转换为MarkDown源码。
 * @data: String 选取集源码
 * @param  {Number} nl 间隔行数，可选
 * @return {String}
 */
function mdblock( evo, nl ) {
    let _frg = $.fragment( evo.data );

    nl = nl >= 0 && ''.padStart( nl+1, '\n' );

    return [..._frg.children]
        .map( el => convNormal(el, __blockFunc) )
        .map( vs => $.isArray(vs) ? vs.join('\n') : vs )
        .join( nl || __spaceSection );
}


// On扩展
customGetter( On, 'mdblock', mdblock, 1 );


export { On, By };