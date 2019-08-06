# 接口参考

## 基本工具

### [$.Element( tag, data, ns, doc? ): Element](docs/$.Element.md)

创建 `tag` 指定的元素。

- `tag: String` 标签名称。
- `data: Node | [Node] | String | [String] | Object` 元素内容的数据集或配置对象。
- `ns: String` 元素的名称空间，可选。
- `doc?: Document` 元素所属文档，可选。

可指定所属名称空间和所属文档对象。如果数据源 `data` 包含节点，源节点通常会被移出DOM原来的位置。


### [$.Text( data, sep?, doc? ): Text](docs/$.TextNode.md)

创建一个文本节点。

- `data: String | [String] | Node | [Node]` 文本节点的数据内容。
- `sep?: String` 数据源为数组时各单元的连接符，可选。默认值为一个空格。
- `doc?: Document` 文本节点所属文档，可选。

数据源为节点时取其文本（`textContent`）值，数组单元取值为字符串后以 `sep` 串连。


### [$.create( html, clean, doc? ): DocumentFragment](docs/$.create.md)

创建一个文档片段。

- `html: String` 文档片段的HTML内容。
- `clean: Function | null | false` 节点清理函数，可选。
- `doc?: Document` 文档片段所属文档，可选。

默认的节点清理函数会移除 `<script>`、`<style>`、`<link>` 三种元素，同时也会清除掉 `onerror`, `onload`, `onabort` 三个脚本类特性定义。如果不需要对创建的文档片段做任何清理，可传递 `clean` 为 `false`，如果需要传递后续的文档实参，`clean` 可传递为 `null`（占位）。

节点清理函数接口：`function( DocumentFragment ): void`，其中唯一的实参为尚未导入当前文档（`document.adoptNode()`）的文档片段。


### [$.svg( tag, opts, doc? ): Element](docs/$.svg.md)

创建SVG系元素。

- `tag: String | Object` SVG系元素标签名或 `<svg>` 根元素配置对象。
- `opts: Object` SVG系元素配置对象，可选。
- `doc?: Document` 元素所属文档，可选。

创建 `<svg>` 根元素时，`tag` 参数为特性配置对象而不是标签名，如：`$.svg({width: 200, height: 100})` 创建一个宽200像素，高100像素的 `<svg>` 根容器元素。

> **注：**
> 系统会自动采用 `http://www.w3.org/2000/svg` 名称空间创建SVG元素。


### [$.table( rows, cols, caption, th0, doc? ): Table](docs/$.table.md)

创建一个指定行列数的空表格（封装为 `Table` 实例），或封装一个已有的规范表格元素为 `Table` 实例。

- `rows: Number | Element` 表格的行数或一个已有的规范表格元素。
- `cols: Number` 表格的列数。
- `caption: String` 表格标题的内容，仅支持文本。
- `th0: Boolean` 首列是否为 `<th>` 单元格（列表头）。
- `doc?: Document` 表格元素所属文档。

返回的 `Table` 类实例仅提供极简单的表格操作，主要是针对 `行` 的逻辑，如：添加行、删除行、获取行等。表格的列数保持不变，也不提供修改的方法，因此表格的操作可以极大简化。另外也不提供单元格的内容操作，它们交由外部的 `.html()` 或 `.text()` 等接口实现，这样 `Table` 的实现就非常的简单和轻量。

> **注：**
> 规范的表格指无单元格合并的情况，即所有单元格的 `colSpan` 和 `rowSpan` 值都为 `1`。


### [$.Table](docs/$.table.md#table-接口)

即 `$.table()` 接口创建并返回的实例所属的类，被导出用于外部可能需要的继承复用。


### [$.script( data, box, doc? ): Element | Promise](docs/$.script.md)

插入一个 `<script>` 脚本元素。

- `data: String | Element | Object` 脚本代码或一个已有的脚本元素或一个配置对象。
- `box: Element` 包含脚本元素的容器元素，可选。
- `doc?: Document` 脚本元素所属文档，可选。

传入文本内容时创建一个内联的 `<script>` 元素并返回该元素。传递一个元素的配置对象（`{src:...}`）或一个已有的脚本元素时，插入容器并返回一个承诺（`Promise`）对象，`Promise.then()` 的实参为脚本元素。

脚本插入的目标容器 `box` 可选，默认插入 `document.head` 元素内，未明确指定 `box` 时，插入的 `<script>` 是临时的，执行后会自动移除。


### [$.style( data, next, doc? ): Element | Promise](docs/$.style.md)

构造并插入一个包含内容的 `<style>` 样式元素，或者一个引入外部CSS资源的 `<link href=...>` 元素，或者一个已经创建好的 `<style>` 或 `<link>` 元素。

- `data: String | Element | Object` 样式代码或样式元素或一个配置对象。
- `next: Element` 样式元素插入参考的**下一个**元素（插入它的前面），可选。默认插入到 `document.head` 内末尾。
- `doc?: Document` 元素元素所属文档，可选。

如果 `data` 是一个配置对象，通常包含如下成员：

```js
href:  String   // <link>元素的CSS资源定位。
rel:   String   // <link>元素的属性（stylesheet）。
text:  String   // <style>元素的CSS代码。这也是创建<style>或<link>的判断依据。
scope: Boolean  // <style>元素的一个可选属性。
```

传入配置对象构建或一个构建好的元素插入时，返回一个承诺对象（Promise），否则返回创建的 `<style>` 元素本身。


### [$.loadin( el, next, box ): Promise](docs/$.loadin.md)

载入元素的外部资源。

- `el: Element` 待载入资源的目标元素，比如一个 `<img>`。
- `next: Node` 目标元素插入的 **下一个** 元素/节点参考。
- `box: Element` 目标元素插入的容器元素，当无法用 `next` 指定位置时采用，可选。

注意：元素需要能够触发 `load` 和 `error` 事件。返回一个承诺对象，其中的 `resolve` 回调由 `load` 事件触发，`reject` 回调由 `error` 事件触发。


### $.isXML( it ): Boolean

检查目标是否为一个 XML 节点。

- `it: Element | Object` 待检测的目标，一个元素或其它文档对象。

```html
<svg baseProfile="full" width="300" height="200">
    <rect width="50%" height="100%" fill="orangered"></rect>
</svg>
```

```js
let rect = $.get('rect');
$.isXML( rect );  // true
$.isXML( document.body );  // false
```


### [$.contains( box, node ): Boolean](docs/$.contains.md)

检查目标节点 `node` 是否包含在 `box` 元素之内。

- `box: Element` 是否包含目标节点的容器元素。
- `node: Node` 待检测的目标节点。

这只是一个对元素 `.contains` 接口的简单封装，匹配检查包含容器元素自身。**注**：`jQuery.contains()` 的行为稍有不同。


### [$.cloneEvent( src, to, evns ): Element | null](docs/$.cloneEvent.md)

把元素 `src` 上绑定的事件处理器克隆到 `to` 元素上。

- `src: Element` 事件处理器克隆的来源元素（其上绑定的事件处理器将被克隆）。
- `to: Element` 事件处理器克隆到的目标元素，不影响它上面原有绑定的事件处理器。
- `evns: String | Array2 | [Array2]` 克隆的目标配置。可以是事件名（序列）、**[事件名, 委托选择器]**值对或该值对的数组。

事件处理器的克隆与元素的种类无关（如：`<input>` 上的事件处理器可克隆到 `<p>` 上，即便该事件并不会在 `<p>` 上发生）。克隆仅限于元素自身上的绑定，不包含子孙元素上的事件处理器克隆。

返回克隆了事件处理器的目标元素，如果没有事件处理器被克隆，返回 `null`。

> **注：**<br>
> 传递名称序列（不指定选择器）时，仅仅是忽略选择器检查，源上原有的选择器依然会起作用。<br>
> 如果传递配置对以包含准确的委托选择器检查，则其中空的选择器应当设置为 `null` 或 `undefined`，否则不会匹配。<br>


