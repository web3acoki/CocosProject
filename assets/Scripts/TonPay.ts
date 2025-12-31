import { _decorator, Component, director } from 'cc';
import { Manager } from './Manager';
const { ccclass, property } = _decorator;

/**
 * TON 链 USDT 充值单例
 * 提供 TON 链上 USDT (Jetton) 充值功能
 * 
 * 使用示例：
 * ```typescript
 * // 在其他脚本中使用：
 * import { Tonpay, RechargeResult } from './Tonpay';
 * 
 * // 获取单例实例
 * const tonpay = Tonpay.getInstance();
 * if (tonpay) {
 *     // 充值 10 USDT，套餐ID 为 1
 *     tonpay.rechargeUSDT(
 *         10,  // 金额
 *         1,   // 套餐ID（可选）
 *         (result: RechargeResult) => {
 *             // 充值成功回调
 *             console.log("充值成功！");
 *             console.log("交易哈希:", result.transactionHash);
 *             console.log("浏览器查看:", result.explorerUrl);
 *         },
 *         (error: string) => {
 *             // 充值失败回调
 *             console.error("充值失败:", error);
 *         }
 *     );
 * }
 * ```
 */
@ccclass('TonPay')
export class TonPay extends Component {
    private static instance: TonPay | null = null;

    // USDT Jetton 主合约地址（TON 链上的 USDT）
    // 正式环境：EQD0vdSA_NedR9uvbgO9EiefRV466c4YvEkOzkYwpewj1Vqo
    // 测试环境：可根据实际情况修改
    private static readonly USDT_JETTON_MASTER: string = "EQD0vdSA_NedR9uvbgO9EiefRV466c4YvEkOzkYwpewj1Vqo";
    
    // 收款地址（游戏服务器地址）
    private static readonly RECEIVE_ADDRESS: string = "UQCe7p44GCOIZOntT9yZ1nqC-FFRvCKmezvCVasgiw3kWq5k";

    /**
     * 获取单例实例
     */
    public static getInstance(): TonPay | null {
        return TonPay.instance;
    }

    onLoad() {
        // 单例模式：确保只有一个实例
        if (TonPay.instance && TonPay.instance !== this) {
            this.node.destroy();
            return;
        }
        
        TonPay.instance = this;
        
        // 持久化节点，确保场景切换时不被销毁
        director.addPersistRootNode(this.node);
    }

    onDestroy() {
        if (TonPay.instance === this) {
            TonPay.instance = null;
        }
    }

