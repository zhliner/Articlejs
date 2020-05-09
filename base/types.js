//! $Id: types.js 2019.10.09 Articlejs.Libs $
// ++++++++++++++++++++++++++++++++++++++++++++
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

//
// 分类定义：
// 0. 特别类型。存在但不归类（如：<b>,<i>）。
// 1. 结构元素。包含固定逻辑的子元素。
// 2. 内容元素。可包含文本节点和内联单元。
// 3. 内联单元。独立内容单元。
// 4. 行块单元。独立内容单元。
//
// 特性标记：
// 0. EMPTY   空元素（单标签）
// 1. FIXED   位置固定。只能自我移动（不能被其它元素移动），如：{<caption>}
// 2. TBLSECT 表格区段元件：{<thead>|<tbody>|<tfoot>}
// 3. TBLCELL 表格单元元件：{<th>|<td>}
// 4. DLITEM  定义列表项：  {<dt>|<dd>}
// 5. LIST    普通列表（子项由<li>封装）：{<ol>|<ul>|...}
// 6. SEALED  密封单元，可对原成员修改内容但不接受新插入。
// 7. SECTED  分级片区，有内容互斥约束（S1-5|CONSECT）
//
// 注记：
// 移动判断处理：若非固定，相同者可互换或并列（否则取内容）。
//
const
    TEXT    = 0,        // 文本节点
    PURPOSE = 1,        // 特殊用途
    STRUCT  = 1 << 1,   // 结构元素
    CONTENT = 1 << 2,   // 内容元素
    INLINES = 1 << 3,   // 内联单元
    BLOCKS  = 1 << 4,   // 行块单元
    EMPTY   = 1 << 5,   // 空元素（单标签）
    FIXED   = 1 << 6,   // 位置确定性
    TBLSECT = 1 << 7,   // 表结构元件
    TBLCELL = 1 << 8,   // 表格单元元件
    DLITEM  = 1 << 9,   // 定义列表项
    LIST    = 1 << 10,  // 普通列表
    SEALED  = 1 << 11,  // 密封单元
    SECTED  = 1 << 12;  // 分级片区单元


