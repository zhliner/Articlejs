//! $Id: factory.js 2019.09.07 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元创建工厂。
//
//  文章
//  - 要件：页标题（h1），副标题（h2，可选）。
//  - 附件：提要、目录、另参见、文献参考。
//  - 内容：片区集或内容集（互斥）。
//
//  片区
//  - 要件：标题（h2~h6）。
//  - 附件：（无）
//  - 内容：子片区集或内容集（互斥）。
//
//  片区集
//  片区的无序并列集，是一个独立的逻辑单元。
//  - 附件：导言、结语。
//
//  内容集
//  内容件的无序并列集，是一个独立的逻辑单元。
//  - 附件：导言、结语。
//
//  ---------------------------------------------
//
//  内容件：
//  独立的内容单元，标题仅是一个可选的部分（非要件）。
//
//  内容行：
//  可直接包含文本节点的行块元素，包括<td>和<th>。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


const
    // 片区标题选择器。
    __hxSlr = 'h2, h3, h4, h5, h6',

    // 简单标签。
    // 含role定义配置。
    __reTag = /^[a-z][a-z:]*$/;


//
// 单元映射 {
//      name: tags
// }
// name: 内容名称。用于创建内容时标识区分。
// tags: 内容元素序列，固定结构。
//      /   斜线分隔父子单元
//      :   冒号分隔角色定义（role）
//      ,   逗号分隔并列单元
// 注：
// 固定结构限于可选而非可变（如<li>就不属于）。
// 绑定事件处理可用 Tpb.Build(el, obts) 单项构建或事件克隆接口（$.cloneEvent）。
//
const tagsMap = {

    // 块容器
    // ------------------------------------------
    Abstract:   'header:abstract/h3',
    Toc:        'nav:toc/h4, Cascade',
    Seealso:    'ul:seealso',
    Reference:  'ol:reference',
    Header:     'header/h4',
    Footer:     'footer/h4',
    Article:    'h1, article',
    S1:         'h2, section:s1',
    S2:         'h3, section:s2',
    S3:         'h4, section:s3',
    S4:         'h5, section:s4',
    S5:         'h6, section:s5',
    Ul:         'ul',
    Ol:         'ol',
    Cascade:    'ol:cascade',
    Codelist:   'ol:codelist',
    Dl:         'dl',
    Table:      'table',  // 单独处理！
    Figure:     'figure/figcaption',
    Blockquote: 'blockquote/h4',
    Aside:      'aside/h4',
    Details:    'details/summary',
    Codeblock:  'pre:codeblock/code',


    // 块内容
    // ------------------------------------------
    P:          'p',
    Address:    'address',
    Pre:        'pre',
    Hr:         'hr',
    Space:      'div:space',


    // 结构单元
    // ------------------------------------------
    Hgroup:     'hgroup',
    Li:         'li',
    Codeli:     'li/code',
    Ali:        'li/a',
    Cascadeli:  'li/h5, ol',
    H1:         'h1',
    H2:         'h2',
    H3:         'h3',
    H4:         'h4',
    H5:         'h5',
    H6:         'h6',
    Figcaption: 'figcaption',
    Summary:    'summary',
    Track:      'track',
    Source:     'source',


    // 行内单元
    // ------------------------------------------
    Audio:      'audio',
    Video:      'video',
    Picture:    'picture/img',
    A:          'a',
    Strong:     'strong',
    Em:         'em',
    Q:          'q',
    Abbr:       'abbr',
    Cite:       'cite',
    Small:      'small',
    Time:       'time',
    Del:        'del',
    Ins:        'ins',
    Sub:        'sub',
    Sup:        'sup',
    Mark:       'mark',
    Code:       'code',
    Orz:        'code:orz',
    Ruby:       'ruby/rb, rp, rt',
    Dfn:        'dfn',
    Samp:       'samp',
    Kbd:        'kbd',
    S:          's',
    U:          'u',
    Var:        'var',
    Bdo:        'bdo',
    Meter:      'meter',
    B:          'b',
    I:          'i',
    Img:        'img',
    Blank:      'span:blank',
};


