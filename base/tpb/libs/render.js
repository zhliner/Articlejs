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
//  渲染语法（9+1）{
//      each                当前迭代
//      with                当前域声明
//      var                 新变量定义
//      if/else             逻辑判断（含 elseif）
//      switch/case/last    分支选择
//      for                 子元素循环
//      _[attr]             属性赋值（系列）
//  }
//  注：模板中若无循环（for/each）逻辑，则元素可以简单地原地更新。
//
//////////////////////////////////////////////////////////////////////////////
//

import { Filter } from "./filter.js";
import { Spliter, UmpString, UmpCaller } from "./spliter.js";
import { Util } from "./util.js";
import { hasRender } from "../config.js";


const
    $ = window.$,

    // 元素文法存储。
    // 包含原始模板中和页面中采用渲染处理的元素。
    // Map {
    //      [grammar]: [...]    // [文法词]: [参数序列]
    // }
    // 参数序列通常包含：
    // - handle: Function 表达式执行器
    // - ...: Value 文法特定的其它参数
    // 参数序列应该可以直接解构传入文法操作函数（从第二个实参开始）。
    //
    // { Element: Map }
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
    // 赋值属性前缀标识。
    __chrAttr   = '_',

    // 进阶处理（输出过滤）
    __chrPipe   = '|',

    // 渲染元素选择器。
    __slrRender = `[${hasRender}]`,

    // 循环内临时变量名
    __loopIndex = 'INDEX',  // 当前条目下标（从0开始）
    __loopSize  = 'SIZE',   // 循环集大小

    // 当前域数据存储键。
    // 用于循环中或With在元素上存储当前域数据。
    // 注：调用者取当前域先从元素上检索。
    __scopeData = Symbol('scope-data'),

    // Each克隆元素序位记忆。
    // 可用于从克隆元素开始更新。
    __eachIndex = Symbol('each-index'),

    // 元素初始display样式存储。
    __displayValue = Symbol('display-value'),

    // 元素隐藏标记。
    // 用于else和case/last文法。
    __hiddenFlag = Symbol('hidden-flag'),

    // switch标的值存储键。
    // 存储在case/last元素上备用。
    __switchValue = Symbol('switch-value'),

    // 过滤切分器。
    // 识别字符串语法（字符串内的|为普通字符）。
    __pipeSplit = new Spliter( __chrPipe, new UmpCaller(), new UmpString() );



