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


const
    $ = window.$,

    // 空白匹配。
    __reSpace = /\s+/g;



//
// 定制处理器集。
// function( el, names, ...rest ): void
//
const customHandles = {
    [ T.AUDIO ]:        processSubs,        // src autoplay loop controls, [<source>]
    [ T.VIDEO ]:        processSubs,        // src poster width height autoplay loop controls, [<source>, <track>]
    [ T.PICTURE ]:      processPicture,     // src width height alt, [<sources>]
    [ T.IMG ]:          processAttr,        // src, width, height, alt
    [ T.SVG ]:          processAttr,        // width, height
    [ T.RUBY ]:         processRuby,        // rt, rp
    [ T.TIME ]:         processDatetime,    // datetime: date, time
    [ T.METER ]:        processAttr,        // max, min, high, low, value, optimum
    [ T.SPACE ]:        processCSS,         // CSS:width
    [ T.A ]:            processAttr,        // href, target
    // [ T.Q ]:                             // cite
    // [ T.ABBR ]:                          // title
    [ T.DEL ]:          processDatetime,    // datetime: date, time
    [ T.INS ]:          processDatetime,    // datetime: date, time
    [ T.CODE ]:         processAttr,        // -lang, -tab
    // [ T.DFN ]:                           // title
    // [ T.BDO ]:                           // dir
    // [ T.BLOCKQUOTE ]:                    // cite
    [ T.CODELIST ]:     processAttr,        // -lang, -tab, start
    [ T.OL ]:           processAttr,        // start, type, reversed
    [ T.OLX ]:          processAttr,        // start, type, reversed
    // [ T.LI ]:                            // value
    // [ T.CODELI ]:                        // value
    // [ T.ALI ]:                           // value
    // [ T.XH4LI ]:                         // value
    // [ T.XOLH4LI ]:                       // value
    // [ T.XOLAH4LI ]:                      // value
    [ T.TABLE ]:        processTable,       // border, vth
    [ T.HR ]:           processHr,          // thick, length, space, border
    [ T.BLANK ]:        processCSS,         // CSS: width, height
    // [ T.EXPLAIN ]:                       // -pba
    // [ T.H1 ]:                            // id
    // [ T.H2 ]:                            // id
    // [ T.H3 ]:                            // id
    // [ T.H4 ]:                            // id
    // [ T.H5 ]:                            // id
    // [ T.H6 ]:                            // id
}


