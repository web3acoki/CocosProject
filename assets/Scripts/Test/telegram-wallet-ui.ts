// Telegram Wallet UI 组件 - Menu 场景使用
// 负责 UI 交互和显示信息，从 Manager 获取状态
import { _decorator, Component, Button, Label, Node } from 'cc';
import { Sound } from '../Sound';
import { TelegramWalletManager } from './telegram-wallet-manager';
const { ccclass, property } = _decorator;

// Wallet 类型定义（与 Manager 保持一致）
interface Wallet {
    account: {
        address: string;
        chain: number;
    };
    device?: {
        appName: string;
        appVersion: string;
        maxProtocolVersion: number;
        platform: string;
    };
}

@ccclass('TelegramWalletUI')
export class TelegramWalletUI extends Component {
    
    @property(Button)
    connectBtn: Button = null;
    
    @property(Button)
    disconnectBtn: Button = null;
    
    @property(Label)
    infoLabel: Label = null;
    
    @property(Label)
    addressLabel: Label = null;

    @property(Label)
    connectLabel: Label = null;

    @property(Node)
    walletNode: Node = null;

    @property(Node)
    successFrame: Node = null;
    successTimer = 1;
    
    @property(Node)
    failFrame: Node = null;
    failTimer = 1;

    private manager: TelegramWalletManager | null = null;
    private walletChangeCallback: ((wallet: Wallet | null) => void) | null = null;

    start() {
        // 尝试获取全局 Manager 实例（可能还在初始化中）
        this.tryInitManager();
    }

    /**
     * 尝试初始化 Manager（带重试机制）
     */
    private tryInitManager(retryCount: number = 0) {
        const maxRetries = 10; // 最多重试 10 次
        const retryDelay = 100; // 每次重试间隔 100ms
        
        this.manager = TelegramWalletManager.getInstance();
        
        if (!this.manager) {
            if (retryCount < maxRetries) {
                // Manager 可能还在初始化，延迟重试
                setTimeout(() => {
                    this.tryInitManager(retryCount + 1);
                }, retryDelay);
                return;
            } else {
                // 重试失败，显示详细错误
                this.showError(
                    'TelegramWalletManager 初始化失败',
                    '未找到 TelegramWalletManager 实例',
                    {
                        '重试次数': `${retryCount}/${maxRetries}`,
                        '重试延迟': `${retryDelay}ms`,
                        '当前场景': 'Menu',
                        '预期场景': 'Entry（应该在 Entry 场景中创建）'
                    },
                    [
                        '确保在 Entry 场景中已创建 TelegramWalletManager 组件',
                        '检查 Entry 场景是否正确加载',
                        '检查 TelegramWalletManager 是否被正确添加到场景节点',
                        '刷新页面重试',
                        '检查浏览器控制台是否有其他错误信息'
                    ]
                );
                return;
            }
        }

        // Manager 已找到，初始化 UI
        this.initUI();
        
        // 启动定期检查初始化状态的机制
        this.startInitStatusCheck();
    }
    
    /**
     * 定期检查初始化状态，更新 info 文本
     */
    private initStatusCheckInterval: any = null;
    private startInitStatusCheck() {
        // 清除之前的检查
        if (this.initStatusCheckInterval) {
            clearInterval(this.initStatusCheckInterval);
        }
        
        // 每 500ms 检查一次初始化状态
        this.initStatusCheckInterval = setInterval(() => {
            if (!this.manager) {
                return;
            }
            
            // 如果初始化成功，更新 info 文本
            if (this.manager.isInitialized()) {
                const gameFi = this.manager.getGameFi();
                if (gameFi) {
                    const wallet = gameFi.wallet;
                    const isConnected = !!(wallet && wallet.account);
                    if (!isConnected) {
                        // 初始化成功但未连接钱包
                        if (this.infoLabel && !this.infoLabel.string.includes('初始化成功')) {
                            this.showInfo('✅ 初始化成功\n等待连接钱包...');
                        }
                    }
                    // 如果已连接，停止检查（由 onWalletStatusChange 处理）
                    if (isConnected) {
                        this.stopInitStatusCheck();
                    }
                }
            } else if (this.manager.getIsInitializing()) {
                // 正在初始化中
                if (this.infoLabel && !this.infoLabel.string.includes('初始化中')) {
                    this.showInfo('正在初始化中，请稍候...');
                }
            }
        }, 500);
    }
    