//
// 渲染配置解析。
// 构造 Map{文法: 参数序列} 的存储（Grammars）。
//
const Parser = {
    //
    // 文法解析方法映射：[
    //      [ 属性名, 解析方法名 ]
    // ]
    // 同一组文法不应在单一元素上同时存在（如if/else同时定义）。
    // 下面的列表隐含了语法处理的优先级。
    //
    Method: [
        [__Each,    '$each'],
        [__With,    '$with'],
        [__Var,     '$var'],
        [__Else,    '$else'],
        [__If,      '$if'],
        [__Case,    '$case'],
        [__Last,    '$last'],
        [__Switch,  '$switch'],
        [__For,     '$for'],
        // Assign at last.
    ],


    /**
     * 解析文法配置。
     * @param  {Element} el 目标元素
     * @return {Map} 文法配置集
     */
    grammar( el ) {
        let _map = new Map();

        for ( const [an, fn] of this.Method ) {
            if ( el.hasAttribute(an) ) {
                // $for 需要第三个实参
                this[fn]( _map, el.getAttribute(an), el.childElementCount );
                el.removeAttribute(an);
            }
        }
        // last!
        return this.assign( _map, el );
    },


    /**
     * Each文法解析。
     * Each: [handle, prev-size]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $each( map, val ) {
        return map.set(
            'Each',
            [ Expr.loop(val), 1 ]
        );
    },


    /**
     * For文法解析。
     * For: [handle, size]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $for( map, val, count ) {
        return map.set(
            'For',
            [ Expr.loop(val), count ]
        );
    },


    /**
     * With文法解析。
     * With: [handle]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $with( map, val ) {
        return map.set(
            'With',
            [ Expr.value(val) ]
        );
    },


    /**
     * Var文法解析。
     * Var: [handle]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $var( map, val ) {
        return map.set(
            'Var',
            [ Expr.value(val) ]
        );
    },


    /**
     * If文法解析。
     * If: [handle]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $if( map, val ) {
        return map.set(
            'If',
            [ Expr.value(val) ]
        );
    },


    /**
     * Else文法解析。
     * 含 elseif 逻辑。
     * Else: [handle|pass]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $else( map, val ) {
        return map.set(
            'Else',
            [ val ? Expr.value(val) : Expr.pass() ]
        );
    },


    /**
     * Switch文法解析。
     * Switch: [handle]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $switch( map, val ) {
        return map.set(
            'Switch',
            [ Expr.value(val) ]
        );
    },


    /**
     * Case文法解析。
     * Case: [handle]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $case( map, val ) {
        return map.set(
            'Case',
             [ Expr.value(val) ]
        );
    },


    /**
     * case/default 文法解析。
     * Last: [handle|pass]
     * @param  {Map} map 存储集
     * @param  {String} val 属性值
     * @return {Map} map
     */
    $last( map, val ) {
        return map.set(
            'Last',
            [ val ? Expr.value(val) : Expr.pass() ]
        );
    },


    /**
     * 属性赋值文法解析。
     * 需要渲染的属性名前置一个下划线。
     * 注：这是最后一个解析的文法。
     * Assign: [[name], [handle]]
     * @param  {Map} map 存储集
     * @param  {Element} el 目标元素
     * @return {Map} map
     */
    assign( map, el ) {
        let _ats = [], _fns = [];

        for ( let at of Array.from(el.attributes) ) {
            let _n = at.name;
            if ( _n[0] == __chrAttr ) {
                _ats.push( _n.substring(1) );
                _fns.push( Expr.assign(at.value) );

                el.removeAttribute(_n);
            }
        }
        return _ats.length > 0 ? map.set('Assign', [_ats, _fns]) : map;
    },

};