//
// 单元值定义。
// 用于标识单元元素的类型，便于简单高效地判断（而非每次都作复杂的检查）。
//
// - 内联结构元素：     [0, 99]     不能包含文本或其它内联单元，有固定的内部结构或空结构。
// - 内联内结构元素：   [100, 199]  其它内联结构元素的内部成员，自身不是独立的内联单元。可能为内容元素。
// - 内联内容元素：     [200, 299]  可直接包含文本或其它内联单元。
// - 行块内容元素：     [300, 399]  可直接包含文本节点和内联单元，但属于行块逻辑而不是内联成员。
// - 块内结构元素：     [400, 499]  行块结构元素内部的元素，不能充当独立的单元。可为内容元素。
// - 行块结构元素：     [500, ~]    不能直接包含文本或内联单元（含单体单元）。
//
// 注记：
// - 单元创建时会设置元素的单元类型值（Symbol键，避免外部影响）。
// - 如果获取元素该值时为未定义，会即时检查并设置。
//
export const
    $TEXT       = 0,    // 文本节点（#text）
    //
    // 内联结构元素
    /////////////////////////////////////////////
    AUDIO       = 1,    // 音频
    VIDEO       = 2,    // 视频
    PICTURE     = 3,    // 兼容图片
    SVG         = 4,    // 图形
    RUBY        = 5,    // 注音
    TIME        = 6,    // 时间
    METER       = 7,    // 度量
    SPACE       = 8,    // 空白
    IMG         = 9,    // 图片
    DATAIMG     = 10,   // 数据图片（data:image/,...）
    BR          = 11,   // 换行
    WBR         = 12,   // 软换行
    //
    // 内联内结构
    /////////////////////////////////////////////
    TRACK       = 100,  // 字幕轨
    SOURCE      = 101,  // 媒体资源
    RB          = 102,  // 注音文本
    RT          = 103,  // 注音拼音
    RP          = 104,  // 注音拼音包围
    SPAN        = 105,  // 插图讲解
    // 抽象：
    // 用于插入完整的单元组。
    RBPT        = 106,  // 注音内容封装
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A           = 200,  // 链接
    STRONG      = 201,  // 重点
    EM          = 202,  // 强调
    Q           = 203,  // 短引用
    ABBR        = 204,  // 缩写
    CITE        = 205,  // 来源
    SMALL       = 206,  // 注脚
    DEL         = 207,  // 删除
    INS         = 208,  // 插入
    SUB         = 209,  // 下标
    SUP         = 210,  // 上标
    MARK        = 211,  // 标记
    CODE        = 212,  // 代码（code/#text, b, i）
    ORZ         = 213,  // 表情
    DFN         = 214,  // 定义
    SAMP        = 215,  // 样本
    KBD         = 216,  // 键盘字
    S           = 217,  // 失效
    U           = 218,  // 注记
    VAR         = 219,  // 变量
    BDO         = 220,  // 有向文本

    //
    // 行块内容元素
    /////////////////////////////////////////////
    P           = 300,  // 段落 （p/#text, ...）
    NOTE        = 301,  // 注解 （p:note/#text, ...）
    TIPS        = 302,  // 提示 （p:tips/#text, ...）
    PRE         = 303,  // 预排版 （pre/#text, ...）
    ADDRESS     = 304,  // 地址 （address/#text, ...）
    //
    // 块内结构元素
    /////////////////////////////////////////////
    H1          = 400,  // 页标题
    H2          = 401,  // 章标题
    H3          = 402,  // 节标题
    H4          = 403,  // 区标题
    H5          = 404,  // 段标题
    H6          = 405,  // 末标题
    SUMMARY     = 406,  // 详细内容摘要/标题
    FIGCAPTION  = 407,  // 插图标题
    CAPTION     = 408,  // 表格标题
    LI          = 409,  // 列表项（通用）
    DT          = 410,  // 定义列表条目
    DD          = 411,  // 定义列表数据
    TH          = 412,  // 表头单元格
    TD          = 413,  // 单元格
    CODELI      = 414,  // 代码表条目（li/code）
    ALI         = 415,  // 目录表普通条目（li/a）
    AH4LI       = 416,  // 目录表标题条目（li/h4/a）
    ULXH4LI     = 417,  // 无序级联表项标题（li/h4, ol|ul）
    OLXH4LI     = 418,  // 有序级联表项标题（li/h4, ul|ol）
    CASCADEH4LI = 419,  // 级联编号表项标题（li/h4, ol）
    IMGP        = 420,  // 插图内容区（p/img...）
    TR          = 421,  // 表格行
    THEAD       = 422,  // 表头
    TBODY       = 423,  // 表体
    TFOOT       = 424,  // 表脚
    // 抽象：
    // 与 S1-S5 互斥存在。
    CONSECT     = 425,  // 内容片区
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP      = 500,  // 主/副标题组 （hgroup/h1, h2）
    ABSTRACT    = 501,  // 提要 （header:abstract/h3, p...）
    TOC         = 502,  // 目录 （nav:toc/h3, ol:cascade/li/(h4/a), ol/[li/a]+）
    SEEALSO     = 503,  // 另参见 （ul:seealso/li/#text）
    REFERENCE   = 504,  // 文献参考 （ol:reference/li/#text）
    HEADER      = 505,  // 导言 （header/h3, p...）
    FOOTER      = 506,  // 结语 （footer/h3, p...）
    ARTICLE     = 507,  // 文章区 （article/header?, s1 | {content}, footer?, hr?）
    S1          = 508,  // 章 （section:s1/h2, header?, s2 | {content}, footer?）
    S2          = 509,  // 节 （section:s2/h2, header?, s3 | {content}, footer?）
    S3          = 510,  // 区 （section:s3/h2, header?, s4 | {content}, footer?）
    S4          = 511,  // 段 （section:s4/h2, header?, s5 | {content}, footer?）
    S5          = 512,  // 末 （section:s5/h2, header?, {content}, footer?）
    UL          = 513,  // 无序列表 （ul/li）
    OL          = 514,  // 有序列表 （ol/li）
    CODELIST    = 515,  // 代码表 （ol:codelist/li/code/#text, b, i）
    ULX         = 516,  // 无序级联表 （ul/li/h4, ul|ol/...）
    OLX         = 517,  // 有序级联表 （ol/li/h4, ol|ul/...）
    CASCADE     = 518,  // 级联编号表 （ol:cascade/li/h4, ol/li/...）
    DL          = 519,  // 定义列表 （dl/dt, dd+）
    TABLE       = 520,  // 表格 （table/thead, tbody, tfoot/tr/th, td）
    FIGURE      = 521,  // 插图 （figure/figcaption, p/img+）
    BLOCKQUOTE  = 522,  // 块引用 （blockquote/h3, p...）
    ASIDE       = 523,  // 批注 （aside/h3, p...）
    DETAILS     = 524,  // 详细内容 （details/summary, p...）
    CODEBLOCK   = 525,  // 代码块 （pre:codeblock/code/#text, b, i）
    // 单体单元。
    HR          = 526,  // 分隔 （hr）
    BLANK       = 527,  // 白板 （div:blank/x）

    //
    // 特殊用途。
    // 注：不作为独立的内联单元。
    /////////////////////////////////////////////
    B           = -1,   // 代码关键字封装
    I           = -2;   // 代码注释/标题编号



