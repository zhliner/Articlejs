# 模板示例

## OBT（On/By/To）

### On

```html
<i id="logo" title="系统菜单" on="click|folds, stop"></i>
<menu id="menu-sys" data-pb="fold" on="off|lose">
<!--单击折叠切换（folds）后续菜单元素，并停止事件冒泡（stop）
    事件与行为链间用竖线“|”分隔；
    多个PB间用半角逗号“,”分隔。
    此为一组定义。-->
```

```html
<li on="mouseenter|popup; mouseleave|unpop">
    <h6>子菜单标题</h6>
    <menu>...</menu>
</li>
<!--鼠标进入内部子菜单弹出，鼠标移开子菜单消失。
    多组定义间用半角分号“;”隔开。空格仅为视觉友好。 -->
```

支持空格分隔的多个事件名绑定同一个行为链。

```html
<input type="text" on="mouseover focus|select" />
<!-- 鼠标经过或文本框获得焦点时，选取内部文本。 -->
```

事件名可以带选择器参数，成为事件的委派绑定。

```html
<p on="click('img')|$e, attr('src'), zoom('#view')">
    ...（可能包含小图片）
</p>
<!--单击段落中的图片：提取src属性值，在预览框中预览大图。
    $e为获取当前目标元素，attr提取目标属性，zoom载入大图。
    注：zoom 中可将小图url转为大图url。 -->
```

普通事件与代理委派事件可同时定义。

```html
<div on="active click('b')|tabs('_current'), $e('@'), clss('_hot')">
    <b>标签A</b>
    <b>标签B</b>
</div>
<!--单击设置目标<b>元素为“当前状态”，同时获取绑定元素，设置类名为_hot。
    向目标元素发送“active”事件（自定义），执行同一个行为链。
    注：tabs需要<b>子元素目标，active时无效果，会略过。
    $e('@') 获取绑定元素，clss 设置类名。 -->
```


### By

指定由哪个处理器处理业务逻辑。

`By` 承接 `On` 的流程数据，处理后向To传递新的流程数据。

```html
<div on="click('img')|$e, attr('-val')" by="News.photo('#viewtype')">
    <img src="..." data-val="AAA" />
    <img src="..." data-val="BBB" />
</div>
<!--On：单击图片，提取data-val属性中的名称值。
    By：由News板块中的photo成员（方法）处理：
    1. 用上级传递来的图片名称获取详细介绍（纯数据）；
    2. 依照#view-type上展示方式的设定，构造图片展示数据。向后传递。 -->
```


### To

指定数据展示或更新的目标元素、插入方法，以及可能有的附带PB行为。

属性值格式： `rid[,n] | where | pbs...`

**说明：**

- 各部分以竖线 `|` 分隔，后面两个部分可选。
- `rid` 定位目标元素，置空或设置占位附 `-` 表示触发事件的当前元素。注意目标元素应当已存在（DOM树中）。
- `where` 也可以置空或设置为占位符 `-`，流程数据直接向后传递到 PB 部分。
- 如果需要为后续的 `To` 定义维持顺序（当前仅占位），则应当将整个值设置为一个 `-`。

```html
<input type="image" to="form@search|value|select" />
<!--1. 检索“form@search”元素（data-id="search")。
    2. 设置value值为前阶传递来的流程数据。
    3. 选取（调用目标元素的select()方法）。
    附注：
    rid默认仅检索单个元素，若需多元素检索，n位置0或具体的值。如："form@tip,0|text|..."
    n=0 表示全部检索到的元素 -->
```


### 多组对应

`On/By/To` 中可以包含多组定义，各组用分号分隔，按位置顺序一一对应。如果 `By/To` 中按位置没有对应项且不是最后一组，需要用占位符 `-` 维持正确的顺序关系。

```html
<ul class="_pluglist" title="插件面板"
    on="click('li'); mouseenter; mouseleave"
    by="Plug.run; Help.index"
    to="-; '#box-msg'|fill; '#box-msg'|hide">
    <li data-val="plugA"> ... <li>
    <li data-val="plugB"> ... <li>
</ul>
<!--1. 单击插件条目<li>执行插件（Plug.run）。
    2. 鼠标移入获取并显示插件提示信息（Help.index）。
    3. 鼠标移开隐藏提示信息。 -->
```


```html
<div on="click('i')|$e, attr('-val')" by="Help.index('#help-type')" to="#box-man|end|scroll,focus('')">
    <img src="..." data-val="plugA" />
    <img src="..." data-val="plugB" />
</div>
<!--To：
    检索 #box-man 元素，用By传递来的数据添加到内部末尾（end/append）；
    滚动到插入内容处，聚焦To目标元素（focus('')），便于键盘操作。 -->
```


## 子模板

共有2个属性名：`tpl-name` 和 `tpl-load`，分别用于模板节点的命名和导入说明。

> **注记：**<br>
> 因为渲染影射的设计，渲染配置脱离了元素，故节点树中的模板节点无需脱离DOM。<br>
> 模板节点采用 `<template>` 元素包含，这使得可以包含不完整的标签结构，如单独的表格行。<br>


### tpl-name

命名一个元素为模板节点，`tpl-load` 的导入目标指定就是采用此处的命名。节点名称在程序全部模板节点范围内应唯一。

```html
<!-- 脚本历史清单构造 -->
<ol tpl-name="data:shlist" tpl-for>
    <li><code _="$"></code></li>
</ol>
```

```html
<table> <!-- 表格行封装（注：浏览器不接受单独的<tr>元素。 -->
<tbody>
    <tr tpl-name="prop:clang">
        <th>语言</th>
        <td>
            <select tpl-name="app:clang" name="languages" tpl-for>
                <option _value="$.name" _="$.label"></option>
            </select>
        </td>
    </tr>
    <!--模板节点不必是根元素，嵌套的模板节点也没问题。
        规范的命名通常会前置一个应用域以使得条理清晰。 -->
</tbody>
</table>
```


### tpl-load

请求载入目标模板节点，目标节点最终会被插入元素内部（前端）。

> **注：**
> 模板节点可能事前全部载入，也可能动态的即时从远程读取载入，这由模板管理插件负责。

```html
<div data-id="tools" tpl-load="tools:inputs">
    <!-- 获得节点后会自动插入此处 -->
    <hr />
    <p>这里的内容不受影响</p>
</div>
```
