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
//  结构块：
//      <header role="abstract">    // 提要：/h3, p...
//      <nav role="toc">            // 目录：/h4/a, ol/li/a（可多级）
//      <header>                    // 导言：/h4, p...
//      <footer>                    // 尾注：/h4, p...
//      <section>                   // 片区：/section/h2-h6, ...
//      <section role="content">    // 正文区：/[^hx, section]...
//      <ul>                        // 无序列表：/li/...
//      <ul role="seealso">         // 另参见：/li/...
//      <ol>                        // 有序列表：/li/...
//      <ol role="cascade">         // 多级编号列表：/li/ol, ul/li...
//      <ol role="codes">           // 代码表：/li/code/b, #text
//      <ol role="references">      // 文献参考：/li/...
//      <dl>                        // 定义列表：/dt, dd/...
//      <table>                     // 表格：/caption, thead, tbody, tfoot/tr/td/...
//      <figure>                    // 插图：/figcaption, p...
//      <blockquote>                // 引用块：/h4, p...
//      <aside>                     // 批注：/h4, p...
//      <details>                   // 详细内容：/summary, p...
//      <pre role="blockcode">      // 代码块：/code/b, #text
//
//  内容块：
//      <p>                         // 段落，通用内容容器
//      <address>                   // 地址信息
//      <pre>                       // 预排版（非代码块）
//      <hr/>                       // 线条
//      <div role="space">          // 空白块：用于交互展示
//
//  行内单元：
//      <audio>                 // 音频：/track,source, #text
//      <video>                 // 视频：/track,source, #text
//      <picture>               // 图片：/source,img
//      <a>                     // 链接
//      <strong>                // 重点
//      <em>                    // 强调
//      <q>                     // 短引用
//      <abbr>                  // 缩写
//      <cite>                  // 来源
//      <small>                 // 注脚
//      <time>                  // 时间
//      <del>                   // 删除
//      <ins>                   // 插入
//      <sub>                   // 下标
//      <sup>                   // 上标
//      <mark>                  // 标记
//      <code>                  // 代码
//      <code role="orz">       // 表情
//      <ruby>                  // 注音：/rb, rp, rt
//      <dfn>                   // 定义
//      <samp>                  // 样本
//      <kbd>                   // 键盘字
//      <s>                     // 失效
//      <u>                     // 注记
//      <var>                   // 变量
//      <bdo>                   // 文本方向
//      <meter>                 // 度量
//      <b>                     // 粗体，主要用于代码块内的关键字包裹
//      <i>                     // 斜体，主要用于图标占位（icon）
//      <img/>                  // 图片
//      <span role="blank">     // 空白段：用于交互展示
//
//
///////////////////////////////////////////////////////////////////////////////
//

import * as types from "./types.js";


//
// 单元映射 {
//      name: [tags, role]
// }
// tags：基础元素结构，附带基本标题。
// role：角色名称，书写在根元素的 role 属性上。
//
// 注：用于创建初始的目标单元。
//
const tagsMap = {

    // 块容器
    // ------------------------------------------
    abstract:   ['header/h3', 'abstract'],
    toc:        ['nav/h4', 'toc'],
    header:     ['header/h4'],
    footer:     ['footer/h4'],
    s1:         ['section/h2'],
    s2:         ['section/h3'],
    s3:         ['section/h4'],
    s4:         ['section/h5'],
    s5:         ['section/h6'],
    content:    ['section', 'content'],
    ul:         ['ul/li'],
    seealso:    ['ul/li', 'seealso'],
    ol:         ['ol/li'],
    cascade:    ['ol/li', 'cascade'],
    codelist:   ['ol/li', 'codelist'],
    references: ['ol/li', 'references'],
    dl:         ['dl/dt'],
    table:      ['*'],  // 单独处理：$.table
    figure:     ['figure/figcaption'],
    blockquote: ['blockquote/h4'],
    aside:      ['aside/h4'],
    details:    ['details/summary'],
    blockcode:  ['pre/code', 'blockcode'],


    // 块内容
    // ------------------------------------------
    p:          ['p'],
    address:    ['address'],
    pre:        ['pre'],
    hr:         ['hr'],
    space:      ['div', 'space'],


    // 行内单元
    // ------------------------------------------
    audio:      ['audio'],
    video:      ['video'],
    picture:    ['picture'],
    a:          ['a'],
    strong:     ['strong'],
    em:         ['em'],
    q:          ['q'],
    abbr:       ['abbr'],
    cite:       ['cite'],
    small:      ['small'],
    time:       ['time'],
    del:        ['del'],
    ins:        ['ins'],
    sub:        ['sub'],
    sup:        ['sup'],
    mark:       ['mark'],
    code:       ['code'],
    orz:        ['code', 'orz'],
    ruby:       ['ruby/rb'],
    dfn:        ['dfn'],
    samp:       ['samp'],
    kbd:        ['kbd'],
    s:          ['s'],
    u:          ['u'],
    var:        ['var'],
    bdo:        ['bdo'],
    meter:      ['meter'],
    b:          ['b'],
    i:          ['i'],
    img:        ['img'],
    blank:      ['span', 'blank'],
};


//
// 内容单元。
//
class Conitem {

    constructor( el, name ) {
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
}


//
// 功能函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 创建目标单元。
 * 字符串的cons被视为文本。
 * 可以传入已构造好的节点或文档片段获得源码效果。
 * @param  {String} name 单元名称
 * @param  {String|Node|DocumentFragment} cons 初始内容，可选
 * @return {Element} 单元根元素
 */
function create( name, cons ) {
    //
}


/**
 * 插入/更新单元标题。
 * 仅适用于有标题结构的单元（包括caption）。
 * 如果需要HTML结构，cons请传递节点或文档片段（$.create(...)）。
 * @param  {Element} root 单元根元素
 * @param  {String} name 单元名称
 * @param  {String|Node|DocumentFragment} cons 标题内容
 * @return {Element} root
 */
function heading( root, name, cons ) {

}


/**
 * 插入/更新单元内容。
 * @param  {Element} root 单元根元素
 * @param  {String} name 单元名称
 * @param  {String|Node|DocumentFragment} cons 标题内容
 * @return {Element} root
 */
function content( root, name, cons ) {

}


function table( rows, cols, caption, th0 ) {

}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


export const Factory = {  };