//
// 单元的类型/特性。
// 注：空元素也是密封的（简化处理逻辑）。
//
const Types = {
    [ $TEXT ]:      TEXT,
    //
    // 内联结构元素
    /////////////////////////////////////////////
    [ AUDIO ]:      INLINES | STRUCT | SEALED,
    [ VIDEO ]:      INLINES | STRUCT | SEALED,
    [ PICTURE ]:    INLINES | STRUCT | SEALED,
    [ SVG ]:        INLINES | STRUCT | SEALED,
    [ RUBY ]:       INLINES | STRUCT | SEALED,
    [ TIME ]:       INLINES | SEALED,
    [ METER ]:      INLINES | SEALED,
    [ SPACE ]:      INLINES | SEALED,
    [ IMG ]:        INLINES | EMPTY | SEALED,
    [ DATAIMG ]:    INLINES | EMPTY | SEALED,
    [ BR ]:         INLINES | EMPTY | SEALED,
    [ WBR ]:        INLINES | EMPTY | SEALED,
    //
    // 内联内结构
    /////////////////////////////////////////////
    [ TRACK ]:      STRUCT | EMPTY | SEALED,
    [ SOURCE ]:     STRUCT | EMPTY | SEALED,
    [ RB ]:         STRUCT | CONTENT,
    [ RT ]:         STRUCT | CONTENT,
    [ RP ]:         STRUCT | SEALED,
    [ RBPT ]:       STRUCT | SEALED,    // 抽象单元
    [ SPAN ]:       STRUCT | CONTENT,   // figure/p/img,span
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:          INLINES | CONTENT,
    [ STRONG ]:     INLINES | CONTENT,
    [ EM ]:         INLINES | CONTENT,
    [ Q ]:          INLINES | CONTENT,
    [ ABBR ]:       INLINES | CONTENT,
    [ CITE ]:       INLINES | CONTENT,
    [ SMALL ]:      INLINES | CONTENT,
    [ DEL ]:        INLINES | CONTENT,
    [ INS ]:        INLINES | CONTENT,
    [ SUB ]:        INLINES | CONTENT,
    [ SUP ]:        INLINES | CONTENT,
    [ MARK ]:       INLINES | CONTENT,
    [ CODE ]:       INLINES | CONTENT,
    [ ORZ ]:        INLINES | CONTENT,
    [ DFN ]:        INLINES | CONTENT,
    [ SAMP ]:       INLINES | CONTENT,
    [ KBD ]:        INLINES | CONTENT,
    [ S ]:          INLINES | CONTENT,
    [ U ]:          INLINES | CONTENT,
    [ VAR ]:        INLINES | CONTENT,
    [ BDO ]:        INLINES | CONTENT,

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:          BLOCKS | CONTENT,
    [ NOTE ]:       BLOCKS | CONTENT,
    [ TIPS ]:       BLOCKS | CONTENT,
    [ ADDRESS ]:    BLOCKS | CONTENT,
    [ PRE ]:        BLOCKS | CONTENT,
    //
    // 块内结构元素
    /////////////////////////////////////////////
    [ H1 ]:         STRUCT | CONTENT | FIXED,
    [ H2 ]:         STRUCT | CONTENT | FIXED,
    [ H3 ]:         STRUCT | CONTENT | FIXED,
    [ H4 ]:         STRUCT | CONTENT | FIXED,
    [ H5 ]:         STRUCT | CONTENT | FIXED,
    [ H6 ]:         STRUCT | CONTENT | FIXED,
    [ SUMMARY ]:    STRUCT | CONTENT | FIXED,
    [ FIGCAPTION ]: STRUCT | CONTENT | FIXED,
    [ CAPTION ]:    STRUCT | CONTENT | FIXED,
    [ LI ]:         STRUCT | CONTENT,
    [ DT ]:         STRUCT | CONTENT | DLITEM,
    [ DD ]:         STRUCT | CONTENT | DLITEM,
    [ TH ]:         STRUCT | CONTENT | TBLCELL,
    [ TD ]:         STRUCT | CONTENT | TBLCELL,
    [ CODELI ]:     STRUCT | SEALED,
    [ ALI ]:        STRUCT | SEALED,
    [ AH4LI ]:      STRUCT | SEALED,
    [ ULXH4LI ]:    STRUCT | SEALED,
    [ OLXH4LI ]:    STRUCT | SEALED,
    [ CASCADEH4LI ]: STRUCT | SEALED,
    [ IMGP ]:       STRUCT | SEALED,
    [ TR ]:         STRUCT | SEALED, // 表格列不能单独改变
    [ THEAD ]:      STRUCT | TBLSECT,
    [ TBODY ]:      STRUCT | TBLSECT,
    [ TFOOT ]:      STRUCT | TBLSECT,
    [ CONSECT ]:    STRUCT, // 抽象单元
    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:     BLOCKS | STRUCT | FIXED | SEALED,
    [ ABSTRACT ]:   BLOCKS | STRUCT | FIXED,
    [ TOC ]:        BLOCKS | STRUCT | FIXED | SEALED,
    [ SEEALSO ]:    BLOCKS | STRUCT | FIXED | LIST,
    [ REFERENCE ]:  BLOCKS | STRUCT | FIXED | LIST,
    [ HEADER ]:     BLOCKS | STRUCT | FIXED,
    [ FOOTER ]:     BLOCKS | STRUCT | FIXED,
    [ ARTICLE ]:    BLOCKS | STRUCT | FIXED | SECTED,
    [ S1 ]:         BLOCKS | STRUCT | SECTED,
    [ S2 ]:         BLOCKS | STRUCT | SECTED,
    [ S3 ]:         BLOCKS | STRUCT | SECTED,
    [ S4 ]:         BLOCKS | STRUCT | SECTED,
    [ S5 ]:         BLOCKS | STRUCT,
    [ UL ]:         BLOCKS | STRUCT | LIST,
    [ OL ]:         BLOCKS | STRUCT | LIST,
    [ CODELIST ]:   BLOCKS | STRUCT | LIST,
    [ ULX ]:        BLOCKS | STRUCT | LIST,
    [ OLX ]:        BLOCKS | STRUCT | LIST,
    [ CASCADE ]:    BLOCKS | STRUCT | LIST,
    [ DL ]:         BLOCKS | STRUCT,
    [ TABLE ]:      BLOCKS | STRUCT | SEALED, // 支持多<tbody>自由插入
    [ FIGURE ]:     BLOCKS | STRUCT | SEALED,
    [ BLOCKQUOTE ]: BLOCKS | STRUCT,
    [ ASIDE ]:      BLOCKS | STRUCT,
    [ DETAILS ]:    BLOCKS | STRUCT,
    [ CODEBLOCK ]:  BLOCKS | STRUCT | SEALED,
    // 行块单体元素
    [ HR ]:         BLOCKS | EMPTY | SEALED,
    [ BLANK ]:      BLOCKS | SEALED,

    //
    // 特殊用途。
    /////////////////////////////////////////////
    [ B ]:          PURPOSE | CONTENT,
    [ I ]:          PURPOSE | CONTENT,
};


