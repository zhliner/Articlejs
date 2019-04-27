	// 动画：刷新率（帧/秒）。
	const
		__frameRate = 60,
		// 动画：单帧时间（毫秒）。
		// 注：一秒60帧。
		__frameCell = 1000/__frameRate;


//
// 动效相关。
// 此为工作原理基础实现，外部具体扩展。
//
Object.assign( NS.Effects, {
	/**
	 * 动效开启。
	 * （requestAnimationFrame）
	 * - 以动画方式执行tween里的函数队列；
	 * - 以秒为单位更易直观感受；
	 * 提示：
	 * - 仅单次行为，无循环重复逻辑；
	 * - 动效函数对流程数据的需求自行处理；
	 *
	 * @param {Number} times 持续时间（秒，浮点数）
	 * @param {String} easing 缓动类型.名，可选
	 */
	start( ev, times, easing = 'Linear' ) {
		if (!this.tween.length || times < 0) {
			return this.next();
		}
		if (!times) times = Infinity;

		progress(
			this.tween,
			times * __frameRate,
			easing,
			this.data,
			data => this.next(data)
		);
	},


	/**
	 * 动画控制递交。
	 * - 向外发送一个控制函数；
	 * - 调用时传递null终止动画，其它假值暂停动画；
	 * - 恢复暂停的动画传递true调用即可；
	 * 注：
	 * - 外部通常先存储，然后定义用户事件触发控制；
	 * - 此控制一般在动画开始之前发送（无延迟）；
	 *
	 * @param {String} rid 接收元素标识
	 * @param {String} evn 接收事件名
	 */
	hander( ev, rid, evn ) {
		Util.fireEvent(
			this.$elem(rid),
			evn,
			run => this.tween[run === null ? 'halt' : 'pause'] = !run,
			false
		);
		return this.next();
	},

});



//
// 动效支持（基础）
//
///////////////////////////////////////////////////////////////////////////////
// 动效参数会传递给每一个动画函数的每帧调用。
// 动效参数：{
//  	{Number} start 	起始时间戳
//  	{Object} frames 总帧数存储（frames.total）
//  	{Number} count 	当前迭代计数
//  	{Number} ratio 	曲线当前比值
//  	{Number} timestamp 	当前绘制时间戳
// }
// 注：
// - 总帧数用一个对象引用存储，外部的修改内部可见；
// - 内部会自动对该值进行修订，外部改变仅用于非常规情况；
//


/**
 * 动画配置并执行。
 * - 传递迭代总次数0表示无限循环（Infinity）；
 * @param  {[Function]} tween 调用集
 * @param  {Number} total 总迭代次数
 * @param  {String} names 缓动类型.名
 * @param  {Mixed} data 初始传入数据（首个代理调用的数据参数）
 * @param  {Function} done 成功回调
 * @param  {Function} fail 失败回调
 * @return {Resource} 资源请求ID
 */
 function progress( tween, total, names, data, done, fail ) {
    let _obj = { total },
    	iter = easing(_obj, names),
    	args = {
			start:  null,
			frames: _obj,
		};

	return requestAnimationFrame(
		step.bind({ iter, tween, args, data, done, fail })
	);
}


/**
 * 每帧调用。
 * this {
 *  	{Iterator} iter 缓动迭代器（总）
 *  	{Array} tween 	动画函数队列
 *  	{Object} args 	每帧当前参数
 *  	{Function} done 完成回调
 *  	{Function} fail 失败回调
 *  	{Mixed} data  	最后一个调用的结果（或初始值）
 * }
 * - 最后一个调用的结果会回传；
 * - 集中任何一个动画函数返回false，会终止动画序列；
 *
 * @param  {Number} tm 当前绘制时间戳
 * @return {Resource} 请求标识ID
 */
function step( tm ) {
	let {iter, tween, args, data, done, fail} = this;

	if (tween.pause) {
		// 空转...
		return requestAnimationFrame( step.bind(this) );
	}
    if (data === false) {
    	return fail && fail();
    }
 	let _o = iter.next();

    if (_o.done) {
    	return done && done(data);
    }
    this.data = stepCall(tween, args, data, _o.value, tm);

	requestAnimationFrame( step.bind(this) );
}


/**
 * 每帧调用（实施）。
 * - 返回false表示终止整个动画；
 * - 每帧调用时都会检查调用链是否重新开启；
 *
 * 动画函数参数：{
 *  	{Object} args 	如前“动效参数”
 *  	{Mixed} data 	上一个动画函数的返回值
 * }
 * 注：
 * 动画执行期间源元素调用链重启，会中断当前动画。
 *
 * @param  {[Function]} tween 调用集
 * @param  {Object} args 每帧参数
 * @param  {Mixed} data 上一帧动画序列的返回值（或初始值）
 * @param  {Array} val [当前计次，比值]
 * @param  {Number} tm 当前绘制时间戳
 * @return {Boolean} 是否终止（fail）
 */
function stepCall( tween, args, data, val, tm ) {
    if (!args.start) {
    	args.start = tm;
    }
    args.count = val[0];
    args.ratio = val[1];
    args.timestamp = tm;

    for ( let fn of tween ) {
    	// halt of chain
    	if (tween.halt || (data = fn(args, data)) === false) return false;
    }
    // 帧数修订
    remedy(args.frames, args.start, val[0], tm);

    return data;
}


/**
 * 帧率校订。
 * - 如果动画函数集花费较多时间，会错过每秒60帧的速率，
 *   因此需要修订以满足整体的时间要求（粗略）；
 * - 修订在每一次绘制时执行，且修改总帧数，较为平滑；
 * @param {Object} frames 总帧数存储
 * @param {Number} start  起始时间
 * @param {Number} count  当前计次（帧）
 * @param {Number} current 当前时间
 */
function remedy( frames, start, count, current ) {
	let _pas = current - start,
		_std = count * __frameCell,
		_dif = _pas - _std;

    if (_dif > __frameCell) frames.total -= _dif/__frameCell;
}


/**
 * 提取缓动函数。
 * @param  {String|Array} names 缓动类型.名
 * @param  {Object} eases 缓动函数定义集
 * @return {Function|null}
 */
function easeHandle( names, eases ) {
	if (!names) {
		return null;
	}
	let [a, b] = names.split('.');
	if (!b) {
		return eases[a];
	}
	return eases[a] && eases[a][b];
}


/**
 * 获取缓动值集。
 * 注：frames.total是可以在外部调整的；
 * @param {Object} frames 总次数存储对象
 * @param {String} names 缓动类型.名
 * @yield [i, Number] 当前计次与比值
 */
function *easing( frames, names ) {
    let _fn = easeHandle(names, _Easing) || easeHandle(names, T.Easing);
    if (!_fn) {
    	throw new Error(`invalid easing with ${names}`);
    }
    for ( let i = 1; i <= frames.total; i++ ) {
    	yield [ i, _fn(i, frames.total) ];
    }
}


// 默认缓动函数
const _Easing = { Linear: ( t, d ) => t/d };
