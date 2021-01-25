//! $Id: main.js 2021.01.19 Articlejs.Plugins.hlcolor $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  语言名称:实现映射配置
//
//  多个名称（别名）可映射到同一类名。
//
//
///////////////////////////////////////////////////////////////////////////////
//

// 解决循环依赖。
export { Hicolor } from "./base.js";

// 支持语言导入。
import { Normal } from "./languages/normal.js";
import { Go } from "./languages/golang.js";
import { JavaScript } from "./languages/javascript.js";
import { CSS } from "./languages/css.js";
import { HTML } from "./languages/html.js";


//
// 语言映射配置。
// 所支持语言视./languages/目录内的实现而定。
// 注：
// 暂不采用import()动态载入方式。
//
const __langMap = {
    normal:     Normal,
    go:         Go,
    golang:     Go,
    html:       HTML,
    xml:        HTML,
    javascript: JavaScript,
    js:         JavaScript,
    css:        CSS,
};


// 简单出错。
const error = msg => { throw new Error(msg) };

/**
 * 获取目标语言的实现。
 * @param  {String} lang 语言名
 * @return {Class} 类实现
 */
export function languageClass( lang ) {
    return __langMap[lang] || error( `[${lang}] language is not supported.` );
}
