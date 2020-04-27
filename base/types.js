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
// 1. 结构元素。独立性未知。
// 2. 内容元素。独立性未知。
// 3. 内联单元。独立内容单元。
// 4. 行块单元。独立内容单元。
//
// 特性标记：
// 主要用于移动判断处理：若非固定，相同者可互换或并列。固定者只能接收内容。
// 0. FIXED   位置固定。只能自我移动（不能被其它元素移动），如：{<caption>}
// 1. TBLSECT 表格结构元件：{<thead>|<tbody>|<tfoot>}
// 2. TBLCELL 表格单元元件：{<th>|<td>}
// 3. DLITEM  定义列表项：  {<dt>|<dd>}
//
const
    TEXT    = 0,        // 文本节点
    PURPOSE = 1,        // 特殊用途
    STRUCT  = 1 << 1,   // 结构元素
    CONTENT = 1 << 2,   // 内容元素
    INLINES = 1 << 3,   // 内联单元
    BLOCKS  = 1 << 4,   // 行块单元
    FIXED   = 1 << 5;   // 位置确定性
    TBLSECT = 1 << 6,   // 表结构元件
    TBLCELL = 1 << 8,   // 表格单元元件
    DLITEM  = 1 << 8;   // 定义列表项


//
// 单元值定义。
// - 内联结构元素：     [0, 99]     不能包含文本或其它内联单元，有固定的内部结构或空结构。
// - 内联内结构元素：   [100, 199]  其它内联结构元素的内部成员，自身不是独立的内联单元。可能为内容元素。
// - 内联内容元素：     [200, 299]  可直接包含文本或其它内联单元。
// - 行块内容元素：     [300, 399]  可直接包含文本节点和内联单元，但属于行块逻辑而不是内联成员。
// - 块内结构元素：     [400, 499]  行块结构元素内部的元素，不能充当独立的单元。可能为内容元素。
// - 行块结构元素：     [500, ~]    不能直接包含文本或内联单元。
//
const
    //
    // 内联结构元素
    /////////////////////////////////////////////
    $TEXT       = 0,    // 文本节点（#text）

    AUDIO       = 1,    // 音频
    VIDEO       = 2,    // 视频
    PICTURE     = 3,    // 兼容图片
    IMG         = 4,    // 图片
    RUBY        = 5,    // 注音
    TIME        = 6,    // 时间
    METER       = 7,    // 度量
    BR          = 8,    // 换行
    WBR         = 9,    // 软换行
    SPACE       = 10,   // 空白
    //
    // 内联内结构
    /////////////////////////////////////////////
    TRACK       = 100,  // 字幕轨
    SOURCE      = 101,  // 媒体资源
    RB          = 102,  // 注音文本
    RT          = 103,  // 注音拼音
    RP          = 104,  // 注音拼音包围
    RBPT        = 105,  // 注音内容封装（抽象）
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
    CODE        = 212,  // 行内代码（code/#text, b, i）
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
    ADDRESS     = 303,  // 地址 （address/#text, ...）
    PRE         = 304,  // 预排版 （pre/#text, ...）
    BLANK       = 305,  // 白板 （div:blank/x）
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
    AH4         = 416,  // 目录表标题条目（h4/a）
    ULXH4LI     = 417,  // 无序级联表项标题（li/h4, ol|ul）
    OLXH4LI     = 418,  // 有序级联表项标题（li/h4, ul|ol）
    CASCADEH4LI = 419,  // 级联编号表项标题（li/h4, ol）
    TR          = 420,  // 表格行
    THEAD       = 421,  // 表头
    TBODY       = 422,  // 表体
    TFOOT       = 423,  // 表脚
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP      = 501,  // 主/副标题组 （hgroup/h1, h2）
    ABSTRACT    = 502,  // 提要 （header:abstract/h3, p...）
    TOC         = 503,  // 目录 （nav:toc/h3, ol:cascade/li/(h4/a), ol/[li/a]+）
    SEEALSO     = 504,  // 另参见 （ul:seealso/li/#text）
    REFERENCE   = 505,  // 文献参考 （ol:reference/li/#text）
    HEADER      = 506,  // 导言 （header/h3, p...）
    FOOTER      = 507,  // 结语 （footer/h3, p...）
    ARTICLE     = 508,  // 文章区 （article/header?, s1 | {content}, footer?, hr?）
    S1          = 509,  // 章 （section:s1/h2, header?, s2 | {content}, footer?）
    S2          = 510,  // 节 （section:s2/h2, header?, s3 | {content}, footer?）
    S3          = 511,  // 区 （section:s3/h2, header?, s4 | {content}, footer?）
    S4          = 512,  // 段 （section:s4/h2, header?, s5 | {content}, footer?）
    S5          = 513,  // 末 （section:s5/h2, header?, {content}, footer?）
    UL          = 514,  // 无序列表 （ul/li）
    OL          = 515,  // 有序列表 （ol/li）
    CODELIST    = 516,  // 代码表 （ol:codelist/li/code/#text, b, i）
    ULX         = 517,  // 无序级联表 （ul/li/h4, ul|ol/...）
    OLX         = 518,  // 有序级联表 （ol/li/h4, ol|ul/...）
    CASCADE     = 519,  // 级联编号表 （ol:cascade/li/h4, ol/li/...）
    DL          = 520,  // 定义列表 （dl/dt, dd+）
    TABLE       = 521,  // 表格 （table/thead, tbody, tfoot/tr/th, td）
    FIGURE      = 522,  // 插图 （figure/figcaption, p/img+）
    BLOCKQUOTE  = 523,  // 块引用 （blockquote/h3, p...）
    ASIDE       = 524,  // 批注 （aside/h3, p...）
    DETAILS     = 525,  // 详细内容 （details/summary, p...）
    CODEBLOCK   = 526,  // 代码块 （pre:codeblock/code/#text, b, i）
    HR          = 500,  // 分隔 （hr）

    //
    // 特殊用途。
    // 注：不作为独立的内联单元。
    /////////////////////////////////////////////
    B           = -1,   // 代码关键字封装
    I           = -2;   // 代码注释/标题编号



