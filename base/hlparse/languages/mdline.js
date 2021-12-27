//! $ID: mdline.js 2021.12.23 Cooljed.HLParse $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  MarkDown 单行语法。
//
//  - 仅支持单标记，需要多个标签封装的复合标记不被支持。
//      如：
//      ***XXX*** => <strong><em>XXX</em></strong>
//
//  - 仅支持内容行顶层的标记，嵌套标记不被支持。
//      如：
//      **重要`代码`在这里**
//      [![链接图片](img-url)](a-href)
//
//  - 部分内联的文本类标签嵌入有效，但其它标签被视为纯文本。
//      如：
//      Press the <kbd>P</kbd> character to open the properties dialog.<br>
//      其中<kbd>有效，但末尾的<br>不被支持。
//
//
//  主要用于用户在 Cooljed 编辑器中粘贴从 .md 文件中拷贝而来的代码。
//  如果标记较为复杂，用户应当清除它们转而使用编辑器的功能。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, htmlEscape } from "../base.js";


//
// type:
// - strong:    **xx**
// - em:        *xx*
// - code:      `xxx`、``xxx`yy`zz``
// - img:       ![alt](url "title"?)
// - a:         [xxx](url "title"?)、<url>
//
class MdLine extends Hicode {
    /**
     * 传递匹配集构造。
     * - type为标签名，对匹配文本进行源码（html）封装。
     * - 没有type定义时，简单视为源码，无需封装。
     */
    constructor() {
        super([
            {
                type:   'strong',
                begin:  /^\*\*(.+?)\*\*/,
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                type:   'em',
                begin:  /^\*(.+?)\*/,
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                type:   'code',
                begin:  /^``(.+?)``/,   // ``xxx`yy`zz``
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                type:   'code',
                begin:  /^`(.+?)`/,   // `xxx`
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                // type:   'img',
                // ![alt](url "title"?)
                begin:  /^!\[(.*?)\]\(\s*([^\s\n\r]+)(?:\s+(["'])(.*?)\3)?\s*\)/,
                handle: (_, $1, $2, $3, $4) => `<img src="${$2}" alt="${htmlEscape($1)}"${$4 ? ` title="${htmlEscape($4)}"` : ''} />`,
            },
            {
                // type:   'a',
                // [xxx](url "title"?)
                begin:  /^\[(.*?)\]\(\s*([^\s\n\r]+)(?:\s+(["'])(.*?)\3)?\s*\)/,
                handle: (_, $1, $2, $3, $4) => `<a href="${$2}"${$4 ? ` title="${htmlEscape($4)}"` : ''}>${htmlEscape($1)}</a>`,
            },
            {
                // type:   'a',
                // <url>
                begin:  /^<((?:https?|ftps?):\/\/[^\s\n\r]+)>/,
                handle: (_, $1) => `<a href="${$1}">${htmlEscape($1)}</a>`,
            },

            // 内联标签内嵌支持（部分）
            {
                // type: '...',
                // 单纯的标签封装有效，不支持元素特性定义。
                begin:  /^<(q|abbr|del|ins|dfn|bdo|time|cite|small|sub|sup|mark|samp|kbd|s|u|var|code|strong|em)>(.+?)<\/\1>/,
                handle: (_, $1, $2) => `<${$1}>${$2}</${$1}>`
            }

        ]);
    }
}

export { MdLine };
