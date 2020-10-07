//! $Id: pbs.to.js 2019.08.19 Tpb.Base $
// +++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  OBT:To 方法集。
//
//  - Update 由 core.js/update 封装，取值数量默认固定为 1。
//  - NextStage 依然可前置双下划线定义取栈条目数，大多数无返回值。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./tools/util.js";
import { bindMethod, DataStore, ChainStore, storeChain } from "./config.js";
import { Get } from "./pbs.get.js";
import { debug } from "./pbs.base.js";

// 无渲染占位。
// import { Render } from "./tools/render.x.js";
import { Render } from "./tools/render.js";


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
// 非undefined返回值会更新To目标（evo.updated）。
// 模板实参从第三个参数算起，依然支持 _n 系列从数据栈取实参。
///////////////////////////////////////////////////////////////////////////////

const _Update = {
    /**
     * 绑定预定义调用链。
     * 从目标元素自身提取预存储的调用链。
     * evn支持空格分隔多个事件名，假值表示通配（目标上的全部存储）。
     * 如果目标是一个集合，相同的事件名/选择器/初始数据被应用。
     * 提示：
     * 如果需要绑定其它元素的调用链，可预先提取后使用on/one接口。
     * @param {Element|Collector} to 目标元素/集
     * @param {Value|[Value]} ival 链头初始赋值
     * @param {String} evnid 事件名ID/序列，可选
     * @param {String} slr 委托选择器，可选
     */
    bind( to, ival, evnid, slr ) {
        bindsChain( 'on', to, ival, evnid, slr );
    },


    /**
     * 绑定单次触发（当前元素）。
     * 其它说明同bind。
     */
    once( to, ival, evnid, slr ) {
        bindsChain( 'one', to, ival, evnid, slr );
    },


    /**
     * 发送定制事件。
     * 如果目标是一个集合，相同的值发送到所有元素（tQuery），
     * 空集静默忽略。
     * 可将事件名放在内容中（[0]），从而简单地获取动态性。
     *
     * 目标：{Element|[Element]|String}
     * 如果是字符串会被视为选择器，向匹配的元素发送消息。
     *
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
    triggers( tos, data, evn, bubble, cancelable ) {
        if ( !evn ) {
            evn = data.shift();
        }
        tos.forEach( (el, i) => $.trigger(el, evn, data[i], bubble, cancelable) );
    },


    /**
     * 事件处理器克隆。
     * 将内容元素上的事件处理器克隆到目标元素（集）上。
     * 事件名可为空格分隔的多个名称。
     * @param  {Element|Collector} to 目标元素（集）
     * @param  {Element} src 事件源元素
     * @param  {String|Function} evns 事件名序列或过滤函数，可选
     * @return {void}
     */
    cloneEvent( to, src, evns ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => $.cloneEvent( el, src, evns ) );
        }
        $.cloneEvent( to, src, evns );
    },


    /**
     * 渲染目标元素/集。
     * 如果目标是多个元素，它们采用相同的源数据渲染。
     * 目标元素可能不是模板根元素，此时为局部渲染。
     * @param  {Element|Collector} to 目标元素/集
     * @param  {Object|Array} data 内容：渲染源数据
     * @return {void}
     */
    render( to, data ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => Render.update(el, data) );
        }
        Render.update( to, data );
    },


    /**
     * 集合包裹。
     * 注：tos视为一个整体作为待插入的内容。
     * @param  {Element|Collector} tos 检索目标
     * @param  {Element|String} box 包裹容器
     * @param  {Boolean} clone 包裹容器是否克隆（深层）
     * @param  {Boolean} event 是否克隆事件处理器
     * @param  {Boolean} eventdeep 是否克隆子元素事件处理器
     * @return {Collector} 包裹容器的Collector封装
     */
    wrapAll( tos, box, clone, event, eventdeep ) {
        return $(tos).wrapAll( box, clone, event, eventdeep );
    },


    /**
     * 设置滚动条位置。
     * 内容为位置（数组）或对象。
     * - Object2: {left, top}
     * - Array2:  [left, top]
     * - Number:  top 单个数值时指垂直滚动条位置。
     * 注记：不影响未设置方向的现有位置。
     */
    scroll( to, pos ) {
        if ( !$.isArray(to) ) {
            to = [to];
        }
        to.forEach( el => $.scroll(el, scrollObj(pos)) );
    },


    /**
     * 发送提示消息。
     * 内容为发送的消息，显示为元素内的文本（fill）。
     * 持续时间由long定义，0表示永久。
     * long单位为秒，支持浮点数。
     * @param {Number} long 持续时间（秒）
     * @param {String} msg 消息文本，可选
     */
    tips( to, msg, long ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => message(el, msg, long) );
        }
        message( to, msg, long );
    },


    /**
     * 类名独占设置。
     * 清除源元素集内name类名之后设置目标元素类名。
     * 可用于选单中的排他性选取表达。
     * 注：支持目标是一个集合。
     * @param  {Element|[Element]} to 目标元素/集
     * @param  {[Element]} els 源元素集
     * @param  {String} name 类名称
     * @return {void}
     */
    only( to, els, name ) {
        if ( !$.isArray(to) ) {
            to = [to];
        }
        els.forEach(
            // 移除略过目标。
            el => to.includes(el) || $.removeClass(el, name)
        );
        to.forEach( el => $.addClass(el, name) );
    },


    /**
     * 关联数据存储。
     * name支持空格分隔的名称序列。
     * 如果名称为多个且关联数据是一个数组，会与名称一一对应存储。
     * 如果目标是一个集合，相同的键/值会存储到所有目标元素。
     * @param  {Element|Collector} to 存储元素（集）
     * @param  {[Value]} data 内容数据集
     * @param  {String} name 名称序列（空格分隔）
     * @return {void}
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
     * @param  {Element|Collector} to 存储目标
     * @param  {Cell} cell 链头部指令
     * @param  {String} evnid 事件名标识
     * @return {void}
     */
    chain( to, cell, evnid ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => storeChain(el, evnid, cell) );
        }
        storeChain( to, evnid, cell );
    },


    /**
     * 存储调用链集。
     * 事件名标识与调用链是作为Map的键值传递的，
     * 这里不能修改事件名标识（若需此能力请使用chain）。
     * 相同的调用链集会存储到全部目标元素上。
     * @param  {Element|Collector} to 存储目标
     * @param  {Map<evnid:Cell>} cells
     * @return {void}
     */
    chains( to, cells ) {
        if ( $.isArray(to) ) {
            return to.forEach( el => chainSaves(el, cells) );
        }
        chainSaves( to, cells );
    },

};



