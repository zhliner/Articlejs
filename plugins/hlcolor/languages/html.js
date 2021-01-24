//! $Id: plugins/hlcolor/html.js 2021.01.25 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
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

import { Hicode, RE, escape } from "../base.js";


class HTML extends Hicode {

    constructor() {
        super([
            {
                begin: /^<!DOCTYPE [^>]+>/i,
                type:  str => ({ text: escape(str), type: 'doctype' })
            }
        ]);
    }
}


export { HTML };
