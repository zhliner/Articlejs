//! $Id: pbval.js 2019.08.19 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  PB 操作类
//
//  用于方便的设置 data-pb 属性值。
//  PB值分为两部分：参数和选项。
//  - 参数为-分隔，处于前端位置；
//  - 选项空格分隔，在参数之后；
//  例：{
//    data-pb="lang-zh- bold x4"
//    // 参数为lang-zh，选项为bold和x4
//    data-pb="- fold"
//    // 参数为空，选项词为fold
//  }
//  - 参数用“|=”属性选择器定位，如：[data-pb|="lang-zh"]；
//  - 选项用“~=”属性选择器定位，如：[data-pb~="bold"]；
//
//  注：
//  - 一般地，参数用于描述“是什么”，“-”用于分级；
//  - 选项通常用于表达一种“开关”（设置或取消），动态；
//
///////////////////////////////////////////////////////////////////////////////
//


// 元素PbVal实例缓存。
const __pbvStore = new WeakMap();


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