//
// 单元的类型/特性。
//
const Types = {
    //
    // 内联结构元素
    /////////////////////////////////////////////
    $TEXT:      TEXT,
    AUDIO:      INLINES,
    VIDEO:      INLINES,
    PICTURE:    INLINES,
    IMG:        INLINES,
    RUBY:       INLINES,
    TIME:       INLINES,
    METER:      INLINES,
    BR:         INLINES,
    WBR:        INLINES,
    SPACE:      INLINES,
    //
    // 内联内结构
    /////////////////////////////////////////////
    TRACK:      STRUCT,
    SOURCE:     STRUCT,
    RB:         STRUCT | CONTENT,
    RT:         STRUCT | CONTENT,
    RP:         STRUCT | CONTENT,
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A:          INLINES | CONTENT,
    STRONG:     INLINES | CONTENT,
    EM:         INLINES | CONTENT,
    Q:          INLINES | CONTENT,
    ABBR:       INLINES | CONTENT,
    CITE:       INLINES | CONTENT,
    SMALL:      INLINES | CONTENT,
    DEL:        INLINES | CONTENT,
    INS:        INLINES | CONTENT,
    SUB:        INLINES | CONTENT,
    SUP:        INLINES | CONTENT,
    MARK:       INLINES | CONTENT,
    CODE:       INLINES | CONTENT,
    ORZ:        INLINES | CONTENT,
    DFN:        INLINES | CONTENT,
    SAMP:       INLINES | CONTENT,
    KBD:        INLINES | CONTENT,
    S:          INLINES | CONTENT,
    U:          INLINES | CONTENT,
    VAR:        INLINES | CONTENT,
    BDO:        INLINES | CONTENT,

    //
    // 行块内容元素
    /////////////////////////////////////////////
    P:          BLOCKS | CONTENT,
    NOTE:       BLOCKS | CONTENT,
    TIPS:       BLOCKS | CONTENT,
    ADDRESS:    BLOCKS | CONTENT,
    PRE:        BLOCKS | CONTENT,
    BLANK:      BLOCKS | CONTENT,
    //
    // 块内结构元素
    /////////////////////////////////////////////
    H1:         STRUCT | CONTENT | FIXED,
    H2:         STRUCT | CONTENT | FIXED,
    H3:         STRUCT | CONTENT | FIXED,
    H4:         STRUCT | CONTENT | FIXED,
    H5:         STRUCT | CONTENT | FIXED,
    H6:         STRUCT | CONTENT | FIXED,
    SUMMARY:    STRUCT | CONTENT | FIXED,
    FIGCAPTION: STRUCT | CONTENT | FIXED,
    CAPTION:    STRUCT | CONTENT | FIXED,
    LI:         STRUCT | CONTENT,
    DT:         STRUCT | CONTENT | DLITEM,
    DD:         STRUCT | CONTENT | DLITEM,
    TH:         STRUCT | CONTENT | TBLCELL,
    TD:         STRUCT | CONTENT | TBLCELL,
    CODELI:     STRUCT,
    ALI:        STRUCT,
    AH4:        STRUCT,
    ULXH4LI:    STRUCT,
    OLXH4LI:    STRUCT,
    CASCADEH4LI: STRUCT,
    TR:         STRUCT,
    THEAD:      STRUCT | TBLSECT,
    TBODY:      STRUCT | TBLSECT,
    TFOOT:      STRUCT | TBLSECT,
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP:     BLOCKS | STRUCT | FIXED,
    ABSTRACT:   BLOCKS | STRUCT | FIXED,
    TOC:        BLOCKS | STRUCT | FIXED,
    SEEALSO:    BLOCKS | STRUCT | FIXED,
    REFERENCE:  BLOCKS | STRUCT | FIXED,
    HEADER:     BLOCKS | STRUCT | FIXED,
    FOOTER:     BLOCKS | STRUCT | FIXED,
    ARTICLE:    BLOCKS | STRUCT | FIXED,
    S1:         BLOCKS | STRUCT,
    S2:         BLOCKS | STRUCT,
    S3:         BLOCKS | STRUCT,
    S4:         BLOCKS | STRUCT,
    S5:         BLOCKS | STRUCT,
    UL:         BLOCKS | STRUCT,
    OL:         BLOCKS | STRUCT,
    CODELIST:   BLOCKS | STRUCT,
    ULX:        BLOCKS | STRUCT,
    OLX:        BLOCKS | STRUCT,
    CASCADE:    BLOCKS | STRUCT,
    DL:         BLOCKS | STRUCT,
    TABLE:      BLOCKS | STRUCT,
    FIGURE:     BLOCKS | STRUCT,
    BLOCKQUOTE: BLOCKS | STRUCT,
    ASIDE:      BLOCKS | STRUCT,
    DETAILS:    BLOCKS | STRUCT,
    CODEBLOCK:  BLOCKS | STRUCT,
    HR:         BLOCKS | STRUCT,

    //
    // 特殊用途。
    /////////////////////////////////////////////
    B:          PURPOSE,
    I:          PURPOSE,
};



