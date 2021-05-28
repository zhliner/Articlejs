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
//  历史条目的编辑 撤销/重做 仅包含删除和换页，置顶和标签编辑不纳入。
//  这是因为置顶区和搜索区可能包含相同的条目，简化设计以回避同步的逻辑处理。
//
//  注记：
//  编辑时，置顶区的取消置顶操作并不会移除条目，而只是简单地切换为可置顶状态，
//  只有当用户点击完成按钮时，置顶区条目才会重置并清理掉非置顶项。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Sys, Limit } from "../config.js";
import { CStorage, History, DPage, Pager } from "./common.js";
import { processExtend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // 脚本历史DOM编辑历史栈。
    __TQHistory = new $.Fx.History(),

    // 脚本历史存储器。
    __Store = new CStorage( Sys.prefixScript ),

    // 脚本历史编辑器。
    __History = new History( Limit.shEdits, __TQHistory ),

    // 分页数据对象存储键。
    __DPage = Symbol( 'sh:dpage' ),

    // 分页器存储键。
    __Pager = Symbol( 'sh:pager' );


let
    // 主面板脚本表单
    __frmRoot = null,

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
// 换页操作。
// 因为条目删除进入历史，故换页也需要记录。
//
class PageEd {
    /**
     * @param {Pages} pgo 页集缓存实例
     * @param {Number} n  原先页次
     * @param {Element} old 原列表
     * @param {Element} nel 新列表
     */
    constructor( pgo, n, old, nel ) {
        this._pgo = pgo;
        this._idx = n;
        this._old = old;
        this._new = nel;
        this._pgn = pgo.index();
        // 外部只读
        this.count = null;
        this.redo();
    }


    undo() {
        if ( this.count > 0 ) {
            __TQHistory.back( this.count );
        }
        this._pgo.index( this._idx );
    }


    redo() {
        let _old = __TQHistory.size();

        $.replace( this._old, this._new );
        this._pgo.index( this._pgn );

        this.count = __TQHistory.size() - _old;
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
 * 获取历史脚本条目。
 * 如果条目不是一个对象，构造一个对象返回。
 * 对象成员：{
 *      shid:   条目标识
 *      name:   标签名称
 *      code:   代码文本
 *      top:    是否置顶
 *      time:   时间戳（毫秒）
 * }
 * @param  {String} sid 历史脚本ID
 * @return {Object}
 */
function shObj( sid ) {
    let _sh = __Store.get( sid );
    return _sh ? JSON.parse( _sh ) : { code: null };
}


/**
 * 提取置顶条目ID清单。
 * @return {[String]} ID总集
 */
function topList() {
    let _buf = [];

    for ( const k of __Store.keys() ) {
        let _o = shObj( k );

        if ( _o.top && _o.code ) {
            _buf.push( {id: _o.shid, tm: _o.time} );
        }
    }
    return _buf.sort( (a, b) => b.tm - a.tm ).map( o => o.id );
}


/**
 * 计算页导航状态。
 * 分别对应4个分页按钮的失效和可用状态。
 * 即：[
 *      首页, 前一页, 后一页, 末页
 * ]
 * 注：真值失效，假值可用。
 * @param {Number} cur 当前页次
 * @param {Number} sum 总页数
 */
function pageState( cur, sum ) {
    if ( sum <= 1 ) {
        return [true, true, true, true];
    }
    return [
        cur === 1,
        cur === 1,
        cur === sum,
        cur === sum,
    ];
}


/**
 * 提取脚本历史数据。
 * 返回值 Object: {
 *      edit:Boolean    是否可编辑态
 *      cmax:Number     代码行显示长度限制
 *      list:[Object]   历史脚本对象集
 * }
 * @param {[String]} list ID清单
 * @return {Object} 数据对象
 */
function shData( list ) {
    return {
        edit: __Editing,
        cmax: Limit.shCodelen,
        list: list.map( shObj )
    };
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


/**
 * 搜索目标脚本。
 * @param  {String} words 检索词序列
 * @return {[String]} 条目ID总集
 */
function search( words ) {
    let _fun = xfilter(
            ...words.split(',').map(ws => ws.trim().split(/\s+/))
        ),
        _buf = [];

    for ( const k of __Store.keys().reverse() ) {
        let _o = shObj( k );

        if ( _o.code && _fun(_o.code) ) {
            _buf.push( {id: _o.shid, tm: _o.time} );
        }
    }
    return _buf.sort( (a, b) => b.tm - a.tm ).map( o => o.id );
}


/**
 * 是否有相同代码。
 * @param  {String} code 对比的代码
 * @return {Boolean}
 */
function codeSamed( code ) {
    let _ks = __Store.keys();
    return _ks.some( k => shObj(k).code === code );
}


/**
 * 获取一个唯一键。
 * 简单地用当前时间的毫秒数表示，若有相同则加一个随机数。
 * 增量值取10天内的随机毫秒数。
 * @param  {CStorage} 存储器实例
 * @param  {Number} base 基础值
 * @return {String}
 */
function uniqueKey( buf, base = 0 ) {
    let _tm = Date.now() + base;

    if ( !buf.has(_tm) ) {
        return _tm;
    }
    return uniqueKey( buf, parseInt( Math.random()*240*3600*1000 ) );
}



//
// 辅助工具集（By扩展）。
//
const __Kit = {
    /**
     * 脚本面板初始化。
     */
    spinit( evo ) {
        __frmRoot = evo.data;
    },

    __spinit: 1,


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
     * @param  {Element} top  置顶区列表（<ul>）
     * @param  {Element} all  搜索区列表（<ol>）
     * @param  {Element} nav1 置顶区分页导航元素
     * @param  {Element} nav2 搜索区分页导航元素
     * @return {void}
     */
    shinit( evo, top, all, nav1, nav2 ) {
        __btnRedo = evo.data;
        nav1[__DPage] = new DPage( null, Limit.shListTop );
        nav1[__Pager] = new Pager( top );
        nav2[__DPage] = new DPage( null, Limit.shListAll );
        nav2[__Pager] = new Pager( all );
    },

    __shinit: 1,


    /**
     * 删除脚本历史条目。
     * @data: Element 条目元素（<li>）
     * @param  {String} shid 条目ID
     * @return {void}
     */
    delsh( evo, shid ) {
        historyPush( new DOMDel(evo.data), new SHDel(shid) );
    },

    __delsh: 1,


    /**
     * 条目置顶。
     * 注：只会出现在搜索区。
     * @data: String 条目ID
     * @return {String} 条目ID
     */
    topsh( evo ) {
        let _sh = shObj( evo.data );

        _sh.top = true;
        __Store.set( evo.data, JSON.stringify(_sh) );

        return evo.data;
    },

    __topsh: 1,


    /**
     * 取消置顶。
     * 通常针对置顶区，但页可能会出现在搜索区。
     * @data: String 条目ID
     * @return {String} 条目ID
     */
    untop( evo ) {
        let _sh = shObj( evo.data );

        _sh.top = false;
        __Store.set( evo.data, JSON.stringify(_sh) );

        return evo.data;
    },

    __untop: 1,


    /**
     * 设置脚本名称。
     * 仅置顶条目需要操作，但取消置顶不必移除名称。
     * 存储键：name
     * 返回条目ID和名称的二成员数组，用于另一区相同条目的同步。
     * @data: String 条目ID
     * @param  {String} name 待设置的名称
     * @return {[String]}
     */
    shlabel( evo, name ) {
        let _sh = shObj( evo.data );

        _sh.name = name;
        __Store.set( evo.data, JSON.stringify(_sh) );

        return [ name, evo.data ];
    },

    __shlabel: 1,


    /**
     * 脚本历史翻页。
     * meth:
     * - first  首页
     * - prev   前一页
     * - next   后一页
     * - last   末页
     * 换页通知：
     * - page   更新列表清单页
     * - state  更新导航页次状态
     *
     * @data: Element 主控元素（<nav>）
     * @param  {String} meth 换页方法名
     * @return {void}
     */
    shpage( evo, meth ) {
        let _pgo = evo.data[__navPage],
            _cur = _pgo.current(),
            _idx = _pgo.index(),
            _new = _pgo[meth]();

        historyPush( new PageEd(_pgo, _idx, _cur, _new) );
    },

    __shpage: 1,


    /**
     * 置顶条目初始设置。
     * 初始状态设置时为不可编辑态。
     * 事件通知：
     * - page   更新列表页。
     * - state  更新导航状态信息。
     * @data: Element 置顶分页导航（<nav>）
     * @return {void}
     */
    shtops( evo ) {
        let nav = evo.data,
            _dp = nav[__DPage].reset( topList() ),
            _el = nav[__Pager].page( shData(_dp.current()) ),
            _ps = _dp.pages();

        $.trigger( nav, 'page', _el );
        // [ [当前页次, 总页数], [Boolean-4] ]
        $.trigger( nav, 'state', [ [1, _ps], pageState(1, _ps) ] );
    },

    __shtops: 1,


    /**
     * 进入历史条目编辑。
     * 仅需监测两个操作即可：
     * - nodeok 单个插入完成。如设置置顶，新条目插入置顶区（首页）。
     * - detached 删除操作。如直接删除和置顶/取消置顶附带的删除行为。
     * @data: Element 绑定事件记录的根元素（<main>）
     * @return {void}
     */
    shEdin( evo ) {
        __Editing = true;

        $.on( evo.data, 'nodeok detach', null, __TQHistory );
        // 导航状态可恢复。
        $.on( evo.data, 'attrdone', 'nav >b', __TQHistory );
    },

    __shEdin: 1,


    /**
     * 完成历史条目编辑。
     * @data: Element 绑定记录事件的根元素（<main>）
     * @param  {Element} nav 置顶区分页导航元素
     * @return {void}
     */
    shEdok( evo, nav ) {
        __Editing = false;
        __History.clear();

        $.off( evo.data, 'nodeok detach attrdone', false, __TQHistory );
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
        return search( evo.data );
    },

    __shsearch: 1,


    /**
     * 历史代码回填。
     */
    shcode( evo ) {
        $.trigger( __frmRoot, 'shcode', evo.data );
    },

    __shcode: 1,


    /**
     * 脚本保存。
     * 判断脚本是否相同，不同才存储。
     * 注：代码已在前阶正常执行且有内容。
     * @data: String 脚本代码。
     * @return {void}
     */
    shsave( evo ) {
        if ( codeSamed(evo.data) ) {
            return;
        }
        let _k = uniqueKey(__Store),
            _o = {
                shid: _k,
                code: evo.data,
                timestamp: Date.now()
            };
        __Store.set( _k, JSON.stringify(_o) );
    },

    __shsave: 1,

}


//
// 扩展到 By:Kit 空间。
// 注意与 edit.js 模块相同扩展的名称兼容。
//
processExtend( 'Kit', __Kit, [
    'spinit',
    'shUndo',
    'shRedo',
    'shinit',
    'delsh',
    'topsh',
    'untop',
    'shlabel',
    'shEdin',
    'shEdok',
    'shpage',
    'shtops',
    'sh2panel',
    'shsearch',
    'shcode',
    'shsave',
]);


window.__Store = __Store;