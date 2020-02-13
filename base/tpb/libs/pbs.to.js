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
//  Update：取栈数量固定为1（已被obter.js/update封装）。
//  Stage：前置双下划线定义取栈条目数，无返回值。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { bindMethod, method } from "../config.js";

// 可选。
// 若无需支持可简单移除。
import { Render } from "./render.js";


const
    $ = window.$,

    // 消息定时器存储键。
    __TIMER = Symbol('tips-timer'),

    // 预定义调用链存储。
    // 与元素关联，便于分组管理，同时支持空事件名通配。
    // { Element: Map{evn:String: Chain} }
    __ChainStore = new WeakMap();



//
// 目标更新方法集。
// 目标：由Query部分检索获取。
// 内容：由单个流程数据提供（取值已被obter.js/update封装）。
///////////////////////////////////////////////////////////////////////////////

const _Update = {
    /**
     * 绑定预定义调用链。
     * 如果evn为假值，表示匹配目标上的全部预存储。
     * 如果无实参传递，流程数据为数组时会展开为实参序列。
     * args: [evn, slr:String, init:Value]
     * data: Element|[store:Element, evn, slr, init]
     * @param {Element|Collector} to 待绑定元素/集
     * @param {Element|[args...]} data 存储元素或实参序列
     * @param {...Value} args 模板实参序列
     */
    bind( to, data, ...args ) {
        if ( args.length == 0 && $.isArray(data) ) {
            [data, ...args] = data;
        }
        if ( $.isArray(to) ) {
            to.forEach( el => bindChain('on', el, data, ...args) )
        }
        bindChain( 'on', to, data, ...args );
    },


    /**
     * 绑定单次触发。
     * 其它说明同bind。
     */
    once( to, data, ...args ) {
        if ( args.length == 0 && $.isArray(data) ) {
            [data, ...args] = data;
        }
        if ( $.isArray(to) ) {
            to.forEach( el => bindChain('one', el, data, ...args) )
        }
        bindChain( 'one', to, data, ...args );
    },


    /**
     * 发送定制事件。
     * args: [evn:String, bubble, cancelable:Boolean]
     * data: Value|evn:String|[evn:String, val:Value, bubble, cancelable:Boolean]
     * 注：
     * 内容可以是事件名，此时模板应无实参传递，
     * 如果需要发送值或指定其它参数，将从内容提取（注意顺序）。
     *
     * @param {Element|Collector} to 待绑定元素/集
     * @param {Value|String|[rest...]} data 存储元素或实参序列
     * @param {String} evn 事件名
     * @param {...Boolean} rest 冒泡/可取消参数
     */
    trigger( to, data, evn, ...rest ) {
        if ( !evn && $.isArray(data) ) {
            [evn, data, ...rest] = data;
        }
        $(to).trigger( evn, data, ...rest );
    },


    /**
     * 事件处理器克隆。
     * 将内容元素上的事件处理器克隆到目标元素（集）上。
     * 事件名可为空格分隔的多个名称。
     * @param {Element|Collector} to 目标元素（集）
     * @param {Element|[Element, String|Function]} src 内容（事件源）或实参封装
     * @param {String|Function} evns 事件名序列或过滤函数，可选
     */
    cloneEvent( to, src, evns ) {
        if ( !evns && $.isArray(src)) {
            [src, evns] = src;
        }
        if ( to.nodeType == 1 ) {
            return $.cloneEvent( to, src, evns );
        }
        to.forEach( to => $.cloneEvent( to, src, evns ) );
    },


    /**
     * 渲染目标元素/集。
     * 如果目标是多个元素，它们采用相同的源数据渲染。
     * 目标元素可能不是模板根元素，此时为局部渲染。
     * - 根元素如果是Each语法，该元素必须是Each的起始元素。
     * - 根元素不应当是For循环内包含Each语法的子元素，这会破坏For的结构。
     * 注：
     * 本方法可选，若无需支持，简单移除即可。
     *
     * @param {Element|Collector} to 目标元素/集
     * @param {Object|Array} data 内容：渲染源数据
     */
    render( to, data ) {
        if ( to.nodeType == 1 ) {
            return Render.update( to, data );
        }
        to.forEach( el => Render.update(el, data) );
    },

};


//
// 特性/属性/样式设置。
// 内容：update封装取值。
//===============================================
// 注：名称前置特殊字符，用于方法辨识。
[
    'attribute',    // @name
    'property',     // &name
    'css',          // %name
    'toggleAttr',   // ^name
]
.forEach(function( meth ) {
    /**
     * 目标赋值更新。
     * 注：会被封装调用，不含首个evo实参。下同。
     * @param  {Element|Collector} to 目标元素（集）
     * @param  {Value|Array2|Function|null} val 内容
     * @param  {String} name 名称（单个）
     * @return {Ignore} 调用者忽略
     */
    _Update[meth] = function( to, val, name ) {
        return to.nodeType == 1 ?
            $[meth]( to, name, val ) : $(to)[meth]( name, val );
    };

});


