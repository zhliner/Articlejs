## 目录结构

### 基础文件

下面两个文本是必需的。

- `main.js`  插件的主文件，在每次执行（Worker）时导入。
- `logo.png` 插件图标，在插件面板中显示（用户单击后即执行插件）。


### 模板&配置

- `index.html` 主模板文件。
- `maps.json`  模板配置文件，格式参考 `/templates/maps.json`（file-name: [tplnode-name]）。

如果插件不需要模板，则不需要这两个文件。
如果有模板，则配置文件 `maps.json` 是必须的（用于卸载时的清理依据），即便没有子模板。