    /**
     * 停止初始化状态检查
     */
    private stopInitStatusCheck() {
        if (this.initStatusCheckInterval) {
            clearInterval(this.initStatusCheckInterval);
            this.initStatusCheckInterval = null;
        }
    }

    /**
     * 初始化 UI（Manager 已找到后调用）
     */
    private initUI() {
        if (!this.manager) {
            return;
        }

        // 默认隐藏 walletNode（只有在连接成功后才显示）
        if (this.walletNode) {
            this.walletNode.active = false;
        }
        
        // 关键修复：info文本常态化显示
        if (this.infoLabel) {
            this.infoLabel.node.active = true;
            // 检查初始化状态，如果已初始化成功则显示"初始化成功"，否则显示"等待连接钱包"
            if (this.manager.isInitialized()) {
                this.showInfo('✅ 初始化成功');
            } else {
                this.showInfo('等待连接钱包...');
            }
        }
        
        // 绑定按钮事件
        if (this.connectBtn) {
            this.connectBtn.node.on(Button.EventType.CLICK, this.connectWallet, this);
        }
        
        if (this.disconnectBtn) {
            this.disconnectBtn.node.on(Button.EventType.CLICK, this.disconnectWallet, this);
        }

        // 注册钱包状态变化回调
        this.walletChangeCallback = (wallet: Wallet | null) => {
            this.onWalletStatusChange(wallet);
        };
        this.manager.onWalletChange(this.walletChangeCallback);

        // 初始化 UI 显示
        this.updateUI();
    }

    onDestroy() {
        // 停止初始化状态检查
        this.stopInitStatusCheck();
        
        // 移除 Manager 回调（重要：避免内存泄漏）
        // Manager 是全局单例，不会随场景销毁，必须手动清理回调
        if (this.manager && this.walletChangeCallback) {
            this.manager.offWalletChange(this.walletChangeCallback);
        }
        
        // 注意：按钮事件监听器会在节点销毁时自动清理，无需手动移除
        // 场景切换时节点会被自动销毁，Cocos Creator 会自动清理所有事件监听器
    }

    /**
     * 连接钱包
     */
    private async connectWallet() {
        if (!this.manager) {
            await this.showError(
                '钱包管理器未初始化',
                'TelegramWalletManager 实例不存在',
                {
                    '操作': '连接钱包',
                    'Manager状态': 'null'
                },
                [
                    '确保在 Entry 场景中已创建 TelegramWalletManager',
                    '等待 Manager 初始化完成',
                    '刷新页面重试'
                ]
            );
            return;
        }

        const gameFi = this.manager.getGameFi();
        if (!gameFi) {
            if (this.manager.getIsInitializing()) {
                this.showInfo('正在初始化中，请稍候...\n\n提示: 初始化可能需要一些时间，请稍候再试');
                return;
            } else if (this.manager.getInitError()) {
                await this.showError(
                    'GameFi SDK 初始化失败',
                    this.manager.getInitError() || '未知错误',
                    {
                        '操作': '连接钱包',
                        '初始化状态': '失败',
                        'Manager状态': '已创建但 SDK 未初始化'
                    },
                    [
                        '检查网络连接是否正常',
                        '确认 manifest 文件可访问（tonconnect-manifest.json）',
                        '检查 CDN 是否可访问（@tonconnect/ui）',
                        '刷新页面重试',
                        '检查浏览器控制台的详细错误信息',
                        '确认是否在 HTTPS 环境下运行（Telegram Mini App 需要 HTTPS）'
                    ]
                );
            } else {
                await this.showError(
                    'GameFi SDK 未初始化',
                    'SDK 初始化未完成或失败',
                    {
                        '操作': '连接钱包',
                        '初始化状态': '未完成',
                        'Manager状态': '已创建',
                        '是否正在初始化': this.manager.getIsInitializing() ? '是' : '否'
                    },
                    [
                        '等待初始化完成（可能需要几秒钟）',
                        '检查网络连接是否正常',
                        '检查 CDN 是否可访问',
                        '刷新页面重试',
                        '检查浏览器控制台是否有错误信息'
                    ]
                );
            }
            return;
        }
        
        // 如果钱包已连接，只显示钱包地址框，不弹出TG连接弹窗
        if (gameFi.wallet && this.walletNode) {
            this.walletNode.active = true;
            return; // 已连接时直接返回，不执行后续的连接逻辑
        }
        
        // 如果未连接，弹出TG连接弹窗
        try {
            await gameFi.connectWallet();
        } catch (error) {
            await this.showError(
                '连接钱包失败',
                error,
                {
                    '操作': 'connectWallet()',
                    'GameFi状态': gameFi ? '已初始化' : '未初始化',
                    '钱包状态': gameFi?.wallet ? '已连接' : '未连接',
                    '钱包地址': gameFi?.walletAddress || '无'
                },
                [
                    '检查是否在 Telegram 环境中运行',
                    '确认钱包应用已安装（如 Tonkeeper）',
                    '检查网络连接是否正常',
                    '尝试刷新页面后重试',
                    '检查浏览器控制台的详细错误信息',
                    '确认 manifest 文件配置正确'
                ]
            );
            this.updateUI();
        }
    }

