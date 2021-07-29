//! $Id: javascript.js 2021.01.19 Articlejs.Plugins.hlcolor $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  JavaScript语言的高亮配置/实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, reWords } from "../base.js";


const
    literal = /^(true|false|null|undefined|NaN|Infinity)\b/,

    keyword = reWords(`
        in of if for while finally var new function do return void else break catch
        instanceof with throw case default try this switch continue typeof delete
        let yield const export super debugger as async await static
        import from as
    `),

    built_in = reWords(`
        eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent
        encodeURI encodeURIComponent escape unescape Object Function Boolean Error
        EvalError InternalError RangeError ReferenceError StopIteration SyntaxError
        TypeError URIError Number Math Date String RegExp Array Float32Array
        Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array
        Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require
        module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect
        Promise
    `);


class JavaScript extends Hicode {

    constructor() {
        super([
            {
                type:   'keyword',
                begin:  keyword,
            },
            {
                type:   'keyword',
                // class extends
                begin:  /^/,
            },
            {
                type:   'literal',
                begin:  literal,
            },
            {
                type:   'function',
                begin:  built_in,
            },
            {
                type:   'comments',
                begin:  RE.COMMENTS,
                handle: htmlEscape,
            },
            {
                type:   'comments',
                begin:  RE.COMMENT_B,
                handle: htmlEscape,
                block:  [ '/*', '*/' ]
            },
            {
                // 在字符串匹配之前。
                type:   'important',
                begin:  /^['"]use (strict|asm)['"]/,
            },
            {
                type:   'string',
                begin:  RE.STRING,
                handle: htmlEscape,
            },
            {
                type:   'string',
                begin:  RE.STRING_1,
                handle: htmlEscape,
            },
            {
                // 原生字符串
                // handle 需处理内部 ${} 结构。
                type:   'string',
                begin:  RE.STRING_RAW,
                handle: null,
                block:  [ '`', '`' ]
            },
            {
                type:   'regex',
                begin:  /^\/[^/].*\/[gimsuy]*/,
            },
            {
                // 基础集缺失补充
                type:   'operator',
                begin:  /^(===)/,
                handle: htmlEscape,
            },
            {
                type:   'operator',
                begin:  RE.OPERATOR,
                handle: htmlEscape,
            },
        ]);
    }
}


export { JavaScript };
