//! $Id: html.js 2021.01.25 Articlejs.Plugins.hlcolor $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  XML/HTML语言的高亮配置实现。
//
//  主要包含标签名、属性名、属性值（字符串）和注释段。
//  另外还有代码块（<![CDATA[...]]>）和实体（如 &gt;）。
//
//  说明：
//  标签名不再检查是否为HTML规范中的具体名称，只要满足格式即认可（< 开头）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, reWords } from "../base.js";


const
    // 标签名
    xmltag = reWords(`
        DOCTYPE
        a abbr address area article aside audio
        b base bdi bdo blockquote body br button
        canvas caption cite code col colgroup content
        data datalist dd del details dfn dialog div dl dt
        em embed
        fieldset figcaption figure footer form
        h1 h2 h3 h4 h5 h6 head header hgroup hr html
        i iframe img input ins
        kbd keygen
        label legend li link
        main map mark menu menuitem meta meter
        nav noscript
        object ol optgroup option output
        p param picture pre progress
        q
        rb rp rt rtc ruby
        s samp script section select slot small source span strong style sub summary sup
        table tbody td textarea tfoot th thead time title tr track template
        u ul
        var video
        wbr
    `);



class HTML extends Hicode {

    constructor() {
        super([
            {
                type:   'comments',
                begin:  /^<!--[^]*?-->/,
                handle: htmlEscape,
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
                type:   'xmltag',
                // 起始标签
                begin:  /^<(\w[\w-]*)/,
                handle: (_, $1) => [ {text: '<'}, $1 ],
            },
            {
                type:   'xmltag',
                // 结束标签
                begin:  /^(<\/)(\w[\w-]*)/,
                handle: (_, $1, $2) => [ {text: $1}, $2 ],
            },
            {
                type:   'important',
                begin:  /^<!\[CDATA\[[^]+?\]\]>/i,
                handle: htmlEscape,
            }
        ]);
    }
}


//
// 标签内属性解析器。
// 分解出属性和字符串属性值、以及样式属性内的CSS语法。
//
class Attr extends Hicode {
    //
}


function tagName( txt ) {
    //
}


export { HTML };
