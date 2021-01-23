//! $Id: plugins/hlcolor 2021.01.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用框架。
//  导入并配置各语言定义的类名映射，多个名称（别名）可指向同一类名。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Go } from "./languages/golang.js";
import { JavaScript } from "./languages/javascript.js";


//
// 语言映射配置。
// 所支持语言视./languages/目录内的实现而定。
// 注：
// 暂不采用import()动态载入方式。
//
const LangMap = {
    go:         Go,
    golang:     Go,
    js:         JavaScript,
    javascript: JavaScript,
};


const
    //
    // 高亮名:角色映射。
    // 高亮名用于具体语言中使用，角色名用于封装元素<b>中的role值。
    //
    __Roles = {
        'keyword':      'kw',   // 关键字
        'literal':      'lit',  // 字面值（如 true, iota）
        'string':       'str',  // 字符串
        'number':       'num',  // 数值
        'function':     'fn',   // 函数名
        'operator':     'op',   // 运算符
        'datatype':     'dt',   // 数据类型
        'xmltag':       'tag',  // 标签名
        'attribute':    'atn',  // 属性名（attribute-name）
        'selector':     'slr',  // CSS选择器
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'regexp':       're',   // 正则表达式
        'rgba':         'rgb',  // RGB, RGBA（#fff, #f0f0f0, #f0f0f080）
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释（单独封装）
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 注释类型名。
    __cmtName = 'comments';



//
// 语法高亮处理器。
// 使用LangMap中配置的具体实现。
//
class Hicolor {
    /**
     * text实参是为了便于封装（嵌入块），
     * 如果仅为了实时分析（），text实参可省略。
     * @param {String} lang 语言名
     * @param {String} text 待解析文本，可选
     */
    constructor( lang, text ) {
        let clss = LangMap[lang];

        if ( !clss ) {
            throw new Error( `[${lang}] language is not supported.` );
        }
        this._lang = lang;
        this._code = text;
        this._inst = new clss();
    }


    /**
     * 解析获取HTML源码。
     * 如果文本中嵌入了其它语言代码，结果集里会包含对象成员。
     * Object: {
     *      lang: 子块语言
     *      html: 子块源码集，可能包含子块嵌套
     * }
     * @return {[String|Object]} 结果集
     */
    html() {
        let _buf = [], _tmp = [];

        for ( const obj of this._inst.parse(this._code) ) {
            let _hi = obj instanceof Hicolor;
            if ( !_hi ) {
                _tmp.push( codeHTML(obj) );
                continue;
            }
            this._string( _tmp, _buf );
            _buf.push( {lang: obj.lang(), html: obj.html()} );
        }

        return this._string( _tmp, _buf );
    }


    /**
     * 返回语法解析器。
     * 注：主要用于调用其analyze()实时解析。
     * @return {x:Hicode} 解析实例
     */
    parser() {
        return this._inst;
    }


    /**
     * 返回语言名。
     * @return {string}
     */
    lang() {
        return this._lang;
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 添加字符串成员。
     * 从子串存储区提取合并添加到结果存储区。
     * 成功提取后会清空原存储区。
     * @param  {[String]} tmp 子串存储区引用
     * @param  {Array} buf 结果存储区引用
     * @return {Array} buf
     */
    _string( tmp, buf ) {
        if ( tmp.length ) {
            buf.push( tmp.join('') );
            tmp.length = 0;
        }
        return buf;
    }

}


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 构建高亮源码。
 * 注：注释包含在<i>元素内。
 * Object2: {
 *      text: {String} 代码文本
 *      type: {String} 代码类型，可选。无此项时即为普通文本
 * }
 * @param  {Object2} obj 解析结果对象
 * @return {String}
 */
function codeHTML( obj ) {
    if ( obj.type == null ) {
        return obj.text;
    }
    if ( obj.type == __cmtName ) {
        return `<i>${obj.text}</i>`;
    }
    return `<b role="${__Roles[obj.type] || __nonRole}">${obj.text}</b>`;
}


//
// 导出
//////////////////////////////////////////////////////////////////////////////

window.Hicolor = Hicolor;

export { Hicolor };
