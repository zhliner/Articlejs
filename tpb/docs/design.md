## Tpb 详细设计

> **注**：tpb: Template Presentational Behavior


## 注记：

### OnByTo 逻辑重构

> 仔细划分逻辑区域，简化PB集。

**On/To**: DOM/界面逻辑。
**By**: App/程序逻辑，可选。注：可以被 `On-To` 跳过。


**On:**
关联事件，求取各种值，值进入流程向后传递。支持事件触发。
> {OnPB}

**To:**
从流程取值对目标赋值，展现结果（如样式）。支持后续联动事件触发和元素状态PB（如：focus/select等）。
如果目标为多个：源数据为数组时，分别赋值，否则为复制赋值。
> {ToPB}

to = "Query | Method | Next-Stage"

Query:

    - xxxx 单元素检索，$.get(): Element
    - [xx] 多元素检索，$(...): Collector

    扩展
    - [xx]:(beg, end) 多元素检索并过滤，beg为起点下标，end为终点下标（不包含），可选。
    - [xx]:[x,y,z...] 多元素检索并过滤，[...] 为目标位置数组。
    - [xx]:{function} 多元素检索并过滤，{} 内为过滤函数，参数：(Element, index)。


Method:

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

    // 下面的方法中流程数据为目标，当前检索的值为数据。
    - beforeTo
    - afterTo
    - prependTo
    - appendTo
    - replaceTo
    - fillTo

    [attr]
    - #[name]
    // 例：[3@li]|#style|fire('...')
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


Next-Stage:

    - fire
    - goto ?
    - trigger

    // 默认在流程元素上触发。
    // 注：在 Method 后被替换为当前检索。
    - focus
    - blur
    - select
    - click
    - dblclick
    - submit
    - reset
    - change
    - contextmenu
    - scroll
    - scrollLeft
    - scrollTop
    - ...


**By:**
对 `On` 采集的流程数据进行处理。系统有一个简单的默认处理集。
`By` 处理器同样可以串连，逗号分隔。

通常来说，在 `By` 阶段的定制扩展会比较多。注：因为 `On` 的种类和方式有限，`To` 的规格基本确定。



**类比：**
    On -> Input:Data
    By -> Doing:Process
    To -> Output:Show
