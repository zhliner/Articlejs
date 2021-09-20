//! $ID: main.js 2021.09.19 Articlejs.Plugins $
// ++++++++++++++++++++++++++++++++++++++++++++++
//  Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
//  Copyright (c) 2021 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  插件开发说明
//
//  考虑安全性和避免全局环境污染，插件以 Worker 的方式运行。
//
//  插件可以调用系统 Api 导入 html 模板，而模板中可以定义 OBT 配置，
//  因此就获得了在 DOM 中处理业务的能力。
//
//  模板中的 OBT 会自动编译。因为 OBT 的格式简单并确定，因此便于自动化的安全检查，
//  这在插件的评审中是一个优点。
//
//
///////////////////////////////////////////////////////////////////////////////
//
