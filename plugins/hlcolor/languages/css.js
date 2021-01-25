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

import { Hicode, RE, escape } from "../base.js";


class CSS extends Hicode {

    constructor() {
        super([
            {
                begin: /^/,
                type:  slr => ({ text: escape(slr), type: 'selector' })
            }
        ]);
    }
}


export { CSS };
