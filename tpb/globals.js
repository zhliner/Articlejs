//
//  全局配置。
//
///////////////////////////////////////////////////////////////////////////////

const
    DEBUG = true,   // 测试模式

    // 根目录配置
    Dir = {
        setup:      '/',            // 网站安装根目录
        template:   'templates/',   // 模板根目录
    },

    // 特性支持
    Support = {
        template: false,    // 模板（tpl-name|load）
        render:   false,    // 渲染（tpb-each|if...）
    },

    // 模板映射
    // 用于从模板名查询所属文件（导入）。
    // { 文件名：[模板名] }
    tplsMap = {
        // 'file-name.js': [tpl-name1, tpl-name2],
    };



const
    // OBT属性名定义
    OBTA = {
        on:     'on',   // On-Attr
        by:     'by',   // By-Attr
        to:     'to',   // To-Attr
    },

    // 指令属性：自动取栈计数
    EXTENT = Symbol('stack-amount'),

    // 指令属性：特权方法（操作数据栈）
    ACCESS = Symbol('stack-access');



//
// 工具函数。
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取绑定的（bound）方法。
 * - 处理取栈条目数（[EXTENT]），由前置两个下划线的属性表达。
 * - 处理特权设置（[ACCESS]），由前置两个下划线和_x结尾的属性表达。
 * 注记：
 * 创建已绑定的全局方法共享，节省内存。
 *
 * @param  {Function} f 方法
 * @param  {String} k 方法名
 * @param  {Object} obj 宿主对象
 * @return {[Function,]} 值/键对（键忽略）
 */
 function bindMethod( f, k, obj ) {
    if ( !k.length || k.startsWith('__') ) {
        return;
    }
    return [ funcSets(f.bind(obj), obj[`__${k}`], obj[`__${k}_x`]) ];
}


/**
 * 指令/方法属性设置：{
 *  - [ACCESS] 是否为特权方法。
 *  - [EXTENT] 自动取栈条目数。
 * }
 * @param  {Function} f 目标指令
 * @param  {Number} n 自动取栈数量
 * @param  {Boolean} ix 是否为特权指令
 * @return {Function}
 */
function funcSets( f, n, ix ) {
    if ( ix ) f[ACCESS] = true;
    return ( f[EXTENT] = n, f );
}


export {
    Dir,
    DEBUG,
    OBTA,
    EXTENT,
    ACCESS,
    bindMethod,
    Support,
    tplsMap,
};