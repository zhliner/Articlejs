//! $Id: render.js 2019.09.17 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  渲染器（Render）
//
//  解析模板中的渲染语法，用数据对节点树进行渲染。
//  解析之后节点中的各个渲染属性已被清除，不影响正常的DOM元素规范。
//
//  渲染语法（10+1）{
//      each                当前迭代
//      with                当前域声明
//      var                 新变量定义
//      if/elseif/else      逻辑判断
//      switch/case/default 分支选择
//      for                 子元素循环
//      _[attr]             属性赋值（系列）
//  }
//  注：
//  模板中若无循环（for/each）逻辑，则元素可以简单地原地更新。
//
//////////////////////////////////////////////////////////////////////////////
//

import { Filter } from "./filter.js";
import { Spliter } from "./spliter";
import { Util } from "./util.js";


const $ = window.$;

//
// 基本配置/定义。
//
const
    // 渲染属性名。
    __Each      = 'tpb-each',       // 元素自身循环
    __With      = 'tpb-with',       // 创建新域
    __Var       = 'tpb-var',        // 新建变量/赋值
    __If        = 'tpb-if',         // if （当前元素，下同）
    __Elseif    = 'tpb-elseif',     // else if
    __Else      = 'tpb-else',       // else
    __Switch    = 'tpb-switch',     // switch （子元素分支）
    __Case      = 'tpb-case',       // switch/case
    __Default   = 'tpb-default',    // switch/default
    __For       = 'tpb-for';        // 子元素循环


const
    // 进阶处理（输出过滤）
    __chrPipe   = '|',

    // 循环内临时变量名
    __loopIndex = '_I_',   // 当前条目下标（从0开始）
    __loopCount = '_C_',   // 当前循环计数（从1开始）
    __loopSize  = '_S_',   // 循环集大小

    // 当前域数据存储键。
    // 用于循环中在元素上存储当前域数据。
    // 注：调用者取当前域先从元素上检索。
    __scopeData = Symbol('scope-data'),


    // 属性赋值处理器名
    // 注：最后单独处理。
    __attrPuts = 'Puts',

    // 循环父域文法词
    // 仅在循环内私用
    __loopScope = 'Scope',

    // 循环内父域链
    // 用于各层子级元素的父域传递
    __loopChain = '$$_SCOPE_$$',

    // 合法变量名
    __reVarname = /^[a-zA-Z_$][\w$]*$/,


    // 渲染配置标记属性。
    // 用于快速检索有渲染配置的源模板节点。
    // 注：DOM中该属性会被清除，因此冲突时原名称会失效。
    __rndAttr = 'tpb_render20170206-' + $.now(),

    // 渲染配置元素选择器
    __slrBlind = `[${__rndAttr}]`;


const
    // 文法处理序列（含优先级）
    Queue = [
        __Each,
        __With,
        __Var,
        __Else,
        __Elseif,
        __If,
        __Case,
        __Default,
        __Switch,   // 子元素Case测试
        __For,      // 子元素循环
    ],

    // 文法处理器名
    Opers = {
        [__Each]:       'Each',
        [__With]:       'With',
        [__Var]:        'Var',
        [__Else]:       'Else',
        [__Elseif]:     'Elseif',
        [__If]:         'If',
        [__For]:        'For',
        [__Switch]:     'Switch',
        [__Case]:       'Case',
        [__Default]:    'Default',
    },


    // 节点渲染映射集（模板）
    // 模板根元素对应其所包含的存在渲染配置的子元素集。
    // Object2 {
    //      elem: Element       // 渲染子元素
    //      tree: [             // DOM树位置索引（相对于模板根）
    //          index: Nunber   // 平级序位（兄弟）
    //          deep:  Number   // 纵深层级（父子）
    //      ]
    // }
    // 用法：如果 UpdateMap 中不存在，则查询此集合（含克隆逻辑）。
    //
    // { Root: [Object2] }
    OriginMap = new WeakMap(),


    // 节点更新映射集（页面）
    // 被首先查询的渲染配置，含原地更新逻辑。
    // Object3 {
    //      elem: Element       // 渲染子元素
    //      tree: [             // DOM树位置索引（相对于渲染根）
    //          0:index:Nunber  // 平级序位（兄弟）
    //          1:deep:Number   // 纵深层级（父子）
    //      ]
    //      refer: [            // 插入参考（恢复）
    //          0:box:Element   // 位置参考容器
    //          1:next:Node     // 位置参考兄弟节点
    //      ]
    // }
    // 注：外部先查询此集合，如果不存在则查询 OriginMap。
    // { Root: [Object3] }
    UpdateMap = new WeakMap(),

    // 元素文法存储。
    // 包含原始模板中和页面中采用渲染处理的元素。
    // Object {
    //      [grammar]: [...]    // [文法词]: [参数序列]
    // }
    // 参数序列通常包含：
    // - handle: Function 表达式执行器
    // - ...: Value 文法特定的其它参数
    // 参数序列应该可以直接解构传入文法操作函数（从第二个实参开始）。
    //
    // { Element: Object }
    Grammars = new WeakMap(),

    EachGrammars = new WeakMap(),

    LoopGrammars = new WeakMap(),


    // 简单切分器。
    SSpliter = new Spliter();



