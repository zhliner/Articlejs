/* $Id: sample.js 2013.06.17 [App].Plate $
*******************************************************************************
			Copyright (c) 黔原小屋 2015 - 2017 GNU LGPL

				@Project: jcEd v0.5.1
				@Author:  风林子 zhliner@gmail.com
*******************************************************************************

	EMCV 四分层逻辑

	各阶段通过承诺回调进入下一步。

	Entry
	进入模型前的初始准备阶段，可能有一些控制逻辑（Mode前的Control）。
	可选。

	Model
	业务逻辑的处理。一般在此与服务器进行数据交互。
	可选。

	Control
	模型完成后的处理，可能有与Entry部分的协调回访、状态交互。
	可选。

	Update
	完成视图部分的数据逻辑，比如节点渲染。提供给To部分操作。
	可选。

&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
*/


(function( $, X ) {


//-- 入口参数 -------------------------------------------------------------
// => Control
// 入口数据控制，可选。
// - 主要为提取用户数据，处理后递送给控制层。
// - this已绑定为事件当前元素（targets.current）；
// - 如果此处无定义或为null，原流程数据直接向后续传；
// - 若定义后无返回值，则会终止执行流；
//
// @param  {Event} ev 原生事件对象
// @param  {Array|null} args 模板中的参数序列
// @param  {Mixed} data 流程数据（PB-On）
// @return {Mixed} 结果参数
//
X.Entry = {
	/**
	 * 示例
	 */
	handle( ev, args, data ) {
		// return ...;
	},

};



//-- 本地控制 ---------------------------------------------------------------
// View =>
// 综合性事务处理。可选。
// - 如果未定义或设为null，原参数向后续传；
// - this为父对象本身（Control）；
//
// @param {Mixed} args 入口层来的参数
// @param {Function} resolve 成功回调
// @param {Function} reject  失败回调
X.Control = {
	/**
	 * 示例
	 */
	handle( args, resolve, reject ) {
		// resolve(data); 成功
		// reject(error); 失败
	},

};



//-- 模型逻辑 -------------------------------------------------------------
// Control =>
// 具体的业务处理。
// - 若此处无定义（通常不会），跳过执行；
// - this为父对象本身（Model）；
//
// @param {Mixed} data 控制层来的数据
// @param {Function} resolve 成功回调
// @param {Function} reject  失败回调
//
X.Model = {
	/**
	 * 示例
	 */
	handle( data, resolve, reject ) {
		// resolve(dict); 成功
		// reject(error); 失败
	},

};



//-- UI更新 ---------------------------------------------------------------
// Model =>
// 节点渲染更新。
// - 如果未定义，模型数据直接向后传递；
// - this为父对象本身（Update）；
//
// @param {Mixed} dict 模型层来的数据
// @param {Function} resolve 成功回调
// @param {Function} reject  失败回调
//

// 基本工具。
const
	Render  = Tpb.Render,
	tplNode = name => T.Config.Templater.get(name);


X.Update = {
	/**
	 * 示例
	 */
	handle( dict, resolve, reject ) {
		// resolve(value); 成功
		// reject(error); 失败
	},

};


})( tQuery, jcEd.Plate.Sample = {} );