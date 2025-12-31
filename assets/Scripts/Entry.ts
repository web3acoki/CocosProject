import { _decorator, Component, director, EditBox, Label, Node, ProgressBar, ResolutionPolicy, sys, view, WebView } from 'cc';
import { Manager } from './Manager';
import WebApp from '@twa-dev/sdk';
import { Sound } from './Sound';
import { PrivyLoad } from './PrivyLoad';
const { ccclass, property } = _decorator;

@ccclass('Entry')
export class Entry extends Component {

    // 静态标志：是否是从 SwitchAccount 进入的
    public static isSwitchAccount: boolean = false;
    
    // 切换账号模式下的当前用户ID（用于比较是否是新账号）
    private switchAccountCurrentUserId: string | null = null;
    
    // 是否正在等待切换账号后的新登录信息
    private isWaitingForNewAccount: boolean = false;

    @property(ProgressBar)
    pBar:ProgressBar=null;

    @property(EditBox)
    userIdInput:EditBox=null;

    @property(Label)
    loginWarn:Label=null;

    @property(Label)
    serverWarn:Label=null;

    @property(PrivyLoad)
    privyLoad: PrivyLoad = null;

    @property(WebView)
    webView: WebView = null;
    
    progressTimer=0;

    firstload=false;
    resourceProgress=0;
    
    onLoad() {
        // 初始化时确保 WebView 节点默认隐藏
        if (this.webView && this.webView.node) {
            this.webView.node.active = false;
        }
    }
    