    /**
     * 断开钱包
     */
    private async disconnectWallet() {
        if (!this.manager) {
            await this.showError(
                '钱包管理器未初始化',
                'TelegramWalletManager 实例不存在',
                {
                    '操作': '断开钱包',
                    'Manager状态': 'null'
                },
                [
                    '确保在 Entry 场景中已创建 TelegramWalletManager',
                    '刷新页面重试'
                ]
            );
            return;
        }

        const gameFi = this.manager.getGameFi();
        if (!gameFi) {
            await this.showError(
                'GameFi SDK 未初始化',
                '无法断开连接，SDK 未初始化',
                {
                    '操作': '断开钱包',
                    'GameFi状态': '未初始化'
                },
                [
                    '等待 SDK 初始化完成',
                    '刷新页面重试'
                ]
            );
            return;
        }
        
        try {
            await gameFi.disconnectWallet();
            this.showInfo('钱包已断开');
            // 断开连接后直接隐藏钱包地址弹窗
            if (this.walletNode) {
                this.walletNode.active = false;
            }
            this.updateUI();
        } catch (error) {
            await this.showError(
                '断开钱包失败',
                error,
                {
                    '操作': 'disconnectWallet()',
                    'GameFi状态': gameFi ? '已初始化' : '未初始化',
                    '钱包状态': gameFi?.wallet ? '已连接' : '未连接',
                    '钱包地址': gameFi?.walletAddress || '无'
                },
                [
                    '检查网络连接是否正常',
                    '尝试刷新页面后重试',
                    '检查浏览器控制台的详细错误信息',
                    '如果问题持续，可以尝试重新连接钱包'
                ]
            );
        }
    }

    /**
     * 钱包状态变化回调
     */
    private onWalletStatusChange(wallet: Wallet | null) {
        if (wallet && wallet.account) {
            const address = wallet.account.address;
            const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
            this.showInfo(`✅ 钱包连接成功\n地址: ${shortAddress}`);
            // 连接成功后不自动显示钱包地址框，只有用户点击连接按钮时才显示
        } else {
            this.showInfo('钱包已断开');
            // 断开后隐藏钱包地址框
            if (this.walletNode) {
                this.walletNode.active = false;
            }
        }
        
        this.updateUI();
    }

