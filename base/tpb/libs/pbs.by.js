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
    __chrXname  = '?';



const _By = {
    /**
     * 模板渲染。
     * 对tpl指令获取的元素用数据集进行渲染。
     * 数据源可能从远端获取（通过X扩展库）。
     * 目标：当前条目/栈顶2项。
     * @data: [element, data]
     */
    render( evo ) {
        Render.update( ...evo.data );
    },

    __render: 2,


    /**
     * 激发事件。
     * @data: {Element|[Element]|Collector}
     * @param  {String} evn 事件名
     * @param  {Value} data 发送值
     * @param  {Boolean} bubble 是否冒泡
     * @param  {Boolean} cancelable 是否可取消
     * @return {void}
     */
    trigger( evo, evn, data, bubble = true, cancelable = true ) {
        let x = evo.data;

        if ( $.isArray(x) ) {
            $(x).trigger( evn, data, bubble, cancelable );
        }
        else if ( x.nodeType ) $.trigger( x, evn, data, bubble, cancelable )
    },

    __trigger: 1,


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
     * @param  {String|Function} expr 表达式串或方法引用或函数
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
     * @param  {String|Function} expr 表达式串或方法引用或函数
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
     * @param  {String|Function} comp 比较表达式串或方法引用或函数
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
// 目标为待绑定事件处理器元素/集。
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
     * @param  {String|Function|false|null} expr 事件处理器
     * @return {void}
     */
    _By[meth] = function( evo, name, slr, expr ) {
        let x = evo.data,
            f = getFunc(expr, 'ev', 'elo');

        if ( $.isArray(x) ) $(x)[meth]( name, slr, f );
        else if ( x.nodeType == 1 ) $[meth]( x, name, slr, f );
    };

    _By[`__${meth}`] = 1;

});


//
// 节点构造。
// 目标：当前条目/栈顶1项。
// 注：与To部分的同名方法不同，这里接收字符串实参。
//===============================================
[
    'wrap',
    'wrapInner',
    'wrapAll',
]
.forEach(function( meth ) {
    /**
     * @param  {String} box 封装元素的HTML结构串
     * @return {Element|Collector}
     */
    _By[meth] = function( evo, box ) {
        let x = evo.data;

        if ( $.isArray(x) ) $(x)[meth]( box );
        else if ( x.nodeType == 1 ) $[meth]( x, box );
    };

    _By[`__${meth}`] = 1;

});


//
// 自我修改。
// 目标：当前条目/栈顶1项。
// 注：目标元素自身操作，无需 By/To 逻辑。
//===============================================
[
    'remove',           // ( slr? ): void
    'removeSiblings',   // ( slr? ): void
    'unwrap',           // (): void
    'empty',            // (): void
    'normalize',        // (): void
]
.forEach(function( meth ) {
    /**
     * 部分方法需要slr实参。
     * 多余实参无副作用。
     * 注：外部可能需要预先封装为Collector实例。
     * @return {void}
     */
    _By[meth] = function( evo, slr ) {
        if ( $.isCollector(evo.data) ) evo.data[meth]( slr );
        if ( evo.data.nodeType ) $[meth]( evo.data, slr );
    };

    _By[`__${meth}`] = 1;

});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 创建/获取处理函数。
 * 支持前置?字符引用X函数库方法。
 * @param  {String|Function} expr 表达式串或方法引用或函数
 * @param  {...String} vns 参数名序列，可选
 * @return {Function|null|false}
 */
function getFunc( expr, ...vns ) {
    if ( !expr || typeof expr == 'function' ) {
        return expr;
    }
    if ( expr[0] == __chrXname ) {
        return Util.subObj( expr.substring(1), X );
    }
    return new Function( ...vns, `return ${expr}` );
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


export { By };
