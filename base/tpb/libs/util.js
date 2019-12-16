//! $Id: util.js 2019.08.18 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基本工具集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Spliter } from "./spliter.js";


const
    $ = window.$,

    SSpliter = new Spliter();


const
    __chr2Split = '/',  // 二阶选择器切分字符
    __chrRID    = '?',  // 相对ID标志字符

    // PB属性名。
    __attrPB    = 'data-pb',

    // PB参数模式。
    // 尾部短横线，后跟空白或结束。
    __pbArgs    = /^\w[\w-]*-(?=\s|$)/,

    // PB选项模式。
    // 前端空格或起始限定，避免匹配参数段。
    // 注：选项词不能包含短横线。
    __pbOpts    = /(?:\s+|^)\w[\w\s]*$/,

    // 二阶选择器分隔符（/）。
    // 后跟合法选择器字符，不能区分属性选择器值内的/字符。
    // 注：仅存在性测试。
    __re2Split  = /\/(?=$|[\w>:#.*?])/,

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
    // 首尾空白需要预先清除。
    // 支持参数内的任意字符和换行。
    __reCall = /^(\w+)(?:\(([^]*)\))?$/;



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
     *      ? 前置一个问号表示相对ID，即data-id属性的值。如：?xx => [data-id='xx']
     *
     * 例：
     * /            单独的 / 表示起点元素自身。
     * 0/           0上级，当前起点（同上）。
     * 2/           祖父元素（2级，父的父）
     * form/        起点元素上层首个<form>元素。
     * div?/        起点元素上层首个包含相对ID定义的元素，div[data-id]
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
     * 取值时都会返回一个数组（可能为空）。
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
        let _v = $.attribute( el, __attrPB );

        if ( wds === undefined ) {
            return _v ? pbArgs( attrArgs(_v) ) : [];
        }
        if ( $.isArray(wds) ) {
            return $.attribute( __attrPB, pbaAttr(pbArgs(wds, true), _v) );
        }
        // 移除参数部分（保留选项）。
        if ( _v && !wds ) {
            $.attribute( __attrPB, _v.replace(__pbArgs, '').trim() );
        }
    },


    /**
     * 获取/设置PB选项序列。
     * wds未定义时为获取，否则为设置。
     * 传递wds为null或假值时会移除选项序列。
     * 取值时都会返回一个数组（可能为空）。
     *
     * 技术：
     * 选项词之间以空格分隔，可用 ~= 属性选择器匹配。
     * 注意：不破坏前端可能有的参数部分。
     *
     * @param  {Element} el 目标元素
     * @param  {[String]} wds 选项词序列
     * @return {[String]|void}
     */
    pbo( el, wds ) {
        let _v = $.attribute( el, __attrPB );

        if ( wds === undefined ) {
            return _v ? pbOpts( attrOpts(_v) ) : [];
        }
        if ( $.isArray(wds) ) {
            return $.attribute( __attrPB, pboAttr(pbOpts(wds, true), _v) );
        }
        // 移除选项部分（保留参数）。
        if ( _v && !wds ) {
            $.attribute( __attrPB, _v.replace(__pbOpts, '') );
        }
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
     * 解析多层子对象引用。
     * 支持字符串中句点（.）的逐层引用格式。
     * 注：外部应保证字符串无多余空格。
     * @param  {String|Array} list 引用名序列
     * @param  {Object} data 数据源对象
     * @return {Value} 末端成员值
     */
    subObj( list, data ) {
        if ( !data || !list.length ) {
            return data;
        }
        if ( typeof list == 'string' ) {
            list = list.split('.');
        }
        return list.reduce( (d, k) => d[k], data );
    },


    /**
     * 提取调用句法的函数名和参数列表。
     * - 支持无参数时省略调用括号。
     * - 参数序列串需符合JSON格式（容忍单引号）。
     * - 无法匹配时抛出异常。
     * Object {
     *  	name: {String} 调用名
     *  	args: {Array|''} 实参序列
     * }
     * @param  {String} fmt 调用格式串
     * @return {Object} 解析结果
     */
    funcArgs( fmt ) {
        var _pair = fmt.match(__reCall);

        if ( !_pair ) {
            throw new Error(`${fmt} is not a call().`);
        }
        return {
            'name': _pair[1],
            'args': this.argsJSON( _pair[2] && _pair[2].trim() ) || ''
        };
    },


    /**
     * 激发目标事件。
     * rest：[extra, bubble, cancelable]，参见 $.trigger。
     * @param {Collector} $els 目标元素集
     * @param {String} name 事件名
     * @param {Number} delay 延迟毫秒数
     * @param {...Value} rest 剩余参数
     */
    fireEvent( $els, name, delay, ...rest ) {
        if ( !delay ) {
            return $els.trigger( name, ...rest );
        }
        return setTimeout( () => $els.trigger(name, ...rest), delay );
    },

};



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
 * 约束：
 * 元素属性值应当使用双引号包围，
 * 属性值内的字符串表达可用单引号或撇号包围，内部可有单引号/撇号转义。
 * 例：
 * on="hello('fine, it\'s ok.')"
 *
 * 注记：
 * JSON中双引号内的单引号/撇号合法，无需转义，否则反而出错。
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
    if ( !__re2Split.test(fmt) ) {
        return false;
    }
    let _s2 = [ ...SSpliter.split(fmt, __chr2Split, 1) ];

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
 * @param {String|Number} slr 向上选择器或递进层级数
 * @param {Element} beg 起点元素
 * @return {Element|null} 目标元素
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


//
// PB辅助（pba/pbo）
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取参数串部分。
 * @param {String} attr 属性值
 */
function attrArgs( attr ) {
    return __pbArgs.test(attr) ? attr.split(/\s/, 1)[0] : '';
}


/**
 * 解析/构造PB参数序列。
 * 解析返回词序列，构造返回串值。
 * @param  {String|[String]} val 参数串或词序列
 * @param  {Boolean} mk 为构造
 * @return {[String]|String}
 */
function pbArgs( val, mk ) {
    if ( mk ) {
        // String: 添加末尾短横线
        return val.join('-') + '-';
    }
    // Array: 排除末尾空串单元
    return val ? val.split('-').slice(0, -1) : [];
}


/**
 * 构造data-pb属性值。
 * - 替换或前端新插入。
 * @param {String} args PB参数串
 * @param {String} attr 原属性值
 */
function pbaAttr( args, attr ) {
    if ( !attr ) {
        return args;
    }
    return __pbArgs.test(attr) ? attr.replace(__pbArgs, args) : `${args} ${attr}`;
}


/**
 * 提取选项串部分。
 * @param {String} attr 属性值
 */
function attrOpts( attr ) {
    return __pbOpts.test(attr) ? attr.match(__pbOpts)[0] : '';
}


/**
 * 解析/提取PB选项序列。
 * 解析返回词序列，构造返回串值。
 * @param  {String|[String]} val 选项串或词序列
 * @param  {Boolean} mk 为构造
 * @return {[String]|String}
 */
function pbOpts( val, mk ) {
    if ( mk ) {
        // String: 前置空格
        return ' ' + val.join(' ');
    }
    // Array: 无空串成员
    return val ? val.trim().split(/\s+/) : [];
}


/**
 * 构造data-pb属性值。
 * - 替换或后段新添加。
 * @param {String} opts PB选项串
 * @param {String} attr 原属性值
 */
function pboAttr( opts, attr ) {
    if ( !attr ) {
        return opts;
    }
    // opts已含前置空格。
    return __pbOpts.test(attr) ? attr.replace(__pbOpts, opts) : `${attr}${opts}`;
}



export { Util };
