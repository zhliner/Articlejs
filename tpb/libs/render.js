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
//  模板中若无判断（if...）和循环（for/each）逻辑，节点可“原地更新”。
//
//////////////////////////////////////////////////////////////////////////////
//


// 渲染属性名定义。
const
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


// 分隔标识字符。
const
    __chrDlmt	= ';',  	// 并列分组
    __chrRange 	= ',',  	// 范围定义
    __chrPipe 	= '|';  	// 进阶处理（输出过滤）


const
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
    // 渲染配置存储
    // 仅用于源模板节点。
    // { Element: Blinder }
    Blindes = new WeakMap(),

    // 结构语法处理序列（优先级）
    Queue = [
        __Each,
        __With,
        __Var,
        __Else,
        __Elif,
        __If,
        __For,
        __Case,
        __Default,
        __Switch,
    ],

    // 结构语法处理器名
    Opers = {
        [__Each]:       'Each',
        [__With]:       'With',
        [__Var]:        'Var',
        [__Else]:       'Else',
        [__Elif]:       'Elseif',
        [__If]:         'If',
        [__For]:        'For',
        [__Switch]:     'Switch',
        [__Case]:       'Case',
        [__Default]:    'Default',
    },


    // 分组切分器。
    // 用于循环配置表达式。
    DlmtSpliter = new Spliter(__chrDlmt),

    // 过滤切分器。
    // 用于属性赋值中的过滤序列。
    // 调用/数组内不切分。
    PipeSpliter = new Spliter(__chrPipe, true, true);



//
// 渲染配置解析器。
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
// 文法执行器。
// - 因大多数与JS关键字同名，故首字母大写；
// - 表达式为原生JS语法，支持任意JS表达式（因此十分强大）；
// - 部分影响Html格式的操作符用“操作词”替换；
// 注：
// - If/Elseif返回null，表示判断为假；
// - Each克隆后需要移除参考源，也返回null；
// 操作词：{
//  	< 	-> LT 	小于比较
//  	<= 	-> LE 	小于等于比较
//  	> 	-> GT 	大于比较
//  	>= 	-> GE 	大于等于比较
// }
// 执行器参数：
// @param  {Element} el 目标元素（部分未用，占位）
// @param  {Object} data 当前域数据
// @param  {String} expr 属性值
// @return {Object|null} 当前域数据或null
//
class Grammar {
    /**
     * 构造执行器。
     * - 循环结构会创建新元素，故需store；
     * - scoper为打包入栈数据的域执行器；
     * - 循环结构会创建新元素，故需buf引用；
     * @param {Scoper} scoper 净域实例
     * @param {WeakMap} buf 渲染映射存储 {Element: Blinder}
     */
    constructor( scoper, buf ) {
        this._scoper = scoper;
        this._buf = buf;
        this._Expror = new Expr(scoper);
    }