### [$.controls( form ): [Element]](docs/$.controls.md)

获取表单元素 `form` 内可提交类控件元素的集合。

- `form: Element` 目标表单元素。

可提交类控件是指包含 `name` 特性（`Attribute`）定义的控件元素。对于 `input:checkbox` 类控件，即便它们中一个都没有被选中，也不影响它们是可提交类控件。

> **注：**<br>
> 同名的控件在表单中是一个**数组**的逻辑，返回集合中只会保留其中最后一个（`.val()` 方法可正常取值）。


### [$.serialize( form, exclude? ): [Array2]](docs/$.serialize.md)

序列化表单内可提交类控件的名称和值。

- `form: Element` 目标表单元素。
- `exclude?: [String]` 需要排除的控件名序列，可选。

注意：这与表单的提交逻辑相关，因此只有实际会提交的值才会被序列化。实际上，内部实现是调用 `$.controls()` 获取控件集，然后提取控件的名值对但忽略无选中值的控件。
返回一个**名/值对**（`[name, value]`）双成员数组（`Array2`）的数组。


### [$.queryURL( target ): String](docs/$.queryURL.md)

用数据源构造 `URL` 查询串（即 `URL` 中 `?` 之后的部分）。

- `target: Element | [Array2] | Object | Map` 构造查询串的数据源。

数据源可以是一个表单元素、一个**名/值对**数组的数组（`$.serialize()` 的返回值）、一个**键/值对**对象、或者是一个 `Map实例`。可直接传入一个表单元素，系统会自动提取表单内可提交控件的**名/值对**集合。

> **注：**<br>
> 出于可视性友好，Unicode字符、数字和一些常用的全角标点符号不会被转换。这与现代浏览器地址栏中的实际表现一致。


### [$.ready( handle ): this](docs/$.ready.md)

文档载入就绪后的回调绑定。

- `handle: Function` 就绪回调函数。

可以绑定多个回调，系统会按绑定的先后顺序逐个执行。若文档已载入并且未被 `hold`（`$.holdReady(true)` 执行后），会立即执行该回调。

本接口仅适用于文档的初始载入就绪，不适用其它元素的载入就绪，如 `<img>`。


### [$.holdReady( hold ): void](docs/$.holdReady.md)

暂停或恢复 `.ready()` 注册的就绪回调的执行。

- `hold: Boolean` 停止/恢复通知，`true` 表示 `hold`，`false` 表示释放。

应当在页面加载的前段调用，传递 `true` 暂停 `.ready()` 注册的就绪回调的执行，传递 `false` 则恢复，可以多次调用 `.holdReady(true)`，但恢复时则需要调用等量次数的 `.holdReady(false)`。

如果文档已就绪并已调用 `ready()` 注册的回调，本操作无效（同 jQuery）。


### [$.embedProxy( getter ): tQuery | Proxy](docs/$.embedProxy.md)

在 `$` 中嵌入代理。

- `getter: Function` 代理方法获取器。

由外部定义 `$` 的方法集实现覆盖。`getter` 接口：`function(name): Function`，接受方法名参数，返回一个与目标方法声明相同的函数。如覆盖：`$.hasClass(el, name)` 方法时，`getter` 的实参为 `hasClass`，返回的函数应当能够处理 `function(el: Element, name: String)` 的参数序列。

返回嵌入之前的 `$` 对象。可能是原始的 `tQuery` 实现，也可能是上一次嵌入之后更新了的 `$` 对象（`Proxy`）。

> **注：**<br>
> 这个接口可以为一些库类应用提供特别的方便，比如DOM树操作追踪（见：`plugins/tracker.js`）。


### $.Fx = {}

一个空的功能扩展区，由外部扩展使用。这只是一个名称空间约定。



## 基本操作

### [$( its, ctx ): Collector](docs/$().md)

通用的节点元素查询器，即 `$(...)` 调用，返回一个 `Collector` 实例。

- `its: String | Node | [Node] | .values | Value` 待查询/封装的值或集合。
- `ctx: Element | Document` 元素查询上下文，可选。默认为 `document`。

查询目标 `its` 支持CSS选择器、节点/元素集（简单打包）、拥有 `.values()` 接口的对象（如：`Set`）等。传递CSS选择器时返回一个元素集合，传递其它集合时返回该集合的 `Collector` 封装。

也可以传递一个单纯的值，除 `null` 和 `undefined` 外，非字符串的 `its` 实参会构造一个仅包含该值的 `Collector` 实例，如：`$(false)` => `Collector[false]` （**注**：这与jQuery稍有不同）。


## 前置说明

> #### 关于单元素版和集合版
>
> 以下接口以单元素版（仅针对单个元素）的方法为索引，它们被定义在 `$` 函数对象上。集合版是指 `$()` 调用的返回值类型（`Collector`）的方法，它们作为类方法存在。
> 两者有部分接口名称和功能相同，集合版仅仅是单元素版的简单重复执行，它们的详细使用说明会被书写在同一个文档中。
>
> 如 `.nextAll`：
> - 单元素版：`$.nextAll( el, slr )` 返回元素 `el` 的后续兄弟元素，`slr` 为匹配过滤。
> - 集 合 版：`$(...).nextAll( slr )` 检索集合内每一个元素的后续兄弟元素，`slr` 为匹配过滤。返回一个排序并去除了重复元素的集合。



## 节点查询

### [$.get( slr, ctx? ): Element | null](docs/$.get.md)

查询单个元素（ID定位或 `.querySelector` 检索，效率较高）。

- `slr: String` 目标元素选择器。
- `ctx?: Element | Document` 查询目标元素的上下文元素或文档。可选，默认为 `<html>` 根元素。

**注**：预先导入Sizzle时支持非标准的CSS选择器。


### [$.find( slr, ctx?, andOwn? ): [Element]](docs/$.find.md)

在上下文元素内查询和选择器匹配的元素集。

- `slr: String` 目标元素选择器。
- `ctx?: Element | Document` 查询目标元素的上下文元素或文档。可选，默认为 `<html>` 根元素。
- `andOwn?: Boolean` 是否包含上下文元素自身的匹配测试。可选，默认为 `false`。

传递 `andOwn` 实参为 `true` 会测试选择器是否匹配上下文元素自身，这在某些场景下会更方便使用。



## 节点遍历


### [$.next( el, slr ): Element | null](docs/$.next.md)

获取 `el` 的下一个兄弟元素。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String` 匹配测试的选择器，可选。

如果 `el` 的下一个兄弟元素不匹配 `slr`，会返回 `null`。


### [$.nextAll( el, slr ): [Element]](docs/$.nextAll.md)

获取 `el` 的后续全部兄弟元素。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String` 匹配测试的选择器，可选。

可用 `slr` 进行匹配过滤，匹配者入选。始终会返回一个数组，即便没有任何匹配（此时为一个空数组）。


### [$.nextUntil( el, slr ): [Element]](docs/$.nextUntil.md)

获取 `el` 的后续兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String | Element` 终点匹配测试的选择器或元素，可选。

始终会返回一个数组，如果最开始的下一个元素就匹配或为 `null`，会返回一个空数组。


### [$.prev( el, slr ): Element | null](docs/$.prev.md)

获取 `el` 的前一个兄弟元素。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String` 匹配测试的选择器，可选。

这是 `$.next()` 方法的逆向版。可用 `slr` 进行匹配测试，匹配不成功时返回 `null`。


### [$.prevAll( el, slr ): [Element]](docs/$.prevAll.md)

