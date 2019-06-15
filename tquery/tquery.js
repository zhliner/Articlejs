/*! $Id: tquery.js 2016.03.08 tQuery $
*******************************************************************************
            Copyright (c) 铁皮工作室 2017 MIT License

                @Project: tQuery v0.3.x
                @Author:  风林子 zhliner@gmail.com
*******************************************************************************

    节点查询器

    应用 ES6 支持的新语法和API重构一个类jQuery的工具。

    接口类似jQuery（略有增强），但仅包含：DOM选择、DOM操作、CSS属性、Event。
    即省略了jQuery里的Ajax、$.Deferred、Effect等。
    上面省略的部分分别由浏览器自身支持的：Fetch、Promise、CSS3 实现。

    实现：
    事件为DOM原生事件（无侵入），元素上不存储任何数据（便于JS垃圾回收）。

    注：
    DOM原生的元素集有两类：
        - NodeList，来源于 querySelectorAll()
        - HtmlCollection，来源于 getElementsBy... 系列

    在下面的参数说明中，原生元素集统一称为 NodeList（不再区分 HtmlCollection）。
    用户使用本库 $() 检索的元素集命名为 Collector，继承于 Array 类型。

    提示：
    您可以在浏览器的控制台执行：
    - console.dir($)  查看 $ 的成员情况（单元素操作版）。
    - console.dir($('').constructor.prototype)  查看 Collector 的成员情况。

    注意！
    例：
        <p>
            <b>Bold, <i>Italic</i></b>
            <a>Link</a>
        </p>
        假设 p 为元素 <p>
    检索：
        Sizzle('>b', p)           => [<b>]
        p.querySelectorAll('>b')  => 语法错误
        Sizzle('p>b', p)          => []
        p.querySelectorAll('p>b') => [<b>]
    说明：
        Sizzle 的子级检索选择器不含上下文元素自身的父级限定能力。
        querySelectorAll 依靠上下文元素自身来限定直接子元素匹配。

    实现：
    有限支持 '>*' 选择器格式：开启直接子元素模式，后续选择器用于子元素过滤。
    例：
        $.find('>b', p)      => [<b>]      // 简单支持
        $.find('>b i', p)    => []         // 多级选择无效
        $.find('p>b i', p)   => [<i>]      // querySelectorAll特性
        $.find('>b, >a', p)  => 语法错误    // `b,>a` 为无效选择器
        $.find('>b, a', p)   => [<b>,<a>]  // 子元素用 `b,a` 过滤，仅需首个 `>`
    另：
        Sizzle('>b, >a', p)  => [<b>,<a>]  // 两个限定各自独立

    建议：
    介于 '>*' 选择器的这种细微差别，如果您需要大量使用该选择器，
    或者对 Sizzle 的扩展选择器需求不高，考虑通用性，建议不使用 Sizzle 库。


&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
*/

