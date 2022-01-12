//! $ID: extend.js 2022.01.05 Cooljed.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件 OnBy 扩展
//  导出的对象中需包含 On 和 By 两个成员。
//
//  规范文章格式（Coolj）转换为 MarkDown 文档格式。
//
//  除了列表和代码块/表外，所有的小区块都以引用块格式（>）封装：
//      > 引用块（<blockquote>）
//      > 结语（<footer>）
//      > 详细块（<details>）
//      > 批注块（<aside>）
//      > 插图（<figure>）
//      > 表格（<table>）
//      > 定义列表（<dl/dt,dd>）
//      > 导言（<header>，有小标题时）
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
    __tableCell = ' §§ ',   // 单元格之间
    __cellStart = '§ ',     // 首个单元格开头
    __cellEnd   = ' §',     // 最后单元格末尾

    // 代码包围字符串
    __codeRound = "```",

    // 片区间隔（双空行）。
    __spaceSection = '\n\n\n';


//
// 全局变量：
// 可以由外部配置修改。
//
let
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
    DT:         miniTitle,
    SUMMARY:    miniTitle,
    FIGCAPTION: miniTitle,
    CAPTION:    miniTitle,
    HR:         () => '------',


    // 结构块
    // function(el:Element): Block
    //-----------------------------------------------------
    HGROUP:     blockNormal,
    HEADER:     convHeader,
    FOOTER:     convH3Block,
    ARTICLE:    blockNormal,
    SECTION:    convSection,
    UL:         convList,
    OL:         convList,
    DL:         convDl,
    TABLE:      convTable,
    TBODY:      convTable,
    THEAD:      convTable,
    TFOOT:      convTable,
    FIGURE:     convFigure,
    BLOCKQUOTE: convH3Block,
    ASIDE:      convH3Block,
    DETAILS:    smallBlock,

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
     */
    constructor( el ) {
        this._el = el;
    }


    /**
     * 单元转换。
     * 仅限于内容行单元，子区块自行负责。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        return [ ...this._el.children ]
            .map( sub => convert(sub, __blockFunc) );
    }


    /**
     * 转换完成。
     * 将子单元合并返回，如果子单元是区块实例，则递进合并。
     * 子单元实例需遵循.done()接口。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done() )
            .join( '\n\n' );
    }
}


//
// 小区块转换。
// 使用MD引用块语法。
// 嵌套小区块的前置标识（>）与嵌套层级数相同。
//
class SmallBlock extends Block {
    /**
     * @param {Element} el 区块根元素
     * @param {Number} lev 区块层级，顶层小区块为1
     */
    constructor( el, lev ) {
        super( el );
        this._lev = lev;
    }


    /**
     * 转换补充。
     * 仅限于内容行单元，子区块忽略（自负责）。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        let _buf = super.conv(),
            _fix = ''.padStart( this._lev, '>' );

        _buf.forEach( (v, i) =>
            typeof v === 'string' && ( _buf[i] = `${_fix} ${v}` )
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
            .map( it => typeof it === 'string' ? it : it.done() )
            .join( '\n>\n' )
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
 * 在用户单独转换列表项时，视为顶层列表，
 * 此时父容器为一个文档片段，此时判断UL为假，故会按有序列表转换。
 * 如果是级联表项，返回一个行集。
 * 注记：
 * 自行判断前缀字符，因为用户可能选取单独的列表项转换。
 * @param  {Element} el 目标元素
 * @param  {Number} n 当前第几个条目，可选
 * @return {String|[String]}
 */
