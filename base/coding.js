//! $ID: coding.js 2020.02.07 Cooljed.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码编辑基本工具集。
//
//  代码编辑中常见的基本友好操作，如：
//  - 换行保持相同的缩进。
//  - 退格键删除前一个缩进而不仅仅是单个字符（可能为多个空格）。
//  - Tab键会根据设置替换为多个空格。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Hicolor } from "./hlparse/main.js";


const
    // 全角字符码值起始
    // 字符：⅏ （概略）。
    __fullBegin = 0x214f,

    // 零星全角字符排除。
    // 仅限 0x214f 以内（概略）。
    __fullChs = new Set( 'ೠൕ൘൙൚൛൜൝൞ൟൠ൧൨൩൪൫൬൭൮൯൰൱൲൳൴൵൶൷൸൹ൺൻർൽൾൿᳩᳪᳫ⁇※‱℃'.split('') );


//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * Tab切分。
 * 查找到Tab字符后切分为2段。
 * 如果后段为特殊值true，表示末尾为一个Tab。
 * @param  {String} str 行字符串
 * @param  {Number} tabs Tab空格数
 * @return {String, String|true}
 */
function tabSplit( str ) {
    let _i = str.indexOf( '\t' );
    return _i < 0 ? [ str ] : [ str.substring(0, _i), str.substring(_i+1) || true ];
}


/**
 * 检索行前段。
 * @param  {Node} node 待检索节点
 * @param  {Number} from 逆向起始位置
 * @param  {String} end 终止字符
 * @return {[String, Boolean]} [行段, 结束]
 */
function partBefore( node, from, end ) {
    // 元素取渲染文本
    let _s = node.innerText || node.textContent,
        // -1：不含起始位置本身
        _i = _s.lastIndexOf( end, from-1 );

    return _i < 0 ? [_s.substring(0, from)] : [_s.substring(_i+1, from), true];
}


/**
 * 检索行后段。
 * @param  {Node} node 待检索节点
 * @param  {Number} from 起始位置
 * @param  {String} end 终止字符
 * @return {[String, Boolean]} [行段, 结束]
 */
function partAfter( node, from, end ) {
    let _s = node.innerText || node.textContent,
        _i = _s.indexOf( end, from );

    return _i < 0 ? [_s] : [_s.substring(from, _i), true];
}


/**
 * 光标前段检索。
 * 向前逐节点平级检索，直到发现换行符。
 * 以范围起点为起点。
 * 注记：
 * 仅限于光标最近容器节点内检索。
 * @param  {Node} node 起始节点
 * @param  {Number} idx 起始下标
 * @param  {String} end 终止字符
 * @return {String, Boolean} [行前段文本, 以换行结束]
 */
function cursorPrev( node, idx, end ) {
    let _buf = [];

    while ( node ) {
        let [s, ok] = partBefore( node, idx, end );
        _buf.push( s );
        idx = Infinity;

        if ( ok ) break;
        node = node.previousSibling;
    }
    return [ _buf.reverse().join(''), !!node ];
}


/**
 * 光标后段检索。
 * 向后逐节点平级检索，直到发现换行符。
 * 以范围起点（而非终点）为起点。
 * 注记：（同前）。
 * @param  {Node} node 起始节点
 * @param  {Number} idx 起始下标
 * @param  {String} end 终止字符
 * @return {String, Boolean} [后前段文本, 以换行结束]
 */
function cursorNext( node, idx, end ) {
    let _buf = [];

    while ( node ) {
        let [s, ok] = partAfter( node, idx, end );
        _buf.push( s );
        idx = 0;

        if ( ok ) break;
        node = node.nextSibling;
    }
    return [ _buf.join(''), !!node ];
}


/**
 * 检查获取缩进量。
 * 缩进字符仅限于空格和Tab字符。
 * @param  {String} str 待检查字符串
 * @param  {Number} max 最大检查长度
 * @return {Number}
 */
function minInds( str, max ) {
    let _i = 0;

    for ( ; _i < max; _i++ ) {
        if ( !/[ \t]/.test(str[_i]) ) break;
    }
    return _i;
}


