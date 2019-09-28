//! $Id: pbs.by.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:By 方法集。
//
//  主要操作依赖于X扩展函数库。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { X } from "./lib.x.js";
import { Render } from "./render.js";
import { bindMethod, method } from "../config.js";

const
    $ = window.$,

    // X扩展函数库引用标识
    __chrXname  = '?',

    // 延迟绑定链存储。
    // 与元素关联，绑定也只会针对关联元素（bind/unbind/once）。
    // Element: [
    //    {name, selector, chain}
    // ]
    // 注：同一事件名/选择器可能匹配多个调用链。
    __ChainPool = new WeakMap(),

    // 调用链绑定记录。
    // 同一元素上相同的事件名/选择器不重复绑定。
    // Element: Map{
    //      chainHandle: Set{ String(evn+slr) }
    // }
    // 注：相同调用链可能应用到多个事件上。
    __BoundSets = new WeakMap();



const _By = {
    /**
     * 模板渲染。
     * 对tpl指令获取的元素用数据集进行渲染。
     * 目标：当前条目/栈顶2项。
     * 注：数据可能通过X扩展函数库从远端获取。
     * @data: [tplNode, data]
     */
    render( evo ) {
        Render.update( ...evo.data );
    },

    __render: 2,


    /**
     * 延迟的调用链绑定到事件。
     * 目标：当前条目/栈顶1项。
     * 目标为关联元素，可以是一个元素集（虽然逻辑上并不自然）。
     * 注：延迟的调用链存储与元素紧耦合。
     * @param  {String} name 事件名
     * @param  {String} slr 委托选择器
     * @return {void}
     */
    bind( evo, name, slr ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            return x.forEach( e => bindChain(e, name, slr) );
        }
        bindChain( x, name, slr );
    },

    __bind: 1,


    /**
     * 调用链目标事件解绑。
     * 目标：当前条目/栈顶1项。
     * 注：支持关联元素为一个元素集。
     * @param  {String} name 事件名
     * @param  {String} slr 委托选择器
     * @return {void}
     */
    unbind( evo, name, slr ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            return x.forEach( e => unbindChain(e, name, slr) );
        }
        unbindChain( x, name, slr );
    },

    __unbind: 1,


    /**
     * 单次绑定。
     * 目标：当前条目/栈顶1项。
     * 注：支持关联元素为一个元素集。
     * @param  {String} name 事件名
     * @param  {String} slr 委托选择器
     * @return {void}
     */
    once( evo, name, slr ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            return x.forEach( e => onceBind(e, name, slr) );
        }
        onceBind( x, name, slr );
    },

    __once: 1,


    /**
     * 真值执行。
     * 目标：当前条目/栈顶1项。
     * 比较目标是否为true（===），是则执行，否则跳过。
     *
     * 引用X扩展函数库里的方法执行。
     * 支持句点（.）连接的递进引用（如：'x.y.z'）。
     * 注：
     * X中的方法已经过bind处理，可直接引用。
     *
     * @param  {String} meth X库方法名
     * @param  {...Value} rest 实参序列
     * @return {Value|void}
     */
    xtrue( evo, meth, ...rest ) {
        if ( evo.data === true ) {
            return Util.subObj(meth, X)( ...rest );
        }
    },

    __xtrue: 1,


    /**
     * 假值执行。
     * 目标：当前条目/栈顶1项。
     * 比较目标是否为false（===），是则执行，否则跳过。
     * 参数说明同 xtrue()
     * @param  {String} meth X库方法名
     * @param  {...Value} rest 实参序列
     * @return {Value|void}
     */
    xfalse( evo, meth, ...rest ) {
        if ( evo.data === false ) {
            return Util.subObj(meth, X)( ...rest );
        }
    },

    __xfalse: 1,



    // 集合操作
    //===============================================
    // expr为函数体表达式（无效return），参数名固定：（v, i, o）。
    // expr支持首字符问号引用X函数库，之后为方法名。

    /**
     * 迭代执行。
     * 目标：当前条目/栈顶1项，需要是一个集合。
     * 执行代码返回false会中断迭代。
     * @param  {String} expr 表达式串或方法引用
     * @return {void}
     */
    each( evo, expr ) {
        $.each(
            evo.data,
            getFunc( expr, 'v', 'i', 'o' )
        );
    },

    __each: 1,


    /**
     * 映射调用。
     * 目标：当前条目/栈顶1项，需要是一个集合。
     * 返回值构建为一个新集合，返回的null/undefined会被忽略。
     * @param  {String} expr 表达式串或方法引用
     * @return {Array}
     */
    map( evo, expr ) {
        return $.map( evo.data, getFunc(expr, 'v', 'i', 'o') );
    },

    __map: 1,


    /**
     * 集合排序。
     * 目标：当前条目/栈顶1项，需要是一个集合。
     * comp为比较表达式（不含return），参数名固定：(a, b)。
     * comp支持首字符（?）引用X函数库成员。
     * 支持元素集的去重排序（无需comp）。
     * @param  {Boolean} unique 是否去除重复
     * @param  {String} comp 比较表达式，可选
     * @return {Array}
     */
    sort( evo, unique, comp ) {
        if ( typeof comp == 'string' ) {
            comp = getFunc(comp, 'a', 'b');
        }
        return $(evo.data).sort( unique, comp ).item();
    },

    __sort: 1,

};


