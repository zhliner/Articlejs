//! $ID: types.js 2020.05.09 Cooljed.Libs $
// ++++++++++++++++++++++++++++++++++++++++++++
//  Project: Coolj-ED v0.2.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  GPL/GNU v3 License
//
//////////////////////////////////////////////////////////////////////////////
//
//  内容单元类型定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import $ from "./tpb/config.js";


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
// 3. FIXED1  位置向前固定。自己不能移动，其它元素也不能插入之前。
// 4. FIXED2  位置向后固定。自己不能移动，其它元素也不能插入之后。
//
const
    TEXT        = 0,        // 文本节点
    SPECIAL     = 1,        // 特别用途
    STRUCT      = 1 << 1,   // 结构元素
    STRUCTX     = 1 << 2,   // 结构灵活件（可删除）
    CONTENT     = 1 << 3,   // 内容元素
    INLINES     = 1 << 4,   // 内联单元
    BLOCKS      = 1 << 5,   // 行块单元
    SINGLE      = 1 << 6,   // 单一成员（如标题）
    EMPTY       = 1 << 7,   // 空元素（单标签）
    COVERT      = 1 << 8,   // 隐蔽的（不可选）
    SEALED      = 1 << 9,   // 密封单元（不可合并）
    FIXED1      = 1 << 10,  // 位置向前固定
    FIXED2      = 1 << 11;  // 位置向后固定


