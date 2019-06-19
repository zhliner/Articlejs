# Tpb 详细设计

> **注**：tpb: Template Presentational Behavior



```js
PB:next( data, method, index )
// 流程接续调用。
// data: {Any} 续传数据
// method: {String} 添加方法（push, insert, set, fill, replace）
// index: {Number} insert/set 的位置
```


## 注记：

### OnByTo 逻辑重构

> 仔细划分逻辑区域，简化PB集。

**On/To**: DOM/界面逻辑。
**By**: App/程序逻辑，可选。注：可以被 `On-To` 跳过。


**On:**
关联事件，求取各种值，值进入流程向后传递。支持事件触发？（注：可能取消）
> {OnPB}

方法集：

```js
$( rid, ctx|method, ...rest ): Element
// tQuery.get(...)
// ctx: {Element|String}
// .get() 的查询上下文或进阶的tQuery方法。如果为方法，rest即为方法的实参序列。
// ctx为上下文时，rest也可以有效，此时其首个值为方法名。

$$( rid, ctx|method, ...rest ): Collector
// tQuery(...)
// ctx: {Element|String}
// tQuery() 的查询上下文或进阶的Collector方法。
// rest 参数说明同上。

call( name, ...rest ): Any
// tQuery 方法调用。

$call( name, ...rest ): Any
// Collector 方法调用。


// 简单数据操作类
// 注：仅简单的取值赋值、转换类。

pull( idx ): void
// 从流程集合中取值。

// 类型转换
// ...


// 全局方法。

flag( name, $val )  // 标志取值&设置
pass( ...flags )    // 通过检测（流程继续）。注：适合flag域和流程数据
```


**To:**
从流程取值对目标赋值，展现结果（如样式）。支持后续联动事件触发和元素状态PB（如：focus/select等）。
如果目标为多个：源数据为数组时，分别赋值，否则为相同赋值。

to = "Query | Method | Next-Stage"

Query:

    - xxxx 单元素检索，$.get(): Element
    - [xx] 多元素检索，$(...): Collector

    扩展
    - [xx]:(beg, end) 多元素检索并过滤，beg为起点下标，end为终点下标（不包含），可选。
    - [xx]:[x,y,z...] 多元素检索并过滤，[...] 为目标位置数组。
    - [xx]:{function} 多元素检索并处理，{} 内为处理函数，参数：(Element, index)。
    注：
    处理函数是filter和map功能的合体。
    - 返回true，保留源成员。
    - 返回假值（false|null|...），移除源成员。
    - 返回元素或其它非假值，替换源成员。


Method:

```js
[node]
// 下面的方法种中流程数据为数据，当前检索为目标。
- before
- after
- begin
- prepend
- end
- append
- fill
- replace
- html
- text

// 下面的方法中流程数据为目标，当前检索的元素为数据。
// 注意：
// 这里没有复制控制，因此数据元素是移动模式。
// 这不应当是常用的方法，是提供一种选择的可能。
- beforeFrom
- afterFrom
- prependFrom
- appendFrom
- replaceFrom
- fillFrom


[attr]
- &[name]
// 例：[3@li]|&style|fire('...')
// $(...).attr('style', xxx)
// 注：这里的 style 是元素属性，即 cssText 值。

[prop]
- $[name]
// 例：.Test|$value|fire('...')
// let el = $.get('.Test')
// $.prop( el, 'value', xxx )

[css]
- %[name]
// 例：.Test|%font-size|fire('...')
// let el = $.get('.Test')
// $.css(el, 'font-size', xxx)
```


扩展：
支持多方法定义，逗号分隔。
多方法主要用于多目标或多数据的情况，此时按数组成员一一对应。
如果目标唯一，则多个方法应用到同一目标。

例：

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

提示：
如果数据源、目标元素、方法三者都为数组，则前两者的数组属性优先。
然后数据源的成员（可能也是一个数组）应用到方法数组上。即：若存在数组，则一一对应。


Next-Stage:

```js
$( rid )   // 单元素检索（Element）
$$( rid )  // 多元素检索（Collector）

// $.trigger
- fire( evn, data )

// 默认在流程元素上触发。
// 注：在 Method 后被替换为当前检索。
- blur()
- click()
- focus()
- pause()
- play()
- reset()
- scroll( x, y )
- select()
- load()
- submit()

// 定制事件。
- change()           // 主动触发表单控件的change事件
- clear()            // <select>取消选取，单选按钮取消选取
- tips( msg, time )  // 消息提示。注：计时器ID记录在消息容器上

- ...

// 方法调用。
// - 流程元素上方法的无条件调用。
// 注：fire()的触发调用需要先有注册绑定。
- call( method, ...rest )
```

> **注：**
> 该阶段的取值仅支持元素检索，避免可选的rid参数。



**By:**
对 `On` 采集的流程数据进行处理。系统有一个简单的默认处理集。
`By` 处理器同样可以串连，逗号分隔。

通常来说，在 `By` 阶段的定制扩展会比较多。注：因为 `On` 的种类和方式有限，`To` 的规格基本确定。

> **注：**
> 对于动画或特效，`On` 负责初始数据，`By` 则负责后续的连续行为。


**系统方法集**

- 数据处理类。



**类比：**

    On -> Input:Data
    By -> Doing:Process
    To -> Output:Show