//
// 文章。
// 封装文章对象的相关规则。
// 前端：主标题（h1必要），副标题（h2可选）。
// 平级前端：提要、目录（可选）。
// 平级后端：另参见、文献参考（可选）。
// 子级内容：片区集或内容集，互斥关系。
// 注：
// 文章元素本身是基础参照，不可删除。
// 如果有副标题，主副标题顺序存放在一个<hgroup>之内。
//
class Article {
    /**
     * 构建文章实例。
     * ael需要已经存在于DOM中或拥有父元素。
     * @param {Element} ael 文章元素
     */
    constructor( ael ) {
        let _h1 = $.get('h1', ael.parentElement),
            _h2 = _h1 && _h1.nextElementSibling;

        this._heading = _h1;
        this._heading2 = _h2 && $.is(_h2, 'h2') ? _h2 : null;

        this._toc = $.prev(ael, 'nav[role=toc]');
        this._abstract = $.prev(ael, 'header[role=abstract]');

        this._article = ael;
        this._content = sectCons( $.children(ael) );

        this._seealso = $.next(ael, 'ul[role=seealso]');
        this._reference = $.next(ael, 'ol[role=reference]')

        // h1/h2标题容器
        this._hgroup = this._heading2 && this._heading2.parentElement;
    }


    /**
     * 获取/设置主标题。
     * 设置时若无标题，会新建一个。
     * 传递code为null会删除标题元素。
     * 返回标题元素，不论是删除、设置还是新建。
     * @param  {String|Node|[Node]} data 标题内容
     * @return {Element}
     */
    h1( data ) {
        if ( data === undefined ) {
            return this._heading;
        }
        return this._setH1( this._heading, data );
    }


    /**
     * 获取/设置副标题。
     * 参数说明参考.h1()。
     * @param  {String|Node|[Node]} data 标题内容
     * @return {Element}
     */
    h2( data ) {
        if ( data === undefined ) {
            return this._heading2;
        }
        return this._setH2( this._heading2, data );
    }


    /**
     * 获取/设置文章内容。
     * @param  {Section|Conitem} cons 片区或内容件
     * @return {Sections|Conitems|void}
     */
    content( cons ) {
        if ( cons === undefined ) {
            return this._content;
        }
        this._content.push( cons );
    }


    /**
     * 获取/插入提要单元。
     * 传递el为null会删除提要单元（并返回）。
     * 如果本来就没有提要，会返回null。
     * 注：
     * 封装插入位置规则。
     * 仅支持一个提要单元，多出的插入会抛出异常。
     * 下类同。
     * @param  {Element} el 提要元素
     * @return {Element|null|void} 提要元素
     */
    abstract( el ) {
        if ( el === undefined ) {
            return this._abstract;
        }
        return this._annexSet('_abstract', el, 'before', this._toc || this._article);
    }


    /**
     * 获取/插入目录单元。
     * 传递el为null会删除目录单元（并返回）。
     * 位置：内容（<article>）之前。
     * @param  {Element} el 目录元素
     * @return {Element|null|void} 目录元素
     */
    toc( el ) {
        if ( el === undefined ) {
            return this._toc;
        }
        return this._annexSet('_toc', el, 'before', this._article);
    }


    /**
     * 获取/插入另参见单元。
     * 传递el为null会删除另参见单元（并返回）。
     * 位置：内容（<article>）之后。
     * @param  {Element} el 目录元素
     * @return {Element|null|void} 目录元素
     */
    seealso( el ) {
        if ( el === undefined ) {
            return this._seealso;
        }
        return this._annexSet('_seealso', el, 'after', this._article);
    }


    /**
     * 获取/插入参考单元。
     * 传递el为null会删除参考单元（并返回）。
     * 位置：另参见或内容之后。
     * @param  {Element} el 目录元素
     * @return {Element|null|void} 目录元素
     */
    reference( el ) {
        if ( el === undefined ) {
            return this._reference;
        }
        return this._annexSet(
            '_reference', el, 'after', this._seealso || this._article
        );
    }


    //-- 私有辅助 ------------------------------------------------------------


