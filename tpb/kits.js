//! $Id: kits.js 2019.08.18 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  Kits {
//      Util 	实用函数集
//      Spliter 序列分离器
//      Scoper 	净域生成器
//      PbVal 	PB串值类
//      PbElem 	PB元素操作类
//      Loader 	文件载入器
//  }
//
//  命名：
//  前置 $ 字符的名称表示有特别的约定。
//
//
//	依赖：tQuery
///////////////////////////////////////////////////////////////////////////////
//


const
    // 二阶选择器分隔符（/）。
    // 支持前置奇数个\转义字符转义为普通/字符。
    // 注：后行断言（ES2018）。
    __reSplit = /(?<!\\)\/|(?<=[^\\](?:\\\\)+)\//,

    // 相对ID标志匹配
    // 用于提取相对ID（包含前置冒号），支持前置一个反斜线转义冒号为普通字符。
    // 如 `div/p:xyz >b` => `:xyz`
    //
    // CSS标识值匹配：/(?:\\.|[\w-]|[^\0-\xa0])+/
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    //
    // 注：
    // 增加冒号后空白匹配，以支持无值的相对ID：
    //      `div/p: >b`  => `:` => `div/p[data-id]>b`
    //      `div/p:>b`   => `:` => 同上
    //      'div/p:`    => `:` => `div/p[data-id]`
    //      'div/p:xyz` => `:` => `div/p[data-id="xyz"]`
    // 使用后行断言（ES2018）。
    // g标记仅用于替换操作。
    __reRID = /(?<!\\):(?:\\.|[\w-]|[^\0-\xa0]|\s*)+/g,



    // 单引号匹配
    // 前置偶数\时匹配，奇数时不匹配。
    // \\' 引号未被转义
    // \'  引号被转义
    __reSQuote = /(^|[^\\]|(?:\\\\)+)'/g,

    // 去除单引号转义
    // 注：外围单引号已被替换为双引号后，内部转义的单引号不能用转义。
    // str.replace(..., "$1'")
    // \' => '
    // \\' => \\' 不是转义单引号
    // \\\' => \\'
    __reSQuoteESC = /((\\\\)*)(\\?')/g,

    // 调用表达式
    // 注：特别支持前置-（On事件名）。
    __reCall = /^(-?\w[\w.]*)(\([^]*\))*$/;


const
    // 修饰键名映射。
    __Modifier = {
        shift:  'shiftKey',
        alt: 	'altKey',
        ctrl: 	'ctrlKey',
        meta: 	'metaKey',
    },

    // 元素PbVal实例缓存。
    __pbvStore = new WeakMap();



const Util = {
    /**
     * 二阶检索/爬树搜寻。
     *
     * 原理：
     * 通过与目标元素最近的共同祖先容器为起点，向下检索目标元素。
     * 这可以缩小搜索范围、提高效率，还可以降低目标标识名的非重复性要求（可以更简单）。
     *
     * 格式：UpSlr/DownSlr
     * UpSlr:
     *      {Number}    表示递升的层级。
     *      {String}    向上检索匹配的CSS选择器，不含起点元素。
     * DownSlr:
     *      {String}    普通的CSS选择器，支持相对ID。
     *
     * 相对ID：
     *      :XX     前置冒号（:）表示相对ID，即data-id属性的值。如：[data-id='XX']
     *
     * 例：
     * /            单独的 / 表示起点元素自身
     * 0/           0上级，当前起点（同上）
     * 2/           祖父元素（2级，父的父）
     * form/        起点元素上层首个<form>元素
     * :xxx/        起点元素上层首个相对ID为 xxx 的元素。[data-id='xxx']
     *
     * />b          起点元素的<b>子元素
     * /:xyz        起点元素内相对ID为 xyz 的元素。[data-id='xyz']
     * /p:xyz       起点元素内相对ID为 xyz 的<p>元素。p[data-id='xyz']
     * /p: >b       起点元素内存在相对ID属性的<p>元素的<b>子元素。p[data-id]>b
     * /p:xyz >b    起点元素内相对ID为 xyz 的<p>元素的<b>子元素。p[data-id='xyz']>b
     * /p >b        起点元素内匹配 p>b 选择器的元素
     *
     * div/:xyz     起点元素之上首个<div>内相对ID为 xyz 的元素
     * 3/:xyz       起点元素之上第3层父节点内相对ID为 xyz 的元素
     *
     * #some        全局ID检索
     * /.name       起点元素内普通类名检索
     * /:name       起点元素内相对ID为 name 的元素。[data-id='name']
     *
     * 注记：
     * 相对ID表达一定范围内的唯一性逻辑，这只是一种松散的概念约定。
     * 在更宽的范围内，通常可以检索多个相同ID的目标元素，这由检索方法确定（query）。
     *
     * @param  {String}  fmt 标识串（外部trim）
     * @param  {Element} beg 起点元素，可为null
     * @param  {Function} query 检索方法，window.$ 或 window.$.get
     * @return {Collector|Element|null} 目标元素（集）
     */
    $find( fmt, beg, query ) {
        if (fmt == '/' || fmt == '0/') {
            return beg;
        }
        let _pair = beg && fmtSplit(fmt);

        if (!_pair) {
            return query( parseRID(fmt), beg );
        }
        return query(_pair[1], closest(beg, _pair[0]));
    },




    /**
     * “值格式”取值。
     * - tQuery原生支持data系属性的简写（-xx => data-xx）；
     * - 默认取属性值（prop）；
     * fmt：{
     *  	'@xx' 	attr('xx')。元素特性值，
     *  	'&xx' 	prop('xx')。元素属性值
     *  	'-xx' 	prop('-xx')。data-xx属性值（tQuery支持）
     *  	'%xx' 	css('xx')。元素样式值（计算）
     *  	'$xx' 	$系获取。如 $.text(el)
     *  	'@-xx' 	attr('-xx')，即attr('data-xx')
     * }
     * 示例：{
     *  	'@value' 	=> $.attr(e, 'value')
     *  	'@style' 	=> $.attr(e, 'style') // style.cssText
     *  	'@-val' 	=> $.attr(e, '-val')
     *  	'&value' 	=> $.prop(e, 'value')
     *  	'&-val'  	=> $.prop(e, '-val')  // e.dataset.val
     *  	'%color' 	=> $.css(e, 'color')
     *  	'$html' 	=> $.html(e)   // 取源码
     *  	'$parent' 	=> $.parent(e) // 取父元素
     * }
     * $系直接取值参考：{
     *  	text
     *  	html
     *  	height
     *  	width
     *  	val
     *  	children
     *  	clone
     *  	contents
     *  	innerHeight
     *  	innerWidth
     *  	outerWidth
     *  	outerHeight
     *  	next
     *  	prev
     *  	prevAll
     *  	nextAll
     *  	siblings
     *  	offset
     *  	position
     *  	scrollLeft
     *  	scrollTop
     *  	parent
     *  	offsetParent
     * }
     * 注记：
     * - 出于简单性应该仅支持单目标元素；
     * - 因为支持$.xx系接口，多目标会涉及元素重复问题；
     *
     * @param  {Element} el 目标元素
     * @param  {String} fmt 格式值串
     * @return {Mixed} 结果值
     */
    $val( el, fmt ) {
        if (!fmt) return el;
        let _n = fmt.substring(1);

        switch (fmt[0]) {
            case '=': return $.attr(el, _n);
            case '%': return $.css(el, _n);
            case '$': return $[_n](el);
        }
        return $.prop(el, fmt);
    },


    /**
     * 设置元素特定类型值。
     * 类型名type：[
     *  	prop 	特性值
     *  	attr 	属性值
     *  	css 	内联样式
     *  	$ 		$系操作
     * ]
     * tQ系赋值name：{
     *   	html
     *   	text
     *   	height
     *   	width
     *  	val
     *   	offset
     *   	scrollLeft
     *   	scrollTop
     *   	empty
     *    	addClass
     *    	removeClass
     *    	toggleClass
     *    	removeAttr
     *
     *    	// 集合多对多
     *    	// val需为节点数据
     *    	before
     *     	after
     *   	prepend
     *   	append
     *   	replace
     *   	fill
     *   	// 反向赋值
     *   	// val容器元素或html结构
     *   	wrap
     *   	wrapInner
     *
     *   	// 集合反向赋值
     *   	// val需为容器元素
     *   	insertBefore
     *    	insertAfter
     *    	prependTo
     *    	appendTo
     *    	replaceAll
     *    	fillTo
     *    	wrapAll  // val容器元素或html结构
     * }
     * @param {Queue} $el 目标元素
     * @param {String} name 键名
     * @param {Value|Node[s]} val 数据值（集）
     * @param {String} type 类型名
     */
    $set( $el, type, name, ...val ) {
        if (!$el || !$el.length) {
            return;
        }
        if (type == '$') {
            return $el[name](...val);
        }
        // prop|attr|css
        return $el[type](name, val[0]);
    },


    /**
     * 元素属性取值。
     * type: [prop|attr|css|$]
     * @param  {Element} el  目标元素
     * @param  {String} name 取值键
     * @param  {String} type 取值类型
     * @return {Mixed}
     */
    $get( el, type, name, ...rest ) {
        return type == '$' ?
            $[name](el, ...rest) : $[type](el, name);
    },


    /**
     * 获取事件目标元素。
     * rid可能为已检索元素本身，直接返回。
     * rid：{
     *  	'@' 	委托元素（事件绑定）
     *  	null  	当前元素，默认
     *  	0    	事件起点元素（ev.target）
     *  	'' 		To目标元素（target）或当前元素
     * }
     * 事件元素集map: {
     *  	origin  	事件起始元素（event.target）
     *  	delegate 	事件委托绑定元素（event.currentTarget）
     *  	current 	事件委托目标元素或
     *  				无委托绑定元素（event.currentTarget）
     *  	target  	To定位目标元素
     * }
     * 友好：
     * 空串定位To目标元素，但依然备用当前元素。
     *
     * @param  {Object} map 事件元素集
     * @param  {String} rid 标识串
     * @param  {Boolean} one 单一检索
     * @return {Element|Array|Queue|rid|null} 目标元素（集）
     */
    evel( map, rid = null, one = undefined ) {
        switch (rid) {
            case 0: return map.origin;
            case null: return map.current;
        }
        if (typeof rid != 'string') {
            return rid;
        }
        return rid ? this.$find(rid.trim(), map.delegate, one) : map.target || map.current;
    },


    /**
     * 字符串切分两片。
     * @param  {String} str 源字符串
     * @param  {String} sep 分割字符串
     * @return {[String, String]}
     */
    strPair( str, sep ) {
        var _pos = str.indexOf(sep);

        return _pos < 0 ?
            [str, ''] :
            [
                str.substring(0, _pos),
                str.substring(_pos + sep.length)
            ];
    },


    /**
     * 正则切分两片。
     * - 注意正则表达式不可为g模式；
     * @param  {String} str 源字符串
     * @param  {RegExp} sep 分割正则式
     * @return {[String, String]}
     */
    rePair( str, sep ) {
        var _pos = str.search(sep);

        return _pos < 0 ?
            [str, ''] :
            [
                str.substring(0, _pos),
                str.substring(_pos).replace(sep, '')
            ];
    },


    /**
     * 解析多层子对象引用。
     * @param  {Array} refs 引用名集
     * @param  {Object} data 源对象
     * @return {Mixed} 末端成员值
     */
    subObj( refs, data ) {
        if (!data || !refs.length) {
            return data;
        }
        return refs.reduce((d, k) => d[k], data);
    },


    /**
     * 提取调用句法的函数名和参数列表。
     * - 支持无参数时省略调用括号；
     * - 调用名支持句点连接的多级引用；
     *   如：fn(...), Md.fn(), fn, Md.fn 等。
     * - 支持调用串内部任意位置换行；
     * - 参数序列串需符合JSON格式（容忍单引号）；
     * - 无法匹配返回undefined；
     * 注：
     * - 特别支持前置-字符用于事件名（延迟绑定）；
     * 返回值：{
     *  	name: {String} 调用名（可含句点）
     *  	args: {Array|null} 参数值序列
     * }
     * @param  {String} fmt 调用格式串
     * @return {Object} 解析结果
     */
    funcArgs( fmt ) {
        var _pair = fmt.match(__reCall);

        if (!_pair) {
            console.error(`this ${fmt} call is invalid`);
            return '';
        }
        return {
            'name': _pair[1],
            'args': argsParse( _pair[2] && _pair[2].slice(1, -1).trim() )
        };
    },


    /**
     * 激发目标事件。
     * - 默认的延迟时间足够短，仅为跳过当前执行流；
     * @param {Queue} $el 目标元素
     * @param {String} name 事件名
     * @param {Mixed} extra 附加数据
     * @param {Number} delay 延迟毫秒数
     */
    fireEvent( $el, name, extra, delay ) {
        if (!$el.length || !name) {
            return;
        }
        let _fn = () => $el.trigger(name, extra);

        if (!delay) {
            return _fn();
        }
        // <= 20，可能的习惯值
        return isNaN(delay) || delay < 21 ? requestAnimationFrame(_fn) : setTimeout(_fn, delay);
    },


    /**
     * 修饰键按下检查。
     * - 检查names中设定的键是否按下；
     * - 多个键名为And关系（同时按下）；
     * - 修饰键：Alt，Ctrl，Shift，Meta，键名小写；
     *
     * @param  {Event} ev 事件对象（原生）
     * @param  {String|Array} names 键名称（集）
     * @return {Boolean}
     */
    scamMasked( ev, names ) {
        return [].concat(names)
            .every( ns => ev[ __Modifier[ns.toLowerCase()] ] );
    },

};



//
// 序列切分器。
// 格式串本身是字符串，但这里视它们为某种语法表达，因此语句中的字符串有规定的格式。
// 其中包含：字符串、参数段、属性/数组段、语句块段等。
//
// - 解析并分离出由分隔符隔开的独立单元。
// - 可以配置忽略参数段/属性段/块段不切分。
// - 字符串类型是一个整体，天然不切分。
// - 语句中的字符串内的分隔符是字面的，不会被视为分隔符。
// - 支持按区段切分，如字符串、参数段、普通段等。
//
// 注：
// - 参数段由 () 包围，属性/数组段由 [] 包围，块段由 {} 包围。
// - 字符串由单/双引号（'"）和模板字符串标识符撇号（'）包围。
//
class Spliter {
    /**
     * 构造切分器。
     * - 切分符号只能是单个字符；
     * - 切分符号为任意字符，包括4字节Unicode；
     * @param {String} sep 切分符号
     * @param {Boolean} args 参数段忽略（()）
     * @param {Boolean} attr 属性段忽略（[]）
     * @param {Boolean} block 块段忽略（{}）
     */
    constructor( sep, args, attr, block ) {
        this._sep = sep;

        // 当前引号标识符
        // 初始为空，表示在引号外
        this._qch = '';

        // 排除集。
        // 可包含 参数/属性/块 段。
        let _buf = [];

        if (args)  _buf.push( this._inArgs.bind(this) );
        if (attr)  _buf.push( this._inAttr.bind(this) );
        if (block) _buf.push( this._inBlock.bind(this) );

        this._test = _buf;
    }


    /**
     * 按分隔符切分。
     * 可以传递一个进阶过滤函数处理当前切分的串。
     * @param  {String} fmt 格式串
     * @param  {Function} fltr 进阶处理回调
     * @return {Iterator} 切分迭代器
     */
    *split( fmt, fltr ) {
        let _ss = '',
            _fs = this._test[0] && this._test;

        while (fmt) {
            [_ss, fmt] = this._pair(fmt, this._sep, _fs);
            yield fltr ? fltr(_ss) : _ss;
        }
    }


    /**
     * 按区段切分。
     * - 把不同区段的边界视为一个抽象的分隔符，区段包含：字符串/参数段等。
     * - 只有普通段才存在首尾空白，具体类型的区段首尾为包围字符。
     * @param  {String} fmt 格式串
     * @return {Iterator} 切分迭代器
     */
    *partSplit( fmt ) {
        let _ss = '',
            _inc;

        while (fmt) {
            [_ss, fmt, _inc] = this._part(fmt, this._test, _inc);
            // 起始或连续类型区段会切分出一个空串，忽略
            if (!_ss) continue;
            yield _ss;
        }
    }


    /**
     * 状态重置。
     * @return {this}
     */
     reset() {
        this._qch = '';
        this._args = this._attr = this._block = false;
        return this;
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 简单的2片切分。
     * - 假定检查起点在字符串之外，因此无需检查转义字符（\x）。
     * - 可以正确处理4字节Unicude字符序列。
     * @param  {String} fmt 格式串
     * @param  {String} sep 分隔符
     * @param  {Array} test 测试集
     * @return [String, String] 前段和后段
     */
    _pair( fmt, sep, test ) {
        let _pch = '',
            _pos = 0;

        for ( let ch of fmt ) {
            let _inc = this._canSkip(_pch, ch, test);
            _pch = ch;
            if (_inc) {
                _pos += ch.length;
                continue;
            }
            if (ch == sep) break;
            _pos += ch.length;
        }
        return [
            fmt.substring(0, _pos),
            fmt.substring(_pos + sep.length)
        ];
    }


    /**
     * 区段切分。
     * - 按区段切分出字符串、参数段、普通段等。
     * - 可用于提取或排除特定类型的字符串区段。
     * @param  {String} fmt  格式串
     * @param  {Array} test  测试集
     * @param  {Boolean} inc 在某类型段内
     * @return [String, String, Booleam]
     */
    _part( fmt, test, inc = false ) {
        let _pch = '',
            _pos = 0,
            _inc = inc;

        for ( let ch of fmt ) {
            _inc = this._canSkip(_pch, ch, test);
            if (_inc != inc) break;
            _pch = ch;
            _pos += ch.length;
        }
        return [
            fmt.substring(0, _pos),
            fmt.substring(_pos),
            _inc,
        ];
    }


    /**
     * 是否需要跳过忽略。
     * @param  {String} prev 之前一个字符
     * @param  {String} cur 当前字符
     * @param  {Array} test 测试集
     * @return {Booleam}
     */
    _canSkip( prev, cur, test ) {
        return this._inStr(prev, cur) || test.length && test.every( f => f(prev, cur) );
    }


    /**
     * 是否在字符串内。
     * - 会同时进行判断和处理；
     * - 引号包含：双引号/单引号/模板字符串撇号；
     * @param  {String} prev 之前一个字符
     * @param  {string} ch 当前字符
     * @return {bool}
     */
    _inStr( prev, ch ) {
        if (ch == '"' || ch == "'" || ch == '`') {
            if (prev == '\\') {
                return !! this._qch;
            }
            // 开始
            if (this._qch == '') {
                this._qch = ch;
                return true;
            }
            // 结束
            if (this._qch == ch) {
                this._qch = '';
                return true;
            }
        }
        return !!this._qch;
    }


    /**
     * 进入参数段。
     * - 不考虑字符串内情形；
     * @param  {String} ch 当前字符
     * @return {Boolean} 是否进入
     */
    _inArgs( prev, ch ) {
        if (ch == '(') {
            this._args = true;
        }
        else if (prev == ')') {
            this._args = false;
        }
        return this._args;
    }


    /**
     * 进入属性段。
     * @param  {String} ch 当前字符
     * @return {Boolean} 是否进入
     */
    _inAttr( prev, ch ) {
        if (ch == '[') {
            this._attr = true;
        }
        else if (prev == ']') {
            this._attr = false;
        }
        return this._attr;
    }


    /**
     * 进入块段。
     * @param  {String} ch 当前字符
     * @return {Boolean} 是否进入
     */
    _inBlock( prev, ch ) {
        if (ch == '{') {
            this._block = true;
        }
        else if (prev == '}') {
            this._block = false;
        }
        return this._block;
    }
}



//
// 净域生成器。
// - 为js代码的执行创建一个空域环境；
// - 域内所用数据由构造函数和代理调用引入（两级）；
// - 仅支持表达式；
// - 这不是一个沙盒，它只是让合法的代码干净的执行；
// 注记：
// 就目前来看，JS下暂无真的沙盒。
// 除null/undefined外，任何值都可以从constructor上溯构造函数执行。
// 如：
//   ''.constructor.constructor('alert("hai")')()
//   (x=>x)['const'+'ructor']('alert("hai")')()
//
class Scoper {
	/**
	 * @param {...Object} data 全局域数据序列
	 */
	constructor( ...data ) {
		this._data  = $.object( null, ...data );
		this._scope = new Proxy( this._data, { has: () => true } );
	}


	/**
	 * 构造执行器。
	 * - 由执行器的参数引入用户当前域数据；
	 * - 当前域数据会被绑定到最终执行函数的this上；
	 * - 内部二级with(this)，因此this内数据也可直接引用；
	 * 注记：
	 * 由于一级with已经屏蔽了参数，故二级with用this。
	 *
	 * 特点：
	 * - 外部无法改变执行器内的this（如bind）；
	 * - 表达式函数简单执行，没有外部参数输入可用；
	 *
	 * @param  {String} expr 表达式串
	 * @return {Function} 执行器 func(data)
	 */
	runner( expr ) {
		/*jshint -W054 */
		let _call = new Function(
			'G',
			`with(G) with(this) return ${expr};`
		);

		return function( scope, data = null ) {
			return this.bind(
				// data maybe String, Number...
				data === null ? {} : data
			)(scope);
		}
		// 新空间避免全局数据被污染
		.bind( _call, $.object(this._scope) );
	}


	/**
	 * 构造代理函数。
	 * - 用原型继承的方式引入用户数据（浅拷贝）；
	 * - 代理函数可以绑定this，并会被传递到表达式函数内；
	 * - 最终执行函数的参数序列被设置在“_”变量上；
	 *
	 * 特点：
	 * - 返回函数可由外部绑定this，使数据随函数传递；
	 * - 最终函数执行时可传递任意参数，由“_”名称引用；
	 *
	 * @param  {String} expr 表达式串
	 * @param  {Object} data 用户域数据
	 * @return {Function} 包装函数
	 */
	handle( expr, data = null ) {
		/*jshint -W054 */
		let _gobj = $.object(this._scope, data),
			_call = new Function(
				'G', `with(G) return ${expr};`
			);

		return function() {
			_gobj._ = arguments;
			return _call.bind( this || {} )( _gobj );
		};
	}


	/**
	 * 获取成员值。
	 * - 简单获取成员的优化版，避免编译代理函数；
	 * - name需要是一个合法的变量名；
	 * @param  {String} name 键名
	 * @param  {Object} data 取值域数据，可选
	 * @return {Mixed}
	 */
	get( name, data ) {
		let _val;

		if (data !== undefined) {
			_val = data[name];
		}
		return _val !== undefined ? _val : this._data[name];
	}


	/**
	 * 获取被代理的对象本身。
	 * @return {Object}
	 */
	get data() {
		return this._data;
	}

}



//
// PB串值类。
// 用于方便的设置 data-pb 属性值。
// PB值分为两部分：参数和选项。
// - 参数为-分隔，处于前端位置；
// - 选项空格分隔，在参数之后；
// 例：{
//   data-pb="lang-zh- bold x4"
//   // 参数为lang-zh，选项为bold和x4
//   data-pb="- fold"
//   // 参数为空，选项词为fold
// }
// - 参数用“|=”属性选择器定位，如：[data-pb|="lang-zh"]；
// - 选项用“~=”属性选择器定位，如：[data-pb~="bold"]；
//
// 注：
// - 一般地，参数用于描述“是什么”，“-”用于分级；
// - 选项通常用于表达一种“开关”（设置或取消），动态；
//
class PBval {
    /**
     * @param {String} val 混合值串
     */
    constructor( val ) {
        let _vs = this.parse(val) || [];

        this._args = _vs[0] || '-';
        this._opts = _vs[1] || new Set();
    }


    /**
     * 解析格式串赋值。
     * - 单纯的选项词序列前应有一个空格（表示空参数）；
     * - 前置单个-字符也可表示空参数（如"- fold x4"）；
     * @param {String} fmt 混合格式串
     * @return {Array} [args, opts]
     */
    parse( fmt ) {
        if (!fmt) return;
        let _ws = fmt.split(/\s+/);

        return [ _ws.shift(), new Set(_ws) ];
    }


    /**
     * 获取/设置参数串。
     * 末尾会附带一个“-”字符；
     * @param  {...String} rest 参数序列，可选
     * @return {String|this}
     */
    args( ...rest ) {
        if (!rest.length) {
            return this._args.slice(0, -1);
        }
        let _v = rest.join('-');

        this._args = _v.slice(-1) == '-' ? _v : _v + '-';
        return this;
    }


    /**
     * 选项词操作。
     * - 各选项可以被单独添加/删除/切换；
     * - 3种操作由前置字符决定：{
     *  	+ 	添加（默认，可选）
     *  	- 	删除（-* 清空）
     *  	! 	有无切换
     * }
     * - 可以指定一个特殊的词“-*”清空选项集；
     *
     * @param  {...String} words 选项词序列，可选
     * @return {Set|this}
     */
    opts( ...words ) {
        if (!words.length) {
            return this._opts;
        }
        for ( let w of words ) {
            switch (w[0]) {
            case '-':
                this.remove(w.substring(1));
                break;
            case '!':
                this.toggle(w.substring(1));
                break;
            default:
                this.add(w);
            }
        }
        return this;
    }


    /**
     * 获取整串值。
     * 格式：arg1-arg2... opt1 opt2...
     * - 参数-分隔，前置，选项空格分隔；
     * - 单个空参数（-占位）时返回空串；
     * @return {String} 格式串
     */
    value() {
        let _val = this._args + this._optstr();
        return _val == '-' ? '' : _val;
    }


    /**
     * 添加选项词。
     */
    add( word ) {
        this._opts.add(
            word[0] == '+' ? word.substring(1) : word
        );
    }


    /**
     * 删除目标选项。
     */
    remove( word ) {
        if (word == '*') {
            return this._opts.clear();
        }
        this._opts.delete(word);
    }


    /**
     * 切换选项词
     */
    toggle( word ) {
        this._opts[ this._opts.has(word) ? 'delete' : 'add' ](word);
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 返回选项词序列。
     * -各选项词空格连接且前置一个空格；
     * @return {String}
     */
    _optstr() {
        return this._opts.size ? ' ' + [...this._opts].join(' ') : '';
    }

}



//
// PB元素操作类。
//
class PBelem {
    /**
     * @param {Element} el 目标元素
     * @param {String} attr PB属性名
     */
    constructor( el, attr ) {
        this._el   = el;
        this._attr = attr;
        this._pbv  = this._pbv(el, attr);
    }


    /**
     * 获取/设置参数。
     * - 参数为不包含-字符的单词；
     * @param  {...String} rest 参数序列
     * @return {String|this} 参数串
     */
    args( ...rest ) {
        return this._opit('args', ...rest);
    }


    /**
     * 操作选项词。
     * - 各选项可以被单独添加/删除/切换；
     * - 3种操作由前置字符决定：{
     *  	+ 	添加（默认，可选）
     *  	- 	删除（-* 清空）
     *  	! 	有无切换
     * }
     * - 可以指定一个特殊的词“-*”清空选项集；
     *
     * @param  {...String} words 选项词序列，可选
     * @return {Set|this} 选项词集
     */
    opts( ...words ) {
        return this._opit('opts', ...words);
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 参数/选项操作。
     * 完全的空值下，属性本身会被删除。
     * @param {String} op 操作名（args|opts）
     * @return {String|Set|this}
     */
    _opit( op, ...rest ) {
        if (!rest.length) {
            return this._pbv[op]();
        }
        $.attr(
            this._el,
            this._attr,
            this._pbv[op](...rest).value() || null
        );
        return this;
    }


    /**
     * 获取对应PbVal实例。
     * @param  {Element} el 目标元素
     * @param  {String} attr PB属性名
     * @return {PbVal}
     */
    _pbv( el, attr ) {
        return __pbvStore.get(el) ||
            __pbvStore.set( el, new PbVal($.attr(el, attr)) );
    }

}



//
// 文件载入器。
//
class Loader {
    /**
     * @param {String} root 基础路径
     */
    constructor( root ) {
        this._base = root || '';
        this._head = document.head;
    }


    /**
     * 设置/获取根路径。
     * - 设置时返回当前实例；
     * @param {String} path 起始路径
     */
    root( path ) {
        if (path === undefined) {
            return this._base;
        }
        this._base = path;
        return this;
    }


    /**
     * 顺序载入多个Js文件。
     * - 一旦载入失败会终止后续文件载入；
     * - 注意文件数组本身会被修改；
     * - 初始即为空数组时，返回的不是一个Promise；
     * @param  {Array} files 文件路径数组
     * @return {Promise}
     */
    scripts( files ) {
        if (!files.length) {
            return;
        }
        return this.script( files.shift() )
        .then(
            function() { return this.scripts(files); }
            .bind(this)
        );
    }


    /**
     * 载入单个脚本。
     * - 脚本成功载入后会被移出DOM；
     * @param  {String}   file 脚本文件
     * @return {Promise}
     */
    script( file ) {
        return $.script(
            $.Element('script', { src: this._base + '/' + file })
        );
    }


    /**
     * 通用数据获取。
     * @param  {String} file 目标文件
     * @return {Promise}
     */
    fetch( file ) {
        return fetch(this._base + '/' + file);
    }


    /**
     * 载入样式文件（在head的末尾插入）。
     * @param  {String} file 目标文件
     * @return {Promise}
     */
    style( file ) {
        return $.style(
            $.Element( 'link', {
                'rel':  'stylesheet',
                'href': this._base + '/' + file,
            })
        );
    }


    /**
     * 卸载样式文件。
     * @param {String} file 先前载入的文件
     * @return {this}
     */
    unstyle( file ) {
        if (! file) return;

        let _url = this._base + '/' + file,
            _sel = $.One(`link[rel="stylesheet"][href="${_url}"]`, this._head);

        if (_sel) $.remove(_sel);

        return this;
    }

}



/**
 * 参数解析（优先JSON）。
 * - 参数里的字符串可用单引号包围；
 * - 参数可为函数定义；
 * 注记：
 *   Html模板中属性值需要用引号包围，
 *   故值中的字符串所用引号必然同类（和串内引号）。
 *
 * @param  {String} args 参数定义序列
 * @return {Array|null}
 */
function argsParse( args ) {
    if (!args) {
        return null;
    }
    args = args.replace(__reSQuote, '$1"').replace(__reSQuoteESC, "$1'");

    return JSON.parse(`[${args}]`);
}




/**
 * 向上检索目标元素。
 * @param {Element} el 起点元素
 * @param {String|Number} slr 选择器或递升层数
 */
 function closest( el, slr ) {
    if (! slr) {
        return el;
    }
    return typeof slr == 'number' ?
        $.closest( el, (el, i) => i == slr ) :
        // 从父级开始匹配（实用）
        $.closest(el.parentElement, slr);
}


/**
 * 二阶检索选择器解构。
 * - 上向选择器可能是一个数值。
 * - 会解析替换相对ID。
 * - 无法切分时返回 false。
 * @param  {String} slr 选择器格式串
 * @return {[String|Number, String]|false} 选择器对[上，下]
 */
function fmtSplit( fmt ) {
    if (!__reSplit.test(fmt)) {
        return false;
    }
    let _i = fmt.match(__reSplit).index,
        _u = fmt.substring(0, _i++);

    return [
        Math.abs(_u) || parseRID(_u),
        parseRID( fmt.substring(_i) )
    ];
}


/**
 * 解析相对ID。
 * 返回解析替换后的选择器串。
 * 注：正则匹配结果首字符为冒号（:）
 * @param  {String} fmt 二阶选择器串
 * @return {String} 正常选择器
 */
function parseRID( fmt ) {
    return fmt.replace(
        __reRID,
        v => {
            v = v.substring(1).trim();
            return v ? `[data-id="${v}"]` : "[data-id]";
        }
    );
}



// Expose
/////////////////////////////
K.Util 		= Util;
K.Spliter 	= Spliter;
K.Scoper    = Scoper;
K.PBval 	= PBval;
K.PBelem 	= PBelem;
K.Loader 	= Loader;


})( window.$, window.Tpb.Kits );
