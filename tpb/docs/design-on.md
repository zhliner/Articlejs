## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可跟随 `flat()` 调用。

通常，栈内数据需要取出以作为后续方法操作的目标，取出的数据称为**当前条目**（多个条目会创建为一个 `Collector`），存放该条目的地方称为**暂存区**。暂存区是一次性使用，用过即空的逻辑。如果暂存区没有操作目标，系统会自动从栈顶取值（取出而非复制）。这一设计可以让操作目标的选取独立出来（更灵活），所有方法的返回值都会自动入栈（除非返回 `undefined`）。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器包含在括号内，如：`click(p[data-id="xxx"])`，选择器本身**不用**引号包围。如果事件名前置感叹号（`!`），表示单次绑定。

下面的方法中，首个实参都为 `evo`，它们是在方法调用时自动传入的，在模板中并不可见。因此这里没有包含它（在程序代码中存在）。

```js
evo: {
    event: {Event}                  // 原生事件对象（未侵入）
    origin: {Element}               // 事件起点元素（event.target）
    current: {Element}              // 触发事件的当前元素（event.currentTarget|matched）
    related: {Element|null}         // 事件相关联元素（event.relatedTarget）
    delegate: {Element|undefined}   // 委托绑定的元素（event.currentTarget）
    selector: {String|undefined}    // 委托匹配选择器（for match）
}
```

### 取栈规则

由暂存区取值函数执行（由方法自行调用），实参含义：

- `0` 若暂存区有值则返回值，否则返回 `undefined`。不取栈。
- `n` 若暂存区有值则返回值（通常是一个集合），否则取栈顶 `n` 项返回。


### 附：设计参考

- **实参null**：如果 `当前条目` 有效，通常表示取条目本身为实参替代。
- **自动取栈**：方法**明确需要**有操作目标时，暂存区为空会自动取栈顶条目。目标**可有可无**时，目标自身会成为一种可选项，此时不会自动取栈。


### 方法集

`tQuery|Collector` 中的方法仅限于取值（**注**：赋值被设计在 `To:method` 中）。


