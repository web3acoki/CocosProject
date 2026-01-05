import { _decorator, animation, Component, instantiate, JsonAsset, Label, Mask, Node, Prefab, ProgressBar, randomRange, Skeleton, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { sp } from 'cc';
import { Fish } from './Fish';
import { Manager } from './Manager';
import { Treasure } from './Treasure';
import { GeneralUI } from './GeneralUI';
import { GameContent } from './GameContent';
import { Sound } from './Sound';
import Player from './Player';
import { gameQuestContent } from './gameQuestContent';
import { QuestContent } from './QuestContent';
const { ccclass, property } = _decorator;


class Boundary{
  left:number=0;
  right:number=0;
  up:number=0;
  down:number=0;
}

@ccclass('Game')
export class Game extends Component {

    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Mask)
    mask:Mask=null;

    @property([SpriteFrame])//鱼图鉴，动图与大图
    fishImages:SpriteFrame[]=[];
    @property([sp.SkeletonData])
    fishJsons: sp.SkeletonData[] = [];
    @property(Prefab)
    fishPrefab: Prefab = null;

    //@property(Prefab)//道具
    //gameContentPrefab:Prefab=null;
    @property([SpriteFrame])
    propSprites:SpriteFrame[]=[];
    @property(Node)
    choosePropNode:Node=null;
    @property(GameContent)
    curPropContent:GameContent=null;
    curPropIndex=0;

    @property(Node)//节点
    playerNode:Node=null;
    @property(Node)
    fishesNode: Node = null;
    @property(Node)
    tempNode:Node=null;

    @property(Node)//墙
    walls: Node = null;
    wallBoundarys:Boundary[]=[];

    @property(Node)//出生范围
    spawns: Node = null;
    spawnBoundarys:Boundary[]=[];

    @property(Node)//宝箱
    treasuresNode:Node=null;
    treasureBoundarys:Boundary[]=[];
    treasures:Treasure[]=[];
    
    @property(Prefab)//血条
    healthBar:Prefab=null;
    healthBars:ProgressBar[]=[];

    @property(Prefab)//攻击提示
    attackHint:Prefab=null;
    @property(Prefab)//受击提示
    attackedHint:Prefab=null;
    @property(Prefab)//眩晕提示
    stunHint:Prefab=null;

    @property(Sprite)
    redFrame:Sprite=null;
    @property(Node)
    redOxygen:Node=null;

    @property(Node)
    questNode:Node=null;
    @property(Prefab)
    questContentPrefab:Prefab=null;
    //@property(Label)
    //userId: Label = null;
    //@property(Label)
    //userCoins: Label = null;
    //@property(Label)
    //userDiamonds: Label = null;

    redOxygenTimer=0;

    //@property(Node)
    //walls:
    start() {
        this.mask.enabled=true;
        this.generalUI.updateDisplay();
        this.generalUI.updateLevel();
        
        // 初始化游戏中的任务显示
        this.initGameQuests();

        for(let index=0;index<this.choosePropNode.children.length;index++){//生成道具
          let gameContent = this.choosePropNode.children[index].getComponent(GameContent);
          gameContent.index = index;
          gameContent.game = this;
          gameContent.propSprite.spriteFrame = this.propSprites[index];
          gameContent.propNumLabel.string="x"+Manager.propData.data[index].quantity.toString();
        }
        this.curPropIndex=Manager.userData.data.mainPropId-1;
        console.log(this.curPropIndex);
        
        this.curPropContent.index=-1;
        this.curPropContent.game = this;
        this.curPropContent.propSprite.spriteFrame=this.propSprites[this.curPropIndex];
        this.curPropContent.propNumLabel.string="x"+Manager.propData.data[this.curPropIndex].quantity.toString();

        for (let wall of this.walls.children) {//墙边界
          //this.wallsprites.push(wall);
          const ut=wall.getComponent(UITransform);
          const boundary=new Boundary;
           boundary.left=wall.position.x-ut.contentSize.x/2;
           boundary.right=wall.position.x+ut.contentSize.x/2;
           boundary.up=wall.position.y+ut.contentSize.y/2;
           boundary.down=wall.position.y-ut.contentSize.y/2;
          this.wallBoundarys.push(boundary);
        }
        this.walls.active=false;
        
        for (let spawn of this.spawns.children) {//出生边界
          //this.wallsprites.push(wall);
          const ut=spawn.getComponent(UITransform);
          const boundary=new Boundary;
           boundary.left=spawn.position.x-ut.contentSize.x/2;
           boundary.right=spawn.position.x+ut.contentSize.x/2;
           boundary.up=spawn.position.y+ut.contentSize.y/2;
           boundary.down=spawn.position.y-ut.contentSize.y/2;
          this.spawnBoundarys.push(boundary);
        }
        this.spawns.active=false;

        for (let treasure of this.treasuresNode.children) {//宝箱边界
          //this.wallsprites.push(wall);
          const ut=treasure.getComponent(UITransform);
          const boundary=new Boundary;
           boundary.left=treasure.position.x-ut.contentSize.x/2;
           boundary.right=treasure.position.x+ut.contentSize.x/2;
           boundary.up=treasure.position.y+ut.contentSize.y/2;
           boundary.down=treasure.position.y-ut.contentSize.y/2;
          this.treasureBoundarys.push(boundary);
          this.treasures.push(treasure.getComponent(Treasure));
        }

        for(let index=0;index<this.fishJsons.length;index++){//生成鱼
            let fishData=Manager.fishBaseData.data[index];
            if(Manager.userData.data.swordfishCatched){
                if(fishData.fishNameEn=="Swordfish"){
                    break;
                }
            }
            for(let i=0;i<fishData.rarity;i++){;

                let fishInstance = instantiate(this.fishPrefab);

                let fishSkeleton=fishInstance.getComponent(sp.Skeleton);
                fishSkeleton.skeletonData=this.fishJsons[index];
                
                // 获取第一个可用的动画名称
                let animationName = "animation"; // 默认值
                //const skeletonData = this.fishJsons[index];
                //if (skeletonData) {
                //    try {
                //        // 获取运行时数据以访问动画列表
                //        const runtimeData = skeletonData.getRuntimeData();
                //        if (runtimeData && runtimeData.animations && runtimeData.animations.length > 0) {
                //            // 使用第一个动画的名称
                //            animationName = runtimeData.animations[0].name;
                //        }
                //    } catch (e) {
                //        // 如果 getRuntimeData 不可用，使用默认值
                //        console.warn(`无法获取动画列表，使用默认动画名称: ${e}`);
                //    }
                //}
                
                // 设置第一个动画（循环播放）
                fishSkeleton.setAnimation(0, animationName, true);

                //let fishInstance = instantiate(this.fishPrefabs[index]);
                
                //fishInstance.setScale(precent*fishData.size, precent*fishData.size, 1);
                
                let precent=randomRange(0.8,1.2)
                
                fishSkeleton.timeScale=1/precent;
                fishInstance.setScale(precent, precent, 1);
                fishInstance.angle = randomRange(-180, 180);
                
                let fishComponent=fishInstance.getComponent(Fish);

                fishComponent.index=index;
                let randomRarity=randomRange(0,Manager.totalRarity);
                for(let index=0;index<Manager.rarityBaseData.data.length;index++){
                  if(randomRarity<Manager.actualRarity[index]){
                    fishComponent.rarityIndex=index;
                    break;
                  }
                }
                fishComponent.precent=precent;
                fishComponent.attack=Math.round(fishData.attack*precent);
                fishComponent.health=Math.round(fishData.health*precent);
                fishComponent.maxHealth=Math.round(fishData.health*precent);
                fishComponent.maxSpeed=fishData.speed;
                
                if(fishData.fishNameEn=="Swordfish"){
                    fishSkeleton.premultipliedAlpha=true;
                    fishComponent.utSize=150;
                }
                else{
                    fishComponent.utSize=fishInstance.getComponent(UITransform).contentSize.x/2*precent;
                }
                if(fishComponent.attack>0){
                    fishComponent.speed=0.15;
                }
                else{
                    fishComponent.speed=fishData.speed;
                }

                fishComponent.game=this.node.getComponent(Game);

                let boundary=this.spawnBoundarys[index];
                fishComponent.spawnBoundary=boundary;
                
                fishComponent.bloodSkeleton.node.setScale(fishComponent.utSize/100, fishComponent.utSize/100, 1);
                fishComponent.bloodSkeleton.node.active=false; 

                fishComponent.stunHint.setScale(0.1+fishComponent.utSize/1000, 0.1+fishComponent.utSize/1000, 1);
                fishComponent.stunHint.setPosition(fishComponent.node.getPosition().add(new Vec3(-fishComponent.utSize*0.8,fishComponent.utSize*0.7,0)));
                fishComponent.stunHint.active=false; 

                let newPos =new Vec3(randomRange(boundary.left,boundary.right), randomRange(boundary.down,boundary.up), 0);
                let left=newPos.x-fishComponent.utSize;
                let right=newPos.x+fishComponent.utSize;
                let up=newPos.y+fishComponent.utSize;
                let down=newPos.y-fishComponent.utSize;
                
                let j=0;
                while(j<100){
                    j++;
                    let inWall=false;
                    for(const wallBoundary of this.wallBoundarys){
                        if(right>wallBoundary.left&&left<wallBoundary.right&&down<wallBoundary.up&&up>wallBoundary.down){
                            inWall=true;
                            newPos =new Vec3(randomRange(boundary.left,boundary.right), randomRange(boundary.down,boundary.up), 0);
                            left=newPos.x-fishComponent.utSize;
                            right=newPos.x+fishComponent.utSize;
                            up=newPos.y+fishComponent.utSize;
                            down=newPos.y-fishComponent.utSize;
                        }
                    }
                    if(!inWall){
                        break;
                    }
                }
                fishInstance.setPosition(newPos);
                //this.fishes.push(fishInstance);
                this.fishesNode.addChild(fishInstance);
            }
        }
    }
    
    /**
     * 初始化游戏中的任务显示
     * 如果任务状态为2（正在进行中）且ID为0,2,4,6,8,9,10,11,12，则生成对应的questContent
     */
    initGameQuests() {
        if (!this.questNode || !this.questContentPrefab || !Manager.questData) {
            console.warn('Game: questNode, questContentPrefab or questData not configured');
            return;
        }
        
        // 任务ID到fish images索引的映射
        const questIdToFishImageMap: { [key: number]: number } = {
            0: 0,
            2: 2,
            4: 6,
            6: 11,
            8: 10,
            9: 4,
            10: 5,
            11: 7,
            12: 9
        };
        
        // 遍历任务数据
        for (let i = 0; i < Manager.questData.data.length; i++) {
            const quest = Manager.questData.data[i];
            
            // 检查任务状态是否小于3（正在进行中）且ID在映射表中
            if (quest.questStatus <3 && questIdToFishImageMap.hasOwnProperty(i)) {
                const fishImageIndex = questIdToFishImageMap[i];
                
              console.log(fishImageIndex);
                // 检查fish images索引是否有效
                if (fishImageIndex >= 0 && fishImageIndex < this.fishImages.length) {
                    // 创建questContent实例
                    const questContentInstance = instantiate(this.questContentPrefab);
                    // 尝试获取 gameQuestContent 组件（如果存在）
                    let questContentComponent = questContentInstance.getComponent(gameQuestContent);
                    // 如果不存在，尝试获取 QuestContent 组件
                    if (!questContentComponent) {
                        const questContent = questContentInstance.getComponent(QuestContent);
                        if (questContent && questContent.sprite) {
                            questContent.sprite.spriteFrame = this.fishImages[fishImageIndex];
                        }
                        if (questContent && questContent.progressLabel) {
                            // 使用 (progress/quantity) 格式，参考 Quest 脚本
                            const quantity = Manager.questBaseData.data[i].quantity;
                            questContent.progressLabel.string = "(" + quest.progress.toString() + "/" + quantity.toString() + ")";
                        }
                    } else {
                        // 使用 gameQuestContent 组件
                        if (questContentComponent.sprite) {
                            questContentComponent.sprite.spriteFrame = this.fishImages[fishImageIndex];
                        }
                        if (questContentComponent.progressLabel) {
                            // 使用 (progress/quantity) 格式，参考 Quest 脚本
                            const quantity = Manager.questBaseData.data[i].quantity;
                            questContentComponent.progressLabel.string = "(" + quest.progress.toString() + "/" + quantity.toString() + ")";
                        }
                    }
                    
                    // 存储任务ID到节点，方便后续更新
                    questContentInstance['questId'] = i;
                    
                    // 添加到questNode
                    this.questNode.addChild(questContentInstance);
                    
                    console.log(`Game: Created questContent for quest ID ${i}, fish image index ${fishImageIndex}, progress ${quest.progress}`);
                } else {
                    console.warn(`Game: Invalid fish image index ${fishImageIndex} for quest ID ${quest.identifier}`);
                }
            }
        }
    }
    
    /**
     * 更新任务进度显示
     * @param questId 任务ID
     * @param progress 新的进度值
     */
    updateQuestProgress(questId: number, progress: number) {
        if (!this.questNode) {
            return;
        }
        
        // 遍历 questNode 的子节点，找到对应的任务
        for (let i = 0; i < this.questNode.children.length; i++) {
            const child = this.questNode.children[i];
            if (child['questId'] === questId) {
                // 获取任务的目标数量
                const quantity = Manager.questBaseData.data[questId].quantity;
                const progressText = "(" + progress.toString() + "/" + quantity.toString() + ")";
                
                // 尝试更新 gameQuestContent
                const gameQuestComp = child.getComponent(gameQuestContent);
                if (gameQuestComp && gameQuestComp.progressLabel) {
                    gameQuestComp.progressLabel.string = progressText;
                    console.log(`Game: Updated quest ${questId} progress to ${progressText}`);
                    return;
                }
                // 尝试更新 QuestContent
                const questComp = child.getComponent(QuestContent);
                if (questComp && questComp.progressLabel) {
                    questComp.progressLabel.string = progressText;
                    console.log(`Game: Updated quest ${questId} progress to ${progressText}`);
                    return;
                }
            }
        }
    }
    
    hideProp(){
      Sound.instance.buttonAudio.play();
      this.choosePropNode.active=!this.choosePropNode.active;
      this.curPropContent.node.active=!this.curPropContent.node.active;
    }
    
    useProp(){
      this.playerNode.getComponent(Player).useProp(this.curPropIndex);
    }

    update(deltaTime: number) {
        if(this.redOxygen.active){
            if(this.redOxygenTimer<1)
                this.redOxygenTimer+=deltaTime;
            else{
                this.redOxygen.active=false;
            }
        }
    }
}