//! $ID: property.js 2021.06.16 Cooljed.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  单元属性编辑定制。
//  大部分属性实际上就是元素上的特性，但部分不是，因此需要定制，如<table>、<hr>等。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import * as T from "./types.js";
import { getType } from "./base.js";
import { customGetter } from "./tpb/tpb.js";
import { highLight } from "./coding.js";
import { htmlBlock, htmlList, codeWraps } from "./coloring.js";

import { Sys, On } from "../config.js";


const
    // 空白匹配。
    __reSpace = /\s+/g,

    // Ruby子单元备用。
    // 用于<ruby>结构破坏后的修复。
    __$rps = $( [Sys.rpLeft, Sys.rpRight] ).elem( 'rp' );



//
// 定制处理器集。
// function( el, names, ...rest ): void
//
const customHandles = {
    [ T.AUDIO ]:        processAudio,       // src autoplay loop controls, [<source>]
    [ T.VIDEO ]:        processVideo,       // src poster width height autoplay loop controls, [<source>, <track>]
    [ T.PICTURE ]:      processPicture,     // src width height alt, [<sources>]
    [ T.IMG ]:          processAttr,        // src, width, height, alt
    [ T.PIMG ]:         processAttr,        // 同上
    [ T.SVG ]:          processAttr,        // width, height
    [ T.RUBY ]:         processRuby,        // rt, rp
    // [ T.TIME ]:                          // datetime: date, time
    [ T.METER ]:        processAttr,        // max, min, high, low, value, optimum
    [ T.SPACE ]:        processCSS,         // CSS:width
    [ T.A ]:            processAttr,        // href, target
    // [ T.Q ]:                             // cite
    // [ T.ABBR ]:                          // title
    [ T.DEL ]:          processAttr,        // datetime(date, time), cite
    [ T.INS ]:          processAttr,        // datetime(date, time), cite
    [ T.CODE ]:         processCode,        // -lang, -tab
    // [ T.DFN ]:                           // title
    // [ T.BDO ]:                           // dir
    // [ T.BLOCKQUOTE ]:                    // cite
    [ T.CODELIST ]:     processCodeList,    // -lang, -tab, start
    [ T.OL ]:           processAttr,        // start, type, reversed
    [ T.OLX ]:          processAttr,        // start, type, reversed
    [ T.LI ]:           processAttr,        // value, types
    [ T.CODELI ]:       processAttr,        // value, types
    [ T.ALI ]:          processAttr,        // value, types
    [ T.XH4LI ]:        processAttr,        // value, types
    [ T.XOLH4LI ]:      processAttr,        // value, types
    [ T.XOLAH4LI ]:     processAttr,        // value, types
    [ T.TABLE ]:        processTable,       // border, vth
    [ T.HR ]:           processHr,          // thick, length, space, border
    [ T.BLANK ]:        processCSS,         // CSS: width, height
    [ T.EXPLAIN ]:      processExplain,     // -pba
    // [ T.H1 ]:                            // id
    // [ T.H2 ]:                            // id
    // [ T.H3 ]:                            // id
    // [ T.H4 ]:                            // id
    // [ T.H5 ]:                            // id
    // [ T.H6 ]:                            // id
}


//
// 实参创建器（单目标）。
//
const customData = {
    [ T.AUDIO ]:        dataAudio,
    [ T.VIDEO ]:        dataVideo,
    [ T.PICTURE ]:      dataPicture,
    [ T.RUBY ]:         dataRuby,
    [ T.TABLE ]:        tableData,
    [ T.TIME ]:         dataDatetime,
    [ T.DEL ]:          dataDatetime,
    [ T.INS ]:          dataDatetime,
    [ T.CODE ]:         dataCode,
    [ T.CODELIST ]:     dataCodeList,
};


