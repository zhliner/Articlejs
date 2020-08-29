//! $Id: types.js 2020.05.09 Articlejs.Libs $
// ++++++++++++++++++++++++++++++++++++++++++++
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2019 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元类型定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


//
// 分类定义：
// 0. 特别类型。存在但不归类（如：<b>,<i>）。
// 1. 结构元素。包含固定结构的子元素或自身即为结构子元素，如果不是结构根，自身的插入需合法。
// 2. 结构灵活件。自身为结构子元素，但可以被简单删除（如<li>）。
// 3. 内容元素。可包含非空文本节点和内联单元。
// 4. 内联单元。可作为内容行独立内容（逻辑完整）的单元。
// 5. 行块单元。可作为内容片区独立行块内容的单元。
// 注：
// 内联/行块单元指可成为逻辑完整的独立内容的元素或元素结构。
//
// 特性标记：
// 1. EMPTY   空元素（单标签）
// 2. SEALED  密封单元，定制创建，内部成员只能更新（不接受移动插入）。
// 3. FIXED   位置固定。只能自我移动（不能被其它元素移动），如：{<caption>}
//
const
    TEXT        = 0,        // 文本节点
    SPECIAL     = 1,        // 特别用途
    STRUCT      = 1 << 1,   // 结构元素
    STRUCTX     = 1 << 2,   // 结构灵活件（可删除）
    CONTENT     = 1 << 3,   // 内容元素
    INLINES     = 1 << 4,   // 内联单元
    BLOCKS      = 1 << 5,   // 行块单元
    EMPTY       = 1 << 6,   // 空元素（单标签）
    SEALED      = 1 << 7,   // 密封单元
    FIXED       = 1 << 8;   // 位置确定性


