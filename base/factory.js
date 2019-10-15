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
//  - 要件：页标题（h1）
//  - 附件：提要、目录、另参见、文献参考
//  - 内容：片区集或内容集（互斥）
//
//  片区
//  - 要件：标题（h2~h6）
//  - 附件：（无）
//  - 内容：子片区集或内容集（互斥）
//
//  片区集
//  片区的无序并列集，是一个独立的逻辑单元。
//  - 附件：导言、结语
//
//  内容集
//  内容件的无序并列集，是一个独立的逻辑单元。
//  - 附件：导言、结语
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
    References: 'ol:references',
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
// 平级前端：h1标题（必要），提要、目录（可选）
// 平级后端：另参见、文献参考（可选）
// 子级内容：片区集或内容集，互斥关系
//
class Article {
    /**
     * @param {Element} ael 文章元素
     */
    constructor( ael ) {
        //
    }
}


//
// 片区。
//
class Section {
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
// 功能函数
///////////////////////////////////////////////////////////////////////////////


function h1( data ) {
    //
}


function abstract( data ) {
    //
}


function toc( article ) {
    //
}


function seealso( data ) {
    //
}


function references( data ) {
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
    if ( _tags == 'table' ) {
        return table( ...rest );
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
 * 创建一个指定行列数的空表格。
 * 默认包含了一个空的表格标题（caption）。
 * @param  {Number} rows 行数
 * @param  {Number} cols 列数
 * @param  {Boolean} th0 是否列表头
 * @return {Element}
 */
function table( rows, cols, caption = '', th0 = false ) {
    return $.table( rows, cols, caption, th0 ).elem();
}


//
// 导出
//////////////////////////////////////////////////////////////////////////////


export const Factory = {  };
