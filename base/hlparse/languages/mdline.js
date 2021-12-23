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
//  - 不支持内嵌的HTML标签形式，非标记类文本被视为纯文本。
//      如：
//      need a line-break.<br>
//
//
//  主要用于用户在 Cooljed 编辑器中粘贴从 .md 文件中拷贝而来的代码。
//  如果标记较为复杂，用户应当清除它们转而使用编辑器的功能。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode } from "../base.js";


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
     */
    constructor() {
        super([
            {
                type:   'strong',
                begin:  /^\*\*(.*?)\*\*/,
                handle: (_, $1) => $1,
            },
        ]);
    }
}


export { MdLine };
