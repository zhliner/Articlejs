//! $ID: mdblock.js 2021.12.23 Cooljed.HLParse $
// +++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  MarkDown 行块语法。
//  这是对 MarkDown 语法的逻辑拆解：行块+单行 之一。
//
//  行块的处理会包含单行（mdline）的逻辑。
//
//  主要用于用户将 markdown 代码转换为 html 源码（非语法高亮）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, stringEscape } from "../base.js";


class MdLine extends Hicode {
    /**
     * 传递匹配集构造。
     */
    constructor() {
        super([
            {
                type:   'comments',
                begin:  RE.COMMENTS,
                handle: htmlEscape,
            },
            {
                type:   'comments',
                begin:  RE.COMMENT_B,
                handle: htmlEscape,
            },
            {
                type:   'string',
                begin:  RE.STRING,
                handle: stringEscape,
            },
            {
                type:   'string',
                begin:  RE.STRING_1,
                handle: stringEscape,
            },
        ]);
    }
}


export { MdLine };
