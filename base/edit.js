//! $Id: edit.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  基本编辑。
//
//  包含普通模式下的选取、移动、样式/源码的设置，以及临时态的操作。
//
//  注记：
//  元素选取包含在编辑历史的记录里（可Undo/Redo），但选取焦点的移动不包含。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { Templater } from "./tpb/config.js";
import { Sys, Limit, Help, Tips } from "../config.js";
import { processExtend } from "./tpb/pbs.by.js";
import { customGetter } from "./tpb/pbs.get.js";
import { isContent, isCovert, virtualBox, contentBoxes, tableObj, tableNode, cloneElement, getType, sectionChange, isFixed, afterFixed, beforeFixed, isOnly, isChapter, isCompatibled, compatibleNoit, sectionState } from "./base.js";
import * as T from "./types.js";  // ./base.js 之后
import { ESet, EHot, ECursor, prevNodeN, nextNodeN, elem2Swap, prevMoveEnd, nextMoveEnd, parseJSON } from './common.js';
import { halfWidth, rangeTextLine, minInds, shortIndent, tabToSpace } from "./coding.js";
import { children, create, tocList, convType, convData, convToType } from "./create.js";
import { options, property } from "./templates.js";
import cfg from "./shortcuts.js";

// 代码解析&高亮
import { Hicolor } from "../plugins/hlcolor/main.js";
import { colorHTML, htmlBlock, htmlList } from "./coloring.js";


const
    $ = window.$,

    Normalize = $.Fx.History.Normalize,

    // 编辑区需要监听的变化（历史记录）。
    varyEvents = 'attrdone styledone nodesdone emptied detached normalize',

    // 临时类名序列。
    __tmpcls = `${Sys.selectedClass} ${Sys.focusClass}`,

    // 临时类名选择器。
    __tmpclsSlr = `.${Sys.selectedClass}, .${Sys.focusClass}`,

    // 路径单元存储键。
    // 在路径序列元素上存储源元素。
    __linkElem = Symbol(),

    // 空白匹配。
    __reSpace = /\s+/g,

    // 空白行匹配。
    // 用于录入区内容空行分段。
    __reBlankline = /\n\s*\n/,

    // 连续空白匹配。
    // 用于录入区内容空白清理。
    __reSpaceN = /(\s)\s*/g,

    // 兼容换行匹配。
    // 粘贴的内容可能包含多种换行表示。
    __reNewline = /\r\n|\n|\r/,

    // 章节容器匹配。
    __reSecbox  = /section|article/i,

    // 微编辑：
    // 智能逻辑行适用集。
    // 源行类型：[新行标签名, 父类型约束]
    // 注记：不支持 <td|th> ~ <tr>（新行单元格选取逻辑问题）
    __medLLineMap = {
        [ T.DT ]:       [ 'dd', T.DL ],
        [ T.SUMMARY ]:  [ 'p',  T.DETAILS ],
        [ T.H3 ]:       [ 'p',  T.ABSTRACT ],
        [ T.H3 ]:       [ 'p',  T.HEADER ],
        [ T.H3 ]:       [ 'p',  T.FOOTER ],
        [ T.H3 ]:       [ 'p',  T.BLOCKQUOTE ],
        [ T.H3 ]:       [ 'p',  T.ASIDE ],
    },

    // 微编辑：
    // 同类新行适用集。
    __medNewLines = new Set([
        T.LI,
        T.DT,
        T.DD,
        T.P, T.TIPS, T.NOTE,
        T.ADDRESS,
    ]),

    // 上下文菜单条目处理。
    // 对应相应的操作函数（Edit.xxx）。
    __cmenuOpers = {
        minied:     'miniedIn',
        toup:       'indentReduce',
        todown:     'indentIncrease',
        delete:     'deletes',
        property:   'properties',
    },

    // 插入位置选单处理器。
    // 用于根据焦点元素提取可插入条目选单集。
    __levelHandles = {
        children:   childOptions,
        siblings:   siblingOptions,
    },

    // 元素选取集实例。
    __ESet = new ESet( Sys.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Sys.focusClass ),

    // 光标实现实例。
    // 仅用于内容元素的微编辑。
    __eCursor = new ECursor(),

    // DOM节点变化历史实例。
    __TQHistory = new $.Fx.History();



//
// 编辑历史管理器。
// 管理内部实现了 undo/redo 接口的编辑处理实例。
// 支持成组的编辑实例一次性操作。
//
class History {
    /**
     * 构造一个编辑实例。
     * @param {Number} size 编辑历史长度
     */
    constructor( size ) {
        this._max = size;
        this._buf = [];
        this._idx = -1;  // 游标
    }


    /**
     * 入栈一个操作。
     * 仅作为单个实体压入。
     * @param  {...Instance} objs 操作实例序列
     * @return {[Instance]|false} 头部被移出的操作实例序列
     */
    push( ...objs ) {
        if ( !objs.length ) return;

        // 新入截断。
        this._buf.length = ++this._idx;
        let _len = this._buf.push( objs );

        return ( _len - this._max ) > 0 && this._shift();
    }


    /**
     * 栈顶弹出并执行。
     * 用于模拟“取消”行为（微编辑）。
     */
    pop() {
        let _obj = this._buf.pop();
        this._idx --;

        _obj.slice().reverse().forEach( o => o.undo() );
    }


    /**
     * 撤销一步。
     */
    undo() {
        if ( this._idx < 0 ) {
            return warn('[undo] overflow.');
        }
        let _obj = this._buf[ this._idx-- ];

        // 副本避免被修改。
        _obj.slice().reverse().forEach( o => o.undo() );
    }


    /**
     * 重做一步。
     * 操作实例可能是一个数组。
     */
    redo() {
        if ( this._idx >= this._buf.length - 1 ) {
            return warn('[redo] overflow.');
        }
        this._buf[ ++this._idx ].forEach( o => o.redo() );
    }


    /**
     * 是否可执行撤销。
     * 注记：撤销在当前实例上执行。
     * @return {Boolean}
     */
    canUndo() {
        return this._idx >= 0;
    }


    /**
     * 是否可执行重做。
     * 注记：重做在下一个实例上开启。
     * @return {Boolean}
     */
    canRedo() {
        return this._idx < this._buf.length - 1;
    }


    /**
     * 历史栈头部移除。
     * 游标从头部算起，因此需要同步减1。
     * 注记：
     * 仅 DOMEdit 实例包含 count 属性。
     */
    _shift() {
        let _obj = this._buf.shift();
        this._idx--;

        _obj.forEach( o => o.count && __TQHistory.prune(o.count) );
    }
}


//
// 节点编辑类。
// 封装用户的单次DOM编辑（可能牵涉多个节点变化）。
// 实际上为操作全局的 __TQHistory 实例。
// 注记：
// 用户需要配置 tQuery:config() 启用节点变化事件通知机制。
//
class DOMEdit {
    /**
     * 构造一个编辑实例。
     * @param {Function} handle 操作函数
     * @param {...Value} args 实参序列
     */
    constructor( handle, ...args ) {
        this._fun = handle;
        this._vals = args;
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

        this._fun( ...this._vals );
        this.count = __TQHistory.size() - _old;
    }
}


//
// 元素选取集编辑。
//
class ESEdit {
    /**
     * 创建一个操作单元。
     * 友好：未传递新的焦点元素表示焦点不变。
     * @param {Function} handle 选取操作函数
     * @param {...Value} args 实参序列
     */
    constructor( handle, ...args ) {
        this._fun = handle;
        this._vals = args;
        this._old = [...__ESet];

        this.redo();
    }


    /**
     * 撤销选取。
     */
    undo() {
        __ESet.clear().pushes( this._old );
        delayFire( insertWhere, Sys.evnLevel, this._old );
    }


    /**
     * 重新选取。
     */
    redo() {
        this._fun( ...this._vals );
        delayFire( insertWhere, Sys.evnLevel, [...__ESet] );
    }
}


//
// 焦点编辑。
// 用于编辑中的焦点取消和恢复。
// 注记：
// 用户选取焦点无需进入历史栈。
//
class HotEdit {
    /**
     * 无实参传构造记录当前焦点，
     * 这在序列操作时有用，避免焦点移动到可撤销区被撤销式移除。
     * @param {Element} hot 新焦点
     */
    constructor( hot = __EHot.get() ) {
        this._hot = hot;
        this._old = setFocus( hot );
    }


    undo() {
        setFocus( this._old );
    }


    redo() {
        setFocus( this._hot );
    }
}


//
// 选区编辑。
// 用于鼠标划选创建内联单元时。
// 外部：
// - 范围的首尾点需要在同一父元素内（完整嵌套）。
// - 范围所在的容器元素需要预先.normalize。
// 注记：
// 部分内联单元也有结构（如<ruby>），因此由create创建。
//
class RngEdit {
    /**
     * @param {Range} rng 范围对象
     * @param {String} name 单元名（tag|role）
     */
    constructor( rng, name ) {
        this._el = create(
            name,
            ...this._optData(name, rng)
        );
        this._old = [
            ...rng.extractContents().childNodes
        ];
        rng.detach();
        rng.insertNode( this._el );

        this._tmp = null;
    }


    undo() {
        let _box = this._el.parentElement;

        // DOM内使用原生接口
        this._el.replaceWith( ...this._old );

        // 碎片记忆（便于redo）
        this._tmp = new Normalize( _box );

        // 原生接口
        _box.normalize();
    }


    redo() {
        // 使this._old引用有效
        this._tmp.back();

        this._old
            .slice(1)
            .forEach( nd => nd.remove() );

        this._old[0].replaceWith( this._el );
    }


    /**
     * 获取新建元素。
     */
    elem() {
        return this._el;
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 解析选项配置和数据。
     * 分析文本内容智能判断提取选项，
     * 主要针对<ruby>和<a>单元。
     * @param  {String} name 单元名
     * @param  {Range} rng 选取范围
     * @return {[Object, Value]} 配置对象和数据值对
     */
    _optData( name, rng ) {
        let _fn = this[ `_${name}` ];
        return _fn ? _fn( rng.toString(), rng ) : [ null, rng.cloneContents() ];
    }


    /**
     * 分析构造链接配置。
     * 链接格式容错两端空白，但文本原样保持。
     * @param  {String} text 链接文本
     * @param  {Range} rng 选取范围
     * @return {[Object, Value]} 配置对象和数据值对
     */
    _a( text, rng ) {
        return [
            RngEdit.url.test(text.trim()) && { href: text },
            rng.cloneContents()
        ];
    }


    /**
     * 分析提取注音配置。
     * 友好：格式匹配取值忽略两端的空白。
     * @param  {String} text 注音文本
     * @param  {Range} rng 选取范围
     * @return {[Object, Value]} 配置对象和数据值对
     */
    _ruby( text, rng ) {
        let _vs = text
            .trim()
            .match( RngEdit.ruby );

        return _vs ? [ {rt: _vs[2]}, _vs[1] ] : [ null, rng.cloneContents() ];
    }
}

//
// 链接URL匹配模式。
// 主机部分严格约束，路径/查询部分宽泛匹配。
//
RngEdit.url  = /^(?:http|https|ftp|email):\/\/[\w.-]+\/\S+$/i;

//
// <ruby>匹配提取模式。
// 格式：/文本(拼音)/
// 文本：任意非空白字符（容许空格）
// 拼音：[À-ž ㄅ-ㄭ] （容许空格）
//
RngEdit.ruby = RegExp( `^([\\S\\x20]+)\\${Sys.rpLeft}([\\w\\u00c0-\\u017e\\u3105-\\u312d ]+)\\${Sys.rpRight}$`, 'i' );


//
// 微编辑管理。
// 管理初始进入微编辑状态以及确认或取消。
// 提供内容整体的撤销和重做。
// 提供单击点即为活动插入点（单击点不在元素内部时为全选状态）。
// 外部：
// 被编辑的内容元素应当已规范（文本节点连续，如被normalize过）。
// 注记：
// 用一个新的元素执行微编辑以保持撤销后的引用有效。
// 使用原生DOM接口，避免tQuery相关事件激发记录。
//
class MiniEdit {
    /**
     * 创建管理实例。
     * 管理元素的可编辑状态，在进入微编辑前构造。
     * rng为false时表示单击点在外部，此时全选目标内容。
     * @param {Element} el 内容元素
     * @param {Range} rng 范围对象（插入点）
     */
    constructor( el, rng ) {
        this._cp = this._clone( el, rng );
        this._el = el;

        // 原生调用。
        el.replaceWith( this._cp );
        this._cp.setAttribute( 'contenteditable', true );
    }


    /**
     * 激活光标。
     * 如果当前单击点在元素内，设置光标到单击点，
     * 否则为全选可编辑内容。
     * @return {this}
     */
    active() {
        __eCursor.active( this._cp );
    }


    /**
     * 激活光标到内容末尾。
     * @return {this}
     */
    activeEnd() {
        __eCursor.active2( this._cp, false );
    }


    /**
     * 微编辑完成。
     * @return {Element} 新完成的元素
     */
    done() {
        this._clean( this._cp );

        // 原生调用不进入历史栈。
        this._cp.normalize();
        this._cp.removeAttribute( 'contenteditable' );

        return this._cp;
    }


    /**
     * 获取当前编辑的元素。
     * @return {Element}
     */
    elem() {
        return this._cp;
    }


    /**
     * 获取原始编辑元素。
     * @return {Element}
     */
    original() {
        return this._el;
    }


    /**
     * 撤销微编辑的结果。
     */
    undo() {
        this._cp.replaceWith( this._el );
    }


    /**
     * 恢复微编辑的结果。
     * 不再进入微编辑，新的元素用于之后的引用。
     */
    redo() {
        this._el.replaceWith( this._cp );
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 创建用于微编辑的新元素。
     * 包含可能需要的光标标记元素。
     * @param {Element} el 内容元素
     * @param {Range} rng 范围对象，可选
     */
    _clone( el, rng ) {
        __eCursor.cursor( el, rng );

        // 含可能的光标占位元素。
        let _new = $.clone( el, true, true, true );

        return __eCursor.clean( el ), _new;
    }


    /**
     * 清理目标元素内容。
     * - 替换 <pre> 和 <code> 内的 <br> 元素为换行字符（\n），
     *   确保不同浏览器的兼容性。
     * - 解包非代码内的 <b> 和 <i> 直接子元素，
     *   它们由浏览器默认行为带来（格式元素删除后遗留了样式）。
     * @param {Element} el 目标元素
     */
    _clean( el ) {
        let _tv = getType( el );

        if ( _tv === T.PRE || _tv === T.CODE ) {
            cleanCall( () => $('br', el).replace( '\n' ) );
        }
        if ( _tv !== T.CODE ) {
            cleanCall( () => $('>b, >i', el).unwrap() );
        }
    }
}



//
// 操作单元。
//////////////////////////////////////////////////////////////////////////////


//
// 元素选取操作。
// 各方法对应到用户的快捷选取操作类型。
//
class ElemSels {
    /**
     * @param {ESet} eset 选取集实例引用
     */
    constructor( eset ) {
        this._set = eset;
    }


    //-- 基本操作 ------------------------------------------------------------
    // 注：返回false表示操作无效


    /**
     * 排它选取。
     * 会先清空整个集合。
     * 友好：忽略简单的重复单击。
     * @行为：单击
     * @param {Element} el 目标元素
     */
    only( el ) {
        if ( this._set.size == 1 && this._set.has(el) ) {
            return false;
        }
        this._set.clear();
        this._set.add( el );
    }


    /**
     * 切换选取。
     * 已存在则移除，否则为添加。
     * 注意：
     * 目标元素可能是已选取元素的子元素，因此仍需考虑父子包含关系。
     * @行为：Ctrl+单击
     * @param {Element} el 焦点/目标元素
     */
    turn( el ) {
        if ( this._set.has(el) ) {
            this._set.delete(el);
        } else {
            this.clean(el)._set.add(el);
        }
    }


    /**
     * 集合反选。
     * 已经存在的移除，否则添加。
     * 添加的元素中，其子元素可能已经选取（故需滤除）。
     * @param {[Element]} els 元素集
     */
    reverse( els ) {
        for ( const el of els ) {
            this._set.has(el) ? this._set.delete(el) : this._parentAdd(el);
        }
    }


    /**
     * 元素扩展：添加/移出。
     * 假设父容器未选取，外部需要保证此约束。
     * @param {[Element]} els 元素序列
     * @param {Element} hot 焦点元素引用
     */
    expand( els, hot ) {
        return this._set.has(hot) ? this.adds(els) : this.removes(els);
    }


    /**
     * 元素集添加。
     * 新成员可能是集合内成员的父元素。
     * 假设父容器未选取，外部需要保证此约束。
     * @param {[Element]} els 兄弟元素集
     */
    adds( els ) {
        els.forEach(
            el => this._set.has(el) || this._parentAdd(el)
        );
    }


    /**
     * 元素集移出。
     * @param {[Element]} els 元素集
     */
    removes( els ) {
        els.forEach(
            el => this._set.has(el) && this._set.delete(el)
        );
    }


    /**
     * 清除全部选取。
     * 友好：空集时简单忽略。
     */
    empty() {
        if ( this._set.size == 0 ) {
            return false;
        }
        this._set.clear();
    }


    /**
     * 普通添加。
     * 会检查父子包含关系并清理。
     * 如果已经选取则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        this._set.has(el) || this.clean(el)._set.add(el);
    }


    /**
     * 安全添加。
     * 外部需要自行清理父子已选取。
     * @param {Element} el 选取元素
     */
    safeAdd( el ) {
        this._set.has(el) || this._set.add(el);
    }


    /**
     * 安全添加元素集。
     * 外部保证父子选取已清理。
     * @param {[Element]} els 元素集
     */
    safeAdds( els ) {
        this._set.pushes( els );
    }


    /**
     * 简单移除。
     * @param  {Element} el 选取元素
     * @return {el|false}
     */
    delete( el ) {
        return this._set.has(el) && this._set.delete(el);
    }


    /**
     * 头部添加。
     * 将新元素集插入到集合的头部。
     * 注记：
     * 容许新集合中的元素与选取集内的成员重合。
     *
     * @param {[Element]} els 元素集
     */
    unshift( els ) {
        let _tmp = [...this._set];

        if ( _tmp.length ) {
            this._set.clear();
        }
        this.adds( els.concat(_tmp) );
    }


    /**
     * 向上父级清理。
     * 检索集合内包含目标子元素的成员并清除其选取。
     * 即清理目标元素的上级已选取。
     * 如果不存在上级选取，返回 false。
     * @param  {Element} el 目标子元素
     * @return {this|false}
     */
    cleanUp( el ) {
        let _box = this._parentItem(el);

        if ( !_box ) {
            return false;
        }
        return this._set.delete( _box ), this;
    }


