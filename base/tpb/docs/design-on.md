# Tpb: On

关联事件，获取各种值。值进入流程数据栈向后传递，数据入栈为 `Array.push` 方式，除了 `undefined` 外，每一个指令（方法）的返回值都会自动入栈。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器定义在小括号内，如：`click(p[data-id="xxx"])` 中的 `p[data-id="xxx"]`。选择器自身无需引号包围。

事件名是一个标识串，首字母为字母，之后可以是字母、数字和 `[._:-]` 字符。另外，可前置一个特殊字符以表达固定的含义：

- `^`：表示该事件为单次绑定。如：`^click` 的绑定应当是 `$.one("click', ...)`，而非采用 `$.on()`。
- `@`：预定义调用链。该调用链不会被立即使用，实际上它只是一个存储（与当前元素关联），用户可在任意元素的 `To` 段定义中使用 `bind/once` 指令来运用它（检索并绑定）。


## 格式用例

```html
<ul id="test" ...
    on="click|attr('title') debug avoid;
        click(li[data-val='xyz']) contextmenu | ...;
        ^click|$('div/#xxx'), debug(false);
        @mousemove:1 @keydown:1|...;
        "
>
```

**说明：**

- 事件名可用空格分隔多个同时定义。
- 事件名与后续的取值指令序列之间用竖线（`|`）分隔，`|` 两侧的空格是可选的。
- 指令序列是可选，若无指令序列，`|` 可省略。
- 各指令之间用空格（`_`）分隔，多余的空白会被忽略。
- 无实参传递的指令可省略括号。
- 前置 `^` 的事件名表示单次执行绑定（`$.one`）。
- 预存储调用链的事件名前置 `@` 字符，名称之后的冒号 `:` 用于分隔标识ID（可选，不应有空格）。

> **注：**<br>
> 预存储的调用链事件名后需要包含ID标识，是因为相同的事件可以多次绑定到同一个元素上，需要区分。<br>
> 这个ID值是任意的（字母或数字，由 `To:bind|once` 使用），如果一个元素不用同时绑定多个相同的事件名，它就是可选的。<br>


## 取值指令

从流程数据（即目标）中取值，提取的值被自动压入栈顶。`tQuery|Collector` 中的方法仅限于取值，赋值能力被设计在 `To:Update` 中。


### 普通取值

```js
// 基本取值。
//-----------------------------------------------

$( rid:String ): Element
// 检索单个元素入栈。

$$( rid:String|Value ): Collector
// 检索元素集入栈。

evo( name:String|Number ): Value
// 从当前evo对象上取值入栈。
// name: {
//      0|'event'     evo.event
//      1|'target'    evo.target
//      2|'current'   evo.current
//      3|'delegate'  evo.delegate
//      4|'selector'  evo.selector
//      6|'data'      evo.data （指令当前流程数据）
//      7|'entry',    evo.entry （中段入口，迭代重入）
//      8|'primary'   evo.primary （To检索结果，初始更新目标）
//      9|'updated'   evo.updated （To更新目标）
// }

ev( name?:String ): Value|[Value]
// 从事件对象上取值入栈。

get( name:String ): Value | [Value]
// 对象成员取值。

gets( ...name:String ): void
// 对象成员自由取值。

call( meth:String, ...rest:Value ): Value
// 调用目标的方法。

calls( meths:String, ...args:Value ): [Value]
// 调用目标的多个方法。

vals( ...name:String ): Object{name:value}
// 获取目标名称的控件值集。



// 类型转换&构造。
// 目标：暂存区/栈顶1项。
// 返回值而非该类型的对象，基本转换支持数组操作（针对成员）。
//-----------------------------------------------

int( radix ): Number
// 将字符串转为整数，即 parseInt()

float(): Number
// 将字符串转为浮点数，即 parseFloat()

re( flag: String ): RegExp
// 将字符串转为正则表达式。

bool( all:Boolean ): Boolean
// 转换为布尔值（false|true）

str( prefix?, suffix? ): String
// 转换为字符串。

arr(): Array
// 转换为数组。

Arr( wrap:Boolean ): Array
// 转换/封装为数组。

obj(): Object
// 将目标转换为普通对象。

array( size, ...vals ): Array
// 创建预填充值数组（size大小）。

assign( target:Object, names?:String ): Object
// 对象克隆赋值。

gather( names:String ): Object
// 数组映射聚集。

els( tag:String, n:Number ): Element | [Element]
// 批量创建元素。

clone( event:?, deep?:, eventdeep?:Boolean ): Element|Collector
// 元素克隆。

Element( tag:String ): Element | Collector
// 创建元素。

elem( tag:String ): Element | Collector
// 简单创建元素。

svg( tag?:String ): Element | Collector
// 创建SVG域元素。

wrapAll( box:String ): Collector
// 元素集封装。

einfo( hasid:Boolean, hascls:Boolean ): String | [String]
// 生成元素基本信息。

currentRange( force:Boolean ): Range
// 获取当前选区。

containRange( el:Element|String ): Boolean
// 选区是否在元素之内。



// 复杂取值。
//-----------------------------------------------

tpl( name:String, clone?:Boolean ): Promise<Element>
// 获取name模板节点。

node( name:String, clone?:Boolean ): Element | [Element|null] | null
// 获取模板节点（集）。

keys(): [Value]
// 获得键数组。

values(): [Value]
// 获取值数组。

func( ...argn: String ): Function
// 创建函数入栈。



// Tpb专有取值。
//-----------------------------------------------

pba(): [String]
// PB参数取值（|=）。

pbo(): [String]
// PB选项取值（~=）。

pdv(): String
// PB属性取值。

Data( name: String ): void|Value
// 关联数据取出。

Map( n:Number ): Map
// 构造Map实例。

Set( n:Number ): Set
// 构造Set实例。

date( ...args? ): Date
// 构造日期对象入栈。

scam( names?:String ): Boolean | Object
// 修饰键{Alt|Ctrl|Shift|Meta}状态检查|封装。

acmsk(): String
// 构建组合键序列：alt+ctrl+shift+meta:[key]。

hotkey(): HotKey
// 返回系统快捷键处理器。

chain( evnid:String, clone:Boolean ): Cell
// 预绑定调用链提取（单个）。

chains( evnid:String, clone:Boolean ): Map<evnid:Cell>
// 预绑定调用链提取。

timeOut( delay:Number|null, ...args ): timeoutID | void
// 创建/清除计时器（单次：setTimeout）。

timeTick( delay:Number|null, ...args ): intervalID | void
// 创建/清除计时器（持续：setInterval）。

movementX( v?:null ): Number | void
movementY( v?:null ): Number | void
// 鼠标移动量取值。

scrolledX( v:?null ): Number | void
scrolledY( v:?null ): Number | void
// 内容滚动量取值。
```


