//! $Id: render.x.js 2020.03.10 Tpb.Tools $
// ++++++++++++++++++++++++++++++++++++++++++
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  渲染器（占位）。
//
//  用于不支持渲染时，相关调用返回兼容的值。
//
//
///////////////////////////////////////////////////////////////////////////////
//


/**
 * 解析节点树渲染配置。
 * @param  {Element} tpl 模板节点
 * @return {Element} tpl
 */
function parse( tpl ) {
    return tpl;
}


/**
 * 节点树渲染文法克隆。
 * @param  {Element} to 目标元素
 * @return {Element} to
 */
function clone( to ) {
    return to;
}


/**
 * 用源数据更新节点树。
 * @param  {Element} root 渲染根
 * @return {Element} root
 */
function update( root ) {
    return root;
}


export const Render = { parse, clone, update };
