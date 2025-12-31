import { _decorator, Component, director, SpriteFrame, view, screen, Size, ResolutionPolicy } from 'cc';
//import { Equip } from './Equip';
//import { init, initData, retrieveLaunchParams  } from '@telegram-apps/sdk';

import WebApp from '@twa-dev/sdk'

import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
// 钱包功能已迁移到 Manager 中
import { TonConnectUI } from '@ton/cocos-sdk';

//import  PrivyClient, { LocalStorage } from '@privy-io/js-sdk-core';

//const privy=new PrivyClient({
//    appId: 'cmjksvwjy05n3l40c0s99jnse',
//    storage: new LocalStorage(),
//});

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

    life:number;
    feedingFrequency:number;
    feedingPrice:number;
    reward:number;
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

interface levelDataResponse{//等级基础数据
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

interface aquariumDataResponse{//水族箱基础数据
    data:aquariumBaseData[];
}
interface aquariumBaseData{
    level:number;
    gold:number;
    diamond:number;
    capacity:number;
    fee:number;
}

interface decorationDataResponse{//装饰基础数据
    data:decorationBaseData[];
}
interface decorationBaseData{
    decorationId:number;
    decorationName:string;
    price:number;
    bonus:number;
}

interface setRequest{//设置
    BGMopen:boolean;
    BGSopen:boolean;
}

interface sellFishRequest{//卖鱼
    userId:string;
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

//interface StartRequest{//游戏开始
//}

interface EndRequest{//游戏结束
    userId:string;
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

interface levelResponse{//用户等级数据
    data:levelData[];
}
interface levelData{
    level:number;
    rewardClaimed:boolean;
    extraRewardClaimed:boolean;
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

interface aquariumFishResponse{//用户水族箱鱼数据
    data:aquariumFishData[];
}
interface aquariumFishData{

    identifiers:string;
    fishNameEn:string;
    weight:number;
    price:number;
    type:string;
    rarity:string;

    putInAquariumTime:number;//放入时间
    feedCount:number;//投喂次数
    claimCount:number;
    feedCost:number;
    claimRewardAmount:number;
}
interface decorationResponse{//用户水族箱装饰数据
    data:decorationData[];
}
interface decorationData{
    decorationId:number;
    status:number;
}
interface aquariumLevelResponse{//用户水族箱等级数据
    data:aquariumLevelData;
}
interface aquariumLevelData{
    level:number;
}//用户水族箱升级数据

interface UserResponse{//用户其他数据
    data:User;
}
interface User{
    userId:string;
    telegramUserId:string;
    displayUsername:string;

    coins:number;
    diamonds:number;
    level:number;
    experience:number;
    vip:boolean;

    BGMopen:boolean;
    BGSopen:boolean;
    mainPropId:number;

    remainingRounds:number
    swordfishCatched:boolean;
    guideFinish:boolean;
    avatarPath:string;

    timeStamp:number;//登录时间戳
}

//interface topupRespond{
//    status:boolean;
//}

interface InitRequest{//初始化信息
    initData:string;
}
interface InitRespond{
    data:InitData;
    timestamp:number;
}
interface InitData{
    initUser:InitUser;
}
interface InitUser{
    userId:number;
}
interface InviteUserRespose{//用户邀请人信息
    data:InviteUserData[];
}
interface InviteUserData{
    inviteeUserId:number;
    firstPlayed:boolean;
}
interface InviteCodeRespose{//用户邀请码信息
    data:InviteCodeData;
}
interface InviteCodeData{
    invitationCode:string;
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

interface levelStatusData{
    level:number;
    status:number;//1:Lock,2:Unclaimed,3:Claimed
    extraStatus:number;//1:Lock,2:Unclaimed,3:Claimed
}

//interface InitRequest{
//    initData:string;
//}

@ccclass('Manager')
export class Manager extends Component {

    private static instance:Manager = null;
    
    public static getInstance(): Manager {
        return Manager.instance;
    }

    public static TGEnvironment:boolean=true;
    
