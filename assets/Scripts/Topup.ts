import { _decorator, Component, director, instantiate, Node, Prefab, SpriteFrame, find, Label, sys, WebView, Button, randomRangeInt } from 'cc';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { TopupContent } from './TopupContent';
import { Manager } from './Manager';
import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
import { TonPay, RechargeResult } from './TonPay';
import { PrivyLoad } from './PrivyLoad';
const { ccclass, property } = _decorator;

@ccclass('Topup')
export class Topup extends Component {
    
    @property(GeneralUI)
    generalUI:GeneralUI=null;

    @property(Node)
    contentNode: Node = null;
    
    @property(Prefab)
    topupContentPrefab: Prefab=null;
    
    @property([SpriteFrame])
    spriteFrames:SpriteFrame[]=[];

    @property(Label)
    resultLabel:Label=null;

    @property(Node)
    webViewNode: Node = null;

    @property(WebView)
    webView: WebView = null;

    @property(Button)
    closeWebViewButton: Button = null;

    @property(Button)
    backButton: Button = null;

    @property(Node)
    tonCoinNode: Node = null;
    @property(Node)
    tonUSDTNode: Node=null;
    @property(Node)
    webViewPaymentNode: Node=null;
    @property(Node)
    linkPaymentNode: Node=null;

    @property(WebView)
    privyWebView: WebView=null;

    // 支付方式状态（4种组合，只能选中一种）
    // 1. 官网支付 + WebView: useWebsitePayment=true, webViewPayment=true
    // 2. 官网支付 + 外链: useWebsitePayment=true, webViewPayment=false
    // 3. TON Connect + TON币: useWebsitePayment=false, tonCoinPayment=true
    // 4. TON Connect + USDT: useWebsitePayment=false, tonCoinPayment=false (暂时禁用)
    private useWebsitePayment: boolean = true;
    private webViewPayment: boolean = true;
    private tonCoinPayment: boolean = true;

    // 购买状态管理（复刻 Level.ts 的购买 VIP 逻辑）
    private waitingPurchase: number = 0;
    private hide: boolean = false;
    private currentPurchaseIdentifier: number = 0;



    start() {
        this.generalUI.updateDisplay();
        
        // 默认隐藏结果标签
        if (this.resultLabel && this.resultLabel.node) {
            this.resultLabel.node.active = false;
        }
        
        // 默认隐藏 WebView
        if (this.webViewNode) {
            this.webViewNode.active = false;
        }
        
        // 默认隐藏关闭按钮，显示返回按钮
        if (this.closeWebViewButton) {
            this.closeWebViewButton.node.active = false;
        }
        if (this.backButton) {
            this.backButton.node.active = true;
        }
        
        // 如果没有指定 WebView 组件，尝试从节点获取
        if (!this.webView && this.webViewNode) {
            this.webView = this.webViewNode.getComponent(WebView);
        }
        
        // 绑定关闭按钮事件
        if (this.closeWebViewButton) {
            this.closeWebViewButton.node.on(Button.EventType.CLICK, this.closeWebView, this);
        }
        
        // 初始化支付方式选择状态
        this.updatePaymentMethodSelection();
        
        director.preloadScene("Menu");
        this.initTopup();
    }


    initTopup(){
        for(let index=0;index<Manager.topupBaseData.data.length;index++){
            let topupContentInstance = instantiate(this.topupContentPrefab);
            let topupContentData=Manager.topupBaseData.data[index];
            let topupContentComponent = topupContentInstance.getComponent(TopupContent);
            topupContentComponent.topup=this;
            topupContentComponent.identifier=index+1;
            topupContentComponent.sprite.spriteFrame=this.spriteFrames[index];
            topupContentComponent.typeLabel.string=topupContentData.type;
            // 格式化数字，每3位数用逗号分隔
            const formattedQuantity = topupContentData.quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            topupContentComponent.quantityLabel.string="X"+formattedQuantity;
            topupContentComponent.priceLabel.string=topupContentData.priceUsdt.toString()+" USDT";
            this.contentNode.addChild(topupContentInstance);
        }
    }

    update(deltaTime: number) {
        // 处理 WebView 延迟隐藏（复刻 Level.ts）
        if (this.hide) {
            this.waitingPurchase -= deltaTime;
            if (this.waitingPurchase <= 0) {
                this.hide = false;
                if (this.webViewNode) {
                    this.webViewNode.active = false;
                }
            }
        }
    }