//
// 实参创建器（多目标）。
//
const customDataMore = {
    [ T.AUDIO ]:        dataAudio2,
    [ T.VIDEO ]:        dataVideo2,
    [ T.PICTURE ]:      dataPicture2,
    [ T.RUBY ]:         dataRuby2,
    [ T.TABLE ]:        dataTable,
    [ T.TIME ]:         dataDatetime2,
    [ T.DEL ]:          dataDatetime2,
    [ T.INS ]:          dataDatetime2,
    [ T.CODE ]:         dataCode2,
    [ T.CODELIST ]:     dataCodeList2,
};


//
// 处理器定义。
//////////////////////////////////////////////////////////////////////////////


/**
 * 音频属性处理。
 * 包含资源（<source>）子单元的处理。
 * - 目标元素纯特性赋值。
 * - 目标元素子单元全替换。
 * @param  {Element} el 目标元素
 * @param  {String} names 属性名序列（占位）
 * @param  {Object} valo 属性名值对象
 * @param  {[Element]|''|void} subs 资源子节点集
 * @return {void}
 */
function processAudio( el, names, valo, subs ) {
    $.attribute( el, valo );
    // 未定义时原样保留
    subs !== undefined && replaceSubs( el, 'source', subs );
}


/**
 * 视频属性处理。
 * 包含资源（<source>）和字幕（<track>）子单元的处理。
 * - 目标元素纯特性赋值。
 * - 目标元素特定子单元全替换。
 * @param  {Element} el 目标元素
 * @param  {String} names 属性名序列（占位）
 * @param  {Object} valo 属性名值对象
 * @param  {[Element]|''|void} ssub 资源子节点集
 * @param  {[Element]|''|void} tubs 字幕子节点集
 * @return {void}
 */
function processVideo( el, names, valo, ssub, tsub ) {
    $.attribute( el, valo );

    // 未定义时原样保留
    if ( ssub !== undefined ) {
        replaceSubs( el, 'source', ssub );
    }
    if ( tsub !== undefined ) {
        replaceSubs( el, 'track', tsub );
    }
}


/**
 * 自适应图片。
 * 注意保持<img>的正确位置。
 * @param  {Element} el 目标元素
 * @param  {String} names 属性名序列（占位）
 * @param  {Object} valo 属性名值对象
 * @param  {[Element]|''|void} subs 资源子节点集
 * @return {void}
 */
function processPicture( el, names, valo, subs ) {
    let _img = $.get( 'img', el );

    if ( subs !== undefined ) {
        $.fill( el, subs );
        // 保证在末尾
        $.append( el, _img );
    }
    $.attribute( _img, valo );
}


//
// 注音拼音更新。
// 附带的两个<rp>用于可能的结构破坏后的修复。
// @param {Text} rt 拼音文本节点，可选
// @param {Text} text 内容文本节点，可选
// @param {Element} rpl 左包围（<rp>），可选
// @param {Element} rpr 右包围（<rp>），可选
//
function processRuby( el, _, rt, text, rpl, rpr ) {
    let _rp = $( 'rp', el ),
        _rt = $.get( 'rt', el );

    if ( text !== undefined ) {
        $.fill( el, text );
        _rt && $.append( el, [ _rp[0], _rt, _rp[1] ] );
    }
    if ( rt === undefined ) {
        return;
    }
    _rt ? $.fill( _rt, rt ) : $.append( el, [rpl, $.elem('rt', rt), rpr] );
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

    if ( val !== undefined ) $.attr( el, 'border', val );
    if ( cs0 !== undefined ) setTableVth( _tbo, cs0, 0 );
    if ( cs1 !== undefined ) setTableVth( _tbo, cs1, null );
}


//
// 线条设置。
// 3个样式值，一个role特性值。
// names:  `borderWidth width height'
// vals:   [Value]
// border: // 线型值（role）
//
function processHr( el, names, vals, border ) {
    $.cssSets( el, names, vals );
    $.attr( el, 'role', border );
}


//
// 样式属性处理。
// names: String  名称序列
// vals:  Value]  样式值集
//
function processCSS( el, names, ...vals ) {
    $.cssSets( el, names, vals );
}