    /**
     * 定义当前数据域。
     * 格式：{
     *  	tpl-with="member"
     *  	tpl-with="{ xyz: 'new-value', old: member }"
     * }
     * - 支持任意合法的JS表达式，下同；
     * - 如果在循环内，合并即时变量成员；
     * - 循环内父域对象需要向下延续传递；
     */
    With( el, expr, data ) {
        if (!expr) return data;

        let _data = this._exec(expr, data),
            _loop = data[__loopChain];

        if (!_loop) {
            return _data;
        }
        return $.object(_data, _loop, { [__loopChain]: _loop });
    }


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
    }


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
    }


    /**
     * ElseIf 逻辑（同If）。
     * 格式：tpl-elseif="..."
     */
    Elseif( el, expr, data ) {
        return this.If(el, data, expr);
    }


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
    }


    /**
     * 子元素循环。
     * - data/start/end 各部分都为可选（前置分隔符不可省略）；
     * 格式：{
     *  	tpl-for="data[; start, end]"
     *  	tpl-for="data[; start]"
     *  	tpl-for="data[; , end]"
     *  	tpl-for="; start[, end]"
     *  	......
     *  	tpl-for
     * }
     * - data 部分支持任意表达式；
     * - start/end 部分仅支持数值常量；
     */
    For( el, expr, data ) {
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
    }


    /**
     * 当前循环。
     * 格式：{
     *  	tpl-each="links[; start, end]"
     *  	tpl-each="links"
     *  	......
     *  	tpl-each
     * }
     * - 类似For，但针对当前元素克隆循环；
     */
    Each( el, expr, data ) {
        let _cfg = this._loopObj(expr, data);
        if (!_cfg) return data;

        let _buf = [],
            _cnt = 1;

        for ( let i = _cft.start; i < _cfg.end; i++ ) {
            let _dt = this._loopData(_cfg.data[i], i, _cnt++, _cfg.end);
            _buf.push( this._clone(el, _dt, true) );
        }
        $.after(el, _buf);

        // 移除克隆源并停止解析
        return null;
    }


    /**
     * 属性赋值/数据输出。
     * 特例：{
     *  	<p _="...">  // 内容
     *  	<p _>  		 // 域数据本身即为内容
     *  	<p _="|a()">
     * }
     * - 支持多个过滤器的连用，如：text|a()|b()；
     * - 前一个过滤器的结果作为后一个的输入；
     * - 支持空值指定（即当前域数据本身）；
     * 注：
     * - 各个属性赋值之间没有联系，因此无当前域的递进逻辑；
     * - 外部单独批量处理，无需此处的域环境，因此简单返回；
     *
     * @param {String} attr 属性名
     */
    Puts( el, attr, expr, data ) {
        let _vlst = [];

        if (expr) {
            _vlst = [
                ...PipeSpliter.split( expr, s => s.trim() )
            ];
            data = this._exec(_vlst.shift(), data) || data;
        }
        this._setAttr( el, attr, data, _vlst );

        return true;
    }


    /**
     * 当前父域数据。
     * - 父域是比当前域更高一层的抽象，仅在循环中使用；
     *   （私用结构，用户无法定义）
     * - 循环内With的新域定义需要合并即时变量，故此标记存储；
     * - 父元素传递下来的当前域（data）被忽略；
     */
    Scope( el, store/*, data*/ ) {
        return Object.assign(store, { [__loopChain]: store });
    }


    //-- 私有辅助 -----------------------------------------------------------------


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

    }


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
    }


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
    }


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
    }


    /**
     * 解析循环配置对象。
     * 返回值：{
     *  	data:  {Array}
     *  	start: {Number}
     *  	end:   {Number}
     * }
     * @param  {String} expr 表达式
     * @param  {Object|Array} data 当前域数据
     * @return {Object|null}
     */
    _loopObj( expr, data ) {
        let start = 0, end;

        if (!expr) {
            if (!$.isArray(data)) return null;
            end = data.length;
        }
        else {
            let [_d, _n2] = DlmtSpliter.split(expr, s => s.trim());
            if (_d) {
                data = this._exec(_d, data);
            }
            if (!$.isArray(data)) {
                return null;
            }
            [start, end] = this._range(_n2, __chrRange, data.length);
        }
        return { data, start, end };
    }


    /**
     * 创建循环单元域数据。
     * - 创建一个继承data的新对象；
     * - 新对象内声明4个即时变量；
     * @param  {Mixed} data 单元数据
     * @param  {Number} i   数组当前下标
     * @param  {Number} cnt 当前计数
     * @param  {Number} sz  数组大小（实际上是循环最大值）
     * @return {Object} 设置变量后的对象
     */
    _loopData( data, i, cnt, sz) {
        // 原型继承
        return $.object(data, {
            [__loopIndex]: i,
            [__loopCount]: cnt,
            [__loopSize]:  sz,
            [__loopValue]: data,
        });
    }


    /**
     * 解析数值范围。
     * - 返回数组的成员为有效的范围值；
     * - 格式串：start,end （支持单项指定）；
     * - 支持无值默认指定（0,max）；
     * @param  {string} str 待解析串
     * @param  {string} sep 分隔符
     * @param  {number} max 最大有效值
     * @return {array} [min, max]
     */
    _range( str, sep, max ) {
        if (!str) {
            return [0, max];
        }
        let _tmp = Util.pair(str, sep),
            _beg = parseInt(_tmp[0]) || 0,
            _end = parseInt(_tmp[1]) || max;

        return [
            Math.max(0, _beg),
            Math.min(_end, max),
        ];
    }


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
    }


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
    }

}