    /**
     * 更新UI显示
     */
    private updateUI() {
        if (!this.manager) {
            // 即使 Manager 不存在，也保持 infoLabel 显示
            if (this.infoLabel) {
                this.infoLabel.node.active = true;
            }
            return;
        }

        const gameFi = this.manager.getGameFi();
        if (!gameFi) {
            // 即使 GameFi 不存在，也保持 infoLabel 显示
            if (this.infoLabel) {
                this.infoLabel.node.active = true;
                // 检查初始化状态
                if (this.manager.isInitialized()) {
                    this.showInfo('✅ 初始化成功');
                } else if (this.manager.getIsInitializing()) {
                    this.showInfo('正在初始化中，请稍候...');
                } else {
                    this.showInfo('等待初始化...');
                }
            }
            return;
        }
        
        // 如果 GameFi 存在，说明初始化成功，显示"初始化成功"
        if (this.infoLabel && (!this.infoLabel.string || this.infoLabel.string.includes('等待') || this.infoLabel.string.includes('初始化中'))) {
            const wallet = gameFi.wallet;
            const isConnected = !!(wallet && wallet.account);
            if (!isConnected) {
                // 初始化成功但未连接钱包
                this.showInfo('✅ 初始化成功\n等待连接钱包...');
            }
        }
        
        const wallet = gameFi.wallet;
        const isConnected = !!(wallet && wallet.account);
        
        if (this.connectBtn) {
            // 始终允许点击连接按钮
            this.connectBtn.interactable = true;
        }
        
        if (this.disconnectBtn) {
            this.disconnectBtn.interactable = isConnected;
        }
        
        if (this.addressLabel) {
            if (isConnected && wallet && wallet.account && wallet.account.address) {
                const address = wallet.account.address;
                // addressLabel 显示完整地址（转换为用户友好格式）
                // 如果是 raw 格式（0: 或 -1: 开头），异步转换为 bounceable 格式
                if (address.startsWith('0:') || address.startsWith('-1:')) {
                    // 异步转换地址格式（使用 API）
                    this.convertToBounceableAddress(address).then(bounceableAddress => {
                        if (this.addressLabel) {
                            this.addressLabel.string = bounceableAddress;
                        }
                    }).catch(() => {
                        // 如果转换失败，显示原地址
                        if (this.addressLabel) {
                            this.addressLabel.string = address;
                        }
                    });
                } else {
                    // 已经是用户友好格式（UQ/EQ 开头），直接显示
                    this.addressLabel.string = address;
                }
            } else {
                // 未连接时不显示文本，保持原样
            }
        }
        
        // 在 connectLabel 中显示钱包地址（前四位和后四位）或 "connect wallet"
        if (this.connectLabel) {
            if (isConnected && wallet && wallet.account && wallet.account.address) {
                const address = wallet.account.address;
                // 如果是 raw 格式，异步转换为 bounceable 格式后再显示短地址
                if (address.startsWith('0:') || address.startsWith('-1:')) {
                    this.convertToBounceableAddress(address).then(bounceableAddress => {
                        if (this.connectLabel) {
                            const shortAddress = this.getShortAddress(bounceableAddress, 4, 4);
                            this.connectLabel.string = shortAddress;
                        }
                    }).catch((error) => {
                        // 如果转换失败，使用原地址显示短地址，并记录错误（不显示给用户）
                        console.warn('地址格式转换失败（显示短地址）:', error);
                        if (this.connectLabel) {
                            const shortAddress = this.getShortAddress(address, 4, 4);
                            this.connectLabel.string = shortAddress;
                        }
                    });
                } else {
                    // 已经是 bounceable 格式，直接显示短地址
                    const shortAddress = this.getShortAddress(address, 4, 4);
                    this.connectLabel.string = shortAddress;
                }
            } else {
                // 未连接时显示 "connect wallet"
                this.connectLabel.string = 'connect wallet';
            }
        }
    }

