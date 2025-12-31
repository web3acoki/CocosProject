import { _decorator, Component, Node, Button, director, WebView, sys } from 'cc';
import { Sound } from './Sound';
import { Manager } from './Manager';
import { Entry } from './Entry';
const { ccclass, property } = _decorator;

// 单例类
@ccclass('PrivyLoad')
export class PrivyLoad extends Component {
    private static instance: PrivyLoad | null = null;

    // Privy 登录 URL 配置
    // 设置为 true 使用正式版，false 使用测试版
    public static useProductionUrl: boolean = true;
    
    // 正式版 URL
    private static readonly PRODUCTION_URL: string = "https://game.xdiving.io/privy-connect";
    // 测试版 URL
    private static readonly TEST_URL: string = "https://unrenounceable-promiscuously-cathie.ngrok-free.dev";
    
    /**
     * 获取 Privy 登录 URL
     */
    public static getPrivyLoginUrl(): string {
        return PrivyLoad.useProductionUrl ? PrivyLoad.PRODUCTION_URL : PrivyLoad.TEST_URL;
    }

    // Privy 相关代码已注释
    // private privy: PrivyType | null = null;
    // private PrivyClass: any = null;
    // private LocalStorageClass: any = null;
    // private iframe: HTMLIFrameElement | null = null;
    // private messageListener: ((e: MessageEvent) => void) | null = null;
    // private readonly appId: string = 'cmjksvwjy05n3l40c0s99jnse';
    // private readonly clientId: string = 'YOUR_PRIVY_CLIENT_ID';
    // private readonly useCDN: boolean = true;
    // private readonly cdnUrl: string = 'https://cdn.jsdelivr.net/npm/@privy-io/js-sdk-core@latest/dist/index.js';
    // private readonly supportedChains: any = [...];

    //@property(Entry)
    //entry: Entry = null;

    @property(Node)
    telegramLoginButton: Node = null;

    @property(WebView)
    webView: WebView = null;

    @property(Node)
    closeWebViewButton: Node = null;

    // 充值相关回调函数
    private depositCallback: ((result: any) => void) | null = null;


    /**
     * 获取单例实例
     */
    public static getInstance(): PrivyLoad | null {
        return PrivyLoad.instance;
    }

