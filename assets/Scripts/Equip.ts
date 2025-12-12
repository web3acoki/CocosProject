import { _decorator, AudioSource, color, Component, director, equals, instantiate, Label, Node, Prefab, SpriteFrame } from 'cc';
import { Manager } from './Manager';
import { BoxContent } from './BoxContent';
import { EquipContent } from './EquipContent';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
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

    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(EquipContent)
    harpoonContent:EquipContent=null;

    @property(EquipContent)
    tankContent:EquipContent=null;

    @property(EquipContent)
    boxContent:EquipContent=null;

    //@property(AudioSource)//音效
    //buttonAudio:AudioSource=null;

    //@property(Label)
    //userCoins: Label = null;
    //@property(Label)
    //userDiamonds: Label = null;

    harpoonEnough=true;
    tankEnough=true;
    boxEnough=true;

    start() {
        this.updateHarpoon();
        this.updateBox();
        this.updateTank();
        this.updateDataDisplay();
        director.preloadScene("Menu");
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
    //        this.buttonAudio.volume=1;
    //    }
    //    else{
    //        this.buttonAudio.volume=0;
    //    }
    //}

    updateDataDisplay(){
        this.generalUI.updateDisplay();
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

        this.updateDataDisplay();
        if(Manager.questData.data[1].questStatus==1){
            Manager.questData.data[1].questStatus=3;
            Manager.questData.data[1].progress++;
            const questData = { identifier: 9007};
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
        
        Sound.instance.buttonAudio.play();
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
            
            Sound.instance.buttonAudio.play();
            Manager.upgradeData.equipmentId=1;
            Manager.userData.data.coins-=Manager.harpoons[Manager.equipmentData.data[0].level-1].cost;
            Manager.equipmentData.data[0].level++;
            this.updateHarpoon();
            this.upgradePost();
            
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
            Sound.instance.buttonAudio.play();
            Manager.upgradeData.equipmentId=2;
            Manager.userData.data.coins-=Manager.tanks[Manager.equipmentData.data[1].level-1].cost;
            Manager.equipmentData.data[1].level++;
            this.updateTank();
            this.upgradePost();
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
            Sound.instance.buttonAudio.play();
            Manager.upgradeData.equipmentId=3;
            Manager.userData.data.coins-=Manager.boxs[Manager.equipmentData.data[2].level-1].cost;
            Manager.equipmentData.data[2].level++;
            this.updateBox();
            this.upgradePost();
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
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }

    update(deltaTime: number) {

    }
}