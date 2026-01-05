import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RankContent')
export class RankContent extends Component {

    @property(Label)
    rankLabel:Label=null;
    @property(Label)
    nicknameLabel:Label=null;
    @property(Label)
    scoreLabel:Label=null;
    start() {

    }

    update(deltaTime: number) {
        
    }
}