//
// 事件绑定。
// 目标：当前条目/栈顶1项。
// 目标为待绑定事件处理器元素（集）。
//===============================================
[
    'on',
    'off',
    'one',
]
.forEach(function( meth ) {
    /**
     * expr表达式可用参数名：'ev', 'elo'。
     * expr支持?引用X函数库方法。
     * @param  {String} name 事件名（序列）
     * @param  {String|null} slr 委托选择器，可选
     * @param  {Function|false|null} 事件处理器
     * @return {void}
     */
    _By[meth] = function( evo, name, slr, expr ) {
        let x = evo.data,
            f = getFunc(expr, 'ev', 'elo');

        if ( $.isCollector(x) ) x.on( name, slr, f );
        else if ( x.nodeType == 1 ) $.on( x, name, slr, f );
    };

    _By[`__${meth}`] = 1;

});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 创建/获取处理函数。
 * 支持前置?字符引用X函数库方法。
 * @param  {String} expr 表达式
 * @param  {...String} vns 参数名序列，可选
 * @return {Function|null|false}
 */
function getFunc( expr, ...vns ) {
    if ( !expr ) {
        return expr;
    }
    if ( expr[0] == __chrXname ) {
        return Util.subObj( expr.substring(1), X );
    }
    return new Function( ...vns, `return ${expr}` );
}


//
// 延迟绑定存储。
// 调用链：一个解析构造后的执行流指令序列。
//===============================================


/**
 * 存储延迟绑定的调用链。
 * 实际上是存储初始启动执行流的函数（cell.call()封装）。
 * @param  {Element} el 关联元素
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @param  {Function} chain 启动函数
 * @return {void}
 */
function chainStore( el, evn, slr, chain ) {
    let _buf = __ChainPool.get(el);

    if ( !_buf ) {
        _buf = __ChainPool.set(el, []);
    }
    _buf.push({
        name: evn, selector: slr || null, chain: chain
    });
}


/**
 * 获取目标调用链集。
 * 注：相同的事件名/选择器可能对应多个调用链定义。
 * 如果没有匹配，返回一个空数组。
 * @param  {Element} el 关联元素
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {[Function]}
 */
function chains( el, evn, slr = null ) {
    let _buf = __ChainPool.get(el),
        _chs = [];

    if ( _buf ) {
        _buf.forEach( it =>
            it.name == evn && it.selector == slr && _chs.push(it.chain)
        );
    }
    return _chs;
}


//
// 延迟绑定标记
//===============================================


/**
 * 获取状态存储集。
 * 关联元素的调用链已绑定标记存储。
 * @param  {Element} el 关联元素
 * @param  {Function} ch 调用链启动句柄
 * @return {Set} 存储集
 */
 function chainSets( el, ch ) {
	let _map = __BoundSets.get( el ) ||
		__BoundSets.set( el, new Map() );

	return _map.get(ch) || _map.set(ch, new Set());
}


/**
 * 检查并设置绑定标记。
 * 如果已经绑定，返回false，否则设置并返回true。
 * 注：
 * 标记串可能用 事件名+选择器 表示。
 *
 * @param  {Set} sets 标志集
 * @param  {String} flag 标记串
 * @return {Boolean} 是否已绑定
 */
function setBound( sets, flag ) {
	return sets.has(flag) ? false : !!sets.add(flag);
}


/**
 * 调用链绑定到事件。
 * 从延迟绑定存储中检索调用链实例并绑定到目标事件。
 * 重复的绑定不会执行，除非已解绑（unbind）。
 * @param  {Element} el 关联元素
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function bindChain( el, evn, slr = null ) {
    let _flg = evn + slr;

    chains(el, evn, slr).forEach(
        fn => setBound( chainSets(el, fn), _flg ) && $.on(el, evn, slr, fn)
    );
}


/**
 * 调用链目标事件解绑。
 * @param  {Element} el 关联元素
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function unbindChain( el, evn, slr = null ) {
    let _flg = evn + slr;

    chains(el, evn, slr).forEach(
        fn => chainSets(el, fn).delete(_flg) && $.off(el, evn, slr, fn)
    );
}


/**
 * 单次绑定。
 * 允许重复执行，因此无需存储标记。
 * @param  {Element} el 关联元素
 * @param  {String} evn 事件名
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function onceBind( el, evn, slr = null ) {
    chains(el, evn, slr).forEach(
        fn => $.one( el, evn, slr, fn )
    );
}



//
// 预处理，导出。
///////////////////////////////////////////////////////////////////////////////

const By = $.assign( {}, _By, bindMethod );


// X引入。
// 模板中使用小写形式。
By.x = X;


//
// 接口：
// 提供已预处理的方法。
// 方法名支持句点（.）分隔的多级调用。
//
By[method] = function( name ) {
    name = name.split('.');
    return name.length > 1 ? Util.subObj( name, By ) : By[ name[0] ];
};


export { By, chainStore };