    /**
     * 充值 USDT（供其他代码调用，模仿 purchaseWithTON 的风格）
     * @param amount USDT 金额（单位：USDT，例如 10.5 表示 10.5 USDT）
     * @param packageId 充值套餐ID（可选，用于记录）
     * @param updateResult 更新结果回调（用于显示充值信息，类似 purchaseWithTON 的 updateResult）
     */
    public async rechargeUSDT(
        amount: number,
        packageId?: number,
        updateResult?: (text: string) => void
    ): Promise<void> {
        // 默认的 updateResult 函数
        const defaultUpdateResult = (text: string) => {
            console.log(text);
        };
        const resultCallback = updateResult || defaultUpdateResult;

        resultCallback("充值 USDT: " + (packageId ? `套餐ID ${packageId}` : `金额 ${amount} USDT`));
        
        // 检查钱包连接
        const manager = Manager.getInstance();
        if (!manager || !manager.isWalletConnected()) {
            resultCallback("请先连接钱包");
            this.connectWallet();
            return;
        }
        
        // 获取充值信息
        let topupData: any = null;
        if (packageId && Manager.topupBaseData && Manager.topupBaseData.data) {
            topupData = Manager.topupBaseData.data[packageId - 1];
        }
        const usdtAmount = topupData ? topupData.priceUsdt : amount; // 如果有套餐数据，使用套餐价格，否则使用传入的金额
        
        // 发送 USDT Jetton 转账
        try {
            const receiveAddress = TonPay.RECEIVE_ADDRESS; // 收款地址
            
            resultCallback("正在发送 USDT 交易...");
            
            // 获取用户的 USDT Jetton 钱包地址
            const walletAddress = manager.getWalletAddress();
            if (!walletAddress) {
                resultCallback("错误: 无法获取钱包地址");
                return;
            }

            const userJettonWalletAddress = await this.getUserJettonWalletAddress(walletAddress);
            if (!userJettonWalletAddress) {
                resultCallback("错误: 无法获取用户的 USDT Jetton 钱包地址。\n请确保钱包中已持有 USDT Jetton。");
                return;
            }

            // USDT 在 TON 链上使用 6 位小数
            const usdtDecimals = 6;
            const amountInSmallestUnit = Math.floor(usdtAmount * Math.pow(10, usdtDecimals));
            
            // 构建 USDT Jetton 转账交易
            const tx = {
                messages: [{
                    address: userJettonWalletAddress, // 用户的 Jetton 钱包地址
                    amount: "50000000", // 0.05 TON，用于支付 Gas 费用
                    payload: this.buildJettonTransferPayload(
                        receiveAddress,
                        amountInSmallestUnit,
                        walletAddress
                    )
                }],
                validUntil: Math.floor(Date.now() / 1000) + 300 // 5分钟后过期
            };
            
            const result = await manager.sendTransaction(tx);
            
            // 获取充值信息
            if (result && result.boc) {
                let resultText = "========== 充值信息 ==========\n";
                resultText += "交易已发送成功！\n";
                resultText += "收款地址: " + receiveAddress + "\n";
                resultText += "充值金额: " + usdtAmount + " USDT\n";
                if (packageId) {
                    resultText += "充值套餐ID: " + packageId + "\n";
                    if (topupData) {
                        resultText += "充值套餐类型: " + topupData.type + "\n";
                    }
                }
                resultText += "用户钱包地址: " + (walletAddress || "未知") + "\n";
                resultText += "USDT Jetton 钱包地址: " + userJettonWalletAddress + "\n";
                resultText += "交易boc: " + result.boc + "\n";
                resultText += "交易哈希: " + (result.hash || "解析中...") + "\n";
                
                // 解析交易哈希
                resultText += "\n正在解析交易哈希...\n";
                resultCallback(resultText);
                
                const txHash = await manager.parseTransactionHash(result.boc);
                if (txHash) {
                    resultText += "交易哈希: " + txHash + "\n";
                    resultText += "交易查看: https://tonscan.org/tx/" + txHash + "\n";
                } else {
                    resultText += "提示: 交易哈希解析中，可能需要等待几秒钟后查询地址交易历史\n";
                }
                
                resultText += "==============================";
                resultCallback(resultText);
            } else {
                resultCallback("交易结果异常: " + JSON.stringify(result));
            }
        } catch (error) {
            resultCallback("发送交易失败: " + (error?.toString() || String(error)));
        }
    }

    /**
     * 构建 USDT Jetton 转账交易
     * @param amount USDT 金额
     * @param toAddress 收款地址
     * @param fromAddress 发送地址（钱包地址）
     */
    private async buildUSDTJettonTransaction(
        amount: number,
        toAddress: string,
        fromAddress: string
    ): Promise<any> {
        // USDT 在 TON 链上使用 6 位小数
        // 例如：1 USDT = 1,000,000 最小单位
        const usdtDecimals = 6;
        const amountInSmallestUnit = Math.floor(amount * Math.pow(10, usdtDecimals));
        
        // 获取用户的 USDT Jetton 钱包地址
        const userJettonWalletAddress = await this.getUserJettonWalletAddress(fromAddress);
        
        if (!userJettonWalletAddress) {
            throw new Error("无法获取用户的 USDT Jetton 钱包地址");
        }

        // 构建 Jetton 转账消息
        // 参考 TON 文档：https://docs.ton.org/develop/dapps/asset-processing/jettons
        // Jetton 转账需要向用户的 Jetton 钱包发送消息，而不是直接向收款地址发送
        const transaction = {
            messages: [
                {
                    address: userJettonWalletAddress, // 用户的 Jetton 钱包地址
                    amount: "50000000", // 0.05 TON，用于支付 Gas 费用
                    payload: this.buildJettonTransferPayload(
                        toAddress,
                        amountInSmallestUnit,
                        fromAddress
                    )
                }
            ],
            validUntil: Math.floor(Date.now() / 1000) + 300 // 5分钟后过期
        };

        return transaction;
    }

