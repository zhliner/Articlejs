//! $Id: coloring.js 2020.02.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮即时分析封装工具集。
//  用于高亮代码中即时编辑即时着色的场景。
//
//  这里并不提供具体语言的高亮匹配语法解析，它们由插件（/plugins/hlcolor）实现。
//  反而，这里的工具函数需要该插件的支持（Hicode.parse）。
//
//  功能：
//
//  根据当前光标点（Range）获取当前行、当前单词。
//  也即提取 Hicode.parse() 中的 code 实参。
//
//  支持当前光标点所在“环境”，根据环境的不同而有不同的处理：
//  - 顶层代码环境：即可编辑元素顶层根容器，正常解析。
//  - 局部语法环境：注释内编辑不启动解析；字符串内编辑为切分解析（与顶层平级）。
//
//
//  跨行语法：
//  代码表中的单行如果包含跨行的语法，则该语法通常会不完整。
//  这样的语法有：块注释、JS的模板字符串、其它语言的多行字符串等。
//
//  这可以通过临时补齐边界字符的方式解决：
//  - 起始：末端补齐结束标识，无论用户是否删除起始标识。
//  - 中段：两端补齐边界标识，行内可能有切分解析的逻辑（如模板字符串）。
//  - 末尾：行首补齐开始标识，无论用户是否删除结束标识。
//
//  这可能对未被编辑的行产生影响，因此需要对关联行段完整解析修正（或手动要求）。
//  这可能由Hicolor配置支持以实现通用的处理方式。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$,

    // 高亮名:角色映射。
    // 高亮名用于具体语言中使用，角色名用于封装元素<b>中的role值。
    // 此处的高亮名用于语言实现中的规范名称（type）。
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
        'regex':        're',   // 正则表达式
        'selector':     'slr',  // 选择器（ID, class, 伪类）
        'rgba':         'rgb',  // RGB, RGBA: #fff, #f0f0f0, rgb(214, 86, 0)
        'hsla':         'hsl',  // HSL, HSLA: hsl(24deg, 100%, 42%)
        'unit':         'un',   // CSS单位
        'important':    'imp',  // 重要（CSS: !important; C/C++: 预处理器）
        'doctype':      'doc',  // <!DOCTYPE ...>
        'error':        'err',  // 错误提示
        'comments':     null,   // 注释（单独封装）
    },

    // 未定义类型替换。
    __nonRole = 'non',

    // 字符串类型名。
    __strName = 'string',

    // 注释类型名。
    __cmtName = 'comments',

    // 缺位边界符存储特性。
    __atnVacant = 'data-v',

    // 缺位边界符分隔符。
    __vacApart = ',';



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 构建代码块高亮源码。
 * 注释用<i>封装，字符串用<s>封装。
 * @param  {String} text 待封装文本
 * @param  {String} type 代码类型，可选
 * @param  {String} vac 补齐的边界符（a,b|a,|,b），可选
 * @return {String} HTML高亮源码
 */
function codeHTML( text, type, vac = '' ) {
    if ( type == null ) {
        return text;
    }
    vac = vac && ` ${__atnVacant}="${vac}"`;

    if ( type == __strName ) {
        return `<s${vac}>${text}</s>`;
    }
    if ( type == __cmtName ) {
        return `<i${vac}>${text}</i>`;
    }
    return `<b role="${__Roles[type] || __nonRole}"${vac}>${text}</b>`;
}



//
// 导出函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 构建代码块高亮源码。
 * 块数据边界符完整，无需标注。
 * 注记：结果会被插入到<pre/code>内。
 * Object: { text, type?, block? }
 * @param  {[Object]} obj 解析结果对象集（单语言）
 * @return {String} HTML高亮源码
 */
export function htmlBlock( obj ) {
    //
}


/**
 * 构建代码表高亮源码。
 * 块类数据会被分开封装到多个<li/code>内，
 * 因此需要标注缺失的边界符，这由元素的data-v特性存储。
 * Object: { text, type?, block? }
 * @param  {[Object]} obj 解析结果对象集（单语言）
 * @return {[String]} HTML高亮源码集
 */
export function htmlList( obj ) {
    //
}
