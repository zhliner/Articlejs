// $ID: templater.js 2019.09.02 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  模板管理器。
//
//  提取文档内定义的模板节点，解析构建OBT逻辑和渲染配置并存储节点供检索。
//  如果DOM中有子模版配置，会实时导入并解析存储。
//
//  解析顺序：
//      1. 导入根模板节点。
//      2. 解析OBT配置，构建调用链并绑定。
//      3. 解析渲染文法（Render.parse）。
//      4. 如果有模板中包含子模版，导入并解析之。
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

    // 取出标记字符。
    // 适用 tpl-source 语法。
    __flagPick  = '~',

    // 绑定的事件处理器一起克隆标记。
    // 适用 tpl-node 语法。
    __flagBound = '!',

    // 特性名定义。
    __tplName   = 'tpl-name',   // 模板节点命名
    __tplNode   = 'tpl-node',   // 模板节点引入（克隆）
    __tplSource = 'tpl-source', // 模板节点引入（原始）

    // 模板添加完成事件。
    __tplDone   = 'tpled',

    // 选择器。
    __nameSlr   = `[${__tplName}]`,
    __nodeSlr   = `[${__tplNode}], [${__tplSource}]`;


class Templater {
    /**
     * 创建实例。
     * obter: function( Element ): Promise<void>
     * loader: function( String ): Promise<DocumentFragment>
     * @param {Function} obter OBT解析回调
     * @param {TplLoader} loader 节点载入器
     */
    constructor( obter, loader ) {
        this._obter = obter;
        this._loader = loader;

        // 模板节点存储（已就绪）
        // { String: Element }
        this._tpls = new Map();

        // 临时存储（就绪后移除）
        this._tplx = new Map();  // 有子模版的模板节点 {name: Promise}
        this._pool = new Map();  // 初始载入文档片段或元素 {root: Promise}
    }


    /**
     * 获取模板节点（原始）。
     * 如果模板不存在会自动载入。
     * @param  {String} name 模板名
     * @return {Promise<Element>} 承诺对象
     */
    get( name ) {
        let _tpl = this._tpls.get( name );

        if ( _tpl ) {
            return Promise.resolve( _tpl );
        }
        return this._tplx.get( name ) || this._load( name );
    }


    /**
     * 克隆模板节点。
     * 如果模板不存在，会自动尝试载入。
     * 注：克隆包含渲染文法。
     * @param  {String} name 模板名
     * @param  {Boolean} bound 包含绑定的事件处理器，可选
     * @return {Promise<Element>} 承诺对象
     */
    clone( name, bound ) {
        return this.get( name ).then( el => this._clone(el, bound) );
    }


    /**
     * 返回既有模板节点或其副本。
     * 需确信模板节点已经添加到内部存储，
     * 并且该节点的内部子节点已经就绪（tpl-node|source完成）。
     * @param  {String} name 节点名
     * @param  {Boolean} clone 是否克隆（含渲染文法）
     * @param  {Boolean} bound 克隆包含绑定的事件处理器，可选
     * @return {Element|null}
     */
    node( name, clone, bound ) {
        let _tpl = this._tpls.get( name );

        if ( !_tpl ) {
            return null;
        }
        return clone ? this._clone( _tpl, bound ) : _tpl;
    }


    /**
     * 取出模板节点。
     * 如果模板节点已经不存在，会导致 .get() 重新导入，
     * 这会因重复添加同源节点（同一文件内定义）而出错。
     * @param  {String} name 模板名
     * @return {Promise<Element>}
     */
    pick( name ) {
        return this.get( name ).then(
            el => ( this._tpls.delete(name) || this._tplx.delete(name) ) && el
        );
    }


    /**
     * 移除模板。
     * 如果某模板是最后一次使用，可用该方法使存储集精简。
     * @param  {String} name 模板名
     * @return {Element|null} 被移除的模板
     */
    del( name ) {
        let _tpl = this._tpls.get( name );

        if ( _tpl ) {
            this._tpls.delete( name );
        }
        return _tpl || null;
    }


    /**
     * 情况模板存储集。
     * @return {void}
     */
    clear() {
        this._tpls.clear();
    }


    /**
     * 模板构建。
     * 元素实参主要用于初始或手动调用。
     * 系统自动载入并构建时，实参为文档片段。
     * file参数仅在系统自动构建时有用。
     * @param  {Element|Document|DocumentFragment} root 构建目标
     * @param  {String} file 文档片段对应的文件名，可选
     * @return {Promise<true>}
     */
    build( root, file ) {
        if ( this._pool.has(root) ) {
            return this._pool.get(root);
        }
        // 注记：
        // 先从总根构建OBT后再处理子模版可以节省解析开销，
        // 否则子模板克隆会直接复制OBT特性，相同值重复解析。
        let _pro = this._obter( root )
            .then( () => this.tpls(root) )
            .then( () => this._pool.delete(root) )
            .then( () => file && this._loader.clean(file) );

        this._pool.set( root, _pro );

        return Render.parse( root ) && _pro;
    }


