//! $Id: pbs.to.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:To 方法集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


const _To = {
    //
};


//
// To目标更换。
// 取值：当前条目/栈顶1项。
// this为Stack实例。
// 注：
// To下一阶唯一特权方法。
//
const usurp = function( evo ) { this.target( evo.data ) };
usurp.targetCount = 1;


export { _To };
