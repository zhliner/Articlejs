# 发布流程

在线版编辑器包含的是压缩后的文件。


## 基础库

两个基础库文件（`jQuery`, `Tpb`）在其自身目录内执行压缩打包即可：

- `rollup -cm` 执行默认的压缩打包，包含 keymap 映射文件。文件被自动输出到 `articlejs` 内对应的子目录内。
- `rollup -c .\rollup_cooljed.config.js` 执行压缩打包，文件被输出到 `cooljed` 内对应的子目录内。发布版无需包含 keymap 文件映射。


### `tQuery`

1. `tQuery/` 核心库本身。
2. `tQuery/plugins/` 插件源码打包。


### `Tpb`

1. `Tpb/` 核心库本身。
2. `Tpb/tools/` 基础工具打包。

另外两个基础文件需要**拷贝**到目标项目内对应位置：

1. `config.js` Tpb库基础配置。
2. `default.css` Tpb UI 效果样式定义。


## 应用项目

### 核心主源码

主程序源码同样执行压缩打包，在 `articlejs/base/` 目录内执行 `rollup -c` 命令，这会将压缩后的源码自动输出到发布版的 `cooljed/base/main.js`。


### 关联源码

部分源码不应当被压缩，它们是一些可编辑的配置文件，需要允许用户修改（如果必要）。

部分“外部”性的源码也没有使用压缩打包，这是一种简单化处理，同时也提供了一些灵活性。如代码着色解析部分 `base/hlparse/`、项目内的外部插件部分 `plugins/`。它们需要被原样完整拷贝到目标位置。

除了可压缩打包的JS源码外，应用项目还包括一些非JS文件，比如模板（`*.html`）、样式（`*.css`）和媒体文件等。它们也需要原样拷贝到发布版的相应位置。


### 原样拷贝文件清单

- config.js
- editor.js
- favicon.ico
- index.html
- index.js
- README.md
- release.json
- styles.css

- base/hlparse/...
- base/shortcuts.js
- base/scripter.js

- docs/article.html
- docs/intro.html
- docs/manual.html
- docs/内容结构.md
- docs/简介.md
- docs/编辑操作.md
- docs/base.css
- docs/style2pack.zip （请在拷贝前更新打包）
- docs/theme2pack.zip （请在拷贝前更新打包）

- icons/...
- plugins/...
- styles/...
- templates/...
- themes/...
- upload/data/...


### 附：定制化文件（不应拷贝）

- `register.js` 注册 serviceWorker 的定制化脚本（注册文件不同）。
- `base/tpb/user.js` 用户安装根目录配置（根目录不同）。
- `coolj.webmanifest` 安装根目录可能不同。
- `*-sw.js` serviceWorker 实现专用文件，缓存文件清单和版本等信息不同。
