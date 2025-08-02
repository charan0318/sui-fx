# SUI-FX Telegram Bot

🤖 **Viral Telegram bot for SUI-FX faucet distribution**

## Features

- **Instant Token Drops**: `/faucet <address>` command
- **Balance Checking**: `/balance <address>` command  
- **Real-time Stats**: `/stats` command with live metrics
- **User Cooldowns**: 1-hour rate limiting per user
- **Error Handling**: Comprehensive error messages
- **Viral Design**: Easy sharing and user engagement

## Commands

- `/start` - Welcome message with instructions
- `/faucet <wallet_address>` - Request 0.1 SUI tokens
- `/balance <wallet_address>` - Check wallet balance
- `/stats` - View faucet statistics
- `/help` - Show help information

## Setup

1. **Create Telegram Bot**:
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get your bot token

2. **Install Dependencies**:
   ```bash
   cd src/bots/telegram
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your bot token
   ```

4. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `FAUCET_API_URL` - SUI-FX API URL (default: http://localhost:3001)
- `FAUCET_API_KEY` - API key for faucet access

## Integration

The bot integrates with your SUI-FX backend:
- Uses `/api/v1/faucet/drop` for token requests
- Uses `/api/v1/metrics` for statistics
- Handles rate limiting and error responses

## Viral Features

- **Share-friendly**: Easy wallet address validation
- **Instant feedback**: Real-time transaction hashes
- **Social proof**: Public statistics and success rates
- **Gamification**: Cooldowns and limits create urgency
