# Tpb 详细设计

> **缩写：**
> `tpb`: Template Presentational Behavior
> `OBT`: `On-By-To` @html
> `GPS`: `Get, Process, Set`
> `EMR`: `Entry, Model, Render` @ Process


**事件：**
- `tplend`: 模板读取完毕。在 `document` 上触发。
- `tpldone`: 模板构建完毕，包括 `OBT` 解析绑定。在有 `OBT` 配置上的每一个元素上触发，不冒泡。


**全局对象：**

- `OBT.on`： On 的方法集。
- `OBT.by`： By 的方法集。
- `OBT.to`： To 的方法集。


## OnByTo 逻辑重构

> 仔细划分逻辑区域，简化PB集。

- `On/To`: DOM/界面逻辑。
- `By`: App/程序逻辑，可选。注：可以被 `On->To` 跳过。


### On

关联事件，求取各种值，值进入流程向后传递。`tQuery|Collector` 中的方法仅限于取值（注：赋值在 `To:method` 中）。

**方法集：**

```js
$( rid ): Element
// tQuery.get(...)
// rid: {String|Number|null}
// - 相对ID，null为取流程数据（String）。
// - 数值表示取事件关联的元素或值：{
//      0   origin 事件起点元素
//      1   current 冒泡到的当前元素
//      2   delegate 定义委托的元素
//      3   ev.detail 自定义事件传递的数据
// }

$$( rid ): Collector
// tQuery(...)
// rid: {String|Number|null}
// - 含义同上。非字符串也可被封装为Collector。
// - 数值实参含义同上，事件关联元素被打包为Collector。

$Z( meth:String, index:Number, len:Number ): void
// 设置数据游标，供后续数据添加判断。
// meth:
//     append/appends   追加，单个或集合展开。游标会自动后移。（a/a+）
//     insert/inserts   前插，单个或集合展开。游标不变，总是前插。（i/i+）
//     splice/splices   删除并拼接，单个或集合展开。游标不变，len参数有效。（s/s+）
//     fill/fills       填充，新数据复制或扩展逐一填充到流程数组。（f/f+）
//     null             清除数据游标和状态（meth）。
// 注：
// 主要用于在数组中间插入，流程数据若非数组，会被转为数组。
// 未设置时为简单替换（this.next() 默认）。
// 新数据即便是一个集合，也可以作为单体添加（不展开）。

body()      // 赋值流程数据为 document.body
nil()       // 一个空行为，占位
put( val )  // 向流程内直接传值


// tQuery：数据创建

Elem()      // 创建元素（tQuery.Element）
Text()      // 创建文本节点（tQuery.Text）
create()    // 创建文档片段（DocumentFragment）
svg()       // 创建SVG元素（tQuery.svg）
table()     // 创建表格实例（$.Table）
range()     // 构造范围序列
now()       // 获取时间戳

isXML()     // 是否为XML节点
queryURL()  // 构建URL查询串
get( slr )  // 在流程元素（集）上下文中查询单个目标
find( slr ) // 在流程元素（集）上下文中查询多个目标并合并

next()

tags()      // 转为标签字符串（[] to <>）
html()      // 转换为HTML源码（< 到 &lt;）
text()      // 转换为文本（&lt; 到 <）
val()       // 按表单逻辑取值（disabled者为null）


form( rid, ...exclude ): [Array]    // 获取表单内可提交的控件[名,值]。exclude 排除的控件名序列


// 元素（集）简单取值类

attr( name, rid ): Value|[Value]    // 特性取值
prop( name, rid ): Value|[Value]    // 属性取值
css( name, rid ): Value|[Value]     // 样式取值（计算后）

clss( rid ): [String]               // 取类名集，非 attr('class') 的值
pba( rid ): [String]                // PB属性取值（参数）
pbo( rid ): [String]                // PB属性取值（选项）

pick( ...idx ): Value               // 从流程集合中取值
env( ev, name ): Value              // 从环境取值
tpl( $name ): Element               // 请求模板节点


// 数据构造（简单）

RE( flag, str ): RegExp         // 构造正则表达式
slr( attr, val, op, tag )       // 构造CSS选择器串
scam( ev ): Object              // 修饰键状态封装（Alt/Ctrl/Shift/Meta）
date( v1, ...rest ): Date       // 构造日期/时间对象

Arr( op ): Array                // 转换为数组
Str( prefix, suffix ): String   // 转换为字符串
Num( spec ): Number             // 转换为数值
Bool(): Boolean                 // 转换为布尔值（false|true）

Int( str, radix )               // 将字符串转为整数。即 parseInt()
Float( str )                    // 将字符串转为浮点数。即 parseFloat()



// 简单操作类。
// 该部分操作对象就是流程元素自身，无to目标。
unwrap()        // 流程元素（集）解包裹
remove()        // 移除流程元素
empty()         // 流程元素清空（同 to:fill 空数据）
normalize()     // 流程元素规范化
clone( event )  // 流程元素（集）克隆。



// 全局方法。
// 可用于 On/By/To 段内！

flag( name, $val )  // 标志取值&设置

pass( flag )
// 通过检测（执行流继续）。
// flag:
//     {String} 测试全局的flag标记，是否存在。
//     {Number} 测试流程数据（数组）下标位置值，是否非假（false,'',null,0,undefined）。
//
//     true     流程数据本身 true 时通过（严格类型）。
//     false    流程数据本身为 false 时通过（严格类型）。
//     null     流程数据本身为 null 时通过（严格类型）。
//     ''       流程数据本身为空串时通过（严格匹配）。
//
//     ---      无实参，流程数据非假（false,'',null,0,undefined）时通过。

every( ...flag )
// 全部真值为真，flag 含义同上。

some( ...flag )
// 部分真值为真，flag 含义同上。


then( meth, ...rest )
// 流程数据非假时执行 meth，rest为meth的参数序列。
// 注：流程数据为meth的首个参数。

fault( meth, ...rest )
// 流程数据为假时执行 meth。
```


