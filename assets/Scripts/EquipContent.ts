import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EquipContent')
export class EquipContent extends Component {

    @property(Node)
    upgrade:Node=null;
    @property(Node)
    maxLevel:Node=null;
    @property(Label)
    costLabel:Label=null;
    @property(Label)
    curLabel:Label=null;
    @property(Label)
    nextLabel:Label=null;


    start() {

    }

    update(deltaTime: number) {
        
    }
}


