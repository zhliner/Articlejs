//! $Id: property.js 2021.06.16 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  单元属性编辑定制。
//  大部分属性实际上就是元素上的特性，但部分不是，因此需要定制，如<table>、<hr>等。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import * as T from "./types.js";

const $ = window.$;


//
// 定制处理器集。
// 接口：function(el, names, values): void
//
const customHandles = {
    [ T.AUDIO ]:        processAudio,
    [ T.VIDEO ]:        processVideo,
    [ T.PICTURE ]:      'property:picture',     // src, width, height, alt, sources
    [ T.IMG ]:          'property:img',         // src, width, height, alt
    [ T.SVG ]:          'property:svg',         // width, height
    [ T.RUBY ]:         'property:ruby',        // rb, rt, rp
    [ T.TIME ]:         'property:times',       // datetime: date, time
    [ T.METER ]:        'property:meter',       // max, min, high, low, value, optimum
    [ T.SPACE ]:        'property:space',       // width
    [ T.A ]:            'property:a',           // href, target
    [ T.Q ]:            'property:q',           // cite
    [ T.ABBR ]:         'property:abbr',        // title
    [ T.DEL ]:          'property:del',         // datetime: date, time
    [ T.INS ]:          'property:ins',         // datetime: date, time
    [ T.CODE ]:         'property:code',        // data-lang, data-tab
    [ T.DFN ]:          'property:dfn',         // title
    [ T.BDO ]:          'property:bdo',         // dir
    [ T.BLOCKQUOTE ]:   'property:blockquote',  // cite
    [ T.CODELIST ]:     'property:codelist',    // data-lang, data-tab, start
    [ T.OL ]:           'property:ol',          // start, type, reversed
    [ T.OLX ]:          'property:olx',         // start, type, reversed
    [ T.LI ]:           'property:li',          // value
    [ T.CODELI ]:       'property:li',          // value
    [ T.ALI ]:          'property:li',          // value
    [ T.XH4LI ]:        'property:li',          // value
    [ T.XOLH4LI ]:      'property:li',          // value
    [ T.XOLAH4LI ]:     'property:li',          // value
    [ T.TABLE ]:        'property:table',       // cols, rows, border, th0
    [ T.HR ]:           'property:hr',          // thick, length, space, border
    [ T.BLANK ]:        'property:blank',       // width, height
    [ T.EXPLAIN ]:      'property:explain',     // position
}


//
// 处理器定义。
// @param  {Element} el 目标元素
// @param  {[String]} names 特性名集
// @param  {[Value]} values 特性值集
// @return {void}
//////////////////////////////////////////////////////////////////////////////


/**
 * 音频处理。
 * names:
 * [0]  'src autoplay loop controls'
 * [1]  'source' // tag
 * values:
 * [0]  [String, Boolean...]
 * [1]  JSON<[Object]>
 */
function processAudio( el, names, values ) {
    //
}


/**
 * 视频处理。
 * names:
 * [0]  'src poster width height autoplay loop controls'
 * [1]  'source' // tag
 * [2]  'track'  // tag
 * values:
 * [0]  [String, Boolean...]
 * [1]  JSON<[Object]>
 * [2]  JSON<[Object]>
 */
function processVideo( el, names, values ) {
    //
}


/**
 * 默认的通用处理。
 */
const property = ( el, names, values ) => $.attribute( el, names, values );


//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取定制处理器。
 * 无需定制的返回null。
 * @param  {Number} tval 单元类型值
 * @return {Function}
 */
export function propertyProcess( tval ) {
    return customHandles[ tval ] || property;
}