    async purchase(topupContent:TopupContent){
        Sound.instance.buttonAudio.play();
        
        // 更新结果标签
        const updateResult = (text: string) => {
            if (this.resultLabel) {
                this.resultLabel.string = text;
                // 有内容时显示，无内容时隐藏
                if (this.resultLabel.node) {
                    this.resultLabel.node.active = text && text.trim().length > 0;
                }
            }
            console.log(text); // 同时输出到控制台（如果有的话）
        };
        
        //this.purchaseWithTONUSDT(topupContent, updateResult);

        //this.purchaseWithTONUSDT(topupContent, updateResult);
        if(Manager.TGEnvironment)
        {
            this.purchaseWithTON(topupContent, updateResult);
        }
        else{
            this.purchaseWithPrivy(topupContent, updateResult);
        }
        
        //if(Manager.TGEnvironment)
        // //{

        
        //     const tonpay = TonPay.getInstance();
        //     if (tonpay) {
        //         // 充值 10 USDT，套餐ID 为 1
        //         tonpay.rechargeUSDT(
        //             0.01,  // 金额
        //             1,   // 套餐ID（可选）
        //             updateResult
        //         );
        //     }


            //this.purchaseWithTON(topupContent, updateResult);
        //}
        //else{
        //    this.purchaseWithXLayer(topupContent, updateResult);
        //}
        
        // 根据支付方式选择（4种组合）
        //if (this.useWebsitePayment) {
        //    // 官网支付（X Layer）
        //    this.purchaseWithXLayer(topupContent, updateResult);
        //} else {
        //    // TON Connect 支付
        //    if (this.tonCoinPayment) {
        //        // TON币支付
        //        this.purchaseWithTON(topupContent, updateResult);
        //    } else {
        //        // TON链USDT支付（暂时禁用）
        //        updateResult("TON链USDT支付功能暂时不可用");
        //    }
        //}
    }

    // 打开官网支付（使用 WebView 内嵌）
    purchaseWithXLayer(topupContent: TopupContent, updateResult: (text: string) => void) {
        const packageId = topupContent.identifier;
        const accessToken = Manager.accessToken;
        
        if (!accessToken) {
            updateResult("错误: 未找到 accessToken，请先登录");
            return;
        }
        const identifier = randomRangeInt(1000000000,9999999999);
        this.currentPurchaseIdentifier = identifier;
        //const url = `https://xdiving.io?identifier=${identifier}&packageId=${packageId}&accessToken=${encodeURIComponent(accessToken)}`;

        const url='https://game.xdiving.io/privy-connnect'

        // 使用 WebView 内嵌显示（复刻 Level.ts 的购买 VIP 逻辑）
        if (this.webView && this.webViewNode && this.webViewPayment) {
            
            // 显示 WebView 节点
            this.webViewNode.active = true;
            
            this.webView.node.active=true;
            // 加载 URL
            this.webView.url = url;
            
            // 显示关闭按钮，隐藏返回按钮
            if (this.closeWebViewButton) {
                this.closeWebViewButton.node.active = true;
            }
            if (this.backButton) {
                this.backButton.node.active = false;
            }
            
            // 设置等待购买状态（复刻 Level.ts）
            this.waitingPurchase = 2;
            this.hide = false;
            
            // 使用Manager管理订单查询（504时立即切换到poll接口持续查询）
            Manager.getInstance().startOrderQuery(
                identifier,
                packageId,
                (data) => {
                    // 订单查询成功，更新UI（如果界面还在）
                    this.purchaseSuccess(data, topupContent, updateResult);
                },
                (error) => {
                    // 订单查询失败（非504错误），显示错误（如果界面还在）
                    console.log("购买订单查询失败:", error);
                    updateResult("订单查询失败: " + (error?.toString() || String(error)));
                }
            );
            
            updateResult(`正在加载支付页面...\n套餐ID: ${packageId}\n订单号: ${identifier}`);
        } else {
            // 如果没有 WebView，回退到打开外部链接
            this.openWebsiteLink(url);
        }
    }

