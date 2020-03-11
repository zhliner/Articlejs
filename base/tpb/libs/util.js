//! $Id: util.js 2019.08.18 Tpb.Kits $
// ++++++++++++++++++++++++++++++++++++
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

import { Spliter, UmpString } from "./spliter.js";


const
    $ = window.$,

    __chr2Split = '/',  // 二阶选择器切分字符
    __chrRID    = '?',  // 相对ID标志字符

    // PB属性名。
    __attrPB    = 'data-pb',

    __chrOpt1   = '-',  // 选项词：减
    __chrOpt2   = '^',  // 选项词：切换

    // PB参数模式。
    // 尾部短横线，后跟空白或结束。
    __pbArgs    = /^\w[\w-]*-(?=\s|$)/,

    // PB选项模式。
    // 前端空格或起始限定，避免匹配参数段。
    // 注：选项词不能包含短横线。
    __pbOpts    = /(^|\s+)\w[\w\s]*$/,

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
    // __reQuoteESC = /([^\\]|[^\\](?:\\\\)+)\\(['`])/g,

    // 调用表达式
    // 首尾空白需要预先清除。
    // 支持参数内的任意字符和换行。
    __reCall = /^(\w+)(?:\(([^]*)\))?$/,


    // 二阶选择器切分器。
    __slrSplit = new Spliter( __chr2Split, new UmpString() ),

    // 相对ID切分器。
    __ridSplit = new Spliter( __chrRID, new UmpString() );



