//! $Id: plugins/hlcolor 2021.01.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  代码高亮通用实现。
//  各语言继承 Hicode 基类，定义匹配器序列（Object3）。
//
//  Object3: {
//      begin: {RegExp} 起始匹配式。取[1]为文本，可为空。
//      end:   {RegExp} 结束匹配式。同上，可选。
//      type:  {String|Function} 类型名或进阶处理器。
//  }
//  Object3.type: {
//      String   语法词，如：keyword, string, operator...
//      Function 进阶处理器：function(text): Hicolor | [Object2]
//  }
//
//
///////////////////////////////////////////////////////////////////////////////
//


//
// 代码解析器。
// 实现默认的解析匹配处理。
// 如果需要，通过进阶处理器可以很容易实现定制调整。
//
export class Hicode {
    /**
     * Object3说明见页顶。
     * @param {[Object3]} reall 总匹配器集
     * @param {[Object3]} reword 词分析匹配器集，可选
     */
    constructor( reall, reword ) {
        // 避免/gy标记
        for ( const {begin, end} of reall ) {
            if (begin.global || end.global ||
                begin.sticky || end.sticky) {
                throw new Error( `[${begin}, ${end}] global or sticky flag cannot be set.` );
            }
        }
        this._all = reall;
        this._word = reword || reall;
    }


    /**
     * 源码解析。
     * Object2: {
     *      text: {String} 代码文本
     *      type: {String} 代码类型，可选。无此项时即为普通文本
     * }
     * text:
     * - 如果存在end匹配式，返回begin和end之间的文本（不含匹配文本本身）。
     * - 如果没有end匹配式，则取begin中的首个子匹配（[1]）。
     *
     * @param  {String} code 源码文本
     * @return {[Object2|Hicolor]} 解析结果对象集
     */
    parse( code ) {
        let _chs = [], _buf = [];

        while ( code ) {
            let _v2 = this._parseOne( code ),
                _len = 0;

            if ( _v2 ) {
                this._plain( _chs, _buf );
                _buf.push( _v2[0] );
                _len = _v2[1];
            }
            else {
                let _ch = this._first( code );
                _chs.push( _ch );
                _len = _ch.length;
            }
            code = code.substring( _len );
        }
        this._plain( _chs, _buf );

        return _buf.flat();
    }


    /**
     * 即时语法分析。
     * 主要用于源码编辑时的实时分析着色。
     * 注意matches中的正则表达式也不应当包含g或y标记。
     * 注记：
     * 匹配器集应当是构造函数中所传递集合的子集。
     * 也可以处理有上下文的子集，比如在注释内更细的分析，
     * 此时matches就是一个更细的子集。
     *
     * @param  {String} word 目标词
     * @return {Object2} 解析结果对象
     */
    analyze( word ) {
        for ( const {begin, end, type} of this._word ) {
            let _beg = begin.exec( word );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            return { text: end ? this._text(word.substring(_beg[0].length))[0] : _beg[1], type };
        }
        return null;
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 单轮匹配解析。
     * 迭代每一个正则配置对象，从子串头部开始且仅测试一次。
     * 返回null表示全无匹配。
     * 返回数组中第二个值为截取的文本长度。
     * @param  {String} ss 目标子串
     * @return {[Object2|[Object2]|Hicolor, Number]|null}
     */
    _parseOne( ss ) {
        for ( let {begin, end, type} of this._all ) {
            let _beg = begin.exec( ss );

            if ( !_beg || _beg.index > 0 ) {
                continue;
            }
            let [text, len] = end ? this._text(ss.substring(_beg[0].length)) : [_beg[1], 0],
                _len = len + _beg[0].length;

            return typeof type === 'function' ? [type(text), _len] : [{text, type}, _len];
        }
        return null;
    }


    /**
     * 文本截取。
     * 子串终止于匹配开始的位置。
     * 无匹配时子串为目标串本身。
     * @param  {String} str 目标串
     * @param  {RegExp} end 终止匹配式
     * @return {[String, Number]} 子串和匹配长度
     */
    _text( str, end ) {
        let _v = end.exec( str );

        if ( _v ) {
            return [ str.substring(0, _v.index), _v.index + _v[0].length ];
        }
        return [ str, str.length ];
    }


    /**
     * 添加纯文本对象。
     * 如果添加了对象，原字符缓存会被清空。
     * @param  {[String]} chs 字符缓存引用
     * @param  {[Object]} buf 结果缓存引用
     * @return {void}
     */
    _plain( chs, buf ) {
        if ( !chs.length ) {
            return;
        }
        buf.push( {text: chs.join('')} );
        chs.length = 0;
    }


    /**
     * 获取字符串的首个字符。
     * 支持码值大于0xFFFF的Unicode字符。
     * @param  {String} str 目标字符串
     * @return {String} 单个字符
     */
    _first( str ) {
        for ( const ch of str ) return ch;
        return '';
    }

}