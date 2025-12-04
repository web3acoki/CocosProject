# Telegram Wallet 拆分使用指南

## 概述

将原来的 `telegram-wallet-test.ts` 拆分成两个独立的组件：

1. **TelegramWalletManager**（全局管理器）- Entry 场景使用
   - 负责 SDK 初始化和全局状态管理
   - 只加载一次，避免重复初始化

2. **TelegramWalletUI**（UI 组件）- Menu 场景使用
   - 负责 UI 交互和显示信息
   - 从 Manager 获取状态并更新 UI
   - 可以反复进入场景而不影响 SDK

## 文件说明

### 1. `telegram-wallet-manager.ts`（全局管理器）

**位置**：`assets/Scripts/Test/telegram-wallet-manager.ts`

**功能**：
- SDK 初始化（CDN 加载、包装器创建）
- 全局状态管理（gameFi、钱包状态）
- 钱包状态变化通知（供 UI 组件订阅）
- 单例模式，确保只有一个实例

**使用场景**：Entry 场景（游戏入口场景，只加载一次）

### 2. `telegram-wallet-ui.ts`（UI 组件）

**位置**：`assets/Scripts/Test/telegram-wallet-ui.ts`

**功能**：
- UI 组件绑定（按钮、标签、节点）
- 连接/断开钱包按钮功能
- 显示钱包信息（地址、状态）
- 复制地址功能
- 钱包弹窗显示/隐藏

**使用场景**：Menu 场景（菜单场景，可以反复进入）

## 配置步骤

### 步骤 1：在 Entry 场景中配置 Manager

1. **打开 Entry 场景**
2. **选择一个节点**（可以是根节点或任意节点）
3. **添加组件**：
   - 添加 `TelegramWalletManager` 组件
   - 不需要绑定任何 UI 节点（Manager 不处理 UI）
4. **确保节点不会被销毁**：
   - 如果需要跨场景保持，可以设置 `DontDestroyOnLoad`（可选）

### 步骤 2：在 Menu 场景中配置 UI

1. **打开 Menu 场景**
2. **创建 UI 节点**（如果还没有）：
   - `ConnectButton`：连接钱包按钮
   - `DisconnectButton`：断开连接按钮（可选）
   - `InfoLabel`：信息显示标签（可选）
   - `AddressLabel`：地址显示标签（可选）
   - `ConnectLabel`：连接按钮上的标签（可选）
   - `WalletNode`：钱包地址弹窗节点（可选）
   - `SuccessFrame`：复制成功提示（可选）
   - `FailFrame`：复制失败提示（可选）

3. **添加组件**：
   - 选择一个节点（通常是包含这些 UI 元素的父节点）
   - 添加 `TelegramWalletUI` 组件
   - 绑定所有 UI 节点到组件属性

4. **配置属性**：
   - `connectBtn` → `ConnectButton`
   - `disconnectBtn` → `DisconnectButton`（如果有）
   - `infoLabel` → `InfoLabel`（如果有）
   - `addressLabel` → `AddressLabel`（如果有）
   - `connectLabel` → `ConnectLabel`（如果有）
   - `walletNode` → `WalletNode`（如果有）
   - `successFrame` → `SuccessFrame`（如果有）
   - `failFrame` → `FailFrame`（如果有）

## 工作流程

1. **游戏启动**：
   - Entry 场景加载 → `TelegramWalletManager` 初始化 → SDK 加载完成

2. **进入 Menu 场景**：
   - Menu 场景加载 → `TelegramWalletUI` 启动 → 自动找到 Manager → 注册回调 → 更新 UI

3. **用户操作**：
   - 点击连接按钮 → UI 调用 Manager 的连接方法 → 弹出连接弹窗
   - 连接成功 → Manager 通知所有 UI → UI 更新显示
   - 点击断开按钮 → UI 调用 Manager 的断开方法 → 断开连接

4. **离开 Menu 场景**：
   - UI 组件销毁 → 移除回调 → Manager 继续运行

5. **再次进入 Menu 场景**：
   - 新的 UI 组件创建 → 自动找到 Manager → 注册回调 → 显示当前状态

## 优势

1. **避免重复初始化**：SDK 只在 Entry 场景初始化一次
2. **场景隔离**：UI 组件可以反复创建和销毁，不影响 SDK
3. **代码分离**：管理逻辑和 UI 逻辑分离，便于维护
4. **稳定性**：不修改原有代码，只是拆分，保持稳定性

## 注意事项

1. **Entry 场景必须首先加载**：确保 Manager 在 UI 之前初始化
2. **Manager 节点不要销毁**：如果 Entry 场景会被卸载，需要确保 Manager 节点不被销毁
3. **UI 组件会自动查找 Manager**：无需手动绑定，会自动找到全局实例

## API 说明

### TelegramWalletManager（供外部调用）

```typescript
// 获取单例实例
const manager = TelegramWalletManager.getInstance();

// 获取 GameFi 实例
const gameFi = manager.getGameFi();

// 检查是否已初始化
const isReady = manager.isInitialized();

// 检查是否正在初始化
const isLoading = manager.getIsInitializing();

// 获取初始化错误
const error = manager.getInitError();

// 注册钱包状态变化回调
manager.onWalletChange((wallet) => {
    console.log('钱包状态变化:', wallet);
});

// 移除回调
manager.offWalletChange(callback);
```

### TelegramWalletUI（供外部调用）

```typescript
// 获取钱包地址
const address = ui.getWalletAddress();

// 检查是否已连接
const isConnected = ui.isWalletConnected();
```

## 迁移说明

如果你之前使用的是 `telegram-wallet-test.ts`：

1. **保留原文件**：`telegram-wallet-test.ts` 保持不变，作为备份
2. **在 Entry 场景**：将 `TelegramWalletTest` 组件替换为 `TelegramWalletManager`
3. **在 Menu 场景**：将 `TelegramWalletTest` 组件替换为 `TelegramWalletUI`
4. **重新绑定 UI**：在 Menu 场景中重新绑定 UI 节点

## 故障排除

### 问题：UI 组件找不到 Manager

**原因**：Entry 场景未加载或 Manager 未初始化

**解决**：
1. 确保 Entry 场景首先加载
2. 检查 Manager 组件是否正确添加到 Entry 场景
3. 检查控制台是否有初始化错误

### 问题：UI 不更新

**原因**：回调未正确注册

**解决**：
1. 检查 `onWalletStatusChange` 是否正确调用
2. 检查 Manager 的 `notifyWalletChange` 是否被调用
3. 检查 UI 组件的 `updateUI` 方法是否被调用

