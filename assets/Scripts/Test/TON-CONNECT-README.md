# TON Connect 钱包连接使用说明

## 安装依赖

在项目根目录运行：
```bash
npm install @tonconnect/sdk
```

## 配置步骤

### 1. 创建 manifest.json 文件

在服务器根目录创建 `tonconnect-manifest.json` 文件，内容参考 `assets/Scripts/Test/tonconnect-manifest.json`

需要修改：
- `url`: 你的应用域名
- `name`: 应用名称
- `iconUrl`: 应用图标 URL
- `termsOfUseUrl`: 服务条款 URL（可选）
- `privacyPolicyUrl`: 隐私政策 URL（可选）

### 2. 修改代码中的配置

在 `telegram-wallet-test.ts` 中修改：

**`getReturnUrl()` 方法（第121-130行）：**
```typescript
return `https://t.me/xdiving_bot/xdiving_bot`; // 替换为你的实际 Telegram Bot 链接
```

**`getManifestUrl()` 方法（第112-116行）：**
```typescript
return `${baseUrl}/tonconnect-manifest.json`; // 确保这个文件在服务器上可访问
```

## 使用说明

### 在 Cocos Creator 中设置

1. **添加UI节点：**
   - 创建一个 Button 节点：`ConnectButton`（连接钱包按钮）
   - 创建一个 Button 节点：`DisconnectButton`（断开连接按钮）
   - 创建一个 Label 节点：`InfoLabel`（显示信息）
   - 创建一个 Label 节点：`AddressLabel`（显示钱包地址）

2. **挂载组件：**
   - 选中一个节点
   - 添加 `TelegramWalletTest` 组件
   - 绑定UI节点到组件属性

3. **测试：**
   - 构建项目并部署到服务器（需要 HTTPS）
   - 在 Telegram 中打开 Mini App
   - 点击"连接钱包"按钮
   - 选择 TON 钱包进行连接

## 功能说明

### 连接钱包流程

1. 点击"连接钱包"按钮
2. TON Connect 会显示可用的钱包列表
3. 用户选择钱包（如 Tonkeeper、MyTonWallet 等）
4. 钱包应用会请求用户授权
5. 授权成功后，返回 Mini App
6. 显示连接的钱包地址

### 获取钱包信息

代码中提供了以下公共方法：

```typescript
// 获取钱包地址
const address = telegramWalletTest.getWalletAddress();

// 检查是否已连接
const isConnected = telegramWalletTest.isWalletConnected();
```

## 注意事项

1. **必须使用 HTTPS**：TON Connect 需要 HTTPS 环境
2. **manifest.json 必须可访问**：需要放在服务器根目录，确保能通过 URL 访问
3. **Telegram 环境**：必须在 Telegram Mini App 中运行
4. **打包配置**：如果使用 npm 安装 SDK，需要确保打包工具（如 webpack）能正确处理模块导入

## 故障排除

### SDK 未找到错误

如果出现 "TON Connect SDK 未找到"：
1. 确认已运行 `npm install @tonconnect/sdk`
2. 检查打包配置是否正确
3. 可能需要配置 Cocos Creator 的构建配置

### 连接失败

如果连接失败：
1. 检查 manifest.json 是否正确配置且可访问
2. 检查 returnUrl 是否正确
3. 检查网络连接
4. 查看浏览器控制台的错误信息

## 下一步

连接成功后，你可以：
1. 保存钱包地址到后端
2. 验证钱包所有权
3. 发送交易或签名消息
4. 查询钱包余额

