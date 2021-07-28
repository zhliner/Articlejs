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


const
    // 标签名
    xmltag = reWords(`
        a abbr address area article aside audio
        b base bdi bdo blockquote body br button
        canvas caption cite code col colgroup
        data datalist dd del details dfn div dl dt
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
        table tbody td template textarea tfoot th thead time title tr track
        u ul
        var vide
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
        background
        background-attachment
        background-clip
        background-color
        background-image
        background-origin
        background-position
        background-repeat
        background-size
        border
        border-bottom
        border-bottom-color
        border-bottom-left-radius
        border-bottom-right-radius
        border-bottom-style
        border-bottom-width
        border-collapse
        border-color
        border-image
        border-image-outset
        border-image-repeat
        border-image-slice
        border-image-source
        border-image-width
        border-left
        border-left-color
        border-left-style
        border-left-width
        border-radius
        border-right
        border-right-color
        border-right-style
        border-right-width
        border-spacing
        border-style
        border-top
        border-top-color
        border-top-left-radius
        border-top-right-radius
        border-top-style
        border-top-width
        border-width
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
        column-rule
        column-rule-color
        column-rule-style
        column-rule-width
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
        flex
        flex-basis
        flex-direction
        flex-flow
        flex-grow
        flex-shrink
        flex-wrap
        float
        font
        font-family
        font-feature-settings
        font-kerning
        font-language-override
        font-size
        font-size-adjust
        font-stretch
        font-style
        font-variant
        font-variant-ligatures
        font-weight
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
        list-style
        list-style-image
        list-style-position
        list-style-type
        margin
        margin-bottom
        margin-left
        margin-right
        margin-top
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
        outline
        outline-color
        outline-offset
        outline-style
        outline-width
        overflow
        overflow-wrap
        overflow-x
        overflow-y
        padding
        padding-bottom
        padding-left
        padding-right
        padding-top
        page-break-after
        page-break-before
        page-break-inside
        perspective
        perspective-origin
        pointer-events
        position
        quotes
        resize
        right
        tab-size
        table-layout
        text-align
        text-align-last
        text-decoration
        text-decoration-color
        text-decoration-line
        text-decoration-style
        text-indent
        text-overflow
        text-rendering
        text-shadow
        text-transform
        text-underline-position
        top
        transform
        transform-origin
        transform-style
        transition
        transition-delay
        transition-duration
        transition-property
        transition-timing-function
        unicode-bidi
        vertical-align
        visibility
        white-space
        widows
        width
        word-break
        word-spacing
        word-wrap
        z-inde
    `);


class CSS extends Hicode {

    constructor() {
        super([
            {
                type:   'xmltag',
                begin:  xmltag,
            },
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
                begin:  /^(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)\b/,
            },
            {
                type:   'number',
                begin:  RE.NUMBER_C,
            },
            {
                type:   'selector',
                // id, class, ::pseudo, :pseudo
                begin:  /^(#[\w-]+|\.[\w-]+|::?[\w+()"'.-]+)\b/,
            },
            {
                type:   'selector',
                // 属性&组合 选择器操作符
                begin:  /^(=|~=|\|=|\^=|\$=|\*=|>|\+|~)/,
            },
            {
                type:   'function',
                // 如 rgb(128.0, 128, 128, 0.6)
                begin:  /^(\w+)\((.*)\)/,
            },
            {
                type:   'rgba',
                // #rrggbb, #rgb, #rrggbbaa
                begin:  /^#(?:[0-9A-F]{3}|[0-9A-F]{6}(?:[0-9A-F]{2})?)$/i,
            },
            {
                type:   'important',
                begin:  /^!important\b/,
            }
        ]);
    }
}


export { CSS };