//
// 渲染配置解析。
//
const Parser = {
    /**
     * 解析节点树渲染配置。
     * - 解析创建渲染器并存储在store集合中；
     * 注：通过元素属性值解析的为源模板。
     * @param  {Element} root 根容器元素
     * @return {Array|0} 需要渲染的元素集
     */
    all( root ) {
        let _buf = [];

        for ( let el of $.find(root, '*', true) ) {
            let _obj = this.one(el);
            if (_obj) {
                _buf.push(el);
                Blindes.set(el, _obj);
            }
        }
        return _buf.length && _buf;
    },


    /**
     * 解析单个元素的渲染配置。
     * @param  {Element} el 目标元素
     * @param  {Array} qu  文法词属性名队列
     * @return {Blinder} 渲染器实例
     */
    one( el ) {
        let _buf = new Blinder();

        for ( let n of Queue ) {
            if (el.hasAttribute(n)) {
                // 空白/换行清理
                _buf.set( Opers[n], el.getAttribute(n).trim().replace(/\s+/g, ' ') );
                el.removeAttribute(n);
            }
        }
        let _puts = this._puts(el);
        if (_puts) {
            _buf.set(__attrPuts, _puts);
        }

        return _buf.size && this._token(el) && _buf;
    },


    /**
     * 渲染配置克隆。
     * - 克隆的元素引用同一个渲染配置；
     * - 如果源树中没有渲染配置，返回null；
     * @param  {Element} src 源元素
     * @param  {Element} des 新元素（src的全克隆）
     * @param  {WeakMap} buf 外部渲染存储
     * @return {WeakMap|null} 渲染映射{Element: Blinder}
     */
    clone( src, des, buf = new WeakMap() ) {
        src = $.find(src, __slrBlind, true);
        if (!src.length) {
            return null;
        }
        des = $.find(des, __slrBlind, true);

        for (var i = 0; i < des.length; i++) {
            this._token(des[i], 'clean');
            buf.set(des[i], Blindes.get(src[i]));
        }
        return buf;
    },


    //-- 私有辅助 -----------------------------------------------------------------

    /**
     * 解析赋值属性（Puts）。
     * - 需要渲染的属性名会前置一个下划线；
     * - 值格式支持普通文本与变量混合书写；
     * - 变量名前置$字符；
     * 注记：变量替换为模板字符串形式执行。
     * @param  {Element} el 目标元素
     * @return {Map} { name: val }
     */
    _puts( el ) {
        let _buf = new Map();

        for ( let at of Array.from(el.attributes) ) {
            if (at.name[0] == '_') {
                _buf.set(at.name.substring(1), at.value);
                el.removeAttribute(at.name);
            }
        }
        return _buf.size && _buf;
    },


    /**
     * 节点标记。
     * - 设置时返回真，清除时返回假；
     * @param  {Element} el 渲染元素
     * @param  {Boolean} clean 清除标记
     * @return {Boolean} 标记状态
     */
    _token( el, clean ) {
        if (clean) {
            return el.removeAttribute(__rndAttr), false;
        }
        return el.setAttribute(__rndAttr, ''), true;
    },

};



