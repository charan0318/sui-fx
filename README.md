# 🌊 SUI-FX - Production-Ready Sui Testnet Faucet

<p align="center">
  <img src="https://img.shields.io/badge/Sui-Testnet-4FC3F7?style=for-the-badge&logo=blockchain&logoColor=white" alt="Sui Testnet"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/24%2F7-Zero%20Downtime-00C851?style=for-the-badge" alt="Zero Downtime"/>
</p>

<p align="center">
  <strong>Enterprise-grade Sui testnet faucet with zero downtime, professional UX, and comprehensive developer tools.</strong>
</p>

<p align="center">
  <a href="https://suifx.onrender.com">🚀 Live Demo</a> •
  <a href="https://suifx.onrender.com/docs">📖 API Docs</a> •
  <a href="https://suifx.onrender.com/admin">⚡ Admin Panel</a> •
  <a href="#-quick-start">Quick Start</a>
</p>

---

## 🎯 What is SUI-FX?

SUI-FX is a **production-ready testnet faucet** for the Sui blockchain ecosystem with enterprise-grade features. Built for reliability, scalability, and professional user experience - perfect for developers, teams, and blockchain communities.

### 🌟 Production Features
- **⚡ Zero Downtime** - GitHub Actions keepalive ensures 24/7 availability on free hosting
- **🎨 Professional UX** - Intelligent error handling converts technical messages to user-friendly text
- **📊 Real-time Monitoring** - Built-in health checks, status dashboard, and comprehensive metrics
- **🔒 Enterprise Security** - JWT authentication, bcrypt hashing, and API key management
- **👥 Multi-Tenant API** - Professional API client registration with individual rate limits
- **💾 SQLite Database** - Fast, reliable local storage with automatic schema migrations
- **📱 Mobile-First Design** - Perfect responsive experience across all devices

### 🚀 Zero-Configuration Deployment
- **No Database Setup** - SQLite auto-creates and manages all tables
- **No Redis Required** - In-memory fallbacks ensure operation without external services
- **No Docker Needed** - Native Node.js deployment works anywhere
- **Auto-Migration** - Seamlessly handles database schema updates

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
- **Backend API**: http://localhost:3003
- **Admin Dashboard**: http://localhost:3003/admin

