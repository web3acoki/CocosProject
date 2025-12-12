import { _decorator, Button, Component, Label, Node } from 'cc';
import { Menu } from './Menu';
import { Manager } from './Manager';
import { Sound } from './Sound';
const { ccclass, property } = _decorator;

@ccclass('CheckInContent')
export class CheckInContent extends Component {

    @property(Node)
    received:Node=null;
    
    @property(Node)
    frame:Node=null;

    @property(Label)
    dayLabel:Label=null;

    @property(Label)
    rewardLabel:Label=null;

    @property(Button)
    button:Button=null;

    @property(Menu)
    menu:Menu=null;

    @property(Number)
    day:number=1;

    //@property(Label)
    //propLabel:Label=null;
    //

    start() {
        this.dayLabel.string="Day"+this.day.toString();
        for(const reward of Manager.checkInData.data.rewards){
            if(reward.checkDay==this.day){
                if(reward.checkDay==7){
                    this.rewardLabel.string="X"+reward.propQuantity.toString();
                }
                else{
                    this.rewardLabel.string="X"+reward.coinReward.toString();
                }
            }
        }
        //this.updateCheckIn();
    }

    checkIn(){
        
        Sound.instance.buttonAudio.play();
        let url="https://api.xdiving.io/api/checkin/"+Manager.userData.data.userId.toString();
            Manager.getInstance().post(url,
            Manager.startData,
            (data) => {
              console.log('签到数据:', data);
              console.log(Manager.startData);
              },
              (error) => {
                  console.log(`'签到数据POST失败: ${error}`);
              }
            )
        let checkData=Manager.checkInData.data;
        Manager.userData.data.coins+=checkData.rewards[checkData.currentCheckDays-1].coinReward;
        Manager.propData.data[0].quantity+=checkData.rewards[checkData.currentCheckDays-1].propQuantity;
        if(checkData.currentCheckDays==7){
            checkData.currentCheckDays=1;
        }
        else{
            checkData.currentCheckDays++;
        }
        checkData.isCheckedToday=true;
        this.menu.updateDataDisplay();
        this.menu.updateCheckInHint();
    }

    updateCheckIn(){
        if(Manager.checkInData.data.currentCheckDays==1&&Manager.checkInData.data.isCheckedToday==true){
            this.received.active=true;
            this.frame.active=true;
            this.button.interactable=false;
        }
        else{
            if(Manager.checkInData.data.currentCheckDays>this.day){
                this.received.active=true;
            }
            else{
                this.received.active=false;
            }
            if(Manager.checkInData.data.currentCheckDays==this.day&&Manager.checkInData.data.isCheckedToday==false){
                this.frame.active=false;
                this.button.interactable=true;
            }
            else{
                this.frame.active=true;
                this.button.interactable=false;
            }
        }
    }
}


