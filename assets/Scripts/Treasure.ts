import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Treasure')
export class Treasure extends Component {

    
    @property(Node)
    close:Node=null;

    @property(Node)
    opening:Node=null;
    
    @property(Node)
    opened:Node=null;

    openTimer=0.45;

    open(){
        this.close.active=false;
        this.opening.active=true;
    }
    start() {

    }

    update(deltaTime: number) {
        if(this.opening.active){
            if(this.openTimer>0){
                this.openTimer-=deltaTime;
            }
            else{
                this.opening.active=false;
                this.opened.active=true;
            }
        }
    }
}


