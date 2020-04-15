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
        // key: evn-keys 快捷键序列
        // val: {
        //      cmds: [command],
        //      when: selector 目标匹配选择器，可选
        // }
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
            this.bind( its.key, its.command, its.when );
        }
        return this;
    }


    /**
     * 绑定键映射。
     * 用于外部用户配置定制覆盖。
     * @param  {String} key 键序列
     * @param  {String} cmd 指令标识
     * @param  {String} when 执行条件（selector）
     * @return {this}
     */
    bind( key, cmd, when ) {
        this._map.set(
            key, {
                cmds: cmd.split(__reSpace),
                when: when || '',
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
        return this._when(_cmdx, target) && _cmdx.cmds.includes(cmd);
    }


    /**
     * 根据键序列激发事件。
     * 注：会取消浏览器默认行为。
     * @param  {String} key 键序列
     * @param  {Event} ev 事件对象
     * @return {void}
     */
    fire( key, ev ) {
        let _cmdx = this._map.get(key);

        if ( this._when(_cmdx, ev.target) ) {
            for (const cmd of _cmdx.cmds) {
                $.trigger( ev.target, cmd, ev.detail, true );
            }
            ev.preventDefault();
        }
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 元素匹配测试。
     * 如果没有when设置则为无条件匹配。
     * @param  {Object2}} cmdx 配置值 {when, cmds}
     * @param  {Element} target 目标元素
     * @return {Boolean}
     */
    _when( cmdx, target ) {
        return cmdx && ( !cmdx.when || $.is(target, cmdx.when) );
    }

}