// 特性/属性/样式设置：增强版。
// 展开：[names:String|Object, 内容]
//-----------------------------------------------
[
    'attr',     // (names?)
    'prop',     // (names?)
    'cssSets',  // (names?)
]
.forEach(function( meth ) {
    /**
     * 目标赋值更新。
     * @param  {Element|Collector} to 目标元素（集）
     * @param  {Value|[Value]|Function|Object} its 内容
     * @param  {String} names 名称定义
     * @return {Ignore} 调用者忽略
     */
    _Update[meth] = function( to, its, names ) {
        if ( !names && $.isArray(its) ) {
            // 名称在前
            [names, its] = its;
        }
        if ( to.nodeType == 1 ) {
            return $[meth]( to, names, its );
        }
        if ( $.isArray(to) ) $(to)[meth]( names, its );
    }
});


//
// tQuery|Collector通用设置。
// 内容：update封装取值。单个实参传递。
//===============================================
// 注：下面注释中为对内容的描述（可能的类型）。
[
    // con: {Node|[Node]|Collector|Set|Iterator|Function}
    'before',       // 插入目标之前
    'after',        // 插入目标之后
    'prepend',      // 插入目标内前端
    'append',       // 插入目标内末尾
    'fill',         // 填充目标内容（清空原有）
    'replace',      // 替换目标自身

    'wrap',         // box: {Element|String} 各自包裹目标
    'wrapInner',    // box: {Element|String} 各自内包裹目标
    'wrapAll',      // box: {Element|String} 包裹全部目标（仅适用 Collector）

    'height',       // val: Number /px
    'width',        // val: Number /px
    'scroll',       // val: {top:Number, left:Number}|[left, top] /px
    'scrollTop',    // val: Number /px
    'ScrollLeft',   // val: Number /px
    'addClass',     // name: {String|Function}
    'removeClass',  // name: {String|Function}
    'toggleClass',  // name: {String|Function|Boolean}
    'removeAttr',   // name: {String|Function}
    'val',          // val: {Value|[Value]|Function}
    'html',         // code: {String|[String]|Node|[Node]|Function|.values} /fill
    'text',         // code: {String|[String]|Node|[Node]|Function|.values} /fill
    'offset',       // val: {top:Number, left:Number} /px
]
.forEach(function( meth ) {
    /**
     * 简单设置目标值。
     * 内容实参类型参考上面注释。
     * @param  {Element|Collector} its 目标元素（集）
     * @param  {...} con|box|val|name|code 更新内容
     * @return {Any:ignore} 调用者忽略
     */
    _Update[meth] = function( its, con ) {
        return its.nodeType ?
            $[meth]( its, con ) : $(its)[meth]( con );
    };

});



//
// 逆向设置。
// 流程数据为插入参考目标，当前检索为内容（多对一）。
// 目标：update封装取值，实为内容。
// 内容：可能为一个实参序列，首个成员为目标节点/元素，之后为克隆配置。
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
     * @param {Element|Collector} its 内容元素（集）
     * @param {Node|Element, Boolean?, Boolean?, Boolean?} args 目标节点/元素和更多实参序列。
     */
    _Update[ fns[0] ] = function( its, args ) {
        if ( !$.isArray(args) ) {
            args = [args];
        }
        $( its )[ fns[1] ]( ...args );
    };

});



//
// PB专项设置。
// 内容：update封装取值。
// 注：简单调用 Util.pba/pbo/pbv。
///////////////////////////////////////////////////////////////////////////////
[
    'pba',  // ( wds )
    'pbo',  // ( wds )
    'pbv',  // ( val )
]
.forEach(function( name ) {

    _Update[name] = function( its, wds ) {
        if ( its.nodeType == 1 ) {
            return Util[name]( its, wds );
        }
        its.forEach( el => Util[name](el, wds) );
    };

});



//
// 下一阶处理。
// 类似普通的 PB:Call 逻辑。
// @return {void}
///////////////////////////////////////////////////////////////////////////////

