//! $Id: pbs.to.js 2019.08.19 Tpb.Core $
// ++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:To 方法集。
//
//  - Update 取值数量固定为1，调用已由obter.js/update封装。
//  - NextStage 依然可前置双下划线定义取栈条目数，基本无返回值。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { bindMethod, method, DataStore, ChainStore, storeChain } from "../config.js";
import { Get } from "./pbs.get.js";
import { Control } from "./pbs.base.js";

// 无渲染占位。
// import { Render } from "./render.x.js";
import { Render } from "./render.js";


const
    $ = window.$,

    // 事件名：ID分隔符。
    // 用于bind()事件名ID的分离提取。
    __chrEvnid = ':',

    // 空白字符。
    // 用于bind()事件名ID序列分隔。
    __reSpace = /\s+/,

    // 消息定时器存储键。
    __TIMER = Symbol('tips-timer');



//
// 目标更新方法集。
// 目标：由Query部分检索获取。
// 内容：由流程数据中的单项提供。
///////////////////////////////////////////////////////////////////////////////

const _Update = {
    /**
     * 绑定预定义调用链。
     * evn支持空格分隔多个事件名，假值表示通配（目标上的全部存储）。
     * @param {Element|Collector} to 目标元素/集
     * @param {Value|[Value]} ival 初始数据
     * @param {String} evnid 事件名ID/序列，可选
     * @param {String} slr 委托选择器，可选
     */
    bind( to, ival, evnid, slr ) {
        bindsChain( 'on', to, ival, evnid, slr );
    },


    /**
     * 绑定单次触发。
     * 其它说明同bind。
     */
    once( to, ival, evnid, slr ) {
        bindsChain( 'one', to, ival, evnid, slr );
    },


    /**
     * 发送定制事件。
     * 如果目标是一个集合，相同的值发送到所有元素（tQuery行为）。
     * 可将事件名放在内容中，从而简单地获取动态性。
     * 注记：依然可以用_标识从流程中取实参，这里仅提供事件名的便捷。
     * @data: 发送值 | [事件名, 发送值]
     * @param {Element|Collector} to 待激发元素/集
     * @param {Value|[String, Value]} data 内容数据
     * @param {String} evn 目标事件名
     * @param {Boolean} bubble 是否可冒泡，可选（默认不冒泡）
     * @param {Boolean} cancelable 是否可取消，可选（默认可取消）
     */
    trigger( to, data, evn, bubble, cancelable ) {
        if ( !evn ) {
            [evn, data] = data;
        }
        $(to).trigger( evn, data, bubble, cancelable );
    },


    /**
     * 发送定制事件。
     * 此为多元素分别对应不同的发送值版（内容为一个数组）。
     * 可将事件名作为首个成员放在内容中（同trigger）。
     * @data: 发送值序列 | [事件名, ...发送值]
     * @param {[Element]|Collector} tos 待激发元素集
     * @param {Value|[String, ...Value]} data 内容数据
     * @param {String} evn 目标事件名
     * @param {Boolean} bubble 是否可冒泡，可选（默认不冒泡）
     * @param {Boolean} cancelable 是否可取消，可选（默认可取消）
     */
    triggers( to, data, evn, bubble, cancelable ) {
        if ( !evn ) {
            evn = data.shift();
        }
        to.forEach( (e, i) => $.trigger( e, evn, data[i], bubble, cancelable ) );
    },


    /**
     * 事件处理器克隆。
     * 将内容元素上的事件处理器克隆到目标元素（集）上。
     * 事件名可为空格分隔的多个名称。
     * @param {Element|Collector} to 目标元素（集）
     * @param {Element} src 事件源元素
     * @param {String|Function} evns 事件名序列或过滤函数，可选
     */
    cloneEvent( to, src, evns ) {
        if ( to.nodeType == 1 ) {
            return $.cloneEvent( to, src, evns );
        }
        to.forEach( el => $.cloneEvent( el, src, evns ) );
    },


    /**
     * 渲染目标元素/集。
     * 如果目标是多个元素，它们采用相同的源数据渲染。
     * 目标元素可能不是模板根元素，此时为局部渲染。
     * @param {Element|Collector} to 目标元素/集
     * @param {Object|Array} data 内容：渲染源数据
     */
    render( to, data ) {
        if ( to.nodeType == 1 ) {
            return Render.update( to, data );
        }
        to.forEach( el => Render.update(el, data) );
    },


    /**
     * 集合包裹。
     * 注：tos视为一个整体作为待插入的内容。
     * @param {Element|Collector} tos 检索目标
     * @param {Element|String} box 包裹容器
     * @param {Boolean} clone 是否节点克隆（深层）
     * @param {Boolean} event 是否克隆事件处理器（容器）
     * @param {Boolean} eventdeep 是否克隆子元素事件处理器（深层）
     */
    wrapAll( tos, box, clone, event, eventdeep ) {
        $(tos).wrapAll( box, clone, event, eventdeep );
    },


    /**
     * 关联数据存储。
     * name支持空格分隔的名称序列。
     * 如果名称为多个且关联数据是一个数组，会与名称一一对应存储。
     * 如果目标是一个集合，相同的键/值会存储到所有目标元素。
     * @param {Element|Collector} to 存储元素（集）
     * @param {[Value]} data 内容数据集
     * @param {String} name 名称序列（空格分隔）
     */
    data( to, data, name ) {
        if ( !$.isArray(to) ) to = [to];

        if ( __reSpace.test(name) ) {
            return setData(
                to,
                name.split(__reSpace),
                data,
                $.isArray(data) ? dataVals : dataVal
            );
        }
        to.forEach( el => getMap(DataStore, el).set(name, data) );
    },


    /**
     * 调用链存储（单个）。
     * 如果目标是元素集合，单个调用链会存储到多个目标。
     * @param {Element|Collector} to 存储目标
     * @param {Cell} cell 链头部指令
     * @param {String} evnid 事件名标识
     */
    chain( to, cell, evnid ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => storeChain(el, evnid, cell) );
        }
        return storeChain( to, evnid, cell );
    },


    /**
     * 存储调用链集。
     * 事件名标识与调用链是作为Map的键值传递的，
     * 这里不能修改事件名标识（若需此能力请使用chain）。
     * 相同的调用链集会存储到全部目标元素上。
     * @param {Element|Collector} to 存储目标
     * @param {Map<evnid:Cell>} cells
     */
    chains( to, cells ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => chainSaves(el, cells) );
        }
        chainSaves( to, cells );
    },

};


