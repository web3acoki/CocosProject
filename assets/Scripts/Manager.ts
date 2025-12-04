import { _decorator, Component, director, SpriteFrame } from 'cc';
//import { Equip } from './Equip';
//import { init, initData, retrieveLaunchParams  } from '@telegram-apps/sdk';

import WebApp from '@twa-dev/sdk'

import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
// 钱包功能已迁移到 Manager 中
import { TonConnectUI } from '@ton/cocos-sdk';
// 旧钱包功能已停用
// import { TelegramWalletManager } from './Test/telegram-wallet-manager';

//import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
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
    attack:number;
    //size: number;
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
    propId:number,
    propNameEn: string,
    costGold: number,
    description: string,
    value: number
}

interface treasureDataResponse{//宝箱基础数据
    data: treasureBaseData[];
}

interface treasureBaseData{
    treasureId:number;
    //propRarity: number,
    coins: number
}

interface topupDataResponse{//商城基础数据
    data:topupBaseData[];
}

interface topupBaseData{
    priceUsdt:number;
    type:string;
    quantity:number;
}

interface rarityDataResponse{
    data:rarityBaseData[];
}

interface rarityBaseData{//稀有度基础数据
    rarity:string;
    frequency:number;
    reward:number;
    difficulty:number;	
    color:string;
    size:number;
}

interface questDataResponse{//任务基础数据
    data:questBaseData[];
}

interface questBaseData{
    type:string;
    descript:string;
    quantity:number;
    rewardType:string;
    rewardQuantity:number;
}

interface levelDataResponse{
    data:levelBaseData[];
}
interface levelBaseData{
    level:number;
    experienceRequired:number;
    rewardType:string;
    rewardQuantity:number;
    extraType:string;
    extraQuantity:number;
}

interface setRequest{//设置
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

//interface buyPropRequest{//购买道具
//    userId: number;
//    propId: number;
//}//

//interface usePropRequest{//使用道具
//    propId: number;
//}

interface CheckInRequest{//签到
}

interface changeNameRequest{//修改名字
    displayUsername:string;
}

//interface FinishQuestRequest{//完成任务
//    identifier:number;
//    progress:number;
//}
//
//
//interface ClaimQuestRequest{//领取任务奖励
//    identifier:number;
//}
//
//interface RefreshQuestRequest{//刷新任务
//    identifier:number;
//}

interface StartRequest{//游戏开始
}

interface EndRequest{//游戏结束
    userId:number;
    catches:FishData[];
    //usedProps:PropData[];
    treasures:TreasureData[];
    maxDepth:number;
    endReason:string;
    mainPropId:number;
}

interface FishData{
    identifiers:string;
    fishNameEn:string;
    weight:number;
    price:number;
    type:string;
    rarity:string;
}
//interface PropData{
//    propId:number;
//    quantity:number;
//}
interface TreasureData{
    rewardType:string;
    quantity:number;
    //treasureId:number;
    //reward:number;
    //propId:number;
    //propQuantity:number;
}

interface QuestResponse{//用户任务数据
    data:QuestData[];
}

interface QuestData{
    identifier:number;
    progress:number;
    questStatus:number;
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

interface CheckInResponse{//用户签到数据
    data:CheckIn;
}

interface CheckIn{
    isCheckedToday:boolean;
    currentCheckDays:number;
    rewards:Reward[];
}

interface Reward{
    checkDay:number;
    coinReward:number;
    propQuantity:number;
}

interface UserResponse{//用户其他数据
    data:User;
}
interface User{
    userId:number;
    displayUsername:string;
    coins:number;
    diamonds:number;
    level:number;
    experience:number;

    BGMopen:boolean;
    BGSopen:boolean;
    mainPropId:number;

