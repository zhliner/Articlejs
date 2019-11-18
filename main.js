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
//      textarea.after( editor.element() ); // 编辑器根元素插入某位置
//
//  option {
//      name:       String      编辑器实例命名（关联本地存储），可选
//      theme:      String      默认主题，可选
//      style:      String      默认样式，可选
//      width:      String      宽度（含单位），可选，默认800px
//      height:     String      高度（含单位），可选，默认600px
//      update:     Number      上次更新时间，仅修改时存在。可选
//      recover:    Boolean     内容是否本地恢复（localStorage），可选
//
//      onready:    Function    编辑器就绪回调，接口：function( editor ): void
//      onmaximize: Function    最大化请求，接口：function(): void
//      onsaved:    Function    存储回调（用户按[s]键），接口：function( html ): void
//      onearsed:   Function    内容条目删除回调，接口：function( paths ): void
//  }
//
//  editor接口：
//      .heading( code:String ): String|this    获取/设置主标题
//      .subtitle( code:String ): String|this   获取/设置副标题
//      .abstract( code:String ): String|this   获取/设置文章提要
//      .content( code:String ): String|this    获取/设置正文（源码）
//      .seealso( code:String ): String|this    获取/设置另参见
//      .reference( code:String ): String|this  获取/设置文献参考
//      .notify( key:String, val:Any ): this    消息通知（如上传更新）
//      .element(): Element                     编辑器根元素（用于插入DOM）
//      .reload( url:String, callback ): void   重载编辑器实现页
//      注：
//      与文章正文并列的内容单元都有一个获取/设置接口。
//
//  key/val [
//      upload,                 上传更新开始
//      uploading/[process],    上传更新中，值为进度
//      uploaded,               上传更新结束
//      ...
//  ]
//
//  注记：
//  用户可以在一个页面中创建多个编辑器实例，但管理代码需要自行编写。
//
///////////////////////////////////////////////////////////////////////////////
//


// 名称空间。
// 可更改，但需与末端名称相同。
const jcEd = {};


(function( jcEd ) {

    // 容器样式。
    // 几个零值为预防性设置。
    const __Styles = {
        div: {
            width:          '800px',  // 默认值
            height:         '600px',
            display:        'inline-block',
            resize:         'both',
            overflow:       'hidden',
            padding:        '6px',  // IE&FF 误差修正
            border: 		'1px #999 dotted',
            borderRadius:   '3px',
            zIndex: 		1001,  // 关灯层之上（如果有）
        },

        iframe: {
            width:          '100%',
            height:         '100%',
            resize:         'none',  // chrome需要
            padding:        0,
            margin:         0,
            borderWidth:    0,
            borderRadius:   '3px',  // 同上容器
            float:          'left',
        },
    };


    // 当前文件所在路径。
    const __PATH = (function() {
            let _els = document.getElementsByTagName('script'),
                _src = _els[_els.length-1].src;
            return _src.substring(0, _src.lastIndexOf('/'));
        })();


    // 命名前缀。
    // 用于无命名时构建默认的编辑器实例名。
    const __Prefix = 'jcEd-';



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
        return this._value( 'heading', code );
    }


    /**
     * 获取/设置副标题。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    subtitle( code ) {
        return this._value( 'subtitle', code );
    }


    /**
     * 获取/设置文章提要。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    abstract( code ) {
        return this._value( 'abstract', code );
    }


    /**
     * 获取/设置正文内容。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    content( code ) {
        return this._value( 'content', code );
    }


    /**
     * 获取/设置另参见。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    seealso( code ) {
        return this._value( 'seealso', code );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} code 内容源码
     * @return {String|this}
     */
    reference( code ) {
        return this._value( 'reference', code );
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
     * callback: function(store): void。
     * @param  {String} file 实现页
     * @param  {Function} callback 用户回调，可选
     * @return {void}
     */
    reload( file, callback = null ) {
        this._store
            .set( 'heading', this.heading() )
            .set( 'subtitle', this.subtitle() )
            .set( 'abstract', this.abstract() )
            .set( 'content', this.content() )
            .set( 'seealso', this.seealso() )
            .set( 'reference', this.reference() );

        this.restore = callback || this._restore;
        this._frame.setAttribute( 'src', __PATH + file );
    }


    /**
     * 获取编辑器实例根容器元素。
     * @return {Element}
     */
    element() {
        return this._frame.parentElement;
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
     * 取值或设置值。
     * 框架子窗口内"Editor"名称空间需包含目标接口。
     * @param  {String} name 取值名
     * @param  {String} code 待设置源码
     * @return {String|this}
     */
    _value( name, code ) {
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
 * 批量添加样式。
 * @param {Node} el 目标元素
 * @param {Object} conf 样式定义集
 */
function setStyles( el, conf ) {
    for ( let [k, v] of Object.entries(conf) ) {
        el.style[k] = v;
    }
}


/**
 * 创建编辑器容器。
 * @param  {Number|String} width 宽度
 * @param  {Number|String} height 高度
 * @return {Element} iframe 节点
 */
function editorBox( width, height ) {
    let _box = document.createElement('div'),
        _frm = document.createElement('iframe');

    setStyles(_box, __Styles.div);
    setStyles(_frm, __Styles.iframe);

    _frm.setAttribute('frameborder', '0');
    _frm.setAttribute('scrolling', 'no');

    if ( width ) _box.style.width = width;
    if ( height ) _box.style.height = height;

    return _box.appendChild(_frm);
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
        earse:      user.onearsed,
        save:       user.onsaved,
    };
}

})( jcEd );
