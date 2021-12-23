//! $ID: highlight.js 2020.02.07 Cooljed.Libs $
//+++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮着色渲染工具集。
//  将代码高亮解析器（hlparse/）解析的结果进行HTML封装。
//
//  跨行语法：
//  代码表中的单行如果包含跨行的语法，则该语法通常会不完整。
//  这样的语法有：块注释、JS的模板字符串、其它语言的多行字符串等。
//
//  考虑简单性，微编辑确认并不重新解析代码，如果代码着色不准确，
//  用户可以选取整块代码，打开属性对话框重新设置即可。
//
//  注记：
//  渲染之后的HTML结构规范，不存在元素属性值中包含换行符的情况。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import * as T from "./types.js";
import { create } from "./create.js";


const
    // 高亮名:角色映射。
    // 高亮名用于具体语言中使用，角色名用于封装元素<b>中的role值。
    // 此处的高亮名用于语言实现中的规范名称（type）。
    __Roles = {
        'keyword':      'kw',   // 关键字
        'literal':      'lit',  // 字面值（如 true, iota）
        'number':       'num',  // 数值
        'function':     'fn',   // 函数名
        'operator':     'op',   // 运算&操作符
        'builtin':      'bin',  // 内置
        'datatype':     'dt',   // 数据类型
        'xmltag':       'tag',  // 标签名
        'attribute':    'atn',  // 属性名（attribute-name）
        'regex':        're',   // 正则表达式
        'selector':     'slr',  // 选择器（ID, class, 伪类）
        'rgba':         'rgb',  // RGB, RGBA: #fff, #f0f0f0, #999
        'unit':         'un',   // CSS单位
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释（单独封装）
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 字符串类型名。
    __strName = 'string',

    // 注释类型名。
    __cmtName = 'comments';



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 代码着色封装。
 * @param  {String} text 待封装文本
 * @param  {String} type 代码类型名
 * @return {String} 封装的源码
 */
function colorCode( text, type ) {
    if ( type == null ) {
        return text;
    }
    if ( type == __strName ) {
        return `<s>${text}</s>`;
    }
    if ( type == __cmtName ) {
        return `<i>${text}</i>`;
    }
    return `<b role="${__Roles[type] || __nonRole}">${text}</b>`;
}


/**
 * 添加一段源码。
 * @param  {Element} code 代码容器元素
 * @param  {String} text 待封装文本行
 * @param  {String} type 代码类型
 * @return {Element} code 容器元素
 */
function addCode( code, text, type ) {
    $.html(
        code,
        colorCode( text, type ),
        // 接续前源码
        'append'
    );
    return code;
}


/**
 * 结果集渲染。
 * 主要用于特定类型之内的子块，如字符串或注释内的子语法解析。
 * @param  {[Object3]} objs 解析结果集
 * @return {String} 渲染源码
 */
function textSubs( objs ) {
    return objs.map(
            o =>
            typeof o === 'string' ? o : colorCode( o.text, o.type )
        ).join( '' );
}


/**
 * 子块首尾换行清除。
 * 在一个新的子语法块的两端，如果是一个单纯的换行，则清除之。
 * 避免代码表将之视为一个空行。
 * @param {[Object3|Object2]} objs 解析结果集
 */
function trimNL( objs ) {
    let _o1 = objs[ 0 ],
        _o2 = objs[ objs.length-1 ];

    if ( _o1.text && _o1.text.startsWith('\n') ) {
        _o1.text = _o1.text.substring( 1 );
    }
    if ( _o2.text && _o2.text.endsWith('\n') ) {
        _o2.text = _o2.text.slice( 0, -1 );
    }
    return objs;
}



//
// 导出函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 代码块高亮源码构建。
 * Object: { text, type? }
 * @param  {Object} obj 解析结果对象集
 * @param  {Element} code 代码容器元素（<code>）
 * @return {[Element]} HTML高亮源码
 */
export function htmlBlock( obj, code ) {
    let {text, type} = obj;

    if ( $.isArray(text) ) {
        text = textSubs( text );
    }
    // 着色子块封装
    return [ addCode(code, text, type) ];
}


/**
 * 代码表高亮源码构建。
 * 返回值依然以换行符连接，用于代码表按行切分。
 * Object: {
 *      text, type
 * }
 * @param  {Object} obj 解析结果对象集
 * @param  {Element} code 代码容器元素（<code>）
 * @return {[Element]} 容器元素集（[<code>]）
 */
export function htmlList( obj, code ) {
    let {text, type} = obj,
        _text = $.isArray(text) ? textSubs(text) : text,
        _rows = _text.split( '\n' );

    return [
        addCode( code, _rows.shift(), type ),
        ..._rows.map( txt => addCode(code.cloneNode(), txt, type) )
    ];
}


/**
 * HTML高亮源码渲染封装。
 * 将解析结果对象中的文本进行封装，如果有内嵌子块，则递进处理。
 * Object2: {
 *      text, type?
 * }
 * 实参 Object2x: {
 *      lang: 子块语言，可选
 *      data: 子块解析集（{[Object2|Object2x]}）
 * }
 * 返回值：
 * String: 已渲染源码（<b>,<s>,<i>, #text）。
 * Object2: {
 *      lang: 子块语言
 *      data: 子块源码集（{[String|Object2]）
 * }
 * @param  {String} lang 所属语言
 * @param  {[Object2|Object2x]} objs 解析结果集
 * @param  {Function} wrap 封装函数（htmlBlock|htmlList）
 * @return {[Element]} 封装元素集（[<code>]）
 */
export function codeWraps( lang, objs, wrap ) {
    let _buf = [],
        _box = create( T.CODE, {lang} );

    for ( const o of objs ) {
        if ( o.text !== undefined ) {
            _buf.push( ...wrap(o, _box) );
            _box = _buf[ _buf.length-1 ];
            continue;
        }
        _buf.push( ...codeWraps(o.lang, trimNL(o.data), wrap) );
        // 子块结束，
        // 开启一个同语种新容器。
        _box = create( T.CODE, {lang} );
    }
    // 通常有重复，唯一化
    return [...new Set(_buf)].filter( el => !el.normalize() );
}