获取 `el` 前部的全部兄弟元素。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String` 匹配测试的选择器，可选。

这是 `$.nextAll()` 方法的逆向版。可用 `slr` 进行匹配过滤，匹配者入选。始终会返回一个数组，即便没有任何匹配。

> **注：**
> 结果集会保持DOM的逆向顺序（即：靠近 `el` 的元素在前）。


### [$.prevUntil( el, slr ): [Element]](docs/$.prevUntil.md)

获取 `el` 的前端兄弟元素，直到 `slr` 匹配（不包含 `slr` 匹配的元素）。

- `el: Element` 取值的目标源元素，不适用文本节点。
- `slr: String | Element` 终点匹配测试的选择器或元素，可选。

始终会返回一个数组，如果最开始的前一个元素就匹配或为 `null`，会返回一个空数组。

> **注：**
> 结果集会保持DOM的逆向顺序（即：靠近 `el` 的元素在前）。


### [$.children( el, slr ): [Element] | Element](docs/$.children.md)

获取 `el` 的直接子元素（集）。

- `el: Element` 取值的目标父元素。
- `slr: String | Number` 子元素匹配选择器或指定的位置下标，可选。

可用 `slr` 对子元素集进行匹配过滤，匹配者入选。也可以指定一个具体的下标位置获取单个子元素（支持负数从末尾算起），但这样可能导致位置超出范围，此时会返回一个 `undefined` 值。

允许直接指定位置下标可能更高效，这样就避免了使用位置选择器过滤，并且会直接返回一个元素。


### [$.contents( el, idx, comment? ): [Node] | Node](docs/$.contents.md)

获取 `el` 元素的内容，包含其中的子元素、文本节点和可选的注释节点。

- `el: Element` 取值的目标父元素。
- `idx: Number | null` 子节点的位置下标（相对于取值的集合）。可选。
- `comment?: Boolean` 是否包含注释节点。可选，默认 `false`。

可指定仅返回某个具体位置的子节点，位置计数针对取值的集合（可能包含注释节点），从0开始，支持负值从末尾算起。位置下标可能超出范围，此时会返回一个 `undefined` 值。

如果需要传递包含注释节点的实参 `true` 而又不需要指定位置下标，`idx` 可设置为 `null`（占位）。

> **注：**<br>
> 内容全部为空白（如换行、空格等）的文本节点会被忽略，因此计数也不会包含。


### [$.siblings( el, slr ): [Element] | null](docs/$.siblings.md)

获取 `el` 元素的兄弟元素。

- `el: Element` 取值的参考元素。
- `slr: String` 匹配过滤选择器，可选。

可用 `slr` 进行匹配过滤，匹配者入选。`el` 需要存在一个父元素，否则兄弟的逻辑不成立，此时会返回 `null`。


### [$.parent( el, slr ): Element | null](docs/$.parent.md)

获取 `el` 元素的直接父元素。

- `el: Element` 取值的目标元素。
- `slr: String | Function` 测试是否匹配的选择器或自定义的测试函数，可选。

如果父元素匹配 `slr` 选择器，或自定义的测试函数返回真，则测试成功，返回该父元素，否则返回 `null`。


### [$.parents( el, slr ): [Element]](docs/$.parents.md)

获取 `el` 元素的上级元素集。

- `el: Element` 取值的目标元素。
- `slr: String | Function` 测试是否匹配的选择器或自定义的测试函数，可选。

从父元素开始匹配测试，结果集保持从内向外的逐层顺序。如果 `slr` 为测试函数，接口为：`function(el:Element, i:Number): Boolean`，首个实参为上级元素自身，第二个实参为向上递进的层级计数（直接父元素为 `1`）。


### [$.parentsUntil( el, slr ): [Element]](docs/$.parentsUntil.md)

汇集 `el` 元素的全部上级元素，直到 `slr` 匹配（不含匹配的元素）。

- `el: Element` 取值的目标元素。
- `slr: String | Function | Element | [Element]` 测试终点匹配的选择器、或自定义的测试函数、或一个目标元素或一个元素的数组，可选。

从父元素开始匹配测试，结果集保持从内向外的逐层顺序。如果 `slr` 为测试函数，接口为：`function(el:Element, i:Number): Boolean`，首个实参为上级元素自身，第二个实参为向上递进的层级计数（直接父元素为 `1`）。


### [$.closest( el, slr ): Element | null](docs/$.closest.md)

获取 `el` 最近的父级匹配元素。

- `el: Element` 取值的目标元素。
- `slr: String | Function | Element | [Element]` 目标匹配选择器、或自定义的测试函数、或一个目标元素或一个元素的数组，可选。

向上逐级检查父级元素是否匹配，返回最先匹配的目标元素。会从 `el` 元素自身开始测试匹配（同标准 Element:closest），如果抵达 `document` 或 `DocumentFragment` 会返回 `null`。

如果 `slr` 是一个自定义的测试函数，接口为：`function(el:Element, i:Number): Boolean`，首个实参为递进的元素自身，第二个实参为向上递进的层级计数（当前元素时为 `0`）。


### [$.offsetParent( el ): Element](docs/$.offsetParent.md)

获取 `el` 最近的父级定位元素。

- `el: Element` 取值的目标源元素。

从父元素开始检查，如果最终没有匹配返回文档根元素（`<html>`，同 jQuery）。如果当前元素属于 `<svg>` 的子元素，则返回 `<svg>` 根容器元素（与普通的HTML节点相区分）。

与元素原生的 `offsetParent` 属性稍有不同，不管元素是否隐藏（`display:none`），都会返回 `position` 为非 `static` 的容器元素。

> **注：**
> 元素原生的 `offsetParent` 属性在元素隐藏时值为 `null`。



## 节点操作

### [$.before( node, cons, clone, event, eventdeep ): Node | [Node]](docs/$.before.md)

在 `node` 元素或文本节点的前面插入节点/集。

- `node: Node` 插入参考的目标节点/元素。
- `cons: Node | [Node] | Set | Iterator | Function` 插入的数据源（支持 `Collector`，下同）。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( node ): Node | [Node]`，实参为参考节点 `node`。与jQuery不同，这里不支持HTML源码实时构建元素节点（**注**：应使用 `.html()` 接口），仅支持现成的节点/元素。

克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回插入的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.insertBefore( to, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，插入到目标节点 `to` 之前，返回目标节点的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.after( node, cons, clone, event, eventdeep ): Node | [Node]](docs/$.after.md)

在 `node` 元素或文本节点的后面插入节点/集。

- `node: Node` 插入参考的目标节点/元素。
- `cons: Node | [Node] | Set | Iterator | Function` 插入的数据源。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( node ): Node | [Node]`，实参为参考节点 `node`。

不支持HTML源码实时构建元素节点，仅支持现成的节点/元素。克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回插入的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.insertAfter( to, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，插入到目标节点 `to` 之后，返回目标节点的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.prepend( el, cons, clone, event, eventdeep ): Node | [Node]](docs/$.prepend.md)

在 `el` 元素内的前端插入节点/集。

- `el: Element` 插入到的目标容器元素。
- `cons: Node | [Node] | Set | Iterator | Function` 插入的数据源。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( el ): Node | [Node]`，实参为目标容器元素 `el`。

不支持HTML源码实时构建元素节点，仅支持现成的节点/元素。克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回插入的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.prependTo( to, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，插入目标元素 `to` 内的前端，返回目标元素的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.append( el, cons, clone, event, eventdeep ): Node | [Node]](docs/$.append.md)

在 `el` 元素内的末尾插入节点/集。

- `el: Element` 插入到的目标容器元素。
- `cons: Node | [Node] | Set | Iterator | Function` 插入的数据源。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( el ): Node | [Node]`，实参为目标容器元素 `el`。

不支持HTML源码实时构建元素节点，仅支持现成的节点/元素。克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回插入的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.appendTo( to, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，添加到目标元素 `to` 内的末尾，返回目标元素的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.replace( node, cons, clone, event, eventdeep ): Node | [Node]](docs/$.replace.md)

用数据源节点/集替换 `node` 元素或文本节点。

- `node: Node` 被替换的目标节点/元素。
- `cons: Node | [Node] | Set | Iterator | Function` 替换用的内容数据。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( node ): Node | [Node]`，实参为替换的目标节点 `node`。

不支持HTML源码实时构建元素节点，仅支持现成的节点/元素。克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回替换成的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.replaceAll( node, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，替换目标节点 `node`，返回目标节点的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.fill( el, cons, clone, event, eventdeep ): Node | [Node]](docs/$.fill.md)

