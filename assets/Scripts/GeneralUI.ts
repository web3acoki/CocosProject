import { _decorator, Component, EditBox, Label, Node, ProgressBar, color, sys, director } from 'cc';
import { Manager } from './Manager';
import { Sound } from './Sound';
import { Entry } from './Entry';

import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
const { ccclass, property } = _decorator;

@ccclass('GeneralUI')
export class GeneralUI extends Component {

    @property(Label)
    coins:Label=null;
    @property(Label)
    diamonds:Label=null;

    @property(Label)
    level:Label=null;
    @property(ProgressBar)
    levelBar:ProgressBar=null;
    
    @property(Label)
    userId:Label=null;
    @property(Label)
    playerName:Label=null;

    @property(Node)
    settingFrame:Node=null;
    @property(Node)
    blackGround:Node=null;

    @property(Node)
    BGMon:Node=null;
    @property(Node)
    BGMoff:Node=null;
    @property(Node)
    BGSon:Node=null;
    @property(Node)
    BGSoff:Node=null;
    
    @property(Node)
    successFrame:Node=null;
    successTimer=1;
    
    @property(Node)
    failFrame:Node=null;
    failTimer=1;

    @property(Label)
    nameLabel:Label=null;
    @property(EditBox)
    nameInput:EditBox=null;

    @property(Label)
    statusLabel:Label=null;
    @property(Label)
    connectLabel:Label=null;

    //@property(Node)
    //idNode:Node=null;
    @property(Node)
    switchNode:Node=null;
    @property(Node)
    tgLabel:Label=null;

    /**
     * 格式化数字：使用 K、M、B、T 等表示大数字，并用逗号分隔每3个数字
     * 规则：显示4位数字，如果不超过4位就不用单位表示
     * @param num 要格式化的数字
     * @returns 格式化后的字符串
     */
    formatNumber(num: number): string {
        if (num < 0) {
            return '-' + this.formatNumber(-num);
        }
        
        // 定义单位配置：每个单位对应一个阈值和符号
        const units = [
            { threshold: 1e15, symbol: 'Qa' },      // Quadrillion (千万亿)
            { threshold: 1e12, symbol: 'T' },       // Trillion (万亿)
            { threshold: 1e9, symbol: 'B' },        // Billion (十亿)
            { threshold: 1e6, symbol: 'M' },        // Million (百万)
            { threshold: 1e3, symbol: 'K' },        // Thousand (千)
        ];
        
        // 如果数字小于等于 9999，直接显示并用逗号分隔
        if (num <= 9999) {
            return num.toLocaleString('en-US');
        }
        
        // 找到合适的单位
        for (const unit of units) {
            if (num >= unit.threshold) {
                const value = num / unit.threshold;
                // 计算显示值：保留足够的小数位以确保总共有4位数字
                let displayValue: string;
                
                if (value >= 1000) {
                    // 如果除以单位后仍然 >= 1000，说明需要更大的单位（理论上不应该发生，但作为保护）
                    displayValue = value.toFixed(0);
                } else if (value >= 100) {
                    // 100-999：显示整数或1位小数
                    displayValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
                } else if (value >= 10) {
                    // 10-99：显示1-2位小数
                    displayValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '');
                } else {
                    // 1-9：显示2位小数
                    displayValue = value.toFixed(2).replace(/\.?0+$/, '');
                }
                
                return displayValue + unit.symbol;
            }
        }
        
