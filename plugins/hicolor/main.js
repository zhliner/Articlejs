//! $Id: plugins/hlcolor.js 2020.04.24 Articlejs.Plugins $
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用框架。
//
//  对字符串进行有序的迭代解析。按顺序剥离特定的语法结构后，剩余部分将更容易处理。
//  各语言继承 Hicode 实现，初始传递匹配器序列（Object3）。
//
//
//  高亮类型名，由具体的代码解析器用于类型标记：
//  - keyword   关键字
//  - literal   字面值（如 true, iota）
//  - string    字符串
//  - function  函数（名称）
//  - operator  操作符
//  - datatype  数据类型
//  - xmltag    XML/HTML标签
//  - attribute 属性名
//  - selector  CSS选择器
//  - important 重要声明
//  - doctype   文档类型（<!DOCTYPE...>）
//  - xmlcdata  HTML代码片段（<![CDATA[...]]>）
//  - regexp    正则表达式
//  - color16   颜色值（16进制）
//  - error     出错提示
//  - comments  注释
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 语法高亮类。
// 1. 源码按正则式解析为“未匹配串+匹配封装对象”的数组。
// 2. 按目标语言配置的正则集顺序，迭代处理前阶的未匹配串。
// 3. 压平结果数组，包装输出字符串和封装对象代码。
// 注记：
// 解析形成一个数组树，不会打乱源码顺序，压平输出即可。
// @param {string} code 待解析源码
// @param {array} regs  目标正则配置集
// @param {string} lang 源码所属语言注明，可选
//
class Hicolor {
    /**
     * @param {String} lang 语言名
     */
    constructor( lang ) {
        this._lang = lang || '';
    }


    /**
     * 代码文本解析。
     * 返回值：{
     *      text: {String} 代码文本
     *      type: {String} 代码类型，可选。无此项时即为普通文本
     * }
     * @param  {String} text 待解析文本
     * @return {[Object2]} 结果集
     */
    parse( text ) {
        //
    }


    /**?
     * 解析获取高亮代码。
     * - 空白字符串无需进一步匹配处理；
     * - 返回直接文本和标识包装的混合串；
     * 返回值：[
     *      {string},  // 高亮代码字符串
     *      {
     *      lang: {string}  // 嵌入语言名
     *          data: {array}      // 迭代封装：[string, object]
     *      },...
     * ]
     * @return {array} 高亮代码集
     */
    get() {
        if (!this._regs || !this._code.trim()) {
            return [this._code];
        }
        var _buf = this._parse([this._code], this._regs);

        return __U.arrFlat(_buf).map(function(it) {
            // 最终未匹配字串无封装
            if (typeof it == 'string') {
                return it;
            }
            return it.lang
                ? { 'lang': it.lang(), 'data': it.get() }
                : it.html();
        });
    }


    /**
     * 返回语言名。
     * @return {string}
     */
    lang() {
        return this._lang;
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**?
     * 迭代解析缓存集。
     * - 对未处理字符串迭代匹配解析；
     * - 纯空白字符串略过匹配处理；
     * regs成员接口：{
     *      item  正则匹配式
     *      fun   定制调用句柄，接口：function(reg, str) return array
     *      css   高亮名称
     * }
     * @param {array} buf 源数据缓存
     * @param  {array} regs 正则配置集
     * @return {array} 解析集
     */
    _parse( buf, regs ) {
        if (! regs.length) return;

        var _reg = regs[0].item,
            _fun = regs[0].fun;

        buf.forEach(function(its, i) {
            if ($.type(its) !== 'string' || !its.trim()) return;
            if (_fun) {
                buf[i] = _fun(_reg, its);
            } else {
                buf[i] = __U.matchOne(_reg, its, function(prev, txt) {
                    return [prev, new Class.Hicoder(txt, regs[0].css)];
                });
            }
            this._parse(buf[i], regs.slice(1));
        }, this);
        return buf;
    }

};



//
// 代码解析器。
// 实现默认的解析匹配处理，
// 特定的语言实现仅需继承（并定制）即可。
//
class Hicode {
    /**
     * Object3: {
     *      begin: {RegExp} 起始匹配式。取[1]为文本，可为空。
     *      end:   {RegExp} 结束匹配式。同上，可选。
     *      type:  {String|Function} 类型名或进阶处理器。
     * }
     * Object3.type: {
     *      String   语法词，如：keyword, string, operator...
     *      Function 进阶处理器：function(text): Hicolor | [Object2]
     * }
     * 上面返回值：
     * - Hicolor 表示文本为内嵌的其它语言块。
     * - [Object2] 表示定制处理，结果可直接展开构造HTML。
     *
     * @param {[Object3]} matches 匹配器集
     */
    constructor( matches ) {
        this._cfg = matches;
    }


    /**
     * 源码解析。
     * @param  {String} text 源码文本
     * @return {[Object2]} 解析结果对象集
     */
    parse( text ) {
        //
    }


    /**
     * 即时语法分析。
     * 主要用于源码编辑时的实时分析着色。
     * @param  {String} word 目标词
     * @return {Object2} 解析结果对象
     */
    analyze( word ) {
        //
    }

};


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////




//
// 导出
//////////////////////////////////////////////////////////////////////////////

export { Hicolor };
