//! $ID: top.js 2019.11.16 Articlejs.User $
// ++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 - 2022 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  用法：
//      // 创建一个编辑器实例，basefile可选。
//      let editor = yyEd.create( option, basefile );
//      // 编辑器（<iframe>）插入某容器。
//      box.append( editor.element() );
//
//  option {
//      name: String            编辑器实例命名（关联本地存储），可选
//      theme: String           默认主题，可选
//      style: String           默认样式，可选
//      width: Number|String    宽度（可含单位），可选，默认900px
//      height: Number|String   高度（可含单位），可选，默认700px
//      updatetime: Number      上次更新时间，仅修改时存在。可选
//      needRecover: Boolean    是否需要内容本地恢复（localStorage），可选
//
//      onready: Function       编辑器就绪回调，接口：function( editor ): void
//      onmaximize: Function    最大化请求，接口：function(): void
//      onsaved: Function       存储回调（用户按[s]键），接口：function( html ): void
//      onappended: Function    内容条目添加回调，接口：function( path, html ): void
//      onearsed: Function      内容条目删除回调，接口：function( [path] ): void
//  }
//
//  Editor接口：
//      .name(): String                         返回编辑器名称
//      .element(): Element                     获取编辑器根元素（<iframe>）
//      .reload( url?:String, callback ): void  重新载入编辑器
//
//      下面接口由编辑器实现提供
//      .heading( html:String ): String|this    获取/设置主标题
//      .subtitle( html:String ): String|this   获取/设置副标题
//      .abstract( html:String ): String|this   获取/设置文章提要
//      .content( html:String ): String|this    获取/设置正文（源码）
//      .seealso( html:String ): String|this    获取/设置另参见
//      .reference( html:String ): String|this  获取/设置文献参考
//      .theme( name:String, isurl:Boolean ): String|this   获取/设置主题
//      .style( name:String, isurl:Boolean ): String|this   获取/设置内容样式
//
//  注：
//  用户可以在同一个页面中创建多个编辑器实例（自行编写管理代码）。
//
//  兼容性:
//  Firefox 不支持<iframe>元素的resize，因此无法直接拖动框架来改变编辑器大小。
//  解决：通过容器（<div>）的resize来实现，但需传递编辑器的宽/高度为"100%"。
//
//  Edge/IE 完全不支持元素的resize，因此只能使用固定高/宽度的编辑器。
//
///////////////////////////////////////////////////////////////////////////////
//


// 名称空间。
// 可更改，但需与末端名称匹配。
const yyEd = {};


