import { _decorator, Component, director, instantiate, Node, Prefab, SpriteFrame, UITransform, Vec3, randomRange, sp, color, Color } from 'cc';
import { DecorationContent } from './DecorationContent';
import { Manager } from './Manager';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { AquariumFish } from './AquariumFish';
import { DetailContent } from './DetailContent';
const { ccclass, property } = _decorator;

// 边界类
class Boundary{
    left:number=0;
    right:number=0;
    up:number=0;
    down:number=0;
}

@ccclass('Aquarium')
export class Aquarium extends Component {

    @property(GeneralUI)
    generalUI:GeneralUI=null;

    
    @property(Node)
    aquariumBoundary:Node=null;

    @property(Prefab)
    fishContentPrefab:Prefab=null;
    @property(Node)
    fishContentNode:Node=null;


    @property(Node)
    fishDetailsContentNode:Node=null;
    @property(Prefab)
    fishDetailsContentPrefab:Prefab=null;
    @property(Node)
    decorationContentNode:Node=null;
    @property(Prefab)
    decorationContentPrefab:Prefab=null;

    @property(Node)
    aquariumNode:Node=null;
    @property(Node)
    decorationNode:Node=null;
    @property(Node)
    fishDetailsNode:Node=null;
    @property(Node)
    topNode:Node=null;

    @property(Node)
    aquariumChosed:Node=null;
    @property(Node)
    decorationChosed:Node=null;
    @property(Node)
    fishDetailsChosed:Node=null;
    @property(Node)
    aquariumUnchosed:Node=null;
    @property(Node)
    decorationUnChosed:Node=null;
    @property(Node)
    fishDetailsUnChosed:Node=null;

    @property([SpriteFrame])
    decorationSpriteFrames:SpriteFrame[]=[];

    @property([SpriteFrame])
    fishSpriteFrames:SpriteFrame[]=[];

    @property([sp.SkeletonData])
    fishJsons: sp.SkeletonData[] = [];

    @property([Node])
    dacorationNodes:Node[]=[];

    decorationContents: DecorationContent[]=[];
    detailContentsMap:Map<string, DetailContent>=new Map();
    fishContentsMap:Map<string, AquariumFish>=new Map();

    currentPage:'decoration'|'aquarium'|'fishDetails'='aquarium';
    
    aquariumBoundaryData:Boundary=null;  // 水族馆边界数据

    start() {
        director.preloadScene("Menu");
        this.initAquariumBoundary();
        this.getReward();
        this.updateDataDisplay();
        this.initDecoration();
        this.initFish();
    }

    initAquariumBoundary(){
        // 从 aquariumBoundary Node 获取边界信息
        if(this.aquariumBoundary){
            const ut = this.aquariumBoundary.getComponent(UITransform);
            if(ut){
                const pos = this.aquariumBoundary.getPosition();
                const size = ut.contentSize;
                this.aquariumBoundaryData = {
                    left: pos.x - size.width / 2,
                    right: pos.x + size.width / 2,
                    up: pos.y + size.height / 2,
                    down: pos.y - size.height / 2
                };
            }
        }
    }

    updateDataDisplay(){
        this.generalUI.updateDisplay();
    }

    update(deltaTime: number) {
        
    }

    select(content:any){
    }

    getReward(){
    }

