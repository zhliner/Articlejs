//! $Id: convert.js 2019.10.11 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元的转换定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { create, Content } from "./factory.js";


const $ = window.$;


//
// 自取元素标签集。
// 取元素自身（outerHTML）作为内容的元素。
// 结构单元（rb/rp/track等）不能单独使用，因此不适用。
// 注：大部分为内联元素。
//
const __outerTags = new Set([
    'audio',
    'video',
    'picture',
    'strong',
    'em',
    'q',
    'abbr',
    'cite',
    'small',
    'time',
    'del',
    'ins',
    'sub',
    'sup',
    'mark',
    'ruby',
    'dfn',
    'samp',
    'kbd',
    's',
    'u',
    'var',
    'bdo',
    'meter',
    'a',
    'code',
    'img',
    'i',
    'b',
    'span',  // :blank
    'hr',
]);


//
// 默认内容条目。
// 当源数据为内联节点时用于创建默认条目。
// { 目标内容名: 创建内容名 }
//
const __defaultConitem = {
    'Hgroup':       'H2',
    'Abstract':     'P',
    'Toc':          'Li',
    'Seealso':      'Li',
    'Reference':    'Li',
    'Header':       'P',
    'Footer':       'P',
    'Article':      'P',
    'S1':           'P',
    'S2':           'P',
    'S3':           'P',
    'S4':           'P',
    'S5':           'P',
    'Ul':           'Li',
    'Ol':           'Li',
    'Cascade':      'Li',
    'Codelist':     'Codeli',
    'Dl':           'Dd',
    'Table':        null,
    'Figure':       null,
    'Blockquote':   'P',
    'Aside':        'P',
    'Details':      'P',
    'Codeblock':    null,
};


//
// 数据转换映射。
// 针对目标类型（name），转换自身为最合适的数据集：
// {
//      child( el, name )   子级取值：prepend|append
//      fill( el, name )    填充取值：fill
// }
// 返回值：
// - 按目标类型提供一个值或值集。
// - null值表示忽略，空串为有值（清空目标）。
//////////////////////////////////////////////////////////////////////////////
//
const dataConvs = {
    Abstract() {
        //
    },


    Article() {
        //
    },


    S1() {
        //
    },


    S2() {
        //
    },


    S3() {
        //
    },


    S4() {
        //
    },


    S5() {
        //
    },


    Dl() {
        //
    },


    Figure() {
        //
    },


    Pre() {
        //
    },


    Li() {
        //
    },


    Table() {
        //
    },


    Thead() {
        //
    },


    Tbody() {
        //
    },


    Tfoot() {
        //
    },


    Tr() {
        //
    },
};


//
// 列表元素取值。
// 子元素：<li>
/////////////////////////////////////////////////
[
    'Seealso',
    'Reference',
    'Ul',
    'Ol',
    'Codelist',
    'Cascade',
]
.forEach(function( n ) {
    dataConvs[n] = (el, name) => list( el, name );
});


//
// 小区块取值。
// 包含可选的<h4>标题。
/////////////////////////////////////////////////
[
    'header',
    'footer',
    'blockquote',
    'aside',
    'details',
]
.forEach(function( n ) {
    //
});


// 内容行元素取值。
// 包含不能作为内联元素的<td>,<th>。
/////////////////////////////////////////////////
[
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'P',
    'Address',
    'Caption',
    'Summary',
    'Figcaption',
    'Dt',
    'Dd',

    'Th',
    'Td',
    'Rb',
    'Rp',
    'Rt',
]
.forEach(function( n ) {
    dataConvs[n] = (el, name) => defaultConitem( name, $.contents(el) );
});


//
// 取值辅助。
// 返回null表示无法取值，调用者应当忽略。
//////////////////////////////////////////////////////////////////////////////


//
// 列表元素取值
// 适用：ul, ol
// @param {Element} el 取值元素
// @param {String} name 目标内容名
//
function list( el, name ) {
    let _ss;
    switch (name) {
        case 'Abstract':
            // 合并为单个段落（保留内联结构）
            return [ null, $.Element( 'p', $('li', el).contents() ) ];

        case 'Toc':
            return null;

        case 'Cascadeli':
            // 目标自行合并
            return [ null, el ];

        case 'Seealso':
        case 'Reference':
        case 'Ul':
        case 'Ol':
        case 'Cascade':
            return $.children( el );

        case 'Header':  // 每<li>对应一行（p）
        case 'Footer':  // 同上
        case 'Address': // 同上
        case 'P':       // 接受内联单元数组
        case 'Table':   // 每项为一个单元格内容
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return listSubs( el );

        // 合法子类型。
        // case 'Article':
        // case 'S1':
        // case 'S2':
        // case 'S3':
        // case 'S4':
        // case 'S5':
            // 独立内容单元
            // 注：章节目标特殊逻辑自行处理。
            // return el;

        case 'Codelist':
            // 每<li>对应一行代码。
            return $.children(el).map( li => getCodes(li) );

        case 'Dl':
            _ss = listSubs(el);
            // 首行充当标题<dt>
            return [ textLine( _ss.shift() ), _ss ];

        case 'Figure':
            // 分离文本为标题，图片为内容。
            return [ cleanText($.text(el)), $.find(el, 'img') ];

        case 'Blockquote':
        case 'Aside':
        case 'Details':
            return [ null, listSubs(el) ];

        case 'Codeblock':
        case 'Pre':
            // 换行友好。
            return $.Text( $.children(el), '\n' );
    }
    // codeli, ...
    // 仅取文本。
    return $.text( el );
}