### To

从流程取值对目标赋值，展现结果（如样式）。支持后续联动事件触发和元素状态PB（如：focus/select等）。
如果目标为多个：源数据为数组时，分别赋值，否则为相同赋值。

`to = "Query | Method | Next-Stage"`


#### Query

```js
xxxx   // 单元素检索，$.get(): Element
[xx]   // 多元素检索，$(...): Collector


// 多元素过滤|处理

[xx]:(beg, end)
// 范围过滤。
// beg为起点下标，end为终点下标（不包含），可选。

[xx]:[x,y,z...]
// 定点过滤。[...] 为目标位置数组。

[xx]:{function}
// 处理过滤。{} 内为处理函数，参数：(Element, index)。
// 返回值：
// - 返回true，保留源成员。
// - 返回false，移除源成员。
// - 返回元素或其它值，替换源成员。
// 注：
// filter 和 map 的合并。
```


#### Method

```js
[node]
// 下面的方法种中流程数据为数据，当前检索为目标。
// 遵循tQuery相应接口规则。

// 节点数据
- before    // 插入目标之前
- after     // 插入目标之后
- begin     // 插入目标内前端
- prepend   // 同上
- end       // 插入目标内末尾
- append    // 同上
- fill      // 填充目标内容（替换）
- replace   // 替换目标本身

// 标量数据
- html      // 填充源码构造的节点
- text      // 填充文本
- val       // 按表单逻辑赋值

// 元素或文本数据
- wrap      // 目标被（各自）包裹
- wrapInner // 目标被（各自）内包裹
- wrapAll   // 包裹目标节点（集）

// 下面的方法中流程数据为目标，当前检索为数据。
// 注：
// 这里没有复制控制，因此数据元素是移动方式。
- beforeWith
- afterWith
- prependWith
- appendWith
- replaceWith
- fillWith


[attr]
- &[name]
// 例：[3@li]|&style|fire('...')
// $(...).attr('style', xxx)
// 注：这里的 style 是元素的样式属性，即 cssText 值。
// 例：
// &class：赋值元素的class属性值。
// &-val： 同 &data-val

[prop]
- $[name]
// 例：.Test|$value|fire('...')
// let el = $.get('.Test')
// $.prop( el, 'value', xxx )
// 特例：
// $class+  添加类名。默认，+字符可省略。
// $class-  删除类名。
// $class^  切换类名。
// $class=  全部替换。与 &class 效果相同。

[css]
- %[name]
// 例：.Test|%font-size|fire('...')
// let el = $.get('.Test')
// $.css(el, 'font-size', xxx)
// 注：名称 fontSize 同样可行。
```


