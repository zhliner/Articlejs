# Coolj-ED

**酷几**编辑器。便利的键盘操作，简洁规范的文章结构（可包含交互的能力）。

基于 Tpb/tQuery 框架。

使用&演示：<https://cooljed.github.io><br>
项目源码：<https://github.com/zhliner/articlejs>

------

## 安装

本编辑器完全基于 HTML&Javascript 编写，是一个在线应用，因此当你点击 <https://cooljed.github.io> 打开页面后即可使用。

同时，这也是一个 PWA（Progressive Web App） 应用，所以如果你想将编辑器安装在本地（以便于离线时也可用），用 Chrome 浏览器打开后，在浏览器地址栏右侧会出现一个浮动安装钮（PWA 程序通用，如下图），单击即可安装。

![浏览器安装PWA](upload/data/images/install-pwa.png)


## 更新

目前暂不支持自动更新。如果编辑器有了新版本，你可以手动更新：

单击你之前安装在桌面的编辑器图标打开程序，在窗口顶部右侧的**竖三点图标**上单击展开弹出窗，点击 *卸载Coolj Editor WebApp...* 条目。如下图：

![浏览器卸载PWA](upload/data/images/uninstall-pwa.png)

在 Chrome 浏览器中再次打开 <https://cooljed.github.io> 网址（可能需要刷新一下），然后重新安装即可。**注意**：如果你没有卸载本地的App，浏览器地址栏上将不会出现安装钮。


## 反馈

编辑器的项目源码在 [这里](https://github.com/zhliner/articlejs)，如果您在使用中遇到了任何问题，可以在项目的 [Issues](https://github.com/zhliner/articlejs/issues) 页面提交问题。

目前这只是一个个人项目，我会尽可能尽快地回答您的问题！


## 扩展开发

如果您是一位 Web App 开发者，想开发自己的编辑器插件，可以下载源码并参考编辑器根目录下 plugins 内的 `coolmd` 插件来实现。

本编辑器的底层由两个基本库 `Tpb/tQuery` 支持，其中 `tQuery` 类似 jQuery 但使用 ES6 新语法编写且更轻量（两者不兼容），而 `Tpb` 是基于 tQuery 之上的一个专注于 UI 交互的库（模板驱动）。

如果想要修改或扩展本编辑器，您可能需要了解这两个库：

- **tQuery**: <https://github.com/zhliner/tQuery>
- **Tpb**: <https://github.com/zhliner/Tpb>
