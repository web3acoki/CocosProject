import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameQuestContent')
export class gameQuestContent extends Component {
    @property(Label)
    progressLabel:Label=null;
    @property(Sprite)
    sprite:Sprite=null;
    start() {
        
    }

    update(deltaTime: number) {
        
    }
}


