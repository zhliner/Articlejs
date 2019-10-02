//! $Id: pbs.to.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:To 方法集。
//
//  Where：取栈数量固定为1（已被obter.js/update封装）。
//  Stage：前置双下划线定义取栈条目数，无返回值。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { bindMethod, method } from "../config.js";
import { Render } from "./render.js";


const
    $ = window.$,

    // 消息定时器存储键。
    __TIMER = Symbol('tips-timer');



//
// 目标更新方法集。
// 目标：由Query部分检索获取。
// 内容：由单个流程数据提供（取值已被obter.js/update封装）。
///////////////////////////////////////////////////////////////////////////////

const _Where = {
    /**
     * 事件处理器克隆。
     * 将内容数据中元素上的事件处理器克隆到目标元素（集）上。
     * 内容可以只是一个元素，也可以是一个实参序列的数组。
     * args[0]：源元素（事件源）。
     * args[1]：事件名序列或配置（集）。
     * @param {Element|Collector} its 目标元素（集）
     * @param {Element, String|Array2|[Array2]} args 实参（序列）
     */
    cloneEvent( its, args ) {
        if ( !$.isArray(args) ) {
            args = [args];
        }
        if ( its.nodeType == 1 ) {
            return $.cloneEvent( its, ...args );
        }
        its.forEach( to => $.cloneEvent( to, ...args ) );
    },


    /**
     * 用流程数据更新目标元素（集）。
     * 更新为渲染逻辑，但目标元素可能不是模板副本根。
     * 如果目标是多个元素，它们采用相同的源数据渲染。
     * 注：
     * 与 By.render 效果类似，但支持局部渲染和多目标渲染。
     *
     * 局部渲染：
     * - 根元素如果是Each语法，该元素必须是Each的起始元素。
     * - 根元素不应当是For循环内包含Each语法的子元素，这会破坏For的结构。
     *
     * @param {Element|Collector} its 目标元素（集）
     * @param {Object} data 渲染源数据
     */
    update( its, data ) {
        if ( its.nodeType == 1 ) {
            return Render.update( its, data );
        }
        its.forEach( el => Render.update(el, data) );
    },

};


//
// 特性/属性/样式设置。
// 内容：update封装取值。
//===============================================
// 注：名称前置特殊字符，用于方法辨识。
[
    'attr',         // @name
    'prop',         // &name
    'cssSets',      // %name
    'toggleAttr',   // ^name
]
.forEach(function( meth ) {
    /**
     * 目标赋值更新。
     * 注：会被封装调用，不含首个evo实参。下同。
     * @param  {Element|Collector} its 目标元素（集）
     * @param  {Value|[Value]|Function} val 值或值集
     * @param  {String} name 特性/属性/样式名
     * @return {Any:ignore} 调用者忽略
     */
    _Where[meth] = function( its, val, name ) {
        return its.nodeType == 1 ?
            $[meth]( its, name, val ) : $(its)[meth]( name, val );
    };

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
    _Where[meth] = function( its, con ) {
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
    _Where[ fns[0] ] = function( its, args ) {
        if ( !$.isArray(args) ) {
            args = [args];
        }
        $( its )[ fns[1] ]( ...args );
    };

});



//
// pba/pbo专项设置。
// 内容：update封装取值。
// 注：简单调用 Util.pba/pbo。
///////////////////////////////////////////////////////////////////////////////
[
    'pba',  // ( wds )
    'pbo',  // ( wds )
]
.forEach(function( name ) {

    _Where[name] = function( its, wds ) {
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
     * @param {Value} extra 发送数据
     * @param {Number} delay 延迟毫秒数。可选，默认无延迟
     */
    fire( evo, name, extra, delay ) {
        if ( extra === undefined ) {
            extra = evo.data;
        }
        Util.fireEvent( $(evo.targets), name, extra, delay );
    },

    __fire: 0,


    /**
     * 条件激发。
     * 内容：当前条目/栈顶1项。
     * 仅当内容为真时才激发目标事件，否则忽略。
     * 注：内容无法成为被发送的数据。
     * @param {String} name 事件名
     * @param {Value} extra 发送数据
     * @param {Number} delay 延迟毫秒数。可选，默认无延迟
     */
    xfire( evo, name, extra, delay ) {
        if ( evo.data ) {
            Util.fireEvent( $(evo.targets), name, extra, delay );
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

To.Where = $.assign( {}, _Where, bindMethod );
To.Stage = $.assign( {}, _Stage, bindMethod );



// 接口：
// 提供预处理方法。
//===============================================

To.Where[method] = name => To.Where[name];

To.Stage[method] = name => To.Stage[name];



export { To };