//
// 特性/属性/样式设置。
//===============================================
[
    'attr',
    'attribute',
    'prop',
    'property',
    'css',
    'cssSets',
    'toggleAttr',
]
.forEach(function( meth ) {
    /**
     * @param {Element|Collector} tos 目标元素/集
     * @param {Value|[Value]|Function|null} val 内容
     * @param {String} name 名称/序列
     */
    _Update[meth] = function( tos, val, name ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth]( name, val );
        }
        $[meth]( tos, name, val );
    };

});


//
// 节点操作。
// 内容：Node|[Node]|Collector|Set|Iterator|Function
//===============================================
[
    'before',
    'after',
    'prepend',
    'append',
    'fill',
    'replace',

    // 内容：Element|String|[Element|String] 包裹容器（集）
    // 注：克隆实参序列仅在内容为元素时有用。
    'wrap',
    'wrapInner',
]
.forEach(function( meth ) {
    /**
     * 简单设置目标值。
     * 内容实参类型参考上面注释。
     * @param {Element|Collector} tos 目标元素/集
     * @param {Node|[Node]|Collector|Set|Iterator|Function} data 数据内容
     * @param {Boolean} clone 节点是否克隆
     * @param {Boolean} event 元素上的事件处理器是否克隆
     * @param {Boolean} eventdeep 元素子元素上的事件处理器是否克隆
     */
    _Update[meth] = function( tos, data, clone, event, eventdeep ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth]( data, clone, event, eventdeep );
        }
        $[meth]( tos, data, clone, event, eventdeep );
    };

});


//
// 内容：单一数据。
// 注：多余实参无副作用。
//-----------------------------------------------
[
    'height',       // val: Number (inc:Boolean)
    'width',        // val: Number (inc:Boolean)
    'scroll',       // val: {top:Number, left:Number}|[left, top]
    'scrollTop',    // val: Number (inc:Boolean)
    'scrollLeft',   // val: Number (inc:Boolean)
    'addClass',     // name: {String|Function}
    'removeClass',  // name: {String|Function}
    'toggleClass',  // name: {String|Function|Boolean} (force:Boolean)
    'removeAttr',   // name: {String|Function}
    'val',          // val: {Value|[Value]|Function}
    'html',         // code: {String|[String]|Node|[Node]|Function|.values} (where, sep)
    'text',         // code: {String|[String]|Node|[Node]|Function|.values} (where, sep)
    'offset',       // val: {top:Number, left:Number}
]
.forEach(function( meth ) {
    /**
     * 简单设置目标值。
     * 内容实参类型参考上面注释。
     * @param {Element|Collector} tos 目标元素/集
     * @param {Value} data 数据内容
     * @param {...Value} args 额外参数
     */
    _Update[meth] = function( tos, data, ...args ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth]( data, ...args );
        }
        $[meth]( tos, data, ...args );
    };

});



