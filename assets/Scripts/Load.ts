import { _decorator, Component, director, Node, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {

    @property(ProgressBar)
    pBar:ProgressBar=null;

    //progress=0.1;
    progressTimer=0;

    start() {
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
        director.loadScene('Game');
        
    }

    update(deltaTime: number) {
        this.progressTimer+=deltaTime;
        if(this.progressTimer>7){
            this.pBar.progress=1;
        }
        else if(this.progressTimer>5.5){
            this.pBar.progress=0.95;
        }
        else if(this.progressTimer>4.2){
            this.pBar.progress=0.9;
        }
        else if(this.progressTimer>3.2){
            this.pBar.progress=0.85;
        }
        else if(this.progressTimer>2.4){
            this.pBar.progress=0.75;
        }
        else if(this.progressTimer>1.8){
            this.pBar.progress=0.55;
        }
        else if(this.progressTimer>1.2){
            this.pBar.progress=0.5;
        }
        else if(this.progressTimer>0.8){
            this.pBar.progress=0.35;
        }
        else if(this.progressTimer>0.5){
            this.pBar.progress=0.2;
        }
        else{
            this.pBar.progress=0.1;
        }
    }
}


