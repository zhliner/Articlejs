# 小技巧

## 命令行

命令行的普通命令模式（:）支持一个通用指令 `eval`，它不是浏览器环境下JS自身的eval函数，而是一个 `new Function()` 封装。可以有宽泛的用途。

- 输入框中有各种默认提示，如果你已经清楚并觉得这些提示碍眼，可以在该模式下执行：`eval $('textarea').removeAttr('placeholder')` 即可。
- 输入框中的背景是固定行高的虚线辅助，会随文本一起滚动（CSS: `background-attachment:local;`），但Firefox浏览器并不支持。如果你使用的正好是Firefox，可以执行一段输入框滚动绑定的OBT构建（`Tpb.build(el, conf)`，其中 `el` 是目标文本框元素）。OBT配置可以是：{ on: "scroll|evo(3) scrollTop str('-', 'px')", to: "|%backgroundPositionY" }。
- 如果你想将功能面板设置到一个准确的高度（而不是用 `Atl+鼠标` 拖动），执行 `eval $('#main-slave').height(...)` 或 `eval $('#main-slave').css('height', ...)`。



## 模板节点提取

在控制台执行如下命令，提取模板节点获取配置文件。

```js
namedTpls([
    'help.html',
    'inputs.html',
    'main.html',
    'options.html',
    'panel.html',
    'properties.html',
    'styles.html',
], true)
```