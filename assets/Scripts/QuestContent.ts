import { _decorator, Button, Component, Label, Node, Sprite } from 'cc';
import { Quest } from './Quest';
const { ccclass, property } = _decorator;

@ccclass('QuestContent')
export class QuestContent extends Component {

    @property(Sprite)
    sprite:Sprite=null;

    @property(Label)
    descriptLabel:Label=null;

    @property(Label)
    progressLabel:Label=null;

    @property(Node)
    coinNode:Node=null;
    @property(Node)
    diamondNode:Node=null;
    
    @property(Label)
    rewardLabel:Label=null;

    @property(Button)
    button:Button=null;
    @property(Label)
    buttonLabel:Label=null;

    @property(Node)
    refreshNode:Node=null;
    
    quest:Quest=null;

    //identifier=1;

    index=1;
    
    go(){
        this.quest.go(this);
    }

    refresh(){
        this.quest.refresh(this);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


