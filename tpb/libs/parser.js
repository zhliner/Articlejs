//! $Id: parser.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT 解析器。
//
//
///////////////////////////////////////////////////////////////////////////////
//

// import { On, By, To } from "./pbs.js";

const
    // OBT默认属性名
    __obts = {
        on: 'on', 		// 触发事件和PB行为
        by: 'by', 		// 板块调用（传送器）
        to: 'to', 		// To输出目标
    },

    // 标识字符
    __chrDlmt = ';',  	// 并列分组
    __chrCall = ',', 	// 调用单元分隔
    __chrZero = '-',  	// 空白占位符

    // On事件定义模式。
    // 支持委托选择器，可前置 [.-] 标识字符。
    // 事件名支持字母、数字和 [._-] 字符。
    // 注：支持参数段内换行。
    __onEvent = /^[.-]?([\w.-]+)(?:\(([^]*)\))?$/,

    // 调用模式匹配。
    // 方法名支持字母、数字和 [._-] 字符。
    // 参数段支持任意字符（包括换行），可选。
    __obtCall = /^([\w][\w.-]*)(?:\(([^]*)\))?$/,

    // 简单词组
    // 如空格分隔的多个事件名序列（可简单$.on绑定）。
    // 友好：支持句点字符。
    __reWords   = /^[\w][\w\s.]*$/;



class On {
    constructor() {
        //
    }
}


class By {
    //
}


class To {
    //
}


//
// On事件名定义。
// 针对单个事件的定义，由外部分解提取。
//
class Evn {
    /**
     * 解析格式化事件名。
     * - 前置句点（.）表示绑定单次执行。
     * - 前置短横线（-）表示延迟绑定事件处理器。
     * - 支持括号内指定委托选择器。
     * @param {String} name 格式化名称
     */
    constructor( name ) {
        let _vs = name.match(__onEvent);
        if ( !_vs ) {
            throw new Error('on-attr config is invalid.');
        }
        this.name     = _vs[1];
        this.selector = _vs[2] || null;
        this.one      = name[0] == '.';
        this.delay    = name[0] == '-';
    }
}


//
// 调用定义。
// 模板中指令/方法调用的配置存储。
//
class Call {
    /**
     * call支持句点引用子集成员。
     * 如：x.math.abs()
     * @param {String} call 调用格式串
     */
    constructor( call ) {
        let _vs = call.match(__obtCall);
        if ( !_vs ) {
            throw new Error('call-attr config is invalid.');
        }
        this.args = args;
        this.oper = name.split('.');
    }


    /**
     * 应用到目标方法集。
     * 如果指令属于一个子集（.引用），方法会绑定this到该子集。
     * @param {Object} pbs PB指令集
     */
    apply( pbs ) {
        let _host = this._host( this.oper.slice(0, -1), pbs ),
            _meth = this.oper[ this.oper.length - 1 ];

        // 更新为函数。
        this.oper = _host == null ? pbs[_meth] : _host[_meth].bind(_host);
    }


    /**
     * 提取指令集成员。
     * 是提取末端方法的上级宿主对象，而非最终方法本身。
     * 返回null表示方法为顶层成员。
     * @param  {[String]} names 引用链
     * @param  {Object} pbs 指令集
     * @return {Object|null}
     */
    _host( names, pbs ) {
        return names.length ? names.reduce( (o, k) => o[k], pbs ) : null;
    }
}


//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////