//
// 逆向设置。
// 内容：{Node|Element} 插入参考点。
// 当前检索为内容，流程数据为插入参考目标。
//===============================================
[
    ['beforeWith',   'insertBefore'],
    ['afterWith',    'insertAfter'],
    ['prependWith',  'prependTo'],
    ['appendWith',   'appendTo'],
    ['replaceWith',  'replaceAll'],
    ['fillWith',     'fillTo'],
]
.forEach(function( fns ) {
    /**
     * @param {Element|Collector} els 检索元素/集（数据）
     * @param {Node|Element} ref 插入参考点或容器
     * @param {Boolean} clone 节点是否克隆
     * @param {Boolean} event 元素上的事件处理器是否克隆
     * @param {Boolean} eventdeep 元素子元素上的事件处理器是否克隆
     */
    _Update[ fns[0] ] = function( els, ref, clone, event, eventdeep  ) {
        $(els)[ fns[1] ]( ref, clone, event, eventdeep );
    };
});


//
// 事件绑定。
// 内容：事件处理器或undefined。
//===============================================
[
    'on',
    'one',
    'off',
]
.forEach(function( meth ) {
    /**
     * @param {Element|Collector} to 目标元素（集）
     * @param {EventListener|Function|false|null|undefined} handler 事件处理器
     * @param {String} evn 事件名
     * @param {String} slr 委托选择器，可选
     */
    _Update[meth] = function( to, handler, evn, slr ) {
        if ( $.isArray(to) ) {
            $(to)[meth]( evn, slr, handler );
        }
        $[meth]( to, evn, slr, handler );
    };

    _Update[`__${meth}`] = 1;

});



//
// PB专项设置。
// 内容：[String]|String
// 注：简单调用 Util.pba/pbo/pbv。
///////////////////////////////////////////////////////////////////////////////
[
    'pba',  // ( wds:Array )
    'pbo',  // ( wds:Array )
    'pbv',  // ( val:String )
]
.forEach(function( name ) {

    _Update[name] = function( els, its ) {
        if ( $.isArray(els) ) {
            return els.forEach( el => Util[name](el, its) );
        }
        Util[name]( els, its );
    };

});



//
// 下一阶处理。
// 类似普通的 PB:Call 逻辑。
// @return {void}
///////////////////////////////////////////////////////////////////////////////

