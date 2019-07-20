# 模板设计

## 概要

模板的指令包含三个类别，它们书写在元素的几个自定义的属性上。

1. **行为定义：**<br>
    由三个属性 `on`、`by`、`to` 定义，在元素上配置需要处理的事件和相应的行为链。其中：
    - `on`：事件和取值。
    - `by`：具体的业务处理。可以在内部划分为 `EMR`（`Entry`, `Model`, `Render`）三个环节。可选。
    - `to`：用业务环节来的数据更新UI。

2. **节点渲染：**<br>
    由十个渲染属性 `tpb-[for|each|if|elseif|else|with|var|switch|case|default]` 表达模板的语法结构，以及一个属性名规则：**前置下划线** 表达属性赋值，如：`_href="$.url"` 表示对 `href` 属性赋值为变量 `url` 的值，单独的属性名 `_` 指代赋值元素内容。
    - `tpb-for`: 子元素的循环。
    - `tpb-each`: 当前元素的循环迭代。
    - `tpb-if`: 当前元素 if 测试，真值显示，假值移除。下同。
    - `tpb-elseif`: 当前元素 `elseif` 测试，与 `if` 匹配使用。
    - `tpb-else`: 当前元素 `else` 测试，与 `if` 匹配使用。
    - `tpb-with`: 新建局部域，变量引用为局部域成员。
    - `tpb-var`: 新建变量，方便后续简化使用。
    - `tpb-switch`: 创建子元素 `switch` 逻辑。
    - `tpb-case`: 当前元素 `case` 测试，与 `switch` 标的值比较，相等则显示，否则移除。
    - `tpb-default`: 当前元素的 `switch` 默认分支，其它 `case` 不匹配时显示，否则移除。

3. **模板管理：**<br>
    由两个属性 `tpl-[name|load]` 配置。
    - `tpl-name`: 当前元素命名为一个具名模板，用于外部检索或子模版导入时引用。
    - `tpl-load`: 标记当前元素为一个容器，内部需要导入目标名称的子模版。



## 行为定义（OBT: On/By/To）

### On

定义需要绑定的事件名，以及事件触发后的行为链。
支持多个事件名用空格分隔，它们绑定到同一个行为链，事件名由空格分开。事件名也可以是委托形式，如：`click("b")` 表示管理下级 `<b>` 子元素的单击事件。

行为链是一个 `PB操作` 序列，详情请参考设计文档。

**示例**

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

On/By/To 的完整示例

```html
<div on="click('i')|$e, attr('-val')" by="Help.index('#help-type')" to="#box-man|end|scroll,focus('')">
    <img src="..." data-val="plugA" />
    <img src="..." data-val="plugB" />
</div>
<!--To：
    检索 #box-man 元素，用By传递来的数据添加到内部末尾（end/append）；
    滚动到插入内容处，聚焦To目标元素（focus('')），便于键盘操作。 -->
```


### 多组定义

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


## 模板渲染

渲染属性（`tpb-[for|each|if|elseif|else|with|var|switch|case|default]`）的值是JS表达式，它们会被传入一个数据引用（`$`）并直接执行。前置下划线的属性名是一种赋值结构，表示对该属性赋值表达式的值。


### 父域链

表达式中从一个特殊变量 `$` 上引用数据，`$` 可能是一个对象、数组、或基本类型的值。假设有如源数据：

```js
student = {
    name: '张三',
    age: 28,
    school: {
        name: "市一中",
        class: "初三（1）班",
        code: 51310230,
    },
    ID: 3355789,
}
```

渲染属性的值可以称为**渲染表达式**，它们会通过一个封装函数解析调用：

```html
<table id="test">
    <tr>
        <!-- 赋值 data-id 属性和单元格内容 -->
        <td _data-id="$.ID" _="$.name">[性名]</td>
        <!-- 赋值单元格内容 -->
        <td _="$.age">[年龄]</td>
        <!-- 赋值单元格内容 -->
        <td _="$.school.name">[所在学校]</td>
    </tr>
</table>
```

