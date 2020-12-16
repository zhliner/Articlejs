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
    EMPTY       = 1 << 6,   // 空元素（单标签）
    SEALED      = 1 << 7,   // 密封单元（不可合并）
    FIXED1      = 1 << 8,   // 位置向前固定
    FIXED2      = 1 << 9;   // 位置向后固定


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
    SOURCE          = 101,  // 媒体资源 {src, srcset, type, media}
    RB              = 102,  // 注音文本
    RT              = 103,  // 注音拼音
    RP              = 104,  // 注音拼音包围
    EXPLAIN         = 105,  // 插图讲解 {fix}
    RBPT            = 106,  // 注音分组封装（抽象：用于包含多组注音）
    SVGITEM         = 107,  // 图形内容（仅用于SVG子元素配置）
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A               = 200,  // 链接 {href, target}
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
    H3              = 402,  // 小区块标题/副标题
    H4              = 403,  // 列表项标题条目
    H5              = 404,  // <h5>标题
    H6              = 405,  // <h6>标题
    SUMMARY         = 406,  // 内容摘要
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
    // 定制结构类
    // 注记：无需LICODE设计，容器非CONTENT即可。
    CODELI          = 418,  // 代码表条目（li/code） {value}
    ALI             = 429,  // 链接列表项（li/a）
    AH4             = 420,  // 链接小标题（h4/a）
    XH4LI           = 421,  // 级联表标题项（li/h4, ul|ol）
    CASCADEH4LI     = 422,  // 级联编号表标题项（li/h4, ol）
    CASCADEAH4LI    = 423,  // 级联编号表链接标题项（li/[h4/a], ol）
    TOCCASCADE      = 424,  // 目录级联表（ol:cascade/[li/a]）
    FIGIMGBOX       = 425,  // 插图内容块（span/img, i:explain）
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
    SEEALSO         = 508,  // 另参见 （ul:seealso/li/#text）
    REFERENCE       = 509,  // 文献参考 （ol:reference/li/#text）
    HEADER          = 510,  // 导言 （header/h3, p...）
    FOOTER          = 511,  // 结语 （footer/h3, p...）
    ARTICLE         = 512,  // 文章区 （article/header?, s1 | {content}, footer?, hr?）
    SECTION         = 513,  // 深片区 ([s5]/section)
    UL              = 514,  // 无序列表 （ul/li）
    OL              = 515,  // 有序列表 （ol/li）
    CODELIST        = 516,  // 代码表 （ol:codelist/li/code/#text, b, i） {data-lang, data-tab, start}
    ULX             = 517,  // 无序级联表 （ul/li/h4, ul|ol/...）
    OLX             = 518,  // 有序级联表 （ol/li/h4, ol|ul/...）
    CASCADE         = 519,  // 级联编号表 （ol:cascade/li/h4, ol/li/...）
    DL              = 520,  // 定义列表 （dl/dt, dd+）
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
    [ AUDIO ]:          INLINES | STRUCT | SEALED,
    [ VIDEO ]:          INLINES | STRUCT | SEALED,
    [ PICTURE ]:        INLINES | STRUCT | SEALED,
    [ SVG ]:            INLINES | STRUCT,
    [ RUBY ]:           INLINES | STRUCT,  // SEALED
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
    [ EXPLAIN ]:        STRUCT | STRUCTX | CONTENT,
    // 解包：先文本化，然后内容提升。
    [ RB ]:             STRUCT | FIXED1 | FIXED2 | CONTENT,
    [ RT ]:             STRUCT | FIXED1 | FIXED2 | CONTENT,
    [ RP ]:             STRUCT | FIXED1 | FIXED2 | SEALED,
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
    [ H1 ]:             STRUCT | FIXED1 | CONTENT,
    [ H2 ]:             STRUCT | FIXED1 | CONTENT,
    [ H3 ]:             STRUCT | STRUCTX | FIXED1 | CONTENT,
    [ H4 ]:             STRUCT | FIXED1 | FIXED2 | CONTENT,
    [ H5 ]:             STRUCT | STRUCTX | CONTENT,
    [ H6 ]:             STRUCT | STRUCTX | CONTENT,
    [ SUMMARY ]:        STRUCT | FIXED1 | CONTENT,
    [ FIGCAPTION ]:     STRUCT | STRUCTX | CONTENT, // 可移动
    [ CAPTION ]:        STRUCT | STRUCTX | FIXED1 | CONTENT,
    [ LI ]:             STRUCT | STRUCTX | CONTENT,
    [ DT ]:             STRUCT | STRUCTX | CONTENT,
    [ DD ]:             STRUCT | STRUCTX | CONTENT,
    [ TH ]:             STRUCT | CONTENT,
    [ TD ]:             STRUCT | CONTENT,
    [ TR ]:             STRUCT | STRUCTX,
    [ TBODY ]:          STRUCT,
    [ THEAD ]:          STRUCT | STRUCTX,
    [ TFOOT ]:          STRUCT | STRUCTX,

    [ CODELI ]:         STRUCT | STRUCTX | SEALED,
    [ ALI ]:            STRUCT | STRUCTX | CONTENT, // 宽容
    [ AH4 ]:            STRUCT | FIXED1 | FIXED2 | CONTENT,
    [ XH4LI ]:          STRUCT | STRUCTX | SEALED,
    [ CASCADEH4LI ]:    STRUCT | STRUCTX | SEALED,
    [ CASCADEAH4LI ]:   STRUCT | STRUCTX | SEALED,
    [ TOCCASCADE ]:     STRUCT | FIXED1 | FIXED2 | SEALED,
    // 插图内允许多个<span>容器。
    [ FIGIMGBOX ]:      STRUCT | STRUCTX | SEALED,

    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         BLOCKS | STRUCT | FIXED1 | SEALED,
    [ ABSTRACT ]:       BLOCKS | STRUCT | FIXED1,
    [ TOC ]:            BLOCKS | STRUCT | FIXED1 | SEALED,
    [ SEEALSO ]:        BLOCKS | STRUCT,
    [ REFERENCE ]:      BLOCKS | STRUCT,
    [ HEADER ]:         BLOCKS | STRUCT | FIXED1,
    [ FOOTER ]:         BLOCKS | STRUCT | FIXED2,
    [ ARTICLE ]:        BLOCKS | STRUCT,
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
    [ CODEBLOCK ]:      BLOCKS | STRUCT | SEALED,
    // 行块单体元素
    [ HR ]:             BLOCKS | EMPTY,
    [ BLANK ]:          BLOCKS | SEALED,

    //
    // 特殊用途。
    /////////////////////////////////////////////
    [ B ]:              SPECIAL,
    [ I ]:              SPECIAL | STRUCTX | CONTENT,
};