扩展：

- 支持多方法定义，逗号分隔。
- 多方法主要用于多目标或多数据的情况，此时按数组成员一一对应。
- 如果目标唯一，则多个方法应用到同一目标。

例：

```js
#test|&value, $value|...
// 对id为test的目标元素同时设置其value属性和value特性。
// 数据源可能为数组，也可能为单个值。为数组时采用一一对应方式。

[.Test]|&title|...
// 对class为Test的元素设置其title属性。
// 通常来说，数据源可能是一个数组，以便不同的元素有不同的提示。

[.Test]|&title, $value|...
// 对class为Test的元素设置其title特性和value属性。
// 数据源几乎肯定是一个数组，以对应不同的方法。
// 如果数据源是一个二维数组（双值数组的数组），其与元素一一对应赋值（应用到两个方法）。
// 即：将两个方法视为一个独立单元。
```

> **说明：**<br>
> 如果数据源、目标元素、方法三者都为数组，则前两者的数组属性优先。<br>
> 然后数据源的成员（可能也是一个数组）应用到方法数组上。即：若存在数组，则一一对应。<br>


#### Next-Stage

```js
// 元素检索/求值。
// 注：不支持更多的On方法，但扩展能力。
$( rid, method, ...rest ): Element | Any
// tQuery.get(...)
// rid: {String|Number|null}
// method: {String}
// - tQuery的方法，rest为方法的实参序列。
// - 调用进阶方法，返回值可能为任意值。下同。
// - 进阶的方法名仅限于On中已经定义的成员（与tQuery的交集）。

$$( rid, method, ...rest ): Collector | Any
// tQuery(...)
// rid: {String|Number|null}
// method: {String}
// - Collector的方法，rest为方法的实参序列。
// - 方法名限定同上。


// $.trigger
fire( evn, data )

// 默认在流程元素上触发。
// 注：在 Method 后被替换为当前检索。
blur()
click()
focus()
pause()
play()
reset()
scroll( x, y )
select()
load()
submit()

// 定制事件。
change()           // 主动触发表单控件的change事件
clear()            // <select>取消选取，单选按钮取消选取
tips( msg, time )  // 消息提示。注：计时器ID记录在消息容器上

...

// 方法调用。
// 流程元素上方法的无条件调用。
// 注：fire()的触发调用需要先有注册绑定。
method( name, ...rest )
```


### By

对 `On` 采集的流程数据进行处理。

系统有一个简单的默认处理集（X.[meth]），处理器同样可以串连（逗号分隔）使用。通常来说，此阶段的定制扩展比较多。
注：因为 `On` 的种类和方式有限，`To` 的规格基本确定。

> **注：**
> 对于动画或特效，`On` 负责初始数据，`By` 则负责后续的连续行为。


#### 系统方法集

**注**：属于名称空间 `X` 或 `x`，表示综合的意思。

```js
func( ...code ): Function
// 创建函数：new Function()
// 函数体内 $ 表示流程数据（即屏蔽了外部 $）。
// 实现：
// new Function('$', ...code).bind(null, this.data)

call( ...rest ): Any
// 视流程数据为函数，传递实参并调用
// 通常在 func 之后使用。


// 数据处理 ///////////


// 本地存储 ///////////
```



## 注记

**类比：**

```js
On -> Input:Data
By -> Doing:Process
To -> Output:Show
```
