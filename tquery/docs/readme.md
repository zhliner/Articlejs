# 接口参考

## 基本工具

### [$.Element( tag: string, data: any, ns: string, doc?: Document ): Element]($.Element.md)

创建 `tag` 指定的DOM元素，可指定所属名称空间和所属文档对象。
`data` 为数据配置对象或简单的数据集，支持类型：`{Object|Array|LikeArray|String|Node}`。


### [$.Text( data: String | Node | Array | Collector, sep?: string, doc?: Document ): Text]($.Text.md)

创建一个文本节点。`data` 可为字符串、节点元素或其数组，节点取文本（`textContent`）数据，数组单元取值为字符串后以 `sep` 串联。可指定所属文档对象。


### [$.create( html: string, exclude: Array, doc?: Document ): DocumentFragment]($.create.md)

创建文档片段。`<script>`、`<style>`、`<link>` 三种元素会被清理并存储到 `exclude` 空间中。


### [$.svg( tag: String | Object, opts: Object, doc?: Document ): Element]($.svg.md)

创建SVG系元素（自动采用 `http://www.w3.org/2000/svg` 名称空间）。
创建SVG根元素 `<svg>` 时，`tag` 参数为属性配置对象而不是标签名，如：`$.svg({width: 200, height: 100})` 创建一个宽200像素，高100像素的 `<svg>` 根容器元素。


### [$.table( rows: number | Element, cols: number, caption: string, th0: boolean, doc?: Document ): Table]($.table.md)

创建一个指定行列数的空表格（`Table` 实例），或封装一个规范的表格元素（无单元格合并或拆分）为 `Table` 实例。

`Table` 仅提供最简单的表格操作，除了表标题的设置或删除，主要是对表头（`<thead>`）、表脚（`<tfoot>`）和表主体（`<tbody>`）内表格行的添加、删除等，并且自动保持列数不变（也不能修改）。


### [$.script( data: string | Element, box: Element, doc?: Document ): Element | Promise]($.script.md)

插入一个脚本元素 `<script>`。可以传入脚本内容创建一个内联的 `<script>` 元素，也可以用 `$.Element()` 创建一个引入外部脚本的 `<script src="...">` 元素后在此插入。后一种方式会返回一个承诺对象（Promise），用户可以注册脚本导入完成后的处理函数。

`box` 是脚本元素插入的目标容器，可选。默认插入 `document.head` 元素内。未明确指定 `box` 时，插入的 `<script>` 执行后会自动移除。


### [$.style( data: string | Element, next: Element, doc?: Document ): Element | Promise]($.style.md)

插入一个包含内容的样式元素 `<style>`，也可以用 `$.Element()` 创建一个引入外部样式的 `<link>` 元素由此插入。后一种方式会返回一个承诺对象（Promise），用户可以注册样式导入完成后的处理函数。

`next` 是 `<style>` 或 `<link>` 元素插入的参考元素，可选。默认插入到 `document.head` 元素内的末尾。


### [$.load(el: Element, next: Node, box: Element): Promise]($.load.md)

载入元素的外部资源，元素需要能够触发 load 和 error 事件，如 `<img>`。返回一个承诺对象，其中的 resolve 回调由 load 事件触发，reject 回调由 error 事件触发。通常需要元素插入DOM树后才会执行资源的载入。

> **注：**<br>
> `<script>` 和 `<link>` 元素实际上也符合本接口，但前者执行后可以删除，后者实际上属于 style 范畴，故纳入 `$.style` 接口。


### [$.each( obj: any, handle: Function, thisObj: any ): any]($.each.md)

通用的遍历工具，支持数组、类数组、普通对象和包含 `.entries` 接口（如：Map、Set）的任意对象。Collector 继承于数组，故也可直接使用。

传入迭代回调处理器的实参分别为：`value`（值），`key`（键），`obj`（迭代对象自身）。**注**：类似于数组的 `forEach` 标准接口定义。


### [$.range( beg: string | number, size: string | number, toArr?: boolean ): Array | Iterator]($.range.md)

