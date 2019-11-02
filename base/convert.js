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


const
    $ = window.$,

    // 小区块标题选择器。
    __blockHxSlr = 'h4, summary, figcaption',

    // 媒体内容元素。
    __mediaSlr = 'img, video, audio';


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
        if ( name == 'Figure' ) {
            return $.find( el, __mediaSlr );
        }
        let _cons = $.contents(el);
        return defaultConitem( name, _cons ) || _cons;
    };
});


//
// 取值辅助。
// @param {Element} el 取值元素
// @param {String} name 目标内容名
//////////////////////////////////////////////////////////////////////////////


//
// 列表元素取值
// 适用：ul, ol
//
function list( el, name ) {
    switch (name) {
        case 'Abstract':
            // 合并为单个段落（保留内联结构）
            return $.Element( 'p', inlines(el) );

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
            // 全部视为<dd>项。
            return childrenNodes(el).map( dd => $.Element('dd', dd) );

        case 'P':       // 接受内联单元数组
        case 'Address': // 同上
        case 'Table':   // 同上
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return childrenNodes( el );

        case 'Article':
        case 'S1':
        case 'S2':
        case 'S3':
        case 'S4':
        case 'S5':
            // 独立内容单元
            return el;

        case 'Figure':
            // 提取图片/媒体为内容。
            return $.find( el, __mediaSlr );

        case 'Header':      // 每<li>对应一行（p）
        case 'Footer':      // 同上
        case 'Blockquote':  // 同上
        case 'Aside':       // 同上
        case 'Details':     // 同上
            return childrenNodes(el).map( dd => $.Element('p', dd) );

        case 'Codeblock':
        case 'Pre':
            // 换行友好。
            return $.Text( $.children(el), '\n' );

        case 'Codeli':
        case 'Ali':
        case 'H5a':
            // 仅取文本（并清理）。
            return $.Text( cleanText($.text(el)) );

        case 'Cascadeli':
            // 目标自行合并
            return el;
    }
    // 最小单元：内联节点集。
    return inlines( el );
}


//
// 小区块取值。
// 适用：header, footer, blockquote, aside, details
//
function smallBlock( el, name ) {
    switch (name) {
        case 'Abstract':
            // 合并为单个段落（保留内联结构）
            return $.Element( 'p', blockContents(el) );

        case 'Seealso':
        case 'Reference':
        case 'Ul':
        case 'Ol':
        case 'Cascade':
            return blockConitems(el).wrapInner('<li>').detach();

        case 'Codelist':
            // 每行块对应一行代码。
            return blockConitems(el).text().map( s => s.trim() ).wrap('<li><code>').detach();

        case 'Dl':
            return childrenNodes(el).map( dd => $.Element('dd', dd) );

        case 'P':       // 接受内联单元数组
        case 'Address': // 同上
        case 'Table':   // 同上
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return childrenNodes( el );

        case 'Article':
        case 'S1':
        case 'S2':
        case 'S3':
        case 'S4':
        case 'S5':
            // 独立内容单元
            return el;

        case 'Figure':
            // 提取图片/媒体为内容。
            return $.find( el, 'img,video,audio,picture' );

        case 'Header':      // 每<li>对应一行（p）
        case 'Footer':      // 同上
        case 'Blockquote':  // 同上
        case 'Aside':       // 同上
        case 'Details':     // 同上
            return childrenNodes(el).map( dd => $.Element('p', dd) );

        case 'Codeblock':
        case 'Pre':
            // 换行友好。
            return $.Text( $.children(el), '\n' );

        case 'Codeli':
        case 'Ali':
        case 'H5a':
            // 仅取文本（并清理）。
            return $.Text( cleanText($.text(el)) );

        case 'Cascadeli':
            // 目标自行合并
            return el;
    }
    // 最小单元：内联节点集。
    return inlines( el );
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
 * 封装不含顶层<code>的代码内容节点。
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
function childrenNodes( box ) {
    return $.children( box ).map( el => inlines(el) );
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
        $.contents(node).forEach( nd => inlines(nd, buf) );
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
 * 获取小区块内容集（行块）。
 * 注：排除了可能有的标题元素。
 * @param  {Element} box 小区块容器
 * @return {Collector}
 */
function blockConitems( box ) {
    return $(box).children().flat().not(__blockHxSlr);
}


/**
 * 获取小区块内联内容节点集。
 * @param  {Element} box 小区块容器
 * @param  {Array} buf 存储区。
 * @return {[Node]} buf
 */
function blockContents( box, buf = [] ) {
    blockConitems(box)
        .forEach( el => inlines(el, buf) );
    return buf;
}


/**
 * 创建区块默认的内容单元。
 * 实参cons只能是内联单元，包括文本节点。
 * @param {String} name 目标内容名
 * @param {Node|[Node]|null} cons 内联节点（集）
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
 * 返回null表示无法取值，调用者应当忽略。
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
        case 'Toc':
        case 'Hr':
        case 'Space':
        case 'Blank':
            return null;
    }
    return isOuter(self, _tag) ? self : _fun(self, name);
}


export { getData };
