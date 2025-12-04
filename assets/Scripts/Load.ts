import { _decorator, Component, director, Node, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {

    @property(ProgressBar)
    pBar:ProgressBar=null;

    //progress=0.1;
    progressTimer=0;

    firstload=true;
    resourceProgress=0;
    start() {
        
        director.preloadScene('Game', 
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
        //director.loadScene('Game');
        //director.preloadScene('Game', 
        //(completedCount: number, totalCount: number) => {
        //    // 预加载进度回调
        //    this.progress = completedCount / totalCount;
        //    //console.log(`预加载进度: ${(this.progress * 100).toFixed(2)}%`);
        //},
        //(error: Error) => {
        //    if (error) {
        //        console.error('预加载失败:', error);
        //        return;
        //    }
        //    // 预加载完成后，快速切换场景
        //}
        //);
        
    }

    update(deltaTime: number) {
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
        if(this.pBar.progress<this.resourceProgress){
            this.pBar.progress = this.resourceProgress;
        }
        if(this.progressTimer>0.1){
            if(this.firstload){
                this.firstload=false;
                director.loadScene('Game');
            }
        }
        else{
            this.progressTimer+=deltaTime;
        }
    }
}


