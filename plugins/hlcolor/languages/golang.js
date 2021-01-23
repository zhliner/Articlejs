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


//
// 无需定制实现，
// 简单继承即可。
//
class Go extends Hicode {
    /**
     * 传递匹配集构造。
     * 注意：
     * 匹配按顺序测试，因此需要注意定义的顺序。
     * 语言特定的操作符可能更复杂，需要放在基础集之前。
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
                begin: [RE.COMMENTS],
                type:  'comments'
            },
            {
                begin: [RE.COMMENT_B],
                type:  'comments'
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
                // 基础集缺失补充
                begin: [/^(&\^|:=)/],
                type:  'operator'
            },
            {
                begin: [RE.OPERATOR],
                type:  'operator'
            },
        ]);
    }
}


export { Go };
