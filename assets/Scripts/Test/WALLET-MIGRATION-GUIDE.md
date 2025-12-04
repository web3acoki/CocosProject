# 钱包功能迁移指南

## 概述

项目已迁移到使用 `@ton/cocos-sdk` 的新钱包实现（`Wallet.ts`），需要停用旧的实现（`Test/` 目录下的代码）。

---

## 一、启用新功能

### 1. 在场景中添加 Wallet 组件

#### Entry 场景（可选）
- 如果需要在 Entry 场景初始化钱包，可以添加 `Wallet` 组件
- 或者让 Wallet 在 Menu 场景中初始化

#### Menu 场景（推荐）
1. 打开 `Menu` 场景
2. 在场景中创建一个节点（例如：`WalletNode`）
3. 在该节点上添加 `Wallet` 组件
4. 在 `Wallet` 组件中：
   - 设置 `statusLabel` 属性（用于显示状态信息的 Label）

### 2. 添加连接按钮（可选）

如果需要按钮来触发连接：
1. 在场景中创建一个按钮
2. 在按钮的点击事件中调用 `Wallet` 组件的 `onConnect()` 方法

**示例代码（在 Menu.ts 或其他脚本中）：**
```typescript
// 获取 Wallet 组件
const walletComponent = this.walletNode.getComponent(Wallet);
if (walletComponent) {
    walletComponent.onConnect();
}
```

### 3. 更新 manifest URL（重要）

在 `Wallet.ts` 中，将演示 manifest URL 替换为你自己的：

```typescript
this.connectUI = new TonConnectUI({
    manifestUrl: 'https://your-domain.com/tonconnect-manifest.json'  // 替换为你的 manifest URL
});
```

---

## 二、停用旧功能

### 1. 从场景中移除旧组件

#### Entry 场景
- 移除 `TelegramWalletManager` 组件（如果存在）

#### Menu 场景
- 移除 `TelegramWalletUI` 组件（如果存在）

### 2. 注释或更新使用旧代码的文件

#### 2.1 Topup.ts

**当前代码（使用旧实现）：**
```typescript
import { TelegramWalletManager } from './Test/telegram-wallet-manager';

async purchase(topupContent:TopupContent){
    const walletManager = TelegramWalletManager.getInstance();
    if (walletManager) {
        const gameFi = walletManager.getGameFi();
        if (gameFi) {
            try {
                await gameFi.connectWallet();
            } catch (error) {
                console.error('打开钱包失败:', error);
            }
        }
    }
}
```

**更新为新实现：**
```typescript
import { Wallet } from './Wallet';

async purchase(topupContent:TopupContent){
    // 方法1: 如果 Wallet 组件在场景中
    const walletNode = find('WalletNode'); // 或使用 @property 引用
    const walletComponent = walletNode?.getComponent(Wallet);
    if (walletComponent) {
        walletComponent.onConnect();
    }
    
    // 方法2: 直接创建 Wallet 实例（不推荐，建议使用组件方式）
    // const wallet = new Wallet();
    // await wallet.onLoad();
    // wallet.onConnect();
}
```

#### 2.2 Manager.ts

**当前代码（使用旧实现）：**
```typescript
import { TelegramWalletManager } from './Test/telegram-wallet-manager';

// 在某个方法中
const walletManager = TelegramWalletManager.getInstance();
```

**更新为新实现：**
```typescript
import { Wallet } from './Wallet';

// 在某个方法中
const walletNode = find('WalletNode'); // 或使用 @property 引用
const walletComponent = walletNode?.getComponent(Wallet);
if (walletComponent && walletComponent.connectUI) {
    // 使用 walletComponent.connectUI 进行操作
}
```

#### 2.3 Entry.ts

**当前代码（检查 TON Connect 初始化）：**
```typescript
if(Manager.getInstance().getFinish(isTimeout)){
    // ...
}
```

**更新：**
- 如果不再需要等待 TON Connect 初始化，可以简化逻辑
- 或者保留检查，但改为检查 Wallet 组件的状态

---

## 三、完全停用旧代码（可选）

如果确定不再需要旧代码，可以：

### 1. 重命名 Test 目录（保留备份）
```
Test/ -> Test_OLD/
```

### 2. 或者注释掉旧代码文件的关键部分

在以下文件中添加注释：
- `assets/Scripts/Test/telegram-wallet-manager.ts` - 在类定义前添加注释
- `assets/Scripts/Test/telegram-wallet-ui.ts` - 在类定义前添加注释
- `assets/Scripts/Test/telegram-wallet-test.ts` - 在类定义前添加注释

**示例：**
```typescript
// ========== 旧代码已停用 ==========
// @ccclass('TelegramWalletManager')
// export class TelegramWalletManager extends Component {
//     // ...
// }
```

---

## 四、测试新功能

### 1. 检查清单

- [ ] Wallet 组件已添加到场景
- [ ] statusLabel 已正确设置
- [ ] manifest URL 已更新
- [ ] 旧组件已从场景中移除
- [ ] 使用旧代码的文件已更新

### 2. 测试步骤

1. 运行项目
2. 检查控制台是否有错误
3. 点击连接钱包按钮
4. 验证钱包连接功能是否正常
5. 测试所有平台（Windows/Mac/iOS）

---

## 五、新功能 API 参考

### Wallet 组件方法

```typescript
// 初始化（自动调用）
async onLoad(): Promise<void>

// 连接/断开钱包
onConnect(): void

// 更新状态显示
updateStatus(): void
```

### 访问钱包信息

```typescript
// 获取 Wallet 组件
const wallet = node.getComponent(Wallet);

// 检查是否已连接
if (wallet.connectUI?.connected) {
    // 获取地址
    const address = wallet.connectUI.account.address;
    // 使用地址...
}
```

---

## 六、常见问题

### Q: 如何获取钱包地址？
A: 通过 `Wallet` 组件的 `connectUI.account.address` 属性

### Q: 如何监听钱包状态变化？
A: `TonConnectUI` 的 `onStatusChange` 回调已在 `onLoad()` 中设置，会自动更新 `statusLabel`

### Q: 旧代码可以完全删除吗？
A: 建议先重命名保留备份，确认新功能完全正常后再删除

---

## 七、回退方案

如果新功能有问题，可以：

1. 恢复场景中的旧组件
2. 恢复使用旧代码的文件
3. 检查 `Test/` 目录下的旧代码是否完整