    public static fishBaseData:FishDataResponse;
    public static equipmentBaseData:EquipmentDataResponse;
    public static propBaseData:PropDataResponse;
    public static treasureBaseData:treasureDataResponse;
    public static topupBaseData:topupDataResponse;
    public static rarityBaseData:rarityDataResponse;
    public static questBaseData:questDataResponse;
    public static levelBaseData:levelDataResponse;
    public static aquariumBaseData:aquariumDataResponse;
    public static decorationBaseData:decorationDataResponse;
    //public static startData:StartRequest={remainingRounds:4};
    
    public static boxData:BoxResponse;
    public static equipmentData:EquipmentResponse;
    public static propData:PropResponse;
    public static checkInData:CheckInResponse;
    public static userData:UserResponse;
    public static questData:QuestResponse;
    public static inviteUserData:InviteUserRespose;
    public static inviteCodeData:InviteCodeRespose;
    public static levelData:levelResponse;
    public static aquariumFishData:aquariumFishResponse;
    public static decorationData:decorationResponse;
    public static aquariumLevelData:aquariumLevelResponse;

    public static setData:setRequest={BGMopen:true,BGSopen:false};
    public static checkIn:CheckInRequest={};
    public static changeNameData:changeNameRequest={displayUsername:""};
    //public static startData:StartRequest={};
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

    public static harpoons:Harpoon[]=[];
    public static tanks:Tank[]=[];
    public static boxs:Box[]=[];
    public static totalRarity:number=0;
    public static actualRarity:number[]=[];
    public static levelStatusDatas:levelStatusData[]=[];
    public static usedCapacity:number=0;

    // 订单查询管理（支持多个订单同时查询，504时切换到poll接口）
    private static activeOrderQueries: Map<number, {
        identifier: number;
        packageId: number;
        onSuccess?: (data: any) => void;
        onError?: (error: string) => void;
        isActive: boolean; // 是否还在查询中
        usePoll: boolean; // 是否已切换到poll接口
    }> = new Map();

    public static loaded=false;

    public static initRequest:InitRequest;
    public static initRespond:InitRespond;
    public static loadFinish=0;
    
    public static accessToken:string;
    
    public static superAllow:boolean=false;//超级管理员是否允许
    public static aquariumAllow:boolean=false;//水族馆是否允许

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


    // private privy: PrivyClient | null = null;
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
        
        // 调整窗口适配策略：当宽度 > 高度 * 0.652 时，关闭适配屏幕高度，反之打开
        this.adjustAspect();
        //this.initPrivy();
        this.schedule(() => {
            this.adjustAspect();
        }, 0.1);
        
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

    // 缓存上一次的窗口大小，避免频繁判断
    private lastWindowSize: Size = null;

    /**
     * 调整窗口适配策略：
     * - 当宽度 > 高度 * 0.652 时，关闭适配屏幕高度（使用 SHOW_ALL）
     * - 当宽度 <= 高度 * 0.652 时，打开适配屏幕高度（使用 FIXED_WIDTH）
     * - 只在 windowSize 有变化时才判断，避免频繁判断
     */
    adjustAspect(){
        let windowSize = screen.windowSize;
        
        // 检查窗口大小是否有变化
        if(this.lastWindowSize && 
           this.lastWindowSize.width === windowSize.width && 
           this.lastWindowSize.height === windowSize.height){
            // 窗口大小没有变化，跳过判断
            return;
        }
        
        // 窗口大小有变化，更新缓存
        this.lastWindowSize = new Size(windowSize.width, windowSize.height);
        
        // 执行适配策略判断
        let designSize = view.getDesignResolutionSize();
        let aspectRatio = windowSize.width / windowSize.height;
        
        if(aspectRatio > 0.652){
            // 宽度 > 高度 * 0.652，关闭适配屏幕高度（固定宽度）
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.SHOW_ALL);
        }
        else{
            // 宽度 <= 高度 * 0.652，打开适配屏幕高度（固定高度）
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_WIDTH);
        }
    }

