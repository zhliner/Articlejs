## Tpb: To

用流程传递来的内容数据对检索（`Query`）的目标修改更新（`Update`），支持后续联动的事件触发和少量的基本指令（`Next-Stage`）。

`to = "Query | Update | Next-Stage"`

如果目标检索为一个集合，当内容数据也为一个数组时，为分别一一对应赋值的逻辑。三个部分中任意段皆可为空（或占位符 `-`），但分隔符竖线（`|`）不可省略。

> **注：**<br>
> 与前面 `On/By` 阶段的称谓不同，`To` 阶段的目标指 `Query` 的结果，而流程数据被称为内容。


### Query

目标元素（集）的查询表达式，值本身被视为字符串，因此可以不再用引号包围。如：`to="|replace"` 与 `to="''|replace"` 效果相同。


#### 暂存区为空

当前条目无值（`undefined`）。取事件当前元素（`evo.current`）为二阶查询的起点元素。

- **选择器为空**：起点元素本身即为最终目标。
- **选择器非空**：按二阶检索法检索目标元素，如果需要检索一个集合，需要在选择器前置 `+` 标志。


#### 暂存区非空

当前条目有值（非 `undefined`）。取当前条目为二阶查询的起点元素，该元素需要由前阶段（`On/By`）的末尾指令预先提取（如 `pop`）。

- **选择器为空**：当前条目即为最终目标。如果目标不为元素，后阶 `Update` 方法段通常为空（`Update` 主要用于元素操作）。
- **选择器非空**：当前条目为查询的起点元素。如果当前条目是一个集合（非起点），选择器应当只包含进阶提取部分。

> **注：**<br>
> 允许采用当前条目为起点元素或目标集，使得目标可以是动态的，不受模板参数局限。


#### 特殊字符

查询串中部分特殊字符拥有特殊含义。

- `+` 只存在于查询串前端，表示之后的选择器是匹配一个集合。
- `!` 检索结果的进阶过滤标志，之后的字符串为过滤表达式，包含三种方式：范围指定、下标指定、过滤函数。
- `()` 过滤表达式的范围指定。
- `[]` 过滤表达式的数组下标单独指定。
- `{}` 过滤表达式的回调函数包围。

另外两个独立的特殊字符表达事件关联的两个元素（友好性）。

- `~` 事件起点元素（`event.target|elo.origin`）。
- `&` 事件委托元素（`event.currentTarget|elo.delegate`）。


```js
xxxx   // 单元素检索，$.get(): Element | null
+xxx   // 多元素检索，$(...): Collector
// 例：
// [class]  => $.get('[class]')
// +[class] => $('[class]')
// strong   => $.get('strong')
// +strong  => $('strong')


// 局部提取。
// 仅适用于 +xxx 类多元素选择器。

+xxx!(beg, end)
// 范围选取：Collector
// beg为起点下标，end为终点下标（不包含），可选。
// 下标支持负数从末尾算起。
// 例：
// +[class]!(10, -1) 取集合第11个之后全部成员。
// +[class]!(10)     同上。

+xxx![x, y, z...]
// 定点选取：[Element]
// [...] 为目标位置数组。
// 例：
// +[class]![1,3,5] 取集合内奇数位前3个成员。

+xxx!{filter}
// 回调过滤：Collector
// {} 内为过滤表达式，实参固定：(v:Element, i:Number, o:Collector): Boolean。
// 注：即 filter 的逻辑。
// 例：
// +[class]!{ v.id }  取集合内包含id属性的元素。
// +[class]!{ i % 2 } 取集合内奇数位成员。
```


### Update

以 Query 的检索目标为操作对象，取栈顶n项为n个方法的内容实参（一一对应）。**注**：可并列定义多个方法。