//
// 合法子单元类型。
// 值为空数组表示无任何内容，通常为空元素。
// 成员值为子数组表示类型，适用该类型所有单元。
// 特殊值 null 仅用于文本节点。
// 注记：
// - 可用于源码结构检查。
// - 可用于判断目标的可插入单元（向内）。
// - 取父容器可判断平级插入时的合法单元。
//
const ChildTypes = {
    //
    // 内联结构元素。
    // 如果包含文本，插入方式有较强约束（如创建时）。
    /////////////////////////////////////////////
    $TEXT:      null,

    AUDIO:      [ SOURCE, TRACK, $TEXT ],
    VIDEO:      [ SOURCE, TRACK, $TEXT ],
    PICTURE:    [ SOURCE, IMG ],
    IMG:        [],
    RUBY:       [ RBPT, RB, RT, RP ],
    TIME:       [ $TEXT ],
    METER:      [ $TEXT ],
    BR:         [],
    WBR:        [],
    SPACE:      [],
    //
    // 内联内结构
    /////////////////////////////////////////////
    TRACK:      [],
    SOURCE:     [],
    RB:         [$TEXT],
    RT:         [$TEXT],
    RP:         [$TEXT],
    //
    // 内联内容元素
    /////////////////////////////////////////////
    A:          [ $TEXT, [INLINES] ],
    STRONG:     [ $TEXT, [INLINES] ],
    EM:         [ $TEXT, [INLINES] ],
    Q:          [ $TEXT, [INLINES] ],
    ABBR:       [ $TEXT ],
    CITE:       [ $TEXT, [INLINES] ],
    SMALL:      [ $TEXT, [INLINES] ],
    DEL:        [ $TEXT, [INLINES] ],
    INS:        [ $TEXT, [INLINES] ],
    SUB:        [ $TEXT, [INLINES] ],
    SUP:        [ $TEXT, [INLINES] ],
    MARK:       [ $TEXT, [INLINES] ],
    CODE:       [ $TEXT, B, I ],
    ORZ:        [ $TEXT ],
    DFN:        [ $TEXT, ABBR ],
    SAMP:       [ $TEXT, [INLINES] ],
    KBD:        [ $TEXT ],
    S:          [ $TEXT, [INLINES] ],
    U:          [ $TEXT, [INLINES] ],
    VAR:        [ $TEXT ],
    BDO:        [ $TEXT, [INLINES] ],

    //
    // 行块内容元素
    /////////////////////////////////////////////
    P:          [ $TEXT, [INLINES] ],
    NOTE:       [ $TEXT, [INLINES] ],
    TIPS:       [ $TEXT, [INLINES] ],
    ADDRESS:    [ $TEXT, [INLINES] ],
    PRE:        [ $TEXT, [INLINES] ],
    BLANK:      [],
    //
    // 块内结构元素
    /////////////////////////////////////////////
    H1:         [ $TEXT, [INLINES] ],
    H2:         [ $TEXT, [INLINES] ],
    H3:         [ $TEXT, [INLINES] ],
    H4:         [ $TEXT, [INLINES] ],
    H5:         [ $TEXT, [INLINES] ],
    H6:         [ $TEXT, [INLINES] ],
    SUMMARY:    [ $TEXT, [INLINES] ],
    FIGCAPTION: [ $TEXT, [INLINES] ],
    CAPTION:    [ $TEXT, [INLINES] ],
    LI:         [ $TEXT, [INLINES] ],
    DT:         [ $TEXT, [INLINES] ],
    DD:         [ $TEXT, [INLINES] ],
    TH:         [ $TEXT, [INLINES] ],
    TD:         [ $TEXT, [INLINES] ],
    CODELI:     [ CODE ],
    ALI:        [ A ],
    AH4:        [ A ],
    ULXH4LI:    [ H4, OL, UL ],
    OLXH4LI:    [ H4, UL, OL ],
    CASCADEH4LI: [ H4, OL ],
    TR:         [ TH, TD ],
    THEAD:      [ TR ],
    TBODY:      [ TR ],
    TFOOT:      [ TR ],
    //
    // 行块结构元素
    /////////////////////////////////////////////
    HGROUP:     BLOCKS | STRUCT,
    ABSTRACT:   BLOCKS | STRUCT,
    TOC:        BLOCKS | STRUCT,
    SEEALSO:    BLOCKS | STRUCT,
    REFERENCE:  BLOCKS | STRUCT,
    HEADER:     BLOCKS | STRUCT,
    FOOTER:     BLOCKS | STRUCT,
    ARTICLE:    BLOCKS | STRUCT,
    S1:         BLOCKS | STRUCT,
    S2:         BLOCKS | STRUCT,
    S3:         BLOCKS | STRUCT,
    S4:         BLOCKS | STRUCT,
    S5:         BLOCKS | STRUCT,
    UL:         BLOCKS | STRUCT,
    OL:         BLOCKS | STRUCT,
    CODELIST:   BLOCKS | STRUCT,
    ULX:        BLOCKS | STRUCT,
    OLX:        BLOCKS | STRUCT,
    CASCADE:    BLOCKS | STRUCT,
    DL:         BLOCKS | STRUCT,
    TABLE:      BLOCKS | STRUCT,
    FIGURE:     BLOCKS | STRUCT,
    BLOCKQUOTE: BLOCKS | STRUCT,
    ASIDE:      BLOCKS | STRUCT,
    DETAILS:    BLOCKS | STRUCT,
    CODEBLOCK:  BLOCKS | STRUCT,
    HR:         BLOCKS | STRUCT,
};


