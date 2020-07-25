# Tpb 详细设计

> `tpb`: Templated Presentational Behavior


## 目的

在HTML上简单直观地设计UI，因为UI的交互也应当属于页面设计的逻辑，所以事件的绑定规划也需要包含。

HTML的代码有着严格的嵌套结构，虽然浏览器可以解析混乱的HTML源码，但这种树形嵌套结构也可以是人性友好的，这样设计师更容易简单直观地思考。另外，简单的HTML源码也可以节省数据存储的数量和网络传输的流量。

**源码**不一定是程序员的专属，页面设计师也可以面对源码思考。实际上，HTML是一种模板，在模板上定义交互十分正常。

本设计中的事件绑定在模板中定义，由设计师完全主导。设计师唯一需要知道的是有哪些数据可用，而这些数据都是纯数据，与页面的结构逻辑无关。同时，程序员也不需要知道数据将如何展现，也即：理论上，数据中不应当有HTML结构。



## 指令

以模板为驱动，功能指令书写在HTML元素上，自动解析完成事件的绑定和行为序列的编译。

1. **行为定义：**<br>
    由三个属性 `on`、`by`、`to` 定义，在元素上配置需要处理的事件和相应的行为链。其中：
    - `on`：事件绑定和取值逻辑。
    - `by`：具体的业务处理，可选。复杂时可划分为 `CMV`（`Control`, `Model`, `View`）三个层次。
    - `to`：用业务环节来的数据更新UI。可选，但通常都会存在。

    另外，支持一个 `obt-src` 属性导入外部的 `On/By/To` 定义，格式：`{ on, by?, to? }`。**注**：该配置可以独立出来，用一个 `selector` 属性定位目标元素。

2. **节点渲染：**<br>
    由九个渲染属性 `tpb-[for|each|if|else|with|var|switch|case|last]` 表达模板的语法结构，以及一个 **属性名前置下划线** 指定属性赋值的规则，如：`_href="$.url"` 表示对 `href` 属性赋值为变量 `url` 的值。
    - `tpb-for`: 子元素的循环。
    - `tpb-each`: 当前元素的循环迭代。
    - `tpb-if`: 当前元素 if 测试，真值显示，假值隐藏。
    - `tpb-else`: 当前元素 else 测试，与 `if` 匹配使用。可以包含条件，此时即为 elseif 逻辑。
    - `tpb-with`: 新建局部域，变量引用为局部域成员。
    - `tpb-var`: 新建变量，方便后续简化使用。
    - `tpb-switch`: 创建子元素 `switch` 逻辑。
    - `tpb-case`: 当前元素 `case` 测试，与 `switch` 标的值比较，相等则显示，否则隐藏。
    - `tpb-last`: `switch` 的最后分支，无值时为 default 逻辑，有值时为 `case` 逻辑，但不匹配时会隐藏整个 `switch` 结构。

3. **模板管理：**<br>
    由三个属性 `tpl-[name|node|source]` 配置。
    - `tpl-name`: 当前元素命名为一个具名模板，用于外部检索或子模版导入时引用。
    - `tpl-node`: 引入克隆的模板节点（`replace`）。支持同时定义多个节点，各名称间逗号（`,`）分隔。
    - `tpl-source`: 引入元素的模板节点。同上支持。



## OBT

`OBT` 即**行为定义**中 `on/by/to` 的简写。事件/行为在这三个属性上定义，系统自动解析，绑定目标事件名并构造相应的**调用链**。

调用链可视为一个指令/方法的序列，它们对一个共同的数据栈（**后进先出**）进行操作，返回的值（除了 `undefined`）会自动压入数据栈（栈顶）。形象地看，调用链有点象流水线，线上的各个指令对数据栈依次处理并把结果入栈供后续指令使用，这些数据被称为**流程数据**，而这条流水线也被称为**执行流**。


### 数据获取

数据栈内的数据需要取出后再用于指令的实参，它们是指令操作的目标。取出的数据先被放在一个称为**暂存区**的队列中（**先进先出**），可以一次取出多个，也可以连续或间断多次取出。指令需要的实参先从暂存区（队列头部）获取，如果暂存区已空，则自动从数据栈（栈顶）提取。存在于暂存区队列头部当前需要的数据称为**当前条目**。

**暂存区**的设计是为了让线性的指令序列模式获得一种腾挪的能力。因为上一阶指令的结果会自动入栈，而下一阶指令需要的实参未必就是该值，所以一个与指令序列同向的先进先出的队列可以让用户提前布置实参。


### 分组对应的配置格式