//
// 节点操作。
// 内容：Node|[Node]|Collector|Set|Iterator|Function
//=========================================================
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
     * 如果目标是一个数组，返回新插入节点集的Collector封装。
     * 注：结果集合已经扁平化。
     * @param  {Element|Collector} tos 目标元素/集
     * @param  {Node|[Node]|Collector|Set|Iterator|Function} data 数据内容
     * @param  {Boolean} clone 节点是否克隆
     * @param  {Boolean} event 元素上的事件处理器是否克隆
     * @param  {Boolean} eventdeep 元素子元素上的事件处理器是否克隆
     * @return {Collector|Node|[Node]} 新插入的节点/集
     */
    _Update[meth] = function( tos, data, clone, event, eventdeep ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth](data, clone, event, eventdeep).flat();
        }
        return $[meth]( tos, data, clone, event, eventdeep );
    };

});


//
// 节点操作。
// 内容：{String|[String]|Node|[Node]|Function|.values}
//---------------------------------------------------------
[
    'html',
    'text',
]
.forEach(function( meth ) {
    /**
     * 如果目标是一个数组，返回新插入节点集的Collector封装。
     * 同上，结果集已经扁平化。
     * 注：如果不希望更新目标，可用特性（@text|@html）更新方法。
     * @param  {Element|Collector} tos 目标元素/集
     * @param  {Value} data 数据内容
     * @param  {...Value} args 额外参数
     * @return {Collector|Node|[Node]} 新插入的节点/集
     */
    _Update[meth] = function( tos, data, where, sep ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth](data, where, sep).flat();
        }
        return $[meth](tos, data, where, sep);
    };

});


