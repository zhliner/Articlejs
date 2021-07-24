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

    // 换页通知事件名。
    // 注意与模板中保持一致，下同。
    __evnPage = 'page',

    // 导航更新通知事件名。
    __evnState = 'state',

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
// 注意：
// 换页通过事件通知的方式执行，因此模板中的更新不能为延迟。
//
class PageEd {
    /**
     * @param {Element} nav 主控导航元素
     * @param {String} meth 换页方法（first|prev|next|last）
     */
    constructor( nav, meth ) {
        let _dp = nav[__DPage];
        // 旧下标
        this._idx = _dp.index();

        let _dds = shData( _dp[meth]() ),
            _i = _dp.index();

        this._nav = nav;
        this._new = nav[__Pager].page( _i, _dds );
        this._pgn = _i + 1;
        this._pgs = _dp.pages();

        // 外部只读
        this.count = null;
        this.redo();
    }


    undo() {
        if ( this.count > 0 ) {
            __TQHistory.back( this.count );
        }
        this._nav[__DPage].index( this._idx );
    }


    redo() {
        let _old = __TQHistory.size();

        navPage(
            this._nav, __evnPage, this._new, __evnState, this._pgn, this._pgs
        );
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
    $.trigger( __btnRedo, 'state', true );
    __History.push( ...obj.filter(v => v) );
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
    return _sh ? JSON.parse( _sh ) : null;
}


/**
 * 提取置顶条目ID清单。
 * @return {[String]} ID总集
 */
function topList() {
    let _buf = [];

    for ( const k of __Store.keys() ) {
        let _o = shObj( k );

        if ( _o && _o.top && _o.code ) {
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
 * 返回值数组附带成员: {
 *      edit:Boolean    是否可编辑态
 *      cmax:Number     代码行显示长度限制
 * }
 * @param  {[String]} list ID清单
 * @return {Array} 数据条目集
 */
function shData( list ) {
    list = $.map( list, shObj );

    list.edit = __Editing;
    list.cmax = Limit.shCodelen;

    return list;
}


/**
 * 换页并导航更新。
 * 通过事件触发更新换页和导航状态。
 * 注记：
 * 模板中定义的更新必须为非延迟执行，以使得管理状态下可正常撤销。
 * @param {Element} nav 分页导航元素
 * @param {String} evn1 换页通知事件名
 * @param {Element} el  目标列表页（新页）
 * @param {String} evn2 导航更新通知事件名
 * @param {Number} n    新目标页次
 * @param {Number} total 总页数
 */
function navPage( nav, evn1, el, evn2, n, total ) {
    $.trigger( nav, evn1, el );

    // [ [当前页次, 总页数], [Boolean-4] ]
    $.trigger( nav, evn2, [ [n, total], pageState(n, total)] );
}


/**
 * 构建当前页。
 * @param  {Element} nav 分页导航元素
 * @return {Element} 新的列表页
 */
function buildPage( dpo, epg ) {
    let _i = dpo.index();
    return epg.page( _i, shData(dpo.page(_i)) );
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

        if ( _o && _o.code && _fun(_o.code) ) {
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


/**
 * 存储代码。
 * @param  {String} code 代码文本
 * @return {void}
 */
function saveCode( code ) {
    if ( !code || codeSamed(code) ) {
        return;
    }
    let _k = uniqueKey(__Store),
        _o = {
            shid: _k,
            code: code,
            time: Date.now()
        };
    __Store.set( _k, JSON.stringify(_o) );
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
        __Editing &&
        historyPush( new DOMDel(evo.data), new SHDel(shid) );
    },

    __delsh: 1,


    /**
     * 条目置顶。
     * 无效条目（比如刚被删除）返回null，
     * 这样可使得置顶操作无效，从而提供一种“无效”的表意。
     * @data: String 条目ID
     * @return {String|null} 条目ID
     */
    topsh( evo ) {
        let _sh = shObj( evo.data );

        if ( _sh ) {
            _sh.top = true;
            __Store.set( evo.data, JSON.stringify(_sh) );
        }
        return _sh && evo.data;
    },

    __topsh: 1,


    /**
     * 取消置顶。
     * 注：返回null值的含义同上。
     * @data: String 条目ID
     * @return {String|null} 条目ID
     */
    untop( evo ) {
        let _sh = shObj( evo.data );

        if ( _sh ) {
            _sh.top = false;
            __Store.set( evo.data, JSON.stringify(_sh) );
        }
        return _sh && evo.data;
    },

    __untop: 1,


    /**
     * 设置脚本名称。
     * 通常仅用于置顶的条目（便于记忆）。
     * 返回条目ID和名称的二成员数组，用于另一区相同条目的同步。
     * 返回null时，UI通常会终止执行流。
     * @data: String 条目ID
     * @param  {String} name 待设置的名称
     * @return {[String]|null} [设置的名称, 条目ID]
     */
    shlabel( evo, name ) {
        let _sh = shObj( evo.data );

        if ( _sh ) {
            _sh.name = name;
            __Store.set( evo.data, JSON.stringify(_sh) );
        }
        return _sh && [ name, evo.data ];
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
        let _obj = new PageEd( evo.data, meth );
        if ( __Editing ) historyPush( _obj );
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
            _el = buildPage( _dp, nav[__Pager].reset() );

        navPage( nav, __evnPage, _el, __evnState, _dp.index()+1, _dp.pages() );
    },

    __shtops: 1,


    /**
     * 重构当前页。
     * 用于进入编辑后重构并缓存当前页。
     * @data: [Element] 两个分页导航元素（<nav>）
     * @return {[Element]} 两个新列表根（分别对应）。
     */
    shIndex( evo ) {
        __Editing = true;

        return evo.data.map(
            nav => buildPage( nav[__DPage], nav[__Pager].reset() )
        );
    },

    __shIndex: 1,


    /**
     * 进入历史条目编辑。
     * 监听的变化：
     * - nodeok 换页插入，导航页次提示更新（text）。
     * - detach 条目删除。
     * - attrdone(nav>b) 导航按钮状态更新。
     * @data: Element 绑定事件记录的根元素（<main>）
     * @return {void}
     */
    shEdin( evo ) {
        __History.clear();

        $.on( evo.data, 'nodeok emptied detach', null, __TQHistory );
        // 导航状态可恢复。
        $.on( evo.data, 'attrdone', 'nav >b', __TQHistory );
    },

    __shEdin: 1,


    /**
     * 完成历史条目编辑。
     * @data: Element 绑定记录事件的根元素（<main>）
     * @return {void}
     */
    shEdok( evo ) {
        __Editing = false;
        __History.clear();
        $.off( evo.data, 'nodeok emptied detach attrdone', false, __TQHistory );
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
     * - 空格：逻辑 AND
     * - 逗号：逻辑 OR
     * @data: String 待检索关键词串
     * @param  {Element} nav 搜索区分页导航元素
     * @return {void}
     */
    shsearch( evo, nav ) {
        let _dp = nav[__DPage].reset( search(evo.data) ),
            _el = buildPage( _dp, nav[__Pager].reset() );

        navPage( nav, __evnPage, _el, __evnState, _dp.index()+1, _dp.pages() );
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
        saveCode( evo.data );
    },

    __shsave: 1,

};


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
    'shpage',
    'shtops',
    'shEdin',
    'shEdok',
    'shIndex',
    'sh2panel',
    'shsearch',
    'shcode',
    'shsave',
]);


//
// 导出共享。
//
export { saveCode };


//:debug
// window.__Store = __Store;