在 `el` 元素内填充节点/集，会清除原来的内容。

- `el: Element` 填充到的目标容器元素。
- `cons: Node | [Node] | Set | Iterator | Function` 填充的数据源。
- `clone: Boolean` 内容节点是否为克隆方式。可选，默认 `false`。
- `event: Boolean` 内容元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。
- `eventdeep: Boolean` 内容元素的子孙元素上绑定的事件处理器是否同时克隆。可选，默认 `false`。

数据源支持节点、节点集、`Set` 集合、返回节点的迭代器，或是一个返回节点/集的取值回调。回调接口：`function( el ): Node | [Node]`，实参为填充到的容器元素 `el`。

不支持HTML源码实时构建元素节点，仅支持现成的节点/元素。克隆参数（`clone`）适用于文本节点和元素，元素为深层克隆。事件克隆参数 `event` 和 `eventdeep` 仅适用于元素。接口返回填充的内容节点/元素（集），它们可能克隆而来。

> **关联：**<br>
> `Collector.fillTo( el, clone, event, eventdeep ): Collector`<br>
> 将集合自身作为数据源，填充到目标元素 `el` 内（清除原有），返回目标元素的 `Collector` 封装。<br>
> 如果传递克隆实参为真，克隆的节点集会构造一个 `Collector` 实例嵌入原集合和返回集合之间（链栈上多一个中间层）。<br>


### [$.wrap( node, box, clone, event, eventdeep ): Element](docs/$.wrap.md)

在 `node` 之外包裹一个容器元素，该容器元素将替换 `node` 原来的位置，如果 `node` 在DOM树中的话。

- `node: Node | String` 节点/元素或文本内容。
- `box: HTML | Element | Function` 包裹目标内容的容器元素、HTML结构源码或取值回调。
- `clone: Boolean` 是否克隆容器元素。可选，默认 `false`。
- `event: Boolean` 是否克隆容器元素上绑定的事件处理器。可选，默认 `false`。
- `eventdeep: Boolean` 是否克隆容器元素子孙元素上绑定的事件处理器。可选，默认 `false`。

被包裹的内容也可以是文本，它们会被自动创建为文本节点。包裹容器可以是一个现有的元素、一个HTML字符串（将被创建为元素）、或一个返回包裹元素或HTML字符串的函数。如果包裹容器包含子元素，最终的包裹元素会递进到首个最深层子元素，而初始的包裹容器（根）则会替换 `node` 节点原来的位置。返回包裹内容的（根）容器元素。


### [$.wrapInner( el, box, clone, event, eventdeep ): Element](docs/$.wrapInner.md)

在 `el` 的内容之外包裹一个容器元素，包裹容器会成为 `el` 唯一的子元素。

- `el: Element` 内容被包含的元素。
- `box: HTML | Element | Function` 包裹目标内容的容器元素、或HTML结构字符串、或一个取值回调。
- `clone: Boolean` 是否克隆容器元素。可选，默认 `false`。
- `event: Boolean` 是否克隆容器元素上绑定的事件处理器。可选，默认 `false`。
- `eventdeep: Boolean` 是否克隆容器元素子孙元素上绑定的事件处理器。可选，默认 `false`。

包裹容器可以是一个现有的元素、一个HTML字符串（将被创建为元素）、或一个返回包裹元素或HTML字符串的函数。如果包裹容器还包含子元素，最终的包裹元素会递进到首个最深层子元素，而初始的包裹容器（根）则会成为 `el` 唯一的子元素。返回包裹内容的（根）容器元素。


### [$.unwrap( el ): [Node]](docs/$.unwrap.md)

将 `el` 元素的内容解包裹提升到 `el` 原来的位置。

- `el: Element` 内容被解包的容器元素。

元素所包含的任何内容（包括注释节点）会一并提升，但返回集中不含注释节点和纯空白的文本节点。


### [$.detach( node ): Node](docs/$.detach.md)

将节点（通常为元素或文本节点）移出DOM文档树。

- `node: Node` 将被移出的节点。

返回被移出DOM文档树的节点。**注**：注释节点也适用。


### [$.remove( node ): this](docs/$.remove.md)

删除DOM文档树中的节点（元素或文本节点）。

- `node: Node` 将被移除的节点。

返回调用者自身（即 `$`）。**注**：效果类似于丢弃返回值的 `$.detach()`。


### [$.empty( el ): [Node] | null](docs/$.empty.md)

清空 `el` 元素的内容。

- `el: Element` 内容将被清除的容器元素。

清空的内容包括子元素、文本节点和注释节点等任意内容。返回被清除的节点内容，但仅包含子元素和非空文本节点。仅对元素类型有效，传递其它实参返回 `null`。


### [$.normalize( el, level? ): Number | Element](docs/$.normalize.md)

对元素 `el` 的内容执行规范化（normalize），即合并内容中的相邻文本节点。

- `el: Element` 执行操作的容器元素。
- `level?: Number` 影响的子元素层级告知，可选。这是一个特别参数，由用户传递。

这是元素原生同名接口的简单封装，但包含一个用户通告参数 `level`，用于指明 `normalize` 操作会影响的子元素层级。返回 `level` 值或操作的目标元素 `el`。

> **注：**<br>
> DOM原生的 `.normalize()` 调用会处理目标元素的所有子孙节点，用户没有办法控制节点改变的细节，但该操作实际上修改了DOM节点树。<br>
> tQuery支持嵌入代理，代理有时候想要知道 `normalize` 影响的大概范围，因此这里设计一个由用户主动告知的渠道（没有其它办法了）。如果您不理解 `level`，简单忽略即可。<br>


### [$.clone( node, event, deep?, eventdeep? ): Node](docs/$.clone.md)

对 `node` 节点/元素进行克隆。

- `node: Node` 待克隆的目标节点或元素。
- `event: Boolean` 是否同时克隆元素上绑定的事件处理器。可选，默认 `false`。
- `deep?: Boolean` 是否深层克隆子孙节点/元素。可选，默认 `true`。
- `eventdeep?: Boolean` 是否同时克隆子孙元素上绑定的事件处理器。需要在 `deep` 为 `true` 时才有意义。可选，默认 `false`。

三个布尔值参数 `event`、`deep` 和 `eventdeep` 仅适用于元素。返回新克隆的节点/元素。


### [$.scrollTop( el, val ): this](docs/$.scrollTop.md)

获取或设置 `el` 元素（文档或窗口）的垂直滚动条位置。

- `el: Document | Window | Element` 包含滚动条的文档、窗口或元素。
- `val: Number` 滚动到的目标位置，从顶部算起，单位为像素。

本接口返回调用者自身（`$`）。


### [$.scrollLeft( el, val ): this](docs/$.scrollLeft.md)

获取或设置 `el` 元素（文档或窗口）的水平滚动条位置。

- `el: Document | Window | Element` 包含滚动条的文档、窗口或元素。
- `val: Number` 滚动到的目标位置，从左侧端算起，单位为像素。

本接口返回调用者自身（`$`）。


## 元素属性

### [$.addClass( el, names ): this](docs/$.addClass.md)

在 `el` 元素上添加类名，多个类名可用空格分隔。

- `el: Element` 操作的目标元素。
- `names: String | Function` 类名称或一个返回类名称的取值回调。

获取类名称的取值回调函数接口：`function( [name] ): String`，实参为当前已有类名数组。本接口返回调用者自身（`$`）。


### [$.removeClass( el, names ): this](docs/$.removeClass.md)

移除 `el` 元素上的类名，多个类名可用空格分隔，未指定名称（`undefined | null`）时移除全部类名。

- `el: Element` 操作的目标元素。
- `names: String | Function` 类名称或一个返回类名称的取值回调。

支持回调函数获取需要移除的类名，接口：`function( [name] ): String`，实参为当前已有类名数组。如果元素上已无类名，`class` 特性（Attribute）本身会被删除。

本接口返回调用者自身（`$`）。


