import { _decorator, AudioSource, color, Component, director, equals, instantiate, Label, Node, Prefab, SpriteFrame } from 'cc';
import { Manager } from './Manager';
import { BoxContent } from './BoxContent';
import { EquipContent } from './EquipContent';
const { ccclass, property } = _decorator;

@ccclass('Equip')
export class Equip extends Component {
    
    //@property(Node)
    //contentNode: Node = null;

    //@property([Prefab])
    //boxContentPrefabs: Prefab;

    //@property(Node)
    //harpoonupgrade:Node=null;
    //@property(Node)
    //harpoonMaxLevel:Node=null;
    //@property(Label)
    //harpoonCostLabel:Label=null;
    //@property(Label)
    //harpoonCurLabel:Label=null;
    //@property(Label)
    //harpoonNextLabel:Label=null;
    //
    //@property(Node)
    //tankupgrade:Node=null;
    //@property(Node)
    //tankMaxLevel:Node=null;
    //@property(Label)
    //tankCostLabel:Label=null;
    //@property(Label)
    //tankCurLabel:Label=null;
    //@property(Label)
    //tankNextLabel:Label=null;
    //
    //@property(Node)
    //boxupgrade:Node=null;
    //@property(Node)
    //boxMaxLevel:Node=null;
    //@property(Label)
    //boxCostLabel:Label=null;
    //@property(Label)
    //boxCurLabel:Label=null;
    //@property(Label)
    //boxNextLabel:Label=null;
    //
    //@property([Prefab])
    //boxContentPrefab: Prefab=null;
    //@property(Node)
    //selectAllNode:Node=null;
    //@property(Label)
    //coinNumLabel:Label=null;
    //@property(Label)
    //diamondNumLabel:Label=null;

    @property(EquipContent)
    harpoonContent:EquipContent=null;

    @property(EquipContent)
    tankContent:EquipContent=null;

    @property(EquipContent)
    boxContent:EquipContent=null;

    @property(AudioSource)//音效
    buttonAudio:AudioSource=null;

    @property(Label)
    userCoins: Label = null;
    @property(Label)
    userDiamonds: Label = null;

    harpoonEnough=true;
    tankEnough=true;
    boxEnough=true;

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
        this.updateHarpoon();
        this.updateBox();
        this.updateTank();
        this.updateDataDisplay();
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
    }

    updateDataDisplay(){
        this.userCoins.string=Manager.userData.data.coins.toString();
        this.userDiamonds.string=Manager.userData.data.diamonds.toString();
        if(Manager.userData.data.coins<Manager.harpoons[Manager.equipmentData.data[0].level-1].cost){
            this.harpoonContent.costLabel.color=color(255,0,0);
            this.harpoonEnough=false;
        }
        if(Manager.userData.data.coins<Manager.tanks[Manager.equipmentData.data[1].level-1].cost){
            this.tankContent.costLabel.color=color(255,0,0);
            this.tankEnough=false;
        }
        if(Manager.userData.data.coins<Manager.boxs[Manager.equipmentData.data[2].level-1].cost){
            this.boxContent.costLabel.color=color(255,0,0);
            this.boxEnough=false;
        }
    }


    upgradePost(){

        this.buttonAudio.play();
        console.log(Manager.sellFishData);
        Manager.getInstance().post('https://api.xdiving.io/api/equipment/user/'+Manager.userData.data.userId.toString()+'/upgrade',
        Manager.upgradeData,
        (data) => {
          console.log('升级数据:', data);
          console.log(Manager.upgradeData);
          },
          (error) => {
              console.log(`升级数据POST失败: ${error}`);
          }
        )
    }

    upgradeHarpoon(){
        if(this.harpoonEnough){
            
            this.buttonAudio.play();
            Manager.upgradeData.equipmentId=1;
            Manager.userData.data.coins-=Manager.harpoons[Manager.equipmentData.data[0].level-1].cost;
            Manager.equipmentData.data[0].level++;
            this.upgradePost();
            this.updateHarpoon();
            
            this.updateDataDisplay();
        }
    }

    updateHarpoon(){
        
        let level=Manager.equipmentData.data[0].level;
        let harpoon=Manager.harpoons[level-1];
        this.harpoonContent.curLabel.string="Lv."+level+" Deals "+harpoon.attribute+" damage to fish";
        if(level==Manager.harpoons.length){
            this.harpoonContent.upgrade.active=false;
            this.harpoonContent.maxLevel.active=true;
        }
        else{
            this.harpoonContent.costLabel.string=harpoon.cost.toString();
            level++;
            harpoon=Manager.harpoons[level-1];
            this.harpoonContent.nextLabel.string="Lv."+level+" Deals "+harpoon.attribute+" damage to fish";
        }
    }

    
    upgradeTank(){
        if(this.tankEnough){
            this.buttonAudio.play();
            Manager.upgradeData.equipmentId=2;
            Manager.userData.data.coins-=Manager.tanks[Manager.equipmentData.data[1].level-1].cost;
            Manager.equipmentData.data[1].level++;
            this.upgradePost();
            this.updateTank();
            
            this.updateDataDisplay();
        }
    }

    updateTank(){
        
        let level=Manager.equipmentData.data[1].level;
        let tank=Manager.tanks[level-1];
        this.tankContent.curLabel.string="Lv."+level+" Air capacity "+tank.attribute+" bar";
        if(level==Manager.tanks.length){
            this.tankContent.upgrade.active=false;
            this.tankContent.maxLevel.active=true;
        }
        else{
            this.tankContent.costLabel.string=tank.cost.toString();
            level++;
            tank=Manager.tanks[level-1];
            this.tankContent.nextLabel.string="Lv."+level+" Air capacity "+tank.attribute+" bar";
        }
    }

    upgradeBox(){
        if(this.boxEnough){
            this.buttonAudio.play();
            Manager.upgradeData.equipmentId=3;
            Manager.userData.data.coins-=Manager.boxs[Manager.equipmentData.data[2].level-1].cost;
            Manager.equipmentData.data[2].level++;
            this.upgradePost();
            this.updateBox();
            this.updateDataDisplay();
        }
    }

    updateBox(){
        let level=Manager.equipmentData.data[2].level;
        let box=Manager.boxs[level-1];
        this.boxContent.curLabel.string="Lv."+level+" Max Haul "+box.attribute+" kg";
        if(level==Manager.boxs.length){
            this.boxContent.upgrade.active=false;
            this.boxContent.maxLevel.active=true;
        }
        else{
            this.boxContent.costLabel.string=box.cost.toString();
            level++;
            box=Manager.boxs[level-1];
            this.boxContent.nextLabel.string="Lv."+level+" Max Haul "+box.attribute+" kg";
        }
    }


    back(){
        this.buttonAudio.play();
        director.loadScene("Menu");
    }

    update(deltaTime: number) {

    }
}