import { _decorator, color, Component, Label, Node } from 'cc';
import { Manager } from './Manager';
import { Sound } from './Sound';
import { Menu } from './Menu';
const { ccclass, property } = _decorator;

@ccclass('PropContent')
export class PropContent extends Component {
    @property(Label)
    nameLabel:Label=null;
    @property(Label)
    costLabel:Label=null;
    @property(Label)
    quantityLabel:Label=null;
    @property(Label)
    descriptionLabel:Label=null;
    
    menu:Menu=null;

    index:number=0;

    buyProp(){
        if(Manager.propBaseData.data[this.index].costGold<Manager.userData.data.coins){
            Sound.instance.buttonAudio.play();
            Manager.userData.data.coins-=Manager.propBaseData.data[this.index].costGold;
            Manager.propData.data[this.index].quantity++;
            this.menu.updateDataDisplay();
            let buyPropData={userId:Manager.userData.data.userId,propId:this.index+1}; 
            Manager.getInstance().post('https://api.xdiving.io/api/prop/purchase',
            buyPropData,
            (data) => {
              console.log('购买数据:', data);
              console.log(buyPropData);
              },
              (error) => {
                  console.log(`购买数据POST失败: ${error}`);
              }
            )
        }
    }

    updateDataDisplay(){
        this.quantityLabel.string="Owned:"+Manager.propData.data[this.index].quantity.toString();
        if(Manager.propBaseData.data[this.index].costGold>Manager.userData.data.coins){
            this.costLabel.color=color(255,0,0);
        }
    }

    update(deltaTime: number) {
        
    }
}