//
// 内联单元集。
// 注：用于子单元批量引入。
//
const _INLINES =
[
    AUDIO, VIDEO, PICTURE, IMG, RUBY, TIME, METER, BR, WBR, SPACE,
    A, STRONG, EM, Q, ABBR, CITE, SMALL, DEL, INS, SUB, SUP, MARK, CODE, ORZ, DFN, SAMP, KBD, S, U, VAR, BDO,
];


//
// 行块单元集。
// 部分顶层单元内容局部受限。
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
// - 首个成员为默认构造单元（如果可行）。
//
const ChildTypes = {
    //
    // 内联结构元素。
    // 如果包含文本，插入方式有较强约束（如创建时）。
    /////////////////////////////////////////////
    [ $TEXT ]:      null,

    [ AUDIO ]:      [ SOURCE, TRACK, $TEXT ],
    [ VIDEO ]:      [ SOURCE, TRACK, $TEXT ],
    [ PICTURE ]:    [ SOURCE, IMG ],
    [ SVG ]:        [],
    [ IMG ]:        [],
    [ DATAIMG ]:    [],
    [ RUBY ]:       [ RBPT, RB, RT, RP ],
    [ TIME ]:       [ $TEXT ],
    [ METER ]:      [ $TEXT ],
    [ BR ]:         [],
    [ WBR ]:        [],
    [ SPACE ]:      [],
    //
    // 内联内结构
    /////////////////////////////////////////////
    [ TRACK ]:      [],
    [ SOURCE ]:     [],
    [ RB ]:         [ $TEXT ],
    [ RT ]:         [ $TEXT ],
    [ RP ]:         [ $TEXT ],
    [ SPAN ]:       [ $TEXT, _INLINES ],
    [ RBPT ]:       [ RB, RT, RP ],
    //
    // 内联内容元素
    /////////////////////////////////////////////
    [ A ]:          [ $TEXT, _INLINES ],
    [ STRONG ]:     [ $TEXT, _INLINES ],
    [ EM ]:         [ $TEXT, _INLINES ],
    [ Q ]:          [ $TEXT, _INLINES ],
    [ ABBR ]:       [ $TEXT ],
    [ CITE ]:       [ $TEXT, _INLINES ],
    [ SMALL ]:      [ $TEXT, _INLINES ],
    [ DEL ]:        [ $TEXT, _INLINES ],
    [ INS ]:        [ $TEXT, _INLINES ],
    [ SUB ]:        [ $TEXT, _INLINES ],
    [ SUP ]:        [ $TEXT, _INLINES ],
    [ MARK ]:       [ $TEXT, _INLINES ],
    [ CODE ]:       [ $TEXT, B, I ],
    [ ORZ ]:        [ $TEXT ],
    [ DFN ]:        [ $TEXT, ABBR ],
    [ SAMP ]:       [ $TEXT, _INLINES ],
    [ KBD ]:        [ $TEXT ],
    [ S ]:          [ $TEXT, _INLINES ],
    [ U ]:          [ $TEXT, _INLINES ],
    [ VAR ]:        [ $TEXT ],
    [ BDO ]:        [ $TEXT, _INLINES ],

    //
    // 行块内容元素
    /////////////////////////////////////////////
    [ P ]:          [ $TEXT, _INLINES ],
    [ NOTE ]:       [ $TEXT, _INLINES ],
    [ TIPS ]:       [ $TEXT, _INLINES ],
    [ PRE ]:        [ $TEXT, _INLINES ],
    [ ADDRESS ]:    [ $TEXT, _INLINES ],
    //
    // 块内结构元素
    /////////////////////////////////////////////
    [ H1 ]:         [ $TEXT, _INLINES, I ],
    [ H2 ]:         [ $TEXT, _INLINES, I ],
    [ H3 ]:         [ $TEXT, _INLINES, I ],
    [ H4 ]:         [ $TEXT, _INLINES, I ],
    [ H5 ]:         [ $TEXT, _INLINES, I ],
    [ H6 ]:         [ $TEXT, _INLINES, I ],
    [ SUMMARY ]:    [ $TEXT, _INLINES ],
    [ FIGCAPTION ]: [ $TEXT, _INLINES ],
    [ CAPTION ]:    [ $TEXT, _INLINES ],
    [ LI ]:         [ $TEXT, _INLINES ],
    [ DT ]:         [ $TEXT, _INLINES, I ],
    [ DD ]:         [ $TEXT, _INLINES ],
    [ TH ]:         [ $TEXT, _INLINES ],
    [ TD ]:         [ $TEXT, _INLINES ],
    [ CODELI ]:     [ CODE ],
    [ ALI ]:        [ A ],
    [ AH4LI ]:      [ A ],
    [ ULXH4LI ]:    [ OL, H4, UL ],
    [ OLXH4LI ]:    [ UL, H4, OL ],
    [ CASCADEH4LI ]: [ H4, OL ],
    [ IMGP ]:       [ IMG, SPAN ],
    [ TR ]:         [ TH, TD ],
    [ THEAD ]:      [ TR ],
    [ TBODY ]:      [ TR ],
    [ TFOOT ]:      [ TR ],
    [ CONSECT ]:    [ _BLOCKITS ],
    //
    // 行块结构元素
    /////////////////////////////////////////////
    [ HGROUP ]:     [ H2, H1 ],
    [ ABSTRACT ]:   [ P, H3, _BLOLIMIT ],
    [ TOC ]:        [ H3, CASCADE ],
    [ SEEALSO ]:    [ LI ],
    [ REFERENCE ]:  [ LI ],
    [ HEADER ]:     [ P, H3, _BLOLIMIT ],
    [ FOOTER ]:     [ P, H3, _BLOLIMIT, ADDRESS ],
    [ ARTICLE ]:    [ HEADER, S1, FOOTER ],
    [ S1 ]:         [ H2, HEADER, S2, FOOTER ],
    [ S2 ]:         [ H2, HEADER, S3, FOOTER ],
    [ S3 ]:         [ H2, HEADER, S4, FOOTER ],
    [ S4 ]:         [ H2, HEADER, S5, FOOTER ],
    [ S5 ]:         [ H2, HEADER, CONSECT, FOOTER ],
    [ UL ]:         [ LI ],
    [ OL ]:         [ LI ],
    [ CODELIST ]:   [ CODELI ],
    [ ULX ]:        [ LI, ULXH4LI ],
    [ OLX ]:        [ LI, OLXH4LI ],
    [ CASCADE ]:    [ LI, CASCADEH4LI ],
    [ DL ]:         [ DT, DD ],
    [ TABLE ]:      [ CAPTION, THEAD, TBODY, TFOOT ],
    [ FIGURE ]:     [ FIGCAPTION, IMGP ],
    [ BLOCKQUOTE ]: [ P, H3, _BLOLIMIT, TABLE ],
    [ ASIDE ]:      [ P, H3, _BLOLIMIT, TABLE ],
    [ DETAILS ]:    [ P, SUMMARY, _BLOLIMIT, TABLE ],
    [ CODEBLOCK ]:  [ CODE ],
    // 单体单元
    [ HR ]:         [],
    [ BLANK ]:      [],
};

