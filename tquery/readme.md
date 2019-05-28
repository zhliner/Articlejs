# tQuery 使用手册

## 前言

传统的 `jQuery` 使用十分方便友好，但随着 `ES6`、`HTML5/CSS3` 的逐步成熟，我们可以编写一个轻量级的类 `jQuery` 工具，这就是 `tQuery`。它采用 `ES6` 语法编写，仅包含 `jQuery` 中有关 `DOM`、`CSS` 和 `Event` 的部分，即省略了 `Ajax`、`Deferred` 和 `Effect` 等，这些部分由 `ES6/HTML5` 中原生的 `Fetch`、`Promise` 和 `CSS3` 来支持。

大部分接口与 `jQuery` 相似，少数地方略有变化，也有一些扩展和增强，如支持嵌入代理（见 `$.embedProxy`），用户可以修改接口的默认行为。`tQuery` 名称里的 `t` 来源于 `Tpb` 里的 `Template`，但也可以理解为 `tiny`。

> **提示：**<br>
> 可以打开 `test.html` 在浏览器控制台执行 `console.dir($)` 或 `console.dir($(''))` 简单的查看接口情况。



## Api 设计

`jQuery` 中对检索结果集的操作，在这里都有一个**单元素**的版本，如：`$.next(el, slr)`、`$.hasClass(el, names)` ，以及相应的集合版本：`$('xx').next(...)`、`$('xx').hasClass(...)`。单元素版通常返回 `$` 自身，集合版会返回一个 `Collector` 实例或值数组。与 `jQuery` 中类似，集合版的返回值 `Collector` 实例可以链式调用。

与 `jQuery` 对比，大多数情况下同名接口的行为相似，但少数地方依然有明显区别。如对元素集的属性取值，`jQuery` 中是仅取集合内**首个元素**的值，如 `$('a').attr('href')` 取首个 `<a>` 元素的 `href` 属性值，而 `tQuery` 中则会返回集合里全部元素的属性值（作为一个数组）。

又如 `$.html` 接口，`jQuery` 中它既可以处理文本，也处理节点元素，效果与连续的 `$.empty().append()` 调用相似。但在 `tQuery` 中该接口只负责文本的逻辑：设置元素内容时接收文本或提取元素的 `outerHTML` 文本，获取源码时提取元素的 `innerHTML` 值。另外也扩展了文本关联的功能，如转换源码。

本设计的接口参数中仅有类名和事件名支持空格分隔的多名称指定，其它元素属性必须用数组形式传递多个名称。另外在实现上，`Event` 为无侵入的 `DOM` 原生事件，元素上也不存储任何额外数据。总体上，这里的设计尽量精简，只要有可能就把任务交给原生的 `ES6`、`HTML5/CSS3` 等处理。


## 接口参考

### 基本工具

#### [$.Element( tag: string, data: any, ns: string, doc?: Document ): Element](docs/$.Element.md)

创建 `tag` 指定的DOM元素，可指定所属名称空间和所属文档对象。
`data` 为数据配置对象或简单的数据集，支持类型：`{Object|Array|LikeArray|String|Node}`。


#### [$.Text( data: String | Node | Array | Collector, doc?: Document ): Text](docs/$.Text.md)

创建一个文本节点。`data` 可为字符串、节点元素或其数组，节点取文本（`textContent`）数据，数组单元间以空格串联。可指定所属文档对象。


#### [$.create( html: string, exclude: Array, doc?: Document ): DocumentFragment](docs/$.create.md)

创建文档片段。`<script>`、`<style>`、`<link>` 三种元素会被清理并存储到 `exclude` 空间中。


#### [$.svg( tag: String | Object, opts: Object, doc?: Document ): Element](docs/$.svg.md)

创建SVG系元素（自动采用 `http://www.w3.org/2000/svg` 名称空间）。
创建SVG根元素 `<svg>` 时 `tag` 参数为属性配置对象而不是标签名，如：`$.svg({width: 200, height: 100})` 创建一个宽200像素，高100像素的 `<svg>` 根容器元素。


#### [$.table( rows: number | Element, cols: number, caption: string, th0: boolean, doc?: Document ): Table](docs/$.table.md)

创建一个指定行列数的空表格（`Table` 实例），或封装一个规范的表格元素（无单元格合并或拆分）为 `Table` 实例。
`Table` 仅提供最简单的表格操作：表标题设置，表头、表脚和主体表格行的添加、删除等，自动保持列数不变（也不能修改）。


#### [$.script( data: string | Element, box: Element, doc?: Document ): Element | Promise](docs/$.script.md)