`On/By/To` 上的配置可以有多组，每一组用分号（`;`）分隔，多组之间严格地按位置对应，如：

```html
<article
    on="AA; BB; CC"
    by="Xx; -;  Zz"
    to="T1; T2">
</article>
<!-- 注：分号后的空格可选 -->
```

**说明：**

- **`{ AA / Xx / T1 }`** 为一组行为链，分别对应于 `On / By / To` 各自的逻辑。
- **`{ BB / - / T2 }`**  为一组行为链，OBT对应逻辑同上，但其中 `By` 是一个空值（无定义，`-` 为占位符）。
- **`{ CC / Zz / - }`**  为一组行为链，OBT对应逻辑同前，但末尾的 `To` 没有定义（占位符在末尾时可省略）。


### 隐形的首个实参

所有方法中的首个实参都为 `evo`（event-value-object），它们是在方法调用时自动传入的，在模板中并不可见。

```js
evo: {
    target: {Element}               // 事件起点元素（event.target）
    current: {Element}              // 触发事件的当前元素（matched|event.currentTarget）
    delegate: {Element}             // 委托绑定的元素（event.currentTarget）

    event: {Event}                  // 原生事件对象（未侵入）
    selector: {String|null}         // 委托匹配选择器（for match）]
    data: {Value|[Value]|undefined} // 指令当前流程数据（自动从暂存区或数据栈获取）

    entry: {Function}               // 迭代入口函数，由entry指令创建。其它指令内部也可直接调用：evo.entry(...)
    primary: {Element|Collector}    // To：初始检索结果，不被更新时与 To:updated 相同
    updated: {Element|Collector}    // To：更新目标（集），会被返回非假值方法的结果覆写
}
```

其中 `evo.data` 是由暂存区或数据栈中取出的条目，即方法操作的目标。是否从数据栈中取值或取值的特性由方法的 `[EXTENT]` 属性配置，含义如下：

- `1`  暂存区有值则取出1项，否则取栈顶1项（值）。
- `n`  暂存区有值则取出n项（可能不足n项），否则取栈顶n项（构建为数组）。
- `0`  暂存区有值则取出全部（清空），无值也不取栈。
- `-1` 暂存区有值则取出1项，无值也不取栈。
- `-n` 暂存区有值则取出n项（可能不足n项），无值也不取栈。
- `null|undefined` 指令无需流程数据，或自己操作数据栈（有特权时）。

如果方法需要操作数据栈本身，需要标记 `[ACCESS]` 为 `true`（特权），这时第二个实参即为数据栈实例（通常名为 `stack`），这在模板中也不可见。


#### 附1：流程数据依赖的几种情形

1. 如果方法**明确需要**有操作目标，此时应当要求自动取栈。`[EXTENT]` 配置为需要的流程数据条目数。
2. 如果目标**可有可无**，此时目标应该是可选的，不应当要求自动取栈。`[EXTENT]` 配置值为负值，如果需要取出暂存区全部条码，设置为 `0`。
3. 如果方法没有对流程数据有要求，即无需操作目标。此时 `[EXTENT]` 可能为 `null` 或 `undefined`，暂存区会保持原样。
4. 有的方法需要根据模板实参自行判断灵活取值，此时 `[EXTENT]` 也应当为 `null`，取值会影响暂存区。


#### 附2：自定义函数的复杂性限制

用户可以在模板中使用字符代码创建函数，但这是有限度的：**只支持表达式代码**（即不能有 `return`）。你也可以使用箭头（`=>`）语法创建简单的箭头函数。

简单的函数支持用于满足小而灵活的需求，复杂的函数应当定义在By部分。


### 从流程取实参

流程数据通常只是操作指令取值或处理的目标，指令的实参是从模板中静态获取的，但很多情况下需要实参有动态性，即可以从流程中获取。

这里的设计是：通过模板实参中的 `_n` 标识名，表达需要从流程中获取实参。例如：

- `attr('-val')` 表示从流程数据（元素|元素集）上获取 `data-val` 特性值。
- `attr(_1)` 表示除了需要从流程数据中获取操作目标外，需要先从流程中获取目标特性名（如：`data-val`）。**注意**：`_1` 不是字符串。

从流程中取实参是直接从数据栈上提取的，与暂存区无关。更多的例子如下：

