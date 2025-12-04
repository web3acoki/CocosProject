// Telegram Wallet 全局管理器 - Entry 场景使用
// 负责 SDK 初始化和全局状态管理，只加载一次
import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;

declare global {
    interface Window {
        Telegram?: any;
        TonConnectUI?: any;
        TonConnectUISDK?: any;
    }
}

// Wallet 类型定义（兼容官方 SDK 接口）
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

// GameFi 接口（兼容官方 SDK API）
interface GameFi {
    wallet: Wallet | null;
    walletAccount: any;
    walletAddress: string | null;
    connectWallet(): Promise<void>;
    disconnectWallet(): Promise<void>;
    onWalletChange(callback: (wallet: Wallet | null) => void): void;
}

@ccclass('TelegramWalletManager')
export class TelegramWalletManager extends Component {
    
    private gameFi: GameFi | null = null;
    private isInitializing: boolean = false;
    private initError: string | null = null;
    
    // 单例实例
    private static instance: TelegramWalletManager | null = null;
    
    // 钱包状态变化回调列表（供 UI 组件注册）
    private walletChangeCallbacks: Array<(wallet: Wallet | null) => void> = [];

    start() {
        // 确保只有一个实例
        if (TelegramWalletManager.instance && TelegramWalletManager.instance !== this) {
            console.log('TelegramWalletManager 已存在，销毁当前实例');
            this.node.destroy();
            return;
        }
        
        TelegramWalletManager.instance = this;
        
        // 设置为常驻节点，避免场景切换时被销毁
        director.addPersistRootNode(this.node);
        
        // 设置全局错误处理
        this.setupGlobalErrorHandlers();
        
        // 异步初始化 GameFi SDK（不阻塞其他组件的初始化）
        // 使用 setTimeout 确保不阻塞 start() 方法的执行
        setTimeout(() => {
            this.initGameFi().catch(error => {
                console.error('TelegramWalletManager 初始化失败:', error);
            });
        }, 0);
    }

