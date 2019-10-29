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
// 针对目标类型（name），转换自身为最合适的数据集。
// 适用于目标类型的内部插入（prepend|append|fill）。
// 返回值：
// - 按目标类型提供一个值或值集。
// - null值表示忽略，空串为有值（清空目标）。
// 注记：
// 平级插入可转换为与参考目标相同类型，如果不行则构造为父容器默认类型。
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
// 包含可选的标题（h4, summary）。
/////////////////////////////////////////////////
[
    'Header',
    'Footer',
    'Blockquote',
    'Aside',
    'Details',
]
.forEach(function( n ) {
    Content[n] = (el, name) => smallBlock( el, name );
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
    dataConvs[n] = function( el, name ) {
        let _cons = $.contents(el);
        return defaultConitem( name, _cons ) || _cons;
    };
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
            return [ null, $.Element( 'p', inlines(el) ) ];

        case 'Toc':
            // 目录为功能件，不支持任意插入。
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

        case 'Codelist':
            // 每<li>对应一行代码。
            return $.children(el).map( li => codeWrap(codeSubs(li), 'li') );

        case 'Dl':
            _ss = listSubs(el);
            // 首行充当标题<dt>
            return [$.Element('dt', _ss.shift()), ...linesWrap(_ss, 'dd')];

        case 'Header':  // 每<li>对应一行（p）
        case 'Footer':  // 同上
        case 'Address': // 同上
            return linesWrap( listSubs(el), 'p' );

        case 'Table':   // 每项为一个单元格内容
            return [null, listSubs(el)];

        case 'P':       // 接受内联单元数组
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
            return $.children(el).map( li => codeSubs(li) );

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
 * 提取代码内容。
 * 不含<code>封装元素本身。
 * @param  {Element} box 代码容器（pre|li）
 * @param  {Boolean} text 是否取纯文本，可选
 * @return {[Node]|String} 代码内容
 */
function codeSubs( box, text = false ) {
    let _el = box.firstElementChild,
        _n = _el && _el.nodeName.toLowerCase();

    if ( _n == 'code' ) {
        box = _el;
    }
    return text ? $.text(box) : $.contents(box);
}


/**
 * 代码封装。
 * 如果未传递最终容器标签名，返回<code>封装的代码元素。
 * 否则返回的容器包含了唯一的子元素<code>封装。
 * @param  {[Node]} cons 代码内容节点集
 * @param  {String} tag 封装容器元素标签
 * @return {Element} 包含代码的容器元素
 */
function codeWrap( cons, tag ) {
    let _cel = $.Element( 'code', cons );
    return tag ? $.Element( tag, _cel ) : _cel;
}


/**
 * 获取子元素内容集。
 * 注：以子元素为数组单元，获取内联内容集。
 * @param  {Element} box 容器元素
 * @return {[[Node]]} 子元素内容节点集数组
 */
function listSubs( box ) {
    return $.children( box ).map( el => inlines(el) );
}


/**
 * 元素集封装。
 * @param {[Node|[Node]]} cons 内容节点（集）数组
 * @param {String} tag 封装元素标签
 */
function linesWrap( cons, tag ) {
    return cons.map( dd => $.Element(tag, dd) );
}


/**
 * 获取内联节点集。
 * @param  {Node} node 测试节点
 * @param  {Array} 内联节点存储区
 * @return {[Node]}
 */
function inlines( node, buf = [] ) {
    if ( !node ) {
        return buf;
    }
    if ( isOuter(node) ) {
        buf.push( node );
    } else {
        $.contents(node).forEach( nd => inlines(nd) );
    }
    return buf;
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
    return _n && Content[_n]( create(_n), cons, 'fill' );
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
