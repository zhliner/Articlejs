//! $Id: render.js 2019.09.17 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  渲染器（Render）
//
//  解析模板中的渲染语法，用数据对节点树进行渲染。
//  解析之后节点中的各个渲染属性已被清除，不影响正常的DOM元素规范。
//
//  渲染语法（10+1）{
//      each                当前迭代
//      with                当前域声明
//      var                 新变量定义
//      if/else             逻辑判断（含 elseif）
//      switch/case/last    分支选择
//      for                 子元素循环
//      _[attr]             属性赋值（系列）
//  }
//  注：
//  模板中若无循环（for/each）逻辑，则元素可以简单地原地更新。
//
//////////////////////////////////////////////////////////////////////////////
//

import { Filter } from "./filter.js";
import { Spliter } from "./spliter";
import { Util } from "./util.js";


const
    $ = window.$,

    // 比较操作词（替换映射）。
    compWords = [
        [ /\bLT\b/g,    '<' ],
        [ /\bLTE\b/g,   '<=' ],
        [ /\bGT\b/g,    '>' ],
        [ /\bGTE\b/g,   '>=' ],
    ],

    // 包含比较词测试。
    hasComp = /\b(?:LT|LTE|GT|GTE)\b/i,


    // 简单切分器。
    SSpliter = new Spliter(),

    // 元素文法存储。
    // 包含原始模板中和页面中采用渲染处理的元素。
    // Object {
    //      [grammar]: [...]    // [文法词]: [参数序列]
    // }
    // 参数序列通常包含：
    // - handle: Function 表达式执行器
    // - ...: Value 文法特定的其它参数
    // 参数序列应该可以直接解构传入文法操作函数（从第二个实参开始）。
    //
    // { Element: Object }
    Grammars = new WeakMap();


//
// 基本配置/定义。
//
const
    // 渲染属性名。
    __Each      = 'tpb-each',       // 元素自身循环
    __With      = 'tpb-with',       // 创建新域
    __Var       = 'tpb-var',        // 新建变量/赋值
    __If        = 'tpb-if',         // if （当前元素，下同）
    __Else      = 'tpb-else',       // else
    __Switch    = 'tpb-switch',     // switch （子元素分支）
    __Case      = 'tpb-case',       // switch/case
    __Last      = 'tpb-last',       // switch/last（含 default）
    __For       = 'tpb-for';        // 子元素循环


const
    // 进阶处理（输出过滤）
    __chrPipe   = '|',

    // 循环内临时变量名
    __loopIndex = '_I_',   // 当前条目下标（从0开始）
    __loopCount = '_C_',   // 当前循环计数（从1开始）
    __loopSize  = '_S_',   // 循环集大小

    // 当前域数据存储键。
    // 用于循环中在元素上存储当前域数据。
    // 注：调用者取当前域先从元素上检索。
    __scopeData = Symbol('scope-data'),

    // 元素初始display样式存储。
    __displayValue = Symbol('display-value'),

    // 元素隐藏标记。
    // 用于else和case/last文法。
    __hiddenFlag = Symbol('hidden-flag'),

    // switch标的值存储键。
    // 存储在case/last元素上备用。
    __switchValue = Symbol('switch-value');