//
// 单元值定义。
// 用于标识元素的类型，便于简单高效地判断（而不是每次都作复杂的检查）。
//
// - 内联结构元素：     [0, 99]     不能包含文本或其它内联单元，有固定的内部结构或空结构。
// - 内联内结构元素：   [100, 199]  其它内联结构元素的内部成员，自身不是独立的内联单元。可能为内容元素。
// - 内联内容元素：     [200, 299]  可直接包含文本或其它内联单元。
// - 行块内容元素：     [300, 399]  可直接包含文本节点和内联单元，但属于行块逻辑而不是内联成员。
// - 块内结构元素：     [400, 499]  行块结构元素内部的元素，不能充当独立的单元。可为内容元素。
// - 行块结构元素：     [500, ~]    不能直接包含文本或内联单元（含单体单元）。
//
// 导出：
// 基本值导出供其它模块使用（配置定义）。
//
export const
    $TEXT           = 0,    // 文本节点（#text）
    //
    // 内联结构&单元素
    /////////////////////////////////////////////
    AUDIO           = 1,    // 音频 {src, autoplay, loop, controls}
    VIDEO           = 2,    // 视频 {src, autoplay, loop, controls}
    PICTURE         = 3,    // 兼容图片
    SVG             = 4,    // 图形 {width, height}
    RUBY            = 5,    // 注音
    METER           = 6,    // 量度 {value, max, min, high, low, optimum}
    SPACE           = 7,    // 空白
    IMG             = 8,    // 图片 {src, alt, width, height}
    BR              = 9,    // 换行
    WBR             = 10,   // 软换行
    //
    // 内联内结构
    /////////////////////////////////////////////
    TRACK           = 100,  // 字幕轨 {kind, src, srclang, label, default?}
    SOURCE          = 101,  // 媒体资源 {src, type}
    RB              = 102,  // 注音文本
    RT              = 103,  // 注音拼音
    RP              = 104,  // 注音拼音包围
    EXPLAIN         = 105,  // 插图讲解
    RBPT            = 106,  // 注音分组封装（抽象：用于包含多组注音）
    SVGITEM         = 107,  // 图形内容（仅用于SVG子元素配置）
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A               = 200,  // 链接 {href, target}
    STRONG          = 201,  // 重点
    EM              = 202,  // 强调
    Q               = 203,  // 短引用 {cite}
    ABBR            = 204,  // 缩写 {title}
    CITE            = 205,  // 来源
    TIME            = 206,  // 时间 {datetime}
    SMALL           = 207,  // 注脚
    DEL             = 208,  // 删除 {datetime, cite}
    INS             = 209,  // 插入 {datetime, cite}
    SUB             = 210,  // 下标
    SUP             = 211,  // 上标
    MARK            = 212,  // 标记
    CODE            = 213,  // 代码（code/#text, b, i） {data-lang, data-tab}
    ORZ             = 214,  // 表情
    DFN             = 215,  // 定义 {title}
    SAMP            = 216,  // 样本
    KBD             = 217,  // 键盘字
    S               = 218,  // 失效
    U               = 219,  // 注记
    VAR             = 220,  // 变量
    BDO             = 221,  // 有向文本 {dir}

    //
    // 行块内容元素
    /////////////////////////////////////////////
    P               = 300,  // 段落 （p/#text, ...）
    NOTE            = 301,  // 注解 （p:note/#text, ...）
    TIPS            = 302,  // 提示 （p:tips/#text, ...）
    PRE             = 303,  // 预排版 （pre/#text, ...）
    ADDRESS         = 304,  // 地址 （address/#text, ...）
    //
    // 块内结构元素
    /////////////////////////////////////////////
    H1              = 400,  // 页标题
    H2              = 401,  // 章标题
    H3              = 402,  // 节标题
    H4              = 403,  // 区标题
    H5              = 404,  // 段标题
    H6              = 405,  // 末标题
    SUMMARY         = 406,  // 详细内容摘要/标题
    FIGCAPTION      = 407,  // 插图标题
    CAPTION         = 408,  // 表格标题
    LI              = 409,  // 列表项（通用）
    DT              = 410,  // 定义列表条目
    DD              = 411,  // 定义列表数据
    TH              = 412,  // 表头单元格
    TD              = 413,  // 单元格
    TR              = 414,  // 表格行
    THEAD           = 415,  // 表头
    TBODY           = 416,  // 表体
    TFOOT           = 417,  // 表脚
    // 定制类：
    // 容器：<li>, <p>, <h4>
    CODELI          = 419,  // 代码表条目（li/code） {value}
    ALI             = 420,  // 目录：普通条目（li/a）
    AH4LI           = 421,  // 目录：标题条目（li/[h4/a]）
    AH4             = 422,  // 目录：链接小标题（h4/a）
    ULXH4LI         = 423,  // 无序级联表项标题（li/h4, ul|ol）
    OLXH4LI         = 424,  // 有序级联表项标题（li/h4, ol|ul）
    CASCADEH4LI     = 425,  // 级联编号表项标题（li/h4, ol）
    FIGIMGP         = 426,  // 插图内容区（p/img, span:explain）
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP          = 500,  // 主/副标题组 （hgroup/h1, h2）
    ABSTRACT        = 501,  // 提要 （header:abstract/h3, p...）
    TOC             = 502,  // 目录 （nav:toc/h3, ol:cascade/li/(h4/a), ol/[li/a]+）
    SEEALSO         = 503,  // 另参见 （ul:seealso/li/#text）
    REFERENCE       = 504,  // 文献参考 （ol:reference/li/#text）
    HEADER          = 505,  // 导言 （header/h3, p...）
    FOOTER          = 506,  // 结语 （footer/h3, p...）
    ARTICLE         = 507,  // 文章区 （article/header?, s1 | {content}, footer?, hr?）
    S1              = 508,  // 章 （section:s1/h2, header?, s2 | {content}, footer?）
    S2              = 509,  // 节 （section:s2/h2, header?, s3 | {content}, footer?）
    S3              = 510,  // 区 （section:s3/h2, header?, s4 | {content}, footer?）
    S4              = 511,  // 段 （section:s4/h2, header?, s5 | {content}, footer?）
    S5              = 512,  // 末 （section:s5/h2, header?, {content}, footer?）
    UL              = 513,  // 无序列表 （ul/li）
    OL              = 514,  // 有序列表 （ol/li）
    CODELIST        = 515,  // 代码表 （ol:codelist/li/code/#text, b, i） {data-lang, data-tab, start}
    ULX             = 516,  // 无序级联表 （ul/li/h4, ul|ol/...）
    OLX             = 517,  // 有序级联表 （ol/li/h4, ol|ul/...）
    CASCADE         = 518,  // 级联编号表 （ol:cascade/li/h4, ol/li/...）
    DL              = 519,  // 定义列表 （dl/dt, dd+）
    TABLE           = 520,  // 表格 （table/thead, tbody, tfoot/tr/th, td）
    FIGURE          = 521,  // 插图 （figure/figcaption, p/img, span:explain）
    BLOCKQUOTE      = 522,  // 块引用 （blockquote/h3, p...） {cite}
    ASIDE           = 523,  // 批注 （aside/h3, p...）
    DETAILS         = 524,  // 详细内容 （details/summary, p...）
    CODEBLOCK       = 525,  // 代码块 （pre:codeblock/code/#text, b, i）
    // 单体单元。
    HR              = 526,  // 分隔 （hr）
    BLANK           = 527,  // 白板 （div:blank/x）

    //
    // 特殊用途。
    // 注：不作为独立的内联单元。
    /////////////////////////////////////////////
    B               = -1,   // 代码关键字封装
    I               = -2,   // 代码注释/标题编号

    //
    // 文章顶层。
    // 抽象结构，文章的顶层内容容器。
    /////////////////////////////////////////////
    $TOPBOX         = -10;



