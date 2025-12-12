import { _decorator, Component, director, EditBox, Label, Node, ProgressBar, ResolutionPolicy, sys, view } from 'cc';
import { Manager } from './Manager';
import WebApp from '@twa-dev/sdk';
import { Sound } from './Sound';
const { ccclass, property } = _decorator;

@ccclass('Entry')
export class Entry extends Component {

    @property(ProgressBar)
    pBar:ProgressBar=null;

    @property(Node)
    webNode:Node=null;

    @property(EditBox)
    userIdInput:EditBox=null;

    @property(Label)
    loginWarn:Label=null;

    @property(Label)
    serverWarn:Label=null;
    
    progressTimer=0;

    firstload=false;
    resourceProgress=0;
    
    start() {

        this.initDisplay();
        服务器在维护则弹出警告:
        Manager.getInstance().get('https://api.xdiving.io/api/treasure/list',
        (data) => {
          console.log(`测试数据: ${data}`);
        },
        (error) => {
            console.log(`测试数据GET失败: ${error}`);
            this.serverWarnDisplay();
        });

        director.preloadScene('Menu', 
            (completedCount: number, totalCount: number) => {
                // 这是真实的资源加载进度
                this.resourceProgress = completedCount / totalCount;
                // 更新进度条
            },
            (error: Error) => {
                if (error) {
                    console.error('预加载失败:', error);
                }
            }
        );
    }

    initDisplay(){
        在TG环境直接显示进度条在web环境显示登录界面:
        if(WebApp['default']?.initData){
            this.pBar.node.active=true;
        }
        else{
            this.webNode.active=true;
        }
    }

    serverWarnDisplay(){
        this.pBar.node.active=false;
        this.webNode.active=false;
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
            this.webNode.active=false;
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
        
        this.pBar.progress = this.resourceProgress;
        资源加载完成则加载菜单场景:
        if(this.firstload==false){
            if(Manager.getInstance().getFinish())
            {
                this.firstload=true;
                Sound.instance.updateSound();
                director.loadScene('Menu');
            }
        }
    }

    displayEditBox(){
        this.userIdInput.node.active=!this.userIdInput.node.active;
    }

}