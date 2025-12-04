import {_decorator, Asset, Component, director, Node, resources, sp, Sprite, SpriteFrame, WebView } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('GifPlayer')
export class GifPlayer extends Component {

    @property([SpriteFrame])
    spriteFrames: SpriteFrame[] = [];
    sprite: Sprite = null;

    @property([Number])
    speed:number=0.05;
    
    public index = 0;
    protected start(): void {

        //let spriteFolder: string = "主页内容/序列帧/" + this.node.name;
        //resources.loadDir(spriteFolder, SpriteFrame, (err, sprites) => {
        //    if (err) {
        //        console.error('Failed to load asset:', err);
        //        return;
        //    }
        //    this.spriteFrames = sprites.filter(asset => asset instanceof SpriteFrame) as SpriteFrame[];
        //});

        this.sprite = this.getComponent(Sprite);
        this.schedule(() => {
            if (this.spriteFrames.length > 0) {
                this.sprite.spriteFrame = this.spriteFrames[this.index];
                this.index = (this.index + 1) % this.spriteFrames.length;
            }
        }, this.speed);
    }
}
