// ============================================
// ⚠️ 未激活的代码 - 仅供参考
// ============================================
// TON USDT 充值服务
// 用于处理充值订单创建、支付、交易监听等功能
// 注意：此文件当前未激活，仅作为参考代码保留
// 如需使用，需要更新以适配新的组件结构（TelegramWalletManager）
// ============================================

import { TelegramWalletTest } from './telegram-wallet-test';
import { Manager } from '../Manager';

/**
 * 充值订单状态
 */
export enum RechargeOrderStatus {
    PENDING = 'pending',      // 等待支付
    PAID = 'paid',            // 已支付
    EXPIRED = 'expired',      // 已过期
    FAILED = 'failed',        // 支付失败
    CONFIRMED = 'confirmed'   // 已确认（后端已处理）
}

/**
 * 充值订单信息
 */
export interface RechargeOrder {
    orderId: string;           // 订单号
    topupId: number;           // 充值套餐ID
    amount: number;            // USDT 金额
    receiveAddress: string;    // 收款地址
    userAddress: string;       // 用户钱包地址
    userId: number;            // 用户ID
    status: RechargeOrderStatus; // 订单状态
    expireTime: number;        // 过期时间（时间戳）
    txHash?: string;           // 交易哈希（支付后）
    paidAmount?: number;       // 实际支付金额
    paidTime?: number;         // 支付时间（时间戳）
    createdAt: number;         // 创建时间（时间戳）
}

/**
 * 充值服务类
 */
export class RechargeService {
    private static instance: RechargeService | null = null;
    private currentOrder: RechargeOrder | null = null;
    private checkInterval: number | null = null;
    private walletTest: TelegramWalletTest | null = null;

    private constructor() {}

    public static getInstance(): RechargeService {
        if (!RechargeService.instance) {
            RechargeService.instance = new RechargeService();
        }
        return RechargeService.instance;
    }

    /**
     * 设置钱包测试组件引用
     */
    public setWalletTest(walletTest: TelegramWalletTest) {
        this.walletTest = walletTest;
    }

    /**
     * 创建充值订单
     * @param topupId 充值套餐ID（对应 TopupContent.identifier）
     * @param amount USDT 金额
     * @returns 订单信息
     */
    public async createOrder(topupId: number, amount: number): Promise<RechargeOrder> {
        if (!this.walletTest || !this.walletTest.isWalletConnected()) {
            throw new Error('请先连接钱包');
        }

        const walletAddress = this.walletTest.getWalletAddress();
        if (!walletAddress) {
            throw new Error('无法获取钱包地址');
        }

        const userId = Manager.userData?.data?.userId;
        if (!userId) {
            throw new Error('用户未登录');
        }

        // 调用后端 API 创建订单
        return new Promise((resolve, reject) => {
            const orderData = {
                userId: userId,
                topupId: topupId,
                amount: amount,
                walletAddress: walletAddress
            };

            Manager.getInstance().post(
                'https://api.xdiving.io/api/topup/create-order',
                orderData,
                (data: any) => {
                    const order: RechargeOrder = {
                        orderId: data.orderId || data.data?.orderId,
                        topupId: topupId,
                        amount: data.amount || data.data?.amount || amount,
                        receiveAddress: data.receiveAddress || data.data?.receiveAddress,
                        userAddress: walletAddress,
                        userId: userId,
                        status: RechargeOrderStatus.PENDING,
                        expireTime: data.expireTime || data.data?.expireTime || (Date.now() + 30 * 60 * 1000), // 默认30分钟
                        createdAt: Date.now()
                    };

                    this.currentOrder = order;
                    this.startOrderStatusCheck(); // 开始监听订单状态
                    resolve(order);
                },
                (error: string) => {
                    reject(new Error(`创建订单失败: ${error}`));
                }
            );
        });
    }

    /**
     * 查询订单状态
     * @param orderId 订单号（可选，如果不提供则查询当前订单）
     */
    public async checkOrderStatus(orderId?: string): Promise<RechargeOrder | null> {
        const targetOrderId = orderId || this.currentOrder?.orderId;
        if (!targetOrderId) {
            return null;
        }

        return new Promise((resolve, reject) => {
            Manager.getInstance().get(
                `https://api.xdiving.io/api/topup/order-status?orderId=${targetOrderId}`,
                (data: any) => {
                    const orderData = data.data || data;
                    const order: RechargeOrder = {
                        orderId: orderData.orderId,
                        topupId: orderData.topupId || this.currentOrder?.topupId || 0,
                        amount: orderData.amount,
                        receiveAddress: orderData.receiveAddress || this.currentOrder?.receiveAddress || '',
                        userAddress: orderData.userAddress || this.currentOrder?.userAddress || '',
                        userId: orderData.userId || this.currentOrder?.userId || 0,
                        status: orderData.status as RechargeOrderStatus,
                        expireTime: orderData.expireTime,
                        txHash: orderData.txHash,
                        paidAmount: orderData.paidAmount,
                        paidTime: orderData.paidTime,
                        createdAt: orderData.createdAt || this.currentOrder?.createdAt || Date.now()
                    };

                    // 更新当前订单状态
                    if (this.currentOrder && this.currentOrder.orderId === order.orderId) {
                        this.currentOrder = order;
                    }

                    resolve(order);
                },
                (error: string) => {
                    reject(new Error(`查询订单状态失败: ${error}`));
                }
            );
        });
    }

