import { _decorator, Component, director, EditBox, Node, ProgressBar } from 'cc';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;

@ccclass('Entry')
export class Entry extends Component {

    @property(ProgressBar)
    pBar:ProgressBar=null;

    @property(EditBox)
    userIdInput:EditBox=null;
    
    progressTimer=0;

    firstload=false;
    resourceProgress=0;
    tonConnectTimeout=10; // TON Connect 初始化超时时间（秒）
    tonConnectStartTime=0; // TON Connect 初始化开始时间
    
    start() {
        // 记录 TON Connect 初始化开始时间
        //this.tonConnectStartTime = Date.now();
        
        director.preloadScene('Menu', 
            (completedCount: number, totalCount: number) => {
                // 这是真实的资源加载进度
                this.resourceProgress = completedCount / totalCount;
                // 更新进度条
            },
            (error: Error) => {
                if (error) {
                    console.error('预加载失败:', error);
                }
            }
        );
    }

    update(deltaTime: number) {
        //this.progressTimer+=deltaTime;
        //if(this.progressTimer>10){
        //    this.pBar.progress=0.98;
        //}
        //else if(this.progressTimer>7.5){
        //    this.pBar.progress=0.95;
        //}
        //else if(this.progressTimer>6){
        //    this.pBar.progress=0.9;
        //}
        //else if(this.progressTimer>4.5){
        //    this.pBar.progress=0.85;
        //}
        //else if(this.progressTimer>3.5){
        //    this.pBar.progress=0.75;
        //}
        //else if(this.progressTimer>2.5){
        //    this.pBar.progress=0.55;
        //}
        //else if(this.progressTimer>1.75){
        //    this.pBar.progress=0.5;
        //}
        //else if(this.progressTimer>1){
        //    this.pBar.progress=0.35;
        //}
        //else if(this.progressTimer>0.5){
        //    this.pBar.progress=0.2;
        //}
        //else{
        //    this.pBar.progress=0.1;
        //}
        
        this.pBar.progress = this.resourceProgress;
        if(this.firstload==false){
            // 检查是否超时（TON Connect 初始化超过指定时间）
            //const elapsedTime = (Date.now() - this.tonConnectStartTime) / 1000; // 转换为秒
            //const isTimeout = elapsedTime >= this.tonConnectTimeout;
            
            if(Manager.getInstance().getFinish())
            {
                this.firstload=true;
                director.loadScene('Menu');
            }
        }
    }

    displayEditBox(){
        this.userIdInput.node.active=!this.userIdInput.node.active;
    }

    initUser(){
        let userId=parseInt(this.userIdInput.string);
        this.userIdInput.node.active=false;
        this.firstload=false;
        Manager.loadFinish=0;
        if(userId==0){
            Manager.getInstance().initTGUser();
        }
        else{
            Manager.getInstance().initFakeUser(userId);
        }
    }
}