```js
//
// 节点类赋值。
/////////////////////////////////////////////////
before( clone, event, eventdeep:Boolean )
after( clone, event, eventdeep:Boolean )
prepend( clone, event, eventdeep:Boolean )
append( clone, event, eventdeep:Boolean )
fill( clone, event, eventdeep:Boolean )
replace( clone, event, eventdeep:Boolean )
// 内容：{Node|[Node]|Collector|Set|Iterator|Function}
// 附加：不支持。

wrap( clone, event, eventdeep:Boolean )
wrapInner( clone, event, eventdeep:Boolean )
// 内容：{Element|String|[Element|String]}
// 附加：不支持。

wrapAll( clone, event, eventdeep:Boolean )
// 内容：{Element|String} box
// 附加：[clone, event, eventdeep:Boolean]
// 说明：
// 如果流程数据为数组，附加内容会补充到实参序列之后。

cloneEvent( evns?:String|Function )
// 事件处理器克隆。
// 内容：{Element} 事件句柄源
// 附加：{evns:String|Function}
// 说明：
// 如果无实参传递，流程数据为 [内容, evns] 时会被展开。


//
// 简单设置。
// 内容：流程数据为唯一内容，数据本身可能为数组。
// 附加：不支持，实参仅从模板传递。
// 注：多余实参无副作用。
/////////////////////////////////////////////////
height( inc?:Boolean )          // {Number}
width( inc?:Boolean )           // {Number}
scroll()                        // {top:Number, left:Number}
scrollTop( inc?:Boolean )       // {Number}
ScrollLeft( inc?:Boolean )      // {Number}
addClass()                      // {String|Function}
removeClass()                   // {String|Function}
toggleClass( force?:Boolean )   // {String|Function|Boolean}
removeAttr()                    // {String|Function}
offset()                        // {top:Number, left:Number}
val()                           // {Value|[Value]|Function}
html( where?:String|Number, sep?:String)    // {String|[String]|Node|[Node]|Function|.values}
text( where?:String|Number, sep?:String)    // {String|[String]|Node|[Node]|Function|.values}


//
// 特性/属性/样式设置增强版（空格分隔多个名称）。
/////////////////////////////////////////////////
attr( names:String )
prop( names:String )
cssSets( names:String )
// 内容：{Value|[Value]|Function|null}
// 展开：[names:String|Object, 内容]
// 说明：
// 如果传递实参，流程数据视为单纯的值。
// 如果实参为空，流程数据为数组时展开（非数组时应当为Object）。


//
// 事件处理。
/////////////////////////////////////////////////
bind( evnid:String, slr?:String )
// 内容：{Value|[Value]|...} 初始传入值
// 附加：不支持。
// 用预定义的调用链作为事件处理器，绑定到目标。
// evnid为 [事件名:ID] 结构，支持空格分隔多个名称，假值表示通配（目标上的全部存储）。
// 注：
// 在目标上检索并绑定到目标。

once( evnid:String, slr?:String )
// 绑定事件的单次处理。
// 内容/说明同上。

on( evn?:String, slr?:String )
one( evn?:String, slr?:String )
off( evn?:String, slr?:String )
// 事件绑定/解绑。
// 内容：{EventListener|Function|false|null} 事件处理器。
// 附加：[evn:String|Object, slr:String]

trigger( val:Value, bubble?, cancelable?:Boolean )
// 发送事件到目标。
// 内容：{String} 事件名
// 附加：[val:Value, bubble, cancelable:Boolean]
// 说明：
// 如果流程数据为数组，附加内容会补充到实参序列之后。
// 事件名支持空格分隔的多个事件名序列。


//
// 逆向插入。
// 流程数据为目标，Query检索目标为内容。
// 注：一对一或一对多。
/////////////////////////////////////////////////
beforeWith( clone, event, eventdeep:Boolean )
afterWith( clone, event, eventdeep:Boolean )
prependWith( clone, event, eventdeep:Boolean )
appendWith( clone, event, eventdeep:Boolean )
replaceWith( clone, event, eventdeep:Boolean )
fillWith( clone, event, eventdeep:Boolean )
// 内容：{Element}
// 附加：[clone, event, eventdeep:Boolean]


//
// 其它赋值。
/////////////////////////////////////////////////
pba()
// PB参数设置。
// 内容：{[String]}
// 注：参数序列末尾存在-字符。

pbo()
// PB选项设置。
// 内容：{[String]}

pbv()
// PB属性设置。
// 内容：{String}
// 注：对data-pb特性值本身的设置。

render()
// 渲染目标元素（原地更新）。
// 内容：{Object|Array|Value}
// 注：
// 目标元素可以是模板根，也可以是局部（与渲染语法相关）。

data( name?:String )
// 存储关联数据（单名称）。
// 如果未传递name实参，则从内容数据中取值（[1]）。
// 如果目标是一个集合则值应当是一个数组，一一对应存储。

xdata( names?:String )
// 多名称关联数据存储。
// 如果未传递name实参，则从内容数据中取值（[1]）。
// 关联数据应当是一个数组，与名称一一对应存储。
// 如果目标是一个集合，相同的键/值存储到多个目标元素。


//
// 常用方法。
// 采用前置特殊字符来简化实现。
// 与增强版不同，这里仅支持单个名称。
/////////////////////////////////////////////////

[attribute]
- @[name]
// 特性设置（.attribute([name], ...)）
// 内容：{String|Number|Boolean|Function|null}
// 例：
// @style： 设置元素的style特性值（cssText）。
// @class： 设置元素的class特性值。实参为null时删除特性值。

[property]
- $[name]
// 属性设置（.property([name], ...)）
// 内容：{String|Number|Boolean|Function|null}
// 例：
// $value   设置元素的value属性值。
// $-val：  设置元素的data-val属性值（dataset.val），同 $data-val。

[css]
- %[name]
// 样式设置（.css([name], ...)）
// 内容：{String|Number|Function|null}
// 例：
// %font-size 设置元素的font-size内联样式。
// %fontSize  效果同上。

[attribute:toggle]
- ^[name]
// 元素特性切换（.toggleAttr([name], ...)）
// 内容：{Value|[Value]|Function}
// 单值比较有无切换，双值（数组）比较交换切换。
```


