//! $ID: main.js 2021.01.19 Cooljed.HLParse $
// ++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  语言支持配置和基础类（Hicolor）实现。
//  支持灵活的子语法块嵌入和复用。
//
//
//  第三方共享：
//  各语言的实现可以导出以共享，相互嵌入对方的解析器（Hicolor实例）。
//  这在匹配模式的处理器（handle）中返回 Hicolor 实例即可（参看 html.js 实现）。
//  例：
//  HTML 中的样式元素（<style>）和脚本元素（script）内的代码。
//  实例创建仅需传递源码文本和第三方实现采用的语言名或此处配置的别名。
//
//
//  内部子语法块：
//  当前语言内由特定标记匹配的子语法块，可以实现 Hicode 继承，然后作为 Hicolor 构造函数的实参。
//  此时 Hicolor 中没有语言定义，其解析结果会被提取展开到上级。
//  例：
//  CSS 中的属性值定义（花括号包围）部分，就可以作为一个单独的子语法块来处理，
//  避免属性值和外围选择器中的标签名重叠的额外处理。如选择器 pre 和 属性值 pre-wrap 部分重叠。
//
//
//  类型内的子语法块：
//  如果子语法块存在于有特定类型的源码中，此时不能直接返回 Hicolor 实例，
//  而只能在解析结果 Object2{type, text} 中，将内部的解析结果集附加在 text 属性上。
//  此时解析结果只能是 {[String|Object2]}。
//  例：
//  - HTML 中内联样式值属于字符串（string）类型，但内部也可以进行 CSSAttr 解析。
//  - 注释内对 @xxx 类格式的解析也同此，上层属于 comments 类型。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Hicode } from "./base.js";

//
// 支持的语言清单。
//
import { Normal }       from "./languages/normal.js";
import { Go }           from "./languages/golang.js";
import { JavaScript }   from "./languages/javascript.js";
import { CSS }          from "./languages/css.js";
import { HTML }         from "./languages/html.js";
import { CPP }          from "./languages/cplus.js";


//
// 语言映射配置。
// 所支持语言视./languages/目录内的实现而定。
// 支持多名称（别名）映射。
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
    cpp:        CPP,
    c:          CPP,
    cplus:      CPP,
};


// 简单出错。
const error = msg => { throw new Error(msg) };


/**
 * 获取目标语言的实现。
 * @param  {String} lang 语言名
 * @return {Class} 类实现
 */
function languageClass( lang ) {
    return __langMap[lang] || error( `[${lang}] language is not supported.` );
}



//
// 语法高亮处理器。
// 使用 __langMap 中配置的具体实现。
//
class Hicolor {
    /**
     * @param {String} text 待解析文本
     * @param {String|Hicode} lang 语言名或解析器实例
     */
    constructor( text, lang ) {
        this._code = text;

        if ( lang instanceof Hicode ) {
            this._inst = lang;
        } else {
            this._inst = new ( languageClass(lang) )();
            this._lang = lang;
        }
    }


    /**
     * 执行语法着色解析。
     * 源文本中可能嵌入其它语言代码，会执行其Hicolor解析，
     * 因此结果集里可能包含子块封装。
     * 返回值：
     * Object2 {
     *      type?: {String}
     *      text:  {String|[Object2|String]}
     * }
     * Object2x {
     *      // 子语法块封装
     *      lang:String  子块语言，可选
     *      data:[Object2|Object2x]  子块解析集，结构相同。
     * }
     * @return {[Object2|Object2x]} 结果集
     */
    effect() {
        let _buf = [];

        for ( const obj of this._inst.parse(this._code) ) {
            if ( !(obj instanceof Hicolor) ) {
                _buf.push( obj );
                continue;
            }
            _buf.push( {lang: obj.lang(), data: obj.effect()} );
        }

        return this.merge( this.flat(_buf) );
    }


    /**
     * 返回语法解析器。
     * 主要用于调用其analyze()实时解析。
     * @return {Hicode} 解析实例（子类）
     */
    parser() {
        return this._inst;
    }


    /**
     * 返回语言名。
     * @return {string|null}
     */
    lang() {
        return this._lang || null;
    }


    /**
     * 解析结果扁平化。
     * 将无语言指定的子语法块解析结果展开到上级，
     * 有具体语言指定的保持原样。
     * 注记：
     * 同一语言内局部的子语法块可以创建为Hicolor，此时语言无需指定。
     * 这一策略可以分解复杂性。
     * @param  {[Object2|Object2x]} objs 解析结果集
     * @return {[Object2|Object2x]}
     */
    flat( objs ) {
        let _buf = [];

        for ( const o of objs ) {
            if ( !o.data || o.lang ) {
                _buf.push( o );
            } else {
                _buf.push( ...this.flat(o.data) );
            }
        }
        return _buf;
    }


    /**
     * 将连续的纯文本（没有类型）的结果合并。
     * @param  {[Object2|Object2x]} objs 解析结果集
     * @return {[Object2|Object2x]}
     */
    merge( objs ) {
        let _buf = [], _txt = [];

        for ( const o of objs ) {
            if ( o.text && !o.type ) {
                _txt.push( o.text );
                continue;
            }
            this._txtbuf(_buf, _txt).push( o );
        }
        return this._txtbuf( _buf, _txt );
    }


    /**
     * 纯文本结果集处理。
     * 合并文本创建为一个纯文本对象（{text}）。
     * @param  {[Object2|Object2x]} buf 结果集
     * @param  {[Object2]} txt 纯文本结构集
     * @return {[Object2|Object2x]} buf
     */
    _txtbuf( buf, txt ) {
        if ( txt.length > 0 ) {
            buf.push( { text: txt.join('') } );
            txt.length = 0;
        }
        return buf;
    }
}


// 导出
export { Hicolor };