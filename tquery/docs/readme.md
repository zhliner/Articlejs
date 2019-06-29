# 接口参考

## 基本工具

### [$.Element( tag: string, data: any, ns: string, doc?: Document ): Element]($.Element.md)

创建 `tag` 指定的DOM元素，可指定所属名称空间和所属文档对象。
`data` 为数据配置对象或简单的数据集，支持类型：`{Object|Array|LikeArray|String|Node|Collector}`。如果数据源为节点，源节点可能会被移出原来的位置。


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


### [$.Table]($.table.md#tableClass)

一个简单的表格类（`class`），主要提供对表格行的操作，也是 `$.table()` 的返回值的类型。这是一个被导出的内部类，主要用于外部继承复用，普通的场景请使用 `$.table` 接口。


### [$.script( data: string | Element, box: Element, doc?: Document ): Element | Promise]($.script.md)

插入一个 `<script>` 脚本元素。可以传入脚本内容创建一个内联的 `<script>` 元素，也可以传递一个 `<script src="...">` 元素的配置对象（`{src:...}`）或用 `$.Element()` 先创建一个脚本元素后插入。引入外部脚本的创建方式返回一个承诺对象（Promise），用户可以注册脚本导入完成后的处理函数。

`box` 是脚本元素插入的目标容器，可选。默认插入 `document.head` 元素内。未明确指定 `box` 时，插入的 `<script>` 执行后会自动移除。


### [$.style( data: string | Element, next: Element, doc?: Document ): Element | Promise]($.style.md)

插入一个包含内容的 `<style>` 样式元素，也可以传递一个 `<link href=...>` 元素的配置对象（`{href:...}`）或用 `$.Element()` 先创建一个样式元素后插入。引入外部CSS样式文件的方式会返回一个承诺对象（Promise），用户可以注册样式导入完成后的处理函数。

`next` 是 `<style>` 或 `<link>` 元素插入的参考元素，可选。默认插入到 `document.head` 元素内的末尾。


### [$.loadin(el: Element, next: Node, box: Element): Promise]($.loadin.md)

载入元素的外部资源，元素需要能够触发 load 和 error 事件，如 `<img>`。返回一个承诺对象，其中的 resolve 回调由 load 事件触发，reject 回调由 error 事件触发。通常需要元素插入DOM树后才会执行资源的载入。

> **注：**<br>
> `<script>` 和 `<link>` 元素实际上也符合本接口，但前者执行后可以删除，故单独为一个 `$.script` 接口，后者实际上属于 style 范畴，故由 `$.style` 接口负责。


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


### [$.contains( box: Element, node: Node ): boolean]($.contains.md)

检查目标节点 `node` 是否包含在 `box` 元素之内。与 DOM 标准兼容，匹配检查包含容器元素自身。

> **注**：jQuery.contains 的行为稍有不同。


### [$.tags( code: string ): string]($.tags.md)

伪标签源码（由 `[]` 包围标签）转化为正常的HTML源码，可用于元素属性值中直观地包含标签源码。

