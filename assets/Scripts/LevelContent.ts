import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Level } from './Level';
const { ccclass, property } = _decorator;

@ccclass('LevelContent')
export class LevelContent extends Component {

    @property(Label)
    levelLabel:Label=null;
    @property(Sprite)
    sprite:Sprite=null;
    @property(Sprite)
    extraSprite:Sprite=null;
    @property(Label)
    quantityLabel:Label=null;
    @property(Label)
    extraQuantityLabel:Label=null;
    @property(Node)
    claimButton:Node=null;
    @property(Node)
    extraClaimButton:Node=null;
    
    @property(Node)
    receivedNode:Node=null;
    @property(Node)
    extraReceivedNode:Node=null;

    levelComponent:Level=null;
    levelIndex:number=1;

    claim(){
        this.levelComponent.claim(this.levelIndex,false);
    }

    extraClaim(){
        this.levelComponent.claim(this.levelIndex,true);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


