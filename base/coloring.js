//! $Id: coloring.js 2020.02.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮着色渲染工具集。
//
//  将插件（/plugins/hlcolor）解析的结果进行HTML封装。
//  同时也提供代码即时编辑时提取必要的修订文本段。
//
//  跨行语法：
//  代码表中的单行如果包含跨行的语法，则该语法通常会不完整。
//  这样的语法有：块注释、JS的模板字符串、其它语言的多行字符串等。
//
//  这可以通过临时补齐边界字符的方式解决：
//  - 起始：末端补齐结束标识，无论用户是否删除起始标识。
//  - 中段：两端补齐边界标识。
//  - 末尾：行首补齐开始标识，无论用户是否删除结束标识。
//
//  这可能对未被编辑的行产生影响，因此需要对关联行段完整解析修正。
//
//  编辑辅助：
//  根据当前光标点（Range）获取当前行中的需重新渲染的文本段。
//  也即提取 Hicode.parse() 中的 code 实参。
//
//  注记：
//  渲染的HTML结构规范，不存在元素属性值中包含换行符的情况。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
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
    __atnVac = 'data-vac',

    // 缺位边界符分隔符。
    __vacSplit = ',';



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 代码着色封装。
 * @param  {String} text 待封装文本
 * @param  {String} type 代码类型名
 * @return {String} 封装的源码
 */
function colorCode( text, type ) {
    if ( type == null ) {
        return text;
    }
    if ( type == __strName ) {
        return `<s>${text}</s>`;
    }
    if ( type == __cmtName ) {
        return `<i>${text}</i>`;
    }
    return `<b role="${__Roles[type] || __nonRole}">${text}</b>`;
}


/**
 * 含边界符补充的源码封装。
 * @param  {String} text 待封装文本行
 * @param  {String} type 代码类型
 * @param  {String} vac  边界符（,b|a,b|a,）
 * @return {String} HTML高亮源码
 */
function colorVac( text, type, vac ) {
    vac = ` ${__atnVac}="${vac}"`;

    if ( type == __strName ) {
        return `<s${vac}>${text}</s>`;
    }
    if ( type == __cmtName ) {
        return `<i${vac}>${text}</i>`;
    }
    return `<b role="${__Roles[type] || __nonRole}"${vac}>${text}</b>`;
}


/**
 * 边界符构造。
 * - 首行补充结尾（',b'）
 * - 中间行补充两端（'a,b'）
 * - 末行补充开头（'a,'）
 * @param  {String} v1 起始边界符序列
 * @param  {String} v2 结尾边界符序列
 * @return {[String]} [首, 中, 末]
 */
function vacant( v1, v2 ) {
    return [
        `${__vacSplit}${v2}`,      // ',b'
        `${v1}${__vacSplit}${v2}`, // 'a,b'
        `${v1}${__vacSplit}`,      // 'a,'
    ];
}


/**
 * 源码集合并处理。
 * 将临时的存储集合并压入结果对象集，
 * 同时清空临时存储集。
 * @param  {[String]} tmp 源码存储集
 * @param  {[Object|String]} buf 渲染结果集
 * @return {[Object|String]} buf
 */
function htmlMerge( tmp, buf ) {
    if ( tmp.length > 0 ) {
        buf.push( tmp.join('') );
        tmp.length = 0;
    }
    return buf;
}


/**
 * 代码块高亮源码构建。
 * 块数据边界符完整，简单封装即可，无需标注。
 * 注记：结果会被插入到<pre/code>内。
 * Object: { text, type? }
 * @param  {Object} obj 解析结果对象集
 * @return {String} HTML高亮源码
 */
function htmlBlock( obj ) {
    let {text, type} = obj;
    return colorCode( text, type );
}


/**
 * 代码表高亮源码构建。
 * 如果是块类数据，需要检查多行并标注缺失边界符（单行无需标注）。
 * 返回值依然以换行符连接，用于代码表按行切分。
 * Object: {
 *      text, type, block?
 * }
 * @param  {Object} obj 解析结果对象集
 * @return {String} HTML高亮源码
 */
