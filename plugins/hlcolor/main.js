//! $Id: plugins/hlcolor 2021.01.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用框架。
//
//  对字符串进行有序的迭代解析。按顺序剥离特定的语法结构后，剩余部分将更容易处理。
//  各语言继承 Hicode 实现，初始传递匹配器序列（Object3）。
//
//  Object3: {
//      begin: {RegExp} 起始匹配式。取[1]为文本，可为空。
//      end:   {RegExp} 结束匹配式。同上，可选。
//      type:  {String|Function} 类型名或进阶处理器。
//  }
//  Object3.type: {
//      String   语法词，如：keyword, string, operator...
//      Function 进阶处理器：function(text): Hicolor | [Object2]
//  }
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
    // 高亮名清单见../plugins/hicolor，角色名为高亮元素<b>中的role值。
    //
    __Roles = {
        'keyword':      'kw',   // 关键字
        'literal':      'lit',  // 字面值（如 true, iota）
        'string':       'str',  // 字符串
        'function':     'fn',   // 函数名
        'operator':     'op',   // 运算符
        'datatype':     'dt',   // 数据类型
        'xmltag':       'tag',  // 标签名
        'attribute':    'an',   // 属性名（attribute-name）
        'selector':     'slr',  // CSS选择器
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'xmlcdata':     'cd',   // <![CDATA[...
        'regexp':       're',   // 正则表达式
        'color16':      'c16',  // CSS 16进制颜色 #fff #f0f0f0
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释内容
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 注释类型名。
    __cmtName = 'comments';



//
// 语法高亮处理器。
// 1. 源码按正则式解析为“未匹配串+匹配封装对象”的数组。
// 2. 按目标语言配置的正则集顺序，迭代处理前阶的未匹配串。
// 3. 压平结果数组，包装输出字符串和封装对象代码。
//
class Hicolor {
    /**
     * @param {String} lang 语言名
     * @param {String} text 待解析文本
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
     * 即时分析词汇语法。
     * @param  {String} word 目标词
     * @return {Object2} 结果对象
     */
    analyze( word ) {
        return this._obj.analyze( word );
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

export { Hicolor };
