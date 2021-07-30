//! $Id: normal.js 2021.01.24 Articlejs.Plugins.hlcolor $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  普通代码简单格式。
//  仅包含常见的C风格注释（行/块）和双引号字符串标记。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape, stringEscape } from "../base.js";


class Normal extends Hicode {
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
                block:  ['/*', '*/']
            },
            {
                type:   'string',
                begin:  RE.STRING,
                handle: stringEscape,
            },
        ]);
    }
}


export { Normal };
