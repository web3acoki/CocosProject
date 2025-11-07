import { _decorator, Component, director, SpriteFrame } from 'cc';
import { Equip } from './Equip';
import { init, initData, retrieveLaunchParams  } from '@telegram-apps/sdk';

import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
//import { WebApp } from '@twa-dev/sdk';
//import { WebApp }  from '@twa-dev/sdk';

//import { Box } from './Box';
//import { Box } from './Box';
const { ccclass } = _decorator;


interface FishDataResponse {//鱼基础数据
    data: FishBaseData[];
}
interface FishBaseData {
    fishNameEn: string;
    size: number;
    rarity:number;
    health:number;
    weight:number;
    speed:number;
    baseCoins:number;
    baseDiamonds:number;
    spawnRegion:number;
}

interface EquipmentDataResponse{//装备基础数据
    data: EquipmentBaseData[];
}
interface EquipmentBaseData{
    equipmentNameEn:string,
    baseAttribute: number,
    maxLevel: number,
    upgradeCostGold: number
}

interface PropDataResponse{//道具基础数据
    data: PropBaseData[];
}
interface PropBaseData{
    propNameEn: string,
    costGold: number
}

interface treasureDataResponse{//宝箱基础数据
    data: treasureBaseData[];
}
interface treasureBaseData{
    treasureId:number;
    propRarity: number,
    coins: number
}

interface setRequest{//设置
    userId:number;
    BGMopen:boolean;
    BGSopen:boolean;
}

interface sellFishRequest{//卖鱼
    userId:number;
    identifiers: string[];
}

interface upgradeRequest{//升级装备

    equipmentId: number;
}

interface buyPropRequest{//购买道具
    userId: number;
    propId: number;
}

interface StartRequest{//游戏开始
    //remainingRounds:number;
}

interface EndRequest{//游戏结束
    userId:number;
    catches:FishData[];
    usedProps:PropData[];
    treasures:TreasureData[];
    maxDepth:number;
    endReason:string;
}
interface FishData{
    identifiers:string;
    fishNameEn:string;
    weight:number;
    price:number;
    type:string;
}
interface PropData{
    propId:number;
    quantity:number;
}
interface TreasureData{
    treasureId:number;
    reward:number;
    propId:number;
    propQuantity:number;
}

interface EquipmentResponse{//用户装备数据
    data:Equipment[];
}
interface Equipment{
    equipmentNameEn:string;
    level:number;
}

interface PropResponse{//用户道具数据
    data:Prop[];
}
interface Prop{
    propId:number;
    quantity:number;
}

interface BoxResponse{//用户鱼箱数据
    data:FishData[];
}

//interface Fish{
//    identifiers:string;
//    fishNameEn:string;
//    weight:number;
//    price:number;
//    type:string;
//}

interface UserResponse{//用户其他数据
    data:User;
}
interface User{
    userId:number;
    remainingRounds:number
    coins:number;
    diamonds:number;
    BGMopen:boolean;
    BGSopen:boolean;
}

interface Harpoon{//前端数据
    attribute:number;
    cost:number;
}
interface Tank{
    attribute:number;
    cost:number;
}
interface Box{
    attribute:number;
    cost:number;
}

//interface InitRequest{
//    initData:string;
//}
interface InitRequest{
    initData:string;
}
interface InitRespond{
    data:InitData;
}
interface InitData{
    initUser:InitUser;
}
interface InitUser{
    userId:number;
}

//interface inviteRespond{
//    data:inviteData;
//}
//interface inviteData{
//    invitationCode:string;
//}
interface InviteUserRespond{
    data:InviteUserData[];
}
interface InviteUserData{
    inviteeUserId:number;
}
interface InviteCodeRequest{
    invitationCode:string;
    inviteeUserId:number;
}

interface CheckinResond{
    data:CheckinData;
}

interface CheckinData{
    currentCheckDays:number;
    rewards:Reward[]
}
interface Reward{
    checkDay:number;
    coinReward:number;
    propQuantity:number;
    received:boolean;
}

