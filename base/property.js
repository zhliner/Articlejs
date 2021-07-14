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
import { customGetter } from "./tpb/pbs.get.js";


const $ = window.$;


//
// 定制处理器集。
// function( el, names, vals, rest ): void
//
const customHandles = {
    // [ T.AUDIO ]:        property,        // src autoplay loop controls, [<source>]
    // [ T.VIDEO ]:        property,        // src poster width height autoplay loop controls, [<source>, <track>]
    [ T.PICTURE ]:      processPicture,     // src width height alt, [<sources>]
    // [ T.IMG ]:          property,        // src, width, height, alt
    // [ T.SVG ]:          property,        // width, height
    [ T.RUBY ]:         processRuby,        // rt, rp
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
// 额外实参创建器。
//
const customData = {
    [ T.AUDIO ]:        dataNodes,          // [ Collector(<source>) ]
    [ T.VIDEO ]:        dataNodes,          // [ Collector(<source>, <track>) ]
    [ T.PICTURE ]:      dataNodes,          // [ Collector(<sources>) ]
    [ T.RUBY ]:         dataRuby,           // [ <rt> ]
    [ T.TABLE ]:        dataTable,          // [ [Cells|true|null, Cells|true|null] ]
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
// @param {Text} rt 拼音文本节点
//
function processRuby( el, _, _v, rt ) {
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
    $.attr( el, 'datetime', date );
}


//
// 表格设置。
// - 边框类型（border）。
// - 列头添加/移除（首尾两处）。
// val: border 边框值
// cs0: [Element]|null|void 首列单元格集
// cs1: [Element]|null|void 尾列单元格集
//
function processTable( el, _, val, cs0, cs1 ) {
    let _tbo = new $.Table( el );

    if ( cs0 !== undefined ) tableVth( _tbo, cs0, 0 );
    if ( cs1 !== undefined ) tableVth( _tbo, cs1, -1 );
    if ( val !== undefined ) $.attr( el, 'border', val );
}


//
// 线条设置。
// 3个样式值，一个role特性值。
// names:  `borderWidth width height'
// vals:   [Value]
// border: // 线型值（role）
//
function processHr( el, names, vals, border ) {
    $.attr( 'role', border );
    $.cssSets( el, names, vals );
}


//
// 样式属性处理。
// names: String  名称序列
// vals:  Value]  样式值集
//
function processCSS( el, names, vals ) {
    $.cssSets( el, names, vals );
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
    if ( vals !== undefined ) {
        $.attribute( el, names, vals );
    }
    subs !== undefined && $.fill( el, subs );
}



//
// 数据创建器定制
//////////////////////////////////////////////////////////////////////////////


/**
 * 节点集多份克隆。
 * @param  {[Element]} els 选取目标集
 * @param  {[Value]} vals 特性值序列
 * @param  {[Element]|''} subs 子节点集
 * @return {[Value, Collector]}
 */
function dataNodes( els, vals, subs ) {
    let $subs = subs && $( subs ),
        _buf = [ $subs ];

    for ( let i = 0; i < els.length-1; i++ ) {
        _buf.push( $subs.clone() );
    }
    return _buf;
}


/**
 * 拼音文本节点创建。
 * @param  {[Element]} els 选取目标集
 * @param  {String} rt 拼音文本
 * @return {[Text]} 拼音文本节点集
 */
function dataRuby( els, rt ) {
    let _rt0 = $.Text( rt ),
        _buf = [ _rt0 ];

    for ( let i = 0; i < els.length-1; i++ ) {
        _buf.push( $.clone(_rt0) );
    }
    return _buf;
}


/**
 * 表格列头数据集。
 * @param  {[Element]} els 选取的表格集
 * @param  {String} border 边框值
 * @param  {Boolean} vth0  含首列表头
 * @param  {Boolean} vth1  含末列表头
 * @return {[[Element|true|null], [Element|true|null]]} 列单元格集组
 */
function dataTable( els, border, vth0, vth1 ) {
    let _buf = [];

    for ( const el of els ) {
        let _tbo = new $.Table( el ),
            _v0 = _tbo.hasVth(),
            _v1 = _tbo.hasVth( true );

        _buf.push([
            border,
            vth0 ? ( _v0 || _tbo.newColumn(true) ) : null,
            vth1 ? ( _v1 || _tbo.newColumn(true) ) : null
        ]);
    }
    return _buf.length === 1 ? _buf[0] : _buf;
}



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 表格列头设置/移除。
 * col为true时，表示原表格已有列头，且需保留。
 * col为null时，表示需要删除列头（无论有无）。
 * @param {Table} tbo 表格实例
 * @param {[Element]|true|null} col 列单元格集
 * @param {Number} pos 设置位置（0|-1）
 */
function tableVth( tbo, col, pos ) {
    let _v = tbo.hasVth( !!pos );

    if ( col ) {
        _v || tbo.insertColumn( col, pos );
    } else {
        _v && tbo.removeColumn( pos );
    }
}


/**
 * 值扩展为数组。
 * 克隆为与目标元素集相同大小。
 * @param  {[Element]} els 目标元素集
 * @param  {Value|[Value]} val 成员值
 * @return {[Value|[Value]]}
 */
function arrValues( els, val ) {
    return new Array( els.length ).fill( val );
}



//
// 取值函数集。
// 区分单选取和多选取而有不同的状态。
// - 文本框输入的值，空串表示无操作（维持原值）。
// - 单选按钮无任何选中时表示“不确定”状态，维持原属性值不变。
// - 复选框在 indeterminate 为真时同上，维持原属性值。
// - 选单的不确定状态为无任何选取，维持原值。
// - 单个目标时，文本框空串会移除该属性（友好）。
//
const __Kit = {
    /**
     * 值集单一取值。
     * 如果值集为相同单一值，取该值，否则取值为null。
     * 用于多目标检测取值。
     * 适用：value赋值类控件，空值即为不确定（无需indeterminate）。
     * @data: [Value] 值集
     * @return {Value|null}
     */
    vals1( evo ) {
        return evo.data.length === 1 || new Set(evo.data).size === 1 ?
            evo.data[0] : null;
    },

    __vals1: 1,


    /**
     * 值集单一判断。
     * 如果值集为相同单一值，取该值，indeterminate 为 false，
     * 否则取值为 null，indeterminate 为 true。
     * 适用：需明确设置不确定态的控件（如复选框，自定义类）。
     * @return {[Boolean, Value|null]} 状态和值 [indeterminate, value]
     */
    vals2( evo ) {
        return evo.data.length === 1 || new Set(evo.data).size === 1 ?
            [ false, evo.data[0] ] : [ true, null ];
    },

    __vals2: 1,


    /**
     * 值集选单设置。
     * 值集逻辑同上，需明确设置indeterminate值。
     */
    select( evo ) {
        //
    },

    __select: 1,
};



//
// 导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取目标类型的额外数据集。
 * 此处的返回值为一个数组，与选取的目标集成员一一对应，作为其额外的实参。
 * 注记：
 * 提供此接口以便于创建目标的子元素集，避免Redo时元素的引用失效（如果新建的话）。
 * 多个目标时，子元素集通常只是简单的克隆而已。
 * @param  {Number} tval 目标单元类型值
 * @param  {[Element]} els 选取的目标元素集
 * @param  {...Value} vals 初始值序列（依不同的属性目标而异）
 * @return {[Value]} 额外实参集
 */
export function propertyData( tval, els, ...vals ) {
    let _fun = customData[ tval ];

    if ( _fun ) {
        return _fun( els, ...vals );
    }
    return els.length === 1 ? vals : arrValues( els, vals );
}


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



//
// 取值集扩展。
// 引用：v.p.xxx
//
customGetter( 'p', __Kit,
    Object.keys( __Kit ).filter( n => n[0] !== '_' )
);