//
// 内联单元集。
// 不含<a>单元，不含<b><i>单元。
// 注：
// 此处的顺序会体现在内容录入面板的选单上。
//
const _INLINES =
[
    AUDIO, VIDEO, PICTURE, SVG, RUBY, METER, SPACE, IMG, BR, WBR,
    Q, ABBR, DEL, INS, DFN, BDO, TIME, CODE,
    STRONG, EM, CITE, SMALL, SUB, SUP, MARK, ORZ, SAMP, KBD, S, U, VAR,
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
// 子数组类型是一种分组抽象，表示使用该组所有类型。
// 值 null 适用于空元素和文本节点。
// 注记：
// - 可用于源码结构检查。
// - 可用于判断目标的可插入单元（向内）。
// - 取父容器可判断平级插入时的合法单元。
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
    // RBPT 为固定结构组。
    [ RUBY ]:           [ RBPT, RB, RT ],
    [ RB ]:             [ $TEXT ],
    [ RT ]:             [ $TEXT ],
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
    [ SOURCE ]:         null,
    [ RB ]:             [ $TEXT ],
    [ RT ]:             [ $TEXT ],
    [ RP ]:             [ $TEXT ],
    [ EXPLAIN ]:        [ $TEXT, A, ..._INLINES ], // 插图讲解
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:              [ $TEXT, ..._INLINES ],
    [ Q ]:              [ $TEXT, A, ..._INLINES ],
    [ ABBR ]:           [ $TEXT ],
    [ DEL ]:            [ $TEXT, A, ..._INLINES ],
    [ INS ]:            [ $TEXT, A, ..._INLINES ],
    [ DFN ]:            [ $TEXT, ABBR ],
    [ BDO ]:            [ $TEXT, A, ..._INLINES ],
    [ TIME ]:           [ $TEXT ],
    [ CODE ]:           [ $TEXT, B, I ],
    [ STRONG ]:         [ $TEXT, A, ..._INLINES ],
    [ EM ]:             [ $TEXT, A, ..._INLINES ],
    [ CITE ]:           [ $TEXT, A, ..._INLINES ],
    [ SMALL ]:          [ $TEXT, A, ..._INLINES ],
    [ SUB ]:            [ $TEXT, ..._INLINES ],
    [ SUP ]:            [ $TEXT, ..._INLINES ],
    [ MARK ]:           [ $TEXT, ..._INLINES ],
    [ ORZ ]:            [ $TEXT ],
    [ SAMP ]:           [ $TEXT, A, ..._INLINES ],
    [ KBD ]:            [ $TEXT ],
    [ S ]:              [ $TEXT, A, ..._INLINES ],
    [ U ]:              [ $TEXT, A, ..._INLINES ],
    [ VAR ]:            [ $TEXT ],

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:              [ $TEXT, A, ..._INLINES ],
    [ NOTE ]:           [ $TEXT, A, ..._INLINES ],
    [ TIPS ]:           [ $TEXT, A, ..._INLINES ],
    [ PRE ]:            [ $TEXT, A, ..._INLINES ],
    [ ADDRESS ]:        [ $TEXT, A, ..._INLINES ],
    //
    // 块内结构元素
    /////////////////////////////////////////////
    [ H1 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ H2 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ H3 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ H4 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ H5 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ H6 ]:             [ $TEXT, A, ..._INLINES, I ],
    [ SUMMARY ]:        [ $TEXT, A, ..._INLINES ],
    [ FIGCAPTION ]:     [ $TEXT, A, ..._INLINES ],
    [ CAPTION ]:        [ $TEXT, A, ..._INLINES ],
    [ LI ]:             [ $TEXT, A, ..._INLINES ],
    [ DT ]:             [ $TEXT, A, ..._INLINES, I ],
    [ DD ]:             [ $TEXT, A, ..._INLINES ],
    [ TH ]:             [ $TEXT, A, ..._INLINES ],
    [ TD ]:             [ $TEXT, A, ..._INLINES ],
    [ TR ]:             [ TH, TD ],
    [ THEAD ]:          [ TR ],
    [ TBODY ]:          [ TR ],
    [ TFOOT ]:          [ TR ],

    [ CODELI ]:         [ CODE ],
    [ ALI ]:            [ A ],
    [ AH4 ]:            [ A ],
    [ XH4LI ]:          [ H4, UL, OL ],
    [ CASCADEH4LI ]:    [ H4, OL ],
    [ CASCADEAH4LI ]:   [ AH4, OL ],
    [ TOCCASCADE ]:     [ ALI, CASCADEAH4LI ],
    [ FIGIMGBOX ]:      [ IMG, SVG, EXPLAIN ],
    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:         [ H1, H3 ],
    [ ABSTRACT ]:       [ H3, P, ..._BLOLIMIT ],
    [ TOC ]:            [ H3, TOCCASCADE ],
    [ SEEALSO ]:        [ LI, ALI ],
    [ REFERENCE ]:      [ LI, ALI ],
    [ HEADER ]:         [ H3, P, ..._BLOLIMIT, ULX, OLX ],
    [ FOOTER ]:         [ H3, P, ..._BLOLIMIT, ADDRESS ],
    [ ARTICLE ]:        [ HEADER, S1, FOOTER ],
    // 操作便利性：
    // 允许分级片区与其它行块单元同级存在。
    [ S1 ]:             [ H2, HEADER, S2, ..._BLOCKITS, FOOTER ],
    [ S2 ]:             [ H2, HEADER, S3, ..._BLOCKITS, FOOTER ],
    [ S3 ]:             [ H2, HEADER, S4, ..._BLOCKITS, FOOTER ],
    [ S4 ]:             [ H2, HEADER, S5, ..._BLOCKITS, FOOTER ],
    [ S5 ]:             [ H2, HEADER, ..._BLOCKITS, SECTION, FOOTER ],
    [ SECTION ]:        [ H2, HEADER, ..._BLOCKITS, SECTION, FOOTER ],
    [ UL ]:             [ LI, ALI ],
    [ OL ]:             [ LI, ALI ],
    [ CODELIST ]:       [ CODELI ],
    [ ULX ]:            [ LI, ALI, XH4LI ],
    [ OLX ]:            [ LI, ALI, XH4LI ],
    [ CASCADE ]:        [ LI, CASCADEH4LI, ALI, CASCADEAH4LI ],
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
    [ MAIN ]:           [ H1, HGROUP, ABSTRACT, TOC, HEADER, ARTICLE, SEEALSO, REFERENCE, FOOTER ],

};

//
// 配置构造。
// Number: Set
//
$.each(
    ChildTypes,
    (v, k, o) => o[k] = v && new Set( v )
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
    return !!( Properties[tval] & EMPTY );
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
 * @param  {Number} tval 类型值
 * @return {Boolean}
 */
export function onlyText( tval ) {
    let _subs = ChildTypes[ tval ];
    return _subs && _subs.size === 1 && _subs.has( $TEXT );
}


/**
 * 是否为合法子类型。
 * @param  {Number} tval 父类型值
 * @param  {Number} sub 子类型值
 * @return {Boolean}
 */
export function isChildType( tval, sub ) {
    let _subs = ChildTypes[ tval ];
    return _subs && _subs.has( sub );
}


/**
 * 获取目标类型的合法子类型集。
 * 始终返回一个数组，可能为空。
 * @param  {Number} tval 目标类型值
 * @return {[Number]}
 */
export function childTypes( tval ) {
    let _subs = ChildTypes[ tval ];
    return _subs ? [ ..._subs ] : [];
}