        // 理论上不会到这里，但作为保护返回原数字
        return num.toLocaleString('en-US');
    }

    updateDisplay(){
        
        if(Manager.TGEnvironment){
            this.switchNode.active=false;
        }
        if(Manager.userData.data.telegramUserId==""){
            this.tgLabel.string="Connect\nTelegram";
        } else {
            this.tgLabel.string="Group";
        }
        console.log(Manager.userData.data.coins);
        this.coins.string = this.formatNumber(Manager.userData.data.coins);
        this.diamonds.string=Manager.userData.data.diamonds.toString();
        this.userId.string="ID:"+Manager.userData.data.userId.toString();
        this.playerName.string=Manager.userData.data.displayUsername;
        this.updateSetting();
        this.updateWalletStatus();
        this.settingFrame.active=false;
    }

    // 更新钱包状态显示（从 Wallet.ts 迁移）
    updateWalletStatus() {
        const manager = Manager.getInstance();
        if (!manager) {
            if (this.statusLabel) {
                this.statusLabel.string = "Manager Not Initialized";
            }
            if (this.connectLabel) {
                this.connectLabel.string = "";
            }
            return;
        }
        
        const connectUI = manager.getConnectUI();
        if (!connectUI) {
            // 钱包未初始化，显示详细错误信息
            const initError = manager.getWalletInitError();
            const initErrorDetails = manager.getWalletInitErrorDetails();
            
            if (this.statusLabel) {
                if (initError) {
                    // 显示详细错误信息
                    let errorInfo = `Wallet Not Initialized\nError: ${initError}`;
                    if (initErrorDetails) {
                        if (initErrorDetails.step) {
                            errorInfo += `\nStep: ${initErrorDetails.step}`;
                        }
                        if (initErrorDetails.error) {
                            errorInfo += `\nDetails: ${initErrorDetails.error}`;
                        }
                        if (initErrorDetails.message) {
                            errorInfo += `\nMessage: ${initErrorDetails.message}`;
                        }
                        if (initErrorDetails.name) {
                            errorInfo += `\nType: ${initErrorDetails.name}`;
                        }
                    }
                    this.statusLabel.string = errorInfo;
                } else {
                    this.statusLabel.string = "Wallet Not Initialized";
                }
            }
            if (this.connectLabel) {
                this.connectLabel.string = "Not Initialized";
            }
            return;
        }
        
        if (connectUI.connected) {
            // 已连接时：statusLabel 显示所有钱包信息，connectLabel 显示 disconnect
            const account = connectUI.account;
            
            let infoParts: string[] = [];
            
            // 地址信息（完整地址，不截断）
            if (account?.address) {
                infoParts.push(`Addr: ${account.address}`);
            }
            
            // 链信息
            if (account?.chain !== undefined) {
                infoParts.push(`Chain: ${account.chain}`);
            }
            
            // 公钥（如果存在，完整显示，不截断）
            if (account?.publicKey) {
                infoParts.push(`PubKey: ${account.publicKey}`);
            }
            
            // 账户的其他属性（完整显示，不截断）
            if (account) {
                const accountKeys = Object.keys(account);
                for (const key of accountKeys) {
                    if (key !== 'address' && key !== 'chain' && key !== 'publicKey') {
                        const value = (account as any)[key];
                        if (value !== undefined && value !== null) {
                            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                            infoParts.push(`${key}: ${valueStr}`);
                        }
                    }
                }
            }
            
            // 连接状态
            infoParts.push(`Connected: ${connectUI.connected}`);
            
            // 组合所有信息，不截断，让 UI 自动处理
            const fullInfo = infoParts.join(' | ');
            if (this.statusLabel) {
                this.statusLabel.string = fullInfo;
            }
            if (this.connectLabel) {
                this.connectLabel.string = "Disconnect";
                this.connectLabel.color = color(255, 0, 0, 255);
            }
        } else {
            // 未连接时：statusLabel 显示等待连接钱包，connectLabel 显示 connect wallet
            if (this.statusLabel) {
                this.statusLabel.string = "Waiting to connect wallet";
            }
            if (this.connectLabel) {
                this.connectLabel.string = "Connect wallet";
                this.connectLabel.color = color(255, 255, 255, 255);
            }
        }
    }

    updateLevel(){
        this.level.string="Lv."+Manager.userData.data.level.toString();
        if(Manager.userData.data.level<Manager.levelBaseData.data.length){
            this.levelBar.progress=Manager.userData.data.experience/Manager.levelBaseData.data[Manager.userData.data.level].experienceRequired;
        }
        else{
            this.levelBar.progress=1;
        }
    }

    openSetting(){
        Sound.instance.buttonAudio.play();
        this.settingFrame.active=!this.settingFrame.active;
        this.blackGround.active=!this.blackGround.active;
    }

    updateSetting(){
        this.BGMon.active=Manager.userData.data.BGMopen;
        this.BGMoff.active=!Manager.userData.data.BGMopen;
        this.BGSon.active=Manager.userData.data.BGSopen;
        this.BGSoff.active=!Manager.userData.data.BGSopen;
        this.updateSound();
    }

    updateSound(){
        Sound.instance.updateSound();
    }

    SettingBGM(){
        Sound.instance.buttonAudio.play();
        Manager.userData.data.BGMopen=!Manager.userData.data.BGMopen;
        this.SettingPut();
        this.updateSetting();
    }

    SettingBGS(){
        Sound.instance.buttonAudio.play();
        Manager.userData.data.BGSopen=!Manager.userData.data.BGSopen;
        this.SettingPut();
        this.updateSetting();
    }

    SettingPut(){
        Manager.setData.BGMopen=Manager.userData.data.BGMopen;
        Manager.setData.BGSopen=Manager.userData.data.BGSopen;
        Manager.getInstance().put('https://api.xdiving.io/api/user/'+Manager.userData.data.userId+'/bgm-bgs',
        Manager.setData,
        (data) => {
          console.log('设置数据:', data);
          console.log(Manager.setData);
          },
          (error) => {
              console.log(`设置数据PUT失败: ${error}`);
          }
        )
    }
    TG(){
        if(Manager.userData.data.telegramUserId==""){
            this.connectTelegram();
        } else {
            this.jumpTG();
        }
    }

    jumpTG(){
        
        Sound.instance.buttonAudio.play();
        const shareUrl = "https://t.me/XDivingOfficial";
        sys.openURL(shareUrl);
        // 尝试使用 TelegramWebApp 的 openTelegramLink 方法
            // 如果 TelegramWebApp 未初始化或调用失败，使用备用方案
            if (Manager.TGEnvironment && window.Telegram && window.Telegram.WebApp) {
                
                const success = TelegramWebApp.Instance.openTelegramLink(shareUrl);
                if (!success) {
                // 使用 openLink 方法在 Telegram 内部打开链接，不会退出 mini app
                if (typeof window.Telegram.WebApp.openLink === 'function') {
                    window.Telegram.WebApp.openLink(shareUrl);
                } else {
                    // 如果 openLink 不可用，使用 sys.openURL
                    sys.openURL(shareUrl);
                }
            } else {
                // 非 Telegram 环境的备用方案
                sys.openURL(shareUrl);
            }
        }
    }




    jumpX(){
        
        Sound.instance.buttonAudio.play();

        const shareUrl = "https://x.com/XDIVING_Global";
        
        sys.openURL(shareUrl);
    }

    copy(){
        Sound.instance.buttonAudio.play();
        if (navigator.clipboard && navigator.clipboard.writeText) {
             navigator.clipboard.writeText(Manager.userData.data.userId.toString())
                 .then(() => {
                     console.log('链接复制成功: ');
                     
                     this.successFrame.active=true;
                     // 这里可以触发复制成功的UI反馈（例如提示文字）
                 })
                 .catch(err => {
                     console.error('复制失败，尝试备用方法: ', err);
                     this.fallbackCopyTextToClipboard(Manager.userData.data.userId.toString());
                 });
         } else {
             // 备用复制方法
             this.fallbackCopyTextToClipboard(Manager.userData.data.userId.toString());
         } 
     }

    copyStatus(){
        Sound.instance.buttonAudio.play();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this.statusLabel.string)
                .then(() => {
                    console.log('状态复制成功: ', this.statusLabel.string);
                    this.successFrame.active=true;
                })
                .catch(err => {
                    console.error('复制失败，尝试备用方法: ', err);
                    this.fallbackCopyTextToClipboard(this.statusLabel.string);
                });
        } else {
            this.fallbackCopyTextToClipboard(this.statusLabel.string);
        }
    }
     
    fallbackCopyTextToClipboard(text:string) {

        // 创建一个临时的 input 元素

        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // 避免触发滚动
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select(); // 选中文本
        textArea.setSelectionRange(0, 99999); // 移动端兼容

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('链接复制成功 (备用方法): ');
                this.successFrame.active=true;
            } else {
                console.error('备用复制方法失败');
                    this.failFrame.active=true;
            }
        } catch (err) {
            console.error('备用复制方法出错: ', err);
        }
        
        document.body.removeChild(textArea);
        
    }

    changeName(){
        Sound.instance.buttonAudio.play();
        if(this.nameInput.node.active){
            this.confirmName();
        }
        else{
            this.nameInput.node.active=true;
            this.nameInput.string=this.nameLabel.string;
        }

    }

    confirmName(){
        this.nameInput.node.active=false;
        let newName=this.nameInput.string;
        if(newName.length>0&&newName.length<17){
            if(newName!=this.nameLabel.string){
                this.nameLabel.string=newName;
                Manager.userData.data.displayUsername=newName;
                Manager.changeNameData.displayUsername=newName;
                Manager.getInstance().put('https://api.xdiving.io/api/user/'+Manager.userData.data.userId+'/display-name',
                Manager.changeNameData,
                (data) => {
                    console.log('修改名字:', data);
                }
                )
            }
        }
    }

    connectWallet(){
        Manager.getInstance().connectWallet();
    }

    start() {
        // 注册钱包状态变化回调
        Manager.onWalletStatusChange(() => {
            this.updateWalletStatus();
        });
        // 初始化时更新一次状态
        this.updateWalletStatus();
    }

    update(deltaTime: number) {
        
        if(this.successFrame.active){
            if(this.successTimer>0){
                this.successTimer-=deltaTime;
            }
            else{
                this.successFrame.active=false;
                this.successTimer=1;
            }
        }
        
        if(this.failFrame.active){
            if(this.failTimer>0){
                this.failTimer-=deltaTime;
            }
            else{
                this.failFrame.active=false;
                this.failTimer=1;
            }
        }
    }

    connectTelegram(){
        Sound.instance.buttonAudio.play();
        const shareUrl = "https://t.me/xdiving_bot";
        sys.openURL(shareUrl);
    }

    SwitchAccount(){
        Sound.instance.buttonAudio.play();
        
        // 设置标志，进入 Entry 场景
        Entry.isSwitchAccount = true;
        director.loadScene('Entry');
    }
}