//
// 小区块取值（<header>）。
// 含可选的<h4>标题。
//
function smallBlock( el, name ) {
    // ?
    let _ss;
    switch (name) {
        case 'Abstract':
            // 合并为单个段落
            return [ null, $.text(el) ];

        case 'Toc':
            return [ null, $.children(el) ];

        case 'Cascadeli':
            // 目标自行合并
            return [ null, el ];

        case 'Seealso':
        case 'Reference':
        case 'Ul':
        case 'Ol':
        case 'Cascade':
            return $.children(el);

        case 'Header':  // 每<li>对应一行（p）
        case 'Footer':  // 同上
        case 'Address': // 同上
        case 'P':       // 接受内联单元数组
        case 'Table':   // 每项为一个单元格内容
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return listSubs(el);

        // 合法子类型。
        // case 'Article':
        // case 'S1':
        // case 'S2':
        // case 'S3':
        // case 'S4':
        // case 'S5':
            // 独立内容单元
            // 注：章节目标特殊逻辑自行处理。
            // return el;

        case 'Codelist':
            // 每<li>对应一行代码。
            return $.children(el).map( li => getCodes(li) );

        case 'Dl':
            _ss = listSubs(el);
            // 首行充当标题<dt>
            return [ textLine( _ss.shift() ), _ss ];

        case 'Figure':
            // 分离文本为标题，图片为内容。
            return [ cleanText($.text(el)), $.find(el, 'img') ];

        case 'Blockquote':
        case 'Aside':
        case 'Details':
            return [ null, listSubs(el) ];

        case 'Codeblock':
        case 'Pre':
            // 换行友好。
            return childTexts(el).join('\n');
    }
    // codeli, ...
    // 仅取文本。
    return $.text( el );
}


//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取纯代码内容。
 * 不含封装的<code>元素本身。
 * 注：仅限于直接封装或封装<code>的容器元素。
 * @param  {Element} el 容器元素
 * @param  {Boolean} text 是否取纯文本
 * @return {[Node]|String} 代码内容
 */
function getCodes( el, text = false ) {
    let _n = el.nodeName.toLowerCase();

    if ( _n == 'code' ) {
        return text ? $.text(el) : $.contents(el);
    }
    return getCodes(el.firstElementChild, text);
}


// 获取子元素内容集。
// 注：以子元素为数组单元，获取内联内容集。
function listSubs( box ) {
    return $.children( box ).map( el => inlines(el) );
}


/**
 * 获取内联节点集。
 * 约束：行块不应当和内联元素并列为同级关系。
 * @param {Element} box 容器元素
 * @param  {[Node]} 内联节点存储区
 * @return {[Node|Element]}
 */
function inlines( box, buf = [] ) {
    let _buf = $.contents(box);

    if ( isOuter(_buf[0]) ) {
        return buf.push( ..._buf );
    }
    _buf.forEach( el => inlines(el, buf) );
}


/**
 * 是否为自取单元。
 * @param  {Node} node 目标节点
 * @return {Boolean}
 */
function isOuter( node, tag ) {
    return node.nodeType == 3 ||
        __outerTags.has( tag || node.nodeName.toLowerCase() );
}


/**
 * 清理文本空白。
 * 清除首位空白，内部连续空白合并为单个空格。
 * @param  {String} txt 原始文本
 * @return {String}
 */
function cleanText( txt ) {
    return txt.trim().replace( /\s+/, ' ' );
}


/**
 * 创建区块默认的内容单元。
 * 实参cons只能是内联单元，包括文本节点。
 * @param {String} name 目标内容名
 * @param {Node|[Node]} cons 内联节点（集）
 */
function defaultConitem( name, cons ) {
    let _n = __defaultConitem[name];
    return _n ? Content[_n]( create(_n), cons, 'fill' ) : cons;
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取转换数据。
 * @param {Element} self 取值元素
 * @param {String} name 目标内容名
 * @param {Value|[Value]} 值/值集
 */
function getData( self, name ) {
    let _tag = self.nodeName.toLowerCase(),
        _fun = dataConvs[_tag];

    if ( !_fun ) {
        window.console.error(`<${_tag}> element can not be converted.`);
        return null;
    }
    switch (name) {
        case 'Hr':
        case 'Space':
        case 'Blank':
            return null;
    }
    return isOuter(self, _tag) ? self : _fun(self, name);
}


export { getData };