    /**
     * 将 raw 格式地址转换为 bounceable 格式（用户友好格式）
     */
    private async convertToBounceableAddress(rawAddress: string): Promise<string> {
        try {
            // 如果已经是 bounceable 格式，直接返回
            if (rawAddress.startsWith('UQ') || rawAddress.startsWith('EQ') || rawAddress.startsWith('0Q')) {
                return rawAddress;
            }

            // 使用 TON API 转换地址格式
            // tonapi.io 会自动处理地址格式转换
            try {
                const apiUrl = `https://tonapi.io/v2/accounts/${rawAddress}`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    // API 返回的地址通常是 bounceable 格式
                    if (data.address) {
                        // 确保返回的是 bounceable 格式（UQ 或 EQ 开头）
                        const bounceableAddress = data.address;
                        if (bounceableAddress.startsWith('UQ') || bounceableAddress.startsWith('EQ') || bounceableAddress.startsWith('0Q')) {
                            return bounceableAddress;
                        }
                        // 如果返回的不是 bounceable 格式，尝试从 raw_address 字段获取
                        if (data.raw_address) {
                            // 尝试使用另一个 API 端点
                            const altApiUrl = `https://toncenter.com/api/v2/addressInformation?address=${rawAddress}`;
                            try {
                                const altResponse = await fetch(altApiUrl);
                                if (altResponse.ok) {
                                    const altData = await altResponse.json();
                                    if (altData.result && altData.result.address) {
                                        return altData.result.address;
                                    }
                                }
                            } catch (altError) {
                                console.warn('备用 API 转换失败:', altError);
                            }
                        }
                    }
                }
            } catch (apiError) {
                console.warn('使用 tonapi.io API 转换地址失败:', apiError);
            }

            // 如果 API 失败，尝试使用 toncenter.com 的另一个端点
            try {
                const toncenterUrl = `https://toncenter.com/api/v2/addressInformation?address=${rawAddress}`;
                const response = await fetch(toncenterUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.result && data.result.address) {
                        const bounceableAddress = data.result.address;
                        if (bounceableAddress.startsWith('UQ') || bounceableAddress.startsWith('EQ') || bounceableAddress.startsWith('0Q')) {
                            return bounceableAddress;
                        }
                    }
                }
            } catch (toncenterError) {
                console.warn('使用 toncenter.com API 转换地址失败:', toncenterError);
            }

