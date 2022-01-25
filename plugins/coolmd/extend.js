//! $ID: coolmd/extend.js 2022.01.05 Cooljed.Plugins $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2022 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件 OnBy 扩展
//  规范的文章格式（Coolj）转换为 MarkDown 文档格式。
//
//  除了列表、表格和代码块/表外，其它小区块都以引用块格式（>）封装：
//      > 引用块（<blockquote>）
//      > 结语（<footer>）
//      > 详细块（<details>）
//      > 批注块（<aside>）
//      > 插图（<figure>）
//      > 定义列表（<dl/dt,dd>）
//      > 导言（<header>，有小标题时）
//  注意：
//  如果选取的目标仅为小区块内部条目，则不会按引用块封装。
//  列表、表格和代码块/表也可以存在于小区块内，此时会有前置>标识。
//
//  仅扩展 On 集合，因此导出的对象中仅包含 On。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { PlugOn } from "../../base/main.js";
import { customGetter } from "../../base/tpb/tpb.esm.js";


//
// 代码元素汉字空格优化。
// 如果<code>两侧紧邻汉字（非标点），额外添加一个空格。
// 目的：MD文档视觉友好。
// 如果不需要支持，在此修改为false即可。
//
const codeHans = true;


const
    $ = window.$,

    On = Object.create( PlugOn ),

    // 单元格封装符（定制）
    // 注记：
    // 用方括号封装单元格在视觉上感觉清晰，
    // 且可借用已有的引用链接的着色方案，列上有交替着色友好。
    // 另外，方括号和前置的等号可表现“框线”的意象。
    __cellStart = '[',  // 单元格开头
    __cellEnd   = ']',  // 单元格结尾
    __thFlag    = ':',  // <th>标识，跟随<th>标识
    __tableFlag = '=',  // 表区块标识（拟双横线）

    // 代码块包围标识串
    __codeRound = "```",

    // 小标题级别
    __miniLevel = 4,

    // 一个缩进的空格序列。
    __indentSpace = '    ';


//
// 顶层章节间隔空行数
//
let __secSpace = 2;


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
    TR:         cellsTr,
    PRE:        convPre,

    // 标题系列
    H1:         el => `# ${el.textContent}`,
    H2:         el => `## ${el.textContent}`,
    H3:         el => `### ${el.textContent}`,
    H4:         el => `#### ${el.textContent}`,
    H5:         el => `##### ${el.textContent}`,
    H6:         el => `###### ${el.textContent}`,

    // 其它标题
    SUMMARY:    el => heading( el, __miniLevel ),
    FIGCAPTION: el => heading( el, __miniLevel ),
    DT:         el => __blockFunc.H5( el ),

    // 前置表区块标识
    CAPTION:    el => __tableFlag + ' ' + heading( el, __miniLevel ),

    HGROUP:     convHGroup,
    HR:         () => '------',

    // 列表项，可能含子表
    // function(el, lev, ind): String|[String, List]
    LI:         convLi,


    // 结构块
    // function(el, ...): Block
    //-----------------------------------------------------
    HEADER:     el => new Header( el ),
    FOOTER:     (el, lev) => new SmallBlock( el, lev ),
    ARTICLE:    el => new Article( el ),
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
    // val: function(el, lev): String
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
    A:      el => `[${el.textContent}](${$.attr(el, 'href')}${el.title ? ` "${el.title}"` : ''})`,
    IMG:    el => `![${el.alt}](${$.attr(el, 'src')}${el.title ? ` "${el.title}"` : ''})`,

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
     * @param {Number} lev 上级区块层级
     */
    constructor( el, lev = 0 ) {
        lev = lev + 1;
        super( el, lev );
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
            .map( ss => ss.trimEnd() )
            .join( `\n${this._bch}\n` );
    }
}


