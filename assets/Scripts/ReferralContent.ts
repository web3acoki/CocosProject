import { _decorator, AudioSource, Component, director, Label, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ReferralContent')
export class ReferralContent extends Component {
    
    
    @property(Label)
    userId:Label=null;
    @property(Label)
    diamond:Label=null;

    start() {

    }

    update(deltaTime: number) {
        
    }
    
}


