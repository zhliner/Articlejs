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
//
///////////////////////////////////////////////////////////////////////////////
//

import * as types from "./types.js";


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
    abstract:   'header:abstract/h3',
    toc:        'nav:toc/h4, cascade',
    seealso:    'ul:seealso',
    references: 'ol:references',
    header:     'header/h4',
    footer:     'footer/h4',
    article:    'h1, abstract, article',
    s1:         'h2, header, section:s1, footer',
    s2:         'h3, header, section:s2, footer',
    s3:         'h4, header, section:s3, footer',
    s4:         'h5, header, section:s4, footer',
    s5:         'h6, header, section:s5, footer',
    ul:         'ul',
    ol:         'ol',
    cascade:    'ol:cascade',
    codelist:   'ol:codelist',
    dl:         'dl',
    table:      '*',  // 单独处理：$.table
    figure:     'figure/figcaption',
    blockquote: 'blockquote/h4',
    aside:      'aside/h4',
    details:    'details/summary',
    blockcode:  'pre:blockcode/code',


    // 块内容
    // ------------------------------------------
    p:          'p',
    address:    'address',
    pre:        'pre',
    hr:         'hr',
    space:      'div:space',


    // 结构单元
    // ------------------------------------------
    li:         'li',
    codeli:     'li/code',
    ali:        'li/a',
    cascadeli:  'li/h5, ol',
    h1:         'h1',
    h2:         'h2',
    h3:         'h3',
    h4:         'h4',
    h5:         'h5',
    h6:         'h6',
    figcaption: 'figcaption',
    summary:    'summary',
    track:      'track',
    source:     'source',


    // 行内单元
    // ------------------------------------------
    audio:      'audio',
    video:      'video',
    picture:    'picture/img',
    a:          'a',
    strong:     'strong',
    em:         'em',
    q:          'q',
    abbr:       'abbr',
    cite:       'cite',
    small:      'small',
    time:       'time',
    del:        'del',
    ins:        'ins',
    sub:        'sub',
    sup:        'sup',
    mark:       'mark',
    code:       'code',
    orz:        'code:orz',
    ruby:       'ruby/rb, rp, rt',
    dfn:        'dfn',
    samp:       'samp',
    kbd:        'kbd',
    s:          's',
    u:          'u',
    var:        'var',
    bdo:        'bdo',
    meter:      'meter',
    b:          'b',
    i:          'i',
    img:        'img',
    blank:      'span:blank',
};


//
// 内容单元。
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
///////////////////////////////////////////////////////////////////////////////


function table( rows, cols, caption, th0 ) {

}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


export const Factory = {  };
