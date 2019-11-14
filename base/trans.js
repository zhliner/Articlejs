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

import { create, Content } from "./create.js";
import { conName, goodSub, error } from "./types.js";
import { heading, content } from "./picks.js";


const
    $ = window.$,

    // 媒体内容元素。
    __mediaSlr = 'img, svg, video, audio',

    // 小区块标题选择器。
    __blockHxSlr = 'h3, h4, summary, figcaption';


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
// 提取&构造目标类型需要的数据条目（见Content.xx接口）。
// { 目标类型名: 转换方法 }
// 适用方法：prepend, append, fill。
// 参数：
// - @param {Element} src 取值元素
// - @param {Boolean} text 是否取文本
// - @param {Boolean} clean 是否清理文本
// 返回值：
// - null值表示应当忽略，空串为有值（清空目标）。
//////////////////////////////////////////////////////////////////////////////
//
const dataTrans = {
    // 标题组：
    // 副标题可以容纳较为复杂的内容（扁平化）。
    Hgroup( src, text, clean ) {
        return [
            heading( src, text, clean ),
            content( src, text, clean ).flat()
        ];
    },


    // 非同类时全部构造为<dd>。
    // @return [<dt>,<dd>|<dd>]
    Dl( src, text, clean ) {
        let _n = conName(src);
        if ( _n == 'Dl' ) {
            return $.children(src);
        }
        return content(src, text, clean).map( nds => $.Element('dd', nds) );
    },


    // 插图：
    // 简单提取媒体文件。
    Figure( src, text, clean ) {
        let _n = conName(src),
            _h = heading(src, text, clean);

        if ( _n == 'Figure' ) {
            return [ _h, content(src, text, clean) ];
        }
        return [ _h,
            content( src, text, clean).map(nds => getsMedia(nds) ).flat()
        ];
    },


    // 代码表：
    // 不同内容交由创建器检查创建。
    Codelist( src, text, clean ) {
        let _n = conName(src);

        if ( _n == 'Codelist' ) {
            return $.children( src );
        }
        return content(src, text, clean)
            .map(
                nds => Content.Codeli($.Element('li'), nds, 'fill')
            );
    },


    // 级联编码表项：
    // 结构：li/h5, ol
    // 注：不处理目录中的 li/h5/a 结构。
    Cascadeli( src, text, clean ) {
        let _n = conName(src);

        if ( _n == 'Cascadeli') {
            let _h5 = $.get( '>h5', src ),
                _ol = $.get( '>ol', src );
            return [
                _h5 && $.contents( _h5 ),
                _ol && $.children( _ol )
            ];
        }
        return [
            heading( src, text, clean ),
            content( src, text, clean ).map( nds => $.Element('li', nds) )
        ];
    },


    // 表格：
    // 直接接受内联节点集。
    Table( src, text, clean ) {
        return [
            heading( src, text, clean ),
            content( src, text, clean )
        ];
    },


    // 注音：
    // 只接受源为注音元素的取值。
    Ruby( src ) {
        return conName(src) == 'Ruby' ? $.children(src) : null;
    },

};


//
// 片区。
// 忽略平级关系的标题。
// @return [null, conitems]
/////////////////////////////////////////////////
[
    'S1',
    'S2',
    'S3',
    'S4',
    'S5',
]
.forEach(function( n ) {
    dataTrans[ n ] = function( src, text, clean ) {
        return [
            null,
            conName(src) == n ? $.children(src) : defaultConitems(n, content(src, text, clean))
        ];
    };
});


//
// 小区块。
// 内容子单元合法即可。
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
    dataTrans[ n ] = function( src, text, clean ) {
        return [
            heading(src, text, clean),
            conName(src) == n ?
                blockConitems(n, src, text, clean) : defaultConitems(n, content(src, text, clean))
        ];
    };
});


//
// 列表元素。
// 相同子元素，视为类型相同。
/////////////////////////////////////////////////
[
    'Seealso',
    'Reference',
    'Ul',
    'Ol',
    'Cascade',
]
.forEach(function( n ) {
    dataTrans[ n ] = function( src, text, clean ) {
        let _tag = src.nodeName.toLowerCase();

        if ( _tag == 'ol' || _tag == 'ul' ) {
            return $.children(src);
        }
        // [<li>...]
        return content(src, text, clean).map( nds => $.Element('li', nds) );
    };
});


