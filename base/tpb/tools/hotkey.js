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
//  如果需要同一键序列映射到不同的目标&行为，应当创建一个新的实例/配置来处理。
//  这样的简化设计更容易分区控制，且效率较高。
//
//  配置结构：{
//      key:        触发键序列，支持数组定义多对一（通过发送数据区分）
//      command:    指令标识序列（空格分隔）
//      exclude:    排除选择器，匹配则不触发。可选
//  }
//  注：
//  如果需要限定触发目标，可采用委托绑定的形式（这里不提供when逻辑），
//  或者在指令的委托绑定中指定匹配的选择器。
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
     * 注：在事件触发之前调用即可。
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
                key => this.bind(key, its.command, its.exclude)
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
     * @param  {String} exclude 排除选择器，可选
     * @return {this}
     */
    bind( key, cmd, exclude = null ) {
        this._map.set(
            key,
            {
                commands: cmd.trim().split( __reSpace ),
                match: exclude && ( el => !$.is(el, exclude) )
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
     * 检索键序列并激发指令。
     * 激发指令不表示指令就会执行，指令的绑定委托会进一步限定指令。
     * 注意：
     * 键序列存在匹配就会激发并取消浏览器的默认行为，
     * 如果需要避免这种宽泛拦截的影响，可以设置适当的排除项（exclude）。
     * 比如用字符作为快捷键，通常就需要排除文本框元素。
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

}

// 导出。
export default HotKey;