    /**
     * 获取或设置标题。
     * 没有标题时新建一个标题，插入最前端或副标题之前（如果有）。
     * @param  {Element|null} h1 原主标题
     * @param  {String|Node|[Node]} data 内容数据
     * @return {Element}
     */
    _setH1( h1, data ) {
        if ( !h1 ) {
            this._heading = $.prepend(
                this._hgroup || this._article.parentElement,
                create( 'H1' )
            );
        }
        return setContent( this._heading, data );
    }


    /**
     * 获取或设置标题。
     * 没有副标题时新建一个h2标题。
     * 副标题会要求一个标题组（<hgroup>），如果没有会新建。
     * @param  {Element|null} h2 原副标题
     * @param  {String|Node|[Node]} data 内容数据
     * @return {Element}
     */
    _setH2( h2, data ) {
        if ( !h2 ) {
            if ( !this._hgroup ) {
                this._hgroup = $.prepend( this._article.parentElement, create('Hgroup') );
                // 移动<h1>
                $.append( this._hgroup, this._heading );
            }
            this._heading2 = $.append( this._hgroup, create('H2') );
        }
        return setContent( this._heading2, data );
    }


    /**
     * 设置/插入目标附件。
     * @param {String} name 附件名
     * @param {Element} el 待插入附件元素
     * @param {String} meth 插入方法
     * @param {Element} ref 插入参考
     */
    _annexSet( name, el, meth, ref ) {
        if ( el === null ) {
            let _re = this[name];
            this[name] = null;
            return _re && $.detach( _re );
        }
        if ( this[name] ) {
            throw new Error( `[${name.substring(1)}] is already exist.` );
        }
        this[name] = $[meth]( ref, el );
    }

}


