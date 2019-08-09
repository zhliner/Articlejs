## Tpb: On

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



// 数据集自身操作
///////////////////////

// 状态设置

concat()
// 设置后续数据为连接模式，支持值和值数组（一维）展开。
// 如果流程数据不是数组，会自动转为数组。
push()
// 设置后续数据为简单的追加模式，值数组不展开。
// 如果流程数据不是数组，会自动转为数组。
replace()
// 设置后续数据为替换模式。这是默认模式。
// 注：上面三个方法用于流程数据操作模式设置。


// 成员删除/插入标记

splice( start, count, keep = false )
// 集合成员移除，位置指定支持负数从末尾算起。
// 不支持插入新成员，但支持插入位置临时保持（一次），后续数据插入该位置（忽略上面3种模式）。
pop()
// 删除集合最后一个成员。同 splice(-1, 1)
shift()
// 删除集合第一个成员。同 splice(0, 1)


// 子集生成

slice( begin, end )
// 集合切片，子集进入流程数据遵循上面3种模式指引。
filter( test: Function )
// 集合过滤，匹配者构建一个新集合。替换原集合。
map( process: Function )
// 集合映射，返回值构建一个新集合。替换原集合。


// 原地操作（强制替换）

sort( comp: Function )
// 流程数据集原地排序。
flat( depth = 1)
// 集合扁平化，可指定扁平化的层级深度。



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
