import {
  _decorator,
  Component,
  CCInteger,
  RigidBody2D,
  PhysicsSystem2D,
  EventTouch,
  SystemEventType,
  misc,
  Vec3,
  Vec2,
  Node,
  Collider,
  BoxCollider2D,
  Contact2DType,
  Collider2D,
  IPhysics2DContact,
  Sprite,
  UITransform,
  math,
  instantiate,
  Prefab,
  view,
  ProgressBar,
  Label,
  director,
  AudioSource,
  Color,
  color,
  randomRange,
  Skeleton,
  sp,
  SpriteFrame,
  UI,
  Size,
  randomRangeInt,
} from "cc";
const { ccclass, property } = _decorator;

import { instance, SpeedType } from "./Joystick";
import type { JoystickDataType } from "./Joystick";
import { Game } from "./Game";
import { Fish } from "./Fish";
import { GifPlayer } from "./GifPlayer";
import { Manager } from "./Manager";
import { Sound } from "./Sound";
import { GameContent } from "./GameContent";
import { CameraFollow } from "./CameraFollow";
//PhysicsSystem2D.instance.enable = true;
  
class Boundary{
  left:number=0;
  right:number=0;
  up:number=0;
  down:number=0;
}

class FishData{
    fishIndex:number=0;
    weight:number=0;
    reward:number=0;
}

export enum PlayerState {
  DIVE,
  MOVE,
  SHOOT,
  CATCH,
  RETRACT,
  //DISPLAY,
  DIE,
  WIN
}

@ccclass("Player")
export default class Player extends Component {

  //@property([Collider])
  //walls: Collider[] = [];

  @property(Game)
  game :Game=null;
  
  @property(Node)
  map:Node=null;

  @property(Node)//人物
  moveBody :Node=null;
  @property(Node)
  shootBody:Node=null;
  @property(Node)
  catchBody :Node=null;
  @property(Node)
  retractBody:Node=null;
  @property(Node)
  boostBody:Node=null;
  @property(Node)
  dyingBody :Node=null;
  @property(Node)
  diveBody:Node=null;

  @property(Node)
  light:Node=null;
  @property(Node)
  harpoon:Node=null;
  @property(Node)
  rope:Node=null;

  @property(sp.Skeleton)
  bloodSkeleton:sp.Skeleton=null;

  @property(Node)
  boostFollow:Node=null;
  @property(Node)
  boostCanvas:Node=null;
  
  @property(Node)
  weaponMask:Node=null;

  @property(Node)//进度条
  bar:Node=null;
  @property(ProgressBar)
  pBar:ProgressBar=null;
  @property(Node)
  fishBar:Node=null;

  @property(Node)//超重弹窗
  overFrame:Node=null;
  @property(Node)//死亡弹窗
  deathFrame:Node=null;
  //@property(Node)
  //settingFrame:Node=null;

  @property(Node)//捕捉弹窗
  catchFrame:Node=null;
  @property(Sprite)
  catchSprite:Sprite=null;
  @property(Label)
  catchNameLabel:Label=null;
  @property(Label)
  catchWeightLabel:Label=null;
  @property(Label)
  catchRarityLabel:Label=null;

  @property(Node)//宝箱弹窗
  treasureFrame:Node=null;
  @property(Node)
  treasureGold:Node=null;
  @property(Node)
  treasureProp:Node=null;
  @property(Sprite)
  treasurePropSprite:Sprite=null;
  //@property([SpriteFrame])
  //treasurePropSprites:SpriteFrame[]=[];
  @property(Label)
  treasureCoinNumLabel:Label=null;
  @property(Label)
  treasureCoinNumLabel2:Label=null;
  @property(Label)
  treasurePropNumLabel:Label=null;

  @property(Label)//文字
  boxWeightLabel:Label=null;
  @property(Label)
  depthNumLabel:Label=null;
  @property(Label)
  oxygenNumLabel:Label=null;
  //@property(Label)
  //propNumLabel:Label=null;


  @property(Node)//小地图
  openMap:Node=null;
  @property(Node)
  littleMap:Node=null;
  @property(Node)
  littlePos:Node=null;

  //@property(AudioSource)//音效
  //buttonAudio:AudioSource=null;
  //@property(AudioSource)
  //stayAudio:AudioSource=null;
  //@property(AudioSource)
  //moveAudio:AudioSource=null;
  //@property(AudioSource)
  //boostAudio:AudioSource=null;
  //@property(AudioSource)
  //shootAudio:AudioSource=null;
  //@property(AudioSource)
  //catchAudio:AudioSource=null;
  //@property(AudioSource)
  //treasureAudio:AudioSource=null;
  //@property(AudioSource)
  //backAudio:AudioSource=null;
  
  //@property(Node)//设置
  //BGMon:Node=null;
  //@property(Node)
  //BGMoff:Node=null;
  //@property(Node)
  //BGSon:Node=null;
  //@property(Node)
  //BGSoff:Node=null;