//
// 单元的类型/特性。
//
const Specials = {
    [ $TEXT ]:          TEXT,
    //
    // 内联结构元素
    /////////////////////////////////////////////
    [ AUDIO ]:          INLINES | STRUCT | SEALED,
    [ VIDEO ]:          INLINES | STRUCT | SEALED,
    [ PICTURE ]:        INLINES | STRUCT | SEALED,
    [ SVG ]:            INLINES | STRUCT,
    [ RUBY ]:           INLINES | STRUCT | SEALED,
    [ METER ]:          INLINES | SEALED,
    [ SPACE ]:          INLINES | SEALED,
    [ IMG ]:            INLINES | EMPTY,
    [ BR ]:             INLINES | EMPTY,
    [ WBR ]:            INLINES | EMPTY,
    //
    // 内联结构子
    /////////////////////////////////////////////
    [ SVGITEM ]:        STRUCT | STRUCTX,
    [ TRACK ]:          STRUCT | STRUCTX | EMPTY,
    [ SOURCE ]:         STRUCT | STRUCTX | EMPTY,
    [ EXPLAIN ]:        STRUCT | STRUCTX | FIXED | CONTENT,   // figure/p/img,span:explain
    // 不可简单删除
    // 删除：应当先文本化，微编辑，然后内容提升或转换。
    [ RB ]:             STRUCT | FIXED | CONTENT,
    [ RT ]:             STRUCT | FIXED | CONTENT,
    [ RP ]:             STRUCT | FIXED | SEALED,
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:              INLINES | CONTENT,
    [ STRONG ]:         INLINES | CONTENT,
    [ EM ]:             INLINES | CONTENT,
    [ Q ]:              INLINES | CONTENT,
    [ ABBR ]:           INLINES | CONTENT,
    [ CITE ]:           INLINES | CONTENT,
    [ TIME ]:           INLINES | CONTENT | SEALED,
    [ SMALL ]:          INLINES | CONTENT,
    [ DEL ]:            INLINES | CONTENT,
    [ INS ]:            INLINES | CONTENT,
    [ SUB ]:            INLINES | CONTENT,
    [ SUP ]:            INLINES | CONTENT,
    [ MARK ]:           INLINES | CONTENT,
    [ CODE ]:           INLINES | CONTENT | SEALED,
    [ ORZ ]:            INLINES | CONTENT,
    [ DFN ]:            INLINES | CONTENT,
    [ SAMP ]:           INLINES | CONTENT,
    [ KBD ]:            INLINES | CONTENT,
    [ S ]:              INLINES | CONTENT,
    [ U ]:              INLINES | CONTENT,
    [ VAR ]:            INLINES | CONTENT,
    [ BDO ]:            INLINES | CONTENT,

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:              BLOCKS | CONTENT,
    [ NOTE ]:           BLOCKS | CONTENT,
    [ TIPS ]:           BLOCKS | CONTENT,
    [ ADDRESS ]:        BLOCKS | CONTENT,
    [ PRE ]:            BLOCKS | CONTENT,
    //
    // 块内结构子
    /////////////////////////////////////////////
    [ H1 ]:             STRUCT | STRUCTX | FIXED | CONTENT,
    [ H2 ]:             STRUCT | STRUCTX | FIXED | CONTENT,
    [ H3 ]:             STRUCT | STRUCTX | FIXED | CONTENT,
    [ H4 ]:             STRUCT | STRUCTX | FIXED | CONTENT,
    [ H5 ]:             STRUCT | STRUCTX | CONTENT,
    [ H6 ]:             STRUCT | STRUCTX | CONTENT,
    [ SUMMARY ]:        STRUCT | STRUCTX | FIXED | CONTENT,
    [ FIGCAPTION ]:     STRUCT | STRUCTX | FIXED | CONTENT,
    [ CAPTION ]:        STRUCT | STRUCTX | FIXED | CONTENT,
    [ LI ]:             STRUCT | STRUCTX | CONTENT,
    [ DT ]:             STRUCT | STRUCTX | CONTENT,
    [ DD ]:             STRUCT | STRUCTX | CONTENT,
    [ TR ]:             STRUCT | STRUCTX,
    [ TH ]:             STRUCT | CONTENT,
    [ TD ]:             STRUCT | CONTENT,
    [ TBODY ]:          STRUCT,
    [ THEAD ]:          STRUCT | STRUCTX,
    [ TFOOT ]:          STRUCT | STRUCTX,

    [ CODELI ]:         STRUCT | STRUCTX | SEALED,
    [ ALI ]:            STRUCT | STRUCTX | SEALED,
    [ AH4LI ]:          STRUCT | STRUCTX | SEALED,
    [ AH4 ]:            STRUCT | STRUCTX | SEALED,
    [ ULXH4LI ]:        STRUCT | STRUCTX | SEALED,
    [ OLXH4LI ]:        STRUCT | STRUCTX | SEALED,
    [ CASCADEH4LI ]:    STRUCT | STRUCTX | SEALED,
    // 插图内允许多个<p>容器。
    [ FIGIMGP ]:        STRUCT | STRUCTX | SEALED,

    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         BLOCKS | STRUCT | FIXED | SEALED,
    [ ABSTRACT ]:       BLOCKS | STRUCT | FIXED,
    [ TOC ]:            BLOCKS | STRUCT | FIXED | SEALED,
    [ SEEALSO ]:        BLOCKS | STRUCT | FIXED,
    [ REFERENCE ]:      BLOCKS | STRUCT | FIXED,
    [ HEADER ]:         BLOCKS | STRUCT | FIXED,
    [ FOOTER ]:         BLOCKS | STRUCT | FIXED,
    [ ARTICLE ]:        BLOCKS | STRUCT | FIXED,
    [ S1 ]:             BLOCKS | STRUCT,
    [ S2 ]:             BLOCKS | STRUCT,
    [ S3 ]:             BLOCKS | STRUCT,
    [ S4 ]:             BLOCKS | STRUCT,
    [ S5 ]:             BLOCKS | STRUCT,
    [ UL ]:             BLOCKS | STRUCT,
    [ OL ]:             BLOCKS | STRUCT,
    [ CODELIST ]:       BLOCKS | STRUCT,
    [ ULX ]:            BLOCKS | STRUCT,
    [ OLX ]:            BLOCKS | STRUCT,
    [ CASCADE ]:        BLOCKS | STRUCT,
    [ DL ]:             BLOCKS | STRUCT,
    [ TABLE ]:          BLOCKS | STRUCT,  // 支持多<tbody>
    [ FIGURE ]:         BLOCKS | STRUCT,  // 支持多<p/img,span>
    [ BLOCKQUOTE ]:     BLOCKS | STRUCT,
    [ ASIDE ]:          BLOCKS | STRUCT,
    [ DETAILS ]:        BLOCKS | STRUCT,
    [ CODEBLOCK ]:      BLOCKS | STRUCT | SEALED,
    // 行块单体元素
    [ HR ]:             BLOCKS | EMPTY,
    [ BLANK ]:          BLOCKS | SEALED,

    //
    // 特殊用途。
    /////////////////////////////////////////////
    [ B ]:              SPECIAL | CONTENT,
    [ I ]:              SPECIAL | CONTENT,
};


