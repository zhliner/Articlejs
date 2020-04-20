//! $Id: hotkey.js 2020.04.06 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  快捷键映射处理。
//  只支持一个键序列只映射到一个指令集。
//  注记：
//  如果需要同一键序列映射到不同的目标&行为，应当创建一个新的实例来处理。
//  这样的简化设计更容易分区控制，且效率较高。
//
//  配置结构：{
//      key:        触发键序列，支持数组定义多对一（通过发送数据区分）
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


class HotKey {

    constructor() {
        // key: {
        //      commands: [command],
        //      match:    {Function|null}
        // }
        this._map = new Map();
    }


    /**
     * 键映射配置。
     * 注：无需在节点解析之前调用。
     * @param  {Map} map 存储集
     * @param  {[Object]} list 映射配置集
     * @return {this}
     */
    config( list ) {
        for (const its of list) {
            let _ks = its.key;

            if ( !$.isArray(_ks) ) {
                _ks = [_ks];
            }
            _ks.forEach(
                key => this.bind(key, its.command, its.when, its.not)
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
        this._map.set(
            key,
            {
                commands: cmd.trim().split( __reSpace ),
                match: this._handle( when, not )
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
    pass( cmd, key, target ) {
        let _cmds = this._matches(key, target);
        return _cmds && _cmds.includes( cmd );
    }


    /**
     * 根据键序列激发事件。
     * 捕获目标键序列后会取消浏览器默认行为。
     * @param  {String} key 键序列
     * @param  {Event} ev 事件对象
     * @param  {Value} extra 附加数据
     * @return {Boolean} 是否激发
     */
    fire( key, ev, extra ) {
        let _cmds = this._matches(key, ev.target);

        if ( _cmds ) {
            for ( const cmd of _cmds ) {
                $.trigger( ev.target, cmd, extra, true, true );
            }
            ev.preventDefault();
        }
        return !!_cmds;
    }


    //-- 私有辅助 ----------------------------------------------------------------


    /**
     * 获取匹配的指令集。
     * @param  {String} key 触发键序列
     * @param  {Element} target 目标元素
     * @return {[command]} 指令标识集
     */
    _matches( key, target ) {
        let _cmo = this._map.get(key);
        return _cmo && (!_cmo.match || _cmo.match(target)) && _cmo.commands;
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

// 导出。
export default HotKey;