//
// 导言转换器
// 如果没有小标题，且后面跟随子片区，则按普通段落集转换。
// 否则按小区块转换（前置>）。
// 注记：
// 如果跟随的是普通内容件（非子章节），必须封装才显示出差异。
// 如果跟随子章节，则位于首个子章节之前，可区分。
//
class Header extends Block {
    /**
     * @param {Element} el 导言元素
     */
    constructor( el ) {
        let _hx = $.get( '>h4', el ),
            _nx = $.next( el ),
            _lev = 0;

        if ( _hx || _nx && _nx.tagName !== 'SECTION' ) {
            _lev = 1;
        }
        super( el, _lev );
        this._bch = ''.padStart( _lev, '>' );
    }


    /**
     * 转换补充。
     * 仅限于内容行单元，子区块忽略（自负责）。
     * @return {[String|Block]} 子单元集
     */
    conv() {
        let _buf = super.conv();
        if ( !this._bch ) return _buf;

        _buf.forEach( (v, i) =>
            typeof v === 'string' && ( _buf[i] = `${this._bch} ${v}` )
        );
        return _buf;
    }


    /**
     * 完成覆盖。
     * 成员空行连接，this._bch可能为空串。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .map( ss => ss.trimEnd() )
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
     * @param {Number} lev 上级区块层级
     */
    constructor( el, lev = 0 ) {
        // 子单元无递进包含逻辑，
        // 故无需向上传递lev实参。后同。
        super( el );

        lev = lev + 1;
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
        return list.map( ss => ss.trim() ).join( `\n` );
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
     * @param {Number} lev 上级区块层级
     */
    constructor( el, lev = 0 ) {
        super( el );

        lev = lev + 1;
        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 转换覆盖。
     * 返回集成员已经前置小区块标识前缀。
     * @return {[String]} 行集
     */
    conv() {
        let _cap = $.get( '>figcaption', this._el ),
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
        return list.map( ss => ss.trim() ).join( `\n` );
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
        this._space = $.get('>section', el) ? '\n\n\n' : '\n\n';
    }


    /**
     * 转换覆盖。
     * 返回集内的字符串为标题项和可能的简单段落，
     * 其它成员都应当是一个Block实例。
     * @return {[String|Block]} 标题项和子单元实例
     */
    conv() {
        let _hx = $.get( '>h2', this._el ),
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
        let _hx = list.shift();
        return _hx + '\n\n' + this._merge( list );
    }


    /**
     * 合并子单元转换。
     * @param  {[String|[Block]]} list 子单元转换集（不含标题）
     * @return {String}
     */
    _merge( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .map( ss => ss.trimEnd() )
            .join( this._space );
    }
}


//
// 列表区块。
// 使用有序（<ol>）和无序（<ul>）列表。
//
class List extends Block {
    /**
     * @param {Element} el 列表元素
     * @param {Number} lev 上级区块层级
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
            .map( ss => ss.trim() )
            .join( `\n` );
    }
}


//
// 文章区块。
// 内部可能为章节序列或直接的内容件。
//
class Article extends Block {
    /**
     * @param {Element} el 根容器
     */
    constructor( el ) {
        super( el );
        // 顶层章节间隔空行数可外部调整。
        this._space = $.get('>section', el) ? ''.padStart(__secSpace+1, '\n') : '\n\n';
    }


    /**
     * 完成覆盖。
     * 内容片区时，各子单元以一个空行连接。
     * 子章节片区时，各子章节以二个空行连接。
     * @param  {[String|Block]} list 子单元转换集
     * @return {String}
     */
    done( list ) {
        return list
            .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
            .map( ss => ss.trimEnd() )
            .join( this._space );
    }
}


//
// 表格区块。
// 各表格行之间以换行符分隔（非空行），每<tr>占据一整行。
// 与列表List类似，表格视为顶层实体，但也可以存在于小区块内（前置>）。
// 单元格以方括号包围封装，为与链接引用明确区分，每行前置一个表格标识符（=）。
// 格式：
// <caption>
//      = #### 表格标题
//      第4级标题，前置一个表格块标识符=。
// <thead/th>
//      =[: 单元格1 :][ 单元格2 ][ 单元格3 ]
//      =[-------------------------------]
//      方括号内两端填充一个空格，各单元格无缝串接。
//      方括号内前置的冒号（:）表示<th>，仅支持首列<th>使用此标记。
//      首列<th>方括号内后置的冒号表示后续单元格同类。这仅在表头内有效。
//      表头行之后跟随一条横线，也封装在方括号内（无空格填充）。
//      注：横线至少长3个短横线。
// <tbody/td>
//      =[ 单元格1 ][ 单元格2 ][ 单元格3 ]
//      =[ 单元格1 ][ 单元格2 ][ 单元格3 ]
//      简单的方括号封装<td>，各行以换行符分隔（上下紧邻）。
// <tbody/th>
//      =[: 单元格1 ][ 单元格2 ][ 单元格3 ]
//      首列<th>单元格在方括号内前置一个冒号。
//      不支持非首列的<th>存在。
// <tfoot/tr>
//      =[-----------------------------]
//      =[ 单元格1 ][ 单元格2 ][ 单元格3 ] 或
//      =[: 单元格1 ][ 单元格2 ][ 单元格3 ]
//      与表体行之间相隔一横线，单元格封装与<tbody>内同。
//
// 注记：
// 表标题与后面的表格行部分间隔一个空行。
// 表头行（<thead/tr>）可以仅由首列单元格判断出来，因此跟随的横线可以是可选的。
// 表脚部分必须前置一个横线，因为<tfoot>与<tbody>内的规则相同。
//
// 继承Block仅为接口相同的意思，会被全覆盖。
//
class Table extends Block {
    /**
     * @param {Element} el 根容器（<table>|<tbody>...）
     * @param {Number} lev 上级区块层级
     */
    constructor( el, lev = 0 ) {
        super( el );
        this._bch = ''.padStart( lev, '>' );
    }


    /**
     * 表格行转换。
     * 需考虑表格是否存在于小区块内。
     * 如果目标只是表格内的区域元素，则没有所在小区块。
     * 注记：
     * 单元格内不应当嵌入小区块（不支持）。
     * @return {[String]} 表格行集
     */
    conv() {
        let _el = this._el;

        if ( _el.tagName !== 'TABLE' ) {
            return this._tSect( _el );
        }
        let _buf = this._caption( _el );

        if ( _el.tHead ) {
            this._thead( _el.tHead, _buf );
        }
        [..._el.tBodies]
        .forEach(
            tb => this._tbody( tb, _buf )
        );
        if ( _el.tFoot ) {
            this._tfoot( _el.tFoot, _buf )
        }

        return this._bch ? _buf.map( s => `${this._bch} ${s}` ) : _buf;
    }


    /**
     * 转换完成。
     * 表格标题与后面的表格行部分间隔一个空行。
     * 表格行之间仅以换行连接（上下紧邻）。
     * 注记：
     * 表格视为顶层区块（类似列表），有自己的前置标识符标记。
     * 与列表一样，它们也可以存在于小区块内，叠加前置标识符。
     * @param  {[String]} list 表格行集
     * @return {String}
     */
    done( list ) {
        if ( this._el.caption ) {
            list.splice( 1, 0, this._bch + __tableFlag );
        }
        return list.join( '\n' );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 处理表格标题。
     * 返回的集合用于后续表格行的存储，没有表标题时返回一个空集。
     * 可适用<table>和<tbody>等单元。
     * @param  {Element} el 待转换元素
     * @return {[String]}
     */
    _caption( el ) {
        let _cap = el.caption;
        return _cap ? [ __blockFunc.CAPTION(_cap) ] : [];
    }


    /**
     * 表头行转换。
     * @param  {Element} head 表头元素
     * @param  {[String]} buf 行集缓存
     * @return {[String]} buf
     */
    _thead( head, buf ) {
        buf.push(
            ...[...head.rows].map( tr => cellsTr(tr, true) )
        );
        return pushSpace( buf );
    }


    /**
     * 表体行转换。
     * @param  {Element} body 表体元素
     * @param  {[String]} buf 行集缓存
     * @return {[String]} buf
     */
    _tbody( body, buf ) {
        buf.push(
            ...[...body.rows].map( tr => cellsTr(tr) )
        );
        return buf;
    }


    /**
     * 表脚行转换。
     * @param  {Element} foot 表脚元素
     * @param  {[String]} buf 行集缓存
     * @return {[String]} buf
     */
    _tfoot( foot, buf ) {
        pushSpace( buf )
        .push(
            ...[...foot.rows].map( tr => cellsTr(tr) )
        );
        return buf;
    }


    /**
     * 单个表区域转换。
     * 当用户直接选取<thead|tbody|tfoot>时适用。
     * @param  {Element} tsec 表区域元素（<thead|tbody|tfoot>）
     * @return {[String]} 转换行集
     */
    _tSect( tsec ) {
        let _ih = tsec.tagName === 'THEAD';
        return [ ...tsec.rows ].map( tr => cellsTr(tr, _ih) );
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
    return codeHans ? convCodeHans(el, _chx) : `${_chx}${el.textContent}${_chx}`;
}


/**
 * 内容行转换。
 * 适用可直接包含文本内容的元素。
 * 连续的空白会被压缩为一个空格（换行会被消除-友好）。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function conLine( el ) {
    return $.contents( el, null, false, true )
        .map( sub => sub.nodeType === 3 ? sub.textContent : convert(sub, __inlineFunc) )
        .join( '' )
        .replace( /\s+/g, ' ' );
}


/**
 * 列表项转换。
 * @param  {Element} li 列表项
 * @param  {Number} lev 所在小区块层级
 * @param  {String} ind 前置缩进串
 * @return {String|[String, List]} 条目文本或子表（标题和子表实例）
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
 * @param  {Boolean} head 是否为表头行
 * @return {String} 一行文本
 */
function cellsTr( tr, head ) {
    let _els = [ ...tr.cells ],
        _vth = _els.shift() || '',
        _ch1 = _vth.tagName === 'TH' ? __thFlag : '',
        _ch2 = head ? __thFlag : '';

    return _vth && __tableFlag + wrapCell( _vth, _ch1, _ch2 ) + wrapCells( _els );
}


/**
 * 普通单元格序列封装。
 * @param  {[Element]} els 单元格集
 * @return {String}
 */
function wrapCells( els ) {
    return els.map( el => wrapCell(el) ).join( '' );
}


/**
 * 单元格封装。
 * 注意在封装字符内填充一个空格。
 * @param  {Element} el 单元格
 * @param  {String} ch1 前标识（:）
 * @param  {String} ch2 后标识（:）
 * @return {String}
 */
function wrapCell( el, ch1 = '', ch2 = '' ) {
    return `${__cellStart}${ch1} ${conLine(el)} ${ch2}${__cellEnd}`;
}


/**
 * 插入表区域间隔行。
 * 内部间隔线至少3个短横线，整体长度不超过80字节。
 * @param  {[String]} buf 缓存集
 * @return {[String]} buf
 */
function pushSpace( buf ) {
    let _ref = buf[ buf.length-1 ],
        _n = Math.min(
            Math.max( _ref.length, 5 ), 80
        );
    buf.push(
        __tableFlag + __cellStart + ''.padStart(_n - 2, '-') + __cellEnd
    )
    return buf;
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
function heading( el, n ) {
    let _tt = conLine( el );
    return n ? `${''.padStart(n, '#')} ${_tt}` : _tt;
}


/**
 * 代码块转换。
 * 各个子语法块会被合并，以首个块的语言为准。
 * 结构：<pre role="codeblock">/<code>+
 * @param  {Element} el 根元素
 * @param  {Number} lev 所在小区块层级，可选
 * @return {[String]}
 */
function convCodeblock( el, lev = 0 ) {
    let _cels = $.find( '>code', el ),
        _lang = $.attr( _cels[0], '-lang' );

    return codeBlock(
        _cels.map( e => e.textContent.trimEnd().split('\n') ).flat(),
        _lang,
        ''.padStart( lev, '>' )
    );
}


/**
 * 代码表转换。
 * 内部的子语法块不被区分，相同对待。
 * 转换效果与代码块相同。
 * 结构：<ol role="codelist">/[<li>/<code>]+
 * @param  {Element} el 根元素
 * @param  {Number} lev 所在小区块层级，可选
 * @return {String}
 */
function convCodelist( el, lev = 0 ) {
    let _lang = $.attr( el, '-lang' ) || '',
        _rows = $.children( el ).map( li => li.textContent.trimEnd() );

    return codeBlock( _rows, _lang, ''.padStart(lev, '>') );
}


/**
 * 预排版转换。
 * @param  {Element} el 根元素
 * @param  {Number} lev 所在小区块层级，可选
 * @return {String}
 */
function convPre( el, lev ) {
    return codeBlock( el.textContent.trimEnd().split('\n'), '', ''.padStart(lev, '>') );
}


/**
 * 标题组转换。
 * 用于主标题和副标题组单元，仅以换行分隔。
 * @param  {Element} el 标题组元素
 * @return {String}
 */
function convHGroup( el ) {
    return [...el.children].map( hx => convert(hx, __blockFunc) ).join( '\n' );
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
 * @return {String|[String, List]}
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
 * @return {[String, List]} 标题项和子表实例
 */
function cascadeLi( li, lev, ind ) {
    let _h5 = $.get( '>h5', li ),
        _ttl;

    if ( _h5 ) {
        _ttl = __blockFunc.H5( _h5 );
    } else {
        _ttl = cascadeHx( li );
    }
    return [ _ttl, new List(li.lastElementChild, lev, ind + __indentSpace) ];
}


/**
 * 封装代码块。
 * 首尾三个撇号包围，含可选的语言指定。
 * 如果存在于小区块内，会前置小区块引用标识符（>）序列。
 * @param  {[String]} codes 代码行集
 * @param  {String} lang 所属语言，可选
 * @param  {String} prefix 小区块前置标识，可选
 * @return {String} 封装后的代码
 */
function codeBlock( codes, lang = '', prefix = '' ) {
    let _beg = `${__codeRound}${lang}`,
        _end = `${__codeRound}`,
        _buf = [ _beg, ...codes, _end ];

    // 每行尾空白清理。
    return ( prefix ? _buf.map( c => `${prefix} ${c}`.trimEnd() ) : _buf ).join( '\n' );
}


/**
 * 支持汉字优化的代码转换。
 * 紧邻汉字的一侧添加一个空格。
 * @param  {Element} el 代码元素
 * @param  {String} chx 封装字符
 * @return {String}
 */
function convCodeHans( el, chx ) {
    let _prev = (el.previousSibling || '').textContent || '',
        _next = (el.nextSibling || '').textContent || '';

    return codeHans2( chx, el.textContent, _prev, _next );
}


/**
 * 汉字包围代码处理。
 * 如果代码元素的前后紧邻汉字，则添加额外的空格。
 * @param  {String} chx 封装字符
 * @param  {String} txt 代码文本
 * @param  {String} beg 前段文本
 * @param  {String} end 后段文本
 * @return {String} MD格式代码串（可能两端外附一个空格）
 */
function codeHans2( chx, txt, beg, end ) {
    let _ch1 = isHans( beg[beg.length-1] ) ? ' ' : '',
        _ch2 = isHans( end[0] ) ? ' ' : '';

    return _ch1 + chx + txt + chx + _ch2;
}


/**
 * 是否为汉字。
 * 仅检查汉字基本集[20902]范围。
 * @param  {String} ch 目标字符
 * @return {Boolean}
 */
function isHans( ch ) {
    let _n = ch && ch.charCodeAt( 0 );
    return _n && _n >= 0x4E00 && _n <= 0x9FA5
}



// 扩展&导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 转换为MarkDown源码。
 * 普通单元之间以一个空行分隔，内部子单元自己处理分隔。
 * @data: String 选取集源码
 * @param  {Number} n 章节间隔空行数
 * @return {String}
 */
function mdblock( evo, n ) {
    if ( n > 0 ) {
        __secSpace = n;
    }
    let _frg = $.fragment( evo.data );

    return [..._frg.children]
        .map( el => convert(el, __blockFunc) )
        .map( it => typeof it === 'string' ? it : it.done(it.conv()) )
        .map( ss => ss.trimEnd() )
        .join( '\n\n' );
}


// On扩展
customGetter( On, 'mdblock', mdblock, 1 );


export { On };