  cur=0;//引导
  @property(Node)
  guideGround:Node=null;
  @property(Node)
  guide1:Node=null;
  @property(Node)
  guide2:Node=null;
  @property(Node)
  guide3:Node=null;
  @property(Node)
  guide31:Node=null;
  @property(Node)
  guide32:Node=null;
  @property(Node)
  guide4:Node=null;
  @property(Node)
  guide5:Node=null;

  //moving=false;
  @property(Node)
  blackFrame:Node=null;

  @property(Sprite)
  blackGround:Sprite=null;

  
  catchFishDatas:FishData[]=[];
  depth=0;
  maxDepth=0;
  //playing=true;
  boxWeight=0;
  boxMaxWeight=30;

  oxygen=120;
  maxOxygen=120;

  attack=1;
  baseAttack=1;
  hammerAttack=1;
  hammerTimer=0;

  //pulsing=false;
  //pulseTimer=3;

  boostTimer=20;

  playerState:PlayerState=PlayerState.DIVE;
  
  _speedType: SpeedType = SpeedType.STOP;//移动
  moveDir = new Vec3(0, 1, 0);//方向
  _moveSpeed = 0;//实际速度
  fastSpeed = 187;//实际运动速度
  baseSpeed = 187;//基础速度
  multiplier = 1;//测试速度
  boosting = 1;//助推器速度
  overWeight = 1;//超重速度

  fishIdentifer=0;
  //shooting=false;
  private harpoonOrigin=new Vec3;
  private ropeLong = 0;//鱼叉发射
  private ropeUT=null;

  //catching=false;
  catchProgress=0.3;//捕捉
  catchingFish:Node=null;
  catchSuccess=true;
  catchDifficulty=0.3;
  
  originScale:Vec3;
  reverseScale:Vec3;
  
  diveTimer=0;
  shootTimer=0;
  
  retractTimer=0.3;
  guideTimer=1;

  //displaying=false;
  displayTimer=1;//鱼和宝箱展示
  dieTimer=0;//死亡等待
  backTimer=0;//返回等待
  
  blackDisplayTimer=2;//黑色背景等待
  blackGroundA=0;//黑色背景透明度
  consuming=false;//消耗氧气
  oxygenEnough=true;//氧气大于一半
  //@property(Node)
  //walls: Node = null;
  
  redFrameARise=true;//红色警告透明度增加
  redFrameA=0;//红色警告透明度

  confirm=false;//确认死亡

  userId=1;

  catchSwordfish=false;

  firstWin=true;
  firstDie=true;
  

  test1(){
    this.multiplier=1;
    this.setFastSpeed();
  }

  test4(){
    this.multiplier=4;
    this.setFastSpeed();
  }

  test16(){
    
    this.multiplier=16;
    this.setFastSpeed();
  }

  onLoad() {
    instance.on(SystemEventType.TOUCH_MOVE, this.onTouchMove, this);
    instance.on(SystemEventType.TOUCH_END, this.onTouchEnd, this);
  }

  start(){
    Sound.instance.BGM.pause();
    Manager.userData.data.remainingRounds-=1;
    this.finishQuest(15);
    this.userId=Manager.userData.data.userId;
    let mapID=1;
    let url="https://api.xdiving.io/api/diving-session/user/"+this.userId.toString()+"/game-start/"+mapID.toString();
    Manager.getInstance().post(url,
    {},
    (data) => {
      console.log('开始数据:', data);
      //console.log(Manager.startData);
      },
      (error) => {
          console.log(`'开始数据POST失败: ${error}`);
      }
    )
    Manager.endData={userId:1,catches:[],treasures:[],maxDepth:0,endReason:"",mainPropId:1};
    //Manager.endData.usedProps.push({propId:1,quantity:0});
    this.harpoonOrigin=this.harpoon.getPosition();
    this.ropeUT=this.rope.getComponent(UITransform);
    this.harpoon.active=false;
    this.rope.active=false;
    this.bar.active=false;
    this.catchFrame.active=false;
    this.overFrame.active=false;
    this.deathFrame.active=false;

    this.originScale=new Vec3(this.node.scale.x,this.node.scale.y,1);
    this.reverseScale=new Vec3(this.node.scale.x,-this.node.scale.y,1);

    this.baseAttack=Manager.harpoons[Manager.equipmentData.data[0].level-1].attribute;
    this.oxygen=Manager.tanks[Manager.equipmentData.data[1].level-1].attribute;
    this.boxMaxWeight=Manager.boxs[Manager.equipmentData.data[2].level-1].attribute;

    this.setAttack();

    this.maxOxygen=this.oxygen;

    this.oxygenNumLabel.string=this.oxygen.toString();
    this.boxWeightLabel.string="0/"+this.boxMaxWeight.toString()+"KG";
    //this.propNumber=Manager.propData.data[2].quantity;
    //this.propNumLabel.string="x"+this.propNumber.toString();

    //this.updateSetting();
    if(Manager.userData.data.guideFinish==false){
        this.guideGround.active=true;
    }
  }