### [$.toggleClass( el, val, force ): this](docs/$.toggleClass.md)

对 `el` 元素上的类名进行切换（有则删除无则添加）。

- `el: Element` 操作的目标元素。
- `val: String | Boolean | Function` 欲切换的类名称（序列）或取值回调，也可以是一个布尔值，表示显示（`true`）或隐藏（`false`）整个 `className` 值。
- `force: Boolean` 目标名称的类名直接显示（`true`）或隐藏（`false`）。

支持空格分隔的多个类名，支持回调函数获取类名，接口：`function( [name] ): String | Boolean`，实参为当前已有类名数组。

未指定类名时，切换针对整个类特性（`class`），可以传递 `val` 为布尔值，明确设置或删除整个类特性（而非有无切换）。本接口返回调用者自身（`$`）。


### [$.hasClass( el, names ): Boolean](docs/$.hasClass.md)

检查 `el` 元素是否包含目标类名。返回一个布尔值。

- `el: Element` 待检查的目标元素。
- `names: String` 待测试的目标类名（序列）。

类名实参 `names` 支持空格分隔的多个类名指定，其间关系为 `And` 的逻辑，即：`AA BB` 与 `BB AA` 效果相同。


### [$.attr( el, name, value ): Value | Object | this](docs/$.attr.md)

获取或修改 `el` 元素的特性（Attribute）值。**注**：`Attribute` 这里译为特性，后面的 `Property` 译为属性。

- `el: Element` 操作的目标元素。
- `name: String | Object | Map` 名称序列或**名/值**对配置对象。
- `value: String | Number | Boolean | Function | null` 设置的特性值或返回值的取值回调。传递 `null` 值会删除目标特性。

当 `value` 未定义且 `name` 为字符串时为获取特性值，支持空格分隔的多个名称序列。当 `value` 传递值或 `name` 为**名/值**对配置对象时为设置特性值。

- 取值时：`name` 为字符串，单个名称或空格分隔的多个名称序列。单个名称时返回单个值，多个名称时返回一个 `名/值对` 对象。
- 设置时：`name` 为字符串名称（序列）或 `名/值对` 配置对象（`Object | Map`），`value` 可以是一个取值函数。返回调用者（this）自身。

支持两个特别的特性名 `html` 和 `text`，分别用于表达元素内的源码和文本，支持 `data-xx` 系名称的简写形式 `-xx`（前置短横线）。


### [$.prop( el, name, value ): Value | Object | this](docs/$.prop.md)

获取或修改 `el` 元素的属性（Property）值。

- `el: Element` 操作的目标元素。
- `name: String | Object | Map` 名称序列或**名/值**对配置对象。
- `value: String | Number | Boolean | Function | null` 设置的属性值或返回值的取值回调。

当 `value` 未定义且 `name` 为字符串时为获取属性值，支持空格分隔的多个名称序列。当 `value` 传递值或 `name` 为**名/值**对配置对象时为设置属性值。

- 取值时：`name` 为字符串，单个名称或空格分隔的多个名称序列。单个名称时返回单个值，多个名称时返回一个 `名/值对` 对象。
- 设置时：`name` 为字符串名称（序列）或 `名/值对` 配置对象（`Object | Map`），`value` 可以是一个取值函数。返回调用者（this）自身。

与 `$.attr()` 相同，支持两个特别的属性名 `html` 和 `text`，分别用于表达元素内的源码和文本，支持 `data-xx` 系名称的简写形式 `-xx`（前置短横线）。

> **注：**<br>
> 需要转换的属性名会自动转换（如：`class` => `clasName`），用户无需操心，两种形式皆可使用。


### [$.removeAttr( el, names ): this](docs/$.removeAttr.md)

删除 `el` 元素上一个或多个特性（Attribute）。

- `el: Element` 操作的目标元素。
- `names: String | Function` 要删除的目标特性名（序列）或取值回调。

这实际上是 `$.attr(el, name, null)` 调用的简化版，效率稍高一些。支持 `data-` 系特性名的简写形式和空格分隔的多名称序列。取值回调接口：`function( el ): String`。

> **注：**
> 不支持特殊的特性名 `html` 和 `text`。


### [$.val( el, value ): Value | [Value] | this](docs/$.val.md)

表单控件的取值或状态设置。

- `el: Element` 操作的表单控件元素。
- `value: Value | [Value] | Function` 设置的值或值集，或返回值（集）的回调。

部分控件（如 `input:radio`, `input:checkbox`, `<section>`）的设置为选中或取消选中逻辑，部分控件（如 `input:text`, `input:password`, `<textarea>`）为设置 `value` 值本身。对于多选控件（如 `<select multiple>`），`value` 可以传递为一个值数组，用于同时选定多个条目。

取值和设置都会依循严格的表单提交（`submit`）逻辑：

- 未选中的的控件（如单个复选框）不会被提交，因此取值时返回 `null`。
- `disabled` 的控件值也不会被提交，因此取值时返回 `null`，设置时被忽略。
- 无名称（`name` 属性）定义的控件不会被提交，因此取值时返回 `undefined`，设置时被忽略。

> **注：**<br>
> 该接口应当仅用于表单内控件，如需无条件获取或设置控件的 `value` 特性（或属性），请使用 `.attr()/.prop()` 接口。



## 文本操作

### [$.html( el: String | Element, code: String | [String] | Node | [Node] | Function | .values, where?: String | Number, sep?: String ): String | [Node]](docs/$.html.md)

提取或设置 `el` 元素的HTML源码，如果传递 `el` 为字符串，则为源码转换（如 `<` 到 `&lt;`）。设置源码时，数据源支持字符串、节点元素或其数组形式，也支持取值回调（接口：`function(el): Any`）。

**设置时：**

- 数据源为字符串时，禁止脚本元素 `<script>`、样式元素 `<style>`、以及链接元素 `<link>` 的源码文本，它们会被自动滤除。
- 源数据为文本节点或元素时，取其 `textContent` 或 `outerHTML` 值作为赋值源码（因此是一种简单的克隆方式）。
- 数据源也可是字符串/节点/元素的数组或集合（需支持 `.values` 接口），取值成员之间以指定的分隔符串连（默认空格）。集合成员也可以是多种类型值的混合。

与 jQuery 中同名接口不同，这里可以指定内容插入的位置（相对于 `el` 元素）：`before|after|begin|end|prepend|append|fill|replace` 等。另外，如果数据源为元素或节点，不会对原节点造成影响（文本逻辑）。

**返回值**：返回新创建的节点集（数组）或转换后的HTML源码。


### [$.text( el: String | Element, code: String | [String] | Node | [Node] | Function | .values, where?: String | Number, sep?: String ): String | Node](docs/$.text.md)

提取或设置 `el` 元素的内容文本，如果传递 `el` 为字符串，则为将源码解码为文本（如 `&lt;` 到 `<`）。与 `.html` 接口类似，设置时支持的数据源类型相同，但取值行为稍有不同。

**设置时：**

- 字符串以文本方式插入，HTML源码视为文本（原样展示在页面中）。
- 源数据为文本节点或元素时，都是提取其文本（`textContent`）内容。
- 数据源也可是字符串/节点/元素的数组或集合（支持 `.values` 接口），集合成员也可以是多种类型值的混合。

与 `.html` 接口类似，取值回调的接口为：`function(el): Any`，也支持在指定的位置（`before|after|begin|end|prepend|append|fill|replace`）插入文本（**注**：实际上是一个文本节点）。

**返回值**：源码解码后的文本或新创建的文本节点。



## CSS 相关

### [$.css( el: Element, name: String | Object | Map | null, val: String | Number | Function ): String | Object | this](docs/$.css.md)

获取或设置 `el` 元素的样式，可以一次获取多个，也可以一次设置多个。设置时为设置元素的内联样式（`style` 属性），获取时为元素计算后的样式值。

`name` 参数的含义：

