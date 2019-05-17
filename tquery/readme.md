# tQuery（类 jQuery）使用手册

## 前言

传统的 `jQuery` 使用十分方便友好，但随着 `ES6`、`HTML5/CSS3` 的逐步成熟，我们可以编写一个轻量级的类 `jQuery` 工具，这就是 `tQuery`。它采用 `ES6` 语法编写，仅包含 `jQuery` 中有关 `DOM`、`CSS` 和 `Event` 的部分，即省略了 `Ajax`、`Deferred` 和 `Effect` 等，这些部分由 `ES6/HTML5` 中原生的 `Fetch`、`Promise` 和 `CSS3` 来实现。

大部分接口与 `jQuery` 相似，少数地方略有变化，也有一些扩展和增强，如支持嵌入代理（见 `$.embedProxy`），用户可以修改接口的默认行为。`tQuery` 名称里的 `t` 来源于 `Tpb` 里的 `Template`，但也可以理解为 `tiny`。

> **提示：**<br>
> 可以打开 `test.html` 在浏览器控制台执行 `console.dir($)` 或 `console.dir($(''))` 简单的查看接口情况。



## Api 设计

`jQuery` 中对检索结果集的操作，在这里都有一个**单元素**的版本，如：`$.next(el, slr)`、`$.hasClass(el, names)` ，以及相应的集合版本：`$('xx').next(...)`、`$('xx').hasClass(...)`。单元素版通常返回 `$` 本身，集合版会返回一个 `Collector` 实例或值数组，与 `jQuery` 中类似，集合版的返回值 `Collector` 实例可以链式调用。

与 `jQuery` 对比，大多数情况下同名接口的行为都相似，但少数地方依然有明显区别。如对元素集的属性取值，`jQuery` 中是仅取集合内**首个元素**的值，如 `$('a').attr('href')` 取首个 `<a>` 元素的 `href` 属性值，而 `tQuery` 中则会返回集合里全部元素的属性值（作为一个数组）。

又如 `$.html` 接口，`jQuery` 中它既可以处理文本，也可以处理节点元素，效果与连续的 `$.empty().append()` 调用相似。但在 `tQuery` 中该接口只负责文本的逻辑：设置元素内容时接收文本参数，获取源码时接收节点参数，另外也扩展了一些关联性的功能，如转换源码。

本设计的接口参数中仅有类名和事件名支持空格分隔的多名称指定，其它元素属性必须用数组形式传递多个名称。另外在实现上，`Event` 为无侵入的 `DOM` 原生事件，元素上也不存储任何额外数据。总体上，这里的设计尽量精简，只要有可能就把任务交给原生的 `ES6`、`HTML5/CSS3` 等处理。


## 接口参考

### 基本工具

#### [$.Element( tag: string, data: any, ns: string, doc?: Document ): Element](docs/$.Element.md)

> 创建 `tag` 指定的DOM元素，可指定所属名称空间和所属文档对象。
> `data` 为数据配置对象或简单的数据集，支持类型：`{Object|Array|LikeArray|String|Node}`。


#### [$.Text( data: any, doc?: Document ): Node](docs/$.Text.md)

> 创建一个文本节点。`data` 可为字符串、节点元素或其数组，节点取文本（`textContent`）数据，数组单元间以空格串联。可指定所属文档对象。


#### [$.create( html: string, exclude: any[], doc?: Document ): DocumentFragment](docs/$.create.md)

> 创建文档片段。`<script>`、`<style>`、`<link>` 三种元素会被清理并存储到 `exclude` 空间中。


#### [$.svg( tag: any, opts: any, doc?: Document ): Element](docs/$.svg.md)

> 创建SVG系元素（自动采用 `http://www.w3.org/2000/svg` 名称空间）。
> 创建SVG根元素 `<svg>` 时 `tag` 参数为属性配置对象而不是标签名，如：`$.svg({width: 200, height: 100})` 创建一个宽200像素，高100像素的 `<svg>` 根容器元素。


#### [$.table( rows: number | Element, cols: number, caption: string, th0: boolean, doc?: Document ): Table](docs/$.table.md)

> 创建一个指定行列数的空表格（`Table` 实例），或封装一个规范的表格元素（无单元格合并或拆分）为 `Table` 实例。
> `Table` 仅提供最简单的表格操作：表标题设置，表头、表脚和主体表格行的添加、删除等，自动保持列数不变（也不能修改）。


### 节点查询

#### [$.get( slr: string, ctx: Element ): Element](docs/$.get.md)

> 查询单个元素的优化版（ID定位或 `.querySelector` 检索）。预先导入Sizzle时支持非标准CSS选择器。


### 节点遍历


### 节点过滤


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