//
// 导出：
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
    PICTURE         = 3,    // 自适应图片
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
    SOURCE1         = 101,  // 媒体资源 {src, type}
    SOURCE2         = 102,  // 图片资源 {srcset, media}
    PIMG            = 103,  // P图片 <picture/img> 注：有位置要求，故单独定义
    RT              = 104,  // 注音拼音
    RP              = 105,  // 注音拼音包围
    EXPLAIN         = 106,  // 插图讲解 {fix}
    SVGITEM         = 107,  // 图形内容（仅用于SVG子元素配置）
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A               = 200,  // 链接 {href, target, title}
    Q               = 201,  // 短引用 {cite}
    ABBR            = 202,  // 缩写 {title}
    DEL             = 203,  // 删除 {datetime, cite}
    INS             = 204,  // 插入 {datetime, cite}
    DFN             = 205,  // 定义 {title}
    BDO             = 206,  // 有向文本 {dir}
    TIME            = 207,  // 时间 {datetime}
    CODE            = 208,  // 代码（code/#text, b, i） {data-lang, data-tab}
    STRONG          = 209,  // 重点
    EM              = 210,  // 强调
    CITE            = 211,  // 来源
    SMALL           = 212,  // 注脚
    SUB             = 213,  // 下标
    SUP             = 214,  // 上标
    MARK            = 215,  // 标记
    ORZ             = 216,  // 表情
    SAMP            = 217,  // 样本
    KBD             = 218,  // 键盘字
    S               = 219,  // 失效
    U               = 220,  // 注记
    VAR             = 221,  // 变量

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
    H1              = 400,  // 主标题
    H2              = 401,  // 片区标题
    H3              = 402,  // 小区块标题
    H3X             = 403,  // 副标题
    H4              = 404,  // 列表项标题条目
    H5              = 405,  // <h5>标题
    H6              = 406,  // <h6>标题
    SUMMARY         = 407,  // 内容摘要
    FIGCAPTION      = 408,  // 插图标题
    CAPTION         = 409,  // 表格标题
    LI              = 410,  // 列表项（通用）
    DT              = 411,  // 描述列表条目
    DD              = 412,  // 描述列表数据
    TH              = 413,  // 表头单元格
    TD              = 414,  // 单元格
    TR              = 415,  // 表格行
    THEAD           = 416,  // 表头
    TBODY           = 417,  // 表体
    TFOOT           = 418,  // 表脚
    // 定制结构类
    // 注记：无需LICODE设计，容器非CONTENT即可。
    CODELI          = 419,  // 代码表条目（li/code） {value}
    ALI             = 420,  // 链接列表项（li/a）
    AH4             = 421,  // 链接小标题（h4/a）
    XH4LI           = 422,  // 级联表标题项（li/h4, ul）
    XOLH4LI         = 423,  // 级联表有序标题项（li/h4, ol）
    XOLAH4LI        = 424,  // 级联表有序链接标题项（li/[h4/a], ol）
    TOCCASCADE      = 425,  // 目录级联表（ol:cascade/[li/a]）
    FIGIMGBOX       = 426,  // 插图内容块（span/img, i:explain）
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP          = 500,  // 主/副标题组 （hgroup/h1, h3）
    // S1-5保持有序连续
    S1              = 501,  // 章 （section:s1/h2, header?, s2 | {content}, footer?）
    S2              = 502,  // 节 （section:s2/h2, header?, s3 | {content}, footer?）
    S3              = 503,  // 区 （section:s3/h2, header?, s4 | {content}, footer?）
    S4              = 504,  // 段 （section:s4/h2, header?, s5 | {content}, footer?）
    S5              = 505,  // 末 （section:s5/h2, header?, {content}, footer?）
    ABSTRACT        = 506,  // 提要 （header:abstract/h3, p...）
    TOC             = 507,  // 目录 （nav:toc/h3, ol:cascade/li/(h4/a), ol/[li/a]+）
    REFERENCE       = 508,  // 文献参考 （nav:reference/h3, ol）
    SEEALSO         = 509,  // 另参见 （aside:seealso/h3, ul）
    HEADER          = 510,  // 导言 （header/h3, p...）
    FOOTER          = 511,  // 结语/小结/声明 （footer/h3, p...）
    ARTICLE         = 512,  // 文章区 （article/header?, s1 | {content}, footer?, hr?）
    SECTION         = 513,  // 深片区 ([s5]/section)
    UL              = 514,  // 无序列表 （ul/li）
    OL              = 515,  // 有序列表 （ol/li）
    CODELIST        = 516,  // 代码表 （ol:codelist/li/code/#text, b, i） {data-lang, data-tab, start}
    ULX             = 517,  // 无序级联表 （ul/li/h4, ul|ol/...）
    OLX             = 518,  // 有序级联表 （ol/li/h4, ol|ul/...）
    CASCADE         = 519,  // 级联编号表 （ol:cascade/li/h4, ol/li/...）
    DL              = 520,  // 描述列表 （dl/dt, dd+）
    TABLE           = 521,  // 表格 （table/thead, tbody, tfoot/tr/th, td）
    FIGURE          = 522,  // 插图 （figure/figcaption, span/img, i:explain）
    BLOCKQUOTE      = 523,  // 块引用 （blockquote/h3, p...） {cite}
    ASIDE           = 524,  // 批注 （aside/h3, p...）
    DETAILS         = 525,  // 详细内容 （details/summary, p...） {open}
    CODEBLOCK       = 526,  // 代码块 （pre:codeblock/code/#text, b, i）
    // 单体单元。
    HR              = 527,  // 分隔 （hr） CSS:{borderWidth, width, height}
    BLANK           = 528,  // 白板 （div:blank/x）

    //
    // 特殊用途。
    // 注：不作为独立的内联单元。
    /////////////////////////////////////////////
    B       = -1,   // 代码关键字封装
    I       = -2,   // 代码注释/标题编号

    //
    // 文章顶层容器。
    // 不属于内容单元故单列。编辑器逻辑需要。
    /////////////////////////////////////////////
    MAIN    = -10;



