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
    __reSpace = /\s+/,

    // 拦截的键。
    // 屏蔽浏览器默认行为。
    __maskKeys = new Set([
        'F1',
        'F2',
        'F3',
        'F4',
        'F5',
        'F6',
        'F7',
        'F8',
        'F9',
        'F10',
        'F11',
        'F12',
    ]);


export class HotKey {

    constructor() {
        this._ui = new IStore();
        // {key: [command]}
        this._map = new Map();
    }


    /**
     * 配置初始化。
     * 注：无需在节点解析之前调用。
     * @param {Map} map 存储集
     * @param {[Object]} list 映射配置集
     */
    init( list ) {
        for (const its of list) {
            this._map.set( its.key, its.command.split(__reSpace) );
        }
    }


    /**
     * 绑定键映射。
     * 用于外部用户配置定制覆盖。
     * @param {String} key 键序列
     * @param {String} cmd 指令标识
     */
    bind( key, cmd ) {
        this._map.set( key, cmd.split(__reSpace) );
    }


    /**
     * 是否为拦截键。
     * @param  {String} key 键名
     * @return {Boolean}
     */
    masked( key ) {
        return __maskKeys.has( key );
    }


    /**
     * 指令标识关联事件目标。
     * 事件目标：[元素, 事件名]。
     * @param {String} cmd 指令标识（单个）
     * @param {String} evn 事件名
     * @param {Element} elem 触发元素
     */
    couple( cmd, evn, elem ) {
        this._ui.add( cmd, evn, elem );
    }


    /**
     * 根据键序列派发事件。
     * @param  {CustomEvent} ev 事件对象
     * @param  {...Value} rest 额外递送参数
     * @return {void}
     */
    dispatchEvent( ev, ...rest ) {
        let _cmds = this._map.get( ev.type );
        if ( _cmds ) _cmds.forEach( cmd =>this._ui.run(cmd, ...rest) );
    }

}


//
// 交互行为存储器。
// 用目标路径标识并存储一个 [元素, 事件名] 值对。
// 用途：
// 通过路径标识查找交互行为存储，激发事件（从而调用处理器）。
// 可用于键盘快捷键映射到目标元素和事件处理。
//
class IStore {

    constructor() {
        this._map = new Map();
    }


    /**
     * 添加关联信息。
     * @param {String} cmd 指令标识
     * @param {String} evn 触发行为的事件名
     * @param {Element|.dispatchEvent} elem 触发目标
     */
    add( cmd, evn, elem ) {
        this._map.set( cmd, [elem, evn] );
    }


    /**
     * 触发目标处理器。
     * 如果事件处理器调用了.preventDefault()，返回false，否则为true。
     * 如果路径标识的处理器不存在，返回undefined。
     * @param  {String} cmd 指令标识
     * @param  {...Value} rest 额外参数
     * @return {Boolean|void}
     */
    run( cmd, ...rest ) {
        let v2 = this._map.get( cmd );
        return v2 && $.trigger( v2[0], v2[1], ...rest );
    }

}
