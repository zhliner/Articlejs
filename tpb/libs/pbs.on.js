//! $Id: pbs.on.js 2019.08.19 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	OBT:On 方法集。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


const _On = {
    pba( evo ) {
        //
    },

    __pba: 1,


    pbo( evo ) {
        //
    },

    __pbo: 1,


    re( evo ) {
        //
    },

    __re: 1,


    date( evo ) {
        //
    },

    __date: 0,


    scam( evo ) {
        //
    },

    __scam: null,



    // Collector专有
    //===========================================

    item( evo ) {
        //
    },


    eq( evo ) {
        //
    },


    first( evo ) {
        //
    },


    last( evo ) {
        //
    },



    // 简单处理
    // 目标：当前条目/栈顶1项。
    // 注：只是目标自身的操作，无需By/To逻辑。
    //===========================================

    detach( evo, slr ) {
        //
    },


    remove( evo, slr ) {
        //
    },


    unwrap( evo ) {
        //
    },


    empty( evo ) {
        //
    },


    normalize( evo ) {
        //
    },
};


export { _On };