- **取值时**：样式名称或空格分隔的名称序列。指定单个名称返回单一的值，指定多个名称返回一个 `样式名:值` 的对象（`Object`）。
- **设置时**：除了普通的单个或多个名称，还可以是一个 `样式名:值` 对象（`Object` | `Map`），键为样式名，值为样式值或取值回调（接口：`function( oldval, el ): Value`）。


### [$.offset( el: Element, pair: Object | Function | null ): Object | this](docs/$.offset.md)

获取或设置 `el` 元素相对于文档的位置偏移，偏移定义采用一个包含 `top` 和 `left` 键名的对象（如 `{top:200, left:10}`）。获取的值可能不是一个整数，位置计算也不包含元素的外边距（`margin`），但包含边框。

设置元素的偏移时，如果元素的 `position` 值是浏览器默认的 `static`，则会自动修改为 `relative`（**注**：与jQuery版行为相同）。传递 `pair` 为 `null` 会清除偏移设置并返回之前的偏移值。


### [$.position( el: Element ): Object](docs/$.position.md)

获取 `el` 元素相对于上层定位元素（顶部）的位置，计算的起点是 `el` 元素的外边距处（与 `.offsetTop/.offsetLeft` 属性值相差一个边距值）。

不能在 `window/document` 上调用本方法（同 jQuery）。对于SVG的子节点来说，调用本方法可以获得子节点相对于 `<svg>` 根容器的偏移值。

> **注：**<br>
> 上层定位元素是指上层容器元素的样式中 `position` 值非默认的 `static`。<br>
> 计算被隐藏的元素（样式：`display:none`）的相对位置没有意义。<br>


### [$.height( el: Element | Document | Window, val: String | Number | Function ): Number | this](docs/$.height.md)

获取或设置 `el` 元素的内容高度，设置值可包含任意单位，纯数值视为像素（`px`），传递 `val` 值为一个空串或 `null` 会删除高度样式。获取的值为纯数值（像素单位），方便直接用于计算。`val` 也可以为取值回调函数，接口：`function( curr-height ): String | Number`。

如果 `el` 是文档对象（如 document）或窗口（如 window），可以获取其高度（但不可设置）。

> **注：**<br>
> 始终针对元素的内容部分，与 `box-sizing` 值无关。<br>
> 与 jQuery 稍有不同，jQuery 中 val 传递 null 并不会删除高度样式（只是忽略）。<br>

**背景知识：**

- `box-sizing` 值为 `content-box` 时： **CSS**: height = 内容高度（默认）
- `box-sizing` 值为 `border-box` 时：**CSS**: height = 内容高度 + padding宽度 + border宽度


### [$.width( el: Element | Document | Window, val: String | Number ): Number | this](docs/$.width.md)

获取或设置 `el` 元素的内容宽度，设置值可包含任意单位，纯数值视为像素（`px`），传递 `val` 值为一个空串或 `null` 会删除宽度样式。获取的值为纯数值（像素单位），方便直接用于计算。`val` 也可以为取值回调函数，接口：`function( curr-width ): String | Number`。

如果 `el` 是文档对象（如 document）或窗口（如 window），可以获取其宽度（但不可设置）。与 `$.height` 接口相同，始终针对元素的内容部分，与 `box-sizing` 值无关。


### [$.innerHeight( el: Element ): Number](docs/$.innerHeight.md)

获取 `el` 元素的内部高度（包含 `padding` 部分但不包含 `border` 部分）。该接口不包含设置目标高度的功能，如果需要请使用 `$.height` 接口。


### [$.innerWidth( el: Element ): Number](docs/$.innerWidth.md)

获取 `el` 元素的内部宽度（包含 `padding` 部分但不包含 `border` 部分）。该接口不包含设置目标宽度的功能，如果需要请使用 `$.width` 接口。


### [$.outerHeight( el: Element, margin?: Boolean ): Number](docs/$.outerHeight.md)

获取 `el` 元素的外围高度（包含 `border` 部分，可选的包含 `margin` 部分）。该接口不包含设置目标高度的功能，如果需要请使用 `$.height` 接口。


### [$.outerWidth( el: Element, margin?: Boolean ): Number](docs/$.outerWidth.md)

获取 `el` 元素的外围宽度（包含 `border` 部分，可选的包含 `margin` 部分）。该接口不包含设置目标宽度的功能，如果需要请使用 `$.width` 接口。


## 事件接口

### [$.on( el: Element, evn: String | Object, slr: String, handle: Function | Object | false | null ): this](docs/$.on.md)

在 `el` 元素上绑定 `evn` 事件的处理器 `handle`。`evn` 支持空格分隔的多个事件名，也可以是一个**事件名:处理器**的配置对象。如果传递 `slr` 为一非空字符串则为委托（`delegate`）方式，事件冒泡到匹配该选择器的元素时触发调用。

`handle` 可以是一个简单的函数，也可以是一个实现了 `EventListener` 接口的对象（包含 `handleEvent` 方法），或者作为特例：传递 `false` 和 `null` 两个值，分别表示「停止事件默认行为」的处理器，和「停止事件默认行为并停止事件冒泡」的处理器。

> **注：**<br>
> 在一个元素上多次绑定同一个事件名和相同的处理器函数是有效的。


### [$.off( el: Element, evn: String | Object, slr: String, handle: Function | Object | false | null ): this](docs/$.off.md)

移除 `el` 元素上事件绑定的处理器，可选地，可以传递 `evn`、`slr`、`handle` 限定移除需要匹配的条件（相等比较）。只能移除用本库中相关接口绑定的事件处理器，共4个：`$.on`、`$.one`、`$.tie`、`$.tieOne`（**注**：后两个实际上是前两个的应用封装）。如果不传入任何匹配条件，会移除 `el` 元素上全部的事件处理器。


### [$.one( el: Element, evn: String | Object, slr: String, handle: Function | Object | false | null ): this](docs/$.one.md)

在 `el` 元素上单次绑定一个处理器，该处理器一旦执行就自动解绑。各个参数的含义与 `$.on` 接口相同。

**注**：在事件触发（然后自动解绑）之前，用 `$.off` 可以移除该绑定。


### [$.trigger( el: Element, evn: String | CustomEvent, extra: Any, bubble?: Boolean, cancelable?: Boolean ): this](docs/$.trigger.md)

手动激发 `el` 元素上的 `evn` 事件。`evn` 可以是一个事件名或一个已经构造好的事件对象，事件默认冒泡并且可以被取消。

元素上几个可直接调用原生事件函数（如 `click`, `focus` 等）创建事件的事件可以直接激发，绑定的处理器可以中止事件的默认行为。不创建事件的事件函数（如 `submit`, `load` 等）不能直接激发，像元素上的普通方法一样，需要预先绑定与方法同名的事件的处理器才能激发，处理器内可以通过调用 `ev.preventDefault()` 或返回 `false` 阻断该方法的调用。

原生事件激发也可以携带参数，如：`trigger(box, scroll, [x, y])` 让滚动条滚动到指定的位置。**注**：实际上只是调用 `box.scroll(x, y)` 并触发 `scroll` 事件。


## 原生事件调用

在浏览器的 DOM 元素中，有 `10` 个事件是可以在元素上直接调用的，它们分别是：

- `click()`: 模拟用户对元素的点击。
- `blur()`: 让元素失去焦点。
- `focus()`: 让元素获得焦点。
- `select()`: 对于可输入文本的控件，让文本被选中。
- `load()`: 载入元素引用的媒体文件，主要适用 `<video>` 和 `<audio>` 元素。
- `play()`: 媒体继续播放，适用元素同上。
- `pause()`: 媒体播放暂停，适用元素同上。
- `scroll(x, y)`: 包含滚动条的元素滚动到目标位置。
- `reset()`: 表单重置。
- `submit()`: 提交表单。

其中除了 `load()` 和 `submit()` 外，其它调用都会在元素上触发一个同名的事件。如果你愿意，这些方法可以直接在元素上调用，但这里也把它们作为基本接口纳入。

