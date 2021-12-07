//! $ID: editor.js 2021.12.25 Cooljed.Base $
// +++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  用法：
//      // 创建一个编辑器实例。
//      import coolj from './editor.js';
//      let editor = coolj.create( option );
//
//      // 编辑器初始化。
//      // 传递编辑器插入需要的容器元素，之后即为用户页逻辑。
//      // 注意：
//      // - 编辑器的默认高/宽样式为 100%，通常需要一个空容器。
//      // - 最后把焦点交给编辑器窗口可便于快捷键操作。
//      ecitor.init( box )
//          .then( ed => ... ed.frame().contentWindow.focus() );
//
//  option {
//      name: String            编辑器实例命名（关联本地存储）
//      theme: String           默认主题名称，可选
//      style: String           默认内容样式名，可选
//      codes: String           默认的代码样式名，可选
//      width: Number|String    宽度（数值时表示像素），可选，默认100%
//      height: Number|String   高度（数值时表示像素），可选，默认100%
//
//      onsaved: Function       存储回调（用户按[s]键），接口：function(html): Boolean
//                              返回true则取消本地存储。
//      onmaximize: Function    最大化请求，接口：function( state:0|1 ): void
//                              其中state: 0 取消最大化，1 最大化
//      oncontent: Function     内容源码导入请求，接口：function(): Promise<html|null>
//                              会在编辑器构建就绪后自动触发。
//                              承诺返回的源码会填充到编辑器内容区，但null值表示略过。
//      注：
//      - 上级用户也可以对<iframe>通过cimport事件递送数据导入源码内容，
//        该导入会进入编辑历史栈，即可撤销。
//      - 若指定主题、内容、代码的默认样式名，仅限于本地安装的样式。
//  }
//
//  Editor接口：
//      .init(): Promise<Editor> 编辑器初始化
//      .frame(): Element       获取编辑器根元素（<iframe>）
//      .reload(): Promise      重新载入编辑器
//
//      下面接口由编辑器实现提供
//      .heading( html ): String        获取/设置主标题
//      .subtitle( html, add ): String  获取/设置副标题
//      .abstract( h3, html ): String   获取/设置文章提要
//      .article( html ): String        获取/设置文章主体内容
//      .seealso( h3, html ): String    获取/设置另参见
//      .reference( h3, html ): Strin   获取/设置文献参考
//      .footer( h3, html ): Strin      获取/设置文章声明
//      .content( html ): String        获取/设置文章全部内容
//
//      .theme( url:String ): String    获取/设置主题
//      .style( url:String ): String    获取/设置内容样式
//      .codes( url:String ): String    获取/设置内容代码样式
//
//
//  [兼容性]
//
//  - Firefox
//  不支持<iframe>元素的resize，因此无法直接拖动框架来改变编辑器大小。
//  解决：将<iframe>嵌入一个可resize的<div>或<span>元素。
//
//  - Chrome
//  元素<iframe>可以直接resize，但旧版本会遮盖住上级包装元素的resize拖拽角。
//  解决：如果要同时兼顾Firefox，可将上级容器padding一个距离，便于操作。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { ROOT, Local, Sys } from "./config.js";


//
// 编辑器框架样式默认值。
// resize：
// - chrome 正常。
// - firefox 需通过容器resize实现。
// - Edge/IE 无效。
//
const
    __frameStyles = {
        width:      '100%',
        height:     '100%',
        overflow:   'hidden',
        // 预防性设置
        border:     'none',
        boxSizing:  'border-box',
    },

    // 编辑器默认名。
    __saveName  = 'coolj',


    // 本地存储键
    //-------------------------------------------

    storeStyle = {
        theme:  'Theme',    // 编辑器主题
        style:  'Style',    // 内容样式
        codes:  'Codes',    // 内容代码样式
    };



