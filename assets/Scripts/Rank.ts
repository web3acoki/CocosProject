import { _decorator, Component, director, Label, Prefab, Sprite, Node, instantiate } from 'cc';
import { Sound } from './Sound';
import { Manager } from './Manager';
import { RankContent } from './RankContent';
import { GeneralUI } from './GeneralUI';
const { ccclass, property } = _decorator;

enum WeekState{
    Week,
    Month,
    All,
}

enum GoldState{
    Gold,
    Diamond,
    Referral,
}

// 排行榜数据接口
export interface RankItem {
    rank: number;
    userId: number;
    nickname: string;
    score: number;
}

export interface MyRank {
    rank: number;
    userId: number;
    nickname: string;
    score: number;
    inTop: boolean;
}

export interface RankUpdateMessage {
    data:RankData;
    type: string;
    rankType?: 'COINS' | 'DIAMONDS' | 'INVITATION';
    period?: 'ALL' | 'WEEK' | 'MONTH';
}

export interface RankData {
    list: RankItem[];
    myRank: MyRank;
}

@ccclass('Rank')
export class Rank extends Component {

    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Sprite)
    WeekButton:Sprite=null;
    @property(Sprite)
    MonthButton:Sprite=null;
    @property(Sprite)
    AllButton:Sprite=null;
    @property(Sprite)
    GoldButton:Sprite=null;
    @property(Sprite)
    DiamondButton:Sprite=null;
    @property(Sprite)
    ReferralButton:Sprite=null;
    @property(Label)
    goldStateLabel:Label=null;

    @property(RankContent)
    firstRankContent:RankContent=null;
    @property(RankContent)
    secondRankContent:RankContent=null;
    @property(RankContent)
    thirdRankContent:RankContent=null;
    @property(RankContent)
    myRankContent:RankContent=null;

    @property(Prefab)
    rankContentPrefab:Prefab=null;
    @property(Node)
    rankContentNode:Node=null;
    @property(Node)
    afterFourthNode:Node=null;

    private weekState=WeekState.Week;
    private goldState=GoldState.Gold;
    private ws: WebSocket = null;
    private readonly WS_BASE_URL = 'api.xdiving.io/api/ws/rank';
    private pingTimer: number = null; // 用于存储 ping 定时器
    private isManuallyClosing: boolean = false; // 标记是否是主动关闭连接

    // 排行榜数据存储
    private rankData: RankUpdateMessage | null = null;
    private topList: RankItem[] = [];
    private myRank: MyRank | null = null;

    start() {
        this.generalUI.updateDisplay();
        this.connectWebSocket();
    }

    /**
     * 获取 WebSocket URL（使用 wss://）
     */
    private getWebSocketUrl(): string {
        return `wss://${this.WS_BASE_URL}`;
    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        this.closeWebSocket();
    }

    private connectWebSocket() {
        // 检查 accessToken 是否存在
        if (!Manager.accessToken) {
            console.error('Rank WebSocket: accessToken 未找到，无法连接');
            return;
        }

        // 如果已经有连接，先关闭
        if (this.ws) {
            this.isManuallyClosing = true;
            this.ws.close();
            this.ws = null;
            this.isManuallyClosing = false;
        }

        try {
            // 获取正确的 WebSocket URL（根据页面协议自动选择 ws:// 或 wss://）
            const baseUrl = this.getWebSocketUrl();
            // 构建带 token 的 WebSocket URL
            const wsUrl = `${baseUrl}?token=${encodeURIComponent(Manager.accessToken)}`;
            console.log('Rank WebSocket 连接 URL:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Rank WebSocket 连接成功');
                // 连接成功后立即发送订阅消息
                this.sendSubscribeMessage();
                // 启动 ping 定时器，每 30 秒发送一次
                this.startPingTimer();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('Rank WebSocket 错误:', error);
                // 输出更详细的错误信息
                if (this.ws) {
                    console.error('WebSocket readyState:', this.ws.readyState);
                    console.error('WebSocket URL:', this.ws.url);
                }
            };

            this.ws.onclose = (event) => {
                console.log('Rank WebSocket 连接关闭', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });
                // 清除 ping 定时器
                this.stopPingTimer();
                this.ws = null;

                // 如果不是主动关闭，且还在 Rank 界面，则自动重新连接
                if (!this.isManuallyClosing && this.node && this.node.isValid) {
                    console.log('Rank WebSocket: 检测到被动断开，正在重新连接...');
                    // 延迟一小段时间后重新连接，避免立即重连
                    this.scheduleOnce(() => {
                        // 再次检查是否还在界面
                        if (this.node && this.node.isValid) {
                            this.connectWebSocket();
                        }
                    }, 1); // 延迟 1 秒后重连
                }
            };
        } catch (error) {
            console.error('Rank WebSocket 连接失败:', error);
        }
    }

    private closeWebSocket() {
        // 标记为主动关闭，避免触发自动重连
        this.isManuallyClosing = true;
        
        if (this.ws) {
            // 先发送取消订阅消息
            this.sendUnsubscribeMessage();
            // 然后关闭连接
            this.ws.close();
            this.ws = null;
        }
        // 清除 ping 定时器
        this.stopPingTimer();
        
        // 重置标志
        this.isManuallyClosing = false;
    }

    /**
     * 发送取消订阅消息
     */
    private sendUnsubscribeMessage() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Rank WebSocket 未连接，无法发送取消订阅消息');
            return;
        }

        const message = {
            type: 'UNSUBSCRIBE_RANK'
        };

        try {
            this.ws.send(JSON.stringify(message));
            console.log('Rank 发送取消订阅消息:', message);
        } catch (error) {
            console.error('Rank 发送取消订阅消息失败:', error);
        }
    }

    /**
     * 启动 ping 定时器，每 30 秒发送一次 ping
     */
    private startPingTimer() {
        // 清除之前的定时器（如果存在）
        this.stopPingTimer();
        
        // 设置新的定时器，每 30 秒执行一次
        this.pingTimer = setInterval(() => {
            this.sendPing();
        }, 30000); // 30 秒 = 30000 毫秒
        
        console.log('Rank WebSocket: 已启动 ping 定时器（每 30 秒）');
    }

    /**
     * 停止 ping 定时器
     */
    private stopPingTimer() {
        if (this.pingTimer !== null) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
            console.log('Rank WebSocket: 已停止 ping 定时器');
        }
    }

    /**
     * 发送 ping 消息（保持连接活跃）
     */
    private sendPing() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Rank WebSocket 未连接，无法发送 ping');
            return;
        }

        try {
            // WebSocket ping 通常发送空消息或特定格式
            // 这里发送一个简单的 ping 消息
            this.ws.send(JSON.stringify({ type: 'PING' }));
            console.log('Rank WebSocket: 发送 ping');
        } catch (error) {
            console.error('Rank WebSocket: 发送 ping 失败:', error);
        }
    }

    private sendSubscribeMessage() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Rank WebSocket 未连接，无法发送订阅消息');
            return;
        }

        // 将枚举值转换为 API 需要的字符串
        const rankTypeMap = {
            [GoldState.Gold]: 'COINS',
            [GoldState.Diamond]: 'DIAMONDS',
            [GoldState.Referral]: 'INVITATION'
        };

        const periodMap = {
            [WeekState.Week]: 'WEEK',
            [WeekState.Month]: 'MONTH',
            [WeekState.All]: 'ALL'
        };

        const message = {
            type: 'SUBSCRIBE_RANK',
            rankType: rankTypeMap[this.goldState],
            period: periodMap[this.weekState]
        };

        try {
            this.ws.send(JSON.stringify(message));
            console.log('Rank 发送订阅消息:', message);
        } catch (error) {
            console.error('Rank 发送订阅消息失败:', error);
        }
    }

    private handleWebSocketMessage(data: string) {
        try {
            const message: RankUpdateMessage = JSON.parse(data);
            console.log('Rank 收到 WebSocket 消息:', message);
            
            // 处理排行榜数据更新
            if (message.type === 'RANK_DATA') {
                this.updateRankData(message);
            }
        } catch (error) {
            console.error('Rank 解析 WebSocket 消息失败:', error, data);
        }
    }

    private updateRankData(rankUpdate: RankUpdateMessage) {
        // 存储完整的排行榜数据
        this.rankData = rankUpdate;
        this.topList = rankUpdate.data.list || [];
        this.myRank = rankUpdate.data.myRank || null;

        // 更新前三名 UI
        this.updateTopThreeUI();

        // 更新第4名及以后的 UI
        this.updateRestRankUI();

        // 更新我的排名 UI
        this.updateMyRankUI();
        

        // 根据消息中的 rankType 更新按钮状态和标签（与 UI 初始化同步）
        this.updateGoldStateUI();

        // 根据消息中的 period 更新周期按钮状态（与 UI 初始化同步）
        this.updateWeekStateUI();
    }

    /**
     * 根据 rankType 更新按钮状态和标签
     */
    private updateGoldStateUI() {

        // 更新内部状态
            this.GoldButton.enabled = this.goldState === GoldState.Gold;
            this.DiamondButton.enabled = this.goldState === GoldState.Diamond;
            this.ReferralButton.enabled = this.goldState === GoldState.Referral;
            this.goldStateLabel.string = this.goldStateLabel.string;
    }

    /**
     * 根据 period 更新周期按钮状态
     */
    private updateWeekStateUI() {
            this.WeekButton.enabled = this.weekState === WeekState.Week;
            this.MonthButton.enabled = this.weekState === WeekState.Month;
            this.AllButton.enabled = this.weekState === WeekState.All;
    }

    /**
     * 格式化数字：使用 K、M、B、T 等表示大数字，并用逗号分隔每3个数字
     * 规则：显示4位数字，如果不超过4位就不用单位表示
     * @param num 要格式化的数字
     * @returns 格式化后的字符串
     */
    private formatNumber(num: number): string {
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

    /**
     * 更新单个 RankContent 的 UI
     */
    private updateRankContentUI(rankContent: RankContent | null, rankItem: RankItem | null) {
        if (!rankContent) {
            return;
        }

        if (rankItem) {
            // 有数据，激活节点并更新内容
            rankContent.node.active = true;
            if (rankContent.rankLabel) {
                rankContent.rankLabel.string = rankItem.rank.toString();
            }
            if (rankContent.nicknameLabel) {
                rankContent.nicknameLabel.string = rankItem.nickname;
            }
            if (rankContent.scoreLabel) {
                rankContent.scoreLabel.string = this.formatNumber(rankItem.score);
            }
        } else {
            // 无数据，不激活节点
            rankContent.node.active = false;
        }
    }

    /**
     * 更新前三名 UI
     */
    private updateTopThreeUI() {
        // 第一名
        const first = this.topList.length > 0 ? this.topList[0] : null;
        this.updateRankContentUI(this.firstRankContent, first);

        // 第二名
        const second = this.topList.length > 1 ? this.topList[1] : null;
        this.updateRankContentUI(this.secondRankContent, second);

        // 第三名
        const third = this.topList.length > 2 ? this.topList[2] : null;
        this.updateRankContentUI(this.thirdRankContent, third);
    }

    /**
     * 更新第4名及以后的 UI
     */
    private updateRestRankUI() {
        if (!this.rankContentNode || !this.rankContentPrefab) {
            return;
        }

        // 清除旧的子节点
        this.rankContentNode.removeAllChildren();

        // 检查是否有第4名及以后的数据
        const hasAfterFourth = this.topList.length > 3;
        
        // 根据是否有第4名及以后的数据，显示或隐藏 afterFourthNode
        if (this.afterFourthNode) {
            this.afterFourthNode.active = hasAfterFourth;
        }

        // 从第4名开始（索引3）创建 prefab
        for (let i = 3; i < this.topList.length; i++) {
            const rankItem = this.topList[i];
            const rankContentInstance = instantiate(this.rankContentPrefab);
            const rankContent = rankContentInstance.getComponent(RankContent);

            if (rankContent) {
                // 更新内容
                if (rankContent.rankLabel) {
                    rankContent.rankLabel.string = rankItem.rank.toString();
                }
                if (rankContent.nicknameLabel) {
                    rankContent.nicknameLabel.string = rankItem.nickname;
                }
                if (rankContent.scoreLabel) {
                    rankContent.scoreLabel.string = this.formatNumber(rankItem.score);
                }
            }

            // 添加到节点
            this.rankContentNode.addChild(rankContentInstance);
        }

        //console.log(`Rank 创建了 ${this.topList.length - 3} 个第4名及以后的条目`);
    }

    /**
     * 更新我的排名 UI
     */
    private updateMyRankUI() {
        if (!this.myRankContent) {
            return;
        }

        if (this.myRank) {
            // 有数据，激活节点并更新内容
            this.myRankContent.node.active = true;
            if (this.myRankContent.rankLabel) {
                this.myRankContent.rankLabel.string = this.myRank.rank.toString();
            }
            if (this.myRankContent.nicknameLabel) {
                this.myRankContent.nicknameLabel.string = this.myRank.nickname;
            }
            if (this.myRankContent.scoreLabel) {
                this.myRankContent.scoreLabel.string = this.formatNumber(this.myRank.score);
            }
        } else {
            // 无数据，不激活节点
            this.myRankContent.node.active = false;
        }
    }

    /**
     * 获取当前排行榜数据
     */
    public getRankData(): RankUpdateMessage | null {
        return this.rankData;
    }

    /**
     * 获取 Top 20 列表
     */
    public getTopList(): RankItem[] {
        return this.topList;
    }

    /**
     * 获取我的排名信息
     */
    public getMyRank(): MyRank | null {
        return this.myRank;
    }

    switchWeekState(weekState:WeekState){
        if(this.weekState!=weekState){
            Sound.instance.buttonAudio.play();
            // 只更新内部状态，不更新 UI（UI 会在收到 WebSocket 消息后更新）
            this.weekState=weekState;
            // 状态改变后重新发送订阅消息
            this.sendSubscribeMessage();
        }
    }

    chooseWeek(){
        this.switchWeekState(WeekState.Week);
    }
    chooseMonth(){
        this.switchWeekState(WeekState.Month);
    }
    chooseAll(){
        this.switchWeekState(WeekState.All);
    }
    
    switchGoldState(goldState:GoldState,type:string){
        if(this.goldState!=goldState){
            Sound.instance.buttonAudio.play();
            // 只更新内部状态，不更新 UI（UI 会在收到 WebSocket 消息后更新）
            this.goldState=goldState;
            // 状态改变后重新发送订阅消息
            this.sendSubscribeMessage();
        }
    }
    
    chooseGold(){
        this.switchGoldState(GoldState.Gold,"Gold");
    }
    chooseDiamond(){
        this.switchGoldState(GoldState.Diamond,"Diamond");
    }
    chooseReferral(){
        this.switchGoldState(GoldState.Referral,"Referral");
    }

    back(){
        Sound.instance.buttonAudio.play();
        director.loadScene("Menu");
    }
}


