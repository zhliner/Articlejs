## Tpb: On

关联事件，求取各种值，值进入流程数据栈向后传递。数据入栈为 `Array.push` 方式，如果数组成员需要展开，可跟随 `flat()` 调用。

通常，栈内数据需要取出以作为后续方法操作的目标，取出的数据被称为**当前条目**，存放该条目的地方称为**暂存区**。暂存区是一次性使用逻辑，用过即空。如果暂存区没有操作目标，系统会自动从栈顶取值（取出而不是引用），除非明确禁止这样做（取值数量为 `-1`）。这一设计可以让操作目标的选取独立出来，更灵活也让方法的参数更少。所有的方法的返回值（除了 `undefined`）都会自动入栈。

事件名可以用空格分隔多个名称同时指定，它们被绑定到同一个行为链。事件名可以是委托形式，选择器包含在括号内，如：`click(p[data-id="xxx"])`，选择器本身**不用**引号包围。

注意：下面的方法中，首个实参必为 `evo`，它们是方法调用时自动传入的，但在模板中不可见。因此这里的定义不包含它（在程序代码中包含）。

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


### 方法集

`tQuery|Collector` 中的方法仅限于取值（**注**：赋值被设计在 `To:method` 中）。


```js
// 定制取值
//===============================================

pba( rid ): [String]
// PB参数取值。
// 注：元素 data-pb 格式化属性值（-分隔）。

pbo( rid ): [String]
// PB选项取值。
// 注：元素 data-pb 格式化属性值（空格分隔）。


// 数据创建
//===============================================

re( str, flag ): RegExp     // 构造正则表达式
date( v1, ...rest ): Date   // 构造日期/时间对象
scam( ev ): Object          // 修饰键状态封装（Alt/Ctrl/Shift/Meta）


// tQuery|Collector 取值
//-----------------------------------------------
// 如果目标非Collector对象，视为tQuery方法，目标为首个实参
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
// 操作目标就是当前条目自身，无需By/To逻辑。
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

$( rid: String | Number | null ): Element
// 取元素入栈。检索：tQuery.get( down, up )
// rid:
// - String 相对ID，以当前元素为参考，上/下检索目标元素。
// - null   取当前条目为rid。可能为字符串或数值。
// - Number 取事件相关元素：{
// -     0  evo.origin 触发事件的起始元素
// -     1  evo.current 触发处理器调用的元素
// -     2  evo.delegate 绑定委托的元素
// - }

$$( rid: String | Number | Value | null ): Collector
// 取集合入栈。检索：tQuery(...)
// rid:
// - ...    含义同上。
// - Value  非预设类型，封装为Collector，通常从当前条目取值时出现。

evo( name: String ): Value
// 从当前evo对象上取值（事件相关）入栈。
// name: {
//      'event'     evo.event
//      'origin'    evo.origin
//      'current'   evo.current
//      'related'   evo.related
//      'delegate'  evo.delegate
//      'selector'  evo.selector
//
//      'detail':   evo.event.detail
//      '...':      evo.event[...]
// }

env( name: String, $val?: String | Value | null ): void
// 全局环境设置或取值入栈。
// $val 有值时为设置，未定义时为取值入栈。
// $val:
// - String 字符串值，支持首字符特殊指引（对当前条目）。
// - Value  其它普通值。
// - null   取当前条目自身为设置值（可能为undefined）。
// 注意：
// 暂存区无值时不自动取栈条目，特殊的$val字符串视为字面量。
// 即：自动取条目数为0。
//
// 提示：
// 暂存区无值时，null指定会让name设置为undefined。
// 如果需要设置name为null值本身，可前置 'get(null), pop'。

pass( val?: Value, $name?: String ): void
// 当前条目通过性检测，否则中断执行流。
// val:
//      有值则为相等（===）测试，否则为真值测试。
// $name:
//      定位进阶目标，取目标的值用于对比，支持首字符特殊指引。
//      未定义时取当前条目整体对比，默认。

nil(): void
// 一个空行为，占位。
// 既不从暂存区取值，也不向数据栈添加值。
// 通常在On无需取值时作为视觉友好使用。如：click|nil;

put( val ): Value
// 简单赋值入栈。
// 注：null/undefined 有效。

data( name, $val ): void
// 关联当前条目存储/取出数据。
// name为数据$val的索引键名，$val字符串支持首字符特殊指引。
// 注：
// 内部采用WeakMap存储，当前条目应当是一个对象。

del( start, count ): void
// 删除栈任意位置段条目，位置指定支持负数从末尾算起。
// count 可选，默认删除到末尾。
// 注：移除的值不会进入暂存区。



/////////////////////////////////////////////////
// 运算全局（半全局）
// 仅可用于 On/By 段内。
/////////////////////////////////////////////////


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
// $fltr为过滤器代码，回调参数名固定：（v, i, o）。
// 注：
// $fltr如果为代码，执行结果自动返回，无需return。
// $fltr支持首字符特殊指引，引用X函数库成员（此时$fltr为名称）。

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



// 类型转换
//===============================================

Arr( op ): Array                // 转换为数组
Str( prefix, suffix ): String   // 转换为字符串
Bool(): Boolean                 // 转换为布尔值（false|true）
Int( str, radix ): Number       // 将字符串转为整数。即 parseInt()
Float( str ): Number            // 将字符串转为浮点数。即 parseFloat()


// 简单运算
//===============================================

add(): Number     // 2条目：(x, y) => x + y
sub(): Number     // 2条目：(x, y) => x - y
mul(): Number     // 2条目：(x, y) => x * y
div(): Number     // 2条目：(x, y) => x / y
mod(): Number     // 2条目：(x, y) => x % y

divmod( flat:Number ): [Number, Number]
// 除并求余。
// 2条目：(x, y) => [x/y, x%y]
// flat 表示扁平化展开的层级，应当为1，0值不展开（默认）。

negate( flat:Number ): Number | [Number]
// 取负（-x）。
// 不定条目数，自动取1。各条目取负后入栈。
// 当前条目为Collector时返回一个数组。
// flat 含义同上。

not( flat:Number ): Boolean | [Boolean]
// 取反（!x）。
// 不定条目数，自动取1。各条目取反后入栈。
// 当前条目为Collector时返回一个数组。
// flat 含义同上。

dup( flat:Number ): Value | [Value]
// 复制。
// 不定条目数，自动取1。克隆后入栈。
// 当前条目为Collector时返回一个Collector。
// flat 含义同上。
// 注：
// 自动取条目克隆时，返回值类型与源值类型相同。


// 比较&逻辑运算
//===============================================

equal(): Boolean    // 2条目：(x, y) => x === y
nequal(): Boolean   // 2条目：(x, y) => x !== y
lt(): Boolean       // 2条目：(x, y) => x < y
lte(): Boolean      // 2条目：(x, y) => x <= y
gt(): Boolean       // 2条目：(x, y) => x > y
gte(): Boolean      // 2条目：(x, y) => x >= y


within( min, max ): Boolean
// 1条目：val in [min, max]

isAnd( $code ): Boolean
// 2条目为真测试，结果入栈。
// $code 测试代码或函数索引，可选。默认简单真值判断。

isOr( $code ): Boolean
// 2条目任一为真测试，结果入栈。
// $code 测试代码或函数索引，可选。默认简单真值判断。

every( $code ): Boolean
// 集合成员全为真测试，结果入栈。
// 不定条目数，自动取0。
// $code 测试代码或函数索引，可选。默认简单真值判断。
// 注：当前条目未定义时出错。

some( n, $code ): Boolean
// 集合成员至少 n 项为真测试，结果入栈。
// 不定条目数，自动取0。
// $code 测试代码或函数索引，可选。默认简单真值判断。
// 注：当前条目未定义时出错。


// 判断执行。
//===============================================
// - vtrue(...) 简单的 if 逻辑。
// - vtrue(..., true)  模拟 else 逻辑，后跟 vtrue()。
// - vtrue(..., false) 模拟 else 逻辑，后跟 vfalse()。
// - vtrue(..., xxx) 可模拟 switch/case 逻辑，后跟比较类方法。

vtrue( $code, vback ): Value | vback
// 当前条目为真时执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引。
// 注：
// vback 为跳过状态时回送入栈的值，可选。
// 执行状态时回送值无效，因为此时是代码的执行结果入栈。

vfalse( $ccode, vback ): Value | vback
// 当前条目为假时执行，否则跳过。
// $code 为函数体代码（无实参），支持首字符特殊指引。
// vback 参数含义同上。


// 其它
//===============================================

tpl( name ): void
// 创建命名模板。
// 将当前条目命名为name模板添加到全局模板空间（供By检索使用）。
// 通常用于可原地更新的元素（集）。
// 注：
// 用户需要知道哪些元素是由模板创建（包含渲染配置），否则没有效果。
// 这一方法可能在By阶段即时组合使用，也可能由On阶段收集。
```