    /**
     * 发送 USDT 支付交易
     * @param order 订单信息
     */
    public async sendPayment(order: RechargeOrder): Promise<string> {
        if (!this.walletTest || !this.walletTest.isWalletConnected()) {
            throw new Error('请先连接钱包');
        }

        // 检查订单是否过期
        if (Date.now() > order.expireTime) {
            throw new Error('订单已过期，请重新创建订单');
        }

        // 检查订单状态
        if (order.status !== RechargeOrderStatus.PENDING) {
            throw new Error(`订单状态错误: ${order.status}`);
        }

        // 使用 TON Connect 发送 USDT Jetton 转账
        // 注意：这需要 TON Connect SDK 支持 Jetton Transfer
        // 如果 SDK 不支持，需要手动构建交易
        
        // 这里提供一个示例，实际实现需要根据 TON Connect SDK 的 API
        try {
            // USDT Jetton 主合约地址
            const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
            
            // 计算转账金额（USDT 使用 6 位小数）
            const amountNano = Math.floor(order.amount * 1000000).toString();
            
            // 构建 Jetton Transfer 交易
            // 注意：这需要根据实际的 TON Connect SDK API 来实现
            // 以下是伪代码示例
            
            const gameFi = (this.walletTest as any).gameFi;
            if (!gameFi) {
                throw new Error('GameFi SDK 未初始化');
            }

            // 如果 SDK 支持 sendTransaction 方法
            if (typeof gameFi.sendTransaction === 'function') {
                const transaction = {
                    to: order.receiveAddress,
                    value: '0', // Jetton 转账 value 为 0
                    data: this.buildJettonTransferData(order.receiveAddress, amountNano)
                };

                const result = await gameFi.sendTransaction(transaction);
                return result.txHash || result.hash;
            }

            // 如果 SDK 不支持，需要手动构建交易
            throw new Error('当前 SDK 不支持 Jetton Transfer，需要手动实现');
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`发送支付交易失败: ${errorMsg}`);
        }
    }

    /**
     * 构建 Jetton Transfer 数据（简化版本）
     * 注意：完整的实现需要使用 @ton/core 库
     */
    private buildJettonTransferData(destination: string, amount: string): string {
        // 这里需要构建 Jetton Transfer 的 Cell
        // 完整的实现需要使用 @ton/core 库
        // 以下是伪代码
        
        // Jetton Transfer 消息结构：
        // - query_id: uint64
        // - amount: Coins
        // - destination: Address
        // - response_destination: Address (可选)
        // - custom_payload: Cell (可选)
        // - forward_ton_amount: Coins
        // - forward_payload: Cell (可选)
        
        // 由于需要 TON 库，这里返回空字符串
        // 实际实现时需要使用 @ton/core 构建 Cell
        console.warn('buildJettonTransferData 需要 TON 库支持，当前返回空数据');
        return '';
    }

    /**
     * 开始监听订单状态（定期查询）
     */
    private startOrderStatusCheck() {
        if (this.checkInterval) {
            return; // 已经在监听
        }

        // 每 5 秒查询一次订单状态
        this.checkInterval = setInterval(() => {
            if (!this.currentOrder) {
                this.stopOrderStatusCheck();
                return;
            }

            // 检查订单是否过期
            if (Date.now() > this.currentOrder.expireTime) {
                this.currentOrder.status = RechargeOrderStatus.EXPIRED;
                this.stopOrderStatusCheck();
                return;
            }

            // 查询订单状态
            this.checkOrderStatus().then(order => {
                if (order) {
                    // 如果订单已支付或已确认，停止监听
                    if (order.status === RechargeOrderStatus.PAID || 
                        order.status === RechargeOrderStatus.CONFIRMED) {
                        this.stopOrderStatusCheck();
                    }
                }
            }).catch(error => {
                console.error('查询订单状态失败:', error);
            });
        }, 5000) as any; // TypeScript 类型转换
    }

    /**
     * 停止监听订单状态
     */
    private stopOrderStatusCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * 获取当前订单
     */
    public getCurrentOrder(): RechargeOrder | null {
        return this.currentOrder;
    }

    /**
     * 清除当前订单
     */
    public clearCurrentOrder() {
        this.stopOrderStatusCheck();
        this.currentOrder = null;
    }

    /**
     * 格式化订单剩余时间
     */
    public getRemainingTime(order: RechargeOrder): string {
        const remaining = order.expireTime - Date.now();
        if (remaining <= 0) {
            return '已过期';
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const secondsStr = seconds < 10 ? '0' + seconds : seconds.toString();
        return `${minutes}:${secondsStr}`;
    }
}