    /**
     * 提取命名的模板节点。
     * 检查不在命名模版节点内的子模版导入配置。
     * @param  {Element|DocumentFragment} root 根容器
     * @return {[Promise<void>]}
     */
    tpls( root ) {
        // 先提取命名模板。
        for ( const tpl of $.find(__nameSlr, root, true) ) {
            this.add( tpl );
            // 可用于即时移除节点（脱离DOM）。
            $.trigger( tpl, __tplDone, null, false, false );
        }
        // 模板外的导入处理。
        let _ps = this._subs( root );

        return _ps ? Promise.all(_ps) : Promise.resolve();
    }


    /**
     * 添加模板节点。
     * 元素应当包含tpl-name特性值。
     * @param  {Element} tpl 模板节点元素
     * @return {void}
     */
    add( tpl ) {
        let _name = $.xattr( tpl, __tplName ),
            _subs = this._subs( tpl );

        if ( !_subs ) {
            return this._add( _name, tpl );
        }
        let _pro = Promise.all( _subs )
            .then( () => this._add(_name, tpl) )
            .then( () => this._tplx.delete(_name) && tpl );

        this._tplx.set( _name, _pro );
    }


    //-- 私有辅助 -------------------------------------------------------------


    /**
     * 安全添加。
     * 抛出错误以及时发现问题。
     * 可能由于存在重复的模板名而出现，
     * 也可能由于 文件:模板 配置错误重复载入而出现。
     * @param  {String} name 模板名
     * @param  {Element} tpl 模板节点
     * @return {void}
     */
    _add( name, tpl ) {
        if ( this._tpls.has(name) ) {
            throw new Error( `[${name}] node was exist.` );
        }
        this._tpls.set( name, tpl );
    }


    /**
     * 载入模板节点。
     * @param  {String} name 模板名
     * @return {Promise<Element>}
     */
    _load( name ) {
        return this._loader.load( name )
            .then( ([fg, file]) => this.build(fg, file) )
            .then( () => this._tpls.get(name) || this._tplx.get(name) );
    }


    /**
     * 克隆模板节点。
     * - 渲染文法（如果有）会被无条件克隆。
     * - 是否克隆事件处理器由bound实参控制。
     * @param  {Element} tpl 原模板节点
     * @param  {Boolean} bound 包含绑定的事件处理器，可选
     * @return {Element} 克隆的新节点
     */
    _clone( tpl, bound ) {
        return Render.clone(
            tpl,
            $.clone( tpl, bound, true, bound )
        );
    }


    /**
     * 解析/载入子模板。
     * 即处理 tpl-node/tpl-source 两个指令。
     * @param  {Element|DocumentFragment} root 根容器
     * @return {[Promise<void>]} 子模版载入承诺集
     */
     _subs( root ) {
        let _els = $.find(__nodeSlr, root, true);

        if ( _els.length === 0 ) {
            return null;
        }
        return $.map( _els, el => this._imports(el) );
    }


    /**
     * 导入元素引用的子模版。
     * 子模版定义可以是一个逗号分隔的列表（有序）。
     * @param  {Element} el 配置元素
     * @return {Promise<void>}
     */
    _imports( el ) {
        let [meth, val] = this._reference(el),
            _bound = false;

        if ( val[0] === __flagBound ) {
            _bound = true;
            val = val.substring( 1 );
        }
        return Promise.all(
            // 多余的_bound无副作用。
            val.split(__loadSplit).map( n => this[meth](n.trim(), _bound) )
        )
        // $.replace
        // tQuery:nodeok 定制事件可提供初始处理机制。
        .then( els => $.replace( el, els) )
    }


    /**
     * 获取节点引用。
     * tpl-node优先于tpl-source，两者不应同时配置。
     * 取出标识符^用在tpl-node上无效，它会被简单忽略掉。
     * 返回取值方法名和配置值。
     * @param  {Element} el 配置元素
     * @return {[method, value]}
     */
    _reference( el ) {
        let _n = el.hasAttribute(__tplNode) ? __tplNode : __tplSource,
            _v = $.xattr(el, _n).trim(),
            _f = 'get';

        if ( _v[0] === __flagPick ) {
            _f = 'pick';
            _v = _v.substring( 1 );
        }
        return [ _n == __tplNode ? 'clone' : _f, _v ];
    }
}


export { Templater };
