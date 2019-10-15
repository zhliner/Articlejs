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
    CODELI      = 1 << 23,  // 代码表条目（li/code）
    ALI         = 1 << 24,  // 目录表普通条目（li/a）
    H5A         = 1 << 25,  // 目录表标题条目（h5/a）
    CASCADELI   = 1 << 26,  // 级联表条目（li/h5,ol）
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
const Types = {
    // 文本
    $text:          $TEXT,

    // 结构单元
    // BLOATHS：Address|Table|Hr|Space
    // BLOUFCPC：Ul|Figure|Codelist|Pre|Codeblock
    H1:             H1,
    Abstract:       ABSTRACT,
    Toc:            TOC,
    Article:        ARTICLE,
    Header:         HEADER,
    Footer:         FOOTER,
    S1:             S1,
    S2:             S2,
    S3:             S3,
    S4:             S4,
    S5:             S5,
    Ul:             BLOUFCPC,
    Seealso:        SEEALSO,
    Ol:             OL,
    Cascade:        CASCADE,
    Codelist:       BLOUFCPC,
    References:     REFERENCES,
    Dl:             DL,
    Table:          BLOATHS,
    Figure:         BLOUFCPC,
    Blockquote:     BLOCKQUOTE,
    Aside:          ASIDE,
    Details:        DETAILS,
    Codeblock:      BLOUFCPC,

    // 文本单元
    P:              P,
    Address:        BLOATHS,
    Pre:            BLOUFCPC,
    Hr:             BLOATHS,
    Space:          BLOATHS,

    // 限定中间单元
    Codeli:         CODELI,
    Ali:            ALI,
    H5a:            H5A,
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
    H2:             H2,
    H3:             H3,
    H4:             H4,
    H5:             H5,
    H6:             H6,
    Summary:        SUMMARY,
    Figcaption:     FIGCAPTION,
    Li:             LI,
    Dt:             DLI,
    Dd:             DLI,

    Rb:             RBPT,
    Rp:             RBPT,
    Rt:             RBPT,
    Track:          TRACK,
    Source:         SOURCE,

    // 表格单独处理。
    Caption:        CAPTION,
    Thead:          TSEC,
    Tbody:          TSEC,
    Tfoot:          TSEC,
    Tr:             TR,
    Th:             TCELL,
    Td:             TCELL,
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
    Abstract:       H3 | P | BLOATHS,
    Toc:            H4 | CASCADE,
    Seealso:        LI,
    References:     LI,
    Header:         H4 | P | BLOATHS | BLOCKQUOTE,
    Footer:         H4 | P | BLOATHS | BLOCKQUOTE,
    Article:        HEADER | H2 | S1 | CONTENT | FOOTER,
    S1:             HEADER | H3 | S2 | CONTENT | FOOTER,
    S2:             HEADER | H4 | S3 | CONTENT | FOOTER,
    S3:             HEADER | H5 | S4 | CONTENT | FOOTER,
    S4:             HEADER | H6 | S5 | CONTENT | FOOTER,
    S5:             CONTENT,
    Ul:             LI,
    Ol:             LI,
    Cascade:        CASCADELI | ALI | LI,
    Codelist:       CODELI,
    Dl:             DLI,
    Table:          CAPTION | TSEC,
    Figure:         FIGCAPTION | P,
    Blockquote:     H4 | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Aside:          H4 | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Details:        SUMMARY | P | BLOATHS | OL | BLOUFCPC | BLOCKQUOTE,
    Codeblock:      CODE,

    // 文本类行块。
    P:              $TEXT | INLINE | CODE | IMG,
    Address:        $TEXT | INLINE | CODE | IMG,
    Pre:            $TEXT | INLINE | CODE | IMG,
    Hr:             0,  // 空
    Space:          0,  // 空，用于交互展示

    // 限定中间结构
    Codeli:         CODE,
    Ali:            A,
    H5a:            A,
    Cascadeli:      H5 | H5A | OL,

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
    Thead:          TR,
    Tbody:          TR,
    Tfoot:          TR,
    Tr:             TCELL,
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
 * 测试<li>支持的两种类型。
 * 注：向下检索测试。
 * @param  {Element} li 列表项元素
 * @return {String} Codeli|Cascadeli|Li
 */
function customLi( li ) {
    let _sub = li.firstElementChild,
    _cnt = li.childElementCount;

    // codelist: li/code/
    if ( _cnt == 1 && _sub.nodeName == 'CODE' ) {
        return 'Codeli';
    }
    // cascade: li/h5, ol/
    if ( _cnt == 2 && _sub.nodeName == 'H5' && $.next(_sub).nodeName == 'OL' ) {
        return 'Cascadeli';
    }
    return 'Li';
}


/**
 * 转为首字母大写。
 * @param  {String} name 名称串
 * @return {String}
 */
function camelCase( name ) {
    return name[0].toUpperCase() + name.substring(1);
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

    return _n == 'li' ? customLi( el ) : camelCase(_n);
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
