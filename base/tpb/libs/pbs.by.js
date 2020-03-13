//! $Id: pbs.by.js 2019.08.19 Tpb.Core $
// ++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:By 方法集。
//
//  仅包含少量的几个顶级基础指令，主要操作依赖于用户定义库和系统内置的X库。
//
//  用户扩展：
//      import { extend } from "./libs/pbs.by.js";
//      extend( name, ... );
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { X, extend__ } from "./lib.x.js";
import { bindMethod, method, pullRoot } from "../config.js";

// 无渲染占位。
// import { Render } from "./render.x.js";
import { Render } from "./render.js";


const $ = window.$;


const _By = {
    /**
     * 数据拉取（简单）。
     * 目标：当前条目，可选。
     * 暂存区的流程数据会作为查询串上传。
     * 注：仅支持 GET 方法。
     * @param  {String} meth 请求方法。可选，默认index
     * @return {Promise} data:json
     */
    pull( evo, meth = 'index' ) {
        let _url = `${pullRoot}/${meth}`;

        if ( evo.data != null ) {
            _url += '?' + new URLSearchParams(evo.data);
        }
        return fetch(_url).then(
            resp => resp.ok ? resp.json() : Promise.reject(resp.statusText)
        );
    },

    __pull: 0,


    /**
     * 导入X库成员（通常为函数）。
     * 特权：是，灵活取栈。
     * 如果实参为空则从数据栈取值。
     * @param  {Stack} stack 数据栈
     * @param  {String} path 引用路径（句点分隔），可选
     * @return {Value}
     */
    xobj( evo, stack, path ) {
        if ( path == null ) {
            path = stack.data(1);
        }
        return Util.subObj( path.split('.'), X );
    },

    __xobj_x: true,


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
            return Util.subObj(meth.split('.'), X)( ...rest );
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
            return Util.subObj(meth.split('.'), X)( ...rest );
        }
    },

    __xfalse: 1,


    /**
     * 节点渲染。
     * 目标：当前条目/栈顶1-2项。
     * 特权：是，灵活取栈。
     * 模板实参为空时从数据栈中取数据。
     * @data:  [Element, data?:Value]
     * @param  {Stack} stack 数据栈
     * @param  {Object|Value|[Value]} 渲染数据，可选
     * @return {Element} 被渲染节点
     */
    render( evo, stack, data ) {
        let _vs = data === undefined ?
            stack.data(2) :
            [ stack.data(1), data ];

        return Render.update( ..._vs );
    },

    __render_x: true,

};



//
// 预处理，导出。
///////////////////////////////////////////////////////////////////////////////

//
// 构造绑定。
// this固化，参数配置，便于全局共享。
//
const By = $.assign( {}, _By, bindMethod );


// X引入。
// 模板中使用小写形式。
By.x = X;


/**
 * 接口：用户扩展。
 * 扩展中的方法默认会绑定（bind）到所属宿主对象。
 * 支持多层嵌套的子域，子域是一种分组，由普通的Object封装。
 * 扩展时会自动创建不存在的中间子域。
 * 如果方法需要访问指令单元（this:Cell），传递nobind为真。
 * @param  {String} name 子域/链（多级由句点分隔）
 * @param  {Object} exts 扩展集
 * @param  {Boolean} nobind 无需绑定（可访问Cell实例），可选。
 * @return {Object} 目标子域
 */
function extend( name, exts, nobind ) {
    return extend__( name, exts, nobind, By );
}


//
// 接口：
// 提供已预处理的方法。
// 方法名支持句点（.）分隔的多级调用。
//
By[method] = function( name ) {
    name = name.split('.');
    return name.length > 1 ? Util.subObj( name, By ) : By[ name[0] ];
};


export { By, extend };
