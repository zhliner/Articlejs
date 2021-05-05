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
import { customGetter } from "./tpb/pbs.get.js";
import { processExtend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // 脚本历史DOM编辑历史栈。
    __TQHistory = new $.Fx.History(),

    // 脚本历史存储器。
    __Store = new CStorage( Sys.prefixScript ),

    // 脚本历史编辑器。
    __History = new History( Limit.shEdits, __TQHistory ),

    // 分页对象存储键。
    __navPage = Symbol( 'shnav:pages' );


let
    // 重做按钮元素
    __btnRedo = null,

    // 全局状态：
    // 是否处于编辑状态。
    __Editing = false;



//
// 脚本历史删除
// 注：DOM部分。
//
class DOMDel {
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
// 脚本历史删除。
// 注：本地存储部分。
//
class SHDel {
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
// 置顶编辑。
// 包含置顶和取消置顶两项操作。
// 不涉及DOM的操作，完成后外部应当刷新显示。
//
class TopEdit {
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
// 工具函数。
//////////////////////////////////////////////////////////////////////////////


/**
 * 向历史栈压入编辑操作。
 * 包含编辑状态判断：仅在编辑状态才需要实际执行。
 * @param  {...Instance} obj 操作实例序列
 */
function historyPush( ...obj ) {
    if ( __Editing ) {
        $.trigger( __btnRedo, 'state', true );
        __History.push( ...obj.filter(v => v) );
    }
}


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
function topObjs() {
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
    //-- On扩展 --------------------------------------------------------------

    /**
     * 获取置顶条目集。
     * @return {[Object]}
     */
    shtops() {
        return topObjs();
    },


    //-- By扩展 --------------------------------------------------------------

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
     * @data: Element 重做按钮元素
     * @param  {Element} top  置顶区列表元素（<ul>）
     * @param  {Element} all  搜索区列表元素（<ol>）
     * @param  {Element} nav1 置顶区分页导航元素
     * @param  {Element} nav2 搜索区分页导航元素
     * @return {void}
     */
    shinit( evo, top, all, nav1, nav2 ) {
        __btnRedo = evo.data;
        nav1[__navPage] = new Pages( top, null, Limit.shListTop );
        nav2[__navPage] = new Pages( all, [], Limit.shListAll );
    },

    __shinit: 1,


    /**
     * 绑定历史编辑记录。
     * 仅需监测两个操作即可：
     * - nodeok 单个插入完成。如设置置顶，新条目插入置顶区（首页）。
     * - detached 删除操作。如直接删除和置顶/取消置顶附带的删除行为。
     * @data: Element 绑定记录事件的根元素
     * @return {boid}
     */
    shrecord( evo ) {
        $.on( evo.data, 'nodeok detached', null, __TQHistory );
    },

    __shrecord: 1,


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
    topsh( evo, top ) {
        let _sh = shObj( evo.data );

        _sh.top = top;
        __Store.set( evo.data, JSON.stringify(_sh) );
    },

    __topsh: 1,


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
     * 脚本历史导航。
     * where:
     * - 0  首页
     * - 1  前一页
     * - 2  后一页
     * - 3  末页
     * 页次状态：
     * - 0  到达首页（点按前一页或首页时）
     * - 1  到达末页（点按后一页或末页时）
     * 页次：从 1 开始。
     * @data: Element 导航根容器（<nav>）
     * @param  {Number} where 位置代码
     * @return {[[Number,Number], Element]} [[当前页次,页次状态], 页根元素]
     */
    shpage( evo, where ) {
        //
    },

    __shpage: 1,


    /**
     * 分页导航配置。
     * 即分页导航关联元素/按钮的初始状态设置。
     * - 首个返回值为总页数，用于数值提示。
     * - 第二个返回值为一个布尔值数组，对应4个页控制按钮状态。
     * @data: Element 导航根容器（<nav>）
     * @param  {[Object]} data 分页数据
     * @return {[Number，[Boolean]]} [首页根, 总页数, [disable]]
     */
    shnav( evo, data ) {
        let _pgo = evo.data[__navPage].data(data),
            _one = _pgo.pages() <= 1;
        return [
            _pgo.first(),
            _pgo.pages(),
            [ true, true, _one, _one ]
        ];
    },

    __shnav: 1,


    /**
     * 进入历史条目编辑。
     * @data: Element 分页导航元素
     * @return {void}
     */
    shEdin( evo ) {
        //
        __Editing = true;
    },

    __shEdin: 1,


    /**
     * 完成历史条目编辑。
     * @data: Element 分页导航元素
     * @return {void}
     */
    shEdok( evo ) {
        //
        __Editing = false;
    },

    __shEdok: 1,


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
     * 返回集按存储的先后顺序逆序排列。
     * - 空格：逻辑 AND
     * - 逗号：逻辑 OR
     * @data: String 待检索关键词串
     * @return {[Object]}
     */
    shsearch( evo ) {
        let _fun = xfilter(
                ...evo.data.split( ',' ).map( ws => ws.trim().split(/\s+/) )
            ),
            _buf = [];

        for ( const key of __Store.keys().reverse() ) {
            let _obj = shObj( key );
            _obj.code && _fun( _obj.code ) && _buf.push( _obj )
        }
        return _buf;
    },

    __shsearch: 1,

}


//
// 扩展到 By:Kit 空间。
// 注意与 edit.js 模块相同扩展的名称兼容。
//
processExtend( 'Kit', __Kit, [
    'shUndo',
    'shRedo',
    'shinit',
    'shrecord',
    'delsh',
    'topsh',
    'shlabel',
    'shEdin',
    'shEdok',
    'shpage',
    'shnav',
    'sh2panel',
    'shsearch',
]);


//
// On.v: 杂项取值。
//
customGetter( null, __Kit, [
    'shtops',
]);