const Util = {
    /**
     * 二阶检索/爬树搜寻。
     *
     * 原理：
     * 向上查找与目标元素最近的共同祖先容器，然后向下检索目标元素。
     * 这可以压缩搜索范围以提高效率，同时还可以避免标识名的唯一性约束。
     *
     * 格式：UpSlr/DownSlr
     * UpSlr:
     *      {Number}    表示递升的层级。
     *      {String}    向上检索匹配的CSS选择器（不含起点元素）。
     * DownSlr:
     *      {String}    普通的CSS选择器，支持相对ID。
     *
     * 相对ID：
     *      ? 前置一个问号表示相对ID，即data-id属性的值。如：?xx => [data-id='xx']
     *
     * 例：
     * /            单独的 / 表示起点元素本身。
     * 0/           0上级，即当前起点（同上）。
     * 2/           祖父元素（2级，父元素的父元素）
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
     * .name        全局（document)类名检索，无起点元素。
     * #some        全局ID检索，同上与起点元素无关。
     * /#some       在起点元素内检索目标ID元素，受起点元素约束。
     * /#ab li      复合ID选择器，同上，在起点元素内检索（常用）。
     *
     * div/?xyz     起点元素之上首个<div>内相对ID为 xyz 的元素。
     * 3/?xyz       起点元素之上第3层父节点内相对ID为 xyz 的元素。
     * -1/#ab li    向上负值无效，起点元素不变并向内检索。
     *
     * 注记：
     * 相对ID表达一定范围内的唯一性逻辑，这只是一种松散的概念约定。
     * 单元素检索指用$.get()获取单个元素返回，多元素检索依然可能只有一个元素，但返回Collector。
     * 如果要包含二阶逻辑（从起点开始），必须包含 / 分隔符，否则为全局检索。
     *
     * @param  {String}  slr 选择器串（外部trim）
     * @param  {Element} beg 起点元素，可选
     * @param  {Boolean} one 是否单元素检索，可选
     * @return {Collector|Element|null} 目标元素（集）
     */
    find( slr, beg, one ) {
        if ( !slr || slr == '/' ) {
            return beg;
        }
        if ( __re2Split.test(slr) ) {
            [slr, beg] = fmtSplit( slr, beg );
        } else {
            beg = undefined;
        }
        return one ? query1( slr, beg ) : query2( slr, beg );
    },


    /**
     * 获取/设置PB参数序列。
     * wds未定义时为获取，否则为设置。
     * 传递wds为null会移除参数序列。
     * 取值时都会返回一个数组（可能为空）。
     * 技术：
     * 单词之间以短横线（-）分隔，含末尾的-分隔符。
     * 即用 |= 属性选择器匹配的部分。
     *
     * @param  {Element} el 目标元素
     * @param  {[String]|null} wds 参数词序列
     * @return {[String]|void}
     */
    pba( el, wds ) {
        let _v = $.attribute( el, __attrPB );

        if ( wds === undefined ) {
            return _v ? pbArgs( attrArgs(_v) ) : [];
        }
        if ( !wds ) {
            // 移除参数选项保留。
            return _v && $.attribute( el, __attrPB, _v.replace(__pbArgs, '') );
        }
        $.attribute( el, __attrPB, pbaAttr(pbArgs(wds), _v) );
    },


    /**
     * 获取/设置PB选项序列。
     * wds未定义时为获取，否则为设置。取值时返回一个词数组。
     * 选项词配置为加减逻辑：
     *      -xxx    移除xxx选项
     *      ^xxx    切换xxx选项
     *      xxx     添加xxx选项，无前置特殊字符
     * 传递wds为null会移除全部选项词。
     * 技术：
     * 选项词之间以空格分隔，可用 ~= 属性选择器匹配。
     *
     * @param  {Element} el 目标元素
     * @param  {[String]|null} wds 选项词序列
     * @return {[String]|void}
     */
    pbo( el, wds ) {
        let _v = $.attribute( el, __attrPB ),
            _o = _v ? pbOpts( attrOpts(_v) ) : [];

        if ( wds === undefined ) {
            return _o;
        }
        if ( !wds ) {
            // 移除选项保留参数。
            return _v && $.attribute( el, __attrPB, _v.replace(__pbOpts, '') );
        }
        $.attribute( el, __attrPB, pboAttr(pbOpts(wds, new Set(_o)), _v) );
    },


    /**
     * PB属性简单取值/设置。
     * @param {Element} el 目标元素
     * @param {String} val 设置值
     */
    pbv( el, val ) {
        if ( val === undefined ) {
            return $.attribute( el, __attrPB );
        }
        $.attribute( el, __attrPB, val );
    },


    /**
     * 解析参数序列。
     * 用Function构造，可支持正则表达式或箭头函数等。
     * 注记：原用JSON解析，但限制太多。
     * @param {String} fmt 参数序列串
     * @return {Array|null}
     */
    arrArgs( fmt ) {
        return fmt ? new Function( `return [${fmt}]` )() : null;
    },


    /**
     * 解析多层子对象引用。
     * 支持字符串中句点（.）的逐层引用格式。
     * 注：外部应保证字符串无多余空格。
     * @param  {Array} list 引用名序列
     * @param  {Object} data 数据源对象
     * @return {Value} 末端成员值
     */
    subObj( list, data ) {
        if ( !data || !list.length ) {
            return data;
        }
        return list.reduce( (d, k) => d[k], data );
    },


    /**
     * 提取调用句法的函数名和参数列表。
     * - 支持无参数时省略调用括号。
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
            'args': this.arrArgs( _pair[2] && _pair[2].trim() ) || ''
        };
    },


    /**
     * 激发目标事件。
     * rest：[extra, bubble, cancelable]，参见 $.trigger。
     * @param {Collector} $els 目标元素集
     * @param {String} name 事件名
     * @param {Number} delay 延迟毫秒数
     * @param {...Value|Boolean} rest 剩余参数
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
 * 二阶选择器解构。
 * 用SSpliter实现准确切分。
 * 注：
 * __reSplit不能区分属性值内的分隔符，因此可能并无切分。
 *
 * @param  {String} slr 选择器串
 * @param  {Element} beg 起点元素
 * @return {[String, Element]} 向下选择器和起点元素
 */
function fmtSplit( fmt, beg ) {
    let _s2 = [
        ...__slrSplit.split(fmt, 1)
    ];
    if ( _s2.length == 1 ) {
        return [ fmt ];
    }
    return [ _s2[1], closest(_s2[0].trimRight(), beg) ];
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
    let _ss = [ ...__ridSplit.split(fmt) ],
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
        return beg;
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
    return __pbArgs.test(attr) ? attr.split(/\s+/, 1)[0] : '';
}


/**
 * 解析/构造PB参数序列。
 * 解析返回词序列，构造返回串值。
 * @param  {String|[String]} val 参数串或词序列
 * @return {[String]|String}
 */
function pbArgs( val ) {
    if ( $.isArray(val) ) {
        return val.join('-') + '-';
    }
    // 排除末尾空串单元
    return val ? val.split('-').slice(0, -1) : [];
}


/**
 * 构造data-pb属性值。
 * - 参数串替换或前端新插入。
 * @param {String} val PB参数串
 * @param {String} attr 原属性值
 */
function pbaAttr( val, attr ) {
    if ( !attr ) {
        return val;
    }
    return __pbArgs.test(attr) ? attr.replace(__pbArgs, val) : `${val} ${attr}`;
}


/**
 * 提取选项串部分。
 * @param {String} attr 属性值
 */
function attrOpts( attr ) {
    return __pbOpts.test(attr) ? attr.match(__pbOpts)[0].trim() : '';
}


/**
 * 解析/提取PB选项序列。
 * 解析返回词序列，构造返回串值。
 * 选项词支持前置减号（-）字符表示移除。
 * 注：无前置加号（+）功能。
 * @param  {String|[String]} val 选项串或词序列
 * @param  {Set} opts 原选项集
 * @return {[String]|String}
 */
function pbOpts( val, opts ) {
    if ( !opts ) {
        return val ? val.split(/\s+/) : [];
    }
    for ( const _x of val ) {
        switch (_x[0]) {
            case __chrOpt1:
                opts.delete( _x.substring(1) );
                break;
            case __chrOpt2:
                optToggle( opts, _x.substring(1) );
                break;
            default: opts.add( _x );
        }
    }
    return ' ' + [...opts].join(' ');
}


/**
 * 选项词切换。
 * @param {Set} set 词集
 * @param {String} name 词名
 */
function optToggle( set, name ) {
    return set.has(name) ? set.delete(name) : set.add(name);
}


/**
 * 构造data-pb属性值。
 * - 选项串替换或参数段后添加。
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