//
// 表达式执行器。
//
class Expr {
    /**
     * @param {Scoper} scoper 净域实例
     */
    constructor( scoper ) {
        this._scoper = scoper;
    }


    /**
     * 执行表达式。
     * - 立即编译执行表达式（每次都重新编译）；
     * @param  {String} expr 目标表达式
     * @param  {Object} data 当前域数据
     * @return {Mixed} 表达式执行结果
     */
    exec( expr, data ) {
        let _fun = this.build(expr);
        return _fun && _fun(data);
    }


    /**
     * 构建表达式代理函数。
     * - 代理函数接受一个当前域数据参数，可多次执行；
     * - 这是与exec功能相似的一个接口，但结果可复用；
     * @param  {String} expr 目标表达式
     * @return {Function} 执行器
     */
    build( expr ) {
        expr = expr && this._parse(expr, this._worder);
        if (! expr) return null;

        return this._scoper.runner(expr);
    }


    //-- 私有辅助 -----------------------------------------------------------------


    /**
     * 关键词替换（e.g. " LT " => " < "）。
     * @return {string} 结果串
     */
    _worder( str ) {
        return Expr.Words.reduce( (s, kv) => s.replace(kv[0], kv[1]), str );
    }


    /**
     * 解析表达式。
     * - 对普通段的文本传递到回调处理；
     * - 若无需替换则简单返回；
     * @param  {String} expr 目标表达式
     * @param  {Function} handle 处理函数
     * @return {String} 合法表达式
     */
    _parse( expr, handle ) {
        if (!Expr.Repl.test(expr)) {
            return expr;
        }
        let _str = '';
        for ( let s of Expr.Spliter.partSplit(expr) ) {
            // 字符串可由3种字符包围。
            _str += (s[0] == '"' || s[0] == "'" || s[0] == '`') ? s : handle(s);
        }
        return _str;
    }
}


//
// 表达式切分解析器。
// 用于在非字符串内的替换操作（Words）。
//
Expr.Spliter = new Spliter();


//
// 待替换测试式。
//
Expr.Repl = /[@\s]/;


//
// 关键词集。
// 仅含部分影响html格式的比较操作符。
//
Expr.Words = [
    // 运算符别名
    [ /\bLT\b/g,    '<' ],
    [ /\bLTE\b/g,   '<=' ],
    [ /\bGT\b/g,    '>' ],
    [ /\bGTE\b/g,   '>=' ],
];




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
// 不支持原地更新的语法词。
//
const __mustClones =
[
    Opers[__tpbEach],
    Opers[__tpbFor],
    Opers[__tpbIf],
    Opers[__tpbElif],
    Opers[__tpbElse],
];


/**
 * 是否循环或判断渲染。
 * @param  {Blinder} gm 渲染配置实例
 * @return {Boolean}
 */
const loopIfs = gm => gm && __mustClones.some( n => gm.has(n) );


const __Cache = {
    // 可否原地更新状态存储。
    // { Element: Boolean|null }
    situes: new WeakMap(),

    // 克隆节点渲染配置存储。
    // { Element: Blinder|null }
    cloned: new WeakMap(),
};


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



// Expose
///////////////////////////////////////////////////////////////////////////////

T.Render = Render;


})( tQuery.proxyOwner(), Tpb );