//
// 纯特性设置。
//
function processAttr( el, names, ...vals ) {
    $.attribute( el, names, vals );
}


//
// 代码属性设置。
// 包括代码块和代码表中的代码行，以及单独的代码元素。
// 如果是代码行，语言设置参考根容器处理：
// - 相同，移除当前<code>语言设置。
// - 不同，设置当前<code>语言属性。
// @param {String} lang 代码语言（-lang）
// @param {[Node]} subs 着色节点集（[<b>, <i>, #text]）
//
function processCode( el, _, lang, subs ) {
    if ( lang !== undefined ) {
        $.attr( el, '-lang', codeLang(el, lang) );
    }
    subs !== undefined && $.fill( el, subs );
}


//
// 代码表属性设置。
// 语言改变仅限于表全局，subs会有值。
// 填充替换也仅限于没有局部语言定义的行（有局部定义的由undefined占位）。
// @param {Object} valo 特性名值对象（start, -lang）
// @param {[Element]} subs 着色代码行集（[<code>]）
//
function processCodeList( el, _, valo, subs ) {
    $.attribute( el, valo );
    subs !== undefined && $.fill( el, $(subs).elem('li') );
}


/**
 * 插图讲解属性处理。
 * 需要清除内联的定位设置（如果有），否则没有效果。
 * @param {Element} el 目标元素
 * @param {String} name 属性名（-pba）
 * @param {String} val  属性值
 */
function processExplain( el, name, val ) {
    $.attr( el, name, val );
    $.cssSets( el, 'top right bottom left', null );
}



//
// 数据创建器定制
// 返回值：
// - 单目标时，文本空串转换为null，移除目标特性。
// - 多目标时，文本空串或null表示不确定态，转换为undefined以便原样保留。
//////////////////////////////////////////////////////////////////////////////


/**
 * 音频数据处理（单目标）。
 * @param  {Element} el  选取目标
 * @param  {Object} valo 属性名:值对象
 * @param  {[Boolean]|null} chk3 三个播放控制属性值（autoplay loop controls）
 * @param  {[Element]|''} subs 子节点集
 * @return {[Object, [Element]|'']} 2成员数组
 */
function dataAudio( el, valo, chk3, subs ) {
    valo.autoplay = chk3[0];
    valo.loop = chk3[1];
    valo.controls = chk3[2];

    return [ objectValue(valo, '', null), subs ];
}


/**
 * 音频数据处理（多目标）。
 * 子节点集为空串时表示忽略（原样保持）。
 * @param  {[Element]} els 选取目标集
 * @param  {Object} valo 属性名:值对象
 * @param  {[Boolean]|null} chk3 播放控制属性值
 * @param  {[Element]|''} subs 子节点集
 * @return {[Object, Collector|void]} 2成员数组
 */
function dataAudio2( els, valo, chk3, subs ) {
    let $subs = subs && $( subs );

    valo.autoplay = chk3[0];
    valo.loop = chk3[1];
    valo.controls = chk3[2];

    objectValue( valo, '', undefined );
    objectValue( valo, null, undefined );

    return els.map(
        () => [ valo, $subs ? $subs.clone() : undefined ]
    );
}


/**
 * 视频数据处理（单目标）。
 * @param  {Element} el  选取目标
 * @param  {Object} valo 属性名:值对象
 * @param  {[Boolean]|null} chk3 三个播放控制属性值（autoplay loop controls）
 * @param  {[Element]|''} subs1 资源子节点集
 * @param  {[Element]|''} subs2 字幕子节点集
 * @return {[Object, [Element]|'', [Element|'']]} 3成员数组
 */
function dataVideo( el, valo, chk3, [subs1, subs2] ) {
    valo.autoplay = chk3[0];
    valo.loop = chk3[1];
    valo.controls = chk3[2];

    return [ objectValue(valo, '', null), subs1, subs2 ];
}