const _Parser = {
    /**
     * OBT一起解析。
     * 返回值：{
     *  	on: [{evs, pbs}]
     *  	by: [Sender]
     *  	to: [{updater, pbs}]
     * }
     * @param  {String} on On配置值
     * @param  {String} by By配置值
     * @param  {String} to To配置值
     * @return {Object}
     */
    all( on, by, to ) {
        return {
            on: this.on(on),
            by: this.by(by) || [],
            to: this.to(to) || [],
        };
    },


    /**
     * on="
     *  	Ev;  // 单纯事件，分号分组
     *  	Ev|pb, pbs()...;  // PB行为链（1个或多个）
     *  	Ev Ev...|pb, pbs()...;   // 多个普通事件
     *  	Ev Ev()...|pb, pb()...;  // 普通事件与委托事件混合
     * "
     * 返回值：[{
     *  	evs: [ names, { name, args }, name... ],
     *  	pbs: [ Caller ]
     * }...]
     * @param  {String} fmt 配置格式串
     * @return {Array}
     */
    on( fmt ) {
        let _buf = [];

        for ( let ss of DlmtSpliter.split(fmt) ) {
            let _pair = Util.rePair(ss, __rePipe);
            _buf.push({
                evs: this._onEvs(_pair[0].trim()),
                pbs: this._pbCalls(_pair[1].trim())
            });
        }
        return _buf;
    },


    /**
     * tpb-by="
     *  	Plate.call();  // Plate板块里的call方法
     *  	Plate.Sub.call;  // 支持多级引用，无参数可省略括号
     * "
     * @param  {String} fmt 配置格式串
     * @return {[Sender]}
     */
    by( fmt ) {
        if (!fmt) return;

        return [...DlmtSpliter.split( fmt, s => s.trim() )]
            .map(
                ss => ss == __chrZero ? null : this._sender(ss)
            );
    },


    /**
     * tpb-to="
     *  	rid|where;
     *  	rid|where|pbs...;
     * "
     * 返回值：[{
     *  	updater: {Updater},
     *  	pbs: [Caller]|null
     * }...]
     * @param  {String} fmt 格式串
     * @return {Array} 更新器实例&PBs序列的数组
     */
    to( fmt ) {
        if (!fmt) return;
        let _buf = [];

        for ( let ss of DlmtSpliter.split( fmt, s => s.trim() ) ) {
            if (!ss) continue;
            let [updater, _pbs] = this._updater(ss);

            _buf.push({
                updater,
                pbs: this._pbCalls(_pbs.trim()),
            });
        }
        return _buf;
    },


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 解析On中的事件名序列。
     * - 委托被解析为一个对象 {name, args}；
     * - 事件名支持前置短横线-（预定义）；
     * 格式：{
     *  	evn evn evn('slr')
     *  	evn -evn -evn(..)
     * }
     * @param  {String} fmt 事件定义串
     * @return {Array} 结果数组
     */
    _onEvs( fmt ) {
        if (!fmt) return null;

        if (__reWords.test(fmt)) {
            return [fmt];
        }
        fmt = fmt.replace(/\s+/g, ' ');

        return [...EvnSpliter.split(fmt, s => s.trim())]
            .map(
                ss => Util.funcArgs(ss)
            );
    },


    /**
     * 解析调用序列。
     * - PB调用链中的定义：pb, pb(...), ev.point...
     * @param  {String} fmt 调用定义串
     * @return {[Caller]} 调用器数组
     */
    _pbCalls( fmt ) {
        if (!fmt) return null;

        let _buf = [];

        for ( let it of CallSpliter.split(fmt) ) {
            let _cal = this._caller(it.trim());
            if (_cal) _buf.push(_cal);
        }
        return _buf.length && _buf;
    },


    /**
     * 解析调用串。
     * @param  {String} fmt 调用串
     * @return {Caller} 调用器实例
     */
    _caller( fmt ) {
        let {name, args} = Util.funcArgs(fmt);
        if (!name) return null;

        return new Caller(name, args);
    },


    /**
     * 解析板块调用。
     * @param  {String} fmt 调用串
     * @return {Sender} 发送器实例
     */
    _sender( fmt ) {
        let {name, args} = Util.funcArgs(fmt);
        if (!name) return null;

        let _list = name.split('.');

        return new Sender(_list.pop(), args, _list);
    },


    /**
     * 解析更新调用。
     * @param  {String} fmt 更新配置串
     * @return {[Updater, pbs]} 更新器和后续PB序列
     */
    _updater( fmt ) {
        if (!fmt) return null;

        let _lst = fmt.split(__rePipe),
            [_slr, _all] = this._toRids(_lst[0]);

        // 首尾引号
        if (__reString.test(_slr)) {
            _slr = _slr.slice(1, -1).trim();
        }
        return [
            new Updater(_slr, _lst[1] || '', _all),
            _lst[2] || '',
        ];
    },


    /**
     * 解析提取To的rid定义。
     * - 格式串包含rid字符串和可能有的true参数；
     *   （如：'form@ b', true）
     * @param  {String} fmt 格式串
     * @return {[String, Boolean]}
     */
    _toRids( fmt ) {
        // jshint unused:false
        let [_, rid, all] = fmt.trim().match(__reTorid);

        return [ rid.trim(), !!all ];
    },

};
