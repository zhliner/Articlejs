//! $Id: tpb.js 2019.08.18 Tpb.Base $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
// 	Tpb {
// 		Kits 		工具箱
// 		Kits.Util	实用函数集
//
// 		TplBase 	辅助：模板管理器通用基类
// 		Templater 	辅助：当前模板管理器
// 		Localer 	辅助：本地化处理器
// 		Plater 		辅助：板块载入器
// 		Render 		辅助：渲染器
//
// 		Base 		应用：基类，基本应用
// 		Taker 		应用：动态页，数据内容可变，但不含模板处理
// 		WebApp 		应用：页程序，Web App，含模板处理
//
// 		Easing 		动画：缓动函数库
//
// 		run 		方法：基础实例运行
// 		pbs 		方法：基础PB扩展接口
// 		proxy 		方法：PB代理调用
// 		combine 	方法：PB组合调用
// 	}
//
// 	依赖：tQuery
///////////////////////////////////////////////////////////////////////////////
//

// import { X } from "./libs/lib.x.js";
// Tpb.Libs.X = X;


(function( window, undefined ) {

//
// 名称空间。
// 基本成员定义/声明。
//
const Tpb = {

	Util:  	{}, 	// namespace
	Config: null, 	// Object
	Core: 	null, 	// Instance


	TplBase: 	null, 	// Class/Base Class
	Templater: 	null, 	// Class
	Localer: 	null, 	// Class
	Plater: 	null, 	// Class


	// 渲染器：{
	//   parse( Element ) Boolean
	//   clone( Element, Element ) this
	//   show( Element, Data ) Element
	//   insitu( Element ) Boolean
	// }
	Render: null,


	Base: 	null, 	// Base Class
	Taker: 	null, 	// Class
	WebApp: null, 	// Class


	Easing: {},  	// 缓动函数库


	/**
	 * 基础实例运行。
	 * 此为单独运行，提供静态交互服务。
	 * @param {Element} root 起始根容器
	 */
	run: root => Tpb.Core.run(root),

	/**
	 * 基础PB扩展。
	 */
	pbs: obj => Tpb.Core.pbs(obj),

	/**
	 * PB组合调用。
	 */
	combine: (...a) => Tpb.Core.combine(...a),

	/**
	 * PB代理调用。
	 */
	proxy: self => Tpb.Core.proxy(self),

};


// Expose
///////////////////////////////////////////////////////////////////////////////


let _Tpb = window.Tpb;

/**
 * 恢复页面初始Tpb占用。
 * @returns 当前Tpb对象
 */
Tpb.noConflict = function() {
	if ( window.Tpb === Tpb ) window.Tpb = _Tpb;
	return Tpb;
};

window.Tpb = Tpb;

})( window );