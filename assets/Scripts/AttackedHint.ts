import { _decorator, Component, Label, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AttackedHint')
export class AttackedHint extends Component {

    @property(Label)
    damage:Label=null;

    player:Node=null;

    timer=0;

    start() {
    }

    update(deltaTime: number) {
        if(this.timer<1){
            this.timer+=deltaTime;
            this.node.setPosition(this.player.getPosition().add(new Vec3(0,this.timer*100,0)));
        }
        else{
            this.node.destroy();
        }
    }
}