//! $Id: css.js 2021.01.19 Articlejs.Plugins.hlcolor $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  C/C++ 语言的高亮配置/实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, reWords, stringEscape } from "../base.js";


const
    // 字面量
    literal = /^(true|false|nullptr|NULL)\b/,

    // 数据类型
    datatype = /^(int|float|char|bool|long|short|double|atomic_bool|atomic_char|atomic_schar|atomic_uchar|atomic_short|atomic_ushort|atomic_int|atomic_uint|atomic_long|atomic_ulong|atomic_llong|atomic_ullong)\b/,

    // 关键字
    keyword = reWords(`
        while private catch import module export virtual operator sizeof typedef const struct for union namespace
        unsigned volatile static protected template mutable if public friend
        do goto auto void enum else break extern using class asm case typeid
        default register explicit signed typename try this switch continue inline delete alignof constexpr decltype
        noexcept static_assert thread_local restrict _Bool complex _Complex _Imaginary new throw return
    `),

    // 内置函数&对象
    built_in = reWords(`
        std string cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream
        auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set
        unordered_map unordered_multiset unordered_multimap array shared_ptr abort abs acos
        asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp
        fscanf isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper
        isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow
        printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp
        strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan
        vfprintf vprintf vsprintf endl initializer_list unique_ptr
    `);


class CPP extends Hicode {

    constructor() {
        super([
            {
                type:   'keyword',
                begin:  keyword,
            },
            {
                type:   'literal',
                begin:  literal,
            },
            {
                type:   'datatype',
                begin:  datatype,
            },
            {
                type:   'builtin',
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
                type:   'string',
                begin:  RE.STRING,
                handle: stringEscape,
            },
            {
                // 原生字符串
                type:   'string',
                begin:  /^R"\([^]*\)"/,
                handle: htmlEscape,
                block:  [ 'R"(', ')"' ],
            },
            {
                type:   'number',
                begin:  RE.NUMBER_B,
            },
            {
                type:   'number',
                begin:  RE.NUMBER_C,
            },
            {
                type:   'operator',
                begin:  RE.OPERATOR,
                handle: htmlEscape,
            },
        ]);
    }
}


export { CPP };
