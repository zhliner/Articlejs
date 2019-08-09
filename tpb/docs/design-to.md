## Tpb: To

从流程取值对目标赋值，展现结果（如样式）。支持后续联动事件触发和元素状态PB（如：focus/select等）。
如果目标为多个：源数据为数组时，分别赋值，否则为相同赋值。

`to = "Query | Method | Next-Stage"`


### Query

```js
xxxx   // 单元素检索，$.get(): Element
[xx]   // 多元素检索，$(...): Collector


// 多元素过滤|处理

[xx]:(beg, end)
// 范围过滤。
// beg为起点下标，end为终点下标（不包含），可选。

[xx]:[x,y,z...]
// 定点过滤。[...] 为目标位置数组。

[xx]:{function}
// 处理过滤。{} 内为处理函数，参数：(Element, index)。
// 返回值：
// - 返回true，保留源成员。
// - 返回false，移除源成员。
// - 返回元素或其它值，替换源成员。
// 注：
// filter 和 map 的合并。
```


### Method

```js
[node]
// 下面的方法种中流程数据为数据，当前检索为目标。
// 遵循tQuery相应接口规则。

// 节点数据
- before    // 插入目标之前
- after     // 插入目标之后
- begin     // 插入目标内前端
- prepend   // 同上
- end       // 插入目标内末尾
- append    // 同上
- fill      // 填充目标内容（替换）
- replace   // 替换目标本身

// 标量数据
- html      // 填充源码构造的节点
- text      // 填充文本
- val       // 按表单逻辑赋值

// 元素或文本数据
- wrap      // 目标被（各自）包裹
- wrapInner // 目标被（各自）内包裹
- wrapAll   // 包裹目标节点（集）

// 下面的方法中流程数据为目标，当前检索为数据。
// 注：
// 这里没有复制控制，因此数据元素是移动方式。
- beforeWith
- afterWith
- prependWith
- appendWith
- replaceWith
- fillWith


[attr]
- &[name]
// 例：[3@li]|&style|fire('...')
// $(...).attr('style', xxx)
// 注：这里的 style 是元素的样式属性，即 cssText 值。
// 例：
// &class：赋值元素的class属性值。
// &-val： 同 &data-val

[prop]
- $[name]
// 例：.Test|$value|fire('...')
// let el = $.get('.Test')
// $.prop( el, 'value', xxx )
// 特例：
// $class+  添加类名。默认，+字符可省略。
// $class-  删除类名。
// $class^  切换类名。
// $class=  全部替换。与 &class 效果相同。

[css]
- %[name]
// 例：.Test|%font-size|fire('...')
// let el = $.get('.Test')
// $.css(el, 'font-size', xxx)
// 注：名称 fontSize 同样可行。
```


扩展：

- 支持多方法定义，逗号分隔。
- 多方法主要用于多目标或多数据的情况，此时按数组成员一一对应。
- 如果目标唯一，则多个方法应用到同一目标。

例：

```js
#test|&value, $value|...
// 对id为test的目标元素同时设置其value属性和value特性。
// 数据源可能为数组，也可能为单个值。为数组时采用一一对应方式。

[.Test]|&title|...
// 对class为Test的元素设置其title属性。
// 通常来说，数据源可能是一个数组，以便不同的元素有不同的提示。

[.Test]|&title, $value|...
// 对class为Test的元素设置其title特性和value属性。
// 数据源几乎肯定是一个数组，以对应不同的方法。
// 如果数据源是一个二维数组（双值数组的数组），其与元素一一对应赋值（应用到两个方法）。
// 即：将两个方法视为一个独立单元。
```

> **说明：**<br>
> 如果数据源、目标元素、方法三者都为数组，则前两者的数组属性优先。<br>
> 然后数据源的成员（可能也是一个数组）应用到方法数组上。即：若存在数组，则一一对应。<br>


### Next-Stage

```js
// 元素检索/求值。
// 注：不支持更多的On方法，但扩展能力。
$( rid, method, ...rest ): Element | Any
// tQuery.get(...)
// rid: {String|Number|null}
// method: {String}
// - tQuery的方法，rest为方法的实参序列。
// - 调用进阶方法，返回值可能为任意值。下同。
// - 进阶的方法名仅限于On中已经定义的成员（与tQuery的交集）。

$$( rid, method, ...rest ): Collector | Any
// tQuery(...)
// rid: {String|Number|null}
// method: {String}
// - Collector的方法，rest为方法的实参序列。
// - 方法名限定同上。


// $.trigger
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
