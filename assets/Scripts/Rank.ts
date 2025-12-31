import { _decorator, Component, director, Label, Node, Sprite } from 'cc';
import { Sound } from './Sound';
const { ccclass, property } = _decorator;

enum WeekState{
    Week,
    Month,
    All,
}

enum GoldState{
    Gold,
    Diamond,
    Referral,
}

@ccclass('Rank')
export class Rank extends Component {

    @property(Sprite)
    WeekButton:Sprite=null;
    @property(Sprite)
    MonthButton:Sprite=null;
    @property(Sprite)
    AllButton:Sprite=null;
    @property(Sprite)
    GoldButton:Sprite=null;
    @property(Sprite)
    DiamondButton:Sprite=null;
    @property(Sprite)
    ReferralButton:Sprite=null;
    @property(Label)
    goldStateLabel:Label=null;

    private weekState=WeekState.Week;
    private goldState=GoldState.Gold;

    start() {

    }

    update(deltaTime: number) {
        
    }

    switchWeekState(weekState:WeekState){
        if(this.weekState!=weekState){
            Sound.instance.buttonAudio.play();
            this.WeekButton.enabled=weekState==WeekState.Week;
            this.MonthButton.enabled=weekState==WeekState.Month;
            this.AllButton.enabled=weekState==WeekState.All;
            this.weekState=weekState;
        }
    }

    chooseWeek(){
        this.switchWeekState(WeekState.Week);
    }
    chooseMonth(){
        this.switchWeekState(WeekState.Month);
    }
    chooseAll(){
        this.switchWeekState(WeekState.All);
    }
    
    switchGoldState(goldState:GoldState,type:string){
        if(this.goldState!=goldState){
            Sound.instance.buttonAudio.play();
            this.GoldButton.enabled=goldState==GoldState.Gold;
            this.DiamondButton.enabled=goldState==GoldState.Diamond;
            this.ReferralButton.enabled=goldState==GoldState.Referral;
            this.goldState=goldState;
            this.goldStateLabel.string=type;
        }
    }
    
    chooseGold(){
        this.switchGoldState(GoldState.Gold,"Gold");
    }
    chooseDiamond(){
        this.switchGoldState(GoldState.Diamond,"Diamond");
    }
    chooseReferral(){
        this.switchGoldState(GoldState.Referral,"Referral");
    }

    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }
}


