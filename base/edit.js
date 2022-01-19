//! $ID: edit.js 2019.09.07 Cooljed.Libs $
//++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
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

import $, { OBTA, TplrName, TplsPool } from "./tpb/config.js";
import { ROOT, Sys, Limit, Help, Tips, Cmdx, Local, On, By, Fx } from "../config.js";
import { customGetter, processExtend } from "./tpb/tpb.esm.js";
import * as T from "./types.js";
import { isContent, isCovert, virtualBox, contentBoxes, tableObj, tableNode, cloneElement, getType, sectionChange, isFixed, afterFixed, beforeFixed, isOnly, isChapter, isCompatibled, childTypes, compatibleNoit, checkStruct } from "./base.js";
import { ESet, EHot, ECursor, History, CStorage, prevNodeN, nextNodeN, elem2Swap, prevMoveEnd, nextMoveEnd, parseJSON, scriptRun, niceHtml, markdownLine, cleanInline } from './common.js';
import { tabSpaces, rangeTextLine, indentedPart, shortIndent, highLight } from "./coding.js";
import { children, create, tocList, convType, convData, convToType } from "./create.js";
import { options, propertyTpl } from "./templates.js";
import { Spliter, UmpString, UmpCaller } from "./tpb/tools/spliter.js";
import cfg from "./shortcuts.js";

// 专项导入
import { saveCode } from "./shedit.js";
import { htmlBlock, htmlList, codeWraps } from "./highlight.js";
import { propertyProcess, propertyData, propertyData2 } from "./property.js";
import { Select, Filter, Search, Command, Calcuate, typeRecord, CmdNav, cmdlineInit } from "./cmdline.js";
import { pluginsName } from "./plugins.js";


const
    // 局部使用。
    Normalize = $.Fx.History.Normalize,

    // 编辑区需要监听的变化（历史记录）。
    // 注：propdone用于用户执行脚本中可能的修改监听。
    varyEvents = 'attrdone styledone nodesdone emptied detach normalize propdone',

    // 空白占位符
    // 用于特性：OBT串构造。
    __chrZero = '-',

    // OBT顶层并列切分符。
    // 用于特性面板操作可能有的'on by to'特性。
    __chrDlmt = ';',

    // 脚本执行：
    // 编辑器环境下执行脚本时传递选取集的形参。
    __argName = '$$',

    // 搜索标记角色名。
    __tmpRole = 'tmp',

    // 内容区聚焦事件名。
    __evnFocus = 'focus.content',

    // 临时类名序列。
    __tmpcls = `${Sys.selectedClass} ${Sys.focusClass} ${Sys.hoverClass} ${Sys.pointClass}`,

    // 临时类名选择器。
    __tmpclsSlr = `.${Sys.selectedClass}, .${Sys.focusClass}, .${Sys.hoverClass}, .${Sys.pointClass}`,

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

    // 类名&值模式。
    // 用于清除提示信息中的该部分。
    __reClassv  = /\sclass="[\w\s]+"/,

    // 微编辑：
    // 智能逻辑行适用集。
    // 源行类型：[新行标签名, 父类型约束]
    // 注记：
    // 不支持<td|th>到<tr>，存在新行单元格选取逻辑问题。
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

    // 自动弹出属性框的条目。
    // 注：在划选创建内联单元时。
    __popupCells = new Set([
        'a', 'ruby', 'bdo'
    ]),

    // OBT复合特性名。
    // 'on by to'
    __obtAttr = `${OBTA.on} ${OBTA.by} ${OBTA.to}`,

    // OBT 特性名检查。
    // 用于特性名检查构造复合名（__obtAttr）。
    __obtNames = new Set([
        // 'on', 'by', 'to', 'on by to'
        OBTA.on, OBTA.by, OBTA.to, __obtAttr
    ]),

    // 元素选取集实例。
    __ESet = new ESet( Sys.selectedClass ),

    // 选取焦点类实例。
    __EHot = new EHot( Sys.focusClass ),

    // 光标实现实例。
    // 仅用于内容元素的微编辑。
    __eCursor = new ECursor(),

    // 内容区DOM节点变化历史实例。
    __TQHistory = new $.Fx.History(),

    // 编辑器关联存储。
    __EDStore = new CStorage( `${Sys.nameEditor}_` ),

    // OBT分组切分器。
    // 排除调用式和字符串内的分号。
    __dlmtSplit = new Spliter( __chrDlmt, new UmpCaller(), new UmpString() );



//
// 节点编辑类。
// 封装用户的单次DOM编辑（可能牵涉多个节点变化）。
// 直接操作全局的 __TQHistory 对象以避免每个实例存储该对象。
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


    /**
     * 是否发生了实际改变。
     * @return {Boolean}
     */
    changed() {
        return this.count > 0;
    }
}



//
// 脚本执行器。
// 限于脚本在当前编辑器内执行的情况。
// 仅支持普通DOM修改跟踪：节点、特性、属性、样式变化，
// 不含类名修改接口（$:addClass, $:removeClass, $:toggleClass）触发的变化。
// 注记：
// 类似 DOMEdit 实现，但会保存脚本的返回值。
// 同时包含撤销警告功能。
// 不支持对划选（Selection）区域的修改。
//
class CodeRun {
    /**
     * 构造一个编辑实例。
     * @param {...Value} args 参数序列
     */
    constructor( handle, ...args ) {
        this._fun = handle;
        this._args = args;
        this._data;
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

        this._data = this._fun( ...this._args );
        this.count = __TQHistory.size() - _old;
    }


    /**
     * 是否改变了DOM。
     * @return {Boolean}
     */
    changed() {
        return this.count > 0;
    }


    /**
     * 脚本执行结果。
     * @return {Value|void}
     */
    result() {
        return this._data;
    }


    /**
     * 设置/获取警告信息。
     * 如果重做会创建新节点，就会让后续的 Redo 失去原引用。
     * 警告用户是否撤销该步（提示后果）。
     * @param  {String} msg 警告信息
     * @return {String}
     */
    warn( msg ) {
        if ( msg === undefined ) {
            return this._msg;
        }
        this._msg = msg;
    }
}


//
// 文本操作类。
// 直接修改文本节点内容，不影响引用。
// 主要用于大小写转换。
//
class TextModify {
    /**
     * handle:
     * function( String ): String
     * @param {[Text]} nodes 文本节点集
     * @param {Function} handle 修改函数
     */
    constructor( nodes, handle ) {
        this._nds = nodes;
        this._old = nodes.map( nd => nd.textContent );
        this._tts = this._old.map( handle );

        this.redo();
    }


    undo() {
        this._nds.forEach(
            (nd, i) => nd.textContent = this._old[i]
        );
    }


    redo() {
        this._nds.forEach(
            (nd, i) => nd.textContent = this._tts[i]
        );
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
        delayFire( slavePanel, Sys.evnFollow );
    }


    /**
     * 重新选取。
     */
    redo() {
        this._fun( ...this._vals );
        delayFire( slavePanel, Sys.evnFollow );
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
// 面板内容跟随。
// 仅仅只是发送一个同步消息即可。
// 主要用于样式&特性面板。
// 注意：
// 必须为延迟激发，以等待主操作撤销或重做完成。
//
class Follow {
    /**
     * @param {Boolean} fire 是否立即触发
     */
    constructor( fire ) {
        fire && this.redo();
    }

    undo() {
        delayFire( slavePanel, Sys.evnFollow );
    }

    redo() {
        delayFire( slavePanel, Sys.evnFollow );
    }
}


//
// 选区编辑。
// 用于鼠标划选创建内联单元时。
// 范围的首尾点需要在同一父元素内（完整嵌套）。
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
        rng.insertNode( this._el );

        // 取消划选高亮
        rng.collapse();
        rng.detach();

        this._tmp = null;
    }


    undo() {
        let _box = this._el.parentElement;

        // 使用原生接口
        this._el.replaceWith( ...this._old );

        // 碎片记忆（便于redo）
        this._tmp = new Normalize( _box );
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
     * 获取新创建的元素。
     * 用于外部获取，如：设置焦点元素。
     */
    elem() {
        return this._el;
    }


    /**
     * 是否已构建完整。
     * 针对部分有固定格式的单元（<a>和<ruby>）。
     * 注：
     * 如果已为true，则划选创建后不再需要自动弹出属性编辑框。
     */
    completed() {
        return this._whole;
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
        let _fn = this[ `_${name}` ],
            _fd = rng.cloneContents();

        return _fn ? _fn( this, rng.toString(), _fd ) : [ null, _fd ];
    }


    /**
     * 分析构造链接配置。
     * 链接格式容错两端空白，但文本原样保持。
     * @param  {RngEdit} self 实例自身
     * @param  {String} text 链接文本
     * @param  {Fragmentt} frg 选取内容的文档片段副本
     * @return {[Object, Value]} 配置对象和数据值对
     */
    _a( self, text, frg ) {
        self._whole = RngEdit.url
            .test( text.trim() );

        return [ self._whole && {href: text}, frg ];
    }


    /**
     * 分析提取注音配置。
     * 友好：格式匹配忽略两端的空白。
     * 注记：
     * 不匹配时应当有一个<rt>的占位串，以便于修改，
     * 因为<rt>不支持单独创建。
     * @param  {RngEdit} self 实例自身
     * @param  {String} text 注音文本
     * @param  {Fragmentt} frg 选取内容的文档片段副本
     * @return {[Object, Value]} 配置对象和数据值对
     */
    _ruby( self, text, frg ) {
        let _v = text.trim().match(
                RngEdit.ruby
            ),
            rt = _v ? _v[2] : Sys.rtHolder,
            rc = _v ? _v[1] : frg;

        self._whole = _v;

        return [ {rt}, rc ];
    }
}

//
// 链接URL匹配模式。
// 主机部分严格约束，路径/查询部分宽泛匹配。
//
RngEdit.url  = /^(?:http|https|ftp|email):\/\/\w[\w.-]+\/\S+$/i;

//
// <ruby>匹配提取模式。
// 格式：/文本(拼音)/
// 文本：任意非空白字符（容许空格）
// 拼音：[À-ž ㄅ-ㄭ] （容许空格）
//
RngEdit.ruby = RegExp( `^([\\S\\x20]+)\\${Sys.rpLeft}([\\w\\u00c0-\\u017e\\u3105-\\u312d ]+)\\${Sys.rpRight}$`, 'i' );


//
// 搜索标记。
// 可撤销，可搜索累积。
//
class MarkTmp {
    /**
     * @param {Range} rng 范围对象
     */
    constructor( rng ) {
        this._el = $.attr(
            $.elem('mark', rng.toString()), 'role', __tmpRole
        );
        this._old = [ ...rng.extractContents().childNodes ];

        rng.insertNode( this._el );
        rng.detach();

        this._tmp = null;
    }


    undo() {
        let _box = this._el.parentElement;

        this._el.replaceWith( ...this._old );
        this._tmp = new Normalize( _box );
    }


    redo() {
        this._tmp.back();

        this._old
            .slice(1)
            .forEach( nd => nd.remove() );

        this._old[0].replaceWith( this._el );
    }


    /**
     * 获取新创建的元素。
     */
    elem() {
        return this._el;
    }

}


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
     * 新建一个游离副本用于清理（避免进入历史栈）。
     */
    done() {
        let _nds = this._clean(
            $.clone( this._cp ),
            getType( this._cp )
        );
        cleanCall( () => $.fill($.removeAttr(this._cp, 'contenteditable'), _nds) );
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
        __eCursor.clean( el );

        return _new;
    }


    /**
     * 清理目标元素内容。
     * - 将非合法内联元素文本化。
     * - 替换<pre>和<code>内的<br>为换行字符（\n）。
     * - 如果是代码元素且有语言定义，重新解析语法高亮。
     * 注记：
     * 仅在<code>上有语言定义时才解析，这通常适用代码块单元。
     * 对于代码表中的子语法块行，可能因为缺乏上下文而解析错误，但此友好大多数情况。
     * @param  {Element} el 目标元素游离副本
     * @param  {Number} tval 元素类型值
     * @return {[Node]} 合法子节点集
     */
    _clean( el, tval ) {
        $.fill(
            el,
            this._inlines( el.childNodes )
        );
        if ( tval === T.PRE ) {
            $( 'br', el ).replace( '\n' );
        }
        else if ( tval === T.CODE ) {
            this._codeparse( el );
        }
        // 游离元素规范化无害
        return [ ...$.normalize(el).childNodes ];
    }