//
// 内容设置函数集。
// 对create创建的结构空元素设置实际的内容。
// 如果内容为null表示忽略。
//
const Content = {
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
     *
     * @param  {Element} ael 文章元素
     * @param  {Node|[Node]} h1 主标题内容
     * @param  {[Element]} cons 章片区集或内容件集
     * @param  {String} meth 内容插入方法
     * @param  {Boolean} conItem 内容是否为内容件集，可选
     * @return {[Element]} 新插入的片区或内容件集
     */
    Article( ael, h1, cons, meth, conItem ) {
        if ( h1 != null ) {
            blockHeading( 'h1', ael.parentElement, h1, 'fill' );
        }
        if ( conItem == null ) {
            conItem = contentItems(cons);
        }
        return sectionContent( ael, cons, meth, 'S1', conItem );
    },


    /**
     * 章片区。
     * 主结构：section:s1/[h2, section:s2]...
     * 内容仅限于子片区集或内容件集（外部保证）。
     * meth: prepend|append|fill
     * @param  {Element} sect 章容器元素
     * @param  {Node|[Node]} h2 章标题内容（兼容空串）
     * @param  {[Element]} cons 子片区或内容件集
     * @param  {String} meth 内容插入方法
     * @param  {Boolean} conItem 内容是否为内容件集，可选
     * @return {[Element]} 新插入的子片区或内容件集
     */
    S1( sect, h2, cons, meth, conItem ) {
        if ( conItem == null ) {
            conItem = contentItems(cons);
        }
        sectionHeading( 'h2', sect, h2, 'fill' );

        return sectionContent( sect, cons, meth, 'S2', conItem );
    },


    /**
     * 节片区。
     * 主结构：section:s2/[h3, section:s3]...
     * 参数说明参考.S1(...)接口。
     */
    S2( sect, hx, cons, meth, conItem ) {
        if ( conItem == null ) {
            conItem = contentItems(cons);
        }
        sectionHeading( 'h3', sect, hx, 'fill' );

        return sectionContent( sect, cons, meth, 'S3', conItem );
    },


    /**
     * 区片区。
     * 主结构：section:s3/[h4, section:s4]...
     * 参数说明参考.S1(...)接口。
     */
    S3( sect, hx, cons, meth, conItem ) {
        if ( conItem == null ) {
            conItem = contentItems(cons);
        }
        sectionHeading( 'h4', sect, hx, 'fill' );

        return sectionContent( sect, cons, meth, 'S4', conItem );
    },


    /**
     * 段片区。
     * 主结构：section:s4/[h5, section:s5]...
     * 参数说明参考.S1(...)接口。
     */
    S4( sect, hx, cons, meth, conItem ) {
        if ( conItem == null ) {
            conItem = contentItems(cons);
        }
        sectionHeading( 'h5', sect, hx, 'fill' );

        return sectionContent( sect, cons, meth, 'S5', conItem );
    },


    /**
     * 末片区。
     * 主结构：section:s5/conitem...
     * 注：只能插入内容件集。
     * @param  {Element} sect 片区容器元素
     * @param  {[Element]} cons 内容件集
     * @param  {String} meth 内容插入方法
     * @return {[Element]} 新插入的内容件集
     */
    S5( sect, cons, meth ) {
        return $[meth]( sect, cons );
    },


    // Table() {},  // 单独处理。


    /**
     * 插图。
     * 结构：figure/figcaption, p/img...
     * 仅认可首个图片容器元素（<p>）。
     * @param  {Element} root 插图根元素
     * @param  {Node|[Node]|''} cap 标题内容
     * @param  {Element|[Element]} imgs 图片元素（集）
     * @param  {String} meth 图片插入方法（prepend|append|fill）
     * @return {[Element]} 新插入的图片集
     */
    Figure( root, cap, imgs, meth ) {
        if ( cap != null ) {
            blockHeading( 'figcaption', root, cap, 'fill' );
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
    Hgroup( root, h1c, h2c ) {
        let _h1 = root.firstElementChild,
            _h2 = root.lastElementChild;

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
     * @param {Element} li 列表项
     * @param {Node|[Node]} cons 链接内容
     * @param {String} meth 插入方法
     */
    Ali( li, cons, meth ) {
        //
    },


    /**
     * 列表标题项。
     * 结构：h5/a
     * 主要用于目录里子级列表的标题项。
     * @param {Element} h5 列表标题项
     * @param {Node|[Node]} cons 插入内容
     * @param {String} meth 插入方法
     */
    H5a( h5, cons, meth ) {
        //
    },


    Cascadeli( li, h5c, olc ) {
        //
    },


    Ruby( root, rb, rt, rp = [] ) {
        //
    },

};


//
// 标题区块（/heading, content）
// 标题为填充方式，内容支持方法指定：{
//      append|prepend|fill
// }
// 注：
// 方法不可以为 before|after|replace。
// 由外部保证内容单元的合法性。
///////////////////////////////////////
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
     * @param  {Element} root 内容根元素
     * @param  {Node|[Node]} hx 标题内容
     * @param  {Element|[Element]} 合法的内容元素（集）
     * @param  {String} meth 内容插入方法
     */
    Content[ its[0] ] = function( root, hx, cons, meth ) {
        if ( hx != null ) {
            blockHeading( its[1], root, hx, 'fill' );
        }
        return cons && $[meth](root, cons), root;
    };
});


//
// 简单容器。
// 子内容简单填充，无结构。
// 注：由外部保证内容单元的合法性。
///////////////////////////////////////
[
    // 列表
    'Seealso',
    'Reference',
    'Ul',
    'Ol',
    'Cascade',  // Ali|Cascadeli 项
    'Codelist', // Codeli

    // 内容行
    'P',
    'Address',
    'Pre',
    'Li',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'Figcaption',
    'Summary',

    // 内联文本容器
    'Audio',
    'Video',
    'Picture',
    'A',
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
     * @param  {Element} box 容器元素
     * @param  {Node|[Node]} 合法内容节点（集）
     * @param  {String} meth 插入方法（append|prepend|fill）
     * @return {[Element]} 新插入的节点集
     */
    Content[ name ] = function( box, cons, meth ) {
        return cons && $[meth](box, cons);
    };
});


//
// 代码插入。
// 结构：[pre, li]/code/..b..
// 会简单检查插入内容的根容器（剥除<code>）。
///////////////////////////////////////
[
    'Codeblock',
    'Codeli',
]
.forEach(function( name ) {
    /**
     * @param {Element} box 代码表项容器
     * @param {Node|[Node]|''} codes 代码内容
     * @param {String} meth 插入方法
     */
    Content[ name ] = function( box, codes, meth ) {
        return insertCodes( box, codes, meth );
    };
});


