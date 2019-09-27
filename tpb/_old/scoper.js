//! $Id: scoper.js 2019.08.19 Tpb.Kits $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	净域生成器
//
//  为js代码的执行创建一个空域环境；
//  域内所用数据由构造函数和代理调用引入（两级）；
//  仅支持表达式；
//  这不是一个沙盒，它只是让合法的代码干净的执行；
//
//  注记：
//  就目前来看，JS下暂无真的沙盒。
//  除null/undefined外，任何值都可以从constructor上溯构造函数执行。
//  如：
//    ''.constructor.constructor('alert("hai")')()
//    (x=>x)['const'+'ructor']('alert("hai")')()
//
///////////////////////////////////////////////////////////////////////////////
//


class Scoper {
	/**
	 * @param {...Object} data 全局域数据序列
	 */
	constructor( ...data ) {
		this._data  = $.object( null, ...data );
		this._scope = new Proxy( this._data, { has: () => true } );
	}


	/**
	 * 构造执行器。
	 * - 由执行器的参数引入用户当前域数据；
	 * - 当前域数据会被绑定到最终执行函数的this上；
	 * - 内部二级with(this)，因此this内数据也可直接引用；
	 * 注记：
	 * 由于一级with已经屏蔽了参数，故二级with用this。
	 *
	 * 特点：
	 * - 外部无法改变执行器内的this（如bind）；
	 * - 表达式函数简单执行，没有外部参数输入可用；
	 *
	 * @param  {String} expr 表达式串
	 * @return {Function} 执行器 func(data)
	 */
	runner( expr ) {
		/*jshint -W054 */
		let _call = new Function(
			'G',
			`with(G) with(this) return ${expr};`
		);

		return function( scope, data = null ) {
			return this.bind(
				// data maybe String, Number...
				data === null ? {} : data
			)(scope);
		}
		// 新空间避免全局数据被污染
		.bind( _call, $.object(this._scope) );
	}


	/**
	 * 构造代理函数。
	 * - 用原型继承的方式引入用户数据（浅拷贝）；
	 * - 代理函数可以绑定this，并会被传递到表达式函数内；
	 * - 最终执行函数的参数序列被设置在“_”变量上；
	 *
	 * 特点：
	 * - 返回函数可由外部绑定this，使数据随函数传递；
	 * - 最终函数执行时可传递任意参数，由“_”名称引用；
	 *
	 * @param  {String} expr 表达式串
	 * @param  {Object} data 用户域数据
	 * @return {Function} 包装函数
	 */
	handle( expr, data = null ) {
		/*jshint -W054 */
		let _gobj = $.object(this._scope, data),
			_call = new Function(
				'G', `with(G) return ${expr};`
			);

		return function() {
			_gobj._ = arguments;
			return _call.bind( this || {} )( _gobj );
		};
	}


	/**
	 * 获取成员值。
	 * - 简单获取成员的优化版，避免编译代理函数；
	 * - name需要是一个合法的变量名；
	 * @param  {String} name 键名
	 * @param  {Object} data 取值域数据，可选
	 * @return {Mixed}
	 */
	get( name, data ) {
		let _val;

		if (data !== undefined) {
			_val = data[name];
		}
		return _val !== undefined ? _val : this._data[name];
	}


	/**
	 * 获取被代理的对象本身。
	 * @return {Object}
	 */
	get data() {
		return this._data;
	}

}
