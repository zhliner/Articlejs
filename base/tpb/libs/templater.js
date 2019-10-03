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
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


const
    __tplName = 'tpl-name',  // 模板节点命名属性
    __tplLoad = 'tpl-load',  // 模板节点载入属性名

    __slrName = `[${__tplName}]`,
    __slrLoad = `[${__tplLoad}]`;


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
     * 强制请求模板节点通常是因为克隆节点已被破坏。
     * @param  {String} name 模板名
     * @param  {String} from 原始模板名
     * @param  {Boolean} tpl 强制请求模板节点
     * @return {Promise} 承诺对象
     */
    get( name, orig, tpl ) {
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
     * 载入一个子模版。
     * 注：元素已是选择器匹配的。
     * @param  {Element} box 容器元素
     * @return {Promise}
     */
    _loadsub( box ) {
        let _n = $.attribute(box, __tplLoad);
        $.attribute(box, __tplLoad, null);

        if ( !_n ) {
            return null;
        }
        return this.tpl( _n ).then( el => box.prepend(el) );
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