```js
const Valuer = expr => new Function( '$', `return ${expr}` );

let tds = $('#test td');

$.attr(tds[0], 'text', )
```


1. 原型链父域成员自动引用，无法引用被子级覆盖的成员。
2. 默认 `$` 具名成员引用，如：`$.$.$...`。这可以解决上面子级覆盖的问题。


### 语法优先级

```
tpb-each > tpb-with > tpb-var >
tpb-if, tpb-elseif, tpb-else, tpb-switch, tpb-case, tpb-default >
tpb-for > _[attr]
```


### tpb-for

定义子元素的循环逻辑。格式：`tpb-for="data;start:end"`，其中：

- `data`  循环取值的数组，每一个单元会成为每一次循环的当前域。可选，默认当前域对象。
- `start` 取值单元起始下标，可选。默认值 `0`。
- `end`   取值单元终点下标（不含终点），可选，默认 `data.length`。

> **注：**<br>
> 如果全部都取默认值，则可省略属性值（仅 `tpb-for` 属性本身）。<br>
> 当前域对象用 `$` 引用，父域对象被设置在了 `$` 中，依然用 `$` 表示（即 `$.$`）。模板的入栈数据为顶层的当前域对象。<br>

循环内支持如下临时变量。

- `$._BEGIN_`  循环开始的下标值
- `$._END_`    循环终点的下标值。
- `$._SIZE_`   循环集的原始大小（与非零起点无关）。
- `$._INDEX_`  当前循环条目下标（原始数组条目下标）。
- `$._COUNT_`  当前循环的计数（从1开始）

```html
<dl tpb-for="$.news; 0:10">   <!-- news: [{topic, about, summary}, ...] -->
    <dt _="$.topic"></dt>     <!-- news[i].topic -->
    <dd>
        <p _="$.about"></p>   <!-- news[i].about -->
        <p _="$.summary"></p> <!-- news[i].summary -->
    </dd>
</dl>

<!-- 如果是输出数组的全部单元，可省略范围指定。 -->
<dl tpb-for="$.news">
    ... （同上）
</dl>
```

如果当前域对象就是循环目标，且全部输出，可以省略属性值。

```html
<!-- 无需属性值 -->
<dl tpb-for>            <!-- [[aaa, bbb], ...] -->
    <dt _="$[0]"></dt>  <!-- [i][0]: <dt>aaa</dt> -->
    <dd _="$[1]"></dd>  <!-- [i][1]: <dd>bbb</dd> -->
</dl>

<!-- 有名称引用 -->
<dl tpb-for="$">
    ... （同上）
</dl>
```

可以取目标集的任意范围，终点为数组的最大长度。

```html
<ol tpb-for="$; 10:">
    <li><code _="$"></code></li>
    <!-- 注：此处的 $ 是上层 for 引用的 $ 的子成员 -->
</ol>
```


### tpb-each

另一种循环逻辑，循环目标为当前元素自身（包含子元素）。格式：`tpb-for="list"`，其中 `list` 为循环迭代取值的数组。

每一次迭代中，取值数组的单元为当前域对象。

```html
<dl>
    <dt>定义列表标题</dt>
    <dd tpb-each="$.list" _data-val="$.sn">  <!-- list: [{sn, label, value}, ...] -->
        <label>
            <span _="$.label"></span>
            <input _name="`item_${$.sn}`" type="checkbox" _value="$.value" />
        </label>
    </dd>
    <!--<dd>元素自身被克隆，数据条目逐个应用。
        注意：
        $.list 和 $.sn 中的 $ 不同，前者先解析，是循环外的当前域对象，后者是循环内的当前域对象。
        也即：提取当前域 $ 中的 list 数组，构建循环迭代，赋值子域中的新 $ -->
</dl>
```


### tpb-if / tpb-elseif / tpb-else