插入一个脚本元素 `<script>`。可以传入脚本内容创建一个内联的 `<script>` 元素，也可以用 `$.Element()` 创建一个引入外部脚本（通过 src 属性）的 `<script>` 元素后在此插入。后一种方式会返回一个承诺对象（Promise），用户可以注册脚本导入完成后的处理函数。

`box` 是脚本元素插入的目标容器，可选。默认插入 `document.head` 元素内。


#### [$.style( data: string | Element, next: Element, doc?: Document ): Element | Promise](docs/$.style.md)

插入一个包含内容的样式元素 `<style>`，也可以用 `$.Element()` 创建一个引入外部样式的 `<link>` 元素由此插入。后一种方式会返回一个承诺对象（Promise），用户可以注册样式导入完成后的处理函数。

`next` 是 `<style>` 或 `<link>` 元素插入的参考元素，可选。默认插入到 `document.head` 元素内的末尾。


#### [$.load(el: Element, next: Element, box: Element): Promise](docs/$.load.md)

载入元素的外部资源，元素需要能够触发 load 和 error 事件，如 `<img>`。返回一个承诺对象，其中的 resolve 回调由 load 事件触发，reject 回调由 error 事件触发。通常需要元素插入DOM树后才会执行资源的载入。

> **注：**<br>
> `<script>` 和 `<link>` 元素实际上也符合本接口，但前者执行后可以删除，后者实际上属于 style 范畴（可并入 `$.style` 接口）。


#### [$.each( obj: any, handle: Function, thisObj: any ): any](docs/$.each.md)

通用的遍历工具，支持数组、类数组、普通对象和包含 `.entries` 接口（如：Map、Set）的任意对象。Collector 继承于数组，故也可直接使用。

传入迭代回调处理器的实参分别为：`value`（值），`key`（键），`obj`（迭代对象自身）。**注**：类似于数组的 `forEach` 标准接口定义。


#### [$.range( beg: string | number, size: string | number, toArr?: boolean ): Array | Iterator](docs/$.range.md)

构造目标范围内一个连续的值序列，适用于数值和 `Unicode` 码点类型。通常会返回一个迭代器，除非明确指定返回数组（`toArr` 为 `true`）。


#### [$.now( json: boolean ): string | number](docs/$.now.md)

返回当前时间：自纪元（1970-01-01T00:00:00）开始后的毫秒数（与时区无关）。如果传递 `json` 为真，则表示为标准的 JSON 格式。

这基本上就是对 `new Date().getTime()` 或 `Date.now()` 接口的简单封装（附带包含了 `.toJSON()` 的逻辑）。


#### [$.isXML( el: Element | Object ): boolean](docs/$.isXML.md)

检查目标是否为一个 XML 节点。


#### [$.ready( handle: Function ): this](docs/$.ready.md)

文档载入就绪后的回调绑定。可以绑定多个，会按绑定先后逐个调用。若文档已载入并且未被hold，会立即执行绑定的handle。

> **注：**<br>
> 仅适用于文档的初始载入就绪。其它元素的载入就绪请使用 $.load() 接口。


#### [$.holdReady( hold: boolean ): void](docs/$.holdReady.md)

暂停或恢复 `.ready()` 注册的用户调用的执行。应当在页面加载的前段调用，传递 `true` 暂停 `.ready()` 注册的用户调用的执行，传递 `false` 则恢复，可能有多个 `.ready()` 的注册，一次 `.holdReady()` 调用对应一次 `.ready()`。

如果文档已就绪并已调用 `ready()` 注册的用户函数，本操作无效（同jQuery）。


### 节点查询

#### [$.get( slr: string, ctx?: Element ): Element](docs/$.get.md)

查询单个元素的优化版（ID定位或 `.querySelector` 检索）。预先导入Sizzle时支持非标准CSS选择器。


#### [$.find( slr: string, ctx?: Element, andOwn?: boolean ): [Element]](docs/$.find.md)

在上下文元素内查找和选择器匹配的子元素集，如果传递 `andOwn` 实参为 `true`，则选择器匹配包含上下文元素自身。


### 节点遍历

#### [$.next( el: Element, slr: string ): Element | null](docs/$.next.md)

获取 `el` 的下一个兄弟元素。可用 `slr` 进行匹配测试，匹配不成功则返回 null，可选。


#### [$.nextAll( el: Element, slr: string ): [Element]](docs/$.nextAll.md)

获取 `el` 的后续全部兄弟元素。可用 `slr` 进行匹配过滤（符合者入选）。


