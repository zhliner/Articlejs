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
    __chrSplit  = '/',  // 二阶选择器切分字符
    __chrRID    = '?',  // 相对ID标志字符

    // PB属性名。
    __attrPB    = 'data-pb',

    // PB参数模式。
    // 末尾必须为一个短横线。
    __pbArgs    = /^[\w-]*-(?=\s|$)/,

    // PB选项模式。
    // 前端可包含空格。
    __pbOpts    = /(?:\s+|^)[\w\s]+$/,

    // 二阶选择器分隔符（/）。
    // 后跟合法选择器字符，不能区分属性选择器值内的/字符。
    // 注：仅存在性测试。
    __reSplit = /\/(?=$|[\w>:#.*?])/,

    // 相对ID匹配测试。
    // 注意：不能区分属性选择器值内的 ?.. 序列。
    //
    // CSS标识值匹配：/(?:\\.|[\w-]|[^\0-\xa0])+/
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    //
    // 增加?后空白匹配，以支持无值的相对ID：
    //  'p? >b'  => `? `    => `p[data-id]>b`
    //  'p?>b`   => `?`     => 同上
    //  'p?`     => `?`     => `p[data-id]`
    //  'p?xyz`  => `?xyz`  => `p[data-id="xyz"]`
    //  '?xyz`   => `?xyz`  => `[data-id="xyz"]`
    //
    __hasRID = /\?(?:\\.|[\w-]|[^\0-\xa0]|\s*)+/,

    // RID值匹配。
    // 已经切分（无?），值必然在首位。单次替换。
    __ridVal = /^(?:\\.|[\w-]|[^\0-\xa0])+/,

    // 单/撇引号转义清除。
    // 注：JSON中，双引号字符串内的单/撇号转义不再合法。
    // str.replace(..., "$1$2")
    // \' => '
    // \\' => \\'   未转义引号
    // \\\' => \\'  清除一个\
    __reQuoteESC = /([^\\]|[^\\](?:\\\\)+)\\(['`])/g,

    // 调用表达式
    __reCall = /^(\w+)(?:\(([^]*)\))?$/;


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
    find( slr, beg, one ) {
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
     * 获取/设置PB参数序列。
     * wds未定义时为获取，否则为设置。
     * 传递wds为null或假值时会移除参数序列。
     * 注：
     * 它们会被赋值到 data-pb 属性。
     *
     * 技术：
     * 单词之间以短横线（-）分隔，含末尾的-分隔符。
     * 即用 |= 属性选择器匹配的部分。
     * 注意：不能破坏PB中的选项部分。
     *
     * @param  {Element} el 目标元素
     * @param  {[String]} wds 参数词序列
     * @return {[String]|void}
     */
    pba( el, wds ) {
        let _v = el.getAttribute(__attrPB);

        if ( wds === undefined ) {
            return _v ? pbArgs( _v.split(' ', 1)[0] ) : null;
        }
        el.setAttribute( _v.replace(__pbArgs, pbArgs(wds, true)) );
    },


    pbo( el, wds ) {
        //
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

        if ( !_pair ) {
            window.console.error(`this ${fmt} call is invalid`);
            return '';
        }
        return {
            'name': _pair[1],
            'args': this.argsJSON( _pair[2] && _pair[2].trim() )
        };
    },


    /**
     * 解析参数序列。
     * 参数里的字符串可能用单引号包围。
     * 注记：
     * HTML模板中属性值需要用引号包围，
     * 所以值中的字符串所用引号必然相同（不会单/双混用）。
     *
     * @param {String} fmt 参数序列串
     * @return {Array|null}
     */
    argsJSON( fmt ) {
        return fmt ? JSON.parse( `[${jsonArgs(fmt)}]` ) : null;
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



//
// 辅助工具
///////////////////////////////////////////////////////////////////////////////


/**
 * 参数串JSON合法化。
 * 切分格式串内的字符串和非字符串部分。
 * 注：偶数单元为字符串。
 * @param  {String} fmt 参数格式串
 * @return {String} 合法串
 */
function jsonArgs( fmt ) {
    return [...SSpliter.partSplit(fmt)]
        .map( (s, i) => i%2 ? jsonString(s) : s )
        .join('');
}


/**
 * 清理JSON字符串表达。
 * - 强制采用双引号包围字符串。
 * - 清理双引号字符串内的单/撇引号转义。
 * 注记：
 * 双引号内单撇号合法，无需转义，否则反而出错。
 * 模板中元素属性值由引号包围，可能包含单/撇号的转义书写。
 *
 * @param  {String} fmt 格式串
 * @return {String} 合法串
 */
function jsonString( fmt ) {
    return `"${fmt.slice(1, -1)}"`.replace(__reQuoteESC, "$1$2");
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
    let _s2 = [ ...SSpliter.split(fmt, __chrSplit, 1) ];

    return _s2.length > 1 && _s2;
}


/**
 * 相对ID转为正常选择器。
 * 注：
 * 正则可能匹配属性值内的 ?... 序列，
 * 因此采用 SSpliter 以实现正常切分。
 *
 * @param  {String} fmt 选择器串
 * @return {String} 结果选择器
 */
function ridslr( fmt ) {
    if ( !__hasRID.test(fmt) ) {
        return fmt;
    }
    let _ss = [ ...SSpliter.split(fmt, __chrRID) ],
        _s0 = _ss.shift();

    return _s0 + _ss.map( ridone ).join('');
}


/**
 * 构造单个相对ID选择器。
 * str已经用?正确切分，仅首段匹配替换即可。
 * @param {String} str 相对ID切分串
 */
function ridone( str ) {
    return str.trim() ?
        str.replace(__ridVal, '[data-id="$&"]') : "[data-id]";
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


/**
 * 解析/构造PB参数序列。
 * 解析返回词序列，构造返回串值。
 * @param  {String|[String]} val 参数串或词序列
 * @param  {Boolean} mk 为构造
 * @return {[String]|String}
 */
function pbArgs( val, mk ) {
    return mk ?
        // 添加末尾短横线
        val.join('-') + '-' :
        // 排除末尾空串单元
        val.split('-').slice(0, -1);
}


/**
 * 解析提取PB选项序列。
 * @param  {String} val 选项串值
 * @return {[String]}
 */
function pbOpts( val ) {

}



export { Util };