function convLi( el, n ) {
    let _pfix = el.parentNode.tagName === 'UL' ?
        '- ' :
        `${n || $.siblingNth(el)}. `;

    return isCascadeLi(el) ? cascadeLi(el) : conLine( el, _pfix );
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
 * 其它小标题。
 * 可由外部设定级别，支持内容包含内联单元。
 * 如果n为零，表示转为普通文本行。
 * 注记：
 * 编辑器支持的区块小标题为<h4>，但在MarkDown中这样的级别明显偏大。
 * 通常合理的设计为第5级，避免对大纲造成干扰。
 * @param  {Element} el 目标元素
 * @param  {Number} n 标题层级数
 * @return {String}
 */
function miniTitle( el, n = __miniLevel ) {
    let _tt = conLine( el );
    return n ? `${''.padStart(n, '#')} ${_tt}` : _tt;
}


/**
 * 片区转换。
 * 内部的<h2>标题转换为合适层级。
 * 对于无role定义的深片区，内部的<h2>转为第6级。
 * 注记：
 * 片区只存在于顶层，故返回一个合并了的字符串。
 * @param  {Element} el 片区元素
 * @return {String}
 */
function convSection( el ) {
    let _hx = $.get( 'h2', el ),
        _sx = $.attr( el, 'role' ) || '_5',
        _els = $.not( [...el.children], 'h2' ),
        _buf = [];

    if ( _hx ) {
        _buf.push( miniTitle(_hx, +_sx.slice(-1)+1) );
    }
    for ( const sub of _els ) {
        _buf.push( convNormal(sub, __blockFunc) );
    }
    // 段落间隔
    return _buf.flat().join( '\n\n' );
}


/**
 * 列表转换。
 * 支持有序和无需列表，以及由这两种列表组成的级联表。
 * 注：级联表用缩进表示。
 * @param  {Element} el 列表元素
 * @return {[String]} 行集
 */
function convList( el ) {
    let _ind = '',
        _n = 1,
        _buf = [];

    if ( el.parentNode.tagName === 'LI' ) {
        _ind = __indentSpace;
    }
    for ( const li of el.children ) {
        let _dd = convLi( li, _n++ ),
            _hx = _dd;

        if ( $.isArray(_dd) ) {
            _hx = _dd.shift();
        } else {
            _dd = [];
        }
        _buf.push( _hx, ..._dd.map(d => _ind+d) );
    }
    return _buf;
}


/**
 * 小区块转换（H3小标题）。
 * 其中的<h4>小标题级别不能原样保留。
 * @param  {Element} el 目标元素
 * @return {[String]} 行集
 */
function convH3Block( el ) {
    let _h4 = $.get( '>h4:first-child', el ),
        _els = $.not( [...el.children], 'h4' ),
        _buf = [];

    if ( _h4 ) {
        // 后附一空行
        _buf.push( miniTitle(_h4), '' );
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
    return convH3Block( el );
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
        _buf.push( miniTitle(_cap), '' );
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
        _buf.push( miniTitle(_cap), '' );
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
 * @return {String|[String]}
 */
function convert( el, cobj ) {
    let _rk = $.attr( el, 'role' ),
        _fn = cobj[ _rk ] || cobj[ el.tagName ];

    return _fn ? _fn( el ) : el.textContent.trim();
}


/**
 * 是否为级联表项。
 * 容错标题内容无<h4>封装。
 * @param  {Element} li 列表项
 * @return {Boolean}
 */
function isCascadeLi( li ) {
    let _xl = li.lastElementChild;
    return _xl && ( _xl.tagName === 'UL' || _xl.tagName === 'OL' );
}


/**
 * 提取级联表项标题文本。
 * 在无<h4>明确封装时使用。
 * @param  {Element} li 列表项元素
 * @return {Number}
 */
function cascadeHx( li, n = __miniLevel+1 ) {
    let _tts = $.not( $.contents(li), 'ul,ol' );
    return `${''.padStart(n, '#')} ${_tts.join('')}`;
}


/**
 * 级联表项转换。
 * @param  {Element} li 列表项
 * @return {[String]} 行集
 */
function cascadeLi( li ) {
    let _h4 = $.get( '>h5', li ),
        _buf = [];

    if ( _h4 ) {
        _buf.push( miniTitle(_h4), '' );
    } else {
        _buf.push( cascadeHx(li), '' );
    }
    _buf.push( ...convList(li.lastElementChild) );

    return _buf;
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