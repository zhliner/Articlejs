//! $Id: types.js 2019.10.09 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元类型定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


// 内容类型。
const
    $TEXT       = 1,        // 文本/节点

    H1          = 1 << 1,   // 页标题
    ABSTRACT    = 1 << 2,   // 提要
    TOC         = 1 << 3,   // 目录
    ARTICLE     = 1 << 4,   // 文章区
    HEADER      = 1 << 5,   // 导言
    FOOTER      = 1 << 6,   // 结语
    S1          = 1 << 7,   // 章 /h2
    S2          = 1 << 8,   // 节 /h3
    S3          = 1 << 9,   // 区 /h4
    S4          = 1 << 10,  // 段 /h5
    S5          = 1 << 11,  // 末 /h6
    OL          = 1 << 12,  // 有序列表
    BLOUFCPC    = 1 << 13,  // 块集：ul,figure,codelist,pre,codeblock
    SEEALSO     = 1 << 14,  // 另参见
    CASCADE     = 1 << 15,  // 级联表
    REFERENCES  = 1 << 16,  // 文献参考
    DL          = 1 << 17,  // 定义列表
    BLOATHS     = 1 << 18,  // 块集：address,table,hr,space
    BLOCKQUOTE  = 1 << 19,  // 块引用
    ASIDE       = 1 << 20,  // 批注
    DETAILS     = 1 << 21,  // 详细内容
    P           = 1 << 22,  // 段落
    CODELI      = 1 << 23,  // 代码表条目（结构件 li/code）
    CASCADELI   = 1 << 24,  // 级联表条目（结构件 li/h5,ol）
    INLINE      = 1 << 25,  // 内联单元
    A           = 1 << 26,  // 链接
    CODE        = 1 << 27,  // 行内代码
    IMG         = 1 << 28,  // 图片
    I           = 1 << 29,  // <i> 标题编号
    B           = 1 << 30,  // <b> 代码关键字
    H2          = 1 << 31,  // 章标题
    H3          = 1 << 32,  // 节标题
    H4          = 1 << 33,  // 区标题
    H5          = 1 << 34,  // 段标题
    H6          = 1 << 35,  // 末标题
    SUMMARY     = 1 << 36,  // 详细内容摘要/标题
    FIGCAPTION  = 1 << 37,  // 插图标题
    LI          = 1 << 38,  // 列表项（通用）
    DLI         = 1 << 39,  // 定义列表项（dt,dd）
    RBPT        = 1 << 40,  // 注音单元（rb,rp,rt）
    TRACK       = 1 << 41,  // 字幕轨
    SOURCE      = 1 << 42,  // 媒体资源
    CAPTION     = 1 << 43,  // 表格标题
    TSEC        = 1 << 44,  // 表格片区（thead,tbody,tfoot）
    TR          = 1 << 45,  // 表格行
    TCELL       = 1 << 46;  // 表单元格（th,td）


