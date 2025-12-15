import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Aquarium } from './Aquarium';
const { ccclass, property } = _decorator;

@ccclass('DecorationContent')
export class DecorationContent extends Component {

    aquarium:Aquarium=null;

    @property(Sprite)
    sprite:Sprite=null;
    
    @property(Label)
    nameLabel:Label=null;

    @property(Label)
    bonusLabel:Label=null;

    @property(Label)
    priceLabel:Label=null;

    @property(Label)
    buttonLabel:Label=null;

    @property(Node)
    buttonNode:Node=null;

    @property(Node)
    receivedNode:Node=null;

    decorationIndex:number=0;
    price:number=0;

    purchase(){
        this.aquarium.purchaseDecoration(this);
    }

}


