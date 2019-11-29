//! $Id: main.js 2019.11.16 Articlejs.User $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  使用：
//      let editor = jcEd.create( option ); // 创建一个编辑器实例
//      box.append( editor.element() );     // 编辑器插入某容器
//
//  option {
//      name:       String      编辑器实例命名（关联本地存储），可选
//      theme:      String      默认主题，可选
//      style:      String      默认样式，可选
//      width:      String      宽度（可含单位），可选，默认900px
//      height:     String      高度（可含单位），可选，默认700px
//      update:     Number      上次更新时间，仅修改时存在。可选
//      recover:    Boolean     内容是否本地恢复（localStorage），可选
//
//      onready:    Function    编辑器就绪回调，接口：function( editor ): void
//      onmaximize: Function    最大化请求，接口：function(): void
//      onsaved:    Function    存储回调（用户按[s]键），接口：function( html ): void
//      onappended: Function    内容条目添加回调，接口：function( path, html ): void
//      onearsed:   Function    内容条目删除回调，接口：function( [path] ): void
//  }
//
//  editor接口：
//      .heading( code:String ): String|this    获取/设置主标题
//      .subtitle( code:String ): String|this   获取/设置副标题
//      .abstract( code:String ): String|this   获取/设置文章提要
//      .content( code:String ): String|this    获取/设置正文（源码）
//      .seealso( code:String ): String|this    获取/设置另参见
//      .reference( code:String ): String|this  获取/设置文献参考
//      .theme( name:String, isurl:Boolean ): String|this   获取/设置主题
//      .style( name:String, isurl:Boolean ): String|this   获取/设置内容样式
//
//      .element(): Element                     编辑器根元素（用于插入DOM）
//      .notify( key:String, val:Any ): this    消息通知（如上传更新）
//      .reload( url:String, callback:Function ): void  重新载入编辑器
//
//  key/val [
//      upload,                 上传更新开始
//      uploading/[process],    上传更新中，值为进度
//      uploaded,               上传更新结束
//      ...
//  ]
//
//  注记：
//  用户可以在一个页面中创建多个编辑器实例，但管理代码需自行编写。
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
const jcEd = {};


(function( jcEd ) {

    // 高宽配置：
    // chrome 正常。
    // firefox 通过容器resize实现。
    // Edge/IE 无效。
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
        // 主题存储目录
        themeDir    = 'themes',

        // 内容样式存储目录
        styleDir    = 'styles',

        // 命名前缀。
        // 用于无命名时构建默认的编辑器实例名。
        __Prefix    = 'jcEd-';



/**
 * 编辑器创建。
 * 注：非常规的提交可能不需要<textarea>容器。
 * @param  {Object} option 配置集
 * @return {Editor} 编辑器实例
 */
jcEd.create = option => new Editor( option );


//
// 编辑器实现。
// 构建多个编辑器时可创建多个实例。
//
class Editor {
    /**
     * 创建编辑器。
     * @param {Object} option 初始选项
     */
    constructor( option ) {
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

        _ifrm.setAttribute('src', __PATH + '/editor.html');
    }


    /**
     * 获取/设置主标题。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    heading( code ) {
        return this._proxy( 'heading', code );
    }


    /**
     * 获取/设置副标题。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    subtitle( code ) {
        return this._proxy( 'subtitle', code );
    }


    /**
     * 获取/设置文章提要。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    abstract( code ) {
        return this._proxy( 'abstract', code );
    }


    /**
     * 获取/设置正文内容。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    content( code ) {
        return this._proxy( 'content', code );
    }


    /**
     * 获取/设置另参见。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    seealso( code ) {
        return this._proxy( 'seealso', code );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    reference( code ) {
        return this._proxy( 'reference', code );
    }


    /**
     * 消息通知。
     * 对框架子窗口发送消息和值。
     * 子窗口需要导入tQuery库并绑定处理器。
     * 子窗口事件消息名前置"editor:"字符串以避免冲突。
     * @param {String} key 消息键
     * @param {Value} val 消息值
     */
    notify( key, val ) {
        let _win = this._frame.contentWindow;
        _win.$.trigger( _win, `editor:${key}`, val );
    }


    /**
     * 编辑器重载。
     * 暂存内容后载入目标实现页（如语言界面切换）。
     * pathfile 包含子路径（相对于编辑器根目录）和扩展名。
     * callback: function(store): void。
     * @param  {String} pathfile 实现页
     * @param  {Function} callback 用户回调，可选
     * @return {void}
     */
    reload( pathfile, callback = null ) {
        this._store
            .set( 'heading', this.heading() )
            .set( 'subtitle', this.subtitle() )
            .set( 'abstract', this.abstract() )
            .set( 'content', this.content() )
            .set( 'seealso', this.seealso() )
            .set( 'reference', this.reference() );

        this.restore = callback || this._restore;
        this._frame.setAttribute( 'src', `${__PATH}/${pathfile}` );
    }


    /**
     * 获取编辑器实例根容器元素。
     * @return {Element}
     */
    element() {
        return this._frame;
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
            isurl ? name : `${__PATH}/${themeDir}/${name}/style.css`
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
            isurl ? name : `${__PATH}/${styleDir}/${name}/main.css`
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
     * 框架子窗口内"Editor"名称空间需包含目标接口：{
     *      heading     标题
     *      subtitle    子标题
     *      abstract    文章提要
     *      content     正文内容
     *      seealso     另参见
     *      reference   参考文献
     *      theme       编辑器主题
     *      style       内容风格
     * }
     * @param  {String} name 取值名
     * @param  {String} code 待设置源码
     * @return {String|this}
     */
    _proxy( name, code ) {
        let _fn = this._frame.contentWindow.Editor[name];
        return code == undefined ? _fn() : ( _fn(code), this );
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
 * 注：大多数由用户配置而来。
 * @param  {String} name 编辑器实例名
 * @param  {Object} user 用户配置集
 * @param  {Function} ready 编辑器就绪回调
 * @return {Object}
 */
function editorOption( name, user, ready ) {
    return {
        name:       name,
        theme:      user.theme,
        style:      user.style,
        update:     user.update,
        recover:    user.recover,
        ready:      ready,
        maximize:   user.onmaximize,
        save:       user.onsaved,
        append:     user.onappended,
        earse:      user.onearsed,
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

})( jcEd );
