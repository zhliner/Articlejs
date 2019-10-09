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


// 内容类型。
const
    $TEXT       = 1,        // 文本/节点

    ABSTRACT    = 1 << 1,   // 提要
    TOC         = 1 << 2,   // 目录
    HEADER      = 1 << 3,   // 导言
    FOOTER      = 1 << 4,   // 结语
    S1          = 1 << 5,   // 章 /h2
    S2          = 1 << 6,   // 节 /h3
    S3          = 1 << 7,   // 区 /h4
    S4          = 1 << 8,   // 段 /h5
    S5          = 1 << 9,   // 末 /h6
    CONTENT     = 1 << 10,  // 正文区
    OL          = 1 << 11,  // 有序列表
    BLOUFCPC    = 1 << 12,  // 块集：ul,figure,codelist,pre,codeblock
    SEEALSO     = 1 << 13,  // 另参见
    CASCADE     = 1 << 14,  // 级联表
    REFERENCES  = 1 << 15,  // 文献参考
    DL          = 1 << 16,  // 定义列表
    BLOTHS      = 1 << 17,  // 块集：table,hr,space
    BLOCKQUOTE  = 1 << 18,  // 块引用
    ASIDE       = 1 << 19,  // 批注
    DETAILS     = 1 << 20,  // 详细内容
    P           = 1 << 21,  // 段落
    ADDRESS     = 1 << 22,  // 地址信息

    CASCADETOC  = 1 << 23,  // 目录级联表（结构件 cascade/li/a）
    ALI         = 1 << 24,  // 目录链接条目（结构件 li/a）
    CODELI      = 1 << 25,  // 代码表条目（结构件 li/code）
    CASCADELI   = 1 << 26,  // 级联表条目（结构件 li/h5,ol）

    INLINE      = 1 << 27,  // 内联单元
    A           = 1 << 28,  // 链接
    CODE        = 1 << 29,  // 行内代码
    IMG         = 1 << 30,  // 图片
    I           = 1 << 31,  // <i> 标题编号
    B           = 1 << 32,  // <b> 代码关键字

    H2          = 1 << 33,  // 章标题
    H3          = 1 << 34,  // 节标题
    H4          = 1 << 35,  // 区标题
    H5          = 1 << 36,  // 段标题
    H6          = 1 << 37,  // 末标题
    SUMMARY     = 1 << 38,  // 详细内容摘要/标题
    FIGCAPTION  = 1 << 39,  // 插图标题
    LI          = 1 << 40,  // 列表项（通用）
    DLI         = 1 << 41,  // 定义列表项（dt,dd）
    RBPT        = 1 << 42,  // 注音单元（rb,rp,rt）
    TRACK       = 1 << 43,  // 字幕轨
    SOURCE      = 1 << 44,  // 媒体资源

    CAPTION     = 1 << 45,  // 表格标题
    TSEC        = 1 << 46,  // 表格片区（thead,tbody,tfoot）
    TR          = 1 << 47,  // 表格行
    TCELL       = 1 << 48;  // 表单元格（th,td）


//
// 内容单元|元件类型配置。
//
const itemType = {
    // 文本
    $text:          $TEXT,

    // 结构单元
    // BLOTHS：table|hr|space
    // BLOUFCPC：ul|figure|codelist|pre|codeblock
    Abstract:       ABSTRACT,
    Toc:            TOC,
    Header:         HEADER,
    Footer:         FOOTER,
    S1:             S1,
    S2:             S2,
    S3:             S3,
    S4:             S4,
    S5:             S5,
    Content:        CONTENT,
    Ul:             BLOUFCPC,
    Seealso:        SEEALSO,
    Ol:             OL,
    Cascade:        CASCADE,
    Codelist:       BLOUFCPC,
    References:     REFERENCES,
    Dl:             DL,
    Table:          BLOTHS,
    Figure:         BLOUFCPC,
    Blockquote:     BLOCKQUOTE,
    Aside:          ASIDE,
    Details:        DETAILS,
    Codeblock:      BLOUFCPC,

    // 文本单元
    P:              P,
    Address:        ADDRESS,
    Pre:            BLOUFCPC,
    Hr:             BLOTHS,
    Space:          BLOTHS,

    // 限定中间单元
    Cascadetoc:     CASCADETOC,
    Ali:            ALI,
    Codeli:         CODELI,
    Cascadeli:      CASCADELI,

    // 内联单元。
    // 取值时会提取元素本身，因此配置为同一类。
    Audio:          INLINE,
    Video:          INLINE,
    Picture:        INLINE,
    Strong:         INLINE,
    Em:             INLINE,
    Q:              INLINE,
    Abbr:           INLINE,
    Cite:           INLINE,
    Small:          INLINE,
    Time:           INLINE,
    Del:            INLINE,
    Ins:            INLINE,
    Sub:            INLINE,
    Sup:            INLINE,
    Mark:           INLINE,
    Orz:            INLINE,
    Ruby:           INLINE,
    Dfn:            INLINE,
    Samp:           INLINE,
    Kbd:            INLINE,
    S:              INLINE,
    U:              INLINE,
    Var:            INLINE,
    Bdo:            INLINE,
    Meter:          INLINE,
    Blank:          INLINE,

    // 会被作为特定的子单元使用。
    A:              A,
    Code:           CODE,
    Img:            IMG,
    I:              I,
    B:              B,

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
// 合法子类型配置。
//
const itemSubs = {

    // 结构单元块
    Abstract:       H3 | P | BLOTHS,
    Toc:            H4 | CASCADETOC,
    Header:         H4 | P | BLOTHS,
    Footer:         H4 | P | BLOTHS | BLOCKQUOTE | SEEALSO | REFERENCES | ADDRESS,
    S1:             H2 | HEADER | S2 | FOOTER,
    S2:             H3 | HEADER | S3 | FOOTER,
    S3:             H4 | HEADER | S4 | FOOTER,
    S4:             H5 | HEADER | S5 | FOOTER,
    S5:             H6 | HEADER | CONTENT | FOOTER,
    Content:        P | BLOTHS | OL | BLOUFCPC | DL | BLOCKQUOTE | ASIDE | DETAILS | CASCADE | ADDRESS,
    Ul:             LI,
    Seealso:        LI,
    Ol:             LI,
    Cascade:        CASCADELI,
    Codelist:       CODELI,
    References:     LI,
    Dl:             DLI,
    Table:          CAPTION | TSEC,
    Figure:         FIGCAPTION | P,
    Blockquote:     H4 | P | BLOTHS | OL | BLOUFCPC | BLOCKQUOTE,
    Aside:          H4 | P | BLOTHS | OL | BLOUFCPC | BLOCKQUOTE | ADDRESS,
    Details:        SUMMARY | P | BLOTHS | OL | BLOUFCPC | BLOCKQUOTE,
    Codeblock:      CODE,

    // 文本类行块。
    P:              $TEXT | INLINE | CODE | IMG,
    Address:        $TEXT | INLINE | CODE | IMG,
    Pre:            $TEXT | INLINE | CODE | IMG,
    Hr:             0,  // 空
    Space:          0,  // 空，用于交互展示

    // 限定中间结构
    Cascadetoc:     ALI,
    Ali:            A,
    Codeli:         CODE,
    Cascadeli:      H5 | OL,

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
    Blank:          0,  // 空，用于交互展示

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
// 导出
///////////////////////////////////////////////////////////////////////////////

export { itemType, itemSubs };