//
// 渲染配置解析。
// 构造 {文法: 参数序列} 的存储（Grammars）。
//
const Parser = {
    //
    // 文法解析方法映射：[
    //      [ 属性名, 解析方法名 ]
    // ]
    // 数组顺序包含优先级逻辑。
    // 同一组文法不应在单一元素上同时存在（如if/else同时定义）。
    //
    gramQueue: [
        [__Each,    '$each'],
        [__With,    '$with'],
        [__Var,     '$var'],
        [__If,      '$if'],
        [__Else,    '$else'],
        [__Switch,  '$switch'],
        [__Case,    '$case'],
        [__Last,    '$last'],
        [__For,     '$for'],
    ],


    /**
     * 解析文法配置。
     * @param  {Element} el 目标元素
     * @return {Object} 文法配置集
     */
    grammar( el ) {
        let _buf = {};

        for ( const [an, fn] of this.gramQueue ) {
            if ( el.hasAttribute(an) ) {
                Object.assign(
                    _buf,
                    this[fn]( el.getAttribute(an), el.childElementCount )
                );
                el.removeAttribute( an );
            }
        }
        return Object.assign( _buf, this.assign(el) );
    },


    /**
     * Each文法解析。
     * Object {
     *      Each: [handle, size]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $each( val ) {
        return { Each: [ Expr.loop(val), 1 ] };
    },


    /**
     * For文法解析。
     * Object {
     *      For: [handle, size]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $for( val, count ) {
        return { For: [ Expr.loop(val), count ] };
    },


    /**
     * With文法解析。
     * Object {
     *      With: [handle]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $with( val ) {
        return { With: [ Expr.value(val) ] };
    },


    /**
     * Var文法解析。
     * Object {
     *      Var: [handle]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $var( val ) {
        return { Var: [ Expr.value(val) ] };
    },


    /**
     * If文法解析。
     * Object {
     *      If: [handle]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $if( val ) {
        return { If: [ Expr.value(val) ] };
    },


    /**
     * Else文法解析。
     * 含 elseif 逻辑。
     * Object {
     *      Else: [handle|pass]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $else( val ) {
        return { Else: [ val ? Expr.value(val) : Expr.pass() ] };
    },


    /**
     * Switch文法解析。
     * Object {
     *      Switch: [handle]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $switch( val ) {
        return { Switch: [ Expr.value(val) ] };
    },


    /**
     * Case文法解析。
     * Object {
     *      Case: [handle]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $case( val ) {
        return { Case: [ Expr.value(val) ] };
    },


    /**
     * case/default 文法解析。
     * Object {
     *      Last: [handle|pass]
     * }
     * @param  {String} val 属性值
     * @return {Object} 文法配置
     */
    $last( val ) {
        return { Last: [ val ? Expr.value(val) : Expr.pass() ] };
    },


    /**
     * 属性赋值文法解析。
     * 需要渲染的属性名前置一个下划线，支持单个下划线（空名称）。
     * Object {
     *      Assign: [names, [handle]]
     * }
     * @param  {Element} el 目标元素
     * @return {Object} 文法配置
     */
    assign( el ) {
        let _ats = [],
            _fns = [];

        for ( let at of Array.from(el.attributes) ) {
            let _n = at.name;
            if ( _n[0] == '_' ) {
                _ats.push( _n.substring(1) );
                _fns.push( Expr.assign(at.value) );
                el.removeAttribute( _n );
            }
        }
        if ( _ats.length == 0 ) {
            return null;
        }
        return { Assign: [_ats.join(' '), _fns] };
    },

};