  onTouchMove(event: EventTouch, data: JoystickDataType) {//滑动
    if(this.playerState==PlayerState.MOVE){
      
      if(this.cur==3){
        if(this.guide31.active){
          this.guide31.active=false;
          this.guide32.active=true;
        }
      }
      this._speedType = data.speedType;
      this.moveDir = data.moveVec;
      this.onSetMoveSpeed(this._speedType);
    }
  }

  onTouchEnd(event: EventTouch, data: JoystickDataType) {//松手

    if(this.playerState==PlayerState.MOVE){
      Sound.instance.shootAudio.play();
      if(this.cur==3){
        this.guide3.active=false;
        this.cur++;
      }
      this.shootTimer=0;
      this.playerState=PlayerState.SHOOT;
      this.shootBody.active=true;
      this.shootBody.getComponent(GifPlayer).index=0;
      this.moveBody.active=false;
      this.boostBody.active=false;
      this.harpoon.active=true;
      this.rope.active=true;
      this.light.active=false;
      this._speedType = data.speedType;
      this.onSetMoveSpeed(this._speedType);
    }
    if(this.playerState==PlayerState.CATCH){
      this.catch();
    }
  }

  onSetMoveSpeed(speedType: SpeedType) {
    switch (speedType) {
      case SpeedType.STOP:
        this._moveSpeed = 0;
        break;
      case SpeedType.NORMAL:
        this._moveSpeed = this.fastSpeed;
        break;
      case SpeedType.FAST:
        this._moveSpeed = this.fastSpeed;
        break;
      default:
        break;
    }
  }

  dive(deltaTime:number){
    this.diveTimer+=deltaTime;
    if(this.diveTimer>2.5){
      this.moveBody.active=true;
      this.diveBody.active=false;
      this.light.active=true;
      this.diveTimer=0;
      this.playerState=PlayerState.MOVE;
      if(Manager.userData.data.guideFinish==false){
        this.cur++;
        this.guide1.active=true;
      }
      else{
        this.consuming=true;
      }
    }
  }

  next(){//下一引导页
    if(this.cur==1){
      Sound.instance.buttonAudio.play();
      this.guide1.active=false;
      this.guide2.active=true;
      this.cur++;
    }
    else if(this.cur==2){
      Sound.instance.buttonAudio.play();
      this.guide2.active=false;
      this.guide3.active=true;
      this.guideGround.active=false;
      this.consuming=true;
      this.cur++;
    }
  }

  useProp(curPropIndex:number){
    switch(curPropIndex){
      case 0:this.pulse();break;
      case 1:if(this.hammerTimer==0)this.hammer();break;
      case 2:if(this.boosting==1)this.boost(); break;
      case 3:if(this.firstWin)this.capsule(); break;
    }
  }

  consumeProp(curPropIndex:number){
    
    if(Manager.propData.data[curPropIndex].quantity>0){
      //this.propNumber--;
      Manager.propData.data[curPropIndex].quantity--;
      
      // 更新所有 gameContent 的数量文本（包括 choosePropNode 中的和 curPropContent）
      for(let index=0;index<this.game.choosePropNode.children.length;index++){
        let gameContent = this.game.choosePropNode.children[index].getComponent(GameContent);
        gameContent.propNumLabel.string="x"+Manager.propData.data[index].quantity.toString();
      }
      // 更新当前选中的道具数量文本
      this.game.curPropContent.propNumLabel.string="x"+Manager.propData.data[this.game.curPropIndex].quantity.toString();
      
      Manager.getInstance().post('https://api.xdiving.io/api/prop/consume',
      {propId:curPropIndex+1},
      (data) => {
        console.log('使用道具:', data);
        console.log(curPropIndex+1);
      },
      (error) => {
        console.log(`使用道具失败: ${error}`);
      })
      return true;
    }
    return false;
  }

  pulse(){
    if(this.consumeProp(0)){  
      // 以角色为中心的波纹震动效果
      director.getScene()?.getComponentInChildren(CameraFollow)?.shake(20);
      
    // 判断玩家半径600以内的鱼
      const detectionRadius = 600; // 检测半径
      const playerPos = this.node.position;

      for(const fish of this.game.fishesNode.children){
          const fishPos = fish.position;
          const fishsize=fish.getComponent(Fish).utSize;
          // 计算玩家和鱼之间的距离
          const dx = playerPos.x - fishPos.x - fishsize;
          const dy = playerPos.y - fishPos.y - fishsize;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 如果距离小于等于600，触发鱼的等待计时器
          if(distance <= detectionRadius){
              fish.getComponent(Fish).waitingTimer = 3;
              fish.getComponent(Fish).stunTimer = 3;
              fish.getComponent(Fish).stunHint.active=true;
              fish.getComponent(sp.Skeleton).timeScale=0;
          }
      }
    //this.pulsing=true;
    }
  }

  hammer(){
    if(this.consumeProp(1)){
      this.hammerTimer=5;
      this.hammerAttack=2;
      this.weaponMask.active=true;
      this.weaponMask.getComponent(UITransform).setContentSize(new Size(200,180));
      this.setAttack();
    }
  }

