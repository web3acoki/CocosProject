// USDT 余额查询测试脚本
// 用于测试 TON 区块链上的 USDT Jetton 余额查询功能
import { _decorator, Component, Button, Label, Node } from 'cc';
import { TelegramWalletTest } from './telegram-wallet-test';
const { ccclass, property } = _decorator;

@ccclass('USDTBalanceTest')
export class USDTBalanceTest extends Component {
    
    @property(Button)
    checkBalanceBtn: Button = null;
    
    @property(Label)
    balanceLabel: Label = null;
    
    @property(Label)
    statusLabel: Label = null;
    
    @property(TelegramWalletTest)
    walletTest: TelegramWalletTest = null;

    async start() {
        // 绑定按钮事件
        if (this.checkBalanceBtn) {
            this.checkBalanceBtn.node.on('click', this.checkBalance, this);
        }
        
        // 初始化状态
        if (this.statusLabel) {
            this.statusLabel.string = '等待连接...';
        }
        
        if (this.balanceLabel) {
            this.balanceLabel.string = '--';
        }
    }

    /**
     * 查询 USDT 余额
     */
    async checkBalance() {
        if (!this.walletTest) {
            this.updateStatus('错误: 未找到 TelegramWalletTest 组件');
            return;
        }

        // 检查钱包是否连接
        if (!this.walletTest.isWalletConnected()) {
            this.updateStatus('请先连接钱包');
            if (this.balanceLabel) {
                this.balanceLabel.string = '--';
            }
            return;
        }

        const walletAddress = this.walletTest.getWalletAddress();
        if (!walletAddress) {
            this.updateStatus('错误: 无法获取钱包地址');
            return;
        }

        this.updateStatus('查询中...');
        if (this.balanceLabel) {
            this.balanceLabel.string = '查询中...';
        }

        try {
            // 查询 USDT 余额
            const usdtBalance = await this.getUSDTBalance(walletAddress);
            
            if (usdtBalance !== null) {
                this.updateStatus('查询成功');
                if (this.balanceLabel) {
                    this.balanceLabel.string = `${usdtBalance} USDT`;
                }
            } else {
                this.updateStatus('未找到 USDT 余额');
                if (this.balanceLabel) {
                    this.balanceLabel.string = '0 USDT';
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.updateStatus(`查询失败: ${errorMsg}`);
            if (this.balanceLabel) {
                this.balanceLabel.string = '查询失败';
            }
            console.error('查询 USDT 余额失败:', error);
        }
    }

    /**
     * 查询 USDT 余额（TON 上的 Jetton）
     * @param walletAddress 钱包地址
     * @returns USDT 余额（字符串格式，单位：USDT，例如 "100.5"）
     */
    private async getUSDTBalance(walletAddress: string): Promise<string | null> {
        try {
            // USDT Jetton 主合约地址（TON 主网）
            const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
            
            // 使用 TON API 查询余额
            // 方法1: 使用 tonapi.io（推荐）
            const apiUrl = `https://tonapi.io/v2/accounts/${walletAddress}/jettons`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 查找 USDT Jetton
            if (data.balances && Array.isArray(data.balances)) {
                for (const balance of data.balances) {
                    // 检查是否是 USDT
                    const jettonAddress = balance.jetton?.address;
                    if (jettonAddress) {
                        // 检查地址是否匹配（支持完整地址或部分匹配）
                        const isUSDT = jettonAddress.includes(USDT_JETTON_MASTER) || 
                                      jettonAddress.toLowerCase().includes('usdt') ||
                                      (balance.jetton?.symbol === 'USDT');
                        
                        if (isUSDT) {
                            // 转换余额（从 nano 单位转换为 USDT）
                            // USDT 使用 6 位小数（1 USDT = 1,000,000 nano）
                            const balanceNano = balance.balance || '0';
                            const balanceNum = parseFloat(balanceNano);
                            const balanceUSDT = balanceNum / 1000000;
                            return balanceUSDT.toFixed(6);
                        }
                    }
                }
            }
            
            // 如果没有找到 USDT，返回 0
            return '0';
            
        } catch (error) {
            console.error('查询 USDT 余额失败:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            
            // 如果 tonapi.io 失败，尝试使用备用 API
            try {
                return await this.getUSDTBalanceFallback(walletAddress);
            } catch (fallbackError) {
                console.error('备用 API 也失败:', fallbackError);
                throw new Error(`查询 USDT 余额失败: ${errorMsg}`);
            }
        }
    }

    /**
     * 备用方法：使用 toncenter.com API 查询 USDT 余额
     */
    private async getUSDTBalanceFallback(walletAddress: string): Promise<string> {
        // 使用 toncenter.com API（需要 API key，这里使用公共端点）
        // 注意：公共端点可能有速率限制
        const apiUrl = `https://toncenter.com/api/v2/getAddressInformation?address=${walletAddress}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`备用 API 请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // toncenter.com 不直接提供 Jetton 余额，需要调用 Jetton 合约
        // 这里返回 0，建议使用 tonapi.io
        console.warn('toncenter.com 不直接支持 Jetton 余额查询，返回 0');
        return '0';
    }

    /**
     * 查询 TON 主币余额（可选功能）
     */
    async checkTONBalance() {
        if (!this.walletTest || !this.walletTest.isWalletConnected()) {
            this.updateStatus('请先连接钱包');
            return;
        }

        const walletAddress = this.walletTest.getWalletAddress();
        if (!walletAddress) {
            this.updateStatus('错误: 无法获取钱包地址');
            return;
        }

        this.updateStatus('查询 TON 余额中...');

        try {
            // 使用 TON API 查询余额
            const apiUrl = `https://tonapi.io/v2/accounts/${walletAddress}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 转换余额（从 nanoTON 转换为 TON）
            // 1 TON = 1,000,000,000 nanoTON
            const balanceNano = data.balance || '0';
            const balanceNum = parseFloat(balanceNano);
            const balanceTON = balanceNum / 1000000000;
            
            this.updateStatus('查询成功');
            if (this.balanceLabel) {
                this.balanceLabel.string = `${balanceTON.toFixed(9)} TON`;
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.updateStatus(`查询失败: ${errorMsg}`);
            console.error('查询 TON 余额失败:', error);
        }
    }

    /**
     * 更新状态标签
     */
    private updateStatus(message: string) {
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
        console.log(`[USDT Balance Test] ${message}`);
    }

    onDestroy() {
        // 清理事件监听
        if (this.checkBalanceBtn) {
            this.checkBalanceBtn.node.off('click', this.checkBalance, this);
        }
    }
}