    // 购买成功处理（复刻 Level.ts 的 purchaseSuccess）
    // 注意：Manager已经更新了数据，这里只负责更新UI（如果界面还在）
    private purchaseSuccess(data: any, topupContent: TopupContent, updateResult: (text: string) => void) {
        if (data.data && data.data.status == "COMPLETED") {
            // 购买成功，更新UI显示
            updateResult(`购买成功！\n套餐ID: ${topupContent.identifier}\n订单号: ${this.currentPurchaseIdentifier}`);
            
            // 更新UI显示（Manager已经更新了数据）
            if (this.generalUI) {
                this.generalUI.updateDisplay();
            }
        } else {
            // 购买未完成或失败
            updateResult(`订单状态: ${data.data?.status || "未知"}\n订单号: ${this.currentPurchaseIdentifier}`);
        }
        
        // 隐藏 WebView（复刻 Level.ts：设置 waitingPurchase=0，然后调用 hideWebView）
        this.waitingPurchase = 0;
        this.hideWebView();
    }
    
    openWebsiteLink(url:string){
        const updateResult = (text: string) => {
            if (this.resultLabel) {
                this.resultLabel.string = text;
                // 有内容时显示，无内容时隐藏
                if (this.resultLabel.node) {
                    this.resultLabel.node.active = text && text.trim().length > 0;
                }
            }
            console.log(text); // 同时输出到控制台（如果有的话）
        };

        try {
            if (sys.openURL) {
                sys.openURL(url);
            } else if (window.open) {
                window.open(url, '_blank');
            } else {
                updateResult("错误: 无法打开链接");
                return;
            }
        } catch (error) {
            updateResult("打开链接失败: " + (error?.toString() || String(error)));
        }
    }

    openWebsite() {
        this.openWebsiteLink(`https://xdiving.io`);
    }

    // ========== 支付方式切换方法 ==========
    
    // 切换到：官网支付 + WebView
    selectWebViewPayment() {
        Sound.instance.buttonAudio.play();
        this.useWebsitePayment = true;
        this.webViewPayment = true;
        this.updatePaymentMethodSelection();
    }

    // 切换到：官网支付 + 外链
    selectLinkPayment() {
        Sound.instance.buttonAudio.play();
        this.useWebsitePayment = true;
        this.webViewPayment = false;
        this.updatePaymentMethodSelection();
    }

    // 切换到：TON Connect + TON币
    selectTonCoinPayment() {
        Sound.instance.buttonAudio.play();
        this.useWebsitePayment = false;
        this.tonCoinPayment = true;
        this.updatePaymentMethodSelection();
    }

    // 切换到：TON Connect + USDT（暂时禁用）
    selectTonUSDTPayment() {
        // 暂时禁用，不执行任何操作
        // Sound.instance.buttonAudio.play();
        // this.useWebsitePayment = false;
        // this.tonCoinPayment = false;
        // this.updatePaymentMethodSelection();
    }

    // 更新支付方式选择UI（更新勾选框状态）
    private updatePaymentMethodSelection() {
        // 官网支付 + WebView
        if (this.webViewPaymentNode) {
            this.webViewPaymentNode.active = (this.useWebsitePayment && this.webViewPayment);
        }
        
        // 官网支付 + 外链
        if (this.linkPaymentNode) {
            this.linkPaymentNode.active = (this.useWebsitePayment && !this.webViewPayment);
        }
        
        // TON Connect + TON币
        if (this.tonCoinNode) {
            this.tonCoinNode.active = (!this.useWebsitePayment && this.tonCoinPayment);
        }
        
        if (this.tonUSDTNode) {
            this.tonUSDTNode.active =  (!this.useWebsitePayment && !this.tonCoinPayment);
        }
    }

    // 关闭 WebView（复刻 Level.ts 的 closeWebView）
    closeWebView() {
        Sound.instance.buttonAudio.play();
        this.hideWebView();
    }

    // 隐藏 WebView（复刻 Level.ts 的 hideWebView）
    private hideWebView() {
        Sound.instance.buttonAudio.play();
        // 停止当前订单查询（如果还在查询中）
        if (this.currentPurchaseIdentifier) {
            Manager.getInstance().stopOrderQuery(this.currentPurchaseIdentifier);
        }
        
        // 复刻 Level.ts：直接设置 active
        if (this.closeWebViewButton) {
            this.closeWebViewButton.node.active = false;
        }
        if (this.webView && this.webView.node) {
            this.webView.node.active = false;
            this.webView.url = "";
        }
        this.hide = true;
        // 注意：不设置 waitingPurchase，让它继续使用之前设置的值（在 purchaseWithXLayer 中设置为 2）
        
        // 隐藏结果标签
        if (this.resultLabel && this.resultLabel.node) {
            this.resultLabel.node.active = false;
        }
        // 显示返回按钮
        if (this.backButton) {
            this.backButton.node.active = true;
        }
    }

