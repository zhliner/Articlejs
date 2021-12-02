//! $ID: api.js 2021.10.21 Cooljed.Base $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  编辑器基础Api定义集。
//  主要包含内容区各条目的提取/设置、大纲列表内容和帮助侧栏等部分。
//
//  注意：
//  如果对内容区执行了设置操作，会清空编辑历史栈。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";
import { Local } from "../config.js";
import * as T from "./types.js";
import { create } from "./create.js";
import { resetState, topInsert } from "./edit.js";


// 各主要区域根元素集
let
    __outline,
    __editor ,
    __content,
    __help,
    __beeptip;


const Api = {
    /**
     * 初始数据设置。
     * @param  {String} outline 大纲元素根（<aside>）选择器
     * @param  {String} editor 编辑器容器根（<div>）选择器
     * @param  {String} content 编辑器内容根（<main>）选择器
     * @param  {String} help 帮助面板根（<aside>）选择器
     * @param  {String} beeptip 提示音元素（<audio>）选择器
     * @return {void}
     */
    init( outline, editor, content, help, beeptip ) {
        __outline = $.get( outline );
        __editor  = $.get( editor );
        __content = $.get( content );
        __help    = $.get( help );
        __beeptip = $.get( beeptip );

        window.console.info( __outline, __editor, __content, __help, __beeptip );
    },


    /**
     * 获取/设置主标题。
     * 仅指标题内容，不含标题元素（<h1>）自身。
     * 如果标题元素不存在，设置时会新建一个<h1>标题元素。
     * @param  {String} cons 标题源码
     * @return {String|void}
     */
    heading( cons ) {
        let _h1 = $.get( 'h1', __content );

        if ( cons === undefined ) {
            return _h1 && $.html( _h1 );
        }
        resetState();
        if ( !_h1 ) {
            _h1 = $.prepend( $.get('hgroup', __content) || __content, $.elem('h1') );
        }
        $.html( _h1, cons );
    },


    /**
     * 获取/设置副标题。
     * 仅指标题内容，不含副标题元素（<h3>）自身。
     * 设置时默认会移除原有的副标题集，除非传递add实参为true。
     * @param  {String|[String]} cons 副标题源码（组）
     * @param  {Boolean} add 为添加模式，可选
     * @return {[String]|void}
     */
    subtitle( cons, add ) {
        let _hg = $.get( 'hgroup', __content ),
            _h3s = _hg ? $.find( '>h3', _hg ) : [];

        if ( cons === undefined ) {
            return _h3s.map( h3 => $.html(h3) );
        }
        resetState();
        if ( !_hg ) {
            _hg = $.prepend( __content, $.elem('hgroup') );
        }
        if ( !add ) {
            _h3s.forEach( h3 => $.remove(h3) );
        }
        $.append( _hg, $(arrValue(cons)).Element('h3') );
    },


    /**
     * 获取/设置文章提要。
     * 返回值是一个两成员数组，其中：
     * [0] 提要名称源码（不含<h3>本身）。
     * [1] 内容源码（顶层条目outerHTML合并串）。
     * 如果提要单元本就不存在，返回null。
     * 设置时，假值实参对于的目标会保持原始内容（无修改）。
     * @param  {String} h3 提要名称
     * @param  {String} cons 内容源码（顶层outerHTML）
     * @return {[String2]|null|void} [小标题, 内容源码]
     */
    abstract( h3, cons ) {
        let _box = $.get( '>header[role=abstract]', __content );

        if ( h3 === undefined && cons === undefined ) {
            return _box && getBlock1( _box );
        }
        resetState();
        return updateBlock1( h3, cons, _box, T.ABSTRACT );
    },


    /**
     * 获取/设置文章主区内容。
     * 不含封装内容的<article>容器元素自身。
     * @param  {String} cons 内容源码
     * @return {String|null|void}
     */
    article( cons ) {
        let _el = $.get( 'article', __content );

        if ( cons === undefined ) {
            return _el && $.html( _el );
        }
        resetState();
        topInsert( T.ARTICLE, $.Element('article', cons) );
    },


    /**
     * 获取/设置另见条目集。
     * 返回的条目集不包含条目容器<li>元素，而是内容的源码。
     * 仅在设置时需要提供可选的小标题。
     * @param  {String} h3 小标题（如：'另参见'），可选
     * @param  {[String]} cons 内容源码集
     * @return {[String, [String]]|null|void} [小标题, 内容清单（<li>内容集）]
     */
    seealso( h3, cons ) {
        let _box = $.get( '>aside[role=seealso]', __content );

        if ( h3 === undefined && cons === undefined ) {
            return _box && getBlock2( _box, 'ul' );
        }
        resetState();
        return updateBlock2( h3, cons, _box, 'ul', T.SEEALSO );
    },


    /**
     * 获取/设置参考条目集。
     * 返回的条目集不包含条目容器<li>元素，而是内容的源码。
     * 仅在设置时需要提供可选的小标题。
     * @param  {[String]} cons 内容源码集
     * @param  {String} h3 小标题（如：'文献参考'），可选
     * @return {[String, [String]]|null|void} [小标题, 内容清单（<li>内容集）]
     */
    reference( cons, h3 ) {
        let _box = $.get( '>nav[role=reference]', __content );

        if ( h3 === undefined && cons === undefined ) {
            return _box && getBlock2( _box, 'ol' );
        }
        resetState();
        return updateBlock2( h3, cons, _box, 'ol', T.REFERENCE );
    },


    /**
     * 获取/设置文章声明。
     * 返回值是一个两成员数组，其中：
     * [0] 声明名称源码（不含<h3>本身）。
     * [1] 内容源码（顶层条目outerHTML合并串）。
     * 如果声明单元本就不存在，返回null。
     * 设置时，假值实参对于的目标会保持原始内容（无修改）。
     * @param  {String} h3 声明名称
     * @param  {String} cons 内容源码（顶层outerHTML）
     * @return {[String2]|null|void} [小标题, 内容源码]
     */
    footer( h3, cons ) {
        let _box = $.get( '>footer', __content );

        if ( h3 === undefined && cons === undefined ) {
            return _box && getBlock1( _box );
        }
        resetState();
        return updateBlock1( h3, cons, _box, T.FOOTER );
    },


    /**
     * 获取全部内容
     * 包括主/副标题、提要、文章主体（<article>）和另见/参考/声明等。
     * 为各部分的outerHTML源码本身。
     * 注意：
     * 此处不再强约束，内容应当符合文章结构规范。
     * @param  {String} html 全部内容源码
     * @return {String|void}
     */
    content( html ) {
        if ( html === undefined ) {
            return $.html( __content );
        }
        $.html( __content, html );
    },


    /**
     * 获取/设置主题样式。
     * @param  {String} url 主题样式URL
     * @return {String|Promise<Element|Error>}
     */
    theme( url ) {
        let _el = $.get( Local.styleTheme );
        return url === undefined ? _el.href : loadStyle( _el, url );
    },


    /**
     * 获取/设置内容样式。
     * @param  {String} url 内容样式URL
     * @return {String|Promise<Element|Error>}
     */
    style( url ) {
        let _el = $.get( Local.styleMain );
        return url === undefined ? _el.href : loadStyle( _el, url );
    },


    /**
     * 获取/设置内容代码样式。
     * @param  {String} url 内容代码样式URL
     * @return {String|Promise<Element|Error>}
     */
    codes( url ) {
        let _el = $.get( Local.styleCodes );
        return url === undefined ? _el.href : loadStyle( _el, url );
    },

};


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 检查&构造为数组返回。
 * @param  {Value|[Value]} val 目标值
 * @return {[Value]}
 */