//
// 渲染配置（文法影射）。
// 仅针对当前单个元素，不含子元素。
// 文法词有序队列：{
//  	[grammarName]:  expr（配置表达式）
//  	'Puts':         Map{ attr: expr }
// }
// 注记：
// 没有采用简单对象存储和原型链继承共享，
// 一是概念清晰，二是文法的处理是有序的。
//
class Blinder extends Map {
    /**
     * 应用文法集渲染。
     * - 依文法配置队列，渲染目标元素；
     * - 返回false表示舍弃当前元素；
     * 注：
     * - If/Elseif为假和Each源会返回null；
     * - Puts为最后的渲染操作；
     * @param  {Grammar} grammar 文法执行器
     * @param  {Element} el 目标元素
     * @param  {Object} data 当前域数据
     * @return {Object|false} 应用后的当前域
     */
    apply( grammar, el, data ) {
        for ( let [n, v] of this ) {
            if (n == __attrPuts) {
                return this._puts(el, grammar, v, data);
            }
            data = grammar[n](el, v, data);
            if (!data) return false;
        }
        return data;
    }


    //-- 私有辅助 -----------------------------------------------------------------


    /**
     * 输出数据渲染。
     * @param  {Element} el 目标元素
     * @param  {Grammar} gram 文法执行器
     * @param  {Object} data  当前域数据
     * @param  {Map} attrs 输出属性配置集
     * @return {Object} 原当前域
     */
    _puts( el, gram, attrs, data ) {
        for ( let [name, expr] of attrs ) {
            // name为正常名称
            gram.Puts(el, name, expr, data);
        }
        return data;
    }

}



