import { _decorator, Component, instantiate, Label, Node, Prefab, ProgressBar, randomRangeInt, SpriteFrame, WebView } from 'cc';
import { LevelContent } from './LevelContent';
import { Manager } from './Manager';
import { Sound } from './Sound';
import { Menu } from './Menu';
const { ccclass, property } = _decorator;


@ccclass('Level')
export class Level extends Component {
    
    @property(Node)
    levelFrame:Node=null;
    @property(Prefab)
    levelContentPrefab:Prefab=null;
    @property(Node)
    levelContentNode:Node=null;
    @property(Label)
    levelLabel:Label=null;
    @property(ProgressBar)
    levelProgressBar:ProgressBar=null;

    @property([SpriteFrame])
    spriteFrames:SpriteFrame[]=[];

    @property(Node)
    webViewNode:Node=null;
    @property(WebView)
    webView:WebView=null;
    @property(Node)
    closeWebViewButton:Node=null;
    @property(Menu)
    menu:Menu=null;

    @property(Node)
    vipFrame:Node=null;

    @property(Node)
    purchaseVIPNode:Node=null;

    firstLevelIndex=0;

    //VIP=false;

    waitingPurchase=0;
    hide=false;
    private currentPurchaseIdentifier: number = 0; // 当前VIP购买订单号

    hideLevel(){
        Sound.instance.buttonAudio.play();
        this.levelFrame.active=!this.levelFrame.active;
    }

    initLevel(){
        if(Manager.userData.data.vip){
            this.purchaseVIPNode.active=false;
        }
        else{
            this.purchaseVIPNode.active=true;
        }
        let levelIndex=Manager.userData.data.level-1;
        for (const status of Manager.levelStatusDatas){
            if(status.status==2){
                levelIndex=status.level-1;
                break;
            }
        }
        this.firstLevelIndex=Math.floor(levelIndex/6)*6;
        this.levelLabel.string="Lv."+Manager.userData.data.level.toString();
        if(Manager.userData.data.level<Manager.levelBaseData.data.length){
            this.levelProgressBar.progress=Manager.userData.data.experience/Manager.levelBaseData.data[Manager.userData.data.level].experienceRequired;
        }
        else{
            this.levelProgressBar.progress=1;
        }
        this.updateLevel();
    }

    updateLevel(){
        this.levelContentNode.destroyAllChildren();
        for(let index=this.firstLevelIndex;index<this.firstLevelIndex+6;index++){
            let levelContent=instantiate(this.levelContentPrefab).getComponent(LevelContent);
            let baseData=Manager.levelBaseData.data[index];
            let statusData=Manager.levelStatusDatas[index];
            levelContent.levelIndex=index;
            levelContent.getComponent(LevelContent).levelComponent=this;
            levelContent.levelLabel.string="Lv."+(index+1).toString();
            if(baseData.rewardType=="Avaible dives"){
                levelContent.quantityLabel.string="Avaible\ndives+"+baseData.rewardQuantity.toString();
            }
            else{
                levelContent.quantityLabel.string="X"+baseData.rewardQuantity.toString();
            }
            levelContent.extraQuantityLabel.string="X"+baseData.extraQuantity.toString();
            switch (baseData.rewardType){
                case "Gold":levelContent.sprite.spriteFrame=this.spriteFrames[0];levelContent.quantityLabel.fontSize=25;break;
                case "Avaible dives":levelContent.sprite.spriteFrame=this.spriteFrames[1];levelContent.quantityLabel.fontSize=20;break;
                case "Pulse bomb":levelContent.sprite.spriteFrame=this.spriteFrames[2];break;
                case "Power hammer":levelContent.sprite.spriteFrame=this.spriteFrames[3];break;
                case "Super booster":levelContent.sprite.spriteFrame=this.spriteFrames[4];break;
                case "Return capsule":levelContent.sprite.spriteFrame=this.spriteFrames[5];break;
            }
            switch (baseData.extraType){
                case "Gold":levelContent.extraSprite.spriteFrame=this.spriteFrames[0];levelContent.extraQuantityLabel.fontSize=25;break;
                case "Avaible dives":levelContent.extraSprite.spriteFrame=this.spriteFrames[1];levelContent.extraQuantityLabel.fontSize=20;break;
                case "Pulse bomb":levelContent.extraSprite.spriteFrame=this.spriteFrames[2];break;
                case "Power hammer":levelContent.extraSprite.spriteFrame=this.spriteFrames[3];break;
                case "Super booster":levelContent.extraSprite.spriteFrame=this.spriteFrames[4];break;
                case "Return capsule":levelContent.extraSprite.spriteFrame=this.spriteFrames[5];break;
            }
            levelContent.receivedNode.active=(statusData.status==3);
            levelContent.claimButton.active=(statusData.status==2);
            levelContent.extraReceivedNode.active=(statusData.extraStatus==3);
            levelContent.extraClaimButton.active=(statusData.extraStatus==2);
            this.levelContentNode.addChild(levelContent.node);
        }
    }

