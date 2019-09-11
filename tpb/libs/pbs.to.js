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
//  格式：前置双下划线定义取栈条目数。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { bindMethod } from "./globals.js";


const $ = window.$;


//
// 目标更新方法集。
// 目标：由Query部分检索获取。
// 内容：由流程数据提供。
///////////////////////////////////////////////////////////////////////////////

const _Where = {
    /**
     * 事件处理器克隆。
     * 将内容数据中元素上的事件处理器克隆到目标元素（集）上。
     * 内容：当前条目/栈顶1项。
     * 内容据可以只是一个元素，也可以是一个实参序列的数组。
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

    __cloneEvent: 1,

};


//
// 特性/属性/样式设置。
// 内容：当前条目/栈顶1项。
//===============================================
// 注：名称前置特殊字符，用于方法辨识。
[
    'attr',         // @name
    'prop',         // &name
    'css',          // %name
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
        if ( its.nodeType == 1 ) {
            return $[meth]( its, name, val );
        }
        if ( $.isCollector(its) ) its[meth]( name, val );
    };

    _Where[`__${meth}`] = 1;

});


//
// tQuery|Collector通用设置。
// 内容：当前条目/栈顶1项。单个实参传递。
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
    'scroll',       // val: {top:Number, left:Number} /px
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
        if ( its.nodeType ) {
            return $[meth]( its, con );
        }
        if ( $.isCollector(its) ) its[meth]( con );
    };

    _Where[`__${meth}`] = 1;

});



//
// 逆向设置。
// 流程数据为插入参考目标，当前检索为内容（多对一）。
// 目标：当前条目/栈顶1项。
// 目标可能为一个实参序列，首个成员为节点/元素，之后为克隆配置。
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
     * @param {Element|Collector} 内容元素（集）
     * @param {Node|Element, Boolean?, Boolean?, Boolean?} args 目标节点/元素和更多实参序列。
     */
    _Where[ fns[0] ] = function( con, args ) {
        if ( !$.isArray(args) ) {
            args = [args];
        }
        $( con )[ fns[1] ]( ...args );
    };

    _Where[`__${fns[0]}`] = 1;

});



//
// pba/pbo专项设置。
// 目标：当前条目/栈顶1项。
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
        if ( $.isArray(its) ) {
            its.forEach( el => Util[name](el, wds) );
        }
    };

    _Where[`__${name}`] = 1;

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


    fire( evo, name, data ) {
        //
    },

    __fire: 1,


    xfire( evo, name, data ) {
        //
    },

    __xfire: 1,


    /**
     * 表单控件默认值改变通知。
     * 目标：仅适用表单元素（集）。
     * 内容：当前条目，可选发送。
     * 检查表单控件值是否不再为默认值，激发目标控件上的evn事件。
     * 注：如果都没有改变，不会激发事件。
     */
    changes( evo, evn = 'changed' ) {
        let _frm = evo.targets;

        if ( _frm.nodeType == 1) {
            return changedTrigger( $.controls(_frm), evn, evo.data );
        }
        _frm.forEach(
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
    clear( its ) {
        $(its).val( null );
    },

    __clear: 0,


    tips( evo, long, msg ) {
        //
    },

    __tips: 0,

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 表单控件默认值改变检查。
 * 如果改变，触发目标控件上的evn事件（通常为changed）。
 * @param {[Element]} els 控件集
 * @param {String} evn 触发的事件名
 * @param {Value} data 发送的数据，可选
 */
function changedTrigger( els, evn, data = null ) {
    for ( const el of els ) {
        if ( el.options ) {
            if ( selectChanged(el) ) $.trigger( el, evn, data );
        }
        else if ( controlChanged(el) ) $.trigger( el, evn, data );
    }
}


/**
 * 普通表单控件元素是否改变默认值。
 * @param {Element} el 控件元素
 */
function controlChanged( el ) {
    return el.defaultChecked !== el.checked || el.defaultValue !== el.value;
}


/**
 * 选单控件是否改变默认选取。
 * @param {Element} sel 选单控件<select>
 */
function selectChanged( sel ) {
    for ( const oe of sel.options ) {
        if ( oe.defaultSelected !== oe.selected ) {
            return true;
        }
    }
    return false;
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
To.Where.method = function( name ) {
    return name != 'method' && To.Where[name];
};


To.Stage.method = function( name ) {
    return name != 'method' && To.Stage[name];
};



export { To };