            // 如果所有 API 都失败，返回原地址（不显示错误，因为这是后台操作）
            console.warn('地址格式转换失败，返回原地址。建议检查网络连接或使用 TON SDK');
            return rawAddress;
        } catch (error) {
            console.warn('地址格式转换异常，返回原地址:', error);
            return rawAddress;
        }
    }

    /**
     * 同步版本的地址转换
     */
    private convertToBounceableAddressSync(rawAddress: string): string {
        if (rawAddress.startsWith('UQ') || rawAddress.startsWith('EQ') || rawAddress.startsWith('0Q')) {
            return rawAddress;
        }
        return rawAddress;
    }

    /**
     * 获取用户友好的地址格式（短地址显示）
     */
    private getShortAddress(address: string | null, startLength: number = 4, endLength: number = 4): string {
        if (!address) {
            return '';
        }

        let friendlyAddress = address;
        if (address.startsWith('0:') || address.startsWith('-1:')) {
            friendlyAddress = this.convertToBounceableAddressSync(address);
        }

        if (friendlyAddress.length <= startLength + endLength) {
            return friendlyAddress;
        }

        return `${friendlyAddress.slice(0, startLength)}...${friendlyAddress.slice(-endLength)}`;
    }

    /**
     * 获取当前连接的钱包地址
     */
    public getWalletAddress(): string | null {
        if (!this.manager) {
            return null;
        }

        const gameFi = this.manager.getGameFi();
        if (!gameFi) {
            return null;
        }

        return gameFi.walletAddress || null;
    }

    /**
     * 检查是否已连接
     */
    public isWalletConnected(): boolean {
        if (!this.manager) {
            return false;
        }

        const gameFi = this.manager.getGameFi();
        if (!gameFi) {
            return false;
        }

        return !!(gameFi.wallet);
    }

    /**
     * 显示信息（普通信息，不复制）
     * 关键修复：info文本常态化显示，无论什么状态都显示
     */
    private showInfo(message: string) {
        if (this.infoLabel) {
            this.infoLabel.string = message;
            // 始终显示 infoLabel，无论什么状态
            this.infoLabel.node.active = true;
        }
    }

    /**
     * 显示错误信息（详细版本，自动复制到剪贴板）
     * @param title 错误标题
     * @param error 错误对象或错误消息
     * @param context 错误上下文信息
     * @param suggestions 建议操作列表
     */
    private async showError(
        title: string, 
        error: Error | string | any, 
        context?: { [key: string]: any },
        suggestions?: string[]
    ): Promise<void> {
        const timestamp = new Date().toLocaleString('zh-CN');
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        // 构建详细的错误信息
        let fullErrorMsg = `❌ ${title}\n\n`;
        fullErrorMsg += `时间: ${timestamp}\n`;
        fullErrorMsg += `错误: ${errorMessage}\n`;
        
        // 添加上下文信息
        if (context) {
            fullErrorMsg += `\n上下文信息:\n`;
            for (const key in context) {
                if (context.hasOwnProperty(key)) {
                    fullErrorMsg += `  ${key}: ${context[key]}\n`;
                }
            }
        }
        
        // 添加堆栈信息（如果有）
        if (errorStack) {
            fullErrorMsg += `\n堆栈信息:\n${errorStack}\n`;
        }
        
        // 添加建议
        if (suggestions && suggestions.length > 0) {
            fullErrorMsg += `\n建议操作:\n`;
            suggestions.forEach((suggestion, index) => {
                fullErrorMsg += `${index + 1}. ${suggestion}\n`;
            });
        }
        
        // 显示错误信息
        this.showInfo(fullErrorMsg);
        
        // 自动复制到剪贴板
        await this.copyToClipboard(fullErrorMsg);
    }

    /**
     * 复制文本到剪贴板（统一方法）
     */
    private async copyToClipboard(text: string): Promise<boolean> {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                console.log('错误信息已复制到剪贴板');
                return true;
            } else {
                // 使用备用方法
                return this.fallbackCopyToClipboard(text);
            }
        } catch (err) {
            console.warn('复制到剪贴板失败，尝试备用方法:', err);
            return this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 备用复制方法
     */
    private fallbackCopyToClipboard(text: string): boolean {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.width = "2em";
            textArea.style.height = "2em";
            textArea.style.padding = "0";
            textArea.style.border = "none";
            textArea.style.outline = "none";
            textArea.style.boxShadow = "none";
            textArea.style.background = "transparent";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log('错误信息已复制到剪贴板（备用方法）');
                return true;
            } else {
                console.warn('备用复制方法失败');
                return false;
            }
        } catch (err) {
            console.error('备用复制方法出错:', err);
            return false;
        }
    }

    /**
     * 复制地址
     */
    async copy() {
        if (!this.addressLabel) {
            await this.showError(
                '复制地址失败',
                'addressLabel 未设置',
                {
                    '操作': '复制钱包地址',
                    '组件状态': 'addressLabel 为 null'
                },
                [
                    '检查 UI 组件绑定是否正确',
                    '确保 addressLabel 已正确添加到场景中',
                    '检查组件属性配置'
                ]
            );
            return;
        }

        Sound.instance.buttonAudio.play();
        const address = this.addressLabel.string;
        
        if (!address || address.trim() === '') {
            await this.showError(
                '复制地址失败',
                '钱包地址为空',
                {
                    '操作': '复制钱包地址',
                    '地址值': address || '空字符串'
                },
                [
                    '确保钱包已连接',
                    '检查钱包地址是否正确获取',
                    '尝试重新连接钱包'
                ]
            );
            return;
        }

        const success = await this.copyToClipboard(address);
        if (success) {
            if (this.successFrame) {
                this.successFrame.active = true;
            }
        } else {
            await this.showError(
                '复制地址失败',
                '无法复制到剪贴板',
                {
                    '操作': '复制钱包地址',
                    '地址': address,
                    '浏览器支持': navigator.clipboard ? '是' : '否'
                },
                [
                    '检查浏览器权限设置',
                    '尝试手动复制地址',
                    '检查浏览器是否支持剪贴板 API',
                    '尝试使用其他浏览器'
                ]
            );
            if (this.failFrame) {
                this.failFrame.active = true;
            }
        }
    }

    walletHide() {
        Sound.instance.buttonAudio.play();
        if (this.walletNode) {
            this.walletNode.active = !this.walletNode.active;
        }
    }

    update(deltaTime: number) {
        if (this.successFrame && this.successFrame.active) {
            if (this.successTimer > 0) {
                this.successTimer -= deltaTime;
            } else {
                this.successFrame.active = false;
                this.successTimer = 1;
            }
        }
        
        if (this.failFrame && this.failFrame.active) {
            if (this.failTimer > 0) {
                this.failTimer -= deltaTime;
            } else {
                this.failFrame.active = false;
                this.failTimer = 1;
            }
        }
    }
}

