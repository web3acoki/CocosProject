# TON Connect Manifest 文件配置说明

## 1. 文件内容

`tonconnect-manifest.json` 文件应该包含以下内容：

```json
{
  "url": "https://game.xdiving.io/",
  "name": "Diving Game",
  "iconUrl": "https://game.xdiving.io/icon.png"
}
```

### 字段说明：

- **url** (必需): 你的应用的完整 URL，必须以 `https://` 开头，必须以 `/` 结尾
- **name** (必需): 应用的显示名称
- **iconUrl** (可选但推荐): 应用的图标 URL，建议 256x256 像素

### 完整示例：

```json
{
  "url": "https://game.xdiving.io/",
  "name": "Diving Game",
  "iconUrl": "https://game.xdiving.io/icon.png",
  "termsOfServiceUrl": "https://game.xdiving.io/terms",
  "privacyPolicyUrl": "https://game.xdiving.io/privacy"
}
```

## 2. 服务器根目录位置

### 什么是"服务器根目录"？

服务器根目录是指你的网站部署后，用户访问 `https://game.xdiving.io/` 时对应的目录。

### 对于 Cocos Creator 项目：

1. **构建输出目录**：
   - 在 Cocos Creator 中构建 Web Mobile 版本后
   - 构建输出通常在：`项目根目录/XDiving/web-mobile/` 或 `项目根目录/build/web-mobile/`
   - 这个目录就是"服务器根目录"

2. **文件位置**：
   ```
   服务器根目录/
   ├── index.html
   ├── tonconnect-manifest.json  ← 文件必须放在这里
   ├── src/
   ├── assets/
   └── ...
   ```

3. **访问 URL**：
   - 文件必须可以通过 `https://game.xdiving.io/tonconnect-manifest.json` 访问
   - 也就是说，文件必须直接在根目录，不能在任何子目录中

## 3. 部署步骤

### 方法1：自动复制（推荐）

1. **构建项目**：
   - 在 Cocos Creator 中构建 Web Mobile 版本
   - 构建输出到：`项目根目录/XDiving/web-mobile/`

2. **自动复制脚本**：
   - 已经配置了 `build-templates/web-mobile/post-build.js`
   - 构建完成后会自动复制 manifest 文件

3. **手动复制（如果自动复制失败）**：
   ```bash
   # Windows
   copy assets\Scripts\Test\tonconnect-manifest.json XDiving\web-mobile\tonconnect-manifest.json
   
   # Linux/Mac
   cp assets/Scripts/Test/tonconnect-manifest.json XDiving/web-mobile/tonconnect-manifest.json
   ```

### 方法2：服务器配置

如果你使用 Nginx 或其他 Web 服务器：

1. **确保文件在根目录**：
   ```
   /var/www/game.xdiving.io/
   ├── index.html
   ├── tonconnect-manifest.json  ← 必须在这里
   └── ...
   ```

2. **验证访问**：
   - 在浏览器中访问：`https://game.xdiving.io/tonconnect-manifest.json`
   - 应该能看到 JSON 内容，而不是 404 错误

## 4. 验证配置

### 检查清单：

- [ ] manifest 文件在服务器根目录
- [ ] 可以通过 `https://你的域名/tonconnect-manifest.json` 访问
- [ ] 文件内容格式正确（有效的 JSON）
- [ ] `url` 字段与你的实际域名匹配
- [ ] `url` 字段以 `https://` 开头，以 `/` 结尾

### 测试方法：

1. **浏览器测试**：
   ```
   访问：https://game.xdiving.io/tonconnect-manifest.json
   应该看到 JSON 内容
   ```

2. **curl 测试**：
   ```bash
   curl https://game.xdiving.io/tonconnect-manifest.json
   ```

3. **代码中测试**：
   - 在浏览器控制台运行：
   ```javascript
   fetch('https://game.xdiving.io/tonconnect-manifest.json')
     .then(r => r.json())
     .then(console.log)
   ```

## 5. 常见问题

### Q: 文件应该放在哪里？

**A**: 放在构建输出目录的根目录，与 `index.html` 同级。

### Q: 为什么访问不到文件？

**A**: 检查：
1. 文件是否真的在服务器根目录
2. 服务器是否正确配置了静态文件服务
3. 文件权限是否正确

### Q: url 字段应该填什么？

**A**: 
- 必须是完整的 URL，包括 `https://`
- 必须以 `/` 结尾
- 必须与你的实际部署域名一致

### Q: 本地开发怎么办？

**A**: 
- 本地开发时，使用 `http://localhost:端口/tonconnect-manifest.json`
- 但 Telegram Web App 需要 HTTPS，所以本地测试可能无法完全工作
- 建议在测试服务器上测试

## 6. 当前项目配置

根据你的代码，当前配置：

- **manifest URL**: `https://game.xdiving.io/tonconnect-manifest.json`
- **源文件位置**: `assets/Scripts/Test/tonconnect-manifest.json`
- **目标位置**: `XDiving/web-mobile/tonconnect-manifest.json`（构建输出目录）

### 更新 manifest 文件：

编辑 `assets/Scripts/Test/tonconnect-manifest.json`，确保：

```json
{
  "url": "https://game.xdiving.io/",
  "name": "Diving Game",
  "iconUrl": "https://game.xdiving.io/icon.png"
}
```

然后重新构建项目，文件会自动复制到构建输出目录。