```js
// 普通取值
//===============================================

pba(): [String]
// PB参数取值。
// 目标：当前条目/栈顶1项。
// 注：
// 元素 data-pb 格式化属性值（-分隔）。

pbo(): [String]
// PB选项取值。
// 目标：当前条目/栈顶1项。
// 注：
// 元素 data-pb 格式化属性值（空格分隔）。

re( str, flag ): RegExp
// 构造正则表达式入栈。
// 传递 str 为 null 时取目标值。
// 目标：当前条目/栈顶1项。

date( ...v ): Date
// 构造日期对象入栈。
// 传递 v 为 null 时，取目标解包传递。
// 目标：当前条目/栈顶1项。

scam(): Object
// 修饰键是否按下封装（名称简化）。
// {alt, ctrl, shift, meta}
// 目标：针对事件对象，无当前条目要求。


// 类型转换
// 目标：当前条目/栈顶1项。
//===============================================

Arr( ext: Boolean ): Array
// 转换为数组。
// 如果 ext 为真，表示按类数组扩展目标为一个新数组（Array.from）。
// 否则只是简单的封装目标为一个单值数组（Array.of）。

Str( prefix?, suffix? ): String
// 转换为字符串。
// 可以选择性的添加前/后缀。

Bool(): Boolean
// 转换为布尔值（false|true）
// '', 0, false, null, undefined 为假，其它为真。

Int( radix ): Number
// 将字符串转为整数，即 parseInt()

Float(): Number
// 将字符串转为浮点数，即 parseFloat()



// tQuery|Collector 取值
//-----------------------------------------------
// 目标：当前条目/栈顶1项。
// 如果目标非Collector对象，视为tQuery方法（目标即首个实参）
//
attr( name ): String
prop( name ): String | Number | Boolean
css( name ): String

height(): Number
width(): Number
innerHeight(): Number
innerWidth(): Number
outerWidth(): Number
outerHeight(): Number
get( slr ): Element | null
find( slr, andOwn ): [Element] | null
next( slr ): Element | null
nextAll( slr ): [Element]
nextUntil( slr ): [Element]
prev( slr ): Element | null
prevAll( slr ): [Element]
prevUntil( slr ): [Element]
children( slr ): [Element] | Element
contents( idx, comment ): [Node] | Node
siblings( slr ): [Element]
parent(): Element | null
parents( slr ): [Element]
parentUntil( slr ): [Element]
closest( slr ): [Element] | null
offsetParent(): Element
clone( event, deep, eventdeep ): Element
scroll(): {top, left}
scrollTop(): Number
scrollLeft(): Number
hasClass( name ): Boolean
val(): Value | [Value] | null
html(): String          // 当前条目支持元素（集）或文本。
text(): String          // 当前条目支持元素（集）或HTML源码
css( name ): String
offset(): {top, left}
position(): {top, left}

// tQuery专有
//-----------------------------------------------
Element(): Element
Text(): Text
create(): DocumentFragment
svg(): Element
table(): Table
is(): Boolean
isXML(): Boolean
isArray(): Boolean
isNumeric(): Boolean
isFunction(): Boolean
isCollector(): Boolean
type(): String
contains(): Boolean
controls(): [Element]
serialize(): [Array2]
queryURL(): String
classes(): [String]

dataName(): String
selector(): String
tags(): String
objMap(): Object
kvsMap(): [Object2]
range(): [Number] | [String]
now(): Number | String

// Collector专有
//-----------------------------------------------

item( idx ): Value
eq( idx ): Collector
first( slr ): Collector
last( slr ): Collector



// 简单处理
// 目标：当前条目/栈顶1项。
// 注：只是目标自身的操作，无需By/To逻辑。
//===============================================

unwrap()
detach( slr )
remove( slr )
empty()
normalize()



/////////////////////////////////////////////////
// 顶层全局
// 可用于 On/By/To 段内。
/////////////////////////////////////////////////

$( rid: String | null ): Element
// 检索元素入栈：tQuery.get( down, up )
// 目标：当前条目。不自动取栈。
// rid:
// - String 以当前条目或事件当前元素为起点，上/下检索目标元素。
// - null   以当前条目为rid。
// 注：
// 当前条目充当2种角色，起点元素或rid替代。

$$( rid: String | Value | null ): Collector
// 检索元素集入栈：tQuery(...)
// 目标：当前条目。不自动取栈。
// rid:
// - String （同上）
// - null   （同上）
// - Value  非预设类型/值时，封装为Collector。
// 注：
// 当前条目充当2种角色：起点元素和rid替代（实参为null时）。
// 如果rid实参为null而当前条目非字符串时，当前条目值封装为Collector。

evo( name: String | Number ): Value
// 从当前evo对象上取值入栈。
// name: {
//     -1|'event'     evo.event
//      0|'origin'    evo.origin
//      1|'current'   evo.current
//      2|'delegate'  evo.delegate
//      3|'related'   evo.related
//      9|'selector'  evo.selector
// }
// 目标：从（隐藏的）首个实参上取值。无需当前条目。

ev( ...name: String | [String] ): Value | [Value]
// 从事件对象上取值入栈。
// name为事件对象内的成员名，多个实参取值会自动展开入栈。
// name: {
//      'key':      evo.event.key
//      'detail':   evo.event.detail
//      '...':      evo.event[...]
// }
// 目标：实参事件对象。无需当前条目。
// 注：
// 如果需要入栈一个值集，实参自身需要是一个数组。

nil(): void
// 一个空行为，占位。
// 既不从暂存区取值，也不向数据栈添加值。
// 通常在On无需取值时作为视觉友好使用。如：click|nil;

del( start, count ): void
// 删除栈任意位置段条目，位置指定支持负数从末尾算起。
// count 可选，默认删除到末尾。
// 注：移除的值不会进入暂存区。


// 控制类
//===============================================

pass( val?, name? ): void
// 通过性检测（是否中断执行流）。
// 目标：当前条目/栈顶项。
// val:
// - 有值则为相等（===）测试，否则为真值测试。
// name:
// - 进阶目标定位，取当前条目内name键的值用于对比。
// - 未定义时取当前条目整体对比，默认。
// 注记：
// name的进阶定位主要用于普通对象的成员值获取。
// 元素对象可通过attr()/prop()/css()等取值，因此name不支持首字符特殊指引。

avoid(): void
// 停止事件默认的行为。
// 即调用：event.preventDefault()
// 目标：当前条目。
// - 如果当前条目为空，无条件执行。
// - 否则为条件执行：真值执行，假值跳过。

stop( end ): void
// 停止事件冒泡，如果end为真，同时停止执行流。
// 即调用：stopPropagation()
// 目标：当前条目。
// - 如果当前条目为空，无条件执行。
// - 否则为条件执行：真值执行，假值跳过。

stopAll( end ): void
// 停止事件冒泡并阻止本事件其它处理器的执行。
// 如果end为真，同时停止当前执行流。
// 内部调用：event.stopImmediatePropagation()
// 目标：当前条目。
// - 如果当前条目为空，无条件执行。
// - 否则为条件执行：真值执行，假值跳过。


// 暂存区赋值
// 赋值为单值或Collector。
//===============================================

pop( n ): void
// 弹出栈顶 n 个条目，构建为一个Collector赋值。
// 无实参调用弹出末尾条目，作为单个值赋值。
// 即：pop() 和 pop(1) 的返回值不一样。
// pop(0) 不会弹出任何内容，但会创建一个空集赋值。
//
// 弹出：单值|Collector。

slice( begin, end ): void
// 复制数据栈某区段条目，构造为一个Collector赋值。
// 两个下标位置支持负数。
//
// 克隆：任意区段，Collector。

item( idx ): void
// 引用数据栈idx位置的单个值赋值到暂存区。
//
// 克隆：任意位置，单值。


// 下面的方法会移除栈内条目
//-----------------------------------------------
// 逻辑上这不是栈操作，但JavaScript中的数组提供了这种能力。
// 因此这里提供相关方法，应该不常用。

shift( n ): void
// 移除栈底 n 个条目，构建为一个Collector赋值。
// 无实参调用移除首个条目，作为单个值赋值。
// 即：shift() 和 shift(1) 返回值不同。
//
// 移除：单值|Collector。

splice( start, count ): void
// 移除数据栈某区段条目，构造为一个Collector赋值。
// start下标位置支持负数。
//
// 移除：任意区段，Collector。

pick( idx ): void
// 移除数据栈idx位置的单个值赋值到暂存区。
// 效果同：splice(idx, 1)[0]
//
// 移除：任意位置，单值。



/////////////////////////////////////////////////
// 运算全局（半全局）
// 仅可用于 On/By 段内。
/////////////////////////////////////////////////


// 简单取值（共享）
//===============================================

env( name: String, $val?: Value ): void | Value
// 全局环境设置或取值。
// $val 有值时为设置，未定义时为取值入栈。
// 设置时：
// 目标：当前条目。不自动取栈。
// 如果当前条目非空，$val字符串支持首字符特殊指引，null指当前条目自身。
// 否则 $val 视为字面量设置值。
// 否则任意的$val只是一个字面值。

put( ...$val: Value | [Value] ): Value | [Value]
// 简单赋值。
// 目标：当前条目。不自动取栈。
// 若目标非空，$val字符串支持首字符特殊指引，null指当前条目自身（无实际意义）。
// 否则 $val 视为字面量入栈。
// 注：
// 多个实参会自动展开入栈。如果要入栈数组，实参需为数组。
// 无实参调用入栈 undefined。

data( name, $val ): void | Value
// 关联数据存储/取出。
// 目标：当前条目/栈顶项。
// 在一个WeakMap实例中存储目标关联的数据项或取出数据项入栈。
// 数据本身是一个Map对象：
// - name 数据项名称（键）。
// - $val 数据项值。当前条目非空时，字符串支持首字符特殊指引，null指当前条目自身。
// 注：
// 如果当前条目为空，$val的任意值都为字面量。
// 当然，关联对象本身（作为WeakMap的键）是需要自动取栈的。


// 集合操作
// 取当前条目（集合）操作后自动入栈。
//===============================================

sort( unique, $comp ): Collector
// 数据栈排序。
// $comp为比较函数体，null表示采用默认规则。
// 参数名固定：(a, b)。
// $comp支持首字符（!）特殊指引，引用X函数库成员。

flat( depth = 1, all = false): Collector
// 数据栈扁平化，可指定最深层级。
// all为真表示整个数据栈，否则默认指上一次添加的集合。
// 实现：Arr.push( ...Arr.pop() )
// 如果最后一次入栈的不是集合，调用会出错。
// 注：
// 这是入栈模式由concat改为push的细粒度分解要求。

reverse(): Collector
// 集合成员序位反转。


// 集合筛选
//===============================================
// $fltr为过滤表达式或函数名，表达式可用参数名：（v, i, o）。
// 注：
// $fltr如果为表达式，执行结果自动返回（无需return）。
// $fltr支持首字符特殊指引，引用X函数库成员。

filter( $fltr, flat: Number = 0 ): [Value]
// 值集过滤，匹配者构建一个新集合入栈。
// flat为集合扁平化层级：
// 0    整体入栈，默认
// 1    一维展开
// n    n 维展开
// 注：取当前条目或栈顶项，它们应当是一个集合。

not( $fltr, flat: Number = 0 ): [Value]
// 值集排除。符合者被排除集合，剩余的创建为一个新集合入栈。
// flat 含义同上。

has( $fltr, flat: Number = 0 ): [Element]
// 子元素包含。
// 仅适用于元素集，普通值集无效。



// 简单运算
//===============================================

add(): Number     // (x, y) => x + y
sub(): Number     // (x, y) => x - y
mul(): Number     // (x, y) => x * y
div(): Number     // (x, y) => x / y
mod(): Number     // (x, y) => x % y
// 标准算术。
// 目标：当前条目/栈顶2项。

divmod( flat:Number ): [Number, Number]
// 除并求余。(x, y) => [x/y, x%y]
// 目标：当前条目/栈顶2项。
// flat：扁平化展开的层级，最多为1，0值不展开（默认）。

nneg( flat:Number ): Number | [Number]
// 数值取负（-x）。
// 目标：当前条目（不定成员数）/栈顶1项。
// flat 含义同上。
// 注：
// 当前条目为集合时返回一个Collector。

vnot( flat:Number ): Boolean | [Boolean]
// 逻辑取反（!x）。
// 目标：当前条目（不定成员数）/栈顶1项。
// flat 含义同上。
// 注：
// 当前条目为集合时返回一个Collector。

dup( flat:Number ): Value | [Value]
// 复制。
// 目标：当前条目（不定成员数）/栈顶1项。
// flat 含义同上。
// 注：
// 当前条目为集合时返回一个Collector。
// 自动取条目克隆时，返回值类型与源值类型相同。


// 比较&逻辑运算
//===============================================
// 下面的 $expr 为测试表达式或函数名，表达式可用参数名：（v, i, o）。
// $expr 支持首字符特殊指引，引用X函数库成员。

equal(): Boolean    // (x, y) => x === y
nequal(): Boolean   // (x, y) => x !== y
lt(): Boolean       // (x, y) => x < y
lte(): Boolean      // (x, y) => x <= y
gt(): Boolean       // (x, y) => x > y
gte(): Boolean      // (x, y) => x >= y
// 标准比较。
// 目标：当前条目/栈顶2项。


within( min, max ): Boolean
// 是否在 [min, max] 的范围内（包含边界值）。
// 目标：当前条目/栈顶项。

inSet( ...val ): Boolean
// 是否在集合内。
// 目标：当前条目/栈顶项。
// 实现：实参数组的简单存在性测试（Array.includes）。

isAnd( $expr ): Boolean
// 二者为真判断。
// $expr 可选，默认简单真值判断。
// 目标：当前条目/栈顶2项。

isOr( $expr ): Boolean
// 二者任一为真测试。
// $expr 可选，默认简单真值判断。
// 目标：当前条目/栈顶2项。

every( $expr ): Boolean
// 集合成员全为真测试。
// $expr 可选，默认简单真值判断。
// 目标：当前条目。不自动取栈。

some( n, $expr ): Boolean
// 集合成员至少 n 项为真测试。
// $expr 可选，默认简单真值判断。
// 目标：当前条目。不自动取栈。


// 判断执行。
//===============================================
// - vtrue(...) 简单的 if 逻辑。
// - vtrue(..., true)  模拟 else 逻辑，后跟 vtrue()。
// - vtrue(..., false) 模拟 else 逻辑，后跟 vfalse()。
// - vtrue(..., xxx) 可模拟 switch/case 逻辑，后跟进一步比较。

vtrue( $code, vback ): Value | vback
// 真值执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引（X函数库成员）。
// 目标：当前条目/栈顶1项。
// 注：
// vback 为跳过状态时回送入栈的值，可选。
// vback 在执行状态下无效，因为此时是代码的执行结果入栈。

vfalse( $ccode, vback ): Value | vback
// 假值执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引（X函数库成员）。
// 目标：当前条目/栈顶1项。
// 注：vback 参数含义同上。


// 其它
//===============================================

tpl( name: String | null, timeout: Number ): Element | false
// 从全局模板空间获取name模板。
// 目标：当前条目/栈顶1项。
// 如果设置 name 为 null 值，表示从目标获取模板名称。这在动态指定模板名时有用。
// 注：
// 模板请求可能是异步的，如果异步超时返回false入栈。
```
