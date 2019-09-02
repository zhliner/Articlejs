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
     * @param {Function} loader 节点载入回调
     * @param {Function} obter OBT解析回调
     */
    constructor( loader, obter ) {
        this._load = loader;
        this._obtx = obter;
        this._store = new Map();
    }


    /**
     * 获取模板节点。
     * @param  {String} name 模板节点名
     * @return {Promise} 承诺对象
     */
    get( name ) {
        let _tpl = this._store.get(name);

        if (_tpl) {
            return Promise.resolve(_tpl);
        }
        // 载入/解析并存储。
        return this._load(name).then(el => this.build(el)).then(() => this._store.get(name));
    }


    /**
     * 模板构建。
     * - 需要处理OBT的解析/绑定逻辑。
     * - 存储构建好的模板节点备用。
     * 注：可能需要多次异步载入（tpl-load指令）。
     * @param  {Element|DocumentFragment} root 根元素或文档片段
     * @return {Promise}
     */
    build( root ) {
        this._obtx(root);

        $.find(root, __slrName, true).forEach(
            el => this.add( el )
        )
        let _ps = this.subs(root);

        return (_ps && _ps.length > 0) ? Promise.all(_ps) : Promise.resolve();
    }


    /**
     * 解析/载入子模板。
     * 注意：匹配检查包含容器元素自身。
     * @param  {Element|DocumentFragment} box 根容器
     * @return {[Promise]} 子模版载入承诺集
     */
    subs( box ) {
        let _els = $.find(box, __slrLoad, true);

        if ( _els.length == 0 ) {
            return null;
        }
        return $.map( _els, el => this.loadsub(el) );
    }


    /**
     * 载入一个子模版。
     * 注：调用者已选择器匹配。
     * @param  {Element} box 容器元素
     * @return {Promise}
     */
    loadsub( box ) {
        let _n = box.getAttribute(__tplLoad);
        box.removeAttribute(__tplLoad);

        if ( !_n ) {
            return null;
        }
        return this.get( _n ).then( el => box.prepend(el) );
    }


    /**
     * 添加模板节点。
     * 注：调用者已选择器匹配。
     * @param {Element} el 节点元素
     */
    add( el ) {
        let _n = el.getAttribute(__tplName);
        el.removeAttribute(__tplName);

        if ( this._store.has(_n) ) {
            window.console.warn(`[${_n}] template node was overwritten.`);
        }
        this._store.set( _n, el );
    }


    /**
     * 调试用数据。
     */
    debug() {
        return {
            name: __tplName,
            load: __tplLoad,
            tpls: this._store,
        };
    }

}


export { Templater };
