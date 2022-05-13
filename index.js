//! $ID: index.js 2021.12.25 Cooljed.User $
// ++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  上层用户页的基础工具定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { ROOT, Local } from "./config.js";
import { Tpb, BaseOn, BaseBy, customGetter, processExtend } from "./base/tpb/tpb.esm.js";


const
    On = Object.create( BaseOn ),
    By = Object.create( BaseBy ),

    // 本地存储键
    //-------------------------------------------

    storeStyle = {
        theme:  'Theme',    // 编辑器主题
        style:  'Style',    // 内容样式
        codes:  'Codes',    // 内容代码样式
    },

    // 保存编辑器实例。
    saveEditor = ed => ( __editor = ed );



//
// 编辑器实例存储。
// 用于调用Api接口设置样式等操作。
//
let __editor = null;


const Kit = {
    /**
     * 获取本地存储的样式风格名。
     * @param  {...String} names 样式类型名（theme|style|codes）
     * @return {[String]}
     */
    styles( evo, ...types ) {
        let _fix = __editor.name();
        return types.map( k => localStyle(_fix, k) );
    },


    /**
     * 设置&保存主题样式。
     * 如果主题名以 .css 结尾，表示已经是一个样式文件，
     * 但该文件依然局限于主题目录之下。
     * @data: String 主题名
     * @return {void}
     */
    theme( evo ) {
        let _pf = evo.data;

        if ( !_pf.endsWith('.css') ) {
            _pf = `${evo.data}/${Local.themeStyle}`;
        }
        __editor.theme(
            `${ROOT}${Local.themes}/${_pf}`
        );
        localStyle( __editor.name(), 'theme', evo.data );
    },

    __theme: 1,


    /**
     * 设置&保存内容样式。
     * @data: String 内容样式名
     * @return {void}
     */
    main( evo ) {
        __editor.style(
            `${ROOT}${Local.styles}/${evo.data}/${Local.mainStyle}`
        );
        localStyle( __editor.name(), 'style', evo.data );
    },

    __main: 1,


    /**
     * 设置&保存代码样式。
     * @data: String 代码样式名
     * @return {void}
     */
    codes( evo ) {
        __editor.codes(
            `${ROOT}${Local.styles}/${evo.data}/${Local.codeStyle}`
        );
        localStyle( __editor.name(), 'codes', evo.data );
    },

    __codes: 1,

};


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////

/**
 * 获取目标样式URL的本地存储键。
 * @param  {String} prefix 存储键前缀
 * @param  {String} type 样式类型名（theme|style|codes）
 * @return {String}
 */
function styleKey( prefix, type ) {
    return `${prefix}_${storeStyle[type]}`;
}


/**
 * 获取/存储目标类型样式的本地值。
 * name实参未定义时为获取。
 * @param  {String} prefix 存储键前缀
 * @param  {String} type 样式类型名（theme|style|codes）
 * @param  {String} name 待保存的样式风格名，可选
 * @return {String|null}
 */
function localStyle( prefix, type, name ) {
    let _key = styleKey( prefix, type );

    if ( name === undefined ) {
        return window.localStorage.getItem( _key ) || null;
    }
    window.localStorage.setItem( _key, name );
}


/**
 * 目录折叠（整体）。
 * 包含两个行为：
 * - 单击目录标签名（<a>）定位到文章主标题。
 * - 单击标签本身（<h4>）折叠整个目录。
 * @param {Element} nav 目录根元素
 */
function tocFold_toTop( nav ) {
    Tpb.build( nav, {
        on: `click(~h4)|evo(3) fold(2) ('auto');
            click(h4>a)|$('1/h1') intoView (-100)`,

        // 覆盖外部固定高度样式。
        to: `|toggleStyle('height');
            html|scrollTop(true)`
    });
}


/**
 * 目录子表折叠动作。
 * - 单击链接条目定位到目标章节。
 * - 单击目录标题条子表折叠子表。
 * @param  {Element} casc 目录列表根
 * @return {void}
 */
function tocFoldSub_toTop( casc ) {
    Tpb.build( casc, {
        on: `click(a)|evo(2) pathx('nav[role=toc]', 'li') str('>section:nth-of-type(', ')') join str('/', '>h2') $('article') pop $(_1) intoView (-30);
            click(~h5)|evo(2) parent fold(2)`,
        to: 'html|scrollTop(true, true)'
    });
}


/**
 * 目录滚动条隐藏切换。
 * @param  {Element} casc 目录列表根
 * @return {void}
 */