//
// 渲染文法。
// 按文法固有的逻辑更新目标元素（集）。
// 注：尽量采用原地更新（包括each/for结构）。
// @data {Object} 当前域数据
// @return {void}
//
const Grammar = {
    /**
     * 自迭代循环。
     * 用数据集更新原始集，并按数据集大小删除或增长原始集。
     * 增长元素集时会存储新元素的渲染配置（无Each）。
     * 会存储当前域数据到每一个元素的 [__scopeData] 属性上。
     * @param {Element} el 起始元素
     * @param {Number} size 原始集大小
     * @param {Object} data 当前域数据
     */
    Each( el, size, handle, data ) {
        data = handle(data);
        if ( !$.isArray(data) ) {
            throw new Error(`the scope data is not Array.`);
        }
        let _els = $.nextUntil( el, (_, i) => i == size ),
            _sz = size - data.length;

        this._eachAlign(_els, _sz).forEach(
            // 设置当前域对象。
            (el, i) => el[__scopeData] = loopCell(data[i], i, data)
        );
    },


    /**
     * 创建新的当前域。
     * 应用数据可能是简单的基本类型。
     * @param {Element} el 当前元素
     * @param {Object} data 应用数据
     */
    With( el, data ) {
        if ( typeof data != 'object' ) {
            data = Object(data);
        }
        el[__scopeData] = Object.assign( data, {$: el[__scopeData]} );
    },


    /**
     * 新建变量。
     * 格式：{
     *  	tpl-var="var1='expr1'; var2='expr2'"
     * }
     * - 分号隔离多个变量声明，表达式任意；
     * - 变量会合并存储在当前域中，注意重名覆盖；
     * 注：
     * - 表达式内的字符串可用模板字符串表达（`...`）；
     *
     * 注记：
     * 可能修改为仅支持变量的解构赋值（数组和对象），缩短引用。
     * 因为其它表达式都可以直接使用JS字符串模板组合内容。
     */
    Var( el, expr, data ) {
        if (! expr) return data;

        for ( let its of DlmtSpliter.split(expr, s => s.trim()) ) {
            let [vn, val] = Util.pair(its, __chrVars);

            if (__reVarname.test(vn)) {
                // 去除引号
                data[vn] = this._exec(val.slice(1, -1), data);
            }
        }
        return data;
    },


    /**
     * If 逻辑。
     * 格式：{
     *  	tpl-if="age LE 18" 	// LE 小于比较
     *  	tpl-if="pass" 		// 简单值
     * }
     * - 针对元素自身的存在性；
     * - 如果为真，会向后查找 Elseif/Else 并删除其元素；
     * - 空属性值视为条件判断为假，返回由外部处理；
     *   注：牵涉的 Elseif/Else 逻辑需外部处理。
     */
    If( el, expr, data ) {
        if (! this._exec(expr, data)) {
            return null;
        }
        this._elseDrop( $.next(el) );

        return data;
    },


    /**
     * ElseIf 逻辑（同If）。
     * 格式：tpl-elseif="..."
     */
    Elseif( el, expr, data ) {
        return this.If(el, data, expr);
    },


    /**
     * Else 逻辑。
     * 格式：{
     *  	tpl-else
     *  	tpl-else="with-data"
     * }
     * - 可以像With一样设置一个域表达式；
     * - 仅影响后续for文法词当前域；
     */
    Else( el, expr, data ) {
        return this.With(el, expr, data);
    },


    /**
     * 子元素循环。
     * @param {Element} el for容器元素
     * @param {Object} data 迭代数据集
     * @param {Number} count 循环的子元素数量
     */
    For( el, data, count ) {
        // ?
        let _cfg = this._loopObj(expr, data);
        if (!_cfg) return data;

        let _buf = [],
            _els = $.children(el),
            _cnt = 1;

        for (let i = _cfg.start; i < _cfg.end; i++) {
            // 当前域数据构造
            let _dt = this._loopData(_cfg.data[i], i, _cnt++, _cfg.end);
            for ( let _el of _els ) {
                _buf.push( this._clone(_el, _dt) );
            }
        }
        $.empty(el).append(el, _buf);

        // 返回原当前域
        // 表达式内data成员已对子元素设置父域。
        return data;
    },




    /**
     * 属性（特性）赋值。
     * 支持两个特殊属性名：text, html。
     * 多个属性名之间空格分隔，与 handles 成员一一对应。
     * @param {String} name 属性名（序列）
     * @param {[Function]} handles 处理器（集）
     * @param {Object} data 当前域数据
     */
    Assign( el, name, handles, data ) {
        $.attr(
            el,
            name,
            handles.map( f => f(data) )
        );
    },


    /**
     * 当前父域数据。
     * - 父域是比当前域更高一层的抽象，仅在循环中使用；
     *   （私用结构，用户无法定义）
     * - 循环内With的新域定义需要合并即时变量，故此标记存储；
     * - 父元素传递下来的当前域（data）被忽略；
     */
    Scope( el, store/*, data*/ ) {
        return Object.assign(store, { [__loopChain]: store });
    },


    //-- 私有辅助 -----------------------------------------------------------------

    /**
     * Each克隆新元素。
     * 会存储新元素的渲染配置，并插入参考元素之后。
     * @param  {Element} ref 参考元素（克隆源）
     * @param  {Number} size 迭代数据集
     * @return {[Element]} 新元素集
     */
    _eachClone( ref, size ) {
        let _els = [],
            _i = 1;

        for (let i=0; i<size; i++) {
            _els.push(
                // 克隆元素不再有Each文法。
                // 注：在克隆模板元素时需要移除。
                cloneGrammar( $.clone(ref, true, true, true), ref, 'Each' )
            );
        }
        return $.after( ref, _els );
    },


    _eachAlign( els, size ) {
        if ( size > 0 ) {
            // 移除超出部分。
            els.splice(-size).forEach( e => $.remove(e) );
        } else {
            // 补齐不足部分。
            els.push( ...this._eachClone(els[els.length-1], -size) );
        }
        return els;
    },


    /**
     * 表达式执行。
     * - 如果为变量的简单引用，则简单执行；
     * - 否则调用表达式类（Expr）解析执行；
     * @param  {String} expr 表达式
     * @param  {Object} data 当前域数据
     * @return {Mixed|null} 执行结果
     */
    _exec( expr, data ) {
        if (!expr) return null;

        if (__reVarname.test(expr)) {
            // 简单情形
            return this._scoper.get(expr, data);
        }
        return this._Expror.exec(expr, data);

    },


    /**
     * 清除同级匹配elseif和else元素。
     * - 会跳过if/else的正常嵌套匹配；
     * @param {Element} el 起始元素
     */
    _elseDrop( el ) {
        let _deep = 1;

        while (el) {
            if (el.hasAttribute(__tpbIf)) {
                ++_deep;
            }
            if (el.hasAttribute(__tpbElse)) {
                --_deep;
                if (!_deep) {
                    $.remove(el);
                    break;
                }
            }
            if (el.hasAttribute(__tpbElif) && _deep == 1) {
                $.remove(el);
            }
            el = $.next(el);
        }
    },


    /**
     * 克隆元素。
     * - 克隆元素及其可能有的渲染配置；
     * - 如果是Each克隆，清除新元素的Each配置；
     * - 但凡含有渲染配置，设置新元素的父域（Scope）；
     * - 元素为深度克隆且包含事件；
     * 注记：
     * - Each清理仅对根元素，其内部的Each逻辑依然有效；
     *
     * @param  {Element} src 源元素
     * @param  {Array} data  当前域数据
     * @param  {Boolean} each 是否Each操作
     * @return {Element} 克隆的新元素
     */
    _clone( src, data, each ) {
        let _new = $.clone(src, true, true),
            _map = Parser.clone(src, _new, this._buf);

        // 全无渲染配置
        if (!_map) return _new;
        let _gm = this._newScope(_new, data, _map);

        if (each) {
            _gm.delete(Opers[__tpbEach]);
        }
        return _new;
    },


    /**
     * 设置Scope（父域）。
     * - 仅用于循环结构中克隆的新元素；
     * - Scope设置在队列的最前端以获得优先处理；
     * @param {Element} el  目标元素
     * @param {Object} data 当前域数据
     * @param {WeakMap} map 渲染映射存储
     * @return {Blinder} 新的渲染配置对象
     */
    _newScope( el, data, map ) {
        let _gm = map.get(el) || [],
            _gm2 = new Blinder([ [__loopScope, data], ..._gm ]);

        return map.set(el, _gm2), _gm2;
    },


    /**
     * 过滤器。
     * - data可能是文本，也可以是节点元素；
     * - call为一个函数调用表达式（字符串）；
     * @param  {Mixed} data 待处理数据
     * @param  {String} call 调用表示
     * @return {Mixed} 过滤处理结果
     */
    _filter( data, call ) {
        if ( !call ) {
            return data;
        }
        let _fns = Util.funcArgs(call);

        if ( !_fns ) {
            window.console.error(`[${call}] filter is invalid.`);
            return data;
        }
        return Filter[ _fns[0] ].apply( data, _fns[1] );
    },


    /**
     * 设置元素属性。
     * - 属性名为空值，视为元素内容操作；
     * - 元素内容为fill逻辑，会清除原内容；
     * 注记：
     * - 若用prepend，无法原地更新，临时说明也无法清除；
     * - fill强制用户用单个标签包含内容，结构良好；
     * @param {Element} el  当前元素
     * @param {String} name 属性名
     * @param {Mixed} val   属性值（Element|Array|String|Number...）
     * @param {Array} handles 过滤表达式集
     */
    _setAttr( el, name, val, handles ) {
        if (handles.length) {
            val = handles.reduce( (v, f) => this._filter(v, f), val );
        }
        if (name) {
            return $.attr(el, name, val);
        }
        if (val.nodeType || $.isArray && val[0].nodeType) {
            return $.fill(el, val);
        }
        return $.html(el, val + '');
    },

}