    remainingRounds:number
    swordfishCatched:boolean;
    guideFinish:boolean;
    avatarPath:string;
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
interface InviteUserRespond{//用户邀请人信息
    data:InviteUserData[];
}
interface InviteUserData{
    inviteeUserId:number;
    firstPlayed:boolean;
}
interface InviteCodeRespond{//用户邀请码信息
    data:InviteCodeData;
}
interface InviteCodeData{
    invitationCode:string;
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
    public static topupBaseData:topupDataResponse;
    public static rarityBaseData:rarityDataResponse;
    public static questBaseData:questDataResponse;
    public static levelBaseData:levelDataResponse;
    //public static startData:StartRequest={remainingRounds:4};

    public static setData:setRequest={BGMopen:true,BGSopen:false};
    public static checkIn:CheckInRequest={};
    public static changeNameData:changeNameRequest={displayUsername:""};
    public static startData:StartRequest={};
    public static endData:EndRequest;
    public static sellFishData:sellFishRequest;
    public static upgradeData:upgradeRequest={equipmentId:1};
    
    //public static buyPropData:buyPropRequest={userId:1,propId:1};
    //public static finishQuestData:FinishQuestRequest={identifier:1,progress:1};
    //public static claimQuestData:ClaimQuestRequest={identifier:1};
    //public static refreshQuestData:RefreshQuestRequest={identifier:1};

    //public static curCatchData:CatchData={fishNameEn:"",weight:0,price:0,type:""};
    //public static curPropData:PropData={propID:1,quantity:0};
    //public static curTreasureData:TreasureData={treasureID:1,reward:0,propID:0,propQuantity:0};
    public static boxData:BoxResponse;
    public static equipmentData:EquipmentResponse;
    public static propData:PropResponse;
    public static checkInData:CheckInResponse;
    public static userData:UserResponse;
    public static questData:QuestResponse;
    public static inviteUserData:InviteUserRespond;
    public static inviteCodeData:InviteCodeRespond;

    public static harpoons:Harpoon[]=[];
    public static tanks:Tank[]=[];
    public static boxs:Box[]=[];
    public static totalRarity:number=0;
    public static actualRarity:number[]=[];
    public static loaded=false;

    public static initRequest:InitRequest;
    public static initRespond:InitRespond;
    public static loadFinish=0;
    
    public static accessToken:string;

    // 钱包状态变化回调列表（供 GeneralUI 等组件注册）
    private static walletStatusChangeCallbacks: Array<() => void> = [];

    // 注册钱包状态变化回调
    public static onWalletStatusChange(callback: () => void) {
        Manager.walletStatusChangeCallbacks.push(callback);
    }

    // 移除钱包状态变化回调
    public static offWalletStatusChange(callback: () => void) {
        const index = Manager.walletStatusChangeCallbacks.indexOf(callback);
        if (index > -1) {
            Manager.walletStatusChangeCallbacks.splice(index, 1);
        }
    }

    // 通知所有注册的组件更新钱包状态
    public static notifyWalletStatusChange() {
        Manager.walletStatusChangeCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('钱包状态变化回调执行失败:', error);
            }
        });
    }

    //public static testInitData:string;
    //
    //public static testAuthdate:string;
    //public static testUserId:string;

    // 钱包功能（从 Wallet.ts 迁移）
    private connectUI: TonConnectUI | null = null;
    private walletInitError: string | null = null;
    private walletInitErrorDetails: any = null;

    //public static
    
    //this.catchSprite.spriteFrame=instantiate(this.game.fishPrefabs[index]).getComponent(Sprite).spriteFrame;

    
    async onLoad() {
        if (Manager.instance) {
            this.destroy();
            return;
        } else {
            Manager.instance = this;
            director.addPersistRootNode(this.node);
        }
        
        // 初始化钱包（只初始化一次，避免重复加载）
        this.initWallet().catch(err => console.error('钱包初始化失败:', err));
        this.loadBaseData();
        this.initTGUser();
    ////////////////////////////
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

    }

    postTest(testText:string){
        let testData={
            message:testText
        }
        this.post('https://api.xdiving.io/api/test/simple/log',
        testData,
        (data) => {
          console.log(testData);
        },
        (error) => {
            console.log(`测试数据POST失败: ${error}`);
        }
        )
    }
    