    /**
     * 获取用户的 USDT Jetton 钱包地址
     * 每个用户在 TON 链上对于每个 Jetton 都有一个独立的钱包地址
     * 地址计算公式：jetton_wallet_address = calculate_user_jetton_wallet_address(user_address, jetton_master_address)
     */
    private async getUserJettonWalletAddress(userAddress: string): Promise<string | null> {
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
                               jetton.jetton.address === TonPay.USDT_JETTON_MASTER;
                    });
                    
                    if (usdtJetton && usdtJetton.wallet_address) {
                        return usdtJetton.wallet_address.address;
                    }
                }
            }

            // 方法2: 如果查询失败，尝试通过后端 API 计算
            // 这里可以调用后端 API 来计算 Jetton 钱包地址
            // const backendResponse = await fetch(`YOUR_BACKEND_API/jetton-wallet-address`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ 
            //         userAddress: userAddress,
            //         jettonMaster: Tonpay.USDT_JETTON_MASTER 
            //     })
            // });
            // if (backendResponse.ok) {
            //     const data = await backendResponse.json();
            //     return data.walletAddress;
            // }

            // 方法3: 如果以上都失败，返回 null（需要用户先持有 USDT 才能获取钱包地址）
            console.warn("无法通过 API 获取 Jetton 钱包地址，用户可能需要先持有 USDT");
            return null;
        } catch (error) {
            console.error("获取 Jetton 钱包地址失败:", error);
            return null;
        }
    }

    /**
     * 构建 Jetton 转账负载
     * Jetton 转账消息格式：
     * - OP code: 0xf8a7ea5 (transfer)
     * - query_id: uint64
     * - amount: Coins (uint128)
     * - destination: MsgAddress
     * - response_destination: MsgAddress
     * - custom_payload: Maybe ^Cell
     * - forward_ton_amount: Coins (uint128)
     * - forward_payload: Either Cell ^Cell
     * 
     * 注意：由于 Cocos Creator 环境限制，这里提供一个基础实现
     * 实际使用时，建议：
     * 1. 使用 @ton/core 库构建 Cell
     * 2. 或者调用后端 API 来构建正确的交易消息
     */
    private buildJettonTransferPayload(
        destination: string,
        amount: number,
        responseDestination: string
    ): string {
        // 这是一个占位符实现
        // 实际实现需要使用 TON 库来构建正确的 Cell
        // 参考：https://github.com/ton-blockchain/token-contract/blob/main/ft/jetton-wallet.fc
        
        console.warn("buildJettonTransferPayload: 需要正确构建 Jetton 转账消息");
        console.log("参数:", { destination, amount, responseDestination });
        
        // 返回空字符串，表示使用默认负载
        // 实际实现中，这里应该返回正确编码的 Cell（使用 @ton/core 或类似库）
        // 示例代码（需要 @ton/core 库）：
        // const transferOp = 0xf8a7ea5;
        // const queryId = Date.now();
        // const cell = beginCell()
        //     .storeUint(transferOp, 32)
        //     .storeUint(queryId, 64)
        //     .storeCoins(amount)
        //     .storeAddress(Address.parse(destination))
        //     .storeAddress(Address.parse(responseDestination))
        //     .storeRef(null) // custom_payload
        //     .storeCoins(0) // forward_ton_amount
        //     .storeRef(null) // forward_payload
        //     .endCell();
        // return cell.toBoc().toString('base64');
        
        return "";
    }

    /**
     * 检查钱包是否已连接
     */
    public isWalletConnected(): boolean {
        const manager = Manager.getInstance();
        return manager ? manager.isWalletConnected() : false;
    }

    /**
     * 获取当前钱包地址
     */
    public getWalletAddress(): string | null {
        const manager = Manager.getInstance();
        return manager ? manager.getWalletAddress() : null;
    }

    /**
     * 连接钱包
     */
    public connectWallet(): void {
        const manager = Manager.getInstance();
        if (manager) {
            manager.connectWallet();
        }
    }
}

/**
 * 充值结果接口
 */
export interface RechargeResult {
    success: boolean;
    amount: number;
    packageId?: number;
    walletAddress: string;
    receiveAddress: string;
    transactionBoc: string;
    transactionHash: string;
    explorerUrl: string | null;
}