存在性测试。属性值为JS表达式，取运算结果决定当前元素是否显示。`tpb-elsif` 和 `tpb-else` 与 `tpb-if` 匹配使用，但 if/else 逻辑仅限于同级元素（兄弟关系）范围。
各语法词的定义之间可以插入任意其它兄弟元素，这些兄弟元素与 if/else 逻辑无关。

属性值中的比较运算符不能采用 `<` 或 `>`，由下面的关键词代替：

- **LT**： 小于（<）
- **LTE**： 小于等于（<=）
- **GT**： 大于（>）
- **GTE**： 大于等于（>=）

```html
<p tpb-if="$.Person.age LT 12"> <!-- 如果为假，本段落不会显示。 -->
    亲爱的 <strong _="$.Person.name"></strong> 小朋友
</p>
```

```html
<p tpb-with="$.Person">
    <span tpb-if="$.age LT 12">
        亲爱的 <strong _="$.name">[孩子]</strong> 小朋友
    </span>

    <hr /> <!-- 这里可插入任意内容，虽然没啥道理。 -->

    <span tpb-else>
        <strong _="$.name">[先生/女士]</strong> 您好！
    </span>
    <!--带中括号的文字是模板说明，最终会被替换掉。这种友好性可方便模板编写时预览样式。 -->
</p>
```

```html
<p tpb-with="$.Person">
    <span tpb-if="$.age LT 12">
        欢迎 <strong _="$.name">[孩子]</strong> 小朋友
    </span>
    <span tpb-elseif="$.age LT 21">
        嗨，<strong _="$.name">[青少年]</strong>！
    </span>
    <span tpb-else>
        尊敬的<strong _="$.name">[成年人]</strong>您好！
    </span>
</p>
```


### tpb-switch / tpb-case / tpb-default

switch{case/default} 语法结构，表达多个子元素平行分支判断。`tpb-case` 和 `tpb-default` 针对所在元素自身，匹配则显示，语法逻辑限于平级的兄弟元素范围。分支自然结束，没有 break 语法。
如果没有任何一个子元素分支匹配，`tpb-switch` 自身所在的元素也无效。

这是 if/elseif/else 的多分支友好版。

```html
<p tpb-with="$.Person" tpb-switch="true">
    <span tpb-case="$.age LT 12">
        欢迎 <strong _="$.name">[孩子]</strong> 小朋友
    </span>
    <span tpb-case="$.age LTE 21">
        嗨，<strong _="$.name">[青少年]</strong>！
    </span>
    <span tpb-default>
        尊敬的<strong _="$.name">[成年人]</strong>您好！
    </span>
</p>
```


### tpb-with

创建一个当前域并设置域对象，改变渲染变量的当前域环境。域的有效范围包括元素自身及其子元素。

该语法在 `tpb-each` 之后、其它语法之前处理，因此有较高的优先级，影响其它大部分渲染结构（`tpb-var`、`tpb-if`、`tpb-switch`、`tpb-for` 等）。

```html
<em tpb-with="$.info" tpb-if="(Date.now() - $.time) LE 86400"> <!-- info: { time, ... } -->
    （今日更新）
</em>
```

域声明支持任意JS表达式，因此实际上可以组合创建一个新的对象用于之后的域环境。

```html
<p tpb-with="{info: $.info, tips: '最近更新'}">
    更新时间：<strong _="$.time"></strong>
    <em tpb-if="$.time LT 86400" _="$.tips">[最新提示]</em>
</p>
```


### tpb-var

在当前域中新建变量来存储数据，供同域中其它渲染结构使用，通常用于提取某深层数据成员，便于引用。采用解构赋值表达式通常可以缩短语句长度。
新的变量需要明确设置到当前域中，即用 `$.xxx` 进行赋值。

假设模板处理的数据结构如下：

