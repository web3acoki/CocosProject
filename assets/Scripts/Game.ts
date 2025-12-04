import { _decorator, animation, Component, instantiate, JsonAsset, Label, Node, Prefab, ProgressBar, randomRange, Skeleton, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { sp } from 'cc';
import { Fish } from './Fish';
import { Manager } from './Manager';
import { Treasure } from './Treasure';
import { GeneralUI } from './GeneralUI';
import { GameContent } from './GameContent';
import { Sound } from './Sound';
import Player from './Player';
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

    @property([SpriteFrame])//鱼图鉴，动图与大图
    fishImages:SpriteFrame[]=[];
    @property([sp.SkeletonData])
    fishJsons: sp.SkeletonData[] = [];
    @property(Prefab)
    fishPrefab: Prefab = null;

    @property(Prefab)//道具
    gameContentPrefab:Prefab=null;
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
        this.generalUI.updateDisplay();
        this.generalUI.updateLevel();

        for(let index=0;index<this.choosePropNode.children.length;index++){
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

                let boundary=this.spawnBoundarys[Math.round(fishData.spawnRegion)];
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