function tocHover( casc ) {
    Tpb.build( casc, {
        on: "mouseenter|('auto'); mouseleave|('hidden')",
        to: "|css('overflow-y'); |css('overflow-y')"
    });
}


/**
 * 目录宽度可调动作。
 * 注记：
 * 控制根用于鼠标移动时带动目录宽度变化，以及释放鼠标时取消移动绑定。
 * 拖动目标应当在控制根之内，鼠标按下时激活控制根的拖动处理（注册绑定）。
 * @param {Element} hr 拖动目标
 * @param {String} root 主体控制根选择器（不支持二阶选择器）。
 */
function tocWidth( hr, root ) {
    let _box = $.get( root );

    // 移动&取消控制根。
    // 文章主体左边距跟着变化（目录在左侧）。
    Tpb.build( _box, {
        on: `@mousemove:h|movementX dup pass dup;
            @mouseup:x|movementX(null);
            margin_ml|$('main.content') css('margin-left') int ev('detail') add(_1) add('px')`,
        to: `nav[role=toc]|width(true)|pop goto('margin_ml');
            |off('mousemove');
            main.content|%marginLeft`
    });
    // 拖动目标。
    Tpb.build( hr, {
        on: `mousedown|$('nav/') css('position') eq('fixed') pass avoid`,
        to: `${root}|bind('mousemove:h') once('mouseup:x')`
    });
}


/**
 * 内容风格切换。
 * 避免从零渲染时内容大幅跳动，<link>导入顺序如下：
 * - 先导入新的样式（在旧样式之前）。
 * - 然后删除旧样式<link>元素。
 * dark实参为目标风格<option>内的特性名，标记当前风格是否为暗色调。
 * @param {Element} selx 选单元素（change者）
 * @param {String} dark 暗风格标记特性名
 */
function styleSwitch( selx, dark ) {
    Tpb.build( selx, {
        on: `change|$('#s-code') dup ('s-code') evo(3) val str('../styles/', '/codes.css') pack(2) obj('id href') pop;
            change|$('#s-main') dup ('s-main') evo(3) val str('../styles/', '/main.css') pack(2) obj('id href') pop`,
        by: `style(_1) vain remove;
            style(_1) vain remove ('_dark') evo(3) prop('selected') attr('${dark}') bool`,
        to: `-;
            body|toggleClass(_1)`
    });
}


/**
 * 恢复本地暂存的源码。
 * 如果本地没有内容则简单略过（不影响已有内容）。
 * @param  {Editor} ed 编辑器实例
 * @param  {String} evn 触发导入的事件名
 * @return {Editor} ed
 */
function recover( ed, evn ) {
    let _data = ed.savedhtml();
    if ( _data ) $.trigger( ed.frame(), evn, _data );
    return ed;
}


/**
 * 首次导入学习内容。
 * @param  {Element} btn 学习条目
 * @param  {String} evn 触发事件名
 * @return {void}
 */
function firstLearn( btn, evn ) {
    if ( !__editor.content().trim() ) $.trigger( btn, evn );
}


// 小玩具
//0000000000000000000000000000000000000

const $ = window.$;

/**
 * 间歇执行器（玩具）。
 * 如果用户执行器返回true则终止计时器。
 * @param  {Number} sec 间隔秒数
 * @param  {String} slr 目标选择器
 * @param  {Function} handle 执行器
 * @return {void}
 */
function tickdoing( sec, slr, handle = logoColor ) {
    handle( slr ) ||
    setTimeout( () => tickdoing(sec, slr, handle), sec );
}


let _val = 100, _sel = null;

// 点亮Logo彩色
function logoColor( slr ) {
    if ( _val < 0 ) {
        return true;
    }
    if ( _sel ) {
        $.remove( _sel );
    }
    _sel = $.style( `${slr}{filter:grayscale(${_val--/100})}` );
}



//
// 用户页构建。
//////////////////////////////////////////////////////////////////////////////

Tpb.init( On, By ).build( document.body );



//
// On/By 扩展
//////////////////////////////////////////////////////////////////////////////

// 简单取值。
customGetter( On, 'styles', Kit.styles );


// 简单设置。
processExtend( By, 'Kit', Kit, [
    'theme',
    'main',
    'codes',
]);



//
// 导出
//////////////////////////////////////////////////////////////////////////////

export {
    saveEditor, recover, firstLearn, tickdoing,
    tocFoldSub_toTop, tocFold_toTop, tocHover, tocWidth, styleSwitch
};


//:debug
window.On = On;
window.By = By;
