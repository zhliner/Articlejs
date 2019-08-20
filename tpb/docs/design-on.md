## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可跟随 `flat()` 调用。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器包含在括号内，如：`click(p[data-id="xxx"])`。**注**：选择器本身不用引号包围。

另外，事件名有两个前置特殊符号的约定：

- 前置句点（`.`）：表示该事件为单次绑定，如：`.click` 的绑定应当是 `$.one("click', ...)`，而非采用 `$.on()`。
- 前置短横线（`-`）：表示该事件为延迟绑定，绑定方法未知（`$.on` 或 `$.one`）。后续的PB序列会被预解析并存储。**注意**：不存在句点（`.`）和短横线（`-`）同时需要的情形。


### 格式

```html
<ul
    on="click |nil;
        click(li) |$('div/?xxx >b'), attr('-val'), pass('abcd');
        .mouserover keyup |$('div/?xxx'), pop, hello('$text')"
>
```

**说明：**

- 事件名可用空格分隔多个同时定义。
- 委托模式与普通模式可混合在一起。
- 前置句点号（`.`）的事件名表示单次执行绑定（`$.one`）。
- 无实参传递的方法可省略括号。
- 除事件名定义外，其它空格是可选的。


### 方法集

`tQuery|Collector` 中的方法仅限于取值（**注**：赋值被设计在 `To:method` 中）。


```js
// 普通取值
//===============================================

pba(): [String]
// PB参数取值。
// 目标：当前条目/栈顶1项。
// 注：
// 元素 data-pb 格式化属性值（-分隔）。

pbo(): [String]
// PB选项取值。
// 目标：当前条目/栈顶1项。
// 注：
// 元素 data-pb 格式化属性值（空格分隔）。

re( str, flag ): RegExp
// 构造正则表达式入栈。
// 传递 str 为 null 时取目标值。
// 目标：当前条目/栈顶1项。

date( ...v ): Date
// 构造日期对象入栈。
// 传递 v 为 null 时，取目标解包传递。
// 目标：当前条目/栈顶1项。

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
get( slr ): Element | null
find( slr, andOwn ): [Element] | null
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
clone( event, deep, eventdeep ): Element
scroll(): {top, left}
scrollTop(): Number
scrollLeft(): Number
hasClass( name ): Boolean
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
classes(): [String]

dataName(): String
selector(): String
tags(): String
objMap(): Object
kvsMap(): [Object2]
range(): [Number] | [String]
now(): Number | String

// Collector专有
//-----------------------------------------------

item( idx ): Value
eq( idx ): Collector
first( slr ): Collector
last( slr ): Collector



// 简单处理
// 目标：当前条目/栈顶1项。
// 注：只是目标自身的操作，无需By/To逻辑。
//===============================================

unwrap()
detach( slr )
remove( slr )
empty()
normalize()
```