构造目标范围内一个连续的值序列，适用于数值和 `Unicode` 码点类型。通常会返回一个迭代器，除非明确指定返回数组（`toArr` 为 `true`）。


### [$.now( json: boolean ): string | number]($.now.md)

返回当前时间：自纪元（1970-01-01T00:00:00）开始后的毫秒数（与时区无关）。如果传递 `json` 为真，则表示为标准的 JSON 格式。

这基本上就是对 `new Date().getTime()` 或 `Date.now()` 接口的简单封装（附带包含了 `.toJSON()` 的逻辑）。


### [$.isXML( el: Element | Object ): boolean]($.isXML.md)

检查目标是否为一个 XML 节点。


### [$.ready( handle: Function ): this]($.ready.md)

文档载入就绪后的回调绑定。可以绑定多个，会按绑定先后逐个调用。若文档已载入并且未被hold，会立即执行绑定的handle。

> **注：**<br>
> 仅适用于文档的初始载入就绪。其它元素的载入就绪请使用 $.load() 接口。


### [$.holdReady( hold: boolean ): void]($.holdReady.md)

暂停或恢复 `.ready()` 注册的用户调用的执行。应当在页面加载的前段调用，传递 `true` 暂停 `.ready()` 注册的用户调用的执行，传递 `false` 则恢复，可能有多个 `.ready()` 的注册，一次 `.holdReady()` 调用对应一次 `.ready()`。

如果文档已就绪并已调用 `ready()` 注册的用户函数，本操作无效（同jQuery）。


### [$.embedProxy( getter: Function ): tQuery | Proxy]($.embedProxy.md)

嵌入代理。由外部定义 $ 的调用集覆盖，`getter` 接受函数名参数，应当返回一个与目标接口声明相同的函数。

> **注：**<br>
> 这个接口可以给一些库类应用提供特别的方便，比如操作追踪。<br>
> 代理会更新外部全局的 $ 对象。<br>


### $.Fx = {}

一个空的功能扩展区，供外部扩展使用。此为名称空间约定。


### [$.Table]($.table.md#tableClass)

一个简单的表格类（`class`），主要提供对表格行的操作，也是 `$.table()` 的返回值的类型。这是一个被导出的内部类，主要用于外部继承复用，普通的使用通常用 `$.table` 工具函数。


## 节点查询

### [$.get( slr: string, ctx?: Element ): Element | null]($.get.md)

查询单个元素的优化版（ID定位或 `.querySelector` 检索）。预先导入Sizzle时支持非标准CSS选择器。


### [$.find( slr: string, ctx?: Element, andOwn?: boolean ): [Element]]($.find.md)

在上下文元素内查找和选择器匹配的子元素集，如果传递 `andOwn` 实参为 `true`，则选择器匹配包含上下文元素自身。


### [$( its: any, ctx: Element ): Collector]($().md)

通用的节点元素查询器，即 `$(...)` 调用，返回一个 `Collector` 实例。例：`$('a')` 返回页面中所有链接元素（`<a>`）的集合。

`its` 支持选择器、元素（简单打包）、节点集、支持 `.values()` 接口的对象（如：Set），以及用户处理函数（即初始 `$.ready()` 的实参）等。无效的 `its` 实参会构造一个空的 `Collector` 实例。


## 节点遍历

> **集合版：**<br>
> 以下接口存在集合版，即集合中的每个元素会被执行相同的操作。最后的结果集被扁平化汇总，同时也被排序和清理（因为可能重复）。<br>
> 集合版的接口定义与单元素版（见下）相似，但不包含单元素版中首个 `el:{Element}` 参数（注：该值由集合内的每个元素自动充当）。<br>


### [$.next( el: Element, slr: string ): Element | null]($.next.md)

获取 `el` 的下一个兄弟元素。可用 `slr` 进行匹配测试，匹配不成功则返回 null，可选。


### [$.nextAll( el: Element, slr: string ): [Element]]($.nextAll.md)