    start() {
        // 监听全局消息事件，接收 Privy 登录成功消息
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleLoginMessage.bind(this));
        }

        // 检查是否是 TG 环境
        const isTGEnvironment = WebApp['default']?.initData;
        
        if (isTGEnvironment) {
            // TG 环境：显示进度条并初始化用户数据
            this.pBar.node.active = true;
            this.firstload = false;
            Manager.loadFinish = 0;
            // TG 环境的初始化在 Manager.initTGUser() 中处理
            
            // 服务器检查
            Manager.getInstance().get('https://api.xdiving.io/api/treasure/list',
            (data) => {
              console.log(`测试数据: ${data}`);
            },
            (error) => {
                console.log(`测试数据GET失败: ${error}`);
                this.serverWarnDisplay();
            });

            // 预加载场景
            director.preloadScene('Menu', 
                (completedCount: number, totalCount: number) => {
                    this.resourceProgress = completedCount / totalCount;
                },
                (error: Error) => {
                    if (error) {
                        console.error('预加载失败:', error);
                    }
                }
            );
        } else {
            // 非 TG 环境：统一显示 Privy 登录界面（首次进入和切换账号逻辑相同）
            this.pBar.node.active = false;
            
            // 检查是否是从 SwitchAccount 进入的
            if (Entry.isSwitchAccount) {
                // 切换账号模式：需要等待新账号
                console.log('Entry: SwitchAccount mode detected');
                Entry.isSwitchAccount = false; // 重置标志
                this.switchAccountCurrentUserId = null;
                this.isWaitingForNewAccount = true;
            } else {
                // 首次进入：不需要等待新账号
                console.log('Entry: First time login (non-TG environment)');
                this.isWaitingForNewAccount = false;
                this.switchAccountCurrentUserId = null;
            }
            
            // 延迟一帧显示 Privy 登录界面，确保场景完全加载
            this.scheduleOnce(() => {
                this.showPrivyLogin();
            }, 0);
        }
    }


    /**
     * 显示 Privy 登录界面
     */
    private showPrivyLogin() {
        console.log('Entry: showPrivyLogin called, webView =', this.webView);
        
        if (!this.webView) {
            console.error('Entry: WebView not configured in Entry scene!');
            return;
        }
        
        if (!this.webView.node) {
            console.error('Entry: WebView.node is null!');
            return;
        }
        
        const url = PrivyLoad.getPrivyLoginUrl();
        console.log('Entry: Setting WebView URL to:', url);
        
        // 确保 WebView 节点及其所有父节点都激活
        console.log('Entry: WebView node found, activating...');
        this.webView.node.active = true;
        
        // 确保父节点也激活
        let parent = this.webView.node.parent;
        let level = 0;
        while (parent && level < 10) { // 限制层级避免无限循环
            if (!parent.active) {
                console.log('Entry: Activating parent node at level', level, parent.name);
                parent.active = true;
            }
            parent = parent.parent;
            level++;
        }
        
        // 设置 URL（必须在节点激活后设置）
        this.webView.url = url;
        
        console.log('Entry: Privy login WebView opened, URL:', url);
        console.log('Entry: WebView node active:', this.webView.node.active);
        console.log('Entry: WebView node visible:', this.webView.node.isValid);
    }



    serverWarnDisplay(){
        this.pBar.node.active=false;
        if (this.webView && this.webView.node) {
            this.webView.node.active = false;
        }
        this.serverWarn.node.active=true;
    }

    enterGame(){
        Sound.instance.buttonAudio.play();
        let userId=parseInt(this.userIdInput.string);
        没有用户id则提示连接钱包:
        if(userId){
            this.userIdInput.node.active=false;
            this.pBar.node.active=true;
            this.firstload=false;
            Manager.loadFinish=0;
            Manager.getInstance().initFakeUser(userId);
            if (this.webView && this.webView.node) {
                this.webView.node.active = false;
            }
        }
        else{
            this.loginWarn.node.active=true;
            this.scheduleOnce(() => {
                this.loginWarn.node.active=false;
            }, 5);
        }
    }

    launchOnTelegram(){
        Sound.instance.buttonAudio.play();
        sys.openURL('https://t.me/xdiving_bot');
    }

    connectWallet(){
        Sound.instance.buttonAudio.play();
        sys.openURL('https://xdiving.io/');
    }

    update(deltaTime: number) {
        
        // 如果正在等待切换账号，不执行任何自动跳转逻辑
        if (this.isWaitingForNewAccount) {
            return;
        }
        
        // 只有在显示进度条时才更新进度
        if (this.pBar.node.active) {
            this.pBar.progress = this.resourceProgress;
        }
        
        // 资源加载完成后的处理（仅TG环境）
        if(this.firstload==false){
            if(Manager.getInstance().getFinish())
            {
                this.firstload=true;
                
                // 检查是否是 TG 环境
                const isTGEnvironment = WebApp['default']?.initData;
                
                if(isTGEnvironment){
                    // TG 环境：直接进入主菜单
                    Sound.instance.updateSound();
                    director.loadScene('Menu');
                }
                // 非 TG 环境：WebView 已经在 start() 中显示了，等待登录成功消息
            }
        }
    }


    displayEditBox(){
        this.userIdInput.node.active=!this.userIdInput.node.active;
    }

    onDestroy() {
        // 清理消息监听
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleLoginMessage.bind(this));
        }
    }

    /**
     * 处理登录成功消息
     */
    private handleLoginMessage(event: MessageEvent) {
        const data = event.data;
        
        //console.log('Entry scene received message:', data);
        
        // 验证消息类型
        if (data && data.type === 'PRIVY_LOGIN_SUCCESS') {
            const loginType = data.loginType || 'telegram'; // 'telegram' 或 'wallet'
            const userId = data.userId; // 统一的用户标识（TG用户ID或钱包地址）
            
            if (userId) {
                console.log("Entry scene: 收到登录成功消息，登录类型:", loginType, "用户标识:", userId);
                
                // 如果是切换账号模式，需要等待新的账号信息
                if (this.isWaitingForNewAccount) {
                    // 检查是否是新账号（与当前账号不同）
                    if (this.switchAccountCurrentUserId && userId === this.switchAccountCurrentUserId) {
                        console.log("SwitchAccount: 收到的是当前账号信息，等待新账号...");
                        // 不处理，继续等待新账号的登录信息
                        return;
                    } else {
                        console.log("SwitchAccount: 收到新账号信息，用户标识:", userId);
                        // 重置标志
                        this.isWaitingForNewAccount = false;
                        this.switchAccountCurrentUserId = null;
                    }
                }
                
                // 隐藏 WebView
                if (this.webView && this.webView.node) {
                    this.webView.node.active = false;
                }
                
                // 初始化用户
                // 使用 initWebUserWithType，userId 和 loginType 完全由 privy 中获取
                if (Manager.getInstance()) {
                    Manager.loadFinish = 0;
                    Manager.getInstance().initWebUserWithType(userId, loginType);
                    
                    // 等待数据加载完成后进入主菜单
                    this.waitForDataAndEnterMenu();
                }
            }
        }
    }

    /**
     * 等待数据加载完成后进入主菜单
     */
    private waitForDataAndEnterMenu() {
        this.schedule(() => {
            if (Manager.getInstance().getFinish()) {
                this.unscheduleAllCallbacks();
                Sound.instance.updateSound();
                director.loadScene('Menu');
            }
        }, 0.1);
    }
    //privyLogin(){
    //    sys.openURL('http://localhost:3000/');
    //}
}