这里只是一种简单的替换。如果代码中需要包含 `[]` 本身，可以前置字符 `\` 转义。


### [$.serialize( form: Element, exclude?: Function | [string] ): [Array]]($.serialize.md)

序列化表单内控件的名称和值，返回一个**名/值对**双成员数组（`[name, value]`）的数组。

仅处理有 `name` 属性的控件，正常情况下它们会在表单提交时作为**名/值对**被提交到服务器（或出现在URL的查询部分）。


### [$.queryURL( target: Element | [Array] | Object | Map ): string]($.queryURL.md)

用一个**名/值对**数组（`[name, value]`）的数组、或一个**键/值对**对象、或一个 `Map实例` 构造 `URL` 中查询串的部分（即 `URL` 中 `?` 之后的部分）。可以直接传入一个表单元素，这样会自动提取表单内可提交控件的**名/值对**作为源数据。

考虑可视友好性，Unicode字符、数字和一些常用的全角标点符号不会被转换，这与现代浏览器地址栏中实际的表现一致。


### [$.ready( handle: Function ): this]($.ready.md)

文档载入就绪后的回调绑定。可以绑定多个，会按绑定先后逐个调用。若文档已载入并且未被hold，会立即执行绑定的handle。

> **注：**<br>
> 仅适用于文档的初始载入就绪。其它元素的载入就绪请使用 $.loadin() 接口。


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



## 基本操作

### [$( its: any, ctx: Element ): Collector]($().md)

通用的节点元素查询器，即 `$(...)` 调用，返回一个 `Collector` 实例。例：`$('a')` 返回页面中所有链接元素（`<a>`）的集合。`its` 支持选择器、元素（简单打包）、节点集、支持拥有 `.values()` 接口的对象（如：Set）。无效的 `its` 实参会构造一个空的 `Collector` 实例。

本接口还用作页面载入完毕后的用户处理函数绑定，即初始 `$.ready(...)` 的实参。



## 前置说明

> #### 关于单元素版和集合版
>
> 以下接口是单元素版，即对单个元素执行的操作，它被直接定义在 `$` 函数对象上。对 `$()` 的检索调用返回一个 `Collector` 实例，也即一个集合，大部分单元素版的接口在该集合上也存在，它们被称为集合版接口。
>
> 集合版接口的行为通常是单元素版重复调用后执行合并（会排序去重），因此通常效率稍低。其接口声明与单元素版基本相同，除了没有单元素版的首个元素参数外。
>
> 如 `.nextAll`：
> - 单元素版：`$.nextAll( el, slr )` 返回元素 `el` 的后续兄弟元素，`slr` 为匹配过滤。
> - 集 合 版：`$(...).nextAll( slr )` 检索集合内每一个元素的后续兄弟元素，`slr` 为匹配过滤。返回一个排序并去除了重复元素的集合。



## 节点查询

### [$.get( slr: string, ctx?: Element ): Element | null]($.get.md)

查询单个元素的优化版（ID定位或 `.querySelector` 检索）。预先导入Sizzle时支持非标准CSS选择器。


### [$.find( slr: string, ctx?: Element, andOwn?: boolean ): [Element]]($.find.md)

在上下文元素内查找和选择器匹配的子元素集，如果传递 `andOwn` 实参为 `true`，则选择器匹配包含上下文元素自身。



## 节点遍历


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


### [$.contents( el: Element, comment?: boolean ): [Node]]($.contents.md)

获取 `el` 元素的内容，包含其中的子元素、文本节点和可选的注释节点。**注**：全部为空白的文本节点会被忽略。


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

### [$.filter( els: NodeList | Array | LikeArray, fltr: string | Function | Array | Element ): [Element]]($.filter.md)

对 `els` 中的元素用 `fltr` 匹配过滤，返回一个匹配元素的新的集合。如果没有过滤条件（为假值），返回一个已转换为数组的原始集。


### [$.has( els: NodeList | Array | LikeArray, slr: string | Function | Element ): [Element]]($.has.md)

对 `els` 中的元素用 `slr` 执行 **包含** 匹配过滤。包含的意思是 **`slr` 作为子级元素匹配**，`slr` 也可以是一个匹配函数。传递一个假值的 `slr` 实参时，返回一个已转换为数组的原始集。


### [$.not( els: NodeList | Array | LikeArray, slr: string | Function | Array | Element ): [Element]]($.not.md)

对 `els` 中的元素用 `slr` 匹配排除，返回排除匹配元素之后的新集合。如果没有过滤条件（为假值），返回一个已转换为数组的原始集。



## 节点操作

### [$.wrap( node: Node, box: html | Element | Function ): Element | false]($.wrap.md)

在 `node` 之外包裹一个元素，该元素替换 `node` 原来的位置。包裹元素可以是一个现有的元素、一个html字符串、或一个返回包裹元素或html字符串的函数。

如果包裹元素还包含子元素，`node` 会插入包裹元素的前端（注：与jQuery不同）。如果包裹采用结构化的html字符串，则会递进至最深层子元素为包裹容器。


### [$.wrapInner( el: Element, box: html | Element | Function ): Element | false]($.wrapInner.md)

在 `el` 的内容之外包裹一个元素（容器）。容器元素可以是一个现有的元素、一个html字符串、或一个返回容器元素或html字符串的函数。

如果容器元素还包含子元素，`el` 的内容会插入容器元素内的前端（注：与jQuery不同）。如果包裹采用结构化的html字符串，则会递进至首个最深层子元素为包裹容器。


### [$.unwrap( el: Element ): [Node]]($.unwrap.md)

将 `el` 元素的内容提升到 `el` 的位置，其中包含的注释节点会一并提升，但会从返回集中清除。


### [$.detach( node: Node ): Node]($.detach.md)

将节点（通常为元素或文本节点）移出文档树，返回被移出的节点。**注**：注释节点也适用。


### [$.remove( node: Node ): this]($.remove.md)

删除文档树中的节点（元素或文本节点），返回调用者自身（`$`）。**注**：效果类似于未保存返回值的 `$.detach` 接口。


### [$.empty( el: Element ): this]($.empty.md)

清空 `el` 元素的内容，包括子元素、文本节点和注释节点等任意子节点。


### [$.normalize( el: Element, level?: number ): this | Number]($.normalize.md)

对元素 `el` 的内容执行规范化（normalize），合并相邻的文本节点。

这是元素原生同名接口的简单封装，但包含一个用户通告参数 `level`，用于指明 `normalize` 操作会影响的子元素层级。

> **注：**<br>
> DOM原生的 `normalize` 调用会处理目标元素的所有子孙节点，用户没有办法控制节点改变的细节，该操作实际上修改了DOM节点树。<br>
> tQuery支持嵌入代理，代理有时候需要知道 `normalize` 的影响范围（可能用于性能优化），因此这里设计为由用户主动告知（没有其它办法）。<br>
> 如果您不理解 `level` 参数的用途，说明您不需要它，简单忽略即可。<br>


### [$.clone( el: Node, event: boolean, deep?: boolean ): Node]($.clone.md)

对 `el` 节点进行克隆，返回克隆的新节点。`event` 和 `deep` 两个参数仅适用于元素，如果需要对注册的事件处理器一并克隆，传递 `event` 为 `true` 即可。默认深层克隆（`deep` 为真）。


## 元素属性

### [$.addClass( el: Element, names: string | Function ): this]($.addClass.md)

在 `el` 元素上添加类名，多个类名采用空格分隔。支持回调函数获取类名，接口：`function( className ): String`。


### [$.removeClass( el: Element, names: string | Function ): this]($.removeClass.md)

移除 `el` 元素上的类名，多个类名采用空格分隔，未指定名称（undefined|null）时移除全部类名。支持回调函数获取需要移除的类名，接口：`function( className ): String`。

> **注：**
> 如果元素上已无类名，class属性会被删除。


### [$.toggleClass( el: Element, val: string | boolean | Function, force: boolean ): this]($.toggleClass.md)

对 `el` 元素上的类名进行切换（有则删除无则添加）。支持空格分隔的多个类名，支持回调函数获取类名，接口：`function( className ): String|Boolean`。

未指定类名时，切换针对整个类名（`class` 属性），可以传递 `val` 为布尔值，明确设置或删除整个类名（`class` 属性），而非有无切换。`force` 的作用类似，但明确设置或删除指定的类名（`val`）。


### [$.hasClass( el: Element, names: string ): boolean]($.hasClass.md)

检查 `el` 元素的类名是否与 `nammes` 匹配，`names` 支持空格分隔的多个类名指定，其间关系为 `And` 的逻辑。

> **注：**<br>
> jQuery中的同名方法里，类名实参是一个整体（空格不是分隔符），即如：`A B` 与 `B A` 并不相同。


### [$.attr( el: Element, name: String | [String] | Object | Map, value: any ): Value | Object | this]($.attr.md)

获取或修改 `el` 元素的特性（Attribute）值。`value` 未定义或 `name` 为「字符串/字符串数组」时为获取（取值），否则为设置操作。

- 取值时：`name` 支持字符串名称或字符串名称数组（非空格分隔的名称序列）。支持 `data-xx` 系的名称简写形式（`-xx`）。返回一个值或**名/值对**对象。
- 设置时：`name` 支持字符串名称或**名/值对**配置对象（`Object|Map`），`value` 可以是一个取值函数。返回调用者（this）自身。

> **附注：**<br>
> `Attribute` 这里译为特性，表示一开始就固定的（源码中）。修改需借助于方法（元素的 `setAttribute()` 接口）。<br>
> 后面的 `Property` 译为属性，表示运行时计算出现的。可通过直接赋值修改。<br>


### [$.prop( el: Element, name: String | [String] | Object | Map, value: any ): Value | Object | this]($.prop.md)

获取或修改 `el` 元素的属性（Property）值。`value` 未定义或 `name` 为「字符串/字符串数组」时为获取（取值），否则为设置操作。

- 取值时：`name` 支持字符串名称或字符串名称数组（非空格分隔的名称序列）。支持 `data-xx` 系的名称简写形式（`-xx`）。返回一个值或**名/值对**对象。
- 设置时：`name` 支持字符串名称或**名/值对**配置对象（`Object|Map`），`value` 可以是一个取值函数。返回调用者（this）自身。

> **注：**<br>
> 部分属性名会自动转换（如：`class` => `clasName`），设置逻辑与元素原生赋值逻辑相同。


### [$.removeAttr( el: Element, names: string | Function ): this]($.removeAttr.md)

删除 `el` 元素上某个或多个特性（Attribute）本身。这实际上是 `$.attr(el, null)` 调用的专用版，可批量删除，效率也更高一些。支持 `data-` 系特性名的简写形式和空格分隔的多名称序列。

> **注：**<br>
> 作为除事件名和类名之外唯一一个支持空格分隔多个名称的接口，这也与 jQuery 的同名接口一致。


### [$.val( el: Element, value: Value | [Value] | Function ): Value | [Value] | this]($.val.md)


## 文本操作



## CSS 相关



## 事件扩展