//
// 内容单元|元件类型配置。
//
const Types = {
    // 文本
    $text:          $TEXT,

    // 结构单元
    // BLOATHS：address|table|hr|space
    // BLOUFCPC：ul|figure|codelist|pre|codeblock
    h1:             H1,
    abstract:       ABSTRACT,
    toc:            TOC,
    article:        ARTICLE,
    header:         HEADER,
    footer:         FOOTER,
    s1:             S1,
    s2:             S2,
    s3:             S3,
    s4:             S4,
    s5:             S5,
    ul:             BLOUFCPC,
    seealso:        SEEALSO,
    ol:             OL,
    cascade:        CASCADE,
    codelist:       BLOUFCPC,
    references:     REFERENCES,
    dl:             DL,
    table:          BLOATHS,
    figure:         BLOUFCPC,
    blockquote:     BLOCKQUOTE,
    aside:          ASIDE,
    details:        DETAILS,
    codeblock:      BLOUFCPC,

    // 文本单元
    p:              P,
    address:        BLOATHS,
    pre:            BLOUFCPC,
    hr:             BLOATHS,
    space:          BLOATHS,

    // 限定中间单元
    codeli:         CODELI,
    cascadeli:      CASCADELI,

    // 内联单元。
    // 取值时会提取元素本身，因此配置为同一类。
    audio:          INLINE,
    video:          INLINE,
    picture:        INLINE,
    strong:         INLINE,
    em:             INLINE,
    q:              INLINE,
    abbr:           INLINE,
    cite:           INLINE,
    small:          INLINE,
    time:           INLINE,
    del:            INLINE,
    ins:            INLINE,
    sub:            INLINE,
    sup:            INLINE,
    mark:           INLINE,
    orz:            INLINE,
    ruby:           INLINE,
    dfn:            INLINE,
    samp:           INLINE,
    kbd:            INLINE,
    s:              INLINE,
    u:              INLINE,
    var:            INLINE,
    bdo:            INLINE,
    meter:          INLINE,
    blank:          INLINE,

    // 会被作为特定的子单元使用。
    a:              A,
    code:           CODE,
    img:            IMG,
    i:              I,
    b:              B,

    // 简单元素
    // 名称保持元素小写标签名。
    h2:             H2,
    h3:             H3,
    h4:             H4,
    h5:             H5,
    h6:             H6,
    summary:        SUMMARY,
    figcaption:     FIGCAPTION,
    li:             LI,
    dt:             DLI,
    dd:             DLI,

    rb:             RBPT,
    rp:             RBPT,
    rt:             RBPT,
    track:          TRACK,
    source:         SOURCE,

    // 表格单独处理。
    caption:        CAPTION,
    thead:          TSEC,
    tbody:          TSEC,
    tfoot:          TSEC,
    tr:             TR,
    th:             TCELL,
    td:             TCELL,
};


//
// 内容项集合。
// 注：汇总简化引用。
//
const CONTENT = P | BLOATHS | OL | BLOUFCPC | DL | BLOCKQUOTE | ASIDE | DETAILS | CASCADE;


//
// 合法子类型配置。
//
const typeSubs = {
    $text:          0,

    // 结构单元块
    abstract:       H3 | P | BLOATHS,
    toc:            H4 | CASCADE,
    seealso:        LI,
    references:     LI,
    header:         H4 | P | BLOATHS | BLOCKQUOTE,
    footer:         H4 | P | BLOATHS | BLOCKQUOTE,
    article:        HEADER | H2 | S1 | CONTENT | FOOTER,
    s1:             HEADER | H3 | S2 | CONTENT | FOOTER,
    s2:             HEADER | H4 | S3 | CONTENT | FOOTER,
    s3:             HEADER | H5 | S4 | CONTENT | FOOTER,
    s4:             HEADER | H6 | S5 | CONTENT | FOOTER,
    s5:             CONTENT,
    ul:             LI,
    ol:             LI,
    cascade:        CASCADELI | LI,
    codelist:       CODELI,
    dl:             DLI,
    table:          CAPTION | TSEC,
    figure:         FIGCAPTION | P,
    blockquote:     H4 | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    aside:          H4 | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    details:        SUMMARY | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    codeblock:      CODE,

    // 文本类行块。
    p:              $TEXT | INLINE | CODE | IMG,
    address:        $TEXT | INLINE | CODE | IMG,
    pre:            $TEXT | INLINE | CODE | IMG,
    hr:             0,  // 空
    space:          0,  // 空，用于交互展示

    // 限定中间结构
    codeli:         CODE,
    cascadeli:      H5 | OL,

    // 内联单元
    audio:          TRACK | SOURCE,
    video:          TRACK | SOURCE,
    picture:        SOURCE | IMG,
    a:              $TEXT | INLINE | IMG,
    strong:         $TEXT | INLINE,
    em:             $TEXT | INLINE,
    dfn:            $TEXT | INLINE,
    abbr:           $TEXT,
    time:           $TEXT,
    kbd:            $TEXT,  // 键盘输入
    var:            $TEXT,  // 变量标注
    code:           $TEXT | B,
    orz:            $TEXT,
    meter:          $TEXT,  // 范围计量
    ruby:           RBPT | $TEXT,
    q:              $TEXT | INLINE | A,
    small:          $TEXT | INLINE | A,
    samp:           $TEXT | INLINE | A, // 计算机输出
    u:              $TEXT | INLINE | A, // 特别标注
    bdo:            $TEXT | INLINE | A,
    cite:           $TEXT | INLINE | A,
    del:            $TEXT | INLINE | A,
    ins:            $TEXT | INLINE | A,
    s:              $TEXT | INLINE | A,
    sub:            $TEXT | INLINE | A,
    sup:            $TEXT | INLINE | A,
    mark:           $TEXT | INLINE | A,
    b:              $TEXT,  // 简单支持
    i:              $TEXT,  // 同上

    img:            0,  // 空
    blank:          0,  // 空，用于交互展示

    // 定制中间结构
    // 注：I 可用于标题序号或背景按钮。
    h2:             $TEXT | INLINE | I | A,
    h3:             $TEXT | INLINE | I | A,
    h4:             $TEXT | INLINE | I | A,
    h5:             $TEXT | INLINE | I | A,
    h6:             $TEXT | INLINE | I | A,
    figcaption:     $TEXT | INLINE | I | A,
    summary:        $TEXT | INLINE | CODE | I | A,
    li:             $TEXT | INLINE | CODE | IMG | A,
    dt:             $TEXT | INLINE | CODE | I | A,
    dd:             $TEXT | INLINE | CODE | IMG | A,

    // 原生中间结构。
    caption:        $TEXT | INLINE | I | A,
    thead:          TR,
    tbody:          TR,
    tfoot:          TR,
    tr:             TCELL,
    th:             $TEXT | INLINE | I | A,
    td:             $TEXT | INLINE | CODE | I | IMG | A,

    rb:             $TEXT,
    rp:             $TEXT,
    rt:             $TEXT,
    track:          0,  // 空，单标签
    source:         0,  // 空，同上
};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 测试<li>支持的两种类型。
 * 注：向下检索测试。
 * @param  {Element} li 列表项元素
 * @return {String} codeli|cascadeli|li
 */
