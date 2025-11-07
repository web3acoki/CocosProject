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
} from "cc";
const { ccclass, property } = _decorator;

import { instance, SpeedType } from "./Joystick";
import type { JoystickDataType } from "./Joystick";
import { Game } from "./Game";
import { Fish } from "./Fish";
import { GifPlayer } from "./GifPlayer";
import { Manager } from "./Manager";

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
  MOVE,
  SHOOT,
  CATCH,
  DISPLAY,
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
  catchBody :Node=null;
  @property(Node)
  moveBoostingBody :Node=null;
  @property(Node)
  catchBoostingBody :Node=null;
  @property(Node)
  dyingBody :Node=null;
  @property(Node)
  light:Node=null;
  @property(Node)
  harpoon:Node=null;
  @property(Node)
  rope:Node=null;

  @property(Node)
  boostFollow:Node=null;
  @property(Node)
  boostCanvas:Node=null;

  @property(Node)//进度条
  bar:Node=null;
  @property(ProgressBar)
  pBar:ProgressBar=null;
  @property(Node)
  fishBar:Node=null;

  @property(Node)//弹窗
  overFrame:Node=null;
  @property(Node)
  deathFrame:Node=null;
  @property(Node)
  settingFrame:Node=null;
  @property(Node)
  catchFrame:Node=null;
  @property(Sprite)
  catchSprite:Sprite=null;
  @property(Label)
  catchNameLabel:Label=null;
  @property(Label)
  catchWeightLabel:Label=null;

  @property(Label)//文字
  boxWeightLabel:Label=null;
  @property(Label)
  depthNumLabel:Label=null;
  @property(Label)
  oxygenNumLabel:Label=null;
  @property(Label)
  propNumLabel:Label=null;

  @property(Node)//小地图
  openMap:Node=null;
  @property(Node)
  littleMap:Node=null;
  @property(Node)
  littlePos:Node=null;

  @property(AudioSource)//音效
  buttonAudio:AudioSource=null;
  @property(AudioSource)
  stayAudio:AudioSource=null;
  @property(AudioSource)
  moveAudio:AudioSource=null;
  @property(AudioSource)
  boostAudio:AudioSource=null;
  @property(AudioSource)
  shootAudio:AudioSource=null;
  @property(AudioSource)
  catchAudio:AudioSource=null;

  @property(Prefab)//血条
  healthBar:Prefab=null;
  @property(Node)
  healthBarNode:Node=null;
  healthBars:ProgressBar[]=[];
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
  propNumber=0;

  propTimer=20;

  playerState:PlayerState=PlayerState.MOVE;
  
  _speedType: SpeedType = SpeedType.STOP;//移动
  moveDir = new Vec3(0, 1, 0);
  _moveSpeed = 0;//实际速度
  fastSpeed = 187;//实际运动速度
  baseSpeed = 187;//基础速度
  multiplier = 1;//测试速度
  boosting = 1;//助推器速度
  overWeight = 1;//超重速度

  fishIdentifer=0;
  //shooting=false;
  private harpoonOrigin=new Vec3;//鱼叉发射
  private ropeLong = 0;
  private ropeUT=null;

  //catching=false;
  private catchProgress=0.3;//捕捉
  private catchingFish:Node=null;
  private catchSuccess=true;
  
  //displaying=false;
  private displayTimer=0;//捕捉展示

  private dieTimer=0;//死亡动画
  private consuming=true;

  //@property(Node)
  //walls: Node = null;

  private wallBoundarys:Boundary[]=[];
  userId=1;

  //_body: RigidBody2D | null = null;

  //manager:Manager=null;
  onLoad() {
    //let collider = this.getComponent(BoxCollider2D);
    //if (!collider) {
    //  collider = this.addComponent(BoxCollider2D);
    //}
    // 注册物理碰撞回调
    //if (PhysicsSystem2D.instance) {
    //  PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    //}
    //instance.on(SystemEventType.TOUCH_START, this.onTouchStart, this);
    instance.on(SystemEventType.TOUCH_MOVE, this.onTouchMove, this);
    instance.on(SystemEventType.TOUCH_END, this.onTouchEnd, this);
    //const collider = this.getComponent(Collider2D);
    //    if (collider) {
    //        collider.on(Contact2DType.BEGIN_CONTACT, this.onCollision, this);
    //    }
  }

  start(){
    //this.manager=Manager.getInstance();

    Manager.userData.data.remainingRounds-=1;
    this.userId=Manager.userData.data.userId;
    let mapID=1;
    let url="https://api.xdiving.io/api/diving-session/user/"+this.userId.toString()+"/game-start/"+mapID.toString();
    Manager.getInstance().post(url,
    Manager.startData,
    (data) => {
      console.log('开始数据:', data);
      console.log(Manager.startData);
      },
      (error) => {
          console.log(`'开始数据POST失败: ${error}`);
      }
    )
    Manager.endData={userId:1,catches:[],usedProps:[],treasures:[],maxDepth:0,endReason:""};
    Manager.endData.usedProps.push({propId:1,quantity:0});
    this.harpoonOrigin=this.harpoon.getPosition();
    this.ropeUT=this.rope.getComponent(UITransform);
    this.harpoon.active=false;
    this.rope.active=false;
    this.bar.active=false;
    this.catchFrame.active=false;
    this.overFrame.active=false;
    this.deathFrame.active=false;

    this.attack=Manager.harpoons[Manager.equipmentData.data[0].level-1].attribute;
    this.oxygen=Manager.tanks[Manager.equipmentData.data[1].level-1].attribute;
    this.boxMaxWeight=Manager.boxs[Manager.equipmentData.data[2].level-1].attribute;

    this.maxOxygen=this.oxygen;

    this.propNumber=Manager.propData.data[0].quantity;
    this.propNumLabel.string="x"+this.propNumber.toString();

    this.boxWeightLabel.string=Math.round(this.boxWeight).toString()+"/"+this.boxMaxWeight.toString()+"KG";

    for (let wall of this.game.walls.children) {
      //this.wallsprites.push(wall);
      const ut=wall.getComponent(UITransform);
      const boundary=new Boundary;
       boundary.left=wall.position.x-ut.contentSize.x/2;
       boundary.right=wall.position.x+ut.contentSize.x/2;
       boundary.up=wall.position.y+ut.contentSize.y/2;
       boundary.down=wall.position.y-ut.contentSize.y/2;
      this.wallBoundarys.push(boundary);
      wall.active = false;
    }
  }
  // 添加销毁时清理
  //onDestroy() {
  //  if (PhysicsSystem2D.instance) {
  //    PhysicsSystem2D.instance.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
  //  }
  //}

  //onCollision(self: Collider2D, other: Collider2D) {
  //      // 碰到禁止区域就停止移动
  //      // 这里可以调用你的Player停止逻辑
  //
  //      console.log("碰到禁止区域！");
  //}

  //onTouchStart() 
  //{
  //}

  onTouchMove(event: EventTouch, data: JoystickDataType) {
    if(this.playerState==PlayerState.MOVE){
      this._speedType = data.speedType;
      this.moveDir = data.moveVec;
      this.onSetMoveSpeed(this._speedType);
    }
  }

  onTouchEnd(event: EventTouch, data: JoystickDataType) {

    if(this.playerState==PlayerState.MOVE){
      this.playerState=PlayerState.SHOOT;
      this.shootAudio.play();
      if(this.moveBody.active){
        this.catchBody.active=true;
        this.moveBody.active=false;
      }
      else{
        this.catchBoostingBody.active=true;
        this.moveBoostingBody.active=false;
      }
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

  /**
   * 移动
   */
  firstWin=true;
  move(deltaTime:number) {
    this.node.angle =
      misc.radiansToDegrees(Math.atan2(this.moveDir.y, this.moveDir.x));
      
      if(this.boosting==2){
        this.boostFollow.active=true;
        this.boostCanvas.active=true;
      }
      else{
        this.boostFollow.active=false;
        this.boostCanvas.active=false;
      }
    
   //if (this.rigidbody && this._body) {
   //  const moveVec = this.moveDir.clone().multiplyScalar(this._moveSpeed / 20);
   //  const force = new Vec2(moveVec.x, moveVec.y);
   //  this._body.applyForceToCenter(force, true);
   //} else {
      const oldPos = this.node.getPosition();
      const newPos =  this.node.getPosition().add(
        // fps: 60
        this.moveDir.clone().multiplyScalar(this._moveSpeed*deltaTime)
      );
      //console.log(this._moveSpeed / 60);
      let movex=true;
      let movey=true;
      for(const wallBoundary of this.game.wallBoundarys){
        
        if(newPos.x>wallBoundary.left&&newPos.x<wallBoundary.right&&newPos.y<wallBoundary.up&&newPos.y>wallBoundary.down){
          //console.log(newPos+","+oldPos);
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
    this.depth=-(this.node.position.y-4660)/60;
    this.depthNumLabel.string=Math.round(this.depth).toString()+"m";
    if(this.littleMap.active){
      this.littlePos.setPosition(new Vec3(this.node.position.x*0.02,this.node.position.y*0.02-96,0));
    }
    if(this.depth>this.maxDepth){
      this.maxDepth=this.depth;
      //console.log(this.maxDepth);
    }
    if(this.depth<1){
      if(this.firstWin){
        this.firstWin=false;
        this.win();
      }
    }
    //console.log(newPos);
    //}
  }

  boost(){//点击助推器
   if(this.boosting==1){
    if(this.propNumber>0){
      this.boostAudio.play();
      this.propNumber--;
      Manager.propData.data[0].quantity--;
      Manager.endData.usedProps[0].quantity++;
      this.propNumLabel.string="x"+this.propNumber.toString();

      this.boosting=2;
      this.setFastSpeed();


      if(this.moveBody.active){
        this.moveBody.active=false;
        this.moveBoostingBody.active=true;
      }
      else{
        this.catchBody.active=false;
        this.catchBoostingBody.active=true;
      }
    }
   }
  }

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

  testp1(){
    this.propNumber++;
    this.propNumLabel.string="x"+this.propNumber.toString();
  }

  testb10(){
    this.boxMaxWeight+=10;
    this.boxWeightLabel.string=Math.round(this.boxWeight).toString()+"/"+this.boxMaxWeight.toString()+"KG";
  }

  testa1(){
    this.attack++;
  }

  testo10(){
    this.oxygen+=10;
    this.oxygenNumLabel.string=this.oxygen.toString();
  }

  retract(){
      this.light.active=true;
      this.harpoon.active=false;
      this.rope.active=false;
      this.ropeLong=0;
      this.ropeUT.contentSize=new math.Size(this.ropeLong,4);
      this.rope.setPosition(Vec3.ZERO);
      this.harpoon.setPosition(this.harpoonOrigin);
      if(this.catchBody.active){
        this.catchBody.active=false;
        this.moveBody.active=true;
      }
      else{
        this.catchBoostingBody.active=false;
        this.moveBoostingBody.active=true;
      }
  }

  setmove(){
      this.playerState=PlayerState.MOVE;
      this.retract();
  }

  setharpoon(speed:number){
    const newPos =  this.harpoon.getPosition().add(new Vec3(Math.cos((this.harpoon.angle) * (Math.PI / 180)) * speed,
       Math.sin((this.harpoon.angle) * (Math.PI / 180)) * speed,0));
    this.harpoon.setPosition(newPos);
    this.ropeLong+=speed;
    this.ropeUT.contentSize=new math.Size(this.ropeLong,4);
    this.rope.setPosition(new Vec3((this.ropeLong)/2,this.rope.position.y));
  }

  harpoonmove(deltaTime:number){
    //const oldPos = this.harpoon.getPosition();
    this.setharpoon(2000*deltaTime);
    if(this.ropeLong>500){
      this.setmove();
      return;
    }
    //const curPos=newPos.add(this.node.position).add(new Vec3(375,832,0));
    
    //let rad=(this.node.angle) * (Math.PI / 180);
    //const curPos=this.node.getPosition().add(new Vec3(Math.cos(rad)* (-this.harpoon.y)-Math.sin(rad)* this.harpoon.x,
    //   Math.sin(rad)* (-this.harpoon.y)+Math.cos(rad)* this.harpoon.x,0));

    let curPos=this.harpoon.getWorldPosition().
    add(new Vec3(-this.map.position.x,-this.map.position.y,0))
    .add(new Vec3(-view.getVisibleSize().width/2,-view.getVisibleSize().height/2,0));
        //console.log(curPos+","+this.map.getPosition());
    for(const wallBoundary of this.game.wallBoundarys){
      if(curPos.x>wallBoundary.left&&curPos.x<wallBoundary.right&&curPos.y<wallBoundary.up&&curPos.y>wallBoundary.down){
        this.setmove();
        return;
      }
    }
    for(const fish of this.game.fishesNode.children){
      let left=fish.position.x-(1000*fish.scale.x);
      let right=fish.position.x+(1000*fish.scale.x);
      let up=fish.position.y+(1000*fish.scale.x);
      let down=fish.position.y-(1000*fish.scale.x);
      if(curPos.x>left&&curPos.x<right&&curPos.y<up&&curPos.y>down)
      {
        this.catchingFish=fish;
        const fishComponent=this.catchingFish.getComponent(Fish);
        if(fishComponent.health>this.attack){
          fishComponent.health-=this.attack;
          if(!fishComponent.healthDisplaying){
            let healthBarInstance=instantiate(this.healthBar);
            this.healthBarNode.addChild(healthBarInstance);
            fishComponent.healthBar=healthBarInstance.getComponent(ProgressBar);
            fishComponent.healthBar.node.setPosition(fish.getPosition().add(new Vec3(0,1000*fish.scale.x,0)));
            fishComponent.healthDisplaying=true;
          }
          fishComponent.healthBar.progress=fishComponent.health/fishComponent.maxHealth;
          fishComponent.healthTimer=2;
          this.setmove();
          return;
        }
        else{
          if(fishComponent.healthDisplaying){
            fishComponent.healthDisplaying=false;
            fishComponent.healthBar.node.destroy();
          }
          this.playerState=PlayerState.CATCH;
          this.bar.active=true;
          fishComponent.beingCatched=true;
          this.catchingFish.getComponent(GifPlayer).speed=0.005;
          //this.harpoon.position=fish.getPosition();
          this.setharpoon(40000*fish.scale.x*deltaTime);
          this.catchingFish.position=this.harpoon.getWorldPosition().
          add(new Vec3(-this.map.position.x,-this.map.position.y,0))
          .add(new Vec3(-view.getVisibleSize().width/2,-view.getVisibleSize().height/2,0));
          return;
        }
      }
    }
  }

  barmove(){
    this.catchProgress-=0.1/60;
    this.pBar.progress=this.catchProgress;
    this.fishBar.setPosition(new Vec3(600*this.catchProgress-300,this.fishBar.position.y,0));
    if(this.catchProgress<0){
      this.catchProgress=0.3;
      this.bar.active=false;

      this.setmove();
      this.catchingFish.getComponent(Fish).beingCatched=false;
      this.catchingFish.getComponent(GifPlayer).speed=0.05;
    }
  }

  catch(){
    this.catchProgress+=0.3;
    this.pBar.progress=this.catchProgress;
    this.fishBar.setPosition(new Vec3(600*this.catchProgress-300,this.fishBar.position.y,0));
    if(this.catchProgress>1){
      this.catchAudio.play();
      this.playerState=PlayerState.DISPLAY;
      this.catchProgress=0.3;
      this.bar.active=false;

      this.retract();

      this.catchSuccess=this.boxWeight<this.boxMaxWeight;

      let index=this.catchingFish.getComponent(Fish).index;
      let fishData=Manager.fishBaseData.data[index];
      let weight=this.catchingFish.getComponent(Fish).precent*fishData.weight;
      this.catchSprite.spriteFrame=instantiate(this.game.fishPrefabs[index]).getComponent(Sprite).spriteFrame;//改成用spriteframe数组？
      this.catchNameLabel.string=fishData.fishNameEn;

      if(this.catchSuccess){
        
        let curPrice=0;//记录捕捉数据
        let curType="";
        if(fishData.baseCoins!=0){
          curPrice=Math.round(this.catchingFish.getComponent(Fish).precent*fishData.baseCoins);
          console.log(curPrice);
          curType="coins";
        }
        else{
          curPrice=Math.round(this.catchingFish.getComponent(Fish).precent*fishData.baseDiamonds);
          curType="diamonds";
        }
        Manager.endData.catches.push({identifiers:this.fishIdentifer.toString(),fishNameEn:fishData.fishNameEn,weight:weight,price:curPrice,type:curType});
        this.fishIdentifer++;
        //Manager.curCatchData.fishNameEn=fishData.fishNameEn;//记录捕捉数据
        //Manager.curCatchData.weight=weight;
        //if(fishData.baseCoins!=0){
        //  Manager.curCatchData.price=this.catchingFish.getComponent(Fish).precent*fishData.baseCoins;
        //  Manager.curCatchData.type="coins";
        //}
        //else{
        //  Manager.curCatchData.price=this.catchingFish.getComponent(Fish).precent*fishData.baseDiamonds;
        //  Manager.curCatchData.type="diamonds";
        //}
        //let CatchData=Manager.curCatchData;
        //Manager.endData.catches.push({...Manager.curCatchData});

        //let catch:Catch;
        //catch.fishNameEn=fish.fishNameEn;
        //fishData.weight=weight;
        //this.catchFishDatas.push(fishData);
        this.catchingFish.destroy();
        
        this.boxWeight+=weight;
        this.boxWeightLabel.string=Math.round(this.boxWeight).toString()+"/"+this.boxMaxWeight.toString()+"KG";
        if(this.boxWeight>this.boxMaxWeight){
          this.overWeight=0.5;
          this.boxWeightLabel.color=color(255,0,0);
        }
        this.setFastSpeed();
        
        this.catchWeightLabel.string=weight.toFixed(2)+"KG";
        
        this.catchFrame.active=true;
      }
      else{
        this.catchingFish.getComponent(Fish).beingCatched=false;
        this.catchingFish.getComponent(GifPlayer).speed=0.05;
        this.overFrame.active=true;
        this.displayTimer=-1;
      }
    }
  }

  setFastSpeed(){
    this.fastSpeed=this.overWeight*this.boosting*this.multiplier*this.baseSpeed;
  }

  display(){
    if(this.displayTimer>-1){
      this.displayTimer+=1/60;
      if(this.displayTimer>1){
        this.displayTimer=0;
        this.playerState=PlayerState.MOVE;
        this.catchFrame.active=false;
      }
    }
  }

  mapHide(){
    this.openMap.active=!this.littleMap.active;
    this.littleMap.active=!this.littleMap.active;
    this.littlePos.setPosition(new Vec3(this.node.position.x*0.02,this.node.position.y*0.02-96,0));
  }

  
  setting(){//点击设置
      this.buttonAudio.play();
      this.settingFrame.active=!this.settingFrame.active;
  }
  settingHide(){//点击设置确认
    this.buttonAudio.play();
    this.settingFrame.active=false;
  }
  
  //setting(){
  //  if(this.playing){
  //    this.playing=false;
  //    this.settingFrame.active=true;
  //  }
  //  else{
  //    this.settingHide();
  //  }
  //}
//
  //settingHide(){
  //  this.playing=true;
  //  this.settingFrame.active=false;
  //}

  hide(){//按下超重确认按钮
    this.buttonAudio.play();
    this.displayTimer=0;
    this.playerState=PlayerState.MOVE;
    this.overFrame.active=false;
  }
  
  blackGroundA=0;
  die(deltaTime){
    this.dieTimer+=deltaTime;
    if(this.dieTimer>1.6){
      if(this.blackGround.node.active==false){
        this.blackGroundA=0;
        this.blackGround.node.active=true;
      }
      this.blackGroundA+=160*deltaTime;
      this.blackGround.color=color(255,255,255,this.blackGroundA);
    }
    if(this.dieTimer>3.2){
        this.dieTimer=-100;
        director.loadScene("Menu");
      }
  }

  win(){
    this.playerState=PlayerState.WIN;
    Manager.endData.endReason="NORMALEND";
    Manager.boxData.data=Manager.endData.catches;
    this.endPost();
  }

  backTimer=0;
  back(deltaTime){
    this.backTimer+=deltaTime;
    if(this.blackGround.node.active==false){
      this.blackGroundA=0;
      this.blackGround.node.active=true;
    }
    this.blackGroundA+=160*deltaTime;
    this.blackGround.color=color(255,255,255,this.blackGroundA);
    if(this.backTimer>1.6){
      this.backTimer=-100;
      director.loadScene("Box");
    }
  }

  end(){//按下死亡确认按钮
    this.buttonAudio.play();

    this.setmove();
    this.node.angle=90;
    this.playerState=PlayerState.DIE;
    this.light.active=false;
    this.catchFrame.active=false;
    this.overFrame.active=false;
    this.deathFrame.active=false;
    this.moveBody.active=false;
    this.catchBody.active=false;
    this.moveBoostingBody.active=false;
    this.catchBoostingBody.active=false;
    this.dyingBody.active=true;

    Manager.endData.catches=[];
    Manager.endData.treasures=[];
    Manager.endData.endReason="DEATH";
    this.endPost();
  }

  endPost(){
    Manager.endData.userId=this.userId;
    //Manager.curPropData.quantity=this.propNumber;
    //Manager.endData.props.push(Manager.curPropData);
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

  oxygenEnough=true;
  blackDisplayTimer=2;
  consume(deltaTime:number){
    if(this.consuming){
      if(this.blackFrame.active){
        if(this.blackDisplayTimer>0){
          this.blackDisplayTimer-=deltaTime;
        }
        else{
          this.blackFrame.active=false;
        }
      }
      if(this.oxygen>0){//消耗氧气
        this.oxygen-=this.multiplier*deltaTime;
        let ioxygen=Math.round(this.oxygen);
        this.oxygenNumLabel.string=ioxygen.toString();
        if(this.oxygenEnough){
          if(this.oxygen<this.maxOxygen/2){
            this.oxygenEnough=false;
            this.blackFrame.active=true;
          }
        }
      }
      else{//氧气耗尽
        this.consuming=false;
        this.playerState=PlayerState.DISPLAY;
        this.bar.active=false;
        this.catchFrame.active=false;
        this.overFrame.active=false;
        this.deathFrame.active=true;
        this.displayTimer=-1;
      }
      if(this.boosting==2){
        if(this.propTimer>0){//消耗动力包
          this.propTimer-=this.multiplier*deltaTime;
        }
        else{//动力包耗尽
          this.propTimer=20;
          this.boosting=1;
          this.setFastSpeed();
          if(this.moveBoostingBody.active){
            this.moveBody.active=true;
            this.moveBoostingBody.active=false;
          }
          else{
            this.catchBody.active=true;
            this.catchBoostingBody.active=false;
          }
        }
      }
    }
  }

  //onCollisionEnter(other, self) {
  //    this.node.stopAllActions();
  //}
  moveSound(){
    if(this._speedType==SpeedType.STOP){
      if(this.moveAudio.playing==true){
        this.moveAudio.stop();
      }
    }
    else if(this.moveAudio.playing==false){
      this.moveAudio.play();
    }
  }


  update(deltaTime: number) {

    if(this.playerState==PlayerState.MOVE) {
      this.move(deltaTime);
    }
    else if(this.playerState==PlayerState.SHOOT){
      this.harpoonmove(deltaTime);
    }
    else if(this.playerState==PlayerState.CATCH){
      this.barmove();
    }
    else if(this.playerState==PlayerState.DISPLAY){
      this.display();
    }
    else if(this.playerState==PlayerState.DIE){
      this.die(deltaTime);
    }
    else if(this.playerState==PlayerState.WIN){
      this.back(deltaTime);
    }
    this.consume(deltaTime);
    this.moveSound();
  }
}