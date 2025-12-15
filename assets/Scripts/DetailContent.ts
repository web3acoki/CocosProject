import { _decorator, Component, Label, Node,ProgressBar,Sprite } from 'cc';
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
    @property(Label)
    rewardLabel :Label=null;
    @property(Label)
    feedCostLabel :Label=null;
    //@property(Label)
    //feedDayLabel :Label=null;
    @property(Label)
    lifeLabel :Label=null;
    @property(Label)
    satietyLabel :Label=null;
    @property(ProgressBar)
    lifeBar :ProgressBar=null;
    @property(ProgressBar)
    satietyBar :ProgressBar=null;

    identifier="";
    selecting=false;
    diamond=0;
    coin=0;

    reward=0;
    feedCost=0;

    totalLife=0;
    remainingLife=0;

    needFeedCount=0;
    feedCount=0;
    claimCount=0;

    totalSatiety=0;
    remainingSatiety=0;


    select(){
        this.aquarium.select(this);
    }
}