const _NextStage = {
    /**
     * To目标更新或取值入栈。
     * 内容：暂存区1项可选。
     * 更新：将暂存区1项更新为目标。
     * 提取：将目标设置为流程数据（入栈）。
     * 若内容有值则为更新，否则为提取。
     * @return {Element|Collector|void}
     */
    target( evo ) {
        if ( evo.data === undefined ) {
            return evo.targets;
        }
        evo.targets = evo.data;
    },

    __target: -1,


    /**
     * 在目标元素（集）上激发事件。
     * 内容：暂存区1项可选。
     * 内容即为发送的数据，需要明确取出（pop），否则为undefined。
     * @param {Number} delay 延迟毫秒数。
     * @param {String} name 事件名
     * @param {Boolean} bubble 是否冒泡，可选
     * @param {Boolean} cancelable 是否可取消，可选
     */
    fire( evo, delay, name, bubble, cancelable ) {
        Util.fireEvent(
            $(evo.targets),
            name, delay, evo.data, bubble, cancelable
        );
    },

    __fire: -1,


    /**
     * 条件激发。
     * 内容：暂存区/栈顶1项。
     * 仅当内容为真时才激发目标事件，否则忽略。
     * 如果需要从流程中获取发送数据，需要明确传递data为null且内容为一个数组，其中：
     * - 内容[0]    判断依据
     * - 内容[1]    待发送数据
     * 注：如果内容不是数组，则data的null为实际发送的值。
     * @param {Number} delay 延迟毫秒数。
     * @param {String} name 事件名
     * @param {Value} extra 发送数据，可选
     * @param {Boolean} bubble 是否冒泡，可选
     * @param {Boolean} cancelable 是否可取消，可选
     */
    xfire( evo, delay, name, extra, bubble, cancelable ) {
        if ( evo.data ) {
            Util.fireEvent( $(evo.targets), name, delay, extra, bubble, cancelable );
        }
    },

    __xfire: 1,


    /**
     * 设置滚动条位置。
     * Object2: {top, left}
     * 也可以传递两个数值，分别对应left和top（可用null占位）。
     * 不影响未设置方向的现有位置。
     * 注意：垂直位置在前（常用）。
     * 注记：覆盖 Get:scroll 方法。
     * @param {Number|Object2} top 垂直位置或配置对象
     * @param {Number} left 水平位置，可选
     */
    scroll( evo, top, left ) {
        let obj = {};

        if ( $.type(top) == 'Object' ) {
            obj = top;
        } else {
            if ( top != null ) obj.top = top;
            if ( left != null ) obj.left = left;
        }
        $(evo.targets).scroll( obj )
    },

    __scroll: null,


    /**
     * 表单控件默认值改变通知。
     * 目标：仅适用表单元素（集）。
     * 内容：暂存区条目可选（发送的数据）。
     * 检查表单控件值是否不再为默认值，激发目标控件上的evn事件。
     * 如果都没有改变，不会激发事件。
     * 注记：
     * - 通常在表单元素（<form>）上绑定监控处理器（changed）。
     * - 以暂存区全部条目为发送数据，以便于传递充分的信息。
     * @param {String} evn 定制事件名，可选
     */
    changes( evo, evn = 'changed' ) {
        $(evo.targets).forEach(
            frm =>
            changedTrigger( $.controls(frm), evn, evo.data )
        );
    },

    __changes: 0,


    /**
     * 表单控件清空。
     * 内容：无。
     * 选取类控件为取消选取，其它为清除value值。
     * 参考.select(), .focus()用途。
     */
    clear( evo ) {
        $(evo.targets).val( null );
    },

    __clear: null,


    /**
     * 发送提示消息。
     * 内容：暂存区1项可选。
     * 在目标元素上显示文本，持续时间由long定义，0表示永久。
     * 注意：long单位为秒，但支持浮点数。
     * @param {Number} long 持续时间（秒）
     * @param {String} msg 消息文本，可选
     */
    tips( evo, long, msg ) {
        $(evo.targets).forEach( el => message(el, msg, long) );
    },

    __tips: null,

};


//
// 原生事件触发。
//===============================================
[
    'blur',
    'click',
    'focus',
    'pause',
    'play',
    'reset',
    'select',
    'load',
    'submit',
]
.forEach(function( meth ) {

    _NextStage[meth] = function( evo ) { $(evo.targets)[meth]() };

    // _NextStage[`__${meth}`] = null;

});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取存储集。
 * 如果存储池中不存在目标键的存储集，会自动新建。
 * @param  {Map|WeakMap} pool 存储池
 * @param  {Object} key 存储键
 * @return {Map}
 */
 function getMap( pool, key ) {
    let _map = pool.get(key);

    if ( !_map ) {
        pool.set( key, _map = new Map() );
    }
    return _map;
}


/**
 * 多名称值集存储。
 * 数据值集成员与名称成员一一对应。
 * @param {Map} map 存储集
 * @param {[String]} names 名称集
 * @param {[Value]} vals 数据值集
 */
function dataVals( map, names, vals ) {
    names.forEach(
        (n, i) => vals[i] !== undefined && map.set(n, vals[i])
    );
}


/**
 * 多名称单值存储。
 * @param {Map} map 存储集
 * @param {[String]} names 名称集
 * @param {Value} val 数据值
 */
function dataVal( map, names, val ) {
    names.forEach( n => map.set(n, val) );
}


/**
 * 设置元素关联数据。
 * @param {[Element]} els 元素集
 * @param {[String]} names 名称集
 * @param {Value|[Value]} data 数据值/值集
 * @param {Function} handle 设置函数
 */
function setData( els, names, data, handle ) {
    els.forEach(
        el => handle( getMap(DataStore, el), names, data )
    );
}