//
// 单元特性定义。
//
const Properties = {
    [ $TEXT ]:          TEXT,
    //
    // 内联结构元素
    /////////////////////////////////////////////
    [ AUDIO ]:          INLINES | STRUCT,
    [ VIDEO ]:          INLINES | STRUCT,
    [ PICTURE ]:        INLINES | STRUCT,
    [ SVG ]:            INLINES | STRUCT,
    [ RUBY ]:           INLINES | STRUCT | SEALED,
    [ METER ]:          INLINES | SEALED,
    [ SPACE ]:          INLINES | SEALED,
    [ IMG ]:            INLINES | EMPTY,
    [ BR ]:             INLINES | EMPTY | COVERT,
    [ WBR ]:            INLINES | EMPTY | COVERT,
    //
    // 内联结构子
    /////////////////////////////////////////////
    [ SVGITEM ]:        STRUCT | STRUCTX,
    [ TRACK ]:          STRUCT | STRUCTX | EMPTY | COVERT,
    [ SOURCE1 ]:        STRUCT | STRUCTX | EMPTY | COVERT,
    [ SOURCE2 ]:        STRUCT | STRUCTX | EMPTY | COVERT,
    [ PIMG ]:           STRUCT | STRUCTX | EMPTY,
    [ EXPLAIN ]:        STRUCT | STRUCTX | CONTENT,
    // 解包：先文本化，然后内容提升。
    [ RT ]:             STRUCT | FIXED1 | FIXED2 | CONTENT,
    [ RP ]:             STRUCT | FIXED1 | FIXED2 | SEALED | COVERT,
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:              INLINES | CONTENT,
    [ Q ]:              INLINES | CONTENT,
    [ ABBR ]:           INLINES | CONTENT,
    [ DEL ]:            INLINES | CONTENT,
    [ INS ]:            INLINES | CONTENT,
    [ DFN ]:            INLINES | CONTENT,
    [ BDO ]:            INLINES | CONTENT,
    [ TIME ]:           INLINES | CONTENT,  // SEALED
    [ CODE ]:           INLINES | CONTENT,  // SEALED
    [ STRONG ]:         INLINES | CONTENT,
    [ EM ]:             INLINES | CONTENT,
    [ CITE ]:           INLINES | CONTENT,
    [ SMALL ]:          INLINES | CONTENT,
    [ SUB ]:            INLINES | CONTENT,
    [ SUP ]:            INLINES | CONTENT,
    [ MARK ]:           INLINES | CONTENT,
    [ ORZ ]:            INLINES | CONTENT,
    [ SAMP ]:           INLINES | CONTENT,
    [ KBD ]:            INLINES | CONTENT,
    [ S ]:              INLINES | CONTENT,
    [ U ]:              INLINES | CONTENT,
    [ VAR ]:            INLINES | CONTENT,

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
    [ H1 ]:             STRUCT | SINGLE | FIXED1 | CONTENT,
    [ H2 ]:             STRUCT | SINGLE | FIXED1 | CONTENT,
    [ H3 ]:             STRUCT | STRUCTX | FIXED1 | CONTENT,
    [ H3X ]:            STRUCT | STRUCTX | CONTENT,
    [ H4 ]:             STRUCT | SINGLE | FIXED1 | FIXED2 | CONTENT,
    [ H5 ]:             STRUCT | STRUCTX | CONTENT,
    [ H6 ]:             STRUCT | STRUCTX | CONTENT,
    [ SUMMARY ]:        STRUCT | SINGLE | FIXED1 | CONTENT,
    [ FIGCAPTION ]:     STRUCT | SINGLE | STRUCTX | CONTENT, // 可移动
    [ CAPTION ]:        STRUCT | SINGLE | STRUCTX | FIXED1 | CONTENT,
    [ LI ]:             STRUCT | STRUCTX | CONTENT,
    [ DT ]:             STRUCT | STRUCTX | CONTENT,
    [ DD ]:             STRUCT | STRUCTX | CONTENT,
    [ TH ]:             STRUCT | CONTENT,
    [ TD ]:             STRUCT | CONTENT,
    [ TR ]:             STRUCT | STRUCTX,
    [ TBODY ]:          STRUCT,
    [ THEAD ]:          STRUCT | STRUCTX | SINGLE,
    [ TFOOT ]:          STRUCT | STRUCTX | SINGLE,

    [ CODELI ]:         STRUCT | STRUCTX | SEALED,
    [ ALI ]:            STRUCT | STRUCTX | CONTENT, // 宽容
    [ AH4 ]:            STRUCT | SINGLE | FIXED1 | FIXED2 | CONTENT,
    [ XH4LI ]:          STRUCT | STRUCTX | SEALED,
    [ XOLH4LI ]:        STRUCT | STRUCTX | SEALED,
    [ XOLAH4LI ]:       STRUCT | STRUCTX | SEALED,
    [ TOCCASCADE ]:     STRUCT | FIXED1 | FIXED2 | SEALED,
    // 插图内允许多个<span>容器。
    [ FIGIMGBOX ]:      STRUCT | STRUCTX,  // SEALED,

    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         BLOCKS | SINGLE | STRUCT | FIXED1,
    [ ABSTRACT ]:       BLOCKS | SINGLE | STRUCT | FIXED1,
    [ TOC ]:            BLOCKS | SINGLE | STRUCT | FIXED1 | SEALED,
    [ SEEALSO ]:        BLOCKS | STRUCT,
    [ REFERENCE ]:      BLOCKS | STRUCT,
    [ HEADER ]:         BLOCKS | SINGLE | STRUCT | FIXED1,
    [ FOOTER ]:         BLOCKS | SINGLE | STRUCT | FIXED2,
    [ ARTICLE ]:        BLOCKS | SINGLE | STRUCT,
    [ S1 ]:             BLOCKS | STRUCT,
    [ S2 ]:             BLOCKS | STRUCT,
    [ S3 ]:             BLOCKS | STRUCT,
    [ S4 ]:             BLOCKS | STRUCT,
    [ S5 ]:             BLOCKS | STRUCT,
    [ SECTION ]:        BLOCKS | STRUCT,
    [ UL ]:             BLOCKS | STRUCT,
    [ OL ]:             BLOCKS | STRUCT,
    [ CODELIST ]:       BLOCKS | STRUCT,
    [ ULX ]:            BLOCKS | STRUCT,
    [ OLX ]:            BLOCKS | STRUCT,
    [ CASCADE ]:        BLOCKS | STRUCT,
    [ DL ]:             BLOCKS | STRUCT,
    [ TABLE ]:          BLOCKS | STRUCT,  // 支持多<tbody>
    [ FIGURE ]:         BLOCKS | STRUCT,  // 支持多<span/img, i:explain>
    [ BLOCKQUOTE ]:     BLOCKS | STRUCT,
    [ ASIDE ]:          BLOCKS | STRUCT,
    [ DETAILS ]:        BLOCKS | STRUCT,
    [ CODEBLOCK ]:      BLOCKS | STRUCT,  // SEALED（可多块）
    // 行块单体元素
    [ HR ]:             BLOCKS | EMPTY,
    [ BLANK ]:          BLOCKS | SEALED,

    //
    // 特殊用途。
    /////////////////////////////////////////////
    [ B ]:              SPECIAL | STRUCTX | CONTENT,
    [ I ]:              SPECIAL | STRUCTX | CONTENT,
};



