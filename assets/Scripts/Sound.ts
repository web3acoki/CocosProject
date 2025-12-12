import { _decorator, AudioSource, Component, director, Node } from 'cc';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;

@ccclass('Sound')
export class Sound extends Component {

    public static instance:Sound = null;
    
    @property(AudioSource)
    BGM: AudioSource = null;
    @property(AudioSource)
    buttonAudio: AudioSource = null;

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
    @property(AudioSource)
    treasureAudio:AudioSource=null;
    @property(AudioSource)
    backAudio:AudioSource=null;

    onLoad(){
        if (Sound.instance) {
            this.destroy();
            return;
        } else {
            Sound.instance = this;
            director.addPersistRootNode(this.node);
        }
    }

    start() {
        this.BGM.play();
    }
    
    updateSound(){
        if(Manager.userData.data.BGMopen){
            Sound.instance.BGM.volume=1;
            Sound.instance.stayAudio.volume=1;
            Sound.instance.moveAudio.volume=1;
            Sound.instance.boostAudio.volume=1;
            
        }
        else{
            Sound.instance.BGM.volume=0;
            Sound.instance.stayAudio.volume=0;
            Sound.instance.moveAudio.volume=0;
            Sound.instance.boostAudio.volume=0;
        }
        if(Manager.userData.data.BGSopen){
            Sound.instance.buttonAudio.volume=1;
            Sound.instance.shootAudio.volume=0.5;
            Sound.instance.catchAudio.volume=1;
            Sound.instance.treasureAudio.volume=1;
            Sound.instance.backAudio.volume=1;
        }
        else{
            Sound.instance.buttonAudio.volume=0;
            Sound.instance.catchAudio.volume=0;
            Sound.instance.treasureAudio.volume=0;
            Sound.instance.shootAudio.volume=0;
            Sound.instance.backAudio.volume=0;
        }
    }

    update(deltaTime: number) {
        
    }
}