```js
cities:
{
    ShangHai: {
        tvs: [
            {
                name: "时论天下",
                info: "主要针对当前最新时事，深度探讨和分析并与您共同观察。",
                founded: 2099,
            },
            {
                name: "人机世代",
                info: "立足于机器人与人类的关系，追踪最新人机新闻和前沿话题。",
                founded: 2041,
            }
        ],
        magazines: [
            "梦幻时代",
            "爱你不容易",
            "探险",
            "机器虫",
            "天涯浪客",
        ],
    },

    HongKong: {
        tvs: [
            {
                name: "呈现",
                info: "向您展示我们的观察、我们的思考，与您一道深度分析。",
                founded: 2025,
            },
            {
                name: "深蓝探索",
                info: "海底的精彩世界，与您分享，与您一道探索未知的边界。",
                founded: 1940,
            },
        ],
        magazines: [
            "文艺范儿",
            "经济观察",
            "赛马",
            "铁甲雄鹰",
            "探底",
        ]
    },
}
```

```html
<!-- 解构赋值：数组只取到首个成员。 -->
<p tpb-var="{ city: [{ cname: $.cname, school: $.school }] } = $.country">
    城市：<strong _="$.cname">[GuangZhou]</strong>
    <hr />
    学校：<strong tpb-each="$.school" _="$.name">[yizhong...]</strong>
</p>

<!-- 对比 -->
<p tpb-with="$.country">
    城市：<strong _="$.city[0].cname">[GuangZhou]</strong>
    <hr />
    学校：<strong tpb-each="$.city[0].school" _="$.name">[yizhong...]</strong>
</p>
<!--tpb-with 会创建一个新域，该域会加入子域的父域链，即子域中需用 $.$ 引用。
    而上面的解构赋值不会多出这个层级 -->
```


### _[attrName]

对元素属性进行赋值，属性名即为去除前置下划线部分。前置的下划线是一个标志，表示会被渲染处理。单纯的 `_` 表示赋值元素的内容，赋值方式为覆盖，`html` 原样插入。

> **注：**
> 数据可能需要进行预处理，注意html源码应当仅被转换一次！

```html
<header class="summary">
    <p class="info" _title="$.tips">
        文章来源：<a _href="url" _="$.label|cut(40, '...')"></a>
        <!-- 属性前置下划线，输出支持过滤。 -->

        作者：<em _=" `${$.firstName} ${$.lastName} 你好！` "></em>
        <!-- 模板字符串：可同时输出多个变量。 -->

        Vip 积分：<strong _=" `${$.points + 1000}` "></strong>
        <!-- 模板字符串：支持表达式运算。 -->
    </p>
    <hr />
    <p _="$.summary|text('br')">[摘要为纯文本]</p>
    <!-- 内容为html赋值，text过滤转义。 -->
</header>
```


### 补：关于当前域

当前域是模板变量取值的父环境，循环内的当前域最初由 `for/each` 循环克隆元素时动态设置，用户无法干涉，该域最先被赋值为循环内的当前域。

在 `tpb-each` 中，循环针对的是当前元素，因此 `tpb-with` 的优先级在 `tpb-each` 之后（与在元素中定义的先后顺序无关）。
而在 `tpb-for` 中，因为循环是针对子元素，所以 `tpb-with` 的优先级在前（**注**：即便在后，也无法获取循环内的当前域对象）。

```html
<!-- {
    list: [{ about: { author, cite } }, ...],
    title: 'xxx'
} -->
<section>
    <h3 _="$.title">[xxx]</h3>
    <ul>
        <li tpb-with="$.about" tpb-each="$.list">
            <!--tpb-each 先执行。
                tpb-with 实际上引用的是 $.list[i].about -->
            <strong _="$.author"></strong>
            <em _="$.cite"></em>
        </li>
    </ul>
</section>
```



## 模板节点与与模板导入

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


## 特殊字符

在模板中部分标点符号用于特别的目的。

- **（;）**：分号。分隔符，用于通用的逻辑区隔，如OBT定义分组。
- **（,）**：逗号。表示并列的关系，如参数列表、PB调用链。
- **（|）**：竖线。递进处置，如输出数据的过滤处理、事件关联的PB行为链。
- **（-）**：横线。空值占位，主要用于OBT分组定义中的顺序保持。
- **（$）**：对当前域对象的引用。
