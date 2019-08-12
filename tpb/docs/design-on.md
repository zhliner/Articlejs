## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可跟随 `flat()` 调用。

**条目空间**是一个即时的栈内数据取出临时存放区，用于向后面的方法提供操作目标，它们是即时和一次性的（全用即空）。方法首先向条目空间寻求操作目标，如果为空，则自动取数据栈顶端的条目（通常是取出而不是引用/复制）。这一设计可以让操作目标的选取独立出来，更灵活也让方法的参数更少。所有的方法的返回值（除了 `undefined`）都会自动入栈。

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


// 普通取值方法
//===============================================

env( name ): Value
// 从环境取值入栈。

tpl( name ): Collector
// 封装条目空间条目为命名模板。创建一个集合入栈。
// 主要用于By部分对可原地更新的元素（集）执行渲染。


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


// 数据构造（简单）

RE( flag, str ): RegExp         // 构造正则表达式
slr( attr, val, op, tag )       // 构造CSS选择器串
scam( ev ): Object              // 修饰键状态封装（Alt/Ctrl/Shift/Meta）
date( v1, ...rest ): Date       // 构造日期/时间对象




/////////////////////////////////////////////////
// 全局方法。
// 可用于 On/By 段内。
/////////////////////////////////////////////////

flag( name, $val? ): void
// 标志设置或取值。
// $val支持首字符特殊指引，针对条目空间目标取值。
// $val未定义时为取值入栈。
// 注意！
// 条目空间空值不自动取栈，特殊的$val值视为字面量。

pass( val?, $name? ): void
// 通过性检测，否则中断执行流。
// 条目空间有值则该值为测试目标，否则取出栈顶成员测试。
// val:
//      有值则为相等（===）测试，否则为真值测试。
// $name:
//      进阶取目标的值用于对比，支持首字符特殊指引。

nil(): void
// 一个空行为，占位。
// 既不从条目空间取值，也不向数据栈添加值。
// 通常在On无需取值时作为视觉友好使用。如：click|nil;

put( $val ): Value | [Value]
// 简单传值入栈。
// 如果$val为特殊指引，针对条目空间目标取值。
// 条目空间里的条目本身可能是一个集合。
// 注意！
// 条目空间空值不自动取栈，特殊的$val值视为字面量。


// 条目空间赋值
//===============================================

pop( n ): void
// 弹出栈顶 n 个条目，构建为一个Collector赋值。
// 无实参调用弹出末尾条目，作为单个值赋值。
// 即：pop() 和 pop(1) 的返回值不一样。
// pop(0) 不会弹出任何内容，但会在条目空间创建一个空集。
//
// 弹出：单值|集合。

slice( begin, end ): void
// 复制数据栈某区段条目，构造为一个Collector赋值。
// 两个下标位置支持负数。
//
// 克隆：任意区段，集合。

item( idx ): void
// 引用数据栈idx位置的单个值赋值到条目空间。
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
// 移除数据栈idx位置的单个值赋值到条目空间。
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
// 注：移除的值不会进入条目空间。



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
// 条目空间/队尾值为真时执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引。
// 注：
// vback 为跳过状态时回送入栈的值，可选。
// 执行状态时回送值无效，因为此时是代码的执行结果入栈。

vfalse( $ccode, vback ): Value | vback
// 条目空间/队尾值为假时执行，否则跳过。
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

both( $code ): Boolean
// 条目2项为真测试，结果入栈。
// $code 测试代码或函数索引，可选。默认简单真值判断。

every( $code ): Boolean
// 条目空间目标全部为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。

either( $code ): Boolean
// 条目2项任一为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。

some( n, $code ): Boolean
// 条目空间至少 n 项为真测试，结果入栈。
// $code 测试代码或函数索引，可选同上。

```