- `evo(1) ev('detail') attr(_1)`：先从栈顶取特性名实参（`ev('detail)`），然后再取出事件目标元素（`evo.target`），提取其某特性值（`attr(...)`）。
- `ev('detail') evo(1) pop $(_1)`：其中 `pop` 指令提取栈顶1项（`evo(1)`）到暂存区备用，然后 `_1` 从数据栈顶获取选择器（`ev('detail)`），之后的检索以暂存区元素为起点（`$(...)`）。
- `evo(1) pop ev('detail') $(_1)`：效果同上，`pop` 指令先取起点元素到暂存区，`ev('detail)` 入栈数据不影响暂存区。

> **注记：**<br>
> 实参数据先于操作目标取值有一个好处：可适应**实参依赖操作目标**（操作目标在前）和**操作目标依赖实参**（实参在前，通过 `pop` 让位）两种情况。<br>
> 而如果反过来（实参后于操作目标取值），则只能适应操作目标在后一种情形了，此时的 `pop` 没有更多的效用。<br>

标识名 `_n` 是一个系列，其中的 `n` 可以是 `1-9`，分别表示从数据栈中取 `1-9` 个实参。另外，`_0` 是一个特殊值，表示从栈顶1项实参，但会展开传递到模板指令。

标识名 `_n` 只能是模板指令实参中的最后一个。`_0` 实际上表达了模板指令中最后的不定数量的实参，出于简化，`_0` 也可以用 `_` 表示。


### `obted` 事件

系统提供一个自定义事件：当一个元素/对象的 OBT 构建完成后，会向元素发送一个**非冒泡**并**不可取消**的事件 `obted`，这通常很有用。

注意：`obted` 事件是导入模板之后编译完成即发送，元素本身可能并未插入到文档树（DOM）中。如果要在 `obted` 中检索跨模板的元素是无效的（如ID引用）。但是，可以通过 `tpl` 指令引入上下文元素查询，或者在全部编译（如 `Tpb.Build(document).then(...)`）结束后再检索。


### 编译与运行

OBT的定义被书写在HTML元素的属性上，它们是字符串的形式，在执行这个调用链之前，系统会先进行编译。每次事件的触发都会执行相应的调用链，但编译是一次性的，指令中的参数是在源码编译时执行的，这提供了一种静态的逻辑，比如：`push(new Date(), 'hello')` 调用式，前一个实参实际上是一个 `Date` 实例（`new Date()` 的结果），并不是每次都新建一个 `Date` 实例。这些实参保存在一个指令（`Cell`）对象上，调用链每次执行时会使用它们，这里就是每一次调用链执行都会将该 `Date` 实例压入该调用链对应的内部数据栈，后一个字符串实参 `hello` 也同理。

**附**：当然，如果要每一次执行都新建一个 `Date` 对象，有一个专用的指令 `date()`，这是实时的（事件触发时）。或者也可以将它封装为字符串然后再构造函数并调用，如：`push('new Date()') func exec`，也或者封装为一个箭头函数后调用，如：`push(()=>new Date()) exec`。

> **注：**
> 模板中书写的调用式的实参称为模板实参，它们是程序源码中指令的参数的后段部分。



## 基础指令集

### 控制类

适用于 On/By/To:NextStage 三个域。

```js
// 基本控制
//-----------------------------------------------

pass( ...vals: Value ): void
// 通过性检查。

end( ...vals: Value ): void
// 流程终止。

avoid( back?: Value ): back|void
// 停止事件默认的行为。

stop( back?: Value ): back|void
// 停止事件冒泡。

stopAll( back?: Value ): back|void
// 停止事件冒泡并阻止本事件其它处理器的执行。



// 暂存区赋值。
// 目标：无。
// 特权：是，操作数据栈接口。
//-----------------------------------------------

pop( n?: Number ): void
// 弹出栈顶n项。

shift( n?: Number ): void
// 取出栈底n项。

index( ...ns: Number ): void
// 引用目标位置项。



// 数据栈操作。
//-----------------------------------------------

nil(): void
// 空值入栈。

push( ...val: Value|[Value] ): void
// 直接入栈。

dup( n = 1 ): Value|[Value]
// 复制栈顶n项。

ddup( n = 1 ): Value|[Value]
// 深度复制栈顶n项。

pack( n: Number ): [Value]
// 栈顶n项打包封装。

slice( begin: Number, end:Number ): [Value]
// 任意区段打包。

spread(): [...Value]
// 将条目展开入栈。

vain( n: Number ): void
// 剔除栈顶多余的项。



//
// 特殊控制。
// 需要this为指令单元（Cell），无预绑定。
//-----------------------------------------------

prune( cnt: Number = 1, n: Number = 1 ): void
// 移除后端跟随指令（单次）。

entry(): void
// 创建入口方法。

loop( cnt, val ): void
// 区段循环（entry开始）。



//
// 简单值操作。
//-----------------------------------------------

env( names: String, its?: Value|String ): void|Value
// 设置/获取全局变量。

sess( name: String|null, its?: Value|String|null): void|Value
// 设置/取值浏览器会话数据（sessionStorage）。

local( name: String|null, its?: Value|String|null): void|Value
// 设置/取值浏览器本地数据（localStorage）。

$if( val, elseval?: Value ): Value
// 条件赋值。

$case( ...vals: String ): [Boolean]
// 分支比较。

$switch( ...vals: String ): Value
// 分支判断赋值。



// 其它
//-----------------------------------------------

debug( keep: false ): Value
// 控制台调试打印。
```


