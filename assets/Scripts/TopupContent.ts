import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Topup } from './Topup';
const { ccclass, property } = _decorator;

@ccclass('TopupContent')
export class TopupContent extends Component {
    topup:Topup=null;

    @property(Sprite)
    sprite:Sprite=null;
    
    @property(Label)
    typeLabel :Label=null;
    
    @property(Label)
    quantityLabel :Label=null;
    
    @property(Label)
    priceLabel :Label=null;
    
    identifier=1;

    purchase(){
        this.topup.purchase(this);
    }

}


