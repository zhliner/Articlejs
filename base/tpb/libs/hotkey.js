//! $Id: hotkey.js 2020.04.06 Tpb.Base $
// ++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键映射配置与处理。
//  支持相同键序列对应到不同的指令标识（由when/not区分）。
//
//  配置结构：{
//      key:        触发键序列
//      command:    指令标识序列（空格分隔）
//      when:       匹配选择器，匹配则触发。可选
//      not:        不匹配选择器，匹配则不触发。可选
//  }
//  说明：
//  when和not是逻辑和（And）的关系，组合使用可获得精确的限定。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const
    $ = window.$,

    __reSpace = /\s+/;


export class HotKey {

    constructor() {
        // key: [{
        //      commands: [command],
        //      match:    {Function|null}
        // }]
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
            this.bind(
                its.key.trim(),
                its.command.trim(),
                its.when && its.when.trim(),
                its.not && its.not.trim()
            );
        }
        return this;
    }


    /**
     * 绑定键映射。
     * cmd支持空格分隔的多个指令标识序列。
     * 注：可用于外部用户配置定制覆盖。
     * @param  {String} key 键序列（单个）
     * @param  {String} cmd 指令标识/序列
     * @param  {String} when 匹配选择器，可选
     * @param  {String} not 不执行选择器，可选
     * @return {this}
     */
    bind( key, cmd, when, not ) {
        let _buf = this._map.get(key) || [];

        this._map.set(
            key,
            this._addCmd( cmd, when, not, _buf )
        )
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
    pass( cmd, key, target ) {
        return this._matches(key, target).includes( cmd );
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
        let _cmds = this._matches(key, ev.target);

        for ( const cmd of _cmds ) {
            $.trigger( ev.target, cmd, extra, true, true );
        }
        if (_cmds.length) ev.preventDefault();
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 获取匹配的指令集。
     * @param  {String} key 触发键序列
     * @param  {Element} target 目标元素
     * @return {[command]} 指令标识集
     */
    _matches( key, target ) {
        let _cms = this._map.get(key),
            _buf = [];

        if ( _cms ) {
            _cms.forEach( cm =>
                (!cm.match || cm.match(target)) && _buf.push(...cm.commands)
            )
        }
        return _buf;
    }


    /**
     * 添加指令处理对象。
     * Object: {
     *      commands: [String],
     *      match: Function|null
     * }
     * 注：match为null表示无限制（无条件通过）。
     *
     * @param  {String} cmd 指令标识序列
     * @param  {String} when 匹配选择器，可选
     * @param  {String} not 不执行选择器，可选
     * @param  {[Object]} 指令处理器存储集
     * @return {[Object]} buf
     */
    _addCmd( cmd, when, not, buf ) {
        buf.push(
            {
                commands: cmd.split( __reSpace ),
                match: this._handle( when, not )
            }
        );
        return buf;
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
