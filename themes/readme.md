# 编辑器主题目录

## 主题命名

建议采用单词或简单词组，单词数量不超过 `3` 个。各单词间用 `-` 符号连接。如：`Dark-less`。


## 主题制作

请参考示例主题内的样式制作。

`style.css` 为主题的主样式文件，`icons.css` 为图标的定位样式文件。辅助图片和图标的制作可参考 `images/` 下的图片文件。


### 文件名约定

```
style.css   样式主文件
icons.css   图标定位文件
images/*.*  图片/图标等
```


### 定位标识

顶层：
```
#outline        大纲视图面板
#lineLeft       间隔线（可拖动）
#editor         编辑器主区域（包含：模态框、工具栏、内容区、主面板、状态栏）
#lineRight      间隔线（可拖动）
#help           帮助面板

.___Panel       面板根容器
.___Content     编辑器内容区根容器（包含：内容滚动框、焦点元素路径条）
.content        正文内容区（<main>）
```

面板：
```
___Panel.Tools  工具栏
___Panel.Slave  功能区（主面板）
___Panel.Status 状态栏
___Panel.Modal  模态框
```

功能版：
```
___Panel > .Inputs  内容（录入）
___Panel > .Styles  样式
___Panel > .Attrs   特性
___Panel > .Source  源码
___Panel > .Script  脚本
___Panel > .Minied  微编辑
```


### 小类名（部分）

- `_char`       单字符录入条。
- `_nums`       数值录入条。
- `_chars`      几个字符的录入条。
- `_words`      多个字段的录入条（如 margin 的复合样式值）。
- `_phrase`     短文本行，用于与100%宽度的输入条相区别。
- `_press`      图标按下（选中）状态。
- `_list`       列表封装。
- `_note`       提示说明区。
- `_page`       普通模态页表单。
- `_plugins`    插件模态页表单。
- `_small`      单行模态框表单。
- `_message`    消息模态框表单。
- `_script`     脚本历史模态页表单。
- `_submit`     确定按钮封装。
- `_minibar`    迷你选单条（如边距样式中 margin/padding 切换栏）
