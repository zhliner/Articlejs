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
// function( el, names, vals, subs ): void
// @param  {Element} el 目标元素
// @param  {String|[String]} names 名称序列
// @param  {Value|[Value]} vals 名称对应值（集）
// @param  {Node|[Node]} subs  子节点集，可选
//
const customHandles = {
    // [ T.AUDIO ]:        property,        // src autoplay loop controls, [<source>]
    // [ T.VIDEO ]:        property,        // src poster width height autoplay loop controls, [<source>, <track>]
    [ T.PICTURE ]:      processPicture,     // src width height alt, [<sources>]
    // [ T.IMG ]:          property,        // src, width, height, alt
    // [ T.SVG ]:          property,        // width, height
    [ T.RUBY ]:         processRuby,        // rb, rt, rp
    [ T.TIME ]:         processDatetime,    // datetime: date, time
    // [ T.METER ]:        property,        // max, min, high, low, value, optimum
    [ T.SPACE ]:        processCSS,         // CSS:width
    // [ T.A ]:            property,        // href, target
    [ T.Q ]:            processAttr,        // cite
    [ T.ABBR ]:         processAttr,        // title
    [ T.DEL ]:          processDatetime,    // datetime: date, time
    [ T.INS ]:          processDatetime,    // datetime: date, time
    // [ T.CODE ]:         property,        // -lang, -tab
    [ T.DFN ]:          processAttr,        // title
    [ T.BDO ]:          processAttr,        // dir
    [ T.BLOCKQUOTE ]:   processAttr,        // cite
    // [ T.CODELIST ]:     property,        // -lang, -tab, start
    // [ T.OL ]:           property,        // start, type, reversed
    // [ T.OLX ]:          property,        // start, type, reversed
    [ T.LI ]:           processAttr,        // value
    [ T.CODELI ]:       processAttr,        // value
    [ T.ALI ]:          processAttr,        // value
    [ T.XH4LI ]:        processAttr,        // value
    [ T.XOLH4LI ]:      processAttr,        // value
    [ T.XOLAH4LI ]:     processAttr,        // value
    [ T.TABLE ]:        processTable,       // border, vth
    [ T.HR ]:           processHr,          // thick, length, space, border
    [ T.BLANK ]:        processCSS,         // CSS: width, height
    [ T.EXPLAIN ]:      processAttr,        // -pba
    [ T.H1 ]:           processAttr,        // id
    [ T.H2 ]:           processAttr,        // id
    [ T.H3 ]:           processAttr,        // id
    [ T.H4 ]:           processAttr,        // id
    [ T.H5 ]:           processAttr,        // id
    [ T.H6 ]:           processAttr,        // id
}


//
// 处理器定义。
//////////////////////////////////////////////////////////////////////////////


//
// 自适应图片。
// 注意保持<img>的正确位置。
// <img>:names: 'src, width, height, alt'
// <source>...  可选
//
function processPicture( el, names, vals, subs ) {
    let _img = $.get( 'img', el );

    if ( subs ) {
        $.fill( el, subs );
        // 在末尾
        $.append( el, _img );
    }
    $.attribute( _img, names, vals );
}


//
// 注音拼音更新。
// 保留首个<rb>, <rt>子元素引用。
// 多个拼音子单元会被合并，<rb>也对应合并。
// 注记：
// 不会创建新的节点（即便是文本节点），避免redo时原始引用丢失。
// <rt|rb>内原始的文本节点引用也会被保留。
// @param {Node} rt 拼音文本节点
//
function processRuby( el, _, rt ) {
    let $rts = $( 'rt', el ),
        _rt0 = $rts.shift();

    $.fill( _rt0, rt );
    if ( !$rts.length ) return;

    // <rb>合并。
    let _rb0 = $.get( 'rb', el ),
        _tts = $('rb', el).slice(1).remove().text();

    // append:
    // 保留_rb0原文本节点引用。
    $.text( _rb0, _tts, 'append' );
    $.normalize( _rb0 );

    // 清除多余。
    $rts.remove();
    $('rp', el).slice(2).remove();
}


//
// 时间设置。
// vals[0]: date?: String
// vals[1]: time?: String
//
function processDatetime( el, _, vals ) {
    let [date, time] = vals;

    if ( time ) {
        date = date ? `${date} ${time}` : `${time}`;
    }
    $.attr( 'datetime', date );
}


//
// 表格设置。
// - 边框类型（border）。
// - 列头添加/移除（首尾两处）。
// vals[0]: border 边框值
// vals[1]: vth0:Boolean 首列头
// vals[2]: vth1:Boolean 尾列头
//
function processTable( el, _, vals ) {
    //
}


//
// 线条设置。
// 3个样式值，一个role特性值。
// names:   `borderWidth width height'
// vals[0]: [Value]
// vals[1]: role  // 线型值
//
function processHr( el, names, vals ) {
    //
}


//
// 样式属性处理。
// names: String  名称序列
// vals:  Value]  样式值集
//
function processCSS( el, names, vals ) {
    //
}


//
// 单特性设置。
//
function processAttr( el, name, val ) {
    $.attr( el, name, val );
}


/**
 * 默认的通用处理。
 * - 目标元素纯特性赋值。
 * - 目标元素子单元全替换。
 * @param  {Element} el 目标元素
 * @param  {String} names 属性名序列
 * @param  {[Value]} vals 属性值集
 * @param  {[Node]} subs 子节点集，可选
 * @return {void}
 */
function property( el, names, vals, subs ) {
    $.attribute( el, names, vals );
    subs && $.fill( el, subs );
}


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取定制处理器。
 * 接口：function(
 *      el:Element,       // 目标元素
 *      names:String,     // 属性名序列
 *      values:[Value],   // 属性值集
 *      subs:[Element]    // 子元素集，可选
 * ): void
 * @param  {Number} tval 单元类型值
 * @return {Function}
 */
export function propertyProcess( tval ) {
    return customHandles[ tval ] || property;
}