    lastPage(){
        Sound.instance.buttonAudio.play();
        if(this.firstLevelIndex>=6){
            this.firstLevelIndex-=6;
            this.updateLevel();
        }
    }

    nextPage(){
        Sound.instance.buttonAudio.play();
        if(this.firstLevelIndex<Manager.levelBaseData.data.length-6){
            this.firstLevelIndex+=6;
            this.updateLevel();
        }
    }

    start() {
        this.initLevel();
    }

    claim(levelIndex:number,extra:boolean){
        Sound.instance.buttonAudio.play();
        this.claimOnly(levelIndex,extra);
        this.updateLevel();
        this.menu.updateDataDisplay();
        this.menu.updateLevelHint();
    }

    claimAll(){
        Sound.instance.buttonAudio.play();
        for(let index=0;index<Manager.levelBaseData.data.length;index++){
            if(Manager.levelStatusDatas[index].status==2){
                this.claimOnly(index,false);
            }
        } 
        if(Manager.userData.data.vip){
            for(let index=0;index<Manager.levelBaseData.data.length;index++){
                if(Manager.levelStatusDatas[index].extraStatus==2){
                    this.claimOnly(index,true);
                }
            }
        }
        this.updateLevel();
        this.menu.updateDataDisplay();
        this.menu.updateLevelHint();
    }

    claimOnly(levelIndex:number,extra:boolean){
        let type=Manager.levelBaseData.data[levelIndex].rewardType;
        let quantity=Manager.levelBaseData.data[levelIndex].rewardQuantity;
        Manager.levelStatusDatas[levelIndex].status=3;
        if(extra){
            type=Manager.levelBaseData.data[levelIndex].extraType;
            quantity=Manager.levelBaseData.data[levelIndex].extraQuantity;
            Manager.levelStatusDatas[levelIndex].extraStatus=3;
        }
        if(type=="Gold"){
            Manager.userData.data.coins+=quantity;
        }
        else if(type=="Avaible dives")
        {
            Manager.userData.data.remainingRounds+=quantity;
        }
        else{
            for(let index=0;index<Manager.propBaseData.data.length;index++){
                const prop=Manager.propBaseData.data[index];
                if(prop.propNameEn==type){
                    Manager.propData.data[index].quantity+=quantity;
                }
            }
        }
        Manager.getInstance().post('https://api.xdiving.io/api/level/claim-reward',
        {level: levelIndex+1,extra: extra},
        (data)=>{
            console.log("领取等级奖励：",data);
        },(error)=>{
            console.log("领取等级奖励失败：",error);
        });
    }

    openVIPFrame(){
        Sound.instance.buttonAudio.play();
        
        this.menu.comingSoonHide();
        return;

        this.vipFrame.active=!this.vipFrame.active;
    }

    purchaseVIP(){
        Sound.instance.buttonAudio.play();
        // 显示 coming soon
        
        // 以下代码暂时禁用，显示 coming soon
        
        const accessToken = Manager.accessToken;
        const identifier=randomRangeInt(1000000000,9999999999);
        this.currentPurchaseIdentifier = identifier;

        if (!accessToken) {
            console.log("错误: 未找到 accessToken，请先登录");
            return;
        }
        const url = `https://xdiving.io?identifier=${identifier}&packageId=10000&accessToken=${encodeURIComponent(accessToken)}`;
        
        this.webViewNode.active = true;
        // 加载 URL
        this.webView.url = url;
        
        this.closeWebViewButton.active = true;
        
        this.vipFrame.active=false;

        this.waitingPurchase=2;

        // 使用Manager管理订单查询（504时立即切换到poll接口持续查询）
        Manager.getInstance().startOrderQuery(
            identifier,
            10000, // VIP套餐ID
            (data)=>{
                // 订单查询成功，更新UI（如果界面还在）
                this.purchaseSuccess(data);
            },
            (error)=>{
                // 订单查询失败（非504错误）（如果界面还在）
                console.log("购买VIP失败:",error);
            }
        );

        console.log(`正在加载支付页面...\n套餐ID: 10000`);
        
    }

    

    purchaseSuccess(data:any){
        // 注意：Manager已经更新了数据，这里只负责更新UI（如果界面还在）
        if(data.data.status=="COMPLETED"){
            // 更新UI显示（Manager已经更新了vip和levelStatusDatas）
            this.updateLevel();
            if(this.menu){
                this.menu.updateDataDisplay();
            }
        }
        this.waitingPurchase=0;
        this.hideWebView();
    }

    hideWebView(){
        Sound.instance.buttonAudio.play();
        // 停止当前订单查询（如果还在查询中）
        if (this.currentPurchaseIdentifier) {
            Manager.getInstance().stopOrderQuery(this.currentPurchaseIdentifier);
        }
        
        this.closeWebViewButton.active=false;
        this.webView.node.active=false;
        this.webView.url = "";
        this.hide=true;
    }

    update(deltaTime: number) {
        if(this.hide){
            this.waitingPurchase-=deltaTime;
            if(this.waitingPurchase<=0){
                this.hide=false;
                this.webViewNode.active = false;
            }
        }
    }
}