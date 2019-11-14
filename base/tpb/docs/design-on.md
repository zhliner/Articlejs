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

re( flag ): RegExp
// 构造正则表达式入栈。
// 目标：当前条目/栈顶1项。

date( ...v? ): Date
// 构造日期对象入栈。
// 目标：当前条目。不自动取栈。
// 目标有值时解包传递 new Data() 实参。
// 注：
// v无值并且目标为空时构造一个当前时间对象。

scam( names? ): Object
// 修饰键 {alt, ctrl, shift, meta} 是否按下封装或检查。
// 目标：当前条目，可选。
// 如果 names 或暂存区有值则为检查，否则为简单封装。
// names 支持空格分隔的多个名称，全小写。



// tQuery|Collector 取值
//-----------------------------------------------
// 目标：当前条目/栈顶1项。
// 如果目标非Collector对象，视为tQuery方法（目标即首个实参）
//
attr( name ): String | Object | null
attribute( name ): String | null
prop( name ): Value | Object | undefined
property( name ): Value | undefined
css( name ): String
cssGets( name ): Object
// 参数固定：1。

height(): Number
width(): Number
scroll(): {top, left}
scrollTop(): Number
scrollLeft(): Number
offset(): {top, left}
val(): Value | [Value] | null
html(): String      // 目标支持文本。
text(): String      // 目标支持HTML源码
// 参数固定：0。

innerHeight(): Number
innerWidth(): Number
outerWidth( margin? ): Number
outerHeight( margin? ): Number
next( slr?, until? ): Element | null
nextAll( slr? ): [Element]
nextUntil( slr? ): [Element]
prev( slr?, until? ): Element | null
prevAll( slr? ): [Element]
prevUntil( slr? ): [Element]
children( slr? ): [Element] | Element
contents( idx?, comment? ): [Node] | Node
siblings( slr? ): [Element]
parent( slr? ): Element | null
parents( slr? ): [Element]
parentsUntil( slr ): [Element]
closest( slr ): Element | null
offsetParent(): Element
hasClass( name ): Boolean
classAll(): [String]
position(): {top, left}
// 参数不定。
// 多余实参无副作用。


// tQuery专有
//-----------------------------------------------

Element( tag: String, data: String|[String]|Object ): Element
svg( tag: String, opts: Object ): SVG:Element
// 目标/参数：2，可选。

Text( text: String ): Text
create( html: String ): DocumentFragment
dataName( attr: String ): String
tags( code: String ): String
// 目标/参数：1，可选。

is( el: Element, slr: String ): Boolean
isXML( el: Element ): Boolean
controls( frm: Element ): [Element]
serialize( frm: Element, incl: [String] ): [Array2]
queryURL( its: Object|Element ): String
isArray( val: Value ): Boolean
isNumeric( val: Value ): Boolean
isFunction( its: Any ): Boolean
isCollector( its: Value ): Boolean
type( its: Any ): String
kvsMap( map: Map, kname?, vname?: String ): [Object2]
// 目标/参数：1，当前条目/栈顶1项。
// 多余实参无副作用。


table( rows, cols: Number, cap: String, th0: Boolean ): Table
selector( tag, attr?, val?, op?: String ): String
now( json: Boolean ): Number | String
// 目标：无。


contains( box: Element, node: Node ): Boolean
// 目标/参数：[1, 2]，当前条目/栈顶2项。
// 定制。

range( beg, size: Number|String, step: Number ): [Number] | [String]
// 构建范围值数组。
// 目标/参数：1|2|3，可选。
// beg传递null表示取流程数据。
// beg若为undefined，表示取流程数据为全部实参。


// Collector专有
//-----------------------------------------------

item( idx ): Value | [Value]
eq( idx ): Collector
first( slr ): Collector
last( slr ): Collector
// 目标：调用者，当前条目/栈顶1项。



// 简单处理。
// 只是目标自身的操作，无需By/To逻辑。
//===============================================

detach( node, slr )
remove( node, slr )
unwrap( el )
empty( el )
normalize( el )
// 目标/参数：1，当前条目/栈顶1项。
// 需要兼容Collector实例。
```