    // 使用 TON 链 USDT支付
    private async purchaseWithTONUSDT(topupContent: TopupContent, updateResult: (text: string) => void) {
        updateResult("Purchase: " + topupContent.identifier);
        
        // 检查钱包连接（与 purchaseWithTON 完全一致）
        const manager = Manager.getInstance();
        if (!manager || !manager.isWalletConnected()) {
            updateResult("请先连接钱包");
            
            console.log("请先连接钱包");
            this.connectWallet();
            return;
        }
        
        // 获取充值套餐信息
        const topupData = Manager.topupBaseData.data[topupContent.identifier - 1];
        const amount = topupData.priceUsdt; // USDT 金额
        
        console.log("开始发送USDT交易"+amount);
        // USDT Jetton 主合约地址（TON 链上的 USDT）
        const usdtJettonMaster = "0x779ded0c9e1022225f8e0630b35a9b54be713736";
        const receiveAddress = "UQCe7p44GCOIZOntT9yZ1nqC-FFRvCKmezvCVasgiw3kWq5k"; // 收款地址
        
        // 发送 USDT Jetton 转账
        try {
            // 获取钱包地址（与 purchaseWithTON 一致，不提前返回）
            const walletAddress = manager.getWalletAddress();

            updateResult("正在获取 USDT Jetton 钱包地址...");
            
            // 获取用户的 USDT Jetton 钱包地址
            const userJettonWalletAddress = await this.getUserJettonWalletAddress(walletAddress || "", usdtJettonMaster);
            if (!userJettonWalletAddress) {
                updateResult("错误: 无法获取用户的 USDT Jetton 钱包地址。\n请确保钱包中已持有 USDT Jetton。");
                return;
            }

            updateResult("正在发送 USDT 交易...");
            
            // USDT 在 TON 链上使用 6 位小数
            // 例如：1 USDT = 1,000,000 最小单位
            const usdtDecimals = 6;
            const amountInSmallestUnit = Math.floor(amount * Math.pow(10, usdtDecimals));
            
            // 构建 USDT Jetton 转账交易
            // Jetton 转账需要向用户的 Jetton 钱包发送消息，而不是直接向收款地址发送
            const tx = {
                messages: [{
                    address: userJettonWalletAddress, // 用户的 Jetton 钱包地址
                    amount: "50000000", // 0.05 TON，用于支付 Gas 费用
                    payload: "" // Jetton 转账 payload（需要正确构建，这里先留空）
                }],
                validUntil: Math.floor(Date.now() / 1000) + 300 // 5分钟后过期
            };
            
            const result = await manager.sendTransaction(tx);
            
            // 获取充值信息
            if (result && result.boc) {
                let resultText = "========== 充值信息 ==========\n";
                resultText += "交易已发送成功！\n";
                resultText += "收款地址: " + receiveAddress + "\n";
                resultText += "充值金额: " + amount + " USDT\n";
                resultText += "充值套餐ID: " + topupContent.identifier + "\n";
                resultText += "充值套餐类型: " + topupData.type + "\n";
                resultText += "用户钱包地址: " + (walletAddress || "未知") + "\n";
                resultText += "USDT Jetton 钱包地址: " + userJettonWalletAddress + "\n";
                resultText += "交易boc: " + result.boc + "\n";
                resultText += "交易哈希: " + (result.hash || "解析中...") + "\n";
                
                // 解析交易哈希
                resultText += "\n正在解析交易哈希...\n";
                updateResult(resultText);
                
                const txHash = await manager.parseTransactionHash(result.boc);
                if (txHash) {
                    resultText += "交易哈希: " + txHash + "\n";
                    resultText += "交易查看: https://tonscan.org/tx/" + txHash + "\n";
                } else {
                    resultText += "提示: 交易哈希解析中，可能需要等待几秒钟后查询地址交易历史\n";
                }
                
                resultText += "==============================";
                updateResult(resultText);
            } else {
                updateResult("交易结果异常: " + JSON.stringify(result));
            }
        } catch (error) {
            updateResult("发送交易失败: " + (error?.toString() || String(error)));
        }
    }

