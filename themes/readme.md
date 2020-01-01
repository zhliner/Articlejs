# 编辑器主题目录

## 主题命名

建议采用单词或简单词组，单词数量不超过 `3` 个。各单词间用 `-` 符号连接。如：`Cyan-sea`、`Dark-less` 等。


## 主题制作

### 文件名约定

```
style.css   样式主文件
icons.css   图标定位文件
images/     图片/图标等
```


### 定位标识

顶层：
```
#editor     编辑器总根
___Panel    面板容器
___Content  编辑器内容区
.content    正文内容（通用）
```

面板根：
```
___Panel.Tools  工具栏
___Panel.Slave  主面板
___Panel.Status 状态栏
___Panel.Modal  模态框
___Panel.Plugs  插件区
```

功能版：
```
___Panel .Inputs    录入
___Panel .Styles    样式
___Panel .Attrs     特性
___Panel .Source    源码
___Panel .Script    脚本
___Panel .Minied    微编辑
```


### 类名清单

- `_char` 单个字符的录入框，字符居中。
- `_chars` 几个字符宽度的录入框。
- `_length` 数字和单位的混合录入框。
- `_textrow` 文本行，主要用于内联单元文本输入。
- `_attr` 添加/移除特性框。
- `_del` 特性操作按钮（移除状态）。
- `_press` 图标按下（选中）状态。
- `_list` 列表封装。
- `_page` 模态页封装
- `_xbox` 模态框节点容器。
- `_note` 提示说明区。
- `_small` 单行模态框表单。
- `_massage` 消息模态框表单。
- `_shlist` 脚本历史模态页表单。
- `_info` 脚本测试模态页。
- `_submit` 确定按钮封装。
- `_where` 内容插入位置选择区。