//
// 表达式处理构造。
// 返回一个目标渲染类型的表达式执行函数。
// 函数返回值：{
//      true    元素显示
//      false   元素隐藏（脱离DOM，但有参考点）
//      Value   使用值或新域对象
// }
// 注：
// - 非条件表达式不支持定制比较词（LT/GT 等）。
// - 表达式无return关键词。
// @param  {String} expr 表达式串
// @return {Function}
//
const Expr = {
    /**
     * 取值表达式。
     * 适用：tpb-with, tpb-switch.
     * @return function(data): Value
     */
    value( expr ) {
        return new Function( '$', `return ${expr};` );
    },


    /**
     * 变量创建表达式。
     * 适用：tpb-var.
     * @return function(data): true
     */
    setvar( expr ) {
        return new Function( '$', `return (${expr}, true);` );
    },


    /**
     * 比较表达式。
     * 支持 LT/LTE/GT/GTE 四个命名操作符。
     * 适用：tpb-if/elseif, tpb-case.
     * @return function(data): Boolean
     */
    compare( expr ) {
        return new Function( '$', `return ${this._checkComp(expr)};` );
    },


    /**
     * 循环表达式。
     * 空值返回传入的数据本身。
     * 适用：tpb-each, tpb-for.
     * @return function(data): Array
     */
    loop( expr ) {
        if ( !expr ) {
            return v => v;
        }
        return new Function( '$', `return ${expr};` );
    },


    /**
     * 简单通过。
     * 适用：tpb-else, tpb-default.
     */
    pass() {
        return () => true;
    },


    /**
     * 属性赋值。
     * 支持可能有的过滤器序列，如：...|a()|b()，a()的结果作为b()的输入。
     * 适用：_[name].
     * @return function(data): Value
     */
    assign( expr ) {
        let _ss = SSpliter.split(expr, __chrPipe),
            _fn = new Function( '$', `return ${_ss.shift()};` );

        if ( _ss.length == 0 ) {
            return _fn;
        }
        let _fxs = _ss.map( filterHandle );

        return data => _fxs.reduce( (d, fx) => fx.func.bind(d)(...fx.args), _fn(data) );
    },


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 解析构造过滤器序列。
     * Object {
     *      func: String    // 过滤器名
     *      args: [Value]   // 过滤器实参序列
     * }
     * @param  {[String]} calls 调用表达式数组
     * @return {[Object]}
     */
    _filters( calls ) {
        return calls.map( call => Util.funcArgs( call.trim() ) );
    },


    /**
     * 预处理比较表达式。
     * 对普通段的文本执行可能需要的比较词替换。
     * @param  {String} expr 目标表达式
     * @return {String} 合法的表达式
     */
    _checkComp( expr ) {
        return [...SSpliter.partSplit(expr)]
            // 处理奇数单元
            .map( (s, i) => i%2 ? s : this._validComp(s) )
            .join('');
    },


    /**
     * 比较词替换。
     * 如：" LT " => " < " 等。
     * @param  {String} 源串
     * @return {String} 结果串
     */
    _validComp( str ) {
        if ( !this.hasComp.test(str) ) {
            return str;
        }
        return this.compWords.reduce( (s, kv) => s.replace(kv[0], kv[1]), str );
    },


    //
    // 比较操作词（替换映射）。
    //
    compWords: [
        [ /\bLT\b/g,    '<' ],
        [ /\bLTE\b/g,   '<=' ],
        [ /\bGT\b/g,    '>' ],
        [ /\bGTE\b/g,   '>=' ],
    ],


    //
    // 包含比较词测试。
    //
    hasComp: /\b(?:LT|LTE|GT|GTE)\b/i,

};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取过滤器句柄。
 * Object {
 *      func: Function
 *      args: [Value]|''
 * }
 * @param  {String} call 调用表达式
 * @return {Object} 过滤器对象
 */