    /**
     * 向下子级清理。
     * 检索集合内为目标元素子元素的成员并清除其选取。
     * 即清理目标元素的子级已选取，可能包含多个成员。
     * 如果未实际执行清理，返回 false。
     * @param  {Element} el 目标父元素
     * @return {this|false}
     */
    cleanDown( el ) {
        let _els = this._contains(el);

        if ( !_els.length ) {
            return false;
        }
        _els.forEach(
            sub => this._set.delete( sub )
        )
        return this;
    }


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 注记：不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素
     * @return {this|false} 当前实例
     */
    clean( el ) {
        return this.cleanUp(el) || this.cleanDown(el) || this;
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 父级添加。
     * 会清除集合内属于子级元素的选取。
     * @param {Element} el 父元素
     */
    _parentAdd( el ) {
        this.cleanDown( el );
        this._set.add( el );
    }


    /**
     * 父级选取检索。
     * 找出集合中包含目标子节点的成员。
     * 原集合中成员不存在父子关系，因此仅需一次匹配。
     * 返回null表示无成员匹配。
     * 用途：
     * 选取子元素后清除父级选取成员。
     *
     * @param  {Element} sub 子节点
     * @return {Element|null}
     */
    _parentItem( sub ) {
        for ( const el of this._set ) {
            if ( $.contains(el, sub, true) ) return el;
        }
        return null;
    }


    /**
     * 子包含过滤。
     * 找出集合中为目标元素子孙元素的成员。
     * @param  {Element} el 父元素
     * @return {[Element]}
     */
    _contains( el ) {
        let _buf = [];

        this._set.forEach(
            it => $.contains(el, it, true) && _buf.push(it)
        );
        return _buf;
    }

}


//
// 元素节点操作。
// 节点删除、移动、克隆，元素的样式设置、清除等。
// 约定：
// 内部方法不互为调用（this），因为方法会被独立引用。
//
class NodeVary {
    /**
     * 内容文本化。
     * @param {Collector} $els 处理集
     */
    toText( $els ) {
        $els.text( $els.text() );
    }


    /**
     * 内容提升。
     * 会对成员的公共父元素执行文本规范化。
     * 注记：集合成员本身不会有嵌套。
     * @param {Collector} $els 处理集
     */
    unWrap( $els ) {
        let _set = new Set();

        $els.forEach(
            el => _set.add( el.parentElement )
        );
        $els.unwrap();

        $(_set).normalize();
    }


    /**
     * 新建插入其后。
     * @param {Element} el 参考元素
     * @param {Node|[Node]} data 数据节点
     */
    newAfter( el, data ) {
        $.after( el, data );
    }


    /**
     * 新建插入其前。
     * @param {Element} el 参考元素
     * @param {Node|[Node]} data 数据节点
     */
    newBefore( el, data ) {
        $.before( el, data );
    }


    /**
     * 新建向内前插入。
     * @param {Element} box 容器元素
     * @param {Node|[Node]} data 数据节点
     */
    newPrepend( box, data ) {
        $.prepend( box, data );
    }


    /**
     * 新建向内末尾添加。
     * @param {Element} box 容器元素
     * @param {Node|[Node]} data 数据节点
     */
    newAppend( box, data ) {
        $.append( box, data );
    }


    /**
     * 克隆后插入。
     * 将新元素（集）一一对应下标插入参考元素之后。
     * 主要用于原地克隆。
     * 注：两个集合大小一样。
     * @param {[Element]} ref 参考元素集
     * @param {[Element]} els 新元素集（支持二维）
     */
    cloneAfter( ref, els ) {
        ref.forEach(
            (el, i) => $.after( el, els[i] )
        );
    }


    /**
     * 简单向内添加。
     * @param {[Element]} els 容器元素集
     * @param {String|[String]} data 数据（集）
     */
    appends( els, data ) {
        els.forEach(
            el => $.append( el, data )
        )
    }


    /**
     * 简单填充。
     * @param {[Element]} els 容器元素集
     * @param {Value|[Value]} data 数据（集）
     */
    fills( els, data ) {
        els.forEach(
            el => $.fill( el, data )
        );
    }


    /**
     * 整齐替换。
     * 两个集合成员为一一对应关系。
     * @param {[Element]} els 目标元素集
     * @param {[Element]} data 数据元素集
     */
    replaces( els, data ) {
        els.forEach(
            (el, i) => $.replace( el, data[i] )
        );
    }


    /**
     * 替换并移除多余。
     * 以目标集首个成员为替换位置，并移除其余目标成员。
     * @param {[Element]} els 目标元素集
     * @param {[Element]} data 数据元素集
     */
    replacex( els, data ) {
        $.replace( els[0], data );

        els.slice(1)
        .forEach( el => $.remove(el) );
    }


    /**
     * 向内添加元素集。
     * 如果有同级兄弟节点参考，则插入之前。
     * @param {Element|null} ref 插入参考（兄弟元素）
     * @param {Element} box 父容器元素
     * @param {[Element]} data 数据集
     */
    insert( ref, box, data ) {
        if ( ref ) {
            $.before( ref, data );
        } else {
            $.append( box, data );
        }
    }


    /**
     * 逆序化。
     * 会保持元素原始的位置。
     * @param {[[Element]]} els2 兄弟元素集组
     */
    reverses( els2 ) {
        for ( const els of els2 ) {
            let _end = els.length - 1;

            for ( let i = 0; i < parseInt(els.length/2); i++ ) {
                elem2Swap( els[i], els[_end-i] );
            }
        }
    }


    /**
     * 内容合并。
     * 如果可以，会移除被合并内容的父元素。
     * @param {Element} box 目标容器
     * @param {[Element]} subs 待合并的子元素集
     * @param {Collector} $els 父元素集引用
     */
    merges( box, subs, $els ) {
        $.append( box, subs );
        $els.filter( canDelete ).remove();
    }


    /**
     * 移动前插入。
     * 将同级兄弟元素向前移动/克隆到指定距离。
     * 超出范围的距离会导致部分或全部逆序插入。
     * 零值距离表示端部，汇集插入。
     * @param {[[Element]]} els2 兄弟元素集组
     * @param {Number} n 前端距离
     */
    movePrev( els2, n ) {
        for ( const els of els2 ) {
            if ( n === 0 ) {
                $.before( prevNodeN(els[0], Infinity), els );
            } else {
                els.forEach( el => $.before(prevNodeN(el, n), el) );
            }
        }
    }


    /**
     * 移动后插入。
     * 将同级兄弟元素向后移动/克隆到指定距离。
     * 其它说明参考movePrev。
     * @param {[[Element]]} els2 兄弟元素集组
     * @param {Number} n 后端距离
     */
    moveNext( els2, n ) {
        for ( const els of els2 ) {
            if ( n === 0 ) {
                $.after( nextNodeN(last(els), Infinity), els );
            } else {
                els.reverse()
                .forEach( el => $.after(nextNodeN(el, n), el) );
            }
        }
    }


    /**
     * 多个章节提升。
     * 检查焦点更新，因为DOM路径已变化。
     * @param {[Element]} secs 章节元素集
     */
    sectionsUp( secs ) {
        secs.forEach( el => sectionUp(el) );
        updateFocus();
    }


    /**
     * 多个章节降级。
     * 检查焦点更新，因为DOM路径已变化。
     * @param {[[Element]]} els2 [章节元素，空容器]对集
     */
    sectionsDown( els2 ) {
        els2.forEach(
            els => sectionDown(els[0], els[1])
        );
        updateFocus();
    }


    /**
     * 设置样式（多个）。
     * 全部元素统一设置为相同的值。
     * 注记：
     * 单纯的样式设置可以在OBT模板中完成，
     * 但因为需要进入历史栈，故在此操作。
     * @param {[Element]} els 元素集
     * @param {String|Object} names 样式名序列或样式配置对象
     * @param {Value|[Value]} val
     */
    styles( els, names, val ) {
        els.forEach(
            el => $.cssSets( el, names, val )
        );
    }


    /**
     * 样式设置（单个）。
     * 全部元素统一设置为相同的值。
     * @param {[Element]} els 元素集
     * @param {String} name 样式名
     * @param {Value} val 样式值
     */
    style( els, name, val ) {
        els.forEach(
            el => $.css( el, name, val )
        );
    }
}


//
// 全局操作对象。
//////////////////////////////////////////////////////////////////////////////


const
    // 元素选取集操作实例。
    __Selects = new ElemSels( __ESet ),

    // 元素修改操作实例。
    __Edits = new NodeVary(),

    // 编辑器操作历史。
    __History = new History( Limit.history );


let
    // 内容根元素。
    contentElem = null,

    // 路径信息容器。
    pathContainer = null,

    // 出错信息容器
    errContainer = null,

    // 大纲视图容器
    // 用于目录适时更新。
    outlineElem = null,

    // 工具栏中段按钮（微编辑下隐藏）。
    midtoolElem = null,

    // 模态框根元素
    modalDialog = null,

    // 主面板内容标签容器
    slaveInsert = null,

    // 主面板内容插入位置根容器
    insertWhere = null,

    // 当前微编辑对象暂存。
    currentMinied = null;




//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 历史栈压入。
 * - 封装 Undo/Redo 状态通知。
 * - 清除出错帮助提示。
 * 容错空值实参成员。
 * @param {...Instance} obj 操作实例序列
 */
function historyPush( ...obj ) {
    stateNewEdit();
    help( null );
    __History.push( ...obj.filter(v => v) );
}


/**
 * 执行了一个新编辑。
 * 重做不可用，更新 Undo/Redo 按钮状态。
 */
function stateNewEdit() {
    $.trigger( contentElem, Sys.redoEvent, false, true );
}


/**
 * 构建元素路径序列。
 * 返回沿DOM树正向逐层元素信息的一个<b>封装序列。
 * @param  {Element} el 起点元素
 * @param  {Element} root 终止根元素
 * @return {[Element]}
 */
function pathList( el, root ) {
    let _els = [el].concat(
            $.parentsUntil( el, e => e === root )
        );
    return _els.reverse().map( el => linkElem( $.elem('b', elemInfo(el)), el ) );
}


/**
 * 存储/获取引导元素上的源目标元素。
 * - 存储时返回引导元素自身。
 * - 取值时返回引导元素上存储的源目标。
 * @param  {Element} to 路径元素
 * @param  {Element} src 源目标元素
 * @return {Element} 源目标或路径元素
 */
function linkElem( to, src ) {
    if ( src === undefined ) {
        return to[ __linkElem ];
    }
    to[ __linkElem ] = src;
    return to;
}


/**
 * 获取元素信息。
 * - 支持role特性，与标签名用分号分隔。
 * - 不支持其它如类名和ID。
 * @param {Element} el 目标元素
 */
function elemInfo( el ) {
    let _s = el.tagName.toLowerCase();

    if ( el.hasAttribute('role') ) {
        _s += ':' + el.getAttribute( 'role' );
    }
    return _s;
}


/**
 * 设置元素焦点。
 * 会同时设置焦点元素的路径提示序列。
 * 会激发插入点合法条目更新事件。
 * @param  {Element|null} el 待设置焦点元素
 * @return {Element|null} 之前的焦点
 */
function setFocus( el ) {
    if ( el == null ) {
        $.empty( pathContainer );
    } else {
        $.intoView( el, 0 );
        $.fill( pathContainer, pathList(el, contentElem) );
    }
    return __EHot.set( el );
}


/**
 * 焦点更新。
 * 用于会改变焦点元素位置而选取集又不变的编辑操作。
 * 如：章节缩进。
 * 仅在焦点元素包含在选取集内时才工作。
 */
function updateFocus() {
    let _hot = __EHot.get();
    __ESet.has( _hot ) && setFocus( _hot );
}


/**
 * 兄弟元素同态。
 * 包含两种状态：选取/取消选取。
 * @param {[Element]} els 选取集
 * @param {Element} hot 当前焦点元素
 */
function siblingsUnify( els, hot ) {
    __Selects.cleanUp( hot );
    __Selects.expand( els, hot );
}


/**
 * 普通元素集同态。
 * 需要检查每一个成员的父级选取并清除之。
 * @param {[Element]} els 选取集
 * @param {Element} hot 焦点元素
 */
function elementsUnify( els, hot ) {
    els.forEach(
        el => __Selects.cleanUp( el )
    );
    __Selects.expand( els, hot );
}


/**
 * 根内容元素集选取。
 * 内容子单元可能属于不同的父容器，而焦点元素也可能未选取，
 * 因此需要逐一清理。
 * @param {[Element]} els 内容子元素
 * @param {String} meth 插入方法（adds|unshift）
 */
function contentSelect( els, meth ) {
    els.forEach(
        el => __Selects.cleanUp( el )
    );
    __Selects[ meth ]( els );
}


/**
 * 单元素简单操作。
 * @param {Element} el 目标元素
 * @param {String} meth 操作方法（turn|only|add|safeAdd）
 * @param {Boolean} cleanup 向上清理，可选
 */
function elementOne( el, meth, cleanup ) {
    cleanup && __Selects.cleanUp( el );
    __Selects[ meth ]( el );
}


/**
 * 选取单个元素。
 * 包含设置目标元素为焦点。
 * @param  {Element} el 目标元素
 * @param  {String} meth 方法名
 * @return {Instance} 操作实例集
 */
function selectOne( el, meth ) {
    return [ new ESEdit(elementOne, el, meth), new HotEdit(el) ];
}


/**
 * 添加元素集选取。
 * 假定父级未选取，会自动清理子级已选取成员。
 * 用途：虚焦点系列操作。
 * @param {Set} eset 当前选取集
 * @param {Function} gets 获取新元素集回调
 */
function elementAdds( eset, gets ) {
    for ( const el of eset ) {
        __Selects.cleanUp( el );
        // 当前el可能已被叔伯清理掉。
        __Selects.adds( gets(el) );
    }
}


/**
 * 简单全选取。
 * 清除之前的选取集，安全添加新集合（无互为包含）。
 * @param {[Element]} els 内容元素集
 */
function newSafeAdds( els ) {
    __Selects.empty();
    __Selects.safeAdds( els );
}


/**
 * 清理全选取。
 * 集合内可能存在互为包含的元素。
 * @param {[Element]|Set} els 父级元素集
 */
function newCleanAdds( els ) {
    __Selects.empty();
    els.forEach( el => __Selects.add(el) );
}


/**
 * 反选添加。
 * 焦点元素可能是已选取元素的子元素，需向上清理。
 * @param {Element} el 焦点元素
 */
function reverseAdds( el ) {
    __Selects.cleanUp( el );
    __Selects.reverse( el.parentElement.children );
}


/**
 * 清除选取集。
 * 返回的选取编辑实例需要进入历史栈。
 * 返回false用于清除无效集。
 * @return {ESEdit|false} 选取操作实例
 */
function clearSets() {
    return __ESet.size > 0 && new ESEdit( () => __ESet.clear() );
}


/**
 * 简单选取。
 * @param  {Element|[Element]} els 目标元素（集）
 * @param  {Element} hot 当前焦点元素，可选
 * @return {ESEdit} 选取操作实例
 */
function pushes( els ) {
    els = arrVal( els );
    return els.length > 0 && new ESEdit( () => __ESet.pushes(els) );
}


/**
 * 清理元素焦点。
 * 如果焦点元素在容器元素内，清除之。
 * @param  {[Element]} els 容器元素集
 * @param  {Boolean} self 包含自身检查
 * @return {HotEdit|null}
 */
function cleanHot( els, self ) {
    let _hot = __EHot.get();

    if ( !_hot || !els.length ) {
        return null;
    }
    return els.some( el => $.contains(el, _hot, !self) ) && new HotEdit(null);
}


/**
 * 删除节点集。
 * @param  {[Node]} nodes 节点集
 * @param  {Boolean} check 检查可否删除
 * @return {DOMEdit|null} 操作实例
 */
function removeNodes( nodes, check ) {
    if ( nodes.length === 0 ) {
        return;
    }
    if ( check && !nodes.every(canDelete) ) {
        help( 'has_cannot_del', deleteBadit(nodes) );
        return null;
    }
    return new DOMEdit( () => $(nodes).remove() );
}


/**
 * 清空元素集。
 * 注记：清空之后内容重新开始，因此无需检查可否删除。
 * @param  {[Element]} els 容器元素集
 * @return {DOMEdit|null} 操作实例
 */
function elementsEmpty( els ) {
    if ( els.length === 0 ) {
        return;
    }
    return new DOMEdit( () => $(els).empty() );
}


/**
 * 填充元素集。
 * 如果值为数组，与成员一一对应填充（tQuery）。
 * @param  {[Element]} els 容器元素集
 * @param  {String|[String]} data 数据（集）
 * @param  {String} meth 插入方法（append|fill），可选
 * @return {DOMEdit|null} 操作实例
 */
function textAppend( els, data, meth ) {
    return els.length > 0 && new DOMEdit( __Edits[meth], $(els), data );
}


/**
 * 填充元素集组。
 * 数据组成员仅与元素集组成员（选取目标）一一对应。
 * 如果元素集组内只有一个成员（一个选取），恢复数据为一体（换行连接）。
 * 如果数据组只有一个成员，表示对应到集组全部。
 * 注记：
 * 可用于选取集取值填充到新的选取集目标。
 * 也可用于外部多行文本内容分别填充到多个选取目标。
 * @param  {[[Element]]} els2 元素集组（2维）
 * @param  {[String]} data 数据组（1维）
 * @param  {String} meth 插入方法（appends|fills），可选
 * @return {[DOMEdit]} 操作实例集
 */
function textAppend2( els2, data, meth ) {
    if ( els2.length === 1 ) {
        // 值为一体。
        return [ textAppend(els2[0], data.join('\n'), meth) ];
    }
    if ( data.length === 1 ) {
        data = new Array(els2.length).fill( data[0] );
    }
    return els2.map( (els, i) => textAppend(els, data[i], meth) );
}


/**
 * 移动内添加操作。
 * 因为是“移动”逻辑，保留可能绑定的事件处理器。
 * 当然这只是一种模拟（克隆）。
 * 检查：
 * - 焦点元素不可选取。
 * - 选取元素必须为可删除。
 * - 目标可以向内添加内容。
 * 操作：
 * - 清空选取集选取。
 * - 清空容器元素（可选）。
 * - 移除原选取集元素。
 * - 插入新元素集。
 * - 新元素集自动选取。
 * - 新元素集首个成员为焦点。
 * @param  {Collector} $els 当前选取集
 * @param  {Element} to 目标容器元素
 * @param  {Element} ref 同级参考元素，可选
 * @param  {Boolean} empty 是否清空容器，可选
 * @return {[Instance]} 操作实例集
 */
function moveAppend( $els, to, ref, empty ) {
    if ( $els.length === 0 ) {
        return;
    }
    if ( __ESet.has(to) ) {
        return help( 'cannot_selected', to );
    }
    if ( !canAppend(to) ) {
        return help( 'cannot_append', to );
    }
    if ( !$els.every(canDelete) ) {
        return help( 'has_cannot_del', deleteBadit($els) );
    }
    let _op1 = clearSets(),
        _op2 = empty && new DOMEdit( () => $.empty(to) ),
        $new = appendData( ref, to, $els.clone(true, true, true) );

    return [
        new HotEdit(),
        _op1, _op2,
        new DOMEdit( () => $els.remove() ),
        $new.length && new DOMEdit( __Edits.insert, ref, to, $new ),
        ...appendContent( to, $new )
    ];
}


/**
 * 克隆内添加操作。
 * 不支持元素上绑定的事件处理器克隆，
 * 如果需要，用户应当有重新绑定的方式（OBT特性会正常克隆）。
 * 检查：
 * - 单选取自我填充忽略。
 * - 目标可以向内添加内容。
 * 操作：
 * - 清空选取集选取。
 * - 清空容器元素（可选）。
 * - 插入新元素集。
 * - 新元素集自动选取。
 * - 新元素集首个成员为焦点。
 * @param  {Collector} $els 当前选取集
 * @param  {Element} to 目标容器元素
 * @param  {Element} ref 同级参考元素，可选
 * @param  {Boolean} empty 是否清空容器，可选
 * @return {[Instance]} 操作实例集
 */
function cloneAppend( $els, to, ref, empty ) {
    if ( !$els.length ) {
        return;
    }
    if ( __ESet.size === 1 && __ESet.has(to) ) {
        return;  // 自我填充
    }
    if ( !canAppend(to) ) {
        return help( 'cannot_append', to );
    }
    let _op1 = clearSets(),
        _op2 = empty && new DOMEdit( () => $.empty(to) ),
        $new = appendData( ref, to, $els.clone() );

    return [
        new HotEdit(),
        _op1,
        _op2,
        $new.length && new DOMEdit( __Edits.insert, ref, to, $new ),
        ...appendContent( to, $new )
    ];
}


/**
 * 向内插入内容。
 * 判断容器是否为内容元素，构造操作实例集。
 * - 内容元素容器仅需添加容器元素到选取。
 * - 非内容元素容器会选取全部数据元素集，且定位焦点到首个成员。
 * @param  {Element} to 容器元素
 * @param  {[Element]} $els 数据元素集
 * @return {[Instance]}
 */
function appendContent( to, $els ) {
    if ( !$els.length ) {
        return [];
    }
    if ( isContent(to) ) {
        return [ new ESEdit(() => __ESet.add(to)) ];
    }
    return [ pushes($els), new HotEdit($els[0]) ];
}


/**
 * 构造append方式数据。
 * - 暂停DOM编辑历史跟踪。
 * - 用children构造链创建新元素（已插入）。
 * - 提取这些新插入的根级元素作为数据。
 * 注记：
 * children的插入方式较为灵活，可能在每次执行时创建新的元素。
 * 因此会带来先前插入节点的引用丢失问题，导致链式Redo无效。
 * 所以需要用克隆的源数据预先构造出新节点，再用它们重新append。
 *
 * @param {Element|null} ref 兄弟参考
 * @param {Element} box 父容器元素
 * @param {Collector} $data 数据集（克隆版）
 */
function appendData( ref, box, $data ) {
    return cleanCall( () =>
        $data
        .map( nd => children(ref, box, {}, nd) ).flat()
        .map( nd => nd && $.remove(nd) )
        .filter( nd => nd )
    );
}


/**
 * 平级：向前端移动。
 * n: 0值会移动到头部首个元素。
 * handle:
 * function( els:[Element], beg:Element ): void
 * 注记：
 * 只有状态合适时才会调用 handle，下同。
 * @param {Element} hot 焦点元素
 * @param {Number} n 移动距离
 * @param {Function} handle 调用句柄
 */
function previousCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n || Infinity;

