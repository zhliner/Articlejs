## Tpb: To

用流程传递来的数据对目标赋值（UI结果），支持后续联动的事件触发和少量指令操作。

`to = "Query | Method/Where/Set | Next-Stage"`

如果目标检索为一个集合，当数据源也为数组时，为分别一一对应赋值的逻辑。**注意**：此处的目标指 `Query` 的结果，而流程数据栈中的当前条目称为内容数据。


### Query

```js
xxxx   // 单元素检索，$.get(): Element
[xx]   // 多元素检索，$(...): Collector


// 多元素过滤

[xx]:(beg, end)
// 范围选取。
// beg为起点下标，end为终点下标（不包含），可选。

[xx]:[x, y, z...]
// 定点选取。[...] 为目标位置数组。

[xx]:{filter}
// 回调过滤。{} 内为过滤表达式，实参固定：(v:Element, i:Number, o:Collector): Boolean。
// 注：即 filter 的逻辑。
```


### Method/Where/Set

```js
- before        // 插入目标之前
- after         // 插入目标之后
- begin         // 插入目标内前端
- prepend       // 同上
- end           // 插入目标内末尾
- append        // 同上
- fill          // 填充目标内容（清空原有）
- replace       // 替换目标自身
// 节点插入/替换。
// {Node|[Node]|Collector|Set|Iterator|Function} /cons
// 当前条目为数据，检索结果为操作目标。
// 因数据本身可为数组，不支持后续（克隆等）参数传递。
// 注：可提前独立克隆。


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
// 流程数据作为唯一实参。


- cloneEvent
// 事件克隆。{Element} /src | [...]
// 注：
// 事件源为单个元素，因此支持多实参扩展（支持后续参数）。
// [ Element, String|Array2|[Array2] ]


- beforeWith    // {Node} /ref | [...]
- afterWith     // {Node} /ref | [...]
- prependWith   // {Element} /box | [...]
- appendWith    // {Element} /box | [...]
- replaceWith   // {Node} /ref | [...]
- fillWith      // {Element} /box | [...]
// 反向插入。
// 当前条目为插入参考，检索结果为插入内容。
// 注：
// 插入参考为单个节点或元素，因此支持多实参扩展（传递后续克隆参数）。
// [ Node|Element, Boolean?, Boolean?, Boolean? ]


- pba   // {[String]}
- pbo   // {[String]}
// PB属性专有操作。


// 下面为常用方法。
// 流程数据支持数组成员与目标集成员一一对应。
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

可用顶层全局成员方法有限地获取新的流程数据。

> **注：**<br>
> `Query` 段的目标依然为此处的目标。目标不进入流程，以方便流程捕获需要发送的数据。


```js
target()
// 更新目标为当前条目/栈顶项。
// 这为重新定位Query阶段的目标提供了可能。
// 这是一个To专有方法。


fire( evn, data )
// 对目标元素触发事件，即 $.trigger。
// 如果data未定义，且当前条目非空，则采用当前条目为数据。

one( evn, data )
// 对目标元素单次触发（$.trigger）。
// data 含义同上。
// 实现：触发后自动移除调用链内的自己。

xfire( evn, data )
// 判断激发。
// 仅当当前条目或栈顶项为真时才激发目标事件。
// 注：此时流程数据无法成为发送数据。

xone( evn, data )
// 判断单次激发。
// 说明同上。


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
```


代码实现参考：

```js
// 提示计时器存储键。
const __TIMER = 'BASE::elem-timer';

// 创建提示信息。
function tips( els, msg, time ) {
    for ( let e of els ) {
        clearTimeout( this.Store(e)[__TIMER] );
        this.Store(e)[__TIMER] = setTimeout( () => $.empty(e), time );
    }
}
```
