// Telegram Wallet 测试 - 使用 TON Connect UI
// 参考官方 game-engines-sdk 的 API 设计: https://github.com/ton-org/game-engines-sdk
import { _decorator, Component, Button, Label, Node } from 'cc';
import { Sound } from '../Sound';
const { ccclass, property } = _decorator;

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

@ccclass('TelegramWalletTest')
export class TelegramWalletTest extends Component {
    
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
    successFrame:Node=null;
    successTimer=1;
    
    @property(Node)
    failFrame:Node=null;
    failTimer=1;

    private gameFi: GameFi | null = null;
    private isInitializing: boolean = false;
    private initError: string | null = null;
    //private isWalletNodeManuallyClosed: boolean = false; // 跟踪用户是否手动关闭了钱包弹窗

    async start() {
        // 设置全局错误处理
        this.setupGlobalErrorHandlers();
        
        // 默认隐藏 infoLabel
        //if (this.infoLabel) {
        //    this.infoLabel.node.active = false;
        //}
        
        // 默认隐藏 walletNode（只有在连接成功后才显示）
        if (this.walletNode) {
            this.walletNode.active = false;
        }
        
        if (this.connectBtn) {
            this.connectBtn.node.on(Button.EventType.CLICK, this.connectWallet, this);
        }
        
        if (this.disconnectBtn) {
            this.disconnectBtn.node.on(Button.EventType.CLICK, this.disconnectWallet, this);
        }
        
        // 初始化 GameFi SDK
        await this.initGameFi();
    }

    onDestroy() {
        // 清理资源
    }

