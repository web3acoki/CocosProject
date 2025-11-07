import { _decorator, AudioSource, color, Color, Component,director, EditBox, Label, Node, SpringJoint2D, Sprite, Vec3 } from 'cc';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {

    @property(AudioSource)
    buttonAudio:AudioSource=null;

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

    @property(Node)
    settingFrame: Node = null;
    @property(Node)
    noEmpty: Node = null;
    @property(Node)
    blackFrame: Node = null;
    @property(Node)
    comingSoonFrame: Node = null;
    
    @property(Node)
    checkInFrame: Node = null;

    @property(Sprite)
    goFishingSprite: Sprite = null;
    @property(Node)
    chooseMapNode: Node = null;
    
    
    @property(Label)
    userId: Label = null;
    @property(Label)
    userCoins: Label = null;
    @property(Label)
    userDiamonds: Label = null;
    @property(Label)
    availableDives: Label = null;
    
    @property(Node)
    propFrame:Node=null;
    @property(Label)
    propCost:Label=null;
    @property(Label)
    propName:Label=null;

    @property(Label)
    test1:Label=null;
    @property(Label)
    test2:Label=null;
    @property(Label)
    test3:Label=null;
    @property(EditBox)
    userIdInput:EditBox=null;

    @property(Node)
    blackGround:Node=null;
    @property(Node)
    guide1:Node=null;
    @property(Node)
    guide2:Node=null;
    @property(Node)
    guide3:Node=null;
    @property(Node)
    guide4:Node=null;

    private manOrigin=Vec3.ZERO;
    private manOffset=Vec3.ZERO;
    private shipOrigin=Vec3.ZERO;
    private shipOffset=Vec3.ZERO;
    private step=0;
    private shakeUp=1;
    private shakeTimer=0;
    private stepTimer=0;
    private mapChosed=false;
    private displayLoaded=false;
    private displayTimer=2;
    private comingSoonTimer=1;

    start() {
        //this.standMan.children[0].active=true;
        this.manOrigin=this.standMan.position.clone();
        this.shipOrigin=this.dropShip.position.clone();

        director.preloadScene("Game");
        //this.settingFrame.active=false;
    }

    updateDataDisplay(){
        this.userCoins.string=Manager.userData.data.coins.toString();
        this.userDiamonds.string=Manager.userData.data.diamonds.toString();
        this.availableDives.string="Available dives:"+Manager.userData.data.remainingRounds.toString();
        this.propName.string="Power Pack x"+Manager.propData.data[0].quantity;
        this.userId.string=Manager.userData.data.userId.toString();
        
        if(Manager.propBaseData.data[0].costGold>Manager.userData.data.coins){
            this.propCost.color=color(255,0,0);
        }
    }

    update(deltaTime: number) {
        if(Manager.initRequest.initData==null){
            this.test3.string="null";
        }
        else{
            this.test3.string=Manager.initRequest.initData;
        }
        if(this.displayLoaded==false){
            if(Manager.loadFinish==4){
                this.displayLoaded=true;
                this.updateDataDisplay();
                this.test1.string=Manager.userData.data.userId.toString();
                this.test2.string=Manager.initRequest.initData;
            }
        }

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
                this.walkMan.setPosition(this.manOrigin.clone().add(this.manOffset));
            }
            else{
                this.walkMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
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
                
                this.chooseMapNode.active=true;
            }
        }
        if(this.step==2){//人到船上，升帆
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.risingShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
            this.stepTimer+=deltaTime;
            if(this.stepTimer>0.9){
                this.stepTimer=0;
                this.step=3;
                
                this.riseShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
                this.risingShip.active=false;
                this.riseShip.active=true;
            }
        }
        if(this.step==3){//等待选择地图
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.riseShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
            if(this.mapChosed){
                this.step = 4;
                //Manager.getInstance().preloadGame;
                
            }
        }
        if(this.step==4){//人和船离开地图
            this.shipOffset=this.shipOffset.clone().add(new Vec3(deltaTime *400, 0, 0));
            this.standMan.setPosition(this.manOrigin.clone().add(this.manOffset).add(this.shipOffset));
            this.riseShip.setPosition(this.shipOrigin.clone().add(this.shipOffset));
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

    setting(){//点击设置
        this.buttonAudio.play();
        this.settingFrame.active=!this.settingFrame.active;
    }

    //settingHide(){//点击设置确认
    //  this.buttonAudio.play();
    //  this.settingFrame.active=false;
    //}

    
    noEmptyHide(){//点击设置确认
        this.buttonAudio.play();
        this.noEmpty.active=false;
    }

    comingSoonHide(){
        this.comingSoonFrame.active=true;
        this.comingSoonTimer=1;
    }

    Gofishing()//点击出海
    {
        if (this.step == 0) {
            this.buttonAudio.play();
            console.log(Manager.boxData.data.length);
            if(Manager.boxData.data.length==0){
                if(Manager.userData.data.remainingRounds>0){
                    const color=this.goFishingSprite.color;
                    this.goFishingSprite.color=new Color(color.a,color.g,color.b,128);
                    this.step = 1;

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
        //director.preloadScene("SampleScene", () => {
        //    director.loadScene("SampleScene");
        //}
    }

    buyProp(){
        //Manager.buyPropData={userId:1,propId:1};
        //Manager.getInstance().post('https://api.xdiving.io/api/prop/purchase',
        //Manager.buyPropData,
        //(data) => {
        //  console.log('购买数据:', data);
        //  console.log(Manager.buyPropData);
        //  },
        //  (error) => {
        //      console.log(`购买数据POST失败: ${error}`);
        //  }
        if(Manager.propBaseData.data[0].costGold<Manager.userData.data.coins){
            this.buttonAudio.play();
            Manager.userData.data.coins-=Manager.propBaseData.data[0].costGold;
            Manager.propData.data[0].quantity++;
            this.updateDataDisplay();
            Manager.buyPropData={userId:Manager.userData.data.userId,propId:1};
            Manager.getInstance().post('https://api.xdiving.io/api/prop/purchase',
            Manager.buyPropData,
            (data) => {
              console.log('购买数据:', data);
              console.log(Manager.buyPropData);
              },
              (error) => {
                  console.log(`购买数据POST失败: ${error}`);
              }
            )
        }
    }
    
    chooseMap(){
        if(this.mapChosed==false){
            this.buttonAudio.play();
            this.mapChosed=true;
            this.chooseMapNode.active=false;
        }
    }

    referral(){
        this.buttonAudio.play();
        director.loadScene("Referral");
    }

    box(){
        this.buttonAudio.play();
        director.loadScene("Box");
    }

    equip(){
        this.buttonAudio.play();
        director.loadScene("Equip");
    }

    propHide(){
        this.buttonAudio.play();
        this.propFrame.active=!this.propFrame.active;
    }

    initUser(){
        let userId=parseInt(this.userIdInput.string);
        
        this.displayLoaded=false;
        Manager.loadFinish=0;
        if(userId==0){
            Manager.getInstance().loadTGUser();
        }
        else{
            Manager.getInstance().loadFakeUser(userId);
        }
    }

    checkIn(number){
        
    }

    checkInHide(){
        this.checkInFrame.active=!this.checkInFrame.active;
    }
}