### tQuery取值

```js
// tQuery|Collector兼有
// 目标非Collector时为tQuery方法（目标即首个实参）。
//-----------------------------------------------

// 目标：当前条目/栈顶1项。
// 参数固定：1。
attr( name ): String | null
attribute( name ): String | Object | null
prop( name ): Value | undefined
property( name ): Value | Object | undefined
css( name ): String
cssGets( name ): Object
xattr( names:String|[String] ): String | Object | [String|null] | [Object] | null

// 目标：当前条目/栈顶1项
// 参数固定：0。
height(): Number
width(): Number
scroll(): {top, left}
scrollTop(): Number
scrollLeft(): Number
offset(): {top, left}
val(): Value | [Value] | null
html(): String      // 目标支持文本。
text(): String      // 目标支持HTML源码

// 目标：当前条目/栈顶1项
// 参数不定。
// 注：多余实参无副作用。
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


// tQuery专有
//-----------------------------------------------

// 目标：当前条目，可选。
// 如果目标有值，合并在实参之后传递。
Element( tag?:String, data?:String|[String]|Object ): Element
svg( tag?:String, opts?:Object ): SVG:Element
Text( text?:String ): Text
create( html?:String ): DocumentFragment
table( rows?, cols?:Number, cap?:String, th0?:Boolean ): $.Table
dataName( attr?:String ): String
tags( code?:String ): String
selector( tag?, attr?, val?, op?:String ): String
range( beg?:Number|String, size?:Number|String, step?:Number ): [Number]|[String]
now( json?:Boolean ): Number|String

// 目标：当前条目/栈顶1项。
// 内容：参考tQuery相关接口首个参数定义。
// 注：多余实参无副作用。
is( slr:String ): Boolean
isXML(): Boolean
controls(): [Element]
serialize( ...names? ): [Array2]
queryURL(): String
isArray(): Boolean
isNumeric(): Boolean
isFunction(): Boolean
isCollector(): Boolean
type(): String
kvsMap( kname?, vname?: String ): [Object2]


// Collector专有
//-----------------------------------------------

// 目标：当前条目/栈顶1项。
// 内容：Value|[Value]|Collector
// 注意：如果目标不是Collector对象，会自动封装为Collector。
item( idx? ): Value | [Value]
first( slr? ): Collector
last( slr? ): Collector
```


### 元素自身行为

此部分为对元素自身的简单改变，不涉及需要额外的数据，因此归为 `On` 而非 `To` 的逻辑。

```js
// UI表现。
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////

hide( sure?:Boolean )       // 元素隐藏，对应CSS visibility:hidden。
lose( sure?:Boolean )       // 元素显示丢失，对应CSS display:none。
disable( sure?:Boolean )    // 元素失活，模拟表单控件的 disabled 外观（灰化）。
fold( sure?:Boolean )       // 元素折叠，除:first-child之外的子元素 display:none。
truncate( sure?:Boolean )   // 截断，即后续兄弟元素 display:none
full( sure?:Boolean )       // 充满容器。需要定义容器元素 position 样式非 static。
// 注：
// 传递 sure 为假值可反向表现，即取消该表现。
// 默认 sure 为真值。


// 自身操作。
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////

wrap( box:String ): Element | Collector
wrapinner( box:String ): Element | Collector
wrapall( box:String ): Element | Collector
// 节点封装。
// 与To中的同名方法不同，这里仅支持字符串模板实参。

remove( slr?:String|Boolean, back?:Boolean ): void | data
normalize( depth?:Number|Boolean, back?:Boolean ): void | data
empty( back?:Boolean ): void | data
unwrap( back?:Boolean ): void | data
// slr: 选择器或入栈指示。
// back: 被移除的节点是否入栈。
// data: 被移除的节点/集或展开（unwrap）的节点集。

intoViewX( pos:Number|String): void
intoViewY( pos:Number|String): void
intoView( x, y:Number|String): void
// 滚动到当前视口。
```
