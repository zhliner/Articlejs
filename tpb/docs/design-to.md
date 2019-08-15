## Tpb: To

从流程取值对目标赋值，展现结果（如样式）。支持后续联动事件触发和元素状态PB（如：focus/select等）。
如果目标为多个：源数据为数组时，分别赋值，否则为相同赋值。

`to = "Query | Method/Where | Next-Stage"`


### Query

```js
xxxx   // 单元素检索，$.get(): Element
[xx]   // 多元素检索，$(...): Collector


// 多元素过滤/处理

[xx]:(beg, end)
// 范围过滤。
// beg为起点下标，end为终点下标（不包含），可选。

[xx]:[x, y, z...]
// 定点过滤。[...] 为目标位置数组。

[xx]:{expression}
// 处理过滤。{} 内为处理函数，参数：(e:Element, i:Number, $:tQuery)。
// 返回值：
// - 返回true，保留源成员。
// - 返回false，移除源成员。
// - 返回元素或其它值，替换源成员。
// 注：
// filter 和 map 的合并。
```


### Method/Where

```js
[node]
// 当前条目为数据，检索结果为操作目标。

// 当前条目为数据
// {Node|[Node]|Collector|Set|Iterator|Function} /cons
- before        // 插入目标之前
- after         // 插入目标之后
- begin         // 插入目标内前端
- prepend       // 同上
- end           // 插入目标内末尾
- append        // 同上
- fill          // 填充目标内容（清空原有）
- replace       // 替换目标自身

- cloneEvent    // {Element} /src 全事件克隆


// 标量数据
- html          // {String|[String]|Node|[Node]|Function} /cons
- text          // {String|[String]|Node|[Node]|Function} /cons
- height        // Number/px
- width         // Number/px
- scroll        // {top:Number/px, left:Number/px}
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

- pba           // [String]
- pbo           // [String]


// 当前条目为容器，简单包裹。
- wrap          // {Element|String} /box 各自包裹
- wrapInner     // {Element|String} /box 各自内包裹
- wrapAll       // {Element|String} /box 包裹全部目标（汇集到一起）


// 反向插入。
// 当前条目为插入参考，检索结果为插入内容。
// 注：无克隆，移动式插入。

- beforeWith    // {Node} /ref
- afterWith     // {Node} /ref
- prependWith   // {Element} /box
- appendWith    // {Element} /box
- replaceWith   // {Node} /ref
- fillWith      // {Element} /box


[attr]
- @[name]
// 源数据：{String|Number|Boolean|Function|null}
// 例：[3/li]|@style|fire('...')
// $(...).attr('style', xxx)
// 注：这里的 style 是元素的样式特性，即 cssText 值。
// 例：
// @class：赋值元素的class特性值。实参为null时删除特性值。
// @-val： 赋值元素的data-val特性值，同 @data-val。

[prop]
- &[name]
// 源数据：{String|Number|Boolean|Function|null}
// 例：.Test|&value|fire('...')
// let el = $.get('.Test')
// $.prop( el, 'value', xxx )

[css]
- %[name]
// 源数据：{String|Number|Function|null}
// 例：.Test|%font-size|fire('...')
// let el = $.get('.Test')
// $.css(el, 'font-size', xxx)
// 注：名称 fontSize 同样可行。
```


#### 扩展

- 支持多方法定义，逗号分隔。
- 多方法主要用于多目标或多数据的情况，此时按数组成员一一对应。
- 如果目标唯一，则多个方法应用到同一目标。

例：

```js
#test|&value, @-val|...
// 对id为test的目标元素同时设置其value属性和data-val特性。
// 实参可能为数组（对应方法段多个位置），此时为一一对应。

[.Test]|@title|...
// 对class为Test的元素设置其title属性。
// 通常来说，实参可能是一个数组，以便不同的元素有不同的提示。

[.Test]|@title, &value|...
// 对class为Test的元素设置其title特性和value属性。
// 如果实参是一个二维数组（双值数组的数组），其与元素一一对应赋值。
// 即：将方法段视为一个独立单元。
```

> **说明：**<br>
> 如果实参、目标元素、方法段三者都为数组，则前两者的对应关系优先。<br>
> 然后实参的成员（可能也是一个数组）应用到方法段的不同位置上。<br>


### Next-Stage

可用顶层全局成员方法，包含 `$/$$/evo/env/pass/nil` 等。

```js
// $.trigger
// 暂时仅支持单个事件。
fire( evn, data )

// 默认在流程元素上触发。
// 注：在 Method 后被替换为当前检索。
blur()
click()
focus()
pause()
play()
reset()
scroll( x, y )
select()
load()
submit()

// 定制事件。
change()           // 主动触发表单控件的change事件
clear()            // <select>取消选取，单选按钮取消选取
tips( msg, time )  // 消息提示。注：计时器ID记录在消息容器上

...

// 方法调用。
// 流程元素上方法的无条件调用。
// 注：fire()的触发调用需要先有注册绑定。
method( name, ...rest )
```