(function( Ed ) {

    // resize：
    // - chrome 正常。
    // - firefox 需通过容器resize实现。
    // - Edge/IE 无效。
    const __frameStyles = {
            width:      '900px',
            height:     '700px',
            resize:     'both',
            overflow:   'hidden',
            // 预防性设置
            border:     'none',
            boxSizing:  'border-box',
        };


    // 当前文件所在路径。
    const __PATH = (function() {
            let _els = document.getElementsByTagName('script'),
                _src = _els[_els.length-1].src;
            return _src.substring(0, _src.lastIndexOf('/'));
        })();


    const
        // 编辑器主题
        themeDir    = 'themes',     // 根目录
        themeFile   = 'style.css',  // 主样式文件

        // 内容样式
        styleDir    = 'styles',     // 根目录
        styleFile   = 'main.css',   // 主样式文件


        // 编辑器根模板
        __tplRoot   = 'editor.html',

        // 命名前缀。
        // 用于无命名时构建默认的编辑器实例名。
        __Prefix    = 'ArticleJS-';



/**
 * 编辑器创建。
 * 非常规的提交可能不需要<textarea>容器。
 * basefile参数相对于编辑器根目录。
 * @param  {Object} option 配置集
 * @param  {String} basefile 基础根模板文件（含扩展名），可选
 * @return {Editor} 编辑器实例
 */
Ed.create = (option, basefile) => new Editor( option, basefile || __tplRoot );


//
// 编辑器实现。
// 构建多个编辑器时可创建多个实例。
//
class Editor {
    /**
     * 创建编辑器。
     * @param {Object} option 初始选项
     * @param {String} basefile 基础根模板文件
     */
    constructor( option, basefile ) {
        let _name = option.name || getName(),
            _ifrm = editorBox(option.width, option.height);

        _ifrm.Config = editorOption(_name, option, this._ready.bind(this));

        this._name = _name;
        this._frame = _ifrm;
        this._init = option.onready;

        // 内容暂存。
        // 用于<iframe>重载时使用。
        this._store = new Map();
        // 内容恢复。
        // 由用户传入或提供默认操作。
        this.restore = null;

        _ifrm.setAttribute('src', `${__PATH}/${basefile}` );
    }


    /**
     * 获取编辑器的标识名。
     * @return {String}
     */
    name() {
        return this._name;
    }


    /**
     * 获取编辑器实例根容器元素。
     * @return {Element}
     */
    element() {
        return this._frame;
    }


    /**
     * 编辑器重载。
     * 默认会先暂存内容，然后载入目标实现页。
     * 如果传递用户回调，默认的内容暂存行为就不再执行。
     * - 可由编辑器命令行使用，此时通常传递basefile为假值（以沿用默认值）。
     * - 也可能由上层用户页面主动调用，如语言切换（此时通常有不同的basefile）。
     * callback接口: function(store): void。
     * @param  {String} basefile 基础根模板文件，可选
     * @param  {Function} callback 用户回调，可选
     * @return {void}
     */
    reload( basefile, callback = null ) {
        this._store
            .set( 'heading', this.heading() )
            .set( 'subtitle', this.subtitle() )
            .set( 'abstract', this.abstract() )
            .set( 'content', this.content() )
            .set( 'seealso', this.seealso() )
            .set( 'reference', this.reference() );

        this.restore = callback || this._restore;
        this._frame.setAttribute( 'src', `${__PATH}/${basefile || __tplRoot}` );
    }


    /**
     * 获取/设置主标题。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    heading( html ) {
        return this._proxy( 'heading', html );
    }


    /**
     * 获取/设置副标题。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    subtitle( html ) {
        return this._proxy( 'subtitle', html );
    }


    /**
     * 获取/设置文章提要。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    abstract( html ) {
        return this._proxy( 'abstract', html );
    }


    /**
     * 获取/设置正文内容。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    content( html ) {
        return this._proxy( 'content', html );
    }


    /**
     * 获取/设置另参见。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    seealso( html ) {
        return this._proxy( 'seealso', html );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    reference( html ) {
        return this._proxy( 'reference', html );
    }


    /**
     * 获取/设置编辑器主题。
     * 传递custom为真，表示用定制样式文件（全URL）。
     * @param  {String} name 主题名称
     * @param  {Boolean} isurl 自定义URL
     * @return {String|this}
     */
    theme( name, isurl ) {
        if ( name === undefined ) {
            return this._proxy( 'theme' );
        }
        return this._proxy(
            'theme',
            isurl ? name : `${__PATH}/${themeDir}/${name}/${themeFile}`
        );
    }


    /**
     * 获取/设置内容样式。
     * @param  {String} name 主样式文件
     * @param  {Boolean} isurl 自定义URL
     * @return {String|this}
     */
    style( name, isurl ) {
        if ( name === undefined ) {
            return this._proxy( 'style' );
        }
        return this._proxy(
            'style',
            isurl ? name : `${__PATH}/${styleDir}/${name}/${styleFile}`
        );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 就绪调用。
     * 初始就绪回调和重载回调各自独立。
     * 由框架窗口载入完毕后调用（frameElement.Config.ready）。
     * ready：
     * - 初始载入时返回用户就绪回调（option.onready）的值。
     * - 重载方式下无值返回（undefined）。
     */
    _ready() {
        if ( !this.restore ) {
            return this._init( this );
        }
        this.restore( this._store );
        this.restore = null;
    }


    /**
     * 暂存数据恢复。
     * 从上层用户页面的暂存区恢复到下层编辑器内。
     * @param {Map} store 存储空间
     */
    _restore( store ) {
        if ( store.size == 0 ) {
            return;
        }
        this.heading( store.get('heading') );
        this.subtitle( store.get('subtitle') );
        this.abstract( store.get('abstract') );
        this.content( store.get('content') );
        this.seealso( store.get('seealso') );
        this.reference( store.get('reference') );

        store.clear();
    }


    /**
     * 取值或设置值代理。
     * 框架子窗口中的 "Api" 名称空间包含：{
     *      .heading(...)   设置/获取标题
     *      .subtitle(...)  设置/获取子标题
     *      .abstract(...)  设置/获取文章提要
     *      .content(...)   设置/获取正文内容
     *      .seealso(...)   设置/获取另参见
     *      .reference(...) 设置/获取参考文献
     *      .theme(...)     设置/获取编辑器主题
     *      .style(...)     设置/获取内容风格
     * }
     * @param  {String} name 取值名
     * @param  {String} html 待设置源码
     * @return {String|this}
     */
    _proxy( name, html ) {
        let _fn = this._frame.contentWindow.Api[name];
        return html == undefined ? _fn() : ( _fn(html), this );
    }

}



// 编辑器实例计数。
let __Counts = 0;


/**
 * 创建默认的编辑器实例名。
 * @return {String}
 */
function getName() {
    return __Prefix + __Counts++;
}


/**
 * 创建编辑器容器。
 * @param  {Number|String} width 宽度
 * @param  {Number|String} height 高度
 * @return {Element} iframe 节点
 */
function editorBox( width, height ) {
    let _frm = document.createElement('iframe');

    _frm.setAttribute('scrolling', 'no');
    _frm.setAttribute('frameborder', '0');

    for ( let [k, v] of Object.entries(__frameStyles) ) {
        _frm.style[k] = v;
    }
    if ( width ) _frm.style.width = sizeValue(width);
    if ( height ) _frm.style.height = sizeValue(height);

    return _frm;
}


/**
 * 构建编辑器选项集。
 * 配置参数：编辑器根据用户的配置执行相应的行为。
 * 回调函数：根据用户的指令，编辑器会：
 * - 请求上层用户页面执行某些特定功能（如窗口最大化）。
 * - 通知当前编辑状态，上层用户页面可能需要完成自己的逻辑（如保存）。
 * 注：大多数由用户配置而来。
 * @param  {String} name 编辑器实例名
 * @param  {Object} user 用户配置集
 * @param  {Function} ready 编辑器就绪回调
 * @return {Object}
 */
function editorOption( name, user, ready ) {
    return {
        name:           name,
        theme:          user.theme,
        style:          user.style,
        updatetime:     user.updatetime,
        needRecover:    user.needRecover,
        ready:          ready,
        maximize:       user.onmaximize,
        save:           user.onsaved,
        append:         user.onappended,
        earse:          user.onearsed,
    };
}


/**
 * 获取尺寸值。
 * 数值可包含单位，无单位默认为像素。
 * @param  {Number|String} val 尺寸值
 * @return {String}
 */
function sizeValue( val ) {
    return isNaN( val - parseFloat(val) ) ? val : `${val}px`;
}

})( yyEd );