    getTest(getNumber:number){
        this.get('https://api.xdiving.io/api/test/simple/array/'+getNumber.toString(),
        (data) => {
          console.log(data);
        },
        (error) => {
            console.log(`测试数据GET失败: ${error}`);
        }
        )
    }

    getData(url:string,setter:(data:any)=>void,name:string,initFunction:()=>void){
        
        this.get(url,
            (data) => {
                console.log(name+'数据:', data);
                // 使用 setter 函数来设置数据，灵活且不需要 switch
                setter(data);
                // 执行初始化函数
                if (initFunction) {
                    initFunction();
                }
                },
                (error) => {
                    console.log(name+`数据GET失败: ${error}`);
            }
        )
    }
    
    loadBaseData(){
        //this.postTest("ready to loadBaseData");
        this.getData('https://api.xdiving.io/api/fish/list', (data) => Manager.fishBaseData = data, '鱼基础', () => {});
        this.getData('https://api.xdiving.io/api/equipment/list', (data) => Manager.equipmentBaseData = data, '装备基础', () => this.initEquipment());
        this.getData('https://api.xdiving.io/api/prop/list', (data) => Manager.propBaseData = data, '道具基础', () => {});
        this.getData('https://api.xdiving.io/api/treasure/list', (data) => Manager.treasureBaseData = data, '宝箱基础', () => {});
        this.getData('https://api.xdiving.io/api/shop/list', (data) => Manager.topupBaseData = data, '商城基础', () => {});
        this.getData('https://api.xdiving.io/api/rarity/all', (data) => Manager.rarityBaseData = data, '稀有度基础', () => this.initRarity());
        this.getData('https://api.xdiving.io/api/quest/all', (data) => Manager.questBaseData = data, '任务基础', () => {});
        this.getData('https://api.xdiving.io/api/level/all', (data) => Manager.levelBaseData = data, '等级基础', () => {});
    }

    initTGUser(){
        
        //TelegramWebApp.Instance.init().then(res => {
        //    console.log("telegram web app init : ", res.success);
        //});
        //Manager.testInitData = TelegramWebApp.Instance.getTelegramInitData();
        
        //Telegram.WebApp.initData;
        //Manager.initRequest= {initData:userInitData};

        //const str=WebApp['default'].initData;
        //const signatureIndex = str.indexOf('&signature');
        //const hashIndex = str.indexOf('&hash');    
        //const beforeSignature = str.substring(0, signatureIndex);
        //const afterHash = str.substring(hashIndex);
        //const initDataNoHash=beforeSignature+afterHash;
        //this.postTest("ready to initTGUser");
        ////this.getTest(1);
        //this.postTest("TWAinitData: "+TelegramWebApp.Instance.getTelegramInitData());
        ////this.getTest(2);
        //this.postTest("initData: "+WebApp['default'].initData);
        //this.getTest(3);
        Manager.initRequest={initData:WebApp['default'].initData};
        this.initUser();
        //Manager.testAuthdate=WebApp['default'].initDataUnsafe.auth_date.toString();
        //Manager.testUserId=WebApp['default'].initDataUnsafe.user.id.toString();

        //console.log('WebApp.platform:', WebApp['default'].platform);
        //console.log('WebApp.initData :', WebApp['default'].initData);
        //console.log('WebApp.initDataUnsafe :', WebApp['default'].initDataUnsafe);
        //console.log('WebApp:', WebApp['default']);
    
    }
 
    initFakeUser(userId){
        
        this.postTest("ready to initFakeUser");
        //this.getTest(4);
        Manager.initRequest= {initData:
        "query_id=test123&user=%7B%22id%22%3A"+userId+"%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1662771648&hash=test"
        }
        this.initUser();
    }

