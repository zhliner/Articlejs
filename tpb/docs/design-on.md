## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可跟随 `flat()` 调用。

通常，栈内数据需要取出以作为后续方法操作的目标，取出的数据被称为**即时条目**，存放该条目的地方称为**暂存区**。暂存区是一次性使用逻辑，用过即空。如果暂存区没有操作目标，系统会自动从栈顶取值（是取出而不是引用）。这一设计可以让操作目标的选取独立出来，更灵活也让方法的参数更少。所有的方法的返回值（除了 `undefined`）都会自动入栈。

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


// 取值&构造
//===============================================

env( name ): Value
// 从环境取值入栈。

tpl( name ): Collector
// 封装即时条目为命名模板。创建一个Collector入栈。
// 主要用于By部分对可原地更新的元素（集）执行渲染。

RE( flag, str ): RegExp     // 构造正则表达式
scam( ev ): Object          // 修饰键状态封装（Alt/Ctrl/Shift/Meta）
date( v1, ...rest ): Date   // 构造日期/时间对象

pba( rid ): [String]        // PB属性取值（参数）
pbo( rid ): [String]        // PB属性取值（选项）


get( $val ): Value | [Value]
// 通用取值入栈。
// 如果$val为特殊指引，针对即时条目取值（可能是一个集合）。
// 注意！
// 暂存区无值时不自动取栈，特殊的$val值视为字面量。
//
// tQuery|Collector可用成员清单
//-----------------------------------------------
// 如果目标非Collector对象，视为tQuery方法，目标为首个实参
//
// attr( name ): Value|[Value]
// prop( name ): Value|[Value]
// css( name ): Value|[Value]
// text(): String | [Node]
// html(): String | [Node]
height()
width()
val()
children( slr )
clone( ...rest )
contents( slr)
innerHeight()
innerWidth()
outerWidth()
outerHeight()
get( slr )
find( slr )
next()
prev()
prevAll()
nextAll()
siblings()
offset()
position()
scrollLeft()
scrollTop()
parent()
offsetParent()

// tQuery专有提供
//-----------------------------------------------
Elem()      // 创建元素（tQuery.Element）
Text()      // 创建文本节点（tQuery.Text）
create()    // 创建文档片段（DocumentFragment）
svg()       // 创建SVG元素（tQuery.svg）
table()     // 创建表格实例（$.Table）
range()     // 构造范围序列
now()       // 获取时间戳
classes()

isXML()     // 是否为XML节点
queryURL()  // 构建URL查询串
tags()      // 转为标签字符串（[] to <>）




/////////////////////////////////////////////////
// 全局方法。
// 可用于 On/By 段内。
/////////////////////////////////////////////////

flag( name, $val? ): void
// 标志设置或取值。
// $val支持首字符特殊指引，针对即时条目取值。
// $val未定义时为取值入栈。
// 注意！
// 暂存区无值时不自动取栈，特殊的$val值视为字面量。

pass( val?, $name? ): void
// 即时条目通过性检测，否则中断执行流。
// val:
//      有值则为相等（===）测试，否则为真值测试。
// $name:
//      进阶取目标的值用于对比，支持首字符特殊指引。

nil(): void
// 一个空行为，占位。
// 既不从暂存区取值，也不向数据栈添加值。
// 通常在On无需取值时作为视觉友好使用。如：click|nil;


// 暂存区赋值
//===============================================

pop( n ): void
// 弹出栈顶 n 个条目，构建为一个Collector赋值。
// 无实参调用弹出末尾条目，作为单个值赋值。
// 即：pop() 和 pop(1) 的返回值不一样。
// pop(0) 不会弹出任何内容，但会创建一个空集赋值。
//
// 弹出：单值|集合。

slice( begin, end ): void
// 复制数据栈某区段条目，构造为一个Collector赋值。
// 两个下标位置支持负数。
//
// 克隆：任意区段，集合。

item( idx ): void
// 引用数据栈idx位置的单个值赋值到暂存区。
//
// 克隆：任意位置，单值。


// 下面的方法会移除栈内条目
//-----------------------------------------------
// 逻辑上这不是栈操作，但JavaScript中的数组提供了这种能力。
// 因此这里提供相关方法，应该不常用。

shift( n ): void
// 移除栈底 n 个条目，构建为一个Collector赋值。
// 无实参调用移除首个条目，作为单个值赋值。
// 即：shift() 和 shift(1) 返回值不同。
//
// 移除：单值|集合。

