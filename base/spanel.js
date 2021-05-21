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
import { CStorage, datetime, History, Pages } from "./common.js";
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
 * 获取历史脚本存储条目。
 * 如果条目不是一个对象，构造一个对象返回。
 * 对象格式：{
 *      shid:   条目标识
 *      name:   标签名称
 *      code:   代码文本
 *      top:    是否置顶
 *      datetime: 更新时间
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

        if ( _o.top && _o.code ) {
            _o.cmax = Limit.shCodelen;
            _buf.push( _o );
        }
    }
    return _buf;
}


/**
 * 计算页导航状态。
 * 分别对应4个分页按钮的失效/可用。
 * 即：[首页, 前一页, 后一页, 末页]
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
 * @return {[Object]}
 */
function search( words ) {
    let _fun = xfilter(
            ...words.split(',').map(ws => ws.trim().split(/\s+/))
        ),
        _buf = [];

    for ( const key of __Store.keys().reverse() ) {
        let _obj = shObj(key);

        if ( _obj.code && _fun(_obj.code) ) {
            _obj.cmax = Limit.shCodelen;
            _buf.push( _obj );
        }
    }
    return _buf;
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
 * 获取一个唯一键（代码存储）。
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


    /**
     * 分页导航状态取值。
     * @data: Element 导航根容器（<nav>）
     * @return {[Number, [Boolean]]} [当前页次, [页次状态]]
     */
    shnav( evo ) {
        let _pgo = evo.data[__navPage],
            _n = _pgo.index() + 1;

        return [ _n, pageState(_n, _pgo.pages()) ];
    },

    __shnav: 1,


    //-- By扩展 --------------------------------------------------------------


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
     * @return {void}
     */
    topsh( evo ) {
        let _sh = shObj( evo.data );

        _sh.top = true;
        __Store.set( evo.data, JSON.stringify(_sh) );
    },

    __topsh: 1,


    /**
     * 取消置顶。
     * 通常针对置顶区，但页可能会出现在搜索区。
     * @data: String 条目ID
     * @return {void}
     */
    untop( evo ) {
        let _sh = shObj( evo.data );

        _sh.top = false;
        __Store.set( evo.data, JSON.stringify(_sh) );
    },

    __untop: 1,


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
     * 脚本历史翻页。
     * where:
     * - 0  首页
     * - 1  前一页
     * - 2  后一页
     * - 3  末页
     * @data: Element 导航根容器（<nav>）
     * @param  {Number} where 位置代码
     * @return {void}
     */
    shpage( evo, where ) {
        let _pgo = evo.data[__navPage],
            _cur = _pgo.current(),
            _idx = _pgo.index(),
            _new = null;

        switch ( where ) {
            case 0:
                _new = _pgo.first(); break;
            case 1:
                _new = _pgo.prev(); break;
            case 2:
                _new = _pgo.next(); break;
            case 3:
                _new = _pgo.last(); break;
        }
        historyPush( new PageEd(_pgo, _idx, _cur, _new) );
    },

    __shpage: 1,


    /**
     * 分页导航配置。
     * 即分页导航关联元素/按钮的初始状态设置。
     * - 首个返回值为总页数，用于数值提示。
     * - 第二个返回值为一个布尔值数组，对应4个页控制按钮状态。
     * @data: Element 导航根容器（<nav>）
     * @param  {[Object]} data 分页数据
     * @return {[Number，[Boolean]]} [首页根, 总页数, [页次状态]]
     */
    shconf( evo, data ) {
        let _pgo = evo.data[__navPage].data(data);

        return [
            _pgo.first(),
            _pgo.pages(),
            pageState( _pgo.index()+1, _pgo.pages() )
        ];
    },

    __shconf: 1,


    /**
     * 进入历史条目编辑。
     * 仅需监测两个操作即可：
     * - nodeok 单个插入完成。如设置置顶，新条目插入置顶区（首页）。
     * - detached 删除操作。如直接删除和置顶/取消置顶附带的删除行为。
     * @data: Element 绑定记录事件的根元素（<main>）
     * @return {void}
     */
    shEdin( evo ) {
        __Editing = true;
        $.on( evo.data, 'nodeok detached', null, __TQHistory );
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
        $.off( evo.data, 'nodeok detached', null, __TQHistory );
        $.trigger( nav, 'reset', topObjs() );
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
                datetime: datetime()
            };
        __Store.set( _k, JSON.stringify(_o) );
    },

    __shsave: 1,


    /**
     * 脚本执行结果插入。
     * 如果位置未定义（空串），则简单忽略。
     * 提交的错误信息也可以被执行插入。
     * @param  {String} type 内容类型（text|html）
     * @param  {String} where 插入位置（6种基本方法）
     * @return {void}
     */
    sresult( evo, type, where ) {
        if ( !where ) {
            return;
        }
        window.console.info( evo.data, type, where );
    },

    __sresult: 1,

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
    'shconf',
    'sh2panel',
    'shsearch',
    'shcode',
    'shsave',
    'sresult',
]);


//
// On.v: 杂项取值。
//
customGetter( null, __Kit, [
    'shtops',
    'shnav',
]);