    //initPrivy(){
    //    this.privy=new PrivyClient({
    //        appId: 'cmjksvwjy05n3l40c0s99jnse',
    //        storage: new LocalStorage(),
    //    });
    //}

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
          console.log(`测试数据: ${data}`);
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
        this.getData('https://api.xdiving.io/api/aquarium/list', (data) => Manager.aquariumBaseData = data, '水族箱基础', () => {});
        this.getData('https://api.xdiving.io/api/decoration/list', (data) => Manager.decorationBaseData = data, '装饰基础', () => {});
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
        let initData=WebApp['default'].initData;
        if(initData){
            Manager.TGEnvironment=true;
            Manager.initRequest={initData:initData};
            this.initUser();
        }
        else{
            Manager.TGEnvironment=false;
        }
        //Manager.testAuthdate=WebApp['default'].initDataUnsafe.auth_date.toString();
        //Manager.testUserId=WebApp['default'].initDataUnsafe.user.id.toString();

        //console.log('WebApp.platform:', WebApp['default'].platform);
        //console.log('WebApp.initData :', WebApp['default'].initData);
        //console.log('WebApp.initDataUnsafe :', WebApp['default'].initDataUnsafe);
        //console.log('WebApp:', WebApp['default']);
    
    }
 
    initFakeUser(userId){
        
        //this.postTest("ready to initFakeUser");
        //this.getTest(4);
        Manager.initRequest= {initData:
        "query_id=test123&user=%7B%22id%22%3A"+userId+"%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1662771648&hash=Test"
        }
        this.initUser();
    }

    initWebUser(userId){
        Manager.initRequest= {initData:"hash=PRIVY&user=%7B%22id%22%3A%22"+userId+"%22%7D"}
        this.initUser();
    }
    
    initWebUserWithType(userId,loginType){
        Manager.initRequest= {initData:"hash=PRIVY&loginType="+loginType+"&user=%7B%22id%22%3A%22"+userId+"%22%7D"}
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
        if(Manager.loadFinish>=12){
            this.initLevel();
            this.initAquarium();
            Manager.loadFinish++;
        }
    }