// 配置展开。
$.each(
    ChildTypes, (v, k, o) => o[k] = v && v.flat()
);


//
// 属性条目配置：{
//      单元值：模板名,
// }
// 上下文菜单中“属性”条目匹配的模板。
// 注：不是所有的单元都有属性可编辑。
//
const PropItems = {
    [ AUDIO ]:      'audio',    // source, track, text
    [ VIDEO ]:      'video',    // 同上
    [ PICTURE ]:    'picture',  // source, img
    [ SVG ]:        'svg',      // html
    [ IMG ]:        'img',      // src, width, height, alt
    [ DATAIMG ]:    'dataimg',  // 同上
    [ RUBY ]:       'ruby',     // rb, rt, rp
    [ TIME ]:       'time',     // datetime, text
    [ METER ]:      'meter',    // max, min, high, low, value, optimum
    [ SPACE ]:      'space',    // width
    [ A ]:          'a',        // href, target, download[checkbox, text]
    [ Q ]:          'q',        // cite
    [ ABBR ]:       'abbr',     // title
    [ DEL ]:        'del',      // datetime
    [ INS ]:        'ins',      // 同上
    [ CODE ]:       'code',     // data-lang, data-tab
    [ DFN ]:        'dfn',      // title
    [ BDO ]:        'bdo',      // dir
    [ CODELIST ]:   'codelist', // data-lang, data-tab, start
    [ OL ]:         'ol',       // start, type, reversed
    [ OLX ]:        'olx',      // 同上
    [ TABLE ]:      'table',    // rows, cols, caption
    [ HR ]:         'hr',       // thick, length, height
    [ BLANK ]:      'blank',    // width, height
};


