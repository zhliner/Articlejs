//! $ID: index.js 2019.11.16 Articlejs.User $
// ++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  用法：
//      // 创建一个编辑器实例。
//      import coolj from './index.js';
//      let editor = coolj.create( option, root );
//
//      // 编辑器初始化，
//      // 完成之后即可执行用户页逻辑。
//      ecitor.init().then( ... );
//
//      // 将编辑器插入box容器。
//      // 这是一种兼容性比较好的做法，当然也可以直接使用<iframe>作为外框架，
//      // 此时通常应该设置宽高样式以覆盖默认的100%。
//      box.append( editor.frame() );
//
//  option {
//      name: String            编辑器实例命名（关联本地存储）
//      theme: String           默认主题名称，可选
//      style: String           默认内容样式名称，可选
//      width: Number|String    宽度（数值时表示像素），可选，默认100%
//      height: Number|String   高度（数值时表示像素），可选，默认100%
//      updatetime: Number      上次更新时间，仅修改时存在。可选
//      recover: Boolean        需要本地内容恢复（localStorage），可选
//
//      onsaved: Function       存储回调（用户按[s]键），接口：function( html ): void
//      onmaximize: Function    最大化请求，接口：function(): void
//  }
//
//  Editor接口：
//      .init(): Promise<void>  编辑器初始化
//      .frame(): Element       获取编辑器根元素（<iframe>）
//      .reload(): Promise      重新载入编辑器
//
//      下面接口由编辑器实现提供
//      .heading( html:String ): String     获取/设置主标题
//      .subtitle( html:String ): String    获取/设置副标题
//      .abstract( html:String ): String    获取/设置文章提要
//      .content( html:String ): String     获取/设置正文（源码）
//      .seealso( html:String ): String     获取/设置另参见
//      .reference( html:String ): Strin    获取/设置文献参考
//      .theme( name:String, isurl:Boolean ): String    获取/设置主题
//      .style( name:String, isurl:Boolean ): String    获取/设置内容样式
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
//  解决：如果要同时兼顾Firefox，可以将上级容器padding一个距离，以便操作。
//
//
///////////////////////////////////////////////////////////////////////////////
//


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

    // 编辑器根文件（模板）
    __tplRoot   = 'templates/editor.html';



//
// 编辑器实现。
// 构建多个编辑器时可创建多个实例。
//
class Editor {
    /**
     * 创建编辑器。
     * @param {Object} option 配置集
     * @param {String} root 编辑器根目录路径
     */
    constructor( option, root ) {
        let _ifrm = editorFrame( option.width, option.height );

        _ifrm.Config = {
            name:       option.name || __saveName,
            theme:      option.theme,
            style:      option.style,
            updatetime: option.updatetime,
            recover:    option.recover,
            save:       option.onsaved || empty,
            maximize:   option.onmaximize || empty,
        };
        this._path = root;
        this._ifrm = _ifrm;

        // 编辑器根模板文件
        this._file = null;
    }


    /**
     * 编辑器初始化。
     * 可传入自定义的根模板文件，相对于编辑器根。
     * @param  {String} file 编辑器根模板文件，可选
     * @return {Promise<void>}
     */
    init( file = __tplRoot ) {
        this._ifrm.setAttribute(
            'src',
            `${this._path}/${file}`
        );
        this._file = file;
        return new Promise( this._init.bind(this) );
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
     * 会自动恢复本地存储，因此执行前用户可能需要先保存（[s]）。
     * 与.init()的逻辑相似。
     * 注记：
     * 并不会自动保存编辑器当前最新内容，这给用户一个移除自上次保存以来新内容的可能。
     * file参数提供重载入另一套模板的可能性。
     * @param  {String} file 编辑器根模板文件，可选
     * @return {Promise<void>}
     */
    reload( file ) {
        this._ifrm.Config.recover = true;
        return this.init( file || this._file );
    }


    // 内容存取接口
    ////////////////////////////////////////////////////////////////


    /**
     * 获取/设置主标题。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    heading( html ) {
        return this._value( 'heading', html );
    }


    /**
     * 获取/设置副标题。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    subtitle( html ) {
        return this._value( 'subtitle', html );
    }


    /**
     * 获取/设置文章提要。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    abstract( html ) {
        return this._value( 'abstract', html );
    }


    /**
     * 获取/设置正文内容。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    content( html ) {
        return this._value( 'content', html );
    }


    /**
     * 获取/设置另参见。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    seealso( html ) {
        return this._value( 'seealso', html );
    }


    /**
     * 获取/设置文献参考。
     * @param  {String} html 内容源码
     * @return {String|this}
     */
    reference( html ) {
        return this._value( 'reference', html );
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
            return this._value( 'theme' );
        }
        return this._value( 'theme', name, isurl );
    }


    /**
     * 获取/设置内容样式。
     * @param  {String} name 主样式文件
     * @param  {Boolean} isurl 自定义URL
     * @return {String|this}
     */
    style( name, isurl ) {
        if ( name === undefined ) {
            return this._value( 'style' );
        }
        return this._value( 'style', name, isurl );
    }


    /**
     * 获取/设置内容代码样式。
     * @param  {String} name 主样式文件
     * @param  {Boolean} isurl 自定义URL
     * @return {String|this}
     */
    codes( name, isurl ) {
        if ( name === undefined ) {
            return this._value( 'codes' );
        }
        return this._value( 'codes', name, isurl );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 初始化回调设置。
     * @param  {Function} resolve 载入就绪回调
     * @param  {Function} reject 载入失败回调
     * @return {void}
     */
    _init( resolve, reject ) {
        this._ifrm.Config.fail = reject;
        this._ifrm.Config.ready = resolve;
    }


    /**
     * 通用取值/设置。
     * 编辑器框架内全局 Api: {
     *      .heading()    设置/获取标题
     *      .subtitle()   设置/获取子标题
     *      .abstract()   设置/获取文章提要
     *      .content()    设置/获取正文内容
     *      .seealso()    设置/获取另参见
     *      .reference()  设置/获取参考文献
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

    _frm.setAttribute('scrolling', 'no');
    _frm.setAttribute('frameborder', '0');

    for ( let [k, v] of Object.entries(__frameStyles) ) {
        _frm.style[k] = v;
    }
    if ( width !== undefined ) {
        _frm.style.width = sizeValue( width );
    }
    if ( height !== undefined ) {
        _frm.style.height = sizeValue( height );
    }
    return _frm;
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
 * @param  {String} path 编辑器所在目录路径（相对于Web根）
 * @return {Editor} 编辑器实例
 */
const create = (option, path) => new Editor( option, path );


// 导出
//////////////////////////////////////////////////////////////////////////////

export default { create }
