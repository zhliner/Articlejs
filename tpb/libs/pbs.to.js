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
//  格式：前置双下划线定义取栈条目数。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


const _To = {
    /**
     * 更新To目标。
     * 取值：当前条目/栈顶1项。
     */
    target( evo ) {
        evo.targets = evo.data;
    },

    __target: 1,

};


export { _To };
