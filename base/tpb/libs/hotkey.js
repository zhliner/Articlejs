//! $Id: hotkey.js 2020.04.06 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键映射配置与处理。
//
//  此处的配置为默认值，外部用户可以定制修改。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$,

    __reSpace = /\s+/;


export class HotKey {

    constructor() {
        //
        // key: evn-keys 快捷键序列
        // val: {
        //      commands: [command],
        //      when:     {Selector} 匹配选择器，可选
        //      not:      {Selector} 不匹配选择器（!$.is(...)），可选
        // }
        // 注：when和not是And的关系，组合使用可获得精确的限定。
        //
        this._map = new Map();
    }


    /**
     * 配置初始化。
     * 注：无需在节点解析之前调用。
     * @param  {Map} map 存储集
     * @param  {[Object]} list 映射配置集
     * @return {this}
     */
    init( list ) {
        for (const its of list) {
            this.bind( its.key, its.command, its.when, its.not );
        }
        return this;
    }


    /**
     * 绑定键映射。
     * cmd支持空格分隔的多个指令标识序列。
     * 注：可用于外部用户配置定制覆盖。
     * @param  {String} key 键序列（单个）
     * @param  {String} cmd 指令标识/序列
     * @param  {String} when 匹配执行选择器，可选
     * @param  {String} not 匹配不执行选择器，可选
     * @return {this}
     */
    bind( key, cmd, when, not ) {
        this._map.set(
            key,
            {
                commands: cmd.split(__reSpace),
                match: this._handle(when, not)
            }
        );
        return this;
    }


    /**
     * 指令标识确认。
     * 可用于指令准确限定。
     * @param  {String} cmd 指令标识
     * @param  {String} key 键序列
     * @param  {Element} target 目标元素
     * @return {Boolean}
     */
    iscmd( cmd, key, target ) {
        let _cmdx = this._map.get( key );
        return this._match(_cmdx, target) && _cmdx.commands.includes(cmd);
    }


    /**
     * 根据键序列激发事件。
     * 注：会取消浏览器默认行为。
     * @param  {String} key 键序列
     * @param  {Event} ev 事件对象
     * @param  {Value} extra 附加数据，可选
     * @return {void}
     */
    fire( key, ev, extra = null ) {
        let _cmdx = this._map.get(key);

        if ( this._match(_cmdx, ev.target) ) {
            for (const cmd of _cmdx.commands) {
                $.trigger( ev.target, cmd, extra, true, true );
            }
            ev.preventDefault();
        }
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 元素匹配测试。
     * 如果没有when设置则为无条件匹配。
     * @param  {Object2}} cmdx 配置对象 {commands, match}
     * @param  {Element} target 目标元素
     * @return {Boolean}
     */
    _match( cmdx, target ) {
        return cmdx && ( !cmdx.match || cmdx.match(target) )
    }


    /**
     * 构造匹配测试函数。
     * 无匹配条件时返回null。
     * @param  {String} when 匹配选择器
     * @param  {String} not 不匹配选择器
     * @param  {Array} buf 存储集
     * @return {Function|null}
     */
    _handle( when, not, buf = [] ) {
        if ( when ) {
            buf.push( el => $.is(el, when) );
        }
        if ( not ) {
            buf.push( el => !$.is(el, not) );
        }
        if ( buf.length > 1 ) {
            return el => buf.every( f => f(el) );
        }
        return buf.length ? buf[0] : null;
    }
}
