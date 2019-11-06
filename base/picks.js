//! $Id: picks.js 2019.10.11 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	提取单元内容。
//  包含两个部分：标题（heading），内容（content）。
//
//  仅在单元转换时需要，提取的内容为基本单元：内联节点（集）。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { conName, isConItems } from "./types.js";


const $ = window.$;


//
// 数据提取集。
// 提取目标仅针对末端内容单元，不适用片区结构。
// 种类：
// - 标题：{Node|[Node]|null} 文本节点或原始内联节点集。
// - 内容：{[Node]|[[Node]]|''} 文本节点数组或原始内联节点集数组。
// 参数：
//   @param {Element} root  单元根元素
//   @param {Boolean} text  是否取文本
//   @param {Boolean} clean 是否清理文本
// 注：
// 返回 null 表示目标项无效，调用者应当忽略。
//////////////////////////////////////////////////////////////////////////////
//
const dataPicks = {
    // 插图：
    // figure/figcaption, p/img...
    Figure: {
        heading( root, text, clean ) {
            return elementContent( $.get( 'figcaption', root ), text, clean );
        },

        content( root, text ) {
            return text ? '' : $.find( 'img, video, audio', $.get('p', root) );
        }
    },


    // 定义列表
    // 标题项会被合并为一项。
    Dl: {
        heading( root, text, clean ) {
            return $.find('dt', root)
                .map( el => elementContent(el, text, clean) )
                .flat();
        },

        content( root, text, clean ) {
            return $.find('dd', root).map( el => elementContent( el, text, clean) );
        }
    },


    // 代码表：
    // 会剥离<code>封装，返回内部的内容。
    Codelist: {
        heading: () => null,

        content( root, text, clean ) {
            return $.find('code', root).map( el => elementContent(el, text, clean) );
        }
    },


    // 表格。
    // 标题（caption）有效。
    Table: {
        heading( root, text, clean ) {
            return elementContent( $.get('caption', root), text, clean );
        },

        // 行内单元格被合并。
        content( root, text, clean ) {
            return $.find('tr', root).map( tr => mergeCells(tr, text, clean) );
        }
    },

};


//
// 片区。
// 不适用包含子片区的结构片区。
// 多层结构：内容为独立的内容件（集）。
/////////////////////////////////////////////////
[
    ['S1',  'h2'],
    ['S2',  'h3'],
    ['S3',  'h4'],
    ['S4',  'h5'],
    ['S5',  'h6'],
]
.forEach(function( nn ) {

    dataPicks[ nn[0] ] = {
        heading( root, text, clean ) {
            return elementContent( $.prev(root, nn[1]), text, clean );
        },

        content( root, text, clean ) {
            return isConItems( $.children(root) ) ?
                blockContent( $.children(root), text, clean ) : null;
        }
    }
});


//
// 带标题小区块。
// 多层结构：内容为独立的内容件单元。
/////////////////////////////////////////////////
[
    ['Abstract',    'h3'],
    ['Header',      'h4'],
    ['Footer',      'h4'],
    ['Blockquote',  'h4'],
    ['Aside',       'h4'],
    ['Details',     'summary'],
]
.forEach(function( nn ) {

    dataPicks[ nn[0] ] = {
        heading( root, text, clean ) {
            return elementContent( $.get(nn[1], root), text, clean );
        },

        content( root, text, clean ) {
            return blockContent( $.not($.children(root), nn[1]), text, clean );
        }
    }
});


//
// 列表单元。
// 双层结构：子元素即为内容行。无标题。
/////////////////////////////////////////////////
[
    'Seealso',
    'Reference',
    'Ul',
    'Ol',
    'Cascade', // 简单列表对待
    'Dl',
    'Tr',
]
.forEach(function( n ) {

    dataPicks[n] = {
        heading: () => null,

        content( root, text, clean ) {
            return $.children(root).map( el => elementContent(el, text, clean) );
        }
    };
});


//
// 代码结构。
// 需要剥离<code>封装。
/////////////////////////////////////////////////
[
    'Codeblock',
    'Codeli',
]
.forEach(function( n ) {

    dataPicks[n] = {
        heading: () => null,

        content( root, text, clean ) {
            return elementContent( $.get('>code', root), text, clean );
        }
    };
});


//
// 内容行元素。
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
    'Li',
    'Dt',
    'Dd',
    'Pre',

    'Th',
    'Td',
    'Rb',
    'Rp',
    'Rt',
]
.forEach(function( n ) {
    dataPicks[n] = {
        heading: () => null,
        content: (root, text, clean) => elementContent(root, text, clean),
    };
});


//
// 取自身单元。
// 取文本构造为文本节点或元素自身，主要为内联元素。
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

    // 特殊行块
    'Hr',
    'Space',
]
.forEach(function( n ) {
    dataPicks[n] = {
        heading: () => null,
        content: (root, text, clean) => text ? textNode(root, clean) : root,
    };
});


//
// 表格中间结构。
/////////////////////////////////////////////////
[
    'Thead',
    'Tbody',
    'Tfoot',
]
.forEach(function( n ) {
    dataPicks[n] = {
        heading: () => null,

        content: (root, text, clean) =>
            $.find('tr', root).map( tr => mergeCells(tr, text, clean) ),
    };
});


//
// 不支持取值单元。
/////////////////////////////////////////////////
[
    'Toc',
    'Article',
    'Track',
    'Source',
]
.forEach(function( n ) {
    dataPicks[n] = {
        heading: () => null,
        content: () => null,
    };
});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


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
 * 取值为文本节点。
 * @param  {Element} el 取值元素
 * @param  {Boolean} clean 清理空白
 * @return {Text} 文本节点
 */
 function textNode( el, clean ) {
    return clean ? $.Text( cleanText($.text(el)) ) : $.Text( el );
}


/**
 * 元素取值（内容行）。
 * 取文本节点或内联内容节点集。
 * @param  {Element} el 取值元素
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {Text|[Node]}
 */
function elementContent( el, text, clean ) {
    if ( !el ) {
        return el;
    }
    return text ? textNode(el, clean) : $.contents(el);
}


/**
 * 区块内容取值。
 * 取文本节点数组或内容节点集数组（二维）。
 * 结构：子元素为内容件集。
 * 注：不含包含子片区的结构性片区。
 * @param  {[Element]} els 取值元素集
 * @param  {Boolean} text  是否取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {[Text]|[[Node]]}
 */
function blockContent( els, text, clean ) {
    return els.map( el =>
        dataPicks[conName(el)].content( el, text, clean ).flat()
    );
}


/**
 * 合并单元格内容。
 * @param  {Element} tr 表格行元素
 * @param  {Boolean} text  是否取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {[Text|Node]}
 */
function mergeCells( tr, text, clean ) {
    return $.children(tr)
        .map( td => elementContent(td, text, clean) )
        .flat();
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取标题数据。
 * 返回null表示无法取值，调用者应当忽略。
 * @param  {Element} self 取值元素
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 文本是否清理
 * @return {Node|[Node]}
 */
function heading(root, text, clean) {
    let _n = conName(root);
    return dataPicks[_n].heading( root, text, clean );
}

/**
 * 提取内容数据。
 * 返回null表示无法取值，调用者应当忽略。
 * @param  {Element} self 取值元素
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 文本是否清理
 * @return {[Node]|[[Node]]}
 */
function content(root, text, clean) {
    let _n = conName(root);
    return dataPicks[_n].content( root, text, clean );
}


export { heading, content };