获取 `el` 的后续全部兄弟元素。可用 `slr` 进行匹配过滤（符合者入选）。


### [$.nextUntil( el: Element, slr: string | Element ): [Element]]($.nextUntil.md)

获取 `el` 的后续兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。


### [$.prev( el: Element, slr: string ): Element | null]($.prev.md)

获取 `el` 的前一个兄弟元素。可用 `slr` 进行匹配测试，匹配不成功则返回 null，可选。这是 `$.next` 方法的反向查询。


### [$.prevAll( el: Element, slr: string ): [Element]]($.prevAll.md)

获取 `el` 前部的全部兄弟。可用 `slr` 进行匹配过滤（符合者入选）。**注**：结果集保持逆向顺序（靠近 `el` 的元素在前）。


### [$.prevUntil( el: Element, slr: string | Element ): [Element]]($.prevUntil.md)

获取 `el` 的前端兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。**注**：结果集成员保持逆向顺序。


### [$.children( el: Element, slr: string ): [Element]]($.children.md)

获取 `el` 的直接子元素集，可用 `slr` 进行匹配过滤（符合者入选）。返回一个子元素的数组（Array类型）。


### [$.siblings( el: Element, slr: string ): [Element] | null]($.siblings.md)

获取 `el` 元素的兄弟元素，可用 `slr` 进行匹配过滤（符合者入选）。`el` 需要在一个父元素内，否则返回 null（游离节点）。


### [$.parent( el: Element, slr: string | Function ): Element | null]($.parent.md)

获取 `el` 元素的直接父元素。`slr` 为选择器或测试函数，用于测试父元素是否匹配。


### [$.parents( el: Element, slr: string | Function ): [Element]]($.parents.md)

获取 `el` 元素的上级元素集。`slr` 为可选的选择器或测试函数，从父元素开始匹配测试，结果集保持从内向外的逐层顺序。

`slr` 若为测试函数，接受两个参数：`(el:Element, i:Number)`，前者为上级元素，后者为向上的层级计数（父元素时为1）。


### [$.parentsUntil( el: Element, slr: string | Function | Array | Element ): [Element]]($.parentsUntil.md)

汇集 `el` 元素的全部上级元素，直到 `slr` 匹配（不含匹配的元素）。从父元素开始匹配测试，结果集保持从内向外的逐层顺序。

`slr` 若为测试函数，接受两个参数：`(el:Element, i:Number)`，前者为上级元素，后者为向上的层级计数（父元素时为1）。


### [$.closest( el: Element, slr: string | Function | Array | Element ): Element]($.closest.md)

获取 `el` 最近的匹配的父级元素。向上逐级检查父级元素是否匹配，返回最先匹配的目标元素。

会从 `el` 元素自身开始测试匹配（同标准 Element:closest），如果抵达 `document` 或 `DocumentFragment` 会返回 null。


### [$.offsetParent( el: Element ): Element]($.offsetParent.md)

获取 `el` 最近的父级定位元素。从父元素开始检查，如果最终没有匹配返回文档根元素（即 `<html>`，同 jQuery）。如果当前元素属于 `<svg>` 的子节点，则返回 `<svg>` 根容器元素。

此接口与元素原生的 `offsetParent` 属性稍有不同，不管元素是否隐藏，都会返回 `position` 为非 `static` 的容器元素。

> **注：**<br>
> 元素原生的 `offsetParent` 属性在元素隐藏（`display:none`）时值为 null。<br>
> 元素的 `position` 样式被设置为：`relative`、`absolute`、`fixed` 时即为定位元素。<br>


## 节点过滤

### [$.filter(els: NodeList | Array | LikeArray, fltr: string | Function | Array | Element): [Element]]($.filter.md)

对 `els` 中的元素用 `fltr` 匹配过滤，返回一个匹配元素的新的集合。如果没有过滤条件，返回原始集（已转换为数组）。


## 节点操作


## 元素属性


## 文本操作


## CSS 相关


## 事件扩展