//
// 属性条目配置：{
//      单元名：[ 模板名, ... ]
// }
// 注记：
// - 不是所有的单元都有属性可编辑。
// - 用于上下文菜单中“属性”条目需要的匹配。
//
const PropItems = {
    //
};


//
// 条目映射配置：{
//      单元名：[ 模板名, ... ]
// }
// 映射到插入条目的选单模板名称（option:xxx）。
//
const selectOption = {
    //
};


// ?
const typeSubs = {
    $TEXT:          null,

    // 结构单元块
    Hgroup:         H1 | H2,
    Abstract:       H3 | P | BLONATHS,
    Toc:            H4 | CASCADE,
    Seealso:        LI,
    Reference:      LI,
    Header:         H4 | P | BLONATHS | BLOCKQUOTE,
    Footer:         H4 | P | BLONATHS | BLOCKQUOTE,
    Article:        HEADER | H2 | S1 | FOOTER,
    S1:             HEADER | H3 | S2 | FOOTER,
    S2:             HEADER | H4 | S3 | FOOTER,
    S3:             HEADER | H5 | S4 | FOOTER,
    S4:             HEADER | H6 | S5 | FOOTER,
    S5:             CONTENT,
    Ul:             LI,
    Ol:             LI,
    Cascade:        CASCADELI | ALI | LI,
    Codelist:       CODELI,
    Dl:             DLI,
    Table:          CAPTION | TSEC,
    Figure:         FIGCAPTION | P,
    Blockquote:     H4 | P | BLONATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Aside:          H4 | P | BLONATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Details:        SUMMARY | P | BLONATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Codeblock:      CODE,

    // 文本类行块。
    P:              $TEXT | INLINE | CODE | IMG,
    Note:           $TEXT | INLINE | CODE | IMG,
    Address:        $TEXT | INLINE | CODE | IMG,
    Pre:            $TEXT | INLINE | CODE | IMG,
    Hr:             0,  // 空
    Space:          0,  // 空，用于交互展示

    // 限定中间结构
    Codeli:         CODE,
    Ali:            A,
    H5a:            A,
    Cascadeli:      H5 | AH4 | OL,

    // 内联单元
    Audio:          TRACK | SOURCE,
    Video:          TRACK | SOURCE,
    Picture:        SOURCE | IMG,
    A:              $TEXT | INLINE | IMG,
    Strong:         $TEXT | INLINE,
    Em:             $TEXT | INLINE,
    Dfn:            $TEXT | INLINE,
    Abbr:           $TEXT,
    Time:           $TEXT,
    Kbd:            $TEXT,  // 键盘输入
    Var:            $TEXT,  // 变量标注
    Code:           $TEXT | B,
    Orz:            $TEXT,
    Meter:          $TEXT,  // 范围计量
    Ruby:           RBPT | $TEXT,
    Q:              $TEXT | INLINE | A,
    Small:          $TEXT | INLINE | A,
    Samp:           $TEXT | INLINE | A, // 计算机输出
    U:              $TEXT | INLINE | A, // 特别标注
    Bdo:            $TEXT | INLINE | A,
    Cite:           $TEXT | INLINE | A,
    Del:            $TEXT | INLINE | A,
    Ins:            $TEXT | INLINE | A,
    S:              $TEXT | INLINE | A,
    Sub:            $TEXT | INLINE | A,
    Sup:            $TEXT | INLINE | A,
    Mark:           $TEXT | INLINE | A,
    B:              $TEXT,  // 简单支持
    I:              $TEXT,  // 同上

    Img:            0,  // 空
    Br:             0,  // 换行
    Wbr:            0,  // 软换行
    Blank:          0,  // 空，用于交互展示

    // 定制中间结构
    // 注：I 可用于标题序号或背景按钮。
    H1:             $TEXT | INLINE | I | A,
    H2:             $TEXT | INLINE | I | A,
    H3:             $TEXT | INLINE | I | A,
    H4:             $TEXT | INLINE | I | A,
    H5:             $TEXT | INLINE | I | A,
    H6:             $TEXT | INLINE | I | A,
    Figcaption:     $TEXT | INLINE | I | A,
    Summary:        $TEXT | INLINE | CODE | I | A,
    Li:             $TEXT | INLINE | CODE | IMG | A,
    Dt:             $TEXT | INLINE | CODE | I | A,
    Dd:             $TEXT | INLINE | CODE | IMG | A,

    // 原生中间结构。
    Caption:        $TEXT | INLINE | I | A,
    Thead:          0,  // 定制插入
    Tbody:          0,  // 同上
    Tfoot:          0,  // 同上
    Tr:             0,  // 同上
    Th:             $TEXT | INLINE | I | A,
    Td:             $TEXT | INLINE | CODE | I | IMG | A,

    Rb:             $TEXT,
    Rp:             $TEXT,
    Rt:             $TEXT,
    Track:          0,  // 空，单标签
    Source:         0,  // 空，同上
};



//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


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