  boost(){
    if(this.consumeProp(2)){
      
      Sound.instance.boostAudio.play();
      this.boosting=2;
      this.setFastSpeed();
      
      this.boostFollow.active=true;
      this.boostCanvas.active=true;
      if(this.moveBody.active){
        this.moveBody.active=false;
        this.boostBody.active=true;
      }
      this.finishQuest(5);
    }
  }

  capsule(){  
    if(this.consumeProp(3)){
    this.firstWin=false;
    this.back();
    }
  }
  
  move(deltaTime:number) {//移动
    this.node.angle =
      misc.radiansToDegrees(Math.atan2(this.moveDir.y, this.moveDir.x));
      
      if((this.node.angle>90&&this.node.angle<270)||this.node.angle<-90){
          this.node.scale=this.reverseScale;
      }
      else{
          this.node.scale=this.originScale;
      }

    const oldPos = this.node.getPosition();
    const newPos =  this.node.getPosition().add(this.moveDir.clone().multiplyScalar(this._moveSpeed*deltaTime));
    let movex=true;
    let movey=true;
    for(const wallBoundary of this.game.wallBoundarys){
      if(newPos.x>wallBoundary.left&&newPos.x<wallBoundary.right&&newPos.y<wallBoundary.up&&newPos.y>wallBoundary.down){
        if(oldPos.x<wallBoundary.left||oldPos.x>wallBoundary.right){
          movex=false;
        }
        if(oldPos.y<wallBoundary.down||oldPos.y>wallBoundary.up){
          movey=false;
        }
      }
    } 
    if(movex){
        this.node.setPosition(newPos.x,this.node.y, 0);
    }
    if(movey){
        this.node.setPosition(this.node.x,newPos.y, 0);
    }

    for(let index=0;index<this.game.treasures.length;index++){//检测是否拿到宝箱
      if(this.game.treasures[index].close.active){
        const treasureBoundary=this.game.treasureBoundarys[index];
        if(newPos.x>treasureBoundary.left&&newPos.x<treasureBoundary.right&&newPos.y<treasureBoundary.up&&newPos.y>treasureBoundary.down){//拿到宝箱

          this.game.treasures[index].close.active=false;
          this.game.treasures[index].opening.active=true;

          let reward=Math.round(randomRange(0.8,1.2)*Manager.treasureBaseData.data[index].coins);
          let propReward=randomRangeInt(250,Manager.treasureBaseData.data[index].coins);
          let propIndex=randomRangeInt(0,Manager.propBaseData.data.length-1);
          let propNum=Math.floor(propReward/Manager.propBaseData.data[propIndex].costGold);
          let goldNum=reward-propNum*Manager.propBaseData.data[propIndex].costGold;
          Manager.endData.treasures.push({rewardType:"Gold",quantity:goldNum});
          if(propNum>0){
            Manager.endData.treasures.push({rewardType:Manager.propBaseData.data[propIndex].propNameEn,quantity:propNum});
            this.treasureGold.active=false;
            this.treasureProp.active=true;
            this.treasurePropSprite.spriteFrame=this.game.propSprites[propIndex];
            this.treasureCoinNumLabel.string=goldNum.toString();
            this.treasurePropNumLabel.string=propNum.toString();
          }
          else{
            this.treasureProp.active=false;
            this.treasureGold.active=true;
            this.treasureCoinNumLabel2.string=reward.toString();
          }

          this.catchFrame.active=false;
          this.treasureFrame.active=true;
          Sound.instance.treasureAudio.play();
          this.finishQuest(3);
          return;
        }
      }
    }
    this.depth=Math.floor(-(this.node.position.y-4660)/60);
    this.depthNumLabel.string=this.depth+"m";
    if(this.littleMap.active){
      this.littlePos.setPosition(new Vec3(this.node.position.x*0.02,this.node.position.y*0.02-96,0));
    }
    if(this.depth>this.maxDepth){
      this.maxDepth=this.depth;
      if(Manager.questData.data[7].progress<this.depth) this.finishQuest(7);
      if(Manager.questData.data[14].progress<this.depth) this.finishQuest(14);
    }
    if(this.depth<1){
      if(this.firstWin){
        this.firstWin=false;
        this.back();
      }
    }
  }

