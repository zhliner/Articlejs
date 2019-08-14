# 模板渲染

用于模板渲染的属性有 `10` 个（`tpb-[for|each|if|elseif|else|with|var|switch|case|default]`），渲染属性的值是JS表达式，表达式运算的结果成为该语法结构的数据。表达式会作为函数体代码封装，调用时传入一个名称为 `$` 的实参，该实参就是一个外部数据引用。

正常的元素属性前置一个下划线是一种赋值语法，其值也是一个JS表达式，这一结构表示对相应属性赋值为表达式计算的值，如：`<a _href="$.url">`，表示对 `href` 属性赋值为 `$.url` 的值。


## 语法优先级

```js
'tpb-each' > 'tpb-with' > 'tpb-var' >
'tpb-if|elseif|else', 'tpb-switch|case|default' >
'tpb-for' > '_[attr]'
```


## 父域链

表达式中从一个特殊变量 `$` 上引用数据，`$` 可能是一个对象、数组、或基本类型的值。每个子对象都会被重置原型对象为其父对象，这样就可以从子对象上直接引用父对象的其它成员。同时，每个子对象上有一个特殊的对象名为 `$`，它引用的就是父对象本身。这样的从子到父的逆向引用被称为**父域链**。

假设有如下源数据：

```js
student = {
    name: '张三',  // 性名
    age: 28,       // 年龄
    school: {
        name: "xx市一中",
        class: "初三（1）班",
    },
    ID: 3355789,
}
```

在每一级子对象上，如 `school`，会有原型对象的重置操作：`$.proto(school, student)`，这样，`school.age` 就可以引用年龄数据了。
另外，还会设置：`school.$ = student`，这样在遇到重名冲突时，就可以通过 `school.$` 明确从父对象上引用。如：`school.$.name` 引用性名（而非校名）。

> **注：**<br>
> 实际上，在模板内 `school` 已经被赋值到 `$` 变量，模板内不是通过 `school` 引用数据，而是由 `$` 变量引用。<br>
> 因此对于被子成员名称覆盖的父级数据，就是形如 `$.$.$...` 的引用方式了。<br>


## tpb-for

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


## tpb-each

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


## tpb-if / tpb-elseif / tpb-else

存在性测试。属性值为JS表达式，取运算结果决定当前元素是否显示。`tpb-elsif` 和 `tpb-else` 与 `tpb-if` 匹配使用，但 if/else 逻辑仅限于同级元素（兄弟关系）范围。
各语法词的定义之间可以插入任意其它兄弟元素，这些兄弟元素与 if/else 逻辑无关。

多个 `if` 间是平级关系，没有嵌套逻辑，一个 `if` 的开始就是前一个 `if/elseif/else` 逻辑的结束。因此 `elseif/else` 对 `if` 就是就近匹配的关系。

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


## tpb-switch / tpb-case / tpb-default

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


## tpb-with

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


## tpb-var

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


## _[attrName]

对元素属性进行赋值，属性名即为去除前置下划线部分。前置的下划线是一个标志，表示会被渲染处理。单纯的 `_` 表示元素的内容，赋值方式为 `html` 填充（假定内容由设计师构造，而源数据安全）。

> **注：**<br>
> 如果不放心服务器端提供的源数据，可以使用 `$.html()` 预处理一次（`<` to `&lt;`），或采用 `|text` 过滤器。

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


## 补：关于当前域

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
