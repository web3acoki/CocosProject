import { _decorator, AudioSource, Component, director, instantiate, Label, Node, Prefab } from 'cc';
import { Manager } from './Manager';
import { ReferralContent } from './ReferralContent';
const { ccclass, property } = _decorator;

@ccclass('Referral')
export class Referral extends Component {
    
    
    @property(AudioSource)//音效
    buttonAudio:AudioSource=null;

    @property(Node)
    contentNode:Node=null;
    @property(Prefab)
    referralContent:Prefab=null;
    @property(Label)
    numLabel:Label=null;
    @property(Label)
    linkLabel:Label=null;

    start() {
        for(const invitee of Manager.inviteUsers.data){
            let contentInstance = instantiate(this.referralContent);
            this.contentNode.addChild(contentInstance);
            contentInstance.getComponent(ReferralContent).userId.string=invitee.inviteeUserId.toString();
        }
        this.numLabel.string="Friend List("+Manager.inviteUsers.data.length.toString()+")";
        this.linkLabel.string="https://t.me/xdiving_bot/xdiving_bot";
    }

    update(deltaTime: number) {
        
    }
    
    back(){
        this.buttonAudio.play();
        director.loadScene("Menu");
    }
}


