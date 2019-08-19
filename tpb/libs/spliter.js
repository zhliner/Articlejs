//! $Id: spliter.js 2019.08.19 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	字符串序列切分器
//
//  格式串本身是字符串，但这里视它们为某种语法表达，因此语句中的字符串有规定的格式。
//  其中包含：字符串、参数段、属性/数组段、语句块段等。
//
//  - 解析并分离出由分隔符隔开的独立单元。
//  - 可以配置忽略参数段/属性段/块段不切分。
//  - 字符串类型是一个整体，天然不切分。
//  - 语句中的字符串内的分隔符是字面的，不会被视为分隔符。
//  - 支持按区段切分，如字符串、参数段、普通段等。
//
//  注：
//  - 参数段由 () 包围，属性/数组段由 [] 包围，块段由 {} 包围。
//  - 字符串由单/双引号（'"）和模板字符串标识符撇号（'）包围。
//
///////////////////////////////////////////////////////////////////////////////
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