    onLoad() {
        // 设置单例
        if (PrivyLoad.instance === null) {
            PrivyLoad.instance = this;
            director.addPersistRootNode(this.node);
        } else if (PrivyLoad.instance !== this) {
            this.destroy();
            return;
        }

        // 在 Web 环境下，监听浏览器全局消息
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleWebMessage.bind(this));
        }

        // Privy 初始化已注释
        // this.initPrivy();
    }

    onDestroy() {
        // Privy 清理代码已注释
        // if (this.messageListener) {
        //     window.removeEventListener('message', this.messageListener);
        //     this.messageListener = null;
        // }
        // if (this.iframe && this.iframe.parentNode) {
        //     this.iframe.parentNode.removeChild(this.iframe);
        //     this.iframe = null;
        // }

        // 清理全局消息监听
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleWebMessage.bind(this));
        }

        // 清理单例
        if (PrivyLoad.instance === this) {
            PrivyLoad.instance = null;
        }
    }

    start() {
        // 绑定按钮点击事件
        if (this.telegramLoginButton) {
            const button = this.telegramLoginButton.getComponent(Button);
            if (button) {
                button.node.on(Button.EventType.CLICK, this.onTelegramLoginClick, this);
            }
        }

        // 绑定关闭 WebView 按钮
        if (this.closeWebViewButton) {
            const closeButton = this.closeWebViewButton.getComponent(Button);
            if (closeButton) {
                closeButton.node.on(Button.EventType.CLICK, this.closeWebView, this);
            }
        }

        // 默认隐藏 WebView
        if (this.webView && this.webView.node) {
            this.webView.node.active = false;
        }
        if (this.closeWebViewButton) {
            this.closeWebViewButton.active = false;
        }
    }

    /**
     * Telegram 登录按钮点击事件 - 改为打开 WebView
     */
    private onTelegramLoginClick() {
        Sound.instance.buttonAudio.play();
        this.openLoginPage();
    }

    /**
     * 打开登录页面（使用 WebView）
     */
    public openLoginPage() {
        const url = PrivyLoad.getPrivyLoginUrl();
        
        if (this.webView && this.webView.node) {
            // 确保 WebView 节点及其所有父节点都激活
            this.webView.node.active = true;
            
            // 确保父节点也激活
            let parent = this.webView.node.parent;
            let level = 0;
            while (parent && level < 10) { // 限制层级避免无限循环
                if (!parent.active) {
                    parent.active = true;
                }
                parent = parent.parent;
                level++;
            }
            
            // 加载 URL
            this.webView.url = url;
            
            // 显示关闭按钮
            if (this.closeWebViewButton) {
                this.closeWebViewButton.active = true;
            }
            
            console.log('Opening login page in WebView:', url);
        } else {
            console.error('WebView not configured');
        }
    }

    /**
     * 处理 WebView 发送的全局消息事件
     * @param event MessageEvent 对象，包含来自 WebView 的消息
     */
    private handleWebMessage(event: MessageEvent) {
        // 这里的 event.data 就是 Web 端传过来的对象
        const data = event.data;
        
        //console.log('Received message from WebView:', data);
        
        // 验证消息类型，确保是我们发送的
        if (data && data.type === 'PRIVY_LOGIN') {
            const loginType = data.loginType || 'telegram'; // 'telegram'、'wallet' 或 'email'
            const tgUserId = data.tgUserId || null;
            const walletAddress = data.walletAddress || null;
            const isSwitchAccount = data.isSwitchAccount || false; // 是否是切换账号
            
            // 判断登录类型并获取对应的用户标识
            // 如果不是 TG 登录，统一使用钱包地址作为 userId
            let userId: string | null = null;
            if (loginType === 'telegram' && tgUserId) {
                userId = tgUserId;
                console.log("Cocos 成功接收到 Telegram ID:", tgUserId, "isSwitchAccount:", isSwitchAccount);
            } else if (walletAddress) {
                // 非 TG 登录（email 或 wallet），统一使用钱包地址
                userId = walletAddress;
                console.log("Cocos 成功接收到钱包地址:", walletAddress, "登录类型:", loginType, "isSwitchAccount:", isSwitchAccount);
            }
            
            if (userId) {
                // 登录成功，关闭 WebView
                this.closeWebView();
                
                // 发送登录成功消息，让 Entry 场景处理
                // 延迟发送，确保消息能被正确接收
                this.scheduleOnce(() => {
                    if (typeof window !== 'undefined') {
                        window.postMessage({
                            type: 'PRIVY_LOGIN_SUCCESS',
                            loginType: loginType,
                            tgUserId: tgUserId,
                            walletAddress: walletAddress,
                            userId: userId, // TG登录使用tgUserId，非TG登录使用walletAddress
                            isSwitchAccount: isSwitchAccount
                        }, '*');
                    }
                }, 0.1);
            } else {
                console.warn('用户标识未找到，loginType:', loginType, 'tgUserId:', tgUserId, 'walletAddress:', walletAddress);
            }
        } else if (data && data.type === 'DEPOSIT_SUCCESS') {
            // 处理充值成功消息
            const txHash = data.txHash || null;
            const amount = data.amount || null;
            
            console.log('Cocos 收到充值成功消息:', { txHash, amount });
            
            // 关闭 WebView
            this.closeWebView();
            
            // 调用回调函数
            if (this.depositCallback) {
                this.depositCallback({
                    success: true,
                    txHash: txHash,
                    amount: amount
                });
                this.depositCallback = null; // 清除回调
            }
        }
    }

    /**
     * 关闭 WebView
     */
    public closeWebView() {
        Sound.instance.buttonAudio.play();
        
        // 隐藏关闭按钮
        if (this.closeWebViewButton) {
            this.closeWebViewButton.active = false;
        }
        
        // 隐藏 WebView
        if (this.webView && this.webView.node) {
            this.webView.node.active = false;
            this.webView.url = "";
        }
    }

    /**
     * 打开充值页面并传递套餐ID
     * @param identifier 充值套餐ID
     * @param callback 充值成功后的回调函数
     * @param webView 可选的 WebView 组件，如果不提供则使用实例的 webView
     */
    public openDepositPage(identifier: number, callback?: (result: any) => void, webView?: WebView) {
        // 保存回调函数
        this.depositCallback = callback || null;
        
        // 使用传入的 webView 或实例的 webView
        const targetWebView = webView || this.webView;
        
        console.log('PrivyLoad: openDepositPage called, identifier =', identifier, 'webView =', targetWebView);
        
        if (!targetWebView) {
            console.error('PrivyLoad: WebView not configured');
            if (this.depositCallback) {
                this.depositCallback({
                    success: false,
                    error: 'WebView not configured'
                });
                this.depositCallback = null;
            }
            return;
        }
        
        if (!targetWebView.node) {
            console.error('PrivyLoad: WebView.node is null');
            if (this.depositCallback) {
                this.depositCallback({
                    success: false,
                    error: 'WebView.node is null'
                });
                this.depositCallback = null;
            }
            return;
        }
        
        const url = PrivyLoad.getPrivyLoginUrl();
        console.log('PrivyLoad: Setting WebView URL to:', url);
        
        // 确保 WebView 节点及其所有父节点都激活（模仿 Entry.ts 的方式）
        console.log('PrivyLoad: WebView node found, activating...');
        targetWebView.node.active = true;
        
        // 确保父节点也激活
        let parent = targetWebView.node.parent;
        let level = 0;
        while (parent && level < 10) { // 限制层级避免无限循环
            if (!parent.active) {
                console.log('PrivyLoad: Activating parent node at level', level, parent.name);
                parent.active = true;
            }
            parent = parent.parent;
            level++;
        }
        
        // 通过 URL 参数传递套餐ID
        const urlWithIdentifier = url + (url.includes('?') ? '&' : '?') + 'identifier=' + encodeURIComponent(identifier.toString());
        
        // 设置 URL（必须在节点激活后设置）
        targetWebView.url = urlWithIdentifier;
        
        // 显示关闭按钮（如果存在）
        if (this.closeWebViewButton) {
            this.closeWebViewButton.active = true;
        }
        
        console.log('PrivyLoad: Deposit page WebView opened, URL:', urlWithIdentifier);
        console.log('PrivyLoad: WebView node active:', targetWebView.node.active);
        console.log('PrivyLoad: WebView node visible:', targetWebView.node.isValid);
    }

    

    // ========== 以下所有 Privy 相关方法已注释 ==========

    // /**
    //  * 动态加载 Privy SDK
    //  */
    // private async loadPrivySDK(): Promise<any> { ... }

    // /**
    //  * 从 CDN 加载 Privy SDK（使用 SystemJS）
    //  */
    // private loadPrivyFromCDN(resolve: (value: any) => void, reject: (error: any) => void) { ... }

    // /**
    //  * 通过 SystemJS 加载 Privy SDK（推荐方式）
    //  */
    // private loadPrivyViaSystemJS(resolve: (value: any) => void, reject: (error: any) => void) { ... }

    // /**
    //  * 通过 HTML import map script 标签添加映射
    //  */
    // private addImportMapToHTML(imports: any) { ... }

    // /**
    //  * 通过 script 标签加载（备用方案，使用 unpkg 的完整 bundle）
    //  */
    // private loadPrivyViaScriptTag(resolve: (value: any) => void, reject: (error: any) => void) { ... }

    // /**
    //  * 配置 SystemJS import map
    //  */
    // private configureSystemJSImportMap() { ... }

    // /**
    //  * 从构建输出目录加载 Privy SDK
    //  */
    // private loadPrivyFromBuildOutput(resolve: (value: any) => void, reject: (error: any) => void) { ... }

    // /**
    //  * 初始化 Privy SDK
    //  */
    // private async initPrivy() { ... }

    // /**
    //  * 设置 secure context (iframe)
    //  */
    // private async setupSecureContext() { ... }

    // /**
    //  * 使用 Telegram 登录
    //  */
    // public async loginWithTelegram(): Promise<void> { ... }

    // /**
    //  * 获取当前用户信息
    //  */
    // public async getUser() { ... }

    // /**
    //  * 检查用户是否已登录
    //  */
    // public async isAuthenticated(): Promise<boolean> { ... }

    // /**
    //  * 登出
    //  */
    // public async logout(): Promise<void> { ... }
}
