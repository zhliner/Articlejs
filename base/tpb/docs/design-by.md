## Tpb: By

对 `On` 采集的流程数据进行处理。处理器同样可以串连（逗号分隔）使用。默认提供一个名称为 `X` 的函数库供外部自由扩展。

> **附注：**
> 如动画或特效，`On` 负责初始数据收集，`By` 则负责后续迭代循环的画面行为。


### 格式

```html
<ul by="" >
```

**说明：**

- 各指令之间用逗号（`,`）分隔，逗号前后的空格可选。
- 支持首字符问号（`?`）引用X扩展函数库成员。
- 也可以直接引用X扩展库（小写 `x`），内部的分组可用句点（`.`）表达。
- 无实参传递的方法可省略括号。


### 方法集

当前条目为操作的目标对象。

```js
pull()
// 数据从远端拉取。
// 暂存区的流程数据会作为查询串上传。
// 注：仅支持 GET 方法。


//
// 事件操作。
// 目标：当前条目/栈顶1项（元素）。
/////////////////////////////////////////////////

on( evn: String, slr, $expr ): void
one( evn: String, slr, $expr ): void
off( evn: String, slr, $expr ): void
// 事件绑定/解绑。
// $expr JS表达式，支持首字符特殊指引。
// 表达式会被封装为事件处理器函数，参数名：(ev, elo)。


//
// 判断调用。
// 简单的 if 逻辑。
/////////////////////////////////////////////////

xtrue( meth, ...rest ): Value
// 真值执行，否则跳过。
// 目标：当前条目/栈顶1项。
// meth 为X函数库方法名。
// rest 为方法的实参序列。

xfalse( meth, ...rest ): Value
// 假值执行，否则跳过。
// 目标：当前条目/栈顶1项。
// meth/rest 说明同上。


//
// 集合操作。
// $expr为函数体表达式，参数名固定：（v, i, o）。
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////
// 说明：
// $expr的执行结果自动返回，无需return语句。
// $expr支持首字符问号引用X函数库，此时问号后面为成员名称。

each( $expr ): void
// 迭代执行。
// 取当前条目/栈顶项迭代处理。
// 目标应该是一个集合，没有返回值入栈。
// 回调函数内返回false会中断迭代。

map( $expr, flat: Number = 0 ): Collector
// 值集映射。
// 目标应当是一个集合。
// 返回值构建一个新集合入栈，返回的null/undefined会被忽略。

sort( unique, $comp ): Collector
// 集合排序。
// $comp为比较函数体，null表示采用默认规则。
// 参数名固定：(a, b)。
// $comp支持首字符（?）引用X函数库成员。


//
// 元素表现（x.Eff）
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////

hide( sure?:Boolean )       // 元素隐藏，对应CSS visibility:hidden。
lose( sure?:Boolean )       // 元素显示丢失，对应CSS display:none。
disable( sure?:Boolean )    // 元素失活，模拟表单控件的 disabled 外观（灰化）。
fold( sure?:Boolean )       // 元素折叠，除:first-child之外的子元素 display:none。
truncate( sure?:Boolean )   // 截断，即后续兄弟元素 display:none
// sure 为假表示反向逻辑。
// sure 可选，默认值为 true。


//
// 自身节点操作（x.Node）
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////

wrap( box:String ): Element | Collector
wrapinner( box:String ): Element | Collector
wrapall( box:String ): Element | Collector
// 节点封装。
// 与To中的同名方法不同，这里仅支持字符串模板实参。

remove( slr?:String|Boolean, back?:Boolean ): void | data
removeSiblings( slr?:String|Boolean, back?:Boolean ): void | data
empty( back?:Boolean ): void | data
unwrap( back?:Boolean ): void | data
normalize( depth?:Number ): void
// 元素自身操作。
// slr: 选择器或入栈指示。
// back: 被移除的节点是否入栈。
// data: 被移除的节点/集或展开的节点集。
// 注：不列入To段，因为不是第三方目标。

render( data? ): Element
// 模板节点渲染。
// 对tpl指令获取的元素节点用数据集进行渲染。
// 目标：Element
// 展开：[Element, data:Value]
// 注：
// 模板实参data是可选的，如果为空则当前条目应当为展开封装。



//
// X库调用（示意）
/////////////////////////////////////////////////

x.[meth]( ...rest ): Value
// 调用外部扩展函数库（X）成员执行。
// 目标：当前条目，不自动取栈。
// 目标（如果有）为方法的首个实参。
```
