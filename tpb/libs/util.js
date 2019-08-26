//! $Id: util.js 2019.08.18 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  命名：
//  前置 $ 字符的名称表示有特别的约定。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Spliter } from "./spliter.js";


const
    $ = window.$,

    SSpliter = new Spliter();


const
    __chrSplit = '/',

    // 二阶选择器分隔符（/）。
    // 后跟合法选择器字符，不能区分属性选择器值内的/字符。
    // 注：仅存在性测试。
    __reSplit = /\/(?=$|[\w>:#.*?])/,

    // 相对ID匹配提取。
    // 如 `p?xyz >b` => `?xyz`
    //
    // CSS标识值匹配：/(?:\\.|[\w-]|[^\0-\xa0])+/
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    //
    // 注：
    // 增加?后空白匹配，以支持无值的相对ID：
    //      'p? >b`  => `? `    => `p[data-id]>b`
    //      'p?>b`   => `?`     => 同上
    //      'p?`     => `?`     => `p[data-id]`
    //      'p?xyz`  => `?xyz`  => `p[data-id="xyz"]`
    //      '?xyz`   => `?xyz`  => `[data-id="xyz"]`
    // g标记用于替换操作。
    // 注意：不能区分属性选择器值内的 ?.. 字符序列。
    __reRID = /\?(?:\\.|[\w-]|[^\0-\xa0]|\s*)+/g,


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
    };



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
     *      -n          负值，直接返回null，在DownSlr包含复合ID选择器时很有用。
     *      {String}    向上检索匹配的CSS选择器（不含起点元素）。
     * DownSlr:
     *      {String}    普通的CSS选择器，支持相对ID。
     *
     * 相对ID：
     *      ?xx     前置问号（?）表示相对ID，即data-id属性的值。如：[data-id='xx']
     *
     * 例：
     * /            单独的 / 表示起点元素自身。
     * 0/           0上级，当前起点（同上）。
     * 2/           祖父元素（2级，父的父）
     * form/        起点元素上层首个<form>元素。
     * ?xxx/        起点元素上层首个相对ID为 xxx 的元素。[data-id='xxx']
     *
     * />b          起点元素的<b>子元素。
     * /?xyz        起点元素内相对ID为 xyz 的元素。[data-id='xyz']
     * /p?xyz       起点元素内相对ID为 xyz 的<p>元素。p[data-id='xyz']
     * /p? >b       起点元素内存在相对ID属性的<p>元素的<b>子元素。p[data-id]>b
     * /p?xyz >b    起点元素内相对ID为 xyz 的<p>元素的<b>子元素。p[data-id='xyz']>b
     * /p >b        起点元素内匹配 p>b 选择器的元素。
     * /.name       起点元素内普通类名检索。
     *
     * div/?xyz     起点元素之上首个<div>内相对ID为 xyz 的元素。
     * 3/?xyz       起点元素之上第3层父节点内相对ID为 xyz 的元素。
     *
     * #some        tQuery全局ID检索，与起点元素无关。
     * /#some       同上（注：简单ID）。
     * /#ab li      复合ID选择器：#ab被限定在起点元素内，这可能不是您想要的。
     * html/#ab li  正常的向上迭代至<html>后向下检索。
     * -1/#ab li    向上检索直接返回null（快速），tQuery向下检索采用默认上下文。
     *
     * 注记：
     * 相对ID表达一定范围内的唯一性逻辑，这只是一种松散的概念约定。
     * 单元素检索指用$.get()获取单个元素返回，多元素检索依然可能只有一个元素，但返回Collector。
     *
     * @param  {String}  slr 选择器串（外部trim）
     * @param  {Element|null} beg 起点元素
     * @param  {Boolean} one 是否单元素检索
     * @return {Collector|Element|null} 目标元素（集）
     */
    $find( slr, beg, one ) {
        if ( !slr || slr == '/' ) {
            return beg;
        }
        let s2 = beg && fmtSplit( slr );

        if ( s2 ) {
            slr = s2[1];
            beg = closest( s2[0].trimRight(), beg );
        }
        return one ? query1( slr, beg ) : query2( slr, beg );
    },




    /**
     * “值格式”取值。
     * - tQuery原生支持data系属性的简写（-xx => data-xx）；
     * - 默认取属性值（prop）；
     * fmt：{
     *  	'@xx' 	attr('xx')。元素特性值
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
 * 二阶检索选择器解构。
 * 非二阶选择器会返回false，否则返回一个双成员数组。
 * 注：
 * 用SSpliter实现准确切分。
 * __reSplit不能区分属性值内的分隔符，因此可能并无切分。
 *
 * @param  {String} slr 选择器串
 * @return {Array2|false} 选择器对[上，下]或false
 */
function fmtSplit( fmt ) {
    if ( !__reSplit.test(fmt) ) {
        return false;
    }
    let _s2 = SSpliter.split(fmt, __chrSplit, 1);

    return _s2.length > 1 && _s2;
}


/**
 * 相对ID转为正常选择器。
 * @param  {String} fmt 选择器串
 * @return {String} 结果选择器
 */
function ridslr( fmt ) {
    return fmt.replace(__reRID, s =>
        // 去除前置?字符
        ( s = s.substring(1).trim() ) && `[data-id="${s}"]` || "[data-id]"
    );
}



/**
 * 向上检索目标元素。
 * @param {String} slr 向上选择器或递进层级数
 * @param {Element} beg 起点元素
 * @return {Element} 目标元素
 */
function closest( slr, beg ) {
    if ( !slr ) {
        return beg;
    }
    if ( slr < 0 ) {
        return null;
    }
    return isNaN(slr) ? $.closest(beg.parentNode, ridslr(slr)) : $.closest(beg, (_, i) => i == slr);
}


/**
 * 向下单元素检索。
 * 注：若无选择器，返回上下文元素本身。
 * @param  {String} slr 选择器
 * @param  {Element} beg 上下文元素
 * @return {Element|null}
 */
function query1( slr, beg ) {
    return slr ? $.get( ridslr(slr), beg ) : beg;
}


/**
 * 向下多元素检索。
 * 注：若无选择器，返回上下文元素本身（封装）。
 * @param  {String} slr 选择器
 * @param  {Element|null} beg 上下文元素
 * @return {Collector}
 */
function query2( slr, beg ) {
    return slr ? $( ridslr(slr), beg ) : $(beg);
}



export { Util };