### 计算/加工

仅用于 On 域。

```js
// 数学运算。
// 支持前一个操作数是数组的情况（对成员计算）。
//-----------------------------------------------

add( val?: Number ): Number|String|[...] // (x, y) => x + y
sub( val?: Number ): Number|[Number]     // (x, y) => x - y
mul( val?: Number ): Number|[Number]     // (x, y) => x * y
div( val?: Number ): Number|[Number]     // (x, y) => x / y
mod( val?: Number ): Number|[Number]     // (x, y) => x % y
pow( val?: Number ): Number|[Number]     // (x, y) => x ** y
// 标准算术。

divi( val?: Number ): Number|[Number]    // (x, y) => parseInt(x/y)   // 小数截断
fdiv( val?: Number ): Number|[Number]    // (x, y) => Math.floor(x/y) // 向小取整
cdiv( val?: Number ): Number|[Number]    // (x, y) => Math.ceil(x/y)  // 向大取整
rdiv( val?: Number ): Number|[Number]    // (x, y) => Math.round(x/y) // 四舍五入
// 除法定制。

neg(): Number|[Number]
// 数值取负（-x）。

vnot(): Boolean|[Boolean]
// 逻辑取反（!x）。

divmod( val?: Number ): [Number, Number]
// 除并求余。(x, y) => [商, 模]



// 比较运算。
// 目标：当前条目/栈顶2项。
//-----------------------------------------------

eq( v?: Value ): Boolean     // (x, y) => x === y
neq( v?: Value ): Boolean    // (x, y) => x !== y
lt( v?: Value ): Boolean     // (x, y) => x < y
lte( v?: Value ): Boolean    // (x, y) => x <= y
gt( v?: Value ): Boolean     // (x, y) => x > y
gte( v?: Value ): Boolean    // (x, y) => x >= y

eqarr( arr?: Array )
// 数组相等比较。

contains( strict: Boolean ): Boolean
// 元素包含测试。

test( str: String ): Boolean
// 正则表达式测试。



// 逻辑运算。
//-----------------------------------------------

within( min, max ): Boolean
// 目标是否在 [min, max] 内（含边界）。

include( ...vals ): Boolean
// 目标是否在实参序列内。

both( strict: Boolean ): Boolean
// 二者为真判断。

either(): Boolean
// 二者任一为真测试。

every( expr ): Boolean
// 集合成员全为真测试。

some( expr ): Boolean
// 集合成员至少1项为真测试。

inside( name: String, val: Value|[Value] ): Boolean
// 目标对象内成员测试。



// String简单处理。
// 支持集合成员逐一处理，返回一个新集合。
//-----------------------------------------------

trim( where = 0 ): String
// 首尾空白修整。

clean( all ): String
// 空白清理。

replace( ...args ): String
// 内容替换。

split( sep, cnt ): [String]
// 切分字符串为数组。

caseUpper( n ): String
// 转换为大写。

caseLower(): String
// 转为全小写。

rgb16(): String
// rgb(n,n,n) => #rrggbb

rgba16(): String
// rgba(n,n,n,a) => #rrggbbaa



// 增强运算。
//-----------------------------------------------

exec( ...rest ): Value
// 函数执行。

calc( expr ): Value
// 表达式/函数运算。

apply( meth, ...args ): void
// 应用目标的方法。

applies( meth, ...args ): void
// 应用目标的方法（多次）。

set( name:String, val:Value|[Value] ): evo.data
// 设置目标成员值。



// 实用工具。
//-----------------------------------------------

hotKey( key, extra ): Boolean
// 热键触发。

rangeKeep(): void
// 活动选取记忆。

exeCmd( type: String ): void
// 执行document命令
// 即：document.execCommand(...)
```


### tQuery集合处理

集合操作是对目标数据集进行简单的处理，然后返回一个结果集。

