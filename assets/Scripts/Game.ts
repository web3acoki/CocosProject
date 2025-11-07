import { _decorator, Component, instantiate, Label, Node, Prefab, ProgressBar, randomRange, UITransform, Vec3 } from 'cc';
import { Fish } from './Fish';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;


class Boundary{
  left:number=0;
  right:number=0;
  up:number=0;
  down:number=0;
}

@ccclass('Game')
export class Game extends Component {

    @property(Node)
    fishesNode: Node = null;
    
    @property([Prefab])
    fishPrefabs: Prefab[] = [];


    //fishes:Node[]=[];

    @property(Node)
    walls: Node = null;

    wallBoundarys:Boundary[]=[];

    @property(Node)
    spawns: Node = null;

    spawnBoundarys:Boundary[]=[];
    
    
    @property(Label)
    userId: Label = null;
    @property(Label)
    userCoins: Label = null;
    @property(Label)
    userDiamonds: Label = null;


    //@property(Node)
    //walls:
    start() {
        
        this.userCoins.string=Manager.userData.data.coins.toString();
        this.userDiamonds.string=Manager.userData.data.diamonds.toString();
        this.userId.string=Manager.userData.data.userId.toString();

        for (let wall of this.walls.children) {
          //this.wallsprites.push(wall);
          const ut=wall.getComponent(UITransform);
          const boundary=new Boundary;
           boundary.left=wall.position.x-ut.contentSize.x/2;
           boundary.right=wall.position.x+ut.contentSize.x/2;
           boundary.up=wall.position.y+ut.contentSize.y/2;
           boundary.down=wall.position.y-ut.contentSize.y/2;
          this.wallBoundarys.push(boundary);
        }
        this.walls.active=false;
        for (let spawn of this.spawns.children) {
          //this.wallsprites.push(wall);
          const ut=spawn.getComponent(UITransform);
          const boundary=new Boundary;
           boundary.left=spawn.position.x-ut.contentSize.x/2;
           boundary.right=spawn.position.x+ut.contentSize.x/2;
           boundary.up=spawn.position.y+ut.contentSize.y/2;
           boundary.down=spawn.position.y-ut.contentSize.y/2;
          this.spawnBoundarys.push(boundary);
        }
        this.spawns.active=false;

        for(let index=0;index<this.fishPrefabs.length;index++){
            let fishData=Manager.fishBaseData.data[index];
            for(let i=0;i<fishData.rarity;i++){
                let fishInstance = instantiate(this.fishPrefabs[index]);
                let boundary=this.spawnBoundarys[Math.round(fishData.spawnRegion)];
                let newPos =new Vec3(randomRange(boundary.left,boundary.right), randomRange(boundary.down,boundary.up), 0);
                
                let j=0;
                while(j<100){
                    j++;
                    let inWall=false;
                    for(const wallBoundary of this.wallBoundarys){
                        if(newPos.x>wallBoundary.left-30&&newPos.x<wallBoundary.right+30&&newPos.y<wallBoundary.up+30&&newPos.y>wallBoundary.down-30){
                            inWall=true;
                        }
                    }
                    if(inWall){
                        newPos =new Vec3(randomRange(boundary.left,boundary.right), randomRange(boundary.down,boundary.up), 0);
                    }
                    else{
                        break;
                    }
                }
                fishInstance.setPosition(newPos);
                
                let precent=randomRange(0.8,1.2);
                fishInstance.setScale(precent*fishData.size, precent*fishData.size, 1);
                fishInstance.angle = randomRange(-180, 180);
                
                let fishComponent=fishInstance.getComponent(Fish);
                fishComponent.health=fishData.health;
                fishComponent.maxHealth=fishData.health;
                fishComponent.speed=fishData.speed;
                fishComponent.index=index;
                fishComponent.precent=precent;
                fishComponent.game=this.node.getComponent(Game);
                fishComponent.spawnBoundary=boundary;
                //this.fishes.push(fishInstance);
                this.fishesNode.addChild(fishInstance);
            }
        }
        
    }

    update(deltaTime: number) {
        
    }
}