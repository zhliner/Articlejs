## Tpb: By

对 `On` 采集的流程数据进行处理，默认提供一个名称为 `X` 的函数库供外部自由扩展。

> **附注：**
> 如动画或特效，`On` 负责初始数据收集，`By` 则负责后续迭代循环的画面行为。


### 格式

```html
<ul by="" >
```

**说明：**

- 各指令之间用空格（`_`）分隔，多个连续空格被忽略。
- 模板中引用X扩展库为小写的 `x`，内部嵌套的子域用句点（`.`）分隔递进引用。
- 无实参传递的方法可省略括号。


### 方法集（基础）

当前条目（目标）为指令操作的对象。仅包含极少量的几个顶级基础指令。

```js
pull( meth?:String ): Promise<json>
// 数据从远端拉取。
// 目标：当前条目，可选。
// 暂存区的流程数据会作为查询串上传。
// 注：仅支持 GET 方法。

xobj( path ): Value
// 引入X库成员。
// 目标：当前条目，可选。
// 特权：是，灵活取栈。
// 如果实参为空则从数据栈取值。

//
// 判断调用。
// 简单的 if 逻辑。
/////////////////////////////////////////////////

xtrue( meth:String, ...rest:Value ): Value
// 真值执行，否则跳过。
// 目标：当前条目/栈顶1项。
// meth 为X函数库方法名。
// rest 为方法的实参序列。

xfalse( meth:String, ...rest:Value ): Value
// 假值执行，否则跳过。
// 目标：当前条目/栈顶1项。
// meth/rest 说明同上。
```


### 方法集（x.Eff）

```js
//
// 元素表现。
// 目标：当前条目/栈顶1项。
/////////////////////////////////////////////////

hide( sure?:Boolean )       // 元素隐藏，对应CSS visibility:hidden。
lose( sure?:Boolean )       // 元素显示丢失，对应CSS display:none。
disable( sure?:Boolean )    // 元素失活，模拟表单控件的 disabled 外观（灰化）。
fold( sure?:Boolean )       // 元素折叠，除:first-child之外的子元素 display:none。
truncate( sure?:Boolean )   // 截断，即后续兄弟元素 display:none
// sure 为假表示反向逻辑。
// sure 可选，默认值为 true。
```


### 方法集（x.Node）

```js
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
normalize( depth?:Number|Boolean, back?:Boolean ): void | data
empty( back?:Boolean ): void | data
unwrap( back?:Boolean ): void | data
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
```


### X库调用

用户程序采用 `X.extend()` 扩展X库。

在最终指令的容器对象上，依然可以用前置双下划线定义取栈条目数，以及使用 `__name_x` 格式声明 `name` 方法的特权。

```js
x.[meth]( ...rest ): Value
// 调用X扩展库。
// 支持句点（.）分隔多级嵌套子域。
```