//
// 全名补全（前置 property:）
//
$.each(
    PropItems, (v, k, o) => o[k] = `property:${v}`
);


//
// 插入条目选单映射：{
//      单元值：模板名,
// }
// 普通插入模式下关联条目的 选单=>模板名 映射。
//
const InputOption = {
    [ $TEXT ]:      'text',
    [ AUDIO ]:      'audio',
    [ VIDEO ]:      'video',
    [ PICTURE ]:    'picture',
    [ SVG ]:        'svg',
    [ IMG ]:        'img',
    [ DATAIMG ]:    'dataimg',
    [ RUBY ]:       'ruby',
    [ TIME ]:       'time',
    [ METER ]:      'meter',
    [ BR ]:         'br',
    [ WBR ]:        'wbr',
    [ SPACE ]:      'space',

    [ TRACK ]:      'track',
    [ SOURCE ]:     'source',
    [ RB ]:         'rb',
    [ RT ]:         'rt',
    [ RP ]:         'rp',
    [ RBPT ]:       'rbpt',

    [ A ]:          'a',
    [ STRONG ]:     'strong',
    [ EM ]:         'em',
    [ Q ]:          'q',
    [ ABBR ]:       'abbr',
    [ CITE ]:       'cite',
    [ SMALL ]:      'small',
    [ DEL ]:        'del',
    [ INS ]:        'ins',
    [ SUB ]:        'sub',
    [ SUP ]:        'sup',
    [ MARK ]:       'mark',
    [ CODE ]:       'code',
    [ ORZ ]:        'orz',
    [ DFN ]:        'dfn',
    [ SAMP ]:       'samp',
    [ KBD ]:        'kbd',
    [ S ]:          's',
    [ U ]:          'u',
    [ VAR ]:        'var',
    [ BDO ]:        'bdo',

    [ P ]:          'p',
    [ NOTE ]:       'note',
    [ TIPS ]:       'tips',
    [ PRE ]:        'pre',
    [ ADDRESS ]:    'address',

    [ H1 ]:         'h1',
    [ H2 ]:         'h2',
    [ H3 ]:         'h3',
    [ H4 ]:         'h4',
    [ H5 ]:         'h5',
    [ H6 ]:         'h6',
    [ SUMMARY ]:    'summary',
    [ FIGCAPTION ]: 'figcaption',
    [ CAPTION ]:    'caption',
    [ LI ]:         'li',
    [ DT ]:         'dt',
    [ DD ]:         'dd',
    [ TH ]:         'th',
    [ TD ]:         'td',
    [ CODELI ]:     'codeli',
    [ ALI ]:        'ali',
    [ AH4LI ]:      'ah4li',
    [ ULXH4LI ]:    'ulxh4li',
    [ OLXH4LI ]:    'olxh4li',
    [ CASCADEH4LI ]: 'cascadeh4li',
    [ TR ]:         'tr',
    [ THEAD ]:      'thead',
    [ TBODY ]:      'tbody',
    [ TFOOT ]:      'tfoot',
    [ CONSECT ]:    'consect',

    [ HGROUP ]:     'hgroup',
    [ ABSTRACT ]:   'abstract',
    [ TOC ]:        'toc',
    [ SEEALSO ]:    'seealso',
    [ REFERENCE ]:  'reference',
    [ HEADER ]:     'header',
    [ FOOTER ]:     'footer',
    [ ARTICLE ]:    'article',
    [ S1 ]:         's1',
    [ S2 ]:         's2',
    [ S3 ]:         's3',
    [ S4 ]:         's4',
    [ S5 ]:         's5',
    [ UL ]:         'ul',
    [ OL ]:         'ol',
    [ CODELIST ]:   'codelist',
    [ ULX ]:        'ulx',
    [ OLX ]:        'olx',
    [ CASCADE ]:    'cascade',
    [ DL ]:         'dl',
    [ TABLE ]:      'table',
    [ FIGURE ]:     'figure',
    [ BLOCKQUOTE ]: 'blockquote',
    [ ASIDE ]:      'aside',
    [ DETAILS ]:    'details',
    [ CODEBLOCK ]:  'codeblock',

    [ HR ]:         'hr',
    [ BLANK ]:      'blank',
};