//
// 渲染文法执行。
// 按文法固有的逻辑更新目标元素（集）。
// 元素上存储的当前域数据（[__scopeData]）拥有最高的优先级。
// @data {Object} 应用前的当前域数据
// @return {void}
//
const Grammar = {
    /**
     * 自迭代循环。
     * 用数据集更新原始集，可从任意成员位置开始（向后更新）。
     * - 如果原始集小于需要的集合大小，会自动扩展。
     * - 如果原始集大于需要的集合大小，会截断至新集合大小。
     * 文法：{ Each: [handle, size] }
     * 会存储当前域数据到每一个元素的 [__scopeData] 属性上。
     * @param {Element} el 起始元素
     * @param {Function} handle 表达式取值函数
     * @param {Number} size 原始集（前次）大小
     * @param {Object} data 当前域数据
     */
    Each( el, handle, size, data ) {
        let _idx = el[__eachIndex];
        data = handle( data );

        this._alignEach( eachList(el, size-_idx), data.length, _idx+1 )
        .forEach(
            // 设置当前域对象。
            (el, i) => el[__scopeData] = loopCell(data[i], i, data)
        );
        // 更新计数。
        Grammars.get(el).get('Each')[1] = data.length + _idx;
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

        // 在每一个直接子元素上设置当前域。
        this._alignFor( $.children(el), size, data.length )
        .forEach(
            (el, n) => {
                let _i = parseInt( n / size );
                el[__scopeData] = loopCell( data[_i], _i, data );
            }
        );
        // 可能的修改。
        Grammars.get(el).get('For')[1] = size;
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
        let _sub = handle( data );

        if ( !_sub ) _sub = Object(_sub);
        _sub.$ = data;

        // 友好：原型继承
        if ( $.type(_sub) == 'Object' && $.type(data) == 'Object' ) {
            $.proto( _sub, data );
        }
        el[ __scopeData ] = _sub;
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
     * 特性赋值。
     * 文法：{ Assign: [[name], [handle]] }
     * 支持两个特殊属性名：text, html。
     * 多个属性名之间空格分隔，与 handles 成员一一对应。
     * @param {[String]} names 属性名集
     * @param {[Function]} handles 处理器集
     * @param {Object} data 当前域数据
     */
    Assign( el, names, handles, data ) {
        names.forEach(
            (name, i) =>
            $.attribute( el, name || 'text', handles[i](data) )
        );
    },


    //-- 私有辅助 -----------------------------------------------------------------


    /**
     * Each元素集数量适配处理。
     * 如果目标大小超过原始集，新的元素插入到末尾。
     * @param  {[Element]} els 原始集
     * @param  {Number} count 循环迭代的目标次数
     * @param  {Number} beg 起始下标
     * @return {[Element]} 大小适合的元素集
     */
    _alignEach( els, count, beg ) {
        let _sz = count - els.length;

        if ( _sz < 0 ) {
            // 移除超出部分。
            els.splice(_sz).forEach( e => $.remove(e) );
        }
        else if ( _sz > 0 ) {
            // 补齐不足部分。
            let _ref = els[els.length-1];
            els.push(
                ...$.after( _ref, eachClone(_ref, _sz, beg) )
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

        if ( _dist < 0 ) {
            // 移除超出部分。
            els.splice(_dist * size).forEach( e => $.remove(e) );
        }
        else if ( _dist > 0 ) {
            // 补齐不足部分。
            let _new = forClone( els.slice(-size), _dist );
            els.push(
                ...$.after( els[els.length-1], _new )
            );
        }
        return els;
    },

};



//
// 表达式处理构造。
// 返回一个目标渲染类型的表达式执行函数。
// 注：表达式无return关键词。
// @param  {String} expr 表达式串
// @return {Function|null}
//
const Expr = {
    /**
     * 取值表达式。
     * 适用：tpb-with|switch|var|if/else|case,
     * @return function(data): Value
     */
    value( expr ) {
        return new Function( '$', `return ${expr};` );
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
        return new Function( '$', `return ${expr};` );
    },


    /**
     * 简单通过。
     * 适用：tpb-else, tpb-last 无值的情况。
     * @return {null}
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
        let _ss = [...__pipeSplit.split(expr)],
            _fn = new Function( '$', `return ${_ss.shift()};` );

        if ( _ss.length == 0 ) {
            return _fn;
        }
        // 包含过滤器。
        let _fxs = _ss.map( filterHandle );

        return data => _fxs.reduce( (d, fx) => fx.func(d, ...fx.args), _fn(data) );
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
 * 节点树文法克隆&存储。
 * to应当是src的克隆（相同DOM结构）。
 * @param  {Element} to 目标元素
 * @param  {Element} src 源元素
 * @return {Element} 目标元素
 */
function cloneGrammar( to, src ) {
    cloneGrammars(
        $.find( __slrRender, to, true ),
        $.find( __slrRender, src, true )
    );
    return to;
}


/**
 * 批量克隆文法配置存储。
 * 注：to和src是两个大小一致的集合。
 * @param  {[Element]} tos 新节点集
 * @param  {[Element]} srcs 源节点集
 * @return {void}
 */
function cloneGrammars( tos, srcs ) {
    srcs
    .forEach( (el, i) =>
        Grammars.set( tos[i], Grammars.get(el) )
    );
}


/**
 * 获取Each元素清单。
 * @param  {Element} el 起点元素
 * @param  {Number} size 元素数量
 * @return {[Element]}
 */
function eachList( el, size ) {
    let _buf = [ el ];

    while ( --size > 0 && el ) {
        _buf.push( el = el.nextElementSibling );
    }
    return _buf;
}


/**
 * 指定数量的元素克隆。
 * 会存储新元素的渲染文法配置。
 * 用于Each中不足部分的批量克隆。
 * @param  {Element} ref 参考元素（克隆源）
 * @param  {Number} size 克隆的数量
 * @param  {Number} beg 新下标起始值
 * @return {[Element]} 新元素集
 */
function eachClone( ref, size, beg ) {
    let _els = [];

    for (let i=0; i<size; i++) {
        let _new = $.clone(ref, true, true, true);

        _new[__eachIndex] = beg + i;
        _els.push( cloneGrammar(_new, ref) );
    }
    return _els;
}


/**
 * 元素集克隆。
 * 存在渲染配置的元素会进行文法克隆存储。
 * 注：用于For循环的子元素单次迭代。
 * @param  {[Element]} els 子元素集
 * @return {[Element]} 克隆的新元素集
 */
function cloneList( els ) {
    let _new = els.map(
        el => $.clone(el, true, true, true)
    );
    _new.forEach(
        (e, i) => cloneGrammar( e, els[i] )
    );
    return _new;
}


/**
 * 循环克隆元素集。
 * 用于For循环中子元素集的迭代。
 * @param  {[Element]} els 源元素集
 * @param  {Number} cnt 克隆次数
 * @return {[Element]} 克隆总集
 */
function forClone( els, cnt ) {
    let _buf = [];

    for (let i=0; i<cnt; i++) {
        _buf = _buf.concat( cloneList(els) );
    }
    return _buf;
}


/**
 * 构造循环单元当前域对象。
 * 简单的基本类型需要转换为Object，否则无法添加属性。
 * 设置2个即时成员变量和父域链$。
 * @param  {Object} data 单元数据
 * @param  {Number} i    当前下标（>= 0）
 * @param  {Object} supObj 父域对象
 * @return {Object} 设置后的数据对象
 */
function loopCell( data, i, supObj ) {
    // 自动 Object（除了null）
    return Object.assign(
        data,
        {
            [__loopIndex]: i,
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

        if ( _gram ) {
            if ( _gram['If'] ) return;
            if ( _gram['Else'] ) {
                el[__hiddenFlag] = sure;
            }
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

        if ( _gram ) {
            if ( _gram['Case'] || _gram['Last'] ) {
                el[__hiddenFlag] = sure;
            }
        }
        el = el.nextElementSibling;
    }
}


/**
 * 渲染目标元素（单个）。
 * 按规定的文法优先级渲染元素。
 * @param  {Element} el 目标元素
 * @param  {Object} data 数据源
 * @return {Object|Array} 渲染后的当前域数据
 */
function render( el, data ) {
    let _gram = Grammars.get(el)

    if ( _gram ) {
        for (const [fn, args] of _gram) {
            Grammar[fn]( el, ...args, el[__scopeData] || data );
        }
    }
    return el[__scopeData] || data;
}



//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 解析节点树渲染配置。
 * 通常用于源模板节点初始导入之后。
 * @param  {Element} tpl 模板节点
 * @return {Element} tpl
 */
function parse( tpl ) {
    let _gram;

    for ( const el of $.find('*', tpl, true) ) {
        _gram = Parser.grammar(el);

        if ( _gram.size > 0 ) {
            Grammars.set( el, _gram );
            el.setAttribute( hasRender, '' );
        }
    }
    return tpl;
}


/**
 * 节点树渲染文法克隆。
 * 应当在 parse 之后使用，用于克隆源模板节点时。
 */
const clone = cloneGrammar;


/**
 * 用源数据更新节点树。
 * 可用页面中既有渲染元素的原地更新。
 * @param  {Element} root 渲染根
 * @param  {Object} data  源数据对象
 * @return {Element} root
 */
function update( root, data ) {
    data = render( root, data );

    for (let i = 0; i < root.children.length; i++) {
        update( root.children[i], data );
    }
    return root;
}


export const Render = { parse, clone, update };