function filterHandle( call ) {
    let _fn2 = Util.funcArgs( call.trim() ),
        _fun = Filter[_fn2.name];

    if ( !_fun ) {
        throw new Error(`not found ${_fn2.name} filter-method.`);
    }
    return { func: _fun, args: _fn2.args };
}


/**
 * 返回目标元素的参考节点。
 * 用于比较文法中假植隐藏（移出）元素的可能恢复（原地更新）。
 * 恢复：box.insertBefore(el, next);
 * @param  {Element} el 目标元素
 * @return {box:Element, next:Node}
 */
function referenceNodes( el ) {
    let _box = el.parentNode,
        // 忽略可能被清理的注释节点
        _nds = $.contents( _box ),
        _pos = _nds.indexOf( el );

    return { box: _box, next: _pos >= 0 && _nds[_pos+1] || null };
}


/**
 * 文法克隆&存储。
 * 如果源元素上不存在文法定义，抛出错误。
 * 用于循环中新建元素的文法存储。
 *
 * @param  {Element} to 目标元素
 * @param  {Element} src 源元素
 * @param  {String} ignore 忽略的文法
 * @return {Element} 目标元素
 */
function cloneGrammar( to, src, ignore ) {
    let _gram = Grammars.get(src);
    if ( !_gram ) {
        throw new Error(`${src} is not in Grammar buffer.`);
    }
    if ( ignore ) {
        delete _gram[ignore];
    }
    Grammars.set( to, _gram );
    return to;
}


/**
 * 构造循环单元当前域对象。
 * 简单的基本类型需要转换为Object，否则无法添加属性。
 * 设置3个即时成员变量和父域链$。
 * @param  {Object} data 单元数据
 * @param  {Number} i    当前下标（>= 0）
 * @param  {Object} supObj 父域对象
 * @return {Object} 设置后的数据对象
 */