//
// 内联单元集。
// 注：不含<a>单元，不含<b><i>单元。
//
const _INLINES =
[
    AUDIO, VIDEO, PICTURE, RUBY, SVG,
    METER, SPACE, IMG, BR, WBR,
    STRONG, EM, Q, ABBR, CITE, TIME, SMALL, DEL, INS, SUB, SUP, MARK, CODE, ORZ, DFN, SAMP, KBD, S, U, VAR, BDO,
];


//
// 受限行块单元集。
// 少部分可置于文章顶层（与<article>平级）的单元内容。
//
const _BLOLIMIT = [ BLOCKQUOTE, UL, OL ];


//
// 正文行块单元集。
// 可作为正文行块内容的单元，
// 它们在<article/section>中可自由存在。
// 注：
// - 不含 S1~S5，它们有明确的层级递进逻辑。
// - 不含 ADDRESS，它应当出现在文档特定的位置。
//
const _BLOCKITS =
[
    P, NOTE, TIPS, PRE,
    UL, OL, CODELIST, ULX, OLX, CASCADE, DL, TABLE, FIGURE, BLOCKQUOTE, ASIDE, DETAILS, CODEBLOCK,
    HR, BLANK,
];


//
// 合法子单元类型。
// 值为空数组表示无任何内容，通常为空元素。
// 成员值为子数组表示类型，适用该类型所有单元。
// 特殊值 null 仅用于文本节点。
// 注记：
// - 可用于源码结构检查。
// - 可用于判断目标的可插入单元（向内）。
// - 取父容器可判断平级插入时的合法单元。
// - 特许分级片区与其它行块单元同级存在（便利性且CSS可区分）。
//
const ChildTypes = {
    //
    // 内联结构元素。
    /////////////////////////////////////////////
    [ $TEXT ]:          null,

    [ AUDIO ]:          [ SOURCE, TRACK, $TEXT ],
    [ VIDEO ]:          [ SOURCE, TRACK, $TEXT ],
    [ PICTURE ]:        [ SOURCE, IMG ],
    [ SVG ]:            [ SVGITEM ],
    [ RUBY ]:           [ RB, RT, RP ],
    [ METER ]:          [ $TEXT ],
    [ SPACE ]:          [],
    [ IMG ]:            [],
    [ BR ]:             [],
    [ WBR ]:            [],
    //
    // 内联内结构
    /////////////////////////////////////////////
    [ SVGITEM ]:        [ SVGITEM ],
    [ TRACK ]:          [],
    [ SOURCE ]:         [],
    [ RB ]:             [ $TEXT ],
    [ RT ]:             [ $TEXT ],
    [ RP ]:             [ $TEXT ],
    [ EXPLAIN ]:        [ $TEXT, _INLINES, A ], // 插图讲解
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:              [ $TEXT, _INLINES ],
    [ STRONG ]:         [ $TEXT, _INLINES, A ],
    [ EM ]:             [ $TEXT, _INLINES, A ],
    [ Q ]:              [ $TEXT, _INLINES, A ],
    [ ABBR ]:           [ $TEXT ],
    [ CITE ]:           [ $TEXT, _INLINES, A ],
    [ TIME ]:           [ $TEXT ],
    [ SMALL ]:          [ $TEXT, _INLINES, A ],
    [ DEL ]:            [ $TEXT, _INLINES, A ],
    [ INS ]:            [ $TEXT, _INLINES, A ],
    [ SUB ]:            [ $TEXT, _INLINES ],
    [ SUP ]:            [ $TEXT, _INLINES ],
    [ MARK ]:           [ $TEXT, _INLINES ],
    [ CODE ]:           [ $TEXT, B, I ],
    [ ORZ ]:            [ $TEXT ],
    [ DFN ]:            [ $TEXT, ABBR ],
    [ SAMP ]:           [ $TEXT, _INLINES, A ],
    [ KBD ]:            [ $TEXT ],
    [ S ]:              [ $TEXT, _INLINES, A ],
    [ U ]:              [ $TEXT, _INLINES, A ],
    [ VAR ]:            [ $TEXT ],
    [ BDO ]:            [ $TEXT, _INLINES, A ],

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:              [ $TEXT, _INLINES, A ],
    [ NOTE ]:           [ $TEXT, _INLINES, A ],
    [ TIPS ]:           [ $TEXT, _INLINES, A ],
    [ PRE ]:            [ $TEXT, _INLINES, A ],
    [ ADDRESS ]:        [ $TEXT, _INLINES, A ],
    //
    // 块内结构元素
    /////////////////////////////////////////////
    [ H1 ]:             [ $TEXT, _INLINES, A, I ],
    [ H2 ]:             [ $TEXT, _INLINES, A, I ],
    [ H3 ]:             [ $TEXT, _INLINES, A, I ],
    [ H4 ]:             [ $TEXT, _INLINES, A, I ],
    [ H5 ]:             [ $TEXT, _INLINES, A, I ],
    [ H6 ]:             [ $TEXT, _INLINES, A, I ],
    [ SUMMARY ]:        [ $TEXT, _INLINES, A ],
    [ FIGCAPTION ]:     [ $TEXT, _INLINES, A ],
    [ CAPTION ]:        [ $TEXT, _INLINES, A ],
    [ LI ]:             [ $TEXT, _INLINES, A ],
    [ DT ]:             [ $TEXT, _INLINES, A, I ],
    [ DD ]:             [ $TEXT, _INLINES, A ],
    [ TH ]:             [ $TEXT, _INLINES, A ],
    [ TD ]:             [ $TEXT, _INLINES, A ],
    [ CODELI ]:         [ CODE ],
    [ ALI ]:            [ A ],
    [ AH4LI ]:          [ AH4 ],
    [ AH4 ]:            [ A ],
    [ ULXH4LI ]:        [ H4, UL, OL ],
    [ OLXH4LI ]:        [ H4, OL, UL ],
    [ CASCADEH4LI ]:    [ H4, OL ],
    [ FIGIMGP ]:        [ IMG, EXPLAIN ],
    [ TR ]:             [ TH, TD ],
    [ THEAD ]:          [ TR ],
    [ TBODY ]:          [ TR ],
    [ TFOOT ]:          [ TR ],
    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         [ H1, H2 ],
    [ ABSTRACT ]:       [ H3, P, _BLOLIMIT ],
    [ TOC ]:            [ H3, CASCADE ],
    [ SEEALSO ]:        [ LI, ALI ],
    [ REFERENCE ]:      [ LI, ALI ],
    [ HEADER ]:         [ H3, P, _BLOLIMIT, ULX, OLX ],
    [ FOOTER ]:         [ H3, P, _BLOLIMIT, ADDRESS ],
    [ ARTICLE ]:        [ HEADER, S1, FOOTER ],
    [ S1 ]:             [ H2, HEADER, S2, _BLOCKITS, FOOTER ],
    [ S2 ]:             [ H2, HEADER, S3, _BLOCKITS, FOOTER ],
    [ S3 ]:             [ H2, HEADER, S4, _BLOCKITS, FOOTER ],
    [ S4 ]:             [ H2, HEADER, S5, _BLOCKITS, FOOTER ],
    [ S5 ]:             [ H2, HEADER, _BLOCKITS, FOOTER ],
    [ UL ]:             [ LI, ALI ],
    [ OL ]:             [ LI, ALI ],
    [ CODELIST ]:       [ CODELI ],
    [ ULX ]:            [ LI, ALI, AH4LI, ULXH4LI ],
    [ OLX ]:            [ LI, ALI, AH4LI, OLXH4LI ],
    [ CASCADE ]:        [ LI, ALI, AH4LI, CASCADEH4LI ],
    [ DL ]:             [ DT, DD ],
    [ TABLE ]:          [ CAPTION, THEAD, TBODY, TFOOT ],
    [ FIGURE ]:         [ FIGCAPTION, FIGIMGP ],
    [ BLOCKQUOTE ]:     [ H3, P, _BLOLIMIT, TABLE ],
    [ ASIDE ]:          [ H3, P, _BLOLIMIT, TABLE ],
    [ DETAILS ]:        [ SUMMARY, P, _BLOLIMIT, TABLE ],
    [ CODEBLOCK ]:      [ CODE ],
    // 单体单元
    [ HR ]:             [],
    [ BLANK ]:          [],

    //
    // 特别单元
    /////////////////////////////////////////////
    [ B ]:              [ $TEXT ],
    [ I ]:              [ $TEXT ],

    //
    // 文章顶层（编辑器专属）。
    /////////////////////////////////////////////
    [ $TOPBOX ]:        [ H1, HGROUP, ABSTRACT, TOC, HEADER, ARTICLE, SEEALSO, REFERENCE, FOOTER ],

};