//
// 逆向设置。
// 内容：{Node|Element} 插入参考点。
// 当前检索为内容，流程数据为插入参考目标。
//---------------------------------------------------------
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
     * 如果为克隆，返回新插入的克隆节点集，
     * 否则返回参考节点的Collector封装。
     * @param  {Element|Collector} els 检索元素/集（数据）
     * @param  {Node|Element} ref 插入参考点或容器
     * @param  {Boolean} clone 节点是否克隆
     * @param  {Boolean} event 元素上的事件处理器是否克隆
     * @param  {Boolean} eventdeep 元素子元素上的事件处理器是否克隆
     * @return {Collector} 新克隆的节点集或插入参考节点
     */
    _Update[ fns[0] ] = function( els, ref, clone, event, eventdeep  ) {
        ref = $(els)[fns[1]]( ref, clone, event, eventdeep );
        return clone ? ref.end(1) : ref;
    };

});



//
// 特性/属性/样式设置。
//=========================================================
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
     * 目标为数组时返回目标的Collector封装。
     * 目标为元素时保持不变。
     * @param  {Element|Collector} tos 目标元素/集
     * @param  {Value|[Value]|Function|null} val 内容
     * @param  {String} name 名称/序列
     * @return {Collector|void}
     */
    _Update[meth] = function( tos, val, name ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth]( name, val );
        }
        $[meth]( tos, name, val );
    };

});


//
// 其它特性操作。
// 内容：单一数据。
// 多余实参无副作用。
//---------------------------------------------------------
[
    'height',       // val: Number, (inc:Boolean)
    'width',        // val: Number, (inc:Boolean)
    'scrollTop',    // val: Number, (inc:Boolean)
    'scrollLeft',   // val: Number, (inc:Boolean)
    'addClass',     // name: {String|Function}
    'removeClass',  // name: {String|Function}
    'toggleClass',  // name: {String|Function|Boolean}, (force:Boolean)
    'removeAttr',   // name: {String|Function}
    'val',          // val: {Value|[Value]|Function}
    'offset',       // val: {top:Number, left:Number}
]
.forEach(function( meth ) {
    /**
     * 目标为数组时返回目标的Collector封装。
     * 目标为元素时保持不变。
     * @param  {Element|Collector} tos 目标元素/集
     * @param  {Value} data 数据内容
     * @param  {...Value} args 额外参数
     * @return {Collector|void}
     */
    _Update[meth] = function( tos, data, ...args ) {
        if ( $.isArray(tos) ) {
            return $(tos)[meth]( data, ...args );
        }
        $[meth]( tos, data, ...args );
    };

});



//
// 事件绑定。
// 内容：事件处理器或 undefined（off）。
//=========================================================
[
    'on',
    'one',
    'off',
]
.forEach(function( meth ) {
    /**
     * 目标为数组时返回目标的Collector封装。
     * 目标为元素时保持不变。
     * 注意：传递ival时处理器必须为调用链头（Cell）。
     * @param  {Element|Collector} to 目标元素（集）
     * @param  {EventListener|Function|false|null|undefined} handler 事件处理器
     * @param  {String} evn 事件名
     * @param  {String} slr 委托选择器，可选
     * @param  {Value} ival 调用链初始赋值，可选
     * @return {Collector|void}
     */
    _Update[meth] = function( to, handler, evn, slr, ival ) {
        if ( ival !== undefined ) {
            handler.initVal( ival );
        }
        if ( $.isArray(to) ) {
            return $(to)[meth]( evn, slr, handler );
        }
        $[meth]( to, evn, slr, handler );
    };

});