#### [$.nextUntil( el: Element, slr: string | Element ): [Element]](docs/$.nextUntil.md)

获取 `el` 的后续兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。


#### [$.prev( el: Element, slr: string ): Element | null](docs/$.prev.md)

获取 `el` 的前一个兄弟元素。可用 `slr` 进行匹配测试，匹配不成功则返回 null，可选。这是 `$.next` 方法的反向查询。


#### [$.prevAll( el: Element, slr: string ): [Element]](docs/$.prevAll.md)

获取 `el` 前部的全部兄弟。可用 `slr` 进行匹配过滤（符合者入选）。**注**：结果集保持逆向顺序（靠近 `el` 的元素在前）。


#### [$.prevUntil( el: Element, slr: string | Element ): [Element]](docs/$.prevUntil.md)

获取 `el` 的前端兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。**注**：结果集成员保持逆向顺序。


#### [$.children( el: Element, slr: string ): [Element]](docs/$.children.md)

获取 `el` 的直接子元素集，可用 `slr` 进行匹配过滤（符合者入选）。返回一个子元素的数组（Array类型）。


#### [$.siblings( el: Element, slr: string ): [Element] | null](docs/$.siblings.md)

获取 `el` 元素的兄弟元素，可用 `slr` 进行匹配过滤（符合者入选）。`el` 需要在一个父元素内，否则返回 null（游离节点）。


#### [$.parent( el: Element, slr: string | Function ): Element | null](docs/$.parent.md)

获取 `el` 元素的直接父元素。`slr` 为选择器或测试函数，用于测试父元素是否匹配。


#### [$.parents( el: Element, slr: string | Function ): [Element]](docs/$.parents.md)

获取 `el` 元素的上级元素集。`slr` 为可选的选择器或测试函数，用于过滤。


#### [$.parentsUntil( el: Element, slr: string | Function | Array | Element ): [Element]](docs/$.parentsUntil.md)

汇集 `el` 元素的全部上级元素，直到 `slr` 匹配（不含匹配的元素）。从父元素开始匹配测试，结果集保持从内向外的逐层顺序。


#### [$.closest( el: Element, slr: string | Function | Array | Element ): Element](docs/$.closest.md)

获取 `el` 最近的匹配的父级元素。向上逐级检查父级元素是否匹配，返回最先匹配的目标元素。

会从 `el` 元素自身开始测试匹配（同标准 Element:closest），如果抵达 `document` 或 `DocumentFragment` 会返回 null。


#### [$.offsetParent( el: Element ): Element](docs/$.offsetParent.md)

获取 `el` 最近的父级定位元素。从父元素开始检查，如果最终没有匹配返回文档根元素（即 `<html>`，同 jQuery）。如果当前元素属于 `<svg>` 的子节点，则返回 `<svg>` 元素本身。

此接口与元素原生的 `offsetParent` 属性稍有不同，不管元素是否隐藏，都会返回 `position` 为非 `static` 的容器元素。

> **注：**<br>
> 元素的 `position` 样式被设置为：`relative`、`absolute`、`fixed` 时即为定位元素。<br>
> 元素原生的 `offsetParent` 属性在元素隐藏（`display:none`）时值为 null。<br>


### 节点过滤

#### [$.filter(els: Array | NodeList, fltr: string | Function | Array | Element): [Element]](docs/$.filter.md)

对 `els` 中的元素用 `fltr` 匹配过滤，返回一个匹配元素的新的集合。如果没有过滤条件，返回原始集。


### 节点操作


### 元素属性


### 文本操作


### CSS 相关


### 事件扩展



## 附：与jQuery同名接口存在的差异（简表）

- `.contains`
    - jQuery：仅针对内部子孙元素，不含容器元素自身测试。
    - tQuery：包含容器元素自身测试，与DOM同名接口行为相同。

- `.hasClass`
    - jQuery：对空格分隔的名称序列视为一个整体。
    - tQuery：空格分隔的名称序列被视为多个名称，逐个判断，因此 `class="A B"` 与 `class="B A"` 是一样的。

- `$().is`
    对集合中每一个元素判断，返回一个true和false值混合的集合。需用数组的some或every作进一步详细的判断。

- `$.data`
    没有该接口，元素的data-xx系属性融入在attr和prop接口中，且支持名称简写（-xx，无前置data词）。



## 附：嵌入代理（$.embedProxy）的应用

### plugins/tracker.js

追踪用户对页面元素的修改操作，提供回溯（Undo/Redo）的简便处理方式。