### Option 2: Deploy to Render (Recommended for Production)
1. Fork this repository
2. Connect your GitHub to [Render.com](https://render.com)
3. Create a new **Web Service** from your forked repo
4. Set the following in Render:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables** (see below)
5. Deploy! 🚀

**🔄 Zero Downtime Setup**: The included GitHub Actions workflow automatically keeps your Render deployment alive 24/7, preventing cold starts completely.

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
PORT=3003
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

### Modern & Reliable Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: SQLite with better-sqlite3 (auto-creates tables, no setup required)
- **Cache**: In-memory with optional Redis upgrade
- **Deployment**: Native Node.js (no Docker complexity)
- **Uptime**: GitHub Actions keepalive (24/7 zero downtime)

### Database Schema
The application automatically creates all required SQLite tables:
- `transactions` - Faucet transaction history with full audit trails
- `faucet_metrics` - Daily usage statistics and analytics
- `settings` - Application configuration and feature flags
- `api_clients` - Multi-tenant API access with individual rate limits

### Zero Downtime Solution
Our GitHub Actions workflow (`/.github/workflows/keepalive.yml`) automatically:
- Pings your deployment every 10 minutes
- Performs health checks on all critical endpoints
- Tests API functionality to ensure service quality
- Prevents cold starts on free hosting platforms

---

## 👥 For Users

### 🌐 Web Interface
Visit the web interface to:
- **Request SUI testnet tokens instantly** with professional error handling
- **View real-time transaction status** with detailed progress tracking
- **Check faucet statistics and uptime** with live service monitoring
- **Access comprehensive API documentation** with interactive examples

### 🤖 Discord Bot
Add the SUI-FX bot to your Discord server:
- Use `/faucet <address>` to request tokens directly in Discord
- Get instant feedback with transaction links and status updates
- Perfect for development teams and blockchain communities
- Built-in rate limiting prevents abuse while ensuring availability

---

## 🔧 For Developers

### 📡 Professional REST API
Complete RESTful API with enterprise features:
- **Token distribution endpoints** with intelligent rate limiting
- **Transaction history** with full audit trails and filtering
- **Real-time statistics** with comprehensive metrics
- **Health monitoring** with detailed service status
- **API client management** with OAuth-style authentication

### 🔑 API Authentication & Usage
```bash
# Register an API client (via web interface)
# Visit /api-clients to get your credentials

# Request tokens via API
curl -X POST https://suifx.onrender.com/api/v1/faucet/request \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"address": "0x64char_sui_address_here"}'

# Check service health
curl https://suifx.onrender.com/api/v1/health

# Monitor uptime (keepalive endpoint)
curl https://suifx.onrender.com/api/v1/keepalive
```

### 📊 Multi-Tenant Support
- **Register API clients** through the professional web interface
- **Individual rate limiting** per client with customizable limits
- **Usage analytics and monitoring** with detailed breakdowns
- **Client credential management** with secure key rotation

---

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers (auto-restart enabled)
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

# Backend only
cd packages/backend && npm run build

# Frontend only
cd packages/frontend && npm run build
```

### Professional Error Handling
The application includes intelligent error parsing that converts technical error messages into user-friendly text:
- Rate limit JSON responses → "Too many requests. Please wait before trying again."
- Network errors → "Connection issue. Please try again in a moment."
- Validation errors → Clear, actionable guidance for users

---

## 📚 API Reference

### Core Endpoints

#### Request Tokens
```http
POST /api/v1/faucet/request
Content-Type: application/json
X-API-Key: your-api-key

{
  "address": "0x64char_sui_address"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "amount": "1000000000",
  "suiExplorer": "https://suiexplorer.com/txblock/0x..."
}
```

**Response (Rate Limited):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "message": "You can request tokens again in 1 hour"
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

#### Keepalive (Zero Downtime)
```http
GET /api/v1/keepalive
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

#### Get All Transactions
```http
GET /api/v1/admin/transactions
Authorization: Bearer jwt-token
```

#### Dashboard Metrics
```http
GET /api/v1/admin/dashboard
Authorization: Bearer jwt-token
```

---

## 🚀 Deployment

### Render.com (Recommended)
1. Fork this repository
2. Connect to Render.com
3. Create a Web Service
4. Set environment variables
5. Deploy!

**✨ Automatic Zero Downtime**: The included GitHub Actions workflow keeps your deployment alive 24/7.

### Other Platforms
SUI-FX works on any Node.js hosting platform:
- Heroku
- Vercel  
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

### GitHub Actions Keepalive
The repository includes a professional uptime solution:
- **File**: `.github/workflows/keepalive.yml`
- **Schedule**: Every 10 minutes, 24/7
- **Features**: Health checks, API testing, automatic recovery
- **Cost**: Completely free using GitHub Actions

---

## 🔍 Monitoring & Health Checks

### Built-in Monitoring Endpoints
- **`/api/v1/health`** - Comprehensive service health status
- **`/api/v1/status`** - HTML dashboard for human-readable status
- **`/api/v1/keepalive`** - Uptime monitoring with system information
- **`/api/v1/metrics`** - Detailed metrics in JSON format

### Production Monitoring
The application provides enterprise-grade monitoring:
- **Request logging** with unique IDs for full traceability
- **Error tracking** with detailed stack traces and context
- **Performance metrics** including response times and throughput
- **Service health** monitoring for all critical components

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
- **Live Demo**: [https://suifx.onrender.com](https://suifx.onrender.com)
- **API Documentation**: [https://suifx.onrender.com/docs](https://suifx.onrender.com/docs)
- **Admin Panel**: [https://suifx.onrender.com/admin](https://suifx.onrender.com/admin)

---

<p align="center">
  <strong>Built with ❤️ for the Sui blockchain community</strong>
</p>

<p align="center">
  <a href="https://sui.io">Sui</a> •
  <a href="https://render.com">Render</a> •
  <a href="https://github.com/features/actions">GitHub Actions</a>
</p>
