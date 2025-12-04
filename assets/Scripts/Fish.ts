import { _decorator, Component, instantiate, misc, Node, Prefab, ProgressBar, Quat, random, randomRange, size, Size, sp, UITransform, Vec3 } from 'cc';
import { Game } from './Game';
import Player from './Player';
import { AttackedHint } from './AttackedHint';
const { ccclass, property } = _decorator;


//class Boundary{
//  left:number=0;
//  right:number=0;
//  up:number=0;
//  down:number=0;
//}


@ccclass('Fish')
export class Fish extends Component {

    //@property(Node)
    //fishNode: Node = null;
    @property(sp.Skeleton)
    bloodSkeleton:sp.Skeleton=null;

    @property(Node)
    stunHint:Node=null;
    
    bloodTimer=1;

    private timer=0;
    private turnTimer=0;
    private struggleSpeed=300;
    private struggleTimer=0;
    private stunShakeSpeed=60;
    private stunShakeTimer=0;

    index;
    rarityIndex=0;
    
    precent=1;
    attack=0;
    health=1;
    maxHealth=1;
    speed=0.15;
    maxSpeed=0.15;
    beingCatched=false;

    utSize:number;
    oldPos=new Vec3;
    
    game :Game=null;

    healthDisplaying=false;
    healthTimer=2;
    healthBar:ProgressBar=null;

    attacking=false;
    attackTimer=0;
    attackHint:Node=null;

    stunTimer=0;
    stunHintScaleTimer=0;
    //stunHint:Node=null;

    waitingTimer=0;

    spawnBoundary=null;

    originScale:Vec3;
    reverseScale:Vec3;

    start() {
        this.turnTimer=randomRange(-1.8,-3.2);
        this.oldPos=this.node.getPosition();
        this.originScale=new Vec3(this.node.scale.x,this.node.scale.y,1);
        this.reverseScale=new Vec3(this.node.scale.x,-this.node.scale.y,1);
        this.reverse();
    }