@ccclass('Manager')
export class Manager extends Component {

    private static instance:Manager = null;
    
    public static getInstance(): Manager {
        return Manager.instance;
    }
    
    public static fishBaseData:FishDataResponse;
    public static equipmentBaseData:EquipmentDataResponse;
    public static propBaseData:PropDataResponse;
    public static treasureBaseData:treasureDataResponse;

    //public static startData:StartRequest={remainingRounds:4};

    public static startData:StartRequest={};
    public static endData:EndRequest;
    public static sellFishData:sellFishRequest;
    public static upgradeData:upgradeRequest={equipmentId:1};
    public static buyPropData:buyPropRequest={userId:1,propId:1};

    //public static curCatchData:CatchData={fishNameEn:"",weight:0,price:0,type:""};
    //public static curPropData:PropData={propID:1,quantity:0};
    //public static curTreasureData:TreasureData={treasureID:1,reward:0,propID:0,propQuantity:0};
    public static boxData:BoxResponse;
    public static equipmentData:EquipmentResponse;
    public static propData:PropResponse;
    public static userData:UserResponse;

    public static harpoons:Harpoon[]=[];
    public static tanks:Tank[]=[];
    public static boxs:Box[]=[];

    public static loaded=false;

    public static initRequest:InitRequest;
    public static initRespond:InitRespond;
    public static loadFinish=0;

    public static inviteCode="ABC123";
    public static inviteUsers:InviteUserRespond;
    public static inviteCodeUse:InviteCodeRequest;

    //public static
    
    //this.catchSprite.spriteFrame=instantiate(this.game.fishPrefabs[index]).getComponent(Sprite).spriteFrame;

    
    onLoad() {
        if (Manager.instance) {
            this.destroy();
            return;
        } else {
            Manager.instance = this;
            director.addPersistRootNode(this.node);
        }
        
        this.loadTGUser();
        //const { initDataRaw, initDataParams } = retrieveLaunchParams();

        //this.test1.string=JSON.stringify(initData);
    
        
        //Manager.initRequest= {initData:"query_id=test123&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1662771648&hash=test"};
        //
        //this.post('https://api.xdiving.io/api/game/init',
        //Manager.initRequest,
        //(data) => {
        //  console.log('初始化数据:', data);
        //  Manager.initRespond=data;
        //  console.log(Manager.initRequest);
        //  this.loadAllUserData(data.data.user.userId);
        //  
        //  console.log(data.data.user.userId);
        //  },
        //  (error) => {
        //      console.log(`'初始化数据POST失败: ${error}`);
        //  }
        //)

        this.get('https://api.xdiving.io/api/fish/list',
            (data) => {
                console.log('鱼基础数据:', data);
                Manager.fishBaseData = data;
                console.log(Manager.fishBaseData);
                },
                (error) => {
                    console.log(`鱼基础数据GET失败: ${error}`);
            }
        )
        
        this.get('https://api.xdiving.io/api/equipment/list',
            (data) => {
                console.log('装备基础数据:', data);
                Manager.equipmentBaseData = data;
                this.initEquipment();
                console.log(Manager.equipmentBaseData);
                },
                (error) => {
                    console.log(`'装备基础数据GET失败: ${error}`);
            }
        )

        this.get('https://api.xdiving.io/api/prop/list',
            (data) => {
                console.log('道具基础数据:', data);
                Manager.propBaseData = data;
                
                console.log(Manager.propBaseData);
                },
                (error) => {
                    console.log(`'道具基础数据GET失败: ${error}`);
            }
        )

        this.get('https://api.xdiving.io/api/treasure/list',
            (data) => {
                console.log('宝箱基础数据:', data);
                Manager.treasureBaseData = data;
                
                console.log(Manager.treasureBaseData);
                },
                (error) => {
                    console.log(`'宝箱基础数据GET失败: ${error}`);
            }
        )
    }