//
// PB专项设置。
// 内容：[String]
// 目标为多个元素时，仅支持设置为相同的值。
// 注：简单调用 Util.pba/pbo。
///////////////////////////////////////////////////////////////////////////////
[
    'pbo',
    'pba',
]
.forEach(function( name ) {
    /**
     * @return {void}
     */
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
     * 交换To目标两个成员。
     * 可用于后续方法持续使用原始检索目标。
     */
    swap( evo ) {
        [evo.updated, evo.primary] = [evo.primary, evo.updated];
    },

    __swap: null,


    /**
     * To目标更新或取值入栈。
     * 内容：暂存区1项可选。
     * 如果暂存区有值，则赋值为更新目标（updated）。
     * 取两个目标之一入栈：
     * - 0  原始To目标（evo.primary）
     * - 1  更新To目标（evo.updated）
     * @param  {Number} n 目标标识
     * @return {Element|Collector|void}
     */
    target( evo, n ) {
        if ( n === 0 ) {
            return evo.primary;
        }
        if ( n === 1 ) {
            return evo.updated;
        }
        if ( evo.data !== undefined ) evo.updated = evo.data;
    },

    __target: -1,


    /**
     * 延迟激发事件。
     * 内容：暂存区1项可选。
     * 如果内容有值，则为激发事件附带的数据。
     * rid可传递一个null或空串，表示目标沿用To更新目标。
     * 默认延迟，可设置具体的时间或0值（不延迟）。
     * @param {String} rid 目标元素选择器（单个）
     * @param {String} name 事件名
     * @param {Number} delay 延迟时间（毫秒），可选
     * @param {Boolean} bubble 是否冒泡，可选。默认冒泡
     * @param {Boolean} cancelable 是否可取消，可选。默认可取消
     */
    fire( evo, rid, name, delay = 1, bubble = true, cancelable = true ) {
        let _to = evo.updated;

        if ( rid ) {
            _to = Util.find( rid, evo.delegate, true );
        }
        Util.fireEvent( $(_to), name, delay, evo.data, bubble, cancelable );
    },

    __fire: -1,


    /**
     * 执行跳转。
     * 跳转到目标事件绑定的调用链。
     * 内容：暂存区1项可选。
     * 如果内容有值，则真值（广义）跳转，否则无条件跳转。
     * 仅限于当前绑定/委托元素上绑定的事件。
     * @param {String} name 事件名
     * @param {Value} extra 附加数据，可选
     */
    goto( evo, name, extra ) {
        if ( evo.data === undefined || evo.data ) {
            $.trigger( evo.delegate, name, extra, false );
        }
    },

    __goto: -1,


    /**
     * 表单控件默认值改变通知。
     * 内容：暂存区1项可选。
     * 如果内容有值，则为激发事件附带的数据。
     * 行为：
     * 检查表单控件值是否不再为默认值，激发目标控件上的evn事件，
     * 如果都没有改变，不会激发事件。
     * 通常在表单元素（<form>）上绑定监控处理器（changed）。
     *
     * @param {String} rid 表单元素选择器（单个）
     * @param {String} evn 定制事件名，可选
     */
    changes( evo, rid, evn = 'changed' ) {
        let _frm = evo.updated;

        if ( rid ) {
            _frm = Util.find( rid, evo.delegate, true );
        }
        for ( const el of $(_frm) ) {
            changedTrigger( $.controls(el), evn, evo.data );
        }
    },

    __changes: -1,


    /**
     * 滚动到当前视口。
     * y, x 值说明参考On部分同名接口。
     * @param  {Number|String|true|false} y 垂直位置标识
     * @param  {Number} x 水平位置标识
     * @return {void}
     */
    intoView( evo, y, x ) {
        $.intoView( target(evo), y, x );
    },

    __intoView: -1,

};


//
// 原生事件/方法调用。
// 内容：暂存区1项可选。
// 如果内容有值，作为触发事件的目标元素。
// 注：覆盖On部分同名方法。
// 理解：重在“激发”。
//===============================================
[
    'click',
    'blur',
    'focus',
    'select',
    'reset',
    'submit',
    'load',
    'play',
    'pause',
    'finish',
    'cancel',

    // 注记：
    // On存在同名集合方法，兼容原生方法调用（Animation）。
    // 此处不再定义，注意调用需先获取目标。
    // 'reverse',
]
.forEach(function( meth ) {

    _NextStage[meth] = function( evo ) { target(evo)[meth]() };

    _NextStage[`__${meth}`] = -1;

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
 * @param  {String} slr 选择器（共享），可选
 * @param  {Value} ival 初始传入值（共享），可选
 * @param  {String} type 绑定方式
 * @return {void}
 */
function bindEvns( el, map, evns, slr, ival, type ) {
    if ( !evns ) {
        evns = [...map.keys()];
    }
    for ( const nid of evns ) {
        if ( map.has(nid) ) {
            $[type](
                el,
                nid.split(__chrEvnid, 1)[0],
                slr,
                map.get(nid).initVal(ival)
            );
        }
    }
}


/**
 * 调用链绑定到事件。
 * 从延迟绑定存储中检索调用链并绑定到目标事件。
 * 重复绑定是有效的（可能传入不同的初始值）。
 * @param  {String} type 绑定方式（on|one）
 * @param  {Element} src 取值元素
 * @param  {Element} to 绑定元素
 * @param  {Value} ival 初始传入值（内容）
 * @param  {String} evnid 事件名ID/序列，可选
 * @param  {String} slr 委托选择器，可选
 * @return {void}
 */
function bindChain( type, src, to, ival, evnid, slr ) {
    let _map = ChainStore.get( src );

    if ( !_map ) {
        return window.console.warn(`no storage on:`, src);
    }
    return bindEvns( to, _map, evnid && evnid.split(__reSpace), slr, ival, type );
}


/**
 * 调用链绑定到事件（集合版）。
 * 从延迟绑定存储中检索调用链并绑定到目标事件。
 * 注：被重复绑定是有效的，可能传入不同的初始值。
 * @param  {String} type 绑定方式（on|one）
 * @param  {Element|[Element]} to 绑定目标元素（集）
 * @param  {Value} ival 初始传入数据
 * @param  {String} evnid 事件名标识
 * @param  {String} slr 委托选择器
 * @return {void}
 */
function bindsChain( type, to, ival, evnid, slr ) {
    if ( $.isArray(to) ) {
        return to.forEach( el => bindChain(type, el, el, ival, evnid, slr) );
    }
    bindChain( type, to, to, ival, evnid, slr );
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


/**
 * 构造scroll位置对象。
 * @param  {Number|Object2|Array} pos 位置对象
 * @return {Object2}
 */
function scrollObj( pos ) {
    if ( $.type(pos) == 'Object' ) {
        return pos;
    }
    if ( typeof pos == 'number' ) {
        return { top: pos };
    }
    return { left: pos[0], top: [1] };
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
 * 获取下一阶目标。
 * 如果内容有值，则为操作的目标，否则为更新目标。
 * 适用部分接口暂存区1项可选（-1）时。
 * @return {Collector}
 */
function target( evo ) {
    return $( evo.data === undefined ? evo.updated : evo.data );
}



//
// 预处理，导出。
// 设置和下一阶用两个子集表达。
///////////////////////////////////////////////////////////////////////////////


// 名称空间。
export const To = {};


// 绑定：this固化。
// 注：不继承任何基础指令集。
To.Update = $.assign( {}, _Update, bindMethod )

//
// 允许调试。
//
To.Update.debug = debug;


// 绑定：this固化。
// @proto: Get < Process < Control
To.NextStage = $.proto(
    $.assign( {}, _NextStage, bindMethod ), Get
);
