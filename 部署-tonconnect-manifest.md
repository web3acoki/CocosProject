# TON Connect Manifest 自动部署说明

## 问题
更新版本后，`https://game.xdiving.io/tonconnect-manifest.json` 返回 404 错误。

## ✅ 自动化解决方案（已实现）

**现在 `tonconnect-manifest.json` 会在每次构建时自动复制到构建输出目录！**

### 工作原理

在 `build-templates/web-mobile/index.ejs` 模板中添加了构建时自动执行的代码。每次 Cocos Creator 构建项目时，模板渲染过程中会自动：

1. 检测构建输出目录
2. 查找项目根目录中的 `assets/Scripts/Test/tonconnect-manifest.json`
3. 自动复制到构建输出目录的根目录

**无需任何手动操作！** 每次构建都会自动处理。

### 验证

构建完成后，检查构建输出目录（如 `XDiving/web-mobile/`）中是否包含 `tonconnect-manifest.json` 文件。

## 手动解决方案（备用方法）

### 方法 1: 手动执行脚本（推荐用于测试）

构建完成后，在项目根目录运行：

```bash
npm run copy-manifest
```

或者直接运行：

```bash
node build-templates/web-mobile/copy-manifest-on-build.js
```

### 方法 2: 在部署脚本中自动执行

在你的部署脚本（如 `deploy.sh` 或 `deploy.bat`）中添加：

**Linux/Mac (deploy.sh):**
```bash
#!/bin/bash
# 构建项目
# ... 你的构建命令 ...

# 复制 manifest 文件
node build-templates/web-mobile/copy-manifest-on-build.js

# 部署到服务器
# ... 你的部署命令 ...
```

**Windows (deploy.bat):**
```batch
@echo off
REM 构建项目
REM ... 你的构建命令 ...

REM 复制 manifest 文件
node build-templates/web-mobile/copy-manifest-on-build.js

REM 部署到服务器
REM ... 你的部署命令 ...
```

### 方法 3: 使用 CI/CD 自动部署

如果你使用 CI/CD（如 GitHub Actions、GitLab CI 等），在部署步骤中添加：

```yaml
# 示例：GitHub Actions
- name: Copy TON Connect Manifest
  run: node build-templates/web-mobile/copy-manifest-on-build.js
```

### 方法 4: 服务器端自动复制（如果使用 FTP/SSH 部署）

在服务器上创建一个部署后脚本，自动从源文件复制：

```bash
#!/bin/bash
# 服务器端部署后脚本
SOURCE_FILE="/path/to/project/assets/Scripts/Test/tonconnect-manifest.json"
TARGET_FILE="/var/www/game.xdiving.io/tonconnect-manifest.json"

if [ -f "$SOURCE_FILE" ]; then
    cp "$SOURCE_FILE" "$TARGET_FILE"
    echo "✅ Manifest 文件已复制"
else
    echo "⚠️ 源文件不存在"
fi
```

## 验证

部署后，访问以下 URL 验证文件是否存在：

```
https://game.xdiving.io/tonconnect-manifest.json
```

应该返回 JSON 内容，例如：

```json
{
  "url": "https://game.xdiving.io/",
  "name": "Diving Game",
  "iconUrl": "https://game.xdiving.io/icon.png"
}
```

## 脚本说明

`copy-manifest-on-build.js` 会自动检测构建输出目录，支持以下检测方式：

1. 环境变量 `CC_BUILD_OUTPUT_DIR`
2. 命令行参数
3. 当前工作目录（如果包含构建输出文件）
4. 脚本所在目录
5. 常见构建输出路径

## 故障排除

如果脚本无法找到构建输出目录：

1. **手动指定目录：**
   ```bash
   node build-templates/web-mobile/copy-manifest-on-build.js /path/to/build/output
   ```

2. **设置环境变量：**
   ```bash
   export CC_BUILD_OUTPUT_DIR=/path/to/build/output
   node build-templates/web-mobile/copy-manifest-on-build.js
   ```

3. **检查源文件是否存在：**
   ```bash
   ls -la assets/Scripts/Test/tonconnect-manifest.json
   ```

## 注意事项

- 确保 `assets/Scripts/Test/tonconnect-manifest.json` 文件存在且内容正确
- 确保构建输出目录有写入权限
- 如果使用版本控制，确保 `tonconnect-manifest.json` 在构建输出目录中被正确部署（不被 .gitignore 忽略）