const _Stage = {
    /**
     * 更新To目标。
     * 取值：当前条目/栈顶1项。
     */
    target( evo ) {
        evo.targets = evo.data;
    },

    __target: 1,


    /**
     * 在目标元素（集）上激发事件。
     * 内容：当前条目，可选。
     * 如果data未定义，则采用当前条目（如果有）为数据。
     * @param {String} name 事件名
     * @param {Number} delay 延迟毫秒数。
     * @param {Value} extra 发送的数据
     * @param {...Value} rest 剩余参数（bubble, cancelable）
     */
    fire( evo, name, delay = 1, extra = null, ...rest ) {
        if ( extra == null ) {
            extra = evo.data == null ? extra : evo.data;
        }
        Util.fireEvent( $(evo.targets), name, delay, ...rest );
    },

    __fire: 0,


    /**
     * 条件激发。
     * 内容：当前条目/栈顶1项。
     * 仅当内容为真时才激发目标事件，否则忽略。
     * 注：内容无法成为被发送的数据。
     * @param {String} name 事件名
     * @param {Number} delay 延迟毫秒数。
     * @param {...Value} rest 剩余参数（extra, bubble, cancelable）
     */
    xfire( evo, name, delay = 1, ...rest ) {
        if ( evo.data ) {
            Util.fireEvent( $(evo.targets), name, delay, ...rest );
        }
    },

    __xfire: 1,


    /**
     * 设置滚动条位置。
     * 内容：当前条目，可选。
     * x 支持配置对象格式：{top, left}。
     * @param {Number|Object} x 水平滚动条位置或配置对象
     * @param {Number} y 垂直滚动条位置
     */
    scroll( evo, x, y ) {
        if ( y !== undefined ) {
            x = [x, y];
        }
        if ( x == null ) {
            x = evo.data;
        }
        $( evo.targets ).scroll( x );
    },

    __scroll: 0,


    /**
     * 表单控件默认值改变通知。
     * 目标：仅适用表单元素（集）。
     * 内容：当前条目，可选发送。
     * 检查表单控件值是否不再为默认值，激发目标控件上的evn事件。
     * 注：如果都没有改变，不会激发事件。
     *
     * @param {String} evn 控件上激发的事件名，可选
     */
    changes( evo, evn = 'changed' ) {
        $( evo.targets )
        .forEach(
            el => changedTrigger( $.controls(el), evn, evo.data )
        );
    },

    __changes: 0,


    /**
     * 表单控件清空。
     * 选取类控件为取消选取，其它为清除value值。
     * 内容：无。
     * 参考.select(), .focus()用途。
     */
    clear( evo ) {
        $( evo.targets ).val( null );
    },

    __clear: null,


    /**
     * 发送提示消息。
     * 在目标元素上显示文本，持续时间由long定义，0表示永久。
     * 内容：当前条目，可选。
     * 注意：long单位为秒，支持浮点数。
     * @param {Number} long 持续时间（秒）
     * @param {String} msg 消息文本，可选
     */
    tips( evo, long, msg ) {
        let _its = evo.targets;

        if ( !$.isArray(_its) ) {
            _its = [_its];
        }
        if ( msg == null ) {
            msg = evo.data;
        }
        _its.forEach( el => message(el, msg, long) );
    },

    __tips: 0,

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

    _Stage[meth] = function( evo ) { $( evo.targets )[meth]() };

    // _Stage[`__${meth}`] = null;

});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 存储调用链。
 * 如果存在相同事件名，后者会覆盖前者。
 * @param  {Element} el 存储元素（定义所在）
 * @param  {String} name 存储键/事件名
 * @param  {EventListener} chain 调用链
 * @return {void}
 */
 function chainStore( el, name, chain ) {
    let _map = __ChainStore.get(el);

    if ( !_map ) {
        _map = new Map();
        __ChainStore.set( el, _map );
    }
    _map.set( name, chain );
}


/**
 * 处理器封装。
 * this: {Cell}
 * @param {Value} init 初始值
 * @param {Event} ev 事件对象
 * @param {Object} elo 事件关联对象
 */
function bindHandle( init, ev, elo ) {
    return this.handleEvent( ev, elo, init );
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
    for ( const n of evns ) {
        let _ch = map.get(n);
        if ( _ch ) {
            $[type]( el, n, slr, bindHandle.bind(_ch, init) );
        }
    }
}


/**
 * 调用链绑定到事件。
 * 从延迟绑定存储中检索调用链并绑定到目标事件。
 * 重复绑定是有效的（可能传入不同的初始值）。
 * @param  {String} type 绑定方式（on|one）
 * @param  {Element} el 目标元素
 * @param  {Element} key 存储元素
 * @param  {String} evn 事件名/序列
 * @param  {String} slr 委托选择器
 * @param  {Value} init 初始传入值
 * @return {void}
 */
function bindChain( type, el, key, evn, slr, init ) {
    let _map = __ChainStore.get(key);

    if ( !_map ) {
        window.console.warn(`no storage on Element.`);
        return;
    }
    return bindEvns( el, _map, evn && evn.split(/\s+/), slr, init, type );
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
            if ( selectChanged(el) ) $.trigger( el, evn, data );
        }
        else if ( controlChanged(el) ) $.trigger( el, evn, data );
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
        if ( oe.defaultSelected !== oe.selected ) {
            return true;
        }
    }
    return false;
}


/**
 * 在元素上显示消息。
 * 仅支持纯文本显示（非html方式）。
 * @param  {Element} el 目标元素
 * @param  {String} msg 消息文本
 * @param  {Number} long 持续时间（秒），支持浮点数。
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

const To = {};

To.Update = $.assign( {}, _Update, bindMethod );
To.Stage = $.assign( {}, _Stage, bindMethod );



// 接口：
// 提供预处理方法。
//===============================================

To.Update[method] = name => To.Update[name];

To.Stage[method] = name => To.Stage[name];



export { To, chainStore };
