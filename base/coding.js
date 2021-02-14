//! $Id: coding.js 2020.02.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码编辑基本工具集。
//
//  支持代码编辑中常见的基本友好操作，如：
//  - 换行保持相同的缩进。
//  - 退格键删除前一个缩进而不仅仅是单个字符（可能为多个空格）。
//  - Tab键会根据设置替换为多个空格。
//  - 当前行或划选内容转换为注释（需高亮插件支持）。
//
//  编辑辅助：
//  根据当前光标点（Range）获取当前行中的需重新渲染的文本段。
//  也即提取 Hicode.parse() 中的 code 实参。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$,

    // 全角字符码值起始
    // 字符：⅏ （概略）。
    __fullBegin = 0x214f,

    // 零星全角字符排除。
    // 仅限 0x214f 以内（概略）。
    __fullChs = new Set( 'ೠೡೢೣൕൖൗ൘൙൚൛൜൝൞ൟൠൡൢൣ൧൨൩൪൫൬൭൮൯൰൱൲൳൴൵൶൷൸൹ൺൻർൽൾൿ᳓᳔᳕᳖᳗᳘᳙᳜᳝᳞᳟᳚᳛᳠ᳩᳪᳫᳬ᳭⁇※‱℃'.split('') );


//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 检查获取最小缩进量。
 * @param  {String} str 待检查字符串
 * @param  {Number} max 最大检查长度
 * @return {Number}
 */
function minInds( str, max ) {
    let _i = 0;

    for ( ; _i < max; _i++ ) {
        if ( !/\s/.test(str[_i]) ) break;
    }
    return _i;
}


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

    return _i < 0 ? [_s] : [_s.substring(0, _i), true];
}


/**
 * 光标前段检索。
 * 向前逐节点平级检索，直到发现换行符。
 * 以范围起点为起点。
 * 注记：
 * 仅限于光标最近容器节点内检索。
 * @param  {Range} rng 范围对象（当前光标）
 * @param  {String} end 终止字符
 * @return {String, Boolean} [行前段文本, 以换行结束]
 */
function cursorPrev( rng, end ) {
    let _node = rng.startContainer,
        _idx = rng.startOffset,
        _buf = [];

    while ( _node ) {
        let [s, ok] = partBefore( _node, _idx, end );
        _buf.push( s );
        _idx = Infinity;

        if ( ok ) break;
        _node = _node.previousSibling;
    }
    return [ _buf.reverse().join(''), !_node ];
}


/**
 * 光标后段检索。
 * 向后逐节点平级检索，直到发现换行符。
 * 以范围起点（而非终点）为起点。
 * 注记：（同前）。
 * @param  {Range} rng 范围对象（当前光标）
 * @param  {String} end 终止字符
 * @return {String, Boolean} [后前段文本, 以换行结束]
 */
function cursorNext( rng, end ) {
    let _node = rng.startContainer,
        _idx = rng.startOffset,
        _buf = [];

    while ( _node ) {
        let [s, ok] = partAfter( _node, _idx, end );
        _buf.push( s );
        _idx = 0;

        if ( ok ) break;
        _node = _node.nextSibling;
    }
    return [ _buf.join(''), !_node ];
}



//
// 导出函数集。
//////////////////////////////////////////////////////////////////////////////


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
 * 空格缩进替换。
 * 包含前导的缩进和文内的Tab键。
 * @param  {String} text 源文本（单行）
 * @param  {Number} tabs Tab空格数，可选
 * @return {String} 处理后的文本
 */
export function tabToSpace( text, tabs = 4 ) {
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


/**
 * 获取光标所在行（段）。
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
 * @return {String} 行前段文本
 */
export function rangeTextLine( rng, flag ) {
    if ( flag ) {
        return cursorPrev(rng, '\n')[0];
    }
    if ( flag === false ) {
        return cursorNext(rng, '\n')[0];
    }
    return cursorPrev(rng, '\n')[0] + cursorNext(rng, '\n')[0];
}


/**
 * 获取光标所在单词。
 * 主要用于代码语法即时解析。
 * @param  {Range} rng 范围对象（光标点）
 * @return {String} 当前单词
 */
export function rangeWord( rng ) {
    //
}


/**
 * 提取需要重新分析的代码段。
 * 注：用于代码编辑时的实时着色辅助。
 * @param  {Range} rng 光标点范围
 * @return {String}
 */
export function dirtyPart( rng ) {
    //
}
