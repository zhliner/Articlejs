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

import * as types from "./types.js";


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
//      ,   逗号分隔并列单元，顺序为参数顺序
// 注：
// 固定结构限于可选而非可变（如<li>就不属于）。
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
    Article:    'h1, Abstract, article',
    S1:         'h2, Header, section:s1, Footer',
    S2:         'h3, Header, section:s2, Footer',
    S3:         'h4, Header, section:s3, Footer',
    S4:         'h5, Header, section:s4, Footer',
    S5:         'h6, Header, section:s5, Footer',
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
    Blockcode:  'pre:blockcode/code',


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
// 片区：章。
//
class Section1 {
    //
}


//
// 片区：节。
//
class Section2 {
    //
}


//
// 片区：区。
class Section3 {
    //
}


// 片区：段。
class Section4 {
    //
}


// 片区：末。
class Section5 {
    //
}


//
// 内容件。
// 通用类，单元类型不同允许的操作稍有不同（如仅片区支持导言）。
// 内容（content）操作是所有单元都支持的。
// 注：对于不支持的操作，返回null。
//
class Conitem {
    /**
     * 创建单元。
     * 传递字符串名称新建目标单元。
     * 传递元素则解析为相应内容单元。
     * 注：对于不识别的名称或元素，会抛出异常。
     * @param {String|Element} its 单元名称或元素
     */
    constructor( its ) {
        this._name;
        //
    }


    /**
     * 获取/设置标题内容。
     * 获取时传递con为true，返回标题源码，否则返回文本。
     * 设置时支持字符串和节点/集，返回当前实例。
     * 注：
     * 如果缺少标题元素，获取时返回null，设置时自动创建。
     * 对于无需标题结构的单元，获取返回false。
     * @param {String|Node|[Node]|true} con 插入内容或获取标记
     * @param {Boolean} ishtml 是否HTML方式插入，可选
     * @return {String|null|false|this}
     */
    heading( con, ishtml ) {
        //
    }


    /**
     * 获取/设置导言。
     * 获取时返回内容成员（子元素）集。
     * 如果是无需导言结构的单元，返回false。
     * @param  {String|[String]Element|[Element]} its 内容序列
     * @return {[Element]|false|this}
     */
    header( its ) {
        //
    }


    /**
     * 获取/设置内容。
     * 获取时返回内容单元集。
     * 设置时返回当前实例。
     * @param  {String|[String]Element|[Element]} its 内容序列
     * @return {[Element]|this}
     */
    content( its ) {
        //
    }


    footer( its ) {
        //
    }
}


//
// 片区集。
//
class Sections extends Array {
    //
}


//
// 内容件集。
//
class Conitems extends Array {
    //
}


//
// 工具函数
//////////////////////////////////////////////////////////////////////////////


/**
 * 创建内容结构。
 * 包括非独立逻辑的中间结构。
 * 不包含实际的内容实体。
 * @param  {String} name 内容名称
 * @param  {...Value} 剩余参数（适用table）
 * @return {Element} 结构根
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
 * 获取目标元素的内容（node|html|text）。
 * 注：非法类型返回null。
 * @param  {Element} el 源元素
 * @param  {String} type 取值类型
 * @return {String|null}
 */
function getSource( el, type ) {
    switch ( type ) {
        case 'text':
            return $.text( el );
        case 'html':
            return $.html( el );
        case 'node':
            return $.contents( el );
    }
    return null;
}


/**
 * 设置目标元素的内容。
 * @param  {Element} box 目标元素
 * @param  {String|Node|[Node]} data 设置值
 * @return {Element} box
 */
function setContent( box, data ) {
    if ( data === null ) {
        return $.detach( box );
    }
    let _meth = typeof data == 'string' ?
        'html' :
        'fill';
    return $[_meth]( box, data ), box;
}


/**
 * 获取首个片区标题。
 * 仅限于<article>和<section>的子元素。
 * 如果没有标题（h2-h6），表示是一个内容件集。
 * @param  {[Element]} els 子元素集
 * @return {String|null}
 */
function sectHead( els ) {
    for ( const el of els ) {
        if ( $.is(el, __hxSlr) ) return el.nodeName;
    }
    return null;
}


/**
 * 创建片区集或内容件集。
 * 仅限于<article>和<section>的子元素集。
 * 如果子元素集内无标题，表示是一个内容件集。
 * @param  {[Element]} els 子元素集
 * @return {Sections|Conitems}
 */
function sectCons( els ) {
    let _hx = sectHead( els );
}


//
// 导出
//////////////////////////////////////////////////////////////////////////////


export const Factory = {  };