    loadTGUser(){
        
        TelegramWebApp.Instance.init().then(res => {
            console.log("telegram web app init : ", res.success);
        });
        const userInitData = TelegramWebApp.Instance.getTelegramInitData();
        Manager.initRequest= {initData:userInitData};
    
        this.post('https://api.xdiving.io/api/game/init',
        Manager.initRequest,
        (data) => {
          console.log('初始化数据:', data);
          Manager.initRespond=data;
          console.log(Manager.initRequest);
          this.loadAllUserData(data.data.user.userId);
          
          console.log(data.data.user.userId);
          },
          (error) => {
              console.log(`'初始化数据POST失败: ${error}`);
          }
        )
    }

    loadFakeUser(userId){
        Manager.initRequest= {initData:
        "query_id=test123&user=%7B%22id%22%3A"+userId+"%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1662771648&hash=test"
        }
        console.log( Manager.initRequest);
        this.post('https://api.xdiving.io/api/game/init',
        Manager.initRequest,
        (data) => {
          console.log('初始化数据:', data);
          Manager.initRespond=data;
          console.log(Manager.initRequest);
          this.loadAllUserData(data.data.user.userId);
          
          console.log(data.data.user.userId);
          },
          (error) => {
              console.log(`'初始化数据POST失败: ${error}`);
          }
        )
    }


    loadAllUserData(userId){

        let url="https://api.xdiving.io/api/user/"+userId.toString()+"/basic-info";

        this.get(url,
            (data) => {
                console.log('用户数据:', data);
                Manager.userData = data;

                Manager.loadFinish++;
                console.log(Manager.userData);
                },
                (error) => {
                    console.log(`'用户数据GET失败: ${error}`);
            }
        )

        url="https://api.xdiving.io/api/equipment/user/"+userId.toString();
    
        Manager.getInstance().get(url,
          (data) => {
            console.log('装备数据:', data);
            Manager.equipmentData = data;
            
            Manager.loadFinish++;
            console.log(Manager.equipmentData);

            //const tem=Manager.equipmentData[0];
            //Manager.equipmentData[0]=Manager.equipmentData[2];
            //Manager.equipmentData[2]=tem;

            //this.initEquipment();
            },
            (error) => {
            console.log(`装备GET失败: ${error}`);
          }
        )

        url="https://api.xdiving.io/api/fish-catch/user/"+userId.toString()+"/box";
    
        Manager.getInstance().get(url,
          (data) => {
            console.log('鱼箱数据:', data);
            
            Manager.loadFinish++;
            Manager.boxData = data;
            console.log(Manager.boxData);
            },
            (error) => {
            console.log(`鱼箱GET失败: ${error}`);
          }
        )

        url="https://api.xdiving.io/api/prop/user/"+userId.toString();
        
        Manager.getInstance().get(url,
          (data) => {
            console.log('道具数据:', data);
            Manager.propData = data;
            
            Manager.loadFinish++;
            console.log(Manager.propData);

            //const tem=Manager.equipmentData[0];
            //Manager.equipmentData[0]=Manager.equipmentData[2];
            //Manager.equipmentData[2]=tem;

            //this.initEquipment();
            },
            (error) => {
            console.log(`道具GET失败: ${error}`);
          }
        )
        
        if(userId==1){//邀请
            this.get("https://api.xdiving.io/api/invitation/user/"+userId.toString()+"/code",
            (data) => {
                console.log('邀请码数据:', data);
                Manager.inviteCode = data.data.invitationCode;
                console.log(Manager.initRequest);
                },
                (error) => {
                    console.log(`'邀请码数据GET失败: ${error}`);
            }
            )   
        
            this.get("https://api.xdiving.io/api/invitation/user/"+userId.toString()+"/invitees",
            (data) => {
                console.log('邀请人数据:', data);
                Manager.inviteUsers = data;
                console.log(Manager.inviteUsers);
                },
                (error) => {
                    console.log(`'邀请人数据GET失败: ${error}`);
            }
            )
        }
        else{
            Manager.inviteCodeUse={invitationCode:Manager.inviteCode,inviteeUserId:userId}
            
            console.log(userId);
            console.log(Manager.inviteCode);
            console.log(Manager.inviteCodeUse);
            this.post('https://api.xdiving.io/api/invitation/use',
            Manager.inviteCodeUse,
            (data) => {
              console.log('使用邀请码数据:', data);
              console.log(Manager.inviteCodeUse);
              },
              (error) => {
                  console.log(`'使用邀请码POST失败: ${error}`);
              }
            )
        }
    }

