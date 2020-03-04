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
//  仅包含极少量的几个顶级基础指令，主要操作依赖于X扩展库。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Util } from "./util.js";
import { X } from "./lib.x.js";
import { bindMethod, method, pullRoot } from "../config.js";


// 可选。
// 若无需支持可简单移除。
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

};


//
// 元素表现（x.Eff）
// 目标：当前条目/栈顶1项。
//////////////////////////////////////////////////////////////////////////////

const __Eff = {};

[
    'hide',
    'lose',
    'disable',
    'fold',
    'truncate',
]
.forEach(function( name ) {
    /**
     * 注：名称即为特性值。
     * @param  {Boolean} sure 正向执行
     * @return {void}
     */
    __Eff[name] = function( evo, sure = true ) {
        let _els = evo.data;

        if ( !sure ) {
            name = `-${name}`;
        }
        if ( !$.isArray(_els) ) {
            _els = [_els];
        }
        _els.forEach( el => Util.pbo(el, [name]) );
    };

    __Eff[`__${name}`] = 1;

});


// 注入。
X.extend( 'Eff', __Eff );


//
// 节点操作。
//////////////////////////////////////////////////////////////////////////////

const __Node = {
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


// 节点封装。
// 目标：当前条目/栈顶1项。
// 注：与To部分的同名方法不同，这里只接收字符串实参。
//===============================================
[
    'wrap',
    'wrapInner',
    'wrapAll',
]
.forEach(function( meth ) {
    /**
     * @param  {String} box 封装元素的HTML结构串
     * @return {Element|Collector} 包裹的容器元素（集）
     */
    __Node[meth] = function( evo, box ) {
        let x = evo.data;
        return $.isArray(x) ? $(x)[meth](box) : $[meth](x, box);
    };

    __Node[`__${meth}`] = 1;

});


// 自我修改。
// 目标：当前条目/栈顶1项。
// 执行结果可能入栈，由布尔实参（slr|back）决定。
// 注：多余实参无副作用。
//===============================================
[
    'remove',           // ( slr?, back? )
    'removeSiblings',   // ( slr?, back? )
    'normalize',        // ( depth?, back? )
]
.forEach(function( meth ) {
    /**
     * @param  {String|Number|Boolean} slr 选择器/影响深度或入栈指示
     * @param  {Boolean} back 入栈指示
     * @return {Element|Collector|void}
     */
    __Node[meth] = function( evo, slr, back ) {
        if ( typeof slr == 'boolean' ) {
            [back, slr] = [slr];
        }
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth](slr) : $[meth](_x, slr);

        if ( back ) return _d;
    };

    __Node[`__${meth}`] = 1;

});

[
    'empty',
    'unwrap',
]
.forEach(function( meth ) {
    /**
     * @param  {Boolean} back 入栈指示
     * @return {Element|Collector|void}
     */
    __Node[meth] = function( evo, back ) {
        let _x = evo.data,
            _d = $.isArray(_x) ? $(_x)[meth]() : $[meth](_x);

        if ( back ) return _d;
    };

    __Node[`__${meth}`] = 1;

});


// 注入。
X.extend( 'Node', __Node );



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