/**
 * 视频数据处理（多目标）。
 * 子节点集为空串时表示忽略（原样保持）。
 * @param  {[Element]} els 选取目标集
 * @param  {Object} valo 属性名:值对象
 * @param  {[Boolean]|null} chk3 播放控制属性值
 * @param  {[Element]|''} subs1 资源子节点集
 * @param  {[Element]|''} subs2 字幕子节点集
 * @return {[Object, Collector|void, Collector|void]} 3成员数组
 */
function dataVideo2( els, valo, chk3, [subs1, subs2] ) {
    let $subs1 = subs1 && $( subs1 ),
        $subs2 = subs2 && $( subs2 );

    valo.autoplay = chk3[0];
    valo.loop = chk3[1];
    valo.controls = chk3[2];

    objectValue(valo, '', undefined);
    objectValue(valo, null, undefined);

    return els.map( () => [
        valo,
        $subs1 ? $subs1.clone() : undefined,
        $subs2 ? $subs2.clone() : undefined
    ]);
}


/**
 * 自适应图片数据处理（单目标）。
 * @param  {Element} el 选取目标集
 * @param  {Object} valo 属性名:值对象
 * @param  {[Element]|''} subs 资源节点集（<source>）
 * @return {[Object, [Element]|'']}
 */
function dataPicture( el, valo, subs ) {
    return [ objectValue(valo, '', null), subs ];
}


/**
 * 自适应图片数据处理（多目标）。
 * @param  {[Element]} els 选取目标集
 * @param  {Object} valo 属性名:值对象
 * @param  {[Element]|''} subs 资源节点集
 * @return {[Object, Collector|void]}
 */
function dataPicture2( els, valo, subs ) {
    let $subs = subs && $( subs );

    objectValue(valo, '', undefined);

    return els.map(
        () => [ valo, $subs ? $subs.clone() : undefined ]
    );
}


/**
 * 拼音文本节点创建（单目标）。
 * @param  {Element} el 目标元素
 * @param  {String} rt 拼音文本
 * @param  {String} text 注音文本
 * @return {[Text2, Element2]} 注音&拼音文本节点和两个<rp>
 */
function dataRuby( el, rt, text ) {
    let _rt = $.get( 'rt', el );

    return $( [rt, text] )
        .Text()
        .concat( _rt ? [] : __$rps.clone() );
}


/**
 * 拼音文本节点创建（多目标）。
 * @param  {[Element]} els 选取目标集
 * @param  {String} rt 拼音文本
 * @param  {String} text 注音文本
 * @return {[[Text2]]} 注音和拼音文本节点组集
 */
function dataRuby2( els, rt, text ) {
    let _buf = [
        undefined, undefined
    ];
    if ( rt ) {
        _buf[0] = $.Text( rt );
    }
    if ( text ) {
        _buf[1] = $.Text( text );
    }
    return els.map( el => _buf.concat( $.get('rt', el) ? [] : __$rps.clone()) );
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
    return els.map(
        el => tableData( el, border, vth0, vth1 )
    );
}


/**
 * 日期/时间数据（单目标版）。
 * @param  {Element} el 目标元素
 * @param  {String} date 日期串
 * @param  {String} time 时间串，可选
 * @param  {String} cite 来源，可选
 * @return {[String]}
 */
function dataDatetime( el, date, time, cite ) {
    if ( time ) {
        date = date ? `${date} ${time}` : `${time}`;
    }
    return [ date || null, cite || null ];
}


/**
 * 日期/时间数据（多目标版）。
 * @param  {Element} el 目标元素
 * @param  {String} date 日期串
 * @param  {String} time 时间串，可选
 * @param  {String} cite 来源，可选
 * @return {[[String]]}
 */
function dataDatetime2( els, date, time, cite ) {
    if ( time ) {
        date = date ? `${date} ${time}` : `${time}`;
    }
    return arrayValue( els, [date || undefined, cite || undefined] );
}


