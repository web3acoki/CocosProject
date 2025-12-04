import { _decorator, AudioSource, Component, Node } from 'cc';
import { Manager } from './Manager';
import { Sound } from './Sound';
const { ccclass, property } = _decorator;

@ccclass('Guide')
export class Guide extends Component {

    
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
    @property(Node)
    goFishing:Node=null;

    cur=0;

    start() {
        if(Manager.userData.data.guideFinish==false){
            this.cur++;
            this.blackGround.active=true;
            this.guide1.active=true;
        }
    }

    update(deltaTime: number) {
    }

    next(){
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
            this.cur++;
        }
        else if(this.cur==3){
            Sound.instance.buttonAudio.play();
            this.guide3.active=false;
            this.guide4.active=true;
            this.cur++;
        }
        else if(this.cur==4){
            Sound.instance.buttonAudio.play();
            this.guide4.active=false;
            this.goFishing.active=true;
            this.cur++;
        }
    }
}


