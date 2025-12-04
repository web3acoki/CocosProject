import { _decorator, Component, director, instantiate, Node, Prefab, SpriteFrame, find, Label } from 'cc';
import { Sound } from './Sound';
import { GeneralUI } from './GeneralUI';
import { TopupContent } from './TopupContent';
import { Manager } from './Manager';
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

    start() {
        this.generalUI.updateDisplay();
        
        // 默认隐藏结果标签
        if (this.resultLabel && this.resultLabel.node) {
            this.resultLabel.node.active = false;
        }
        
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
        
        // 测试：发送 USDT 转账（最简版本）
        try {
            const receiveAddress = "0xcc4deb1fc9dc80996a0d06fcf66f37ec353c7645"; // 测试收款地址
            const usdtJettonMaster = "0x779ded0c9e1022225f8e0630b35a9b54be713736"; // USDT Jetton 主合约
            
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
        director.loadScene("Menu");
    }
}


