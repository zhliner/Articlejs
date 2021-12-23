//! $ID: mdline.js 2021.12.23 Cooljed.HLParse $
// ++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  MarkDown 单行语法。
//  这是对 MarkDown 语法的逻辑拆解：行块+单行 之一。
//  注：
//  主要用于用户在 Cooljed 编辑器中粘贴从 .md 文件中拷贝而来的代码。
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
