# tQuery - 轻量级节点检索器（类 jQuery）

## 前言

传统的 `jQuery` 使用十分方便友好，但随着 `ES6`、`HTML5/CSS3` 的逐步成熟，我们可以编写一个轻量级的类 `jQuery` 工具，这就是 `tQuery`。它采用 `ES6` 语法编写，仅包含 `jQuery` 中有关 `DOM`、`CSS` 和 `Event` 的部分，即省略了 `Ajax`、`Deferred` 和 `Effect` 等，这些部分由 `ES6/HTML5` 中原生的 `Fetch`、`Promise` 和 `CSS3` 来支持。

大部分接口与 `jQuery` 相似，少数地方略有变化，也有一些扩展和增强，如支持嵌入代理（见 `$.embedProxy`），用户可以修改接口的默认行为。`tQuery` 名称里的 `t` 来源于 `Tpb` 里的 `Template`，但也可以理解为 `tiny`。

> **注：**<br>
> 本设计中的接口虽然与 jQuery 中的接口相似，但并不兼容，同名的接口只是在功能上相似而已。<br>
> 可以打开 `test.html` 在浏览器控制台执行 `console.dir($)` 或 `console.dir($(''))` 简单的查看接口情况。<br>



## Api 设计

`jQuery` 中对检索结果集的操作，在这里都有一个**单元素**的版本，如：`$.next(el, slr)`、`$.hasClass(el, names)` ，以及相应的集合版本：`$('xx').next(...)`、`$('xx').hasClass(...)`。单元素版通常返回 `$` 自身，集合版会返回一个 `Collector` 实例或值数组。与 `jQuery` 中类似，集合版的返回值 `Collector` 实例可以链式调用。

与 `jQuery` 对比，大多数情况下同名接口的行为相似，但少数地方依然有明显区别。如对元素集的属性取值，`jQuery` 中是仅取集合内**首个元素**的值，如 `$('a').attr('href')` 取首个 `<a>` 元素的 `href` 属性值，而 `tQuery` 中则会返回集合里全部元素的属性值（作为一个数组）。

又如 `$.html` 接口，`jQuery` 中它既可以处理文本，也处理节点元素，效果与连续的 `$.empty().append()` 调用相似。但在 `tQuery` 中该接口只负责文本的逻辑：设置元素内容时接收文本或提取元素的 `outerHTML` 文本，获取源码时提取元素的 `innerHTML` 值。另外也扩展了文本关联的功能，如转换源码。

本设计的接口参数中仅有类名和事件名支持空格分隔的多名称指定，其它元素属性必须用数组形式传递多个名称。另外在实现上，`Event` 为无侵入的 `DOM` 原生事件，元素上也不存储任何额外数据。总体上，这里的设计尽量精简，只要有可能就把任务交给原生的 `ES6`、`HTML5/CSS3` 等处理。


## 附录

### 与 jQuery 同名接口的差异简表

- `.contains`
    - jQuery: 仅针对内部子孙元素，不含容器元素自身测试。
    - tQuery: 包含容器元素自身测试，与DOM同名接口行为相同。

- `.hasClass`
    - jQuery: 对空格分隔的名称序列视为一个整体。
    - tQuery: 空格分隔的名称序列被视为多个名称，逐个判断，因此 `class="A B"` 与 `class="B A"` 是一样的。

- `.is`
    - jQuery: 只要集合中有一个匹配即为true，且可接受多种类型的参数。
    - tQuery: 对集合中每一个元素判断，返回一个true和false值混合的集合（数组），参数类型较为简单。

- `$.data/.data`
    - jQuery: 存储与目标元素关联的任意数据，或者返回集合中匹配首个元素的存储的值。
    - tQuery: 没有该接口。元素的data-xx系属性融入在 `attr` 和 `prop` 接口中，支持名称简写（`-xx` 即为 `data-xx`）。

- `$.get`
    - jQuery: 用 `Ajax` 方式通过 `GET` 方法获取目标网站的内容。
    - tQuery: 获取文档元素的单元素版本，如通过 `id` 定位或 `querySelector` 检索。


### 与 jQuery 的其它差异

> **注**：tQuery 只涉及 jQuery 中与 DOM 相关的一个子集，因此差异说明也仅指这一部分。

- 元素/节点创建。
    - jQuery: 通过 `$( html )` 方式创建元素，但仅能创建元素（`Element`）而无法创建单纯的文本节点（`Text`）。
    - tQuery: 通过 `$.Element( tag, data, conf )` 创建元素，通过 `$.Text( data )` 创建文本节点。另外还有 `$.svg()`、`$.table()`、`$.script()`、`$.style()` 等创建特定的元素。

- 工具函数。



### 嵌入代理（$.embedProxy）的应用

#### plugins/tracker.js

追踪用户对页面元素的修改操作，提供回溯（Undo/Redo）的简便处理方式。
