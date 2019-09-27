;(function( $, T ) {

//
// 示例集。
// - OBT解析（Core.obts）；
// - PB样式属性名标准化（data-pb）；
// 注：
// - 类似Golang的ExampleXxx示例功能；
// - 可能需要结合PB:$.elem转换使用；
//
let Example = {
	/**
	 * 源码格式化。
	 * - 取目标元素/集源码（outer）；
	 * - 多个目标元素源码用换行连接；
	 * @data: Element[s]
	 * @next: String
	 * @param {String} tab 前置缩进字符串，可选
	 */
	fmt( ev, tab = '\t' ) {
		return this.next(
			$(this.data).map( el => htmlFormat(el, tab) ).join('\n')
		);
	},


	/**
	 * 源码输出。
	 * - 目标为一个textarea元素；
	 * @data: String
	 * @param {String} tid 文本框元素标识
	 */
	put( ev, tid = null ) {
		this.$elem(tid).prop('value', this.data);
		return this.next();
	},


	/**
	 * OBT属性校正。
	 * - 仅在用不同的属性定义时需要；
	 * - 待校正名称为前缀字符连接实际的On/By/To名称（若未修改则为标准名称）；
	 * 注：
	 * - 用户可能会采用与真实解析名不同的OBT名称，在此修改以便于OBT解析；
	 * - 标准OBT名称可能已经被应用重定义，此仅去除前缀后写入新属性名；
	 * @data: Element[s]
	 * @param {String} prefix 前缀字符
	 */
	obt( ev, prefix ) {
		let _obt = T.Core.obtAttr(),
			_ns3 = _obt.map( n => prefix + n );

		for (let el of $(this.data)) {
			let _val = [...$.attr(el, _ns3).values()];

			$.attr( el, arr2Obj(_obt, _val) );
			$.removeAttr(el, _ns3);
		}

		return this.next();
	},


	/**
	 * PB样式属性名设置。
	 * - 即转换到data-pb标准属性名；
	 * - 仅在定义了不同的属性名时需要；
	 * @data: Element[s]
	 * @param {String} name 属性名
	 */
	pbn( ev, name ) {
		for (let el of $(this.data)) {
			$.attr( el, __pbAttr, $.attr(el, name) );
			$.removeAttr(el, name);
		}
		return this.next();
	},


	/**
	 * 执行。
	 * - OBT解析、构建并绑定；
	 * - 不支持板块载入回调（App）；
	 * @data: Element[s]
	 */
	run(/* ev */) {
		for (let el of $(this.data) ) {
			T.Core.obts( el, this );
		}
		return this.next();
	},


	/**
	 * 结果显示（流程数据）。
	 * - 仅支持单个目标容器；
	 * 输出：{
	 *  	-1 	容器内顶部
	 *  	0 	填充（先清空）
	 *  	1 	内末尾添加
	 * }
	 * @data: Element[s]
	 * @param {String} rid 目标容器标识
	 * @param {Number} pos 填充标识
	 */
	show( ev, rid, pos = 0 ) {
		let _box = this.$elem(rid, true),
			_mth = {
				'-1': 'prepend',
				'0':  'fill',
				'1':  'append',
			};
		if (_box) {
			$[ _mth[pos] ](_box, this.data);
		}
		return this.next();
	},


	/**
	 * 在嵌入框架中显示内容。
	 * - 覆盖框架的全部内容；
	 * - 框架需要遵循同源策略；
	 * @param {String} rid 框架标识
	 */
	frame( ev, rid ) {
		let _frm = this.$elem(rid, true);
		if (_frm) {
			$.fill(_frm.contentDocument.body, this.data);
		}
		return this.next();
	},

};

T.pbs({ eg: Example });


/**
 * 将键值数组转换为一个对象。
 * - 两个数组取键值按下标一一对应；
 * - 重复的键会被后来者覆盖掉；
 * @param  {Array} keys 键名数组
 * @param  {Array} vals 值数组
 * @return {Object}
 */
 function arr2Obj( keys, vals ) {
	let _i = 0;

	return keys.reduce(
		(obj, k) => (obj[k] = vals[_i++], obj), {}
	);
}


// 源码格式化
// 强制清理，统一格式。
///////////////////////////////////////////////////////////////////////////////


/**
 * 元素源码格式化。
 * - 仅支持元素、文本和注释节点；
 * - 内容纯空白的节点会被压缩为空节点；
 * - 外部调用时，nd通常为元素（文本节点意义不大）；
 *   （OBT示例时，元素自身更重要）
 * @param  {Node} nd 目标节点
 * @param  {String} tab 缩进字符串
 * @param  {String} prefix 前置字符串
 * @return {String} 格式串
 */
 function htmlFormat( nd, tab, prefix = '', newline = false ) {
	switch (nd.nodeType) {
	case 1:
		return newLine('', prefix, newline) + (
			keepHTML(nd) || elemString(nd, tab, prefix)
		);
	case 3:
		// 避免原始空白/换行叠加
		return nd.textContent.trim();
	case 8:
		return newLine('', prefix, newline) + `<!--${nd.data}-->`;
	}
	return '';
}


/**
 * 元素自身格式化。
 * - 内联元素自身和内部不起新行；
 * - 块级元素自身强制起新行；
 * - 块级元素内仅含单个文本节点时不起新行；
 * @param  {Element} el 当前元素
 * @param  {String} tab 缩进字符串
 * @param  {String} prefix 前置字符串
 * @return {String} 格式串
 */
function elemString( el, tab, prefix = '' ) {
	let _tag = el.tagName.toLowerCase(),
		_sng = singleElem[_tag],
		_htm = `<${_tag}${attrString(el.attributes, !_sng)}`,
		_con = '';

	if (_sng) {
		return _htm + ' />';
	}
	let _ns = el.childNodes;
	for ( let i = 0; i < _ns.length; i++ ) {
		// !inlineElem[_tag]
		// 块元素内首层强制换行
		_con += htmlFormat(_ns[i], tab, prefix + tab, !inlineElem[_tag]);
	}

	// 单个文本节点时不起新行
	if (_con && (_ns.length > 1 || _ns[0].nodeType == 1)) {
		_con += newLine(_tag, prefix);
	}

	return _htm + _con + `</${_tag}>`;
}


/**
 * 元素属性序列。
 * - 指目标元素内的属性序列，不含内容和结尾标签；
 *   如：<a href="#" target="_blank">
 * - 空值属性保持为单属性标志状态（无=）；
 *
 * @param  {NamedNodeMap} attrs 元素属性集
 * @param  {Boolean} close 是否闭合标签（>）
 * @return {String}
 */
function attrString( attrs, close ) {
	let _ats = '';

	for ( let i = 0; i < attrs.length; i++ ) {
		let _at = attrs[i];
		_ats += ` ${_at.name}` + (_at.value === '' ? '' : `="${_at.value}"`);
	}
	return close ? _ats + '>' : _ats;
}


/**
 * 新行缩进。
 * - 用于块级元素自我换行缩进；
 * @param  {String} tag    元素标签名
 * @param  {String} indent 缩进字符串
 * @param  {Boolean} force 强制换行
 * @return {String}
 */
function newLine( tag, indent = '', force = false ) {
	return tag && !inlineElem[tag] || force ? '\n' + indent : '';
}


/**
 * 返回原始保持内容。
 * - 仅用于<code>和<pre>元素；
 * - 源码为outerHTML，故返回空串表示元素不匹配；
 * @param  {Element} el 目标元素
 * @return {String} 源码
 */
function keepHTML( el ) {
	let _tag = el.nodeName;
	return _tag == 'CODE' || _tag == 'PRE' ? $.prop(el, 'outerHTML') : '';
}


//
// HTML单标签集。
// 注：用于标签的友好关闭（/>）。
//
const singleElem = {
	'hr': 		1,
	'img': 		1,
	'input': 	1,
	'param': 	1,
	'base': 	1,
	'meta': 	1,
	'link': 	1,
	'frame': 	1,
	'keygen': 	1,
	'area': 	1,
	'source': 	1,
	'track': 	1,
	'wbr': 		1,
	'br': 		1,
};


//
// 内联元素标签集。
// 注：内部内容不用换行。
//
const inlineElem = {
	'embed': 	1,
	'br': 		1,
	'img': 		1,
	'audio': 	1,
	'video': 	1,
	'a': 		1,
	'strong': 	1,
	'b': 		1,
	'em': 		1,
	'i': 		1,
	'q': 		1,
	'abbr': 	1,
	'cite': 	1,
	'small': 	1,
	'time': 	1,
	'del': 		1,
	'ins': 		1,
	'sub': 		1,
	'sup': 		1,
	'mark': 	1,
	'code': 	1,
	'ruby': 	1,
	'rt': 		1,
	'rp': 		1,
	'wbr': 		1,
	'span': 	1,
	'dfn': 		1,
	'samp': 	1,
	'kbd': 		1,
	'var': 		1,
};

}( tQuery.proxyOwner(), Tpb );