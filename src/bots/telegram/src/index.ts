/**
 * SUI-FX Telegram Bot
 * Viral faucet distribution through Telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface FaucetConfig {
  apiUrl: string;
  apiKey: string;
  botToken: string;
}

class SuiFxTelegramBot {
  private bot: TelegramBot;
  private config: FaucetConfig;
  private userCooldowns: Map<number, number> = new Map();
  private COOLDOWN_MS = 3600000; // 1 hour

  constructor() {
    this.config = {
      apiUrl: process.env.FAUCET_API_URL || 'http://localhost:3001',
      apiKey: process.env.FAUCET_API_KEY || 'suifx-prod-key-2025-secure',
      botToken: process.env.TELEGRAM_BOT_TOKEN || ''
    };

    if (!this.config.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(this.config.botToken, { polling: true });
    this.setupCommands();
    this.setupHandlers();
  }

  private setupCommands() {
    // Set bot commands
    this.bot.setMyCommands([
      { command: 'start', description: '🚀 Welcome to SUI-FX Faucet' },
      { command: 'faucet', description: '💧 Request SUI tokens' },
      { command: 'balance', description: '💰 Check wallet balance' },
      { command: 'stats', description: '📊 Faucet statistics' },
      { command: 'help', description: '❓ Show help' }
    ]);
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🌊 **Welcome to SUI-FX Faucet Bot!**

🚀 Get free SUI testnet tokens instantly!

**Available Commands:**
💧 \`/faucet <wallet_address>\` - Request SUI tokens
💰 \`/balance <wallet_address>\` - Check wallet balance  
📊 \`/stats\` - View faucet statistics
❓ \`/help\` - Show this help

**Example:**
\`/faucet 0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d\`

⚡ Powered by SUI-FX
      `;

      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Faucet command
    this.bot.onText(/\/faucet(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const walletAddress = match?.[1]?.trim();

      if (!walletAddress) {
        this.bot.sendMessage(chatId, 
          '❌ Please provide a wallet address:\n\n' +
          '`/faucet 0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d`', 
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Check cooldown
      if (userId && this.isOnCooldown(userId)) {
        const remainingTime = this.getRemainingCooldown(userId);
        this.bot.sendMessage(chatId, 
          `⏰ Please wait ${Math.ceil(remainingTime / 60000)} minutes before requesting again.`
        );
        return;
      }

      await this.handleFaucetRequest(chatId, userId, walletAddress);
    });

    // Balance command
    this.bot.onText(/\/balance(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const walletAddress = match?.[1]?.trim();

      if (!walletAddress) {
        this.bot.sendMessage(chatId, 
          '❌ Please provide a wallet address:\n\n' +
          '`/balance 0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d`', 
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await this.handleBalanceCheck(chatId, walletAddress);
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      await this.handleStatsRequest(chatId);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🔧 **SUI-FX Faucet Bot Help**

**Commands:**
💧 \`/faucet <address>\` - Request 0.1 SUI tokens
💰 \`/balance <address>\` - Check wallet balance
📊 \`/stats\` - View faucet statistics
🚀 \`/start\` - Welcome message

**Limits:**
⏰ 1 request per hour per user
💧 0.1 SUI per request
🌐 Sui testnet only

**Need Support?**
Report issues: @suifx_support

⚡ Powered by SUI-FX
      `;

      this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  private async handleFaucetRequest(chatId: number, userId: number | undefined, walletAddress: string) {
    try {
      // Send loading message
      const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Processing your faucet request...');

      // Make API request to faucet
      const response = await axios.post(`${this.config.apiUrl}/api/v1/faucet/drop`, {
        address: walletAddress,
        network: 'sui-testnet'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey
        }
      });

      if (response.data.status === 'ok') {
        // Success
        const successMessage = `
✅ **Faucet Request Successful!**

💧 **Amount:** 0.1 SUI
🏦 **Address:** \`${walletAddress}\`
🔗 **Transaction:** \`${response.data.tx}\`
🌐 **Network:** ${response.data.network}

🎉 Tokens have been sent to your wallet!
        `;

        await this.bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown'
        });

        // Set cooldown
        if (userId) {
          this.setCooldown(userId);
        }
      } else {
        throw new Error(response.data.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Faucet request error:', error);
      
      let errorMessage = '❌ **Faucet Request Failed**\n\n';
      
      if (error.response?.status === 429) {
        errorMessage += '⏰ Rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage += '🔐 Authentication failed. Please try again.';
      } else if (error.response?.data?.message) {
        errorMessage += `💭 ${error.response.data.message}`;
      } else {
        errorMessage += '🛠️ Service temporarily unavailable. Please try again.';
      }

      this.bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
    }
  }

  private async handleBalanceCheck(chatId: number, walletAddress: string) {
    try {
      const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Checking wallet balance...');

      // In a real implementation, you'd call the Sui RPC
      // For now, we'll show a placeholder
      const balanceMessage = `
💰 **Wallet Balance**

🏦 **Address:** \`${walletAddress}\`
💎 **Balance:** Loading...
🌐 **Network:** Sui Testnet

💡 *Balance checking coming soon!*
      `;

      await this.bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Balance check error:', error);
      this.bot.sendMessage(chatId, '❌ Failed to check balance. Please try again.');
    }
  }

  private async handleStatsRequest(chatId: number) {
    try {
      const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Fetching faucet statistics...');

      // Get metrics from API
      const response = await axios.get(`${this.config.apiUrl}/api/v1/metrics`);
      const metrics = response.data.metrics;

      const statsMessage = `
📊 **SUI-FX Faucet Statistics**

**Today's Activity:**
💧 Drops: ${metrics.faucet.drops_today}
👥 Active Wallets: ${metrics.faucet.active_wallets}
✅ Success Rate: ${metrics.faucet.drops_success_rate}%

**Total Stats:**
🎯 Total Drops: ${metrics.faucet.drops_total}
❌ Errors: ${metrics.faucet.errors_total}
⏰ Rate Limited: ${metrics.faucet.rate_limited_requests}

**System Health:**
🖥️ Uptime: ${Math.floor(metrics.system.uptime_seconds / 3600)}h ${Math.floor((metrics.system.uptime_seconds % 3600) / 60)}m
💾 Memory: ${metrics.system.memory_usage_mb}MB
🌐 Blockchain: ${metrics.services.blockchain.status}

⚡ Powered by SUI-FX
      `;

      await this.bot.editMessageText(statsMessage, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Stats request error:', error);
      this.bot.sendMessage(chatId, '❌ Failed to fetch statistics. Please try again.');
    }
  }

  private isOnCooldown(userId: number): boolean {
    const lastRequest = this.userCooldowns.get(userId);
    if (!lastRequest) return false;
    return Date.now() - lastRequest < this.COOLDOWN_MS;
  }

  private getRemainingCooldown(userId: number): number {
    const lastRequest = this.userCooldowns.get(userId);
    if (!lastRequest) return 0;
    return this.COOLDOWN_MS - (Date.now() - lastRequest);
  }

  private setCooldown(userId: number): void {
    this.userCooldowns.set(userId, Date.now());
  }

  start() {
    console.log('🤖 SUI-FX Telegram Bot started!');
    console.log('🔗 API URL:', this.config.apiUrl);
    console.log('💬 Bot ready for commands...');
  }
}

// Start the bot
if (process.env.NODE_ENV !== 'test') {
  try {
    const bot = new SuiFxTelegramBot();
    bot.start();
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

export default SuiFxTelegramBot;
