## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可添加 `flat()` 方法。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器包含在括号内，如：`click(p[data-id="xxx"])`，选择器本身**不用**引号包围。

> **注**：<br>
> `tQuery|Collector` 中的方法仅限于取值（赋值被设计在 `To:method` 中）。


**方法集：**

```js
/////////////////////////////////////////////////
// 局部方法。
// 仅适用于 On 部分。
/////////////////////////////////////////////////

// 元素检索取值（基础）
//===============================================

$( rid ): Element
// tQuery.get(...)
// rid: {String|Number|null}
// - 相对ID，null为取流程数据（String）。
// - 数值表示取事件关联的元素或值：{
//      0   origin 事件起点元素
//      1   current 冒泡到的当前元素
//      2   delegate 定义委托的元素
//      3   ev.detail 自定义事件传递的数据
// }

$$( rid ): Collector
// tQuery(...)
// rid: {String|Number|null}
// - 含义同上。非字符串也可被封装为Collector。
// - 数值实参含义同上，事件关联元素被打包为Collector。


// 集合成员删除
//===============================================

remove( start, count )
// 删除任意位置段成员，位置指定支持负数从末尾算起。
// 注：即数组 .splice() 方法的纯删除。
shift()
// 删除集合第一个成员。同 remove(0, 1)


// 普通取值方法
//===============================================

// tQuery：数据创建

Elem()      // 创建元素（tQuery.Element）
Text()      // 创建文本节点（tQuery.Text）
create()    // 创建文档片段（DocumentFragment）
svg()       // 创建SVG元素（tQuery.svg）
table()     // 创建表格实例（$.Table）
range()     // 构造范围序列
now()       // 获取时间戳

isXML()     // 是否为XML节点
queryURL()  // 构建URL查询串
get( slr )  // 在流程元素（集）上下文中查询单个目标
find( slr ) // 在流程元素（集）上下文中查询多个目标并合并

next()

tags()      // 转为标签字符串（[] to <>）
html()      // 转换为HTML源码（< 到 &lt;）
text()      // 转换为文本（&lt; 到 <）
val()       // 按表单逻辑取值（disabled者为null）


form( rid, ...exclude ): [Array]    // 获取表单内可提交的控件[名,值]。exclude 排除的控件名序列


// 元素（集）简单取值类

attr( name, rid ): Value|[Value]    // 特性取值
prop( name, rid ): Value|[Value]    // 属性取值
css( name, rid ): Value|[Value]     // 样式取值（计算后）

clss( rid ): [String]               // 取类名集，非 attr('class') 的值
pba( rid ): [String]                // PB属性取值（参数）
pbo( rid ): [String]                // PB属性取值（选项）

pick( ...idx ): Value               // 从流程集合中取值
env( ev, name ): Value              // 从环境取值
tpl( $name ): Element               // 请求模板节点


// 数据构造（简单）

RE( flag, str ): RegExp         // 构造正则表达式
slr( attr, val, op, tag )       // 构造CSS选择器串
scam( ev ): Object              // 修饰键状态封装（Alt/Ctrl/Shift/Meta）
date( v1, ...rest ): Date       // 构造日期/时间对象

Arr( op ): Array                // 转换为数组
Str( prefix, suffix ): String   // 转换为字符串
Num( spec ): Number             // 转换为数值
Bool(): Boolean                 // 转换为布尔值（false|true）

Int( str, radix )               // 将字符串转为整数。即 parseInt()
Float( str )                    // 将字符串转为浮点数。即 parseFloat()



/////////////////////////////////////////////////
// 全局方法。
// 可用于 On/By/To 段内。
/////////////////////////////////////////////////

pass( name, val )
// 通过性检测，否则中断执行流。
// val:
//      有值则为相等测试，否则为真值测试。假包含：false,'',null,0,undefined。
// name:
//      {String}    全局flag标记空间目标。
//      {Number}    流程数据集下标位置目标，支持负数。
//      undefined   流程数据自身真值测试。
//      null        流程数据本身为目标，通常会有val实参。

nil()
// 一个空行为，占位。

flag( name, $val )
// 标志设置或取值。
// $val支持动态目标辨识（首个特殊字符），从实参空间取值。
// $val未定义时为取值入栈。


// 实参空间赋值
//===============================================

pop( n = 1 )
// 弹出数据栈末尾 n 个成员到实参空间。

splice( start, count )
// 移除数据栈某区段成员到实参空间。
// 注：下标位置支持负数。

slice( begin, end )
// 复制数据栈某区段成员到实参空间。
// 注：下标位置支持负数。

item( idx )
// 引用数据栈特定位置的单个值到实参空间。

pick( idx )
// 取出数据栈特定位置的单个值到实参空间。
// 目标位置的值会被删除，即：splice(n, 1)[0]


// 原地操作（替换）
//===============================================

sort( $code )
// 数据栈排序。
// code为比较函数体，null表示采用默认规则。
// 参数名固定：(a, b)。

flat( depth = 1, all = false)
// 数据栈扁平化，可指定最深层级。
// all为真表示整个数据栈，否则默认指上一次添加的集合。
// 实现：Arr.push( ...Arr.pop() )
// 如果最后一次入栈的不是集合，调用会出错。
// 注：
// 这是入栈模式由concat改为push的细粒度分解要求。
```