(function( window, undefined ) {

    let Doc = window.document;

    const
        // 主要用于扩展选择器。
        Sizzle = window.Sizzle,

        isArr = Array.isArray,

        // 转为数组。
        // 无条件转换，仅用于DOM原生元素集类。
        // @param {LikeArray|null} its
        Arr = its => Array.from(its || ''),

        // 类数组检测转换。
        // 如果原参数为数组，直接返回。类数组才会转换。
        // @param {Array|LikeArray|...} its
        $A = its => isArr(its) ? its : arrLike(its) && Array.from(its),

        // 单一目标。
        // slr: 包含前置#字符。
        // @return {Element|null}
        $id = (slr, doc) => doc.getElementById(slr.substring(1)),

        // 简单选择器。
        // @return {Array}
        $tag = ( tag, ctx ) => ctx.getElementsByTagName(tag),

        // 简单选择器。
        // slr: 包含前置.字符
        // @return {Array}
        $class = ( slr, ctx ) => ctx.getElementsByClassName(slr.substring(1)),

        // 检索元素或元素集。
        // 选择器支持“>”表示上下文元素直接子元素。
        // fn: {String} querySelector[All]
        $find = ( slr, ctx, fn ) => slr[0] == '>' ? $sub(slr.substring(1), ctx, fn === 'querySelector') : ctx[fn](slr || null),

        // 单一目标。
        // slr首字符>表示当前上下文直接子元素限定。
        // 如“>p”表示ctx的直接子元素里的p元素。
        // @return {Element|null}
        $one = function( slr, ctx, doc = Doc ) {
            ctx = ctx || doc;

            if (__reID.test(slr)) {
                return $id(slr, doc);
            }
            return $find(slr, ctx, 'querySelector');
        },

        // 多目标。
        // slr首字符>表示当前上下文子元素限定。
        // @return {[Element]}
        $all = Sizzle || function( slr, ctx, doc = Doc ) {
            ctx = ctx || doc;

            if (__reID.test(slr)) {
                return $id(slr, doc) || [];
            }
            let _els;
            if (__reTAG.test(slr)) {
                _els = $tag(slr, ctx);
            }
            else if (__reCLASS.test(slr)) {
                _els = $class(slr, ctx);
            }
            else {
                _els = $find(slr, ctx, 'querySelectorAll');
            }
            return Arr(_els);
        };


    const
        // 返回目标的类型。
        // 注：返回的是目标对象构造函数的名称，不会转为小写；
        // @param  {mixed} val 目标数据
        // @return {String} 类型名（如 "String", "Array"）
        $type = function( val ) {
            return (val === null || val === undefined) ?
                String(val):
                val.constructor.name;
        },

        // 元素匹配判断。
        // - 如果不存在matches，外部提供polyfill；
        // @param  {Element} el
        // @param  {String|Element} slr
        // @return {Boolean}
        $is = Sizzle && Sizzle.matchesSelector || function( el, slr ) {
            if (typeof slr != 'string') {
                return el === slr;
            }
            return slr[0] != '>' && el.matches(slr);
        },

        // 去除重复并排序。
        // @param {NodeList|Iterator} els
        // @return {Array} 结果集（新数组）
        uniqueSort = Sizzle && Sizzle.uniqueSort || function( els ) {
            return els.length > 1 ?
                [...new Set( values(els) )].sort(sortElements) : els;
        };


    const
        // http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = "[\\x20\\t\\r\\n\\f]",

        // identifier: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
        identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

        // 否则创建文本节点（createTextNode）
        ihtml = /<|&#?\w+;/,

        // HTML节点标志
        xhtml = /HTML$/i,

        // 像素值表示
        rpixel = /^[+-]?\d[\d.e]*px$/i,

        // Support: IE <=10 - 11, Edge 12 - 13
        // In IE/Edge using regex groups here causes severe slowdowns.
        // See https://connect.microsoft.com/IE/feedback/details/1736512/
        noInnerhtml = /<script|<style|<link/i,

        // SVG元素名称空间。
        svgNS = 'http://www.w3.org/2000/svg',

        // 简单选择器。
        // 用于原生ID/Class/Tag优先检索。
        __reID 		= new RegExp( "^#(" + identifier + ")$" ),
        __reCLASS 	= new RegExp( "^\\.(" + identifier + ")$" ),
        __reTAG 	= new RegExp( "^(" + identifier + "|[*])$" ),

        // 空白匹配
        __chSpace 	= new RegExp( whitespace + "+", "g" ),

        // data系属性包含简写的匹配。
        // 如：-val => data-val
        __dataName 	= new RegExp( "^(?:data)?-(" + identifier + ")+$" ),

        // 私有存储 {Element: String}
        // 用于toggleClass整体切换元素类名。
        __classNames = new WeakMap();


    const
        version = 'tQuery-0.3.0',

        // 自我标志
        ownerToken = Symbol && Symbol() || ( '__tquery20161227--' + Date.now() ),

        //
        // 位置值定义。
        // 用于插入元素的位置指定，可以混用名称与数值。
        // {
        //  	before 	=  1	元素之前
        //  	after  	= -1 	元素之后
        //  	begin  	=  2	元素内起始点（头部）
        //  	prepend =  2	同上
        //  	end 	= -2  	元素内结束点（末尾）
        //  	append 	= -2	同上
        //  	fill 	= 0 	内容填充（覆盖，清除原有）
        //  	replace = '' 	替换
        // }
        // 示意：
        //   <!-- 1 -->
        //   <p>
        //      <!-- 2 -->
        //    	<span>...</span>
        //    	<!-- -2 -->
        //   </p>
        //   <!-- -1 -->
        //
        // 理解（记忆）：
        //   1： 表示与目标同级，只有1个层次。负值反向取末尾。
        //   2： 表示为目标子级元素，2个层次。负值取末尾。
        //   0： 清空原有数据后填充（清零）。
        //   '': 替换，脱离但有所保持（位置）。
        //
        Wheres = {
            'before': 	 1,
            'after': 	-1,
            'begin': 	 2,
            'prepend': 	 2,
            'end': 		-2,
            'append': 	-2,
            'fill': 	 0,
            'replace': 	'',

            '1': 1,  '-1': -1,  '2': 2,  '-2': -2, '0': 0, '': '',
        };



/**
 * 直接子元素选择。
 * 实现顶级直接子元素“>*”选择器的支持（非标准）。
 * 例：
 * <ol> <!-- ctx -->
 *     <li></li>
 *     <li>
 *         <ol>
 *             <li></li>
 *             <li></li>
 *         </ol>
 *     </li>
 * </ol>
 * 假设ctx为上层<ol>
 * 检索：
 * - Sizzle('>li', ctx)  => 返回上级<li>
 * - ctx.querySelectorAll('>li')  => 语法错误
 * - $sub('>li', ctx)  => 返回上级<li>，同 Slizzle
 *
 * 注意：
 * '>'仅限于直接子元素检索，而不是直接子元素限定，如 '>li li' 是无效的。
 * 原因：
 * 检索子级以下元素时，上级元素可以作为限定。这种限定并不精确，但可以促进标签结构设计的扁平化。
 * 另外，也可以通过调整上级限定元素的属性来明确子孙级定位。
 *
 * @param  {String} slr 目标选择器
 * @param  {Element} ctx 父容器元素
 * @param  {Boolean} first 是否仅首个匹配
 * @return {Element|[Element]|null} 匹配的子元素（集）
 */
function $sub( slr, ctx, first ) {
    if (ctx.nodeType != 1) {
        return null;
    }
    return first ? _first(ctx.children, slr) : tQuery.children(ctx, slr);
}


/**
 * DOM 查询器。
 * - 查询结果为集合，如果仅需一个元素可用 $.One。
 * its: {
 *  	String      选择器查询
 *  	Element     元素包装
 *  	NodeList    元素集（类数组）包装
 *  	.values     支持values接口的迭代器（如Set）
 *  	Function    DOM ready回调
 *  	Collector   当前实例或已封装对象
 *  	...... 	    无效参数，构造一个空集
 * }
 * @param  {Mixed} its
 * @param  {Element} ctx 查询上下文
 * @return {Collector}
 */
function tQuery( its, ctx ) {
    its = its || '';
    // 最优先
    if (typeof its == 'string') {
        return new Collector( $all(its.trim(), ctx) );
    }
    if (isCollector(its)) {
        return its;
    }
    // 初始就绪
    if ( isFunc(its) ) {
        // $ 可能被代理。
        return $.ready(its);
    }
    return new Collector( its );
}


//
// 对外接口。
// 可被外部代理，是一个可变的值。
//
let $ = tQuery;


/**
 * 嵌入代理。
 * - 由外部定义内部 $ 的调用集覆盖。
 * - 代理会更新外部全局的 $ 对象。
 * - getter接受函数名参数，应当返回一个与目标接口声明相同的函数。
 * 注：
 * 这个接口可以给一些库类应用提供特别的方便，比如操作追踪。
 *
 * @param  {Function} getter 接口获取器
 * @return {tQuery|Proxy}
 */
tQuery.embedProxy = function( getter ) {
    if (! isFunc(getter)) {
        throw new Error('must be a function');
    }
    let _$ = $;

    // 运行时修改顶层 $
    $ = new Proxy($, {
        get: (target, fn, rec) => getter(fn) || Reflect.get(target, fn, rec)
    });
    window.$ = $; // export

    return _$;
};


//
// 功能扩展区
// 外部扩展用，名称空间约定。
//
tQuery.Fx = {};



//
// 单元素版基础集定义。
//
Object.assign(tQuery, {

    //== 基本工具 =============================================================
    // 该部分没有集合版。


    /**
     * 创建DOM元素。
     *
     * data 为数据源。
     * - 数据源为节点时，简单的移动插入新建的元素内。
     * - 数据源为字符串时，作为HTML源码插入（可能会构造新的元素）。
     * - 数据源为数组或类数组时，数组成员应为字符串或节点，插入行为与上面两种类型相对应。
     * - 数据源为配置对象时，支持元素属性配置和 html|text|node 三种特殊属性指定。
     *
     * data配置: {
     *  	html: 	取值为源码，节点数据取 outerHTML 插入，可为数组（下同）。
     *  	text: 	取值为文本，节点数据取 textContent 插入。
     *  	node: 	取值为节点，移动插入后节点会脱离原位置。
     *  	.... 	特性（Attribute）定义
     * }
     * @param  {String} tag   标签名
     * @param  {Object|Array|LikeArray|String|Node|Collector} data 配置对象或数据（集）
     * @param  {String} ns    所属名称空间
     * @param  {Document} doc 所属文档
     * @return {Element} 新元素
     */
    Element( tag, data, ns, doc = Doc ) {
        let _el = ns ?
            doc.createElementNS(ns, tag) :
            doc.createElement(tag);

        return $type(data) == 'Object' ? setElem(_el, data) : fillElem(_el, data);
    },


    /**
     * 创建一个文本节点。
     * - 如果data参数为节点元素，取其文本创建。
     * - data支持字符串或节点的数组，数组单元转为字符串后连接。
     * - 串连字符串sep仅在data为数组时才有意义。
     *
     * @param  {String|Node|Array|Collector} data 文本或节点元素或其数组
     * @param  {String} sep 数组成员间链接符，可选
     * @param  {Document} doc 所属文档
     * @return {Text} 新文本节点
     */
    Text( data, sep = ' ', doc = Doc ) {
        if (typeof data === 'object' && data !== null) {
            data = nodeText(data, sep);
        }
        return doc.createTextNode( data );
    },


    /**
     * 创建文档片段。
     * <script>,<style>,<link>三种元素会被清理并存储到exclude中。
     * @param  {String} html 源码
     * @param  {Array} exclude 清理的元素存储
     * @param  {Document} doc 所属文档
     * @return {DocumentFragment} 文档片段
     */
    create( html, exclude, doc = Doc ) {
        if (typeof html != 'string') {
            return null;
        }
        return buildFragment(html, doc, exclude);
    },


    /**
     * SVG系元素创建。
     * - 创建svg元素本身时标签名可省略，即首个参数为配置对象。
     *   如：$.svg( {width: 100, height: 200} )
     * - opts特性配置与 .Element 接口中的 data 参数类似，支持 html|text|node 特殊名称。
     * opts: {
     *  	html: 	取值为源码
     *  	text: 	取值为文本
     *  	node: 	取值为节点/集，移动插入。需注意名称空间的一致性
     *  	.... 	特性（Attribute）值
     * }
     * @param  {String|Object} tag SVG子元素标签或svg元素配置
     * @param  {Object} opts 元素特性配置（Attribute），可选
     * @return {Element} 新元素
     */
    svg( tag, opts, doc = Doc ) {
        if (typeof tag != 'string') {
            opts = tag;
            tag = 'svg';
        }
        return setElem(doc.createElementNS(svgNS, tag), opts);
    },


    /**
     * 创建或封装表格（Table实例）。
     * 创建的Table是一个简单的表格，列数不能改变。
     * 表标题内容为text格式（非html方式插入）。
     * 可以传递一个表格元素进行简单封装，以便于操作。
     * 注：修改表格是一个复杂的行为。
     * @param  {Number|Element} rows 表格行数或表格元素
     * @param  {Number} cols 表格列数
     * @param  {String} caption 表标题，可选
     * @param  {Boolean} th0 首列是否为<th>，可选
     * @return {Table} 表格实例
     */
    table(rows, cols, caption, th0, doc = Doc) {
        if ($type(rows) !== 'Number') {
            return new Table(rows);
        }
        let _tbl = new Table(rows, cols, th0, doc);

        if (caption) {
            _tbl.caption(caption, false);
        }
        return _tbl;
    },


    /**
     * 插入脚本元素。
     * - 用源码构建脚本元素并插入容器元素，返回脚本元素本身。
     * - 也可直接传递一个脚本元素，返回Promise对象，then参数为脚本元素。
     * - 指定容器会保留插入的脚本元素，否则自动移除（脚本正常执行）。
     * 注记：
     * - 其它节点插入方法排除脚本源码，因此单独支持。
     * - 克隆的脚本元素修改属性后再插入，浏览器不会再次执行。
     *
     * @param  {String|Element} data 脚本代码或脚本元素
     * @param  {Element} box DOM容器元素，可选
     * @return {Element|Promise} 脚本元素或承诺对象
     */
    script( data, box, doc = Doc ) {
        if (typeof data == 'string') {
            let _el = switchInsert(
                    tQuery.Element('script', { text: data }, null, doc),
                    null,
                    box || doc.head
                );
            return box ? _el : remove(_el);
        }
        return data.nodeType == 1 && loadElement(data, null, box || doc.head, !box);
    },


    /**
     * 插入样式元素。
     * - 构建样式元素填入内容并插入DOM。
     * - 默认插入head内部末尾，否则插入next之前。
     * - 也可以先构造一个<link>元素传递进来插入，此时返回一个Promise对象。
     * - 用源码构造插入时，返回构造的样式元素。
     *
     * @param  {String|Element} data 样式代码或样式元素
     * @param  {Element} next 参考元素，可选
     * @return {Element|Promise} 样式元素或承诺对象
     */
    style( data, next, doc = Doc ) {
        if (typeof data == 'string') {
            return switchInsert(
                tQuery.Element('style', { text: data }, null, doc),
                next,
                doc.head
            );
        }
        return data.nodeType == 1 && loadElement(data, next, doc.head);
    },


    /**
     * 载入元素的外部资源。
     * 用于能够触发 load 事件的元素，如<img>。
     * 承诺对象的 resolve 回调由 load 事件触发，reject 回调由 error 事件触发。
     * 注：通常需要元素插入DOM树后才会执行资源载入。
     * @param  {Element} el 载入的目标元素
     * @param  {Node} next 插入参考位置（下一个节点）
     * @param  {Element} box 插入的目标容器，可选
     * @return {Promise} 载入承诺
     */
    load( el, next, box ) {
        return loadElement(el, next, box, false);
    },


    /**
     * 通用遍历。
     * - 回调返回false终止遍历，其它值为continue逻辑；
     * - 适用于数组/类数组、Map/Set、普通对象和包含.entries的实例；
     * - 注：Collector 集合版可直接使用该接口；
     * handle：(
     *  	值/元素,
     *  	键/下标,
     *  	迭代对象自身
     * )
     * - 与jQuery不同，因箭头函数的出现，不自动绑定this；
     * - 参数与数组forEach标准接口相似，this也由外部传入；
     *
     * @param  {Array|LikeArray|Object|[.entries]|Collector} obj 迭代目标
     * @param  {Function} handle 迭代回调（val, key）
     * @param  {Any} thisObj 迭代回调内的this
     * @return {obj} 迭代的目标对象
     */
    each( obj, handle, thisObj ) {
        if (thisObj) {
            handle = handle.bind(thisObj);
        }
        for ( let [k, v] of entries(obj) ) {
            if (handle(v, k, obj) === false) break;
        }
        return obj;
    },


    /**
     * 构造范围序列
     * - 序列为[beg : beg+size)，半开区间。
     * - 如果beg为字符，则构造Uncode范围序列。
     * - 构造字符范围时，size可为终点字符（包含自身）。
     * @param  {Number|String} beg 起始值
     * @param  {Number|String} size 序列长度或终点字符
     * @param  {Boolean} toArr 直接生成数组
     * @return {Iterator|Array|null} 范围生成器
     */
    range( beg, size, toArr = false ) {
        let _iter = typeof beg == 'number' ?
            rangeNumber( beg, size ) : rangeChar( beg.codePointAt(0), size );

        return toArr ? [..._iter] : _iter;
    },


    /**
     * 当前时间毫秒数。
     * - 自纪元（1970-01-01T00:00:00）开始后的毫秒数（与时区无关）；
     * - 传递json为真，返回JSON标准格式串；
     * @param  {Boolean} json JSON格式串
     * @return {Number|String}
     */
    now( json ) {
        return json ? new Date().toJSON() : Date.now();
    },


    /**
     * 检测 XML 节点。
     * 注：from Sizzle CSS Selector Engine v2.3.4
     * @param {Element|Object} el An element or a document
     * @returns {Boolean} True iff el is a non-HTML XML node
     */
    isXML( el ) {
        let namespace = el.namespaceURI,
            docElem = (el.ownerDocument || el).documentElement;

        // Support: IE <=8
        // Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
        // https://bugs.jquery.com/ticket/4833
        return !xhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
    },


    /**
     * 包含检查。
     * - 检查容器节点是否包含目标节点。
     * - 目标即是容器本身也为真（与DOM标准兼容）。
     * 注：与jQuery.contains有所不同；
     * @param  {Element} box 容器节点
     * @param  {Node} node 检查目标
     * @return {Boolean}
     */
    contains( box, node ) {
        if (! node) {
            return false;
        }
        let _nt = node.nodeType;

        if (_nt != 1 && _nt != 3) {
            return false;
        }
        return box.contains ?
            box.contains(node) :
            box === node || box.compareDocumentPosition(node) & 16;
    },


    /**
     * 文档就绪绑定。
     * - 可以绑定多个，会按绑定先后逐个调用。
     * - 若文档已载入并且未被hold，会立即执行。
     *
     * @param  {Function} handle 就绪回调
     * @return {this}
     */
    ready( handle ) {
        if (handle === this) {
            throw new Error('bad bind for ready');
        }
        domReady.bind(
            handle,
            // 如果被holdReady，不会实际执行handle，但可标记loaded
            // 然后hold释放完就会调用handle了
            () => (domReady.ready(), domReady.loaded = true)
        );
        return this;
    },


    /**
     * 暂停或恢复.ready()注册的执行。
     * - 应当在页面加载的前段调用，传递true暂停.ready()注册的执行。
     * - 如果需要恢复.ready()调用，传递false实参即可。
     * - 可能有多个.ready()的注册，一次.holdReady()对应一次.ready()。
     * - 如果文档已就绪并已调用ready()，本操作无效（同jQuery）。
     * @param {Boolean} hold 持有或释放
     * @return {void}
     */
    holdReady( hold ) {
        if (domReady.passed) {
            return;
        }
        domReady.waits += hold ? 1 : -1;

        // load 限定！
        return domReady.loaded && domReady.ready();
    },


    //== DOM 节点查询 =========================================================

    /**
     * 查询单个元素。
     * - 先尝试$one（querySelector或ID定位）。
     * - 失败后尝试Sizzle（非标准CSS选择器时）。
     * @param  {String} slr 选择器
     * @param  {Element} ctx 查询上下文
     * @return {Element|null}
     */
     get( slr, ctx = Doc.documentElement ) {
        try {
            return $one(slr.trim(), ctx, ctx.ownerDocument);
        }
        catch(e) {
            window.console.warn(e);
        }
        return Sizzle && Sizzle(slr, ctx)[0] || null;
    },


    /**
     * 查找匹配的元素集。
     * @param  {String} slr 选择器
     * @param  {Element} ctx 查询上下文
     * @param  {Boolean} andOwn 包含自身匹配
     * @return {[Element]}
     */
    find( slr, ctx = Doc.documentElement, andOwn = false ) {
        let _els = $all(slr.trim(), ctx, ctx.ownerDocument),
            _box = [];

        if (andOwn && $is(ctx, slr)) {
            _box = [ctx];
        }
        return _box.concat(_els);
    },


    //-- DOM 节点遍历 ---------------------------------------------------------

    /**
     * 获取下一个兄弟元素。
     * 可用slr进行匹配测试，匹配不成功返回null。可选。
     * @param  {Element} el 参考元素
     * @param  {String} slr 选择器，可选
     * @return {Element|null}
     */
    next( el, slr ) {
        return _next(el, slr, 'nextElementSibling');
    },


    /**
     * 获取后续全部兄弟元素。
     * 可用slr进行匹配过滤，可选。
     * @param  {Element} el 参考元素
     * @param  {String} slr 选择器，可选
     * @return {[Element]}
     */
    nextAll( el, slr ) {
        return _nextAll(el, slr, 'nextElementSibling');
    },


    /**
     * 获取后续兄弟元素，直到slr匹配（不包含匹配的元素）。
     * @param  {Element} el 参考元素
     * @param  {String|Element} slr 选择器或元素，可选
     * @return {[Element]}
     */
    nextUntil( el, slr ) {
        return _nextUntil(el, slr, 'nextElementSibling');
    },


    /**
     * 获取前一个兄弟元素，可能没有或不匹配。
     * @param  {Element} el 参考元素
     * @param  {String} slr 选择器，可选
     * @return {Element|null}
     */
    prev( el, slr ) {
        return _next(el, slr, 'previousElementSibling');
    },


    /**
     * 获取前部全部兄弟。
     * 可选的用slr进行匹配过滤。
     * 注：结果集保持逆向顺序（靠近起点的元素在前）。
     * @param  {Element} el 参考元素
     * @param  {String} slr 选择器，可选
     * @return {[Element]}
     */
    prevAll( el, slr ) {
        return _nextAll(el, slr, 'previousElementSibling');
    },


    /**
     * 获取前端兄弟元素，直到slr匹配（不包含匹配的元素）。
     * 注：结果集成员保持逆向顺序。
     * @param  {Element} el 参考元素
     * @param  {String|Element} slr 选择器或元素，可选
     * @return {[Element]}
     */
    prevUntil( el, slr ) {
        return _nextUntil(el, slr, 'previousElementSibling');
    },


    /**
     * 获取直接子元素集。
     * Element:children 的简单调用，接口完整性。
     * @param  {Element} el 参考元素
     * @param  {String} slr 过滤选择器，可选
     * @return {[Element]}
     */
    children( el, slr ) {
        let _els = Arr(el.children);

        if (!slr) {
            return _els;
        }
        return _els.filter( e => $is(e, slr) );
    },


    /**
     * 获取当前元素的兄弟元素。
     * 目标元素需要在一个父元素内，否则返回null（游离节点）。
     * @param  {Element} el 参考元素
     * @param  {String} slr 过滤选择器，可选
     * @return {[Element]|null}
     */
    siblings( el, slr ) {
        let _pel = el.parentElement;
        if (_pel === null) {
            return null;
        }
        let _els = Arr(_pel.children);
        _els.splice(_els.indexOf(el), 1);

        return slr ? _els.filter(e => $is(e, slr)) : _els;
    },


    /**
     * 获取直接父元素。
     * 可用可选的选择器或测试函数检查是否匹配。
     * @param  {Element} el 参考元素
     * @param  {String|Function} slr 选择器或测试函数，可选
     * @return {Element|null}
     */
    parent( el, slr ) {
        let _pel = el.parentNode;

        if ( isFunc(slr) ) {
            return slr(_pel) ? _pel : null;
        }
        return !slr || $is(_pel, slr) ? _pel : null;
    },


    /**
     * 获取参考元素的上级元素集。
     * 可用可选的选择器或测试函数进行过滤。
     * @param  {Element} el 当前元素
     * @param  {String|Function} slr 选择器或测试函数，可选
     * @return {[Element]}
     */
    parents( el, slr ) {
        let _buf = [],
            _fun = getFltr(slr),
            _i = 0;

        while ( (el = el.parentElement) ) {
            if (!_fun || _fun(el, ++_i)) {
                _buf.push(el);
            }
        }
        return _buf;
    },


    /**
     * 汇集当前元素的全部上级元素，直到匹配。
     * - 从父元素开始检查匹配。
     * - 不包含终止匹配的父级元素。
     * @param  {Element} el  当前元素
     * @param  {String|Function|Element|Array} slr  终止匹配
     * @return {[Element]}
     */
    parentsUntil( el, slr ) {
        let _buf = [],
            _fun = getFltr(slr),
            _i = 0;

        while ( (el = el.parentElement) && (!_fun || !_fun(el, ++_i)) ) {
            _buf.push(el);
        }
        return _buf;
    },


    /**
     * 获取最近的匹配的父级元素。
     * - 向上逐级检查父级元素是否匹配。
     * - 从当前元素自身开始测试（同标准 Element:closest）。
     * - 如果抵达document或DocumentFragment会返回null。
     * @param  {Element} el 参考元素
     * @param  {String|Function|Element|Array} slr 匹配选择器
     * @return {Element|null}
     */
    closest( el, slr ) {
        if (el.closest && typeof slr == 'string') {
            return el.closest( slr );
        }
        let _fun = getFltr(slr),
            _i = 0;

        if (!isFunc(_fun)) {
            return null;
        }
        while (el && !_fun(el, _i++)) {
            el = el.parentElement;
        }
        return el;
    },


    /**
     * 获取最近父级定位元素（css::position: relative|absolute|fixed）。
     * - 从父元素开始检查匹配。
     * - 如果最终没有匹配返回文档根（同jQuery）。
     * - 如果当前元素属于SVG子节点，会返回svg元素本身。注：SVG节点定位由属性配置，与style无关。
     * 注记：
     * 元素原生拥有offsetParent属性，但若元素隐藏（display:none），该属性值为null。
     * 此接口不管元素是否隐藏，都会返回position为非static的容器元素。
     *
     * @param  {Element} el 参考元素
     * @return {Element}
     */
    offsetParent( el ) {
        // html
        let _end = el.ownerDocument.documentElement;

        while ( (el = el.parentElement) ) {
            if (getStyles(el).position != 'static' || el.nodeName == 'svg') break;
        }
        return el || _end;
    },


    //-- DOM 节点过滤 ---------------------------------------------------------
    // 集合操作，也即 Collector 的免实例化版。


    /**
     * 过滤元素集。
     * 如果没有过滤条件，返回原始集。
     * @param  {NodeList|Array|LikeArray} els 目标元素集
     * @param  {String|Function|Element|Array} fltr 筛选条件
     * @return {[Element]}
     */
    filter( els, fltr ) {
        if (!fltr || !els.length) {
            return $A(els);
        }
        if ( isCollector(els) ) {
            els = els.get();
        }
        return $A(els).filter( getFltr(fltr) );
    },


    /**
     * 包含过滤。
     * - 目标元素（集）被本集合中元素作为子级元素包含；
     * - 或目标选择器与集合中元素的子级元素匹配；
     * 测试调用：func(el)
     * @param  {NodeList|Array|LikeArray} els 目标元素集
     * @param  {String|Function|Element} slr 筛选器
     * @return {[Element]}
     */
    has( els, slr ) {
        let _f = slr;

        if (!slr || !els.length) {
            return $A(els);
        }
        if (typeof slr == 'string') {
            _f = el => tQuery.find(slr, el).length;
        }
        else if (slr.nodeType) {
            _f = el => slr !== el && tQuery.contains(el, slr);
        }
        return $A(els).filter(_f);
    },


    /**
     * 排除过滤。
     * - 从集合中移除匹配的元素；
     * @param  {NodeList|Array|LikeArray} els 目标元素集
     * @param  {String|Function|Element|Array} slr 排除条件
     * @return {[Element]}
     */
    not( els, slr ) {
        let _f = slr;

        if (!slr || !els.length) {
            return $A(els);
        }
        if (typeof slr === 'string') {
            _f = el => !$is(el, slr);
        }
        else if (isArr(slr)) {
            _f = el => !slr.includes(el);
        }
        else if (slr.nodeType) {
            _f = el => el !== slr;
        }
        else if (isFunc(slr)) {
            _f = (el, i, arr) => !slr(el, i, arr);
        }
        return $A(els).filter(_f);
    },


    //-- DOM 节点操作 ---------------------------------------------------------
    // 注：before after prepend append replace fill 见后统一定义


    /**
     * 外层包裹。
     * - 在目标节点外包一层元素（容器）。
     * - 包裹容器可以是一个现有的元素或html结构字符串或取值函数。
     * - 取值函数：function(Node): Element|string
     * - 包裹采用结构字符串时，会递进至最深层子元素为容器。
     * - 被包裹的内容插入到容器元素的前端（与jQuery不同）。
     * @param  {Node} node 目标节点
     * @param  {html|Element|Function} box 包裹容器
     * @return {Element|false} 包裹的容器元素
     */
    wrap( node, box ) {
        if (node.nodeType > 3) {
            throw new Error('node must be a Element or Text');
        }
        return wrapData(node, box, node, node.ownerDocument);
    },


    /**
     * 内层包裹。
     * - 在目标元素内嵌一层包裹元素（即对内容wrap）。
     * - 取值函数：function(NodeList): Element|string
     * @param  {Element} el 目标元素
     * @param  {html|Element|Function} box 包裹容器
     * @return {Element|false} 包裹容器元素
     */
    wrapInner( el, box ) {
        if (el.nodeType != 1) {
            throw new Error('el must be a Element');
        }
        let _cons = Arr(el.childNodes);

        return wrapData(_cons[0], box, _cons, el.ownerDocument);
    },


    /**
     * 元素解包裹。
     * - 用元素内容替换元素本身（内容上升到父级）。
     * - 内容节点可能包含注释节点，会从返回集中清除。
     * @param  {Element} el 容器元素
     * @return {Array} 容器子节点集
     */
    unwrap( el ) {
        if (el.nodeType != 1) {
            throw new Error('el must be a Element');
        }
        let _cons = Arr(el.childNodes);

        el.parentElement.replaceChild(
            fragmentNodes(_cons, null, el.ownerDocument),
            el
        );
        return _cons.filter( masterNode );
    },


    /**
     * 节点移出DOM。
     * @param  {Node} node 节点元素
     * @return {Node} 原节点引用
     */
    detach( node ) {
        return remove(node, false);
    },


    /**
     * 删除节点。
     * 注：删除后不再返回原节点引用。
     * @param  {Node} node 节点元素
     * @return {this}
     */
    remove( node ) {
        return remove(node, true), this;
    },


    /**
     * 清空元素内容。
     * 注：仅适用于元素节点。
     * @param  {Element} el 目标元素
     * @return {this}
     */
    empty( el ) {
        if (el.nodeType == 1) el.textContent = '';
        return this;
    },


    /**
     * 内容节点规范化。
     * - 合并相邻文本节点，元素同名Api的简单封装。
     * - level参数是一个告知，说明实际影响的子孙元素的层级（子元素为1，0表示全部）。
     * - 如果您不理解level参数的用途，简单忽略即可。
     * 说明：
     * - DOM原生normalize接口会处理所有子孙节点，没有办法由用户控制。
     * - 这是一个对DOM树进行修改的接口，因此需要向嵌入的代理提供信息。
     * - 这里只能设计为由用户主动告知（主要用于优化）。
     *
     * @param  {Element} el  目标元素
     * @param  {Number} level 影响的子元素层级
     * @return {this|level} this或告知
     */
    normalize( el, level = 0 ) {
        if (el.nodeType == 1) {
            el.normalize();
        }
        return level || this;
    },


    /**
     * 节点克隆。
     * - event和deep两个参数仅适用于元素节点。
     * - 元素节点默认深层克隆（包含子节点一起）。
     * - 可选注册事件是否一起克隆。
     * @param  {Node}    el 目标节点
     * @param  {Boolean} event 事件克隆
     * @param  {Boolean} deep 深层克隆
     * @return {Node} 克隆的新节点
     */
    clone( el, event, deep = true ) {
        let _new = el.cloneNode(deep);

        return event && el.nodeType == 1 ? _cloneEvent(el, _new, deep) : _new;
    },


    /**
     * 获取元素内容。
     * - 默认返回元素内的子元素和文本节点。
     * - 传递 comment 为真表示包含注释节点。
     * @param  {Element} el 容器元素
     * @param  {Boolean} comment 包含注释节点
     * @return {[Node]}
     */
    contents( el, comment = false ) {
        let _proc = comment ?
            usualNode :
            masterNode;

        return Arr(el.childNodes).filter(_proc);
    },


    //-- 属性操作 -------------------------------------------------------------


    /**
     * 类名添加。
     * - 支持空格分隔的类名序列；
     * - 支持回调函数获取类名：func(oldName)；
     * @param  {Element} el 目标元素
     * @param  {String|Function} names
     * @return {this}
     */
    addClass( el, names ) {
        if ( isFunc(names) ) {
            names = names( el.getAttribute('class') );
        }
        names.trim()
            .split(__chSpace)
            .forEach( function(it) { tQuery.add(it); }, el.classList );

        return this;
    },


    /**
     * 移除类名。
     * - 支持空格分隔的类名序列；
     * - 支持回调函数获取类名：func(oldName)；
     * - 未指定名称移除全部类名（删除class属性）；
     * @param  {Element} el 目标元素
     * @param  {String|Function} names
     * @return {this}
     */
    removeClass( el, names ) {
        if (! names) {
            el.removeAttribute('class');
            return this;
        }
        if ( isFunc(names) ) {
            names = names( el.getAttribute('class') );
        }
        names.trim()
            .split(__chSpace)
            .forEach( function(it) { this.remove(it); }, el.classList );

        return this;
    },


    /**
     * 类名切换。
     * - 支持空格分隔的多个类名；
     * - 支持回调函数获取类名：func(oldName)；
     * - 无参数调用时，操作针对整个类名集；
     * - val也作为整体操作时的强制设定（Boolean）；
     * 注记：
     * - 暂不依赖toggle的第二个参数；
     * - 可正确处理SVG元素的class类属性；
     *
     * @param  {Element} el 目标元素
     * @param  {String|Boolean|Function} val 目标值，可选
     * @param  {Boolean} force 强制设定，可选
     * @return {this}
     */
    toggleClass( el, val, force ) {
        let _cls = el.getAttribute('class');

        if ( isFunc(val) ) {
            val = val(_cls);
        }
        if (val && typeof val == 'string') {
            clsToggle(el, val.trim(), force);
            return this;
        }
        if (_cls) {
            // 私有存储
            __classNames.set(el, _cls);
        }
        tQuery.attr( el, 'class',
            !val && _cls ? null : __classNames.get(el) || null
        );
        return this;
    },


    /**
     * 类名匹配检查。
     * - 空格分隔的多个类名为And关系；
     * 注：
     * - jQuery中同名方法里空格没有分隔符作用；
     * @param  {Element} el 目标元素
     * @param  {String} names 类名（序列）
     * @return {Boolean}
     */
    hasClass( el, names ) {
        return names.trim()
            .split(__chSpace)
            .every(
                it => el.classList.contains(it)
            );
    },


    /**
     * 特性获取/修改（Attribute）
     * name: {
     *  	xx 		普通名称
     *  	data-x 	data系名称
     *  	-xx 	data系名称简写
     *  	{Array} 	名称集（获取时）
     *  	{Object} 	名/值对象（设置时）
     * }
     * - value未定义时为获取。支持名称数组，返回一个Map；
     * - value有值时为设置，value支持回调取得新值；
     * - name为名值对对象时，内部值也可为回调函数，与其键对应；
     * - value回调参数（oldval, el）；
     * - value传递null会删除目标特性；
     *
     * @param  {String|Array|Object} name 名称（集）或名/值对象
     * @param  {String|Number|Boolean|Function|null} value 新值或回调函数
     * @return {Value|Map|this}
     */
    attr( el, name, value ) {
        if (value !== undefined || $type(name) == 'Object') {
            hookSets(el, name, value, elemAttr);
            return this;
        }
        return hookGets(el, name, elemAttr);
    },


    /**
     * 属性获取/修改（Property）。
     * - name说明同attr；
     * - 与attr不同，value传递null会赋值为null（而非删除）；
     *
     * @param  {String|Array|Object} name
     * @param  {String|Number|Boolean|Function|null} value
     * @return {Value|Map|this}
     */
    prop( el, name, value ) {
        if (value !== undefined || $type(name) == 'Object') {
            hookSets(el, name, value, elemProp);
            return this;
        }
        return hookGets(el, name, elemProp);
    },


    /**
     * 删除特性（集）。
     * - 支持data系特性名的简写形式；
     * 注：与jQuery不同，多个名称传递一个数组（而非空格分隔）；
     * @param  {Element} el 目标元素
     * @param  {String|Array} names 名称（集）
     * @return {this}
     */
    removeAttr( el, names ) {
        if (!names) return this;

        if (typeof names == 'string') {
            names = [names.trim()];
        }
        for (let ss of names) {
            let _dn = ss.match(__dataName);
            if (_dn) ss = 'data-' + _dn[1];
            el.removeAttribute( ss );
        }
        return this;
    },


    /**
     * 获取/设置元素值。
     * - 基本针对表单控件的value操作（val或可视为value简写）；
     * 特例：
     * select {
     *   	set: 选中同值的option项（清除其它），
     *   	 	 Array：multiple时支持数组多选。
     *   	get: 获取选中项的值（option），multiple时为数组。
     * }
     * input:radio {
     *  	set: 检索同组元素，选中与值匹配的项。
     *  	get: 检索同组元素，返回选中的项的值。
     *  	 	 注：同组指同一form下同名的控件元素。
     * }
     * input:checkbox {
     *  	set: 检索同组元素，匹配项选中（非匹配项取消选中）。
     *  	 	 Array：支持同名多复选框（组）。
     *  	 	 注：单纯的取消选中，传递value为null即可。
     *  	get: 检索同组元素，返回选中的项的值或值数组（重名时）。
     * }
     * optgroup {
     *  	set: 选中该组内匹配的option元素，
     *  		 Array：支持数组多匹配。
     *  		 注：如果是单选表，实际是最后一项匹配有效。
     *  	get: 获取该组内选中的option元素的值。
     *  		 注：返回值数组，与上级select是否定义多选无关。
     * }
     * option {
     *  	set/get: 空操作。不可单独设置/获取。
     *  	 		 如果需要修改value，应当使用prop。
     * }
     * 注：对于单选/复选的同组控件，只需对其中任一元素操作。
     *
     * @param  {Element} el 目标元素
     * @param  {Mixed|Array|Function} value 匹配值/集或回调
     * @return {Value|this}
     */
    val( el, value ) {
        let _hook = valHooks[el.type] ||
            valHooks[el.nodeName.toLowerCase()];

        if (value === undefined) {
            return _hook ? _hook.get(el) : el.value;
        }
        if ( isFunc(value) ) {
            value = value(_hook ? _hook.get(el) : el.value);
        }
        if (_hook) {
            _hook.set(el, value);
        } else {
            el.value = value;
        }
        return this;
    },


    //-- DOM 文本操作 ---------------------------------------------------------


    /**
     * 提取/设置元素源码。
     * - 禁止脚本<script>，样式<style>，连接<link>元素插入。
     * - 源数据为节点时，取其outerHTML，多个节点取值串接。
     * - 数据源也可为字符串数组或字符串与节点的混合数组。
     * - where值含义详见上Wheres注释。
     * 另：
     * - 若传递el实参为假值，返回转义后的html。如：< 转义为 &lt;
     *
     * 取值回调：
     * - 取值函数接收原节点为参数，可返回字符串、节点或节点集；
     * - 返回的节点数据取其outerHTML源码；
     *
     * @param  {Element} el 容器元素
     * @param  {String|Node|NodeList|Array|Function} code 数据源或取值函数
     * @param  {String|Number} where 插入位置
     * @param  {String} sep 多段连接符
     * @return {String|Array} 源码或插入的节点集
     */
    html( el, code, where = 0, sep = ' ' ) {
        if (code === undefined) {
            return el.innerHTML;
        }
        if ( isFunc(code) ) {
            code = code( el );
        }
        if (typeof code != 'string') {
            code = outerHtml(code, sep);
        }
        if (noInnerhtml.test(code)) {
            window.console.error(`the code contains forbidden tag`);
        }
        if (! el) {
            return textHtml(code);
        }
        return Insert(
            el,
            // 会忽略脚本代码
            buildFragment(code, el.ownerDocument, null),
            Wheres[where]
        );
    },


    /**
     * 提取/设置元素文本内容。
     * - 设置时以文本方式插入，HTML视为文本；
     * - 源数据为节点时，提取其文本（textContent）插入；
     * - 数据源也可为字符串或节点或其混合的数组；
     * 另：
     * 若传递el实参为假值，返回解析html后的文本。如：&lt; 解析为‘<’
     *
     * 注：
     * 新的DOM规范中有类似Api：
     *   > ParentNode.append/prepend
     *   > ChildNode.after/before
     * 但对待节点的方式不同。
     *
     * @param  {Element} el 容器元素
     * @param  {String|NodeList|Array|Function} code 源数据或取值函数
     * @param  {String|Number} where 插入位置
     * @param  {String} sep 多段连接符
     * @return {String|Node} 源码或插入的文本节点
     */
    text( el, code, where = 0, sep = ' ' ) {
        if (code === undefined) {
            return el.textContent;
        }
        if ( isFunc(code) ) {
            code = code( el );
        }
        if (typeof code != 'string') {
            code = nodeText(code, sep);
        }
        if (! el) {
            return htmlText(code);
        }
        return Insert(
            el,
            el.ownerDocument.createTextNode(code),
            Wheres[where]
        );
    },


    //== CSS 属性 =============================================================
    // height/width
    // innerHeight/innerWidth/outerHeight/outerWidth
    // 定义见后集中设置。


    /**
     * 获取/设置元素样式。
     * - 设置为内联样式（style），获取计算后的样式；
     * - 支持一个名称数组获取属性，返回一个Map实例；
     * - 设置样式值为空串，会删除该样式；
     * - 名称传递一个键值对象，依键值定义设置样式；
     * - 键值定义中的值依然可以为回调取值函数；
     * - 取值函数：fn.bind(el)( oldval, cso )
     * 注记：
     * - Edge/Chrome/FF已支持短横线样式属性名；
     *
     * @param  {String|Array|Object} names 样式名（集）或名值对象
     * @param  {String|Number|Function} val 设置值或取值函数
     * @return {String|Map|this}
     */
    css( el, names, val ) {
        let _cso = getStyles(el);

        if (val !== undefined || $type(names) == 'Object') {
            cssSets(el, names, val, _cso);
            return this;
        }
        return cssGets(_cso, names);
    },


    /**
     * 获取/设置元素偏移。
     * - 相对于文档根元素；
     * - 返回值格式：{top, left}；
     * - 设置值也用同样格式指定；
     * @param  {Object} val 设置配置
     * @return {Object|this}
     */
    offset( el, val ) {
        let _cur = getOffset(el);

        if (val === undefined) {
            return _cur;
        }
        if ( isFunc(val) ) {
            val = val( _cur );
        }
        val = useOffset( _cur, val, calcOffset(el) );

        if (tQuery.css(el, 'position') == 'static') {
            el.style.position = "relative";
        }
        // val: Object
        return tQuery.css(el, val);
    },


    /**
     * 获取相对位置。
     * - 相对于上层含定位属性的元素；
     * - 包含元素外边距（从外边距左上角算）；
     * 注记：
     * - 元素相关属性el.offsetTop/Left（未用）。
     * - 不处理元素为window/document的情况（同jQuery）；
     * @return {Object} {top, left}
     */
    position( el ) {
        let _cso = getStyles(el);

        if (_cso.position == "fixed") {
            // getBoundingClientRect
            // - 参考边框左上角计算，不含外边距；
            // - 此时已与滚动无关；
            return toPosition(el.getBoundingClientRect(), _cso);
        }
        let _cur = tQuery.offset(),
            _pel = tQuery.offsetParent(el),
            _pot = _pel.offset(),
            _pcs = getStyles(_pel),
            _new = {
                top:  _cur.top - (_pot ? _pot.top + parseFloat(_pcs.borderTopWidth) : 0),
                left: _cur.left - (_pot ? _pot.left + parseFloat(_pcs.borderLeftWidth) : 0)
            };

        return toPosition(_new, _cso);
    },


    /**
     * 获取/设置水平滚动条。
     * @param  {Element|Window|Document} el
     * @param  {Number} val
     * @return {Number|this}
     */
    scrollLeft( el, val ) {
        let _win = getWindow(el);

        if (val === undefined) {
            return _win ? _win.pageXOffset : el.scrollLeft;
        }
        scrollSet(_win || el, val, _win ? 'X' : 'L');

        return this;
    },


    /**
     * 获取/设置垂直滚动条。
     * @param  {Element|Window|Document} el
     * @param  {Number} val
     * @return {Number|this}
     */
    scrollTop( el, val ) {
        let _win = getWindow(el);

        if (val === undefined) {
            return _win ? _win.pageYOffset : el.scrollTop;
        }
        scrollSet(_win || el, val, _win ? 'Y' : 'T');

        return this;
    },



    //== 事件扩展 =============================================================
    // 事件名支持空格分隔的名称序列。
    // 事件名不支持名称空间。


    /**
     * 绑定事件处理。
     * 多次绑定同一个事件名和相同的调用函数是有效的。
     * @param  {Element} el 目标元素
     * @param  {String} evn 事件名（序列）
     * @param  {String} slr 委托选择器，可选
     * @param  {Function} handle 处理函数
     * @return {this}
     */
    on( el, evn, slr, handle ) {
        eventBinds('on', el, evn, slr, handle);
        return this;
    },


    /**
     * 移除事件绑定。
     * 仅能移除 on/one 方式绑定的处理器。
     * @param  {Element} el 目标元素
     * @param  {String} evn 事件名（序列）
     * @param  {String} slr 委托选择器，可选
     * @param  {Function} handle 事件处理函数，可选
     * @return {this}
     */
    off( el, evn, slr, handle ) {
        eventBinds('off', el, evn, slr, handle);
        return this;
    },


    /**
     * 单次绑定。
     * 在事件被触发（然后自动解绑）之前，off 可以移除该绑定。
     * @param  {Element} el 目标元素
     * @param  {String} evn 事件名（序列）
     * @param  {String} slr 委托选择器，可选
     * @param  {Function} handle 处理函数
     * @return {this}
     */
    one( el, evn, slr, handle ) {
        eventBinds('one', el, evn, slr, handle);
        return this;
    },


    /**
     * 事件激发。
     * - evn可以是一个已经构造好的事件对象（仅发送）。
     * - 事件默认冒泡并且可被取消。
     * - 支持原生事件的处理，并可获取传递数据。
     * - 事件处理函数返回false，可取消原生事件的激发。
     * @param  {Element} el 目标元素
     * @param  {String|Event..} evn 事件名或事件对象
     * @param  {Mixed} extra 发送数据
     * @param  {Bollean} bubble 是否冒泡
     * @param  {Bollean} cancelable 是否可取消
     * @return {this}
     */
    trigger( el, evn, extra, bubble = true, cancelable = true ) {
        if (!el || !evn) {
            return;
        }
        if (typeof evn == 'string') {
            if (evn in el && Event.nativeTrigger(evn)) {
                return el[evn](), this;
            }
            evn = new CustomEvent(evn, {
                detail: 	extra,
                bubbles: 	bubble,
                cancelable: cancelable,
            });
        }
        el.dispatchEvent( evn );
        return this;
    },

});


// 版本说明。
Reflect.defineProperty(tQuery, 'version', {
    value: version,
    enumerable: false,
});


//
// 简单表格类。
// 仅为规范行列的表格，不支持单元格合并拆分。
// 不涉及单元格内容的修改操作，需提取后自行操作。
// 接口的重点在于对表格行的操作。
//
class Table {
    /**
     * 创建表格。
     * 不包含表头/脚部分，调用时注意去除表头/脚部分的行计数。
     * @param {Number} rows 行数
     * @param {Number} cols 列数
     * @param {Boolean} th0 首列是否为<th>单元格
     */
    constructor( rows, cols, th0, doc = Doc ) {
        if ($type(rows) !== 'Number') {
            this._newTable(rows);
            return;
        }
        let _tbl = doc.createElement('table'),
            _body = _tbl.createTBody();

        for (let r = 0; r < rows; r++) {
            buildTR(_body.insertRow(), cols, 'td', th0);
        }
        this._tbl = _tbl;
        this._th0 = th0;
        this._cols = cols;
        this._body1 = _body;
    }


    /**
     * 表标题操作。
     * text: {
     *      undefined   返回表标题，不存在则返回null
     *      null        删除表标题
     *      {String}    设置并返回表标题（不存在则新建）
     * }
     * @param  {String|null} text 标题内容
     * @param  {Boolean} ishtml 是否为html方式插入
     * @return {Element|null} 表标题元素
     */
    caption( text, ishtml ) {
        switch (text) {
            case undefined:
                return this._tbl.caption;
            case null:
                return this._tbl.deleteCaption();
        }
        let _cel = this._tbl.createCaption();
        _cel[ishtml ? 'innerHTML' : 'textContent'] = text;

        return _cel;
    }


    /**
     * 添加表格行（TBody/tr）。
     * 会保持列数合法，全部为空单元格。
     * idx为-1或表体的行数，则新行插入到末尾。
     * 简单的无参数调用返回表体元素集（数组）。
     * @param  {Number} idx 插入位置
     * @param  {Number} rows 行数
     * @param  {Element} sect 目标<tbody>元素，可选
     * @return {[Element]|Collector} 表体元素集或新添加的行元素集
     */
    body( idx, rows, sect ) {
        if (idx === undefined) {
            return Arr(this._tbl.tBodies);
        }
        if (sect === undefined) {
            sect = this._body1;
        }
        return this._insertRows(sect, idx, rows);
    }


    /**
     * 创建一个新的<tbody>元素插入到最后。
     * 表格中允许多个<tbody>，因此可模拟表格的分段效果。
     * 这里只是一个简单封装，需配合body()使用。
     * @return {Element} 已插入的<tbody>元素
     */
    newBody() {
        return this._tbl.createTBody();
    }


    /**
     * 删除一个表体元素<tbody>。
     * @param  {Number} idx 目标元素的下标位置
     * @return {Element} 删除的<tbody>元素
     */
    delBody( idx ) {
        let _body = this._tbl.tBodies[idx];
        if (_body) {
            this._tbl.removeChild(_body);
        }
        return _body;
    }


    /**
     * 添加表头行。
     * 简单的无参数调用返回表头元素，无表头元素时返回null。
     * 传递创建参数时，如果不存在表头元素（THead）会新建。
     * 传递idx参数为null时删除表头元素。
     * @param  {Number} idx 插入位置
     * @param  {Number} rows 行数
     * @return {Element|Collector} 表头元素或新添加的行元素集
     */
    head( idx, rows = 1 ) {
        if (idx === undefined) {
            return this._tbl.tHead;
        }
        if (idx === null) {
            return this._tbl.deleteTHead();
        }
        return this._insertRows(this._tbl.createTHead(), idx, rows, 'th');
    }


    /**
     * 添加表脚行。
     * 简单的无参数调用返回表脚元素，无表脚元素时返回null。
     * 传递创建参数时，如果不存在表脚元素（TFoot）会新建。
     * 传递idx参数为null时删除表脚元素。
     * @param  {Number} idx 插入位置
     * @param  {Number} rows 行数
     * @return {Element|Collector} 表脚元素或新添加的行元素集
     */
    foot( idx, rows = 1 ) {
        if (idx === undefined) {
            return this._tbl.tFoot;
        }
        if (idx === null) {
            return this._tbl.deleteTFoot();
        }
        return this._insertRows(this._tbl.createTFoot(), idx, rows);
    }


    /**
     * 删除多个表格行。
     * 行计数指整个表格，不区分head/body/foot。
     * size为undefined表示起始位置之后全部行。
     * size计数大于剩余行数，取剩余行数（容错超出范围）。
     * @param {Number} idx 起始位置（从0开始）
     * @param {Number} size 删除数量
     * @return {Collector} 删除的行元素集
     */
    removes( idx, size ) {
        let _len = this._tbl.rows.length;

        if (idx >= _len) {
            return null
        }
        if (size === undefined || idx+size > _len) {
            size = _len - idx;
        }
        let _buf = [];

        // 集合改变，固定下标
        for (let i = 0; i < size; i++) {
            _buf.push( this._remove(idx) );
        }
        return new Collector(_buf);
    }


    /**
     * 删除表格行。
     * @param {Number} idx 目标位置（从0开始）
     * @return {Element} 删除的行元素
     */
    remove( idx ) {
        let _rs = this._tbl.rows;

        if (idx >= _rs.length) {
            return null;
        }
        if (idx === -1) {
            idx = _rs.length - 1;
        }
        return this._remove(idx);
    }


    /**
     * 获取目标行集。
     * 表格行计数包含表头和表尾部分（不区分三者）。
     * 不合适的参数会返回一个空集。
     * @param {Number} idx 起始位置（从0开始）
     * @param {Number} size 获取行数（undefined表示全部）
     * @return {Collector} 行元素集
     */
    gets( idx, size ) {
        let _max = this._tbl.rows.length;

        if (idx < -1 || size === undefined || idx+size > _max) {
            size = _max - idx;
        }
        if (size === 0) {
            return new Collector(null);
        }
        return new Collector(
            tQuery.range(idx, size, true).map( i => this._tbl.rows[i] )
        )
    }


    /**
     * 获取目标行元素。
     * 表格行计数包含表头和表尾部分。
     * @param {Number} idx 目标行（从0计数）
     * @return {Element|null} 表格行
     */
    get( idx ) {
        if (idx < -1 || idx >= this._tbl.rows.length) {
            return null;
        }
        if (idx === -1) {
            idx = this._tbl.rows.length - 1;
        }
        return this._tbl.rows[idx];
    }


    /**
     * 包装表格元素为 Collector 对象。
     * 便于后续的链式调用。
     * @return {Collector} 对表格元素进行Elements封装
     */
    $() {
        return new Collector(this._tbl);
    }


    /**
     * 返回原始的表格元素。
     * @return {Element}
     */
    elem() {
        return this._tbl;
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 插入表格行。
     * 保持合法的列数，全部为空单元格。
     * idx为-1或表体的行数，则新行插入到末尾。
     * @param {TableSection} tsec 表格区域（TBody|THead|TFoot）
     * @param {Number} idx 插入位置
     * @param {Number} rows 插入行数
     * @return {Collector} 新插入的行元素（集）
     */
     _insertRows( tsec, idx, rows = 1, tag = 'td' ) {
        if (idx < 0 || idx > tsec.rows.length) {
            idx = tsec.rows.length;
        }
        for (let r = 0; r < rows; r++) {
            buildTR(tsec.insertRow(idx), this._cols, tag, this._th0);
        }
        if (rows === 1) {
            return new Collector( tsec.rows[idx] );
        }
        return new Collector( tQuery.range(idx, rows, true).map( i => tsec.rows[i] ) );
    }


    /**
     * 删除目标行。
     * 假设idx参数已合法。
     * @param {Number} idx 目标位置
     * @return {Element} 删除的元素
     */
    _remove( idx ) {
        let _row = this._tbl.rows[idx];
        this._tbl.deleteRow(idx);
        return _row;
    }


    /**
     * 封装一个Table 实例。
     * 传入的tbl参数必须是一个表格元素，否则返回null。
     * @param {Element} tbl 表格元素
     * @return {Table} Table实例
     */
    _newTable( tbl ) {
        if (tbl.tagName.toLowerCase() !== 'table') {
            return null;
        }
        this._body1 = tbl.tBodies[0];
        this._cols = tbl.rows[0].cells.length;
        this._th0 = this._body1.rows[0].cells[0].tagName.toLowerCase() === 'th';
        this._tbl = tbl;
    }

}


//
// 导出供外部复用（如继承）。
//
tQuery.Table = Table;


//
// 6种插入方式。
// 数据仅为节点，与DOM原生方法稍有差异。
///////////////////////////////////////
[
    'before',
    'after',
    'prepend',
    'append',
    'replace',  //jQuery: replaceWith
    'fill',  	//jQuery: html(elem)
]
.forEach(function( name ) {
    /**
     * 在元素的相应位置添加节点（集）。
     * - 数据源为节点或节点集，不支持html字符串。
     * - 仅元素适用于事件克隆（event参数）。
     * 取值回调：
     * - 取值函数接受原节点作为参数。
     * - 取值函数可返回节点或节点集（含 Collector），不支持字符串。
     *
     * @param  {Element} el 目标元素
     * @param  {Node|NodeList|Collector|Function|Set|Iterator} cons 数据节点（集）或回调
     * @param  {Boolean} clone 数据节点克隆
     * @param  {Boolean} event 是否克隆注册事件
     * @return {Node|Array} 新插入的节点（集）
     */
    tQuery[name] = function ( el, cons, clone, event ) {
        return Insert(
            el,
            domManip( el, cons, clone, event ),
            Wheres[name]
        );
    };
});


//
// 数值尺寸取值（Float）
// innerHeight/innerWidth
// outerHeight/outerWidth
///////////////////////////////////////
[
    ['Height', 	'inner'],
    ['Width', 	'inner'],
    ['Height', 	'outer'],
    ['Width', 	'outer'],
]
.forEach(function( its ) {
    let _t = its[0].toLowerCase(),
        _n = its[1] + its[0];

    tQuery[_n] = function( el, margin ) {
        return _rectWin(el, its[0], its[1]) || _rectDoc(el, its[0]) || _rectElem(el, _t, _n, margin);
    };
});


//
// 数值尺寸设置/取值（Float）
// height/width
///////////////////////////////////////
[
    ['height', 	'Height'],
    ['width', 	'Width'],
]
.forEach(function( its ) {
    let _n = its[0];
    /**
     * 获取/设置元素的高宽度。
     * - 始终针对内容部分（不管box-sizing）；
     * - 设置值可包含任意单位，纯数值视为像素单位；
     * - 获取时返回数值。便于数学计算；
     * 注记：
     * box-sizing {
     *  	content-box: css:height = con-height（默认）
     *  	border-box:  css:height = con-height + padding + border
     * }
     * @param  {String|Number} val 设置值
     * @return {Number|this}
     */
    tQuery[_n] = function( el, val ) {
        if (val !== undefined) {
            return _elemRectSet(el, _n, val), this;
        }
        return _rectWin(el, its[1], 'inner') || _rectDoc(el, its[1]) || _elemRect(el, _n);
    };
});


//
// 可调用事件。
///////////////////////////////////////
[
    'click',
    'dblclick',
    'select',
    'focus',
    'blur',
    'submit',
    'reset',
    'change',
    'scroll',
]
.forEach(function( name ) {
    tQuery[name] = el => (name in el) && el[name]() || this;
});


/**
 * 获取窗口尺寸。
 * @param  {Window} el   获取目标
 * @param  {String} name 尺寸名称（Height|Width）
 * @param  {String} type 取值类型（inner|outer）
 * @return {Number|false}
 */
function _rectWin( el, name, type ) {
    return isWindow(el) && (
        type == 'outer' ?
        el['inner' + name] :
        el.document.documentElement['client' + name]
    );
}


/**
 * 获取文档尺寸。
 * scroll[Width/Height] or offset[Width/Height] or client[Width/Height]
 * 最大者。
 * @param  {Document} el 获取目标
 * @param  {String} name 尺寸名称（Height|Width）
 * @return {Number|undefined}
 */
function _rectDoc( el, name ) {
    if (el.nodeType != 9) {
        return;
    }
    let _html = el.documentElement;

    return Math.max(
        el.body[ "scroll" + name ], _html[ "scroll" + name ],
        el.body[ "offset" + name ], _html[ "offset" + name ],
        _html[ "client" + name ]
    );
}


/**
 * 获取元素尺寸。
 * （innerHeight/innerWidth）
 * （outerHeight/outerWidth）
 * @param  {Window} el   获取目标
 * @param  {String} type 取值类型（height|width）
 * @param  {String} name 取值名称
 * @return {Number|false}
 */
function _rectElem( el, type, name, margin ) {
    let _cso = getStyles(el);
    return boxSizing[ _cso.boxSizing ].get(el, type, name, _cso, margin);
}


/**
 * 获取元素尺寸（height/width）。
 * @param  {Element} el  目标元素
 * @param  {String} name 尺寸名称（height|width）
 * @return {Number}
 */
function _elemRect( el, name ) {
    let _cso = getStyles(el);
    return boxSizing[ _cso.boxSizing ].get(el, name, name, _cso);
}


/**
 * 设置元素尺寸（height|width）。
 * - 支持非像素单位设置；
 * @param  {Element} el  目标元素
 * @param  {String} name 设置类型/名称
 * @param  {String|Number} val 尺寸值
 * @return {Number}
 */
function _elemRectSet( el, name, val ) {
    let _cso = getStyles(el),
        _inc = boxSizing[ _cso.boxSizing ].set(el, name, val, _cso);

    // 非像素设置时微调
    if (_inc) el.style[name] = parseFloat(_cso[name]) + _inc + 'px';
}


/**
 * 获取兄弟元素。
 * - 可能没有或不匹配；
 * @param  {String} slr 选择器，可选
 * @param  {String} dir 方向（nextElementSibling|previousElementSibling）
 * @return {Element|null}
 */
function _next( el, slr, dir ) {
    let _el = el[dir];
    if (! slr) return _el;

    return _el && $is(_el, slr) ? _el : null;
}

/**
 * dir方向全部兄弟。
 * - 可选的用slr进行匹配过滤；
 * @param  {String} slr 选择器，可选
 * @param  {String} dir 方向（同上）
 * @return {Array}
 */
function _nextAll( el, slr, dir ) {
    let _els = [];

    while ( (el = el[dir]) ) {
        if (!slr) _els.push(el);
        else if ($is(el, slr)) _els.push(el);
    }
    return _els;
}

/**
 * dir方向兄弟元素...直到。
 * - 获取dir方向全部兄弟元素，直到slr但不包含；
 * @param  {String|Element} slr 选择器或元素，可选
 * @param  {String} dir 方向（同上）
 * @return {Array}
 */
function _nextUntil( el, slr, dir ) {
    let _els = [];

    while ( (el = el[dir]) ) {
        if (slr && $is(el, slr)) break;
        _els.push(el);
    }
    return _els;
}


/**
 * 返回首个匹配的元素。
 * @param  {[Element]} els 元素集（数组）
 * @param  {String|Element} slr 选择器或匹配元素
 * @return {Element|null}
 */
function _first( els, slr ) {
    for (let _el of els) {
        if ($is(_el, slr)) return _el;
    }
    return null;
}


/**
 * 元素事件克隆。
 * @param  {Element} src 源元素
 * @param  {Element} to 目标元素
 * @param  {Boolean} deep 是否深层克隆
 * @return {Element} 目标元素
 */
function _cloneEvent( src, to, deep ) {
    Event.clone(to, src);
    if (!deep) {
        return to;
    }
    let _to = $tag('*', to);

    Arr($tag('*', src))
    .forEach(
        (el, i) => Event.clone(_to[i], el)
    );
    return to;
}



//
// 元素收集器。
// 继承自数组，部分数组的函数被重定义，但大部分保留。
//
class Collector extends Array {
    /**
     * 构造收集器实例。
     * @param {Element|NodeList|Array|0} obj 元素（集）
     * @param {Collector} prev 前一个实例引用
     */
    constructor( obj, prev ) {
        // 注记：
        // 某些实现中，Array原生map类调用会再次调用此构造，
        // 故预构造为数组（容错）
        super(
            ...(obj && superArgs(obj) || [0])
        );
        this.previous = prev || null;
    }


    //-- 定制部分 -------------------------------------------------------------


    /**
     * 查找匹配的元素集。
     * 注：
     * - 单个元素的find查找结果不存在重复可能。
     * - 调用 $.find 使得外部嵌入的代理可延伸至此。
     * @param  {String} slr 选择器
     * @param  {Boolean} andOwn 包含自身匹配
     * @return {Array}
     */
     find( slr, andOwn ) {
        let _buf = this.reduce(
            (buf, el) => buf.concat( $.find(slr, el, andOwn) ),
            []
        );
        if (this.length > 1) {
            _buf = uniqueSort(_buf);
        }
        return new Collector(_buf, this);
    }


    /**
     * 用一个容器包裹集合里的元素。
     * - 目标容器可以是一个元素或HTML结构字符串或取值函数。
     * - 取值函数可以返回一个容器元素或html字符串。
     * - 传递或返回字符串时，容器元素会递进选取为最深层子元素。
     * - 传递或返回元素时，元素直接作为容器，包裹内容为前插（prepend）方式。
     * - 如果目标元素没有父元素（游离），其将替换集合中的首个元素。
     * @param  {Element|String|Function} box 目标容器
     * @return {Collector}
     */
    wrapAll( box, doc = Doc ) {
        if ( isFunc(box) ) {
            box = box(this);
        }
        let _end = box;

        if (typeof box == 'string') {
            box = buildFragment(box, doc).firstElementChild;
            _end = deepChild(box);
        }
        if (!box.parentElement) {
            tQuery.replace(this[0], box);
        }
        _end.prepend(...this);

        return new Collector( box, this );
    }


    /**
     * 让集合中的元素脱离DOM。
     * - 脱离的元素会作为一个新集合被压入栈；
     * 注：调用 $ 系同名成员使得外部嵌入的代理可作用于此。
     * @return {Collector} 脱离的元素集
     */
    detach() {
        return new Collector( this.map(e => $.detach(e)), this );
    }


    /**
     * 删除节点集。
     *   返回的新集合为空（只有addBack、end操作有意义）。
     * 注记：（同上）
     * @return {Collector} 一个空集
     */
    remove() {
        this.forEach( el => $.remove(el) );

        return new Collector( null, this );
    }


    /**
     * 元素内容规范化。
     * 返回值逻辑与单元素版相同。
     * 注：调用 $ 的接口便于嵌入代理可影响至此。
     * @param  {Number} level 影响的子元素层级
     * @return {this|level}
     */
    normalize( level ) {
        this.forEach( el => $.normalize(el, level) );

        return level || this;
    }


    //-- 集合/栈操作 ----------------------------------------------------------


    /**
     * 用特定下标的成员构造一个新实例。
     * - 下标超出集合大小时构造一个空集合；
     * @param  {Number} idx 下标值，支持负数
     * @return {Collector}
     */
    eq( idx ) {
         if (idx >= this.length) {
             return new Collector(0, this);
         }
        return new Collector( this[idx < 0 ? this.length+idx : idx], this );
    }


    /**
     * 用集合的首个匹配成员构造一个新集合。
     * 注：CSS:first-child 是测试是否为首个，不同。
     * @param  {String|Function} slr 匹配选择器
     * @return {Collector}
     */
    first( slr ) {
        let _el = slr ?
            _first(this, slr) :
            this[0];

        return new Collector( _el, this );
    }


    /**
     * 用集合的最后一个匹配成员构造一个新集合。
     * @param  {String|Function} slr 匹配选择器
     * @return {Collector}
     */
    last( slr ) {
        let _el = slr ?
            _first(this.reverse(), slr) :
            this[this.length - 1];

        return new Collector( _el, this );
    }


    /**
     * 添加新元素。
     * - 返回一个添加了新成员的新集合；
     * - 仅在添加了新成员后才需要重新排序；
     * - 总是会构造一个新的实例返回（同jQuery）；
     * @param {String|Element|NodeList|Collector} its 目标内容
     */
    add( its, ctx = Doc ) {
        let _els = tQuery(its, ctx);
        _els = _els.length ? uniqueSort( this.concat(_els) ) : this;

        return new Collector( _els, this );
    }


    /**
     * 构造上一个集合和当前集合的新集合。
     * @param {String|Function} slr 选择器或过滤函数
     */
    addBack( slr ) {
        let _new = $.filter(this.previous, slr);
        _new = _new.length ? uniqueSort( _new.concat(this) ) : this;

        return new Collector( _new, this );
    }


    /**
     * 返回上一个集合（Collector 封装）。
     * @return {Collector}
     */
    end() {
        return this.previous;
    }


    /**
     * 迭代回调。
     * - 对集合内每一个元素应用回调（el, i, this）；
     * @param  {Function} handle 回调函数
     * @param  {Object} thisObj 回调函数内的this
     * @return {Collector} this
     */
    each( handle, thisObj ) {
        return $.each(this, handle, thisObj);
    }


    /**
     * 获取元素或集合。
     * - 获取特定下标位置的元素，支持负数倒数计算；
     * - 未指定下标返回集合的一个新的数组表示（Collector 继承自数组）；
     * @param  {Number} idx 下标值（支持负数）
     * @return {Element|Array}
     */
    get( idx ) {
        return idx === undefined ?
            Array.from(this) :
            this[ idx < 0 ? this.length+idx : idx ];
    }

}


// 已封装标志。
Reflect.defineProperty(Collector.prototype, ownerToken, {
    value: true,
    enumerable: false,
});


/**
 * Collector 取节点方法集成。
 * 获取的节点集入栈，返回一个新实例。
 * - 由 $.xx 单元素版扩展到 Collector 原型空间；
 * - 仅用于 $.xx 返回节点（集）的调用；
 * @param {Array} list 定义名清单（方法）
 * @param {Function} get 获取元素句柄
 */
function elsEx( list, get ) {
    list
    .forEach(function( fn ) {
        Reflect.defineProperty(Collector.prototype, fn, {
            value: function(...rest) {
                return new Collector( get(fn, this, ...rest), this );
            },
            enumerable: false,
        });
    });
}


//
// 过滤：简单封装。
// $.xx 成员调用结果即为集合，封装为实例。
/////////////////////////////////////////////////
elsEx([
        'has',
        'not',
        'filter',
    ],
    // 可代理调用 $
    (fn, els, slr) => $[fn](els, slr)
);


//
// 元素检索。
// $.xx 成员调用返回单个元素或 null。
// 注：结果集会去重排序。
/////////////////////////////////////////////////
elsEx([
        'next',
        'prev',
        'parent',
        'closest',
        'offsetParent',
    ],
    // 可能重复，排序清理
    (fn, els, ...rest) =>
        uniqueSort(
            // 可代理调用 $
            els.map( el => $[fn](el, ...rest) ).filter( el => el !== null )
        )
);


//
// 元素集检索。
// $.xx 成员调用返回一个集合。
// 各元素返回的节点集会被合并到单一集合（扁平化）。
// 注：结果集会去重排序。
/////////////////////////////////////////////////
elsEx([
        'nextAll',
        'nextUntil',
        'prevAll',
        'parents',
        'prevUntil',
        'siblings',
        'parentsUntil',
    ],
    (fn, els, ...rest) => {
            let _buf = els.reduce(
                // 可代理调用 $
                (buf, el) => buf.concat( $[fn](el, ...rest) ),
                []
            );
            // 无条件排序。
            // 注：不对单成员免于排序，统一约定。
            return uniqueSort(_buf);
        }
);


//
// 简单调用&求值。
// $.xx 成员调用返回一个节点集或单个节点。
// 各元素返回的节点集会被合并到单一集合（扁平化）。
// 注：假定 els 不会重复，因此无需排序。
/////////////////////////////////////////////////
elsEx([
        'wrap',
        'wrapInner',
        'unwrap',
        'clone',
        'children',
        'contents',
    ],
    (fn, els, ...rest) =>
        // 可代理调用 $
        els.reduce( (buf, el) => buf.concat( $[fn](el, ...rest) ), [] )
);



/**
 * Collector 普通方法集成。
 * 将单元素版非节点获取类操作集成到 Collector 上，设置为不可枚举。
 * @param {Array} list 定义名清单（方法）
 * @param {Function} get 获取目标函数
 */
function elsExfn( list, get ) {
    list
    .forEach(function( fn ) {
        Reflect.defineProperty(Collector.prototype, fn, {
            value: get(fn),
            enumerable: false,
        });
    });
}


//
// 简单取值。
// 获取的数据为值，返回一个值集合（普通数组）。
// 值的位置与原集合中元素位置一一对应。
/////////////////////////////////////////////////
elsExfn([
        'is',  	// 返回一个布尔值集合
        'hasClass',
        'innerHeight',
        'outerHeight',
        'innerWidth',
        'outerWidth',
        'position',
    ],
    fn =>
    function(...rest) {
        // 转为普通数组。可代理调用 $
        return [...this.map( el => $[fn](el, ...rest) )];
    }
);


//
// 单纯操作。
// 返回当前实例本身。
/////////////////////////////////////////////////
elsExfn([
        'empty',
        'addClass',
        'removeClass',
        'toggleClass',
        'removeAttr',
        'on',
        'off',
        'one',
        'trigger',

        // 节点插入（多对多）
        // 若集合有多个元素，通常采用克隆模式（clone实参为true）
        'before',
        'after',
        'prepend',
        'append',
        'replace',
        'fill',

        // 元素原生事件激发
        'click',
        'dblclick',
        'select',
        'focus',
        'blur',
        'submit',
        'reset',
        'change',
        'scroll',
    ],
    fn =>
    function(...rest) {
        // 可代理调用 $
        for ( let el of this ) $[fn](el, ...rest);
        return this;
    }
);


//
// 设置/获取值（有目标）。
// 设置与获取两种操作合二为一的成员，val支持数组分别赋值。
// 取值时返回一个普通数组，成员与集合元素一一对应。
/////////////////////////////////////////////////
elsExfn([
        'attr',
        'prop',
        'css',
    ],
    fn =>
    function( its, val ) {
        if (val === undefined) {
            return [...this.map( el => $[fn](el, its) )];
        }
        let _ia = isArr(val);
        this.forEach(
            // 可代理调用 $
            (el, i) => $[fn](el, _ia ? val[i] || '' : val)
        );
        return this;
    }
);


//
// 取值/属性修改。
// 设置与获取两种操作合二为一的成员，val支持数组分别赋值。
// 取值时返回一个普通数组，成员与集合元素一一对应。
/////////////////////////////////////////////////
elsExfn([
        'val',
        'height',
        'width',
        'offset',
        'scrollLeft',
        'scrollTop',
    ],
    fn =>
    function( val ) {
        if (val === undefined) {
            return [ ...this.map( el => $[fn](el) ) ];
        }
        let _ia = isArr(val);
        this.forEach(
            (el, i) => {
                // 可代理调用 $
                $[fn](el, _ia ? val[i] || '' : val);
            }
        );
        return this;
    }
);


//
// 取值/内容修改。
// 设置与获取两种操作合二为一，val支持数组分别赋值。
//
// 设置时：返回的新节点构造为一个新的Elements实例。
// 取值时：返回一个普通数组，成员与集合元素一一对应。
//
// @return {[Value]|Collector}
/////////////////////////////////////////////////
elsExfn([
        'html',
        'text',
    ],
    fn =>
    function( val, ...rest ) {
        let _ia = isArr(val),
            _vs = this.map(
            (el, i) => {
                // 可代理调用 $
                return $[fn](el, _ia ? val[i] || '' : val, ...rest);
            }
        );
        if (val === undefined) {
            return [..._vs];
        }
        // 扁平化，构造为 Collector
        return new Collector([].concat(..._vs), this);
    }
);



//
// 集合版6种插入方式。
// 与单元素版对应但主从关系互换。
// （多对一）
/////////////////////////////////////////////////
[
    ['insertBefore', 	'before'],
    ['insertAfter', 	'after'],
    ['prependTo', 		'prepend'],
    ['appendTo', 		'append'],
    ['replaceAll', 		'replace'],
    ['fillTo', 			'fill'],
]
.forEach(function( names ) {
    Reflect.defineProperty(Collector.prototype, [names[0]], {
        /**
         * 将集合中的元素插入相应位置。
         * - 默认不会采用克隆方式（原节点会脱离DOM）；
         * - 传递clone为真，会克隆节点（默认包含注册事件）；
         * - 如果无需包含事件，需明确传递event为false；
         * @param  {Element} to 目标元素
         * @param  {Boolean} clone 数据节点克隆
         * @param  {Boolean} event 是否克隆注册事件
         * @return {Collector} 实例自身
         */
        value: function( to, clone, event = true ) {
            // 可代理调用 $
            $[ names[1] ]( to, this, clone, event );
            return this;
        },
        enumerable: false,
    });
});



//
// 基本工具。
///////////////////////////////////////////////////////////////////////////////


/**
 * 是否在数组中。
 * @param {Array|LikeArray} arr 数组/类数组
 * @param {Value} val 对比值
 * @return {Boolean}
 */
function inArray( arr, val ) {
    for ( let i = 0; i < arr.length; i++ ) {
        if (arr[i] === val) return true;
    }
    return false;
}


/**
 * 是否为纯数字。
 * from jQuery 3.x
 * @param  {Mixed}  obj 测试目标
 * @return {Boolean}
 */
function isNumeric( obj ) {
    let _t = typeof obj;
    return ( _t === "number" || _t === "string" ) &&
        !isNaN( obj - parseFloat( obj ) );
}


//
// 是否为窗口。
//
function isWindow( obj ) {
    return obj !== null && obj === obj.window;
}


/**
 * 通用某一为真。
 * - 类似数组同名函数功能，扩展到普通对象；
 * - 适用数组/类数组/普通对象/.entries接口对象；
 * - 比较函数接收值/键两个参数，类似each；
 * 注记：
 * - 原则上为只读接口，不传递目标自身；
 *
 * @param  {Array|LikeArray|Object|.entries} iter 迭代目标
 * @param  {Function} comp 比较函数
 * @param  {Object} thisObj 回调内的this
 * @return {Boolean}
 */
function iterSome( iter, comp, thisObj ) {
    if (thisObj) {
        comp = comp.bind(thisObj);
    }
    for ( let [k, v] of entries(iter) ) {
        if (comp(v, k)) return true;
    }
    return false;
}


//
// 是否为函数。
// from jQuery v3.4
//
function isFunc( obj ) {
    // Support: Chrome <=57, Firefox <=52
    // In some browsers, typeof returns "function" for HTML <object> elements
    // (i.e., `typeof document.createElement( "object" ) === "function"`).
    // We don't want to classify *any* DOM node as a function.
    return typeof obj === "function" && typeof obj.nodeType !== "number";
}


/**
 * 类数组检测（简单）。
 * - 只要length为数值，且非零值存在序列即可；
 * 注：字符串也被视为类数组。
 * @param  {Mixed} obj 检查目标
 * @return {Boolean}
 */
function arrLike( obj ) {
    let _len = !!obj && obj.length;

    return _len === 0 || typeof _len == 'number' &&
        // Object封装兼容字符串
        (_len - 1) in Object( obj );
}


//
// 选择器判断函数构造。
// 测试调用：func(elem)
// @param  {String|Function|Element|Array}
// @return {Function}
//
function getFltr( its ) {
    if (!its || isFunc(its)) {
        return its;
    }
    if (typeof its == 'string') {
        return e => $is(e, its);
    }
    if (isArr(its)) {
        return ( e => its.includes(e) );
    }
    return ( e => e === its );
}


/**
 * 是否为 Collector 实例。
 * @param  {Mixed} obj 测试对象
 * @return {Boolean}
 */
function isCollector( obj ) {
    return !!obj && obj[ ownerToken ];
}


/**
 * 测试构造 Collector 基类参数。
 * - 返回false表示参数不合法；
 * @param  {Array|LikeArray|Element|[.values]} obj 目标对象
 * @return {Iterator|false} 可迭代对象
 */
function superArgs( obj ) {
    if (obj.nodeType) {
        return [ obj ];
    }
    return isFunc(obj.values) ? obj.values() : $A(obj);
}


/**
 * 像素值转换数值。
 * - 像素单位转为纯数值；
 * - 非像素或数值返回null；
 * @param  {String|Number} val
 * @return {Number|null}
 */
function pixelNumber( val ) {
    return isNumeric(val) || rpixel.test(val) ? parseFloat(val) : null;
}


/**
 * 构造范围数字序列。
 * @param  {Number} beg 起始值
 * @param  {Number} len 长度
 * @return {Iterator} 范围生成器
 */
function* rangeNumber( beg, len ) {
    if (len <= 0) {
        return null;
    }
    while (len--) yield beg++;
}


/**
 * 构造Unicode范围字符序列。
 * - len为终点字符时，其本身包含在范围内（末尾）；
 * @param  {Number} beg 起始字符码值
 * @param  {Number|String} len 长度或终点字符
 * @return {Iterator} 范围生成器
 */
function* rangeChar( beg, len ) {
    if (len <= 0) {
        return null;
    }
    if (typeof len == 'string') {
        len = len.codePointAt(0) - beg + 1;
    }
    if (len > 0) while (len--) yield String.fromCodePoint(beg++);
}


/**
 * 获取键值对迭代器。
 * - 扩展适用类数组和普通对象；
 * @param  {Array|LikeArray|Object|.entries} obj 迭代目标
 * @return {Iterator} 迭代器
 */
function entries( obj ) {
    if (obj.entries) {
        return obj.entries();
    }
    let _arr = $A(obj);
    return _arr && _arr.entries() || Object.entries(obj);
}


/**
 * 获取值迭代器。
 * - 扩展适用类数组和普通对象；
 * @param  {Array|LikeArray|Object|.values} obj 迭代目标
 * @return {Iterator} 迭代器
 */
function values( obj ) {
    if (obj.values) {
        return obj.values();
    }
    let _arr = $A(obj);
    return _arr && _arr[Symbol.iterator]() || Object.values(obj);
}


/**
 * 元素内容填充。
 * - 检查数据成员类型以首个成员为依据。
 * - 节点数据会导致其从原位置脱离。
 * 注：
 * 由Element调用，el是一个新元素，因此无需清空内容。
 *
 * @param  {Element} el 目标元素
 * @param  {Array|Node|String} data 数据集
 * @return {Element} el
 */
function fillElem( el, data ) {
    if (!data) return el;

    let _fn = data.nodeType || data[0].nodeType ?
        'fill' :
        'html';

    return tQuery[_fn](el, data), el;
}


/**
 * 从配置设置元素。
 * - 属性配置设置到元素的特性上（Attribute）。
 * - 支持 text|html|node 特殊属性名设置元素内容，数据源可为数组。
 * @param  {Element} el 目标元素
 * @param  {Object|Map|.entries} conf 配置对象
 * @return {Element} el
 */
function setElem( el, conf ) {
    if (!conf) return el;

    for ( let [k, v] of entries(conf) ) {
        switch (k) {
        case 'html':
            tQuery.html(el, v); break;
        case 'text':
            tQuery.text(el, v); break;
        case 'node':
            tQuery.fill(el, v); break;
        default:
            elemAttr.set(el, k, v);
        }
    }
    return el;
}


/**
 * 制作表格行。
 * 仅创建包含空单元格的行（内容处理交给外部）。
 * @param {Element} tr 表格行容器（空）
 * @param {Numbel} cols 列数
 * @param {String} tag 单元格标签名
 * @param {Boolean} th0 首列为 TH 单元格
 * @return {Element} tr 原表格行
 */
function buildTR( tr, cols, tag, th0 ) {
    let cells = [];

    if (th0 && cols > 0) {
        cells.push(Doc.createElement('th'));
        cols --;
    }
    for (let n = 0; n < cols; n++) {
        cells.push(Doc.createElement(tag));
    }
    tr.append(...cells);

    return tr;
}


/**
 * 检查表格行获取适当容器。
 * - 若初始容器不是表格，则可忽略；
 * - 应对表格行直接插入table的情况；
 *
 * @param  {Element} box 原容器元素
 * @param  {Element} sub 内容子元素
 * @return {Element} 合适的容器元素
 */
function trParent( box, sub ) {
    if (box.nodeName.toLowerCase() == 'table' &&
        sub.nodeName.toLowerCase() == 'tr') {
        return $tag('tbody', box)[0] || box;
    }
    return box;
}


/**
 * 获取计算样式。
 * @param  {Element} el
 * @return {CSSStyleDeclaration}
 */
function getStyles( el ) {
    // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
    // IE throws on elements created in popups
    // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    var view = el.ownerDocument.defaultView;

    if ( !view || !view.opener ) {
        view = window;
    }

    return view.getComputedStyle(el);
}


/**
 * 节点按DOM中顺序排序。
 * - 外部保证节点已经去除重复；
 * @param  {Node} a
 * @param  {Node} b
 * @return {Number} [-1, 0, 1]
 */
function sortElements( a, b ) {
    let _comp = a.compareDocumentPosition( b );

    if (_comp & 1) {
        throw new Error('Can not compare nodes between two different documents');
    }
    // 子元素时浏览器返回20，包含16和4
    return _comp & 4 ? -1 : 1;
}


//
// 名称转换。
// 用于CSS属性名和data系prop名称。
//
function camelCase( name ) {
    return name
        // Support: IE <=9 - 11, Edge 12 - 13
        // Microsoft forgot to hump their vendor prefix (#9572)
        .replace( /^-ms-/, "ms-" )
        // 短横线分隔转为驼峰表示。
        .replace( /-[a-z]/g, cc => cc[1].toUpperCase() );
}


/**
 * 获取样式值（集）。
 * @param  {CSSStyleDeclaration} cso 计算样式集
 * @param  {String|Array} names 样式名（集）
 * @return {String|Map}
 */
function cssGets( cso, names ) {
    if (typeof names == 'string') {
        return cso[names];
    }
    return names.reduce( (map, n) => map.set(n, cso[n]), new Map() );
}


/**
 * 设置样式值。
 * @param  {Element} el 目标元素
 * @param  {String|Object} name 样式名或名值对对象
 * @param  {String|Number|Function} val 设置值或取值回调
 * @param  {CSSStyleDeclaration} cso 计算样式集
 * @return {void}
 */
function cssSets( el, name, val, cso ) {
    if (typeof name == 'string') {
        return ( el.style[name] = cssFunc(val, cso, name, el) );
    }
    for (let [n, v] of Object.entries(name)) {
        el.style[n] = cssFunc(v, cso, n, el);
    }
}


/**
 * 样式回调取值。
 * - 若为函数才取值计算；
 * - 若为纯数值构造为像素值表示；
 * @param  {Function|Value} its 回调函数或简单值
 * @param  {CSSStyleDeclaration} cso 计算样式集
 * @param  {String} key 样式键名
 * @return {String|Number} 计算样式值
 * @return {Element} 当前元素
 */
function cssFunc( its, cso, key, el ) {
    let _val = isFunc(its) ?
        its.bind(el)( cso[key], cso ) : its;

    return isNumeric(_val) ? +_val + 'px' : _val;
}


/**
 * 选择性插入。
 * 首选插入next之前，否则box内末尾添加。
 * @param  {Node} node 待插入节点
 * @param  {Element} next 下一个参考元素
 * @param  {Element} box 容器元素，可选
 * @return {Node} 插入节点
 */
function switchInsert( node, next, box ) {
    if (next) {
        return next.parentNode.insertBefore(node, next);
    }
    return box.appendChild(node);
}


/**
 * 载入元素。
 * - 绑定载入成功与错误的处理，返回一个承诺对象。
 * - 主要用于脚本/样式元素的载入回调。
 * 承诺.then(el | undefined)
 * @param  {Element} el  目标元素
 * @param  {Node} next 下一个参考节点
 * @param  {Element} box 容器元素，可选
 * @param  {Boolean} tmp 为临时插入（成功后移除）
 * @return {Promise}
 */
function loadElement( el, next, box, tmp ) {
    return new Promise( function(resolve, reject) {
        tQuery.one(el, {
            'load':  () => resolve( tmp ? remove(el, true) : el ),
            'error': err => reject(err),
        });
        switchInsert(el, next, box);
    });
}


/**
 * 提取最深层子元素。
 * @param  {Element} el 目标元素
 * @return {Element}
 */
function deepChild( el ) {
    let _sub = el.firstElementChild;
    if (!_sub) return el;

    return deepChild(_sub);
}


/**
 * 删除节点元素。
 * - 默认保持引用（不被垃圾回收）；
 * - 引用存储在__nodeDetach空间；
 * @param {Node} node 目标节点
 * @param {Boolean} deleted 彻底删除
 */
function remove( node, deleted ) {
    let _box = node.parentNode;

    if (!_box || node.nodeType > 8) {
        return;
    }
    if (! deleted) {
        return _box.removeChild(node);
    }
    _box.removeChild(node);
}


/**
 * 内容包裹。
 * - 包裹容器可以是一个现有的元素或html结构字符串或取值函数。
 * - 包裹采用结构字符串时，会递进至首个最深层的子元素为容器。
 * - box直接传递或返回元素时被视为父容器，但内容前插（与jQuery异）。
 * - 取值函数：function(Node|[Node]): Element|string
 * 注记：
 * - 对提供的容器支持为前部插入有更好的可用性（可变CSS选择器）。
 *
 * @param  {Node} rep 替换点节点
 * @param  {Element|String|Function} box 包裹容器或取值函数
 * @param  {Node|[Node]} data 被包裹数据
 * @param  {Document} doc 元素所属文档对象
 * @return {Element} 包裹容器元素
 */
function wrapData( rep, box, data, doc = Doc ) {
    if ( isFunc(box) ) {
        box = box(data);
    }
    let _end = box;

    if (typeof box == 'string') {
        box = buildFragment(box, doc).firstElementChild;
        _end = deepChild(box);
    }
    tQuery.replace(rep, box);

    if (isArr(data)) {
        _end.prepend(...data);
    } else {
        _end.prepend(data);
    }
    return box;
}


/**
 * 类名切换。
 * - 支持空格分隔的多个类名；
 * @param  {Element} el  目标元素
 * @param  {String} name 类名称
 * @param  {Boolean} force 强制设定，可选
 */
function clsToggle( el, name, force ) {
    if (typeof force == 'boolean') {
        if (force) {
            tQuery.addClass(el, name);
        } else {
            tQuery.removeClass(el, name);
        }
    }
    name.split(__chSpace)
        .forEach(
            function(it) { this.toggle(it); },
            el.classList
        );
}


/**
 * 通用赋值。
 * - 调用目标域内的set设置值，接口：set(el, key, value)
 * - 值可为回调取值，接口：value( get(el, key), el )
 * 参数：
 * - name支持字符串或一个名/值对象（Object）；
 * - value为一个新值或获取新值的回调函数；
 * - 名/值对象中的值依然可以是回调函数（与键对应）；
 * 注记：
 * - 设置时name不存在空格分隔序列的形式；
 *
 * @param {Element} el 目标元素
 * @param {String|Object} name 名称或名/值对象
 * @param {Mixed|Function} value 设置值或回调函数
 * @param {Object} scope 适用域对象
 */
function hookSets( el, name, value, scope ) {
    if (typeof name == 'string') {
        name = { [name]: value };
    }
    for (let [_k, _v] of Object.entries(name)) {
        if (isFunc(_v)) {
            _v = _v(scope.get(el, _k), el);
        }
        scope.set(el, _k, _v);
    }
}


/**
 * 通用多取值。
 * - 循环名称集取值，返回一个名称为键的Map实例；
 * - Map内成员的顺序与属性名一致，可能有用；
 * @param  {Element} el 目标元素
 * @param  {String|Array} name 名称（集）
 * @param  {Object} scope 适用域对象
 * @return {String|Map} 值或Map实例
 */
function hookGets( el, name, scope ) {
    if (typeof name == 'string') {
        return scope.get(el, name);
    }
    return name.reduce(
        (map, n) => map.set(n, scope.get(el, n)), new Map()
    );
}


/**
 * 偏移坐标转为位置坐标。
 * - 偏移坐标不含外边距，位置坐标从外边距左上角算起；
 * - 两者坐标都用 {top, left} 表示；
 * @param  {Object} offset 元素偏移坐标
 * @param  {CSSStyleDeclaration} css 元素计算样式对象
 * @return {Object} 位置坐标对象
 */
function toPosition( offset, css ) {
    return {
        top:  offset.top - parseFloat(css.marginTop),
        left: offset.left - parseFloat(css.marginLeft)
    };
}


/**
 * 获取元素的偏移坐标。
 * - 相对于文档根元素；
 * 返回值格式：{
 *  	top:  number,
 *  	left: number
 * }
 * @param  {Element} el 目标元素
 * @return {Object}
 */
function getOffset( el ) {
    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    // Support: IE <=11 only
    // Running getBoundingClientRect on a disconnected node in IE throws an error
    if (!el.getClientRects().length) {
        return { top: 0, left: 0 };
    }
    let _doc  = el.ownerDocument,
        _win  = _doc.defaultView,
        _root = _doc.documentElement,
        _rect = el.getBoundingClientRect();

    return {
        top:  _rect.top + _win.pageYOffset - _root.clientTop,
        left: _rect.left + _win.pageXOffset - _root.clientLeft
    };
}


/**
 * 计算最终使用偏移坐标。
 * - 用户指定的非法坐标值忽略；
 * @param  {Object} cur  当前实际偏移
 * @param  {Object} conf 用户坐标配置
 * @param  {Object} self 元素样式坐标
 * @return {Object} 坐标对象：{top, left}
 */
function useOffset( cur, conf, self ) {
    let _use = {};

    if (typeof conf.top == 'number') {
        _use.top = (conf.top - cur.top) + self.top;
    }
    if (typeof conf.left == 'number') {
        _use.left = (conf.left - cur.left) + self.left;
    }
    return _use;
}


/**
 * 计算元素当前偏移样式值。
 * - 指样式设定的计算结果；
 * - 返回 {top, left}
 * @param  {Element} el 目标元素
 * @return {Object}
 */
function calcOffset( el ) {
    let _cso = getStyles(el);

    // 包含定位属性，获取明确值。
    if ((_cso.position == 'absolute' || _cso.position == 'fixed') &&
        [_cso.top, _cso.left].includes('auto')) {
        let _pos = tQuery.position(el);
        return {
            top:  _pos.top,
            left: _pos.left
        };
    }
    return {
        top:  parseFloat(_cso.top) || 0,
        left: parseFloat(_cso.left) || 0
    };
}


/**
 * 测试获取窗口对象。
 * @param  {Element|Window|Document} el
 * @return {Window|null}
 */
function getWindow( el ) {
    if (isWindow(el))
        return el;

    return el.nodeType == 9 ? el.defaultView : null;
}


/**
 * 设置窗口/元素滚动条。
 * @param {Element|Window} dom 目标对象
 * @param {Number} val 设置值
 * @param {String} xy  位置标志
 */
function scrollSet( dom, val, xy ) {
    switch (xy) {
    case 'T':
        return (dom.scrollTop = val);
    case 'Y':
        return dom.scrollTo(dom.pageXOffset, val);
    case 'L':
        return (dom.scrollLeft = val);
    case 'X':
        return dom.scrollTo(val, dom.pageYOffset);
    }
}


/**
 * 检查并返回普通节点。
 * - 普通节点包含元素/文本/注释节点；
 * @param  {Node} node 目标节点
 * @return {Boolean}
 */
function usualNode( node ) {
    let _nt = node.nodeType;
    return _nt == 1 || (_nt == 3 && node.textContent.trim()) || _nt == 8;
}


/**
 * 过滤出有效的节点集。
 * - 仅包含元素和非空文本节点。
 * @param  {Node} node 节点
 * @return {Nude|null}
 */
function masterNode( node ) {
    let _nt = node.nodeType;
    return _nt == 1 || _nt == 3 && node.textContent.trim();
}


/**
 * 提取节点源码/文本。
 * - 适用于元素节点和文本节点；
 * - 多个节点取值简单连接；
 * - 非节点类型被字符串化；
 * @param  {Node|NodeList|[String]|Set|Iterator} nodes 节点（集）
 * @param  {String} sep 连接字符
 * @return {String}
 */
function outerHtml( nodes, sep ) {
    let _buf = [];
    nodes = nodes.nodeType ? [nodes] : values(nodes);

    for ( let nd of nodes ) {
        if (nd) {
            switch (nd.nodeType) {
            case 1:
                nd = nd.outerHTML;
                break;
            case 3:
                nd =  nd.textContent;
                break;
            }
        }
        _buf.push('' + nd);
    }
    return _buf.join(sep);
}


/**
 * 提取节点文本。
 * @param  {Node|NodeList|[String]|Set|Iterator} nodes 节点（集）
 * @param  {String} sep 连接字符
 * @return {String}
 */
function nodeText( nodes, sep = ' ' ) {
    if (nodes.nodeType) {
        return nodes.textContent;
    }
    let _buf = [];

    for ( let nd of values(nodes) ) {
        if (nd && nd.nodeType) {
            nd = nd.textContent;
        }
        _buf.push('' + nd);
    }
    return _buf.join(sep);
}


/**
 * 将文本转义为html源码。
 * - 转义HTML特殊字符为实体表示；
 * - 返回值按html方式插入获得原样文本；
 *
 * @param  {String} code 任意文本
 * @param  {Document} doc 文档对象
 * @return {String} 转义后源码
 */
function textHtml( code, doc = Doc ) {
    let _box = doc.createElement('div');
    _box.textContent = code;
    return _box.innerHTML;
}


/**
 * 将html源码解析为文本。
 * 如： &lt; 解析为‘<’
 * @param  {String} code 源码
 * @param  {Document} doc 文档对象
 * @return {String}
 */
function htmlText( code, doc = Doc ) {
    let _box = doc.createElement('div');

    try {
        _box.innerHTML = code;
    }
    catch (e) {
        return window.console.error(e);
    }
    return _box.textContent;
}


/**
 * 通用节点/文档片段插入。
 * - 返回实际插入内容（节点集）的引用或null；
 * - 参考节点ref一般在文档树（DOM）内；
 * @param {Node} ref 参考节点
 * @param {Node|Fragment} data 节点或文档片段
 * @param {String|Number} where 插入位置
 * @return {Node|Array|null} 内容元素（集）
 */
function Insert( ref, data, where = 0 ) {
    if (!data || !ref) return;

    let _call = insertHandles[where],
        _revs = _call && data.nodeType == 11 ?
            Arr(data.childNodes) :
            data;

    return _call && _call(data, ref, ref.parentNode) && _revs;
}


//
// 6类插入函数集。
// node可以是文档片段或元素或文本节点。
//
const insertHandles = {
    // replace
    '': ( node, ref, box ) => box && box.replaceChild(node, ref),

    // fill
    '0': ( node, ref /*, box*/) => {
        if (ref.nodeType == 1) {
            ref.textContent = '';
            return ref.appendChild(node);
        }
    },

    // before
    '1': ( node, ref, box ) => box && box.insertBefore(node, ref),

    // after
    '-1': ( node, ref, box ) => box && box.insertBefore(node, ref.nextSibling),

    // end/append
    '-2': ( node, ref, box, _pos ) => {
        if (ref.nodeType == 1) {
            ref = trParent(ref, node.firstChild);
            return ref.insertBefore(node, _pos || null);
        }
    },

    // begin/prepend
    '2': ( node, ref, box ) => insertHandles[-2](node, ref, box, ref.firstChild),
};


/**
 * DOM 通用操作。
 * - 取参数序列构造文档片段，向回调传递（node, Fragment）。
 * - 回调完成各种逻辑的插入行为（append，after...）。
 * - 参数序列可以是一个取值函数，参数为目标元素。
 * 注：
 * - args也可以是一个可迭代的节点序列，如：
 *   NodeList，HTMLCollection，Array，Collector 等。
 *
 * - 取值回调可返回节点或节点集，但不能再是函数。
 *
 * @param  {Node} node 目标节点（元素或文本节点）
 * @param  {Node|NodeList|Collector|Function|Set|Iterator} cons 内容
 * @param  {Boolean} clone 是否克隆
 * @param  {Boolean} event 是否克隆注册事件
 * @return {Node|Fragment|null} 待插入节点或文档片段
 */
function domManip( node, cons, clone, event ) {
    // 优先处理单节点
    if (cons.nodeType) {
        return clone ? tQuery.clone(cons, event, true) : cons;
    }
    if ( isFunc(cons) ) {
        cons = cons(node);
    }
    return fragmentNodes(
        cons,
        nd => clone && tQuery.clone(nd, event, true),
        node.ownerDocument
    );
}


/**
 * 节点集构造文档片段。
 * - 只接受元素、文本节点、注释和文档片段数据；
 * @param  {NodeList|Set|Iterator} nodes 节点集/迭代器
 * @param  {Function} get 取值回调，可选
 * @param  {Document} doc 文档对象
 * @return {Fragment|null}
 */
function fragmentNodes( nodes, get, doc ) {
    // 注记：
    // 因存在节点移出可能，不可用values原生迭代；
    // 扩展运算符用于Set数据。
    nodes = $A(nodes) || [...nodes];

    let _all = doc.createDocumentFragment();

    for ( let n of nodes ) {
        let _nd = get && get(n) || n;

        if ( _nd && (usualNode(_nd) || _nd.nodeType == 11) ) {
            _all.appendChild(_nd);
        }
    }
    return _all.childNodes.length ? _all : null;
}


/**
 * 构建文档片段。
 * - 源码中的脚本元素被提取出来，存储在exbuf中（如果提供）；
 * - 脚本元素包含“script，style，link”三种；
 * - 源码解析异常会静默失败，返回null；
 * @param  {String} html 源码
 * @param  {Document} doc 文档对象
 * @param  {Array} xbuf 脚本存储空间
 * @return {Fragment|Node} 节点/片段
 */
function buildFragment( html, doc, xbuf ) {
    let _frag = doc.createDocumentFragment();

    if (!ihtml.test( html )) {
        _frag.appendChild( doc.createTextNode(html) );
        return _frag;
    }
    let _box = doc.createElement("div");
    try {
        _box.innerHTML = html;
    }
    catch (e) {
        window.console.error(e);
        return null;
    }
    // pick script...
    for ( let _tmp of $all('script, style, link', _box)) {
        if (xbuf) xbuf.push(_tmp);
        remove(_tmp);
    }
    // force remove.
    for (let _del of $all('html, head, body', _box)) {
        remove(_del);
        window.console.warn('html, head, body was denied.');
    }
    // 注记：
    // 不可用values迭代，节点的移出会影响迭代次数！
    for ( let _node of Arr(_box.childNodes) ) {
        _frag.appendChild( _node );
    }
    return _frag;
}



//
// 特性（Attribute）操作封装。
// 包含对data-*系特性的处理。
//
const elemAttr = {
    /**
     * 获取特性值。
     * - 特性名可能为data系简写形式；
     * - 如果属性不存在，返回null；
     * @param  {Element} el 目标元素
     * @param  {String} name 特性名
     * @return {Mixed} 特性值
     */
    get( el, name ) {
        let _ns = name.match(__dataName);
        return el.getAttribute( _ns ? 'data-' + _ns[1] : name );
    },


    /**
     * 设置特性。
     * - name不存在空格分隔序列的形式；
     * - 部分属性为Boolean性质，特别处理（boolHook）；
     * - 特性名可能为data系简写形式；
     *
     * @param {Element} el 目标元素
     * @param {String} name 特性名
     * @param {Mixed} value 设置值
     */
    set( el, name, value ) {
        return boolAttr.test(name) ?
            boolHook.set(el, value, name) : this.setAttr(el, name, value);
    },


    /**
     * 设置/删除特性。
     * - 如果value为null，则删除该特性；
     * - 特性名可能为data系简写形式；
     * @param {Element} el 目标元素
     * @param {String} name 特性名
     * @param {Mixed} value 目标值
     */
    setAttr( el, name, value ) {
        let _ns = name.match(__dataName);
        if (_ns) {
            name = 'data-' + _ns[1];
        }
        if (value === null) {
            el.removeAttribute(name);
        } else {
            el.setAttribute(name, value);
        }
    },

};


//
// 属性（Property）操作封装。
// 包含对dataset系属性的处理。
//
const elemProp = {
    /**
     * 获取属性值。
     * - 属性名可能为data系简写形式；
     * @param  {Element} el  目标元素
     * @param  {String} name 属性名
     * @return {Mixed} 结果值
     */
    get( el, name ) {
        let _ns = name.match(__dataName);
        if (_ns) {
            // 名称解析短横线为驼峰式
            return el.dataset[ camelCase(_ns[1]) ];
        }
        name = propFix[name] || name;
        let _hook = propHooks[name];

        return _hook ? _hook.get(el) : el[name];
    },


    /**
     * 设置属性。
     * - 属性名可能为data系简写形式；
     * @param {Element} el  目标元素
     * @param {String} name 属性名
     * @param {Mixed} value 设置值
     */
    set( el, name, value ) {
        let _ns = name.match(__dataName);
        if (_ns) {
            // 名称解析短横线为驼峰式
            el.dataset[ camelCase(_ns[1]) ] = value;
        } else {
            el[ propFix[name] || name ] = value;
        }
    },

};



//!from jQuery 2.x or 3.x
const
    focusable = /^(?:input|select|textarea|button)$/i,
    propFix = {
        'for':   'htmlFor',
        'class': 'className',
        // 取消支持。
        // 由用户提供正确名称。一致性（驼峰名称不止这些）。
        // 'tabindex': 			'tabIndex',
        // 'readonly': 			'readOnly',
        // 'maxlength': 		'maxLength',
        // 'cellspacing': 		'cellSpacing',
        // 'cellpadding': 		'cellPadding',
        // 'rowspan': 			'rowSpan',
        // 'colspan': 			'colSpan',
        // 'usemap': 			'useMap',
        // 'frameborder': 		'frameBorder',
        // 'contenteditable': 	'contentEditable',
    },
    booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
    boolAttr = new RegExp("^(?:" + booleans + ")$", "i"),
    boolHook = {
        set: function( el, val, name ) {
            if ( val === false ) {
                el.removeAttribute(name);
            } else {
                el.setAttribute(name, name);
            }
        }
    };

const propHooks = {
    tabIndex: {
        get: function( el ) {
            return el.hasAttribute( "tabindex" ) || focusable.test( el.nodeName ) || el.href ?
                parseInt(el.tabIndex) || 0 :
                -1;
        }
    }
};


//
// val操作特例。
//
// 单选按钮有组属性值，且没有“包容”元素可操作，
// 所以操作目标只能是按钮本身（任一成员皆可）。
//
// 复选框按钮允许同名成组，因此需要考虑组操作。
//
// option也有组属特点，但其有包容元素（select），
// 因此设计仅允许操作其容器元素，而屏蔽单独操作。
//
const valHooks = {

    // 会依所属组判断操作。
    radio: {
        // 返回选中项的值，仅一项。
        get: function( el ) {
            let _res = el.form[el.name];
            if (!_res) return;

            if (_res.nodeType) {
                _res = [_res];
            }
            else if (_res.value !== undefined) {
                return _res.value;
            }
            for (let _re of _res) {
                if (_re.checked) return _re.value;
            }
        },

        // val仅为值，不支持数组。
        // 注：采用严格相等比较。
        set: function( el, val ) {
            let _res = el.form[el.name];
            if (!_res) return;

            if (_res.nodeType) {
                _res = [_res];
            }
            for (let _re of _res) {
                if (val === _re.value) return (_re.checked = true);
            }
        }
    },

    checkbox: {
        // 单一成员时返回值或null（未选中）；
        // 重名多成员时返回值数组（可能为空）；
        // 注：返回undefined是因为缺乏name定义。
        get: function( el ) {
            let _cbs = el.form[el.name];
            if (!_cbs) return;

            if (_cbs.nodeType) {
                return _cbs.checked ? _cbs.value : null;
            }
            let _buf = [];
            for (let _cb of _cbs) {
                if (_cb.checked) _buf.push(_cb.value);
            }
            return _buf;
        },

        // 支持同名多复选。
        // 支持值数组匹配。
        set: function( el, val ) {
            let _cbs = el.form[el.name];
            if (!_cbs) return;

            if (_cbs.nodeType) {
                _cbs.checked = val === _cbs.value;
                return;
            }
            if (!isArr(val)) {
                val = [val];
            }
            for (let _cb of _cbs) {
                _cb.checked = inArray(val, _cb.value);
            }
        }
    },

    // 空操作占位。
    // 不可单独选取/取消选取。
    option: {
        get: function() {},
        set: function() {}
    },

    optgroup: {
        // 始终返回一个数组。
        get: function(el) {
            let _buf = [];
            for (let _op of el.children) {
                if (_op.selected) _buf.push(_op.value);
            }
            return _buf;
        },

        // 支持值数组匹配。
        // 不检测上级select类型。
        set: function( el, val ) {
            if (typeof val == 'string') {
                val = [val];
            }
            for (let _op of el.children) {
                if (inArray(val, _op.value)) _op.selected = true;
            }
        }
    },

    select: {
        // 单选列表返回一个值，
        // 多选列表返回一个值数组（可能为空）。
        get: function( el ) {
            if (el.type == 'select-one') {
                return el.options[el.selectedIndex].value;
            }
            if (el.selectedOptions) {
                return Arr(el.selectedOptions).map( o => o.value );
            }
            let _vals = [];
            for (let _op of el.options) {
                if (_op.selected) _vals.push(_op.value);
            }
            return _vals;
        },

        // 多选列表支持一个匹配值数组。
        // 会清除其它已选取项。
        set: function( el, val ) {
            el.selectedIndex = -1;

            if (el.type == 'select-one') {
                if (el.value !== undefined) {
                    return (el.value = val);
                }
                for (let _op of el.options) {
                    if (_op.value == val) return (_op.selected = true);
                }
                return;
            }
            if (typeof val == 'string') {
                val = [val];
            }
            for (let _op of el.options) {
                if (inArray(val, _op.value)) _op.selected = true;
            }
        }
    }
};



//
// boxSizing相关值。
//
const boxMargin = {
    height: css => parseFloat(css.marginTop) + parseFloat(css.marginBottom),
    width:  css => parseFloat(css.marginLeft) + parseFloat(css.marginRight)
};

const boxBorder = {
    height: css => parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth),
    width:  css => parseFloat(css.borderLeftWidth) + parseFloat(css.borderRightWidth)
};

const boxPadding = {
    height: css => parseFloat(css.paddingTop) + parseFloat(css.paddingBottom),
    width:  css => parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)
};


//
// 矩形取值：目标差距。
//
const withRect = {
    height: 	 css => boxPadding.height(css) + boxBorder.height(css),
    innerHeight: css => boxBorder.height(css),
    outerHeight: (css, margin) => margin ? -boxMargin.height(css) : 0,

    width: 	 	 css => boxPadding.width(css) + boxBorder.width(css),
    innerWidth:  css => boxBorder.width(css),
    outerWidth:  (css, margin) => margin ? -boxMargin.width(css) : 0,
};


//
// CSS取值：目标差距。
//
const withCss = {
    height: 	 () => 0,
    innerHeight: css => boxPadding.height(css),
    outerHeight: (css, margin) => boxPadding.height(css) + boxBorder.height(css) + (margin ? boxMargin.height(css) : 0),

    width: 	 	 () => 0,
    innerWidth:  css => boxPadding.width(css),
    outerWidth:  (css, margin) => boxPadding.width(css) + boxBorder.width(css) + (margin ? boxMargin.width(css) : 0),
};


//
// 注记：
// - 未使用元素的offsetHeight属性；
// - 全部使用计算后样式值，浮点数；
//
const boxSizing = {
    // 内容盒模型。
    'content-box': {
        /**
         * 通用取值。
         * name为求值目标名称（height|innerHeight...）。
         * margin参数仅用于outer/Height|Width系求值。
         *
         * @param  {Element} el 目标元素
         * @param  {String} type 取值类型（height|width）
         * @param  {String} name 求值名称
         * @param  {CSSStyleDeclaration} css 样式声明实例
         * @param  {Boolean} margin 包含Margin
         * @return {Number}
         */
        get: function( el, type, name, css, margin ) {
            let _cv = parseFloat( css[type] );
            return _cv ? _cv + withCss[name](css, margin) : rectSize(el, type) - withRect[name](css, margin);
        },


        /**
         * 设置高宽值。
         * @param {Element} el 目标元素
         * @param {String} name 设置类型名（height|width）
         */
        set: (el, name, val) => {
            el.style[name] = isNumeric(val) ? val+'px' : val;
        },
    },


    // 边框盒模型。
    'border-box': {
        /**
         * 通用取值（参数说明同上）。
         */
        get: function( el, type, name, css, margin ) {
            return ( parseFloat( css[type] ) || rectSize(el, type) ) - withRect[name](css, margin);
        },


        /**
         * 返回非0值表示需要二次设置。
         * - val非数值或像素单位时先试探性设置，返回补充高度；
         * - 仅用于height/width；
         * 注：非像素单位难以转换计算，故用此方法。
         * @param  {String} name 设置类型名（height|width）
         * @param  {String|Number} val
         * @return {Number}
         */
        set: (el, name, val, css) => {
            let _pb2 = boxPadding[name](css) + boxBorder[name](css),
                _num = pixelNumber(val);

            el.style[name] = _num ? (_num + _pb2 + 'px') : val;
            return _num ? 0 : _pb2;
        },
    }
};


/**
 * 矩形高宽值。
 * - 取矩形尺寸，已经包含了边框和内补丁；
 * - 用于CSS里高宽值为auto时（inline）的情形；
 * @param  {Element} el 目标元素
 * @param  {String} name 取值类型（height|width）
 * @return {Number}
 */
function rectSize( el, name ) {
    return el.getClientRects().length && el.getBoundingClientRect()[name];
}




//
// 事件处理。
// 也适用于非元素上事件的绑定，如Animation实例。
//////////////////////////////////////////////////////////////////////////////

const Event = {
    //
    // 绑定记录。
    // 以元素为键的弱引用存储 { Element: Map }
    // Map(
    //    key 				value
    //    ---------------------------------------------------
    //    bound-handler: 	{ event, handle, selector, once }
    //    ---------------------------------------------------
    //    实际绑定句柄:      { 事件名, 用户句柄, 选择器, 为单次 }
    // )
    // 注记：
    // 用具备唯一性的绑定调用句柄作为键索引。
    // 一个元素上的事件调用量属于小规模，故可用性尚可。
    //
    store: new WeakMap(),


    //
    // trigger可激发的原生事件名清单。
    // 说明：
    // 对于部分DOM原生事件，需要调用元素原生方法来获得DOM实现，如：
    // - select 选取表单控件内的文本。
    // - click 选中或取消选中checkbox表单控件条目。
    // - focus 表单空间聚焦。
    //
    // trigger会直接调用它们，而不会构造一个自定义的事件发送。
    //
    triggers: new Set([
        'click',
        'select',
        'focus',
        'blur',
        'scroll',
    ]),


    //
    // 捕获定义。
    // 非冒泡事件，委托时注册为捕获。
    //
    captures: {
        focus: 		true,
        blur: 		true,
        mouseenter: true,
        mouseleave: true,
    },


    //
    // 委托绑定转交。
    // 部分浏览器不支持focusin/focusout。
    //
    sendon: {
        focusin: 	'focus',
        focusout: 	'blur',
    },


    /**
     * 绑定事件调用。
     * @param {Element} el 目标元素
     * @param {String} evn 事件名
     * @param {String} slr 委托选择器，可选
     * @param {Function|Object} handle 用户处理函数/对象
     */
    on( el, evn, slr, handle ) {
        let [_evn, _cap] = this._evncap(evn, slr);

        el.addEventListener(
            _evn,
            this.buffer(el, _evn, slr, handle),
            _cap
        );
        return this;
    },


    /**
     * 解除事件绑定。
     * 解除绑定的同时会移除相应的存储记录（包括单次绑定）。
     * 即：单次绑定在调用之前可以被解除绑定。
     * @param {Element} el 目标元素
     * @param {String} evn 事件名
     * @param {String} slr 委托选择器，可选
     * @param {Function|Object} handle 处理函数/对象，可选
     */
    off( el, evn, slr, handle ) {
        let [_evn, _cap] = this._evncap(evn, slr),
            _map = this.store.get(el);

        if (_map) {
            for ( let fn of this.handles(_map, _evn, slr, handle) ) {
                el.removeEventListener(_evn, fn, _cap);
                _map.delete(fn);
            }
        }
        return this;
    },


    /**
     * 单次绑定执行。
     * - 执行一次之后自动删除绑定。
     * - 连续的多次绑定是有效的。
     * @param {Element} el 目标元素
     * @param {String} evn 事件名
     * @param {String} slr 委托选择器，可选
     * @param {Function|Object} handle 用户处理函数/对象
     */
    one( el, evn, slr, handle ) {
        let [_evn, _cap] = this._evncap(evn, slr);

        el.addEventListener(
            _evn,
            this.oneBuffer(el, _evn, slr, handle, _cap),
            _cap
        );
        return this;
    },


    /**
     * 事件绑定克隆。
     * @param  {Element} to  目标元素
     * @param  {Element} src 事件源元素
     * @return {Element} 目标元素
     */
    clone( to, src ) {
        if (to === src) {
            throw new Error('Cannot clone events on the same element');
        }
        let _fns = this.store.get(src);

        if (!_fns) {
            return to;
        }
        for ( let v of _fns.values() ) {
            let _fn = v.once ? 'one' : 'on';
            this[_fn](to, v.event, v.selector, v.handle);
        }
        return to;
    },


    /**
     * 缓存调用句柄。
     * @param  {Element} el 事件目标元素
     * @param  {String} evn 事件名
     * @param  {String} slr 委托选择器
     * @param  {Function|Object} handle 用户调用句柄/对象
     * @return {Function} 实际绑定的调用对象
     */
    buffer( el, evn, slr, handle ) {
        return this.addItem(
            this._boundMap(el, this.store),
            this._handler(handle, slr),
            evn,
            handle,
            slr,
            false
        );
    },


    /**
     * 缓存单次调用的句柄。
     * 单次调用句柄会自动移除绑定。
     * @param  {Element} el 事件目标元素
     * @param  {String} evn 事件名
     * @param  {String} slr 委托选择器
     * @param  {Function|Object} handle 用户调用句柄/对象
     * @param  {Boolean} cap 是否为捕获
     * @return {Function} 实际绑定的调用对象
     */
    oneBuffer( el, evn, slr, handle, cap ) {
        let _fun = this._handler(handle, slr),
            _map = this._boundMap(el, this.store);

        let _bound = function(...args) {
            el.removeEventListener(evn, _bound, cap);
            _map.delete(_bound);
            return _fun(...args);
        };
        return this.addItem(_map, _bound, evn, handle, slr, true);
    },


    /**
     * 添加值存储。
     * @param  {Map} buf 当前元素存储区
     * @param  {Function} bound 绑定调用对象
     * @param  {String} evn 事件名
     * @param  {Function} handle 用户调用
     * @param  {String} slr 选择器
     * @param  {Boolean} once 是否单次调用
     * @return {Function} 绑定调用对象
     */
    addItem( buf, bound, evn, handle, slr, once ) {
        buf.set(bound, {
            event: evn,
            handle: handle,
            selector: slr,
            once: once,
        });
        return bound;
    },


    /**
     * 提取匹配的绑定调用集。
     * @param  {Map} buf 存储集
     * @param  {String} evn 事件名
     * @param  {String} slr 选择器
     * @param  {Function|Object} handle 用户调用句柄/对象
     * @return {[Function]} 绑定集
     */
    handles( buf, evn, slr, handle ) {
        let _list = [],
            _fltr = this._filter(evn, slr, handle);

        // 遍历查询
        for ( let [f, v] of buf ) {
            if ( _fltr(v) ) _list.push(f);
        }
        return _list;
    },


    /**
     * 匹配委托目标。
     * - slr限于子级匹配，支持“>*”直接子元素选择器。
     * - 只返回最深的匹配元素，因此外部调用最多一次。
     * 注记：
     * 仅匹配一次可对节点树的嵌套产生约束，鼓励设计师尽量构造浅的节点树层次。
     *
     * @param  {Event} ev 原生事件对象
     * @param  {String} slr 选择器
     * @return {Element|null} 匹配元素
     */
    delegate( ev, slr ) {
        let _box = ev.currentTarget,
            _fun = null;

        if (slr[0] === '>') {
            let _els = tQuery.children(_box, slr.substring(1));
            _fun = el => _els.includes(el);
        } else {
            _fun = el => $is(el, slr);
        }
        return this._closest( _fun, ev.target, _box )
    },


    /**
     * 事件目标对象集。
     * @param  {Event} ev 事件对象（原生）
     * @param  {Element} cur 当前目标元素
     * @return {Object}
     */
    targets( ev, cur ) {
        return {
            origin:   ev.target,
            delegate: ev.currentTarget,
            current:  cur,
        };
    },


    /**
     * 是否为原生调用可触发事件的事件名。
     * @param {String} evn 事件名
     */
    nativeTrigger( evn ) {
        return this.triggers.has(evn);
    },


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 构造事件处理句柄。
     * - 返回的函数由事件实际触发调用：func(ev)
     * - 每次返回的是一个新的处理函数。
     * - 支持EventListener接口，此时this为接口实现者本身。
     * @param  {Function} handle 用户调用
     * @param  {String} slr 选择器串，可选
     * @return {Function} 处理函数
     */
    _handler( handle, slr = null ) {
        if ( !isFunc(handle) ) {
            // EventListener
            handle = handle.handleEvent.bind(handle);
        }
        return this._wrapCall.bind(this, handle, slr);
    },


    /**
     * 构造检测过滤函数。
     * - 三个检查条件可任意组合；
     * - 无参数调用返回真（是否绑定任意事件）；
     * @param  {String} evn 事件名，可选
     * @param  {String} slr 选择器，可选
     * @param  {Function|Object} handle 用户调用句柄/对象，可选
     * @return {Function} 过滤函数
     */
    _filter( evn, slr, handle ) {
        let _f1 = it => it.event == evn,
            _f2 = it => it.selector == slr,
            _f3 = it => it.handle === handle,
            _fns = [];

        if (evn) _fns.push(_f1);
        if (slr) _fns.push(_f2);
        if (handle) _fns.push(_f3);

        return it => _fns.every( fn => fn(it) );
    },


    /**
     * 获取元素绑定存储映射。
     * @param  {Element} el 关联元素
     * @param  {WeakMap} store 存储区
     * @return {Map}
     */
    _boundMap( el, store ) {
        let _map = store.get(el);

        if (!_map) {
            _map = new Map();
            store.set(el, _map);
        }
        return _map;
    },


    /**
     * 获取事件名与捕获模式。
     * - 根据是否委托返回调整后的值；
     * 注：仅在委托模式下才需要调整事件名和捕获模式；
     * @param  {String} evn 原始事件名
     * @param  {String} slr 选择器
     * @return {[String, Boolean]} [事件名，是否为捕获]
     */
    _evncap( evn, slr ) {
        if (slr) {
            evn = this.sendon[evn] || evn;
        }
        return [
            evn,
            slr ? !!this.captures[evn] : false
        ];
    },


    /**
     * 封装调用。
     * @param  {Function} handle 用户处理函数
     * @param  {String} slr 委托选择器
     * @param  {Event} ev 原生事件对象
     * @return {Boolean}
     */
    _wrapCall( handle, slr, ev ) {
        let _cur = slr === null ?
            ev.currentTarget :
            this.delegate(ev, slr);

        return _cur && handle.bind(_cur)(ev, this.targets(ev, _cur), slr);
    },


    /**
     * 向上匹配父级元素。
     * - 从自身开始匹配测试。
     * - 如果抵达容器元素，返回null。
     * - 外部应保证根容器元素包含起点元素。
     *
     * @param  {Function} match 匹配测试函数 function(Element): Boolean
     * @param  {Element} cur  起点元素
     * @param  {Element} root 限制根容器
     * @return {Element|null}
     */
    _closest( match, cur, root ) {
        while (cur !== root) {
            if (match(cur)) return cur;
            cur = cur.parentNode;
        }
        return null;
    },

};


/**
 * 事件批量绑定/解绑。
 * - 用于事件的on/off/one批量操作；
 * - evn支持“事件名序列: 处理函数”配置对象；
 *   此时slr依然有效（全局适用）。
 * @param {String} type 操作类型（on|off|one）
 * @param {Element} el  目标元素
 * @param {String|Object} evn 事件名（序列）或配置对象
 * @param {String} slr  委托选择器
 * @param {Function} handle 事件处理函数
 */
function eventBinds( type, el, evn, slr, handle ) {
    if (!el || !evn) {
        return;
    }
    if (typeof evn == 'string') {
        evnsBatch(type, el, evn, slr, handle);
        return;
    }
    for ( let [n, f] of Object.entries(evn) ) {
        evnsBatch(type, el, n, slr, f);
    }
}


/**
 * 批量绑定/解绑（事件名序列）。
 * - 多个事件名对应于一个处理函数；
 * @param {String} type 操作类型（on|off|one）
 * @param {Element} el  目标元素
 * @param {String} evn  事件名（序列）
 * @param {String} slr  委托选择器
 * @param {Function} handle 事件处理函数
 */
function evnsBatch( type, el, evn, slr, handle ) {
    if (! evn) return;

    for ( let name of evn.split(__chSpace) ) {
        Event[type](el, name, slr, handle);
    }
}



//
// 就绪载入部分。
// 相关接口：$.ready, $.holdReady
///////////////////////////////////

const domReady = {
    //
    // 基本成员/状态。
    //
    bounds: [], 	// 绑定句柄集
    waits: 	0,  	// 就绪等待
    passed: false, 	// 就绪已调用
    loaded: false,  // 文档已载入（DOMContentLoaded）


    /**
     * 文档载入就绪调用。
     * 如果就绪调用已实施，新的绑定立即执行。
     */
    ready() {
        if (this.waits) {
            return;
        }
        while (this.bounds.length) this.bounds.shift()();
        this.passed = true;
    },


    /**
     * 绑定就绪操作。
     * 如果文档已载入完毕，立即尝试就绪调用；
     * @param {Function} handle 用户就绪调用
     * @param {Function} bound 待绑定的处理函数
     */
    bind( handle, bound ) {
        this.bounds.push(
            () => this.completed(handle, bound)
        );
        document.addEventListener( "DOMContentLoaded", bound );
        window.addEventListener( "load", bound );

        return this.loaded && this.ready();
    },


    /**
     * 绑定释放并最终调用。
     * @param {Function} handle 用户就绪调用
     * @param {Function} bound  绑定句柄
     */
    completed( handle, bound ) {
        window.removeEventListener( "load", bound );
        document.removeEventListener( "DOMContentLoaded", bound );
        return handle && handle(tQuery);
    },

};


//
// 实用工具集
///////////////////////////////////////////////////////////////////////////////


tQuery.isArray = isArr;
tQuery.isNumeric = isNumeric;
tQuery.is = $is;
tQuery.type = $type;
tQuery.inArray = inArray;
tQuery.some = iterSome;
tQuery.unique = uniqueSort;


/**
 * data属性名匹配。
 * 返回“data-”之后的prop格式名（驼峰）。
 * 如：
 * - data-abc-def => abcDef
 * - -abc-def => abcDef 支持前置-（省略data）
 * @return {String}
 */
tQuery.dataName = function( str = '' ) {
    let _ns = str.match(__dataName);
    return _ns && camelCase( _ns[1] ) || '';
};


/**
 * 构造选择器。
 * - 仅支持标签&属性选择器；
 * 匹配符：{
 *  	~ 	空格分隔的单词匹配
 *  	| 	-分隔的词组前置匹配
 *  	* 	字串包含匹配
 *  	^ 	头部字串匹配
 *  	$ 	尾部字串匹配
 * }
 * @param  {String} tag  标签名
 * @param  {String} attr 属性名
 * @param  {String} val  属性值
 * @param  {String} op   属性匹配符
 * @return {String}
 */
tQuery.selector = function( tag, attr, val = '', op = '' ) {
    if (!attr) return tag;

    let _ns = attr.match(__dataName);
    if (_ns) {
        attr = 'data-' + _ns[1];
    }
    return `${tag || ''}[${attr}` + (val && `${op}="${val}"`) + ']';
};


/**
 * 多数组合并。
 * - 将后续数组或数据合并到第一个数组；
 * - 如果数据来源不是数组，直接添加为成员；
 * - 返回首个参数数组本身；
 * @param  {Array} des 目标数组
 * @param  {...Array} src 数据源集序列
 * @return {Array} des
 */
tQuery.merge = (des, ...src) => (des.push( ...[].concat(...src) ), des);


/**
 * Map转换为Object对象。
 * @param  {Map} map Map实例
 * @return {Object}
 */
tQuery.mapObj = function( map ) {
    let _o = {};
    if (map) {
        for ( let [k, v] of map ) _o[k] = v;
    }
    return _o;
};


/**
 * 通用全部为真。
 * - 参考iterSome；
 * @param  {Array|LikeArray|Object|.entries} iter 迭代目标
 * @param  {Function} comp 比较函数
 * @param  {Object} thisObj 回调内的this
 * @return {Boolean}
 */
tQuery.every = function( iter, comp, thisObj ) {
    if (thisObj) {
        comp = comp.bind(thisObj);
    }
    for ( let [k, v] of entries(iter) ) {
        if (!comp(v, k)) return false;
    }
    return true;
};


/**
 * 集合转换。
 * - 支持.entries接口的内置对象包括Map,Set系列。
 * - 回调返回undefined或null的条目被忽略。
 * - 回调可以返回一个数组，其成员被提取添加。
 * - 最终返回一个转换后的值数组。
 *
 * 注：功能与jQuery.map相同，接口略有差异。
 *
 * @param  {Array|LikeArray|Object|.entries} iter 迭代目标
 * @param  {Function} fun 转换函数
 * @param  {Object} thisObj 回调内的this
 * @return {Array}
 */
tQuery.map = function( iter, fun, thisObj ) {
    if (thisObj) {
        fun = fun.bind(thisObj);
    }
    let _tmp = [];

    for ( let [k, v] of entries(iter) ) {
        v = fun(v, k);
        // undefined == null
        // jshint eqnull:true
        if (v != null) _tmp.push(v);
    }
    // 一级扁平化
    return [].concat(..._tmp);
};


/**
 * 创建一个新的对象。
 * - 新对象基于首个参数base为原型；
 * - 新对象是后续对象的浅拷贝合并；
 * @param  {Object} base 原型对象
 * @param  {...Object} data 源数据序列
 * @return {Object}
 */
tQuery.object = function( base, ...data ) {
    return Object.assign( Object.create(base || null), ...data );
};


/**
 * 获取：对象的原型
 * 设置：设置对象的原型并返回该对象。
 * @param  {Object} obj  目标对象
 * @param  {Object} base 原型对象
 * @return {Object} obj
 */
tQuery.proto = function( obj, base ) {
    return base === undefined ?
        Object.getPrototypeOf(obj) : Object.setPrototypeOf(obj, base);
};



//
// Expose
///////////////////////////////////////////////////////////////////////////////


let _w$ = window.$;


/**
 * 收回外部引用赋值。
 * @return {$}
 */
tQuery.noConflict = function() {
    // $ 可能被代理
    if ( window.$ === $ ) window.$ = _w$;
    return $;
};


window.$ = tQuery;


})( window );