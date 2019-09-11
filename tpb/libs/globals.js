//
// 指令配置属性。
//
const
    // 自动取栈计数
    EXTENT = Symbol('stack-amount'),

    // 特权方法
    ACCESS = Symbol('stack-access');



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取指令/方法（基础集）。
 * 处理取栈条目数（[EXTENT]）。
 * 处理特权设置（[ACCESS]），不锁定this（由解析者绑定到数据栈对象）。
 * 注记：
 * 创建已绑定的全局方法共享，以节省内存。
 *
 * @param {Function} f 方法
 * @param {String} k 方法名
 * @param {Object} obj 宿主对象
 */
 function baseMethod( f, k, obj ) {
    if ( !k.length || k.startsWith('__') ) {
        return;
    }
    let _n = obj[ `__${k}` ];

    return [ obj[ `__${k}_x` ] ? funcSets( f, _n, true ) : funcSets( f.bind(obj), _n ) ];
}


/**
 * 获取普通指令/方法。
 * 仅处理取栈条目数，无特权逻辑。
 * @param {Function} f 方法
 * @param {String} k 方法名
 * @param {Object} obj 宿主对象
 */
function bindMethod( f, k, obj ) {
    if ( !k.length || k.startsWith('__') ) {
        return;
    }
    return funcSets( f.bind(obj), obj[ `__${k}` ] );
}


/**
 * 指令/方法属性设置：{
 *  - [ACCESS] 是否为特权方法。
 *  - [EXTENT] 自动取栈条目数。
 * }
 * @param {Function} f 目标指令
 * @param {Number} n 自动取栈数量
 * @param {Boolean} ix 是否为特权指令
 */
function funcSets( f, n, ix ) {
    if ( ix ) f[ACCESS] = true;
    return ( f[EXTENT] = n, f );
}


export {
    EXTENT,
    ACCESS,
    baseMethod,
    bindMethod,
};