    if (!hot || n < 0) {
        return;
    }
    let _els = $.prevAll( hot, (_, i) => i <= n );

    return _els.length && handle( _els, hot );
}


/**
 * 平级：向后端移动。
 * n: 0值会移动到末尾元素。
 * @param {Element} hot 焦点元素
 * @param {Number} n 移动距离
 * @param {Function} handle 调用句柄
 */
function nextCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n || Infinity;

    if (!hot || n < 0) {
        return;
    }
    let _els = $.nextAll( hot, (_, i) => i <= n );

    return _els.length && handle( _els, hot );
}


/**
 * 纵深：上级元素。
 * 返回false表示目标超出范围。
 * 注意：需要提供准确距离值，0值没有特殊含义。
 * @param {Element} hot 焦点元素
 * @param {Number} n 上升层级数
 * @param {Function} handle 调用句柄
 */
function parentCall( hot, n, handle ) {
    n = isNaN(n) ? 1 : n;

    if (!hot || n <= 0) {
        return;
    }
    let _to = $.closest( hot, (el, i) => i == n || el === contentElem );

    return _to && _to !== contentElem && handle( _to );
}


/**
 * 纵深：目标子元素。
 * handle: function( to, hot:Element ): null
 * @param {Element} hot 焦点元素
 * @param {Number} n 子元素位置下标（从0开始，支持负值）
 * @param {Function} handle 调用句柄
 */
function childCall( hot, n, handle ) {
    n = n || 0;

    if ( !hot || n < 0 ) {
        return;
    }
    let _to = $.children( hot, n );

    return _to && handle( _to );
}


/**
 * 纵深：顶元素操作。
 * @param {Element} hot 焦点元素
 * @param {Function} handle 调用句柄
 */
function topCall( hot, handle ) {
    let _to = virtualBox( hot, contentElem );
    return _to && handle( _to );
}


/**
 * 提取起点到目标的全部兄弟元素。
 * 目标元素可能在起点的前面，也可能是后面。
 * 结果集保持从起点到目标的顺序。
 * 约束：外部保证两个元素必然为兄弟元素。
 * @param  {Element} beg 起点元素
 * @param  {Element} to 目标元素（包含）
 * @return {[Element]}
 */
function siblingTo( beg, to ) {
    let _dir = $.next( beg, to, true ),
        _els = _dir ? $.nextUntil( beg, to ) : $.prevUntil( beg, to );

    return [ beg, ..._els, to ];
}


/**
 * 是否为相同的成员集。
 * @param  {ESet} eset 当前选取集
 * @param  {[Element]} els 待检查元素集
 * @return {Boolean}
 */
function sameSets( eset, els ) {
    if ( eset.size !== els.length ) {
        return false;
    }
    return $.every( eset, (el, i) => els[i] === el );
}


/**
 * 设置元素位置。
 * 外部需要预先设置元素的 position:absolute 样式。
 * 注：<svg>子元素无效。
 * @param  {Collector} $els 目标元素集
 * @param  {String} name 样式名（left|top|right|bottom）
 * @param  {Number} inc 递增像素值
 * @return {DOMEdit|void}
 */
function elementsPostion( $els, name, inc ) {
    if ( !$els.length ||
        $els.some(cantMoving) ) {
        return;
    }
    let _fx = v => `${(parseFloat(v) || 0) + inc}px`;

    return new DOMEdit( __Edits.style, $els, name, _fx );
}


/**
 * 是否位置不可移动。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
function cantMoving( el ) {
    return getType(el) === T.SVGITEM || $.css(el, 'position') !== 'absolute';
}


/**
 * 微编辑目标元素。
 * - 将微编辑实例赋值到一个全局变量。
 * - 移除目标元素的选取。
 * - 将目标元素的可编辑副本设置为焦点。
 * 注：
 * 内联内容元素合并会带来文本节点离散，故先合并。
 * @param  {Element} el 目标元素
 * @return {[Instance]} 编辑历史记录实例序列
 */
function minied( el ) {
    let _op1 = new HotEdit( null ),
        _op2 = null,
        _op3 = new DOMEdit( () => $.normalize(el) );

    // 创建同类新行时为未选取，无需取消。
    if ( __ESet.has(el) ) {
        _op2 = new ESEdit( () => __Selects.delete(el) );
    }
    currentMinied = new MiniEdit(
        el,
        window.getSelection().getRangeAt(0)
    );
    $.trigger( contentElem, Sys.medIn, null, true );
    $.trigger( midtoolElem, 'hide' );
    $.trigger( slaveInsert, Sys.insType, Sys.miniedTpl );

    return [ _op1, _op2, _op3, currentMinied, new HotEdit(currentMinied.elem()) ];
}


/**
 * 微编辑确认。
 * 如果编辑的是章节/片区的标题，会发送通知用于更新目录。
 * 回到普通模式工具栏Undo/Redo按钮需重置。
 * @param {Element|false} 章节/片区标题
 */
function miniedOk( h2 ) {
    currentMinied.done();
    currentMinied = null;
    stateNewEdit();
    if ( h2 ) {
        $.trigger( outlineElem, Sys.medOk, h2 );
    }
    $.trigger( contentElem, Sys.medOk, null, true );

    // 工具栏中间按钮可操作。
    $.trigger( midtoolElem, 'show' );

    // 主面板恢复普通模式标签。
    $.trigger( slaveInsert, Sys.insType, Sys.normalTpl );

    // 插入位置恢复普通模式
    delayFire( insertWhere, Sys.evnLevel, [...__ESet] );
}


/**
 * 微编辑创建同类新行。
 * 注记：游离元素的特性设置不会进入历史栈。
 * @param  {Element} src 源行元素
 * @return {[Instance]} 编辑实例序列
 */
function medSameLine( src ) {
    let _new = $.attr(
        $.elem( src.tagName ),
        'role',
        $.attr( src, 'role' )
    );
    // 合为一个编辑历史序列。
    return [ new DOMEdit(__Edits.newAfter, src, _new), ...minied(_new) ];
}


/**
 * 微编辑创建逻辑新行。
 * @param  {Element} src 源行元素
 * @param  {String} tag 新行标签名
 * @return {[Instance]} 编辑实例序列
 */
function medLogicLine( src, tag ) {
    let _new = $.elem( tag );
    return [ new DOMEdit(__Edits.newAfter, src, _new), ...minied(_new) ];
}


/**
 * 是否可以创建逻辑新行。
 * @param  {[String, Number]} conf 逻辑新行配置对
 * @param  {Element} src 源行元素
 * @return {Boolean}
 */
function medLogicOk( conf, src ) {
    return conf && conf[1] === getType( src.parentElement );
}


/**
 * 微编辑下快捷创建新行。
 * 包含创建同类新行和逻辑新行。
 * - Ctrl + Enter 新建一个同类行，原行确认。
 * - Alt + Enter  新建一个逻辑行，原行确认。如果无逻辑行则同 Ctrl+Enter。
 * @param  {Set} scam 按下的辅助键集
 * @param  {Element} src 参考的源元素
 * @return {[Instance]|false} 操作实例集
 */
function medCreateLine( scam, src ) {
    let _tv = getType( src ),
        _lm = __medLLineMap[ _tv ];

    // 同类新行。
    if ( scamPressed(scam, cfg.Keys.miniedSameLine) ) {
        return __medNewLines.has( _tv ) && medSameLine( src );
    }
    if ( !scamPressed(scam, cfg.Keys.miniedLogicLine) ) {
        return false;
    }
    // 逻辑新行。
    if ( medLogicOk(_lm, src) ) {
        return medLogicLine( src, _lm[0] );
    }
    // 同类新行。
    return __medNewLines.has( _tv ) && medSameLine( src );
}


//
// 插入操作句柄配置。
// 专用于主面板平级/向内的前后插入。
//
const insertHandles = {
    [Sys.levelName1]: [ __Edits.newAfter, __Edits.newBefore ],
    [Sys.levelName2]: [ __Edits.newAppend, __Edits.newPrepend ],
};


/**
 * 在各参考元素相应位置插入数据节点集。
 * @param  {[Element]} els 参考元素集
 * @param  {[Collector]} nodes2 数据节点集组
 * @param  {Boolean} before 是否前插入
 * @param  {String} level 插入层级（平级|子级）
 * @return {[DOMEdit]} 操作实例集
 */
function insertsNodes( els, nodes2, before, level ) {
    return els.map( (ref, i) =>
        nodes2[i] != null &&
        // before: 0|1
        new DOMEdit( insertHandles[level][+before], ref, nodes2[i] )
    );
}


/**
 * 创建数据节点集。
 * 用于多个选取目标时创建待插入的克隆集。
 * 注：
 * 单个选取时，多项数据合并为一。
 * @param  {Collector} $data 数据节点集
 * @param  {Number} cnt 克隆次数
 * @return {[Collector]} 节点集组
 */
function dataNodes2( $data, cnt ) {
    if ( cnt < 2 ) {
        return [ $data ];  // 合一
    }
    if ( $data.length > 1 ) {
        return $data;  // 原始各别
    }
    let _el = $data[0];

    // 单成员时克隆到目标长度
    for (let i = 0; i < cnt-1; i++) {
        $data.push( $.clone(_el) );
    }
    return $data;
}


/**
 * 创建节点数组。
 * 用于多个选取目标时创建待插入克隆集：
 * - 如果为单成员，克隆到cnt个成员。
 * - 如果为多个成员，则保持原样（不再克隆）。
 * 注：
 * 单个选取但有多个成员时，不合并（非法），自然忽略。
 * 主要用于标题类。
 * @param  {Element|[Element]} data 数据元素
 * @param  {Number} cnt 克隆次数
 * @return {[Element]} 数据集
 */
function dataNodes( data, cnt ) {
    data = arrVal( data );

    if ( cnt < 2 || data.length > 1 ) {
        return data;
    }
    let _node = data[0];

    for (let i = 0; i < cnt-1; i++) {
        data.push( $.clone(_node) );
    }
    return data;
}


/**
 * 数据多份克隆。
 * @param  {Collector} $data 元素集
 * @param  {Number} cnt 克隆份数
 * @return {[Collector]}
 */
function dataClones( $data, cnt ) {
    let _buf = [ $data ];

    for (let i = 0; i < cnt-1; i++) {
        _buf.push( $data.clone() );
    }
    return _buf;
}


/**
 * 专用：rbpt
 * 根据选取的元素找到插入参考位置。
 * @param  {Element} rb 注音文本元素（选中）
 * @param  {Boolean} before 是否向前插入
 * @return {Element|null}
 */
function posWithRB( rb, before ) {
    // 跳过第一个<rp>
    return before ? rb : $.next( rb.nextElementSibling, 'rp', true );
}


/**
 * 专用：rbpt
 * 根据选取的元素找到插入参考位置。
 * @param  {Element} rt 拼音元素（选中）
 * @param  {Boolean} before 是否向前插入
 * @return {Element|null}
 */
function posWithRT( rt, before ) {
    return before ? $.prev( rt, 'rb', true ) : rt.nextElementSibling;
}


/**
 * 判断获取 T.RBPT 参考元素。
 * @param  {Element} el 目标元素
 * @param  {Boolean} before 是否向前插入
 * @return {Element}
 */
function rbptRef( el, before ) {
    switch ( el.tagName ) {
        case 'RB': return posWithRB( el, before );
        case 'RT': return posWithRT( el, before );
    }
    // 外部异常（通常不可能）
    throw new Error( 'element not <rb> or <rt>.' );
}


/**
 * 提取 T.RBPT 单元插入参考元素。
 * 只有平级才需要变换参考节点。
 * @param  {Boolean} before 是否向前插入
 * @param  {String} level 插入层级（siblings|children）
 * @return {[Element]}
 */
function rbptRefs( before, level ) {
    let _els = [ ...__ESet ];
    return level === Sys.levelName1 ? _els.map( el => rbptRef(el, before) ) : _els;
}


/**
 * 普通模式：撤销。
 * @return {Boolean} 是否可以再撤销
 */
function undoNormal() {
    __History.undo();
    return __History.canUndo();
}


/**
 * 普通模式：重做。
 * @return {Boolean} 是否可以再重做
 */
function redoNormal() {
    __History.redo();
    return __History.canRedo();
}


/**
 * 修订模式：撤销。
 * @return {Boolean} 是否可以再撤销
 */
function undoMinied() {
    document.execCommand( 'undo' );
    return document.queryCommandEnabled( 'undo' );
}


/**
 * 修订模式：重做。
 * @return {Boolean} 是否可以再重做
 */
function redoMinied() {
    document.execCommand( 'redo' );
    return document.queryCommandEnabled( 'redo' );
}


/**
 * 是否包含子元素。
 * 集合中任一成员满足要求即可。
 * @param  {[Element]} els 元素集
 * @return {Boolean}
 */
function hasChildElement( els ) {
    for ( const el of els ) {
        if ( el.childElementCount > 0 ) return true;
    }
    return false;
}


/**
 * 是否按下目标辅助键序列。
 * 此为准确按下，有排他性。
 * @param  {Set} set 按下辅助键集
 * @param  {String} keys 键名序列（空格分隔）
 * @return {Boolean}
 */
function scamPressed( set, keys ) {
    let _ns = keys.split( __reSpace );
    return _ns.every( n => set.has(n.toLowerCase()) ) && _ns.length === set.size;
}


/**
 * 相邻元素集分组。
 * 相邻判断忽略中间间隔的纯文本节点。
 * @param  {[Element]} els 有序元素集
 * @return {[[Element]]} 相邻元素集组
 */
function adjacentTeam( els ) {
    let _sub = [ els.shift() ],
        _buf = [ _sub ];

    for ( const el of els ) {
        if ( el.previousElementSibling === last(_sub) ) {
            _sub.push( el );
        } else {
            _buf.push( (_sub = [el]) );
        }
    }
    return _buf;
}


/**
 * 兄弟节点分组。
 * @param  {[Element]} els 元素集
 * @return {[[Element]]}
 */
function siblingTeam( els ) {
    let _map = new Map();

    for ( const el of els ) {
        let _pel = el.parentElement;

        ( _map.get(_pel) || _map.set(_pel, []).get(_pel) )
        .push( el );
    }
    return [ ..._map.values() ];
}


/**
 * 元素干净克隆。
 * 避免焦点元素的状态被克隆。
 * @param  {Element} el 目标元素
 * @return {Element} 新元素
 */
function cleanedClone( el ) {
    let _hot = __EHot.get(),
        _clr = $.contains( el, _hot );
    try {
        _clr && __EHot.cancel();
        return cloneElement( el );
    }
    finally {
        _clr && __EHot.set( _hot );
    }
}


/**
 * 克隆元素集组。
 * 克隆的新元素依然保持原样的分组模式。
 * @param  {[[Element]]} els2 相邻元素集组
 * @return {[[Element]]} 克隆集
 */
function cloneTeam( els2 ) {
    return els2.map(
        els => els.map( el => cleanedClone(el) )
    );
}


/**
 * 创建多个重复元素。
 * @param {Element} el 目标元素
 * @param {Number} n 克隆数量
 */
function repeatN( el, n ) {
    n = isNaN(n) ? 1 : n;
    return new Array(n)
        .fill()
        .map( () => cloneElement(el) );
}


/**
 * 检索集合中首个不能删除的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function deleteBadit( els ) {
    for ( const el of els ) {
        if ( !canDelete(el) ) return el;
    }
}


/**
 * 检索集合中首个不能文本化的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function totextBadit( els ) {
    for ( const el of els ) {
        if ( !canTotext(el) ) return el;
    }
}


/**
 * 检索集合中首个不能解封装的元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function unwrapBadit( els ) {
    for ( const el of els ) {
        if ( !canUnwrap(el) ) return el;
    }
}


/**
 * 检索首个向前固定类单元。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function moveBeforeBadit( els ) {
    for ( const el of els ) {
        if ( beforeFixed(el) ) return el;
    }
}


/**
 * 检索首个向后固定类单元。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function moveAfterBadit( els ) {
    for ( const el of els ) {
        if ( afterFixed(el) ) return el;
    }
}


/**
 * 检索首个固定类单元。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function moveBadit( els ) {
    for ( const el of els ) {
        if ( isFixed(el) ) return el;
    }
}


/**
 * 检索首个非章节元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function indentBadit( els ) {
    for ( const el of els ) {
        if ( !isChapter(el) ) return el;
    }
}


/**
 * 检索首个不能重复的元素。
 * 注：用于原地克隆判断。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function repeatBadit( els ) {
    for ( const el of els ) {
        if ( isOnly(el) ) return el;
    }
}


/**
 * 选取单元格所属列。
 * 因为可能存在跨列单元格，故用Table接口。
 * 局限于同一表区域之内。
 * @param  {Element} cell 单元格
 * @param  {$.Table} tbo 表格实例
 * @param  {TableSection} tsec 表区域（<tbody>|<thead>|<tfoot>），可选
 * @return {[Element]} 单元格集
 */
function columnCells( cell, tbo, tsec ) {
    let _idx = tbo.cellIndex( cell );

    if ( $.isArray(_idx) ) {
        return columnCells2( tbo, _idx, tsec );
    }
    return tbo.column( _idx, tsec );
}


/**
 * 获取多列单元格。
 * 可以正常处理跨列的情况。
 * 结果集成员为按列纵向顺序。
 * @param  {$.Table} tbo 表格实例
 * @param  {Number} beg 起始下标
 * @param  {Number} end 终点下标（不含）
 * @param  {TableSection} tsec 表区域
 * @return {[Element]}
 */
function columnCells2( tbo, [beg, end], tsec ) {
    let _buf = new Set();

    for (let i = beg; i < end; i++) {
        tbo.column( i, tsec ).forEach( el => _buf.add(el) );
    }
    return [ ..._buf ];
}


/**
 * 获取与焦点同级的起点元素的父容器。
 * 如果焦点与起始元素不在同一父容器下，返回null。
 * 用途：单击跨选或浮选。
 * @param  {Element} hot 焦点元素
 * @param  {Element} beg 起始元素
 * @return {Element|null}
 */
function closestFocus( hot, beg ) {
    if ( !hot ) return;
    let _box = hot.parentElement;

    if ( !$.contains(_box, beg, true) ) {
        return null;
    }
    while ( beg.parentElement !== _box ) {
        beg = beg.parentElement;
    }
    return beg;
}


/**
 * 获取容器内的父元素。
 * 注：不超出主容器范围。
 * @param  {Element} el 目标元素
 * @return {Element|false}
 */
function closestParent( el ) {
    el = el.parentElement;
    return el !== contentElem && el;
}


/**
 * 获取首个互为兄弟的元素。
 * 如果在集合中找到为其它成员兄弟的元素，返回该元素。
 * 空集或所有成员都是其父元素内唯一子元素时，返回 true。
 * 如果集合成员都是平级单一选取元素时，返回 false。
 * 注记：
 * 用于虚焦点平级操作前的合法性检测，返回真值即不可继续。
 * @param  {Set} eset 元素集
 * @return {Boolean}
 */
function hasSibling( eset ) {
    let _set = new Set(),
        _cnt = 0;

    for ( const [i, el] of eset.entries() ) {
        let _box = el.parentElement;
        _cnt += _box.childElementCount;

        if ( _set.add(_box).size === i ) {
            // true
            return !warn( 'repeat sibling:', el );
        }
    }
    return _cnt === eset.size;
}


/**
 * 集合成员是否为相同类型元素。
 * 如果tag无值，取首个成员取值即可。
 * 如用于判断片区类型（s1-s5）。
 * @param  {[Element]} els 元素集
 * @param  {Number} tag 单元标签名，可选
 * @return {Boolean}
 */
function sameTag( els, tag ) {
    tag = tag || els[0].tagName;
    return els.every( el => el.tagName === tag );
}


/**
 * 是否与参考表格相同（列数）。
 * @param  {Element} ref 参考表格
 * @param  {[Element]} els 对比表格元素集
 * @return {Boolean}
 */
function sameTable( ref, els ) {
    let _n = tableObj(ref).cols();
    return els.every( el => _n === tableObj(el).cols() );
}


/**
 * 章节提升。
 * 包含内部全部子章节的升级。
 * 如果章节根已为顶层，会解包内容并返回内容。
 * 注记：
 * 返回内容时，外部无需在异地插入。
 * @param  {Element} sec 章节根
 * @return {void|false}
 */
function sectionUpTree( sec ) {
    $.find( 'section', sec )
        .forEach(
            el => sectionChange( el, -1 )
        );
    return sectionChange( sec, -1 );
}


/**
 * 章节提升。
 * 顶层章节被简单忽略，避免结构混乱（不易被察觉）。
 * @param {Element} sec 章节元素
 */
function sectionUp( sec ) {
    let _pel = sec.parentElement,
        _sxn = $.attr( sec, 'role' );

    if ( _sxn === 's1' ) {
        return error( Tips.sectionNotUp );
    }
    $.before( _pel, sectionUpTree(sec) || sec );
}


/**
 * 章节降级。
 * 包含内部全部子章节降级。
 * 如果章节根已为末层，会解包内容并返回内容。
 * @param  {Element} sec 章节根
 * @return {void|false}
 */
function sectionDownTree( sec ) {
    $.find( 'section', sec )
        .forEach(
            el => sectionChange( el, 1 )
        );
    return sectionChange( sec, 1 );
}


/**
 * 章节降级。
 * 将目标章节降级并移入空章节容器内。
 * 末章节会降级为深章节（无role特性）。
 * 注记：外部创建空容器可节省Redo开销。
 * @param {Element} sec 章节元素
 * @param {Element} box 同级空章节容器
 */
function sectionDown( sec, box ) {
    sectionDownTree( sec );
    // 插入内末端。
    $.append( $.replace(sec, box), sec );
}


/**
 * 创建章节同级空容器。
 * 末级（s5）会简单忽略，因为无法再降级。
 * 返回一个 [原章节, 空容器] 值对的集合。
 * 如果全部章节都不满足要求，返回false。
 * 注记：
 * 用于章节降级时原章节的父元素容器创建。
 * @param  {[Element]} secs 章节元素集
 * @return {[Array2]|false}
 */
function sectionBoxes( secs ) {
    let _buf = [];

    for ( const sec of secs ) {
        let _tv = getType( sec );

        _buf.push([
            sec,
            create( _tv, {h2: Tips.sectionH2} )
        ]);
    }
    return _buf.length ? _buf : false;
}


/**
 * 构建“元素:位置”选择器。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function nthSelector( el ) {
    return `${ el.tagName }:nth-child(${ $.prevAll(el).length + 1 })`;
}


/**
 * 构建片区标题选择路径。
 * 可用于数字章节序号定位到目标片区。
 * 也可用于单击目录条目时定位显示目标片区（不用ID）。
 * 注意：
 * 检索时需要提供直接父容器元素作为上下文（<article>）。
 * nth-of-type()只支持标签区分，故无role约束。
 *
 * @param  {[Number]} chsn 章节序列
 * @return {String} 片区标题（<h2>）的选择器
 */
function h2PathSelector( chsn ) {
    return chsn.map( n => `>section:nth-of-type(${+n})` ).join( ' ' ) + ' >h2';
}


/**
 * 判断元素是否可正常删除。
 * @param {Element} el 目标元素
 */
function canDelete( el ) {
    let _tv = getType( el );
    return T.isBlocks( _tv ) || T.isInlines( _tv ) || T.isStructX( _tv );
}


/**
 * 是否可以内容文本化。
 * - 允许内容元素。
 * - 允许内联的非单元素，如<ruby>（解构）。
 * @param  {Element} el 容器元素
 * @return {Boolean}
 */
function canTotext( el ) {
    let _tv = getType( el );
    return T.isContent( _tv ) || ( T.isInlines(_tv) && !T.isEmpty(_tv) );
}


/**
 * 是否可以内容提升。
 * 专用：Edit.unWrap 操作。
 * 宽容：
 * 应当允许纯内容的元素向上展开，即便不是内容元素，
 * 如编辑过程中的破坏性操作（如<ruby>）。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
function canUnwrap( el ) {
    return isContent( el.parentElement ) && isContent( el );
}


/**
 * 是否可以向内插入。
 * @param  {Element} el 目标元素
 * @return {Boolean}
 */
function canAppend( el ) {
    let _tv = getType( el );
    return !T.isEmpty( _tv ) && !T.isSealed( _tv );
}


/**
 * 构造元素集类型值集
 * @param  {[Element]} els 元素集
 * @return {Set<Number>}
 */
function typeSets( els ) {
    return els.reduce(
        ( set, el ) => set.add( getType(el) ),
        new Set()
    );
}


/**
 * 获取目标元素集的父元素集。
 * 注记：
 * 因为 delayFile 为延迟激发，
 * 所以目标可能已在 DOMEdit.undo() 过程中脱离DOM。
 * @param  {[Element]|Set} els 目标元素集
 * @return {Set<Element>}
 */
function parentsSet( els ) {
    let _set = new Set();

    for ( const el of els ) {
        if ( el.parentElement ) _set.add( el.parentElement );
    }
    return _set;
}


/**
 * 打开目标属性编辑模态框。
 * @param {String} name 条目模板名
 */
function propertyEdit( name ) {
    Templater.get( Sys.modalProp )
    .then( frm => $.trigger(frm, 'init', name) && $.trigger(modalDialog, 'open', frm) );
}


/**
 * 延迟激发。
 * 因为OBT的调用链中可能包含 PB:tpl 延后类处理指令，
 * 延迟激发以等待DOM更新完成。
 * @param {Element} el 目标元素
 * @param {String} evn 事件名
 * @param {...Value} rest 剩余参数
 */
function delayFire( el, evn, ...rest ) {
    setTimeout( () =>
        el.isConnected && $.trigger( el, evn, ...rest ), 1
    );
}


/**
 * 获取可子级插入选单集。
 * @param  {[Element]} els 目标元素集
 * @return {[String]} 模板名集
 */
function childOptions( els ) {
    return options(
        els.filter( el => !T.isSealed( getType(el) ) )
    );
}


/**
 * 获取可平级插入选单集。
 * @param  {[Element]} els 目标元素集
 * @return {[String]} 模板名集
 */
function siblingOptions( els ) {
    return childOptions( [...parentsSet(els)] );
}


/**
 * 末尾添加表格列。
 * @param  {Table} tbo 表格实例
 * @param  {Number} cnt 添加列数
 * @return {[[Element]]} 新添加的单元格集组
 */
function appendColumns( tbo, cnt ) {
    let _buf = [];

    while ( cnt-- > 0 ) {
        _buf.push(
            tbo.insertColumn( tbo.newColumn() )
        );
    }
    return _buf;
}


/**
 * 裁剪表格列。
 * @param  {Table} tbo 表格实例
 * @param  {Number} cnt 裁剪行数
 * @return {ignore}
 */
function cropCols( tbo, cnt ) {
    if ( cnt < 0 ) {
        while ( cnt++ < 0 ) tbo.removeColumn( -1 );
        return;
    }
    appendColumns( tbo, cnt )
    .flat()
    .forEach( cell => $.attr(cell, 'contenteditable', true) );
}


/**
 * 裁剪表格行。
 * @param  {Table} tbo 表格实例
 * @param  {Number} cnt 裁剪行数
 * @param  {TableSection} tsec 表格区域元素
 * @return {ignore}
 */
function cropTrs( tbo, cnt, tsec ) {
    if ( cnt < 0 ) {
        return tbo.removes( cnt, null, tsec );
    }
    tbo.inserts( cnt, null, tsec )
    .map( tr => [...tr.children] )
    .flat()
    .forEach( cell => $.attr(cell, 'contenteditable', true) );
}


/**
 * 创建代码表代码行集。
 * 属性实参null值可保证清除该特性。
 * 注记：不含<li>容器更灵活。
 * @param  {String} code 已解析源码
 * @param  {String} lang 所属语言
 * @param  {Number} tab Tab空格数，可选
 * @return {[Element]} <code>行集
 */
function listCode( code, lang = null, tab = null ) {
    return code
        .split( '\n' )
        .map( html => create(T.CODE, {lang, tab}, html) );
}


/**
 * 创建代码块子块。
 * @param  {String} code 已解析源码
 * @param  {String} lang 所属语言
 * @param  {Number} tab Tab空格数，可选
 * @return {[Element]} 子块代码（<code>）
 */
function blockCode( code, lang = null, tab = null ) {
    return [ create(T.CODE, {lang, tab}, code) ];
}


/**
 * 汇合解析结果集。
 * 如果包含其它语言代码子块，会被扁平化。
 * Object2: {
 *      lang: 所属语言
 *      data: 子块源码集（与data相同结构）
 * }
 * make: function(html, lang, tab): [Value]
 * @param  {[String|Object2]} data 源码解析数据
 * @param  {String} lang 所属语言
 * @param  {Function} make 封装创建回调
 * @param  {Number} tab Tab空格数，可选
 * @return {[Value]} 封装创建结果集（<code>）
 */
function codeFlat( data, lang, make, tab ) {
    let _buf = [];

    for ( const its of data ) {
        if ( typeof its === 'string' ) {
            _buf.push( ...make(its, lang, tab) );
            continue;
        }
        _buf.push( ...codeFlat(its.data, its.lang, make, tab) );
    }
    return _buf;
}


/**
 * 提取表区域单元格数据。
 * 返回值是一个按表格行分组的单元格值集（2-3维）。
 * 方法名主要是取值接口：text|html|contents 等。
 * 注记：
 * 返回null是有用的，可用于移除目标表区域。
 * @param  {[Element]|null} tsec 表区域元素
 * @param  {String} slr 单元格选择器（th|td|th,td）
 * @param  {String} meth 调用方法，可选
 * @return {[[String]]|null}
 */
function tableCells( tsec, slr, meth = 'text' ) {
    if ( !tsec ) {
        return null;
    }
    return $( 'tr', tsec ).find( slr )[ meth ]();
}


/**
 * 制表符对应空格序列。
 * 如果n为值null，表示不替换，返回一个真实的Tab符。
 * @param  {String} line 光标前段文本
 * @param  {Number} n Tab对应空格数
 * @return {String} 空格序列或Tab
 */
function tabSpaces( line, n ) {
    return n > 0 ? ' '.repeat( n - halfWidth(line)%n ) : '\t';
}


/**
 * 获取行文本的前端缩进序列。
 * 前端缩进字符仅限于空格和Tab字符。
 * @param  {String} line 行文本
 * @return {String}
 */
function indentedPart( line ) {
    return line.substring( 0, minInds(line, Infinity) );
}


/**
 * 构造图片配置对象。
 * 容错值对里的顺序错误。
 * @param  {[String, Object]} pair 配置值对
 * @return {Object}
 */
function imgOpts( pair ) {
    let [src, opts] = pair;

    if ( typeof src !== 'string' ) {
        [opts, src] = [src, opts];
    }
    return Object.assign( {src}, opts );
}


/**
 * 媒体子单元创建。
 * 注：兼容单个对象（非数组）。
 * @param  {[Object]|Object} opts1 资源配置（集）
 * @param  {[Object]|Object} opts1 字幕轨配置（集）
 * @return {[Element]} <source>和<track>的混合集
 */
function mediaSubs( [opts1, opts2] ) {
    opts1 = arrVal( opts1 );
    opts2 = arrVal( opts2 );

    let _buf = opts1.map(
        o => create( T.SOURCE1, o )
    );
    return _buf.concat( opts2.map( o => create(T.TRACK, o) ) );
}


/**
 * 确定获取数组。
 * 如果已经是数组则原样返回。
 * @param  {Value|[Value]} val 任意值
 * @return {[Value]}
 */
function arrVal( val ) {
    return $.isArray( val ) ? val : [ val ];
}


/**
 * 获取第一个成员。
 * @param  {Set|Map|.values} obj 取值目标
 * @return {Value}
 */
function first( obj ) {
    for ( const it of obj.values() ) return it;
}


/**
 * 返回集合末尾成员。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function last( els ) {
    return els[ els.length - 1 ];
}


/**
 * 提示错误并提供帮助索引。
 * msgid: [hid, tips]
 * el默认为null避免linkElem()变为取值逻辑。
 * @param  {String} msgid 消息ID
 * @param  {Element} el 关联元素，可选
 * @return {true|void}
 */
function help( msgid, el = null ) {
    if ( msgid === null ) {
        return $.trigger( errContainer, 'off' );
    }
    let [hid, msg] = Help[ msgid ];

    // 存储关联元素，便于单击定位。
    $.trigger( linkElem(errContainer, el), 'on' );

    // 进阶：帮助ID嵌入到提示链接中。
    $.trigger( $.get('a', errContainer), 'setv', [hid, msg, msg] );
}


/**
 * 干净回调。
 * 临时关闭节点变化跟踪以避免历史记录。
 * @param  {Function} handle 回调操作
 * @return {Value} 回调的返回值
 */
function cleanCall( handle ) {
    let _old = $.config({
        varyevent: false,
        bindevent: false,
    });
    try {
        return handle();
    }
    finally { $.config(_old) }
}


/**
 * 控制台警告。
 * @param  {String} msg 输出消息
 * @param  {Value} data 关联数据
 * @return {void}
 */
function warn( msg, data ) {
    window.console.warn( msg, data || '' );
}


/**
 * 控制台错误提示。
 * @param  {String} msg 输出消息
 * @param  {Value} data 关联数据
 * @return {void}
 */
function error( msg, data ) {
    window.console.error( msg, data || '' );
}



//
// 单元批量转换。
//----------------------------------------------------------------------------


/**
 * 数据提取并合并。
 * 如果源元素是行块，节点集会是二维数组。
 * @param  {[Element]} els 数据元素
 * @return {[Object, [Node]]} 提取的选项集和节点集
 */
function convData2( els ) {
    let _obj = {},
        _buf = [];

    for ( const el of els ) {
        let [opts, data] = convData( el );
        _buf.push( data );
        $.assign( _obj, opts );
    }
    return [ _obj, _buf ];
}


/**
 * 创建内联单元转换。
 * 各别转换，各别替换。
 * @param  {String} name 转换目标名
 * @param  {[Element]} els 选取集
 * @return {[DOMEdit, [Element]]} [操作实例，新元素集]
 */
function convertInlines( name, els ) {
    let [opts, data] = convData2( els ),
        _new = data.map( nd => create(name, opts, nd) );

    return [ new DOMEdit(__Edits.replaces, els, _new), _new ];
}


/**
 * 创建内容行单元转换。
 * 如果源数据为行块元素，其子单元独立转换，
 * 行集替换行块根当前位置。
 * @param  {String} name 转换目标名
 * @param  {[Element]} els 选取集
 * @return {[DOMEdit, [Element]]} [操作实例，新元素集]
 */
function convertLines( name, els ) {
    let [opts, data] = convData2( els ),
        _new = data.map(
            el => $.isArray(el) ?
                el.map( nd => create(name, opts, nd) ) :
                create( name, opts, el )
        );
    return [ new DOMEdit(__Edits.replaces, els, _new), _new.flat() ];
}


/**
 * 创建行块单元转换。
 * 如果数据源为内容行元素，合并转换为单一目标，
 * 否则各别自行转换。
 * @param  {String} name 转换目标名
 * @param  {[Element]} els 选取集
 * @return {[DOMEdit, [Element]]} [操作实例，新元素集]
 */
function convertBlock( name, els ) {
    let [opts, data] = convData2( els ),
        _new = null;

    if ( convType(els[0]) === Sys.convLines ) {
        // 合并为单一目标。
        _new = create( name, opts, data, true );
        return [ new DOMEdit(__Edits.replacex, els, _new), [_new] ];
    }
    _new = data.map(
        els => create( name, opts, els, true )
    );
    return [ new DOMEdit(__Edits.replaces, els, _new), _new ];
}


/**
 * 实施判断转换。
 * 选取约束已保证源元素为相同类型（convBlocks|convLines|convInlines）。
 * @param  {String} name 转换目标名
 * @param  {[Element]} els 选取集
 * @return {Element|[Element]} 目标类型新元素（集）
 */
function convertTo( name, els ) {
    let _to = convToType( name );

    switch ( _to ) {
        case Sys.convInlines:
            return convertInlines( name, els );
        case Sys.convLines:
            return convertLines( name, els );
        case Sys.convBlocks:
            return convertBlock( name, els );
    }
    throw new Error( `[${name}] convert is not supported.` );
}



//
// 固定位置单元插入
// 包含：顶层，标题，导言，结语。
//----------------------------------------------------------------------------


//
// 顶层单元选择器配置。
// self: 自身选择器
// prev: 前端元素序列（靠前优先）
//
const topItemslr = {
    // 单纯页标题
    [ T.H1 ]: {
        self: '>h1, >hgroup',
        prev: null
    },

    [ T.HGROUP ]: {
        self: '>h1, >hgroup',
        prev: null
    },

    [ T.ABSTRACT ]: {
        self: '>header[role=abstract]',
        prev: [ T.H1 ]
    },

    [ T.TOC ]: {
        self: '>nav[role=toc]',
        prev: [ T.ABSTRACT, T.H1 ]
    },

    [ T.ARTICLE ]: {
        self: '>article',
        prev: [ T.TOC, T.ABSTRACT, T.H1 ]
    },

    [ T.REFERENCE ]: {
        self: '>nav[role=reference]',
        prev: [ T.ARTICLE, T.TOC, T.ABSTRACT, T.H1 ]
    },

    [ T.SEEALSO ]: {
        self: '>aside[role=seealso]',
        prev: [ T.REFERENCE, T.ARTICLE, T.TOC, T.ABSTRACT, T.H1 ]
    },

    [ T.FOOTER ]: {
        self: '>footer',
        prev: [ T.SEEALSO, T.REFERENCE, T.ARTICLE, T.TOC, T.ABSTRACT, T.H1 ]
    }
};


//
// 区块内单元配置。
// self: 单元自身选择器
// prev: 前部参考元素序列
//
const fixItemslr = {
    // <hgroup/h1>
    [ T.H1 ]: {
        self: '>h1',
        prev: null
    },

    // <section/h2>
    [ T.H2 ]: {
        self: '>h2',
        prev: null
    },

    // 小区块标题
    [ T.H3 ]: {
        self: '>h3',
        prev: null
    },

    // 子列表标题
    [ T.H4 ]: {
        self: '>h4',
        prev: null
    },

    [ T.AH4 ]: {
        self: '>h4',
        prev: null
    },

    [ T.SUMMARY ]: {
        self: '>summary',
        prev: null
    },

    [ T.FIGCAPTION ]: {
        self: '>figcaption',
        prev: null
    },

    [ T.CAPTION ]: {
        self: '>caption',
        prev: null
    },

    [ T.THEAD ]: {
        self: '>thead',
        prev: [ T.CAPTION ]
    },

    [ T.TBODY ]: {
        self: '>tbody:last-of-type',
        prev: [ T.THEAD, T.CAPTION ]
    },

    [ T.TFOOT ]: {
        self: '>tfoot',
        prev: [ T.TBODY, T.THEAD, T.CAPTION ]
    },

    [ T.HEADER ]: {
        self: '>header',
        prev: [ T.H2 ]
    },

    [ T.FOOTER ]: {
        self: '>footer',
        prev: [ 'LastChild' ]
    },

    [ T.PIMG ]: {
        self: '>img',
        prev: [ 'LastChild' ]
    },

    // 抽象位置
    LastChild: {
        self: ':last-child',
        prev: null
    }
};


/**
 * 前端参考元素检索。
 * @param  {Element} box 容器元素
 * @param  {[Number]} tvs 前端元素类型序列
 * @param  {Object} cobj 配置对象
 * @return {Element|null}
 */
function beforeRef( box, tvs, cobj ) {
    let _ref = null;
    if ( !tvs ) {
        return _ref;
    }
    for ( const tv of tvs ) {
        _ref = $.get( cobj[tv].self, box );
        if ( _ref ) break;
    }
    return _ref;
}


/**
 * 固定单元插入。
 * 有则替换，否则按位置插入。
 * @param  {Element} box 容器元素
 * @param  {Element} el  数据元素（标题/标题组/固定单元）
 * @param  {Object} cobj 配置对象
 * @return {DOMEdit} 操作实例
 */
function fixInsert( box, el, cobj ) {
    let _cfg = cobj[ getType(el) ],
        _its = $.get( _cfg.self, box );

    if ( _its ) {
        return new DOMEdit( () => $.replace(_its, el) );
    }
    _its = beforeRef( box, _cfg.prev, cobj );

    return new DOMEdit(
        _its ? () => $.after(_its, el) : () => $.prepend(box, el)
    );
}


/**
 * 插入标题元素。
 * 标题集与父元素集的成员一一对应。
 * @param  {[Element]} pels 父元素集
 * @param  {[Element]} subs 子元素集（标题）
 * @return {[DOMEdit]} 操作实例集
 */
function insFixnode( pels, subs ) {
    let _buf = [];

    pels.forEach( (box, i) =>
        subs[i] != null &&
        _buf.push( fixInsert(box, subs[i], fixItemslr) )
    );
    return _buf;
}



//
// 上下文菜单条目可用性判断
// @param  {[Element]} els 当前选取集
// @return {Boolean}
//----------------------------------------------------------------------------

/**
 * 可否微编辑。
 * 依微编辑逻辑，首个可编辑即可。
 * @return {Boolean}
 */
function canMinied( els ) {
    return isContent( els[0] );
}


/**
 * 是否可转换。
 * @return {Boolean}
 */
function canConvert() {
    return Kit.convtype() !== null;
}


/**
 * 缩进递减。
 * 全为章节/片区单元且至少有一个非顶层章节。
 * @return {Boolean}
 */
function canIndent1( els ) {
    return sameTag( els, 'SECTION' ) && els.some( el => getType(el) !== T.S1 );
}


/**
 * 缩进递增。
 * 全为章节/片区单元即可。
 * @return {Boolean}
 */
function canIndent2( els ) {
    return sameTag( els, 'SECTION' );
}


/**
 * 普通删除。
 * @return {Boolean}
 */
function canDeletes( els ) {
    return els.every( canDelete );
}


/**
 * 属性编辑。
 * 全部选取必需相同且可编辑属性。
 * @return {Boolean}
 */
function canProperty( els ) {
    let _tvs = [...typeSets(els)];
    return _tvs.length === 1 && !!property( _tvs[0] );
}


//
// 上下文菜单状态处理集
// 注意与菜单条目顺序保持一致。
//
const cmenuStatusHandles = [
    canMinied,
    canConvert,
    canIndent1,
    canIndent2,
    canDeletes,
    canProperty,
];



//
// 单元合并辅助。
// 用于行块合并操作的子单元提取。
//----------------------------------------------------------------------------

// 定制集。
// 默认提取器为 childrenGetter。
const mergeGetters = {
    [ T.S1 ]:           sectionGetter,
    [ T.S2 ]:           sectionGetter,
    [ T.S3 ]:           sectionGetter,
    [ T.S4 ]:           sectionGetter,
    [ T.S5 ]:           sectionGetter,
    [ T.SECTION ]:      sectionGetter,

    [ T.TABLE ]:        tableGetter,
    [ T.TR ]:           null,

    [ T.HEADER ]:       xblockGetter,
    [ T.FOOTER ]:       xblockGetter,
    [ T.BLOCKQUOTE ]:   xblockGetter,
    [ T.ASIDE ]:        xblockGetter,
    [ T.DETAILS ]:      detailsGetter,
}


/**
 * 获取子单元取值器。
 * 返回null表示目标元素不可取值（合并）。
 * @param  {Number} tval 目标类型
 * @return {Function|null}
 */
function subsGetter( tval ) {
    let _fn = mergeGetters[ tval ];
    return _fn === null ? null : _fn || childrenGetter;
}


/**
 * 通用子单元提取器。
 * @param  {Element} el 代码容器元素
 * @return {[Element]}
 */
function childrenGetter( el ) {
    return $.children( el );
}


/**
 * 小区块提取器。
 * 会剔除小标题仅取主体内容，
 * 可正常处理多个小标题的非正常状况。
 * @param  {Element} el 小区块容器元素
 * @return {[Element]}
 */
function xblockGetter( el ) {
    return _bodyGets( el, '>h3' );
}


/**
 * 详细内容提取器。
 * @param  {Element} el 容器元素
 * @return {[Element]}
 */
function detailsGetter( el ) {
    return _bodyGets( el, '>summary' );
}


/**
 * 片区内容提取。
 * 仅适用相同层级的片区或深片区单元。
 * @param  {Element} el 片区元素
 * @return {[Element]}
 */
function sectionGetter( el ) {
    return _bodyGets( el, '>h2' );
}


/**
 * 表格内容提取。
 * 仅取表体部分<tbody>集。
 * 注：外部应当保证表格的列数相同。
 * @param  {Element} el 表格元素
 * @return {[Element]}
 */
function tableGetter( el ) {
    return _bodyGets( el, '>caption, >thead, >tfoot' );
}


/**
 * 主体内容提取。
 * 会排除标题部分，容错多个标题的非正常情况。
 * @param  {Element} el 容器元素
 * @param  {String} hslr 标题选择器
 * @return {[Element]}
 */
function _bodyGets( el, hslr ) {
    let _subs = $.children( el );

    for ( const hx of $.find(hslr, el) ) {
        let _i = _subs.indexOf(hx);
        if (_i >= 0) _subs.splice(_i, 1);
    }
    return _subs;
}


/**
 * 获取可合并单元内容集。
 * - 全部为内容元素但非双向固定单元（如<rb>）。
 * - 全部为相同类型，如果为表格单元，列数必需相同。
 * - 不同类型的行块单元必需兼容。
 * - 容器不能为空元素和密封类型元素。
 * 友好：
 * 允许表区域单元（<tbody><thead><tfoot>）里的<tr>合并，
 * 容器表格里的列数特性不变。
 * 返回false表示集合不可合并。
 * @param  {Element} box 合并到的容器元素
 * @param  {[Element]} els 元素集
 * @return {[Element]|false}
 */
function canMerges( box, els ) {
    let _btv = getType( box );

    if ( T.isContent(_btv) ) {
        return !T.isFixed(_btv) && els.every(isContent) && $(els).contents().flat();
    }
    let _tvs = [...typeSets(els)];

    // 特例
    if ( _btv === T.TABLE ) {
        return _tvs.length === 1 && _tvs[0] === T.TABLE && sameTable(box, els)
            && mergeChildren(els);
    }
    return isCompatibled(_btv, _tvs) && mergeChildren( els );
}


/**
 * 提取合并的子单元集。
 * 注：结果集已扁平化为1维数组。
 * @param  {[Element]}} els 元素集
 * @return {[Element]} 子元素集
 */
function mergeChildren( els ) {
    let _buf = [];

    for ( const el of els ) {
        let _fn = subsGetter( getType(el) );
        if ( _fn ) _buf.push( ..._fn(el) );
    }
    return _buf;
}


/**
 * 找到首个不可合并元素。
 * - to为内容元素时，找到首个非内容元素。
 * - to为表格元素时，找到首个非表格或不同列表格元素。
 * - to为普通行块时，找到首个不兼容元素。
 * - to为空元素或密封单元时，返回容器本身。
 * @param  {Element} to 合并到的元素
 * @param  {[Element]} els 待合并元素集
 * @return {Element}
 */
function mergeBadit( to, els ) {
    let _tv = getType( to );

    if ( T.isContent(_tv) ) {
        // isFixed：主要适用<rb|rt>
        return T.isFixed(_tv) ? to : _contentNoit( els );
    }
    if ( _tv === T.TABLE ) {
        return _tableNoit( to, els );
    }
    if ( T.isEmpty(_tv) || T.isSealed(_tv) ) {
        return to;
    }
    return compatibleNoit( to, els );
}


/**
 * 获取首个非内容元素。
 * @param  {[Element]} els 元素集
 * @return {Element}
 */
function _contentNoit( els ) {
    for ( const el of els ) {
        if ( !isContent(el) ) return el;
    }
}


/**
 * 参考表格元素不同查找。
 * 找到集合内首个与ref不同或列数不同的表格元素。
 * @param  {Element} ref 参考表格元素
 * @param  {[Element]} els 对比元素集，可能包含非表格元素
 * @return {Element|null}
 */
function _tableNoit( ref, els ) {
    let _n = tableObj(ref).cols();

    for ( const el of els ) {
        if ( el.tagName !== 'TABLE' || _n !== tableObj(el).cols() ) {
            return el;
        }
    }
    return null;
}



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 初始化全局数据。
 * 用于编辑器设置此模块中操作的全局目标。
 * @param {String} content 编辑器容器（根元素）
 * @param {String} pathbox 路径蓄力容器
 * @param {String} errbox 出错信息提示容器
 * @param {String} outline 大纲视图容器
 * @param {String} midtool 工具栏动态按钮区
 * @param {String} modal 模态框根容器
 * @param {String} inswhere 主面板内容插入位置根容器
 * @param {String} contab 主面板内容标签容器
 */
export function init( content, pathbox, errbox, outline, midtool, modal, contab, inswhere ) {
    contentElem   = $.get( content );
    pathContainer = $.get( pathbox );
    errContainer  = $.get( errbox );
    outlineElem   = $.get( outline );
    midtoolElem   = $.get( midtool );
    modalDialog   = $.get( modal );
    slaveInsert   = $.get( contab );
    insertWhere   = $.get( inswhere );


    // 开启tQuery变化事件监听。
    $.config({
        varyevent: true,
        // bindevent: true
    });
    $.on( contentElem, varyEvents, null, __TQHistory );


    // 内容数据初始处理。
    // 预存储保留表格列特征。
    $( 'table', contentElem )
    .forEach( tbl => tableObj(tbl, $.table(tbl)) );
}



//
// 内容区编辑处理集。
// 注：仅供快捷键映射对应。
// 2. 可供导入执行流直接调用（其方法）。
//
export const Edit = {

    //-- 焦点移动 ------------------------------------------------------------
    // n注记：空串会被转换为NaN。

    /**
     * 平级：前端元素。
     * n: 0值会移动到头部首个元素。
     * @param {Number} n 移动距离
     */
    focusPrevious( n ) {
        previousCall(
            __EHot.get(),
            n,
            els => setFocus( last(els) )
        );
    },


    /**
     * 平级：后端元素。
     * n: 0值会移动到末尾元素。
     * @param {Number} n 移动距离
     */
    focusNext( n ) {
        nextCall(
            __EHot.get(),
            n,
            els => setFocus( last(els) )
        );
    },


    /**
     * 纵深：上级元素。
     * 超出范围的目标指定被忽略。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param {Number} n 上升层级数
     */
    focusParent( n ) {
        parentCall(
            __EHot.get(),
            n,
            el => setFocus(el)
        );
    },


    /**
     * 纵深：目标子元素。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 位置下标
     */
    focusChild( n ) {
        childCall(
            __EHot.get(),
            n,
            el => setFocus(el)
        );
    },


    /**
     * 纵深：顶元素。
     * 注记：不支持计数逻辑。
     */
    focusItemTop() {
        topCall(
            __EHot.get(),
            el => setFocus(el)
        );
    },


    //-- 元素选取 ------------------------------------------------------------
    // 原地扩展，焦点不会移动。


    /**
     * [By] 单击相关操作。
     * - 单选：取消其它已选。
     * - 聚焦：无选取行为。
     * - 多选：多选或切换选。
     * - 跨选：焦点平级跨越扩选。
     * - 浮选：焦点平级切换选。
     * - 父选：聚焦目标的父元素。
     * - 父焦：切换选目标的父元素。
     * @data: Element 点击的目标元素
     * @param {Set} scam 辅助键按下集
     */
    click( evo, scam ) {
        let _hot = __EHot.get(),
            _el = evo.data;

        // 仅聚焦
        if ( scamPressed(scam, cfg.Keys.elemFocus) ) {
            return setFocus( _el );
        }
        // 跨选（焦点同级）
        if ( scamPressed(scam, cfg.Keys.acrossSelect) ) {
            let _to = closestFocus( _hot, _el ),
                _els = _to && siblingTo( _hot, _to );
            return _to && _els.length &&
                historyPush( new ESEdit(siblingsUnify, _els, _hot), new HotEdit(_hot) );
        }
        // 浮选（焦点同级）
        if ( scamPressed(scam, cfg.Keys.smartSelect) ) {
            let _to = closestFocus( _hot, _el );
            return _to && historyPush( ...selectOne(_to, 'turn') );
        }
        // 父焦（仅聚焦）
        if ( scamPressed(scam, cfg.Keys.parentFocus) ) {
            let _to = closestParent( _el );
            return _to && setFocus( _to );
        }
        // 父选（多选/切换）
        if ( scamPressed(scam, cfg.Keys.parentSelect) ) {
            let _to = closestParent( _el );
            return _to && historyPush( ...selectOne(_to, 'turn') );
        }
        // 切换/多选
        if ( scamPressed(scam, cfg.Keys.turnSelect) ) {
            return historyPush( ...selectOne(_el, 'turn') );
        }
        // 单选
        // 单击已聚焦单选忽略（冗余）。
        __ESet.has(_el) && _hot === _el && __ESet.size === 1 || historyPush( ...selectOne(_el, 'only') );
    },

    __click: 1,


    /**
     * [By] 从路径选取/聚焦。
     * 无条件移动到当前视口。
     * 按聚焦辅助键单击为仅聚焦，路径序列不重构。
     * 按切换选辅助键单击为切换选/多选（同内容区操作）。
     * 无按辅助键单击为普通多选。
     */
    pathTo( evo, scam ) {
        $.intoView( evo.data, 0 );

        if ( scamPressed(scam, cfg.Keys.elemFocus) ) {
            __EHot.set( evo.data );
            return;
        }
        if ( scamPressed(scam, cfg.Keys.turnSelect) ) {
            return historyPush( ...selectOne(evo.data, 'turn') );
        }
        // 避免添加重复记录。
        if ( !__ESet.has(evo.data) ) {
            historyPush( ...selectOne(evo.data, 'add') );
        }
    },

    __pathTo: 1,


    /**
     * 选取切换。
     * 键盘快捷键选取切换。
     */
    turn() {
        let _el = __EHot.get();
        _el && historyPush( ...selectOne(_el, 'turn') );
    },


    /**
     * 集合成员反选。
     */
    reverse() {
        let _el = __EHot.get();
        _el && historyPush( new ESEdit(reverseAdds, _el) );
    },


    /**
     * 同态全部兄弟元素。
     * 焦点元素不变。
     */
    siblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = $.siblings( _el );

        _els.length && historyPush( new ESEdit(siblingsUnify, _els, _el) );
    },


