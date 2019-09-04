## Tpb: On

关联事件，获取各种值。值进入流程数据栈向后传递，数据入栈为 `Array.push` 方式，除了 `undefined` 外，每一个指令（方法）的返回值都会自动入栈。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器包含在括号内，如：`click(p[data-id="xxx"])`。**注**：选择器本身不用引号包围。

事件名本身支持字母、数字和 `[._-]` 字符。另外，首字符有两个特殊约定：

- 句点（`.`）：表示该事件为单次绑定，如：`.click` 的绑定应当是 `$.one("click', ...)`，而非采用 `$.on()`。
- 短横线（`-`）：表示该事件为延迟绑定，绑定方法未知（`$.on` 或 `$.one`）。后续的指令序列会被预解析并存储。**注意**：不存在句点（`.`）和短横线（`-`）同时需要的情形。


### 格式用例

```html
<ul id="test" ...
    on="click mouseup;
        click mouseup |nil;
        click(li[data-val='xyz']) contextmenu |$('div/?xxx >b'), attr('-val'), pass('abcd');
        .mouserover -keyup |$('div/?xxx'), text, hello"
>
```

**说明：**

- 事件名可用空格分隔多个同时定义。
- 事件名与后续的指令序列之间用竖线（`|`）分隔。指令序列可选。
- 前置句点（`.`）的事件名表示单次执行绑定（`$.one`）。
- 各指令之间用逗号（`,`）分隔，逗号前后的空格可选（视觉友好）。
- 无实参传递的指令可省略括号。


### 方法集

`tQuery|Collector` 中的方法仅限于取值（**注**：赋值被设计在 `To:method` 中）。


```js
// 普通取值
//===============================================

pba(): [String]
// PB参数取值。
// 目标：当前条目/栈顶1项。
// 返回值：有序的参数词序列。
// 注：
// 即元素data-pb属性的格式化值处理（-后缀）。
// 属性选择器：|=

pbo(): [String]
// PB选项取值。
// 目标：当前条目/栈顶1项。
// 返回值：无序的选项词序列。
// 注：
// 即元素data-pb属性的格式化值处理（空格分隔）。
// 属性选择器：~=

re( str, flag ): RegExp
// 构造正则表达式入栈。
// 传递 str 为 null 时取目标值。
// 目标：当前条目/栈顶1项。

date( ...v? ): Date
// 构造日期对象入栈。
// 目标：当前条目。不自动取栈。
// 目标有值时解包传递 new Data() 实参。
// 注：
// v无值并且目标为空时构造一个当前时间对象。

scam(): Object
// 修饰键是否按下封装（名称简化）。
// {alt, ctrl, shift, meta}
// 目标：针对事件对象，无当前条目要求。



// tQuery|Collector 取值
//-----------------------------------------------
// 目标：当前条目/栈顶1项。
// 如果目标非Collector对象，视为tQuery方法（目标即首个实参）
//
attr( name ): String
prop( name ): String | Number | Boolean
css( name ): String

height(): Number
width(): Number
innerHeight(): Number
innerWidth(): Number
outerWidth(): Number
outerHeight(): Number
next( slr ): Element | null
nextAll( slr ): [Element]
nextUntil( slr ): [Element]
prev( slr ): Element | null
prevAll( slr ): [Element]
prevUntil( slr ): [Element]
children( slr ): [Element] | Element
contents( idx, comment ): [Node] | Node
siblings( slr ): [Element]
parent(): Element | null
parents( slr ): [Element]
parentUntil( slr ): [Element]
closest( slr ): [Element] | null
offsetParent(): Element
scroll(): {top, left}
scrollTop(): Number
scrollLeft(): Number
hasClass( name ): Boolean
classAll(): [String]
val(): Value | [Value] | null
html(): String          // 当前条目支持元素（集）或文本。
text(): String          // 当前条目支持元素（集）或HTML源码
css( name ): String
offset(): {top, left}
position(): {top, left}

// tQuery专有
//-----------------------------------------------
Element(): Element
Text(): Text
create(): DocumentFragment
svg(): Element
table(): Table
is(): Boolean
isXML(): Boolean
isArray(): Boolean
isNumeric(): Boolean
isFunction(): Boolean
isCollector(): Boolean
type(): String
contains(): Boolean
controls(): [Element]
serialize(): [Array2]
queryURL(): String

dataName(): String
selector(): String
tags(): String
objMap(): Object
kvsMap(): [Object2]
range(): [Number] | [String]
now(): Number | String

// Collector专有
//-----------------------------------------------

item( idx ): Value | [Value]
eq( idx ): Collector
first( slr ): Collector
last( slr ): Collector



// 简单处理
// 目标：当前条目/栈顶1项。
// 注：只是目标自身的操作，无需By/To逻辑。
//===============================================

detach( slr )
remove( slr )
unwrap()
empty()
normalize()
```
