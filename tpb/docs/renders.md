# 模板渲染

用于模板渲染的语法/属性有 `9` 个（`tpb-[for|each|if|else|with|var|switch|case|last]`），渲染属性的值是JS表达式，表达式运算的结果成为该语法结构的数据。表达式会被封装为函数调用，有一个名称为 `$` 的形参，用于引用外部的数据。

正常的元素属性前置一个下划线是一种赋值语法，表示相应的属性会被赋值为其表达式运算的结果，如：`<a _href="$.url">`，表示 `$.url` 将赋值到 `href` 属性。


## 语法优先级

```js
1: 'tpb-each'
2: 'tpb-with'
3: 'tpb-var'
4: 'tpb-if|else'
5: 'tpb-switch|case|last'
6: 'tpb-for'
7: '_[attr]'
```


## 父域链

假如有如下数据结构：

```js
$ = {
    student: {
        name: '王小二',
        age: 14,
        school: {
            name: "xx市第一中学",
            class: "初三（1）班",
        },
    },
    language: `chinese`,
}
```

渲染表达式中从一个特殊变量 `$` 上引用数据，如上：`$.language` 引用 `chinese` 值。在渲染结构的每一层子级递进中，子对象也会被赋值到当前域的 `$` 上，从而让表达式依然用 `$` 引用数据。

子对象中引用上级成员有时会需要，作为一种便捷设计，当前域中的 `$` 上有一个特殊变量 `$`，它引用了当前域的父域对象（即：`$.$`），因此我们可以简单地通过 `$.$.xxx` 的形式来引用父域的其它成员。如假设当前域是 `school`（即：`$ = student.school`），`$.$.age` 可以引用年龄数据（即：`$.$ = student`）。

这种可以从子级向上逆向访问父域成员的结构，称为 **父域链**。

作为一种友好，如果父子对象都是纯 `Object` 类型，子成员的原型会被设置为父对象，这样可以缩短父域链以便于访问。

> **注：**<br>
> 基本数据类型会被转换为 `Object` 使用（原型不变），这不会影响值的显示和运算。


## tpb-for

定义子元素的迭代循环。格式：`tpb-for="data"`，其中 `data` 为循环取值的数组（**注**：可用 `.slice()` 截取子集）。每一个单元会成为每一次循环的当前域，`data` 配置可选，默认为当前域本身（应当是一个数组），此时仅需设置 `tpb-for` 属性名即可。

循环内支持3个临时变量：

- `$._I_`   当前条目下标（`Index` 从0开始）。
- `$._C_`   当前循环计数（`Count` 从1开始）。
- `$._S_`   循环集大小（`Size`）。

> **注意：**
> 这3个名称不能存在于源数据中，否则源数据中的成员值会被覆盖。


### 示例1

```html
<!-- 父域包含一个news数组
    news: [{topic, about, summary}, ...] -->
<dl tpb-for="$.news">
    <!-- 子域中的$被赋值为news[i] -->
    <dt _text="$.topic"></dt>       <!-- news[i].topic -->
    <dd>
        <h4 _text="$.about"></h4>     <!-- news[i].about -->
        <p _html="$.summary"></p>   <!-- news[i].summary -->
    </dd>
</dl>
```


### 示例2

如果当前域对象就是一个数组，且全部输出，可仅简单设置 `tpb-for` 属性名。

```html
<!-- $: [
    ['c++', 'print("hello, world!");'],
    ['golang', 'fmt.Println("hello, world!")'],
    ['javascript', 'console.info("hello, world!")']
] -->
<dl tpb-for>
    <!-- 全部子元素循环 $: [i] -->
    <dt _text="$[0]"></dt>          <!-- [0][0]: <dt>c++</dt> -->
    <dd>
        <code _text="$[1]"></code>  <!-- [0][1]: <code>print("hello, world!");</code> -->
    </dd>
</dl>


<!-- 同上 -->
<dl tpb-for="$"> ... </dl>
```


### 示例3

数组的单元是一个基本数据类型，值会被转换为 `Object`（不影响显示）。

```html
<!-- $: [ 'Java', 'C/C++', 'JavaScript' ] -->
<ol tpb-for>
    <!-- $: [i] -->
    <li><code _text="$"></code></li>
    <!-- $.$ 有效，引用数组本身 -->
</ol>
```