    /**
     * 获取用户的 USDT Jetton 钱包地址
     * 每个用户在 TON 链上对于每个 Jetton 都有一个独立的钱包地址
     */
    private async getUserJettonWalletAddress(userAddress: string, jettonMaster: string): Promise<string | null> {
        try {
            // 方法1: 通过 TON API 查询用户的 Jetton 钱包地址
            // 使用 tonapi.io 查询用户的 Jetton 余额，从中找到 USDT Jetton 钱包地址
            const response = await fetch(
                `https://tonapi.io/v2/accounts/${encodeURIComponent(userAddress)}/jettons`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.balances && Array.isArray(data.balances)) {
                    // 查找 USDT Jetton
                    const usdtJetton = data.balances.find((jetton: any) => {
                        return jetton.jetton && 
                               jetton.jetton.address === jettonMaster;
                    });
                    
                    if (usdtJetton && usdtJetton.wallet_address) {
                        return usdtJetton.wallet_address.address;
                    }
                }
            }

            // 方法2: 如果 API 查询失败，尝试通过后端 API 计算 Jetton 钱包地址
            // Jetton 钱包地址可以通过用户地址和 Jetton Master 地址计算出来
            try {
                const backendResponse = await fetch(`https://api.xdiving.io/api/ton/jetton-wallet-address`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        userAddress: userAddress,
                        jettonMaster: jettonMaster 
                    })
                });
                
                if (backendResponse.ok) {
                    const backendData = await backendResponse.json();
                    if (backendData.walletAddress) {
                        console.log("通过后端 API 获取到 Jetton 钱包地址:", backendData.walletAddress);
                        return backendData.walletAddress;
                    }
                }
            } catch (backendError) {
                console.warn("后端 API 获取 Jetton 钱包地址失败:", backendError);
            }

            // 方法3: 如果以上都失败，返回 null
            console.warn("无法获取 Jetton 钱包地址，用户可能需要先持有 USDT 或联系后端支持");
            return null;
        } catch (error) {
            console.error("获取 Jetton 钱包地址失败:", error);
            return null;
        }
    }
    private async purchaseWithPrivy(topupContent: TopupContent, updateResult: (text: string) => void) {
        updateResult("Purchase: " + topupContent.identifier);
        
        // 获取充值套餐信息
        const topupData = Manager.topupBaseData.data[topupContent.identifier - 1];
        
        // 获取 PrivyLoad 实例
        const privyLoad = PrivyLoad.getInstance();
        if (!privyLoad) {
            updateResult("错误: PrivyLoad 未初始化");
            return;
        }
        
        // 检查 WebView 是否配置
        if (!this.privyWebView) {
            updateResult("错误: Privy WebView 未配置");
            return;
        }
        
        // 显示 WebView 节点（如果存在）
        if (this.webViewPaymentNode) {
            this.webViewPaymentNode.active = true;
        }
        
        // 打开充值页面并传递套餐ID（传递 Topup 场景的 privyWebView，模仿 Entry 的方式）
        privyLoad.openDepositPage(topupContent.identifier, (result) => {
            if (result.success) {
                // 充值成功
                let resultText = "========== 充值信息 ==========\n";
                resultText += "充值成功！\n";
                resultText += "交易哈希: " + (result.txHash || "N/A") + "\n";
                resultText += "充值金额: " + (result.amount || topupData.priceUsdt.toString()) + " USDT\n";
                resultText += "充值套餐ID: " + topupContent.identifier + "\n";
                resultText += "充值套餐类型: " + topupData.type + "\n";
                resultText += "========== 充值信息 ==========";
                updateResult(resultText);
                
                // 如果奖励已发放，更新 UI
                if (result.rewardsGranted && this.generalUI) {
                    this.generalUI.updateDisplay();
                    console.log('Topup: 奖励已发放，UI已更新');
                }
                
                // 隐藏 WebView
                if (this.webViewPaymentNode) {
                    this.webViewPaymentNode.active = false;
                }
                if (this.privyWebView && this.privyWebView.node) {
                    this.privyWebView.node.active = false;
                }
            } else {
                // 充值失败
                updateResult("充值失败: " + (result.error || "未知错误"));
                
                // 隐藏 WebView
                if (this.webViewPaymentNode) {
                    this.webViewPaymentNode.active = false;
                }
                if (this.privyWebView && this.privyWebView.node) {
                    this.privyWebView.node.active = false;
                }
            }
        }, this.privyWebView);
    }
    // 使用 TON Connect 支付toncoin
    private async purchaseWithTON(topupContent: TopupContent, updateResult: (text: string) => void) {
        updateResult("Purchase: " + topupContent.identifier);
        
        // 检查钱包连接
        const manager = Manager.getInstance();
        if (!manager || !manager.isWalletConnected()) {
            updateResult("请先连接钱包");
            this.connectWallet();
            return;
        }
        
        // 获取充值套餐信息
        const topupData = Manager.topupBaseData.data[topupContent.identifier - 1];
        const amount = topupData.priceUsdt; // USDT 金额
        
        // 测试：发送 TON 转账
        try {
            
            //const tbnbAddress = "0x7bcce2ec0495603e736da75bd564b45d38825839"; // TBNB测试地址
            //const usdtJettonMaster = "EQD0vdSA_NedR9uvbgO9EiefRV466c4YvEkOzkYwpewj1Vqo";
            //const usdtJettonMaster = "0x779ded0c9e1022225f8e0630b35a9b54be713736"; // USDT Jetton 主合约
            //const receiveAddress = "UQCe7p44GCOIZOntT9yZ1nqC-FFRvCKmezvCVasgiw3kWq5k";
            const receiveAddress = "UQDiN5m0Yky67vaeKWuMkQoqnz7ksxJcK0IVSCvEtm7cJYh1"; // TON测试收款地址
            
            
            updateResult("正在发送交易...");
            
            // 构建最简单的交易（先测试 TON 转账，USDT Jetton 需要更复杂的消息）
            const tx = {
                messages: [{
                    address: receiveAddress,
                    amount: "10000000" // 0.01 TON (9位小数，所以 0.01 * 1,000,000,000 = 10,000,000)
                }],
                validUntil: Math.floor(Date.now() / 1000) + 300 // 5分钟后过期
            };
            
            const result = await manager.sendTransaction(tx);
            
            // 获取充值信息
            if (result && result.boc) {
                let resultText = "========== 充值信息 ==========\n";
                resultText += "交易已发送成功！\n";
                resultText += "收款地址: " + receiveAddress + "\n";
                resultText += "充值金额: " + amount + " USDT (测试中发送 0.01 TON)\n";
                resultText += "充值套餐ID: " + topupContent.identifier + "\n";
                resultText += "充值套餐类型: " + topupData.type + "\n";
                resultText += "用户钱包地址: " + (manager.getWalletAddress() || "未知") + "\n";
                resultText += "交易boc: " + result.boc + "\n";
                resultText += "交易哈希: " + result.hash + "\n";
                
                // 解析交易哈希
                resultText += "\n正在解析交易哈希...\n";
                updateResult(resultText);
                
                const txHash = await manager.parseTransactionHash(result.boc);
                if (txHash) {
                    resultText += "交易哈希: " + txHash + "\n";
                    resultText += "交易查看: https://tonscan.org/tx/" + txHash + "\n";
                } else {
                    resultText += "提示: 交易哈希解析中，可能需要等待几秒钟后查询地址交易历史\n";
                }
                
                resultText += "==============================";
                updateResult(resultText);
            } else {
                updateResult("交易结果异常: " + JSON.stringify(result));
            }
        } catch (error) {
            updateResult("发送交易失败: " + (error?.toString() || String(error)));
        }
    }

    connectWallet(){
        Manager.getInstance().connectWallet();
    }

    // 复制结果信息到剪贴板
    copyResult(){
        Sound.instance.buttonAudio.play();
        if (!this.resultLabel || !this.resultLabel.string || !this.resultLabel.string.trim()) {
            return;
        }
        
        const text = this.resultLabel.string;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('复制成功');
                })
                .catch(err => {
                    console.error('复制失败，尝试备用方法: ', err);
                    this.fallbackCopyTextToClipboard(text);
                });
        } else {
            this.fallbackCopyTextToClipboard(text);
        }
    }

    // 备用复制方法
    fallbackCopyTextToClipboard(text: string) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('复制成功 (备用方法)');
            } else {
                console.error('备用复制方法失败');
            }
        } catch (err) {
            console.error('备用复制方法出错: ', err);
        }
        
        document.body.removeChild(textArea);
    }

    back(){
        Sound.instance.buttonAudio.play();
        // 如果 WebView 正在显示，先关闭它
        director.loadScene("Menu");
    }
}