function loopCell( data, i, supObj ) {
    if ( typeof data != 'object' ) {
        data = Object(data);
    }
    return Object.assign(
        data,
        {
            [__loopIndex]: i,
            [__loopCount]: i + 1,
            [__loopSize]: supObj.length,
            $: supObj,
        }
    );
}


/**
 * 渲染节点树。
 * - scoper为打包入栈数据的域执行器；
 * @param  {Grammar} grammar 文法执行器
 * @param  {Element} el 目标元素
 * @param  {WeakMap} map 渲染映射存储{Element: Blinder}
 * @param  {Object} _data 当前域数据
 * @return {Element} 渲染后的节点根
 */
function renders( grammar, el, map, _data ) {
    let _gmit = map.get(el),
        _subs = el.children;

    if (_gmit) {
        _data = _gmit.apply(grammar, el, _data);
    }
    if (_data === false) {
        return $.remove(el), null;
    }
    // 使用children的动态集
    // 因Each会在平级克隆添加元素。
    for ( let i = 0; i < _subs.length; i++ ) {
        renders(grammar, _subs[i], map, _data);
    }
    return el;
}


//
// 渲染器。
// @param {Element} root 根元素
// @param {Object} data  入栈数据
//
const Render = {
    /**
     * 渲染配置解析。
     * - 状态缓存，不会重新再次解析；
     * - 返回值中也包含对root本身的匹配；
     * - 无渲染配置时返回null；
     * @param  {Element} root 模板节点
     * @return {Boolean} 可否原地更新
     */
    parse( root ) {
        let _map = __Cache.situes;

        if (!_map.has(root)) {
            let _els = Parser.all(root);
            _map.set(
                root,
                _els ? !_els.some( e => loopIfs(Blindes.get(e)) ) : null
            );
        }
        return _map.get(root);

    },


    /**
     * 渲染配置克隆。
     * - tpl应当已经解析过（parse）；
     * - des必须是tpl的克隆版，内部结构一致；
     * - 克隆的配置内部存储，外部链式调用即可；
     * @param  {Element} tpl 源模板节点
     * @param  {Element} des 克隆的节点
     * @return {this} Render自身
     */
    clone( tpl, des ) {
        let _map = __Cache.cloned;

        if (_map.has(des) || Parser.clone(tpl, des, _map)) {
            return this;
        }
        return _map.set(des, null), this;
    },


    /**
     * 节点树渲染
     * - 通常用于模板节点的完整克隆树；
     * - 也适用于局部子树，但注意入栈数据的匹配；
     * 注：仅适用于克隆后的元素集。
     * @param  {Element} el 目标节点
     * @param  {Object|...} data 渲染数据（入栈数据）
     * @return {Element} el（渲染后）
     */
    show( el, data ) {
        let _map = __Cache.cloned,
            _gramer = new Grammar(
                new T.Kits.Scoper( data, T.Config.DATA ),
                _map
            );
        // 可能直接输出data
        return renders( _gramer, el, _map, data );
    },


    /**
     * 查询可否原地更新。
     * - 针对目标节点树整体查询检测；
     * - 无渲染配置的元素视为可原地更新；
     * 注：会缓存查询结果。
     * @param  {Element} root 目标节点树根
     * @return {Boolean}
     */
    insitu( root ) {
        let _map = __Cache.situes;

        if (!_map.has(root)) {
            _map.set(
                root,
                !$.find(root, '*', true)
                .some( el =>loopIfs( __Cache.cloned.get(el) ) )
            );
        }
        return _map.get(root);
    },

};



//
// 导出
///////////////////////////////////////////////////////////////////////////////

/**
 * 用源数据更新节点树。
 * 仅适用页面中既有渲染元素的原地更新。
 * 返回false表示未检索到渲染配置，外部可以尝试render()。
 * @param  {Element} root 渲染根（模板副本根）
 * @param  {Object} data 数据源对象
 * @return {Element|false} root
 */
function update( root, data ) {
    //
}


/**
 * 创建新的节点树（待渲染）。
 * 克隆并检索模板元素上的渲染配置，存储副本备用（原地更新）。
 * 用于初始插入时的创建。
 * 注：之后需要调用update执行渲染。
 * @param  {Element} tpl 模板根
 * @return {Element} 待渲染的模板副本
 */
function create( tpl ) {
    let _map = OriginMap.get(tpl);

    if ( !_map ) {
        // 模板初始解析并存储
    }
    //
}


export const Render = { create, update };
