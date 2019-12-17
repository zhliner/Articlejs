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

const $ = window.$;


const
    // 子模版分隔符
    loadSplit   = ',',

    // 特性名定义。
    __tplName   = 'tpl-name',  // 模板节点命名
    __tplNode   = 'tpl-node',  // 模板节点引入

    // 选择器。
    __slrName   = `[${__tplName}]`,
    __slrNode   = `[${__tplNode}]`;


class Templater {
    /**
     * 创建实例。
     * loader: function( String ): Promise:then(Element)
     * obter: function( Element ): Boolean
     * render: function( Element ): Element
     *
     * @param {Function} loader 节点载入回调
     * @param {Function} obter OBT解析回调
     * @param {Render} render 渲染器 {parse, clone}，可选
     */
    constructor( loader, obter, render ) {
        this._load = loader;
        this._obtx = obter;
        this._render = render;

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
     * @param  {String} name 模板命名
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
     * 模板构建。
     * 如果已经开始构建，返回子模版的承诺对象。
     * @param  {DocumentFragment} root 根容器
     * @return {Promise}
     */
    build( root ) {
        if ( !this._pool.has(root) ) {
            this._pool.set( root, this._build(root) );
        }
        return this._pool.get(root);
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


    /**
     * 调试用数据。
     */
    debug() {
        return {
            name: __tplName,
            load: __tplNode,
            tpls: this._tpls,
        };
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 模板构建。
     * - 需要处理OBT的解析/绑定逻辑。
     * - 存储构建好的模板节点备用。
     * - 可能需要多次异步载入（tpl-node）。
     * @param  {DocumentFragment} root 文档片段
     * @return {Promise}
     */
    _build( root ) {
        this._obtx( root );

        if ( this._render ) {
            this._render.parse( root );
        }
        $.find(root, __slrName)
        .forEach(
            el => this._add( el )
        )
        let _ps = this._subs(root);

        return (_ps && _ps.length > 0) ? Promise.all(_ps) : Promise.resolve();
    }


    /**
     * 解析/载入子模板。
     * 返回null表示无子模版需要载入。
     * @param  {DocumentFragment} root 根容器
     * @return {[Promise]|null} 子模版载入承诺集
     */
     _subs( root ) {
        let _els = $.find(root, __slrNode);

        if ( _els.length == 0 ) {
            return null;
        }
        return $.map( _els, el => this._loadsub(el) );
    }


    /**
     * 载入容器元素的子模版。
     * 子模版定义可能是一个列表（有序）。
     * 可能返回null，调用者应当滤除。
     * @param  {Element} box 容器元素
     * @return {Promise|null}
     */
    _loadsub( box ) {
        let _ns = box.getAttribute(__tplNode);
        box.removeAttribute(__tplNode);

        if ( !_ns ) {
            return null;
        }
        return Promise.all(
            _ns.split(loadSplit).map( n => this.get(n.trim()) )
        )
        // 内部合并，不用$.replace
        .then( els => box.replaceWith(...els) )
    }


    /**
     * 添加模板节点。
     * 如果模板节点在正常的DOM结构之内（非顶层），克隆替换。
     * 注：元素已是选择器匹配的。
     * @param {Element} el 节点元素
     */
     _add( el ) {
        let _n = el.getAttribute(__tplName);
        el.removeAttribute(__tplName);

        if ( this._tpls.has(_n) ) {
            window.console.warn(`[${_n}] template node was overwritten.`);
        }
        if ( el.parentElement ) {
            el.replaceWith( this.clone(el) );
        }
        this._tpls.set( _n, el );
    }
}


export { Templater };
