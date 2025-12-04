import { _decorator, AudioSource, Component, director, Node } from 'cc';
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

    update(deltaTime: number) {
        
    }
}