function customLi( li ) {
    let _sub = li.firstElementChild,
    _cnt = li.childElementCount;

    // codelist: li/code/
    if ( _cnt == 1 && _sub.nodeName == 'CODE' ) {
        return 'codeli';
    }
    // cascade: li/h5, ol/
    if ( _cnt == 2 && _sub.nodeName == 'H5' && $.next(_sub).nodeName == 'OL' ) {
        return 'cascadeli';
    }
    return 'li';
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 测试是否在级联编号表内。
 * 仅用于测试 <ol> 和 <li> 元素。
 * 主要用于插入时的目标判断并进行正确的处理（平插或内合并）。
 * 注：向上检索测试。
 * @param  {Element} el 目标元素
 * @return {Boolean|null}
 */
 function inCascade( el ) {
    let _pe = null;

    while ( el ) {
        let _n = el.nodeName.toLowerCase();
        if ( _n != 'ol' && _n != 'li' ) {
            break;
        }
        _pe = el;
        el = el.parentElement;
    }
    return $.attribute(_pe, 'role') == 'cascade';
}


/**
 * 测试是否在代码表内。
 * 仅用于测试 <li> 和 <code> 元素。
 * 结构：codelist/li/code
 * @param  {Element} el 目标元素
 * @return {Boolean|null}
 */
function inCodelist( el ) {
    let _n = el.nodeName.toLowerCase();

    if ( _n == 'code' ) {
        el = el.parentElement;
    }
    return $.attribute(el.parentElement, 'role') == 'codelist';
}


/**
 * 获取元素/节点的内容名。
 * @param  {Element|Text} el 目标元素或文本节点
 * @return {String}
 */
function conName( el ) {
    if ( el.nodeType == 3 ) {
        return '$text';
    }
    let _n = $.attribute(el, 'role') || el.nodeName.toLowerCase();

    return _n == 'li' ? customLi( el ) : _n;
}


/**
 * 测试是否为合法子单元。
 * @param  {String} box 目标内容名
 * @param  {String} sub 待测试目标内容名
 * @return {Boolean}
 */
function goodSub( box, sub ) {
    return !!( typeSubs[box] & Types[sub] );
}


/**
 * 是否不可包含子单元。
 * @param  {String} name 内容名
 * @return {Boolean}
 */
function nilSub( name ) {
    return typeSubs[name] === 0;
}


export {
    inCascade, inCodelist,
    conName, goodSub, nilSub,
};
