import { _decorator, AudioSource, Component, director, instantiate, Label, Node, Prefab, SpriteFrame } from 'cc';
import { Manager } from './Manager';
import { BoxContent } from './BoxContent';
const { ccclass, property } = _decorator;

@ccclass('Box')
export class Box extends Component {
    
    @property(Node)
    contentNode: Node = null;

    //@property([Prefab])
    //boxContentPrefabs: Prefab;

    @property([Prefab])
    boxContentPrefab: Prefab=null;

    @property(Node)
    selectAllNode:Node=null;

    @property(Label)
    coinNumLabel:Label=null;

    @property(Label)
    diamondNumLabel:Label=null;

    @property(SpriteFrame)
    spriteFrames:SpriteFrame[]=[];

    @property(AudioSource)//音效
    buttonAudio:AudioSource=null;

    
    @property(Label)
    userCoins: Label = null;
    @property(Label)
    userDiamonds: Label = null;

    boxContents: BoxContent[]=[];

    totalCoins=0;
    totalDiamonds=0;

    start() {
        //Manager.getInstance().post(url,
        //   Manager.startData,
        //   (data) => {
        //     console.log('鱼箱数据:', data);
        //     console.log(Manager.startData);
        //     },
        //     (error) => {
        //         console.log(`'鱼箱数据POST失败: ${error}`);
        //     }
        //   )
        this.initBox();
        //let userID=1;
        //let url="https://api.xdiving.io/api/fish-catch/user/"+userID.toString()+"/box";

        //Manager.getInstance().get(url,
        //  (data) => {
        //    console.log('鱼箱数据:', data);
        //    Manager.boxData = data;
        //    console.log(Manager.boxData);
        //    this.initBox();
        //    },
        //    (error) => {
        //    console.log(`鱼箱GET失败: ${error}`);
        //  }
        //)
    }
    
    updateDataDisplay(){
        this.userCoins.string=Manager.userData.data.coins.toString();
        this.userDiamonds.string=Manager.userData.data.diamonds.toString();
    }

    initBox(){
        this.updateDataDisplay();
        for(let index=0;index<Manager.boxData.data.length;index++){
            let contentInstance = instantiate(this.boxContentPrefab);
            
            let contentData=Manager.boxData.data[index];
            
            let contentComponent = contentInstance.getComponent(BoxContent);

            for(let i=0;i<Manager.fishBaseData.data.length;i++){
                if(contentData.fishNameEn==Manager.fishBaseData.data[i].fishNameEn){
                    contentComponent.sprite.spriteFrame=this.spriteFrames[i];
                }
            }

            contentComponent.box=this;
            contentComponent.identifier=contentData.identifiers;
            contentComponent.fishNameLabel.string=contentData.fishNameEn.toString();
            contentComponent.weightNumLabel.string=contentData.weight.toFixed(2);
            contentComponent.priceNumLabel.string=contentData.price.toString();
            

            if(contentData.type=="diamonds"){
                contentComponent.diamondSprite.active=true;
                contentComponent.goldSprite.active=false;
                contentComponent.diamond=contentData.price;
            }
            else{
                contentComponent.diamondSprite.active=false;
                contentComponent.goldSprite.active=true;
                contentComponent.coin=contentData.price;
            }
            this.boxContents.push(contentComponent);
            
            this.contentNode.addChild(contentInstance);
            
        }
    }

    select(boxContent){
        this.buttonAudio.play();
        if(boxContent.selecting==true){
            boxContent.selecting=false;
            boxContent.selectNode.active=false;
            this.updateSellNum(-boxContent.coin,-boxContent.diamond);

            this.selectAllNode.active=false;
        }
        else{
            boxContent.selecting=true;
            boxContent.selectNode.active=true;
            this.updateSellNum(boxContent.coin,boxContent.diamond);
        }
    }

    selectAll(){
        this.buttonAudio.play();
        if(this.selectAllNode.active==true){
            this.selectAllNode.active=false;
            for(const boxContent of this.boxContents){
                boxContent.selecting=false;
                boxContent.selectNode.active=false;
                this.updateSellNum(-boxContent.coin,-boxContent.diamond);
            }
        }
        else{
            this.selectAllNode.active=true;
            for(const boxContent of this.boxContents){
                boxContent.selecting=true;
                boxContent.selectNode.active=true;
                this.updateSellNum(boxContent.coin,boxContent.diamond);
            }
        }
    }

    updateSellNum(coin:number,diamond:number){
        this.totalCoins+=coin;
        this.coinNumLabel.string="+"+this.totalCoins.toString();
        
        this.totalDiamonds+=diamond;
        this.diamondNumLabel.string="+"+this.totalDiamonds.toString();
    }

    sell(){
        this.buttonAudio.play();
        this.coinNumLabel.string="+0";
        this.diamondNumLabel.string="+0";
        this.selectAllNode.active=false;
        Manager.userData.data.coins+=this.totalCoins;
        Manager.userData.data.diamonds+=this.totalDiamonds;
        this.updateDataDisplay();

        Manager.sellFishData={userId:Manager.userData.data.userId,identifiers:[]}
        for (let i = this.boxContents.length - 1; i >= 0; i--) {
            const boxContent = this.boxContents[i];
            if (boxContent.selecting == true) {
                let identifier=boxContent.getComponent(BoxContent).identifier;
                Manager.sellFishData.identifiers.push(identifier);
                boxContent.node.destroy();
                Manager.boxData.data.splice(i,1);
                this.boxContents.splice(i, 1); 
            }
        }

        console.log(Manager.sellFishData);
        Manager.getInstance().post('https://api.xdiving.io/api/fish-catch/unified-sell',
        Manager.sellFishData,
        (data) => {
          console.log('卖鱼数据:', data);
          console.log(Manager.sellFishData);
          },
          (error) => {
              console.log(`卖鱼数据POST失败: ${error}`);
          }
        )
    }

    back(){
        this.buttonAudio.play();
        director.loadScene("Menu");
    }

    update(deltaTime: number) {

    }
}