  shoot(deltaTime:number){//发射鱼叉
    if(this.shootTimer<0.3)
    {
      this.shootTimer+=deltaTime;
    }
    else{
      this.setharpoon(3000*deltaTime);
      if(this.ropeLong>600){//达到长度上限
        this.playerState=PlayerState.RETRACT;
        return;
      }
      let curPos=this.harpoon.getWorldPosition().
      add(new Vec3(-this.map.position.x,-this.map.position.y,0))
      .add(new Vec3(-view.getVisibleSize().width/2,-view.getVisibleSize().height/2,0));
      for(const wallBoundary of this.game.wallBoundarys){//碰到墙
        if(curPos.x>wallBoundary.left&&curPos.x<wallBoundary.right&&curPos.y<wallBoundary.up&&curPos.y>wallBoundary.down){
          this.playerState=PlayerState.RETRACT;
          return;
        }
      }
      for(const fish of this.game.fishesNode.children){
        
        const fishPos = fish.position;
        const size = fish.getComponent(Fish).utSize;
        const dx = curPos.x - fishPos.x;
        const dy = curPos.y - fishPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if(distance <= size*1.1){
          this.catchingFish=fish;
          const fishComponent=this.catchingFish.getComponent(Fish);
          if(fishComponent.health>this.attack){//击伤
            this.playerState=PlayerState.RETRACT;
            if(fishComponent.attack>0&&!fishComponent.attacking){
              const dx =  this.node.position.x-fish.position.x;
              const dy = this.node.position.y-fish.position.y;
              let rad=Math.atan2(-dy, -dx);
              fish.angle=misc.radiansToDegrees(rad)+randomRange(-10, 10);
              fishComponent.reverse();
              fishComponent.attacking=true;
              fishComponent.speed=fishComponent.maxSpeed;
              let attackHintInstance=instantiate(this.game.attackHint);
              this.game.tempNode.addChild(attackHintInstance);
              fishComponent.attackHint=attackHintInstance;
            }
            fishComponent.health-=this.attack;
            
            fishComponent.bloodSkeleton.node.active=true;
            fishComponent.bloodSkeleton.clearTracks(); // 清除所有动画轨道
            fishComponent.bloodSkeleton.setAnimation(0, "dongqilai", false); // 重新播放动画
            fishComponent.bloodTimer=1;
            if(!fishComponent.healthDisplaying){
              let healthBarInstance=instantiate(this.game.healthBar);
              this.game.tempNode.addChild(healthBarInstance);
              fishComponent.healthBar=healthBarInstance.getComponent(ProgressBar);
              fishComponent.healthBar.node.setPosition(fish.getPosition().add(new Vec3(0,size,0)));
              fishComponent.healthDisplaying=true;

            }
            fishComponent.healthBar.progress=fishComponent.health/fishComponent.maxHealth;
            fishComponent.healthTimer=2;
          }
          else{//击杀
            this.playerState=PlayerState.CATCH;
            this.catchDifficulty=0.5*this.attack/this.catchingFish.getComponent(Fish).maxHealth;
            if(this.catchDifficulty>0.3){
              this.catchDifficulty=0.3;
            }
            if(fishComponent.healthDisplaying){
              fishComponent.healthDisplaying=false;
              fishComponent.healthBar.node.destroy();
            }
            if(fishComponent.attacking&&fishComponent.attack>0){
              fishComponent.attacking=false;
              fishComponent.attackHint.destroy();
            }
            this.bar.active=true;
            this.shootBody.active=false;
            this.catchBody.active=true;
            fishComponent.beingCatched=true;
            fishComponent.stunTimer=0.1;
            //this.catchingFish.getComponent(GifPlayer).speed=0.005;

            this.setharpoon(0.25*size);
            this.catchingFish.setPosition(this.harpoon.getWorldPosition().
            add(new Vec3(-this.map.position.x,-this.map.position.y,0))
            .add(new Vec3(-view.getVisibleSize().width/2,-view.getVisibleSize().height/2,0)));
            if(this.cur==4){
              this.guide4.active=true;
            }
          }
          if(this.hammerTimer>0){//减少锤子次数
            this.weaponMask.active=true;
            this.hammerTimer-=1;
            this.weaponMask.getComponent(UITransform).setContentSize(new Size(200,36*this.hammerTimer));
            if(this.hammerTimer==0){
              this.weaponMask.active=false;
              this.hammerAttack=1;
              this.setAttack();
            }
          }
          return;
        }
      }
    }
  }

  retract(deltaTime){//收回鱼叉
    if(this.harpoon.active){
      this.setharpoon(-3000*deltaTime);
      if(this.ropeLong<0){
        this.catchBody.active=false;
        this.shootBody.active=false;
        this.harpoon.active=false;
        this.rope.active=false;
        this.ropeLong=0;
        this.harpoon.setPosition(this.harpoonOrigin);
        
        this.retractBody.active=true;
        this.retractBody.getComponent(GifPlayer).sprite = this.retractBody.getComponent(Sprite);
        this.retractBody.getComponent(GifPlayer).index=0;
        this.retractBody.getComponent(GifPlayer).sprite.spriteFrame = this.retractBody.getComponent(GifPlayer).spriteFrames[0];
      }
    }
    else{
      if(this.retractTimer>0){
        this.retractTimer-=deltaTime;
      }
      else{
        this.retractTimer=0.3;
        this.playerState=PlayerState.MOVE;
        this.retractBody.active=false;
        this.light.active=true;
        if(this.boosting==2){
          this.boostBody.active=true;
        }
        else{
          this.moveBody.active=true;
        }
      }
    }
  }

  setharpoon(speed:number){
    this.harpoon.setPosition( this.harpoon.getPosition().add(new Vec3(Math.cos((this.harpoon.angle) * (Math.PI / 180)) * speed,
       Math.sin((this.harpoon.angle) * (Math.PI / 180)) * speed,0)));
    this.ropeLong+=speed;
    this.ropeUT.contentSize=new math.Size(this.ropeLong,4);
    this.rope.setPosition(new Vec3((this.ropeLong)/2,this.rope.position.y));
  }

