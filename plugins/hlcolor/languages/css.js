//! $Id: css.js 2021.01.19 Articlejs.Plugins.hlcolor $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  CSS样式表的高亮配置/实现。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, reWords } from "../base.js";
import { Hicolor } from "../main.js";


const
    // 标签名
    xmltag = reWords(`
        a abbr address area article aside audio
        b base bdi bdo blockquote body br button
        canvas caption cite code col colgroup
        datalist dd del details dfn div dl dt
        em embed
        fieldset figcaption figure footer form
        h1 h2 h3 h4 h5 h6 head header hgroup hr html
        i iframe img input ins
        kbd keygen
        label legend li link
        main map mark menu menuitem meter
        nav noscript
        object ol optgroup option output
        p param picture pre progress
        q
        rp rt ruby
        s samp script section select small source span strong style sub summary sup
        table tbody td textarea tfoot th thead time title tr track
        u ul
        var video
        wbr
    `),


    // 属性名
    attribute = reWords(`
        align-content
        align-items
        align-self
        animation
        animation-delay
        animation-direction
        animation-duration
        animation-fill-mode
        animation-iteration-count
        animation-name
        animation-play-state
        animation-timing-function
        auto
        backface-visibility
        background-attachment
        background-clip
        background-color
        background-image
        background-origin
        background-position
        background-repeat
        background-size
        background
        border-bottom-color
        border-bottom-left-radius
        border-bottom-right-radius
        border-bottom-style
        border-bottom-width
        border-bottom
        border-collapse
        border-color
        border-image-outset
        border-image-repeat
        border-image-slice
        border-image-source
        border-image-width
        border-image
        border-left-color
        border-left-style
        border-left-width
        border-left
        border-radius
        border-right-color
        border-right-style
        border-right-width
        border-right
        border-spacing
        border-style
        border-top-color
        border-top-left-radius
        border-top-right-radius
        border-top-style
        border-top-width
        border-top
        border-width
        border
        bottom
        box-decoration-break
        box-shadow
        box-sizing
        break-after
        break-before
        break-inside
        caption-side
        clear
        clip
        clip-path
        color
        column-count
        column-fill
        column-gap
        column-rule-color
        column-rule-style
        column-rule-width
        column-rule
        column-span
        column-width
        columns
        content
        counter-increment
        counter-reset
        cursor
        direction
        display
        empty-cells
        filter
        flex-basis
        flex-direction
        flex-flow
        flex-grow
        flex-shrink
        flex-wrap
        flex
        float
        font-family
        font-feature-settings
        font-kerning
        font-language-override
        font-size-adjust
        font-size
        font-stretch
        font-style
        font-variant-ligatures
        font-variant
        font-weight
        font
        gap
        grid-area
        grid-auto-columns
        grid-auto-flow
        grid-auto-rows
        grid-column-end
        grid-column-start
        grid-column
        grid-row-end
        grid-row-start
        grid-row
        grid-template-areas
        grid-template-columns
        grid-template-rows
        grid-template
        grid
        height
        hyphens
        icon
        image-orientation
        image-rendering
        image-resolution
        ime-mode
        inherit
        initial
        justify-content
        left
        letter-spacing
        line-height
        list-style-image
        list-style-position
        list-style-type
        list-style
        margin-bottom
        margin-left
        margin-right
        margin-top
        margin
        marks
        mask
        max-height
        max-width
        min-height
        min-width
        nav-down
        nav-index
        nav-left
        nav-right
        nav-up
        none
        normal
        object-fit
        object-position
        opacity
        order
        orphans
        outline-color
        outline-offset
        outline-style
        outline-width
        outline
        overflow-wrap
        overflow-x
        overflow-y
        overflow
        padding-bottom
        padding-left
        padding-right
        padding-top
        padding
        page-break-after
        page-break-before
        page-break-inside
        perspective-origin
        perspective
        pointer-events
        position
        quotes
        resize
        right
        row-gap
        tab-size
        table-layout
        text-align-last
        text-align
        text-decoration-color
        text-decoration-line
        text-decoration-style
        text-decoration
        text-indent
        text-overflow
        text-rendering
        text-shadow
        text-transform
        text-underline-position
        top
        transform-origin
        transform-style
        transform
        transition-delay
        transition-duration
        transition-property
        transition-timing-function
        transition
        unicode-bidi
        vertical-align
        visibility
        white-space
        widows
        width
        word-break
        word-spacing
        word-wrap
        z-index
    `,
    // 属性名后必须跟随冒号（:）
    '(?=:)' ),


    // 普通跳过匹配。
    __reSkip = /^([a-zA-Z][\w-]*|\s\s+)/;



class CSS extends Hicode {

    constructor() {
        super([
            {
                type:   'xmltag',
                begin:  xmltag,
            },
            {
                type:   'comments',
                begin:  RE.COMMENT_B,
                handle: htmlEscape,
                block:  [ '/*', '*/' ]
            },
            {
                type:   'selector',
                // id, class, ::pseudo, :pseudo
                begin:  /^(#\w[\w-]*|\.[\w-]+|::?[\w+()"'.-]+)\b/,
            },
            {
                type:   'selector',
                // 属性选择器
                // 提取如 [data-pbo~=fulled] 中的 data-pbo 和 ~=
                begin:  /^\[([\w-]+)(?:(=|~=|\|=|\^=|\$=|\*=)(.+?\]))/,
                // 3段匹配：
                handle: (_, $1, $2, $3) => [
                        { text: '[' },
                        $1,
                        $2 && { type: 'operator', text: $2 },
                        $3 && { text: $3 }
                    ],
            },
            // 属性定义子语法块
            {
                // type:   null,
                begin:  /^\{([^]*?)\}/,
                handle: (_, $1) => [ '{', new Hicolor( $1, new CSSAttr() ), '}' ],
            },

        ], __reSkip );
    }
}


//
// 属性子语法块。
// 即花括号（{...}）内的部分。
//
class CSSAttr extends Hicode {

    constructor() {
        super([
            {
                type:   'attribute',
                begin:  attribute,
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
                handle: htmlEscape,
            },
            {
                type:   'string',
                begin:  RE.STRING_1,
                handle: htmlEscape,
            },
            {
                type:   'unit',
                begin:  /^%|^(em|ex|ch|fr|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)\b/,
            },
            {
                type:   'number',
                begin:  RE.NUMBER_C,
            },
            {
                type:   'rgba',
                // #rrggbb, #rgb, #rrggbbaa
                begin:  /^#(?:[0-9A-F]{3}|[0-9A-F]{6}(?:[0-9A-F]{2})?)\b/i,
            },
            {
                type:   'operator',
                // 组合选择器操作符
                begin:  /^(>|\+|~)/,
            },
            {
                type:   'function',
                // 如 rgb(128.0, 128, 128, 0.6)
                begin:  /^(\w+)\((.*)\)/,
            },
            {
                type:   'important',
                begin:  /^(!important|@\w[\w-]*)\b/,
            },

        ], __reSkip);
    }
}


//
// CSSAttr 导出分享
// 可用于HTML解析中的内联样式标记。
//
export { CSS, CSSAttr };