//
// 额外实参创建器。
//
const customData = {
    [ T.AUDIO ]:        dataMedia,
    [ T.VIDEO ]:        dataMedia,
    [ T.PICTURE ]:      dataPicture,
    [ T.RUBY ]:         dataRuby,
    [ T.TABLE ]:        dataTable,
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
// 多个拼音子单元会被合并，<rb>也会合并。
// 注记：
// 新插入文本时，至少保留首个文本节点，避免redo时原始引用丢失。
// @param {Text} rt 拼音文本节点
//
function processRuby( el, _, _v, rt ) {
    let $rts = $( 'rt', el ),
        _rt0 = $rts.shift(),
        $rbs = $( 'rb', el ),
        _rb0 = $rbs.shift();

    $.fill( _rt0, rt );

    if ( $rts.length ) {
        $rts.remove();
    }
    if ( $rbs.length ) {
        // 保留_rb0原文本节点引用。
        $.text( _rb0, $rbs.remove().text(), 'append' );
        $.normalize( _rb0 );
    }
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
// 纯特性设置。
//
function processAttr( el, names, vals ) {
    $.attribute( el, names, vals );
}


/**
 * 包含子单元的属性处理。
 * - 目标元素纯特性赋值。
 * - 目标元素子单元全替换。
 * @param  {Element} el 目标元素
 * @param  {String} names 属性名序列
 * @param  {[Value]} vals 属性值集
 * @param  {[Node]} subs 子节点集
 * @return {void}
 */
function processSubs( el, names, vals, subs ) {
    $.fill( $.attribute(el, names, vals), subs );
}



//
// 数据创建器定制
//////////////////////////////////////////////////////////////////////////////


/**
 * 节点集多份克隆。
 * 返回值中的null：
 * - 多目标时，表示不确定态，处理时保留原值。
 * - 单目标时，表示移除目标项。
 * @param  {[Element]} els 选取目标集
 * @param  {Object} valo 属性名:值对象
 * @param  {[Boolean]} chk3 三个播放控制属性值（autoplay loop controls）
 * @param  {String} src 子节点JSON配置串
 * @return {[Value|null, Collector|null]}
 */
function dataMedia( els, valo, chk3, src ) {
    if ( els.length === 1 ) {
        //
    }
    let $subs = subs && $( subs ),
        _buf = [ $subs ];

    for ( let i = 0; i < els.length-1; i++ ) {
        _buf.push( $subs && $subs.clone() );
    }
    return _buf;
}


function dataPicture( els, valo, srcs ) {
    //
}


/**
 * 拼音文本节点创建。
 * @param  {[Element]} els 选取目标集
 * @param  {String} rt 拼音文本
 * @return {[Text]} 拼音文本节点集
 */
function dataRuby( els, rt ) {
    if ( els.length === 1 ) {
        return rt && $.Text( rt );
    }
    if ( rt === null ) {
        // 不确定态
        // 各自提取合并。
        return els.map( el => $.Text( $.find('rt', el).text().join('') ) );
    }
    return els.map( () => $.Text(rt) );
}


/**
 * 表格列头数据集。
 * 返回值：[单元格集|已经存在|删除]
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



/**
 * 表格列头检查。
 * @param  {[Table]} tbs 表格对象集
 * @param  {Boolean} pos 是否尾列检查，可选
 * @return {[Boolean, indeterminate]} [是否包含, 不确定]
 */
function tablesVth( tbs, pos ) {
    let _vs = tbs.map(
            tbo => tbo.hasVth( !!pos )
        );
    return _vs.length === 1 || new Set(_vs).size === 1 ? [ _vs[0], false ] : [ null, true ];
}


/**
 * 特性取值集判断。
 * 全部相同则取值（假值转为空串），否则返回null。
 * @param  {[Element]} els 目标元素集
 * @param  {String} name 特性名
 * @return {Value|null}
 */
function attrVal( els, name ) {
    let _vs = els.map(
        el => $.attr( el, name )
    );
    return _vs.length === 1 || new Set(_vs).size === 1 ? _vs[0] || '' : null;
}


/**
 * 特性取值集判断。
 * 全部相同则取值，结果确定（[Boolean, indeterminate:false]），
 * 否则为不确定（[null, indeterminate:true]）。
 * @param  {[Element]} els 目标元素集
 * @param  {String} name 特性名
 * @return {Value|null}
 */
function attr2Bool( els, name ) {
    let _vs = els.map(
        el => $.attr( el, name )
    );
    return _vs.length === 1 || new Set(_vs).size === 1 ? [_vs[0] !== null, false] : [null, true];
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
     * 所取值如果非真，会转为空串以与null值相区别。
     * 适用：
     * value赋值类控件，空值即为不确定（无需indeterminate）。
     * @data: [Value] 值集
     * @return {Value|null}
     */
    vals1( evo ) {
        return evo.data.length === 1 || new Set(evo.data).size === 1 ?
            evo.data[0] || '' : null;
    },

    __vals1: 1,


    /**
     * 值集单一判断。
     * 如果值集为相同单一值，取该值，indeterminate 为 false，
     * 否则取值为 null，indeterminate 为 true。
     * 适用：
     * 需明确设置不确定态的控件（如复选框，自定义类）。
     * @return {[Value|null, Boolean]} 状态和值 [value, indeterminate]
     */
    vals2( evo ) {
        return evo.data.length === 1 || new Set(evo.data).size === 1 ?
            [ evo.data[0], false ] : [ null, true ];
    },

    __vals2: 1,


    /**
     * 表格列头判断。
     * 如果全部表格都有或无列头，取确定值，否则为不确定。
     * 列头有两个位置，首列和尾列。
     * 适用：专用于表格类型。
     * @data: [Element]
     * @return {[[Boolean, indeterminate], [Boolean, indeterminate]]} [首列状态, 尾列状态]
     */
    tableVth( evo ) {
        let _tbs = evo.data
            .map( el => new $.Table(el) );

        return [ tablesVth(_tbs), tablesVth(_tbs, true) ];
    },

    __tableVth: 1,


    /**
     * 多特性取值判断。
     * 支持空格分隔的多个名称。
     * 如果值全部相同，取确定值，否则为不确定。
     * @data: [Element] 目标元素集
     * @param  {String} names 名称序列
     * @return {[Value]} 值集
     */
    attrVal( evo, names ) {
        return names.split( __reSpace )
            .map( name => attrVal(evo.data, name) );
    },

    __attrVal: 1,


    /**
     * 多特性取值判断。
     * 支持空格分隔的多个名称。
     * 如果值全部相同，取确定值，否则为不确定。
     * @data: [Element] 目标元素集
     * @param  {String} names 名称序列
     * @return {[[Boolean, indeterminate]]} 状态值对集
     */
    attrBool( evo, names ) {
        return names.split( __reSpace )
            .map( name => attr2Bool(evo.data, name) );
    },

    __attrBool: 1,
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
 * @param  {...Value} vals 取值序列（依不同的属性目标而异）
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
 * 接口：function(el, names, ...rest): void
 * - el:Element     目标元素
 * - names:String   属性名序列
 * - ...rest:Value  属性值序列
 * @param  {Number} tval 单元类型值
 * @return {Function}
 */
export function propertyProcess( tval ) {
    return customHandles[ tval ] ||
        // 默认单特性设置。
        ( (el, name, val) => $.attr(el, name, val) );
}



//
// 取值集扩展。
// 引用：v.p.xxx
//
customGetter( 'p', __Kit,
    Object.keys( __Kit ).filter( n => n[0] !== '_' )
);
