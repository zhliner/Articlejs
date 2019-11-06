//! $Id: trans.js 2019.10.11 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元的转换映射/定义。
//
//  向内插入：
//      prepend, append, fill
//      源与目标相同：标题合并，内容合并。
//      源与目标不同：取源的基础内容合并，标题/内容依然分开。
//
//  平级插入：
//      before, after, replace
//      合法子单元：整体插入。
//      非法子单元：取源的基础内容构造为默认单元插入。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { create, Content } from "./factory.js";
import { conName } from "./types.js";


const
    $ = window.$,

    // 小区块标题选择器。
    __blockHxSlr = 'h3, h4, summary, figcaption',

    // 片区标题选择器。
    __sectHxSlr = 'h2, h3, h4, h5, h6',

    // 媒体内容元素。
    __mediaSlr = 'img, video, audio',

    // 内容行选择器。
    __consLine = 'h4,figcaption,summary,caption, li,dt,dd,p,address,tr,pre';


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
// 主要用于目标类型的内部插入（prepend|append|fill）。
// 参数：
//   @param {Element} el 取值元素
//   @param {String} name 目标内容名
// 返回值：
// - 按目标类型提供一个值或值集。
// - null值表示忽略，空串为有值（清空目标）。
// 注记：
// 平级插入可转换为与参考目标相同类型，如果不行则构造为父容器默认类型。
//////////////////////////////////////////////////////////////////////////////
//
const dataConvs = {
    /**
     * 不支持整个文章为来源数据。
     */
    Article( el, name ) {
        return null;
    },


    S1( el, name ) {
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
    'Abstract',
    'Header',
    'Footer',
    'Blockquote',
    'Aside',
    'Details',
]
.forEach(function( n ) {
    dataConvs[n] = (el, name) => smallBlock( el, name );
});


// 内容行元素取值。
// 包含特殊的结构元素<td>,<th>和<rb>,<rt>,<rp>。
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


// 内联单元取值。
// 简单取元素自身为数据。
/////////////////////////////////////////////////
[
    'Audio',
    'Video',
    'Picture',
    'Strong',
    'Em',
    'Q',
    'Abbr',
    'Cite',
    'Small',
    'Time',
    'Del',
    'Ins',
    'Sub',
    'Sup',
    'Mark',
    'Orz',
    'Ruby',
    'Dfn',
    'Samp',
    'Kbd',
    'S',
    'U',
    'Var',
    'Bdo',
    'Meter',
    'Blank',
    'A',
    'Code',
    'Img',
    'I',
    'B',
]
.forEach(function( n ) {
    dataConvs[n] = function( node, name ) {
        return defaultConitem( name, node ) || node;
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
            return [null, $.Element( 'p', inlines(el) )];

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
            return [null, childrenNodes(el).map( dd => $.Element('dd', dd) )];

        case 'P':       // 接受内联单元数组
        case 'Address': // 同上
            return childrenNodes(el).flat();

        case 'Table':   // 每<li>视为一单元格格数据
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
            return [null, el];

        case 'Header':      // 每<li>对应一行（p）
        case 'Footer':      // 同上
        case 'Blockquote':  // 同上
        case 'Aside':       // 同上
        case 'Details':     // 同上
            return [null, childrenNodes(el).map( dd => $.Element('p', dd) )];

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
            return [null, el];
    }
    // 最小单元：内联节点集。
    return inlines( el );
}


//
// 小区块取值。
// 适用：abstract, header, footer, blockquote, aside, details
// 大部分情况下忽略标题。
//
function smallBlock( el, name ) {
    let _hx = $.get(__blockHxSlr);

    switch (name) {
        case 'Abstract':
            // 合并为单个段落（保留内联结构）
            return [null, $.Element( 'p', blockContents(el) )];

        case 'Seealso':
        case 'Reference':
        case 'Ul':
        case 'Ol':
        case 'Cascade':
            // 构造一<li>集合。
            return blockConitems(el).wrapInner('<li>').detach();

        case 'Codelist':
            // 每行块对应一行代码。
            // 会清理空白（与普通HTML空白表现一致）。
            return blockConitems(el).text().map(cleanText).wrap('<li><code>').detach();

        case 'Dl':
            // 分别视为<dt>/[<dd>]条目。
            return [
                _hx && $.contents(_hx),
                blockConitems(el).map( el => $.Element('dd', inlines(el)) ),
            ];

        case 'P':       // 接受内联单元数组
        case 'Address': // 同上
            // 排除标题。
            return blockConitems(el).map( el => inlines(el) ).flat();

        case 'Table':   // 每行块视为一单元格数据
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return blockConitems(el).map( el => inlines(el) );

        case 'Article':
        case 'S1':
        case 'S2':
        case 'S3':
        case 'S4':
        case 'S5':
            // 独立内容单元
            return [null, el];

        case 'Header':      // 每<li>对应一行（p）
        case 'Footer':      // 同上
        case 'Blockquote':  // 同上
        case 'Aside':       // 同上
        case 'Details':     // 同上
            return [
                _hx && $.contents(_hx),
                blockConitems(el).map( el => $.Element('p', inlines(el)) )
            ];

        case 'Codeblock':
        case 'Pre':
            // 换行友好
            // 注：标题保留，空白保留。
            return $.Text( $.children(el), '\n' );

        case 'Codeli':
        case 'Ali':
        case 'H5a':
            // 仅取文本（并清理）。
            return $.Text( cleanText($.text(el)) );

        case 'Cascadeli':
            // 标题为标题
            // 内容为列表项集。
            return [
                _hx && $.contents(_hx),
                blockConitems(el).wrapInner('<li>').detach()
            ];
    }
    // 最小单元：内联节点集。
    return inlines( el );
}


//
// 内容片区取值。
// 不适用包含子片区的父片区。
//
function contentSection( sect, name ) {
    let _hx = $.prev(sect);

    if ( !$.is(_hx, __sectHxSlr)) {
        _hx = null;
    }
    switch (name) {
        case 'Abstract':
            // 取导言合并到单个段落。
            return [null, $.Element( 'p', sectionHeaders(sect) )];

        case 'Seealso':
        case 'Reference':
        case 'Ul':
        case 'Ol':
        case 'Cascade':
            // 每内容行为一<li>条目。
            return sectionRowcon(sect).map( dd => $.Element('li', dd) );

        case 'Codelist':
            // 每内容行对应一行代码。
            // 清理空白（与普通HTML空白表现一致）。
            return $( $.find(__consLine, sect) ).text().map(cleanText).wrap('<li><code>').detach();

        case 'Dl':
            // 分别视为<dt>/[<dd>]条目。
            return [
                _hx && $.contents(_hx),
                blockConitems(el).map( el => $.Element('dd', inlines(el)) ),
            ];

        case 'P':       // 接受内联单元数组
        case 'Address': // 同上
            // 排除标题。
            return blockConitems(el).map( el => inlines(el) ).flat();

        case 'Table':   // 每行块视为一单元格数据
        case 'Thead':   // 同上
        case 'Tbody':   // 同上
        case 'Tfoot':   // 同上
        case 'Tr':      // 同上
            return blockConitems(el).map( el => inlines(el) );

        case 'Article':
        case 'S1':
        case 'S2':
        case 'S3':
        case 'S4':
        case 'S5':
            // 独立内容单元
            return [null, el];

        case 'Figure':
            // 标题为标题。
            // 提取图片/媒体为内容。
            return [_hx && $.contents(_hx), $.find(el, __mediaSlr)];

        case 'Header':      // 每<li>对应一行（p）
        case 'Footer':      // 同上
        case 'Blockquote':  // 同上
        case 'Aside':       // 同上
        case 'Details':     // 同上
            return [
                _hx && $.contents(_hx),
                blockConitems(el).map( el => $.Element('p', inlines(el)) )
            ];

        case 'Codeblock':
        case 'Pre':
            // 换行友好
            // 注：标题保留，空白保留。
            return $.Text( $.children(el), '\n' );

        case 'Codeli':
        case 'Ali':
        case 'H5a':
            // 仅取文本（并清理）。
            return $.Text( cleanText($.text(el)) );

        case 'Cascadeli':
            // 标题为标题
            // 内容为列表项集。
            return [
                _hx && $.contents(_hx),
                blockConitems(el).wrapInner('<li>').detach()
            ];
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
function isOuter( node ) {
    return node.nodeType == 3 ||
        __outerTags.has( node.nodeName.toLowerCase() );
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
 * 获取片区导言集内容。
 * 注：用于合并各子片区导言到提要。
 * @param  {Element} sect 片区元素
 * @return {[Node]}
 */
function sectionHeaders( sect ) {
    return $.find(sect, 'header')
        .map( el => blockContents(el) ).flat();
}


/**
 * 获取片区内容行的节点集。
 * 一个表格行视为一行（单元格合并）。
 * @param  {Element} sect 片区元素
 * @return {[[Node]]} 行节点集数组
 */
function sectionRowcon( sect ) {
    return $.find(__consLine, sect).map(
        el => $.is(el, 'tr') ? childrenNodes(el).flat() : $.contents(el)
    );
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
 * @param  {Element} self 取值元素
 * @param  {String} name 目标内容名
 * @return {Value|[Value]} 值/值集
 */
function getData( self, name ) {
    let _n = conName(self),
        _fun = dataConvs[_n];

    if ( !_fun ) {
        throw new Error(`<${_n}> element can not be converted.`);
    }
    switch (name) {
        case 'Figure':
            return [
                $.get(__blockHxSlr, self),
                $.find(self, __mediaSlr)
            ];
        case 'Toc':
        case 'Hr':
        case 'Space':
        case 'Blank':
            return null;
    }
    return isOuter(self) ? self : _fun(self, name);
}


export { getData };
