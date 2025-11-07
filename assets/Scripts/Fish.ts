import { _decorator, Component, instantiate, misc, Node, Prefab, ProgressBar, Quat, random, randomRange, Vec3 } from 'cc';
import { Game } from './Game';
const { ccclass, property } = _decorator;

@ccclass('Fish')
export class Fish extends Component {

    //@property(Node)
    //fishNode: Node = null;
    private timer=0;
    private turnTimer=0;
    private turnTime=0;
    private struggleSpeed=300;
    private struggleTimer=0;

    index;
    precent=1;
    health=1;
    maxHealth=1;
    speed=135;
    beingCatched=false;
    

    oldPos=new Vec3;

    game :Game=null;

    healthDisplaying=false;
    healthTimer=2;
    healthBar:ProgressBar=null;

    spawnBoundary=null;
    

    start() {
        this.turnTime=randomRange(3,6);
        this.oldPos=this.node.getPosition();
    }

    Catched(deltaTime){
        this.struggleTimer+=deltaTime;
        if(this.struggleTimer>0.15){
            this.struggleTimer-=0.15;
            this.struggleSpeed=-this.struggleSpeed;
        }
        this.node.angle += deltaTime*this.struggleSpeed;
    }

    move(deltaTime){
        this.timer+=deltaTime;
        this.turnTimer+=deltaTime;
        if(this.timer>0.2){
            this.timer-=0.2;
            if(this.turnTimer>this.turnTime){
                this.turnTimer-=this.turnTime;
                this.turnTime=randomRange(3,6);
                if(this.node.position.x>this.spawnBoundary.right){
                    this.node.angle = randomRange(-90, 90);
                    //console.log(this.node.position.x+"," + this.node.angle);
                }

                else if(this.node.position.y>this.spawnBoundary.up){
                   
                    this.node.angle = randomRange(0, 180);
                    //console.log(this.node.position.y+"," + this.node.angle);
                }
            
                else if(this.node.position.x<this.spawnBoundary.left){
                    this.node.angle = randomRange(90, 270);
                    //console.log(this.node.position.x+"," + this.node.angle);
                }
                else  if(this.node.position.y<this.spawnBoundary.down){
                    this.node.angle = randomRange(180, 360);
                    //console.log(this.node.position.y+"," + this.node.angle);
                }
                else {
                   this.node.angle = randomRange(0, 360);
                }
            }
            let newPos =  this.node.getPosition();
            for(const wallBoundary of this.game.wallBoundarys){
                if(newPos.x>wallBoundary.left-30&&newPos.x<wallBoundary.right+30&&newPos.y<wallBoundary.up+30&&newPos.y>wallBoundary.down-30){
                    if(this.oldPos.x<wallBoundary.left-30){
                         this.node.angle = randomRange(-45, 45);
                        //console.log(this.node.position.x+"," + this.node.angle);
                    }
                    else if(this.oldPos.y<wallBoundary.down-30){
                         this.node.angle = randomRange(45, 135);
                        //console.log(this.node.position.y+"," + this.node.angle);
                    }
                    else if(this.oldPos.x>wallBoundary.right+30){
                        this.node.angle = randomRange(135, 225);
                        //console.log(this.node.position.x+"," + this.node.angle);
                    }
                    else  if(this.oldPos.y>wallBoundary.up+30){
                        this.node.angle = randomRange(225, 315);
                        //console.log(this.node.position.y+"," + this.node.angle);
                    }
                }
            }
            this.oldPos=this.node.getPosition();
        }
        
        this.node.setPosition(this.node.getPosition().add(new Vec3(- Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,
        - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,0)));
    }

    update(deltaTime: number) {
        if(this.beingCatched){
            this.Catched(deltaTime);
        }
        else{
            this.move(deltaTime);
        }
        if(this.healthDisplaying){
            this.healthBar.node.setPosition(this.node.getPosition().add(new Vec3(0,1000*this.node.scale.x,0)));
            this.healthTimer-=deltaTime;
            if(this.healthTimer<0){
                this.healthDisplaying=false;
                this.healthBar.node.destroy();
            }
        }
        
        //this.node.angle += deltaTime * randomRange(-30, 30);
        
    }
    
      //      //this.node.angle =
      //      //  misc.radiansToDegrees(Math.atan2(this.moveDir.y, this.moveDir.x)) - 90;
      //  const oldPos = this.node.getPosition();
     //
      //  const newPos =  this.node.getPosition().add(new Vec3(- Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime * 135,
      //      - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime * 135,0))
      //  // fps: 60
      //  //this.moveDir.clone().multiplyScalar(135 / 60)
      ////Vec3(this.node.position.x - Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime * 135,
      ////      this.node.position.y - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime * 135,
      ////      this.node.position.z);
      ////console.log(this._moveSpeed / 60);
      //
      //console.log(newPos+","+oldPos);
      //let movex=true;
      //let movey=true;
      //for(const wallBoundary of this.game.wallBoundarys){
      //  
      //  if(newPos.x>wallBoundary.left&&newPos.x<wallBoundary.right&&newPos.y<wallBoundary.up&&newPos.y>wallBoundary.down){
      //    if(oldPos.x<wallBoundary.left||oldPos.x>wallBoundary.right){
      //      movex=false;
      //    }
      //    if(oldPos.y<wallBoundary.down||oldPos.y>wallBoundary.up){
      //      movey=false;
      //    }
      //  }
      //}
      //if(movex){
      //    this.node.setPosition(newPos.x,this.node.y, 0);
      //}
      //if(movey){
      //    this.node.setPosition(this.node.x,newPos.y, 0);
      //}



        //this.node.setPosition(this.node.position.x - Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime * 135,
        //    this.node.position.y - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime * 135,
        //    this.node.position.z);
}