输出：

```html
<!-- 渲染属性会被自动清除 -->
<ol>
    <li><code>Java</code></li>
    <li><code>C/C++</code></li>
    <li><code>JavaScript</code></li>
</ol>
```


## tpb-each

当前元素自我迭代循环（含子元素）。格式：`tpb-each="data"`，参数说明参考 `tpb-for` 结构。


### 示例

```html
<dl>
    <dt>请在如下选项中勾选</dt>
    <!-- list: [{sn, label, value}, ...] -->
    <dd tpb-each="$.list" _data-sn="$.sn">
        <label>
            <input name="books" type="checkbox" _value="$.value" />
            <span _text="$.label"></span>
        </label>
    </dd>
    <!--注：<dd>元素自身被克隆，数据条目逐个应用。-->
</dl>
```

或者：

```html
<dl>
    <dt>请在如下选项中勾选</dt>
    <!-- list: [{sn, label, value}, ...] -->
    <dd tpb-each="$.list" _data-sn="$.sn">
        <!-- id: 使用模板字符串（撇字符包围） -->
        <input name="books" _id="`book_${$.sn}`" type="checkbox" _value="$.value" />
        <!-- 文本说明 -->
        <label _for="`book_${$.sn}`" _text="$.label"></label>
    </dd>
</dl>
```


## tpb-if / tpb-else

存在性测试，取属性值的运算结果决定当前元素是否显示。

注意 `tpb-else` 需要与 `tpb-if` 匹配使用，并且仅限于同级元素（兄弟关系）的范围。语法词所在元素之间可以插入其它兄弟元素，它们与 `if/else` 的逻辑无关，即：`if-else` 的测试显示逻辑仅限于元素自身。

在同一个DOM层级上（同级兄弟元素），多个的 `if` 是平级关系，没有嵌套的逻辑，一个 `if` 的开始就是前一个 `if-else` 的结束，因此 `else` 对 `if` 的配对是就近匹配的逻辑。

属性值中的比较运算符不采用 `<` 或 `>` 字符，它们由下面的关键词代替：

- **LT**： 小于（<）
- **LTE**： 小于等于（<=）
- **GT**： 大于（>）
- **GTE**： 大于等于（>=）

> **注：**<br>
> 与普通语言稍有不同，这里的 `else` 依然可以携带条件，如果属性有值，则为 `elseif` 的逻辑，否则就是简单的 `case`。


### 示例

```html
<div tpb-with="$.student">
    <!-- 如果 tpb-if 为假，段落不会显示 -->
    <p tpb-if="$.age LT 7">
        欢迎 <strong _text="$.name">[孩子]</strong> 小朋友！
    </p>
    <!-- 中间段：可插入任意内容 -->
    <p tpb-else>
        <!-- 中括号内的文字为模板友好提示（会被替换） -->
        欢迎 <strong _text="$.name">[男/女]</strong> 同学！
    </p>
</div>
```


## tpb-switch / tpb-case / tpb-last

`switch{}` 语法结构，表达多个子元素的分支判断。与 `tpb-if/else` 类似，`tpb-case/last` 仅对元素自身进行匹配测试，匹配则显示，否则隐藏。语法的作用域仅限于平级的兄弟元素，`switch` 的结束随着元素的封闭自然结束，`case` 无需 `break`。

`tpb-last` 是最后一个Case，它充当两种角色：

1. `default`：如果没有任何一个 `case` 匹配，且 `tpb-last` 无值，则为 `default` 逻辑（无条件匹配）。
2. 普通的 `case` 逻辑，包含测试条件（属性值），但有一个特殊功能：如果不匹配，整个 `switch` 结构（容器元素）会隐藏。

> **注：**<br>
> 如果不需要 `last` 不匹配时隐藏整个 `switch` 结构，可以仅使用 `case` 语法。


### 示例

```html
<div tpb-with="$.student" tpb-switch="true">
    <p tpb-case="$.age LT 7">
        欢迎 <strong _text="$.name">[孩子]</strong> 小朋友！
    </p>
    <!-- 中间段：任意内容 -->
    <p tpb-case="$.age LTE 18">
        你好，<strong _text="$.name">[青少年]</strong>！
    </p>
    <!-- 中间段：任意内容 -->
    <p tpb-last>
        嗨，<strong _text="$.name">[其他]</strong>！
    </p>
</div>
```