splice( start, count ): void
// 移除数据栈某区段条目，构造为一个Collector赋值。
// start下标位置支持负数。
//
// 移除：任意区段，集合。

pick( idx ): void
// 移除数据栈idx位置的单个值赋值到暂存区。
// 效果同：splice(idx, 1)[0]
//
// 移除：任意位置，单值。


// 数据栈原地操作
//===============================================

sort( $code ): void
// 数据栈排序。
// $code为比较函数体，null表示采用默认规则。
// 参数名固定：(a, b)。
// $code支持首字符（!）特殊指引，引用X函数库成员。

flat( depth = 1, all = false): void
// 数据栈扁平化，可指定最深层级。
// all为真表示整个数据栈，否则默认指上一次添加的集合。
// 实现：Arr.push( ...Arr.pop() )
// 如果最后一次入栈的不是集合，调用会出错。
// 注：
// 这是入栈模式由concat改为push的细粒度分解要求。

del( start, count ): void
// 删除栈任意位置段条目，位置指定支持负数从末尾算起。
// count 可选，默认删除到末尾。
// 即 splice() 的纯删除版。
// 注：移除的值不会进入暂存区。



// 基本类型转换
//===============================================

Arr( op ): Array                // 转换为数组
Str( prefix, suffix ): String   // 转换为字符串
Bool(): Boolean                 // 转换为布尔值（false|true）
Int( str, radix ): Number       // 将字符串转为整数。即 parseInt()
Float( str ): Number            // 将字符串转为浮点数。即 parseFloat()


// 判断执行。
//===============================================
// - vtrue(...) 简单的 if 逻辑。
// - vtrue(..., true)  模拟 else 逻辑，后跟 vtrue()。
// - vtrue(..., false) 模拟 else 逻辑，后跟 vfalse()。
// - vtrue(..., xxx) 可模拟 switch/case 逻辑，后跟比较类方法。

vtrue( $code, vback ): Value | vback
// 即时条目为真时执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引。
// 注：
// vback 为跳过状态时回送入栈的值，可选。
// 执行状态时回送值无效，因为此时是代码的执行结果入栈。

vfalse( $ccode, vback ): Value | vback
// 即时条目为假时执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引。
// vback 参数含义同上。



// 简单运算
//===============================================

add(): Number     // 条目2项：(x, y) => x + y
sub(): Number     // 条目2项：(x, y) => x - y
mul(): Number     // 条目2项：(x, y) => x * y
div(): Number     // 条目2项：(x, y) => x / y
mod(): Number     // 条目2项：(x, y) => x % y

divmod( flat:Number ): [Number, Number]
// 除并求余。
// 条目2项：(x, y) => [x/y, x%y]
// flat 表示扁平化展开的层级，通常为1，0值不展开（集合入栈）。

negate( n:Number, flat:Number ): Number | [Number]
// 取负（-x）。
// 取出 n 个条目取负后入栈。
// 无实参调用返回单个值，否则返回一个集合。
// flat 含义同上。

not( n:Number, flat:Number ): Boolean | [Boolean]
// 取反（!x）。
// 取出 n 个条目取反后入栈。
// 无实参调用返回单个值，否则返回一个集合。
// flat 含义同上。

dup( n:Number, flat:Number ): Value | [Value]
// 复制。
// 引用 n 个条目克隆后入栈。
// 无实参调用返回单个值，否则返回一个集合。
// flat 含义同上。


// 比较&逻辑运算
//===============================================

equal(): Boolean    // 条目2项：(x, y) => x === y
nequal(): Boolean   // 条目2项：(x, y) => x !== y
lt(): Boolean       // 条目2项：(x, y) => x < y
lte(): Boolean      // 条目2项：(x, y) => x <= y
gt(): Boolean       // 条目2项：(x, y) => x > y
gte(): Boolean      // 条目2项：(x, y) => x >= y


within( min, max ): Boolean
// 条目1项：val in [min, max]

isAnd( $code ): Boolean
// 条目2项为真测试，结果入栈。
// $code 测试代码或函数索引，可选。默认简单真值判断。

isOr( $code ): Boolean
// 条目2项任一为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。

every( $code ): Boolean
// 集合成员全部为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。
// 注：即时条目需要是一个集合。

some( n, $code ): Boolean
// 集合成员至少 n 项为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。
// 注：即时条目需要是一个集合。

```