//
// 空结构。
// 不支持后期插入内容。
///////////////////////////////////////
[
    'Hr',
    'Space',
    'Track',
    'Source',
    'Meter',
    'Img',
    'Blank',
]
.forEach(function( name ) {
    Content[ name ] = root => root;
});



//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 创建内容结构。
 * 包括非独立逻辑的中间结构。
 * 不包含实际的内容实体。
 * @param  {String} name 内容名称
 * @param  {...Value} 剩余参数（适用table）
 * @return {Element|[Element]} 结构根（序列）
 */
function create( name, ...rest ) {
    let _tags = tagsMap[name];

    if ( !_tags ) {
        throw new Error(`[${name}] name not found.`);
    }
    if ( __reTag.text(_tags) ) {
        return single( _tags, ...rest );
    }
    _tags = _tags.split('/');

    return elemSubs( siblings(_tags.shift()), _tags );
}


/**
 * 创建并插入子元素序列。
 * 子元素集插入到上级末尾元素内。
 * 返回值优化：
 * 如果父级只有一个元素，返回该元素本身。否则返回父级存储本身。
 *
 * @param  {[Element]} buf 父级元素存储
 * @param  {[String]} tags 纵向标签序列集
 * @return {Element|[Element]} 父级元素（集）
 */
function elemSubs( buf, tags ) {
    let _last = buf[buf.length - 1];

    for ( const ts of tags) {
        let _els = siblings( ts.trim() );
        _last.append( ..._els );
        _last = _els[_els.length - 1];
    }
    return buf.length > 1 ? buf : buf[0];
}


/**
 * 创建平级兄弟元素序列。
 * @param {String} tags 标签序列
 */
function siblings( tags ) {
    return tags.split(',')
        .map( s => s.trim() )
        .map( n => element(...n.split(':')) );
}


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
    let _hx = $.get( tag, box );

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
    let _hx = $.prev(sect);

    if ( !_hx || !$.is(_hx, tag) ) {
        _hx = $.before( sect, $.Element(tag) );
    }
    return $[meth]( _hx, cons ), _hx;
}


/**
 * 是否为内容件集。
 * 片区有严格的层次结构，因此检查标题情况即可。
 * 注：空集视为内容件集。
 * @param  {[Element]|''} els 子片区集或内容件集
 * @return {Boolean}
 */
function contentItems( els ) {
    return els.length == 0 || !els.some( el => $.is(el, __hxSlr) );
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
        cons = Content[sname]( _sx[1], '', cons, 'append', true );
    }
    return $[meth]( box, cons );
}


/**
 * 设置片区内容。
 * 内容包含子片区集或内容件集（互斥关系）。
 * 原为片区：
 *  - 新片区：简单添加，外部同级保证。
 *  - 内容件：新建一片区封装插入。
 * 原为内容件：
 *  - 新片区：新建一片区封装原内容件先行插入。
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

    if ( !contentItems(_subs) ) {
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

    if ( contentItems($.children(sect)) ) {
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
 * @return {Node|[Node]}
 */
function stripCode( node ) {
    if ( node.nodeType != 1 ) {
        return node;
    }
    return $.is(node, 'code') ? $.contents(node) : node;
}


/**
 * 插入代码内容。
 * 固定的<code>友好容错修复。
 * @param {Element} box 代码容器（<code>父元素）
 * @param {Node|[Node]|''} codes 代码内容（不含<code>封装）
 * @param {String} meth 插入方法
 */
function insertCodes( box, codes, meth ) {
    let _cbox = box.firstElementChild;

    if ( !_cbox ||
        !$.is(_cbox, 'code') ) {
        _cbox = $.wrapInner(box, '<code>');
    }
    if ( codes.nodeType ) {
        codes = stripCode( codes );
    } else {
        codes = $.map( codes, stripCode );
    }
    return $[meth]( _cbox, codes );
}


//
// 导出
//////////////////////////////////////////////////////////////////////////////


export const Factory = {  };
