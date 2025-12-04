import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Game } from './Game';
import { Manager } from './Manager';
import Player from './Player';
const { ccclass, property } = _decorator;

@ccclass('GameContent')
export class GameContent extends Component {

    game:Game=null;
    
    @property(Sprite)
    propSprite:Sprite=null;
    @property(Label)
    propNumLabel:Label=null;

    index=0;

    chooseProp(){
        if(this.index>=0){
            Manager.userData.data.mainPropId=this.index+1;
            this.game.curPropIndex=this.index;
            this.game.curPropContent.getComponent(GameContent).propSprite.spriteFrame=this.game.propSprites[this.index];
            this.game.curPropContent.getComponent(GameContent).propNumLabel.string="x"+Manager.propData.data[this.index].quantity.toString();
            this.game.hideProp();
        }
        else{
            this.game.useProp();
        }
    }

    start() {
    }

    update(deltaTime: number) {
    }
}


