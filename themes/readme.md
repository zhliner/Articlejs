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


### 类名封装

顶级：
```
___Editor       编辑器总根
___Panel        面板容器
___Content      内容区
___Main         正文区（内容样式）
```

面板根级：
```
___Panel.Top    顶栏区
___Panel.Head   标题栏区
___Panel.Annex  动态界面
___Panel.Misc   功能区
___Panel.Status 状态栏
___Panel.Modal  模态框
```

区域级：
```
___Panel .Plugs     插件栏
___Panel .Inputs    功能区-录入封装
___Panel .Layout    功能区-版式封装
```

功能专区：
```
___Panel .Section   录入-章节
___Panel .Paragraph 录入-段落
___Panel .List      录入-列表
___Panel .Table     录入-表格
___Panel .Block     录入-区块
___Panel .Other     录入-其它
___Panel .Style     版式-样式
___Panel .Effect    版式-特效
___Panel .Color     版式-颜色
___Panel .Script    版式-脚本
```