// 内容元素。
// 只接收内联的内容单元。
/////////////////////////////////////////////////
[
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'H5a',
    'P',
    'Address',
    'Caption',
    'Summary',
    'Figcaption',
    'Li',
    'Ali',
    'Codeli',
    'Dt',
    'Dd',
    'Pre',
    'Codeblock',
    'Th',
    'Td',
    'Rb',
    'Rp',
    'Rt',

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
    'Dfn',
    'Samp',
    'Kbd',
    'S',
    'U',
    'Var',
    'Bdo',
    'A',
    'Code',
    'I',
    'B',
]
.forEach(function( n ) {
    dataTrans[ n ] = function( src, text, clean ) {
        // 标题与内容合并。
        // 二维数组扁平化。
        return ( heading(src, text, clean) || [] ).concat( content(src, text, clean) );
    };
});


// 固结单元。
// 不能在内部任意插入内容。
/////////////////////////////////////////////////
[
    'Audio',
    'Video',
    'Picture',
    'Source',
    'Track',
    'Meter',
    'Img',
    'Blank',
    'Toc',
    'Hr',
    'Article',
    'Space',
]
.forEach(function( n ) {
    dataTrans[ n ] = () => null;
});


// 表格中间结构。
// 不必检查是否为同类表格行（效率）。
/////////////////////////////////////////////////
[
    'Thead',
    'Tbody',
    'Tfoot',
    'Tr',
]
.forEach(function( n ) {
    dataTrans[ n ] = (src, text, clean) => content( src, text, clean );
});



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取小区块内容集（行块）。
 * 如果不是合法的子单元，构造为默认子单元。
 * 注：排除了可能有的标题元素。
 * @param  {String} name 内容名
 * @param  {Element} box 小区块容器
 * @param  {Boolean} text 是否提取文本
 * @param  {Boolean} clean 是否清理文本
 * @return {[Element]} 结果集
 */
function blockConitems( name, box, text, clean ) {
    return $.not(
            $.children(box),
            __blockHxSlr
        ).map(
            el => goodSub(name, el) ?
            el : defaultConitems(name, content(el, text, clean))
        );
}


/**
 * 提取媒体元素。
 * @param  {Node} node 内容节点
 * @return {[Element]}
 */
function getMedia( node ) {
    if ( node.nodeType != 1 ) {
        return [];
    }
    return $.find( node, __mediaSlr, true );
}


/**
 * 提取节点集内的媒体元素。
 * 返回的集合已经被一维扁平化。
 * @param  {[Node]} nodes 内容节点集
 * @return {[Element]}
 */
function getsMedia( nodes ) {
    if ( !$.isArray(nodes) ) {
        return getMedia( nodes );
    }
    return nodes.map( nd => getMedia(nd) ).flat();
}


/**
 * 创建默认的内容单元（集）。
 * 实参cons为二维数组时才会创建多个子条目。
 * @param  {String} name 目标内容名
 * @param  {Node|[Node]|null} cons 内联节点（集）
 * @return {Element|[Element]|null}
 */
function defaultConitems( name, cons ) {
    let _n = __defaultConitem[name];

    if ( !_n ) {
        return null;
    }
    if ( !$.isArray(cons) || !$.isArray(cons[0]) ) {
        return Content[_n]( create(_n), cons, 'fill' );
    }
    return cons.map(
        nds => Content[_n]( create(_n), nds, 'fill' )
    );
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 单元合并。
 * 适用向内插入的方法：prepend,append,fill。
 * - 源与目标相同：标题合并，内容合并。
 * - 源与目标不同：取源的基础内容合并，标题/内容依然分开。
 * @param  {Element} self 当前元素
 * @param  {Element} from 数据源元素
 * @param  {String} meth  合并方法
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 是否文本清理
 * @return {Element|[Element]} 新插入的单元（集）
 */
function merge( self, from, meth, text, clean ) {
    let _n = conName(self),
        _f = dataTrans[_n];

    if ( !_f ) {
        return error(
            '?', // 待定
            `[${_n}] conversion is not supported.`
        );
    }
    return Content[_n]( self, _f(from, text, clean), meth );
}


/**
 * 平级插入。
 * 适用平级的插入方法：after,before,replace。
 * - 合法子单元：整体插入。
 * - 非法子单元：取源的基础内容构造为默认单元插入。
 * @param  {Element} self 当前元素
 * @param  {Element} from 数据源元素
 * @param  {String} meth  合并方法
 * @param  {Boolean} text 是否取文本
 * @param  {Boolean} clean 是否文本清理
 * @return {Element} 新插入的单元
 */
function insert( self, from, meth, text, clean ) {
    let _n = conName(self.parentElement);

    if ( !goodSub(_n, from) ) {
        from = defaultConitems(_n, content(from, text,clean));
    }
    if ( !from ) {
        return error( '?', `can not insert here with ${meth}.` );
    }
    return $[meth]( self, from );
}


export { insert, merge };