    /**
     * 初始化 GameFi（使用 TON Connect UI 实现，兼容官方 SDK API）
     * 参考: https://github.com/ton-org/game-engines-sdk
     */
    private async initGameFi() {
        if (this.isInitializing) {
            this.showInfo('正在初始化中，请稍候...');
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
                const timeoutMsg = '初始化超时（90秒）\n\n可能原因:\n1. 网络连接缓慢\n2. CDN 无法访问\n3. 脚本加载失败\n\n建议:\n1. 检查网络连接\n2. 刷新页面重试\n3. 检查浏览器控制台错误';
                this.showInfo(timeoutMsg);
                this.initError = '初始化超时';
            }
        }, 90000);
        
        try {
            this.showInfo('正在加载 TON Connect UI...');
            
            // 跳过 CDN 测试，直接尝试加载（测试可能因为 CORS 失败，但不影响实际加载）
            // 从 CDN 加载 TON Connect UI（带超时）
            // 增加超时时间到 60 秒，因为需要尝试多个 CDN，每个最多 10 秒
            await Promise.race([
                this.loadTonConnectUI(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('CDN 加载超时（60秒）\n\n可能原因:\n1. 网络连接缓慢\n2. 所有 CDN 源都无法访问\n3. 防火墙或代理阻止访问\n\n建议:\n1. 检查网络连接\n2. 尝试刷新页面\n3. 检查浏览器控制台的详细错误')), 60000)
                )
            ]);
            
            // 等待 SDK 加载完成
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 创建兼容 GameFi 接口的包装器（带超时）
            this.gameFi = await Promise.race([
                this.createGameFiWrapper(),
                new Promise<GameFi>((_, reject) => 
                    setTimeout(() => reject(new Error('创建包装器超时（10秒）')), 10000)
                )
            ]);
            
            // 恢复连接状态（带超时，可选操作，失败不影响初始化）
            // 先恢复连接，再监听状态变化，避免在初始化完成前触发回调
            // 注意：只调用一次 restoreConnection()，避免重复调用导致错误
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
                // 恢复连接失败不影响初始化成功
                // 注意：在本地开发环境中，可能会遇到 CORS 错误（如 go-bridge.tomo.inc），这是正常的
                // 在生产环境（Telegram Web App）中不会有这个问题
                // 另外，如果遇到 "Cannot unpause connection" 错误，可能是 SDK 内部状态问题，不影响使用
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
                this.onWalletStatusChange(wallet);
            });
            
            clearTimeout(initTimeout);
            this.initError = null;
            this.showInfo('✅ TON Connect 初始化成功！');
            this.updateUI();
            
            // 3秒后隐藏提示
            setTimeout(() => {
                if (this.infoLabel && this.gameFi) {
                    this.infoLabel.node.active = false;
                }
            }, 3000);
            
        } catch (error) {
            clearTimeout(initTimeout);
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.initError = errorMsg;
            const fullErrorMsg = `❌ TON Connect 初始化失败\n\n错误: ${errorMsg}\n\n请检查:\n1. 网络连接是否正常\n2. CDN 是否可访问\n3. manifest 文件是否可访问\n4. 浏览器控制台是否有更多错误\n\n提示: 可以尝试刷新页面或重新初始化`;
            const copied = await this.copyToClipboard(fullErrorMsg);
            this.showInfo(fullErrorMsg + (copied ? '\n\n(错误信息已复制到剪贴板)' : '\n\n(无法自动复制，请手动复制错误信息)'));
        } finally {
            this.isInitializing = false;
        }
    }
    
    /**
     * 重新初始化 GameFi SDK（用于重试）
     */
    public async retryInit() {
        this.gameFi = null;
        this.initError = null;
        await this.initGameFi();
    }

    /**
     * 测试 CDN 可访问性
     */
    private async testCDNAccessibility(): Promise<{ accessible: boolean; details: string }> {
        const testUrls = [
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net/npm/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js'
        ];
        
        const results: string[] = [];
        let accessible = false;
        
        for (const url of testUrls) {
            try {
                const response = await fetch(url, { 
                    method: 'HEAD',
                    mode: 'no-cors' // 使用 no-cors 避免 CORS 错误
                });
                results.push(`✅ ${url}: 可访问`);
                accessible = true;
            } catch (error) {
                results.push(`❌ ${url}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        
        return {
            accessible,
            details: results.join('\n')
        };
    }

    /**
     * 从 CDN 加载 TON Connect UI
     */
    private async loadTonConnectUI(): Promise<void> {
        return new Promise((resolve, reject) => {
            const win = window as any;
            
            // 如果已经加载，直接返回
            if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                resolve();
                return;
            }
            
            // 检查是否已经有脚本标签存在（避免重复加载）
            const existingScripts = Array.from(document.querySelectorAll('script[src*="tonconnect"]'));
            if (existingScripts.length > 0) {
                // 如果已经有脚本标签，等待它们加载完成
                console.log('检测到已存在的 TON Connect 脚本标签，等待加载完成...');
                let checkCount = 0;
                const maxChecks = 50; // 最多等待5秒
                const checkInterval = setInterval(() => {
                    checkCount++;
                    if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        // 超时后继续尝试加载
                        console.warn('等待已存在脚本加载超时，将尝试加载新脚本');
                    }
                }, 100);
                if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                    return; // 如果已经加载，直接返回
                }
            }
            
            // 开始加载的函数（必须在检查之前定义，以便在超时回调中使用）
            const startLoading = () => {
                // 如果已经加载，直接返回
                if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                    win.__tonconnectUILoading = false;
                    resolve();
                    return;
                }
                
                win.__tonconnectUILoading = true;
            
            // 尝试从多个 CDN 加载
            // 优先使用 @tonconnect/ui（更适合 Telegram Web App）
            // 如果 UI 不可用，再尝试 @tonconnect/sdk
            const cdnUrls = [
                // 首先尝试 @tonconnect/ui（推荐，更适合 Telegram）
                'https://cdn.jsdelivr.net/npm/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js',
                'https://unpkg.com/@tonconnect/ui@2.0.1/dist/tonconnect-ui.min.js',
                // 然后尝试 @tonconnect/sdk（备用方案）
                'https://cdn.jsdelivr.net/npm/@tonconnect/sdk@3.3.1/dist/tonconnect-sdk.min.js',
                'https://unpkg.com/@tonconnect/sdk@3.3.1/dist/tonconnect-sdk.min.js',
            ];
            
            let errorMessages: string[] = [];
            let loadedScripts: HTMLScriptElement[] = [];
            
            const tryLoadScript = (index: number) => {
                if (index >= cdnUrls.length) {
                    // 清理已加载但失败的脚本
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
                
                // 检查是否已经有相同的脚本标签存在（避免重复加载）
                const existingScript = document.querySelector(`script[src="${url}"]`);
                if (existingScript) {
                    console.log(`脚本已存在: ${url}，跳过重复加载`);
                    // 如果脚本已存在，等待它加载完成
                    let checkCount = 0;
                    const maxChecks = 30; // 最多等待3秒
                    const checkInterval = setInterval(() => {
                        checkCount++;
                        if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                            clearInterval(checkInterval);
                            win.__tonconnectUILoading = false;
                            resolve();
                        } else if (checkCount >= maxChecks) {
                            clearInterval(checkInterval);
                            // 超时后尝试下一个 CDN
                            tryLoadScript(index + 1);
                        }
                    }, 100);
                    return;
                }
                
            const script = document.createElement('script');
                script.src = url;
                script.async = false;
            script.crossOrigin = 'anonymous';
                script.type = 'text/javascript';
                
                let resolved = false;
            
            script.onload = () => {
                    if (resolved) return;
                    
                    // 等待脚本执行，多次检查（因为可能需要更长时间）
                    let checkCount = 0;
                    const maxChecks = 30; // 最多检查 30 次（15秒，每 500ms 检查一次）
                    
                    const checkInterval = setInterval(() => {
                        checkCount++;
                        
                        // 检查多个可能的全局变量名和位置
                        let found = false;
                        let foundPath = '';
                        
                        // 直接检查（包括 TonConnect SDK）
                        if (win.TonConnectUI) {
                            found = true;
                            foundPath = 'win.TonConnectUI';
                        } else if (win.TONConnectUI) {
                            found = true;
                            foundPath = 'win.TONConnectUI';
                        } else if (win.TonConnect) {
                            // @tonconnect/sdk 的全局变量
                            found = true;
                            foundPath = 'win.TonConnect';
                        } else if (win.TonConnectSDK) {
                            // 另一个可能的 SDK 全局变量名
                            found = true;
                            foundPath = 'win.TonConnectSDK';
                        } else if (win.TonConnectUISDK) {
                            if (win.TonConnectUISDK.TonConnectUI) {
                                found = true;
                                foundPath = 'win.TonConnectUISDK.TonConnectUI';
                            } else if (win.TonConnectUISDK.default) {
                                found = true;
                                foundPath = 'win.TonConnectUISDK.default';
                            }
                        }
                        
                        // 检查所有可能的键
                        if (!found) {
                            const allKeys = Object.keys(win);
                            for (const key of allKeys) {
                                const keyLower = key.toLowerCase();
                                if ((keyLower.includes('tonconnect') || keyLower.includes('ton') && keyLower.includes('connect')) && 
                                    typeof win[key] === 'object' && win[key] !== null) {
                                    if (win[key].TonConnectUI) {
                                        found = true;
                                        foundPath = `win.${key}.TonConnectUI`;
                                        break;
                                    } else if (win[key].default && typeof win[key].default === 'function') {
                                        found = true;
                                        foundPath = `win.${key}.default`;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if (found) {
                            clearInterval(checkInterval);
                            resolved = true;
                            win.__tonconnectUILoading = false;
                            resolve();
                        } else if (checkCount >= maxChecks) {
                            clearInterval(checkInterval);
                            resolved = true;
                            // 脚本加载了但没有找到全局变量
                            const debugInfo = this.getWindowDebugInfo(win);
                            errorMessages.push(`${url}: 脚本加载成功但未找到 TonConnectUI 构造函数\n调试信息: ${debugInfo}`);
                            tryLoadScript(index + 1);
                        }
                    }, 500); // 每 500ms 检查一次
                };
                
                script.onerror = (error: any) => {
                    if (resolved) return;
                    resolved = true;
                    
                    const errorMsg = error?.message || '加载失败';
                    errorMessages.push(`${url}: ${errorMsg}`);
                    
                    // 移除失败的脚本
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                    
                    // 尝试下一个 CDN
                    tryLoadScript(index + 1);
                };
                
                // 设置超时（脚本加载超时）
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        errorMessages.push(`${url}: 脚本加载超时（20秒）`);
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                        tryLoadScript(index + 1);
                    }
                }, 20000); // 20秒超时（包括脚本加载和检查时间）
                
                loadedScripts.push(script);
                document.head.appendChild(script);
            };
            
            tryLoadScript(0);
            };
            
            // 检查是否正在加载（添加超时机制）
            // 如果检测到其他实例正在加载，等待一段时间，如果超时则自己尝试加载
            if (win.__tonconnectUILoading) {
                let checkCount = 0;
                const maxChecks = 20; // 最多等待2秒（进一步减少等待时间）
                const checkInterval = setInterval(() => {
                    checkCount++;
                    if (win.TonConnectUI || win.TonConnectUISDK || win.TonConnect) {
                        clearInterval(checkInterval);
                        win.__tonconnectUILoading = false;
                        resolve();
                    } else if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        // 超时后清除标志，继续自己尝试加载
                        win.__tonconnectUILoading = false;
                        console.log('等待其他加载完成超时（2秒），将尝试自己加载');
                        // 继续执行后续的加载逻辑
                        startLoading();
                    }
                }, 100);
                return; // 等待期间先返回，如果超时会调用 startLoading
            }
            
            // 如果没有检测到其他加载，直接开始加载
            startLoading();
        });
    }

    /**
     * 创建兼容 GameFi 接口的包装器
     */
    private async createGameFiWrapper(): Promise<GameFi> {
        const win = window as any;
        let TonConnectUI: any = null;
        let debugInfo = '查找 TonConnectUI 构造函数:\n';
        
        // 查找 TonConnectUI 构造函数（更广泛的搜索）
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
        
        // 如果还没找到，尝试遍历所有可能的键
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
        
        // 如果只有 TonConnect SDK，使用 SDK 模式
        if (!TonConnectUI) {
            // 检查是否有 TonConnect SDK
            if (win.TonConnect) {
                return await this.createGameFiWrapperFromSDK(win.TonConnect);
            } else if (win.TonConnectSDK && win.TonConnectSDK.TonConnect) {
                return await this.createGameFiWrapperFromSDK(win.TonConnectSDK.TonConnect);
            } else if (win.TonConnectSDK && win.TonConnectSDK.default) {
                return await this.createGameFiWrapperFromSDK(win.TonConnectSDK.default);
            }
        }
        
        if (!TonConnectUI) {
            const errorMsg = `未找到 TonConnectUI 或 TonConnect SDK\n\n${debugInfo}\n\n请检查:\n1. CDN 脚本是否成功加载\n2. 浏览器控制台是否有错误\n3. 网络连接是否正常\n\n提示: 代码会自动尝试使用 TonConnect SDK 作为备用方案`;
            throw new Error(errorMsg);
        }
        
        // 获取配置
        const manifestUrl = this.getManifestUrl();
        
        // 创建 TON Connect UI 实例
        // 重要：不要在配置中设置 twaReturnUrl 或任何 Telegram 相关配置
        // SDK 会自动检测 Telegram 环境并处理
        // 手动设置这些配置会导致 SDK 内部检查错误
        const uiConfig: any = {
            manifestUrl: manifestUrl
            // 不设置 buttonRootId，因为我们不使用自动创建的按钮
            // 如果设置了 buttonRootId，必须在 HTML 中创建对应的元素
        };
        
        // 完全移除所有 Telegram 相关配置，让 SDK 自动处理
        
        // 检查自定义元素是否已经注册（避免重复注册错误）
        const customElements = (window as any).customElements;
        let tonConnectInstance: any = null;
        
        if (customElements && customElements.get('tc-root')) {
            console.log('检测到 "tc-root" 自定义元素已注册，TON Connect UI 可能已初始化');
            
            // 尝试从全局变量中查找已存在的实例
            const win = window as any;
            
            // 方法1: 检查是否有全局实例引用
            if (win.__tonConnectUIInstance) {
                console.log('找到全局 TON Connect UI 实例引用，重用该实例');
                tonConnectInstance = win.__tonConnectUIInstance;
            } else {
                // 如果没有找到实例，直接使用 SDK 模式避免冲突
                console.log('未找到已存在的 UI 实例，切换到 TonConnect SDK 模式（避免自定义元素冲突）');
                if (win.TonConnect) {
                    return await this.createGameFiWrapperFromSDK(win.TonConnect);
                }
                // 如果 SDK 也不可用，继续尝试创建新实例（会失败，但会被捕获）
                console.warn('TonConnect SDK 不可用，尝试创建新 UI 实例（可能会失败）');
            }
        }
        
        // 如果没有找到已存在的实例，尝试创建新实例
        if (!tonConnectInstance) {
            try {
                tonConnectInstance = new TonConnectUI(uiConfig);
                // 保存实例引用以便后续重用
                const win = window as any;
                win.__tonConnectUIInstance = tonConnectInstance;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                // 如果是自定义元素重复注册的错误，尝试使用已存在的全局实例
                if (errorMsg.includes('tc-root') || errorMsg.includes('already been used') || errorMsg.includes('CustomElementRegistry')) {
                    console.warn('创建新实例失败（自定义元素已注册），尝试使用已存在的实例');
                    
                    // 尝试从全局变量获取
                    const win = window as any;
                    if (win.__tonConnectUIInstance) {
                        tonConnectInstance = win.__tonConnectUIInstance;
                        console.log('使用全局保存的实例');
                    } else {
                        // 如果找不到实例，尝试使用 SDK 模式作为备用方案
                        const win = window as any;
                        if (win.TonConnect) {
                            console.log('切换到 TonConnect SDK 模式（避免自定义元素冲突）');
                            return await this.createGameFiWrapperFromSDK(win.TonConnect);
                        }
                        
                        // 如果 SDK 也不可用，提供明确的错误信息
                        throw new Error(`TON Connect UI 已初始化，无法创建新实例\n\n错误: ${errorMsg}\n\n可能原因:\n1. 页面刷新后脚本未完全清理\n2. 多次初始化 TON Connect UI\n\n建议:\n1. 刷新页面清除状态（推荐）\n2. 检查是否有多个组件同时初始化 TON Connect UI\n3. 如果问题持续，考虑使用 TonConnect SDK 模式`);
                    }
                } else {
                    // 如果创建失败，可能是 SDK 模式
                    const win = window as any;
                    if (win.TonConnect) {
                        return await this.createGameFiWrapperFromSDK(win.TonConnect);
                    }
                    throw error;
                }
            }
        }
        
        // 检查创建的对象类型
        // 如果是 SDK 实例（有 provider 但没有 modal/connector），使用 SDK 模式
        const hasProvider = tonConnectInstance.provider !== undefined && tonConnectInstance.provider !== null;
        const hasModal = tonConnectInstance.modal !== undefined && tonConnectInstance.modal !== null;
        const hasConnector = tonConnectInstance.connector !== undefined && tonConnectInstance.connector !== null;
        
        if (hasProvider && !hasModal && !hasConnector) {
            // 这是 SDK 实例，使用 SDK 模式创建包装器
            return await this.createGameFiWrapperFromSDKInstance(tonConnectInstance);
        }
        
        // 额外检查：如果对象有 walletsList 属性（SDK 的特征），也使用 SDK 模式
        if (tonConnectInstance.walletsList !== undefined && !hasModal && !hasConnector) {
            return await this.createGameFiWrapperFromSDKInstance(tonConnectInstance);
        }
        
        // 创建兼容 GameFi 接口的包装器（UI 模式）
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                // 再次检查是否是 SDK 实例（可能在运行时才确定）
                const hasProvider = tonConnectInstance.provider !== undefined && tonConnectInstance.provider !== null;
                const hasModal = tonConnectInstance.modal !== undefined && tonConnectInstance.modal !== null;
                const hasConnector = tonConnectInstance.connector !== undefined && tonConnectInstance.connector !== null;
                
                // 如果是 SDK 实例，使用 SDK 的连接方法
                if (hasProvider && !hasModal && !hasConnector) {
                    // TonConnect SDK 使用 connect() 方法，不是 connectWallet()
                    if (typeof tonConnectInstance.connect === 'function') {
                        await tonConnectInstance.connect();
                        return;
                    } else if (tonConnectInstance.provider && typeof tonConnectInstance.provider.connect === 'function') {
                        await tonConnectInstance.provider.connect();
                        return;
                    }
                }
                
                // UI 模式的方法
                // 方法1: 尝试使用 modal.open()
                if (tonConnectInstance.modal && typeof tonConnectInstance.modal.open === 'function') {
                    tonConnectInstance.modal.open();
                    return;
                }
                
                // 方法2: 尝试使用 connector.connect()
                if (tonConnectInstance.connector) {
                    if (typeof tonConnectInstance.connector.connect === 'function') {
                        await tonConnectInstance.connector.connect();
                        return;
                    } else if (typeof tonConnectInstance.connector.openModal === 'function') {
                        tonConnectInstance.connector.openModal();
                        return;
                    }
                }
                
                // 方法3: 尝试直接调用 open()
                if (typeof tonConnectInstance.open === 'function') {
                    tonConnectInstance.open();
                    return;
                }
                
                // 方法4: 尝试使用 singleWalletModal
                if (tonConnectInstance.singleWalletModal && typeof tonConnectInstance.singleWalletModal.open === 'function') {
                    tonConnectInstance.singleWalletModal.open();
                    return;
                }
                
                // 如果所有方法都失败，提供详细错误信息
                const availableMethods = Object.keys(tonConnectInstance || {}).join(', ');
                const modalInfo = tonConnectInstance.modal ? `modal 方法: ${Object.keys(tonConnectInstance.modal || {}).join(', ')}` : 'modal 不存在';
                const connectorInfo = tonConnectInstance.connector ? `connector 方法: ${Object.keys(tonConnectInstance.connector || {}).join(', ')}` : 'connector 不存在';
                const providerInfo = tonConnectInstance.provider ? `provider 类型: ${typeof tonConnectInstance.provider}` : 'provider 不存在';
                throw new Error(`无法打开连接界面\n\n可用方法: ${availableMethods}\n${modalInfo}\n${connectorInfo}\n${providerInfo}\n\n提示: 检测到 SDK 实例，但连接方法不可用`);
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
                    tonConnectInstance.connector.onStatusChange((wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        wrapper.walletAddress = wallet?.account?.address || null;
                        callback(wrappedWallet);
                    });
                } else if (typeof tonConnectInstance.onStatusChange === 'function') {
                    tonConnectInstance.onStatusChange((wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        wrapper.walletAddress = wallet?.account?.address || null;
                        callback(wrappedWallet);
                    });
                }
            }
        };
        
        // 添加 restoreConnection 方法
        (wrapper as any).restoreConnection = async () => {
            if (typeof tonConnectInstance.restoreConnection === 'function') {
                await tonConnectInstance.restoreConnection();
            }
            // 更新初始状态
            const wallet = tonConnectInstance.walletInfo || tonConnectInstance.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                wrapper.walletAddress = wallet.account?.address || null;
            }
        };
        
        // 保存 tonConnectInstance 实例以便后续使用
        (wrapper as any)._tonConnectInstance = tonConnectInstance;
        
        return wrapper;
    }

    /**
     * 使用已创建的 SDK 实例创建 GameFi 包装器
     */
    private async createGameFiWrapperFromSDKInstance(tonConnectInstance: any): Promise<GameFi> {
        // 注意：不在这里调用 restoreConnection()，避免重复调用
        // restoreConnection() 会在初始化时统一调用一次
        
        // 创建兼容 GameFi 接口的包装器
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                // 使用 SDK 的连接方法
                // TonConnect SDK 使用 connect() 方法，不是 connectWallet()
                try {
                    // 方法1: 直接使用 connect() 方法（会自动显示钱包选择界面）
                    // connect() 方法不需要参数，它会自动处理钱包选择
                    if (typeof tonConnectInstance.connect === 'function') {
                        await tonConnectInstance.connect();
                        return;
                    }
                    
                    // 方法2: 检查 provider 是否有连接方法
                    if (tonConnectInstance.provider && typeof tonConnectInstance.provider.connect === 'function') {
                        await tonConnectInstance.provider.connect();
                        return;
                    }
                    
                    // 如果所有方法都失败
                    const availableMethods = Object.keys(tonConnectInstance || {}).filter(key => 
                        typeof tonConnectInstance[key] === 'function'
                    ).join(', ');
                    throw new Error(`TonConnect SDK 没有可用的连接方法\n\n可用方法: ${availableMethods}\n\n提示: TonConnect SDK 使用 connect() 方法连接钱包`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    // 如果是 jsBridgeKey 相关的错误，提供更明确的提示
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
                    tonConnectInstance.onStatusChange((wallet: any) => {
                        const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                        wrapper.wallet = wrappedWallet;
                        wrapper.walletAccount = wallet?.account || null;
                        wrapper.walletAddress = wallet?.account?.address || null;
                        callback(wrappedWallet);
                    });
                }
            }
        };
        
        // 添加 restoreConnection 方法
        (wrapper as any).restoreConnection = async () => {
            if (typeof tonConnectInstance.restoreConnection === 'function') {
                await tonConnectInstance.restoreConnection();
            }
            const wallet = tonConnectInstance.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                wrapper.walletAddress = wallet.account?.address || null;
            }
        };
        
        // 保存 tonConnectInstance
        (wrapper as any)._tonConnect = tonConnectInstance;
        
        // 初始化状态
        if (tonConnectInstance.wallet) {
            wrapper.wallet = this.convertToWallet(tonConnectInstance.wallet);
            wrapper.walletAccount = tonConnectInstance.wallet.account;
            wrapper.walletAddress = tonConnectInstance.wallet.account?.address || null;
        }
        
        return wrapper;
    }

    /**
     * 使用 TonConnect SDK 创建 GameFi 包装器（当 UI 不可用时）
     */
    private async createGameFiWrapperFromSDK(TonConnect: any): Promise<GameFi> {
        const manifestUrl = this.getManifestUrl();
        const win = window as any;
        const isTelegramEnv = typeof win.Telegram !== 'undefined' && win.Telegram.WebApp;
        
        // 创建 TonConnect 实例
        // 重要：不要在配置中设置 twaReturnUrl，这会导致 SDK 内部检查错误
        // SDK 会自动检测 Telegram 环境并处理
        const config: any = {
            manifestUrl: manifestUrl
        };
        
        // 确保 manifestUrl 是有效的 URL
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
        
        // 注意：不在这里调用 restoreConnection()，避免重复调用
        // restoreConnection() 会在初始化时统一调用一次
        
        // 创建兼容 GameFi 接口的包装器
        const wrapper: GameFi = {
            wallet: null,
            walletAccount: null,
            walletAddress: null,
            
            connectWallet: async () => {
                // 使用 SDK 的连接方法
                // TonConnect SDK 的连接流程：先获取钱包列表，然后连接
                try {
                    // 方法1: 直接使用 connect() 方法（不传递参数）
                    // 根据官方文档，connect() 可以不传参数，会自动显示钱包选择界面
                    if (typeof tonConnect.connect === 'function') {
                        // 不传递任何参数，让 SDK 自动处理
                        // 添加延迟，确保 SDK 完全准备好
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await tonConnect.connect();
                        return;
                    }
                    
                    // 方法2: 如果 connect() 失败，不再尝试传递参数
                    // 根据错误信息，connect() 不应该传递任何参数
                    // 如果 connect() 失败，可能是初始化配置问题
                    
                    // 方法3: 尝试使用 provider
                    if (tonConnect.provider && typeof tonConnect.provider.connect === 'function') {
                        await tonConnect.provider.connect();
                        return;
                    }
                    
                    throw new Error('TonConnect SDK 没有可用的连接方法');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    // 如果是 jsBridgeKey 相关的错误，说明 SDK 内部检查失败
                    // 这是 @tonconnect/sdk@3.3.1 在 Telegram Web App 中的已知问题
                    if (errorMsg.includes('jsBridgeKey') || errorMsg.includes('in operator')) {
                        // 尝试使用备用方法：通过 provider 连接
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
                tonConnect.onStatusChange((wallet: any) => {
                    const wrappedWallet = wallet ? this.convertToWallet(wallet) : null;
                    wrapper.wallet = wrappedWallet;
                    wrapper.walletAccount = wallet?.account || null;
                    wrapper.walletAddress = wallet?.account?.address || null;
                    callback(wrappedWallet);
                });
            }
        };
        
        // 添加 restoreConnection 方法
        (wrapper as any).restoreConnection = async () => {
            await tonConnect.restoreConnection();
            const wallet = tonConnect.wallet;
            if (wallet) {
                wrapper.wallet = this.convertToWallet(wallet);
                wrapper.walletAccount = wallet.account;
                wrapper.walletAddress = wallet.account?.address || null;
            }
        };
        
        // 保存 tonConnect 实例
        (wrapper as any)._tonConnect = tonConnect;
        
        // 初始化状态
        if (tonConnect.wallet) {
            wrapper.wallet = this.convertToWallet(tonConnect.wallet);
            wrapper.walletAccount = tonConnect.wallet.account;
            wrapper.walletAddress = tonConnect.wallet.account?.address || null;
        }
        
        return wrapper;
    }

    /**
     * 获取 window 对象的调试信息
     */
    private getWindowDebugInfo(win: any): string {
        const allKeys = Object.keys(win);
        const tonKeys = allKeys.filter(key => {
            const keyLower = key.toLowerCase();
            return keyLower.includes('ton') || keyLower.includes('connect');
        });
        
        return `Window 对象中的 TON 相关键 (${tonKeys.length} 个): ${tonKeys.slice(0, 20).join(', ')}`;
    }

    /**
     * 转换 TON Connect 钱包格式到 GameFi 钱包格式
     */
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

    /**
     * 连接钱包
     */
    private async connectWallet() {
        if (!this.gameFi) {
            let errorMsg = 'GameFi SDK 未初始化\n\n';
            
            if (this.isInitializing) {
                errorMsg += '正在初始化中，请稍候...\n\n';
                errorMsg += '提示: 初始化可能需要一些时间，请稍候再试';
                this.showInfo(errorMsg);
                return;
            } else if (this.initError) {
                errorMsg += `初始化失败: ${this.initError}\n\n`;
                errorMsg += '建议:\n';
                errorMsg += '1. 检查网络连接\n';
                errorMsg += '2. 刷新页面重试\n';
                errorMsg += '3. 检查浏览器控制台的错误信息\n';
                errorMsg += '4. 确认 manifest 文件可访问';
            } else {
                errorMsg += '初始化未完成或失败\n\n';
                errorMsg += '请检查:\n';
                errorMsg += '1. 网络连接是否正常\n';
                errorMsg += '2. CDN 是否可访问\n';
                errorMsg += '3. 浏览器控制台是否有错误';
            }
            
            const copied = await this.copyToClipboard(errorMsg);
            this.showInfo(errorMsg + (copied ? '\n\n(错误信息已复制到剪贴板)' : '\n\n(无法自动复制，请手动复制错误信息)'));
            
            // 如果初始化失败，提供重试选项
            if (!this.isInitializing && this.initError) {
                setTimeout(() => {
                    if (this.infoLabel) {
                        const retryMsg = this.infoLabel.string + '\n\n提示: 可以尝试刷新页面或等待自动重试';
                        this.showInfo(retryMsg);
                    }
                }, 2000);
            }
            
            return;
        }
        
        // 如果钱包已连接，只显示钱包地址框，不弹出TG连接弹窗
        if (this.gameFi?.wallet && this.walletNode) {
            this.walletNode.active = true;
            return; // 已连接时直接返回，不执行后续的连接逻辑
        }
        
        // 如果未连接，弹出TG连接弹窗
        try {
            // 使用 GameFi SDK 连接钱包（会弹出连接弹窗）
            await this.gameFi.connectWallet();
            
            // 连接请求已发送，等待用户选择钱包
            // 状态变化会通过 onWalletChange 回调通知
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const fullErrorMsg = `连接钱包失败: ${errorMsg}`;
            const copied = await this.copyToClipboard(fullErrorMsg);
            this.showInfo(fullErrorMsg + (copied ? '\n\n(错误信息已复制到剪贴板)' : '\n\n(无法自动复制，请手动复制错误信息)'));
            this.updateUI();
        }
    }

    /**
     * 断开钱包
     */
    private async disconnectWallet() {
        if (!this.gameFi) {
            return;
        }
        
        try {
            await this.gameFi.disconnectWallet();
            this.showInfo('钱包已断开');
            // 断开连接后直接隐藏钱包地址弹窗（不调用 walletHide，因为它是切换状态）
            if (this.walletNode) {
                this.walletNode.active = false;
            }
            this.updateUI();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const fullErrorMsg = `断开失败: ${errorMsg}`;
            const copied = await this.copyToClipboard(fullErrorMsg);
            this.showInfo(fullErrorMsg + (copied ? '\n\n(错误信息已复制到剪贴板)' : '\n\n(无法自动复制，请手动复制错误信息)'));
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
        // 如果 gameFi 未初始化，不更新 UI
        if (!this.gameFi) {
            return;
        }
        
        const wallet = this.gameFi.wallet;
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
                // this.addressLabel.string = '';
            }
        }
        
        // 在 connectLabel 中显示钱包地址（前四位和后四位）或 "connect wallet"
        if (this.connectLabel) {
            if (isConnected && wallet && wallet.account && wallet.account.address) {
                const address = wallet.account.address;
                // 使用 getShortAddress 方法获取短地址（会自动处理格式转换）
                const shortAddress = this.getShortAddress(address, 4, 4);
                this.connectLabel.string = shortAddress;
            } else {
                // 未连接时显示 "connect wallet"
                this.connectLabel.string = 'connect wallet';
            }
        }
    }

    /**
     * 获取当前连接的钱包地址
     * @param format 地址格式：'raw' | 'bounceable' | 'user-friendly'（默认）
     */
    public getWalletAddress(format: 'raw' | 'bounceable' | 'user-friendly' = 'user-friendly'): string | null {
        const address = this.gameFi?.walletAddress || null;
        if (!address) {
            return null;
        }

        // 如果已经是用户友好格式（UQ/EQ开头），直接返回
        if (address.startsWith('UQ') || address.startsWith('EQ') || address.startsWith('0Q')) {
            if (format === 'raw') {
                // 需要转换为 raw 格式（这里简化处理，实际需要解码）
                return address;
            }
            return address;
        }

        // 如果是 raw 格式（0: 或 -1: 开头），转换为用户友好格式
        if (address.startsWith('0:') || address.startsWith('-1:')) {
            if (format === 'raw') {
                return address;
            }
            // 转换为 bounceable 格式（同步版本，简化处理）
            return this.convertToBounceableAddressSync(address);
        }

        return address;
    }

    /**
     * 异步获取用户友好的地址格式（使用 API 转换）
     */
    public async getWalletAddressAsync(format: 'raw' | 'bounceable' | 'user-friendly' = 'user-friendly'): Promise<string | null> {
        const address = this.gameFi?.walletAddress || null;
        if (!address) {
            return null;
        }

        // 如果已经是用户友好格式，直接返回
        if (address.startsWith('UQ') || address.startsWith('EQ') || address.startsWith('0Q')) {
            if (format === 'raw') {
                return address;
            }
            return address;
        }

        // 如果是 raw 格式，使用 API 转换
        if (address.startsWith('0:') || address.startsWith('-1:')) {
            if (format === 'raw') {
                return address;
            }
            return await this.convertToBounceableAddress(address);
        }

        return address;
    }

    /**
     * 将 raw 格式地址转换为 bounceable 格式（用户友好格式）
     * @param rawAddress raw 格式地址，例如 "0:d6...95f8"
     * @returns bounceable 格式地址，例如 "UQDW...-J18"
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
                        return data.address;
                    }
                }
            } catch (apiError) {
                console.warn('使用 API 转换地址失败，尝试本地转换:', apiError);
            }

            // 如果 API 失败，尝试本地转换（简化版本）
            // 注意：完整的转换需要使用 @ton/core 库
            const parts = rawAddress.split(':');
            if (parts.length === 2) {
                const workchain = parseInt(parts[0]);
                const addressHex = parts[1].replace(/\.\.\./g, ''); // 移除省略号
                
                // 简化的 Base64 编码（这不是完整的 TON 地址编码）
                // 实际项目中应该使用 TON SDK
                if (addressHex.length === 64) {
                    // 这是一个完整的地址，但由于没有 TON 库，返回原地址
                    // 建议：安装 @ton/core 库进行完整转换
                    console.warn('地址格式转换需要 TON SDK，返回原地址。建议安装 @ton/core 库');
                    return rawAddress;
                }
            }

            return rawAddress;
        } catch (error) {
            console.warn('地址格式转换失败，返回原地址:', error);
            return rawAddress;
        }
    }

    /**
     * 同步版本的地址转换（如果地址已经是 bounceable 格式，直接返回）
     */
    private convertToBounceableAddressSync(rawAddress: string): string {
        // 如果已经是 bounceable 格式，直接返回
        if (rawAddress.startsWith('UQ') || rawAddress.startsWith('EQ') || rawAddress.startsWith('0Q')) {
            return rawAddress;
        }
        
        // 如果是 raw 格式，返回原地址（完整转换需要异步 API 调用）
        // 在实际使用中，建议使用异步版本或 TON SDK
        return rawAddress;
    }

    /**
     * 获取用户友好的地址格式（短地址显示）
     * @param address 完整地址
     * @param startLength 开头显示长度（默认4）
     * @param endLength 结尾显示长度（默认4）
     */
    public getShortAddress(address: string | null, startLength: number = 4, endLength: number = 4): string {
        if (!address) {
            return '';
        }

        // 如果是 raw 格式，使用同步转换（简化处理）
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
     * 检查是否已连接
     */
    public isWalletConnected(): boolean {
        return !!(this.gameFi?.wallet);
    }

    /**
     * 显示信息
     */
    private showInfo(message: string) {
        if (this.infoLabel) {
            this.infoLabel.string = message;
            this.infoLabel.node.active = true;
        }
    }

    /**
     * 复制文本到剪贴板
     */
    private async copyToClipboard(text: string): Promise<boolean> {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                await navigator.clipboard.writeText(text);
                    return true;
                } catch (clipboardError: any) {
                    if (clipboardError.name !== 'NotAllowedError') {
                        throw clipboardError;
                    }
                }
            }
            
            // 备用方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (e) {
            document.body.removeChild(textArea);
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * 设置全局错误处理
     */
    private setupGlobalErrorHandlers() {
        window.addEventListener('unhandledrejection', async (event: PromiseRejectionEvent) => {
            const error = event.reason;
            const errorMsg = error?.message || String(error);

            // 忽略已知的非关键错误
            if (errorMsg.includes('Access to storage is not allowed') || 
                errorMsg.includes('storage')) {
                event.preventDefault();
                return;
            }
            if (errorMsg.includes('slice') && errorMsg.includes('undefined')) {
                event.preventDefault();
                return;
            }
            
            // 其他错误显示并复制到剪贴板
            const fullErrorMsg = `未处理的错误:\n${errorMsg}\n\n错误对象: ${String(error)}`;
            await this.copyToClipboard(fullErrorMsg);
            this.showInfo(fullErrorMsg + '\n\n(错误信息已复制到剪贴板)');
        });
    }

    /**
     * 获取 manifest URL
     */
    private getManifestUrl(): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/tonconnect-manifest.json`;
    }

    copy(){
        Sound.instance.buttonAudio.play();
        if (navigator.clipboard && navigator.clipboard.writeText) {
             navigator.clipboard.writeText(this.addressLabel.string)
                 .then(() => {
                     console.log('链接复制成功: ');
                     
                     this.successFrame.active=true;
                     // 这里可以触发复制成功的UI反馈（例如提示文字）
                 })
                 .catch(err => {
                     console.error('复制失败，尝试备用方法: ', err);
                     this.fallbackCopyTextToClipboard();
                 });
         } else {
             // 备用复制方法
             this.fallbackCopyTextToClipboard();
         } 
     }

     
    fallbackCopyTextToClipboard() {

        // 创建一个临时的 input 元素

        const textArea = document.createElement("textarea");
        textArea.value = this.addressLabel.string;
        textArea.style.position = "fixed"; // 避免触发滚动
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select(); // 选中文本
        textArea.setSelectionRange(0, 99999); // 移动端兼容

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('链接复制成功 (备用方法): ');
                this.successFrame.active=true;
            } else {
                console.error('备用复制方法失败');
                    this.failFrame.active=true;
            }
        } catch (err) {
            console.error('备用复制方法出错: ', err);
        }
        
        document.body.removeChild(textArea);
        
    }

    walletHide(){
        Sound.instance.buttonAudio.play();
        this.walletNode.active = !this.walletNode.active;
    }

    update(deltaTime: number) {
        if(this.successFrame && this.successFrame.active){
            if(this.successTimer>0){
                this.successTimer-=deltaTime;
            }
            else{
                this.successFrame.active=false;
                this.successTimer=1;
            }
        }
        
        if(this.failFrame && this.failFrame.active){
            if(this.failTimer>0){
                this.failTimer-=deltaTime;
            }
            else{
                this.failFrame.active=false;
                this.failTimer=1;
            }
        }
    }
}