/**
 * 代码语言解析处理（单目标）。
 * 如果目标语言与原语言相同，则简单忽略。
 * @param  {Element} el 代码元素
 * @param  {String} lang 代码语言
 * @return {[String, [Node]]} 语言&着色节点集（lang, [<b>,<i>,#text]）
 */
function dataCode( el, lang ) {
    let _code = el.textContent;

    if ( lang === '' ) {
        return [ null, $.Text( _code ) ];
    }
    let _els = codeWraps(
        null,
        highLight( [_code], lang ),
        htmlBlock
    );
    return [ lang, codeSubs( _els ) ];
}


/**
 * 代码语言解析处理（多目标）。
 * @param  {[Element]} els 代码元素集
 * @param  {String} lang 代码语言
 * @return {[[String, [Node]]]} 语言&着色节点集组
 */
function dataCode2( els, lang ) {
    return els.map( el => dataCode(el, lang) );
}


/**
 * 代码表语言解析处理（单目标）。
 * @param  {Element} el 代码表元素（<ol>）
 * @param  {String} lang 代码语言
 * @param  {Number} start 首行行号，可选
 * @return {[Object, [Element]]} 配置对象&行代码集（lang, [<code>]）
 */
function dataCodeList( el, lang, start ) {
    let _obj = { '-lang': lang, start },
        _lang = $.attr( el, '-lang' ) || '';

    objectValue( _obj, '', null );

    if ( lang === _lang ) {
        return [ _obj ];
    }
    return [ _obj, codeList(el, lang) ];
}


/**
 * 代码表语言解析处理（多目标）。
 * @param  {[Element]} els 代码元素集
 * @param  {String} lang 代码语言
 * @param  {Number} start 首行行号，可选
 * @return {[[Object, [Element]]]} 配置对象&行代码集组
 */
function dataCodeList2( els, lang, start ) {
    return els.map( el => codeListData(el, lang, start) );
}


/**
 * 属性值简单处理。
 * 针对单一目标时，空串替换为null。
 * @param  {[Value]} vals 属性值序列
 * @return {[Value]}
 */
function dataValue( vals ) {
    return vals.map( v => v === '' ? null : v );
}


/**
 * 属性值简单处理。
 * 针对多目标时，空串和null值转换为undefined（不确定态）。
 * @param  {[Value]} vals 属性值序列
 * @return {[Value]}
 */