function arrValue( val ) {
    return $.isArray( val ) ? val : [ val ];
}


/**
 * 获取块单元内容（h3+内容集）。
 * @param  {Element} box 单元根容器
 * @return {[String2]} [小标题, 内容源码]
 */
function getBlock1( box ) {
    let _h3 = $.get( 'h3', box );

    return [
        _h3 && $.html( _h3 ),
        $( '>*', box ).not( 'h3' ).prop( 'outerHTML' ).join( '' )
    ];
}


/**
 * 更新块单元（h3+内容集）
 * h3 和 cons 为假值者，不会更新相应的项（保持原值）。
 * @param  {String} h3 小标题
 * @param  {String} cons 内容源码（顶层outerHTML）
 * @param  {Element} box 块元素
 * @param  {Number} type 单元类型值
 * @return {void}
 */
function updateBlock1( h3, cons, box, type ) {
    let _h3 = box && $.get( 'h3', box ),
        $els = box && $( '>*', box ).not( 'h3' );

    topInsert(
        type,
        create( type, {h3: h3 || _h3 && $.text(_h3)}, cons ? [...$.fragment(cons).children] : $els, true )
    );
}


/**
 * 获取块单元内容（h3+列表）
 * @param  {Element} box 块单元容器
 * @return {[String, [String]]} [小标题, 内容清单（<li>内容集）]
 */
function getBlock2( box, tag ) {
    let _h3 = $.get( 'h3', box ),
        _xl = $.get( `>${tag}`, box );

    return [
        _h3 && $.html( _h3 ),
        _xl && $.children( _xl ).map( li => $.html(li) )
    ];
}


/**
 * 更新块单元（h3+列表）
 * 如果条目源码集实参为假，则不会改变清单内容。
 * @param  {String} h3 小标题
 * @param  {[String]} cons 条目源码集
 * @param  {Element} box 块容器
 * @param  {String} tag 清单容器标签（ul|ol）
 * @param  {Number} type 块类型值
 * @return {void}
 */
function updateBlock2( h3, cons, box, tag, type ) {
    let _h3 = box && $.get( 'h3', box ),
        _xl = box && $.get( `>${tag}`, box );

    if ( cons ) {
        _xl = $.elem( tag );
        $.append( _xl, $(arrValue(cons)).wrap('<li>') );
    }
    topInsert( type, create(type, {h3: h3 || _h3 && $.text(_h3)}, _xl) );
}


/**
 * 导入样式。
 * @param  {Element} el 样式元素（<link>）
 * @param  {String} url 样式文件URL
 * @return {Promise<Element|Error>}
 */
function loadStyle( el, url ) {
    return new Promise( function(resolve, reject) {
        $.one(el, {
            'load':  () => resolve( el ),
            'error': err => reject( err ),
        });
        $.attr( el, 'href', url );
    });
}



// expose
//////////////////////////////////////////////////////////////////////////////

export default Api;
