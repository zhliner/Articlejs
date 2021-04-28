//! $Id: shedit.js 2021.04.08 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  历史脚本编辑支持。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Sys, Limit } from "../config.js";
import { CStorage, History, Pages } from "./common.js";
import { processExtend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // 脚本历史DOM编辑历史栈。
    __TQHistory = new $.Fx.History(),

    // 脚本历史存储器。
    __Store = new CStorage( Sys.prefixScript ),

    // 脚本历史编辑器。
    __History = new History( Limit.shEdits, __TQHistory );


let
    // 置顶区分页实例。
    __PagesTop = null,

    // 搜索区（混合）分页实例。
    __PagesAll = null;



//
// 脚本历史删除操作（DOM部分）。
//
class SHDel {
    /**
     * 构造一个操作实例。
     * @param {Element|[Element]} els 目标元素（集）
     */
    constructor( els ) {
        this.$els = $( els );
        // 外部只读
        this.count = null;

        this.redo();
    }


    /**
     * 撤销。
     */
    undo() {
        if ( this.count > 0 ) {
            __TQHistory.back( this.count );
        }
    }


    /**
     * 重做。
     */
    redo() {
        let _old = __TQHistory.size();

        this.$els.remove();
        this.count = __TQHistory.size() - _old;
    }
}


//
// 换页编辑操作。
// 换页作为一个独立的DOM变化来记录。
// 当前页次记录在容器元素的 data-page 特性上。
// 注记：
// 当前页可能已经被编辑（删除条目），故需更新页条目缓存器。
// 支持跳转到任意有效页次。
//
class PageEdit {
    /**
     * @param {PageBuf} buf 页集缓存实例
     * @param {Element} box 条目容器
     * @param {[Element]} els 新页条目集
     * @param {Number} n 目标页次（从0开始）
     */
    constructor( buf, box, els, n ) {
        this._buf = buf;
        this._box = box;
        this._els = els;
        this._idx = n;
        // 外部只读
        this.count = null;

        this.redo();
    }


    /**
     * 撤销。
     * 撤销前的新页面缓存保持。
     */
    undo() {
        if ( this.count > 0 ) {
            __TQHistory.back( this.count );
        }
        this._buf.update( this._idx, this._els );
    }


    /**
     * 重做。
     * 换页前页面的信息缓存保持。
     */
    redo() {
        this._save( this._buf, this._box );

        let _old = __TQHistory.size();

        $.fill( this._box, this._els );
        $.attr( this._box, '-page', this._idx );

        this.count = __TQHistory.size() - _old;
    }


    /**
     * 当前页信息保存。
     * @param {PageBuf} buf 页缓存器
     * @param {Element} box 条目容器
     */
    _save( buf, box ) {
        buf.update( $.attr(box, '-page'), $.children(box) );
    }
}


//
// 脚本历史编辑：本地存储。
//
class SHEdit {
    /**
     * 构造一个编辑实例。
     * @param {String} shid 脚本存储ID
     */
    constructor( shid ) {
        this._sid = shid;
        this._old = __Store.get( shid );

        this.redo();
    }


    /**
     * 撤销。
     * 恢复存储，恢复DOM显示。
     */
    undo() {
        __Store.set( this._sid, this._old );
    }


    /**
     * 重做。
     * 重新删除，移除DOM显示条目。
     */
    redo() {
        __Store.del( this._sid );
    }
}


//
// 脚本代码置顶编辑。
// 对执行过的历史脚本做置顶标记，便于使用（类似代码片段）。
// 注记：
// 不涉及DOM的操作，完成后外部应当刷新显示。
//
class SHTop {
    /**
     * 构造一个编辑实例。
     * @param {String} shid 脚本存储ID
     * @param {Boolean} top 是否置顶
     */
    constructor( shid, top ) {
        this._sid = shid;
        this._top = !!top;

        // 应当已存在。
        // 初始可能未定义top。
        this._old = !!__Store.get( shid ).top;

        this.redo();
    }


    /**
     * 撤销。
     * 恢复存储，恢复DOM显示。
     */
    undo() {
        let _sh = shObj( this._sid );
        _sh.top = this._old;
        __Store.set( this._sid, _sh );
    }


    /**
     * 重做。
     * 重新删除，移除DOM显示条目。
     */
    redo() {
        let _sh = shObj( this._sid );
        _sh.top = this._top;
        __Store.set( this._sid, _sh );
    }
}



//
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 获取历史脚本存储条目。
 * 如果条目不是一个对象，构造一个对象返回。
 * 对象格式：{
 *      shid:   条目标识
 *      name:   标签名称
 *      code:   代码文本
 *      top:    是否置顶
 *      datetime:   更新时间
 * }
 * @param  {String} sid 历史脚本ID
 * @return {Object}
 */
function shObj( sid ) {
    let _sh = __Store.get( sid );
    return _sh ? JSON.parse( _sh ) : { code: null };
}


/**
 * 提取置顶条目对象集。
 * @return {[Object]}
 */
function objTops() {
    let _buf = [];

    for ( const k of __Store.keys() ) {
        let _o = shObj( k );
        if ( _o.top ) _buf.push( _o );
    }
    return _buf;
}


/**
 * 构造过滤函数。
 * 关键词集内部为AND关系，关键词集之间为OR关系。
 * 返回值：function(String): Boolean
 * @param  {...[String]} words 关键词集序列
 * @return {Function}
 */
function xfilter( ...words ) {
    return str => words.some(
        ws => ws.every( w => str.includes(w) )
    );
}



//
// 辅助工具集。
//
const __Kit = {
    /**
     * 脚本历史编辑撤销。
     * @return {Boolean} 是否不可再撤销
     */
    shUndo() {
        __History.undo();
        return !__History.canUndo();
    },


    /**
     * 脚本历史编辑重做。
     * @return {Boolean} 是否不可再重做
     */
    shRedo() {
        __History.redo();
        return !__History.canRedo();
    },


    /**
     * 脚本历史页初始化。
     * 主要为构建两个列表区的分页实例。
     * @param  {Element} top 置顶区列表元素（<ul>）
     * @param  {Element} all 搜索区列表元素（<ol>）
     * @return {void}
     */
    shinit( evo, top, all ) {
        __PagesAll = new Pages( all, [], Limit.shListAll );
        __PagesTop = new Pages( top, objTops(), Limit.shListTop );
        // window.shTop = __PagesTop;
        // window.shAll = __PagesAll;
    },


    /**
     * 删除脚本历史条目。
     * @data: String 条目ID
     * @return {void}
     */
    delsh( evo ) {
        __Store.del( evo.data );
    },

    __delsh: 1,


    /**
     * 条目置顶/取消置顶。
     * @data: String 条目ID
     * @param  {Boolean} top 是否置顶
     * @return {void}
     */
    shtop( evo, top ) {
        let _sh = shObj( evo.data );

        _sh.top = top;
        __Store.set( evo.data, JSON.stringify(_sh) );
    },

    __shtop: 1,


    /**
     * 设置脚本名称。
     * 仅置顶条目需要操作，但取消置顶不必移除名称。
     * 存储键：name
     * @data: String 条目ID
     * @param  {String} name 待设置的名称
     * @return {void}
     */
    shlabel( evo, name ) {
        let _sh = shObj( evo.data );

        _sh.name = name;
        __Store.set( evo.data, JSON.stringify(_sh) );
    },

    __shlabel: 1,


    /**
     * 脚本历史条目编辑（管理）。
     * 进入或完成后，都需重建一个分页对象，重新渲染。
     * @data:
     * - true  开始
     * - false 结束
     */
    shEdit( evo ) {
        //
    },

    __shEdit: 1,


    /**
     * 计算获取历史记录面板上下区高度。
     * 用于历史记录面板中上下部分高度调整。
     * 注记：
     * 需同时设置上下两个区高度，便于样式控制内容自动滚动。
     * @data: Number Y轴变化量（像素）
     * @param  {Element} box 容器元素
     * @param  {Element} top 上区元素
     * @param  {Element} hr  移动手柄元素
     * @param  {Element} down 下区元素
     * @return {[Number, Number]} 上区高度, 下区最大高度
     */
    sh2panel( evo, box, top, hr, down ) {
        let _h1 = $.outerHeight(top, true) + $.outerHeight(hr, true),
            _m2 = $.outerHeight(down, true) - $.height(down);

        return [
            $.height( top ) + evo.data,
            $.height( box ) - ( _h1 + _m2 + evo.data )
        ];
    },

    __sh2panel: 1,


    /**
     * 搜索目标脚本。
     * - 空格：逻辑 AND
     * - 逗号：逻辑 OR
     * @data: String 待检索关键词序列
     * @return {[Object]}
     */
    shsearch( evo ) {
        let _fun = xfilter(
                ...evo.data.split( ',' ).map( ws => ws.trim().split(/\s+/) )
            ),
            _buf = [];

        for ( const key of __Store.keys() ) {
            let _obj = shObj( key );
            _obj.code && _fun( _obj.code ) && _buf.push( _obj )
        }
        return _buf;
    },

    __shsearch: 1,


    /**
     * 渲染/创建脚本清单。
     * @param  {Boolean} top 限于置顶区
     * @return {Element} 清单分页首页根（ul|ol）
     */
    shlist( evo, top ) {
        //
    },

    __shlist: 1,
}


//
// 扩展到 By:Kit 空间。
// 注意与 edit.js 模块相同扩展的名称兼容。
//
processExtend( 'Kit', __Kit, [
    'shUndo',
    'shRedo',
    'shinit',
    'delsh',
    'shtop',
    'shlabel',
    'shEdit',
    'sh2panel',
    'shsearch',
    'shlist',
]);