//
// 渲染文法。
// 按文法固有的逻辑更新目标元素（集）。
// 元素上存储的当前域数据（[__scopeData]）拥有最高的优先级。
// 注：
// 尽量采用原地更新，包括each/for结构。
//
// @data {Object} 应用前的当前域数据
// @return {void}
//
const Grammar = {
    /**
     * 自迭代循环。
     * 用数据集更新原始集，并按数据集大小删除或增长原始集。
     * 文法：{ Each: [handle, size] }
     * 增长元素集时会存储新元素的渲染配置（无Each）。
     * 会存储当前域数据到每一个元素的 [__scopeData] 属性上。
     * @param {Element} el 起始元素
     * @param {Function} handle 表达式取值函数
     * @param {Number} size 原始集大小（迭代）
     * @param {Object} data 当前域数据
     */
    Each( el, handle, size, data ) {
        data = handle( data );

        if ( !$.isArray(data) ) {
            throw new Error(`the scope data is not a Array.`);
        }
        let _els = $.nextUntil(el, (_, i) => i == size);

        this._alignEach(_els, data.length)
        .forEach(
            // 设置当前域对象。
            (el, i) => el[__scopeData] = loopCell(data[i], i, data)
        );
        // 更新计数。
        Grammars.get(el).Each[1] = data.length;
    },


    /**
     * 创建新的当前域。
     * 文法：{ With: [handle] }
     * 新的当前域数据存储在元素的 [__scopeData] 属性上。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式取值函数
     * @param {Object} data 当前域数据
     */
    With( el, handle, data ) {
        data = handle( data );

        if ( data == null ) {
            data = Object.create(null);
        }
        el[__scopeData] = Object.assign( data, {$: el[__scopeData]} );
    },


    /**
     * 子元素循环。
     * 文法：{ For: [handle, size] }
     * 迭代子元素的当前域数据存储在每个子元素上（[__scopeData]）。
     * @param {Element} el For容器元素
     * @param {Function} handle 表达式取值函数
     * @param {Number} size 单次循环子元素数量
     * @param {Object} data 当前域数据
     */
    For( el, handle, size, data ) {
        data = handle( data );

        if ( !$.isArray(data) ) {
            throw new Error(`the scope data is not a Array.`);
        }
        let _all = this._alignFor( $.children(el), size, data.length );

        // 在每一个直接子元素上设置当前域。
        _all.forEach(
            (el, n) => {
                let _i = parseInt( n / size );
                el[__scopeData] = loopCell( data[_i], _i, data )
            }
        );
        // 可能的修改。
        Grammars.get(el).For[1] = size;
    },


    /**
     * 新建变量。
     * 文法：{ Var: [handle] }
     * 表达式应该是在当前域对象上添加新的变量，简单执行即可。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式取值函数
     * @param {Object} data 当前域数据
     */
    Var( el, handle, data ) {
        handle( data );
    },


    /**
     * 测试确定显示/隐藏。
     * 文法：{ If: [handle] }
     * 仅针对元素自身，隐藏采用样式 display:none。
     * 不支持 if/else 嵌套逻辑，else 添加条件即可获得 elseif 效果。
     * 实现：
     * - 如果为真，向后查找 Else，标记隐藏，直到另一个 if 或结束。
     * - 如果为假，隐藏当前元素，后续 Else 隐藏标记为假。
     *
     * 注记：
     * 因为需要支持原地更新，所以保持DOM中的存在使得可以再测试。
     *
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式取值函数
     * @param {Object} data 当前域数据
     */
    If( el, handle, data ) {
        let _show = handle( data );

        if ( _show ) {
            showElem( el );
            hideElse( el.nextElementSibling, true );
        } else {
            hideElem( el );
            hideElse( el.nextElementSibling, false );
        }
    },


    /**
     * Else 逻辑。
     * 文法：{ Else: [handle|null] }
     * 显隐逻辑已由If文法标记。
     * 如果 handle 有值，表示 elseif 逻辑。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式函数
     * @param {Object} data 当前域数据
     */
    Else( el, handle, data ) {
        if ( el[__hiddenFlag] ) {
            return hideElem( el );
        }
        if ( handle ) {
            return this.If( el, handle, data );
        }
        showElem( el );
    },


    /**
     * 分支选择。
     * 文法：{ Switch: [handle] }
     * 子元素分支条件判断，决定显示或隐藏。
     * 实现：在当前元素上存储标的值。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式取值函数
     * @param {Object} data 当前域数据
     */
    Switch( el, handle, data ) {
        el[__switchValue] = handle( data );
    },


    /**
     * 分支测试执行。
     * 文法：{ Case: [handle] }
     * 与Switch标的值比较（===），真为显示假为隐藏。
     * - 真：向后检索其它Case/Last文法元素，标记隐藏。
     * - 假：隐藏当前元素，向后检索其它Case/Last隐藏标记设置为假。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式取值函数
     * @param {Object} data 当前域数据
     */
    Case( el, handle, data ) {
        let _v = el.parentElement[__switchValue];

        if ( el[__hiddenFlag] || _v !== handle(data) ) {
            hideElem( el );
            hideCase( el.nextElementSibling, false );
        } else {
            showElem( el );
            hideCase( el.nextElementSibling, true );
        }
    },


    /**
     * 默认分支。
     * 文法：{ Last: [handle|null] }
     * 如果已标记视隐（前段Case匹配），简单隐藏。
     * 如果文法配置非null，最后Case逻辑，不匹配时还会隐藏父级Switch。
     * 否则为Default逻辑，无条件显示。
     * @param {Element} el 当前元素
     * @param {Function} handle 表达式函数
     * @param {Object} data 当前域数据
     */
    Last( el, handle, data ) {
        if ( el[__hiddenFlag] ) {
            return hideElem( el );
        }
        if ( handle &&
            el.parentElement[__switchValue] !== handle(data) ) {
            hideElem( el );
            return hideElem( el.parentElement );
        }
        showElem( el );
    },


    /**
     * 属性（特性）赋值。
     * 文法：{ Assign: [names, [handle]] }
     * 支持两个特殊属性名：text, html。
     * 多个属性名之间空格分隔，与 handles 成员一一对应。
     * @param {String} name 属性名（序列）
     * @param {[Function]} handles 处理器（集）
     * @param {Object} data 当前域数据
     */
    Assign( el, name, handles, data ) {
        $.attr(
            el,
            name || 'text',
            handles.map( f => f(data) )
        );
    },


    //-- 私有辅助 -----------------------------------------------------------------

    /**
     * 指定数量的元素克隆。
     * 会存储新元素的渲染配置（文法）。
     * 注：用于Each中不足部分的批量克隆。
     * @param  {Element} ref 参考元素（克隆源）
     * @param  {Number} size 克隆的数量
     * @return {[Element]} 新元素集
     */
    _sizeClone( ref, size ) {
        let _els = [];

        for (let i=0; i<size; i++) {
            _els.push(
                // 克隆元素不再有Each文法。
                // 注：在克隆模板元素时需要移除。
                cloneGrammar( $.clone(ref, true, true, true), ref, 'Each' )
            );
        }
        return _els;
    },


    /**
     * 元素集克隆。
     * 存在渲染配置的元素会进行文法克隆存储。
     * 注：用于For循环的子元素单次迭代。
     * @param  {[Element]} els 子元素集
     * @return {[Element]} 克隆的新元素集
     */
     _listClone( els ) {
        let _new = els.map(
            el => $.clone(el, true, true, true)
        );
        _new.forEach(
            (e, i) => cloneGrammar( e, els[i] )
        );
        return _new;
    },


    /**
     * 循环克隆元素集。
     * @param  {[Element]} els 源元素集
     * @param  {Number} cnt 克隆次数
     * @return {[Element]} 克隆总集
     */
    _loopClone( els, cnt ) {
        let _buf = [];

        for (let i=0; i<cnt; i++) {
            _buf = _buf.concat( this._listClone(els) );
        }
        return _buf;
    },


    /**
     * Each元素集数量适配处理。
     * 如果目标大小超过原始集，新的元素插入到末尾。
     * @param  {[Element]} els 原始集
     * @param  {Number} count 循环迭代的目标次数
     * @return {[Element]} 大小适合的元素集
     */
    _alignEach( els, count ) {
        let _sz = count - els.length;

        if ( _sz == 0 ) return els;

        if ( _sz < 0 ) {
            // 移除超出部分。
            els.splice(_sz).forEach( e => $.remove(e) );
        } else {
            // 补齐不足部分。
            let _ref = els[els.length-1];
            els.push(
                ...$.after( _ref, this._sizeClone(_ref, _sz) )
            );
        }
        return els;
    },


    /**
     * For子元素数量适配处理。
     * @param  {[Element]} els For子元素集（全部）
     * @param  {Number} size 单次循环子元素数量
     * @param  {Number} count 循环迭代的目标次数
     * @return {[Element]} 数量适合的子元素集
     */
    _alignFor( els, size, count ) {
        let _loop = parseInt(els.length / size),
            _dist = count - _loop;

        if ( _dist == 0 ) return els;

        if ( _dist < 0 ) {
            // 移除超出部分。
            els.splice(_dist * size).forEach( e => $.remove(e) );
        } else {
            // 补齐不足部分。
            let _new = this._loopClone( els.slice(-size), _dist );
            els.push(
                ...$.after( els[els.length-1], _new )
            );
        }
        return els;
    },

};



