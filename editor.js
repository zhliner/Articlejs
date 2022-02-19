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
//      ecitor.load( box )
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
//      oncontent: Function     内容源码导入回调，会在编辑器构建就绪后自动触发。
//                              接口：function(): String|null|Promise<String|null>
//                              源码会填充到编辑器内容区，null表示忽略。
//  }
//
//  事件接口：
//      用户可以对编辑器实例内的 <iframe> 元素发送事件：
//      cimport   递送源码作为内容导入，该操作会进入历史栈（可 Undo）。
//
//
//  Editor接口：
//      .load(): Promise<Editor> 编辑器初始化
//      .frame(): Element       获取编辑器根元素（<iframe>）
//
//      下面接口由编辑器实现提供
//      .heading( html ): String        获取/设置主标题
//      .subtitle( html, add ): String  获取/设置副标题
//      .abstract( h4, html ): String   获取/设置文章提要
//      .article( html ): String        获取/设置文章主体内容
//      .seealso( h4, html ): String    获取/设置另参见
//      .reference( h4, html ): Strin   获取/设置文献参考
//      .footer( h4, html ): Strin      获取/设置文章声明
//      .content( html ): String        获取/设置文章全部内容
//      .toc( h4 ): String              获取文章目录源码
//      .savedhtml: String              获取本地暂存的内容源码
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

import { ROOT, Sys } from "./config.js";


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
    __saveName  = 'coolj';



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
     * 根模板文件相对于编辑器根（如 Local.editor）。
     * @param  {Element} box 容器元素
     * @param  {String} file 编辑器根模板文件
     * @return {Promise<Editor>}
     */
    load( box, file ) {
        this._ifrm.setAttribute(
            'src',
            `${ROOT}${file}`
        );
        this._file = file;
        this._ebox = box;

        return new Promise( this._init.bind(this, box) );
    }


    /**
     * 获取编辑器实例的名称。
     * @return {String}
     */
    name() {
        return this._ifrm.Config.name;
    }


    /**
     * 获取编辑器框架容器。
     * @return {Element}
     */
    frame() {
        return this._ifrm;
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
     * @param  {String} h4 小标题
     * @param  {String} html 内容源码
     * @return {[String2]|null|this}
     */
    abstract( h4, html ) {
        return this._value( 'abstract', h4, html );
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
     * @param  {String} h4 小标题
     * @param  {String} html 内容源码
     * @return {[String, [String]]|null|this} [小标题, 内容清单（<li>内容集）]
     */
    seealso( h4, html ) {
        return this._value( 'seealso', h4, html );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} h4 小标题
     * @param  {String} html 内容源码
     * @return {[String, [String]]|null|this} [小标题, 内容清单（<li>内容集）]
     */
    reference( h4, html ) {
        return this._value( 'reference', h4, html );
    }


    /**
     * 获取/设置文章声明。
     * @param  {String} h4 小标题
     * @param  {String} html 内容源码
     * @return {[String2]|null|this} [小标题, 内容源码]
     */
    footer( h4, html ) {
        return this._value( 'footer', h4, html );
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
     * 获取目录（大纲）。
     * 注：没有设置的功能。
     * h4 的默认值为 config.js 中的 Tips.tocLabel 配置。
     * @param  {String} h4 目录标题条文本，可选
     * @return {String}
     */
    toc( h4 ) {
        return this._value( 'toc', h4 );
    }


    /**
     * 获取本地暂存的内容源码。
     * @return {String}
     */
    savedhtml() {
        return this._value( 'savedhtml' );
    }


    /**
     * 获取/设置编辑器主题。
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
     * @param  {String} name 取值名
     * @param  {...Value} rest 附带实参序列
     * @return {String|this}
     */
    _value( name, ...rest ) {
        let _val = this._ifrm.contentWindow.Api[name]( ...rest );
        return _val !== undefined ? _val : this;
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
    // 注：设置的内容进入编辑历史栈。
    _frm.addEventListener( Sys.cimport, ev => trigger(_frm.contentWindow, Sys.cimport, ev.detail) );

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
 * 编辑器创建。
 * 非常规的提交可能不需要<textarea>容器。
 * @param  {Object} option 配置集
 * @return {Editor} 编辑器实例
 */
const create = option => new Editor( option || {} );


// 导出
//////////////////////////////////////////////////////////////////////////////


export default { create  };
