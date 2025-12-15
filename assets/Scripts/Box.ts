import { _decorator, AudioSource, color, Component, director, instantiate, Label, Node, Prefab, SpriteFrame } from 'cc';
import { Manager } from './Manager';
import { BoxContent } from './BoxContent';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
const { ccclass, property } = _decorator;

@ccclass('Box')
export class Box extends Component {

    
    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Node)
    contentNode: Node = null;

    //@property([Prefab])
    //boxContentPrefabs: Prefab;

    @property(Prefab)
    boxContentPrefab: Prefab=null;

    @property(Node)
    selectAllNode:Node=null;

    @property(Label)
    coinNumLabel:Label=null;

    @property(Label)
    diamondNumLabel:Label=null;

    @property(Label)
    kgNumLabel:Label=null;

    @property(Node)
    lockNode:Node=null;

    @property([SpriteFrame])
    spriteFrames:SpriteFrame[]=[];

    //@property(AudioSource)//音效
    //buttonAudio:AudioSource=null;

    //@property(Label)
    //userCoins: Label = null;
    //@property(Label)
    //userDiamonds: Label = null;

    boxContents: BoxContent[]=[];

    totalCoins=0;
    totalDiamonds=0;
    totalKG=0;
    remainKG=0;
    start() {
        //Manager.getInstance().post(url,
        //   Manager.startData,
        //   (data) => {
        //     console.log('鱼箱数据:', data);
        //     console.log(Manager.startData);
        //     },
        //     (error) => {
        //         console.log(`'鱼箱数据POST失败: ${error}`);
        //     }
        //   )
        
        Sound.instance.moveAudio.stop();
        Sound.instance.stayAudio.stop();
        Sound.instance.boostAudio.stop();
        director.preloadScene("Menu");
        this.initBox();
        //let userID=1;
        //let url="https://api.xdiving.io/api/fish-catch/user/"+userID.toString()+"/box";

        //Manager.getInstance().get(url,
        //  (data) => {
        //    console.log('鱼箱数据:', data);
        //    Manager.boxData = data;
        //    console.log(Manager.boxData);
        //    this.initBox();
        //    },
        //    (error) => {
        //    console.log(`鱼箱GET失败: ${error}`);
        //  }
        //)
        //this.updateSound();
    }
    
    
    //@property(AudioSource)
    //BGM:AudioSource=null;
    //
    //updateSound(){
    //    if(Manager.userData.data.BGMopen){
    //        this.BGM.volume=1;
    //    }
    //    else{
    //        this.BGM.volume=0;
    //    }
    //    if(Manager.userData.data.BGSopen){
    //        Sound.instance.buttonAudio.volume=1;
    //    }
    //    else{
    //        Sound.instance.buttonAudio.volume=0;
    //    }
    //}
    
    updateDataDisplay(){
        this.generalUI.updateDisplay();
    }

    initBox(){
        this.updateDataDisplay();
        this.remainKG=Manager.aquariumBaseData.data[Manager.aquariumLevelData.data.level-1].capacity-Manager.usedCapacity;
        
        // 根据用户等级设置 lock 和 kgNumLabel 的显示
        let isLevel15OrAbove = Manager.userData && Manager.userData.data && Manager.userData.data.level >= Manager.aquariumLockLevel;
        if(isLevel15OrAbove){
            // 达到15级：lock 不显示，kgNumLabel 显示
            if(this.lockNode){
                this.lockNode.active = false;
            }
            if(this.kgNumLabel){
                this.kgNumLabel.node.active = true;
                // 初始化 kgNumLabel 为 "0/剩余水族箱容量"
                this.kgNumLabel.string = "0/" + this.remainKG.toFixed(2) + "kg";
            }
        }
        else{
            // 未达到15级：lock 显示，kgNumLabel 不显示
            if(this.lockNode){
                this.lockNode.active = true;
            }
            if(this.kgNumLabel){
                this.kgNumLabel.node.active = false;
            }
        }
        
        for(let index=0;index<Manager.boxData.data.length;index++){
            let contentInstance = instantiate(this.boxContentPrefab);
            
            let contentData=Manager.boxData.data[index];
            
            let contentComponent = contentInstance.getComponent(BoxContent);

            for(let i=0;i<Manager.fishBaseData.data.length;i++){
                if(contentData.fishNameEn==Manager.fishBaseData.data[i].fishNameEn){
                    contentComponent.sprite.spriteFrame=this.spriteFrames[i];
                }
            }
            
            for(let i=0;i<Manager.rarityBaseData.data.length;i++){
                if(contentData.rarity==Manager.rarityBaseData.data[i].rarity){
                    contentComponent.rarityLabel.string=Manager.rarityBaseData.data[i].rarity;
                    contentComponent.rarityLabel.outlineColor=color(Manager.rarityBaseData.data[i].color);
                    contentComponent.rarityLabel.node.setScale(Manager.rarityBaseData.data[i].size, Manager.rarityBaseData.data[i].size, 1);
                }
            }

            contentComponent.box=this;
            contentComponent.identifier=contentData.identifiers;
            contentComponent.weight=contentData.weight;  // 保存鱼的重量
            contentComponent.fishNameLabel.string=contentData.fishNameEn.toString();
            contentComponent.weightNumLabel.string=contentData.weight.toFixed(2);
            contentComponent.priceNumLabel.string=contentData.price.toString();
            
            if(contentData.type=="diamonds"){
                contentComponent.diamondSprite.active=true;
                contentComponent.goldSprite.active=false;
                contentComponent.diamond=contentData.price;
            }
            else{
                contentComponent.diamondSprite.active=false;
                contentComponent.goldSprite.active=true;
                contentComponent.coin=contentData.price;
            }
            this.boxContents.push(contentComponent);
            
            this.contentNode.addChild(contentInstance);
            
        }
    }

    select(boxContent){
        Sound.instance.buttonAudio.play();
        if(boxContent.selecting==true){
            boxContent.selecting=false;
            boxContent.selectNode.active=false;
            this.updateSellNum(-boxContent.coin,-boxContent.diamond);
            // 取消选择时减少 totalKG
            this.updateKG(-boxContent.weight);

            this.selectAllNode.active=false;
        }
        else{
            boxContent.selecting=true;
            boxContent.selectNode.active=true;
            this.updateSellNum(boxContent.coin,boxContent.diamond);
            // 选择时增加 totalKG
            this.updateKG(boxContent.weight);
        }
    }

    selectAll(){
        Sound.instance.buttonAudio.play();
        if(this.selectAllNode.active==true){
            this.selectAllNode.active=false;
            for(const boxContent of this.boxContents){
                boxContent.selecting=false;
                boxContent.selectNode.active=false;
                this.updateSellNum(-boxContent.coin,-boxContent.diamond);
                // 取消选择时减少 totalKG
                this.updateKG(-boxContent.weight);
            }
        }
        else{
            this.selectAllNode.active=true;
            for(const boxContent of this.boxContents){
                boxContent.selecting=true;
                boxContent.selectNode.active=true;
                this.updateSellNum(boxContent.coin,boxContent.diamond);
                // 选择时增加 totalKG
                this.updateKG(boxContent.weight);
            }
        }
    }

    updateSellNum(coin:number,diamond:number){
        this.totalCoins+=coin;
        this.coinNumLabel.string="+"+this.totalCoins.toString();
        
        this.totalDiamonds+=diamond;
        this.diamondNumLabel.string="+"+this.totalDiamonds.toString();
    }

    updateKG(kg:number){
        this.totalKG+=kg;
        // 更新 kgNumLabel 的值为 totalKG/remainKG
        this.kgNumLabel.string=this.totalKG.toFixed(2)+"/"+this.remainKG.toString()+"kg";
        if(this.totalKG>this.remainKG){
            this.kgNumLabel.color=color(255,0,0);
        }
        else{
            this.kgNumLabel.color=color(255,255,255);
        }
    }

    deposit(){//把鱼箱的鱼存入水族箱
        
        // 如果未达到15级，不执行功能
        if(!Manager.userData || !Manager.userData.data || Manager.userData.data.level < 15){
            return;
        }
        if(this.totalKG>this.remainKG){
            return;
        }
        Sound.instance.buttonAudio.play();
        let aquariumIdentifier=0;
        if(Manager.aquariumFishData.data.length>0){
            aquariumIdentifier=parseInt(Manager.aquariumFishData.data[Manager.aquariumFishData.data.length-1].identifiers);
        }
        let depositFishData={identifiers:[]};
    
        for (let i = this.boxContents.length - 1; i >= 0; i--) {
            const boxContent = this.boxContents[i];
            if (boxContent.selecting == true) {
                aquariumIdentifier++;
                let boxdentifier=boxContent.getComponent(BoxContent).identifier;
                //depositFishData.identifiers.push({boxIdentifier:boxdentifier,newIdentifier:aquariumIdentifier.toString()});
                boxContent.node.destroy();
                let fishData=Manager.boxData.data[i];
                // 从 fishBaseData 数组中查找匹配的鱼数据（fishBaseData.data 是数组，不是对象，需要用 find 查找）
                let fishBaseData = Manager.fishBaseData.data.find(fish => fish.fishNameEn === fishData.fishNameEn);
                let difficulty=Manager.rarityBaseData.data.find(rarity => rarity.rarity === fishData.rarity).difficulty;
                // 如果 fishBaseData 中有 feedCost 字段，使用它；否则使用 0
                let feedCost=Math.floor(fishBaseData.feedingPrice*difficulty);
                let claimRewardAmount=fishBaseData.reward*difficulty;
                Manager.aquariumFishData.data.push({identifiers:aquariumIdentifier.toString(),
                    fishNameEn:fishData.fishNameEn,
                    weight:fishData.weight,
                    price:fishData.price,
                    type:fishData.type,
                    rarity:fishData.rarity,
                    putInAquariumTime:Date.now(),
                    feedCount:0,
                    claimCount:0,
                    feedCost:feedCost,
                    claimRewardAmount:claimRewardAmount});
                Manager.usedCapacity+=fishData.weight;
                depositFishData.identifiers.push({boxIdentifier:boxdentifier,newIdentifier:aquariumIdentifier.toString(),feedCost:feedCost,claimRewardAmount:claimRewardAmount});
                Manager.boxData.data.splice(i,1);
                this.boxContents.splice(i, 1); 
            }
        }
        if(depositFishData.identifiers.length>0){
            Manager.getInstance().post('https://api.xdiving.io/api/aquarium/deposit',
            depositFishData,
            (data) => {
                console.log('存鱼数据:', data);
                console.log(depositFishData);
            },
            (error) => {
                console.log(`存鱼数据POST失败: ${error}`);
            }
            )
        }
    }

    sell(){
        Sound.instance.buttonAudio.play();
        this.coinNumLabel.string="+0";
        this.diamondNumLabel.string="+0";
        this.selectAllNode.active=false;
        Manager.userData.data.coins+=this.totalCoins;
        Manager.userData.data.diamonds+=this.totalDiamonds;
        this.updateDataDisplay();

        Manager.sellFishData={userId:Manager.userData.data.userId,identifiers:[]}
        for (let i = this.boxContents.length - 1; i >= 0; i--) {
            const boxContent = this.boxContents[i];
            if (boxContent.selecting == true) {
                let identifier=boxContent.getComponent(BoxContent).identifier;
                Manager.sellFishData.identifiers.push(identifier);
                boxContent.node.destroy();
                Manager.boxData.data.splice(i,1);
                this.boxContents.splice(i, 1); 
            }
        }
        if(Manager.sellFishData.identifiers.length>0){
            Manager.getInstance().post('https://api.xdiving.io/api/fish-catch/unified-sell',
            Manager.sellFishData,
            (data) => {
                console.log('卖鱼数据:', data);
                console.log(Manager.sellFishData);
            },
            (error) => {
                console.log(`卖鱼数据POST失败: ${error}`);
            }
            )
        }
    }

    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }

    update(deltaTime: number) {

    }
}