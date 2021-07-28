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
    c:          CPP,
    cpp:        CPP,
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
// 使用 LangMap 中配置的具体实现。
//
class Hicolor {
    /**
     * @param {String} lang 语言名
     * @param {String} text 待解析文本
     */
    constructor( lang, text ) {
        this._code = text;
        this._lang = lang;
        this._inst = lang && new ( languageClass(lang) )();
    }


    /**
     * 执行语法着色解析。
     * 源文本中可能嵌入其它语言代码，会执行其Hicolor解析，
     * 因此结果集里可能包含子块封装。
     * 返回值：
     * Object3 {
     *      type?: {String}
     *      text:  {String|[Object3]}
     *      block?:[String, String]
     * }
     * Object2 {
     *      // 子块封装
     *      lang: 子块语言。
     *      data: 子块解析集{[Object3|Object2]}，结构相同。
     * }
     * @return {[Object3|Object2]} 结果集
     */
    effect() {
        let _buf = [];

        for ( const obj of this._inst.parse(this._code) ) {
            let _hi = obj instanceof Hicolor;
            if ( !_hi ) {
                _buf.push( obj );
                continue;
            }
            _buf.push( {lang: obj.lang(), data: obj.effect()} );
        }

        return _buf;
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
}


// 导出
export { Hicolor };