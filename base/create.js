//! $Id: create.js 2019.09.07 Articlejs.Libs $
//++++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元创建。
//
//  单元的容器和内容条目分开创建，以便于容器可以接收既有的内容条目（如移动传入）。
//  单元容器的创建是通用的（依配置），内容插入则有各自的限定。
//
//  注记：
//  从简化和宽容性考虑，分级片区和行块内容可以同时存在于同一层级（相同父元素）。
//  虽然传统上或从清晰的逻辑上看不应如此，但CSS样式的能力可以让它们被清晰区分开来。
//
//  这种宽容可以提供编辑时的便捷：
//  - 可以在内容片区插入合法的分级片区，方便将内容行块移入该新片区。
//  - 可以将分级片区解包到当前位置成为内容，这样其它兄弟分级片区的转换就很正常了。
//  - 是否在最终的文档中让两者混合出现是作者的选择，作者可以选择清晰的分层结构，抑或不。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { nameType } from "./base.js";
import { extend } from "./tpb/pbs.by.js";


const
    $ = window.$,

    // 类型值存储池。
    __poolTypes = new WeakMap(),

    // 表格实例缓存。
    // { Element: $.Table }
    __tablePool = new WeakMap();


//
// 定制角色 {
//      name: [tag, role]
// }
// - name: 元素类型名。
// - tag:  目标元素标签名。
// - role: 目标角色名。
//
const customRoles = {
    ABSTRACT:   [ 'header',  'abstract' ],
    TOC:        [ 'nav',     'toc' ],
    SEEALSO:    [ 'ol',      'seealso' ],
    REFERENCE:  [ 'ul',      'reference' ],
    S1:         [ 'section', 's1' ],
    S2:         [ 'section', 's2' ],
    S3:         [ 'section', 's3' ],
    S4:         [ 'section', 's4' ],
    S5:         [ 'section', 's5' ],
    CODELIST:   [ 'ol',      'codelist' ],
    ULX:        [ 'ul',      'ulx' ],
    OLX:        [ 'ol',      'olx' ],
    CASCADE:    [ 'ol',      'cascade' ],
    CODEBLOCK:  [ 'pre',     'codeblock' ],
    NOTE:       [ 'p',       'note' ],
    TIPS:       [ 'p',       'tips' ],
    BLANK:      [ 'div',     'blank' ],
    ORZ:        [ 'code',    'orz' ],
    SPACE:      [ 'span',    'space' ],
};


/**
 * 创建单元元素。
 * 注：不含文本节点。
 * 注意名称需要转换为全小写（如：<SVG> != <svg>）。
 * @param  {String} name 单元名称（全大写）
 * @return {Element}
 */
function create( name ) {
    let _its = customRoles[ name ],
        _cfg = _its && { role: _its[1] };

    return setType(
        $.Element(_its ? _its[0] : name.toLowerCase(), _cfg), nameType(name)
    );
}


/**
 * 存储元素类型值。
 * @param  {Element} el 目标元素
 * @param  {Number} tval 类型值
 * @return {Element} el
 */
function setType( el, tval ) {
    return __poolTypes.set(el, tval), el;
}


