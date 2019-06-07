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
> {ToPB}

to = "Query | Method | Next-Stage"

Query:

    - xxxx 单元素检索，$.get(): Element
    - [xx] 多元素检索，$(...): Collector


Method:

    [node]
    - before
    - after
    - begin
    - prepend
    - end
    - append
    - fill
    - replace

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


**By:**
对 `On` 采集的流程数据进行处理。系统有一个简单的默认处理集。
`By` 处理器同样可以串连，逗号分隔。

通常来说，在 `By` 阶段的定制扩展会比较多。注：因为 `On` 的种类和方式有限，`To` 的规格基本确定。



**类比：**
    On -> Input:Data
    By -> Doing:Process
    To -> Output:Show