function htmlList( obj ) {
    let {text, type, block} = obj,
        _rows = text.split( '\n' );

    if ( !block || _rows.length < 2 ) {
        return colorCode( text, type );
    }
    let _s1 = _rows.shift(),
        _s2 = _rows.pop(),
        [v1, vv, v2] = vacant( ...block ),
        _buf = [
            colorVac(_s1, type, v1)
        ];

    if ( _rows.length > 0 ) {
        _buf.push( ..._rows.map(s => colorVac(s, type, vv)) );
    }
    _buf.push( colorVac(_s2, type, v2) );

    return _buf.join( '\n' );
}


/**
 * HTML源码构造（渲染）。
 * 将解析结果对象中的文本进行HTML封装，如果有内嵌子块，则递进处理。
 * Object: {
 *      text, type?, block?
 * }
 * 实参 Object2: {
 *      lang: 子块语言
 *      data: 子块解析集（{[Object3|Object2]}）
 * }
 * 返回值：
 * String: 已渲染源码（<b>,<s>,<i>, #text）。
 * Object2: {
 *      lang: 子块语言
 *      data: 子块源码集（{[String|Object2]）
 * }
 * @param  {[Object3|Object2]} objs 解析结果集
 * @param  {Function} html HTML渲染函数（htmlBlock|htmlList）
 * @return {[String|Object2]} 渲染结果集
 */
function colorHTML( objs, html ) {
    let _buf = [],
        _tmp = [];

    for ( const o of objs ) {
        if ( o.text !== undefined ) {
            _tmp.push( html(o) );
            continue;
        }
        htmlMerge( _tmp, _buf );
        _buf.push( {lang: o.lang, data: colorHTML(o.data, html)} );
    }

    return htmlMerge( _tmp, _buf );
}



//
// 导出函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 代码块渲染构造。
 * @param  {[Object3|Object2]} objs 解析结果集
 * @return {[String|Object2]} 渲染结果集
 */
export function blockColorHTML( objs ) {
    return colorHTML( objs, htmlBlock );
}


/**
 * 代码表渲染构造。
 * 需要对块类数据逐行进行边界符标注（首行、中段、尾行）。
 * @param  {[Object3|Object2]} objs 解析结果集
 * @return {[String|Object2]} 渲染结果集
 */
export function listColorHTML( objs ) {
    return colorHTML( objs, htmlList );
}


/**
 * 汇合解析结果集并扁平化。
 * Object2: {
 *      lang: 所属语言
 *      data: 子块源码集（与data相同结构）
 * }
 * 注记：
 * 如果包含其它语言代码的子块，需要扁平化以便于HTML展示，
 * 如插入平级的<li>列表，或者<pre:codeblock>容器内（多个根<code>）。
 *
 * make: function(html, lang): [Element|HTML]
 * @param  {[String|Object2]} data 源码解析数据
 * @param  {String} lang 所属语言
 * @param  {Function} make 每种语言代码的封装回调（<code>|html）
 * @return {[Element|String]} 封装结果集（<code>|html）
 */
export function codeFlat( data, lang, make ) {
    let _buf = [];

    for ( const its of data ) {
        if ( typeof its === 'string' ) {
            _buf.push( ...make(its, lang) );
            continue;
        }
        _buf.push( ...codeFlat(its.data, its.lang, make) );
    }
    return _buf;
}


/**
 * 提取需要重新分析的代码段。
 * 如果光标容器为Text：
 * 分析：取 .wholeText 成员。
 * 替换：
 * - 若在顶层，替换.wholeText本身。
 *   查找前后边界节点：Range.setStartBefore()/Range.setEndAfter()
 * - 若在内部着色容器内，范围为元素自身：Range.selectNode()
 *
 * 如果光标容器为Element：
 * 分析：取 .textContent 成员。
 * 替换：
 * - 若属于顶层元素容器，范围：Range.selectNodeContents()
 * - 若属于内部着色容器，范围为元素自身：Range.selectNode()
 * 注：
 * 用于代码编辑时的实时着色辅助。
 * 如果处理的是代码表行，需要考虑块数据的边界辅助补齐。
 * @param  {Range} rng 光标点范围
 * @return {String}
 */
export function dirtyPart( rng ) {
    //
}