/**
 * 空格缩进替换。
 * 包含前导的缩进和文内的Tab键。
 * @param  {String} text 源文本（单行）
 * @param  {Number} tabs Tab空格数，可选
 * @return {String} 处理后的文本
 */
function tabToSpace( text, tabs = 4 ) {
    let _buf = [],
        _s1 = '',
        _s2 = text;

    while ( _s2 ) {
        [_s1, _s2] = tabSplit( _s2 );
        if ( _s2 ) {
            _s1 = _s1 + ' '.repeat(tabs - halfWidth(_s1)%tabs);
            if ( _s2 === true ) _s2 = null;
        }
        _buf.push( _s1 );
    }
    return _buf.join( '' );
}



//
// 导出函数集。
//////////////////////////////////////////////////////////////////////////////


/**
 * 按半角宽度计数。
 * 浏览器Tab默认宽度8个半角字符。
 * @param  {String} str 单行字符串
 * @return {Number} 折合半角数
 */
export function halfWidth( str ) {
    let _n = 0;

    for ( const ch of str ) {
        if ( ch === '\t' ) {
            _n += (8 - _n%8);
            continue;
        }
        _n += ch.codePointAt(0) >= __fullBegin || __fullChs.has(ch) ? 2 : 1;
    }
    return _n;
}


/**
 * 查找并返回最短缩进。
 * @param  {[String]} ss 文本行集
 * @return {String} 最短的缩进字符串
 */
export function shortIndent( ss ) {
    let _len = Infinity;

    for ( const str of ss ) {
        _len = minInds( str, _len );
        if ( !_len ) return 0;
    }
    return _len;
}


/**
 * 获取行文本的前端缩进序列。
 * 前端缩进字符仅限于空格和Tab字符。
 * @param  {String} line 行文本
 * @return {String}
 */
export function indentedPart( line ) {
    return line.substring( 0, minInds(line, Infinity) );
}


/**
 * 制表符对应空格序列。
 * 如果n不为数字，表示不替换，返回一个真实的Tab符。
 * @param  {String} line 插入点前段文本
 * @param  {Number} n Tab对应空格数
 * @return {String} 空格序列或Tab
 */
export function tabSpaces( line, n ) {
    return n > 0 ? ' '.repeat( n - halfWidth(line)%n ) : '\t';
}


/**
 * 获取光标所在行/段。
 * 主要用于向当前位置插入Tab的空格序列（结合.halfWidth）。
 * 适用光标在顶层（非子元素内）。
 * 段标识flag：
 * - true   获取前段。
 * - false  获取后段。
 * - void   获取整行。
 * 注意：
 * 检索范围内的<br>需要被预先处理（转为换行字符）。
 * @param  {Range} rng 范围对象（当前光标）
 * @param  {Boolean|void} flag 取段标识，可选
 * @param  {Element} box 限定根容器
 * @return {String} 行前段文本
 */
export function rangeTextLine( rng, flag, box ) {
    let _node = rng.startContainer,
        _idx = rng.startOffset;

    if ( _node === box ) {
        _node = $.contents( _node, _idx );
    }
    if ( flag ) {
        return cursorPrev( _node, _idx, '\n' )[0];
    }
    if ( flag === false ) {
        return cursorNext( _node, _idx, '\n' )[0];
    }
    return cursorPrev(_node, _idx, '\n')[0] + cursorNext(_node, _idx, '\n')[0];
}


/**
 * 解析获取高亮代码配置集。
 * 无语言定义时会自动将源码进行HTML转换。
 * @param  {[String]} codes 源码（行）集
 * @param  {String} lang 所属语言
 * @param  {Number} tab  Tab 空格数，可选
 * @return {[Object2|Object2x]} 高亮解析结果集
 */
export function highLight( codes, lang, tab ) {
    if ( tab > 0 ) {
        codes = codes.map( s => tabToSpace(s, tab) );
    }
    codes = codes.join( '\n' );

    return lang ? new Hicolor(codes, lang).effect() : [{text: $.html(codes)}];
}