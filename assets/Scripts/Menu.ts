import { _decorator, assetManager, AudioSource, color, Color, Component,director, EditBox, ImageAsset, Label, loader, Node, SpringJoint2D, Sprite, SpriteFrame, Texture2D, Vec3 } from 'cc';
import { Manager } from './Manager';
import { CheckInContent } from './CheckInContent';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { PropContent } from './PropContent';

const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {

    //@property(AudioSource)//音效
    //buttonAudio:AudioSource=null;
    //@property(AudioSource)
    //BGM:AudioSource=null;
    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Node)
    standMan: Node = null;
    @property(Node)
    walkMan: Node = null;
    @property(Node)
    dropShip: Node = null;
    @property(Node)
    risingShip: Node = null;
    @property(Node)
    riseShip: Node = null;

    //@property(Node)
    //settingFrame: Node = null;
    @property(Node)
    noEmpty: Node = null;
    @property(Node)
    blackFrame: Node = null;
    @property(Node)
    comingSoonFrame: Node = null;
    
    @property(Node)
    checkInFrame: Node = null;
    @property(Node)
    checkInContentNode:Node=null;

    @property(Sprite)
    goFishingSprite: Sprite = null;
    @property(Sprite)
    goFishingSprite2: Sprite = null;
    @property(Node)
    chooseMapNode: Node = null;
    @property(Node)
    chooseMapNode2: Node = null;
    
    //@property(Label)
    //userId: Label = null;
    //@property(Label)
    //userCoins: Label = null;
    //@property(Label)
    //userDiamonds: Label = null;
    @property(Label)
    availableDives: Label = null;
    
    @property(Node)
    propFrame:Node=null;
    @property(Node)
    propContentNode:Node=null;
    //@property(Label)
    //propCost:Label=null;
    //@property(Label)
    //propNum:Label=null;

    @property(Label)
    test1:Label=null;
    @property(Label)
    test2:Label=null;
    @property(Label)
    test3:Label=null;
    @property(Label)
    test4:Label=null;
    @property(Label)
    test5:Label=null;
    @property(Label)
    test6:Label=null;
    
    //@property(EditBox)
    //userIdInput:EditBox=null;

    @property(Node)
    guideGround:Node=null;
    @property(Node)
    finger:Node=null;

    //@property(Node)
    //BGMon:Node=null;
    //@property(Node)
    //BGMoff:Node=null;
    //@property(Node)
    //BGSon:Node=null;
    //@property(Node)
    //BGSoff:Node=null;

    //@property(Sprite)
    //remote:Sprite=null;

    private manOrigin=Vec3.ZERO;
    private manOffset=Vec3.ZERO;
    private walkOrigin=Vec3.ZERO;
    private shipOrigin=Vec3.ZERO;
    private shipOffset=Vec3.ZERO;
    private riseOrigin=Vec3.ZERO;
    private step=0;
    private shakeUp=1;
    private shakeTimer=0;
    private stepTimer=0;
    private mapChosed=false;
    private displayTimer=2;
    private comingSoonTimer=1;

    //private displayLoaded=false;

    start() {
        //this.standMan.children[0].active=true;
        

        Sound.instance.moveAudio.stop();
        Sound.instance.stayAudio.stop();
        Sound.instance.boostAudio.stop();
        this.manOrigin=this.standMan.position.clone();
        this.walkOrigin=this.walkMan.position.clone();
        this.shipOrigin=this.dropShip.position.clone();
        this.riseOrigin=this.riseShip.position.clone();

        director.preloadScene("Box");
        director.preloadScene("Equip");
        director.preloadScene("Referral");
        director.preloadScene("Load");
        director.preloadScene("Game");
        
        this.initProp();
        this.updateDataDisplay();

        //assetManager.loadRemote("https://amzn-s3-diving-bucket.s3.ap-northeast-1.amazonaws.com/test.png", (err, asset) => {
        //    const texture = new Texture2D();
        //    texture.image = asset as ImageAsset;
        //    
        //    const spriteFrame = new SpriteFrame();
        //    spriteFrame.texture = texture;
        //    
        //    this.remote.spriteFrame = spriteFrame;
        //});

        //assetManager.loadRemote("https://amzn-s3-diving-bucket.s3.ap-northeast-1.amazonaws.com/test.png",
//
        //(err, asset) => {
        //    if (err) {
        //        //error('图片加载失败:', err);
        //        return;
        //    }
        //}
        //);
        //loader.load("https://amzn-s3-diving-bucket.s3.ap-northeast-1.amazonaws.com/test.png");
        //this.settingFrame.active=false;
    }

    initProp(){
        for(let index=0;index<this.propContentNode.children.length;index++){
            let propContent = this.propContentNode.children[index].getComponent(PropContent);
            propContent.index=index;
            propContent.menu=this;
            propContent.nameLabel.string=Manager.propBaseData.data[index].propNameEn;
            propContent.costLabel.string=Manager.propBaseData.data[index].costGold.toString();
            propContent.descriptionLabel.string=Manager.propBaseData.data[index].description.replace("@", Manager.propBaseData.data[index].value.toString());
            propContent.updateDataDisplay();
        }
    }

    updateDataDisplay(){
        this.generalUI.updateDisplay();
        this.generalUI.updateLevel();
        this.availableDives.string="Available dives:"+Manager.userData.data.remainingRounds.toString();
        //this.propNum.string="Owned:"+Manager.propData.data[0].quantity;
        //this.userId.string="UID:"+Manager.userData.data.userId.toString();

        for(const checkInContent of this.checkInContentNode.children){
            checkInContent.getComponent(CheckInContent).updateCheckIn();
        }


        for(const propContent of this.propContentNode.children){
            propContent.getComponent(PropContent).updateDataDisplay();
        }
        
        //this.updateSetting();
    }

    //updateSetting(){
    //    this.BGMon.active=Manager.userData.data.BGMopen;
    //    this.BGMoff.active=!Manager.userData.data.BGMopen;
    //    this.BGSon.active=Manager.userData.data.BGSopen;
    //    this.BGSoff.active=!Manager.userData.data.BGSopen;
    //    this.updateSound();
    //}
