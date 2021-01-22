//! $Id: hlcolor/languages/golang.js 2021.01.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Go语言的高亮配置/实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE } from "../base.js";


const
    // 关键字
    keyword = /^(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,

    // 字面量
    literal = /^(true|false|iota|nil)\b/,

    // 数据类型
    datatype = /^(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|complex128|complex64|bool|byte|rune|string|error)\b/,

    // 内建函数
    built_in = /^(make|len|cap|new|append|copy|close|delete|complex|real|imag|panic|recover)\b/;


class Go extends Hicode {
    /**
     * 传递匹配集构造。
     */
    constructor() {
        super([
            {
                begin: [keyword],
                type:  'keyword'
            },
            {
                begin: [literal],
                type:  'literal'
            },
            {
                begin: [datatype],
                type:  'datatype'
            },
            {
                begin: [built_in],
                type:  'function'
            },
            {
                begin: [RE.STRING],
                type:  'string'
            },
            {
                begin: [/^('.*[^\\]')/],
                type:  'number'  // rune
            },
            {
                begin: [RE.NUMBER_B],
                type:  'number'
            },
            {
                begin: [RE.NUMBER_C],
                type:  'number'
            },
            {
                begin: [RE.OPERATOR],
                type:  'operator'
            },
            {
                begin: [/&\^/],
                type:  'operator'
            }
        ]);
    }
}


export { Go };
