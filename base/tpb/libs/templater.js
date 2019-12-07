// $Id: templater.js 2019.09.02 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器。
//  实现模板的存储、提取和必要的实时导入和解析。
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
    __tplLoad   = 'tpl-load',  // 模板节点载入

    // 选择器。
    __slrName   = `[${__tplName}]`,
    __slrLoad   = `[${__tplLoad}]`;


class Templater {
    /**
     * 构造模板管理器实例。
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

        // 原始模板
        this._tpls = new Map();
        // 副本存储
        this._copy = new Map();

        // 子模版承诺存储（同步点）
        // {root: Promise}
        this._pool = new WeakMap();
    }


    /**
     * 获取模板节点。
     * 如果模板尚未载入/克隆，需要传递原始模板名。
     * 即便目标模板已经载入/克隆，传递原始模板名是无害的。
     * 注：
     * 新的命名可以与原始名称相同，这也是默认的状态。
     * 强制请求模板节点通常是因为克隆节点已被破坏（它们在DOM中）。
     *
     * @param  {String} name 模板名或克隆命名
     * @param  {String} orig 原始模板名，可选
     * @param  {Boolean} tpl 强制请求模板节点，可选
     * @return {Promise} 承诺对象
     */
    get( name, orig = name, tpl = false ) {
        let _root = null;

        if ( !tpl ) {
            _root = this._copy.get(name);
        }
        if (_root) {
            return Promise.resolve(_root);
        }
        // 取原始模板，克隆&存储。
        return this.tpl( orig ).then( el => this.clone(el, name) );
    }


    /**
     * 获取原始模板节点。
     * @param  {String} name 模板名
     * @return {Promise} 承诺对象
     */
    tpl( name ) {
        let _tpl = this._tpls.get(name);

        if (_tpl) {
            return Promise.resolve(_tpl);
        }
        // 载入，解析&存储，再提取。
        return this._load(name).then( el => this.build(el) ).then( () => this._tpls.get(name) );
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
     * 克隆&存储模板节点。
     * 会同时克隆渲染文法（如果有）。
     * @param  {Element} tpl 源模板节点
     * @param  {String} name 副本名称定义
     * @return {Element} 克隆的新元素
     */
    clone( tpl, name ) {
        let _new = $.clone( tpl, true, true, true );

        if ( this._render ) {
            this._render.clone( _new, tpl );
        }
        this._copy.set( name, _new );

        return _new;
    }


    /**
     * 调试用数据。
     */
    debug() {
        return {
            name: __tplName,
            load: __tplLoad,
            tpls: this._tpls,
            copy: this._copy,
        };
    }


    //-- 私有辅助 -------------------------------------------------------------

    /**
     * 模板构建。
     * - 需要处理OBT的解析/绑定逻辑。
     * - 存储构建好的模板节点备用。
     * - 可能需要多次异步载入（tpl-load指令）。
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
     * 匹配检查包含容器元素自身。
     * 返回null表示无子模版需要载入。
     * @param  {DocumentFragment} root 根容器
     * @return {[Promise]|null} 子模版载入承诺集
     */
     _subs( root ) {
        let _els = $.find(root, __slrLoad, true);

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
        let _ns = $.attribute(box, __tplLoad);
        $.attribute(box, __tplLoad, null);

        if ( !_ns ) {
            return null;
        }
        return Promise.all(
            _ns.split(loadSplit).map( n => this.tpl(n.trim()) )
        )
        // 内部合并，不用$.prepend
        .then( els => box.prepend(...els) )
    }


    /**
     * 添加模板节点。
     * 注：元素已是选择器匹配的。
     * @param {Element} el 节点元素
     */
     _add( el ) {
        let _n = $.attribute(el, __tplName);
        $.atribute(el, __tplName, null);

        if ( this._tpls.has(_n) ) {
            window.console.warn(`[${_n}] template node was overwritten.`);
        }
        this._tpls.set( _n, el );
    }
}


export { Templater };