对于单元素版，实现上就是在元素上简单的调用而已（可能传入参数）。对于集合版，遵循通常一致的逻辑，就是对集合内各个元素上分别调用该方法。



## 集合专用

### [.filter( fltr: String | Array | Function | Value ): Collector](docs/$.filter.md)

对集合中的成员用 `fltr` 匹配过滤，返回一个匹配成员的新集合。`fltr` 可以是任意值：字符串表示选择器，数组表示成员包含，函数表示自定义判断，其它值表示全等测试。

**注**：这是一个通用的匹配过滤方法，可用于任意值的集合。


### [.not( fltr: String | Array | Function | Value ): Collector](docs/$.not.md)

对集合中的成员用 `fltr` 匹配排除，返回排除匹配项之后（剩余）的新集合。`fltr` 可以是任意值：字符串表示选择器，数组表示成员包含，函数表示自定义判断，其它值表示全等测试。

**注**：这是一个通用的排除过滤接口，可用于任意值的集合。


### [.has( sub: String | Node ): Collector](docs/$.has.md)

对集合中的元素用 `sub` 执行 **包含** 匹配过滤。包含的意思是 **`sub` 作为子级节点存在，或者是与子级元素匹配的选择器**。


### .slice( beg: Number, end: Number ): Collector

集合切片，覆盖继承于数组的同名方法。与 `Array.slice()` 的差异就是对切片返回的子集进行了封装，以支持对集合栈的操作。


### .concat( ...rest: Value | [Value] ): Collector

集合连接，覆盖继承于数组的同名方法。与 `Array.concat()` 的差异就是对连接返回的新数组进行了封装，以支持对集合栈的操作（如：`.end()`）。


### .map( proc: Function ): Collector

针对集合内成员逐一调用处理函数，返回处理函数的返回值的集合。函数接口：`function( val, index, this ): Value`。

这是对 `Array.map()` 的简单封装，只是加入了对 `Collector` 实例链栈的支持。

> **注意：**<br>
> 与工具版的 `$.map()` 稍有不同，本接口并不和并（扁平化）处理函数返回的集合，也不会排除 `null` 和 `undefined` 的返回值。


### [.sort( unique: Boolean, comp?: Function ): Collector](docs/$().sort.md)

集合内成员排序去重，覆盖继承于数组的同名方法。集合内成员可以是元素也可以是普通的值，但主要用于元素，所以这里附带了一个去重的功能。传递 `unique` 为真就会去除集合中重复的成员。默认情况下，不需要对元素的排序传递额外的比较函数，系统内置的元素比较按元素在 DOM 中的位置排序。如果集合中首个成员不是元素，则按父类 `Array.sort()` 接口的普通排序规则执行。


### .reverse(): Collector

集合成员反转，覆盖继承于数组的同名方法。与 `Array.reverse()` 原生方法不同，这里不会修改集合自身，而是返回一个新的集合，并且支持栈链操作。


### [.wrapAll( box: HTML | Element | Function, clone: boolean, event: boolean, eventdeep: boolean ): Collector](docs/$().wrapAll.md)

用一个容器 `box` 包裹集合里的节点/元素/文本，被包裹的节点/元素会脱离DOM原位置，容器元素会替换集合中首个节点在DOM中的位置。

容器可以是一个既有的元素或HTML结构字符串或取值函数，如果容器包含子元素，最终的实际包裹元素会被递进到首个最深层子元素。如果包裹容器是一个已经存在的元素，该元素会被直接使用，若克隆参数为假，该包裹容器会移出DOM树。容器元素包裹内容时为前插（`.prepend`）方式，因此包裹元素内原来的文本节点会被保留。

> **注：**<br>
> 集合内可以是字符串成员，它们会被自动作为文本节点逐个插入（`el.prepend()` 的特性）。<br>
> 取值函数返回的元素需要自行克隆（如果需要），接口里的克隆参数仅适用于作为实参传递的元素。<br>


### .item( idx: Number ): Value | [Value]

获取集合内的某个成员或整个集合（普通数组）。下标支持负数从末尾算起（-1表示最后一个）。**注**：兼容字符串数字，但空串不为0值。


### .eq( idx: Number ): Collector

获取集合中特定下标的成员构造的一个 `Collector` 实例。下标支持负数从末尾算起（-1表示最后一个），超出集合范围时构造为一个空的集合。**注**：兼容字符串数字，但空串不为0值。


### .first( slr: String | Element | Function ): Collector

获取集合内的首个匹配成员构造的一个新的 `Collector` 实例。匹配参数 `slr` 支持选择器、元素和匹配测试函数。测试函数接口：`function( Element ): Boolean`。

> **注**：如果当前集合已为空，返回当前的空集。


### .last( slr: String | Element | Function ): Collector

获取集合内最后一个匹配成员构造的一个新的 `Collector` 实例。匹配参数 `slr` 支持选择器、元素和匹配测试函数。测试函数接口：`function( Element ): Boolean`。

> **注**：如果当前集合已为空，返回当前的空集。


### .add( its: String | Element | NodeList | Collector ): Collector

往当前集合中添加新的元素，返回一个添加了新成员的新 `Collector` 实例。总是会构造一个新的集合返回。

> **注：**<br>
> 返回的集合不会自动去重排序，如果用户觉得需要，可以简单调用 `.sort(true)` 即可。<br>
> 本接口的字符串实参会被视为选择器，因此并不能直接添加字符串成员（作为普通集合时）。<br>


### .addBack( slr: String | Function ): Collector

在当前集合的基础上添加（实例链栈上）前一个集合的成员，可选的选择器或筛选函数用于筛选前一个集合。总是会返回一个新的 `Collector` 实例，即便加入的集合为空。

筛选函数接口：`function( v:Value, i:Number, o:Collector ): Boolean`。

> **注：**
> 与 `.add()` 相同，返回集不会自动去重排序，如果必要可以简单调用 `.sort(true)` 即可。


### .end( n: Number ): Collector

返回集合内 `Collector` 实例链栈上的倒数第 `n` 个集合。`0` 表示末端的当前集，传递任意负值返回起始集。



## 实用工具

### [$.embedProxy( getter: Function )](docs/$.embedProxy.md)

对 `window.$` 嵌入 `get` 代理。由外部定义 `$` 成员的调用集覆盖，`getter` 接受函数名参数，应当返回一个与目标方法声明相同的函数。接口：`function( name ): Function`。


### [$.each( obj: Any, handle: Function, thisObj: Any ): Any](docs/$.each.md)

通用的遍历工具，支持数组、类数组、普通对象和包含 `.entries` 接口（如：Map、Set）的任意对象。Collector 继承于数组，故也可直接使用。

传入迭代回调处理器的实参分别为：值，键，迭代对象自身（类似数组 `forEach` 接口）。回调返回 `false` 会中断迭代。


### [$.map( iter: [Value] | LikeArray | Object | .entries, callback: Function, thisObj: Any ): Value | [Value]](docs/$.map.md)

对集合内的成员逐一自行回调函数，返回回调函数返回的值的集合，如果回调返回 `null` 或 `undefined`，它们会被忽略（不进入返回集合内），如果回调返回一个集合，它们会被扁平化合并。

操作目标可以是数组、类数组、可以生成集合的迭代器（支持 `.entries` 接口）、`Map` 或 `Set` 实例甚至是普通的对象（`Object`）等。

**回调接口**：`function(val, key): Value | [Value]`。


### $.every( iter: [Value] | LikeArray | Object | .entries, callback: Function, thisObj: Any ): Boolean

迭代集合内的每一个成员执行回调函数，如果都返回真则最终结果为真，支持比较广泛的集合类型。回调接口：`function(val, key): Boolean`。


### $.some( iter: [Value] | LikeArray | Object | .entries, callback: Function, thisObj: Any ): Boolean

迭代集合内的每一个成员执行回调函数，如果有一个返回真则最终结果为真，支持比较广泛的集合类型。回调接口：`function(val, key): Boolean`。


### [$.Later( evn, handle, over? ): Function](docs/$.Later.md)

