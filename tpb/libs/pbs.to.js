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


//
// 目标更新方法集。
// 被封装调用，因此不含首个evo实参。
//
const _Sets = {

    attr( its, val, name ) {
        //
    },

    __attr: 1,


    prop( its, val, name ) {
        //
    },

    __prop: 1,


    css( its, val, name ) {
        //
    },

    __css: 1,


    toggleAttr( its, val, name ) {
        //
    },

    __toggleAttr: 1,

};


//
// 下一阶处理。
// 类似普通的 PB:Call 逻辑。
//
const _Stage = {
    /**
     * 更新To目标。
     * 取值：当前条目/栈顶1项。
     */
    target( evo ) {
        evo.targets = evo.data;
    },

    __target: 1,

};


const _To = {
    method: _Sets,
    stage:  _Stage,
};


export { _To };
