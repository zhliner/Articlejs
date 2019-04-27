//
// 动画相关。
// 支持Element.animate和CSS动画。
// animate调用返回Animation实例，可绑定事件处理。
// 注：
// Animation可用事件名：[finish, cancel]
//
Object.assign( NS.Animation, {
	//
	// Element.animate 部分。
	//-------------------------------------------------------------------------


	/**
	 * 关键帧定义（keyframes）。
	 * - 存储用于元素animate接口的首个参数；
	 * - $name为多个名称的数组时，$val也为数组且成员一一对应；
	 * - 如果逐帧配置（from...to），流程数据需先为一个数组；
	 *   （可用PB:val预设一个空数组）
	 * 注：
	 * - animate首个参数可为一个帧配置数组或一个多帧配置对象；
	 * @param  {String|Array} $name 样式属性名（集）
	 * @param  {Value|[Value]} $val 样式值/值集
	 * @next: {Array|Object}
	 */
	kf( ev, $name, $val ) {
		let _kfo = keyFrame(
			this.$value($name), this.$value($val)
		);
		if (!$.isArray(this.data)) {
			return this.next(_kfo);
		}
		return this.next( this.data.concat(_kfo) );
	},


	/**
	 * 动画运行。
	 * - 向后传递animate()创建的Animation实例；
	 * - 传递rid为undefined，可以捕获trigger发送来的元素；
	 * @data: {Array|Object}
	 * @param {String|undefined} rid 动画元素标识
	 * @param {Number} duration 持续时间（秒，浮点数）
	 * @param {Number} iterations 迭代次数，可选
	 * @param {String} easing 缓动类型.名，可选
	 * @param {Object} opts 更多选项
	 */
	play( ev, rid, duration, iterations, easing, opts = {} ) {
		let $el = this.$elem(rid) || $(ev.detail),
			_vs = $el.animate(
				this.data,
				Object.assign( opts, {duration, iterations, easing} )
			);

		return this.next( alone(_vs) );
	},


	/**
	 * 发送动画实例（Animation）。
	 * - 流程数据即为.play传递来的Animation实例；
	 * - 外部通常先存储，然后定义用户事件触发控制；
	 * 注意：
	 * - 每次发送一个新的动画实例，外部应逐一处理；
	 *
	 * @data: {Animation}
	 * @param {String} rid 接收元素标识
	 * @param {String} evn 接收事件名
	 */
	send( ev, rid, evn ) {
		Util.fireEvent(
			this.$elem(rid), evn, this.data, 0
		);
		return this.next();
	},


	//-------------------------------------------------------------------------
	// 以下为处理端接口，支持Animation实例数组。


	/**
	 * 动画暂停。
	 * @data: {Animation[s]}
	 */
	pause(/* ev */) {
		callAnis(this.data, 'pause');
		return this.next();
	},


	/**
	 * 动画提前完成。
	 * @data: {Animation}
	 */
	finish(/* ev */) {
		callAnis(this.data, 'finish');
		return this.next();
	},


	/**
	 * 取消执行。
	 * @data: {Animation}
	 */
	cancel(/* ev */) {
		callAnis(this.data, 'cancel');
		return this.next();
	},


	/**
	 * 反向执行。
	 * @data: {Animation}
	 */
	reverse(/* ev */) {
		callAnis(this.data, 'reverse');
		return this.next();
	},


	/**
	 * 动画实例属性设置。
	 * 提示：取值可用PB:sub
	 * @data: {Animation[s]}
	 * @param {String|Object} $name 属性名或配置对象
	 * @param {Value} $val 属性值
	 */
	prop( ev, $name, $val ) {
		let _k = this.$value($name),
			_v = this.$value($val);

		if (!$.isArray(this.data)) {
			aniProp(this.data, _k, _v);
		} else {
			this.data.forEach(ani => aniProp(ani, _k, _v));
		}
		return this.next();
	},


	//
	// CSS动画接口。
	//-------------------------------------------------------------------------
	// 由外部CSS定义，可由pba/pbo改变触发动画执行。
	// 注：事件名 [animationstart, animationend, animationiteration]


	/**
	 * 等待完毕。
	 * - 等待CSS动画完毕才继续执行流；
	 *   定义多个wait为等待多个目标动画依次结束；
	 * 注意：
	 * - 如果动画已经结束或没有动画，无法触发next调用，执行流中断；
	 * - 此PB一般定义在同On配置的前一个调用链中，
	 *   或紧跟在动画激发定义之后（动画的结束需要时间）；
	 *
	 * @param {String} rid 目标元素标识，可选
	 */
	wait( ev, rid ) {
		return aniWaits(
			// next: bound function
			this.$elem(rid) || $(this.data), this.next
		);
	},

});



/**
 * 构造一个关键帧配置对象。
 * （Element.animate首个数组参数的成员）
 * - name为多个名称的数组时，val也为数组一一对应；
 * @param  {String|Array} name 样式名（集）
 * @param  {Value|[Value]} val 样式值（集）
 * @return {Object}
 */
 function keyFrame( name, val ) {
	if (typeof name == 'string') {
		return { [name]: val };
	}
	let _i = 0;
	return name.reduce( (o, k) => o[k] = val[_i++], {} );
}


/**
 * 动画执行等待。
 * - 仅适用元素CSS动画（支持animationend事件）；
 * - 用once绑定防止无动画元素资源无限占用；
 * @param {Element}   el  目标元素
 * @param {Function} next 完毕后执行的回调
 */
 function aniWait( el, next ) {
	if (!el) return next();
	$.once(el, 'animationend', null, next);
}


/**
 * 多个动画执行等待。
 * - 全部动画执行完后继续next回调；
 * - 如果有一个执行失败，不会执行next（即挂起）；
 * - 如果元素集为空，直接next（不挂起）；
 *
 * @param {[Element]} els 动画元素集
 * @param {Function} next 最终完毕回调
 */
function aniWaits( els, next ) {
	if (els.length < 2) {
		return aniWait(els[0], next);
	}
	Promise.all(
		els.map( el => new Promise(ok => aniWait(el, ok)) )
	)
	.then( next );
}


/**
 * 调用动画对象特定方法。
 * - 如果its为一个动画实例集，则批量调用；
 * - 目标方法没有参数；
 * - 会检查目标对象是否支持方法，安全调用；
 *   （以便容错提取的数据集）
 *
 * @param {Animation|[Animation]} its 目标（集）
 * @param {String} meth 方法名
 */
 function callAnis( its, meth ) {
	if (!$.isArray(its)) {
		return its[meth] && its[meth]();
	}
	its.forEach( ani => ani[meth] && ani[meth]() );
}


/**
 * 动画实例属性设置。
 * @param  {Animation} ani 动画实例
 * @param  {String|Object} name 属性名或名值配置
 * @param  {Value} val 属性值
 * @return {Animation} ani
 */
 function aniProp( ani, name, val ) {
	if (typeof name == 'string') {
		ani[name] = val;
	} else {
		$.each( name, (v, k) => ani[k] = v );
	}
	return ani;
}