//
    //updateSound(){
    //    if(Manager.userData.data.BGMopen){
    //        Sound.instance.BGM.volume=1;
    //    }
    //    else{
    //        Sound.instance.BGM.volume=0;
    //    }
    //    if(Manager.userData.data.BGSopen){
    //        Sound.instance.buttonAudio.volume=1;
    //    }
    //    else{
    //        Sound.instance.buttonAudio.volume=0;
    //    }
    //}
//
    //SettingBGM(){
    //    Sound.instance.buttonAudio.play();
    //    Manager.userData.data.BGMopen=!Manager.userData.data.BGMopen;
    //    this.SettingPut();
    //    this.updateSetting();
    //}
//
    //SettingBGS(){
    //    Sound.instance.buttonAudio.play();
    //    Manager.userData.data.BGSopen=!Manager.userData.data.BGSopen;
    //    this.SettingPut();
    //    this.updateSetting();
    //}
//
    //SettingPut(){
    //    Manager.setData.BGMopen=Manager.userData.data.BGMopen;
    //    Manager.setData.BGSopen=Manager.userData.data.BGSopen;
    //    Manager.getInstance().put('https://api.xdiving.io/api/user/'+Manager.userData.data.userId+'/bgm-bgs',
    //    Manager.setData,
    //    (data) => {
    //      console.log('设置数据:', data);
    //      console.log(Manager.setData);
    //      },
    //      (error) => {
    //          console.log(`设置数据PUT失败: ${error}`);
    //      }
    //    )
    //}

    update(deltaTime: number) {
        //if(Manager.initRequest.initData==null){
        //    this.test3.string="null";
        //}
        //else{
        //    this.test3.string=Manager.initRequest.initData;
        //}
        //
        //if(Manager.testInitData==null){
        //    this.test4.string="null";
        //}
        //else{
        //    this.test4.string=Manager.testInitData;
        //}
        //
        //
        //if(Manager.testAuthdate==null){
        //    this.test5.string="null";
        //}
        //else{
        //    this.test5.string=Manager.testAuthdate;
        //}
        //if(Manager.testUserId==null){
        //    this.test6.string="null";
        //}
        //else{
        //    this.test6.string=Manager.testUserId;
        //}

        //if(this.displayLoaded==false){
        //    if(Manager.getInstance().getFinish()){
        //        this.displayLoaded=true;
        //        this.updateDataDisplay();
        //        this.test1.string=Manager.userData.data.userId.toString();
        //        this.test2.string=Manager.initRequest.initData;
        //    }
        //}

        if(this.blackFrame.active){
            if(this.displayTimer>0){
                this.displayTimer-=deltaTime;
            }
            else{
                this.blackFrame.active=false;
            }
        }
        if(this.comingSoonFrame.active){
            if(this.comingSoonTimer>0){
                this.comingSoonTimer-=deltaTime;
            }
            else{
                this.comingSoonFrame.active=false;
            }
        }

        this.shipOffset=this.shipOffset.clone().add(new Vec3(0, this.shakeUp * deltaTime* 20 , 0));
        this.shakeTimer+=this.shakeUp*deltaTime;
        if(this.shakeTimer>0.5){
            this.shakeUp=-1;
        }
        if(this.shakeTimer<-0.5){
            this.shakeUp=1;
        }
        if(this.step==0){//等待出海
            this.dropShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
        }
        if (this.step == 1) {//人向船上移动
            //console.log("walking");
            this.manOffset = this.manOffset.clone().add(new Vec3(deltaTime * 200, 0, 0));
            this.dropShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
            this.stepTimer += deltaTime;
            if(this.stepTimer < 0.5){
                this.walkMan.setPosition(this.walkOrigin.clone().add(this.manOffset));
            }
            else{
                this.walkMan.setPosition(this.walkOrigin.clone().add(this.manOffset).add(this.shipOffset));
            }
            if (this.stepTimer > 1) {
                this.stepTimer = 0;
                this.step = 2;

                this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
                this.risingShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
                this.standMan.active = true;
                this.walkMan.active = false;
                this.risingShip.active = true;
                this.dropShip.active = false;
                
                if(Manager.userData.data.guideFinish){
                    this.chooseMapNode.active=true;
                }
                else{
                    this.chooseMapNode2.active=true;
                }
            }
        }
        if(this.step==2){//人到船上，升帆
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.risingShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
            this.stepTimer+=deltaTime;
            if(this.stepTimer>0.9){
                this.stepTimer=0;
                this.step=3;
                
                this.riseShip.setPosition(this.riseOrigin.clone().add(this.shipOffset));
                this.risingShip.active=false;
                this.riseShip.active=true;
            }
        }
        if(this.step==3){//等待选择地图
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.riseShip.setPosition(this.riseOrigin.clone().add(this.shipOffset));
            if(this.mapChosed){
                this.step = 4;
                //Manager.getInstance().preloadGame;
                
            }
        }
        if(this.step==4){//人和船离开地图
            this.shipOffset=this.shipOffset.clone().add(new Vec3(deltaTime *400, 0, 0));
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.riseShip.setPosition(this.riseOrigin.clone().add(this.shipOffset));
            this.stepTimer += deltaTime;
            if (this.stepTimer > 1.25) {
                this.stepTimer=-100;
                if(Manager.loaded){
                   director.loadScene("Game");
                }
                else{
                    Manager.loaded=true;
                    director.loadScene("Load");
                }
            }
        }
    }

    //buttonSound(){
    //    this.buttonAudio.play();
    //}

    //setting(){//点击设置
    //    Sound.instance.buttonAudio.play();
    //    this.settingFrame.active=!this.settingFrame.active;
    //    this.guideGround.active=!this.guideGround.active;
    //}

    //settingHide(){//点击设置确认
    //  this.buttonAudio.play();
    //  this.settingFrame.active=false;
    //}

    
    noEmptyHide(){//点击设置确认
        Sound.instance.buttonAudio.play();
        this.noEmpty.active=false;
    }

    comingSoonHide(){
        this.comingSoonFrame.active=true;
        this.comingSoonTimer=1;
    }

    Gofishing()//点击出海
    {
        //director.loadScene("Load");
        if (this.step == 0) {
          //this.blackGround.active=false;
          Sound.instance.buttonAudio.play();
          if(Manager.userData.data.guideFinish==false){
              this.finger.active=true;
          }
          if(Manager.boxData.data.length==0){
              if(Manager.userData.data.remainingRounds>0){
                  this.goFishingSprite2.node.active=false;
                  const color=this.goFishingSprite.color;
                  this.goFishingSprite.color=new Color(color.a,color.g,color.b,128);
                  
                  this.step = 1;
//
                  this.walkMan.setPosition(this.manOrigin.clone().add(this.manOffset));
                  
                  this.standMan.active = false;
                  this.walkMan.active = true;
              }
              else{
                  this.blackFrame.active=true;
                  this.displayTimer=2;
              }
          }
          else{
              this.noEmpty.active=true;
          }
          //(this.walkMan.getComponent("Walk") as any).walking = true;
        }
    }

    //buyProp(){//点击购买道具
    //    //Manager.buyPropData={userId:1,propId:1};
    //    //Manager.getInstance().post('https://api.xdiving.io/api/prop/purchase',
    //    //Manager.buyPropData,
    //    //(data) => {
    //    //  console.log('购买数据:', data);
    //    //  console.log(Manager.buyPropData);
    //    //  },
    //    //  (error) => {
    //    //      console.log(`购买数据POST失败: ${error}`);
    //    //  }
    //    if(Manager.propBaseData.data[2].costGold<Manager.userData.data.coins){
    //        Sound.instance.buttonAudio.play();
    //        Manager.userData.data.coins-=Manager.propBaseData.data[2].costGold;
    //        Manager.propData.data[2].quantity++;
    //        this.updateDataDisplay();
    //        Manager.buyPropData={userId:Manager.userData.data.userId,propId:3};
    //        Manager.getInstance().post('https://api.xdiving.io/api/prop/purchase',
    //        Manager.buyPropData,
    //        (data) => {
    //          console.log('购买数据:', data);
    //          console.log(Manager.buyPropData);
    //          },
    //          (error) => {
    //              console.log(`购买数据POST失败: ${error}`);
    //          }
    //        )
    //    }
    //}
    
    chooseMap(){
        if(this.mapChosed==false){
            Sound.instance.buttonAudio.play();
            this.mapChosed=true;
            this.chooseMapNode.active=false;
            this.chooseMapNode2.active=false;
        }
    }

    referral(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Referral");
    }

    box(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Box");
    }

    equip(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Equip");
    }

    topup(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Topup");
    }

    quest(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Quest");
    }

    propHide(){
        Sound.instance.buttonAudio.play();
        this.propFrame.active=!this.propFrame.active;
    }

    //initUser(){
    //    let userId=parseInt(this.userIdInput.string);
    //    
    //    this.displayLoaded=false;
    //    Manager.loadFinish=0;
    //    if(userId==0){
    //        Manager.getInstance().loadTGUser();
    //    }
    //    else{
    //        Manager.getInstance().loadFakeUser(userId);
    //    }
    //    this.settingFrame.active=false;
    //}

    checkInHide(){
        Sound.instance.buttonAudio.play();
        this.checkInFrame.active=!this.checkInFrame.active;
    }

}

