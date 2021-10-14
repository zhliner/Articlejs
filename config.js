//! $ID: config.js 2020.04.05 Articlejs.Base $
// +++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2020 - 2020 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  用户配置定义。
//
//  安装根路径（URL）和模板根目录配置文件：base/tpb/config.js。
//
//
///////////////////////////////////////////////////////////////////////////////
//

import { BaseOn, BaseBy } from "./base/tpb/tpb.js";


const
    Setup = {

        // 编辑器安装根
        root:   '/',

        // 内容样式目录
        styles: 'styles',

        // 编辑器主题目录
        themes: 'themes',

        // 上载根目录
        upload: 'upload/data',


        //
        // 插件相关配置
        ///////////////////////////////////////////////////

        plugRoot:   'plugins',  // 插件根目录

        // 默认插件配置
        // [插件/目录名, 按钮提示]
        plugList: [
            ['example', '示例插件'],
        ],

        // 目标插件内文件
        plugMain:   'main.js',      // 主文件
        plugLogo:   'logo.png',     // 按钮图标文件
        plugConf:   'project.json', // 配置文件


        //
        // 样式元素ID
        // 注意与主模板文件中的值保持一致。
        // 注记：
        // 用于命令行修改主题/内容样式时对样式元素的检索。
        ///////////////////////////////////////////////////

        styleMain:  's-main',   // 文章内容
        styleCodes: 's-codes',  // 代码着色（文章内容）
        styleTheme: 's-theme',  // 编辑器主题
    },


    Limit = {
        // 历史栈长度
        // 注意定位移动可能会占据大量的步数。
        history:        999,

        // 弹出菜单边距友好（像素）
        // 顶部距划选文本和右侧靠时距容器边框距离。
        popupGapTop:    10,
        popupGapRight:  3,


        // 脚本编辑步数限制。
        shEdits:        999,

        // 历史脚本面板
        shListTop:      10,   // 分页大小：置顶区
        shListAll:      10,   // 分页大小：检索区
        shCodelen:      60,   // 代码行长度限制
    },


    // 提示信息集（可本地化）。
    Tips = {

        // 章节空标题占位
        sectionH2: '[ Empty heading ]',

        // 本地暂存
        localStoreDone: '保存完毕！',

        // section:s1
        sectionNotUp: '顶层章节不可再提升。',

        // 撤销副作用警告
        undoWarn: '原操作包含创建新节点的能力，撤销后重做可能导致旧节点引用丢失，使得之后的重做失效。是否继续？',

        // 命令行搜索回馈
        searchNothing: `没有搜索到`,

        // 命令行非法命令提示
        commandInvalid: '目标命令不被支持！',

        // 系统变量不存在提示
        configNothing:  '(^_^)',

    },


    // 帮助提示集。
    // key: [hid, msg]
    // 消息段（msg）可本地化，其余不可。
    Help = {

        'need_conelem': [
            'type:contents',
            '目标必须为内容元素'
        ],

        'both_conelem': [
            'type:contents',
            '选取元素及其父元素都必须为内容元素'
        ],

        'merge_types': [
            'type:merges',
            '元素集成员必需为可合并类型'
        ],


        'has_cannot_del': [
            'edit:deletes',
            '包含了不能被删除的元素'
        ],

        'has_fixed': [
            'edit:fixed',
            '包含有固定不可以被移动的元素'
        ],

        'has_fixed1': [
            'edit:fixed1',
            '含有不可向后移动的元素'
        ],

        'has_fixed2': [
            'edit:fixed2',
            '含有不可向前移动的元素'
        ],

        'cannot_selected': [
            'edit:insert',
            '插入的目标元素不可为已选取'
        ],

        'cannot_append': [
            'edit:insert',
            '不能向元素内插入内容'
        ],

        'only_section': [
            'edit:indent',
            '仅章节单元（section）支持缩进操作'
        ],

        'only_child': [
            'edit:onlyone',
            '只能作为唯一子元素存在'
        ],

        'not_property': [
            'edit:property',
            '没有可编辑的属性'
        ]

    },


    // 脚本执行器创建器
    // 路径视实际部署情况调整。
    Scripter = () => new Worker( '/base/scripter.js' );



//
// 内部配置集，不可修改！
//////////////////////////////////////////////////////////////////////////////

const Sys = {

    // 内置类名
    selectedClass:  '_selected',    // 元素选取态类名
    focusClass:     '_focus',       // 选取焦点类名
    hoverClass:     '_hover',       // 鼠标划过类名
    pointClass:     '_point',       // 路径栏鼠标指向


    // <rt>包围定义（<rp>）。
    // 全局定义以支持<ruby>解析式创建。
    rpLeft:     '(',
    rpRight:    ')',

    // <rt>占位符，当划选创建<ruby>缺乏rt部分时用。
    // 应当醒目，便于单击选取修改。
    rtHolder:   '(^m^)',


    // 撤销/重做事件名。
    // 在用户执行撤销/重做操作时，向内容区元素发送该事件，
    // 上层可根据发送信息修改按钮状态。
    undoEvent:  'button.undo',
    redoEvent:  'button.redo',


    // 事件名定义
    // 在模板中定义，由程序中激发。
    medIn:      'medin',        // 进入微编辑
    medOk:      'medok',        // 完成微编辑
    evnFollow:  'update',       // 内容区选取变化跟随激发
    insType:    'edtype',       // 编辑类型更新（普通插入|微编辑）
    covert:     'tips',         // 不可见元素提示
    shnav:      'reset',        // 脚本历史分页导航重置
    plugInit:   'init',         // 插件表初始化
    plugIns:    'install',      // 插件安装
    plugDel:    'uninstall',    // 插件卸载


    // 模板名定义
    // 在模板中定义，在程序中发送。
    miniedTpl:  'slave:minied',     // 微编辑
    normalTpl:  'slave:input',      // 普通录入
    modalProp:  'modal:prop',       // 属性编辑模态框
    modalPlug:  'modal:plugins',    // 插件面板


    // 转换类型标识名
    // 注：会引用不同的转换子菜单。
    convBlocks:  'blocks',
    convLines:   'conline',
    convInlines: 'inlines',


    // 插入层级名称约定。
    // 在模板和程序中协同使用。
    levelName1: 'siblings', // 平级
    levelName2: 'children', // 向内


    // 本地存储键/前缀
    //-------------------------------------------

    // 内容主体
    storeMain: 'HTML',

    // 编辑器主题
    storeTheme: 'Theme',

    // 内容样式
    storeStyle: 'Style',

    // 编辑器存储（前缀）
    prefixEditor: '__coolj',

    // 脚本历史（前缀）
    prefixScript: '__cjsh_',

};


//
// 命令行指令类型符。
// 注意快捷键配置（shortcuts.js）和模板中与此保持一致。
//
const Cmdx = {
    select:     '>',
    filter:     '|',
    search:     '/',
    command:    ':',
    calcuate:   '=',
}


//
// 待扩展自定义集。
//
const
    On = Object.create( BaseOn ),
    By = Object.create( BaseBy );


export { Setup, Limit, Tips, Help, Scripter, Sys, Cmdx, On, By };