//
// 分组：内联单元。
// 不含<a>和<b><i>单元（直接引用）。
// 注：顺序会体现在内容录入面板的选单上。
//===============================================


//
// 媒体单元。
//
const _INLMEDIA =
[
    AUDIO, VIDEO, PICTURE, SVG, METER, IMG
];

//
// 文本类。
//
const _INLTEXT =
[
    Q, ABBR, DFN, BDO, TIME,
    CODE, RUBY,
    STRONG, EM, CITE, SMALL, SUB, SUP, MARK, ORZ, SAMP, KBD, VAR,
];

//
// 审校&视觉元件。
//
const _REVIEW = [ DEL, INS, S, U ];

//
// 视觉控制。
//
const _INLVIEW = [ BR, WBR, SPACE ];



// 合并集：全部
// 不含独立的<a>,<b>,<i>。
const _INLALL = [
    ..._INLMEDIA, ..._INLTEXT, ..._REVIEW, ..._INLVIEW
];

// 合并集：非媒体类
const _NOMEDIA = [
    ..._INLTEXT, ..._REVIEW, ..._INLVIEW
];

// 合并集：视觉类
const _VIEWS = [
    ..._REVIEW, ..._INLVIEW
];


//
// 分组：行块单元。
//===============================================


//
// 受限行块单元集。
// 少部分可置于文章顶层（与<article>平级）的单元内容。
//
const _BLOLIMIT = [ BLOCKQUOTE, ASIDE, UL, OL ];