  catch(){
    this.catchProgress+=this.catchDifficulty;
    //this.catchProgress+=0.3/Manager.rarityBaseData.data[this.catchingFish.getComponent(Fish).rarityIndex].difficulty;
    this.pBar.progress=this.catchProgress;
    this.fishBar.setPosition(new Vec3(600*this.catchProgress-300,this.fishBar.position.y,0));
    if(this.catchProgress>1){//进度达到
      Sound.instance.catchAudio.play();
      this.catchProgress=0.3;
      this.bar.active=false;

      this.playerState=PlayerState.RETRACT;

      this.catchSuccess=this.boxWeight<this.boxMaxWeight;
      let fishComponent=this.catchingFish.getComponent(Fish);

      let index=fishComponent.index;
      let fishData=Manager.fishBaseData.data[index];
      let weight=fishComponent.precent*fishData.weight;

      if(this.cur==4){
        this.guide4.active=false;
        this.guide5.active=true;
        this.cur++;
      }

      if(this.catchSuccess){//捕捉成功
        
        let curPrice=0;//记录捕捉数据
        let curExperience=0;
        let curType="";
        
        let rarity=Manager.rarityBaseData.data[fishComponent.rarityIndex].rarity;
        if(fishData.baseCoins!=0){
          curPrice=Math.round(fishComponent.precent*fishData.baseCoins*Manager.rarityBaseData.data[fishComponent.rarityIndex].reward);
          curType="coins";
          curExperience=curPrice;
        }
        else{
          curPrice=Math.round(fishComponent.precent*fishData.baseDiamonds*Manager.rarityBaseData.data[fishComponent.rarityIndex].reward);
          curType="diamonds";
          curExperience=curPrice*500;
        }

        Manager.endData.catches.push({identifiers:this.fishIdentifer.toString(),fishNameEn:fishData.fishNameEn,weight:weight,price:curPrice,type:curType,rarity:rarity});
        this.fishIdentifer++;

        Manager.userData.data.experience+=curExperience;//获得经验
        let j=0;
        while(j<10){
          j++;
          if(Manager.userData.data.level<Manager.levelBaseData.data.length){
            if(Manager.userData.data.experience>=Manager.levelBaseData.data[Manager.userData.data.level].experienceRequired){//升级
              Manager.userData.data.level++;
              Manager.userData.data.experience-=Manager.levelBaseData.data[Manager.userData.data.level-1].experienceRequired;
              Manager.levelStatusDatas[Manager.userData.data.level-1].status=2;
              if(Manager.userData.data.vip){
                Manager.levelStatusDatas[Manager.userData.data.level-1].extraStatus=2;
              }
            }
            else{
              break;
            }
          } 
          else{
            break;
          }
        }
        this.game.generalUI.updateLevel();
        Manager.getInstance().post('https://api.xdiving.io/api/level/add-experience',
        {experience:curExperience},
        (data) => {
          console.log('增加经验:', data);
        },
        (error) => {
          console.log(`增加经验失败: ${error}`);
        }
        );
        if(fishData.fishNameEn=="Swordfish"){
          this.catchSwordfish=true;
        }

        this.catchingFish.destroy();
        
        this.boxWeight+=weight;
        this.boxWeightLabel.string=Math.round(this.boxWeight).toString()+"/"+this.boxMaxWeight.toString()+"KG";
        if(this.boxWeight>this.boxMaxWeight){
          //this.overWeight=0.8;
          this.overWeight=1;
          //this.overWeight=boxMaxWeight/boxWeight;
          //this.setFastSpeed();
          this.boxWeightLabel.color=color(255,0,0);
        }
        
        this.catchWeightLabel.string = weight.toFixed(2) + "KG";
        this.catchRarityLabel.string = rarity;
        this.catchRarityLabel.outlineColor = color(Manager.rarityBaseData.data[fishComponent.rarityIndex].color);
        let size=Manager.rarityBaseData.data[fishComponent.rarityIndex].size;
        this.catchRarityLabel.node.setScale(size, size, 1);
        this.catchSprite.spriteFrame = this.game.fishImages[index];
        this.catchNameLabel.string = fishData.fishNameEn;
        this.catchFrame.active = true;


        if(fishData.fishNameEn=="Crucian") this.finishQuest(0);
        if(fishData.fishNameEn=="Sardine") this.finishQuest(2);
        if(fishData.fishNameEn=="Angler") this.finishQuest(4);
        if(fishData.fishNameEn=="Swordfish") this.finishQuest(6);
        if(fishData.fishNameEn=="Whaleshark") this.finishQuest(8);
        if(fishData.fishNameEn=="Flyingfish") this.finishQuest(9);
        if(fishData.fishNameEn=="Tuna") this.finishQuest(10);
        if(fishData.fishNameEn=="Octopus") this.finishQuest(11);
        if(fishData.fishNameEn=="Moonfish") this.finishQuest(12);
        this.finishQuest(13);

      }
      else{//超重
        this.catchingFish.getComponent(Fish).beingCatched=false;
        //this.catchingFish.getComponent(GifPlayer).speed=0.05;
        this.overFrame.active=true;
      }
    }
  }