//
// 单元创建集。
// 包含全部中间结构单元。
// 用于主面板中的新单元构建和复制/移动时的默认单元创建。
// @return {Node|[Node]}
//////////////////////////////////////////////////////////////////////////////
// 注记：
// 实参尽量为节点/集，以便于用于移动转换场景。
// 返回节点集时，如果目标为集合，可实现一一对应插入。
//
const Creator = {

    //-- 内联结构类 ----------------------------------------------------------

    Audio() {
        //
    },


    Video() {
        //
    },


    Picture() {
        //
    },


    Svg() {
        //
    },


    Ruby() {
        //
    },


    Time() {
        //
    },


    Meter() {
        //
    },


    Space() {
        //
    },


    Img() {
        //
    },


    Dataimg() {
        //
    },


    Br() {
        //
    },


    Wbr() {
        //
    },


    //-- 内联内结构 ----------------------------------------------------------

    Track() {
        //
    },


    Source() {
        //
    },


    Rb() {
        //
    },


    Rt() {
        //
    },


    Rp() {
        //
    },


    Span() {
        //
    },


    Rbpt() {
        //
    },


    //-- 内联内容元素 --------------------------------------------------------

    A() {
        //
    },


    Strong() {
        //
    },


    Em() {
        //
    },


    Q() {
        //
    },


    Abbr() {
        //
    },


    Cite() {
        //
    },


    Small() {
        //
    },


    Del() {
        //
    },


    Ins() {
        //
    },


    Sub() {
        //
    },


    Sup() {
        //
    },


    Mark() {
        //
    },


    Code() {
        //
    },


    Orz() {
        //
    },


    Dfn() {
        //
    },


    Samp() {
        //
    },


    Kbd() {
        //
    },


    S() {
        //
    },


    U() {
        //
    },


    Var() {
        //
    },


    Bdo() {
        //
    },


    //-- 行块内容元素 --------------------------------------------------------

    P() {
        //
    },


    Note() {
        //
    },


    Tips() {
        //
    },


    Pre() {
        //
    },


    Address() {
        //
    },


    //-- 块内结构元素 --------------------------------------------------------

    H1() {
        //
    },


    H2() {
        //
    },


    H3() {
        //
    },


    H4() {
        //
    },


    H5() {
        //
    },


    H6() {
        //
    },


    Summary() {
        //
    },


    Figcaption() {
        //
    },


    Caption() {
        //
    },


    Li() {
        //
    },


    Dt() {
        //
    },


    Dd() {
        //
    },


    Th() {
        //
    },


    Td() {
        //
    },


    Tr() {
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


    Codeli() {
        //
    },


    Ali() {
        //
    },


    Ah4li() {
        //
    },


    Ah4() {
        //
    },


    Ulxh4li() {
        //
    },


    Olxh4li() {
        //
    },


    Cascadeh4li() {
        //
    },


    Figimgp() {
        //
    },


    //-- 行块结构元素 --------------------------------------------------------

    Hgroup() {
        //
    },


    Abstract() {
        //
    },


    Toc() {
        //
    },


    Seealso() {
        //
    },


    Reference() {
        //
    },


    Header() {
        //
    },


    Footer() {
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


    Ul() {
        //
    },


    Ol() {
        //
    },


    Codelist() {
        //
    },


    Ulx() {
        //
    },


    Olx() {
        //
    },


    Cascade() {
        //
    },


    Dl() {
        //
    },


    Table() {
        //
    },


    Figure() {
        //
    },


    Blockquote() {
        //
    },


    Aside() {
        //
    },


    Details() {
        //
    },


    Codeblock() {
        //
    },


    Hr() {
        //
    },


    Blank() {
        //
    },


    //-- 特别用途元素 --------------------------------------------------------

    B() {
        //
    },


    I() {
        //
    },




    /**
     * 目录构建。
     * 约束：片区必须紧随其标题元素。
     * 目标标签为节点类型，故可支持事件绑定或简单设置为主标题锚点。
     * @param  {Element} article 文章元素
     * @param  {Node|[Node]} label 目录标签（h4/..）
     * @return {Element} 目录根元素
     */
    Toc( article, label ) {
        let _toc = create( 'Toc' );

        $.append(
            _toc.firstElementChild,
            label || $.Text('Contents')
        );
        return tocList( _toc.lastElementChild, article );
    },


    /**
     * 文章结构。
     * article/[h2, section:s1]...
     * 文章内容包含章片区集或内容件集（互斥关系）。
     * 原为章片区：
     *  - 新章片区：简单添加，外部同级保证。
     *  - 新内容件：新建一章片区封装插入。
     * 原为内容件：
     *  - 新章片区：新建一章片区封装原内容件，在meth的反方向。
     *  - 新内容件：简单添加（meth）。
     * meth: prepend|append|fill
     * 注：
     * 片区占优（内容可被封装为片区，反之则不行）。
     * 标题内容的插入方法为填充（fill，下同）。
     *
     * @param  {Element} ael 文章元素
     * @param  {Node|[Node]} h1 主标题内容
     * @param  {[Element]} els 章片区集或内容件集
     * @param  {String} meth 内容插入方法
     * @param  {Boolean} conItem 内容是否为内容件集，可选
     * @return {[Element]} 新插入的片区或内容件集
     */
    Article( ael, [h1, els], meth, conItem ) {
        if ( h1 != null ) {
            blockHeading( 'h1', ael.parentElement, h1, meth );
        }
        if ( conItem == null ) {
            conItem = isConItems(els);
        }
        return sectionContent( ael, els, meth, 'S1', conItem );
    },


    /**
     * 末片区。
     * 主结构：section:s5/conitem...
     * 注：内容只能插入内容件集。
     * @param  {Element} sect 片区容器元素
     * @param  {Node|[Node]} h6 末标题内容
     * @param  {[Element]} els 内容件集
     * @param  {String} meth 内容插入方法
     * @return {[Element|null, [Element]]} 末标题和新插入的内容件集
     */
    S5( sect, [h6, els], meth ) {
        if ( h6 != null ) {
            h6 = sectionHeading( 'h6', sect, h6, meth );
        }
        if ( !isConItems(els) ) {
            throw new Error('the content is invalid.');
        }
        return [h6, $[meth]( sect, els )];
    },


    /**
     * 表格结构。
     * @param  {Element} tbl 表格元素
     * @param  {Node|[Node]} cap 表标题内容
     * @param  {[Node|[Node]]} cons 单元格内容集
     * @param  {String} meth 表格行插入方法
     * @return {Collector} 新插入内容的单元格集
     */
    Table( tbl, [cap, cons], meth ) {
        tbl = tableObj( tbl );

        if ( cap != null ) {
            tbl.caption( cap );
        }
        return tableCells(
                tbl,
                meth,
                Math.ceil(cons.length / tbl.cols()),
                'body'
            )
            .fill(cons).end();
    },


    /**
     * 表头结构（tHead）。
     * @param  {Element} thead 表头元素
     * @param  {[Node|[[Node]]]} cons 单元格内容集
     * @param  {String} meth 表格行插入方法
     * @return {Collector} 新插入内容的单元格集
     */
    Thead( thead, cons, meth ) {
        let _tbo = tableObj(
                $.closest(thead, 'table')
            );

        return tableCells(
                _tbo,
                meth,
                Math.ceil(cons.length / _tbo.cols()),
                'head'
            )
            .fill(cons).end();
    },


    /**
     * 表体结构（tBody）。
     * 支持表格内非唯一表体单元。
     * @param  {Element} tbody 表体元素
     * @param  {[Node|[[Node]]]} cons 单元格内容集
     * @param  {String} meth 表格行插入方法
     * @return {Collector} 新插入内容的单元格集
     */
    Tbody( tbody, cons, meth ) {
        let _tbo = tableObj(
                $.closest(tbody, 'table')
            );

        return tableCells(
                _tbo,
                meth,
                Math.ceil(cons.length / _tbo.cols()),
                'body',
                tbodyIndex(_tbo, tbody)
            )
            .fill(cons).end();
    },


    /**
     * 表脚结构（tFoot）。
     * @param  {Element} tfoot 表脚元素
     * @param  {[Node|[[Node]]]} cons 单元格内容集
     * @param  {String} meth 表格行插入方法
     * @return {Collector} 新插入内容的单元格集
     */
    Tfoot( tfoot, cons, meth ) {
        let _tbo = tableObj(
                $.closest(tfoot, 'table')
            );

        return tableCells(
                _tbo,
                meth,
                Math.ceil(cons.length / _tbo.cols()),
                'foot'
            )
            .fill(cons).end()
    },


    /**
     * 表格行结构。
     * meth:
     * - fill 为内部单元格填充，内容不足时后部单元格原样保持。
     * - append 效果与after方法相同，不会改变列大小。
     * - prepend 效果与before方法相同。
     * 注：参考当前行克隆，行元素上绑定的事件处理器也会同时克隆。
     * @param  {Element} tr 表格行
     * @param  {[Node]|[[Node]]} cons 单元格内容集
     * @param  {String} meth 插入方法（fill|append|prepend）
     * @return {Collector} 新插入的内容单元格集
     */
    Tr( tr, cons, meth ) {
        if ( meth == 'fill' ) {
            return $(tr.cells).fill(cons).end();
        }
        let _trs = trClone(
                tr,
                Math.ceil(cons.length / tr.cells.length),
                true
            ),
            _meth = trMeth( meth );

        return $( $[_meth](tr, _trs) ).find('th,td').flat().fill(cons).end();
    },


    /**
     * 插图。
     * 结构：figure/figcaption, p/img...
     * 仅认可首个图片容器元素（<p>）。
     * @param  {Element} root 插图根元素
     * @param  {Node|[Node]|''} cap 标题内容
     * @param  {Element|[Element]} imgs 图片/媒体节点集
     * @param  {String} meth 图片插入方法（prepend|append|fill）
     * @return {[Element]} 新插入的图片集
     */
    Figure( root, [cap, imgs], meth ) {
        if ( cap != null ) {
            blockHeading( 'figcaption', root, cap, meth );
        }
        return $[meth]( $.get('p', root), imgs );
    },


    /**
     * 标题组。
     * 结构：hgroup/h1, h2
     * 固定结构，标题内容修改为填充（fill）方式。
     * 设置内容为null可忽略修改。
     * 注：若标题不存在会自动创建（修复友好）。
     * @param  {Element} root 标题组容器
     * @param  {Node|[Node]|''} h1c 页面主标题内容
     * @param  {Node|[Node]|''} h2c 页面副标题内容
     * @return {[Element, Element]} 主副标题对
     */
    Hgroup( root, [h1c, h2c] ) {
        let _h1 = $.get( '>h1', root ),
            _h2 = $.get( '>h2', root );

        if ( !_h1 ) {
            _h1 = $.prepend( $.Element('h1') );
        }
        if ( !_h2 ) {
            _h2 = $.append( $.Element('h2') );
        }
        if ( h1c != null ) $.fill( _h1, h1c );
        if ( h2c != null ) $.fill( _h2, h2c );

        return [ _h1, _h2 ];
    },


    /**
     * 链接列表项。
     * 结构：li/a
     * 主要用于目录的普通条目。
     * @param  {Element} li 列表项
     * @param  {Node|[Node]} cons 链接内容
     * @param  {String} meth 插入方法
     * @return {Element} 列表项元素
     */
    Ali( li, cons, meth ) {
        return insertLink( li, cons, meth ), li;
    },


    /**
     * 列表标题项。
     * 结构：h5/a
     * 主要用于目录里子级列表的标题项。
     * @param  {Element} h5 列表标题项
     * @param  {Node|[Node]} cons 插入内容
     * @param  {String} meth 插入方法
     * @return {Element} h5
     */
    H5a( h5, cons, meth ) {
        return insertLink( h5, cons, meth ), h5;
    },


    /**
     * 链接元素。
     * 需要剥离内容中的<a>元素。
     * @param  {Element} a 链接元素
     * @param  {Node|[Node]} cons 链接内容
     * @param  {String} meth 插入方法
     * @return {Element} a
     */
    A( a, cons, meth ) {
        return $[meth]( a, stripLinks(cons) ), a;
    },


    /**
     * 级联编号表子表项。
     * 结构：li/h5, ol
     * 内容子列表内的条目与目标子列表执行合并。
     * 子表标题为fill插入方式。
     * @param  {Element} li 列表项
     * @param  {Node|[Node]} h5c 子表标题内容
     * @param  {Element|[Element]} list 内容子列表或列表项集
     * @param  {String} meth 插入方法（prepend|append|fill）
     * @return {Element} 子列表
     */
    Cascadeli( li, [h5c, list], meth ) {
        if ( h5c != null ) {
            blockHeading( 'h5', li, h5c, meth );
        }
        let _ol = $.get( '>ol', li );

        if ( !_ol ) {
            _ol = $.append( li, $.Element('ol') );
        }
        return list && listMerge( _ol, list, meth ), _ol;
    },


    /**
     * 注音。
     * 结构：ruby/rb,rp.Left,rt,rp.Right
     * 不管原始内容，这里仅是添加一个合法的子单元。
     * subs:Object {
     *      rb:  String
     *      rtp: [rp,rt,rp:String]
     * }
     * subs:Element
     * 仅支持合法的注音子元素集，即可执行<ruby>合并。
     *
     * @param  {Element} root 注音根元素
     * @param  {Object|[Element]} subs 注音内容配置或子节点数组
     * @return {Element} root
     */
    Ruby( root, subs, meth ) {
        if ( $.isArray(subs) ) {
            $[meth]( root, subs );
        } else {
            $[meth]( root, rubySubs(subs) );
        }
        return root;
    },

};


//
// 片区（heading, section/）。
// 内容传递 null 表示忽略（不改变）。
/////////////////////////////////////////////////
[
    ['S1', 'h2', 'S2'],
    ['S2', 'h3', 'S3'],
    ['S3', 'h4', 'S4'],
    ['S4', 'h5', 'S5'],
]
.forEach(function( its ) {
    /**
     * @param  {Element} sect 章容器元素
     * @param  {Node|[Node]} h2 章标题内容（兼容空串）
     * @param  {[Element]} els 子片区集或内容件集
     * @param  {String} meth 内容插入方法
     * @param  {Boolean} conItem 内容是否为内容件集，可选
     * @return {[Element|null, [Element]]} 章标题和新插入的内容集
     */
    Creator[ its[0] ] = function( sect, [hx, els], meth, conItem ) {
        if ( conItem == null ) {
            conItem = isConItems(els);
        }
        if ( hx != null ) {
            hx = sectionHeading( its[1], sect, hx, meth );
        }
        return [hx, sectionContent( sect, els, meth, its[2], conItem )];
    };
});


//
// 标题区块（/heading, content）
// 标题为填充方式，内容支持方法指定：{
//      append|prepend|fill
// }
// 注：方法不可以为 before|after|replace。
// 由外部保证内容单元的合法性。
/////////////////////////////////////////////////
[
    ['Abstract',    'h3'],
    ['Header',      'h4'],
    ['Footer',      'h4'],
    ['Blockquote',  'h4'],
    ['Aside',       'h4'],
    ['Details',     'summary'],
]
.forEach(function( its ) {
    /**
     * 传递标题为null表示忽略。
     * @param  {Element} root 内容根元素
     * @param  {Node|[Node]} hx 标题内容
     * @param  {Element|[Element]} 合法的内容元素（集）
     * @param  {String} meth 内容插入方法
     * @return {[Element|null, [Element]]} 标题项和新插入的内容单元
     */
    Creator[ its[0] ] = function( root, [hx, cons], meth ) {
        if ( hx != null ) {
            blockHeading( its[1], root, hx, meth );
        }
        return [ insertBlock(root, cons, meth), cons ];
    };
});


//
// 简单结构容器（一级子单元）。
// 注：由外部（dataTrans）保证内容单元的合法性。
/////////////////////////////////////////////////
[
    // 列表
    'Seealso',
    'Reference',
    'Ul',
    'Ol',
    'Cascade',  // Ali|Cascadeli 项
    'Codelist', // Codeli
    'Dl',       // dt,dd任意混合
]
.forEach(function( name ) {
    /**
     * @param  {Element} box 容器元素
     * @param  {Element|[Element]} 列表项元素（集）
     * @param  {String} meth 插入方法（append|prepend|fill）
     * @return {[Element]} 新插入的列表项元素（集）
     */
    Creator[ name ] = function( box, cons, meth ) {
        return cons && $[meth]( box, cons );
    };
});


//
// 简单容器。
// 子内容简单填充，无结构。
// 注：由外部保证内容单元的合法性。
/////////////////////////////////////////////////
[
    // 内容行
    'P',
    'Address',
    'Pre',
    'Li',
    'Dt',
    'Dd',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'Figcaption',
    'Summary',
    'Th',
    'Td',
    'Caption',

    // 内联文本容器
    'Audio',
    'Video',
    'Picture',
    // 'A',  // 内容<a>剥离
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
    'Code',
    'Orz',
    'Dfn',
    'Samp',
    'Kbd',
    'S',
    'U',
    'Var',
    'Bdo',
    'Meter',
    'B',
    'I',
]
.forEach(function( name ) {
    /**
     * @param  {Element} el 容器元素
     * @param  {Node|[Node]} 合法内容节点（集）
     * @param  {String} meth 插入方法（append|prepend|fill）
     * @return {Element} 容器元素自身
     */
    Creator[ name ] = function( el, cons, meth ) {
        return cons && $[meth]( el, cons ), el;
    };
});


//
// 代码插入。
// 结构：[pre, li]/code/..b..
// 会简单检查插入内容的根容器（剥除<code>）。
// 注：内联节点是数据最小单元，因此需检查。
/////////////////////////////////////////////////
[
    'Codeblock',
    'Codeli',
]
.forEach(function( name ) {
    /**
     * @param  {Element} box 代码根容器
     * @param  {Node|[Node]|''} codes 代码内容
     * @param  {String} meth 插入方法
     * @return {Element} 代码根容器元素
     */
    Creator[ name ] = function( box, codes, meth ) {
        return insertCodes( box, codes, meth ), box;
    };
});


//
// 注音内容。
// <ruby>的子结构，纯文本内容。
/////////////////////////////////////////////////
[
    'Rb',
    'Rp',
    'Rt',
]
.forEach(function( name ) {
    Creator[ name ] = function( el, cons, meth ) {
        return cons && $[meth]( el, $.Text(cons) ), el;
    };
});


//
// 空结构。
// 不支持后期（向内）插入内容。
/////////////////////////////////////////////////
[
    'Hr',
    'Space',
    'Track',
    'Source',
    'Meter',
    'Img',
    'Br',
    'Wbr',
    'Blank',
]
.forEach(function( name ) {
    Creator[ name ] = root => root;
});



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 创建目标元素。
 * 若name首字母大写则为内容名称。
 * 角色定义可能为空（忽略）。
 * @param {String} name 内容名或元素标签
 * @param {String} role 角色定义
 */
function element( name, role ) {
    if ( name[0] <= 'Z' ) {
        return create( name );
    }
    return $.Element( name, role && { role } );
}


/**
 * 创建单个元素。
 * 支持角色（role）在标签冒号之后配置。
 * 注：表格元素需要后续参数 rest: {
 * - rows {Number} 行数
 * - cols {Number} 列数
 * - caption {String} 表标题
 * - th0 {Boolean} 是否列表头
 * }
 * @return {Element}
 */
function single( tags, ...rest ) {
    if ( tags == 'table' ) {
        return $.table( ...rest ).elem();
    }
    return element( ...tags.split(':') );
}


/**
 * 设置块容器的标题内容。
 * 如果标题不存在会自动创建并插入容器最前端。
 * 传递内容为null会删除标题元素。
 * @param  {String} tag 标题标签名
 * @param  {Element} box 所属块容器元素
 * @param  {Node|[Node]|''} cons 标题内容
 * @param  {String} meth 插入方法（fill|append|prepend）
 * @return {Element|null} 标题元素
 */
function blockHeading( tag, box, cons, meth ) {
    let _hx = $.get( `>${tag}`, box );

    if ( cons === null ) {
        return _hx && $.detach(_hx);
    }
    if ( !_hx ) {
        _hx = $.prepend( box, $.Element(tag) );
    }
    return $[meth]( _hx, cons ), _hx;
}


/**
 * 设置片区的标题内容。
 * 如果标题不存在会自动创建并插入关联片区前端。
 * 注：标题内容兼容空串。
 * @param  {String} tag 标题标签名
 * @param  {Element} sect 关联片区元素
 * @param  {Node|[Node]|''} cons 标题内容
 * @param  {String} meth 插入方法（fill|append|prepend）
 * @return {Element} 标题元素
 */
function sectionHeading( tag, sect, cons, meth ) {
    let _hx = $.prev(sect, tag);

    if ( !_hx ) {
        _hx = $.before( sect, $.Element(tag) );
    }
    return $[meth]( _hx, cons ), _hx;
}


/**
 * 添加片区内容。
 * 内容若为片区，外部保证为合法子片区。
 * 内容若为内容件集，则新建片区封装插入。
 * meth: append|prepend|fill
 * @param  {Element} box 片区容器
 * @param  {[Element]|''} cons 子片区或内容件集
 * @param  {String} meth 添加方法
 * @param  {String} sname 新建片区名
 * @param  {Boolean} conItem 内容是否为内容件集
 * @return {Array2} 新插入的片区（标题,片区容器）
 */
function appendSection( box, cons, meth, sname, conItem ) {
    if ( conItem ) {
        let _sx = create(sname);
        cons = Content[sname]( _sx[1], ['', cons], 'append', true );
    }
    return $[meth]( box, cons );
}


/**
 * 设置片区内容。
 * 内容包含子片区集或内容件集（互斥关系）。
 * 原为片区：
 *  - 新片区：简单添加，外部同级保证。
 *  - 内容件：新建一子片区封装插入。
 * 原为内容件：
 *  - 新片区：新建一子片区封装原内容件先行插入。
 *  - 内容件：简单添加（meth）。
 * meth: prepend|append|fill
 * 注：
 * 片区占优（内容可被封装为片区，反之则不行）。
 *
 * @param  {Element} box 片区容器
 * @param  {[Element]|''} cons 子片区集或内容件集
 * @param  {String} meth 插入方法
 * @param  {String} sname 子片区名
 * @param  {Boolean} conItem 内容是否为内容件集
 * @return {[Element]} 新插入的片区或内容件集
 */
function sectionContent( box, cons, meth, sname, conItem ) {
    let _subs = $.children(box);

    if ( !isConItems(_subs) ) {
        return appendSection( box, cons, meth, sname, conItem );
    }
    if ( !conItem ) {
        appendSection( box, _subs, 'append', sname, true );
    }
    return $[meth]( box, cons );
}


/**
 * 创建目录列表（单层）。
 * @param  {Element} ol 列表容器
 * @param  {Element} sec 片区容器
 * @return {Element} ol
 */
function tocList( ol, sec ) {
    let _its = sec.firstElementChild,
        _sec = _its.nextElementSibling;

    while ( _its ) {
        if ( $.is(_its, __hxSlr) ) {
            $.append( ol, tocItem(_its, _sec) );
        }
        _its = _sec.nextElementSibling;
        _sec = _its.nextElementSibling;
    }
    return ol;
}


/**
 * 创建目录列表项（单个）。
 * 如果片区内包含子片区（非纯内容），会递进处理。
 * @param  {Element} hx 标题元素
 * @param  {Element} sect 相邻片区容器
 * @return {Element} 列表项（<li>）
 */
function tocItem( hx, sect ) {
    let _li = null;

    if ( isConItems($.children(sect)) ) {
        _li = Content.Ali( create('Ali'), $.contents(hx) );
    } else {
        _li = Content.Cascadeli( create('Cascadeli'), $.contents(hx) );
        tocList( _li.lastElementChild, sect );
    }
    return _li;
}


/**
 * 检查剥离节点元素的<code>封装。
 * 注：仅检查顶层容器。
 * @param  {Node} node 目标节点
 * @param  {String} tag 剥离元素标签
 * @return {Node|[Node]}
 */
function stripElem( node, tag ) {
    if ( node.nodeType != 1 ) {
        return node;
    }
    return $.is(node, tag) ? $.contents(node) : node;
}


/**
 * 检查/剥离内容中的链接元素。
 * @param  {Node|[Node]} cons 内容节点（集）
 * @return {Node|[Node]}
 */
function stripLinks( cons ) {
    return $.isArray(cons) ?
        cons.map( el => stripElem(el, 'a') ) :
        stripElem( cons, 'a' );
}


/**
 * 插入代码内容。
 * 固定的<code>友好容错修复。
 * @param  {Element} box 代码容器（<code>父元素）
 * @param  {Node|[Node]|''} codes 代码内容（不含<code>封装）
 * @param  {String} meth 插入方法
 * @return {Node|[Node]} 新插入的节点集
 */
function insertCodes( box, codes, meth ) {
    let _cbox = box.firstElementChild;

    if ( !_cbox ||
        !$.is(_cbox, 'code') ) {
        _cbox = $.wrapInner(box, '<code>');
    }
    if ( codes.nodeType ) {
        codes = stripElem( codes, 'code' );
    } else {
        codes = codes.map( el => stripElem(el, 'code') );
    }
    return $[meth]( _cbox, codes );
}


/**
 * 插入链接内容。
 * 如果容器内不为<a>元素，自动创建封装。
 * @param  {Element} box 链接容器（兼容<a>）
 * @param  {Node|[Node]} cons 链接内容
 * @param  {String} meth 插入方法
 * @return {Node|[Node]} cons
 */
function insertLink( box, cons, meth ) {
    let _a = $.get( '>a', box );

    if ( !_a ) {
        _a = $.wrapInner( box, '<a>' );
    }
    return $[meth]( _a, stripLinks(cons) );
}


/**
 * 列表合并。
 * 源如果是列表容器（ol|ul），只能是单个元素。
 * @param  {Element} to 目标列表
 * @param  {Element|[Element]} src 列表项源（ul|ol|[li]）
 * @param  {String} meth 插入方法
 * @return {[Element]} 新插入的列表项
 */
function listMerge( to, src, meth ) {
    if ( src.nodeType ) {
        src = $.children( src );
    }
    return $[meth]( to, src );
}


/**
 * 小区块内容填充。
 * 指包含标题的小区块单元，内容填充不影响标题本身。
 * 注：标题与内容是同级关系。
 * @param  {Element} root 区块根
 * @param  {Element|[Element]} cons 主体内容集
 * @param  {String} meth 插入方法（prepend|append|fill）
 * @return {Element|null} 标题元素
 */
function insertBlock( root, cons, meth ) {
    let _hx = $.detach(
            $.get(__hxBlock)
        );
    $[meth]( root, cons );

    return _hx && $.prepend( root, _hx );
}


/**
 * 检索/设置表格实例。
 * 效率：缓存解析创建的表格实例。
 * @param  {Element} tbl 表格元素
 * @return {Table}
 */
function tableObj( tbl ) {
    let _tbl = __tablePool.get(tbl);

    if ( !_tbl ) {
        __tablePool.set( tbl, new $.Table(tbl) );
    }
    return _tbl;
}


/**
 * 插入方法对应的位置值。
 * @param  {String} meth 方法名
 * @return {Number}
 */
function tableWhere( meth ) {
    switch (meth) {
        case 'append': return -1;
        case 'prepend': return 0;
    }
    return null;
}


/**
 * 获取表格区实例。
 * @param  {Table} tbl 表格实例
 * @param  {String} name 表格区名称（body|head|foot）
 * @param  {Number} bi tBody元素序号，可选
 * @return {TableSection|null}
 */
function tableSection( tbl, name, bi = 0 ) {
    switch (name) {
        case 'head': return tbl.head();
        case 'foot': return tbl.foot();
        case 'body': return tbl.body()[bi];
    }
    return null;
}


/**
 * 获取表格单元格集。
 * 根据插入方法返回新建或清空的单元格集。
 * meth为填充时会清空rows行的单元格。
 * @param  {Table} tbl 表格实例（$.Table）
 * @param  {String} meth 插入方法
 * @param  {Number} rows 插入行数，可选
 * @param  {String} name 表格区名称（body|head|foot），可选
 * @param  {Number} bi tBody元素序号，可选
 * @return {Collector|null} 单元格集
 */
function tableCells( tbl, meth, rows, name, bi ) {
    let _tsec = tableSection(tbl, name, bi);

    if ( !_tsec && name ) {
        return null;
    }
    if ( meth == 'fill' ) {
        return tbl.gets(0, rows, _tsec).find('th,td').flat().empty().end();
    }
    return tbl[name](tableWhere(meth), rows, _tsec).find('th,td').flat();
}


/**
 * 获取表体元素序号。
 * 约束：实参表体必须在实参表格元素之内。
 * @param  {Table} tbo 表格实例
 * @param  {Element} tbody 表体元素
 * @return {Number}
 */
function tbodyIndex( tbo, tbody ) {
    let _bs = tbo.body();
    return _bs.length == 1 ? 0 : _bs.indexOf(tbody);
}


/**
 * 变通表格行插入方法。
 * meth: before|after|prepend|append
 * @param  {String} meth 方法名
 * @return {String}
 */
function trMeth( meth ) {
    switch (meth) {
        case 'prepend':
            return 'before';
        case 'append':
            return 'after';
    }
    return __trMeths.include(meth) && meth;
}


/**
 * 克隆表格行。
 * 包含表格行上注册的事件处理器。
 * @param  {Element} tr 表格行
 * @param  {Number} rows 目标行数
 * @param  {Boolean} clean 是否清除内容
 * @return {[Element]} 表格行集
 */
function trClone( tr, rows, clean ) {
    let _new = $.clone(tr, true),
        _buf = [_new];

    if ( clean ) {
        $(_new.cells).empty();
    }
    for (let i = 0; i < rows-1; i++) {
        _buf.push( $.clone(_new, true) );
    }
    return _buf;
}


/**
 * 注音内容构造。
 * obj: {
 *      rb:  String
 *      rtp: [rp,rt,rp:String]
 * }
 * @param  {Object} obj 注音内容配置
 * @return {[Element]} 内容节点集
 */
function rubySubs( obj ) {
    return [
        $.Element('rb', obj.rb),
        obj.rtp[0] && $.Element('rp', obj.rtp[0]),
        $.Element('rt', obj.rtp[1]),
        obj.rtp[2] && $.Element('rp', obj.rtp[2]),
    ];
}


//
// 扩展&导出。
//////////////////////////////////////////////////////////////////////////////


//
// By扩展：
// New.[cell-name](...)
//
extend( 'New', Creator );


export { create };
