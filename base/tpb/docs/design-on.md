## Tpb: On

关联事件，获取各种值。值进入流程数据栈向后传递，数据入栈为 `Array.push` 方式，除了 `undefined` 外，每一个指令（方法）的返回值都会自动入栈。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器定义在小括号内，如：`click(p[data-id="xxx"])` 中的 `p[data-id="xxx"]`。选择器自身的引号包围是可选的。

事件名是一个标识串，首字母为字母，之后可以是字母、数字和 `[._:-]` 字符。另外，可前置两个特殊字符以表达特别含义：

- `^`：表示该事件为单次绑定。如：`^click` 的绑定应当是 `$.one("click', ...)`，而非采用 `$.on()`。
- `@`：预定义调用链。该调用链不会被立即使用，实际上它只是一个存储（与当前元素关联），用户可在任意元素的 `To` 段定义中使用 `bind/once` 指令来运用它（检索并绑定）。


### 格式用例

```html
<ul id="test" ...
    on="click|attr('title') debug avoid;
        click(li[data-val='xyz']) contextmenu | ...;
        ^click|$('div/?xxx'), debug(false);
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


### 方法集

从流程数据（即目标）中取值，提取的值被自动压入栈顶。`tQuery|Collector` 中的方法仅限于取值，赋值能力被设计在 `To:Method` 中。


#### 普通取值类

```js
pba(): [String]
// PB参数取值。
// 目标：当前条目/栈顶1项。
// 返回值：有序的参数词序列。
// 注：
// 即元素data-pb属性值的参数部分（-后缀）。
// 属性选择器：|=

pbo(): [String]
// PB选项取值。
// 目标：当前条目/栈顶1项。
// 返回值：无序的选项词序列。
// 注：
// 即元素data-pb属性值的选项部分（空格分隔）。
// 属性选择器：~=

pdv(): String
// PB属性取值。
// 目标：当前条目/栈顶1项。
// 注：
// 即元素data-pb属性的整个值（完整字符串）。

date( ...args? ): Date
// 构造日期对象入栈。
// 目标：当前条目。不自动取栈。
// 目标有值时解包传递为 new Data() 的补充实参。
// 注：
// args无值并且目标为空时构造为一个当前时间对象。

scam( names?:String ): Boolean | Object
// 修饰键 Alt|Ctrl|Shift|Meta} 按下检查或状态封装。
// 目标：当前条目，可选。
// 如果names或暂存区有值则为检查，否则为简单封装。
// names支持空格分隔的多个名称，全小写，And关系。

movementX( v?:null ): Number | void
movementY( v?:null ): Number | void
// 鼠标移动量取值。
// 目标：无。
// 注记：
// mousemove 事件中 movementX/Y 的值在缩放显示屏下有误差（chrome）。
// 因此另外用绝对像素参数（event.pageX/pageY）重新实现。
// 前值存储在事件当前元素（evo.current）上，解绑时应当重置（null）。

scrollX( v:?null ): Number | void
scrollY( v:?null ): Number | void
// 内容滚动量取值。
// 目标：当前条目，可选。
// 支持指定目标滚动元素，如果目标为空，则取事件当前元素。
// 前值存储在事件当前元素上，因此目标元素的滚动量是特定于当前事件的。
// 通常在事件解绑时移除该存储（传递null）。
// 注记：
// 文档内容的滚动有多种途径，鼠标的wheel不能响应键盘对内容的滚动。
```


#### tQuery 取值类

```js
// tQuery|Collector兼有
// 目标非Collector时为tQuery方法（目标即首个实参）。
//-----------------------------------------------

// 目标：当前条目/栈顶1项。
// 参数固定：1。
attr( name ): String | Object | null
attribute( name ): String | null
prop( name ): Value | Object | undefined
property( name ): Value | undefined
css( name ): String
cssGets( name ): Object

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
eq( idx? ): Collector
first( slr? ): Collector
last( slr? ): Collector
```


#### tQuery 集合操作

集合操作是对目标数据集进行简单的处理，然后返回一个结果集。

```js
// tQuery|Collector兼有
// 目标为Collector时返回Collector，否则返回普通数组。
//-----------------------------------------------

filter( fltr: String|Function ): [Value]|Collector
// 值集过滤。
// 匹配者构建一个新数组入栈，适用元素和普通值集。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项：[集合, 过滤器]
// 注：返回值类型与目标值类型相同。

not( fltr: String|Function ): [Value]|Collector
// 值集排除。
// 符合者被排除，剩余的创建为一个新集合入栈。
// 适用元素和普通值集。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项操作：(集合, 过滤器)
// 注：返回值类型与目标值类型相同。

has( slr: String ): [Element]|Collector
// 子成员包含。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项操作：(集合, 过滤器)
// 注：
// 仅适用于元素集，普通值集无效。
// 返回值类型与目标值类型相同。

map( proc: Function ): [Value]|Collector
// 集合映射。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 返回的集合与目标类型相同。
// 对于普通数组与Collector有一些区别：
// - 普通数组：$.map(xxx, proc) 处理器返回的undefined和null会被忽略。
// - Collector: $(xxx).map(proc) 实际上是调用数组原生的.map()，返回值都有效。
// proc接口：function(value, index, obj): Value
// 如果proc为空，取栈顶2项：[集合，处理器]

each( proc: Function ): data
// 迭代执行。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 目标应该是一个集合，没有返回值入栈。
// 回调函数内返回false会中断迭代。
// 指令返回被操作的目标对象。
// proc接口：function(value, index, obj): Value
// 如果proc为空，取栈顶2项：[集合，处理器]

unique( comp: Function|true|null ): [Value]|Collector
// 去重&排序。
// 目标：当前条目/栈顶1项。
// 特权：否。
// 集合如果不是Collector，可为对象（取其值集）。
// 默认为去重功能，如果传递comp实参则增加排序能力。
// comp:
// - true DOM节点排序
// - null 默认排序规则，适用非节点数据
// comp接口：function(a, b): Boolean


// Array|Collector
//-----------------------------------------------

sort( comp?: Function|null ): [Value]|Collector
// 集合排序。
// 目标：当前条目/栈顶1项。
// 特权：否。
// 对于元素Collector集合，comp应当为空获得默认的排序算法。
// 对于普通值Collector集合，comp可传递null获得JS环境默认排序规则。

reverse(): [Value]|Collector
// 成员序位反转。
// 目标：当前条目/栈顶1项。
// 返回一个新的数组。

flat( deep: Number|true ): [Value]|Collector
// 成员数组扁平化。
// 将目标内可能嵌套的子数组扁平化。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 如果是元素Collector集合，deep可以为true附加去重排序（1级扁平化）。
// 如果实参未传递，取栈顶2项：[集合, 深度值]
```
