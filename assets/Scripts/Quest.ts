import { _decorator, Color, Component, director, instantiate, Label, Node, Prefab, random, randomRangeInt, SpriteFrame, sys } from 'cc';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { QuestContent } from './QuestContent';
import { Manager } from './Manager';

// 声明全局 Window 接口扩展
declare global {
    interface Window {
        Telegram?: any;
    }
}

const { ccclass, property } = _decorator;

@ccclass('Quest')
export class Quest extends Component {

    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Prefab)
    questContentPrefab:Prefab=null;

    @property(Node)
    tasksNode:Node=null;
    @property(Node)
    tasksChooseNode:Node=null;
    @property(Node)
    tasksUnChooseNode:Node=null;
    @property(Label)
    tasksLabel:Label=null;

    @property(Node)
    achievementNode:Node=null;
    @property(Node)
    achievementChooseNode:Node=null;
    @property(Node)
    achievementUnChooseNode:Node=null;
    @property(Label)
    achievementLabel:Label=null;

    @property(Node)
    dailyContentNode:Node=null;
    @property(Node)
    challengeContentNode:Node=null;
    @property(Node)
    partnerContentNode:Node=null;
    @property(Node)
    achievementContentNode:Node=null;

    @property([SpriteFrame])
    spriteFrames:SpriteFrame[]=[];
    

    start() {
        this.generalUI.updateDisplay();
        this.initQuest();
        this.switchTag(true);
    }

    switchTasks(){
        Sound.instance.buttonAudio.play();
        this.switchTag(true);
    }
    
    switchAchievement(){
        Sound.instance.buttonAudio.play();
        this.switchTag(false);
    }

    switchTag(tasks:boolean){
        
        this.tasksNode.active=tasks;
        this.tasksChooseNode.active=tasks;
        this.tasksUnChooseNode.active=!tasks;
        this.achievementNode.active=!tasks;
        this.achievementChooseNode.active=!tasks;
        this.achievementUnChooseNode.active=tasks;
        if(tasks){
            this.tasksLabel.color=Color.WHITE;
            this.achievementLabel.color=Color.GRAY;
        }
        else{
            this.achievementLabel.color=Color.WHITE;
            this.tasksLabel.color=Color.GRAY;
        }
    }

    /**
     * 将任务节点添加到对应的内容节点中
     * @param questNodes 任务节点数组
     */
    initQuest(){
        let finishes:Node[]=[];
        let progressings:Node[]=[];
        let unclaims:Node[]=[];
        for(let index=0;index<Manager.questData.data.length;index++){
            if(Manager.questData.data[index].questStatus<5){
                let questContentInstance = this.createQuestContent(index);
                switch(Manager.questData.data[index].questStatus){
                    case 1:
                        progressings.push(questContentInstance);
                        break;
                    case 2:
                        progressings.push(questContentInstance);
                        break;
                    case 3:
                        unclaims.push(questContentInstance);
                        break;
                    case 4:
                        finishes.push(questContentInstance);
                        break;
                }
            }
        }
        this.addQuestNodesToContent(unclaims);
        this.addQuestNodesToContent(progressings);
        this.addQuestNodesToContent(finishes);
    }

    addQuestNodesToContent(questNodes: Node[]){
        for(let index=0;index<questNodes.length;index++){
            const questContent = questNodes[index].getComponent(QuestContent);
            const questType = Manager.questBaseData.data[questContent.index].type;
            switch(questType){
                case "Daily Tasks":
                    this.dailyContentNode.addChild(questNodes[index]);
                    break;
                case "Challenge Tasks":
                    this.challengeContentNode.addChild(questNodes[index]);
                    break;
                case "Partner Tasks":
                    this.partnerContentNode.addChild(questNodes[index]);
                    break;
                case "Achievements":
                    this.achievementContentNode.addChild(questNodes[index]);
                    break;
            }
        }
    }
    
    go(questContent:QuestContent){
        Sound.instance.buttonAudio.play();
        let index=questContent.index;
        if(Manager.questData.data[index].questStatus==3){//领取奖励
            Manager.questData.data[index].questStatus=4;
            questContent.buttonLabel.string="✔";
            questContent.button.interactable=false;
            if(Manager.questBaseData.data[index].rewardType=="Diamond"){
                Manager.userData.data.diamonds+=Manager.questBaseData.data[index].rewardQuantity;
            }
            else{
                Manager.userData.data.coins+=Manager.questBaseData.data[index].rewardQuantity;
            }
            this.generalUI.updateDisplay();
            if(Manager.questBaseData.data[index].type=="Achievements")
                {
                    let newIndex=index+1;
                    if(Manager.questBaseData.data[newIndex].type=="Achievements"){
                        Manager.questData.data[newIndex].questStatus=1;
                        this.achievementContentNode.addChild(this.createQuestContent(newIndex));
                    }
                }
            
            let questData={identifier:index+9006};
            Manager.getInstance().post('https://api.xdiving.io/api/quest/identifier',
            questData,
            (data) => {
                console.log('任务领取:', data);
                console.log(questData);
            },
            (error) => {
                console.log(`任务领取失败: ${error}`);
            })
        }
        else{
            if(index==1){
                director.loadScene("Equip");
            }
            else if(index==16){
                // 任务16：分享给好友
                this.shareToFriend(questContent);
            }
            else if(index==17){
                // 任务17：分享给群
                this.shareToGroup(questContent);
            }
            else if(index==18||index==21){
                this.generalUI.jumpTG();
                this.finishQuest(index,questContent);
            }
            else if(index==19||index==22){
                this.generalUI.jumpX();
                this.finishQuest(index,questContent);
            }
            else if(index==20){
                director.loadScene("Topup");
            }
            else if(index==23||index==24){
                director.loadScene("Referral");
            }
            else{
                director.loadScene("Menu");
            }
        }
    }

    finishQuest(index:number,questContent:QuestContent){
        Manager.questData.data[index].progress++;
        Manager.questData.data[index].questStatus=3;
        questContent.progressLabel.string="("+Manager.questData.data[index].progress.toString()+"/"+Manager.questBaseData.data[index].quantity.toString()+")";
        questContent.buttonLabel.string="CLAIM";
        const questData = { identifier: index+9006};
        Manager.getInstance().post('https://api.xdiving.io/api/quest/user/progress',
        questData,
        (data) => {
          console.log('任务更新:', data);
          console.log(questData);
        },
        (error) => {
          console.log(`任务更新失败: ${error}`);
        })
    }
    
    refresh(questContent:QuestContent){
        Sound.instance.buttonAudio.play();
        
        let index=questContent.index;
        let newIndex=randomRangeInt(9,12);
        let j=0;
        while(j<100){
            j++;
            if(newIndex==index){
                newIndex=randomRangeInt(9,12);
            }
            else{
                break;
            }
        }
        Manager.questData.data[index].questStatus=5;
        Manager.questData.data[newIndex].questStatus=1;

        this.challengeContentNode.removeAllChildren();
        let questContentInstance = this.createQuestContent(newIndex);
        this.challengeContentNode.addChild(questContentInstance);
        
        let questData={identifier:index+9006,newIdentifier:newIndex+9006};
        Manager.getInstance().post('https://api.xdiving.io/api/quest/refresh',
            questData,
            (data) => {
                console.log('任务刷新:', data);
                console.log(questData);
            },
            (error) => {
                console.log(`任务刷新失败: ${error}`);
            })
    }
    
    createQuestContent(index:number){
        let questContentInstance = instantiate(this.questContentPrefab);
        let questComponent=questContentInstance.getComponent(QuestContent);
        questComponent.quest=this;
        questComponent.index=index; 
        questComponent.sprite.spriteFrame=this.spriteFrames[index];
        questComponent.descriptLabel.string=Manager.questBaseData.data[index].descript.replace("@", Manager.questBaseData.data[index].quantity.toString());
        questComponent.progressLabel.string="("+Manager.questData.data[index].progress.toString()+"/"+Manager.questBaseData.data[index].quantity.toString()+")";
        questComponent.rewardLabel.string="X "+Manager.questBaseData.data[index].rewardQuantity.toString();
        switch(Manager.questBaseData.data[index].rewardType){
            case "Gold":
                questComponent.diamondNode.active=false;
                break;
            case "Diamond":
                questComponent.coinNode.active=false;
                break;
        }
        
        switch(Manager.questData.data[index].questStatus){
            case 1:
                questComponent.buttonLabel.string="GO";
                break;
            case 2:
                questComponent.buttonLabel.string="GO";
                questComponent.refreshNode.active=true;
                break;
            case 3:
                questComponent.buttonLabel.string="CLAIM";
                break;
            case 4:
                questComponent.buttonLabel.string="✔";
                questComponent.button.interactable=false;
                break;
        }
        return questContentInstance;
    }

    update(deltaTime: number) {
        
    }
    
    /**
     * 分享给好友（任务16）
     * 使用 Telegram WebApp 的 shareUrl 方法打开分享界面
     */
    shareToFriend(questContent: QuestContent) {
        Sound.instance.buttonAudio.play();
        
        // 生成分享链接（包含邀请码）
        const inviteUrl = "https://t.me/xdiving_bot/xdiving_bot?startapp=" + Manager.inviteCodeData.data.invitationCode;
        const shareText = "Come and play X-Diver with me!";
        
        // 检查是否在 Telegram 环境
        if (Manager.TGEnvironment) {
            const webApp = window.Telegram.WebApp;
            
            // 尝试使用 shareUrl 方法（如果支持）
            if (typeof webApp.shareUrl === 'function') {
                try {
                    // 使用 shareUrl 方法分享
                    webApp.shareUrl(inviteUrl, shareText);
                } catch (e) {
                    console.warn('shareUrl 方法调用失败，使用备用方案:', e);
                    // 备用方案：使用标准分享链接
                    const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
                    webApp.openTelegramLink(shareUrl);
                }
            } else {
                // 如果不支持 shareUrl，使用标准分享链接
                const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
                webApp.openTelegramLink(shareUrl);
            }
        } else {
            // 非 Telegram 环境的备用方案
            const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
            sys.openURL(shareUrl);
        }
        
        // 完成任务
        this.finishQuest(16, questContent);
    }

    /**
     * 分享给群（任务17）
     * 使用不同的分享方式，引导用户分享到群组
     */
    shareToGroup(questContent: QuestContent) {
        Sound.instance.buttonAudio.play();
        
        // 生成分享链接（包含邀请码）
        const inviteUrl = "https://t.me/xdiving_bot/xdiving_bot?startapp=" + Manager.inviteCodeData.data.invitationCode;
        const shareText = "Recommend an incredibly fun game X-Diver！";
        
        // 检查是否在 Telegram 环境
        if (Manager.TGEnvironment) {
            const webApp = window.Telegram.WebApp;
            
            // 尝试使用 shareUrl 方法（如果支持）
            if (typeof webApp.shareUrl === 'function') {
                try {
                    // 使用 shareUrl 方法分享
                    webApp.shareUrl(inviteUrl, shareText);
                } catch (e) {
                    console.warn('shareUrl 方法调用失败，使用备用方案:', e);
                    // 备用方案：使用标准分享链接
                    const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
                    webApp.openTelegramLink(shareUrl);
                }
            } else {
                // 如果不支持 shareUrl，使用标准分享链接
                const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
                webApp.openTelegramLink(shareUrl);
            }
        } else {
            // 非 Telegram 环境的备用方案
            const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(inviteUrl) + "&text=" + encodeURIComponent(shareText);
            sys.openURL(shareUrl);
        }
        
        // 完成任务
        this.finishQuest(17, questContent);
    }

    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }

}


