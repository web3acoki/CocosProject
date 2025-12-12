import { _decorator, Component, misc, randomRange, sp, UITransform, Vec3 } from 'cc';
import { Aquarium } from './Aquarium';
const { ccclass, property } = _decorator;

// 边界类
class Boundary{
    left:number=0;
    right:number=0;
    up:number=0;
    down:number=0;
}

@ccclass('AquariumFish')
export class AquariumFish extends Component {

    private timer=0;
    private turnTimer=0;

    speed=0.15;
    maxSpeed=0.15;

    utSize:number;
    oldPos=new Vec3;
    
    aquarium:Aquarium=null;

    aquariumBoundary:Boundary=null;  // 水族馆的边界范围

    originScale:Vec3;
    reverseScale:Vec3;

    start() {
        this.turnTimer=randomRange(-1.8,-3.2);
        this.oldPos=this.node.getPosition();
        this.originScale=new Vec3(this.node.scale.x,this.node.scale.y,1);
        this.reverseScale=new Vec3(this.node.scale.x,-this.node.scale.y,1);
        this.reverse();
    }

    reverse(){
        if((this.node.angle>90&&this.node.angle<270)||this.node.angle<-90){
            this.node.scale=this.reverseScale;
        }
        else{
            this.node.scale=this.originScale;
        }
    }

    move(deltaTime){
        this.timer+=deltaTime;
        this.turnTimer+=deltaTime;
        this.updateangle();
        this.node.setPosition(this.node.getPosition().add(new Vec3(- Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,
        - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,0)));
    }

    updateangle(){
        if(this.timer>0){
            this.timer-=0.2;
            let newPos =  this.node.getPosition();
            let left=newPos.x-this.utSize;
            let right=newPos.x+this.utSize;
            let up=newPos.y+this.utSize;
            let down=newPos.y-this.utSize;
            
            // 检测是否超出水族馆范围（检查鱼的边界）
            if(this.aquariumBoundary){
                let needTurn = false;
                let newAngle = 0;
                
                // 检查是否超出左边界
                if(left < this.aquariumBoundary.left){
                    needTurn = true;
                    newAngle = randomRange(-45, 45);  // 向右转
                }
                // 检查是否超出右边界
                else if(right > this.aquariumBoundary.right){
                    needTurn = true;
                    newAngle = randomRange(135, 225);  // 向左转
                }
                // 检查是否超出上边界
                else if(up > this.aquariumBoundary.up){
                    needTurn = true;
                    newAngle = randomRange(225, 315);  // 向下转
                }
                // 检查是否超出下边界
                else if(down < this.aquariumBoundary.down){
                    needTurn = true;
                    newAngle = randomRange(45, 135);  // 向上转
                }
                
                if(needTurn){
                    this.node.angle = newAngle;
                    this.reverse();
                    this.turnTimer=randomRange(-3.2,-6.4);
                    this.oldPos=this.node.getPosition();
                    return;
                }
            }
            this.oldPos=this.node.getPosition();
        }
        
        // 自由移动，随机改变角度
        if(this.turnTimer>0){
            this.turnTimer=randomRange(-3.2,-6.4);
            this.node.angle = randomRange(0, 360);
            this.reverse();
        }
    }

    update(deltaTime: number) {
        this.move(deltaTime);
    }
}