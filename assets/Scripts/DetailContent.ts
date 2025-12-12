import { _decorator, Component, Label, Node,Sprite } from 'cc';
import { Box } from './Box';
import { Aquarium } from './Aquarium';
const { ccclass, property } = _decorator;

@ccclass('DetailContent')
export class DetailContent extends Component {

    aquarium:Aquarium=null;

    @property(Sprite)
    sprite:Sprite=null;
    
    @property(Label)
    fishNameLabel :Label=null;
    
    @property(Label)
    weightNumLabel :Label=null;
    
    @property(Label)
    priceNumLabel :Label=null;

    @property(Label)
    rarityLabel :Label=null;

    @property(Node)
    diamondSprite :Node=null;
    
    @property(Node)
    goldSprite :Node=null;
    
    @property(Node)
    selectNode :Node=null;

    identifier="";
    selecting=false;
    diamond=0;
    coin=0;

    reward=0;
    feedCost=0;

    select(){
        this.aquarium.select(this);
    }

}