    /**
     * 清理非合法内联子元素。
     * 如果有非法元素，返回集内就会有离散文本。
     * @param  {NodeList} nodes 子节点集
     * @return {[Node]} 合法子节点集
     */
    _inlines( nodes ) {
        let _buf = [];

        for ( const nd of nodes ) {
            let _t = nd.nodeType;

            if ( _t === 3 || _t === 8 ) {
                _buf.push( nd );
            }
            else if ( _t === 1 ) {
                _buf.push( cleanInline(nd) )
            }
        }
        return _buf;
    }


    /**
     * 代码高亮解析。
     * 注记：
     * 代码表中的行通常没有语言定义（非子语法块时），
     * 如果需要重新解析高亮，用户可通过属性框对该行或整个代码表重新解析。
     * @param  {Element} el 目标元素
     * @return {void}
     */
    _codeparse( el ) {
        let _lang = $.attr( el, '-lang' );

        if ( !_lang ) {
            return $( 'br', el ).replace( '\n' );
        }
        $.html(
            el,
            // 如果存在多个子语法块，简单合并。
            // 这与属性修改的重新解析行为保持一致。
            codeWraps( null, highLight([el.textContent], _lang), htmlBlock, false ).map( e => e.innerHTML ).join( '' )
        );
    }

}



//
// 操作单元。
//////////////////////////////////////////////////////////////////////////////


//
// 元素选取操作。
// 各方法对应到用户的快捷选取操作类型。
// 注：
// 返回false表示操作无效。
// 不含this引用的方法可以独立使用。
//
class ElemSels {
    /**
     * 排它选取。
     * 会先清空整个集合。
     * 友好：忽略简单的重复单击。
     * @行为：单击
     * @param {Element} el 目标元素
     */
    only( el ) {
        if ( __ESet.size == 1 && __ESet.has(el) ) {
            return false;
        }
        __ESet.clear();
        __ESet.add( el );
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
        if ( __ESet.has(el) ) {
            __ESet.delete(el);
        } else {
            this.clean(el).add(el);
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
            __ESet.has(el) ? __ESet.delete(el) : this._parentAdd(el);
        }
    }


    /**
     * 元素扩展：添加/移出。
     * 假设父容器未选取，外部需要保证此约束。
     * @param {[Element]} els 元素序列
     * @param {Element} hot 焦点元素引用
     */
    expand( els, hot ) {
        return __ESet.has(hot) ? this.adds(els) : this.removes(els);
    }


    /**
     * 元素集添加。
     * 新成员可能是集合内成员的父元素。
     * 假设父容器未选取，外部需要保证此约束。
     * @param {[Element]} els 兄弟元素集
     */
    adds( els ) {
        els.forEach(
            el => __ESet.has(el) || this._parentAdd(el)
        );
    }


    /**
     * 元素集移出。
     * @param {[Element]} els 元素集
     */
    removes( els ) {
        els.forEach(
            el => __ESet.has(el) && __ESet.delete(el)
        );
    }


    /**
     * 清除全部选取。
     * 友好：空集时简单忽略。
     */
    empty() {
        if ( __ESet.size == 0 ) {
            return false;
        }
        __ESet.clear();
    }


    /**
     * 普通添加。
     * 会检查父子包含关系并清理。
     * 如果已经选取则无行为。
     * @param {Element} el 目标元素
     */
    add( el ) {
        __ESet.has(el) || this.clean(el).add(el);
    }


    /**
     * 安全添加。
     * 外部需要自行清理父子已选取。
     * @param {Element} el 选取元素
     */
    safeAdd( el ) {
        __ESet.has(el) || __ESet.add(el);
    }


    /**
     * 安全添加元素集。
     * 外部保证父子选取已清理。
     * @param {[Element]} els 元素集
     */
    safeAdds( els ) {
        __ESet.pushes( els );
    }


    /**
     * 简单移除。
     * @param  {Element} el 选取元素
     * @return {el|false}
     */
    delete( el ) {
        return __ESet.has(el) && __ESet.delete(el);
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
        let _tmp = [...__ESet];

        if ( _tmp.length ) {
            __ESet.clear();
        }
        this.adds( els.concat(_tmp) );
    }


    /**
     * 向上父级清理。
     * 检索集合内包含目标子元素的成员并清除其选取。
     * 即清理目标元素的上级已选取。
     * 如果不存在上级选取，返回 false。
     * @param  {Element} el 目标子元素
     * @return {ESet|false}
     */
    cleanUp( el ) {
        let _box = this._parentItem(el);

        if ( !_box ) {
            return false;
        }
        return __ESet.delete( _box ), __ESet;
    }


    /**
     * 向下子级清理。
     * 检索集合内为目标元素子元素的成员并清除其选取。
     * 即清理目标元素的子级已选取，可能包含多个成员。
     * 如果未实际执行清理，返回 false。
     * @param  {Element} el 目标父元素
     * @return {ESet|false}
     */
    cleanDown( el ) {
        let _els = this._contains(el);

        if ( !_els.length ) {
            return false;
        }
        _els.forEach(
            sub => __ESet.delete( sub )
        )
        return __ESet;
    }