/**
 * 绑定指定存储。
 * @param  {Element} el 绑定目标
 * @param  {Map} map 存储集
 * @param  {[String]} evns 事件名序列
 * @param  {String} slr 选择器，共享可选
 * @param  {Value} init 初始传入值，共享可选
 * @param  {String} type 绑定方式
 * @return {void}
 */
function bindEvns( el, map, evns, slr, init, type ) {
    if ( !evns ) {
        evns = [...map.keys()];
    }
    for ( const nid of evns ) {
        if ( map.has(nid) ) {
            $[type](
                el,
                nid.split(__chrEvnid, 1)[0],
                slr,
                map.get(nid).initVal(init)
            );
        }
    }
}


/**
 * 调用链绑定到事件。
 * 从延迟绑定存储中检索调用链并绑定到目标事件。
 * 重复绑定是有效的（可能传入不同的初始值）。
 * @param  {String} type 绑定方式（on|one）
 * @param  {Element} el 目标元素
 * @param  {Value} init 初始传入值（内容）
 * @param  {String} evnid 事件名ID/序列，可选
 * @param  {String} slr 委托选择器，可选
 * @return {void}
 */
function bindChain( type, el, init, evnid, slr ) {
    let _map = ChainStore.get(el);

    if ( !_map ) {
        window.console.warn(`no storage on Element.`);
        return;
    }
    return bindEvns( el, _map, evnid && evnid.split(__reSpace), slr, init, type );
}


/**
 * 调用链绑定到事件（集合版）。
 * 从延迟绑定存储中检索调用链并绑定到目标事件。
 * 重复绑定是有效的（可能传入不同的初始值）。
 * @param  {String} type 绑定方式（on|one）
 * @param  {Element|[Element]} els 目标元素（集）
 * @param  {...Value} args 实参序列
 * @return {void}
 */
function bindsChain( type, els, ...args ) {
    if ( $.isArray(els) ) {
        return els.forEach( el => bindChain(type, el, ...args) );
    }
    bindChain( type, els, ...args );
}


/**
 * 存储调用链。
 * @param {Element} el 存储元素
 * @param {Map} cmap 调用链存储集
 */
function chainSaves( el, cmap ) {
    for (const [n, cell] of cmap) storeChain( el, n, cell );
}


/**
 * 表单控件默认值改变检查。
 * 如果改变，触发目标控件上的evn事件（通常为changed）。
 * @param  {[Element]} els 控件集
 * @param  {String} evn 触发的事件名
 * @param  {Value} data 发送的数据，可选
 * @return {void}
 */
function changedTrigger( els, evn, data ) {
    for ( const el of els ) {
        if ( el.options ) {
            if ( selectChanged(el) ) $.trigger( el, evn, data, true );
        }
        else if ( controlChanged(el) ) $.trigger( el, evn, data, true );
    }
}


/**
 * 普通表单控件元素是否改变默认值。
 * @param  {Element} el 控件元素
 * @return {Boolean}
 */
function controlChanged( el ) {
    return el.defaultChecked !== el.checked || el.defaultValue !== el.value;
}


/**
 * 选单控件是否改变默认选取。
 * @param  {Element} sel 选单控件<select>
 * @return {Boolean}
 */
function selectChanged( sel ) {
    for ( const oe of sel.options ) {
        if ( oe.defaultSelected !== oe.selected ) return true;
    }
    return false;
}


/**
 * 在元素上显示消息。
 * 仅支持纯文本显示（非html方式）。
 * @param  {Element} el 目标元素
 * @param  {String} msg 消息文本
 * @param  {Number} long 持续时间（秒）
 * @return {void}
 */
function message( el, msg, long ) {
    if ( long > 0 ) {
        clearTimeout( el[__TIMER] );
        el[__TIMER] = setTimeout( () => $.empty(el), long * 1000 );
    }
    el.textContent = msg;
}



//
// 预处理，导出。
// 设置和下一阶用两个子集表达。
///////////////////////////////////////////////////////////////////////////////


// 名称空间。
export const To = {};


// this固化，参数配置。
To.Update = $.assign( {}, _Update, bindMethod )


// 先集成取值和控制指令。
To.NextStage = Object.assign( {}, Get, Control );

// this固化，参数配置。
// 注：_NextStage.scroll需覆盖同名取值指令。
$.assign( To.NextStage, _NextStage, bindMethod );


//
// 接口：
// 提供预处理方法。
//
To.Update[method] = name => To.Update[name];
To.NextStage[method] = name => To.NextStage[name];