    initUser(){
        this.post('https://api.xdiving.io/api/game/init',
        Manager.initRequest,
        (data) => {
          console.log('初始化数据:', data);
          Manager.initRespond=data;
          console.log(Manager.initRequest);
          Manager.accessToken=data.data.accessToken;
          console.log(Manager.accessToken);
          this.loadAllUserData(data.data.user.userId);
          console.log(data.data.user.userId);
          },
          (error) => {
              console.log(`'初始化数据POST失败: ${error}`);
          }
        )
    }

    addFinish(){
        Manager.loadFinish++;
    }

    getFinish(){
        // 检查用户数据是否加载完成
        const userDataLoaded = Manager.loadFinish == 8;
        
        // ========== 旧钱包功能已停用 ==========
        // 不再检查 TON Connect 初始化状态，因为已改用新的 Wallet.ts
        // const walletManager = TelegramWalletManager.getInstance();
        // const tonConnectInitialized = walletManager ? walletManager.isInitialized() : false;
        // 
        // // 如果允许超时，即使 TON Connect 未初始化也允许进入
        // if (allowTimeout) {
        //     console.log('TON Connect 初始化超时，允许进入游戏（用户数据已加载完成）');
        //     return userDataLoaded;
        // }
        // 
        // // 两个条件都满足才能进入主菜单
        // return userDataLoaded && tonConnectInitialized;
        // ========== 旧钱包功能结束 ==========
        
        // 新实现：只检查用户数据加载完成即可（钱包功能由 Wallet.ts 独立管理）
        return userDataLoaded;
    }