//
// 全名补全（前置 option:）
//
$.each(
    InputOption, (v, k, o) => o[k] = `option:${v}`
);


//
// 内联元素集。
// 用于判断并提取合法的内联元素。
//
const InlineTags = new Set([
    'audio',
    'video',
    'picture',
    'a',
    'strong',
    'em',
    'q',
    'abbr',
    'cite',
    'small',
    'time',
    'del',
    'ins',
    'sub',
    'sup',
    'mark',
    'code',
    'ruby',
    'dfn',
    'samp',
    'kbd',
    's',
    'u',
    'var',
    'bdo',
    'meter',
    'img',
    'br',
    'wbr',
    'span',
    'b',
    'i',
]);


//
// 逻辑内容单元名
// 用于判断role值是否为逻辑单元名。
//
const LogicRoles = new Set([
    'abstract',
    'toc',
    'seealso',
    'reference',
    's1',
    's2',
    's3',
    's4',
    's5',
    'codelist',
    'ulx',
    'olx',
    'cascade',
    'codeblock',
    'note',
    'tips',
    'blank',
    'orz',
    'space',
]);



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////

/**
 * 获取元素类型值。
 * 注：仅处理文本节点和元素。
 * @param  {Element|Text} el 目标节点
 * @return {Number}
 */
function getType( el ) {
    if ( el.nodeType == 3 ) {
        return $TEXT;
    }
}


/**
 * 获取目标元素的内容。
 * 仅限非空文本节点和内联节点。
 * @param  {Element|Text} el 目标节点
 * @return {[Node]}
 */
function inlineContents( el ) {
    if ( el.nodeType == 3 ) {
        return el;
    }
}



/**
 * 测试并返回<li>支持的几种类型。
 * @param  {Element} li 列表项元素
 * @return {String} Codeli|Cascadeli|Li
 */
function customLi( li ) {
    // codelist: li/code/
    if ( isCodeli(li) ) return 'Codeli';

    // cascade: li/h5, ol/
    if ( isCascadeli(li) ) return 'Cascadeli';

    if ( isTocItem(li) ) return 'Ali';

    return 'Li';
}


/**
 * 测试并返回<h5>支持的两种类型。
 * @param {Element} h5 标题元素
 */
function customH5( h5 ) {
    return isH5a( h5 ) ? 'H5a' : 'H5';
}


/**
 * 转为首字母大写。
 * @param  {String} name 名称串
 * @return {String}
 */
function camelCase( name ) {
    return name[0].toUpperCase() + name.substring(1);
}


/**
 * 获取级联编号表根元素。
 * 仅对在级联编号表内的<ol>或<li>子元素有效。
 * 对于普通的级联表会非列表项元素返回null。
 * @param  {Element} el 起点元素
 * @return {Element|null}
 */
function cascadeRoot( el ) {
    let _prev = el;

    while ( el ) {
        let _n = el.nodeName.toLowerCase();
        if ( _n != 'ol' && _n != 'li' ) {
            break;
        }
        _prev = el;
        el = el.parentElement;
    }
    return $.attr(_prev, 'role') == 'cascade' ? _prev : null;
}


/**
 * 测试是否在级联编号表内。
 * 主要用于插入时的目标判断并进行正确的处理。
 * @param  {Element} el 目标元素
 * @return {Boolean|null}
 */
function inCascade( el ) {
     return !!cascadeRoot( el );
}


/**
 * 是否在目录内。
 * @param  {Element} el 起点元素
 * @return {Boolean}
 */
function inToc( el ) {
    let _ol = cascadeRoot( el ),
        _pe = _ol && _ol.parentElement;

    return !!_pe && $.attr(_pe, 'role') == 'toc';
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
    return $.attr(el.parentElement, 'role') == 'codelist';
}


/**
 * 是否为内容件。
 * @param {String|Element} its 测试目标
 */
function isConitem( its ) {
    return CONTENT &
        Types[ its.nodeType ? conName(its) : its ];
}


/**
 * 是否为代码列表项。
 * @param  {Element} li 列表项
 * @return {Boolean}
 */
function isCodeli( li ) {
    return li.childElementCount == 1 &&
        $.is(li.firstElementChild, 'code');
}


