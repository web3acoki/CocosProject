import { _decorator, Component, Node, Button, director, WebView } from 'cc';
import { Sound } from './Sound';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;

// 单例类
@ccclass('PrivyLoad')
export class PrivyLoad extends Component {
    private static instance: PrivyLoad | null = null;

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

    @property(Node)
    telegramLoginButton: Node = null;

    @property(Node)
    webViewNode: Node = null;

    @property(WebView)
    webView: WebView = null;

    @property(Node)
    closeWebViewButton: Node = null;

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
        if (this.webViewNode) {
            this.webViewNode.active = false;
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
        const url = "https://roderick-oscular-cyril.ngrok-free.dev/";
        
        if (this.webView && this.webViewNode) {
            // 显示 WebView 节点
            this.webViewNode.active = true;
            this.webView.node.active = true;
            
            // 加载 URL
            this.webView.url = url;
            
            // 显示关闭按钮
            if (this.closeWebViewButton) {
                this.closeWebViewButton.active = true;
            }
            
            console.log('Opening login page in WebView:', url);
        } else {
            console.error('WebView or webViewNode not configured');
        }
    }

    /**
     * 处理 WebView 发送的全局消息事件
     * @param event MessageEvent 对象，包含来自 WebView 的消息
     */
    private handleWebMessage(event: MessageEvent) {
        // 这里的 event.data 就是 Web 端传过来的对象
        const data = event.data;
        
        console.log('Received message from WebView:', data);
        
        // 验证消息类型，确保是我们发送的
        if (data && data.type === 'PRIVY_LOGIN') {
            const tgUserId = data.tgUserId;
            
            if (tgUserId) {
                console.log("Cocos 成功接收到 Telegram ID:", tgUserId);
                
                // 调用 Manager 初始化用户
                if (Manager.getInstance()) {
                    Manager.getInstance().initFakeUser(tgUserId);
                }
                
                // 登录成功，关闭 WebView
                this.closeWebView();
            } else {
                console.warn('tgUserId not found in message data:', data);
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
        if (this.webViewNode) {
            this.webViewNode.active = false;
        }
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