//
// 编辑器实现。
// 构建多个编辑器时可创建多个实例。
//
class Editor {
    /**
     * 创建编辑器。
     * @param {Object} option 配置集
     */
    constructor( option ) {
        let _ifrm = editorFrame( option.width, option.height );

        _ifrm.Config = {
            name:       option.name || __saveName,
            theme:      option.theme,
            style:      option.style,
            codes:      option.codes,
            saver:      option.onsaved || empty,
            maximizer:  option.onmaximize || empty,
            // 默认传递null，不改变内容。
            contenter:  option.oncontent || ( () => Promise.resolve(null) ),
        };
        this._ifrm = _ifrm;

        // 编辑器根模板文件
        this._file = null;
        // 编辑器用户容器元素
        this._ebox = null;
    }


    /**
     * 编辑器初始化。
     * 可传入自定义的根模板文件，相对于编辑器根。
     * @param  {Element} box 容器元素
     * @param  {String} file 编辑器根模板文件，可选
     * @return {Promise<Editor>}
     */
    init( box, file = Local.editor ) {
        this._ifrm.setAttribute(
            'src',
            `${ROOT}${file}`
        );
        this._file = file;
        this._ebox = box;

        return new Promise( this._init.bind(this, box) );
    }


    /**
     * 获取编辑器框架容器。
     * @return {Element}
     */
    frame() {
        return this._ifrm;
    }


    /**
     * 编辑器重载。
     * 会自动恢复当前编辑器内容。
     * 如果传入新的模板根文件，可用于改变界面语言。
     * @param  {String} file 编辑器根模板文件，可选
     * @return {Promise<Editor>}
     */
    reload( file ) {
        let _cons = this.content();
        this._ifrm.Config.contenter = () => Promise.resolve( _cons );

        return this.init( this._ebox, file || this._file );
    }


    //
    // 内容存取接口
    // 注：设置的内容不进入编辑历史栈。
    ////////////////////////////////////////////////////////////////


    /**
     * 获取/设置主标题。
     * @param  {String} html 内容源码
     * @return {String|null|this}
     */
    heading( html ) {
        return this._value( 'heading', html );
    }


    /**
     * 获取/设置副标题。
     * @param  {String} html 内容源码
     * @param  {Boolean} add 末尾追加模式，可选
     * @return {[String]|this}
     */
    subtitle( html, add ) {
        return this._value( 'subtitle', html, add );
    }


    /**
     * 获取/设置文章提要。
     * @param  {String} h3 小标题
     * @param  {String} html 内容源码
     * @return {[String2]|null|this}
     */
    abstract( h3, html ) {
        return this._value( 'abstract', h3, html );
    }


    /**
     * 获取/设置正文内容。
     * @param  {String} html 内容源码
     * @return {String|null|this}
     */
    article( html ) {
        return this._value( 'article', html );
    }


    /**
     * 获取/设置另参见。
     * @param  {String} h3 小标题
     * @param  {String} html 内容源码
     * @return {[String, [String]]|null|this} [小标题, 内容清单（<li>内容集）]
     */
    seealso( h3, html ) {
        return this._value( 'seealso', h3, html );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} h3 小标题
     * @param  {String} html 内容源码
     * @return {[String, [String]]|null|this} [小标题, 内容清单（<li>内容集）]
     */
    reference( h3, html ) {
        return this._value( 'reference', h3, html );
    }


    /**
     * 获取/设置文章声明。
     * @param  {String} h3 小标题
     * @param  {String} html 内容源码
     * @return {[String2]|null|this} [小标题, 内容源码]
     */
    footer( h3, html ) {
        return this._value( 'footer', h3, html );
    }


    /**
     * 获取/设置内容整体。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    content( html ) {
        return this._value( 'content', html );
    }


    /**
     * 获取/设置编辑器主题。
     * 传递custom为真，表示用定制样式文件（全URL）。
     * @param  {String} url 主题样式URL
     * @return {String|this}
     */
    theme( url ) {
        if ( url === undefined ) {
            return this._value( 'theme' );
        }
        return this._value( 'theme', url );
    }


    /**
     * 获取/设置内容样式。
     * @param  {String} url 主样式URL
     * @return {String|this}
     */
    style( url ) {
        if ( url === undefined ) {
            return this._value( 'style' );
        }
        return this._value( 'style', url );
    }


