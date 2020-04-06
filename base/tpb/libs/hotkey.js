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

export class HotKey {

    constructor() {
        this._ui = new IStore();
        this._map = new Map();
    }


    /**
     * 配置初始化。
     * @param {Map} map 存储集
     * @param {Object} conf 映射配置集
     */
    init( conf ) {
        for (const [path, keys] of Object.entries(conf)) {
            this._map.set( keys, path );
        }
    }


    /**
     * 绑定键映射。
     * 用于外部定制覆盖。
     * @param {String} path 标识路径
     * @param {String} keys 键序列
     */
    bind( path, keys ) {
        this._map.set( keys, path );
    }


    /**
     * 目标路径关联事件目标。
     * 事件目标：[元素, 事件名]。
     * @param {String} path 路径标识
     * @param {String} evn 事件名
     * @param {Element} elem 触发元素
     */
    couple( path, evn, elem ) {
        this._ui.add( path, evn, elem );
    }


    /**
     * 根据键序列派发事件。
     * @param  {CustomEvent} ev 事件对象
     * @param  {...Value} rest 额外递送参数
     * @return {void}
     */
    dispatchEvent( ev, ...rest ) {
        let path = this._map.get( ev.type );
        return path && this._ui.run( path, ...rest );
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
     * @param {String} path 标识路径
     * @param {String} evn 触发行为的事件名
     * @param {Element|.dispatchEvent} elem 触发目标
     */
    add( path, evn, elem ) {
        this._map.set( path, [elem, evn] );
    }


    /**
     * 触发目标处理器。
     * 如果事件处理器调用了.preventDefault()，返回false，否则为true。
     * 如果路径标识的处理器不存在，返回undefined。
     * @param  {String} path 路径标识
     * @param  {...Value} rest 额外参数
     * @return {void|Boolean}
     */
    run( path, ...rest ) {
        let v2 = this._map.get( path );
        return v2 && $.trigger( v2[0], v2[1], ...rest );
    }
}