    //loadBox(){
    //    director.loadScene("Box");
    //}

    initEquipment(){
        for(let index=0;index<Manager.equipmentBaseData.data.length;index++){
            if(Manager.equipmentBaseData.data[index].equipmentNameEn=="Harpoon"){
                Manager.harpoons.push({attribute:Manager.equipmentBaseData.data[index].baseAttribute,
                    cost:Manager.equipmentBaseData.data[index].upgradeCostGold});
            }
            if(Manager.equipmentBaseData.data[index].equipmentNameEn=="Tank"){
                Manager.tanks.push({attribute:Manager.equipmentBaseData.data[index].baseAttribute,
                    cost:Manager.equipmentBaseData.data[index].upgradeCostGold});
            }
            if(Manager.equipmentBaseData.data[index].equipmentNameEn=="Box"){
                Manager.boxs.push({attribute:Manager.equipmentBaseData.data[index].baseAttribute,
                    cost:Manager.equipmentBaseData.data[index].upgradeCostGold});
            }
        }
    }

    //loadEquip(){
    //    let userID=1;
    //    let url="https://api.xdiving.io/api/equipment/user/"+userID.toString();
    //
    //    Manager.getInstance().get(url,
    //      (data) => {
    //        console.log('装备数据:', data);
    //        Manager.equipmentData = data;
    //        console.log(Manager.equipmentData);
    //        director.loadScene("Equip");
    //        },
    //        (error) => {
    //        console.log(`装备GET失败: ${error}`);
    //      }
    //    )
    //}


    preloadGame(){
        director.preloadScene("Game");
    }
    
    request(options: {
        url: string,
        method: string,
        data?: any,
        headers?: {[key: string]: string},
        onSuccess: (data: any) => void,
        onError: (error: string) => void
    }) {
        const request = new XMLHttpRequest();
        request.open(options.method, options.url);
        
        if (options.headers) {
            for (const key in options.headers) {
                request.setRequestHeader(key, options.headers[key]);
            }
        } else if (options.method === 'POST') {
            request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
        else if(options.method=='PUT'){
            request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
        
        request.responseType = 'text';
        
        console.log(request.responseText);
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                try {
                    const data = JSON.parse(request.responseText);
                    options.onSuccess(data);
                } catch (error) {
                    options.onError('JSON解析错误: ' + error);
                }
            } else {
                options.onError(`HTTP错误: ${request.status}`);
            }
        };
        
        request.onerror = () => {
            options.onError('网络错误');
        };
        
        request.ontimeout = () => {
            options.onError('请求超时');
        };
        
        if (options.data) {
            request.send(JSON.stringify(options.data));
        } else {
            request.send();
        }
    }
    
    get(url: string, onSuccess: (data: any) => void, onError?: (error: string) => void) {
        this.request({
            url: url,
            method: 'GET',
            onSuccess: onSuccess,
            onError: onError || ((error) => console.error('GET请求失败:', error))
        });
    }
    
    post(url: string, data: any, onSuccess: (data: any) => void, onError?: (error: string) => void) {
        this.request({
            url: url,
            method: 'POST',
            data: data,
            onSuccess: onSuccess,
            onError: onError || ((error) => console.error('POST请求失败:', error))
        });
    }

    put(url: string, data: any, onSuccess: (data: any) => void, onError?: (error: string) => void) {
    this.request({
        url: url,
        method: 'PUT',
        data: data,
        onSuccess: onSuccess,
        onError: onError || ((error) => console.error('PUT请求失败:', error))
    });
}
}