    catched(deltaTime){
        this.struggleTimer+=deltaTime;
        if(this.struggleTimer>0.15){
            this.struggleTimer-=0.15;
            this.struggleSpeed=-this.struggleSpeed;
        }
        this.node.angle += deltaTime*this.struggleSpeed;
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
        
        if(this.waitingTimer>0)
        {
            this.waitingTimer-=deltaTime;
        }
        else
            {
            this.timer+=deltaTime;
            this.attackTimer+=deltaTime;
            this.turnTimer+=deltaTime;
            this.updateangle();
            this.node.setPosition(this.node.getPosition().add(new Vec3(- Math.cos(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,
            - Math.sin(this.node.angle * (Math.PI / 180)) * deltaTime *this.speed*670,0)));
        }
    }

    stuned(deltaTime){
        this.stunTimer-=deltaTime;
        this.stunHintScaleTimer+=deltaTime * 5;
        const baseScale = this.utSize/500;
        const scale = baseScale * (1 + Math.sin(this.stunHintScaleTimer) * 0.1);
        this.stunHint.setScale(scale, scale, 1);
        
        // 眩晕时的抖动效果（类似 catched，但幅度更小）
        this.stunShakeTimer+=deltaTime;
        if(this.stunShakeTimer>0.15){
            this.stunShakeTimer-=0.15;
            this.stunShakeSpeed=-this.stunShakeSpeed;
        }
        this.node.angle += deltaTime*this.stunShakeSpeed*0.5;
        
        if(this.stunTimer<=0){
            this.stunTimer=0;
            this.stunHintScaleTimer=0;
            this.stunShakeTimer=0;
            this.stunShakeSpeed=60;
            this.stunHint.active=false;
            this.getComponent(sp.Skeleton).timeScale=1/this.precent;
        }
    }

    updateangle(){
        if(this.timer>0){
            this.timer-=0.2;
            let newPos =  this.node.getPosition();
            let left=newPos.x-this.utSize;
            let right=newPos.x+this.utSize;
            let up=newPos.y+this.utSize;
            let down=newPos.y-this.utSize;
            for(const wallBoundary of this.game.wallBoundarys){//检测撞墙
                if(right>wallBoundary.left&&left<wallBoundary.right&&down<wallBoundary.up&&up>wallBoundary.down){

                    let oldLeft=this.oldPos.x-this.utSize;
                    let oldRight=this.oldPos.x+this.utSize;
                    let oldUp=this.oldPos.y+this.utSize;
                    let oldDown=this.oldPos.y-this.utSize;
                    if(oldRight<wallBoundary.left){
                         this.node.angle = randomRange(-45, 45);
                    }
                    else if(oldUp<wallBoundary.down){
                        this.node.angle = randomRange(45, 135);
                    }
                    else if(oldLeft>wallBoundary.right){
                         this.node.angle = randomRange(135, 225);
                    }
                    else  if(oldDown>wallBoundary.up){
                        this.node.angle = randomRange(225, 315);
                    }

                    this.reverse();
                    if(this.attacking){
                        this.attacking=false;
                        this.speed=0.15;
                        if(this.attack>0){
                            this.attackHint.destroy();
                        }
                    }
                    this.attackTimer=-2;
                    this.turnTimer=randomRange(-3.2,-6.4);
                    return;
                }
            }
            this.oldPos=this.node.getPosition();
        }
    //if(this.attack)
        if(this.attackTimer>0){//检测玩家距离
            this.attackTimer-=0.2;
            let playerPos=this.game.playerNode.getPosition();
            
            let newPos =  this.node.getPosition();
            let left=newPos.x-this.utSize;
            let right=newPos.x+this.utSize;
            let up=newPos.y+this.utSize;
            let down=newPos.y-this.utSize;
            if(this.attacking){
                if(right>playerPos.x-10&&left<playerPos.x+10&&down<playerPos.y+10&&up>playerPos.y-10){//击中玩家
                    let playerCompontent=this.game.playerNode.getComponent(Player);
                    if(playerCompontent.firstDie&&playerCompontent.firstWin){
                        let attackedHintInstance=instantiate(this.game.attackedHint);
                        this.game.tempNode.addChild(attackedHintInstance);
                        attackedHintInstance.getComponent(AttackedHint).damage.string="-"+this.attack.toString();
                        attackedHintInstance.getComponent(AttackedHint).player=this.game.playerNode;
                    
                        playerCompontent.bloodSkeleton.node.active=true;
                        // 确保每次命中都重新播放动画
                        // 先清除当前动画轨道，然后重新播放
                        playerCompontent.bloodSkeleton.clearTracks(); // 清除所有动画轨道
                        playerCompontent.bloodSkeleton.setAnimation(0, "dongqilai", false); // 重新播放动画
                        playerCompontent.bloodTimer=1;

                        if(playerCompontent.oxygen>this.attack){
                            playerCompontent.oxygen-=this.attack;
                        }
                        else{
                            playerCompontent.oxygen=0;
                            playerCompontent.oxygenNotIncluded();
                        }
                        let ioxygen=Math.round(playerCompontent.oxygen);
                        playerCompontent.oxygenNumLabel.string=ioxygen.toString();
                        this.game.redOxygen.active=true;
                        this.game.redOxygenTimer=0;
                        this.waitingTimer=2;
                    }
                }
                else{
                    const dx =  playerPos.x-this.node.x;
                    const dy =  playerPos.y-this.node.y;
                    let rad=Math.atan2(-dy, -dx);
                    this.node.angle=misc.radiansToDegrees(rad)+randomRange(-10, 10);
                    this.reverse();
                }
                return;
            }
            else{
                let playerLeft=playerPos.x-250;
                let playerRight=playerPos.x+250;
                let playerUp=playerPos.y+250;
                let playerDown=playerPos.y-250;
                if(right>playerLeft&&left<playerRight&&down<playerUp&&up>playerDown){//靠近玩家
                    const dx =  playerPos.x-this.node.x;
                    const dy =  playerPos.y-this.node.y;
                    let rad=Math.atan2(dy, dx);
                    if(this.attack>0){//触发抓捕状态
                        rad=Math.atan2(-dy, -dx);
                        this.attacking=true;
                        this.waitingTimer=1;
                        this.speed=this.maxSpeed;
                        let attackHintInstance=instantiate(this.game.attackHint);
                        this.game.tempNode.addChild(attackHintInstance);
                        this.attackHint=attackHintInstance;
                    }
                    else{
                        if(this.maxSpeed==0.32){
                            this.attackTimer=-1;
                            this.turnTimer=randomRange(-3.2,-6.4);
                        }
                        else{
                            this.attackTimer=-10;
                            this.turnTimer=randomRange(-3.2,-6.4);
                        }
                    }
                    this.node.angle=misc.radiansToDegrees(rad)+randomRange(-10, 10);
                    this.reverse();
                    return;
                }
                if(this.turnTimer>0){//自由移动，倾向返回出生点
                    this.turnTimer=randomRange(-3.2,-6.4);
                    if(left>this.spawnBoundary.right){
                        this.node.angle = randomRange(-90, 90);
                    }
                    else if(down>this.spawnBoundary.up){
                    
                        this.node.angle = randomRange(0, 180);
                    }
                    else if(right<this.spawnBoundary.left){
                        this.node.angle = randomRange(90, 270);
                    }
                    else if(up<this.spawnBoundary.down){
                        this.node.angle = randomRange(180, 360);
                    }
                    else {
                       this.node.angle = randomRange(0, 360);
                    }
                    this.reverse();
                }
            }
        }
    }

    update(deltaTime: number) {
        if(this.beingCatched){
            this.catched(deltaTime);
        }
        else{
            this.move(deltaTime);
        }

        if(this.stunTimer>0){
            this.stuned(deltaTime);
        }

        if(this.healthDisplaying){
            this.healthBar.node.setPosition(this.node.getPosition().add(new Vec3(0,this.utSize-10,0)));
            this.healthTimer-=deltaTime;
            if(this.healthTimer<0){
                this.healthDisplaying=false;
                this.healthBar.node.destroy();
            }
        }
        
        if(this.bloodSkeleton.node.active){
            if(this.bloodTimer>0){
            this.bloodTimer-=deltaTime;
            }
            else{
              this.bloodTimer=1;
              this.bloodSkeleton.node.active=false;
            }
          }

        if(this.attacking){
            if(this.attack>0){
                this.attackHint.setPosition(this.node.getPosition().add(new Vec3(0,this.utSize+10,0)));
            }
        }

        //this.node.angle += deltaTime * randomRange(-30, 30);
    }
}