    initFish(){
        for(let index=0;index<Manager.aquariumFishData.data.length;index++){
            let fishData=Manager.aquariumFishData.data[index];
            let fishInstance = instantiate(this.fishContentPrefab);
            let fishBaseData = Manager.fishBaseData.data.find(fish => fish.fishNameEn === fishData.fishNameEn);
            
            if(!fishBaseData){
                continue;
            }
            
            // 找到对应的骨架数据索引
            let fishJsonIndex = -1;
            for(let i=0; i<Manager.fishBaseData.data.length; i++){
                if(Manager.fishBaseData.data[i].fishNameEn === fishData.fishNameEn){
                    fishJsonIndex = i;
                    break;
                }
            }
            
            // 设置骨架和动画（类似 Game.ts 中的方式）
            if(fishJsonIndex >= 0 && fishJsonIndex < this.fishJsons.length){
                let fishSkeleton = fishInstance.getComponent(sp.Skeleton);
                if(fishSkeleton){
                    fishSkeleton.skeletonData = this.fishJsons[fishJsonIndex];
                    let animationName = "animation"; // 默认值
                    fishSkeleton.setAnimation(0, animationName, true);
                }
            }
            
            let precent=fishData.weight/fishBaseData.weight;
            
            // 设置缩放和时间缩放（类似 Game.ts 中的方式）
            let fishSkeleton = fishInstance.getComponent(sp.Skeleton);
            if(fishSkeleton){
                fishSkeleton.timeScale = 1/precent;
            }
            fishInstance.setScale(precent, precent, 1);
            fishInstance.angle = randomRange(-180, 180);
            
            let fishContent = fishInstance.getComponent(AquariumFish);
            
            // 初始化 utSize（类似 Game.ts 中的方式）
            if(fishBaseData.fishNameEn=="Swordfish"){
                if(fishSkeleton){
                    fishSkeleton.premultipliedAlpha=true;
                }
                fishContent.utSize=150;
            }
            else{
                const ut = fishInstance.getComponent(UITransform);
                if(ut){
                    fishContent.utSize = ut.contentSize.x / 2 * precent;
                }
            }
            
            // 设置速度和最大速度
            fishContent.maxSpeed = fishBaseData.speed;
            fishContent.speed = fishBaseData.speed;
            
            // 设置水族馆边界
            fishContent.aquariumBoundary = this.aquariumBoundaryData;
            fishContent.aquarium = this;
            
            // 设置初始位置（在水族馆范围内随机）
            if(this.aquariumBoundaryData){
               
                // 确保鱼不会超出边界
                let left = this.aquariumBoundaryData.left + fishContent.utSize;
                let right = this.aquariumBoundaryData.right - fishContent.utSize;
                let up = this.aquariumBoundaryData.up - fishContent.utSize;
                let down = this.aquariumBoundaryData.down + fishContent.utSize;
                fishInstance.setPosition(new Vec3(randomRange(left, right),randomRange(down, up),0));
            }
            
            this.fishContentsMap.set(fishData.identifiers, fishContent);
            this.fishContentNode.addChild(fishInstance);
            
            // 同时创建到水族箱细节
            let detailInstance = instantiate(this.fishDetailsContentPrefab);
            let detailContent = detailInstance.getComponent(DetailContent);
            
            // 设置 sprite
            for(let i=0; i<Manager.fishBaseData.data.length; i++){
                if(fishData.fishNameEn == Manager.fishBaseData.data[i].fishNameEn){
                    if(i < this.fishSpriteFrames.length){
                        detailContent.sprite.spriteFrame = this.fishSpriteFrames[i];
                    }
                    break;
                }
            }
            
            // 设置 rarity label
            for(let i=0; i<Manager.rarityBaseData.data.length; i++){
                if(fishData.rarity == Manager.rarityBaseData.data[i].rarity){
                    detailContent.rarityLabel.string = Manager.rarityBaseData.data[i].rarity;
                    detailContent.rarityLabel.outlineColor = color(Manager.rarityBaseData.data[i].color);
                    detailContent.rarityLabel.node.setScale(Manager.rarityBaseData.data[i].size, Manager.rarityBaseData.data[i].size, 1);
                    break;
                }
            }
            
            // 设置基本信息
            detailContent.aquarium = this;
            detailContent.identifier = fishData.identifiers;
            detailContent.fishNameLabel.string = fishData.fishNameEn.toString();
            detailContent.weightNumLabel.string = fishData.weight.toFixed(2);
            detailContent.priceNumLabel.string = fishData.price.toString();
            
            // 设置奖励类型（diamonds 或 gold）
            if(fishData.type == "diamonds"){
                detailContent.diamondSprite.active = true;
                detailContent.goldSprite.active = false;
                detailContent.diamond = fishData.price;
                detailContent.coin = 0;
            }
            else{
                detailContent.diamondSprite.active = false;
                detailContent.goldSprite.active = true;
                detailContent.diamond = 0;
                detailContent.coin = fishData.price;
            }
            
            // 设置 feedCost 和 reward
            detailContent.feedCost = fishData.feedCost;
            detailContent.reward = fishData.claimRewrdAmount;
            
            this.detailContentsMap.set(fishData.identifiers, detailContent);
            this.fishDetailsContentNode.addChild(detailInstance);
        }
    }

    destroyFish(identifier:string){
        let fishContent = this.fishContentsMap.get(identifier);
        if(fishContent){
            fishContent.node.destroy();
            this.fishContentsMap.delete(identifier);
        }
        
        // 同时销毁对应的 DetailContent
        let detailContent = this.detailContentsMap.get(identifier);
        if(detailContent){
            detailContent.node.destroy();
            this.detailContentsMap.delete(identifier);
        }
    }