  //catchQuest(index:number){
  //}

  //depthQuest(index:number){
  //  if(Manager.questData.data[index].questStatus<3){
  //    if(Manager.questData.data[index].progress<this.depth){
  //      Manager.questData.data[index].progress=this.depth;
  //      this.postQuest(index);
  //    }
  //  }
  //}

  finishQuest(index:number){
    
    if(Manager.questData.data[index].questStatus<3){
      Manager.questData.data[index].progress++;
      if(Manager.questData.data[index].progress>=Manager.questBaseData.data[index].quantity){
        Manager.questData.data[index].questStatus=3;
      }
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
  }

  //finishQuest(quest:any) {
  //  quest.progress++;
  //  if(quest.progress>=Manager.questBaseData.data[quest.identifier-9006].quantity){
  //    quest.questStatus=3;
  //  }
  //  const questData = { identifier: quest.identifier, progress: quest.progress };
  //  Manager.getInstance().post('https://api.xdiving.io/api/quest/user/progress',
  //    questData,
  //    (data) => {
  //      console.log('任务更新:', data);
  //    console.log(questData);
  //  },
  //  (error) => {
  //    console.log(`任务更新失败: ${error}`);
  //  })
  //}

  barMove(deltaTime){
    this.catchProgress-=0.1*deltaTime;
    this.pBar.progress=this.catchProgress;
    this.fishBar.setPosition(new Vec3(600*this.catchProgress-300,this.fishBar.position.y,0));
    if(this.catchProgress<0){//进度归零

      if(this.cur==4){
        this.guide4.active=false;
        this.guide5.active=true;
        this.cur++;
      }

      this.catchProgress=0.3;
      this.bar.active=false;

      this.playerState=PlayerState.RETRACT;
      this.catchingFish.getComponent(Fish).beingCatched=false;
      //this.catchingFish.getComponent(GifPlayer).speed=0.05;
    }
  }

  setFastSpeed(){
    this.fastSpeed=this.overWeight*this.boosting*this.multiplier*this.baseSpeed;
  }

  setAttack(){
    this.attack=this.baseAttack*this.hammerAttack;
  }

  mapHide(){
    this.openMap.active=!this.openMap.active;
    this.littleMap.active=!this.littleMap.active;
    this.littlePos.setPosition(new Vec3(this.node.position.x*0.02,this.node.position.y*0.02-96,0));
  }

  //setting(){//点击设置
  //    Sound.instance.buttonAudio.play();
  //    this.settingFrame.active=!this.settingFrame.active;
  //    this.guideGround.active=!this.guideGround.active;
  //}

  hide(){//按下超重确认按钮
    Sound.instance.buttonAudio.play();
    this.overFrame.active=false;
  }
  
  back(){//返回
    this.consuming=false;
    this.playerState=PlayerState.WIN;
    Manager.endData.endReason="NORMALEND";
    Manager.boxData.data=Manager.endData.catches;

    if(this.catchSwordfish){
      Manager.userData.data.swordfishCatched=true;
    }

    for(const treasure of Manager.endData.treasures){
      if(treasure.rewardType=="Gold"){
        Manager.userData.data.coins+=treasure.quantity;
      }
      else{
        for(let prop of Manager.propBaseData.data){
          if(prop.propNameEn==treasure.rewardType){
            Manager.propData.data[prop.propId-1].quantity+=treasure.quantity;
            break;
          }
        }
      }
    }
    this.endPost();
  }

  switchAudio(){
    Sound.instance.BGM.stop();
    Sound.instance.BGM.play();
  }

  win(deltaTime){//胜利动画
    this.backTimer+=deltaTime;
    if(this.blackGround.node.active==false){
      Sound.instance.backAudio.play();
      this.blackGroundA=0;
      this.blackGround.node.active=true;
    }
    this.blackGroundA+=160*deltaTime;
    this.blackGround.color=color(255,255,255,this.blackGroundA);
    if(this.backTimer>1.6){
      this.backTimer=-100;
      this.switchAudio();
      director.loadScene("Box");
    }
  }

  oxygenNotIncluded(){//氧气耗尽
    this.playerState=PlayerState.DIE;
    this.firstDie=false;
    this.consuming=false;
    this.light.active=false;
    this.moveBody.active=false;
    this.shootBody.active=false;
    this.catchBody.active=false;
    this.boostBody.active=false;
    this.retractBody.active=false;
    this.boostFollow.active=false;
    this.boostCanvas.active=false;
    this.bar.active=false;
    this.catchFrame.active=false;
    this.treasureFrame.active=false;
    this.overFrame.active=false;
    this.deathFrame.active=true;
    Manager.endData.catches=[];
    Manager.endData.treasures=[];
    Manager.endData.endReason="DEATH";
    this.endPost();
  }

  end(){//按下死亡确认按钮
    Sound.instance.buttonAudio.play();
    this.deathFrame.active=false;
    this.confirm=true;
    this.node.angle=90;
    this.dyingBody.active=true;
  }

  die(deltaTime){//死亡动画
    if(this.confirm){
      this.dieTimer+=deltaTime;
      if(this.dieTimer>1.6){
        if(this.blackGround.node.active==false){
          Sound.instance.backAudio.play();
          this.blackGroundA=0;
          this.blackGround.node.active=true;
        }
        this.blackGroundA+=160*deltaTime;
        this.blackGround.color=color(255,255,255,this.blackGroundA);
      }
      if(this.dieTimer>3.2){
        this.dieTimer=-100;
        this.switchAudio();
        director.loadScene("Menu");
      }
    }
  }

  endPost(){
    Manager.userData.data.guideFinish=true;
    Manager.endData.userId=this.userId;
    //Manager.curPropData.quantity=this.propNumber;
    //Manager.endData.props.push(Manager.curPropData);
    Manager.endData.mainPropId=this.game.curPropIndex+1;
    Manager.endData.maxDepth=this.maxDepth;
    Manager.getInstance().post('https://api.xdiving.io/api/fish-catch/game-end',
    Manager.endData,
    (data) => {
      console.log('结束数据:', data);
      console.log(Manager.endData);
      //if(Manager.endData.endReason=="NORMALEND"){
      //  director.loadScene("Box");
      //}
      },
      (error) => {
          console.log(`结束数据POST失败: ${error}`);
      }
    )
  }

  bloodTimer=0;
  display(deltaTime){

    if(this.cur==5){
      if(this.guideTimer>0){
        this.guideTimer-=deltaTime;
      }
      else{
        this.guide5.active=false;
      }
    }

    if(this.catchFrame.active){
      if(this.displayTimer>0){
        this.displayTimer-=deltaTime;
      }
      else{
        this.catchFrame.active=false;
        this.displayTimer=1;
      }
    }
    
    if(this.treasureFrame.active){
      if(this.displayTimer>0){
        this.displayTimer-=deltaTime;
      }
      else{
        this.treasureFrame.active=false;
        this.displayTimer=1;
      }
    }
    
    if(this.blackFrame.active){
      if(this.blackDisplayTimer>0){
        this.blackDisplayTimer-=deltaTime;
      }
      else{
        this.blackFrame.active=false;
      }
    }

    if(this.oxygen<20){
      if(this.redFrameARise){
        this.redFrameA+=255*(40-this.oxygen)/60*deltaTime;
        if(this.redFrameA>255*(40-this.oxygen)/60){
          this.redFrameARise=false;
        }
      }
      else{
        this.redFrameA-=255*(40-this.oxygen)/60*deltaTime;
        if(this.redFrameA<5){
          this.redFrameARise=true;
        }
      }
      this.game.redFrame.color=color(255,255,255,this.redFrameA);
    }


    if(this.bloodSkeleton.node.active){
      if(this.bloodTimer>0){
      this.bloodTimer-=deltaTime;
      }
      else{
        this.bloodTimer=1;
        this.bloodSkeleton.node.active=false;
      }
    }
  }

  consume(deltaTime:number){
    if(this.consuming){
      if(this.oxygen>0){//消耗氧气
        this.oxygen-=this.multiplier*deltaTime;
        let ioxygen=Math.round(this.oxygen);
        this.oxygenNumLabel.string=ioxygen.toString();
        if(this.oxygenEnough){
          if(this.oxygen<this.maxOxygen/2){
            this.oxygenEnough=false;
            this.blackFrame.active=true;
            this.game.redOxygen.active=true;
            this.game.redOxygenTimer=0;
          }
        }
      }
      else{//氧气耗尽
        this.oxygenNotIncluded();
      }
      if(this.boosting==2){
        if(this.boostTimer>0){//消耗动力包
          this.boostTimer-=this.multiplier*deltaTime;
        }
        else{//动力包耗尽
          this.boostTimer=20;
          this.boosting=1;
          Sound.instance.boostAudio.stop();
          this.setFastSpeed();
          if(this.boostBody.active){
            this.moveBody.active=true;
            this.boostBody.active=false;
          }
          this.boostFollow.active=false;
          this.boostCanvas.active=false;
        }
      }
    }
  }

  moveSound(){
    if(this._speedType==SpeedType.STOP){
      if(Sound.instance.moveAudio.playing==true){
        Sound.instance.moveAudio.stop();
      }
    }
    else if(Sound.instance.moveAudio.playing==false){
      Sound.instance.moveAudio.play();
    }
  }

  update(deltaTime: number) {
    switch(this.playerState){
      case PlayerState.DIVE:this.dive(deltaTime);break;
      case PlayerState.MOVE:this.move(deltaTime);break;
      case PlayerState.SHOOT:this.shoot(deltaTime);break;
      case PlayerState.CATCH:this.barMove(deltaTime);break;
      case PlayerState.RETRACT:this.retract(deltaTime);break;
      case PlayerState.DIE:this.die(deltaTime);break;
      case PlayerState.WIN:this.win(deltaTime);break;
    }
    this.consume(deltaTime);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    this.display(deltaTime);
    this.moveSound();
  }
}