封装事件处理器（`handle`）的进一步事件（`evn`）激发，主要用于前后连续事件间的联动。

- `evn: String` 未来将要激发的事件名（序列）。
- `handle: Function | Object` 待封装的当前事件的处理器或EventListener实例。
- `over?: Boolean` 是否跳过当前调用栈（调用 `setTimeout()` 延后激发）。可选，默认为 `false`。

根据 `handle` 的执行情况和返回值决定后续行为，如果 `handle` 中调用了 `event.preventDefault()` 或返回假值，则不再激发 `evn`，否则对返回的元素（集）或配置对象（集）逐一激发目标事件，`evn` 支持空格分隔的多个事件名序列。

本接口返回一个封装了相关逻辑的处理器函数，该处理器函数自身的返回值规则为：如果 `handle` 中调用了 `event.preventDefault()` 或返回了假值，则返回该返回值本身，如果封装的处理器激发了目标事件，则返回 `undefined` 或一个定时器ID。


### [$.Counter( fn: Function, n?: number, step?: number ): Function](docs/$.Counter.md)

封装用户的函数包含一个自动计数器，用户函数的首个实参为自动递增的计数值。计数起始值可以在封装中指定，并且也可以指定每次迭代的步进值（增量）。返回的封装函数接口：`function( count, ... )`，省略号处为原始函数的参数序列。

这主要用在为 **单元素版接口中的回调函数** 提供集合版调用时的成员迭代计数。如：

```js
$('p').text(
    // 在每个文本段落前端添加序号
    // n 参数不是单元素版回调所拥有的
    $.Counter( (n, e) => n + ': ' + e.textContent )
);
```


### $.dataName( str: String ): String

转换元素的 `data-` 系特性名为标准的驼峰式名称，不含 `data-` 前缀，即返回值可直接用于元素的 `.dataset` 对象的成员取值。

例：
```js
$.dataName('data-id-val');   // 'idVal'
$.dataName('-abc-def-xxx');  // 'abcDefXxx'
```


### $.selector( tag: String, attr: String, val?: String, op?: String ): String

根据选择器的各个组成部分构造一个完整的 **标签[特性]** 选择器，支持 `data-` 系特性名的简写形式。

```js
$.selector( 'p', '-val', 'xyz');
// "p[data-val="xyz"]"
```


### $.tags( code: String ): String

伪标签源码（由 `[]` 包围标签）转化为正常的HTML源码，可用于元素属性值中直观地包含标签源码。这里只是一种简单的替换。如果代码中需要包含 `[]` 本身，可以前置字符 `\` 转义。

```html
<a id="testa" href="#" title="[a] is a \[link\]">Click me</a>
```

```js
let ttl = $.attr( $.get('#testa'), 'title');
// "[a] is a \[link\]"

$.tags( ttl );
// "<a> is a [link]"
```


### $.objMap( map: Map ): Object

将一个 `Map` 实例转换为普通对象（`Object`）表示。注意 `Map` 实例的键需要是基本数据类型（字符串或数字）。

```js
let map = new Map();
map.set('a', 'aaa').set('b', 'bbb');

$.objMap(map);
// {a: "aaa", b: "bbb"}
```


### $.kvsMap( map: Map, kname?: String, vname?: String ): [Object]

将一个 `Map` 实例转换为用目标键/值名称索引实例内键和值的对象的数组，即 `Map` 实例内的每一个键/值用 `{ [kname]: key, [vname]: value }` 引用，全部的键/值对引用形成一个该二元对象的数组。如：

```js
let map = new Map();
map.set('a', 'aaa').set('b', 'bbb');

$.kvsMap(map, 'name', 'value');
// [
//     { name: 'a', value: 'aaa' },
//     { name: 'b', value: 'bbb' },
// ]
// 注：
// 上面的 name 和 value 其实是默认的名称，可不传递。
```


### $.mergeArray( des: Array, ...src: Array ): Array

合并多个数组成员到首个实参数组内，返回合并后的首个实参数组。**注：**后续实参实际上也可以是单个的值，它们会被添加到首个实参数组内。如：

```js
$.mergeArray( [], 123, [1,3,5], 'xyz' );
// [ 123, 1, 3, 5, "xyz" ]
```


### $.object( base: Object, ...data: Object ): Object

基于首个实参对象为原型，克隆后续对象成员创建一个新的对象。注意克隆是浅层的，复制操作调用的是 `Object.assign()` 方法。


### $.proto( target: Object, base: Object ): Object

获取或设置目标对象 `target` 的原型对象。`base` 未定义时为获取，返回原型对象，否则为设置 `target` 的原型对象为 `base`，返回被设置的目标对象 `target`。

这种设置可能在需要自定义对象的取值作用域链时有用，比如设置内部成员的原型对象为当前对象，就可以从子成员对象上直接获取其它兄弟成员的值。如：

```js
let A = { B: { x: 10, y: 20 }, C: 'ccc' },
    B = A.B;

B.x;  // 10
B.C;  // undefined

$.proto(B, A);
B.C;  // 'ccc'
```


### [$.range( beg: String | Number, size: String | Number, toArr?: Boolean ): Array | Iterator](docs/$.range.md)

构造目标范围内一个连续的值序列，适用于数值和 `Unicode` 码点类型。通常会返回一个迭代器，除非明确指定返回数组（`toArr` 为 `true`）。

```js
$.range(10, 10, true);
// [ 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 ]

$.range('①', 10, true);
// [ "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩" ]

$.range('Ⅰ', 10, true);
// [ "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ" ]
```


### [$.now( json: Boolean ): String | Number](docs/$.now.md)

返回当前时间：自纪元（1970-01-01T00:00:00）开始后的毫秒数（与时区无关）。如果传递 `json` 为真，则表示为标准的 JSON 格式。

这基本上就是对 `new Date().getTime()` 或 `Date.now()` 接口的简单封装，附带包含了 `.toJSON()` 的逻辑。

```js
$.now();
// 1564744242828

$.now(true);
// "2019-08-02T11:10:42.828Z"
```


### $.isArray( obj: Any ): Boolean

测试目标对象 `obj` 是否为数组，本方法只是 `Array.isArray()` 的简单封装。


### $.isNumeric( val: Any ): Boolean

测试目标值是否为纯数字。空串虽然与0相等（`==`），但空串并不是数字。即：`$.isNumeric('') => false`。


### $.isFunction( obj: Any ): Boolean

测试实参目标是否一个函数，主要用于容错某些浏览器对 `<object>` 元素的错误类型判断（`typeof`）。


### $.isCollector( obj: Any ): Boolean

测试实参目标是否为一个 `Collector` 实例。当然用 `$.type(obj) == 'Collector'` 也可以判断出来，但这里效率更高也没有名称冲突的风险。


### $.is( el: Element, slr: String | Element ): Boolean

测试元素 `el` 是否与 `slr` 选择器匹配。`slr` 也可以是一个元素，此时判断两者是否为同一个元素。


### $.type( val: Any ): String

返回实参值的具体构造类型，这不是 `typeof` 的返回值，而是值的构造函数名，如：`$.type(123) => "Number"`，注意名称是首字母大写。另外有两个特例：`null => "null"`、`undefined => "undefined"`。


### $.unique( nodes: [Node] | Iterator | .values, comp: Function | null ): Array

集合去重排序，主要应用于DOM树上的节点/元素集（默认，无需 `comp` 值），但也可以用于普通的值集合。集合支持普通数组、迭代器、支持 `.values()` 接口的任何实例甚至普通的对象（`Object`，取值）。

> **注意：**<br>
> 非节点集需传递 `comp` 为 `null` 获取默认的排序规则（按字符串 `Unicode` 码点），如：`$.unique( [3, 11, 2], null )` 结果：`[11, 2, 3]`。<br>
> 如果是数值集需要按数值大小来排序，应当传递一个比较函数，如：`$.unique( [3, 11, 2], (a, b) => a - b )` 结果：`[2, 3, 11]`。<br>