    /**
     * 获取/设置内容代码样式。
     * @param  {String} url 主样式URL
     * @return {String|this}
     */
    codes( url ) {
        if ( url === undefined ) {
            return this._value( 'codes' );
        }
        return this._value( 'codes', url );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 初始化回调设置。
     * @param  {Element} box 容器元素
     * @param  {Function} resolve 载入就绪回调
     * @param  {Function} reject 载入失败回调
     * @return {void}
     */
    _init( box, resolve, reject ) {
        this._ifrm.Config.fail = reject;
        this._ifrm.Config.ready = () => resolve( this );

        box.append( this._ifrm );
    }


    /**
     * 通用取值/设置。
     * 编辑器框架内全局 Api: {
     *      .heading()    设置/获取标题
     *      .subtitle()   设置/获取子标题
     *      .abstract()   设置/获取文章提要
     *      .article()    设置/获取主体内容
     *      .seealso()    设置/获取另参见
     *      .reference()  设置/获取参考文献
     *      .footer()     设置/获取文章声明
     *      .content()    设置/获取文章全部内容
     *      .theme()      设置/获取编辑器主题
     *      .style()      设置/获取内容风格
     *      .codes()      设置/获取内容代码风格
     * }
     * @param  {String} name 取值名
     * @param  {...Value} rest 待设置实参序列
     * @return {String|this}
     */
    _value( name, ...rest ) {
        let _fn = this._ifrm.contentWindow.Api[name];

        if ( rest.length === 0 ) {
            return _fn();
        }
        return ( _fn(...rest), this );
    }

}


/**
 * 创建编辑器框架容器。
 * @param  {Number|String} width 宽度
 * @param  {Number|String} height 高度
 * @return {Element} iframe 节点
 */
function editorFrame( width, height ) {
    let _frm = document.createElement('iframe');

    _frm.setAttribute( 'scrolling', 'no' );
    _frm.setAttribute( 'frameborder', '0' );

    for ( let [k, v] of Object.entries(__frameStyles) ) {
        _frm.style[k] = v;
    }
    if ( width !== undefined ) {
        _frm.style.width = sizeValue( width );
    }
    if ( height !== undefined ) {
        _frm.style.height = sizeValue( height );
    }
    // 内容导入请求监听
    _frm.addEventListener( Sys.importCons, ev => trigger(_frm.contentWindow, Sys.importCons, ev.detail) );

    return _frm;
}


/**
 * 激发事件通知。
 * @param {Window} its 编辑器窗口
 * @param {String} evn 事件名
 * @param {Value} extra 发送的数据（内容源码）
 */
function trigger( its, evn, extra ) {
    its.dispatchEvent(
        new CustomEvent( evn, {
            detail: extra,
            bubbles: false,
            cancelable: true,
        })
    );
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


// 空操作占位
function empty() {}


/**
 * 获取目标样式URL的本地存储键。
 * @param  {String} name 样式类型名（theme|style|codes）
 * @return {String}
 */
function styleKey( name ) {
    return `${__saveName}_${storeStyle[name]}`;
}


/**
 * 获取目标类型样式URL的本地储存。
 * @param  {String} name 样式类型名（theme|style|codes）
 * @return {String|null}
 */
function localStyle( name ) {
    return window.localStorage.getItem( styleKey(name) ) || null;
}


/**
 * 复原本地存储的样式。
 * 在用户重新打开编辑器的时候有用。
 * @param  {Editor} ed 编辑器实例
 * @return {Editor} ed
 */
function recoverStyles( ed ) {
    let _theme = localStyle( 'theme' ),
        _main  = localStyle( 'style' ),
        _codes = localStyle( 'codes' );

    if ( _theme ) ed.theme( _theme );
    if ( _main )  ed.style( _main );
    if ( _codes ) ed.codes( _codes );
}


/**
 * 编辑器创建。
 * 非常规的提交可能不需要<textarea>容器。
 * @param  {Object} option 配置集
 * @return {Editor} 编辑器实例
 */
const create = option => new Editor( option || {} );


// 导出
//////////////////////////////////////////////////////////////////////////////


export default { create, styleKey, recoverStyles  };
