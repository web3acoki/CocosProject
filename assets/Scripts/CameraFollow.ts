import { _decorator, Component, Node, Vec3, view } from 'cc';
//import { Joystick } from '.Joystick';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property(Node)
    player: Node = null;

    @property(Node)
    background: Node = null;

    //@property(Node)
    //frontground: Node = null;
    //
    //@property(Node)
    //joystick: Node = null;

    @property(Node)
    map: Node = null;

    //@property(Node)
    //fishes: Node = null;

    //private JoystickOrigin: Vec3 = new Vec3();

    start() {
        //this.JoystickOrigin = this.joystick.getPosition();
    }

    update(deltaTime: number) {
        //this.node.setPosition(this.player.position.x, this.player.position.y, 1000);
        //this.background.setPosition(this.player.position);
        this.background.setPosition(-this.player.position.x*0.2,-this.player.position.y*0.2,0);
        if(this.player.position.x>-(6683/2-view.getVisibleSize().width/2)&&this.player.position.x<6683/2-view.getVisibleSize().width/2){
            this.map.setPosition(-this.player.position.x,this.map.position.y, 0);
        }
        if(this.player.position.y>-(14826/2-view.getVisibleSize().height/2)&&this.player.position.y<14826/2-view.getVisibleSize().height/2){
            this.map.setPosition(this.map.position.x, -this.player.position.y, 0);
        }
    }
}