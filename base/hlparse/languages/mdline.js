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
//  - 仅支持内容行顶层的标记，嵌套标记不被支持。
//      如：
//      **重要`代码`在这里**
//      [![链接图片](img-url)](a-href)
//
//  - 部分内联的文本类标签有效，其它标签被视为文本。
//      如：
//      The <kbd>P</kbd> character for open the <b>properties</b> dialog.
//      其中<kbd>有效，但<b>不被支持。
//
//  - 支持的部分内联标签也仅限于顶层，嵌套的标签不被支持。
//      如：
//      This is <strong><em>IMPORTANT</em></strong>.
//      内嵌的<em>无效，将视为纯文本的<em>字符串。
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
// - strong:    **xx**, __xx__
// - em:        *xx*, _x_
// - strong/em: ***xx***, ___xx___
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
            // 转义处理（最先匹配）
            // 仅需排除内联支持的MD特殊字符。
            {
                // type: none
                begin:  /^\\([*`_![])/,
                handle: (_, $1) => $1
            },
            {
                // <strong><em>
                type:   'strong',
                begin:  /^(\*\*\*|___)([^*_]+?)\1/,
                handle: (_, $1, $2) => `<em>${htmlEscape($2)}</em>`,
            },
            {
                type:   'strong',
                begin:  /^(\*\*|__)([^*_]+?)\1/,
                handle: (_, $1, $2) => htmlEscape( $2 ),
            },
            {
                type:   'em',
                begin:  /^(\*|_)([^*_]+?)\1/,
                handle: (_, $1, $2) => htmlEscape( $2 ),
            },
            {
                type:   'code',
                begin:  /^``\s?(.+?)\s?``/,   // ``xxx`yy`zz``
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                type:   'code',
                begin:  /^`\s?([^`]+?)\s?`/,   // `xxx`
                handle: (_, $1) => htmlEscape( $1 ),
            },
            {
                // type: 'img',
                // ![alt](url "title"?)
                begin:  /^!\[(.*?)\]\(\s*([^\s\n\r]+)(?:\s+(["'])(.*?)\3)?\s*\)/,
                handle: (_, $1, $2, $3, $4) => `<img src="${$2}" alt="${htmlEscape($1)}"${$4 ? ` title="${htmlEscape($4)}"` : ''} />`,
            },
            {
                // type: 'a',
                // [xxx](url "title"?)
                begin:  /^\[(.*?)\]\(\s*([^\s\n\r]+)(?:\s+(["'])(.*?)\3)?\s*\)/,
                handle: (_, $1, $2, $3, $4) => `<a href="${$2}"${$4 ? ` title="${htmlEscape($4)}"` : ''}>${htmlEscape($1)}</a>`,
            },
            {
                // type: 'a',
                // <url>
                begin:  /^<((?:https?|ftps?):\/\/[^\s\n\r]+)>/,
                handle: (_, $1) => `<a href="${$1}">${htmlEscape($1)}</a>`,
            },

            // 内联标签支持（部分）
            {
                // type: none,
                // 单纯的标签封装有效，不支持元素特性定义。
                // 仅顶层有效，内嵌的标签会被文本化。
                begin:  /^<(q|abbr|del|ins|dfn|bdo|time|cite|small|sub|sup|mark|samp|kbd|s|u|var|code|strong|em)>(.+?)<\/\1>/,
                handle: (_, $1, $2) => `<${$1}>${htmlEscape($2)}</${$1}>`
            },

            // HTML 实体
            // 原样保留无需处理。
            {
                // type: none,
                begin: /^&(\w+|#\d+|#x[0-9a-fA-F]+);/
            }

        ]);
    }
}

export { MdLine };
