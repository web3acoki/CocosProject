import { _decorator, Component, Label, labelAssembler, Node } from 'cc';
const { ccclass, property } = _decorator;
import { init, initData, retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA } from '@telegram-apps/bridge';
import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';


@ccclass('TG')
export class TG extends Component {
    
    @property(Label)
    test1:Label=null;
    
    @property(Label)
    test2:Label=null;

    protected onLoad() {
          //TelegramWebApp.Instance.init().then(res => {
          //  
          //  this.test2.string="telegram web app init : "+res.success;
          //    console.log("telegram web app init : ", res.success);
          //});
//
          //const userInitData = TelegramWebApp.Instance.getTelegramInitData();
          //this.test1.string= userInitData;
       }

    start(){
        //if (isTMA('complete')) {
        //    this.test2.string= 'It\'s Telegram Mini Apps';
        //}   
        //const { initDataRaw, initData } = retrieveLaunchParams();
        //this.test1.string=JSON.stringify(initDataRaw);
        //console.log("11111111111111111"+initDataRaw);



        // 例如，你可以直接访问 initData 中的用户信息
        //if (initData.user) {
        //const userId = initData.user.id;
        //const firstName = initData.user.first_name;
        //}
    }
    //update(){
    //    const { initDataRaw, initData } = retrieveLaunchParams();
    //    this.test1.string=JSON.stringify(initData);
    //}


    //update(){
    //    this.test1.string= this.initDataTest;
    //}
    // 在你的脚本中，例如 LoginManager.ts
    //const { initDataRaw, initData } = retrieveLaunchParams();
//
    //// 例如，你可以直接访问 initData 中的用户信息
    //if (initData.user) {
    //const userId = initData.user.id;
    //const firstName = initData.user.first_name;

    // ... 其他用户信息
        //start() {

        //if (!cc.sys.isBrowser) return;
//
        //const urlParams = new URLSearchParams(window.location.search);
        //const initData = urlParams.get('tgWebAppData');
        //
        //if (initData) {
        //    const decodedData = decodeURIComponent(initData);
        //    const dataObj = Object.fromEntries(new URLSearchParams(decodedData));
        //    console.log('Telegram InitData:', dataObj);
        //}
    //}

    //private readonly baseURL = 'https://api.telegram.org/bot';
    //private botToken: string;
//
    //constructor(botToken: string) {
    //    super();
    //    this.botToken = botToken;
    //}
//
    //// 发送消息
    //public async sendMessage(chatId: string, text: string, options: any = {}) {
    //    const url = `${this.baseURL}${this.botToken}/sendMessage`;
    //    
    //    const payload = {
    //        chat_id: chatId,
    //        text: text,
    //        parse_mode: 'HTML',
    //        ...options
    //    };
//
    //    try {
    //        const response = await fetch(url, {
    //            method: 'POST',
    //            headers: {
    //                'Content-Type': 'application/json',
    //            },
    //            body: JSON.stringify(payload)
    //        });
    //        
    //        return await response.json();
    //    } catch (error) {
    //        console.error('Send message error:', error);
    //        throw error;
    //    }
    //}
//
    //// 获取用户信息
    //public async getUserProfilePhotos(userId: string) {
    //    const url = `${this.baseURL}${this.botToken}/getUserProfilePhotos`;
    //    
    //    const payload = {
    //        user_id: userId
    //    };
//
    //    try {
    //        const response = await fetch(url, {
    //            method: 'POST',
    //            headers: {
    //                'Content-Type': 'application/json',
    //            },
    //            body: JSON.stringify(payload)
    //        });
    //        
    //        return await response.json();
    //    } catch (error) {
    //        console.error('Get user photos error:', error);
    //        throw error;
    //    }
    //}
}