//
// 正文行块单元集。
// 即内容件，在<article/section>中可自由存在。
// 注意此处的顺序会在主面板插入选单上表现出来。
// 注：
// 不含 S1~S5，它们有明确的层级递进逻辑。
// 不含 ADDRESS，它应当出现在文档特定（<footer>）的位置。
//
const _BLOCKITS =
[
    P, NOTE, TIPS, PRE,
    UL, OL, CODELIST, ULX, OLX, CASCADE, DL, TABLE, FIGURE, BLOCKQUOTE, ASIDE, DETAILS, CODEBLOCK,
    BLANK,
];


//
// 导出：
// 合法子单元类型。
// 子数组类型是一种分组抽象，表示使用该组所有类型。
// 值 null 适用于空元素和文本节点。
// 参考：
// - 用于源码结构检查。
// - 用于判断目标的可插入单元（向内）。
// - 取父容器可判断平级插入时的合法单元。
//
export const ChildTypes = {
    //
    // 内联结构元素。
    /////////////////////////////////////////////
    [ $TEXT ]:          null,

    [ AUDIO ]:          [ $TEXT, SOURCE1, TRACK ],
    [ VIDEO ]:          [ $TEXT, SOURCE1, TRACK ],
    [ PICTURE ]:        [ SOURCE2, PIMG ],
    [ SVG ]:            [ SVGITEM ],
    [ RUBY ]:           [ $TEXT, RT, RP ],
    [ METER ]:          [ $TEXT ],
    [ SPACE ]:          null,
    [ IMG ]:            null,
    [ BR ]:             null,
    [ WBR ]:            null,
    //
    // 内联内结构
    /////////////////////////////////////////////
    [ SVGITEM ]:        [ SVGITEM ],
    [ TRACK ]:          null,
    [ SOURCE1 ]:        null,
    [ SOURCE2 ]:        null,
    [ PIMG ]:           null,
    [ RT ]:             [ $TEXT ],
    [ RP ]:             [ $TEXT ],
    [ EXPLAIN ]:        [ $TEXT, A, ..._NOMEDIA ], // 插图讲解
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:              [ $TEXT, ..._INLALL ],
    [ Q ]:              [ $TEXT, A, ..._INLALL, SVG, IMG ],
    [ ABBR ]:           [ $TEXT, ..._REVIEW ],
    [ DEL ]:            [ $TEXT, A, ..._INLTEXT, ..._INLVIEW ],
    [ INS ]:            [ $TEXT, A, ..._INLTEXT, ..._INLVIEW ],
    [ DFN ]:            [ $TEXT, ABBR, ..._VIEWS ],
    [ BDO ]:            [ $TEXT, ..._INLTEXT, ..._REVIEW ],
    [ TIME ]:           [ $TEXT, ..._REVIEW ],
    [ CODE ]:           [ $TEXT, B, I ],
    [ STRONG ]:         [ $TEXT, ..._VIEWS ],
    [ EM ]:             [ $TEXT, ..._VIEWS ],
    [ CITE ]:           [ $TEXT, ..._VIEWS ],
    [ SMALL ]:          [ $TEXT, ..._VIEWS ],
    [ SUB ]:            [ $TEXT, ..._VIEWS ],
    [ SUP ]:            [ $TEXT, ..._VIEWS ],
    [ MARK ]:           [ $TEXT, ..._NOMEDIA ],
    [ ORZ ]:            [ $TEXT ],
    [ SAMP ]:           [ $TEXT, ..._REVIEW ],
    [ KBD ]:            [ $TEXT, ..._REVIEW ],
    [ S ]:              [ $TEXT, ..._NOMEDIA ],
    [ U ]:              [ $TEXT, ..._NOMEDIA ],
    [ VAR ]:            [ $TEXT, ..._REVIEW ],

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:              [ $TEXT, A, ..._INLALL ],
    [ NOTE ]:           [ $TEXT, A, ..._INLALL ],
    [ TIPS ]:           [ $TEXT, A, ..._INLALL ],
    [ PRE ]:            [ $TEXT, A, ..._NOMEDIA ],
    [ ADDRESS ]:        [ $TEXT, A, ..._INLALL ],
    //
    // 块内结构元素
    /////////////////////////////////////////////
    [ H1 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H2 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H3 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H3X ]:            [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H4 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H5 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ H6 ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ SUMMARY ]:        [ $TEXT, A, ..._NOMEDIA ],
    [ FIGCAPTION ]:     [ $TEXT, A, ..._NOMEDIA ],
    [ CAPTION ]:        [ $TEXT, A, ..._NOMEDIA ],
    [ DT ]:             [ $TEXT, A, ..._NOMEDIA, SVG, IMG, I ],
    [ LI ]:             [ $TEXT, A, ..._INLALL ],
    [ DD ]:             [ $TEXT, A, ..._INLALL ],
    [ TH ]:             [ $TEXT, A, ..._INLALL ],
    [ TD ]:             [ $TEXT, A, ..._INLALL ],
    [ TR ]:             [ TH, TD ],
    [ THEAD ]:          [ TR ],
    [ TBODY ]:          [ TR ],
    [ TFOOT ]:          [ TR ],

    [ CODELI ]:         [ CODE ],
    [ ALI ]:            [ A ],
    [ AH4 ]:            [ A ],
    [ XH4LI ]:          [ H4, UL ],
    [ XOLH4LI ]:        [ H4, OL ],
    [ XOLAH4LI ]:       [ AH4, OL ],
    [ TOCCASCADE ]:     [ ALI, XOLAH4LI ],
    [ FIGIMGBOX ]:      [ IMG, SVG, EXPLAIN ],
    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         [ H1, H3X ],
    [ ABSTRACT ]:       [ H3, P, ..._BLOLIMIT ],
    [ TOC ]:            [ H3, TOCCASCADE ],
    [ REFERENCE ]:      [ H3, OL ],
    [ SEEALSO ]:        [ H3, UL ],
    [ HEADER ]:         [ H3, P, TIPS, NOTE, ..._BLOLIMIT, ULX, OLX ],
    [ FOOTER ]:         [ H3, P, TIPS, NOTE, ..._BLOLIMIT, ADDRESS ],

    // ARTICLE
    // S1-5, SECTION 另配置

    [ UL ]:             [ LI, ALI ],
    [ OL ]:             [ LI, ALI ],
    [ CODELIST ]:       [ CODELI ],
    [ ULX ]:            [ LI, ALI, XH4LI, XOLH4LI ],
    [ OLX ]:            [ LI, ALI, XH4LI, XOLH4LI ],
    [ CASCADE ]:        [ LI, ALI, XOLH4LI, XOLAH4LI ],
    [ DL ]:             [ DT, DD ],
    [ TABLE ]:          [ CAPTION, THEAD, TBODY, TFOOT ],
    [ FIGURE ]:         [ FIGCAPTION, FIGIMGBOX ],
    [ BLOCKQUOTE ]:     [ H3, P, ..._BLOLIMIT, TABLE ],
    [ ASIDE ]:          [ H3, P, ..._BLOLIMIT, TABLE ],
    [ DETAILS ]:        [ SUMMARY, P, ..._BLOLIMIT, TABLE ],
    [ CODEBLOCK ]:      [ CODE ],
    // 单体单元
    [ HR ]:             null,
    [ BLANK ]:          null,

    //
    // 特别单元
    /////////////////////////////////////////////
    [ B ]:              [ $TEXT ],
    [ I ]:              [ $TEXT, A ],

    //
    // 文章顶层容器
    /////////////////////////////////////////////
    [ MAIN ]:           [ H1, HGROUP, ABSTRACT, TOC, ARTICLE, REFERENCE, SEEALSO, FOOTER ],

};