    onDestroy() {
        if (TelegramWalletManager.instance === this) {
            TelegramWalletManager.instance = null;
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): TelegramWalletManager | null {
        return TelegramWalletManager.instance;
    }

    /**
     * 获取 GameFi 实例
     */
    public getGameFi(): GameFi | null {
        return this.gameFi;
    }

    /**
     * 检查是否已初始化
     */
    public isInitialized(): boolean {
        return !!this.gameFi;
    }

    /**
     * 检查是否正在初始化
     */
    public getIsInitializing(): boolean {
        return this.isInitializing;
    }

    /**
     * 获取初始化错误
     */
    public getInitError(): string | null {
        return this.initError;
    }

    /**
     * 注册钱包状态变化回调
     */
    public onWalletChange(callback: (wallet: Wallet | null) => void) {
        this.walletChangeCallbacks.push(callback);
        
        // 如果已经连接，立即调用回调
        if (this.gameFi?.wallet) {
            callback(this.gameFi.wallet);
        }
    }

    /**
     * 移除钱包状态变化回调
     */
    public offWalletChange(callback: (wallet: Wallet | null) => void) {
        const index = this.walletChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.walletChangeCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知所有注册的回调
     */
    private notifyWalletChange(wallet: Wallet | null) {
        this.walletChangeCallbacks.forEach(callback => {
            try {
                callback(wallet);
            } catch (error) {
                console.error('钱包状态变化回调执行失败:', error);
            }
        });
    }

    /**
     * 初始化 GameFi（使用 TON Connect UI 实现，兼容官方 SDK API）
     */
    private async initGameFi() {
        if (this.isInitializing) {
            return;
        }
        
        // 如果已经初始化成功，不再重复初始化
        if (this.gameFi) {
            console.log('GameFi SDK 已经初始化，跳过重复初始化');
            return;
        }
        
        this.isInitializing = true;
        this.initError = null;
        
        // 添加整体超时机制（90秒，要大于 CDN 加载超时 60 秒）
        const initTimeout = setTimeout(() => {
            if (this.isInitializing) {
                this.isInitializing = false;
                this.initError = '初始化超时';
            }
        }, 90000);
        
        try {
            // 从 CDN 加载 TON Connect UI（带超时）
            await Promise.race([
                this.loadTonConnectUI(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('CDN 加载超时（60秒）')), 60000)
                )
            ]);
            
            // 等待 SDK 加载完成（Mac 上可能需要更长时间）
            // 使用更可靠的等待方式：检查 SDK 是否真正可用
            let waitCount = 0;
            const maxWait = 20; // 最多等待 2 秒
            const win = window as any;
            // 等待 TonConnectUI 加载完成（统一使用 UI 模式）
            while (waitCount < maxWait) {
                if (win.TonConnectUI || win.TonConnectUISDK) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            
            // 创建兼容 GameFi 接口的包装器（带超时）
            this.gameFi = await Promise.race([
                this.createGameFiWrapper(),
                new Promise<GameFi>((_, reject) => 
                    setTimeout(() => reject(new Error('创建包装器超时（10秒）')), 10000)
                )
            ]);
            
            // 恢复连接状态（带超时，可选操作，失败不影响初始化）
            try {
                const restoreConnection = (this.gameFi as any).restoreConnection;
                if (restoreConnection && typeof restoreConnection === 'function') {
                    await Promise.race([
                        restoreConnection(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('恢复连接超时')), 5000)
                        )
                    ]);
                }
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                if (errorMsg.includes('CORS') || errorMsg.includes('go-bridge')) {
                    console.log('恢复连接时遇到 CORS 限制（本地开发环境正常，生产环境不会有此问题）');
                } else if (errorMsg.includes('unpause') || errorMsg.includes('Resource recreation')) {
                    console.log('恢复连接时遇到 SDK 内部状态问题（不影响使用）:', errorMsg);
                } else {
                    console.warn('恢复连接失败（不影响使用）:', e);
                }
            }
            
            // 初始化完成后再监听钱包状态变化
            this.gameFi.onWalletChange((wallet: Wallet | null) => {
                this.notifyWalletChange(wallet);
            });
            
            clearTimeout(initTimeout);
            this.initError = null;
            console.log('✅ TON Connect 初始化成功！');
            
        } catch (error) {
            clearTimeout(initTimeout);
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.initError = errorMsg;
            console.error('❌ TON Connect 初始化失败:', errorMsg);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * 从 CDN 加载 TON Connect UI（从原文件复制，不修改）
     */
    private async loadTonConnectUI(): Promise<void> {
        return new Promise((resolve, reject) => {
            const win = window as any;
            
            // 如果已经加载，直接返回（统一使用 UI 模式）
            if (win.TonConnectUI || win.TonConnectUISDK) {
                resolve();
                return;
            }
            
            // 检查是否已经有脚本标签存在（避免重复加载）
            const existingScripts = Array.from(document.querySelectorAll('script[src*="tonconnect"]'));
            if (existingScripts.length > 0) {
                console.log('检测到已存在的 TON Connect 脚本标签，等待加载完成...');
                let checkCount = 0;
                const maxChecks = 50;
                const checkInterval = setInterval(() => {
                    checkCount++;
                    if (win.TonConnectUI || win.TonConnectUISDK) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        console.warn('等待已存在脚本加载超时，将尝试加载新脚本');
                    }
                }, 100);
                    if (win.TonConnectUI || win.TonConnectUISDK) {
                        return;
                    }
            }
            
                const startLoading = () => {
                if (win.TonConnectUI || win.TonConnectUISDK) {
                    win.__tonconnectUILoading = false;
                    resolve();
                    return;
                }
                
                win.__tonconnectUILoading = true;
            
                // 统一使用 UI 模式，只加载 UI 库，不加载 SDK 库
                const cdnUrls = [
                    'https://cdn.jsdelivr.net/npm/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js',
                    'https://unpkg.com/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js',
                ];
                
                let errorMessages: string[] = [];
                let loadedScripts: HTMLScriptElement[] = [];
                
                const tryLoadScript = (index: number) => {
                    if (index >= cdnUrls.length) {
                        loadedScripts.forEach(script => {
                            if (script.parentNode) {
                                script.parentNode.removeChild(script);
                            }
                        });
                        win.__tonconnectUILoading = false;
                        const errorMsg = `所有 CDN 源都加载失败\n\n尝试的 CDN:\n${cdnUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n\n错误信息:\n${errorMessages.join('\n')}\n\n可能原因:\n1. 网络连接问题\n2. CDN 服务不可用\n3. 防火墙或代理阻止访问`;
                        reject(new Error(errorMsg));
                        return;
                    }
                    
                    const url = cdnUrls[index];
                    const existingScript = document.querySelector(`script[src="${url}"]`);
                    if (existingScript) {
                        console.log(`脚本已存在: ${url}，跳过重复加载`);
                        let checkCount = 0;
                        const maxChecks = 30;
                        const checkInterval = setInterval(() => {
                            checkCount++;
                            if (win.TonConnectUI || win.TonConnectUISDK) {
                                clearInterval(checkInterval);
                                win.__tonconnectUILoading = false;
                                resolve();
                            } else if (checkCount >= maxChecks) {
                                clearInterval(checkInterval);
                                tryLoadScript(index + 1);
                            }
                        }, 100);
                        return;
                    }
                    
                    const script = document.createElement('script');
                    script.src = url;
                    // 关键修复：Mac 上必须使用 defer 而不是 async，确保脚本按顺序执行
                    script.async = false;
                    script.defer = false;
                    script.crossOrigin = 'anonymous';
                    script.type = 'text/javascript';
                    // 添加 integrity 和 referrerPolicy 以提高兼容性
                    script.referrerPolicy = 'no-referrer';
                    
                    let resolved = false;
                    let loadTimeout: any = null;
            
                    script.onload = () => {
                        if (resolved) return;
                        
                        // 清除加载超时
                        if (loadTimeout) {
                            clearTimeout(loadTimeout);
                            loadTimeout = null;
                        }
                        
                        // Mac 上需要更长的等待时间，因为脚本可能需要更多时间执行
                        // 使用递归检查而不是固定间隔，更可靠
                        const checkForSDK = (attempt: number = 0): void => {
                            if (resolved) return;
                            
                            const maxAttempts = 60; // 最多检查 60 次（30秒）
                            
                            // 检查所有可能的 SDK 位置
                            let found = false;
                            
                            // 直接检查
                            if (win.TonConnectUI || win.TONConnectUI || win.TonConnectUISDK) {
                                found = true;
                            }
                            
                            // 检查 TonConnectUISDK 的子属性
                            if (!found && win.TonConnectUISDK) {
                                if (win.TonConnectUISDK.TonConnectUI || win.TonConnectUISDK.default) {
                                    found = true;
                                }
                            }
                            
                            // 遍历 window 对象查找（只在必要时）
                            if (!found && attempt < maxAttempts) {
                                const allKeys = Object.keys(win);
                                for (const key of allKeys) {
                                    const keyLower = key.toLowerCase();
                                    if (keyLower.includes('tonconnect') || 
                                        (keyLower.includes('ton') && keyLower.includes('connect'))) {
                                        const value = win[key];
                                        if (typeof value === 'object' && value !== null) {
                                            if (value.TonConnectUI || 
                                                (value.default && typeof value.default === 'function')) {
                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if (found) {
                                resolved = true;
                                win.__tonconnectUILoading = false;
                                resolve();
                            } else if (attempt < maxAttempts) {
                                // 使用 requestAnimationFrame 或 setTimeout 继续检查
                                // Mac 上使用更短的间隔，但增加检查次数
                                setTimeout(() => checkForSDK(attempt + 1), 500);
                            } else {
                                // 检查超时，尝试下一个 CDN
                                resolved = true;
                                const debugInfo = this.getWindowDebugInfo(win);
                                errorMessages.push(`${url}: 脚本加载成功但未找到 TonConnectUI 构造函数（检查了${maxAttempts}次）\n调试信息: ${debugInfo}`);
                                if (script.parentNode) {
                                    script.parentNode.removeChild(script);
                                }
                                tryLoadScript(index + 1);
                            }
                        };
                        
                        // 立即开始检查，然后每 500ms 检查一次
                        // Mac 上脚本可能需要更多时间初始化
                        // 关键：使用 requestAnimationFrame 确保在下一帧检查（Mac 上更可靠）
                        if (typeof requestAnimationFrame !== 'undefined') {
                            requestAnimationFrame(() => {
                                setTimeout(() => checkForSDK(0), 100);
                            });
                        } else {
                            setTimeout(() => checkForSDK(0), 100);
                        }
                    };
                    
                    script.onerror = (error: any) => {
                        if (resolved) return;
                        resolved = true;
                        if (loadTimeout) {
                            clearTimeout(loadTimeout);
                            loadTimeout = null;
                        }
                        const errorMsg = error?.message || '加载失败';
                        errorMessages.push(`${url}: ${errorMsg}`);
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                        tryLoadScript(index + 1);
                    };
                    
                    // 设置加载超时（Mac 上可能需要更长时间）
                    loadTimeout = setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            errorMessages.push(`${url}: 脚本加载超时（30秒）`);
                            if (script.parentNode) {
                                script.parentNode.removeChild(script);
                            }
                            tryLoadScript(index + 1);
                        }
                    }, 30000);
                    
                    loadedScripts.push(script);
                    // 关键修复：确保脚本添加到正确位置
                    // Mac 上必须添加到 head，并且确保 DOM 已准备好
                    const appendScript = () => {
                        if (document.head) {
                            document.head.appendChild(script);
                        } else if (document.body) {
                            document.body.appendChild(script);
                        } else {
                            // 如果都不存在，等待 DOM 加载
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', () => {
                                    if (document.head) {
                                        document.head.appendChild(script);
                                    } else if (document.body) {
                                        document.body.appendChild(script);
                                    }
                                });
                            } else {
                                // 延迟添加，确保 DOM 完全准备好
                                setTimeout(() => {
                                    if (document.head) {
                                        document.head.appendChild(script);
                                    } else if (document.body) {
                                        document.body.appendChild(script);
                                    }
                                }, 100);
                            }
                        }
                    };
                    
                    // 确保在 DOM 准备好后添加脚本
                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                        appendScript();
                    } else {
                        window.addEventListener('load', appendScript, { once: true });
                        // 同时尝试立即添加（如果可能）
                        if (document.head || document.body) {
                            appendScript();
                        }
                    }
                };
                
                tryLoadScript(0);
            };
            
            if (win.__tonconnectUILoading) {
                let checkCount = 0;
                const maxChecks = 20;
                const checkInterval = setInterval(() => {
                    checkCount++;
                    if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                        clearInterval(checkInterval);
                        win.__tonconnectUILoading = false;
                        resolve();
                    } else if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        win.__tonconnectUILoading = false;
                        console.log('等待其他加载完成超时（2秒），将尝试自己加载');
                        startLoading();
                    }
                }, 100);
                return;
            }
            
            startLoading();
        });
    }

    /**
     * 创建兼容 GameFi 接口的包装器（从原文件复制，不修改）
     */
    private async createGameFiWrapper(): Promise<GameFi> {
        const win = window as any;
        
        // 统一使用 UI 模式，和 Windows 保持一致
        // 不再区分 Mac/iOS，所有平台都使用相同的 UI 模式
        let TonConnectUI: any = null;
        let debugInfo = '查找 TonConnectUI 构造函数:\n';
        
        if (win.TonConnectUI) {
            TonConnectUI = win.TonConnectUI;
            debugInfo += '- ✅ 找到 win.TonConnectUI\n';
        } else if (win.TONConnectUI) {
            TonConnectUI = win.TONConnectUI;
            debugInfo += '- ✅ 找到 win.TONConnectUI\n';
        } else if (win.TonConnectUISDK) {
            if (win.TonConnectUISDK.TonConnectUI) {
                TonConnectUI = win.TonConnectUISDK.TonConnectUI;
                debugInfo += '- ✅ 找到 win.TonConnectUISDK.TonConnectUI\n';
            } else if (win.TonConnectUISDK.default) {
                TonConnectUI = win.TonConnectUISDK.default;
                debugInfo += '- ✅ 找到 win.TonConnectUISDK.default\n';
            }
        }
        
        if (!TonConnectUI) {
            debugInfo += '- 遍历 window 对象查找...\n';
            const allKeys = Object.keys(win);
            const tonKeys = allKeys.filter(key => 
                key.toLowerCase().includes('ton') || 
                key.toLowerCase().includes('connect')
            );
            debugInfo += `- 找到 ${tonKeys.length} 个相关键: ${tonKeys.slice(0, 10).join(', ')}\n`;
            
            for (const key of tonKeys) {
                const value = win[key];
                if (typeof value === 'function') {
                    TonConnectUI = value;
                    debugInfo += `- ✅ 使用 ${key} 作为构造函数\n`;
                    break;
                } else if (typeof value === 'object' && value !== null) {
                    if (value.TonConnectUI) {
                        TonConnectUI = value.TonConnectUI;
                        debugInfo += `- ✅ 使用 ${key}.TonConnectUI\n`;
                        break;
                    } else if (value.default && typeof value.default === 'function') {
                        TonConnectUI = value.default;
                        debugInfo += `- ✅ 使用 ${key}.default\n`;
                        break;
                    }
                }
            }
        }
        
        if (!TonConnectUI) {
            // 统一使用 UI 模式，不再回退到 SDK 模式
            const errorMsg = `未找到 TonConnectUI 构造函数\n\n${debugInfo}\n\n请检查:\n1. CDN 脚本是否成功加载（@tonconnect/ui@2.0.1）\n2. 浏览器控制台是否有错误\n3. 网络连接是否正常\n4. 是否在 Telegram 环境中运行\n\n提示: 所有平台（Windows/Mac/iOS）都统一使用 UI 模式`;
            throw new Error(errorMsg);
        }
        
        // 验证 TonConnectUI 是否真的是构造函数
        // 如果不是构造函数，提供更详细的错误信息
        const isConstructor = typeof TonConnectUI === 'function' && 
                             (TonConnectUI.prototype && TonConnectUI.prototype.constructor === TonConnectUI);
        
        if (!isConstructor) {
            const tonConnectUIType = typeof TonConnectUI;
            const tonConnectUIValue = TonConnectUI ? String(TonConnectUI).substring(0, 100) : 'null/undefined';
            throw new Error(`TonConnectUI 不是构造函数\n\n调试信息:\n- 类型: ${tonConnectUIType}\n- 值: ${tonConnectUIValue}\n- 是否有 prototype: ${TonConnectUI && TonConnectUI.prototype ? '是' : '否'}\n\n可能原因:\n1. CDN 脚本加载不完整\n2. 脚本执行顺序问题\n3. 浏览器兼容性问题\n\n建议:\n1. 检查浏览器控制台是否有脚本加载错误\n2. 尝试刷新页面\n3. 检查网络连接\n4. 确认 CDN 可访问: https://cdn.jsdelivr.net/npm/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js`);
        }
        
        const manifestUrl = this.getManifestUrl();
        
        const uiConfig: any = {
            manifestUrl: manifestUrl
        };
        
        const customElements = (window as any).customElements;
        let tonConnectInstance: any = null;
        
        if (customElements && customElements.get('tc-root')) {
            console.log('检测到 "tc-root" 自定义元素已注册，TON Connect UI 可能已初始化');
            if (win.__tonConnectUIInstance) {
                console.log('找到全局 TON Connect UI 实例引用，检查实例是否可用...');
                const existingInstance = win.__tonConnectUIInstance;
                // 检查已存在的实例是否有必要的属性
                const hasModal = existingInstance.modal !== undefined && existingInstance.modal !== null;
                const hasConnector = existingInstance.connector !== undefined && existingInstance.connector !== null;
                const hasProvider = existingInstance.provider !== undefined && existingInstance.provider !== null;
                
                if (hasModal || hasConnector || hasProvider) {
                    console.log('已存在的实例可用，重用该实例');
                    tonConnectInstance = existingInstance;
                } else {
                    console.warn('已存在的实例缺少必要属性，尝试创建新实例');
                    // 不再切换到 SDK 模式，统一使用 UI 模式
                }
            } else {
                console.log('未找到已存在的 UI 实例，尝试创建新实例');
                // 不再切换到 SDK 模式，统一使用 UI 模式
            }
        }
        
        if (!tonConnectInstance) {
            try {
                // 等待 customElements 完全准备好（所有平台统一处理）
                if (typeof customElements !== 'undefined' && customElements.define) {
                    await new Promise(resolve => {
                        if (document.readyState === 'complete') {
                            resolve(undefined);
                        } else {
                            window.addEventListener('load', () => resolve(undefined), { once: true });
                            setTimeout(() => resolve(undefined), 1000);
                        }
                    });
                }
                
                // 统一使用 UI 模式，和 Windows 保持一致
                try {
                    tonConnectInstance = new TonConnectUI(uiConfig);
                    win.__tonConnectUIInstance = tonConnectInstance;
                } catch (constructorError) {
                    // 如果构造函数调用失败，抛出错误（不再自动切换到 SDK 模式）
                    const errorMsg = constructorError instanceof Error ? constructorError.message : String(constructorError);
                    throw new Error(`TonConnectUI 构造函数调用失败: ${errorMsg}`);
                }
                
                // 关键修复：检查实例是否真正初始化成功（iOS/移动设备上可能初始化不完整）
                // 等待一小段时间让实例完全初始化
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // 检查实例是否有必要的属性（modal、connector 或 provider）
                const hasModal = tonConnectInstance.modal !== undefined && tonConnectInstance.modal !== null;
                const hasConnector = tonConnectInstance.connector !== undefined && tonConnectInstance.connector !== null;
                const hasProvider = tonConnectInstance.provider !== undefined && tonConnectInstance.provider !== null;
                
                // 如果实例没有必要的属性，说明初始化失败，抛出错误
                if (!hasModal && !hasConnector && !hasProvider) {
                    throw new Error('TonConnectUI 实例初始化不完整（缺少 modal/connector/provider），请检查 CDN 脚本是否正确加载');
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                if (errorMsg.includes('tc-root') || errorMsg.includes('already been used') || errorMsg.includes('CustomElementRegistry')) {
                    console.warn('创建新实例失败（自定义元素已注册），尝试使用已存在的实例');
                    if (win.__tonConnectUIInstance) {
                        tonConnectInstance = win.__tonConnectUIInstance;
                        console.log('使用全局保存的实例');
                    } else {
                        throw new Error(`TON Connect UI 已初始化，无法创建新实例\n\n错误: ${errorMsg}\n\n可能原因:\n1. 页面刷新后脚本未完全清理\n2. 多次初始化 TON Connect UI\n\n建议:\n1. 刷新页面清除状态（推荐）\n2. 检查是否有多个组件同时初始化 TON Connect UI`);
                    }
                } else {
                    // 统一使用 UI 模式，不再自动回退到 SDK 模式
                    throw error;
                }
            }
        }
        
        const hasProvider = tonConnectInstance.provider !== undefined && tonConnectInstance.provider !== null;
        const hasModal = tonConnectInstance.modal !== undefined && tonConnectInstance.modal !== null;
        const hasConnector = tonConnectInstance.connector !== undefined && tonConnectInstance.connector !== null;
        
        if (hasProvider && !hasModal && !hasConnector) {
            return await this.createGameFiWrapperFromSDKInstance(tonConnectInstance);
        }
        
        if (tonConnectInstance.walletsList !== undefined && !hasModal && !hasConnector) {
            return await this.createGameFiWrapperFromSDKInstance(tonConnectInstance);
        }
        
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                const hasProvider = tonConnectInstance.provider !== undefined && tonConnectInstance.provider !== null;
                const hasModal = tonConnectInstance.modal !== undefined && tonConnectInstance.modal !== null;
                const hasConnector = tonConnectInstance.connector !== undefined && tonConnectInstance.connector !== null;
                
                // 方法1: 尝试使用 provider.connect (SDK 模式)
                if (hasProvider && !hasModal && !hasConnector) {
                    if (typeof tonConnectInstance.connect === 'function') {
                        try {
                            await tonConnectInstance.connect();
                            return;
                        } catch (e) {
                            console.warn('tonConnectInstance.connect() 失败，尝试其他方法:', e);
                        }
                    }
                    if (tonConnectInstance.provider && typeof tonConnectInstance.provider.connect === 'function') {
                        try {
                            await tonConnectInstance.provider.connect();
                            return;
                        } catch (e) {
                            console.warn('provider.connect() 失败，尝试其他方法:', e);
                        }
                    }
                }
                
                // 方法2: 尝试使用 modal.open (UI 模式)
                if (tonConnectInstance.modal && typeof tonConnectInstance.modal.open === 'function') {
                    try {
                        tonConnectInstance.modal.open();
                        return;
                    } catch (e) {
                        console.warn('modal.open() 失败，尝试其他方法:', e);
                    }
                }
                
                // 方法3: 尝试使用 connector (UI 模式)
                if (tonConnectInstance.connector) {
                    if (typeof tonConnectInstance.connector.connect === 'function') {
                        try {
                            await tonConnectInstance.connector.connect();
                            return;
                        } catch (e) {
                            console.warn('connector.connect() 失败，尝试其他方法:', e);
                        }
                    }
                    if (typeof tonConnectInstance.connector.openModal === 'function') {
                        try {
                            tonConnectInstance.connector.openModal();
                            return;
                        } catch (e) {
                            console.warn('connector.openModal() 失败，尝试其他方法:', e);
                        }
                    }
                }
                
                // 方法4: 尝试直接使用 open 方法
                if (typeof tonConnectInstance.open === 'function') {
                    try {
                        tonConnectInstance.open();
                        return;
                    } catch (e) {
                        console.warn('tonConnectInstance.open() 失败，尝试其他方法:', e);
                    }
                }
                
                // 方法5: 尝试使用 singleWalletModal
                if (tonConnectInstance.singleWalletModal && typeof tonConnectInstance.singleWalletModal.open === 'function') {
                    try {
                        tonConnectInstance.singleWalletModal.open();
                        return;
                    } catch (e) {
                        console.warn('singleWalletModal.open() 失败，尝试其他方法:', e);
                    }
                }
                
                // 方法6: 尝试使用 ui 属性 (某些版本的 TON Connect UI)
                if (tonConnectInstance.ui && typeof tonConnectInstance.ui.open === 'function') {
                    try {
                        tonConnectInstance.ui.open();
                        return;
                    } catch (e) {
                        console.warn('ui.open() 失败，尝试其他方法:', e);
                    }
                }
                
                // 方法7: 尝试使用 openModal 方法 (某些版本)
                if (typeof tonConnectInstance.openModal === 'function') {
                    try {
                        tonConnectInstance.openModal();
                        return;
                    } catch (e) {
                        console.warn('openModal() 失败，尝试其他方法:', e);
                    }
                }
                
                // 不再使用 SDK 模式作为备用方案，统一使用 UI 模式
                
                // 如果所有方法都失败，提供详细的错误信息
                const availableMethods = Object.keys(tonConnectInstance || {}).filter(key => 
                    typeof tonConnectInstance[key] === 'function'
                ).join(', ');
                const modalInfo = tonConnectInstance.modal ? `modal 方法: ${Object.keys(tonConnectInstance.modal || {}).join(', ')}` : 'modal 不存在';
                const connectorInfo = tonConnectInstance.connector ? `connector 方法: ${Object.keys(tonConnectInstance.connector || {}).join(', ')}` : 'connector 不存在';
                const providerInfo = tonConnectInstance.provider ? `provider 类型: ${typeof tonConnectInstance.provider}` : 'provider 不存在';
                const uiInfo = tonConnectInstance.ui ? `ui 方法: ${Object.keys(tonConnectInstance.ui || {}).join(', ')}` : 'ui 不存在';
                
                throw new Error(`无法打开连接界面\n\n可用方法: ${availableMethods}\n${modalInfo}\n${connectorInfo}\n${providerInfo}\n${uiInfo}\n\n提示: 检测到 SDK 实例，但连接方法不可用。请检查 TON Connect SDK 版本或尝试刷新页面。`);
            },
            
            disconnectWallet: async () => {
                if (tonConnectInstance.connector && typeof tonConnectInstance.connector.disconnect === 'function') {
                    await tonConnectInstance.connector.disconnect();
                } else if (typeof tonConnectInstance.disconnect === 'function') {
                    await tonConnectInstance.disconnect();
                } else {
                    throw new Error('无法断开连接');
                }
            },
            
            onWalletChange: (callback: (wallet: Wallet | null) => void) => {
                if (tonConnectInstance.connector && typeof tonConnectInstance.connector.onStatusChange === 'function') {
                    tonConnectInstance.connector.onStatusChange(async (wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        // 尝试直接获取用户友好格式的地址，如果没有则转换
                        const address = this.getUserFriendlyAddressFromWallet(wallet);
                        wrapper.walletAddress = address || await this.convertToUserFriendlyAddress(wallet?.account?.address);
                        callback(wrappedWallet);
                    });
                } else if (typeof tonConnectInstance.onStatusChange === 'function') {
                    tonConnectInstance.onStatusChange(async (wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        // 尝试直接获取用户友好格式的地址，如果没有则转换
                        const address = this.getUserFriendlyAddressFromWallet(wallet);
                        wrapper.walletAddress = address || await this.convertToUserFriendlyAddress(wallet?.account?.address);
                        callback(wrappedWallet);
                    });
                }
            }
        };
        
        (wrapper as any).restoreConnection = async () => {
            if (typeof tonConnectInstance.restoreConnection === 'function') {
                await tonConnectInstance.restoreConnection();
            }
            const wallet = tonConnectInstance.walletInfo || tonConnectInstance.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                // 异步转换地址格式
                wrapper.walletAddress = await this.convertToUserFriendlyAddress(wallet.account?.address);
            }
        };
        
        (wrapper as any)._tonConnectInstance = tonConnectInstance;
        
        return wrapper;
    }

    private async createGameFiWrapperFromSDKInstance(tonConnectInstance: any): Promise<GameFi> {
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                try {
                    if (typeof tonConnectInstance.connect === 'function') {
                        await tonConnectInstance.connect();
                        return;
                    }
                    if (tonConnectInstance.provider && typeof tonConnectInstance.provider.connect === 'function') {
                        await tonConnectInstance.provider.connect();
                        return;
                    }
                    const availableMethods = Object.keys(tonConnectInstance || {}).filter(key => 
                        typeof tonConnectInstance[key] === 'function'
                    ).join(', ');
                    throw new Error(`TonConnect SDK 没有可用的连接方法\n\n可用方法: ${availableMethods}\n\n提示: TonConnect SDK 使用 connect() 方法连接钱包`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    if (errorMsg.includes('jsBridgeKey') || errorMsg.includes('in operator')) {
                        throw new Error(`连接失败: ${errorMsg}\n\n提示: 请直接使用 connect() 方法，不要传递参数`);
                    }
                    throw new Error(`连接失败: ${errorMsg}`);
                }
            },
            
            disconnectWallet: async () => {
                if (typeof tonConnectInstance.disconnect === 'function') {
                    await tonConnectInstance.disconnect();
                } else {
                    throw new Error('无法断开连接');
                }
            },
            
            onWalletChange: (callback: (wallet: Wallet | null) => void) => {
                if (typeof tonConnectInstance.onStatusChange === 'function') {
                    tonConnectInstance.onStatusChange(async (wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        // 尝试直接获取用户友好格式的地址，如果没有则转换
                        const address = this.getUserFriendlyAddressFromWallet(wallet);
                        wrapper.walletAddress = address || await this.convertToUserFriendlyAddress(wallet?.account?.address);
                        callback(wrappedWallet);
                    });
                }
            }
        };
        
        (wrapper as any).restoreConnection = async () => {
            if (typeof tonConnectInstance.restoreConnection === 'function') {
                await tonConnectInstance.restoreConnection();
            }
            const wallet = tonConnectInstance.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                // 异步转换地址格式
                wrapper.walletAddress = await this.convertToUserFriendlyAddress(wallet.account?.address);
            }
        };
        
        (wrapper as any)._tonConnect = tonConnectInstance;
        
        if (tonConnectInstance.wallet) {
            wrapper.wallet = this.convertToWallet(tonConnectInstance.wallet);
            wrapper.walletAccount = tonConnectInstance.wallet.account;
            // 初始化时先使用同步转换，后续异步更新
            wrapper.walletAddress = this.convertToUserFriendlyAddressSync(tonConnectInstance.wallet.account?.address);
            // 异步转换并更新
            this.convertToUserFriendlyAddress(tonConnectInstance.wallet.account?.address).then(convertedAddress => {
                wrapper.walletAddress = convertedAddress;
            });
        }
        
        return wrapper;
    }

    private async createGameFiWrapperFromSDK(TonConnect: any): Promise<GameFi> {
        const manifestUrl = this.getManifestUrl();
        const config: any = {
            manifestUrl: manifestUrl
        };
        
        if (!manifestUrl || !manifestUrl.startsWith('http')) {
            throw new Error(`manifest URL 无效: ${manifestUrl}\n\n请确保 tonconnect-manifest.json 文件在服务器根目录可访问`);
        }
        
        let tonConnect: any;
        try {
            tonConnect = new TonConnect(config);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`创建 TonConnect 实例失败: ${errorMsg}\n\n请检查:\n1. manifest URL 是否正确: ${manifestUrl}\n2. manifest 文件是否可访问\n3. 网络连接是否正常`);
        }
        
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                try {
                    if (typeof tonConnect.connect === 'function') {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await tonConnect.connect();
                        return;
                    }
                    if (tonConnect.provider && typeof tonConnect.provider.connect === 'function') {
                        await tonConnect.provider.connect();
                        return;
                    }
                    throw new Error('TonConnect SDK 没有可用的连接方法');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    if (errorMsg.includes('jsBridgeKey') || errorMsg.includes('in operator')) {
                        if (tonConnect.provider && typeof tonConnect.provider.connect === 'function') {
                            try {
                                await tonConnect.provider.connect();
                                return;
                            } catch (providerError) {
                                throw new Error(`连接失败: ${errorMsg}\n\n这是 @tonconnect/sdk@3.3.1 在 Telegram Web App 中的已知 bug。\n\n建议:\n1. 尝试在普通浏览器中测试（非 Telegram 环境）\n2. 检查 manifest 文件: ${manifestUrl}\n3. 考虑使用 @tonconnect/ui@2.0.1（更适合 Telegram）\n4. 查看浏览器控制台的完整错误堆栈以获取更多信息`);
                            }
                        }
                        throw new Error(`连接失败: ${errorMsg}\n\n这是 @tonconnect/sdk@3.3.1 在 Telegram Web App 中的已知 bug。\n\n建议:\n1. 尝试在普通浏览器中测试（非 Telegram 环境）\n2. 检查 manifest 文件: ${manifestUrl}\n3. 考虑使用 @tonconnect/ui@2.0.1（更适合 Telegram）\n4. 查看浏览器控制台的完整错误堆栈以获取更多信息`);
                    }
                    const availableMethods = Object.keys(tonConnect || {}).filter(key => 
                        typeof tonConnect[key] === 'function'
                    ).join(', ');
                    throw new Error(`连接失败: ${errorMsg}\n\n可用方法: ${availableMethods}\n\n提示: TonConnect SDK 需要先获取钱包列表，然后连接`);
                }
            },
            
            disconnectWallet: async () => {
                await tonConnect.disconnect();
            },
            
            onWalletChange: (callback: (wallet: Wallet | null) => void) => {
                tonConnect.onStatusChange(async (wallet: any) => {
                    const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                    wrapper.wallet = wrappedWallet;
                    wrapper.walletAccount = wallet?.account || null;
                    // 尝试直接获取用户友好格式的地址，如果没有则转换
                    const address = this.getUserFriendlyAddressFromWallet(wallet);
                    wrapper.walletAddress = address || await this.convertToUserFriendlyAddress(wallet?.account?.address);
                    callback(wrappedWallet);
                });
            }
        };
        
        (wrapper as any).restoreConnection = async () => {
            await tonConnect.restoreConnection();
            const wallet = tonConnect.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                // 异步转换地址格式
                wrapper.walletAddress = await this.convertToUserFriendlyAddress(wallet.account?.address);
            }
        };
        
        (wrapper as any)._tonConnect = tonConnect;
        
        if (tonConnect.wallet) {
            wrapper.wallet = this.convertToWallet(tonConnect.wallet);
            wrapper.walletAccount = tonConnect.wallet.account;
            // 初始化时先使用同步转换，后续异步更新
            wrapper.walletAddress = this.convertToUserFriendlyAddressSync(tonConnect.wallet.account?.address);
            // 异步转换并更新
            this.convertToUserFriendlyAddress(tonConnect.wallet.account?.address).then(convertedAddress => {
                wrapper.walletAddress = convertedAddress;
            });
        }
        
        return wrapper;
    }

    private getWindowDebugInfo(win: any): string {
        const allKeys = Object.keys(win);
        const tonKeys = allKeys.filter(key => {
            const keyLower = key.toLowerCase();
            return keyLower.includes('ton') || keyLower.includes('connect');
        });
        return `Window 对象中的 TON 相关键 (${tonKeys.length} 个): ${tonKeys.slice(0, 20).join(', ')}`;
    }

    /**
     * 尝试从钱包对象中直接获取用户友好格式的地址
     * 某些钱包应用可能会在 wallet 对象中提供用户友好格式的地址
     */
    private getUserFriendlyAddressFromWallet(wallet: any): string | null {
        if (!wallet || !wallet.account) {
            return null;
        }
        
        const account = wallet.account;
        const address = account.address;
        
        // 如果地址已经是用户友好格式（UQ/EQ/0Q开头），直接返回
        if (address && (address.startsWith('UQ') || address.startsWith('EQ') || address.startsWith('0Q'))) {
            return address;
        }
        
        // 检查是否有其他属性包含用户友好格式的地址
        // 某些钱包可能提供 userFriendlyAddress、bounceableAddress 等属性
        if (account.userFriendlyAddress && (account.userFriendlyAddress.startsWith('UQ') || account.userFriendlyAddress.startsWith('EQ'))) {
            return account.userFriendlyAddress;
        }
        if (account.bounceableAddress && (account.bounceableAddress.startsWith('UQ') || account.bounceableAddress.startsWith('EQ'))) {
            return account.bounceableAddress;
        }
        if (wallet.userFriendlyAddress && (wallet.userFriendlyAddress.startsWith('UQ') || wallet.userFriendlyAddress.startsWith('EQ'))) {
            return wallet.userFriendlyAddress;
        }
        
        return null;
    }

    /**
     * 转换地址为用户友好格式（UQ/EQ开头）
     * 如果已经是UQ/EQ格式，直接返回；否则尝试转换
     */
    private async convertToUserFriendlyAddress(address: string | null | undefined): Promise<string | null> {
        if (!address) {
            return null;
        }
        
        // 如果已经是用户友好格式（UQ/EQ/0Q开头），直接返回
        if (address.startsWith('UQ') || address.startsWith('EQ') || address.startsWith('0Q')) {
            return address;
        }
        
        // 如果是raw格式（0: 或 -1: 开头），需要转换
        if (address.startsWith('0:') || address.startsWith('-1:')) {
            try {
                // 使用 TON API 转换地址格式
                const apiUrl = `https://tonapi.io/v2/accounts/${address}`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.address && (data.address.startsWith('UQ') || data.address.startsWith('EQ') || data.address.startsWith('0Q'))) {
                        return data.address;
                    }
                }
            } catch (error) {
                console.warn('地址格式转换失败:', error);
            }
        }
        
        // 如果转换失败，返回原地址（但会在显示时再次尝试转换）
        return address;
    }

    /**
     * 同步版本的地址转换（简化版，仅检查格式）
     */
    private convertToUserFriendlyAddressSync(address: string | null | undefined): string | null {
        if (!address) {
            return null;
        }
        
        // 如果已经是用户友好格式，直接返回
        if (address.startsWith('UQ') || address.startsWith('EQ') || address.startsWith('0Q')) {
            return address;
        }
        
        // 否则返回原地址（异步转换会在显示时进行）
        return address;
    }

    private convertToWallet(wallet: any): Wallet {
        return {
            account: {
                address: wallet.account?.address || '',
                chain: wallet.account?.chain || -239
            },
            device: wallet.device ? {
                appName: wallet.device.appName || '',
                appVersion: wallet.device.appVersion || '',
                maxProtocolVersion: wallet.device.maxProtocolVersion || 0,
                platform: wallet.device.platform || ''
            } : undefined
        };
    }

    private getManifestUrl(): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/tonconnect-manifest.json`;
    }

    private setupGlobalErrorHandlers() {
        // 设置全局未处理的 Promise 拒绝处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的 Promise 拒绝:', event.reason);
        });
    }
}

