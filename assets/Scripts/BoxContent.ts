import { _decorator, Component, Label, Node,Sprite } from 'cc';
import { Box } from './Box';
const { ccclass, property } = _decorator;

@ccclass('BoxContent')
export class BoxContent extends Component {

    box:Box=null;

    @property(Sprite)
    sprite:Sprite=null;
    
    @property(Label)
    fishNameLabel :Label=null;
    
    @property(Label)
    weightNumLabel :Label=null;
    
    @property(Label)
    priceNumLabel :Label=null;
    
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

    select(){
        this.box.select(this);
    }

}