    /**
     * 父子关系清理。
     * 检查目标元素与集合内成员的父子关系，如果存在则先移除。
     * 注记：不存在目标元素同时是集合内成员的子元素和父元素的情况。
     * @param  {Element} el 目标元素
     * @return {ESet|false}
     */
    clean( el ) {
        return this.cleanUp(el) || this.cleanDown(el) || __ESet;
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 父级添加。
     * 会清除集合内属于子级元素的选取。
     * @param {Element} el 父元素
     */
    _parentAdd( el ) {
        this.cleanDown( el );
        __ESet.add( el );
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
        for ( const el of __ESet ) {
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

        __ESet.forEach(
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
     * 对齐插入。
     * 目标集与数据集一一对应插入。
     * @param {Element} to 目标元素集
     * @param {String} meth 插入方法（prepend|append|fill|before|after|replace）
     * @param {[Node|[Node]]} data 待插入节点集组
     */
    alignInsert( tos, meth, data ) {
        tos.forEach(
            (to, i) => $[meth]( to, data[i] )
        );
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
     * @param {Collector} $els subs父元素集引用
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
     * 设置样式。
     * 全部元素统一设置为相同的值。
     * 注记：
     * 模板中通过OBT可直接设置样式，但需要可撤销故在单独定义。
     * @param {[Element]} els 元素集
     * @param {String|Object} names 样式名序列或样式配置对象
     * @param {Value|[Value]} val 样式值或值集
     */
    styles( els, names, val ) {
        for ( const el of els ) $.cssSets( el, names, val );
    }


    /**
     * 特性设置。
     * 全部元素统一做相同的设置。
     * @param {[Element]} els 元素集
     * @param {String} name 特性名序列或配置对象
     * @param {Value|[Value]} val 特性值或值集
     */
    attrs( els, name, val ) {
        for ( const el of els ) $.attribute( el, name, val );
    }
}


//
// 全局操作对象。
//////////////////////////////////////////////////////////////////////////////


const
    // 元素选取集操作实例。
    __Selects = new ElemSels(),

    // 元素修改操作实例。
    __Edits = new NodeVary(),

    // 编辑器操作历史。
    __History = new History( Limit.history, __TQHistory );


let
    // 内容根元素。
    contentElem = null,

    // 不可见元素提示节点。
    covertShow = null,

    // 路径信息容器。
    pathContainer = null,

    // 出错信息容器
    errContainer = null,

    // 提示信息框
    infoElement = null,

    // 大纲视图容器
    // 用于目录适时更新。
    outlineElem = null,

    // 工具栏中段按钮（微编辑下隐藏）。
    midtoolElem = null,

    // 模态框根元素
    modalDialog = null,

    // 主面板内容标签容器
    slaveInsert = null,

    // 主面板根元素
    slavePanel = null,

    // 当前微编辑对象暂存
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
 * @return {void}
 */
function stateNewEdit() {
    $.trigger( contentElem, Sys.redoEvent, false, true );
}


/**
 * 重置编辑器状态。
 * - 编辑历史栈清空。
 * - 工具栏撤销/重做按钮重置。
 * 注：
 * 主要导出用于外部重新设置编辑器内容时。
 * @return {void}
 */
function resetState() {
    __History.clear();
    $.trigger( contentElem, Sys.undoEvent, false, true );
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
    try {
        if ( el == null ) {
            $.empty( pathContainer );
        } else {
            $.intoView( el, 0 );
            $.fill( pathContainer, pathList(el, contentElem) );
        }
        return __EHot.set( el );
    }
    // 体现焦点类名。
    finally { covertTips(el) }
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
 * @param  {[Element]} els 容器元素集
 * @param  {String} data 数据
 * @param  {String} meth 插入方法（appends|fills）
 * @return {DOMEdit|null} 操作实例
 */
function textAppend( els, data, meth ) {
    return els.length > 0 && new DOMEdit( __Edits[meth], els, data );
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
 * @param  {String} meth 插入方法（appends|fills）
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
 * 因为是“移动”逻辑，保留可能绑定的事件处理器，
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
    if ( !canAppend(to) ) {
        return help( 'cannot_append', to );
    }
    if ( !$els.every(canDelete) ) {
        return help( 'has_cannot_del', deleteBadit($els) );
    }
    let _new = appendData( ref, to, $els.clone(true, true, true) ),
        _op1 = clearSets(),
        _op2 = empty && new DOMEdit( () => $.empty(to) );

    return [
        new HotEdit(),
        _op1, _op2,
        new DOMEdit( () => $els.remove() ),
        _new.length && new DOMEdit( __Edits.insert, ref, to, _new ),
        ...appendContent( to, _new )
    ];
}


/**
 * 克隆内添加操作。
 * 不支持元素上绑定的事件处理器克隆，
 * 如果需要，用户应当有重新绑定的方式（OBT特性会正常克隆）。
 * 检查：
 * - 目标可以向内添加内容。
 * 操作：
 * - 清空选取集选取。
 * - 清空容器元素（可选）。
 * - 插入新元素集。
 * - 新元素集自动选取。
 * - 新元素集首个成员为焦点。
 * @param  {[Element]} els 当前选取克隆集
 * @param  {Element} to 目标容器元素
 * @param  {Element} ref 同级参考元素，可选
 * @param  {Boolean} empty 是否清空容器，可选
 * @return {[Instance]} 操作实例集
 */
function cloneAppend( els, to, ref, empty ) {
    if ( !canAppend(to) ) {
        return help( 'cannot_append', to );
    }
    let _new = appendData( ref, to, els ),
        _op1 = clearSets(),
        _op2 = empty && new DOMEdit( () => $.empty(to) );

    return [
        new HotEdit(),
        _op1,
        _op2,
        _new.length && new DOMEdit( __Edits.insert, ref, to, _new ),
        ...appendContent( to, _new )
    ];
}


/**
 * 向内插入内容。
 * 判断容器是否为内容元素，构造操作实例集。
 * - 内容元素容器仅需添加容器元素到选取。
 * - 非内容元素容器会选取全部数据元素集，且定位焦点到首个成员。
 * @param  {Element} to 容器元素
 * @param  {[Element]} els 数据元素集
 * @return {[Instance]}
 */
function appendContent( to, els ) {
    if ( isContent(to) ) {
        return [ new ESEdit(() => __ESet.add(to)) ];
    }
    return [ pushes(els), new HotEdit(els[0]) ];
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
 * @param  {Element|null} ref 兄弟参考
 * @param  {Element} box 父容器元素
 * @param  {[Value]} data 数据集（应独立）
 * @return {[Element]}
 */
function appendData( ref, box, data ) {
    // 创建可能出现非法情况
    // 输出错误提示并终止执行流。
    try {
        return cleanCall( () =>
            data.map( nd => children(ref, box, {}, nd) )
                .flat()
                .map( nd => nd && $.remove(nd) )
                .filter( nd => nd )
        );
    }
    catch ( err ) {
        throw error( err, box );
    }
}


/**
 * 获取目标位置的合法节点集。
 * @param  {Element} to 目标元素
 * @param  {String} meth 插入方法
 * @param  {[Node]} data 待插入数据集
 * @return {[Element]} 结果集
 */
function validNodes( to, meth, data ) {
    let _map = {
        // meth: [ ref, box ]
        'prepend': [ null, to ],
        'append':  [ null, to ],
        'fill':    [ null, to ],
        // ref仅用于创建参考，
        // 最后的数据会脱离DOM。
        'before':  [ to, to.parentElement ],
        'after':   [ to, to.parentElement ],
        'replace': [ to, to.parentElement ],
    };
    return appendData( ..._map[meth], data );
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
    if ( beg === to ) {
        return [];
    }
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
 * @param  {[Element]} els 目标元素集
 * @param  {String} name 样式名（left|top|right|bottom）
 * @param  {Number} inc 递增像素值
 * @return {DOMEdit|void}
 */
function elementsPostion( els, name, inc ) {
    if ( !els.length ||
        els.some(cantMoving) ) {
        return;
    }
    let _fx = v => `${(parseFloat(v) || 0) + inc}px`;

    return new DOMEdit( __Edits.styles, els, name, _fx );
}


/**
 * 定位样式跟随变化。
 * 当元素的top|left设置具体的值时，其对面样式需设置为auto。
 * @param  {[Element]} els 目标元素集
 * @param  {String} type 跟随类型（right|bottom）
 * @return {DOMEdit} 操作实例
 */
function postionFollow( els, type ) {
    return new DOMEdit( __Edits.styles, els, type, 'auto' );
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
 * @param  {Element} el 目标元素
 * @return {[Instance]} 编辑历史记录实例序列
 */
function minied( el ) {
    let _op1 = new HotEdit( null ),
        _op2 = null,
        // 内联内容元素合并会带来文本节点离散，故先合并。
        _op3 = new DOMEdit( () => $.normalize(el) );

    // 创建同类新行时为未选取，无需取消。
    if ( __ESet.has(el) ) {
        _op2 = new ESEdit( __Selects.delete, el );
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
 * @return {Element} 微编辑完成的元素
 */
function miniedOk() {
    currentMinied.done();
    let _el = currentMinied.elem();

    stateNewEdit();
    if ( _el.tagName === 'H2' ) {
        $.trigger( outlineElem, Sys.medOk, _el );
    }
    $.trigger( contentElem, Sys.medOk, null, true );

    // 工具栏中间按钮可操作。
    $.trigger( midtoolElem, 'show' );

    // 主面板恢复普通模式标签。
    $.trigger( slaveInsert, Sys.insType, Sys.normalTpl );

    // 恢复普通模式通知
    delayFire( slavePanel, Sys.evnFollow );

    currentMinied = null;

    return _el;
}


/**
 * 微编辑创建同类新行。
 * 注记：
 * 游离元素的特性设置不会进入历史栈。
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
 * - 单个选取时，多项数据合并为一（二维封装）。
 * - 单数据多目标时，克隆为相同集合大小。
 * - 多数据多目标时，保持原始各别对应。
 * @param  {Collector} $data 数据节点集
 * @param  {Number} cnt 克隆次数
 * @return {[Collector]|Collector} 节点集（组）
 */
function dataNodes2( $data, cnt ) {
    if ( cnt < 2 ) {
        return [ $data ];  // 封装
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
    return _ns.length === set.size && _ns.every( n => set.has(n.toLowerCase()) );
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
 * 获取与焦点同级的起点元素。
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
 * 单选兄弟元素有效性检查。
 * 如果存在互为兄弟的元素，抛出异常终止流程。
 * 空集或所有成员都是其父元素内唯一子元素时，抛出异常终止流程。
 * 注：只有在集合成员都是平级单一选取元素时才正常通过。
 * 注记：
 * 用于虚焦点平级操作前的合法性检测。
 * @param  {Set} eset 元素集
 * @return {void}
 */
function siblingInvalid( eset ) {
    let _set = new Set(),
        _cnt = 0;

    for ( const [i, el] of eset.entries() ) {
        let _box = el.parentElement;
        _cnt += _box.childElementCount;

        if ( _set.add(_box).size === i ) {
            throw error( 'repeat sibling', el );
        }
    }
    if ( _cnt === eset.size ) {
        throw error( 'no more sibling' );
    }
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
 * 包含内部子孙章节的同时升级。
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
 * 被提升的章节插入原所属章节之后。
 * @param {Element} sec 章节元素
 */
function sectionUp( sec ) {
    let _pel = sec.parentElement,
        _sxn = $.attr( sec, 'role' );

    if ( _sxn === 's1' ) {
        // 出错提示但简单略过。
        return error( Tips.sectionNotUp, sec );
    }
    $.after( _pel, sectionUpTree(sec) || sec );
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
 * 是否支持meth方法。
 * @param  {Element} el 目标元素
 * @param  {String} meth 插入方法
 * @return {Boolean}
 */
function canInsert( el, meth ) {
    let _box = {
        'prepend': el,
        'append':  el,
        'fill':    el,
        'before':  el.parentElement,
        'after':   el.parentElement,
        'replace': el.parentElement,
    };
    return canAppend( _box[meth] );
}


/**
 * 找到不可插入的目标元素。
 * 返回null表示全部支持。
 * @param  {[Element]} els 目标元素集
 * @param  {String} meth 插入方法
 * @return {Element|null}
 */
function invalidInsert( els, meth ) {
    for ( const el of els ) {
        if ( !canInsert(el, meth) ) return el;
    }
    return null;
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
 * 打开元素的属性编辑模态框。
 * @param {String} name 元素类型对应的根模板名
 */
function propertyEdit( name ) {
    TplsPool.get( TplrName )
        .get( Sys.modalProp )
        .then( frm => $.trigger(modalDialog, 'open', [name, frm]) );
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
    setTimeout(
        () => el.isConnected && $.trigger(el, evn, ...rest),
        1
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
 * 配置为JSON格式串，兼容单个对象（非数组）。
 * tval 限于 T.SOURCE1, T.SOURCE2, T.TRACK 3种类型。
 * 注：
 * 空串表示没有配置，这在属性编辑多个目标时有特殊意义，
 * 所以分别空串是必须的。
 * @param  {String} conf 资源配置串
 * @param  {Number} tval 单元类型值
 * @return {Promise<[Element]>|''} 承诺对象或空串
 */
function mediaSubs( conf, tval ) {
    return conf &&
        parseJSON( conf ).then(
            opt => opt ? arrVal(opt).map( o => create(tval, o) ) : []
        );
}


/**
 * 是否需要弹出属性编辑框。
 * @param  {String} name 单元名
 * @param  {RngEdit}} rngop 选区编辑实例
 * @return {Boolean}
 */
function inlinePopup( name, rngop ) {
    return __popupCells.has( name ) && !rngop.completed();
}


/**
 * 设置不可见元素提示。
 * @param  {Element} el 目标元素
 * @return {void}
 */
function covertTips( el ) {
    $.trigger(
        covertShow,
        Sys.covert,
        el && isCovert( el ) && selfHTML( el ) || ''
    );
}


/**
 * 提取元素自身信息。
 * - 标签名大写（醒目）。
 * - 不含结束标签部分（如果有）。
 * @param  {Element} el 元素
 * @return {String}
 */
function selfHTML( el ) {
    let _as = [...el.attributes]
        .map( a => `${a.name}="${a.value}"` )
        .join( ' ' );

    return _as ? `<${el.tagName} ${_as}>` : `<${el.tagName}>`;
}


/**
 * 获取干净的源码。
 * 取元素的outerHTML值但移除内置的类名。
 * @param  {Element} el 目标元素
 * @return {String}
 */
function cleanHTML( el ) {
    return cleanElem( el ).outerHTML;
}


/**
 * 获取干净的元素副本。
 * 移除元素及内部子孙元素上临时的类名。
 * @param  {Element} el 目标元素
 * @return {Element} el
 */
function cleanElem( el ) {
    let _new = $.clone( el );

    $.find(__tmpclsSlr, _new, true)
        .forEach(
            el => $.removeClass( el, __tmpcls )
        );
    return _new;
}


/**
 * 封装脚本执行数据。
 * Object: {
 *      TEXT:[String] 选取集内容文本
 *      HTML:[String] 选取集源码（outerHTML）
 * }
 * 注：如果选取集为空，则取全部内容（顶层子元素集）。
 * @param  {ESet} eset 当前选取集
 * @param  {Object} obj 存储对象
 * @param  {Boolean} itext 包含文本集数据
 * @param  {Boolean} ihtml 包含源码集数据
 * @return {Object} obj
 */
function scriptData( eset, obj, itext, ihtml ) {
    let _els = [ ...eset ];

    if ( !_els.length ) {
        _els = [ ...contentElem.children ];
    }
    if ( itext ) {
        obj.TEXT = _els.map( el => el.textContent );
    }
    if ( ihtml ) {
        obj.HTML = _els.map( cleanHTML );
    }
    return obj;
}


/**
 * 编辑器环境下运行脚本代码。
 * 捕获出错信息或结果向后传递（会递送到打开的结果框）。
 * 如果代码没有返回值，返回null（不会打开结果框）。
 * 返回值 Object3: {
 *      type:String 结果类型（error|value）
 *      data:Value  执行的结果（任意）
 *      code:String 当前脚本代码（用于历史存储），可选
 * }
 * 封装：
 * - 全局的 $ 被封装为一个代理对象，$() 的默认上下文为编辑区根元素（<main>）。
 * - 代码的局部执行环境包含一个变量 _，指代编辑区根元素。
 * - 特殊的变量 $$ 表示当前选取集，已封装为 Collector 实例。
 * @param  {String} code 脚本代码
 * @param  {Collector} $els 选取集
 * @return {Object3|null} 结果对象
 */
function scriptRun2( code, $els ) {
    let data,
        _fun = new Function( __argName, '$', '_', code );
    try {
        // 传递选取集实参。
        data = _fun( $els, $proxy, contentElem );
    }
    catch (e) {
        return { type: 'error', data: e };
    }
    return data === undefined ? null : { type: 'value', data, code };
}


//
// $ 代理版。
// 限定默认上下文为编辑器内容根元素，专用于脚本在当前编辑器内执行。
//
const $proxy = new Proxy( $, {
    apply: (orig, _, args) => orig( args[0], args[1] || contentElem )
});


/**
 * 插件主文件导入。
 * 将插件的执行封装在一个Worker中（沙盒）。
 * 插件内需要通过 postMessage() 向外部递送请求和数据。
 * 插件只被允许执行一次，即向上层postMessage之后即被终止。
 * 注记：
 * 插件按钮实际上只是一个入口，之后如果需要DOM交互，只能由模板实现。
 * 模板中的OBT格式简单且固定，因此便于安全性审核。
 * @param  {String} url 主文件路径
 * @param  {Object} data 编辑器数据（HTML, TEXT, INFO）
 * @return {Promise<Object>}
 */
function plugLoad( url, data ) {
    let _wk = new Worker( url );

    return new Promise( (resolve, reject) => {
        _wk.onmessage = ev => {
            _wk.terminate();
            ev.data.error ? reject( ev.data.error) : resolve( ev.data );
        }
        _wk.postMessage( data );
    });
}


/**
 * 插件运行结果处理。
 * - 插件需要申请模板来获得UI交互。
 * - 如果申请了模板，结果数据（result）会通过vinit事件发送到新插入的模板根。
 * - 如果没有申请模板，结果数据会发送到默认的模板节点处理（一个文本框）。
 * 结果数据 obj: {
 *      result: 插件结果数据
 *      node:   引入的模板节点名，可选
 *      title:  展示框标题条文本，可选
 *      error:  错误信息反馈
 * }
 * @param  {Object} obj 结果数据对象
 * @param  {String} name 插件名
 * @param  {String} ttl 插件按钮提示文本
 * @return {[Value, Element, String]} [结果数据, 展示根元素, 标题条文本]
 */
function plugResult( obj, name, ttl ) {
    let _tplr = TplsPool.get( name );

    ttl = obj.title || ttl;

    if ( obj.node && !obj.error ) {
        return [ obj.result, _tplr.node(obj.node), ttl ];
    }
    _tplr = TplsPool.get( TplrName );

    // 默认处理
    return [ obj.error || obj.result, _tplr.node( Local.plugResult ), ttl ];
}


/**
 * 是否可设置样式。
 * 至少会有效改变一个元素的内联样式时。
 * 例外：
 * 不适用于颜色设置，因为难以统一颜色的字符串表达。
 * 这会导致历史栈冗余（多次相同设置有多个操作对象）。
 * @param  {[Element]} els 元素集
 * @param  {String|[String]} name 样式名（集）
 * @param  {Value} val 将要设置的样式值
 * @return {Boolean}
 */
function willStyle( els, name, val ) {
    if ( $.isArray(name) ) {
        return els.some(
            el => name.some( n => el.style[n] !== val )
        );
    }
    return els.some( el => el.style[name] !== val );
}


/**
 * 是否存在目标内联样式。
 * 存在其中任何一个即可。
 * @param  {Element} el 目标元素
 * @param  {[String]} names 样式名集
 * @return {Boolean}
 */
function hasStyle( el, names ) {
    return names.some( n => el.style[n] !== '' );
}


/**
 * 内联样式求值。
 * 检查集合中元素的目标内联样式，
 * 相同则返回值本身，否则返回null（与空串有别，在<select>中体现）。
 * @param  {[Element]} els 元素集
 * @param  {String} name 样式名（单个）
 * @return {String|null}
 */
function styleVal( els, name ) {
    let _val = els[0].style[name];

    for (const el of els.slice(1)) {
        if (el.style[name] !== _val) return null;
    }
    return _val;
}


/**
 * 内联样式名称检查。
 * 检查集合内是否都有设置目标样式。
 * - 从Element.style内检查。
 * - 适用各自独立的样式（非复合样式名），如：width/max-width等。
 * @param  {[Element]} els 元素集
 * @param  {String} name 样式名（单个）
 * @return {Boolean}
 */
function styleName( els, name ) {
    return els.every( el => el.style[name] !== '' );
}


/**
 * 内联样式名称检查。
 * 同上，检查集合内是否都有设置目标样式。
 * - 从style.cssText字符串匹配检查。
 * - 适用复合样式（具体样式会自动被设置），如：padding/margin等。
 * @param  {[Element]} els 元素集
 * @param  {String} name 样式名（单个）
 * @return {Boolean}
 */
function styleKey( els, name ) {
    name = name + ':';
    return els.every( el => el.style.cssText.includes(name) );
}


/**
 * 用源码创建干净的节点集。
 * 移除可能有的内置类名，它们会在视觉上误导。
 * @param  {String} html 源码
 * @return {[Node]} 节点集
 */
function htmlNodes( html ) {
    let _frg = $.fragment( html );

    for ( const el of $.find(__tmpclsSlr, _frg) ) {
        $.removeClass( el, __tmpcls );
    }
    return $.contents( _frg );
}


/**
 * 非法节点检查。
 * 返回null表示没有非法节点，全部合法。
 * @param  {Element} box 父容器元素
 * @param  {[Node]} nodes 待检查节点集
 * @return {[Node]|void} 非法节点集
 */
function wrongNodes( box, nodes ) {
    let _subs = childTypes( box ),
        _buf = [];

    for ( const nd of nodes ) {
        // 空白文本包容。
        if ( nd.nodeType === 3 && !nd.textContent.trim() ) {
            continue;
        }
        if ( !checkStruct(nd, _subs) ) {
            _buf.push( nd );
        }
    }
    return _buf.length ? _buf : wrongNodesAll( nodes );
}


/**
 * 非法节点批量检查。
 * 文本节点作为容器被忽略。
 * @param  {[Node]} els 目标节点集
 * @return {[Node]|void}
 */
function wrongNodesAll( els ) {
    for ( const box of els ) {
        if ( box.nodeType !== 1 ) {
            continue;
        }
        let _buf = wrongNodes( box, $.contents(box) );
        if ( _buf ) return _buf;
    }
}


/**
 * 按类型节点集。
 * @param  {String} type 创建类型（text|html）
 * @param  {String} data 文本或源码数据
 * @return {Collector}
 */
function $typeNodes( type, data ) {
    switch ( type ) {
        case 'text':
            return $( $.Text(data, true) );
        case 'html':
            // 忽略顶层的文本。
            return $( $.fragment(data).children );
    }
    throw new Error( "can't to here." );
}


/**
 * 提取节点信息。
 * - 元素返回其自身的outerHTML前段（无内容）。
 * - 文本节点返回文本值本身。
 * @param  {Node} node 目标节点
 * @return {String}
 */
function nodeInfo( node ) {
    if ( node.nodeType === 3 ) {
        return node.textContent;
    }
    return node.cloneNode().outerHTML.replace( RegExp(`</${node.tagName}>$`, 'i'), '' );
}


/**
 * 数组成员位置交换。
 * 以当前下标位置值与前一个成员交换。
 * @param  {Number} i 当前位置下标（>0）
 * @param  {...Array} obts 子数组序列
 * @return {void}
 */
function arraySwap( i, ...obts ) {
    for ( const v of obts ) {
        [ v[i], v[i-1] ] = [ v[i-1], v[i] ];
    }
}


/**
 * 向前移动当前行。
 * 注：将目标行移到当前行之后。
 * @param  {Element} el 当前行元素
 * @param  {[String]} on On配置组引用
 * @param  {[String]} by By配置组引用
 * @param  {[String]} to To配置组引用
 * @return {[Element, String]|null} [目标行, 换位方法]
 */
function obt2prev( el, on, by, to ) {
    let _to = $.prev( el );
    if ( !_to ) {
        return null;
    }
    arraySwap( $.siblingNth(_to), on, by, to );

    return [ _to, 'after' ];
}


/**
 * 向后移动当前行。
 * 注：将目标行移到当前行之前。
 * @param  {Element} el 当前行元素
 * @param  {[String]} on On配置组引用
 * @param  {[String]} by By配置组引用
 * @param  {[String]} to To配置组引用
 * @return {[Element, String]|null} [目标行, 换位方法]
 */
function obt2next( el, on, by, to ) {
    let _to = $.next( el );
    if ( !_to ) {
        return null;
    }
    arraySwap( $.siblingNth(el), on, by, to );

    return [ _to, 'before' ];
}


/**
 * 获取合法的OBT配置值（单条）。
 * 简单移除单条内的分号（容错），维护顶层切分逻辑。
 * @param  {String} val 配置值
 * @return {String}
 */
function obtVal( val ) {
    __dlmtSplit.reset();
    return [ ...__dlmtSplit.split(val) ].join( ' ' ).trim();
}


/**
 * OBT配置集精简。
 * 移除末尾的空白条目。
 * - By, To 末尾的空白条无条件移除。
 * - On 集合维持OnByTo公共最长长度。
 * 注：
 * 实际上On应当是最长集合，但如果ByTo更长（是一种错误），
 * On保留末尾空白以使等长，作为一种错误提示。
 * @param  {[String]} on On配置集
 * @param  {[String]} by By配置集
 * @param  {[String]} to To配置集
 * @return {[[String]]} 清理后的OBT配置集组
 */
function obtsClean( [on, by, to] ) {
    by.length = arraySize( by );
    to.length = arraySize( to );
    on.length = Math.max( arraySize(on), by.length, to.length );

    return [ on, by, to ];
}


/**
 * 获取数组有效长度。
 * 即排除末尾连续的假值序列。
 * @param  {[Value]} list 值数组
 * @param  {String} zero 空白占位符，可选
 * @return {Number} 含有非假值的长度。
 */
function arraySize( list, zero = __chrZero ) {
    let _n = list.length;

    while ( _n-- ) {
        if ( list[_n] && list[_n] !== zero ) break;
    }
    return _n + 1;
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
 * 状态栏提示。
 * 较大延迟避开选取集重置信息覆盖。
 * @param {String} msg 提示信息
 */
function statusInfo( msg ) {
    setTimeout( () => $.trigger(infoElement, Sys.info, msg), 10 );
}


/**
 * 输出错误提示。
 * 依然抛出原有错误以阻止流程继续。
 * @param  {String} msg 输出消息
 * @param  {Value} data 关联数据
 * @return {void}
 */
function error( msg, data ) {
    $.trigger( linkElem(errContainer, data), 'on' );
    $.trigger( $.get('a', errContainer), 'setv', [null, msg, msg] );

    return new Error( msg );
}



//
// 命令行部分。
//----------------------------------------------------------------------------


//
// 标识符映射执行器。
//
const __Cmder = {
    [ Cmdx.select ]:    null,   // new Select()
    [ Cmdx.filter ]:    null,   // new Filter()
    [ Cmdx.search ]:    null,   // new Search()
    [ Cmdx.command ]:   null,   // new Command()
    [ Cmdx.calcuate ]:  null,   // new Calcuate()
};


//
// 命令行处理器。
// 返回数组表示操作实例集，否则为字符串（用于回显）。
// @return {[Instance]|String}
//
const __Cmdoper = {
    [ Cmdx.select ]:    cmdxSelect,
    [ Cmdx.filter ]:    cmdxFilter,
    [ Cmdx.search ]:    cmdxSearch,
    [ Cmdx.command ]:   cmdxCommand,
    [ Cmdx.calcuate ]:  cmdxCalcuate,
};


/**
 * 选取指令处理。
 * @param  {Select} oper 处理器实例
 * @param  {String} str 命令行代码文本
 * @return {[Instance]} 操作实例集（ESEdit）
 */
function cmdxSelect( oper, str ) {
    let _els = oper.exec( str, __EHot.get() );

    if ( !_els.length ) {
        return Tips.selectNone;
    }
    return selectResult( [], oper.exec(str, __EHot.get()) );
}


/**
 * 过滤指令处理。
 * @param  {Filter} oper 过滤器实例
 * @param  {String} str 过滤表达式序列
 * @return {[Instance]} 操作实例集
 */
function cmdxFilter( oper, str ) {
    return selectResult( [], oper.exec(str) );
}


/**
 * 搜索指令处理。
 * 搜索目标包含纯空白文本节点，这样用户可以检索它们并删除。
 * 提示：
 * 用户可能需要先执行一次全文规范化（Alt+Z）。
 * @param  {Search} oper 搜索实例
 * @param  {String} str 命令行代码文本
 * @return {[Instance]} 操作实例集
 */
function cmdxSearch( oper, str ) {
    let _tts = targetElements().textNodes(true, true).flat(),
        _rngs = _tts.length && oper.exec( str, _tts );

    if ( !_rngs.length ) {
        return `${Tips.searchNothing} ${str}`;
    }
    let _ops = _rngs.map( rng => new MarkTmp(rng) );

    return selectResult( _ops, _ops.map(op => op.elem()) );
}


/**
 * 普通命令执行。
 * 已知的编辑系统命令，拥有明确的返回值类型。
 * @param  {Command} oper 命令执行器实例
 * @param  {String} str 命令行序列
 * @return {String|[Instance]} 命令状态回显信息或操作实例集
 */
function cmdxCommand( oper, str ) {
    return oper.exec( str );
}


/**
 * 计算指令处理。
 * 放在代码执行器内执行，如果改变了DOM，则进入历史栈以便于撤销。
 * @param  {Calcuate} oper 处理器实例
 * @param  {String} str 命令行代码文本
 * @return {String} 结果值（命令行回显）
 */
function cmdxCalcuate( oper, str ) {
    let _fn = oper.exec.bind( oper ),
        _op = new CodeRun( _fn, str, __EHot.get() );

    if ( _op.changed() ) {
        _op.warn( Tips.undoWarn );
        historyPush( _op );
    }
    return _op.result();
}


/**
 * 获取目标元素集。
 * 如果当前选取集为空，目标为内容区全部子元素。
 * @return {Collector}
 */
function targetElements() {
    return __ESet.size ? $( __ESet ) : $( contentElem.children );
}


/**
 * 汇集操作集和选取结果。
 * 在原有操作集内附加一些操作，包含：
 * - 清除原选取集。
 * - 选取新目标元素。
 * - 首个新目标元素设置焦点。
 * 注：
 * 专用于命令行执行结果（元素类）选取。
 * @param  {[Instance]} ops 原操作集
 * @param  {[Element]} els 新目标元素集
 * @return {[Instance]} 完整操作集
 */
function selectResult( ops, els ) {
    return ops.concat( clearSets(), pushes(els), new HotEdit(els[0]) );
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
    [ T.H4 ]: {
        self: '>h4',
        prev: null
    },

    // 子列表标题
    [ T.AH5 ]: {
        self: '>h5',
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
        self: '>:last-child',
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


/**
 * 插入顶层单元。
 * 仅在一个副本容器中插入时才需要box实参，
 * 比如获取源码时添加目录。
 * @param  {Number} type 条目类型值
 * @param  {Element} el  条目元素
 * @param  {Element} box 顶层内容容器（<main>），可选
 * @return {Element} el
 */
function topInsert( type, el, box = contentElem ) {
    let _cfg = topItemslr[ type ],
        _its = $.get( _cfg.self, box );

    if ( _its ) {
        return $.replace( _its, el );
    }
    let _ref = beforeRef( box, _cfg.prev, topItemslr );

    return _ref ? $.after(_ref, el) : $.prepend(box, el);
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
 * 特例：
 * <li> 必须从属于<ol>才有属性可修改。
 * @return {String|false|null} 模板名或假值
 */
function canProperty( els ) {
    let _tvs = [...typeSets(els)];

    if ( _tvs.length > 1 ||
        _tvs[0] === T.LI && els[0].parentElement.tagName !== 'OL' ) {
        return null;
    }
    return propertyTpl( _tvs[0] );
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
    return _bodyGets( el, '>h4' );
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
 * - 全部为内容元素但非双向固定单元（如<rt>）。
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
        // isFixed：主要适用<rt>
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
 * @param {String} content 编辑器内容根（<main>）
 * @param {String} pathbox 路径蓄力容器
 * @param {String} pslave 主面板根元素
 * @param {String} errbox 出错信息提示容器
 * @param {String} outline 大纲视图容器
 * @param {String} midtool 工具栏动态按钮区
 * @param {String} modal 模态框根容器
 * @param {String} contab 主面板内容标签容器
 */
export function init( content, covert, pslave, pathbox, errbox, infobox, outline, midtool, modal, contab ) {
    contentElem   = $.get( content );
    covertShow    = $.get( covert );
    slavePanel    = $.get( pslave );
    pathContainer = $.get( pathbox );
    errContainer  = $.get( errbox );
    infoElement   = $.get( infobox );
    outlineElem   = $.get( outline );
    midtoolElem   = $.get( midtool );
    modalDialog   = $.get( modal );
    slaveInsert   = $.get( contab );

    // 命令行处理器。
    Object.assign( __Cmder, {
        [ Cmdx.select ]:    new Select( __ESet, contentElem ),
        [ Cmdx.filter ]:    new Filter( __ESet ),
        [ Cmdx.search ]:    new Search( contentElem ),
        [ Cmdx.command ]:   new Command( __ESet ),
        [ Cmdx.calcuate ]:  new Calcuate( __ESet, contentElem ),
    });
    cmdlineInit( $.get('#x-help'), TplsPool.get(TplrName).node( Sys.modalPlug) );

    // 监听内容区变化事件。
    $.on( contentElem, varyEvents, null, __TQHistory );
}



//
// 内容区编辑处理集。
// 导出供创建快捷键映射集（ObjKey）。
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


    /**
     * 焦点切换到下一个选取集成员。
     * 如果选取成员很分散（比如搜索），这会很有用。
     */
    focusSetNext() {
        let _hot = __EHot.get(),
            _nxt = __ESet.next( _hot );

        if ( _nxt && _nxt !== _hot ) setFocus( _nxt );
    },


    /**
     * 焦点切换到前一个选取集成员。
     */
    focusSetPrev() {
        let _hot = __EHot.get(),
            _nxt = __ESet.prev( _hot );

        if ( _nxt && _nxt !== _hot ) setFocus( _nxt );
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
                historyPush( new ESEdit(siblingsUnify, _els, _hot), new HotEdit(_to) );
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
     * 取消焦点同级兄弟元素选取。
     * 保留焦点元素的选取，若未选取则选取。
     */
    cleanSiblings() {
        let _hot = __EHot.get();

        if ( !_hot || __ESet.size === 1 && __ESet.has(_hot) ) {
            return;
        }
        let _els = $.children( _hot.parentElement )
            .filter( el => __ESet.has(el) );

        historyPush( new ESEdit(__Selects.removes, _els), new ESEdit(selectOne, _hot, 'add') );
    },


    /**
     * 取消其它全部选取。
     * 仅保留焦点元素的选取，未选取则选取。
     */
    cleanOthers() {
        let _hot = __EHot.get();

        if ( !_hot || __ESet.size === 1 && __ESet.has(_hot) ) {
            return;
        }
        historyPush( new ESEdit(__Selects.empty), new ESEdit(selectOne, _hot, 'safeAdd') );
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
        siblingInvalid( __ESet );
        historyPush( new ESEdit(elementAdds, __ESet, el => $.siblings(el)) )
    },


    /**
     * 兄弟同类选取。
     */
    tagsameVF() {
        siblingInvalid( __ESet );
        historyPush( new ESEdit(elementAdds, __ESet, el => $.find(`>${el.tagName}`, el.parentElement)) );
    },


    /**
     * 前向扩选。
     */
    previousVF( n ) {
        siblingInvalid( __ESet );
        n = isNaN(n) ? 1 : n;

        historyPush( new ESEdit(elementAdds, __ESet, el => $.prevAll(el, (_, i) => i <= n)) );
    },


    /**
     * 后向扩选。
     */
    nextVF( n ) {
        siblingInvalid( __ESet );
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
     * 正序。
     * 焦点设置到首个成员。
     */
    selectSort() {
        let _els = $(__ESet).sort().item();

        if ( _els.length < 2 ) {
            return;
        }
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) ) || statusInfo( Tips.sortCompleted );
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
        historyPush( new ESEdit(newSafeAdds, _els), new HotEdit(_els[0]) ) || statusInfo( Tips.sortCompleted );
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


    //-- 大小写转换 ----------------------------------------------------------

    toUpperCase() {
        if ( !__ESet.size ) {
            return;
        }
        let _nds = $(__ESet).textNodes(true, true).flat(),
            _fun = txt => txt.toUpperCase();

        _nds.length &&
        historyPush( new TextModify(_nds, _fun) );
    },


    /**
     * 首字符转为大写。
     * 以选取的元素为范围，只检索其首个非空文本节点。
     */
    toUpperCase1() {
        if ( !__ESet.size ) {
            return;
        }
        let _nds = $(__ESet).textNodes( true, true )
            .map( nds => nds[0] ),
            // 任意位置首个匹配替换。
            // 这样更灵活性，可忽略非字母包围等。
            _fun = txt => txt.replace( /[a-z]/, ch => ch.toUpperCase() );

        _nds.length &&
        historyPush( new TextModify(_nds, _fun) );
    },


    toLowerCase() {
        if ( !__ESet.size ) {
            return;
        }
        let _nds = $(__ESet).textNodes(true, true).flat(),
            _fun = txt => txt.toLowerCase();

        _nds.length &&
        historyPush( new TextModify(_nds, _fun) );
    },


    //-- 焦点元素相关 --------------------------------------------------------

    /**
     * 向内填充（移动）。
     * 遵循编辑器默认的内插入逻辑（逐层测试构建）。
     */
    elementFill() {
        let _box = __EHot.get();

        if ( !_box || !__ESet.size ) {
            return;
        }
        if ( __ESet.has(_box) ) {
            return help( 'cannot_selected', _box );
        }
        let _ops = moveAppend( $(__ESet), _box, null, true );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内填充（克隆）。
     */
    elementCloneFill() {
        let _box = __EHot.get();

        if ( !_box || !__ESet.size ) {
            return;
        }
        // 自我填充简单忽略
        if ( __ESet.size === 1 && __ESet.has(_box) ) {
            return;
        }
        let _ops = cloneAppend( $(__ESet).clone(), _box, null, true );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内末尾添加（移动）。
     */
    elementAppend() {
        let _box = __EHot.get();

        if ( !_box || !__ESet.size ) {
            return;
        }
        if ( __ESet.has(_box) ) {
            return help( 'cannot_selected', _box );
        }
        let _ops = moveAppend( $(__ESet), _box );

        _ops && historyPush( ..._ops );
    },


    /**
     * 向内末尾添加（克隆）。
     */
    elementCloneAppend() {
        let _box = __EHot.get();

        if ( !_box || !__ESet.size ) {
            return;
        }
        let _ops = cloneAppend( $(__ESet).clone(), _box );

        _ops && historyPush( ..._ops );
    },


    /**
     * 同级前插入（移动）。
     */
    elementBefore() {
        let _to = __EHot.get();

        if ( !_to || !__ESet.size ) {
            return;
        }
        if ( __ESet.has(_to) ) {
            return help( 'cannot_selected', _to );
        }
        let _ops = moveAppend( $(__ESet), _to.parentElement, _to );

        _ops && historyPush( ..._ops );
    },


    /**
     * 同级前插入（克隆）。
     */
    elementCloneBefore() {
        let _to = __EHot.get();

        if ( !_to || !__ESet.size ) {
            return;
        }
        let _ops = cloneAppend( $(__ESet).clone(), _to.parentElement, _to );

        _ops && historyPush( ..._ops );
    },


    /**
     * 同级后插入（移动）。
     */
    elementAfter() {
        let _to = __EHot.get();

        if ( !_to || !__ESet.size ) {
            return;
        }
        if ( __ESet.has(_to) ) {
            return help( 'cannot_selected', _to );
        }
        let _ops = moveAppend( $(__ESet), _to.parentElement, $.nextNode(_to) );

        _ops && historyPush( ..._ops );
    },


    /**
     * 同级后插入（克隆）。
     */
    elementCloneAfter() {
        let _to = __EHot.get();

        if ( !_to || !__ESet.size ) {
            return;
        }
        let _ops = cloneAppend( $(__ESet).clone(), _to.parentElement, $.nextNode(_to) );

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


    /**
     * 内容区规范化。
     * 通常在命令行执行搜索前需要，因为搜索是以文本节点为天然分区的。
     * 注记：
     * 并不在搜索时自动执行，因为文本节点数量太多。
     */
    normalize() {
        let _op = new DOMEdit(
                () => $.normalize(contentElem)
            );
        // 仅在有变化时才入栈。
        if ( _op.changed() ) historyPush( _op );
    },


    //-- 定位移动 ------------------------------------------------------------
    // 前提：position:absolute
    // 普通移动为 1px/次，增强移动为 10px/次
    // 操作的是 left/top 两个内联样式，与 right/bottom 无关。
    // 注：对<svg>子单元无效。


    moveToLeft() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'left', -1 );

        // new Follow: 特性面板实时更新，下同。
        _op && historyPush( _op, postionFollow(_els, 'right'), new Follow(true) );
    },


    moveToLeftTen() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'left', -10 );

        _op && historyPush( _op, postionFollow(_els, 'right'), new Follow(true) );
    },


    moveToRight() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'left', 1 );

        _op && historyPush( _op, postionFollow(_els, 'right'), new Follow(true) );
    },


    moveToRightTen() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'left', 10 );

        _op && historyPush( _op, postionFollow(_els, 'right'), new Follow(true) );
    },


    moveToUp() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'top', -1 );

        _op && historyPush( _op, postionFollow(_els, 'bottom'), new Follow(true) );
    },


    moveToUpTen() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'top', -10 );

        _op && historyPush( _op, postionFollow(_els, 'bottom'), new Follow(true) );
    },


    moveToDown() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'top', 1 );

        _op && historyPush( _op, postionFollow(_els, 'bottom'), new Follow(true) );
    },


    moveToDownTen() {
        let _els = [...__ESet],
            _op = elementsPostion( _els, 'top', 10 );

        _op && historyPush( _op, postionFollow(_els, 'bottom'), new Follow(true) );
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



    //-- 其它面板 ------------------------------------------------------------

    /**
     * 设置元素内联样式。
     * 目标：暂存区/栈顶1项。
     * 对目标元素集批量设置样式。
     * name的多名称支持空格分隔或数组形式（tQuery）。
     * @data: [Element] 目标元素集
     * @param {String|[String]} name 样式名序列
     * @param {Value|[Value]} 样式值
     */
    setStyle( evo, name, val ) {
        willStyle( evo.data, name, val ) &&
        historyPush( new DOMEdit(__Edits.styles, evo.data, name, val), new Follow() );
    },

    __setStyle: 1,


    /**
     * 清除目标内联样式。
     * 会验证目标样式至少存在一个才会执行。
     * 多个名称以空格分隔。
     * @data: [Element] 目标元素集
     * @param {String} names 样式名序列
     */
    eraseStyle( evo, names ) {
        let _will = null;
        names = names.split( __reSpace );

        for ( const el of evo.data ) {
            if ( hasStyle(el, names) ) {
                _will = true;
                break;
            }
        }
        _will && historyPush( new DOMEdit(__Edits.styles, evo.data, names, null), new Follow() );
    },

    __eraseStyle: 1,


    /**
     * 样式刷。
     * 目标：暂存区/栈顶1项。
     * 将目标元素的样式应用到全部已选取的元素。
     * 如果目标元素无任何内联样式，或只有目标元素被选取，则无动作。
     * 注记：
     * 应用后取消目标元素的选取（如果已选取），表达两者不同，
     * 同时也隐含表达目标仅需是焦点即可。
     * @data: Element 目标元素
     */
    brushStyle( evo ) {
        let _el = evo.data,
            _v = $.attr( _el, 'style' ),
            _n = __ESet.size,
            _op = null;

        if ( !_v || !_n || _n === 1 && __ESet.has(_el) ) {
            return;
        }
        if ( __ESet.has(_el) ) {
            _op = new ESEdit( __Selects.delete, _el );
        }
        historyPush( _op, new DOMEdit(__Edits.attrs, [...__ESet], 'style', _v), new Follow() );
    },

    __brushStyle: 1,


    /**
     * 清除全部样式。
     * 目标：暂存区/栈顶1项。
     * 清除目标元素集的全部样式。
     * 至少要有一个元素拥有内联样式定义，否则无动作。
     * 友好：
     * 即便多次单击清除按钮，不会导致冗余的历史栈存储。
     * @data: [Element]
     */
    clearStyle( evo ) {
        let _will = null;

        for ( const el of evo.data ) {
            if ( $.attr(el, 'style') !== null ) {
                _will = true;
                break;
            }
        }
        // 注：名称为 null。
        _will && historyPush( new DOMEdit(__Edits.styles, evo.data, null), new Follow() );

    },

    __clearStyle: 1,


    /**
     * 元素特性更新。
     * 仅支持单个元素选取。
     * 注：
     * 若需删除目标特性本身，可在选单列表中直接按Delete键完成。
     * @data String|[String] 特性值（集）
     * @param {String} name 特性名/序列（如 'on by to'）
     */
    attrUpdate( evo, name ) {
        // 冗余检查（表单提交逻辑已保证）。
        if ( __ESet.size !== 1 ) {
            return;
        }
        historyPush( new DOMEdit(__Edits.attrs, [...__ESet], name, evo.data), new Follow() );
    },

    __attrUpdate: 1,


    /**
     * 删除特性。
     * 撤销时需要更新，故依然需要一个Follow实例。
     * @data: {String} 特性名
     */
    deleteAttr( evo ) {
        historyPush(
            new DOMEdit( __Edits.attrs, [...__ESet], evo.data, null ),
            new Follow()
        );
    },

    __deleteAttr: 1,


    /**
     * 源码更新。
     * 以用户输入的HTML源码替换选取的元素。
     * 注：仅支持单个元素选取。
     * @data: String 源码数据
     */
    htmlUpdate( evo ) {
        if ( __ESet.size !== 1 || !evo.data.length ) {
            return;
        }
        let _els = [...__ESet],
            _nodes = htmlNodes( evo.data );

        historyPush(
            cleanHot( _els, true ),
            clearSets(),
            new DOMEdit( () => $.replace(_els[0], _nodes) )
        );
    },

    __htmlUpdate: 1,


    /**
     * 执行脚本。
     * 空白脚本无任何行为。
     * 执行无结果时向后传递null值（注：不会打开结果模态框）。
     * Object3: {
     *      type:String 结果类型（error|value）
     *      data:Value  执行的结果（任意）
     *      code:String 当前脚本代码（用于历史存储），可选
     * }
     * @data: String 脚本源码
     * @param  {String} rbox 执行环境（sandbox|editor）
     * @param  {Boolean} btext 含文本集数据
     * @param  {Boolean} bhtml 含源码集数据
     * @return {Promise<Object3>|Object3|null} 运行结果
     */
    runScript( evo, rbox, btext, bhtml ) {
        let code = evo.data.trim();
        if ( !code ) return null;

        if ( rbox === 'editor' ) {
            let _op = new CodeRun( scriptRun2, code, $(__ESet) );

            // 若改变DOM就进入历史栈。
            if ( _op.changed() ) {
                _op.warn( Tips.undoWarn );
                historyPush( _op );
            }
            // 结果为假表示正常执行，保存代码并返回null。
            // 结果为Object3，合法性未定，交由后阶处理（是否保存代码）。
            return _op.result() || saveCode( code ) || null;
        }
        return scriptRun( scriptData(__ESet, {code}, btext, bhtml) )
            .then( data => ({type: 'value', data, code}) )
            .catch( data => ({type: 'error', data, code: ''}) )
    },

    __runScript: 1,


    /**
     * 脚本执行结果插入。
     * 如果位置未定义（空串），则简单忽略。
     * 结果文本作为单一数据被复制应用到每一个选取的元素。
     * 约束：
     * 判断目标位置是否合法，合法则可简单插入，
     * 若目标位置不合法，用数据创建一个默认的合法单元（create.js模块）。
     * 数据：
     * - 文本类型时，创建为文本节点（换行有效）。
     * - 源码类型时，顶层的平行节点逐一判断取用或新建。
     * @data: String 结果文本
     * @param  {String} type 内容类型（text|html）
     * @param  {String} where 插入位置（6种基本方法）
     * @return {void}
     */
    insResult( evo, type, where ) {
        let _txt = evo.data.trim(),
            _tos = [...__ESet];

        // 微编辑下或无插入要求。
        if ( !_tos.length || !where || !_txt ) {
            return;
        }
        let _bad = invalidInsert( _tos, where );

        if ( _bad ) {
            return help( 'cannot_append', _bad );
        }
        let $tmp = $typeNodes( type, _txt ),
            _op1 = clearSets(),
            _els2 = _tos.map( to => validNodes(to, where, $tmp.clone()) );

        historyPush(
            new HotEdit(),
            _op1,
            new DOMEdit( __Edits.alignInsert, _tos, where, _els2 )
        );
    },

    __insResult: 1,


    /**
     * 元素属性更新。
     * 处理器接口：function(el, names, values, args): void
     * 为对多个目标的部分属性进行修改，
     * 有如下值规则：
     * - 文本框输入的值，空串表示无操作（维持原值）。
     * - 单选按钮无任何选中时表示“不确定”状态，维持原属性值不变。
     * - 复选框在 indeterminate 为真时同上，维持原属性值。
     * - 选单的不确定状态为无任何选取，维持原值。
     * - 单个目标时，文本框空串会移除该属性（友好）。
     * 注记：
     * 在此处理以便于压入编辑历史栈。
     * 预先获取额外数据而非在处理中新建（节点），避免Redo后的原引用失效。
     * @data: String 属性名序列
     * @param  {...Value} vals 值序列
     * @return {void}
     */
    propUpdate( evo, ...vals ) {
        let _els = [ ...__ESet ],
            _fun = propertyProcess( getType(_els[0]) );

        // 单目标简单处理。
        if ( _els.length === 1 ) {
            // new Follow:
            // 特性面板即时更新特性值（如果选单未变）。
            return historyPush( new DOMEdit(_fun, _els[0], evo.data, ...propertyData(_els[0], ...vals)), new Follow(true) )
        }
        // 多目标特别处理。
        let val2 = propertyData2( _els, ...vals );

        historyPush( ..._els.map( (el, i) => new DOMEdit(_fun, el, evo.data, ...val2[i]) ) );
    },

    __propUpdate: 1,


    /**
     * 命令行执行。
     * 空白序列不会被执行，但文本首尾的空白是有意义的。
     * @data: String 命令行代码
     * @param  {String} key 指令类型键
     * @return {Value|null} 运行结果（用于回显）
     */
    cmdRun( evo, key ) {
        let _str = evo.data,
            _val = _str.trim() && __Cmdoper[ key ]( __Cmder[key], _str );

        // 命令序列记录。
        typeRecord( key ).add( evo.data );

        if ( !$.isArray(_val) ) {
            // 非编辑区操作实例集，返回值回显
            return _val;
        }
        delayFire( contentElem, __evnFocus, null, true );

        return historyPush( ..._val ) || null;
    },

    __cmdRun: 1,


    /**
     * 插件执行。
     * 在用户单击插件面板中的目标插件按钮时发生。
     * - 模态框会被自动关闭。
     * - 如果插件请求了模板节点（名称），则导入并渲染。
     * - 插件请求的模板会在模态框之上。
     * @data: Element 插件按钮
     * @return {Promise<[Element, String]>}
     */
    pluginsRun( evo ) {
        let _name = pluginsName( evo.data ),
            _ttl = $.attr( evo.data, 'title' ) || '',
            // 全局信息在此设置
            _data = { INFO: {} };

        if ( !_name ) {
            throw new Error( 'not found the plugins.' );
        }
        return plugLoad(
            `${ROOT}${Local.plugRoot}/${_name}/${Local.plugMain}`,
            // {INFO, HTML, TEXT}
            scriptData( __ESet, _data, true, true )
        )
        .then( obj => plugResult(obj, _name, _ttl) );
    },

    __pluginsRun: 1,



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
     * 支持多个相同单元同时设置。
     */
    properties() {
        let $els = $( __ESet ),
            _tpl = canProperty( $els );

        if ( !_tpl ) {
            return help( 'not_property', $els[0] );
        }
        propertyEdit( _tpl );
    },

};


//
// 辅助工具集。
// 导出供模板中在调用链上直接使用（其方法）。
//
export const Kit = {

    //-- 普通工具 ------------------------------------------------------------
    // 注记：在On中通过call或apply指令调用。

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



    //-- On 扩展 -------------------------------------------------------------

    /**
     * 获取选取集。
     * @return {Collector}
     */
    sels() {
        return $( __ESet );
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
     * 获取选取集首个成员。
     */
    sel0() {
        return first( __ESet ) || null;
    },


    /**
     * 获取焦点元素。
     */
    efocus() {
        return __EHot.get();
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
     * 获取目标元素的特性集。
     * @data Element 目标元素
     * @return {[String]}
     */
    attrns( evo ) {
        return [ ...evo.data.attributes ].map( nd => nd.name );
    },

    __attrns: 1,


    /**
     * 检查创建OBT特性复合名。
     * 如果不是on/by/to任一名称，简单通过（自动移除空白）。
     * @data: String|[String]
     * @return {String}
     */
    obtname( evo ) {
        let x = evo.data,
            f = s => __obtNames.has(s) ? __obtAttr : s.replace(__reSpace, '');

        // 排除OBT重复。
        return $.isArray(x) ? [...new Set(x.map(f))] : f( x );
    },

    __obtname: 1,


    /**
     * OBT片段切分。
     * 注：顶层分组由分号分隔。
     * @data: [String] OBT配置串组
     * @return {[[String]]}
     */
    obtsplit( evo ) {
        // 前阶出错包容（比如末尾带入引号）。
        __dlmtSplit.reset();

        return evo.data.map(
            ss =>
            ss ? [...__dlmtSplit.split(ss)].map(s => s.trim()) : []
        );
    },

    __obtsplit: 1,


    /**
     * 构造OBT配置组序列。
     * 检查末尾和内部顶层分号，简单移除处理。
     * OnByTo集合中的空白条目设置为占位符，末尾多余的空白条目被移除。
     * 注记：
     * 因为<select>的change是事后触发，难以设计为出错禁止切换，
     * 所以只是简单纠错而已（非友好）。
     * @data: [[String]] OnByTo配置组集引用
     * @return {[String]} 特性值组
     */
    obtval( evo ) {
        // 单条合法性处理。
        let _obts = evo.data.map(
            list => list.map( obtVal ).map( v => v || __chrZero )
        );
        // 集合清理并合成。
        return obtsClean( _obts ).map( list => list.join(__chrDlmt + '\n') || null );
    },

    __obtval: 1,


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
     * @param  {Number} y 鼠标点y坐标
     * @return {[String, String]} 计算后的鼠标点像素坐标对
     */
    menupos( evo, box, [x, y] ) {
        let _mw = $.outerWidth( evo.data ),
            _co = $.offset( box ),
            _bw = $.innerWidth( box ),
            _y2 = y - _co.top + $.scrollTop(box) + Limit.popupGapTop;

        if ( x + _mw < _bw + _co.left ) {
            return [ `${x - _co.left}px`, `${_y2}px` ];
        }
        return [ `${_bw - _mw - Limit.popupGapRight}px`, `${_y2}px` ];
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
     * 构造元素自身的信息。
     * 友好提示目标元素的特性结构。
     * 用于焦点元素路径上。
     * @data: Element
     * @return {String|null}
     */
    elemSelf( evo ) {
        let _el = evo.data;
        return _el ? selfHTML(_el).replace(__reClassv, '') : null;
    },

    __elemSelf: 1,


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
     * 注记：
     * 选单条目定义在同一个模板文件中且已经载入。
     * @data: [Element] 已选取集
     * @param  {String} type 位置类型（siblings|children）
     * @return {[Element]|null} 选单元素集（[<option>]）
     */
    inslist( evo, type ) {
        if ( !evo.data.length ) {
            return null;
        }
        let _ns = __levelHandles[type]( evo.data ),
            _ts = TplsPool.get( TplrName );

        return _ns.length ? _ns.map( n => _ts.node(n) ) : null;
    },

    __inslist: 1,


    /**
     * 片区内容混杂检查。
     * 即片区内是否同时包含子片区和内容件，这是不规范的结构。
     * 目标：暂存区/栈顶1项。
     * @data String 插入位置定义（siblings|children）。
     * @return {Boolean} 是否混杂
     */
    ismixed( evo ) {
        let _els = evo.data === Sys.levelName1 ?
            [...parentsSet(__ESet)] :
            [...__ESet];

        return _els.some( el => __reSecbox.test(el.tagName) && T.sectionState(el) === 3 );
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
     * 清理空白时保留首个空白移除剩余空白，首个空白可能是换行符。
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
     * @param  {Boolean} bkall 向前移除增强（全部缩进）
     * @return {String|null}
     */
    k3edit( evo, key, rng, el, bkall ) {
        let _lp = rangeTextLine( rng, true, evo.data ),
            _n = el && +$.val( el );

        switch ( key ) {
            case 'Enter':
                // 无缩进时尾随一个空格（参见.blankline）
                return `\n${indentedPart(_lp) || ' '}`;
            case 'Tab':
                return tabSpaces( _lp, _n );
        }
        // Backspace
        // 选取一个缩进序列，加按增强键选取全部缩进。
        if ( _n > 0 && !rng.toString() && _lp.endsWith(' '.repeat(_n)) ) {
            if ( bkall ) {
                _n = _lp.length;
            }
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
     * @return {[Object2|Object2x]} 高亮配置对象集
     */
    hlcode( evo, tab, lang ) {
        return highLight( evo.data.split(__reNewline), lang, tab );
    },

    __hlcode: 1,


    /**
     * 分解构造代码集。
     * 顶层不需要传递语言实参（已解析）。
     * 返回合法的子元素序列，无需再设置<code>属性。
     * @data: [Object2|Object2x]
     * @return {[Element]} 代码行集（[<code>]）
     */
    codels( evo ) {
        return codeWraps( null, evo.data, htmlList );
    },

    __codels: 1,


    /**
     * 分解构造代码块。
     * 如果有嵌入其它语言，会有子块存在。
     * @data: [Object2|Object2x]
     * @param  {String} lang 所属语言（顶层）
     * @return {[Element]} 代码块子块集（[<code>]）
     */
    codeblo( evo, {lang} ) {
        return codeWraps( lang, evo.data, htmlBlock );
    },

    __codeblo: 1,


    /**
     * 根据内容类型创建图片。
     * 图片配置为JS数组/对象，故由一个Worker解析。
     * 内容格式：
     * svg: XML源码内容。
     * url|b64: [
     *      URL{String}     图片URL字符串
     *      Opts{Object}    宽高等配置对象
     * ]
     * 注：供创建插图单元时使用。
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
     * 即<source>和<track>元素集，仅限于视频/音频容器。
     * 配置串支持单个对象或对象数组格式。
     * 注：音频内无<track>单元。
     * @data: String 资源配置串（<source>）
     * @param  {String} track 字幕配置串（<track>），可选
     * @return {Promise<[Element]>|''}
     */
    mediasubs( evo, track ) {
        let _p1 = mediaSubs( evo.data.trim(), T.SOURCE1 );

        if ( track === undefined ) {
            return _p1;
        }
        // Promise<[[Element]|'', [Element]|'']>
        return Promise.all([ _p1, mediaSubs(track.trim(), T.TRACK) ]);
    },

    __mediasubs: 1,


    /**
     * 创建自适应图片（<picture>）子单元。
     * 即：<source>元素集（不含<img>子单元）。
     * @data: String 配置格式串
     * @return {Promise<[Element]>|''}
     */
    picsubs( evo ) {
        return mediaSubs( evo.data.trim(), T.SOURCE2 )
    },

    __picsubs: 1,


    /**
     * 复选框状态求值。
     * 检查集合中元素的目标内联样式是否：相同、缺失或混杂。
     * 返回值：
     * - [0] checked 属性值
     * - [1] indeterminate 属性值
     * 注：用于设置复选框按钮状态。
     * @data: [Element] 目标元素集
     * @param  {String} name 样式名
     * @param  {Value} value 对比样式值
     * @return {[Boolean, Boolean]} 名值对
     */
    cbstate( evo, name, value ) {
        if ( !evo.data.length ) {
            return null;
        }
        let _chk = evo.data[0].style[name] === value;

        for ( const el of evo.data.slice(1) ) {
            let _b = el.style[name] === value;
            if ( _b !== _chk ) return [ false, true ];
        }
        return [ _chk, false ];
    },

    __cbstate: 1,


    /**
     * 内联样式求值。
     * 检查集合中元素的目标内联样式，
     * 相同则返回值本身，否则返回null。
     * 注：
     * 返回的null表示目标集处于未定状态（混杂）。
     * @data: [Element] 目标元素集
     * @param  {String|[String]} names 样式名序列
     * @return {Value|[Value]|null}
     */
    styVal( evo, names ) {
        if ( !evo.data.length ) {
            return null;
        }
        if ( $.isArray(names) ) {
            return names.map( n => styleVal(evo.data, n) );
        }
        return styleVal( evo.data, names );
    },

    __styVal: 1,


    /**
     * 判断提取含单位的值。
     * 如果录入框数值包含单位，则忽略选单选取的单位，
     * 否则选单的单位附加到录入框数值之后。
     * @data: [<input>, <select>] 两个控件元素
     * @return {String} 最终值
     */
    unitVal( evo ) {
        let _tv = evo.data[0].value,
            _uv = evo.data[1].value;

        return isNaN(parseFloat(_tv) - _tv) ? _tv : _tv+_uv;
    },

    __unitVal: 1,


    /**
     * 检查过滤有内联样式设置的样式名集。
     * 样式需在所有目标元素中都有设置才有效，否则忽略。
     * @data: [Element] 目标元素集
     * @param  {String} names 待检查样式名序列（空格分隔）
     * @return {[String]} 实际存在的样式名集
     */
    styName( evo, names ) {
        if ( !evo.data.length ) {
            return null;
        }
        return names.split( __reSpace ).filter( n => styleName(evo.data, n) );
    },

    __styName: 1,


    /**
     * 检查内联样式串中的键名集。
     * 需要在所有的目标元素内都有设置才有效，否则忽略。
     * 类似styName，但用字符串匹配检查。
     * 注记：
     * 设置复合样式时具体样式会同时有值，比如设置 padding，
     * Element.style中会同时包含 padding-left、padding-top等等。
     * 此处仅匹配明确设置的值。
     * @data: [Element] 目标元素集
     * @param  {String} names 待检查样式名序列（空格分隔）
     * @return {[String]} 实际存在的样式名集
     */
    styKey( evo, names ) {
        if ( !evo.data.length ) {
            return null;
        }
        return names.split( __reSpace ).filter( n => styleKey(evo.data, n) );
    },

    __styKey: 1,


    /**
     * 获取干净的源码。
     * 取元素的outerHTML值但移除内置的类名。
     * @data: Element 目标元素
     * @return {String}
     */
    cleanHTML( evo ) {
        return cleanHTML( evo.data );
    },

    __cleanHTML: 1,


    /**
     * 创建单行MD节点片段。
     * 根据系统设置，解析单行MarkDown源码构造节点集（文档片段）。
     * 注记：
     * 新建内容元素支持文档片段数据。
     * @data: String|[String] 文本行（集）
     * @return {String|[String]|DocumentFragment|[DocumentFragment]}
     */
    mdline( evo ) {
        if ( !Fx.mdline || !evo.data ) {
            return evo.data;
        }
        if ( $.isArray(evo.data) ) {
            return evo.data.map( tt => $.fragment(markdownLine(tt)) );
        }
        return $.fragment( markdownLine(evo.data) );
    },

    __mdline: 1,


    /**
     * 命令行键入内容。
     * 清除匹配集临时表引用，配合cmdnext/cmdprev操作。
     * 注：
     * 简单自我操作，故放在On部分（书写友好）。
     */
    cmdclear() {
        this.cmdNavTemp = null;
    },


    /**
     * 提取保存的源码。
     */
    savedhtml() {
        return __EDStore.get( Sys.storeMain );
    },



    //-- By 扩展 -------------------------------------------------------------

    /**
     * 选取集取消。
     * ESC键取消操作（最底层）。
     * 会同时取消元素焦点。
     * 注记：固定配置不提供外部定制。
     * @return {void}
     */
    ecancel() {
        if ( __ESet.size || __EHot.get() ) {
            historyPush( new HotEdit(null), new ESEdit(__Selects.empty) );
        }
    },


    /**
     * 设置内容源码。
     * 与其它设置（如 Api.content(...)）不同，此操作进入编辑历史栈。
     * 内容数据支持源码或节点数据（集）。
     * @data: String|Element|[Element]
     * @return {void}
     */
    puthtml( evo ) {
        let _frm = $.fragment( evo.data ),
            _fun = els => $.fill( contentElem, els );

        historyPush( new HotEdit(null), clearSets(), new DOMEdit(_fun, [..._frm.childNodes]) );
    },

    __puthtml: 1,


    /**
     * 主动插入主标题（h1）。
     * 用于内容区为空时初始的录入定位，
     * 否则缺乏位置参考，录入面板的条目选单无内容。
     * 注记：
     * 进入编辑历史栈，因为内容区为空可能由用户删除全部内容导致。
     * @data: String 标题内容（提示文本）
     */
    heading( evo ) {
        if ( contentElem.childElementCount > 0 ) {
            return;
        }
        let _fn = h1 => $.prepend( contentElem, h1 );

        historyPush( new DOMEdit(_fn, $.elem('h1', evo.data)) );
    },

    __heading: 1,


    /**
     * 错误元素提示。
     * 按住聚焦辅助键单击设置焦点。
     * @data: Element 问题元素
     * @param  {Set} scam 按下的修饰键集
     * @return {void}
     */
    errmsg( evo, scam ) {
        if ( scamPressed(scam, cfg.Keys.elemFocus) ) {
            setFocus( evo.data );
        }
    },

    __errmsg: 1,


    /**
     * 章节滚动。
     * 滚动目标章节到当前视口。
     * @data: [Number] 章节序列
     * @return {void}
     */
    chapter( evo ) {
        let _el = $.get( h2PathSelector(evo.data), $.get('article', contentElem) );
        if ( _el ) $.intoView( _el, 1, 1 );
    },

    __chapter: 1,


    /**
     * 本地暂存。
     * 存储数据元素的内容HTML源码。
     * 会清除临时的状态类名（焦点、选取）。
     * @data: Element 内容区根（<main>）
     * @return {String} 存储完成提示
     */
    save( evo ) {
        let _html = $( evo.data.children )
            .map( cleanHTML )
            .join( '' );

        if ( !Sys.saver(_html) ) {
            __EDStore.set( Sys.storeMain, _html );
        }
        return Tips.localStoreDone;
    },

    __save: 1,


    /**
     * 导出内容源码。
     * 提取内容源码，发送到源码导出模态框。
     * 如果当前没有选取元素，取内容区全部内容。
     * @data: [Element] 当前选取集
     * @return {String} 结果源码
     */
    export( evo ) {
        let _els = evo.data.length ?
            evo.data :
            $.children( contentElem );

        return _els.map( cleanHTML ).join( '' );
    },

    __export: 1,


    /**
     * 导出包含目录的内容源码。
     * 注记：
     * 目录需要插入合适的位置，因此克隆一个根元素。
     * @data: [String] 目录标签
     * @return {String} 结果源码
     */
    export2( evo ) {
        let _box = cleanElem( contentElem ),
            _art = $.get( 'article', _box );

        topInsert( T.TOC, create(T.TOC, {h4: evo.data}, _art), _box );

        return $.html( _box );
    },

    __export2: 1,


    /**
     * 源码美化（换行&缩进）。
     * 制表符空格数实参非数值（NaN）时，缩进采用一个Tab。
     * 0值空格数有效，即没有缩进（但有换行）。
     * @data: String 内容源码
     * @param  {Number|NaN} tabs 制表符空格数，可选
     * @return {String}
     */
    nicehtml( evo, tabs ) {
        let _ind = isNaN(tabs) ? '\t' : ' '.repeat(tabs),
            _els = [...$.fragment(evo.data).children];

        try {
            return _els.map( el => niceHtml(el, _ind) ).join( '' ).trim();
        }
        catch( e ) {
            // 源码结构出错提示。
            $.trigger( $.get(`#${Local.sourceTips}`), 'show' )
        }
    },

    __nicehtml: 1,


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
        let _src = miniedOk();

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
     * 从划选创建内联单元。
     * 目标：暂存区/栈顶1项。
     * 清除已选取，便于连续划选时可以有效弹出属性编辑框。
     * @data: Range
     * @param  {String} name 单元名称
     * @return {void}
     */
    rngelem( evo, name ) {
        let _box = evo.data.commonAncestorContainer;

        if ( _box.nodeType === 3 ) {
            _box = _box.parentElement;
        }
        let _op0 = clearSets(),
            _op1 = new RngEdit( evo.data, name ),
            _hot = _op1.elem();

        // 最终聚焦使视觉明显。
        historyPush( _op0, _op1, new ESEdit(elementOne, _hot, 'safeAdd'), new HotEdit(_hot) );

        // 友好：立即定义属性。
        // 但单元已经创建，撤销需手动Undo。
        inlinePopup(name, _op1) && Edit.properties();
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
     * @data: String 转换目标名
     * @return {void}
     */
    convert( evo ) {
        if ( !__ESet.size ) return;

        let _els = [...__ESet],
            _op1 = cleanHot( _els, true ),
            _op2 = clearSets(),
            [op3, _new] = convertTo( evo.data, _els );

        historyPush( _op1, _op2, op3, pushes(_new) );

        // 友好：
        // 部分内联转换会立即弹出属性编辑框。
        __popupCells.has(evo.data) && Edit.properties();
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
     * 注记：
     * level实际上只可能是siblings，因为children不会执行到这儿。
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


    /**
     * 检查源码的HTML结构。
     * 按深度优先遍历，但一次返回一个兄弟层级内的非法节点信息。
     * 最终无错时返回null。
     * @data: Element 容器元素
     * @return {[String]|null}
     */
    checkhtml( evo, html ) {
        let _frg = $.fragment( html ),
            // $.contents()忽略空文本节点
            _bad = wrongNodes( evo.data.parentElement, $.contents(_frg) );

        return _bad ? _bad.map( nodeInfo ) : null;
    },

    __checkhtml: 1,


    /**
     * 构建特性名清单。
     * 移除新集合中不存在的旧条目。
     * 如果名称条目已存在，保留以不影响选取状态。
     * 注记：
     * 条目更新可以使内容自适应。
     * @data: Collector 原选项集（<option>）
     * @param  {[String]} vals 更新集（值）
     * @return {[String]} 补充集
     */
    attrlist( evo, vals ) {
        let _new = new Set( vals );

        for ( const el of evo.data ) {
            let _v = $.prop(el, 'value');

            _new.has(_v) ? _new.delete(_v) : $.remove(el);
        }
        return [ ..._new ];
    },

    __attrlist: 1,


    /**
     * 主控OBT列表新建一行。
     * 新建的行会在当前行之后插入，
     * 因此需要在OBT集中相应位置（如果有效）插入一个空条目。
     * @data: Element 当前行<li>
     * @param  {[String]} on On配置组引用
     * @param  {[String]} by By配置组引用
     * @param  {[String]} to To配置组引用
     * @return {Element}
     */
    obtline( evo, on, by, to ) {
        let _n = $.siblingNth( evo.data );

        if ( _n < on.length ) on.splice( _n, 0, '' );
        if ( _n < by.length ) by.splice( _n, 0, '' );
        if ( _n < to.length ) to.splice( _n, 0, '' );

        // 一个空行。
        return $.prop( $.clone(evo.data), 'text', null );
    },

    __obtline: 1,


    /**
     * 主控OBT列表删除当前行。
     * @data: Element 当前行<li>
     * @param  {[String]} on On配置组引用
     * @param  {[String]} by By配置组引用
     * @param  {[String]} to To配置组引用
     * @return {Element} 当前行
     */
    obtdel( evo, on, by, to ) {
        let _i = $.siblingNth(evo.data) - 1;

        on.splice( _i, 1 );
        by.splice( _i, 1 );
        to.splice( _i, 1 );

        return evo.data;
    },

    __obtdel: 1,


    /**
     * 上下移动当前行。
     * 注意同步调整OBT数据集。
     * 返回null表示位于端部（顶或底）。
     * @data: Element 当前行<li>
     * @param  {String} arrow 箭头键（ArrowUp|ArrowDown）
     * @param  {[String]} on On配置组引用
     * @param  {[String]} by By配置组引用
     * @param  {[String]} to To配置组引用
     * @return {[Element, String]|null} [相对目标, 换位方法]
     */
    obtswap( evo, arrow, [on, by, to] ) {
        let _el = evo.data;
        return arrow === 'ArrowUp' ? obt2prev(_el, on, by, to) : obt2next(_el, on, by, to);
    },

    __obtswap: 1,


    /**
     * 命令行历史：
     * 键入Tab键匹配最新一条历史记录。
     * UI表现：
     * 取光标之前的文本匹配历史记录，
     * 若有匹配则设置该值，同时选中光标之后的部分（便于继续键入）。
     * @data: String 指令类型符（>|/:=）
     * @param  {Element} el 输入条
     * @param  {Boolean} rev 是否逆向匹配
     * @return {void}
     */
    cmdlast( evo, el, rev ) {
        let _beg = el.selectionStart,
            _lst = typeRecord( evo.data ).find( el.value.substring(0, _beg) );

        this.cmdNavTemp = new CmdNav( _lst );

        let _val = rev ?
            this.cmdNavTemp.last() :
            this.cmdNavTemp.first();

        _val && $.val( el, _val ).setSelectionRange( _beg, _val.length );
    },

    __cmdlast: 1,


    /**
     * 命令行历史：
     * 向上箭头键滚动历史记录的下一条。
     * 注：检索集需要已经创建（由Tab触发）。
     * @data: Element 输入条
     * @return {void}
     */
    cmdnext( evo ) {
        let el = evo.data,
            _i = el.selectionStart,
            _v = this.cmdNavTemp && this.cmdNavTemp.next();

        _v && $.val( el, _v ).setSelectionRange( _i, _v.length );
    },

    __cmdnext: 1,


    /**
     * 命令行历史：
     * 向下箭头键滚动历史记录的前一条。
     * 注：同上。
     * @data: Element 输入条
     * @return {void}
     */
    cmdprev( evo ) {
        let el = evo.data,
            _i = el.selectionStart,
            _v = this.cmdNavTemp && this.cmdNavTemp.prev();

        _v && $.val( el, _v ).setSelectionRange( _i, _v.length );
    },

    __cmdprev: 1,



    //-- 属性成员 ------------------------------------------------------------


    //
    // 命令历史匹配集导航引用。
    //
    cmdNavTemp: null,

};


//
// By: 编辑操作（部分）。
//
processExtend( By, 'Ed', Edit, [
    'click',
    'pathTo',
    'toText',
    'unWrap',
    'setStyle',
    'eraseStyle',
    'brushStyle',
    'clearStyle',
    'attrUpdate',
    'deleteAttr',
    'htmlUpdate',
    'runScript',
    'insResult',
    'propUpdate',
    'cmdRun',
    'pluginsRun',

    // 配合cut处理
    'deletes',
    'paste',
]);


//
// By: 综合工具集。
//
processExtend( By, 'Kit', Kit, [
    'ecancel',
    'puthtml',
    'heading',
    'errmsg',
    'chapter',
    'save',
    'export',
    'export2',
    'nicehtml',
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
    'table',
    'codelang',
    'checkhtml',
    'attrlist',
    'obtline',
    'obtdel',
    'obtswap',
    'cmdlast',
    'cmdnext',
    'cmdprev',
]);


//
// On 杂项取值。
// 注意：名称不应当覆盖上层基础集。
//
customGetter( On, null, Kit, [
    'sels',
    'esize',
    'sel0',
    'efocus',
    'elemSelf',
    'tobj',
    'trbox',
    'tsecbox',
    'codebox',
    'attrns',
    'obtname',
    'obtsplit',
    'obtval',
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
    'codels',
    'codeblo',
    'image3',
    'mediasubs',
    'picsubs',
    'cbstate',
    'styVal',
    'unitVal',
    'styName',
    'styKey',
    'cleanHTML',
    'mdline',
    'savedhtml',

    // 简单操作类（非取值）。
    'cmdclear',
]);


// 工具导出
//////////////////////////////////////////////////////////////////////////////

export { resetState, topInsert };


// debug:
window.ESet = __ESet;
window.History = __History;
