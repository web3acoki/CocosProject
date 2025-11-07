import { _decorator, Component, Label, Node } from 'cc';
import { Menu } from './Menu';
const { ccclass, property } = _decorator;

@ccclass('CheckInContent')
export class CheckInContent extends Component {

    @property(Node)
    received:Node=null;
    
    @property(Node)
    frame:Node=null;

    @property(Label)
    dayLabel:Label=null;

    @property(Label)
    rewardLabel:Label=null;

    @property(Menu)
    menu:Menu=null;

    @property(Number)
    day:Number=1;

    start() {
        this.dayLabel.string="Day"+this.day.toString();
    }

    update(deltaTime: number) {
        
    }

    checkIn(){
        this.menu.checkIn(this.day);
    }
}


