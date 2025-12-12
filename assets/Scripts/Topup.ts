import { _decorator, Component, director, instantiate, Node, Prefab, SpriteFrame, find, Label, sys, WebView, Button, randomRangeInt } from 'cc';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { TopupContent } from './TopupContent';
import { Manager } from './Manager';
import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';
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
        
        // 根据支付方式选择（4种组合）
        if (this.useWebsitePayment) {
            // 官网支付（X Layer）
            this.purchaseWithXLayer(topupContent, updateResult);
        } else {
            // TON Connect 支付
            if (this.tonCoinPayment) {
                // TON币支付
                this.purchaseWithTON(topupContent, updateResult);
            } else {
                // TON链USDT支付（暂时禁用）
                updateResult("TON链USDT支付功能暂时不可用");
            }
        }
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
        const url = `https://xdiving.io?identifier=${identifier}&packageId=${packageId}&accessToken=${encodeURIComponent(accessToken)}`;

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

    // 使用 TON Connect 支付
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
            const receiveAddress = "UQDiN5m0Yky67vaeKWuMkQoqnz7ksxJcK0IVSCvEtm7cJYh1"; // TON测试收款地址
            //const usdtJettonMaster = "0x779ded0c9e1022225f8e0630b35a9b54be713736"; // USDT Jetton 主合约
            const tbnbAddress = "0x7bcce2ec0495603e736da75bd564b45d38825839"; // TBNB测试地址
            
            
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