    /**
     * 取消焦点同级兄弟元素选取。
     * 包括取消焦点元素的选取，但焦点不变。
     */
    cleanSiblings() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = $.children( _el.parentElement )
            .filter( el => __ESet.has(el) );

        _els.length && historyPush( new ESEdit(() => __Selects.removes(_els)) );
    },


    /**
     * 同态同类兄弟元素。
     * 焦点元素不变。
     */
    tagsame() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = $.siblings( _el, _el.tagName );

        _els.length && historyPush( new ESEdit(siblingsUnify, _els, _el) );
    },


    /**
     * 同态叔伯元素内的同类子元素。
     * 焦点元素不变。
     * 用例：
     * 选取或取消选取兄弟章节的标题以统一处理。
     */
    tagsame2() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = $.find( `>* >${_el.tagName}`, _el.parentElement.parentElement );

        _els.splice( _els.indexOf(_el), 1 );
        _els.length && historyPush( new ESEdit(elementsUnify, _els, _el) );
    },


    /**
     * 同态叔伯元素内的同类同位置子元素。
     * 焦点元素不变。
     * 用例：
     * 选取或取消选取表区域（如<tbody>）内同列单元格。
     */
    tagsame2x() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _pel = _el.parentElement,
            _els = null;

        if ( _pel.tagName === 'TR' ) {
            let _tsec = _pel.parentElement;
            _els = columnCells( _el, tableObj(_tsec.parentElement), _tsec );
        } else {
            _els = $.find( `>* >${ nthSelector(_el) }`, _pel.parentElement );
        }
        _els.splice( _els.indexOf(_el), 1 );

        _els.length && historyPush( new ESEdit(elementsUnify, _els, _el) );
    },


    /**
     * 选取焦点元素内顶层内容元素。
     * 友好：
     * 焦点元素定位到首个内容子元素。
     */
    contentBoxes() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = contentBoxes( _el );

        _els.some( el => !__ESet.has(el) ) &&
        historyPush( new ESEdit(contentSelect, _els, 'adds'), new HotEdit(_els[0]) );
    },


    /**
     * 获取焦点元素内顶层内容元素，
     * 注：新的元素集插入到集合的头部。
     */
    contentBoxesStart() {
        let _el = __EHot.get();
        if ( !_el ) return;

        let _els = contentBoxes( _el );

        _els.some( el => !__ESet.has(el) ) &&
        historyPush( new ESEdit(contentSelect, _els, 'unshift'), new HotEdit(_els[0]) );
    },


    //-- 选取扩展 ------------------------------------------------------------
    // 焦点会移动到扩展目标。


    /**
     * 同态：前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    previous( n ) {
        previousCall(
            __EHot.get(),
            n,
            (els, beg) => historyPush( new ESEdit(siblingsUnify, els, beg), new HotEdit(last(els)) )
        );
    },


    /**
     * 同态：前端兄弟元素添加/移出。
     * 焦点移动到集合最后一个成员。
     * @param {Number} n 扩展距离
     */
    next( n ) {
        nextCall(
            __EHot.get(),
            n,
            (els, beg) => historyPush( new ESEdit(siblingsUnify, els, beg), new HotEdit(last(els)) )
        );
    },


    /**
     * 父级元素选取。
     * 可能存在同级兄弟元素选取，因此需要向下清理。
     * 焦点元素可能在已选取父级元素内，而目标父级元素并未抵达该选取元素，
     * 因此也需要向上级清理。
     * @param {Number} n 上升层数
     */
    parent( n ) {
        return parentCall(
            __EHot.get(),
            n,
            el => __ESet.has(el) || historyPush( ...selectOne(el, 'add') )
        );
    },


    /**
     * 子元素选取。
     * 焦点元素可能在已选取父级元素之内，因此需要向上清理。。
     * @param {Number} n 子元素位置下标（从0开始）
     */
    child( n ) {
        return childCall(
            __EHot.get(),
            n,
            el => __ESet.has(el) || historyPush( new ESEdit(elementOne, el, 'safeAdd', true), new HotEdit(el) )
        );
    },


    /**
     * 选取顶元素。
     * - 内联单元：行内容元素或单元格元素。
     * - 行块单元：单元逻辑根元素。
     * - 内联内结构：所属内联元素。
     * 注记：清理逻辑同.parentN。
     */
    itemTop() {
        topCall(
            __EHot.get(),
            el => __ESet.has(el) || historyPush( ...selectOne(el, 'add') )
        );
    },


    //-- 移动选取 ------------------------------------------------------------
    // 单选游走：焦点移动到目标元素


    /**
     * 单选：平级前端元素。
     * n: 0值会移动到头部首个元素。
     * @param {Number} n 移动距离
     */
    onlyPrevious( n ) {
        previousCall(
            __EHot.get(),
            n,
            els => historyPush( ...selectOne(last(els), 'only') )
        );
    },


    /**
     * 单选：平级后端元素。
     * n: 0值会移动到末尾元素。
     * @param {Number} n 移动距离
     */
    onlyNext( n ) {
        nextCall(
            __EHot.get(),
            n,
            els => historyPush( ...selectOne(last(els), 'only') )
        );
    },


    /**
     * 单选：上级元素。
     * 返回false表示目标超出范围。
     * 注意：需要提供准确距离值，0值没有特殊含义。
     * @param {Number} n 移动距离
     */
    onlyParent( n ) {
        parentCall(
            __EHot.get(),
            n,
            el => historyPush( ...selectOne(el, 'only') )
        );
    },


    /**
     * 单选：目标子元素。
     * 位置下标支持负值从末尾算起（-1为末尾子元素）。
     * @param {Number} n 移动距离
     */
    onlyChild( n ) {
        childCall(
            __EHot.get(),
            n,
            el => historyPush( ...selectOne(el, 'only') )
        );
    },


    /**
     * 单选：顶元素。
     */
    onlyItemTop() {
        topCall(
            __EHot.get(),
            el => historyPush( ...selectOne(el, 'only') )
        );
    },


    //-- 虚焦点相关 ----------------------------------------------------------
    // 与实际焦点无关了。


    /**
     * 兄弟全选。
     * 注记：
     * 如果选取集成员存在叔侄关系，就会有清理覆盖，后选取的元素会清理掉先选取的元素。
     * 下同。
     */
    siblingsVF() {
        if ( hasSibling(__ESet) ) {
            return;
        }
        historyPush( new ESEdit(elementAdds, __ESet, el => $.siblings(el)) )
    },


    /**
     * 兄弟同类选取。
     */
    tagsameVF() {
        if ( hasSibling(__ESet) ) {
            return;
        }
        historyPush( new ESEdit(elementAdds, __ESet, el => $.find(`>${el.tagName}`, el.parentElement)) );
    },


    /**
     * 前向扩选。
     */
    previousVF( n ) {
        if ( hasSibling(__ESet) ) {
            return;
        }
        n = isNaN(n) ? 1 : n;

        historyPush( new ESEdit(elementAdds, __ESet, el => $.prevAll(el, (_, i) => i <= n)) );
    },


    /**
     * 后向扩选。
     */
    nextVF( n ) {
        if ( hasSibling(__ESet) ) {
            return;
        }
        n = isNaN(n) ? 1 : n;

        historyPush( new ESEdit(elementAdds, __ESet, el => $.nextAll(el, (_, i) => i <= n)) );
    },


    /**
     * 向下内容根。
     * 向内检索各自独立，因此无需向上下清理。
     * 友好：焦点定位到集合的首个成员上。
     */
    contentBoxesVF() {
        let _els = [...__ESet]
            .map( el => contentBoxes(el) ).flat();

        if ( sameSets(__ESet, _els) ) {
            return;
        }
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) );
    },


    /**
     * 子元素定位。
     * 向内检索各自独立，因此无需向上下清理。
     * 友好：焦点定位到集合的首个成员上。
     */
    childVF( n ) {
        n = n || 0;
        let _els = $.map( __ESet, el => $.children(el, n) );

        if ( sameSets(__ESet, _els) ) {
            return;
        }
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) );
    },


    /**
     * 父级选取。
     * 叔伯元素可能重叠，选取方法需上下清理。
     * 友好：焦点定位到集合的首个成员上。
     */
    parentVF( n ) {
        let _els = new Set();

        for ( const el of __ESet ) {
            parentCall( el, n, box => _els.add(box) );
        }
        _els = [..._els];

        sameSets(__ESet, _els) || historyPush( new ESEdit(newCleanAdds, _els), new HotEdit(_els[0]) );
    },


    /**
     * 上级顶元素。
     */
    itemTopVF() {
        let _els = new Set();

        for ( const el of __ESet ) {
            topCall( el, top => _els.add(top) );
        }
        _els = [..._els];

        // 顶层再向上无效（无改选）。
        sameSets(__ESet, _els) || historyPush( new ESEdit(newCleanAdds, _els), new HotEdit(_els[0]) );
    },


    //-- 选取集排序 ----------------------------------------------------------


    /**
     * 正序（DOM树）。
     * 焦点设置到首个成员。
     */
    selectSort() {
        let _els = $(__ESet).sort().item();

        if ( _els.length < 2 ) {
            return;
        }
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) );
    },


    /**
     * 逆序。
     * 焦点设置到首个成员。
     */
    selectReverse() {
        let _els = $(__ESet).sort().item().reverse();

        if ( _els.length < 2 ) {
            return;
        }
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) );
    },


    //
    // 元素编辑
    //////////////////////////////////////////////////////////////////////////


    /**
     * 内容文本化。
     * 会忽略集合中都没有子元素的情形。
     * 注记：
     * 扩展到By部分，但此不需要evo实参。
     */
    toText() {
        let $els = $(__ESet);

        if ( $els.length === 0 || !hasChildElement($els) ) {
            return;
        }
        if ( !$els.every(canTotext) ) {
            // 目标必须为内容元素。
            return help( 'need_conelem', totextBadit($els) );
        }
        historyPush( cleanHot($els), new DOMEdit(__Edits.toText, $els) );
    },

    __toText: null,


    /**
     * 内容提升（unwrap）。
     * 目标和目标的父元素都必须是内容元素。
     * - 被操作的元素取消选取。
     * - 如果焦点在目标元素上，取消焦点。
     * 注记：（同上）
     */
    unWrap() {
        let $els = $(__ESet);

        if ( $els.length === 0 ) {
            return;
        }
        if ( !$els.every(canUnwrap) ) {
            // 选取元素及其父元素都必须为内容元素。
            return help( 'both_conelem', unwrapBadit($els) );
        }
        historyPush( cleanHot($els, true), clearSets(), new DOMEdit(__Edits.unWrap, $els) );
    },

    __unWrap: null,


    /**
     * 智能删除。
     * - 完整的逻辑单元（行块、内联）。
     * - 删除不影响结构逻辑的元素（如：<li>、<tr>等）。
     * 注记：
     * 兼容OBT和程序快捷键两种操作。
     * 返回值可用于模板 OBT:on 中进阶判断。
     * @return {Boolean} 是否成功删除。
     */
    deletes() {
        let $els = $( __ESet ),
            _op = removeNodes( $els, true );

        if ( _op ) {
            historyPush( cleanHot($els, true), clearSets(), _op );
        }
        return !!_op;
    },


    /**
     * 强制删除。
     * 不再保护结构单元的结构。
     */
    deleteForce() {
        let $els = $( __ESet ),
            _op = removeNodes( $els );

        _op && historyPush( cleanHot($els, true), clearSets(), _op );
    },


    /**
     * 内容删除。
     * 内部内容根元素的内容（文本、内联等）。
     */
    deleteContents() {
        let $els = $(__ESet),
            $cons = $els.map( el => contentBoxes(el) ).flat(),
            _op = elementsEmpty( $cons );

        // 选取根内容元素集
        _op && historyPush( clearSets(), cleanHot($cons), _op, pushes($cons) );
    },


    /**
     * 原地克隆（各别）。
     * 与焦点元素无关。
     * 选取集单一成员时支持数字指定克隆数量。
     */
    elementCloneSelf( n ) {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        if ( $els.some(isOnly) ) {
            return help( 'only_child', repeatBadit($els) );
        }
        let $new = $els.map( el => cleanedClone(el) );

        if ( $new.length === 1 ) {
            $new = [ repeatN($new[0], n) ];
        }
        // 记录焦点，避免焦点移动到新元素内后，Undo时删除焦点。
        historyPush( new HotEdit(), cleanHot($els, true), clearSets(), new DOMEdit(__Edits.cloneAfter, $els, $new), pushes($new.flat()) );
    },


    /**
     * 原地克隆（分组）。
     * 与焦点元素无关。
     * 选取集单一成员时支持数字指定克隆数量。
     */
    elementCloneTeam( n ) {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        if ( $els.some(isOnly) ) {
            return help( 'only_child', repeatBadit($els) );
        }
        let _els2 = adjacentTeam( $els.sort() ),
            _refs = _els2.map( els => last(els) ),
            _new2 = cloneTeam( _els2 );

        if ( _new2.length === 1 && _new2[0].length === 1 ) {
            _new2[0] = repeatN( _new2[0][0], n );
        }
        // 同上记录焦点。
        historyPush( new HotEdit(), clearSets(), new DOMEdit(__Edits.cloneAfter, _refs, _new2), pushes(_new2.flat()) );
    },


    /**
     * 向内填充（移动）。
     * 遵循编辑器默认的内插入逻辑（逐层测试构建）。
     */
    elementFill() {
        let _box = __EHot.get();
        if ( !_box ) return;

        let _ops = moveAppend( $(__ESet), _box, null, true );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内填充（克隆）。
     */
    elementCloneFill() {
        let _box = __EHot.get();
        if ( !_box ) return;

        let _ops = cloneAppend( $(__ESet), _box, null, true );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内末尾添加（移动）。
     */
    elementAppend() {
        let _box = __EHot.get();
        if ( !_box ) return;

        let _ops = moveAppend( $(__ESet), _box );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内末尾添加（克隆）。
     */
    elementCloneAppend() {
        let _box = __EHot.get();
        if ( !_box ) return;

        let _ops = cloneAppend( $(__ESet), _box );

        _ops && historyPush( ..._ops );
    },


    /**
     * 同级前插入（移动）。
     */
    elementBefore() {
        let _to = __EHot.get();
        if ( !_to ) return;

        let _ops = moveAppend(
                $(__ESet),
                _to.parentElement,
                _to
            );
        _ops && historyPush( ..._ops );
    },


    /**
     * 同级前插入（克隆）。
     */
    elementCloneBefore() {
        let _to = __EHot.get();
        if ( !_to ) return;

        let _ops = cloneAppend(
                $(__ESet),
                _to.parentElement,
                _to
            );
        _ops && historyPush( ..._ops );
    },


    /**
     * 同级后插入（移动）。
     */
    elementAfter() {
        let _to = __EHot.get();
        if ( !_to ) return;

        let _ops = moveAppend(
                $(__ESet),
                _to.parentElement,
                $.nextNode( _to )
            );
        _ops && historyPush( ..._ops );
    },


    /**
     * 同级后插入（克隆）。
     */
    elementCloneAfter() {
        let _to = __EHot.get();
        if ( !_to ) return;

        let _ops = cloneAppend(
                $(__ESet),
                _to.parentElement,
                $.nextNode( _to )
            );
        _ops && historyPush( ..._ops );
    },


    //-- 移动&缩进 -----------------------------------------------------------
    // 操作选取集，与焦点元素无关。
    // 当前选取不变。

    /**
     * 向前移动（平级）。
     * 同级兄弟元素按DOM节点顺序向前移动。
     * n 零值表示无穷大（端部），零散节点会汇聚。
     * 注记：
     * - 前端的位置固定元素会被视为端部。
     * - 选取集内如果包含位置固定元素，则不可移动。
     * @param {Number} n 移动距离
     */
    movePrevious( n ) {
        let $els = $(__ESet).sort(),
            _beg = $els[0];

        n = isNaN(n) ? 1 : n;

        if ( n < 0 || !$els.length || prevMoveEnd(_beg) ) {
            return;
        }
        if ( $els.some(afterFixed) ) {
            // 包含有固定不可以被移动的元素。
            return help( 'has_fixed2', moveAfterBadit($els) );
        }
        historyPush( new DOMEdit(__Edits.movePrev, siblingTeam($els), n) );
    },


    /**
     * 向后移动（平级）。
     * 并列兄弟元素按DOM节点逆序移动，
     * 距离超出范围会导致部分或全部兄弟元素反序排列。
     * n: 参考同 movePrevious
     * @param {Number} n 移动距离
     */
    moveNext( n ) {
        let $els = $(__ESet).sort(),
            _beg = last( $els );

        n = isNaN(n) ? 1 : n;

        if ( n < 0 || !$els.length || nextMoveEnd(_beg) ) {
            return;
        }
        if ( $els.some(beforeFixed) ) {
            // 包含有固定不可以被移动的元素。
            return help( 'has_fixed1', moveBeforeBadit($els) );
        }
        historyPush( new DOMEdit(__Edits.moveNext, siblingTeam($els), n) );
    },


    /**
     * 减少缩进。
     * 仅适用章节（section）单元。
     * 当前章节提升一级插入到原所属章节之前。
     * 本身就是顶层章节的被简单忽略。
     */
    indentReduce() {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        if ( !canIndent1($els) ) {
            return help( 'only_section', indentBadit($els) );
        }
        historyPush( new DOMEdit(__Edits.sectionsUp, $els) );
    },


    /**
     * 增加缩进。
     * 仅适用章节（section）单元。
     * 当前章节降一级，插入原地构造的一个平级空章节。
     */
    indentIncrease() {
        let $els = $( __ESet );
        if ( !$els.length ) return;

        if ( !canIndent2($els) ) {
            return help( 'only_section', indentBadit($els) );
        }
        let _els2 = sectionBoxes( $els );

        historyPush( new DOMEdit(__Edits.sectionsDown, _els2) );
    },


    /**
     * 同级逆序化。
     */
    reversePlaces() {
        let $els = $(__ESet).sort(),
            els2 = siblingTeam( $els );

        if ( $els.length < 2 || els2.every(els => els.length < 2) ) {
            return;
        }
        if ( $els.some(isFixed) ) {
            return help( 'has_fixed', moveBadit($els) );
        }
        historyPush( new DOMEdit(__Edits.reverses, els2) );
    },


    /**
     * 内容合并。
     * 适用于内容元素、兼容行块元素、相同类型的元素（表格除外）。
     * 按选取顺序执行。首个选取元素为容器。
     * 被提取内容的元素自身会被移除（除非不可删除）。
     * 注：
     * 表格的合并需要列数相同，且仅抽取其<tbody>单元。
     */
    contentsMerge() {
        let $els = $( __ESet ),
            _box = $els.shift();

        if ( !$els.length ) {
            return;
        }
        let _subs = canMerges( _box, $els );

        if ( !_subs ) {
            return help( 'merge_types', mergeBadit(_box, $els) );
        }
        historyPush(
            cleanHot( $els, true ),
            clearSets( $els ),
            new DOMEdit( __Edits.merges, _box, _subs, $els ),
            ...selectOne( _box, 'safeAdd' ),
        );
    },


    //-- 定位移动 ------------------------------------------------------------
    // 前提：position:absolute
    // 普通移动为 1px/次，增强移动为 10px/次
    // 操作的是 left/top 两个样式，与 right/bottom 无关。
    // 注：对<svg>子单元无效。


    moveToLeft() {
        let _op = elementsPostion( $(__ESet), 'left', -1 );
        _op && historyPush( _op );
    },


    moveToLeftTen() {
        let _op = elementsPostion( $(__ESet), 'left', -10 );
        _op && historyPush( _op );
    },


    moveToRight() {
        let _op = elementsPostion( $(__ESet), 'left', 1 );
        _op && historyPush( _op );
    },


    moveToRightTen() {
        let _op = elementsPostion( $(__ESet), 'left', 10 );
        _op && historyPush( _op );
    },


    moveToUp() {
        let _op = elementsPostion( $(__ESet), 'top', -1 );
        _op && historyPush( _op );
    },


    moveToUpTen() {
        let _op = elementsPostion( $(__ESet), 'top', -10 );
        _op && historyPush( _op );
    },


    moveToDown() {
        let _op = elementsPostion( $(__ESet), 'top', 1 );
        _op && historyPush( _op );
    },


    moveToDownTen() {
        let _op = elementsPostion( $(__ESet), 'top', 10 );
        _op && historyPush( _op );
    },


    //-- 复制/粘贴 ----------------------------------------------------------
    // 浏览器剪贴板处理。
    // 注：在模板的调用链中使用。


    /**
     * 复制（copy）：
     * 提取选取元素的文本内容（textContent）到剪贴板。
     * 多个选取元素的内容以换行分隔。
     * 空文本内容的元素会表现出占位效果。
     */


    /**
     * 剪切（cut）：
     * 提取内容和规则同复制，同时会删除元素自身。
     * 如果有不可删除的内容，剪贴板内容会被设置为空（友好）。
     */


    /**
     * 粘贴：
     * 以剪贴板内容里的换行为切分，填充内容到选取集元素内的根内容元素里。
     * 内容分组与选取集成员一一对应，多出的内容或目标简单忽略。
     * 如果选取的目标只有一个，则源数据集视为一个整体粘贴，
     * 如果目标非内容元素，取其内部的根内容元素（集），此时数据依然视为一个整体。
     * 即：
     * - 相同粘贴需单选，或多选但内容单一。
     * - 各别对应粘贴需多选，且数据为多项（换行分隔）。
     * 注记：
     * 此处填充规则稍为复杂故定制（不宜直接使用 OBT:To.Update）。
     *
     * 目标：暂存区/栈顶1项。
     * 目标为从剪贴板取得的文本内容（已分解为数组）。
     * On: "paste|avoid clipboard trim pass split('\n')"
     * By: "Ed.paste"
     * @data: [String]
     * @param {Boolean} toend 追加式粘贴
     */
    paste( evo, toend ) {
        let _con2 = [...__ESet].map( el => contentBoxes(el) ),
            _cons = _con2.flat(),
            _meth = toend ? 'appends' : 'fills';

        if ( _cons.length ) {
            historyPush( cleanHot(_cons), ...textAppend2(_con2, evo.data, _meth) );
        }
    },

    __paste: 1,


    //-- 杂项 ----------------------------------------------------------------

    /**
     * 撤销操作。
     * 注记：
     * 为避免一次性大量撤销可能导致浏览器假死，仅支持单步逐次撤销。
     * 因为共用按钮，微编辑状态下的撤销也集成于此，虽然它们逻辑上是独立的。
     */
    editUndo() {
        $.trigger(
            contentElem,
            Sys.undoEvent,
            currentMinied ? undoMinied() : undoNormal(),
            true
        );
    },


    /**
     * 重做操作。
     * 注记：（同上）
     */
    editRedo() {
        $.trigger(
            contentElem,
            Sys.redoEvent,
            currentMinied ? redoMinied() : redoNormal(),
            true
        );
    },


    /**
     * 进入微编辑。
     * 需要是一个内容元素，否则仅简单设置焦点。
     * 注：对选取集逐个处理。
     */
    miniedIn() {
        let _el = __ESet.first();
        if ( !_el ) return;

        if ( !isContent(_el) ) {
            setFocus( _el );
            return help( 'need_conelem', _el );
        }
        historyPush( ...minied(_el) );
        currentMinied.active();
    },


    /**
     * 进入微编辑。
     * 注：光标设置在内容元素末尾。
     */
    miniedInEnd() {
        let _el = __ESet.first();
        if ( !_el ) return;

        if ( !isContent(_el) ) {
            setFocus( _el );
            return help( 'need_conelem', _el );
        }
        historyPush( ...minied(_el) );
        currentMinied.activeEnd();
    },


    /**
     * 弹出属性编辑框。
     */
    properties() {
        let $els = $(__ESet);

        if ( !canProperty($els) ) {
            return help( 'not_property', $els[0] );
        }
        propertyEdit( property( getType($els[0]) ) );
    },

};


//
// 辅助工具集。
// 仅供模板中在调用链上使用。
//
export const Kit = {

    //-- 功能调用 ------------------------------------------------------------

    /**
     * 撤销：工具栏按钮。
     * @return {void}
     */
    undo() {
        Edit.editUndo();
    },


    /**
     * 重做：工具栏按钮。
     * @return {void}
     */
    redo() {
        Edit.editRedo();
    },


    /**
     * 选取集取消。
     * 如果焦点在选取的元素上/内，则同时取消焦点。
     * ESC键最底层取消操作。
     * 注记：固定配置不提供外部定制。
     * @return {void}
     */
    ecancel() {
        let _els = [...__ESet];

        if ( !_els.length ) {
            return;
        }
        historyPush( cleanHot(_els, true), new ESEdit(() => __Selects.empty()) );
    },


    //-- On 扩展 -------------------------------------------------------------


    /**
     * 获取选取集。
     * @return {[Element]}
     */
    sels() {
        return [ ...__ESet ];
    },


    /**
     * 获取首个选取元素的表格实例。
     * 注：选取元素可能是表格的子单元。
     * @return {Table|null}
     */
    tobj() {
        return __ESet.size ? tableObj( tableNode(__ESet.first()) ) : null;
    },


    /**
     * 获取表格行容器。
     * 仅参照首个选取的元素。
     * 选取元素仅可能为<tr>或<thead|tbody|tfoot>（合法选单约束）。
     * @return {Element}
     */
    trbox() {
        let _el = __ESet.first();
        return _el.tagName === 'TR' ? _el.parentElement : _el;
    },


    /**
     * 获取表区域元素容器。
     * 仅参照首个选取的元素。
     * 选取的元素仅可能为<table>或表区域（<thead|tbody|tfoot>）元素。
     * 注记：
     * 如果选取的是<table>，选单提取功能中已限定为单个选取。
     */
    tsecbox() {
        let _el = __ESet.first();
        return _el.tagName === 'TABLE' ? _el : _el.parentElement;
    },


    /**
     * 获取代码容器。
     * 用于提取语言和Tab设置。
     * 选取元素限于：
     * - <pre:codeblock>
     * - <pre:codeblock>/<code>  // 含配置
     * - <ol:codelist>  // 含全局配置
     * - <ol:codelist>/<li>
     * - <code>  // 含自身配置
     */
    codebox() {
        let _el = __ESet.first();
        if ( !_el ) return null;

        switch ( getType(_el) ) {
            case T.CODEBLOCK:
                return _el.firstElementChild;
            case T.CODE:
            case T.CODELIST:
                return _el;
            case T.CODELI:
                return _el.parentElement;
        }
        throw new Error( `bad type of element.` );
    },


    /**
     * 获取选取集大小。
     * 用途：状态栏友好提示。
     * @return {Number}
     */
    esize() {
        return __ESet.size;
    },


    /**
     * 获取导引元素上存储的源目标。
     * 目标：暂存区/栈顶1项。
     * 目标为路径导引元素。
     * 用途：
     * - 鼠标指向路径时提示源目标（友好）。
     * - 单击路径元素选取或聚焦关联的目标元素。
     * - 出错提示区源目标指示等。
     * data: Element
     * @return {Element}
     */
    source( evo ) {
        return linkElem( evo.data );
    },

    __source: 1,


    /**
     * 检查范围是否合法。
     * 范围需在文本节点或内容元素但排除代码容器内。
     * 目标：暂存区/栈顶1项。
     * 目标为划选范围对象。
     * @data: Range
     * @return {Boolean}
     */
    rngok( evo ) {
        let _box = evo.data.commonAncestorContainer;
        evo.data.detach();

        if ( _box.nodeType === 3 ) {
            _box = _box.parentElement;
        }
        let _tv = getType( _box );

        return T.isContent( _tv ) && _tv !== T.CODE;
    },

    __rngok: 1,


    /**
     * 计算弹出菜单定位点。
     * 超出右边界时，菜单靠右边显示。
     * 目标：暂存区/栈顶1项。
     * @data: Element 菜单元素
     * @param  {Element} box 滚动容器
     * @param  {Number} x 鼠标点x坐标
     * @return {Number} y 鼠标点y坐标
     */
    menupos( evo, box, [x, y] ) {
        let _mw = $.outerWidth( evo.data ),
            _co = $.offset( box ),
            _bw = $.innerWidth( box ),
            _y2 = y - _co.top + $.scrollTop(box) + Limit.popupGapTop;

        if ( x + _mw < _bw + _co.left ) {
            return [ x - _co.left, _y2 ];
        }
        return [ _bw - _mw - Limit.popupGapRight, _y2 ];
    },

    __menupos: 1,


    /**
     * 计算子菜单位置。
     * 对比子菜单宽度和父菜单的right值：
     * 小于right正常右侧弹出，否则弹出到左侧（通过返回的配置体现）。
     * @data Element 当前<li>条目
     * @return {Object} 样式配置对象
     */
    submenu( evo ) {
        let _box = $.parent( evo.data ),
            // 友好：-1
            _bow = $.outerWidth( _box ) - 1 + 'px',
            _sub = $.children( evo.data, -1 ),
            _rsp = parseFloat( $.css(_box, 'right') );

        return $.outerWidth(_sub) > _rsp ? { left: 'auto', right: _bow } : { left: _bow, right: 'auto' };
    },

    __submenu: 1,


    /**
     * 转换类型判断。
     * 根据选取集成员判断可转换的类型。
     * 注记：
     * 行元素视为行块（共享菜单），可互为转换，
     * 但行块和行元素不可同时选取（混合）。
     * @return {String|null}
     */
    convtype() {
        let _set = new Set();

        for ( const el of __ESet ) {
            _set.add( convType(el) );
        }
        if ( _set.size > 1 ) {
            return null;
        }
        let _n = first( _set );

        return _n === Sys.convLines ? Sys.convBlocks : _n;
    },

    __convtype: null,


    /**
     * 构造包含role指示的元素信息。
     * 注：基于PB:einfo的基础信息，冒号分隔role内容。
     * @param {String} einfo 元素基本信息
     */
    roleinfo( evo, einfo ) {
        let _v = $.attr( evo.data, 'role' );
        return _v ? `${einfo}:${_v}` : einfo;
    },

    __roleinfo: 1,


    /**
     * 获取上下文菜单启用条目集。
     * 目标：暂存区/栈顶1项。
     * 目标为菜单全部可操作条目集（[<li>]），
     * 顺序为：
     *  1. 微编辑。
     *  2. 转换（子菜单）。
     *  3. 升级（缩进）。
     *  4. 降级（缩进）。
     *  5. 删除（普通）。
     *  6. 属性。
     * @return {[Element]} 可启用的条目集
     */
    cmenable( evo ) {
        let _els = [...__ESet];

        if ( _els.length === 0 ) {
            return [];
        }
        return $.map( cmenuStatusHandles, (fn, i) => fn(_els) ? evo.data[i] : null );
    },

    __cmenable: 1,


    /**
     * 构造可插入的条目选单集。
     * 目标：暂存区/栈顶1项。
     * 目标为内容区已选取元素集。
     * 注记：
     * 选单条目定义在同一个模板文件中且已经载入。
     * @data: [Element]
     * @param  {String} type 位置类型（siblings|children）
     * @return {[Element]|null} 选单元素集（[<option>]）
     */
    inslist( evo, type ) {
        if ( !evo.data.length ) {
            return null;
        }
        let _ns = __levelHandles[type]( evo.data )

        return _ns.length > 0 ? Templater.nodes(_ns) : null;
    },

    __inslist: 1,


    /**
     * 片区内容混杂检查。
     * 即片区内是否同时包含子片区和内容件，这是不规范的结构。
     * 目标：暂存区/栈顶1项。
     * 目标为插入位置定义（siblings|children）。
     * @return {Boolean} 是否混杂
     */
    ismixed( evo ) {
        let _els = evo.data === Sys.levelName1 ?
            [...parentsSet(__ESet)] :
            [...__ESet];

        return _els.some( el => __reSecbox.test(el.tagName) && sectionState(el) === 3 );
    },

    __ismixed: 1,


    /**
     * 文本录入文本预处理
     * 如果切分，首尾空白会被先清理掉。
     * @data: String
     * @param  {Boolean} clean 是否清理空白
     * @param  {Boolean} split 是否切分（空行分段）
     * @return {[String]}
     */
    pretreat2( evo, clean, split ) {
        let _s = evo.data;

        _s = split ?
            _s.trim().split( __reBlankline ) :
            [ _s ];

        return clean ? _s.map( s => s.trim().replace(__reSpaceN, '$1') ) : _s;
    },

    __pretreat2: 1,


    /**
     * 文本录入预处理。
     * 可能已强制切分，支持集合处理。
     * @data: String|[String]
     * @param  {Boolean} clean 是否清理空白
     * @return {String|[String]}
     */
    pretreat1( evo, clean ) {
        let _v = evo.data;

        if ( $.isArray(_v) ) {
            return clean ? _v.map( s => s.replace(__reSpaceN, '$1') ) : _v;
        }
        return clean ? _v.trim().replace( __reSpaceN, '$1' ) : _v;
    },

    __pretreat1: 1,


    /**
     * 换行/空行切分。
     * 连续多个空行视为一个。
     * @data: String
     * @param  {Boolean} blank 空行切分
     * @return {[String]}
     */
    splitx( evo, blank ) {
        return evo.data.trim().split( blank ? __reBlankline : __reNewline );
    },

    __splitx: 1,


    /**
     * 代码编辑：
     * 3个特殊键的处理。
     * - Enter  回车键入换行，保持与原行相同的缩进。
     * - Tab    制表符键入一个空格序列（如果有el控件设定）。
     * - Backspace  退格键删除一个完整的缩进（如果前端为正常缩进）。
     * @data: Element 编辑根容器
     * @param  {String} key 键名（上面3个之一）
     * @param  {Range} rng 当前光标点范围
     * @param  {Element} el Tab空格数配置控件（<input>）
     * @return {String}
     */
    k3edit( evo, key, rng, el ) {
        let _lp = rangeTextLine( rng, true, evo.data ),
            _n = el && $.val( el );

        switch ( key ) {
            case 'Enter':
                // 无缩进时尾随一个空格（参见.blankline）
                return `\n${indentedPart(_lp) || ' '}`;
            case 'Tab':
                return tabSpaces( _lp, _n );
        }
        // Blankspace
        // 选取一个缩进序列即可。
        if ( _n > 0 && !rng.toString() && _lp.endsWith(' '.repeat(_n)) ) {
            rng.setStart( rng.endContainer, rng.endOffset-_n );
            rng.setEnd( rng.endContainer, rng.endOffset );
        }
        // 沿用浏览器默认行为
        return null;
    },

    __k3edit: 1,


    /**
     * 剪除多余缩进。
     * 以行集中最短的缩进为准，剪除前端缩进。
     * 忽略纯粹的空行。
     * 注：并不会清理首位空白。
     * @data: String
     * @param  {Boolean} skip 简单略过
     * @return {String}
     */
    indentcut( evo, skip ) {
        if ( skip ) {
            return evo.data;
        }
        let _ss = evo.data.split( __reNewline ).filter( s => !!s ),
            _cut = shortIndent( _ss );

        return _cut ? _ss.map( str => str.substring(_cut) ).join('\n') : evo.data;
    },

    __indentcut: 1,


    /**
     * 解析获取高亮代码。
     * @data: String 原始代码
     * @param  {Number} tab Tab空格数
     * @param  {String} lang 代码语言
     * @return {[Object3|Object2]} 高亮配置对象集
     */
    hlcode( evo, tab, lang ) {
        let _code = evo.data.split( __reNewline );

        if ( tab > 0 ) {
            _code = _code.map( s => tabToSpace(s, tab) );
        }
        _code = _code.join( '\n' );

        return lang ? new Hicolor(lang, _code).effect() : [{text: _code}];
    },

    __hlcode: 1,


    /**
     * 提取并构造代码选项对象。
     * @param  {Element} lang 语言定义控件
     * @param  {Element} tab Tab配置控件
     * @param  {Element} start 起始行定义控件
     * @return {Object3} 配置选项
     */
    codeopts( evo, tab, lang, start ) {
        return {
            lang:  $.val( lang ),
            tab:   $.val( tab ) || null,
            start: start && $.val( start ) || null,
        };
    },

    __codeopts: null,


    /**
     * 分解构造代码集。
     * 顶层不需要传递语言实参（已解析）。
     * 返回合法的子元素序列，无需再设置<code>属性。
     * @data: [Object3|Object2]
     * @return {[Element]} 代码行集（[<code>]）
     */
    codels( evo ) {
        return codeFlat(
            colorHTML( evo.data, htmlList ),
            null,
            listCode
        );
    },

    __codels: 1,


    /**
     * 分解构造代码块。
     * 如果有嵌入其它语言，会有子块存在。
     * @data: [Object3|Object2]
     * @param  {String} lang 所属语言（顶层）
     * @param  {Number} tab Tab空格数
     * @return {[Element]} 代码块子块集（[<code>]）
     */
    codeblo( evo, {lang, tab} ) {
        return codeFlat(
            colorHTML( evo.data, htmlBlock ),
            lang,
            blockCode,
            tab
        );
    },

    __codeblo: 1,


    /**
     * 合并源码。
     * 用于内联代码单元构建，通常只有单种语言。
     * 如果包含多种语言，简单合并（容错）。
     * @data: [Object3|Object2]
     * @return {String} 已渲染源码
     */
    codehtml( evo ) {
        return codeFlat( colorHTML(evo.data, htmlBlock), null, html => [html] )
            .join( '' );
    },

    __codehtml: 1,


    /**
     * 根据内容类型创建图片。
     * 图片选项由安全JSON解析（Worker），故返回一个Promise<Element>。
     * 内容格式：{
     *      url 首行URL，第二行特性配置
     *      b64 同上，但URL为DataURL
     *      svg XML源码内容
     * }
     * 注：插图单元使用。
     * @data: String
     * @param  {String} type 图片类型（url|b64|svg）
     * @return {Element|Promise<Element>} <svg>|Promise<img>
     */
    image3( evo, type ) {
        if ( type === 'svg' ) {
            return $.svg( { html: evo.data } );
        }
        return parseJSON( evo.data ).then( v2 => create(T.IMG, imgOpts(v2)) );
    },

    __image3: 1,


    /**
     * 创建媒体类子单元。
     * 即：<source>和<track>元素集。
     * 限于音频/视频容器。
     * @data: [String, String] 两个配置串（对象或对象数组格式）
     * @return {Promise<[Element]>}
     */
    mediasubs( evo ) {
        let [ss, ts] = evo.data;

        return Promise.all([
                parseJSON( ss.trim() || '[]' ),
                parseJSON( ts.trim() || '[]' )
            ]).then( mediaSubs );
    },

    __mediasubs: 1,


    /**
     * 创建最佳图片（<picture>）子单元。
     * 即：<source>元素集（不含<img>子单元）。
     * @data: String 配置格式串
     * @return {Promise<[Element]>}
     */
    picsubs( evo ) {
        return parseJSON( evo.data.trim() )
            .then( v => v ? arrVal(v).map(o => create(T.SOURCE2, o)) : [] );
    },

    __picsubs: 1,


    //-- By 扩展 -------------------------------------------------------------


    /**
     * 错误元素提示。
     * 按住聚焦辅助键单击设置焦点。
     * @data: Element 问题元素
     * @param  {Set} scam 按下的修饰键集
     * @return {void}
     */
    tips( evo, scam ) {
        if ( scamPressed(scam, cfg.Keys.elemFocus) ) {
            setFocus( evo.data );
        }
    },

    __tips: 1,


    /**
     * 章节滚动。
     * 滚动目标章节到当前视口。
     * @data: [Number] 章节序列
     * @return {void}
     */
    chapter( evo ) {
        let _el = $.get( h2PathSelector(evo.data), $.get('article', contentElem) );
        if ( _el ) $.intoView( _el, 2, 1 );
    },

    __chapter: 1,


    /**
     * 本地暂存。
     * 存储数据元素的内容HTML源码。
     * 会清除临时的状态类名（焦点、选取）。
     * 注记：
     * 出于简化和浏览器空间局限，仅支持单个编辑器实例存储。
     * @data: Element
     * @return {String} 存储完成提示
     */
    save( evo ) {
        $( __tmpclsSlr, evo.data )
        .removeClass( __tmpcls );

        window.localStorage.setItem( Sys.storeMain, $.html(evo.data) );
        return Tips.localStoreDone;
    },

    __save: 1,


    /**
     * 代码编辑：
     * 空行检查处理。
     * 换行之后跟随单个空格视为空行。
     * 此时光标在空格之后，友好选取该空格作为光标。
     * 注记：
     * 换行后附加一个空格，用于解决 document.execCommand() 操作中浏览器插入换行的问题。
     * - Chrome  容器内末尾键入一个Enter会被忽略显示，其它位置正常。
     * - Firefox 键入Enter后光标无法定位到新行，浏览器等待有字符输入后才会认可换行。
     * @data: Element 编辑根容器
     * @param {Boolean} enter 确认为Enter键入
     * @param {Range} rng 当前光标点
     * @param {Element} box 编辑根容器
     */
    blankline( evo, enter, rng ) {
        if ( !enter ) return;

        let _line = rangeTextLine( rng, true, evo.data );

        if ( _line.length > 1 || _line[0] !== ' ' ) {
            return;
        }
        rng.setStart( rng.endContainer, rng.endOffset-1 );
        rng.setEnd( rng.endContainer, rng.endOffset );
    },

    __blankline: 1,


    /**
     * 构造目录清单。
     * @data: Element 章节根
     * @return {[Element]} [<li>] 目录条目集
     */
    toclist( evo ) {
        return tocList( $.find('>section', evo.data) );
    },

    __toclist: 1,


    /**
     * 微编辑完成处理。
     * 目标：暂存区/栈顶1项。
     * 目标为确认键，仅限于 Enter|Tab（外部保证）。
     * - Enter          确认并退出。
     * - Ctrl + Enter   新建一个同类行（<p>|<li>|<dt>...），原行确认。
     * - Alt + Enter    新建一个逻辑行（如：<dt>到<dd>）或同类行，原行确认。
     * - Tab            当前完成，切换到下一个选取元素。
     * 注：Shift+Enter 为插入一个换行，浏览器默认行为无需实现。
     * @data: String
     * @param  {Set} scam 按下的辅助键集
     * @return {void}
     */
    medpass( evo, scam ) {
        let _src = currentMinied.elem();

        miniedOk( _src.tagName === 'H2' && _src );

        if ( evo.data === 'Tab' ) {
            return Edit.miniedIn();
        }
        let _ops = medCreateLine( scam, _src );
        if ( !_ops ) return;

        historyPush( ..._ops );
        currentMinied.active();
    },

    __medpass: 1,


    /**
     * 微编辑取消。
     * 注记：
     * 进入时已更新历史栈，所以取消后无重做能力。
     * @return {void}
     */
    medcancel() {
        __History.pop();
        stateNewEdit();
        currentMinied = null;

        $.trigger( midtoolElem, 'show' );
        $.trigger( slaveInsert, Sys.insType, Sys.normalTpl );
    },

    __medcancel: null,


    /**
     * 从范围创建内联单元。
     * 目标：暂存区/栈顶1项。
     * 新建的内联元素加入选取集并聚焦。
     * 注意：
     * 用户可能在已选取元素内划选创建，因此使用add方法添加。
     * @data: Range
     * @param  {String} name 单元名称
     * @return {void}
     */
    rngelem( evo, name ) {
        let _box = evo.data.commonAncestorContainer;

        if ( _box.nodeType === 3 ) {
            _box = _box.parentElement;
        }
        let _op = new RngEdit( evo.data, name ),
            _el = _op.elem();

        // 预先规范化，保证 RngEdit.undo 正常，
        // 最终聚焦避免用户错觉。
        historyPush( new DOMEdit(() => $.normalize(_box)), _op, new ESEdit(elementOne, _el, 'add'), new HotEdit(_el) );
    },

    __rngelem: 1,


    /**
     * 上下文菜单条目处理。
     * 目标：暂存区/栈顶1项。
     * 目标为菜单条目处理项名称（data-op）。
     * 注记：
     * - 不包含转换子菜单。
     * - 无返回值以不影响模板中后续的PB行为。
     * @data: String 处理名称
     * @return {void}
     */
    cmenudo( evo ) {
        let _fn = __cmenuOpers[evo.data];
        if ( _fn ) Edit[ _fn ]();
    },

    __cmenudo: 1,


    /**
     * 单元转换。
     * 转换创建的新单元数视目标类型而定。
     * - 内联：每项数据转换为一个目标单元。
     * - 段落：视为单体，同上效果。
     * - 行块：为内容行容器，数据集为子元素序列，转换为单一单元。
     * 目标：暂存区/栈顶1项。
     * 目标为转换到的单元名称。
     * 注记：
     * 模板中保证选取集转换到的可用清单合法。
     * @data: String
     * @return {void}
     */
    convert( evo ) {
        if ( !__ESet.size ) return;

        let _els = [...__ESet],
            _op1 = cleanHot( _els, true ),
            _op2 = clearSets(),
            [op3, _new] = convertTo( evo.data, _els );

        historyPush( _op1, _op2, op3, pushes(_new) );
    },

    __convert: 1,


    /**
     * 裁剪表格行。
     * 表格末尾添加或移除以保持目标行数。
     * 行数小于等于0时保持现状不变。
     * @data: TableSection
     * @param  {Number} size 目标行数
     * @return {void}
     */
    croptr( evo, size ) {
        if ( size <= 0 ) {
            return;
        }
        let _tbd = evo.data,
            _cnt = size - _tbd.rows.length;

        _cnt && cropTrs( $.table(_tbd.parentElement), _cnt, _tbd );
    },

    __croptr: 1,


    /**
     * 裁剪表格列。
     * 在末尾添加或移除表格列以保持目标列数。
     * 目标列数小于等于0时保持现状不变。
     * @data: <table>
     * @param  {Number|null} size 目标列数（不含列头）
     * @return {void}
     */
    colcrop( evo, size ) {
        if ( size <= 0 ) {
            return;
        }
        let _tbo = $.table( evo.data ),
            _cnt = size - _tbo.cols() + 1;

        if ( _cnt ) cropCols( _tbo, _cnt );
    },

    __colcrop: 1,


    /**
     * 从主面板录入插入（通用）。
     * 目标：暂存区/栈顶1项。
     * 插入后新元素集被选取，原选取集取消选取。
     * 聚焦在首个数据元素上（友好）。
     * 注：
     * 数据节点可能为文本节点（不选取）。
     * @data: Node|[Node] 待插入节点
     * @param  {Boolean} before 向前插入
     * @param  {String} level 插入层级（siblings|children）
     * @return {void}
     */
    inserts( evo, before, level ) {
        let _els = [...__ESet],
            _dt2 = dataNodes2( $(evo.data), _els.length ),
            _op1 = clearSets(),
            _ops = insertsNodes( _els, _dt2, before, level ),
            _elx = _dt2.flat().filter( nd => nd.nodeType === 1 && !isCovert(nd) );

        historyPush(
            _op1,
            ..._ops,
            pushes( _elx ),
            _elx[0] && new HotEdit( _elx[0] )
        );
    },

    __inserts: 1,


    /**
     * 插入顶层单元。
     * 每个单元都有固定的位置。
     * 注：
     * where实际上只可能是siblings
     * 顶层单元没有多选克隆逻辑。
     * @data: Element
     * @param  {String} level 目标层级（siblings|children）
     * @return {void}
     */
    topinsert( evo, level ) {
        let _sel = __ESet.first(),
            _box = level === Sys.levelName1 ?
                _sel.parentElement :
                _sel;

        historyPush(
            clearSets(),
            fixInsert( _box, evo.data, topItemslr ),
            ...selectOne( evo.data, 'safeAdd' )
        );
    },

    __topinsert: 1,


    /**
     * 插入固定单元。
     * 包含标题、表头、表脚、导言和结语等。
     * 如果数据为数组，对应多个选取各别插入/更新。
     * 注意：
     * - 单选时数组数据只有首个成员有用。
     * - 多选时单个成员会克隆，多个时简单对应（多出/不足忽略）。
     * @data: Element|[Element]
     * @param  {String} level 目标层级（siblings|children）
     * @return {void}
     */
    fixinsert( evo, level ) {
        let _pels = level === Sys.levelName1 ?
                [...parentsSet(__ESet)] :
                [...__ESet],
            _subs = dataNodes( evo.data, _pels.length ),
            _op0 = cleanHot( _pels ),
            _op1 = clearSets(),
            _ops = insFixnode( _pels, _subs );

        historyPush( _op0, _op1, ..._ops, pushes(_subs), new HotEdit(_subs[0]) );
    },

    __fixinsert: 1,


    /**
     * 插入表体元素。
     * 表体插入包含特殊的合并选项。
     * - 合并到选取的目标，如果目标不是<tbody>，则合并到首个<tbody>。
     * - 如果不合并，插入到选取的<tbody>之后或作为最后一个<tbody>。
     * 注记：
     * - 只考虑单个<table>属主。
     * - 多个选取（同一<table>之下）仅承认首个选取。
     * @data: Element 已构造的<tbody>
     * @param  {Boolean} merge 表体合并
     * @param  {String} level 目标层级（siblings|children）
     * @return {void}
     */
    instbody( evo, merge, level ) {
        let _td = evo.data,
            _to = __ESet.first(),
            _tbl = level === Sys.levelName1 ? _to.parentElement : _to,
            _tbo = tableObj( _tbl ),
            _op0 = cleanHot( [_tbl] ),
            _op1 = clearSets(),
            _opx = null;

        if ( merge ) {
            if ( _to.tagName !== 'TBODY' ) {
                _to = _tbo.body( true );
            }
            _opx = new DOMEdit( __Edits.newAppend, _to, $.children(_td) );
            _td = null;
        }
        else {
            if ( _to.tagName !== 'TBODY' ) {
                _to = $.get( 'tbody:last-of-type', _tbl );
            }
            _opx = new DOMEdit( __Edits.newAfter, _to, _td );
        }

        historyPush( _op0, _op1, _opx, ...selectOne(_td || _to, 'safeAdd') );
    },

    __instbody: 1,


    /**
     * 插入注音子单元集。
     * 如果选取多个目标，则克隆为多组。
     * 注：
     * 平级插入时需要找到规范的位置。
     * 焦点移动到首个插入的<rb>元素。
     * @data: [Element] <rb|rp|rt|rp>序列
     * @param  {Boolean} before 向前插入
     * @param  {String} level 插入层级（siblings|children）
     * @return {void}
     */
    insrbpt( evo, before, level ) {
        let _els = rbptRefs( before, level ),
            _dt2 = dataClones( $(evo.data), _els.length ),
            _op1 = clearSets(),
            _ops = insertsNodes( _els, _dt2, before, level ),
            _elx = _dt2.flat().filter( nd => nd.tagName !== 'RP' );

        historyPush( _op1, ..._ops, pushes(_elx), new HotEdit(_elx[0]) );
    },

    __insrbpt: 1,


    /**
     * 创建表格单元。
     * @data: <table> 数据源
     * @param  {String} caption 表标题内容
     * @param  {String} border 边框类型
     * @param  {'no'|null} thead 包含表头
     * @param  {'no'|null} th0   首列表头
     * @param  {'no'|null} tfoot 包含表脚
     * @return {Element} 表格元素
     */
    table( evo, caption, [border, thead, th0, tfoot] ) {
        let _tbl = evo.data,
            _slx = th0 ? '' : ':not(:first-child)',
            _slr = th0 ? 'th,td' : 'td',
            head = tableCells( thead && _tbl.tHead, `th${_slx}` ),
            body = tableCells( _tbl.tBodies[0], _slr ),
            foot = tableCells( tfoot && _tbl.tFoot, _slr ),
            cols = body[0].length - !!th0;

        th0 = !!th0;
        return create( 'table', {cols, border, caption, th0, head, foot}, body, true );
    },

    __table: 1,


    /**
     * 局部代码语言处理。
     * 如果局部语言与全局语言相同，则不设置。
     * 否则：
     * - 如果代码元素已设置语言，则简单忽略（局部嵌入）。
     * - 如果代码元素未设置语言，则设置局部语言。
     * @data: [Element] 代码元素集（[<code>]）
     * @param  {String} lang 局部语言
     * @param  {Element} box 可含配置的代码容器（<ol:codelist>|<code>）
     * @return {[Element]} 处理过的代码元素集
     */
    codelang( evo, lang, box ) {
        let _els = evo.data;

        if ( lang === $.attr(box, '-lang') ) {
            return _els;
        }
        for ( const el of _els ) {
            $.attr( el, '-lang' ) || $.attr( el, '-lang', lang );
        }
        return _els;
    },

    __codelang: 1,

};


//
// By: 编辑操作（部分）。
//
processExtend( 'Ed', Edit, [
    'click',
    'pathTo',
    'toText',
    'unWrap',

    // 配合cut处理
    'deletes',
    'paste',
]);


//
// By: 综合工具集。
//
processExtend( 'Kit', Kit, [
    'tips',
    'chapter',
    'save',
    'blankline',
    'toclist',
    'medpass',
    'medcancel',
    'rngelem',
    'cmenudo',
    'convert',
    'croptr',
    'colcrop',
    'inserts',
    'topinsert',
    'fixinsert',
    'instbody',
    'insrbpt',
    'table',
    'codelang',
]);


//
// On.v: 杂项取值。
//
customGetter( null, Kit, [
    'sels',
    'tobj',
    'trbox',
    'tsecbox',
    'codebox',
    'esize',
    'source',
    'rngok',
    'menupos',
    'submenu',
    'convtype',
    'roleinfo',
    'cmenable',
    'inslist',
    'ismixed',
    'pretreat2',
    'pretreat1',
    'splitx',
    'k3edit',
    'indentcut',
    'hlcode',
    'codeopts',
    'codels',
    'codeblo',
    'codehtml',
    'image3',
    'mediasubs',
    'picsubs',
]);


// debug:
window.ESet = __ESet;
