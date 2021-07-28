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
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode, RE, htmlEscape } from "../base.js";


class HTML extends Hicode {

    constructor() {
        super([
            {
                type:   'doctype',
                begin:  /^<!DOCTYPE [^>]+>/i,
                handle: htmlEscape,
            }
        ]);
    }
}


export { HTML };