// 配置展开。
$.each(
    ChildTypes, (v, k, o) => o[k] = v && v.flat()
);



//
// 导出。
//////////////////////////////////////////////////////////////////////////////


/**
 * 是否为空元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isEmpty( tval ) {
    return !!( Specials[tval] & EMPTY );
}


/**
 * 是否位置固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isFixed( tval ) {
    return !!( Specials[tval] & FIXED );
}


/**
 * 是否为密封单元。
 * 可修改但不可新插入，除非已为空。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isSealed( tval ) {
    return !!( Specials[tval] & SEALED );
}


/**
 * 是否为行块单元。
 * 可作为各片区单元的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isBlocks( tval ) {
    return !!( Specials[tval] & BLOCKS );
}


/**
 * 是否为内联单元。
 * 可作为内容元素里的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isInlines( tval ) {
    return !!( Specials[tval] & INLINES );
}


/**
 * 是否为内容元素。
 * 可直接包含文本和内联单元。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isContent( tval ) {
    return !!( Specials[tval] & CONTENT );
}


/**
 * 是否为结构容器。
 * 包含固定逻辑的子元素结构。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isStruct( tval ) {
    return !!( Specials[tval] & STRUCT );
}


/**
 * 是否为结构子单元。
 * 自身为结构容器元素内的子元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isStructX( tval ) {
    return !!( Specials[tval] & STRUCTX );
}


/**
 * 是否为特别用途元素。
 * 即：<b>|<i>，用于代码内逻辑封装。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isSpecial( tval ) {
    return !!( Specials[tval] & SPECIAL );
}


/**
 * 是否只能包含纯文本。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function onlyText( tval ) {
    let _subs = ChildTypes[ tval ] || [];
    return _subs.length === 1 && _subs[0] === $TEXT;
}


/**
 * 返回合法值类型值集。
 * @param  {Number} tval 类型值
 * @return {[Number]}
 */
export function childTypes( tval ) {
    return ChildTypes[ tval ] || [];
}