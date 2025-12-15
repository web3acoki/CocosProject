import { _decorator, AudioSource, Component, director, instantiate, Label, Node, Prefab, sys } from 'cc';
import { Manager } from './Manager';
import { ReferralContent } from './ReferralContent';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
const { ccclass, property } = _decorator;

// 声明全局 Window 接口扩展
declare global {
    interface Window {
        Telegram?: any;
    }
}

@ccclass('Referral')
export class Referral extends Component {
    
    //@property(AudioSource)//音效
    //buttonAudio:AudioSource=null;
    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Node)
    contentNode:Node=null;
    @property(Prefab)
    referralContent:Prefab=null;
    @property(Label)
    numLabel:Label=null;
    @property(Label)
    linkLabel:Label=null;
    @property(Node)
    successFrame:Node=null;
    successTimer=1;
    
    @property(Node)
    failFrame:Node=null;
    failTimer=1;

    //@property(AudioSource)
    //BGM:AudioSource=null;

    displayLoaded=false;

    url="";

    start() {
        
        this.generalUI.updateDisplay();
        director.preloadScene("Menu");
        this.numLabel.string="Friend List("+Manager.inviteUserData.data.length.toString()+")";
        this.url="https://t.me/xdiving_bot/xdiving_bot?startapp="+Manager.inviteCodeData.data.invitationCode;
        this.linkLabel.string=this.url;
        //this.updateSound();
    }


    //updateSound(){
    //    if(Manager.userData.data.BGMopen){
    //        this.BGM.volume=1;
    //    }
    //    else{
    //        this.BGM.volume=0;
    //    }
    //    if(Manager.userData.data.BGSopen){
    //        this.buttonAudio.volume=1;
    //    }
    //    else{
    //        this.buttonAudio.volume=0;
    //    }
    //}

    refresh(){
        this.displayLoaded=false;
        Manager.loadFinish=0;
        Manager.getInstance().loadAllUserData(Manager.userData.data.userId);
        this.updateInvitee();
        this.generalUI.updateDisplay();
    }

    updateInvitee(){
        this.contentNode.destroyAllChildren();
        for(const invitee of Manager.inviteUserData.data){
            let contentInstance = instantiate(this.referralContent);
            this.contentNode.addChild(contentInstance);
            contentInstance.getComponent(ReferralContent).userId.string=invitee.inviteeUserId.toString();
            if(invitee.firstPlayed){
                contentInstance.getComponent(ReferralContent).diamond.string="+1";
            }
        }
    }  

    copy(){
        
       Sound.instance.buttonAudio.play();
       if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this.url)
                .then(() => {
                    console.log('链接复制成功: ', this.url);
                    
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
        textArea.value = this.url;
        textArea.style.position = "fixed"; // 避免触发滚动
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select(); // 选中文本
        textArea.setSelectionRange(0, 99999); // 移动端兼容

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('链接复制成功 (备用方法): ', this.url);
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

    update(deltaTime: number) {
        if(this.displayLoaded==false){
            if(Manager.getInstance().getFinish()){
                this.displayLoaded=true;
                this.updateInvitee();
            }
        }

        if(this.successFrame.active){
            if(this.successTimer>0){
                this.successTimer-=deltaTime;
            }
            else{
                this.successFrame.active=false;
                this.successTimer=1;
            }
        }
        
        if(this.failFrame.active){
            if(this.failTimer>0){
                this.failTimer-=deltaTime;
            }
            else{
                this.failFrame.active=false;
                this.failTimer=1;
            }
        }
    }
    
    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }


    jump(){
        Sound.instance.buttonAudio.play();
        
        // 原方法：使用 sys.openURL（保留但不使用）
        // let jumpUrl = "https://t.me/share/url?url=" + this.url;
        // sys.openURL(jumpUrl);
        
        // 新方法：使用 Telegram WebApp API，不会退出 mini app
        const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(this.url);
        
        // 检查是否在 Telegram 环境
        if (Manager.TGEnvironment) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            // 非 Telegram 环境的备用方案
            sys.openURL(shareUrl);
        }
    }
}