## tpb-with

用目标对象创建一个新的当前域。这会改变当前元素及子元素上渲染变量的当前域定义，主要用于缩短子孙级成员变量引用。

该语法词的优先级在 `tpb-each` 之后、其它语法词之前，因此会影响大部分渲染结构（`tpb-var`、`tpb-if`、`tpb-switch`、`tpb-for` 等）。


### 示例

```html
<!-- info: { time, ... } -->
<em tpb-with="$.info" tpb-if="(Date.now() - $.time) LE 86400">（今日更新）</em>
```

域声明支持任意JS表达式，因此实际上可以组合创建一个新的对象用于之后的域环境。

```html
<!-- info: { time, ... } -->
<p tpb-with="{topic: $.info.title, time: $.info.time, tips: '更新'}">
    <span _text="$.topic"></span>
    更新时间：<strong _text="$.time|date('yyyy-MM-dd')"></strong>
    <em tpb-if="$.time LT 86400" _text="$.tips">[最新提示]</em>
</p>
```


## tpb-var

在当前域中新建变量来存储数据，供同域中其它渲染结构使用，可用于提取某些深层数据成员或简单计算，然后其它地方直接引用。新的变量用赋值的方式明确设置到当前域中，即如：`$.desc = $.from.value` 的形式。

赋值表达式实际上是合法的JS语法，因此支持ES6中新的赋值语法，如解构赋值。


### 示例

```html
<!-- 没啥道理哈 -->
<p tpb-var="$.schoolName = '(^,^)' + $.student.school.name">
    毕业学校：<strong _text="$.schoolName"><strong>
</p>
```


## _[attrName]

对元素特性/属性的赋值进行定义，名称采用属性名前置一个下划线（`_`）。支持两个特殊的特性名：`text` 和 `html`，表示对元素的内容赋值，插入方式分别为 `$.text()` 和 `$.html()` 的填充（`fill`）模式。

> **注：**
> 考虑便利性，`_text` 可以用一个单纯的 `_` 字符表达。


### 示例

```html
<header class="summary">
    <p class="info" _title="$.tips">
        <!-- 限制文本长度 -->
        文章来源：<a _href="url" _text="$.label|cut(40, '...')"></a>
        <!-- 输出全名，text -->
        作者：<em _=" `${$.firstName} ${$.lastName}` "></em>
    </p>
    <hr />
    <!-- 内容为html填充，用text转义 -->
    <p _html="$.summary|text('br')">[摘要为纯文本，允许换行标签]</p>
</header>
```


## 关于当前域

当前域是模板变量取值的当前环境，它在模板导入数据的初始阶段形成，这一初始的当前域也称为顶层域。

随着元素节点树的深入，在 `for/each` 循环结构中会创建新的子域，这个子域就会成为当前迭代的当前域。另外，还可以通过专用的 `tpb-with` 手动创建一个子域，以便于更简单地引用目标数据。

在 `tpb-each` 中，循环针对的是当前元素自身，因此 `tpb-with` 的优先级被设计在 `tpb-each` 之后（与元素中的先后顺序无关）。在 `tpb-for` 中，因为循环的是子元素，所以 `tpb-with` 并不能取到子域中的值，故其优先级在 `tpb-for` 之前。


### 示例

示例数据：

```js
$: {
    list: [{ about: { author, cite }, text: 'some-value' }, ...],
    title: '...'
}
```

普通Each子域引用（`tpb-each`）。

```html
<section>
    <h3 _text="$.title"></h3>
    <ul>
        <!-- 未用 tpb-with -->
        <li tpb-each="$.list">
            <label _text="$.text"></label> <!-- 子域成员引用 -->

            作者：<strong _text="$.about.author"></strong>
            来源：<em _text="$.about.cite"></em>
        </li>
    </ul>
</section>
```

Each子域中增加新的子域（`tpb-with`）。

```html
<section>
    <h3 _text="$.title"></h3>
    <ul>
        <!-- each先执行，with引用 list[i].about -->
        <li tpb-each="$.list" tpb-with="$.about">
            <label _text="$.text"></label> <!-- 通过父域链引用，同 $.$.text -->

            作者：<strong _text="$.author"></strong>
            来源：<em _text="$.cite"></em>
        </li>
    </ul>
</section>
```