    initDecoration(){
        
        let upgradeContent = instantiate(this.decorationContentPrefab).getComponent(DecorationContent);
        let level=Manager.aquariumLevelData.data.level;
        console.log("level:"+level);
        upgradeContent.nameLabel.string="Used:"+Manager.usedCapacity.toFixed(2)+"kg";
        upgradeContent.buttonLabel.string="Upgrade";
        if(level==Manager.aquariumBaseData.data.length){
            upgradeContent.bonusLabel.string="Lv."+level+" Capacity "+Manager.aquariumBaseData.data[level-1].capacity+" kg\n";
            upgradeContent.receivedNode.active=true;
            upgradeContent.buttonNode.active=false;
            // 已满级，不需要显示价格
            upgradeContent.priceLabel.string="";
        }
        else{
            upgradeContent.bonusLabel.string="Lv."+level+" Capacity "+Manager.aquariumBaseData.data[level-1].capacity+" kg\n"
            +"Lv."+(level+1).toString()+" Capacity "+Manager.aquariumBaseData.data[level].capacity+" kg";
            upgradeContent.receivedNode.active=false;
            upgradeContent.buttonNode.active=true;
            // 设置价格，去掉 "X " 符号
            let upgradeCost = Manager.aquariumBaseData.data[level].gold;
            upgradeContent.priceLabel.string=upgradeCost.toString();
            // 如果金钱不足，显示为红色（使用coins）
            if(Manager.userData && Manager.userData.data && Manager.userData.data.coins < upgradeCost){
                upgradeContent.priceLabel.color = color(255, 0, 0);
            }
            else{
                upgradeContent.priceLabel.color = color(0, 0, 0); // 默认黑色
            }
        }
        
        this.decorationContents.push(upgradeContent);
        this.decorationContentNode.addChild(upgradeContent.node);

        for(let index=0;index<Manager.decorationBaseData.data.length;index++){

            let decorationContent = instantiate(this.decorationContentPrefab).getComponent(DecorationContent);
            let decorationData=Manager.decorationBaseData.data[index];

            // 改变 decorationContent 的 sprite
            if(index < this.decorationSpriteFrames.length){
                decorationContent.sprite.spriteFrame=this.decorationSpriteFrames[index];
            }
            
            // status: 0=未购买, 1=已购买
            if(Manager.decorationData.data[index].status==0){
                // 未购买：显示购买按钮
                decorationContent.receivedNode.active=false;
                decorationContent.buttonNode.active=true;
            }
            else if(Manager.decorationData.data[index].status==1){
                // 已购买：隐藏购买按钮，显示装饰节点
                decorationContent.receivedNode.active=true;
                decorationContent.buttonNode.active=false;
                // 如果 status 为 1，设置对应的 decorationNodes 为 active
                if(index < this.dacorationNodes.length){
                    this.dacorationNodes[index].active = true;
                }
            }
            //decorationContent.aquarium=this;
            decorationContent.decorationIndex=index;
            decorationContent.nameLabel.string=decorationData.decorationName;
            decorationContent.bonusLabel.string="Diamond production increased by "+((decorationData.bonus*100).toFixed(2))+"%";
            // 设置价格，去掉 "X " 符号
            decorationContent.priceLabel.string=decorationData.price.toString();
            // 如果金钱不足，显示为红色（使用coins）
            if(Manager.userData && Manager.userData.data && Manager.userData.data.coins < decorationData.price){
                decorationContent.priceLabel.color = color(255, 0, 0);
            }
            else{
                decorationContent.priceLabel.color = color(0, 0, 0); // 默认黑色
            }
            
            this.decorationContents.push(decorationContent);
            this.decorationContentNode.addChild(decorationContent.node);
        }
    }

    switchPage(page:'decoration'|'aquarium'|'fishDetails'){
        // 如果已经是当前页面，直接返回
        if(this.currentPage === page){
            return;
        }
        
        Sound.instance.buttonAudio.play();
        
        // 更新当前页面
        this.currentPage = page;
        
        this.topNode.active = page !== 'aquarium';
        
        // 切换内容节点
        this.decorationNode.active = page === 'decoration';
        //this.aquariumNode.active = page === 'aquarium';
        this.fishDetailsNode.active = page === 'fishDetails';
        
        // 显示顶部节点
        
        // 切换选中状态按钮
        this.aquariumChosed.active = page === 'aquarium';
        this.decorationChosed.active = page === 'decoration';
        this.fishDetailsChosed.active = page === 'fishDetails';
        
        // 切换未选中状态按钮
        this.aquariumUnchosed.active = page !== 'aquarium';
        this.decorationUnChosed.active = page !== 'decoration';
        this.fishDetailsUnChosed.active = page !== 'fishDetails';
    }

    showDecoration(){
        this.switchPage('decoration');
    }

    showAquarium(){
        this.switchPage('aquarium');
    }

    showFishDetails(){
        this.switchPage('fishDetails');
    }

    purchaseDecoration(content:DecorationContent){
    }

    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }
}


