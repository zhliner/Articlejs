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
//  解析顺序是由各自语言自己定义的。
//
//  注记：
//  第三方对字符串解析的返回值有3种结果：
//  1. 字符串：未被匹配的剩余字符串，需要下一阶的解析匹配。
//  2. 结构块：内部包含更细粒度的语法结构，需要按其自身规则解析。接口：parse(): Value3
//  3. 着色件：已经为最终的着色单元，可输出为规范的代码着色结构（<b role=xx>|<i>）。接口：toString()
//
//  可配置性：
//  用户可自行配置类名映射：语言自身的语法分类词 => 文档代码高亮类名。
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 语法高亮解析类。
// - 使用后续Hicoder类构造封装对象；
// - 如果源码属于内嵌的语言，可进行注明；
// 原理：
// 1. 源码按正则式解析为“未匹配串+匹配封装对象”的数组；
// 2. 按目标语言配置的正则集顺序，迭代处理前阶的未匹配串；
// 3. 压平结果数组，包装输出字符串和封装对象代码；
// 要点：
// - 解析形成一个数组树，不会打乱源码顺序，压平输出即可；
//
// @param {string} code 待解析源码
// @param {array} regs  目标正则配置集
// @param {string} lang 源码所属语言注明，可选
//
Class.Hiparse = function( code, regs, lang )
{
	this._code = code;
	this._regs = regs || null;

	this._lang = lang || '';
};


Class.Hiparse.prototype = {
	/**
	 * 解析获取高亮代码。
	 * - 空白字符串无需进一步匹配处理；
	 * - 返回直接文本和标识包装的混合串；
	 * 返回值：[
	 *  	{string},  // 高亮代码字符串
	 *  	{
	 *  		lang: {string}  // 嵌入语言名
	 *  	 	data: {array}  	// 迭代封装：[string, object]
	 *  	},...
	 * ]
	 * @return {array} 高亮代码集
	 */
	'get': function()
	{
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
	},


	/**
	 * 返回语言名。
	 * @return {string}
	 */
	'lang': function()
	{
		return this._lang;
	},


	//-- 私有辅助 -------------------------------------------------------------


	/**
	 * 迭代解析缓存集。
	 * - 对未处理字符串迭代匹配解析；
	 * - 纯空白字符串略过匹配处理；
	 * regs成员接口：{
	 *  	item  正则匹配式
	 *  	fun   定制调用句柄，接口：function(reg, str) return array
	 *  	css   高亮名称
	 * }
	 * @param {array} buf 源数据缓存
	 * @param  {array} regs 正则配置集
	 * @return {array} 解析集
	 */
	'_parse': function( buf, regs )
	{
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
	},

};



//
// 高亮代码包装类。
// - 结构：<b class="[name]">[text]</b>；
// - 接口：html()，与Hlighter相同；
// 注：
// - 无名称指定时不设置类名；
// - 内部单元划分用<b>，外部应当<code>封装；
//
// @param {string} text 高亮内容
// @param {string} name 高亮名
//
Class.Hicoder = function( text, name )
{
	this._text = text;
	this._cls = name ? (this._cssMap[name] || '_non') : null;
};


Class.Hicoder.prototype = {
	/**
	 * 构造高亮代码。
	 * @return {string}
	 */
	'html': function()
	{
		var _cls = this._cls
			? ' class="' + this._cls + '"'
			: '';
		return '<b' + _cls + '>' + this._text + '</b>';
	},


	//
	// 高亮名/类名映射。
	//
	'_cssMap':
	{
		'comments': 	'_cmt', 	// 通用注释
		'string': 		'_str', 	// 字符串 string
		'keyword': 		'_kws', 	// 关键字 keywords
		'doctype': 		'_doc', 	// <!DOCTYPE ...>
		'xmltag': 		'_tag', 	// 标签（含css中的选择器）
		'selector': 	'_slr', 	// CSS选择器（类、ID、:xxx）
		'attribute': 	'_atn', 	// 属性名（html、css）
		'attrvalue': 	'_atv', 	// 属性值（html）
		'function': 	'_fun', 	// 函数名 function
		'datatype': 	'_dtt', 	// 数据类型
		'important': 	'_imp', 	// !important（css）、预处理器（c/c++）
		'xmlcdata': 	'_cdt', 	// <![CDATA[...
		'regexp': 		'_rex', 	// 正则表达式直接量
		'color16': 		'_c16', 	// CSS 16进制颜色 #fff #f0f0f0
	},

};

