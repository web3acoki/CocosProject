import { _decorator, Component, director, WebView } from 'cc';
import { Manager } from './Manager';
import { Sound } from './Sound';
import { PrivyLoad } from './PrivyLoad';
const { ccclass, property } = _decorator;

@ccclass('Log')
export class Log extends Component {
    
    @property(WebView)
    webView: WebView = null;
    
    start() {
        // 监听全局消息事件，接收 Privy 登录成功消息
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleLoginMessage.bind(this));
        }
        
        // 设置 WebView URL 并显示
        if (this.webView) {
            const url = PrivyLoad.getPrivyLoginUrl();
            this.webView.url = url;
            if (this.webView.node) {
                this.webView.node.active = true;
            }
            console.log('Log scene: Opening WebView with URL:', url);
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
        
        console.log('Log scene received message:', data);
        
        // 验证消息类型
        if (data && data.type === 'PRIVY_LOGIN_SUCCESS') {
            const tgUserId = data.tgUserId;
            
            if (tgUserId) {
                console.log("Log scene: 收到登录成功消息，用户ID:", tgUserId);
                
                // 初始化用户
                if (Manager.getInstance()) {
                    Manager.loadFinish = 0;
                    Manager.getInstance().initFakeUser(tgUserId);
                    this.waitForDataAndEnterMenu();
                }
            }
        }
    }
}