```js
// tQuery|Collector兼有
// 目标为Collector时返回Collector，否则返回普通数组。
//-----------------------------------------------

filter( fltr: String|Function ): [Value]|Collector
// 值集过滤。
// 匹配者构建一个新数组入栈，适用元素和普通值集。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项：[集合, 过滤器]
// 注：返回值类型与目标值类型相同。

not( fltr: String|Function ): [Value]|Collector
// 值集排除。
// 符合者被排除，剩余的创建为一个新集合入栈。
// 适用元素和普通值集。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项操作：(集合, 过滤器)
// 注：返回值类型与目标值类型相同。

has( slr: String ): [Element]|Collector
// 子成员包含。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取自。
// 如果实参未传递，取栈顶2项操作：(集合, 过滤器)
// 注：
// 仅适用于元素集，普通值集无效。
// 返回值类型与目标值类型相同。

map( proc: Function ): [Value]|Collector
// 集合映射。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 返回的集合与目标类型相同。
// 对于普通数组与Collector有一些区别：
// - 普通数组：$.map(xxx, proc) 处理器返回的undefined和null会被忽略。
// - Collector: $(xxx).map(proc) 实际上是调用数组原生的.map()，返回值都有效。
// proc接口：function(value, index, obj): Value
// 如果proc为空，取栈顶2项：[集合，处理器]

each( proc: Function ): data
// 迭代执行。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 目标应该是一个集合，没有返回值入栈。
// 回调函数内返回false会中断迭代。
// 指令返回被操作的目标对象。
// proc接口：function(value, index, obj): Value
// 如果proc为空，取栈顶2项：[集合，处理器]

unique( comp: Function|true|null ): [Value]|Collector
// 去重&排序。
// 目标：当前条目/栈顶1项。
// 特权：否。
// 集合如果不是Collector，可为对象（取其值集）。
// 默认为去重功能，如果传递comp实参则增加排序能力。
// comp:
// - true DOM节点排序
// - null 默认排序规则，适用非节点数据
// comp接口：function(a, b): Boolean


// Array|Collector
//-----------------------------------------------

sort( comp?: Function|null ): [Value]|Collector
// 集合排序。
// 目标：当前条目/栈顶1项。
// 特权：否。
// 对于元素Collector集合，comp应当为空获得默认的排序算法。
// 对于普通值Collector集合，comp可传递null获得JS环境默认排序规则。

reverse(): [Value]|Collector
// 成员序位反转。
// 目标：当前条目/栈顶1项。
// 返回一个新的数组。

flat( deep: Number|true ): [Value]|Collector
// 成员数组扁平化。
// 将目标内可能嵌套的子数组扁平化。
// 目标：当前条目/栈顶1-2项。
// 特权：是，灵活取栈。
// 如果是元素Collector集合，deep可以为true附加去重排序（1级扁平化）。
// 如果实参未传递，取栈顶2项：[集合, 深度值]

concat( ...vals ): [Value]
// 数组串接。

join( chr ): String
// 接数组各成员。

mix( n ): Array
// 集合混合。

sum(): Number
// 集合成员值累计。
```



## 应用

### 交互文档

最简单的形式，让普通网页包含互动，不涉及向服务器请求新的数据。适合普通的离线文档手册等。


### 动态页（By:pull）

需要联网，页面向服务器实时请求数据更新内容，页面展示逻辑较为简单（通常不涉及模板渲染）。


### 页程序（x.[myApp].run(...); x.[myApp].[meth]; x.[myApp].[meth].[...]）

功能复杂的页面应用，向服务器提交的请求较为多样，返回的数据需要再处理以符合展示逻辑。通常需要模板支持，逻辑被分解为 `CMV`（`Control/Model/View`） 三个层次。

当然，纯本地的复杂JS应用也可以采用这种分层结构。



## 附录

### 缩写

> `OBT`: `On-By-To` 在HTML页面中定义行为。
> `CMV`: `Control, Model, View` 复杂App的业务切分（三层）。


### 模板特殊字符

在模板中部分标点符号用于特别的目的。

- **`;`** 分号。分隔符，用于通用的逻辑区隔，如OBT定义分组。
- **`_`** 空格（Space）。指令序列的分隔字符。
- **`,`** 逗号。实参序列的分隔符。
- **`|`** 竖线。递进处置，如输出数据的过滤处理、事件关联的行为链。
- **`-`** 横线。空值占位，主要用于OBT分组定义中的顺序保持。
- **`$`** 对当前域或父域对象的引用。
