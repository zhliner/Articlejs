//! $Id: picks.js 2019.10.11 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	提取单元内容的不同成份。
//  主要用于单元转换时，不同目标类型对不同内容格式的需求。
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
// 不支持取值的单元。
// 注：取值时返回 null 值。
//
const __nullNames = new Set([
    'Toc',
    'Article',
    'Hr',
    'Space',
    'Blank',
]);


//
// 数据提取集。
// 提取目标仅针对末端内容单元，不适用片区结构。
// 种类：
// - 标题：{Node|[Node]} 文本节点或原始内联节点集。
// - 内容：{[Node]|[[Node]]} 文本节点数组或原始内联节点集数组。
// 参数：
//   @param {Element} root  单元根元素
//   @param {Boolean} text  是否取文本
//   @param {Boolean} clean 是否清理文本
// 注：
// 返回 null 表示目标项无效，调用者应当忽略。
//////////////////////////////////////////////////////////////////////////////
//
const dataPicks = {

    Figure: {
        heading( root, text, clean ) {
            return elementContent(
                $.get( 'figcaption', root ), text, clean
            );
        },

        content( root, text, clean ) {
            return text ? '' : $.find(__mediaSlr, $.get('p', root));
        }
    },

    S1: {
        heading( root, text ) {
            //
        },

        content( root, text ) {
            //
        }
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
    Content[n] = (el, name) => smallBlock( el, name );
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
 * 取值为文本节点。
 * @param  {Element} el 取值元素
 * @param  {Boolean} clean 清理空白
 * @return {Text} 文本节点
 */
 function textNode( el, clean ) {
    return clean ? $.Text( cleanText($.text(el)) ) : $.Text( el );
}


/**
 * 元素取值。
 * @param  {Element} el 取值元素
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {Text|[Node]} 文本节点或内容节点集
 */
function elementContent( el, text, clean ) {
    if ( !el ) {
        return el;
    }
    return text ? textNode(el, clean) : $.contents(el);
}


/**
 * 元素集取值。
 * @param  {Collector} els 取值元素集
 * @param  {Boolean} text  是否取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {[Text]|[[Node]]} 文本节点数组或内容节点集数组
 */
function elementsContent( els, text, clean ) {
    if ( els.length == 0 ) {
        return els;
    }
    return text ? els.contents() : els.map( el => textNode(el, clean) )
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取提取的数据。
 * 返回null表示无法取值，调用者应当忽略。
 * @param  {Element} self 取值元素
 * @param  {String} type 取值类型（heading|content）
 * @param  {Boolean} text 是否取文本
 * @return {Value|[Value]} 值/值集
 */
function data( self, type, text ) {
    let _n = conName(self),
        _o = dataPicks[_n];

    if ( !_o ) {
        throw new Error(`<${_n}> can not be converted.`);
    }
    return __nullNames.has(_n) ? null : _o[type](self, text);
}


// 提取标题。
function heading(root, text) {
    return data(root, 'heading', text);
}

// 提取内容。
function content(root, text) {
    return data(root, 'content', text);
}


export { heading, content };
