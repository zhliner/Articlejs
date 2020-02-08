// $Id: templater.js 2019.09.02 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器
//
//  实现模板节点的实时导入、存储和提取（克隆的副本）。
//  模板的复用仅限于源码层面，因此这里仅提供原始模板的副本。
//  注：
//  外部对相同模板的应用级复用需要自行负责（比如节点状态共享）。
//
//  使用：
//      tpo = new Templater(...);
//      tpo.get(...)
//
//
///////////////////////////////////////////////////////////////////////////////
//

// 可选。
// 若无需支持可简单移除。
import { Render } from "./render.js";


const
    $ = window.$,

    // 子模版分隔符
    loadSplit   = ',',

    // 特性名定义。
    __tplName   = 'tpl-name',   // 模板节点命名
    __tplNode   = 'tpl-node',   // 模板节点引入（克隆）
    __tplSource = 'tpl-source', // 模板节点引入（原始）

    // 选择器。
    __nameSelector  = `[${__tplName}]`,
    __nodeSelector  = `[${__tplNode}], [${__tplSource}]`;


class Templater {
    /**
     * 创建实例。
     * loader: function( nodeName:String ): Promise:then(Element)
     * obter: function( Element, obts:Boolean ): void
     * @param {Function} loader 节点载入回调
     * @param {Function} obter OBT解析回调
     */
    constructor( loader, obter ) {
        this._load = loader;
        this._obter = obter;
        // 渲染支持，可选
        // this._render = null;
        this._render = Render;

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
     * @return {Promise} 承诺对象
     */
    get( name ) {
        let _el = this._tpls.get(name);

        if (_el) {
            return Promise.resolve( this.clone(_el) );
        }
        return this._load( name )
            .then( el => this.build(el) )
            .then( () => this.clone(this._tpls.get(name), name) );
    }


    /**
     * 获取模板节点（原始）。
     * 如果模板不存在会自动载入。
     * 应当只用于数据类模板（无需克隆）。
     * @param  {String} name 模板名
     * @return {Promise} 承诺对象
     */
    tpl( name ) {
        let _el = this._tpls.get(name);

        if (_el) {
            return Promise.resolve(_el);
        }
        return this._load(name).then(el => this.build(el)).then(() => this._tpls.get(name));
    }


    /**
     * 模板构建。
     * 如果已经开始构建，返回子模版的承诺对象。
     * 注：
     * - 需要处理OBT的解析/绑定逻辑。
     * - 存储构建好的模板节点备用。
     * - 可能需要多次异步载入（tpl-node）。
     * - 如果root不是文档/元素类型，返回undefined。
     * @param  {Element|DocumentFragment|Object} root 根容器或处理对象
     * @param  {Boolean|Object3} obts 清除指示或OBT配置（{on,by,to}）
     * @return {Promise|undefined}
     */
    build( root, obts = true) {
        if ( this._pool.has(root) ) {
            return this._pool.get(root);
        }
        this._obter( root, obts );

        // 非节点类（可绑定事件，如 window）
        if ( !root.nodeType ) return;

        if ( this._render ) {
            this._render.parse( root );
        }
        return this.picks( root );
    }


    /**
     * 提取命名的模板节点并存储。
     * 会检查子模版导入配置并持续载入（如果有）。
     * @param  {Element|DocumentFragment} root 根容器
     * @return {Promise<DocumentFragment>}
     */
    picks( root ) {
        $.find( __nameSelector, root, true )
            .forEach(
                el => this._add( el )
            )
        let _ps = this._subs(root),
            _pro = _ps.length > 0 ? Promise.all(_ps) : Promise.resolve();

        this._pool.set( root, _pro );
        return _pro;
    }


    /**
     * 克隆模板节点。
     * 同时会克隆渲染文法（如果有）以及绑定的事件处理器。
     * @param  {Element} tpl 模板节点
     * @return {Element} 克隆的新元素
     */
    clone( tpl, name ) {
        if ( !tpl ) {
            throw new Error(`[${name}] is loaded but not found.`);
        }
        let _new = $.clone(tpl, true, true, true);

        return this._render ? this._render.clone(_new, tpl) : _new;
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 解析/载入子模板。
     * 返回null表示无子模版需要载入。
     * @param  {DocumentFragment} root 根容器
     * @return {[Promise]} 子模版载入承诺集
     */
     _subs( root ) {
        let _els = $.find(__nodeSelector, root);

        if ( _els.length == 0 ) {
            return [];
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
            val.split(loadSplit).map( n => this[meth](n.trim()) )
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
            _v = el.getAttribute(_n);

        el.removeAttribute(_n);
        return [ _n == __tplNode ? 'get' : 'tpl', _v.trim() ];
    }


    /**
     * 添加模板节点。
     * 注：元素已是选择器匹配的。
     * @param {Element} el 节点元素
     */
     _add( el ) {
        let _n = el.getAttribute(__tplName);
        el.removeAttribute(__tplName);

        if ( this._tpls.has(_n) ) {
            window.console.warn(`[${_n}] template node was overwritten.`);
        }
        this._tpls.set( _n, el );
    }
}


export { Templater };
