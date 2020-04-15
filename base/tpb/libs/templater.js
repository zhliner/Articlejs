// $Id: templater.js 2019.09.02 Tpb.Kits $
// ++++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器。
//
//  实现模板节点的实时导入、存储/提取和渲染。
//
//
///////////////////////////////////////////////////////////////////////////////
//

// 无渲染支持。
// import { Render } from "./render.x.js";
// 有渲染支持。
import { Render } from "./render.js";


const
    $ = window.$,

    // 子模版分隔符
    __loadSplit = ',',

    // 特性名定义。
    __tplName   = 'tpl-name',   // 模板节点命名
    __tplNode   = 'tpl-node',   // 模板节点引入（克隆）
    __tplSource = 'tpl-source', // 模板节点引入（原始）

    // 选择器。
    __nameSlr   = `[${__tplName}]`,
    __nodeSlr   = `[${__tplNode}], [${__tplSource}]`;


class Templater {
    /**
     * 创建实例。
     * obter: function( Element, obts:Boolean ): void
     * loader: function( nodeName:String ): Promise:then(Element)
     * @param {Function} obter OBT解析回调
     * @param {Function} loader 节点载入回调
     */
    constructor( obter, loader ) {
        this._obter = obter;
        this._load = loader;

        // 模板节点存储
        // { String: Element }
        this._tpls = new Map();

        // 子模版承诺存储（同步点）
        // {root: Promise}
        this._pool = new WeakMap();
    }


    /**
     * 获取模板节点（副本）。
     * 如果模板不存在，会自动尝试载入。
     * @param  {String} name 模板名
     * @return {Promise<Element>} 承诺对象
     */
    get( name ) {
        return this.tpl(name).then( el => this.clone(el) );
    }


    /**
     * 获取模板节点（原始）。
     * 如果模板不存在会自动载入。
     * 注：通常用于数据类模板（无需克隆）。
     * @param  {String} name 模板名
     * @return {Promise<Element>} 承诺对象
     */
    tpl( name ) {
        if ( this._tpls.has(name) ) {
            return Promise.resolve( this._tpls.get(name) );
        }
        return this._load(name).then(fg => this.build(fg)).then(() => this._tpls.get(name));
    }


    /**
     * 接口：模板构建。
     * 需要先处理可能有的子模版的导入。
     * 注：子模版中可能包含子模版。
     * @param  {Element|DocumentFragment|Document} root 构建目标
     * @return {Promise}
     */
    build( root ) {
        if ( this._pool.has(root) ) {
            return this._pool.get(root);
        }
        this._obter( root );
        Render.parse( root );

        return this.picks( root );
    }


    /**
     * 提取命名的模板节点并存储。
     * 会检查子模版导入配置并持续载入（如果有）。
     * @param  {Element|DocumentFragment} root 根容器
     * @return {[Promise<void>]}
     */
    picks( root ) {
        $.find(__nameSlr, root, true)
            .forEach(
                el => this.add(el)
            );
        let _ps = this._subs(root),
            _pro = _ps ? Promise.all(_ps) : Promise.resolve();

        this._pool.set( root, _pro );
        return _pro;
    }


    /**
     * 添加模板节点。
     * 若未传递模板名，元素应当包含模板命名属性。
     * 可用于外部手动添加。
     * @param {Element} el 节点元素
     * @param {String} name 模板名，可选
     */
    add( el, name ) {
        if ( !name ) {
            name = $.xattr( el, __tplName );
        }
        if ( this._tpls.has(name) ) {
            window.console.warn(`[${name}] template node was overwritten.`);
        }
        this._tpls.set( name, el );
    }


    /**
     * 克隆模板节点。
     * 同时会克隆渲染文法（如果有）以及绑定的事件处理器。
     * @param  {Element} tpl 模板节点
     * @return {Element} 克隆的新元素
     */
    clone( tpl ) {
        return Render.clone(
            tpl,
            $.clone( tpl, true, true, true )
        );
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 解析/载入子模板。
     * 无子模版载入配置时返回一个空数组。
     * @param  {Element|DocumentFragment} root 根容器
     * @return {[Promise]} 子模版载入承诺集
     */
     _subs( root ) {
        let _els = $.find(__nodeSlr, root, true);

        if ( _els.length == 0 ) {
            return null;
        }
        return $.map( _els, el => this._imports(el) );
    }


    /**
     * 导入元素引用的子模版。
     * 子模版定义可能是一个列表（有序）。
     * 可能返回null，调用者应当滤除。
     * @param  {Element} el 配置元素
     * @return {Promise|null}
     */
    _imports( el ) {
        let [meth, val] = this._reference(el);

        if ( !val ) {
            return null;
        }
        return Promise.all(
            val.split(__loadSplit).map( n => this[meth](n.trim()) )
        )
        // 内部合并，不用$.replace
        .then( els => el.replaceWith(...els) )
    }


    /**
     * 获取节点引用。
     * tpl-node与tpl-source不能同时配置，否则后者无效。
     * 返回取值方法名和配置值。
     * @param  {Element} el 配置元素
     * @return {[method, value]}
     */
    _reference( el ) {
        let _n = el.hasAttribute(__tplNode) ? __tplNode : __tplSource,
            _v = $.xattr( el, _n );

        return [ _n == __tplNode ? 'get' : 'tpl', _v.trim() ];
    }
}


export { Templater };