function dataValue2( vals ) {
    return vals.map( v => v === '' || v === null ? undefined : v );
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
 * @param {Number} pos 设置位置（0|null）
 */
function setTableVth( tbo, col, pos ) {
    let _v = tbo.hasVth( pos == null );

    if ( col ) {
        _v || tbo.insertColumn( col, pos );
    } else {
        _v && tbo.removeColumn( pos == null ? -1 : pos );
    }
}


/**
 * 替换目标子节点集。
 * @param {Element} box 容器元素
 * @param {String} tag  子单元标签名
 * @param {[Element]} subs 子节点集
 */
function replaceSubs( box, tag, subs ) {
    $.find( tag, box )
        .forEach( el => $.remove(el) );

    $.append( box, subs );
}


/**
 * 创建表格属性数据
 * 列表头null值表示不确定态，这仅在多目标时才会存在。
 * 返回值：[边框, 单元格集|已经存在|删除|原样]
 * @param  {[Element]} els 选取的表格集
 * @param  {String} border 边框值
 * @param  {Boolean|null} vth0  含首列表头
 * @param  {Boolean|null} vth1  含末列表头
 * @return {[String, [Element]|true|null|void]}
 */
function tableData( el, border, vth0, vth1 ) {
    let _tbo = new $.Table( el ),
        _v0 = _tbo.hasVth(),
        _v1 = _tbo.hasVth( true );
    return [
        border,
        vth0 ? ( _v0 || _tbo.newColumn(true) ) : (vth0 === null ? undefined : null),
        vth1 ? ( _v1 || _tbo.newColumn(true) ) : (vth1 === null ? undefined : null)
    ];
}


/**
 * 对象成员值转换。
 * @param {Object} obj 目标对象
 * @param {Value} val 检查值
 * @param {Value} rep 替换值
 */
function objectValue( obj, val, rep ) {
    for ( const k of Object.keys(obj) ) {
        if ( obj[k] === val ) obj[k] = rep;
    }
    return obj;
}


/**
 * 值扩展为数组。
 * 简单复制，结果数组大小与目标元素集相同。
 * @param  {[Element]} els 目标元素集
 * @param  {Value|[Value]} val 成员值
 * @return {[Value|[Value]]}
 */
function arrayValue( els, val ) {
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


/**
 * 根据语言解析代码构造代码表项。
 * 可能包含嵌套的子语言块，会被扁平化。
 * @param  {Element} el 代码表根（<ol>）
 * @param  {String} lang 代码语言
 * @return {[Element]} <code>行集
 */
function codeList( el, lang ) {
    let _txts = $.children( el ).map( e => e.textContent );

    if ( lang === '' ) {
        return $( _txts ).elem( 'code' );
    }
    return codeWraps( null, highLight(_txts, lang), htmlList );
}


/**
 * 代码表语言解析处理（多目标时）。
 * 起始行号为空或语言为null，表示不确定态，原样维持。
 * 如果目标语言与原语言相同，简单忽略（不再解析重构）。
 * @param  {Element} el  代码元素（<ol>）
 * @param  {String} lang 代码语言
 * @param  {Number} start 首行行号，可选
 * @return {[Object, [Element]]} 配置对象&行代码集
 */
function codeListData( el, lang, start ) {
    let _obj = { '-lang': lang, start },
        _lang = $.attr( el, '-lang' ) || '';

    objectValue( _obj, '', undefined );
    objectValue( _obj, null, undefined );

    if ( lang === _lang || lang === null ) {
        return [ _obj ];
    }
    return [ _obj, codeList(el, lang) ];
}


/**
 * 获取代码的内容集。
 * @param  {[Element]} els 容器元素集（[<code>]）
 * @return {[Node]}
 */
function codeSubs( els ) {
    return els.map( el => [...el.childNodes] ).flat();
}


/**
 * 获取代码所属语言。
 * 如果是代码表内的代码行<code>元素。
 * 与容器根语言对比：
 * - 相同，代码行无需设置（返回null）。
 * - 不同，定制设置。
 * 其它普通代码元素，需要设置，原样返回。
 * 返回null以移除当前语言设定。
 * @param  {Element} el 代码元素
 * @return {String|null}
 */
function codeLang( el, lang ) {
    let _box = el.parentElement.parentElement,
        _type = getType( _box );

    if ( _type !== T.CODELIST ) {
        return lang;
    }
    let _lang = $.attr( _box, '-lang' );

    return _lang === lang ? null : lang;
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
 * 获取目标类型的数据集（单目标版）。
 * 注记：
 * 提供此接口以便于创建目标的子元素集，避免Redo时元素的引用失效。
 * @param  {Element} el  选取的目标元素
 * @param  {...Value} vals 取值序列（依不同的属性目标而异）
 * @return {[Value]} 实参集
 */
export function propertyData( el, ...vals ) {
    let _fun = customData[ getType(el) ];
    return _fun ? _fun( el, ...vals ) : dataValue( vals );
}


/**
 * 获取目标类型的数据集（多目标版）。
 * 此处返回值的数组与选取的目标集成员一一对应，作为其实参序列。
 * @param  {[Element]} els 选取的目标元素集
 * @param  {...Value} vals 取值序列（依不同的属性目标而异）
 * @return {[Value]} 额外实参集
 */
export function propertyData2( els, ...vals ) {
    let _typ = getType( els[0] ),
        _fun = customDataMore[ _typ ];

    return _fun ? _fun( els, ...vals ) : arrayValue( els, dataValue2(vals) );
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
//
customGetter( On, 'p', __Kit,
    Object.keys( __Kit ).filter( n => n[0] !== '_' )
);