//
// 表达式处理构造。
// 支持 LT/LTE, GT/GTE 四个命名操作符。
// 返回一个目标渲染类型的表达式执行函数。
// 函数返回值：{
//      true    元素显示
//      false   元素隐藏（display:none）
//      Value   使用值或新域对象
// }
// 注：表达式无return关键词。
// @param  {String} expr 表达式串
// @return {Function}
//
const Expr = {
    /**
     * 取值表达式。
     * 适用：tpb-with|switch|var|if/else|case,
     * @return function(data): Value
     */
    value( expr ) {
        return new Function( '$', `return ${validExpr(expr)};` );
    },


    /**
     * 循环表达式。
     * 空值返回传入的数据本身。
     * 适用：tpb-each, tpb-for.
     * @return function(data): Array
     */
    loop( expr ) {
        if ( !expr ) {
            return v => v;
        }
        return new Function( '$', `return ${validExpr(expr)};` );
    },


    /**
     * 简单通过。
     * 适用：tpb-else, tpb-last 无值的情况。
     */
    pass() {
        return null;
    },


    /**
     * 属性赋值。
     * 支持可能有的过滤器序列，如：...|a()|b()。
     * 适用：_[name].
     * 注：初始取值部分支持命名比较操作词。
     * @return function(data): Value
     */
    assign( expr ) {
        let _ss = SSpliter.split(expr, __chrPipe),
            _fn = new Function( '$', `return ${validExpr(_ss.shift())};` );

        if ( _ss.length == 0 ) {
            return _fn;
        }
        // 包含过滤器。
        let _fxs = _ss.map( filterHandle );

        return data => _fxs.reduce( (d, fx) => fx.func.bind(d)(...fx.args), _fn(data) );
    },

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取赋值过滤器句柄。
 * Object {
 *      func: Function
 *      args: [Value]|''
 * }
 * @param  {String} call 调用表达式
 * @return {Object} 过滤器对象
 */
function filterHandle( call ) {
    let _fn2 = Util.funcArgs( call.trim() ),
        _fun = Filter[_fn2.name];

    if ( !_fun ) {
        throw new Error(`not found ${_fn2.name} filter-method.`);
    }
    return { func: _fun, args: _fn2.args };
}


/**
 * 预处理表达式。
 * 对普通段的文本执行可能需要的比较词替换。
 * @param  {String} expr 目标表达式
 * @return {String} 合法的表达式
 */
function validExpr( expr ) {
    if ( !expr ) {
        return '';
    }
    return [...SSpliter.partSplit(expr)]
        // 字符串外。
        .map( (s, i) => i%2 ? s : validComp(s) )
        .join('');
}


/**
 * 比较词替换。
 * 如：" LT " => " < " 等。
 * @param  {String} 源串
 * @return {String} 结果串
 */
function validComp( str ) {
    if ( !hasComp.test(str) ) {
        return str;
    }
    return compWords.reduce( (s, kv) => s.replace(kv[0], kv[1]), str );
}


/**
 * 文法克隆&存储。
 * 用于克隆的新元素的文法存储。
 * 限制：to必须是src的克隆。
 * @param  {Element} to 目标元素
 * @param  {Element} src 源元素
 * @param  {String} ignore 忽略的文法（限于顶层）
 * @return {Element|null} 目标元素
 */
function cloneGrammar( to, src, ignore ) {
    let _gram = Grammars.get(src);

    if ( _gram ) {
        if ( ignore ) delete _gram[ignore];
        Grammars.set( to, _gram );
    }
    cloneGrammars( $.find(to, '*'), $.find(src, '*') );

    return to;
}


/**
 * 批量克隆文法配置存储。
 * 注：to和src是两个大小一致的集合。
 * @param  {[Element]} to 新节点集
 * @param  {[Element]} src 源节点集
 * @return {void}
 */
function cloneGrammars( to, src ) {
    src
    .forEach( (el, i) =>
        Grammars.has(el) && Grammars.set( to[i], Grammars.get(el) )
    );
}


/**
 * 构造循环单元当前域对象。
 * 简单的基本类型需要转换为Object，否则无法添加属性。
 * 设置3个即时成员变量和父域链$。
 * @param  {Object} data 单元数据
 * @param  {Number} i    当前下标（>= 0）
 * @param  {Object} supObj 父域对象
 * @return {Object} 设置后的数据对象
 */
function loopCell( data, i, supObj ) {
    if ( typeof data != 'object' ) {
        data = Object(data);
    }
    return Object.assign(
        data,
        {
            [__loopIndex]: i,
            [__loopCount]: i + 1,
            [__loopSize]: supObj.length,
            $: supObj,
        }
    );
}


/**
 * 显示元素（CSS）。
 * @param {Element} el 目标元素
 */
function showElem( el ) {
    // 初始值存储。
    if ( el[__displayValue] === undefined ) {
        el[__displayValue] = el.style.display;
    }
    let _v = el[__displayValue];
    // 容错初始隐藏。
    el.style.display = (_v != 'none' ? _v : '');
}


/**
 * 隐藏元素（CSS）。
 * @param {Element} el 目标元素
 */
function hideElem( el ) {
    // 初始值存储。
    if ( el[__displayValue] === undefined ) {
        el[__displayValue] = el.style.display;
    }
    el.style.display = 'none';
}


/**
 * 同级else元素标记隐藏。
 * 不支持 if/else 的嵌套，所以一旦碰到 if 即结束。
 * @param {Element} el 起始元素
 * @param {Boolean} sure 确认隐藏
 */
function hideElse( el, sure ) {
    while ( el ) {
        let _gram = Grammars.get(el);

        if ( !_gram ) continue;
        if ( _gram['If'] ) return;

        if ( _gram['Else'] ) {
            el[__hiddenFlag] = sure;
        }
        el = el.nextElementSibling;
    }
}


/**
 * 同级case/last元素标记隐藏。
 * @param {Element} el 起始元素
 * @param {Boolean} sure 确认隐藏
 */
function hideCase( el, sure ) {
    while ( el ) {
        let _gram = Grammars.get(el);
        if ( !_gram ) continue;

        if ( _gram['Case'] || _gram['Last'] ) {
            el[__hiddenFlag] = sure;
        }
        el = el.nextElementSibling;
    }
}




/**
 * 渲染节点树。
 * - scoper为打包入栈数据的域执行器；
 * @param  {Grammar} grammar 文法执行器
 * @param  {Element} el 目标元素
 * @param  {WeakMap} map 渲染映射存储{Element: Blinder}
 * @param  {Object} _data 当前域数据
 * @return {Element} 渲染后的节点根
 */
function renders( grammar, el, map, _data ) {
    let _gmit = map.get(el),
        _subs = el.children;

    if (_gmit) {
        _data = _gmit.apply(grammar, el, _data);
    }
    if (_data === false) {
        return $.remove(el), null;
    }
    // 使用children的动态集
    // 因Each会在平级克隆添加元素。
    for ( let i = 0; i < _subs.length; i++ ) {
        renders(grammar, _subs[i], map, _data);
    }
    return el;
}


//
// 渲染器。
// @param {Element} root 根元素
// @param {Object} data  入栈数据
//
const _Render = {
    /**
     * 渲染配置解析。
     * - 状态缓存，不会重新再次解析；
     * - 返回值中也包含对root本身的匹配；
     * - 无渲染配置时返回null；
     * @param  {Element} root 模板节点
     * @return {Boolean} 可否原地更新
     */
    parse( root ) {
        let _map = __Cache.situes;

        if (!_map.has(root)) {
            let _els = Parser.all(root);
            _map.set(
                root,
                _els ? !_els.some( e => loopIfs(Blindes.get(e)) ) : null
            );
        }
        return _map.get(root);

    },


    /**
     * 渲染配置克隆。
     * - tpl应当已经解析过（parse）；
     * - des必须是tpl的克隆版，内部结构一致；
     * - 克隆的配置内部存储，外部链式调用即可；
     * @param  {Element} tpl 源模板节点
     * @param  {Element} des 克隆的节点
     * @return {this} Render自身
     */
    clone( tpl, des ) {
        let _map = __Cache.cloned;

        if (_map.has(des) || Parser.clone(tpl, des, _map)) {
            return this;
        }
        return _map.set(des, null), this;
    },


    /**
     * 节点树渲染
     * - 通常用于模板节点的完整克隆树；
     * - 也适用于局部子树，但注意入栈数据的匹配；
     * 注：仅适用于克隆后的元素集。
     * @param  {Element} el 目标节点
     * @param  {Object|...} data 渲染数据（入栈数据）
     * @return {Element} el（渲染后）
     */
    show( el, data ) {
        let _map = __Cache.cloned,
            _gramer = new Grammar(
                new T.Kits.Scoper( data, T.Config.DATA ),
                _map
            );
        // 可能直接输出data
        return renders( _gramer, el, _map, data );
    },


    /**
     * 查询可否原地更新。
     * - 针对目标节点树整体查询检测；
     * - 无渲染配置的元素视为可原地更新；
     * 注：会缓存查询结果。
     * @param  {Element} root 目标节点树根
     * @return {Boolean}
     */
    insitu( root ) {
        let _map = __Cache.situes;

        if (!_map.has(root)) {
            _map.set(
                root,
                !$.find(root, '*', true)
                .some( el =>loopIfs( __Cache.cloned.get(el) ) )
            );
        }
        return _map.get(root);
    },

};



//
// 导出
///////////////////////////////////////////////////////////////////////////////

/**
 * 用源数据更新节点树。
 * 仅适用页面中既有渲染元素的原地更新。
 * 返回false表示未检索到渲染配置，外部可以尝试render()。
 * @param  {Element} root 渲染根（模板副本根）
 * @param  {Object} data 数据源对象
 * @return {Element|false} root
 */
function update( root, data ) {
    //
}


/**
 * 创建新的节点树（待渲染）。
 * 克隆并检索模板元素上的渲染配置，存储副本备用（原地更新）。
 * 用于初始插入时的创建。
 * 注：之后需要调用update执行渲染。
 * @param  {Element} tpl 模板根
 * @return {Element} 待渲染的模板副本
 */
function create( tpl ) {
    let _map = OriginMap.get(tpl);

    if ( !_map ) {
        // 模板初始解析并存储
    }
    //
}


export const Render = { create, update };
