## Tpb: To

用流程传递来的数据对目标赋值（UI结果），支持后续联动的事件触发和少量指令操作。

`to = "Query | Method/Where/Set | Next-Stage"`

如果目标检索为一个集合，当数据源也为数组时，为分别一一对应赋值的逻辑。三个部分中任意段皆可为空（或占位符 `-`），但分隔符竖线（`|`）不可省略。

> **注：**
> 此处的目标指 `Query` 的结果，流程数据栈中的当前条目称为内容数据。


### 格式用例

```html
<ul id="test" ...
    to=""
>
```


### Query

#### 暂存区为空

当前条目无值（`undefined`）。取事件当前元素（`evo.current`）为二阶查询的起点元素。

- **选择器为空**：起点元素本身即为最终目标。
- **选择器非空**：按二阶检索法检索目标元素，如果选择器前置 `+` 标志，则为检索一个集合。


### 暂存区非空

当前条目有值（非 `undefined`）。取当前条目为二阶查询的起点元素（可能为非元素类型或 `null`）。这通常是由前阶末尾指令预先提取的（`pop`）。

- **选择器为空**：当前条目即为最终目标。如果目标不为元素，后阶方法段必须为空，否则会出错（方法仅适用于元素类型）。
- **选择器非空**：当前条目为查询的起点参考（`null` 有效），如果当前条目是一个集合，选择器应当只包含进阶提取部分，否则会出错。

> **注：**
> 允许采用当前条目为目标或参考，使得目标可以是动态的（脱离模板参数局限）。


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


### Method/Where/Sets

```js
// 普通设置
// 流程数据为内容，当前检索为目标。
/////////////////////////////////////////////////

- before        // 插入目标之前
- after         // 插入目标之后
- prepend       // 插入目标内前端
- append        // 插入目标内末尾
- fill          // 填充目标内容（清空原有）
- replace       // 替换目标自身
// 节点插入/替换。
// {Node|[Node]|Collector|Set|Iterator|Function} /cons
// 注：
// 因数据本身可为数组，故不支持后续克隆等参数。
// 这可以通过提前克隆解决，但仅适用于单个目标点（多对一）。
// 注记：
// 同一组节点一次插入到多个位置的场景可能并不多见，但如果必需，
// 通过分解设计和联动事件激发，或许可以解决？
// 如：一个逐次递减的目标清单往返传递（fire）。


- wrap          // {Element|String} /box 各自包裹
- wrapInner     // {Element|String} /box 各自内包裹
- wrapAll       // {Element|String} /box 包裹全部目标（汇集到一起）
// 当前条目为容器，包裹目标。


- height        // {Number} /px
- width         // {Number} /px
- scroll        // {top:Number, left:Number} /px
- scrollTop     // {Number} /px
- ScrollLeft    // {Number} /px
- addClass      // {String|Function} /names
- removeClass   // {String|Function} /names
- toggleClass   // {String|Function|Boolean}
- removeAttr    // {String|Function} /names
- val           // {Value|[Value]|Function}
- html          // {String|[String]|Node|[Node]|Function|.values} /fill
- text          // {String|[String]|Node|[Node]|Function|.values} /fill
- offset        // {top:Number/px, left:Number/px}
// 简单设置。
// 流程数据为唯一实参，数据本身可能为数组。


- cloneEvent
// 事件克隆。{Element} /src | [...]
// 事件源为单个元素，因此支持多实参扩展传递后续配置。
// [ Element, String|Array2|[Array2] ]
// 实现：
// 检查传入的流程数据是否为数组，决定是否展开。


// 逆向设置。
// 流程数据为目标，当前目标（targets）为内容。
// 插入参考为单个节点/元素，因此支持多实参扩展传递后续克隆定义。
// [ Node|Element, Boolean?, Boolean?, Boolean? ]
/////////////////////////////////////////////////

- beforeWith    // {Node} /ref | [...]
- afterWith     // {Node} /ref | [...]
- prependWith   // {Element} /box | [...]
- appendWith    // {Element} /box | [...]
- replaceWith   // {Node} /ref | [...]
- fillWith      // {Element} /box | [...]
// 实现：
// 检查传入的流程数据是否为数组，决定是否展开。


- pba
// PB参数设置。{[String]}
// 用流程数据构造 - 分隔的词序列，含最后的-字符。
// 赋值到 data-pb 属性。
// 注：不破坏PB中的选项部分（后段）。
// 注记：
// 参数序列存在末尾的-字符，这是一个标志。

- pbo
// PB选项设置。{[String]}
// 用流程数据构造空格分隔的词序列。
// 赋值到 data-pb 属性。
// 不破坏PB中的参数部分（前段）。

- update
// 用流程数据更新目标元素。{Object}
// 用于模板节点插入页面之后的原地更新。
// 注意：
// 目标元素通常是原模板根的副本，也支持局部更新，但视渲染语法而定。
// 效果与By:render相同，但目标无法通过模板名获取。


// 下面为常用方法。
// 采用前置特殊字符来简化实现。

[attr]
- @[name]
// 特性设置。即：.attr([name], ...)
// {String|Number|Boolean|Function|null}
// 例：
// @style： 设置元素的style特性值（cssText）。
// @class： 设置元素的class特性值。实参为null时删除特性值。

[prop]
- &[name]
// 属性设置。即：.prop([name], ...)
// {String|Number|Boolean|Function|null}
// 例：
// &value   设置元素的value属性值。
// &-val：  设置元素的data-val属性值（dataset.val），同 &data-val。

[css]
- %[name]
// 样式设置。即：.css([name], ...)
// {String|Number|Function|null}
// 例：
// %font-size 设置元素的font-size内联样式。
// %fontSize  效果同上。

[attr:toggle]
- ^[name]
// 元素特性切换。
// {Value|[Value]|Function}
// 单值比较有无切换，双值（数组）比较交换切换。
```


#### 扩展

- 支持多方法定义，逗号分隔。
- 多方法可用于多数据同时设置的情况，此时流程数据通常是一个数组，各个方法与数组成员一一对应。
- 所有方法及其对应数据可看作一个整体，它们会全部应用到目标上，目标可能是一个集合。
- 特定方法的数据也可能是一个数组（子数组），它们应用到元素集合时遵循tQuery接口自身的逻辑（比如数组成员与元素成员一一对应）。


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


fire( evn, data, delay )
// 触发事件，即 $.trigger。
// 内容：当前条目，可选。
// 如果data未定义，且当前条目非空，则采用当前条目为数据。
// 数据优先级：data > evo.data | void
// delay: 激发延迟，默认无延迟。

xfire( evn, data, delay )
// 判断激发。
// 内容：当前条目/栈顶1项。
// 仅当内容为真时才激发目标事件，否则忽略。
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
// 参考.select(), .focus()用途。

tips( long, msg )
// 发送提示消息。
// 内容：当前条目，可选。
// 在目标元素上显示文本信息，通常仅持续一小段时间（long，毫秒）。
```