/**
 * 是否为目录普通列表项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isTocItem( li ) {
    return li.childElementCount == 1 &&
        $.is(li.firstElementChild, 'a');
}


/**
 * 是否为级联编号表标题项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isCascadeli( li ) {
    return li.childElementCount == 2 &&
        $.is(li.firstElementChild, 'h5') &&
        $.is(li.lastElementChild, 'ol');
}


/**
 * 是否为级联标题链接（目录）项。
 * @param  {Element} h5 标题元素
 * @return {Boolean}
 */
function isH5a( h5 ) {
    return h5.childElementCount == 1 &&
        $.is(h5.firstElementChild, 'a');
}


/**
 * 是否为目录列表标题项。
 * @param  {Element} li 列表项元素
 * @return {Boolean}
 */
function isTocHeading( li ) {
    return isCascadeli( li ) && isH5a( li.firstElementChild );
}


/**
 * 获取元素/节点的内容名。
 * 返回名称为首字母大写（区别于标签）。
 * 非标准内容返回首字母大写的标签名（通用）。
 * @param  {Element|Text} el 目标元素或文本节点
 * @return {String}
 */
function conName( el ) {
    if ( el.nodeType == 3 ) {
        return '$text';
    }
    let _n = $.attr(el, 'role') || el.nodeName.toLowerCase();

    switch ( _n ) {
        case 'li':
            return customLi( el );
        case 'h5':
            return customH5( el );
    }
    return camelCase( _n );
}


/**
 * 测试是否为合法子单元。
 * @param  {String} name 目标内容名
 * @param  {Element} sub 待测试子单元根元素
 * @return {Boolean}
 */
function goodSub( name, sub ) {
    return !!( typeSubs[name] & Types[conName(sub)] );
}


/**
 * 合法子单元检测。
 * 合法的内容结构很重要，因此抛出错误（更清晰）。
 * @param  {String} name 内容名称
 * @param  {[Node]} nodes 子单元集
 * @return {Error|true}
 */
function isGoodSubs( name, nodes ) {
    for (const nd of nodes) {
        if ( !goodSub(name, nd) ) {
            throw new Error(`[${nd.nodeName}] is invalid in ${name}.`);
        }
    }
    return true;
}


/**
 * 是否不可包含子单元。
 * @param  {String} name 内容名
 * @return {Boolean}
 */
function nilSub( name ) {
    return typeSubs[name] === 0;
}


/**
 * 是否为内容件集。
 * 片区有严格的层次结构，因此判断标题和<section>即可。
 * 注：空集视为内容件集。
 * @param  {[Element]|''} els 子片区集或内容件集
 * @return {Boolean}
 */
function isConItems( els ) {
    return els.length == 0 ||
        !els.some( el => $.is(el, 'h2,h3,h4,h5,h6,section') );
}


/**
 * 测试表格行是否相同。
 * @param  {Element} tr1 表格行
 * @param  {Element} tr2 表格行
 * @return {Boolean}
 */
function sameTr( tr1, tr2 ) {
    if ( tr1.cells.length != tr2.cells.length ) {
        return false;
    }
    return Array.from( tr1.cells )
    .every(
        (td, i) => td.nodeName == tr2.cells[i].nodeName
    );
}


/**
 * 检查元素是否同类。
 * 注：是否可用于简单合并。
 * @param {Element} e1 目标元素
 * @param {Element} e2 对比元素
 */
function sameType( e1, e2 ) {
    let _n1 = e1.nodeNode.toLowerCase(),
        _n2 = e2.nodeNode.toLowerCase();

    return _n1 == _n2 && (_n1 == 'tr' ? sameTr(e1, e2) : true);
}


/**
 * 是否为自取单元。
 * @param  {Node} node 目标节点
 * @return {Boolean}
 */
function isOuter( node ) {
    return node.nodeType == 3 ||
        __outerTags.has( node.nodeName.toLowerCase() );
}


/**
 * 获取内联节点集。
 * @param  {Node} node 测试节点
 * @param  {Array} 内联节点存储区
 * @return {[Node]}
 */
function inlines( node, buf = [] ) {
    if ( !node ) {
        return buf;
    }
    if ( isOuter(node) ) {
        buf.push( node );
    } else {
        $.contents(node).forEach( nd => inlines(nd, buf) );
    }
    return buf;
}


/**
 * 错误提示&回馈。
 * 友好的错误提示并关联帮助。
 * @param {Number} help 帮助ID
 * @param {String} msg 错误消息
 */
function error( help, msg ) {
    // 全局：
    // - 消息显示
    // - 关联帮助
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


export {
    cascadeRoot,
    inCascade, inToc, inCodelist,
    isConitem, isCodeli, isTocHeading, isTocItem, isCascadeli, isConItems,
    conName, goodSub, isGoodSubs, nilSub,
    sameType, inlines,
    error,
};