    loadAllUserData(userId){
        this.getData("https://api.xdiving.io/api/user/basic-info", (data) => Manager.userData = data, '用户', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/equipment/user/"+userId.toString(), (data) => Manager.equipmentData = data, '装备', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/fish-catch/user/"+userId.toString()+"/box", (data) => Manager.boxData = data, '鱼箱', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/prop/user/"+userId.toString(), (data) => Manager.propData = data, '道具', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/checkin/status/"+userId.toString(), (data) => Manager.checkInData = data, '签到', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/invitation/user/"+userId.toString()+"/code", (data) => Manager.inviteCodeData = data, '邀请码', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/invitation/user/"+userId.toString()+"/invitees", (data) => Manager.inviteUserData = data, '邀请人', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/quest/user/list", (data) => Manager.questData = data, '任务', () => this.addFinish());
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

    initRarity(){
        for(let index=0;index<Manager.rarityBaseData.data.length;index++){
            let totalRarity=Manager.totalRarity+Manager.rarityBaseData.data[index].frequency;
            Manager.totalRarity=totalRarity;
            Manager.actualRarity.push(totalRarity);
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


    //preloadGame(){
    //    director.preloadScene("Game");
    //}
    
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
        
        // 设置 Content-Type
        if (options.method === 'POST' || options.method === 'PUT') {
            request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
        
        // 添加 Authorization header（如果存在 token）
        if (Manager.accessToken) {
            request.setRequestHeader('Authorization', `Bearer ${Manager.accessToken}`);
        }
        
        // 设置自定义 headers（如果有，会覆盖上面的设置）
        if (options.headers) {
            for (const key in options.headers) {
                request.setRequestHeader(key, options.headers[key]);
            }
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

    // ========== 钱包功能（从 Wallet.ts 迁移）==========
    async initWallet() {
        // 清除之前的错误信息
        this.walletInitError = null;
        this.walletInitErrorDetails = null;
        
        // 步骤1: 初始化Telegram
        try {
            const result = await TelegramWebApp.Instance.init();
            console.log("Telegram initialized:", result.success);
            if (!result.success) {
                this.walletInitError = "Telegram initialization failed";
                this.walletInitErrorDetails = { step: "Telegram init", result: result };
                Manager.notifyWalletStatusChange();
            }
        } catch (e) {
            console.error("Telegram initialization failed:", e);
            this.walletInitError = "Telegram initialization failed";
            this.walletInitErrorDetails = { step: "Telegram init", error: e?.toString() || String(e), stack: e?.stack };
            Manager.notifyWalletStatusChange();
        }

        // 步骤2: 初始化钱包连接
        try {
            this.connectUI = new TonConnectUI({
                manifestUrl: 'https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json'
            });
            this.connectUI.onStatusChange(() => {
                // 钱包状态变化时的回调
                console.log("Wallet status changed:", this.connectUI?.connected ? "Connected" : "Disconnected");
                // 通知所有需要更新钱包状态的组件（通过静态方法）
                Manager.notifyWalletStatusChange();
            });
            console.log("Wallet initialized successfully");
            // 初始化成功，清除错误信息
            this.walletInitError = null;
            this.walletInitErrorDetails = null;
            Manager.notifyWalletStatusChange();
        } catch (e) {
            console.error("Wallet initialization failed:", e);
            this.walletInitError = "Wallet initialization failed";
            this.walletInitErrorDetails = { 
                step: "TonConnectUI init", 
                error: e?.toString() || String(e), 
                message: e?.message,
                stack: e?.stack,
                name: e?.name
            };
            Manager.notifyWalletStatusChange();
        }
    }

    // 连接/断开钱包 (供其他脚本调用)
    connectWallet() {
        if (!this.connectUI) {
            console.log("Wallet not initialized");
            return;
        }
        if (this.connectUI.connected) {
            this.connectUI.disconnect();
        } else {
            this.connectUI.openModal();
        }
    }

    // 获取钱包连接状态
    isWalletConnected(): boolean {
        return this.connectUI?.connected || false;
    }

    // 获取钱包地址
    getWalletAddress(): string | null {
        if (this.connectUI?.connected && this.connectUI.account?.address) {
            return this.connectUI.account.address;
        }
        return null;
    }

    // 获取 TonConnectUI 实例（供高级用法）
    getConnectUI(): TonConnectUI | null {
        return this.connectUI;
    }

    // 获取钱包初始化错误信息
    getWalletInitError(): string | null {
        return this.walletInitError;
    }

    // 获取钱包初始化错误详情
    getWalletInitErrorDetails(): any {
        return this.walletInitErrorDetails;
    }

    // 发送交易（用于充值功能）
    async sendTransaction(tx: any): Promise<any> {
        if (!this.connectUI) {
            throw new Error("Wallet not initialized");
        }
        if (!this.connectUI.connected) {
            throw new Error("Wallet not connected");
        }
        return await this.connectUI.sendTransaction(tx);
    }

    // 从 BOC 解析交易哈希（使用 tonapi.io）
    async parseTransactionHash(boc: string): Promise<string | null> {
        try {
            // 方法1: 使用 tonapi.io 解析 BOC
            const response = await fetch('https://tonapi.io/v2/boc/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ boc: boc })
            });
            
            if (response.ok) {
                const data = await response.json();
                // 尝试从不同字段获取交易哈希
                const hash = data.hash || data.tx_hash || data.transaction_hash;
                if (hash) {
                    return hash;
                }
            }
        } catch (error) {
            console.error("解析 BOC 失败:", error);
        }
        
        // 方法2: 查询地址的最新交易（备用方法）
        try {
            const walletAddress = this.getWalletAddress();
            if (walletAddress) {
                // 将原始格式转换为用户友好格式（如果需要）
                let address = walletAddress;
                if (address.startsWith('0:') || address.startsWith('-1:')) {
                    // 使用 tonapi.io 查询地址信息（会自动转换格式）
                    const response = await fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(address)}/transactions?limit=1`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.transactions && data.transactions.length > 0) {
                            const tx = data.transactions[0];
                            return tx.hash || tx.tx_hash || null;
                        }
                    }
                } else {
                    // 直接查询用户友好格式地址
                    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/transactions?limit=1`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.transactions && data.transactions.length > 0) {
                            const tx = data.transactions[0];
                            return tx.hash || tx.tx_hash || null;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("查询交易历史失败:", error);
        }
        
        return null;
    }
    // ========== 钱包功能结束 ==========
}