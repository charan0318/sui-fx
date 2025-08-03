# 🌊 SUI-FX - Professional Sui Testnet Faucet

<p align="center">
  <img src="https://img.shields.io/badge/Sui-Testnet-4FC3F7?style=for-the-badge&logo=blockchain&logoColor=white" alt="Sui Testnet"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
</p>

<p align="center">
  <strong>Enterprise-grade Sui testnet faucet with modern web interface, Discord bot integration, and comprehensive developer tools.</strong>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-for-users">For Users</a> •
  <a href="#-for-developers">For Developers</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-discord-bot">Discord Bot</a>
</p>

---

## 🎯 What is SUI-FX?

SUI-FX is a **production-ready testnet faucet** for the Sui blockchain ecosystem, designed for both end-users and developers. Whether you're testing dApps, building integrations, or managing a development team, SUI-FX provides the tools and reliability you need.

### 🌟 Key Highlights

- **🚰 Instant Token Distribution** - Get SUI testnet tokens in seconds
- **🎨 Beautiful Web Interface** - Modern, responsive design with real-time feedback  
- **🤖 Discord Bot Integration** - Request tokens directly from Discord servers
- **🔒 Enterprise Security** - API authentication, rate limiting, and fraud protection
- **📊 Admin Dashboard** - Complete transaction history and analytics
- **🔧 Developer APIs** - RESTful endpoints with comprehensive documentation
- **📈 Multi-Tenant Support** - OAuth-style client registration for teams
- **🛡️ Production Ready** - SQLite database, monitoring, graceful fallbacks, and cloud deployment

---

## 🚀 Quick Start

### Option 1: Local Development
```bash
# Clone the repository
git clone https://github.com/charan0318/sui-fx.git
cd sui-fx

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the application
npm start
```

The application will be available at:
- **Web Interface**: http://localhost:5173
- **API**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3002/admin

### Option 2: Deploy to Render (Recommended for Production)
1. Fork this repository
2. Connect your GitHub to [Render.com](https://render.com)
3. Create a new **Web Service** from your forked repo
4. Set the following in Render:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables** (see below)
5. Deploy! 🚀

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# API Security (Required)
API_KEY=your-secure-api-key-here
JWT_SECRET=your-jwt-secret-for-admin-auth

# Admin Access (Required)  
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Server Configuration (Render sets PORT automatically)
PORT=3002
NODE_ENV=production
```

### Optional Environment Variables

```bash
# Sui Wallet (enables direct transactions instead of using official faucet)
SUI_PRIVATE_KEY=suiprivkey1...

# Redis (for enhanced rate limiting and caching)
REDIS_URL=redis://localhost:6379

# Discord Bot Integration
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-application-id
```

---

## 🏗️ Architecture

### Simple & Clean Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: SQLite (auto-creates tables, no setup required)
- **Cache**: In-memory (with optional Redis upgrade)
- **Deployment**: Native Node.js (no Docker needed)

### Database Schema
The application automatically creates all required SQLite tables:
- `transactions` - Faucet transaction history
- `faucet_metrics` - Daily usage statistics  
- `settings` - Application configuration
- `api_clients` - Multi-tenant API access (optional)

---

## 👥 For Users

### 🌐 Web Interface
Visit the web interface to:
- Request SUI testnet tokens instantly
- View real-time transaction status
- Check faucet statistics and uptime
- Access API documentation

### 🤖 Discord Bot
Add the SUI-FX bot to your Discord server:
- Use `/faucet <address>` to request tokens
- Get instant feedback with transaction links
- Perfect for development teams and communities

---

## 🔧 For Developers

### 📡 REST API
Complete RESTful API with:
- Token distribution endpoints
- Transaction history
- Real-time statistics  
- Health monitoring
- Rate limiting & authentication

### 🔑 API Authentication
```bash
# Get tokens via API
curl -X POST https://your-faucet.onrender.com/api/v1/faucet/request \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"walletAddress": "0x..."}'
```

### 📊 Multi-Tenant Support
- Register API clients for teams
- Per-client rate limiting
- Usage analytics and monitoring
- OAuth-style client management

---

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Backend only
cd packages/backend && npm run dev

# Frontend only  
cd packages/frontend && npm run dev
```

### Building for Production
```bash
# Build everything
npm run build

# Build backend only
cd packages/backend && npm run build

# Build frontend only
cd packages/frontend && npm run build
```

### Testing
```bash
# Run tests
npm test

# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test
```

---

## 📚 API Reference

### Core Endpoints

#### Request Tokens
```http
POST /api/v1/faucet/request
Content-Type: application/json
X-API-Key: your-api-key

{
  "walletAddress": "0x64char_sui_address"
}
```

#### Get Statistics  
```http
GET /api/v1/stats
```

#### Health Check
```http
GET /api/v1/health
```

### Admin Endpoints

#### Login
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

#### Transaction History
```http
GET /api/v1/admin/transactions
Authorization: Bearer <jwt-token>
```

For complete API documentation, visit `/api/v1/docs` on your running instance.

---

## 🤖 Discord Bot

### Setup
1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and get the token
3. Set `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in your environment
4. Invite the bot to your server with appropriate permissions

### Commands
- `/faucet <address>` - Request SUI testnet tokens
- `/status` - Check faucet status and statistics
- `/help` - Get help and usage instructions

---

## 🔒 Security Features

- **Rate Limiting**: IP and wallet-based limits
- **API Authentication**: Secure API key validation
- **Input Validation**: Address format verification
- **Request Logging**: Complete audit trail
- **Admin Authentication**: JWT-based admin access
- **Graceful Degradation**: Continues working even if optional services fail

---

## 📈 Monitoring & Analytics

- **Real-time Statistics**: Live transaction counts and success rates
- **Performance Metrics**: Response times and uptime tracking
- **Daily Metrics**: Historical usage data and trends
- **Health Monitoring**: Service status and connectivity checks
- **Admin Dashboard**: Comprehensive analytics and management tools

---

## 🚀 Deployment

### Render.com (Recommended)
1. Fork this repository
2. Connect to Render.com
3. Create a Web Service
4. Set environment variables
5. Deploy!

### Other Platforms
SUI-FX works on any Node.js hosting platform:
- Heroku
- Vercel  
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`  
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/charan0318/sui-fx/issues)
- **Discord**: Join our community server for support
- **Documentation**: Visit `/api/v1/docs` for complete API reference

---

<p align="center">
  <strong>Built with ❤️ for the Sui blockchain community</strong>
</p>

<p align="center">
  <a href="https://sui.io">Sui</a> •
  <a href="https://render.com">Render</a> •
  <a href="https://discord.com">Discord</a>
</p>