    getFinish(){
        // 检查用户数据是否加载完成
        const userDataLoaded = Manager.loadFinish >=13;
        
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
        this.getData("https://api.xdiving.io/api/level/claimed-rewards", (data) => Manager.levelData = data, '等级', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/aquarium/user/fish",(data) => Manager.aquariumFishData = data, '水族箱鱼', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/aquarium/decoration/user",(data) => Manager.decorationData = data, '水族箱装饰', () => this.addFinish());
        this.getData("https://api.xdiving.io/api/aquarium/user/upgrade",(data) => Manager.aquariumLevelData = data, '水族箱等级', () => this.addFinish());
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

    initLevel(){
   // 先清空数组
        Manager.levelStatusDatas = [];
        
        for(let index=0;index<Manager.levelBaseData.data.length;index++){
            if(index<Manager.userData.data.level){
                if(Manager.userData.data.vip){
                    Manager.levelStatusDatas.push({level:index+1,status:2,extraStatus:2});
                }
                else{
                    Manager.levelStatusDatas.push({level:index+1,status:2,extraStatus:1});
                }
            }
            else{
                Manager.levelStatusDatas.push({level:index+1,status:1,extraStatus:1});
            }
        }
        
        for(const level of Manager.levelData.data){
            if(level.rewardClaimed){
                Manager.levelStatusDatas[level.level-1].status=3;
            }
            if(level.extraRewardClaimed){
                Manager.levelStatusDatas[level.level-1].extraStatus=3;
            }
        }
    }

    initAquarium(){
        // 先重置 usedCapacity
        Manager.usedCapacity = 0;
        if(Manager.userData.data.userId === "6063502847"||
            Manager.userData.data.userId === "7816429158"||
            Manager.userData.data.userId === "7143498731"||
            Manager.userData.data.userId === "6974811763"||
            Manager.userData.data.userId === "7371874158"||
            Manager.userData.data.userId === "5971871101"){
            Manager.aquariumAllow=true;
        }
        else{
            Manager.aquariumAllow=false;
        }
        if(Manager.userData.data.userId=="7816429158"||
            Manager.userData.data.userId=="2006267752406708225"){
            Manager.superAllow=true;
        }
        else{
            Manager.superAllow=false;
        }
        for(let index=0;index<Manager.aquariumFishData.data.length;index++){
            Manager.usedCapacity+=Manager.aquariumFishData.data[index].weight;
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

    /**
     * 开始订单查询（504时立即切换到poll接口持续查询）
     * @param identifier 订单号
     * @param packageId 套餐ID
     * @param onSuccess 成功回调（可选，用于更新UI）
     * @param onError 失败回调（可选）
     */
    startOrderQuery(
        identifier: number,
        packageId: number,
        onSuccess?: (data: any) => void,
        onError?: (error: string) => void
    ) {
        // 如果该订单已经在查询中，不重复查询
        if (Manager.activeOrderQueries.has(identifier)) {
            console.log(`订单 ${identifier} 已在查询中，跳过重复查询`);
            return;
        }

        // 添加到查询列表
        Manager.activeOrderQueries.set(identifier, {
            identifier: identifier,
            packageId: packageId,
            onSuccess: onSuccess,
            onError: onError,
            isActive: true,
            usePoll: false // 初始使用query接口
        });

        const queryOrder = () => {
            // 检查订单是否还在查询中（可能被停止）
            const queryInfo = Manager.activeOrderQueries.get(identifier);
            if (!queryInfo || !queryInfo.isActive) {
                console.log(`订单 ${identifier} 已停止查询`);
                return;
            }

            // 根据是否切换到poll接口选择URL
            const url = queryInfo.usePoll 
                ? `https://api.xdiving.io/api/shop/order/poll?identifier=${identifier}`
                : `https://api.xdiving.io/api/shop/order/query?identifier=${identifier}&itemId=${packageId}`;

            const request = new XMLHttpRequest();
            request.open('GET', url);
            
            // 添加 Authorization header
            if (Manager.accessToken) {
                request.setRequestHeader('Authorization', `Bearer ${Manager.accessToken}`);
            }
            
            request.responseType = 'text';
            
            request.onload = () => {
                // 再次检查订单是否还在查询中
                const currentQueryInfo = Manager.activeOrderQueries.get(identifier);
                if (!currentQueryInfo || !currentQueryInfo.isActive) {
                    return;
                }

                if (request.status >= 200 && request.status < 300) {
                    try {
                        const data = JSON.parse(request.responseText);
                        console.log(`订单 ${identifier} 查询成功:`, data);
                        
                        // 无论订单状态如何，只要有返回就停止查询
                        // 如果订单完成，更新Manager数据
                        if (data.data && data.data.status == "COMPLETED") {
                            this.handleOrderCompleted(data, packageId);
                        }
                        
                        // 停止查询，从列表中移除
                        currentQueryInfo.isActive = false;
                        Manager.activeOrderQueries.delete(identifier);
                        
                        // 调用成功回调（如果界面还在）
                        if (currentQueryInfo.onSuccess) {
                            currentQueryInfo.onSuccess(data);
                        }
                    } catch (error) {
                        console.log(`订单 ${identifier} JSON解析错误:`, error);
                        // JSON解析错误，停止查询
                        currentQueryInfo.isActive = false;
                        Manager.activeOrderQueries.delete(identifier);
                        if (currentQueryInfo.onError) {
                            currentQueryInfo.onError('JSON解析错误: ' + error);
                        }
                    }
                } else if (request.status == 504) {
                    // 504 Gateway Timeout，立即切换到poll接口继续查询（不等待）
                    console.log(`订单 ${identifier} 查询504超时，立即切换到poll接口继续查询...`);
                    if (!currentQueryInfo.usePoll) {
                        // 切换到poll接口
                        currentQueryInfo.usePoll = true;
                    }
                    // 立即继续查询（不等待）
                    queryOrder();
                } else {
                    // 其他HTTP错误，停止查询
                    console.log(`订单 ${identifier} 查询HTTP错误:`, request.status);
                    currentQueryInfo.isActive = false;
                    Manager.activeOrderQueries.delete(identifier);
                    if (currentQueryInfo.onError) {
                        currentQueryInfo.onError(`HTTP错误: ${request.status}`);
                    }
                }
            };
            
            request.onerror = () => {
                // 再次检查订单是否还在查询中
                const currentQueryInfo = Manager.activeOrderQueries.get(identifier);
                if (!currentQueryInfo || !currentQueryInfo.isActive) {
                    return;
                }

                console.log(`订单 ${identifier} 查询网络错误，继续查询...`);
                // 网络错误也继续查询（如果已切换到poll接口，继续使用poll；否则继续使用query）
                queryOrder();
            };
            
            request.send();
        };
        
        // 开始查询
        queryOrder();
    }

    /**
     * 停止订单查询
     * @param identifier 订单号
     */
    stopOrderQuery(identifier: number) {
        const queryInfo = Manager.activeOrderQueries.get(identifier);
        if (queryInfo) {
            queryInfo.isActive = false;
            Manager.activeOrderQueries.delete(identifier);
            console.log(`订单 ${identifier} 查询已停止`);
        }
    }

    /**
     * 处理订单完成，更新Manager中的数据
     */
    private handleOrderCompleted(orderData: any, packageId: number) {
        // 根据套餐ID获取套餐数据
        let topupData = null;
        
        // 查找套餐数据（可能是商城套餐或VIP套餐）
        if (packageId == 10000) {
            // VIP套餐
            Manager.userData.data.vip = true;
            // 更新等级奖励状态
            for (let index = 0; index < Manager.levelBaseData.data.length; index++) {
                if (index < Manager.userData.data.level) {
                    Manager.levelStatusDatas[index].extraStatus = 2;
                }
            }
        } else if (Manager.topupBaseData && Manager.topupBaseData.data) {
            // 商城套餐
            const packageIndex = packageId - 1;
            if (packageIndex >= 0 && packageIndex < Manager.topupBaseData.data.length) {
                topupData = Manager.topupBaseData.data[packageIndex];
                
                if (topupData.type == "Gold") {
                    Manager.userData.data.coins += topupData.quantity;
                }
                else if (topupData.type == "Super booster") {
                    Manager.propData.data[3].quantity += topupData.quantity;
                }
                else if (topupData.type == "Return capsule") {
                    Manager.propData.data[4].quantity += topupData.quantity;
                }
            }
        }
        
        console.log(`订单完成，已更新Manager数据，套餐ID: ${packageId}`);
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
    // ========== 原版钱包功能结束 ==========
    //async loginWithTelegram() {
    //    try {
    //        // 1. 初始化 OAuth 流程
    //        // redirectUrl 必须是你在 Privy Dashboard 注册的合法域名地址
    //        const redirectUrl = "https://your-game-domain.com/"; 
    //        
    //        // 调用 OAuth 登录
    //        await this.privy.auth.loginWithOAuth({
    //            provider: 'telegram',
    //            redirectUrl: redirectUrl
    //        });
    //        
    //        // 执行后，浏览器会自动跳转到 Telegram 的授权页面
    //    } catch (error) {
    //        console.error("发起 Telegram 登录失败:", error);
    //    }
    //}
    //
    //async handleAfterLogin() {
    //    // 检查是否已经登录成功
    //    const user = await this.privy.user.get();
    //    const wallet =await this.privy.wallet.get();
    //    
    //    if (user) {
    //        // 1. 获取 Telegram 用户 ID
    //        // 在 linked_accounts 数组中查找类型为 'telegram' 的账户
    //        const telegramAccount = user.linked_accounts.find(acc => acc.type === 'telegram');
    //        if (telegramAccount) {
    //            const telegramUserId = telegramAccount.telegram_user_id; // 这就是 Telegram ID
    //            console.log("Telegram User ID:", telegramUserId);
    //        }
    //
    //        // 2. 获取 Privy 钱包 ID (Address)
    //        // 查找嵌入式钱包或已链接的钱包
    //        const walletAccount = user.linked_accounts.find(acc => 
    //            acc.type === 'wallet' && acc.connector_type === 'embedded'
    //        );
    //        
    //        if (walletAccount) {
    //            const walletAddress = walletAccount.address; // 钱包公钥地址
    //            const walletId = walletAccount.id; // Privy 内部的钱包唯一标识
    //            console.log("Wallet Address:", walletAddress);
    //        }
    //    }
    //}
}