//
// 配置构造。
// 转换为用一个Set实例存储值集。
// {Number: Set<number>}
//
$.each(
    ChildTypes,
    (v, k, o) => o[k] = v && new Set( v )
);


//
// 导出：
// 片区子类型定义。
// 片区与内容件互斥，但允许子片区与内容件临时并列。
// 判断合法子类型时需根据源容器即时构造子集。
// 如：结构检查、选单构造。
// 通用项：
// 标题、导言、结语、分隔
//
export const ChildTypesX = {
    [ ARTICLE ]:    [ HEADER, FOOTER, HR, S1 ],
    [ S1 ]:         [ H2, HEADER, FOOTER, HR, S2 ],
    [ S2 ]:         [ H2, HEADER, FOOTER, HR, S3 ],
    [ S3 ]:         [ H2, HEADER, FOOTER, HR, S4 ],
    [ S4 ]:         [ H2, HEADER, FOOTER, HR, S5 ],
    [ S5 ]:         [ H2, HEADER, FOOTER, HR, SECTION ],
    [ SECTION ]:    [ H2, HEADER, FOOTER, HR, SECTION ],
};



//
// 工具函数导出
//////////////////////////////////////////////////////////////////////////////


/**
 * 是否为空元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isEmpty( tval ) {
    return !!( Properties[tval] & EMPTY );
}


/**
 * 是否为单一成员。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isSingle( tval ) {
    return !!( Properties[tval] & SINGLE );
}


/**
 * 是否为隐蔽成员。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isCovert( tval ) {
    return !!( Properties[tval] & COVERT );
}


/**
 * 是否位置向前固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isFixed1( tval ) {
    return !!( Properties[tval] & FIXED1 );
}


/**
 * 是否位置向后固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isFixed2( tval ) {
    return !!( Properties[tval] & FIXED2 );
}


/**
 * 是否为双向固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isFixed( tval ) {
    return !!( Properties[tval] & FIXED1 && Properties[tval] & FIXED2 );
}


/**
 * 是否为任一固定。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isFixedAny( tval ) {
    return !!( Properties[tval] & FIXED1 || Properties[tval] & FIXED2 );
}


/**
 * 是否为密封单元。
 * 可修改但不可新插入，除非已为空。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isSealed( tval ) {
    return !!( Properties[tval] & SEALED );
}


/**
 * 是否为行块单元。
 * 可作为各片区单元的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isBlocks( tval ) {
    return !!( Properties[tval] & BLOCKS );
}


/**
 * 是否为内联单元。
 * 可作为内容元素里的实体内容。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isInlines( tval ) {
    return !!( Properties[tval] & INLINES );
}


/**
 * 是否为内容元素。
 * 可直接包含文本和内联单元。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isContent( tval ) {
    return !!( Properties[tval] & CONTENT );
}


/**
 * 是否为结构容器。
 * 包含固定逻辑的子元素结构。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isStruct( tval ) {
    return !!( Properties[tval] & STRUCT );
}


/**
 * 是否为结构子单元。
 * 自身为结构容器元素内的子元素。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isStructX( tval ) {
    return !!( Properties[tval] & STRUCTX );
}


/**
 * 是否为特别用途元素。
 * 即：<b>|<i>，用于代码内逻辑封装。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function isSpecial( tval ) {
    return !!( Properties[tval] & SPECIAL );
}


/**
 * 是否只能包含纯文本。
 * 注记：仅需检查ChildTypes集合。
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function onlyText( tval ) {
    let _subs = ChildTypes[ tval ];
    return !!_subs && _subs.size === 1 && _subs.has( $TEXT );
}


/**
 * 检查章节内容状态。
 * 也适用文章（<article>）根容器。
 * 返回值：{
 *      0   仅包含通用项（h2, header, footer, hr）
 *      1   除通用项外，纯内容件
 *      2   除通用项外，纯子片区
 *      3   子片区和内容件混杂状态
 * }
 * @param  {Element} sec 章节/片区元素
 * @return {Number} 状态码
 */
export function sectionState( sec ) {
    let _els = $.not( $.children(sec), 'h2,header,footer,hr' ),
        _ses = $.filter( _els, 'section' );

    // 未定
    if ( !_els.length ) return 0;
    // 纯内容件
    if ( !_ses.length ) return 1;
    // 纯片区
    if ( _els.length === _ses.length ) return 2;
    // 混杂
    return 3;
}


/**
 * 构造目标容器的合法子集。
 * 实时检查容器的内容情况。
 * 除通用项外：
 * - 仅包含内容件。
 * - 仅包含子片区。
 * - 为空或子片区与内容件混杂。
 * @param  {Element} box 容器元素
 * @param  {[Number]} subs 子集定义（ChildTypesX[n]）
 * @return {[Number]}
 */
export function sectionSubs( box, subs ) {
    let _n = sectionState( box );

    switch ( _n ) {
        case 1: return subs.slice(0, -1).concat(_BLOCKITS);
        case 2: return subs;
    }
    return subs.concat( _BLOCKITS );
}