#### 扩展

- 支持多方法定义，空格分隔。
- 多方法可用于多数据同时设置的情况，此时流程数据需要是一个数组，各个方法与数组成员一一对应。
- 特定方法的数据也可以是一个子数组，它们应用到元素集合时遵循tQuery自身的逻辑（数据成员与元素成员一一对应）。


例：

```js
#test|&value, @-val|...
// 对id为test的目标元素同时设置其value属性和data-val特性。
// 数据内容可能为数组，对应到方法段各个位置（无对应的被忽略）。
// 注：
// 如果定义了多个方法，数据内容通常为数组形式。
// 同样的数据应用到不同的方法上并不常见（当然也有这样的需求）。

+.Test|@title|...
// 对class为Test的元素设置其title属性。
// 通常来说，实参可能是一个数组，以便不同的元素有不同的提示。

+.Test|@title, &value|...
// 对class为Test的元素设置其title特性和value属性。
// 如果实参是一个二维数组（双值数组的数组），其与元素一一对应赋值。
// 即：将方法段视为一个独立单元。
```



### Next-Stage

可用顶层全局成员方法有限地获取新的流程数据。

> **注：**<br>
> `Query` 段的目标在方法的首个实参（`evo`）对象中，通过名称 `targets` 可以引用。


```js
target()
// 更新To目标。
// 用当前条目/栈顶1项设置为To目标。


fire( evn, delay = 1, data, bubble, cancelable )
// 延迟激发。
// 内容：当前条目，可选。
// delay: 激发延迟时间（毫秒），默认1。
// 如果data为null，且当前条目非null，则采用当前条目为数据。

xfire( evn, delay = 1, data, bubble, cancelable )
// 延迟判断激发。
// 内容：当前条目/栈顶1项。
// 仅当内容为非假值时才激发目标事件，否则忽略。
// 注：
// 此时流程数据无法成为发送数据。


// 在目标元素上触发。
blur()
click()
focus()
pause()
play()
reset()
select()
load()
submit()

scroll( x, y )
// 滚动条获取或设置。
// 内容：当前条目，可选。
// 注：Where中也包含。



// 友好定制。
//===============================================

changes()
// 表单控件改变通知。
// 目标：<form>（仅适用）。
// 检查表单控件值是否非默认值，激发控件上的特定事件（默认changed）。
// 注：如果都没有改变，不会激发事件。
// 用例：
// 在表单的reset中处理改变了默认状态的控件。

clear()
// 表单控件清空。
// 效果：选取类控件为取消选取，其它为清除value值。
// 参考.select(), .focus()类用途。

tips( long, msg )
// 发送提示消息。
// 内容：当前条目，可选。
// 在目标元素上显示文本信息，通常仅持续一小段时间（long，毫秒）。
```
