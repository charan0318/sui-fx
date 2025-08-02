# 🌊 SUI-FX - Professional Sui Testnet Faucet

<p align="center">
  <img src="https://img.shields.io/badge/Sui-Testnet-4FC3F7?style=for-the-badge&logo=blockchain&logoColor=white" alt="Sui Testnet"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
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

## � What is SUI-FX?

SUI-FX is a **production-ready testnet faucet** for the Sui blockchain ecosystem, designed for both end-users and developers. Whether you're testing dApps, building integrations, or managing a development team, SUI-FX provides the tools and reliability you need.

### 🌟 Key Highlights

- **🚰 Instant Token Distribution** - Get SUI testnet tokens in seconds
- **🎨 Beautiful Web Interface** - Modern, responsive design with real-time feedback  
- **🤖 Discord Bot Integration** - Request tokens directly from Discord servers
- **� Enterprise Security** - API authentication, rate limiting, and fraud protection
- **📊 Admin Dashboard** - Complete transaction history and analytics
- **🔧 Developer APIs** - RESTful endpoints with comprehensive documentation
- **📈 Multi-Tenant Support** - OAuth-style client registration for teams
- **🛡️ Production Ready** - Docker, monitoring, graceful fallbacks, and scaling

## � For Users

### 🌐 Web Interface
Access the beautiful web interface at your deployed URL to:
- **Request Testnet Tokens** - Simply paste your Sui wallet address
- **Real-time Validation** - Instant feedback on address format and eligibility
- **Transaction Status** - Track your request with live updates
- **Rate Limit Info** - See when you can request tokens again

### 🤖 Discord Integration
Join servers with SUI-FX bot for seamless token requests:
```
/faucet 0x1a2b3c... - Request tokens directly in Discord
/status - Check your current limits and faucet status
/help - Get help and usage information
```

### 💰 Token Limits & Rate Limits
- **Amount per Request**: 1 SUI token (configurable by admin)
- **Rate Limit**: 1 request per wallet address per hour
- **IP-based Limit**: 50 requests per IP per hour
- **Discord Rate Limit**: Same limits apply across all interfaces

### 🔍 Track Your Transactions
- All transactions are logged and can be viewed in the admin dashboard
- Transaction hashes are provided for blockchain verification
- Request history shows timestamps and status

---

## 👨‍💻 For Developers

### 🚀 Quick Integration

#### REST API
```bash
# Request tokens via API
curl -X POST https://your-faucet-url/api/v1/faucet/request \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1a2b3c4d5e6f..."}'
```

#### JavaScript/TypeScript
```typescript
const response = await fetch('https://your-faucet-url/api/v1/faucet/request', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: '0x1a2b3c4d5e6f...'
  })
});

const result = await response.json();
```

#### Python
```python
import requests

response = requests.post(
    'https://your-faucet-url/api/v1/faucet/request',
    headers={
        'X-API-Key': 'your-api-key',
        'Content-Type': 'application/json'
    },
    json={'walletAddress': '0x1a2b3c4d5e6f...'}
)

result = response.json()
```

### 🔑 API Authentication

#### 1. Register Your Application
```bash
curl -X POST https://your-faucet-url/api/v1/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My DApp",
    "homepage_url": "https://mydapp.com",
    "description": "My awesome Sui application"
  }'
```

#### 2. Get Your API Key
Visit the registration form at `/api/v1/clients/register/form` or use the API response to get your unique API key.

#### 3. Use Your API Key
Replace the default key with your registered API key for usage tracking and higher rate limits.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/charan0318/sui-fx.git
cd sui-fx

# Start with Docker Compose
docker-compose up -d

# Access the application
# Web Interface: http://localhost:3000
# API: http://localhost:3001
# Admin Dashboard: http://localhost:3001/admin
```

### Option 2: Manual Setup
```bash
# Clone and install dependencies
git clone https://github.com/charan0318/sui-fx.git
cd sui-fx
npm install

# Configure environment
cd packages/backend
cp .env.example .env
# Edit .env with your settings

# Build and run
npm run build
npm start

# Or run from project root
cd ../..
npm run start
```

### 🔧 Environment Configuration
Copy `packages/backend/.env.example` to `.env` and configure:

```bash
# Required: API Security
API_KEY=your-secure-api-key-here
JWT_SECRET=your-jwt-secret-for-admin-auth

# Required: Admin Access
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Optional: Sui Wallet (enables direct transactions)
SUI_PRIVATE_KEY=suiprivkey1...  # Without this, uses official Sui faucet

# Optional: Enhanced Features
DATABASE_URL=postgresql://user:pass@localhost:5432/suifx  # Transaction history
REDIS_URL=redis://localhost:6379  # Better rate limiting & caching

# Optional: Discord Bot Integration
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
```

---

## 🤖 Discord Bot

### Features
- **Slash Commands** - Modern Discord interface with `/faucet`, `/status`, and `/help`
- **Rate Limiting** - Same limits as web interface, shared across platforms
- **Admin Commands** - Server admin tools for managing bot and viewing stats
- **Auto Monitoring** - Health checks and error reporting

### Setup Discord Bot
1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application and bot
   - Copy Bot Token and Client ID

2. **Configure Environment**
   ```bash
   # Add to your .env file
   DISCORD_TOKEN=your-bot-token-here
   DISCORD_CLIENT_ID=your-client-id-here
   ```

3. **Deploy Commands & Start Bot**
   ```bash
   cd packages/discord-bot
   npm install
   npm run deploy-commands  # Register slash commands
   npm start               # Start the bot
   ```

4. **Invite Bot to Server**
   - Use Discord's OAuth2 URL generator
   - Required permissions: Send Messages, Use Slash Commands
   - Bot will auto-register commands when added

### Discord Commands
```
/faucet <address>     - Request SUI testnet tokens
/status              - Check faucet status and your limits  
/help                - Show available commands and help

# Admin only (requires Administrator permission)
/admin stats         - View detailed faucet statistics
/admin health        - Check system health status
/admin clear-limits  - Clear rate limits for users
```

---

## 📖 API Reference

### Core Endpoints

#### 🚰 Request Tokens
```http
POST /api/v1/faucet/request
Content-Type: application/json
X-API-Key: your-api-key

{
  "walletAddress": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SUI tokens sent successfully",
  "data": {
    "transactionHash": "0xabc123...",
    "amount": 1000000000,
    "recipient": "0x1a2b3c...",
    "network": "testnet",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### 🔍 Health Check
```http
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "services": {
      "sui": "connected",
      "database": "connected", 
      "redis": "connected"
    },
    "wallet_balance": "1.5 SUI",
    "network": "testnet",
    "uptime": "2d 14h 32m"
  }
}
```

#### 📊 System Status
```http
GET /api/v1/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "faucet_mode": "wallet",
    "requests_today": 1247,
    "total_distributed": "15,432 SUI",
    "average_response_time": "1.2s",
    "rate_limits": {
      "per_wallet": "1/hour",
      "per_ip": "50/hour"
    }
  }
}
```

### Authentication Endpoints

#### 🔐 Admin Login
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-admin-password"
}
```

#### 📋 Register API Client
```http
POST /api/v1/clients/register
Content-Type: application/json

{
  "name": "My DApp",
  "homepage_url": "https://mydapp.com",
  "description": "Description of your application"
}
```

### Admin Endpoints (Requires JWT Token)

#### 📈 Transaction History
```http
GET /api/v1/admin/transactions?page=1&limit=50
Authorization: Bearer your-jwt-token
```

#### 📊 Analytics Dashboard
```http
GET /api/v1/admin/dashboard
Authorization: Bearer your-jwt-token
```

### Error Responses
All endpoints return consistent error formats:

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 45 minutes.",
  "data": {
    "retry_after": 2700,
    "limit_type": "wallet_address"
  }
}
```

**Common Error Codes:**
- `INVALID_ADDRESS` - Wallet address format invalid
- `RATE_LIMIT_EXCEEDED` - Too many requests  
- `INSUFFICIENT_BALANCE` - Faucet wallet empty
- `NETWORK_ERROR` - Blockchain connection issues
- `UNAUTHORIZED` - Invalid or missing API key

---

## 🏗️ Architecture & Technical Details

### System Architecture
```
    ┌─────────────────────────────────────────────────────────────┐
    │                    SUI-FX Faucet System                     │
    └─────────────────────────┬───────────────────────────────────┘
                              │
    ┌─────────────────────────┼───────────────────────────────────┐
    │          Frontend       │           Backend API             │
    │                         │                                   │
    │  ┌─────────────────┐   │   ┌─────────────────────────────┐ │
    │  │  React Web UI   │   │   │     Express Server          │ │
    │  │  - Modern UI    │───┼──▶│     - REST APIs             │ │
    │  │  - Real-time    │   │   │     - Rate Limiting         │ │
    │  │  - Validation   │   │   │     - Authentication        │ │
    │  └─────────────────┘   │   └─────────────────────────────┘ │
    │                         │                 │                 │
    │  ┌─────────────────┐   │   ┌─────────────────────────────┐ │
    │  │  Discord Bot    │   │   │     Sui Blockchain          │ │
    │  │  - Slash        │───┼──▶│     - Wallet Integration    │ │
    │  │    Commands     │   │   │     - Transaction Signing   │ │
    │  │  - Admin Tools  │   │   │     - Official Faucet       │ │
    │  └─────────────────┘   │   └─────────────────────────────┘ │
    └─────────────────────────┼───────────────────────────────────┘
                              │
    ┌─────────────────────────┼───────────────────────────────────┐
    │       Data Layer        │        External Services          │
    │                         │                                   │
    │  ┌─────────────────┐   │   ┌─────────────────────────────┐ │
    │  │  PostgreSQL     │   │   │     Sui Network RPC         │ │
    │  │  - Transactions │   │   │     - testnet.sui.io        │ │
    │  │  - User Data    │   │   │     - Custom RPC URLs       │ │
    │  │  - Analytics    │   │   └─────────────────────────────┘ │
    │  └─────────────────┘   │                                   │
    │                         │   ┌─────────────────────────────┐ │
    │  ┌─────────────────┐   │   │     Official Sui Faucet     │ │
    │  │  Redis Cache    │   │   │     - Fallback Mode         │ │
    │  │  - Rate Limits  │   │   │     - SDK Integration       │ │
    │  │  - Sessions     │   │   └─────────────────────────────┘ │
    │  └─────────────────┘   │                                   │
    └─────────────────────────┴───────────────────────────────────┘
```

### Dual-Mode Operation
1. **🏦 Wallet Mode** (Primary)
   - Direct blockchain transactions using funded wallet
   - Full control over transaction parameters
   - Custom amount and gas settings
   - Real-time balance monitoring

2. **🔄 SDK Mode** (Fallback)
   - Uses official Sui faucet when wallet unavailable
   - Automatic failover if wallet issues occur
   - Standard faucet amounts and limits
   - Zero configuration required

### Graceful Degradation
- **Redis Unavailable** → In-memory rate limiting
- **Database Unavailable** → Continue without transaction history
- **Wallet Issues** → Automatic SDK mode fallback
- **Network Issues** → Retry logic with exponential backoff

---

## 📁 Project Structure

```
sui-fx/
├── 📦 packages/
│   ├── 🖥️ backend/                 # Node.js API Server
│   │   ├── src/
│   │   │   ├── routes/             # API endpoints (/faucet, /admin, /health)
│   │   │   ├── services/           # Business logic (sui, database, redis)
│   │   │   ├── middleware/         # Auth, rate limiting, CORS
│   │   │   ├── config/             # Environment configuration
│   │   │   └── utils/              # Logging, validation helpers
│   │   ├── .env.example            # Environment template
│   │   └── package.json
│   │
│   ├── 🎨 frontend/                # React Web Interface  
│   │   ├── client/
│   │   │   ├── src/
│   │   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── pages/          # Main pages (home, admin, docs)
│   │   │   │   ├── services/       # API integration
│   │   │   │   └── utils/          # Frontend utilities
│   │   │   └── public/             # Static assets
│   │   └── server/                 # Vite dev server config
│   │
│   └── 🤖 discord-bot/             # Discord Integration
│       ├── src/
│       │   ├── commands/           # Slash commands (/faucet, /status)
│       │   ├── services/           # Bot logic and API integration
│       │   └── utils/              # Discord utilities
│       └── package.json
│
├── 🐳 docker-compose.yml           # Local development environment
├── 📋 Dockerfile                   # Production container
├── 🔧 package.json                 # Root package manager
│
├── 📚 docs/                        # Comprehensive documentation
│   ├── DEPLOYMENT_GUIDE.md         # Production deployment
│   ├── GITHUB_SECRETS_SETUP.md     # CI/CD configuration
│   ├── SSL_SETUP.md                # HTTPS configuration
│   └── TROUBLESHOOTING.md          # Common issues
│
├── 📊 monitoring/                  # Observability stack
│   ├── prometheus.yml              # Metrics collection
│   ├── alert_rules.yml             # Alert configuration
│   └── grafana/                    # Dashboard configs
│
├── 🔒 nginx/                       # Reverse proxy configs
│   ├── nginx.conf                  # Production config
│   └── nginx-ssl.conf              # SSL/TLS config
│
├── 🛠️ scripts/                     # Utility scripts
│   ├── setup.sh                    # Initial setup
│   ├── init-db.sql                 # Database initialization
│   └── devops/                     # Deployment scripts
│
└── 📄 Documentation Files
    ├── README.md                   # This comprehensive guide
    ├── API_DOCUMENTATION.md        # Complete API reference
    ├── SECURITY.md                 # Security best practices
    └── LICENSE                     # MIT License
```

---

## ⚙️ Configuration

### 🔐 Security Configuration
```bash
# API Authentication
API_KEY=your-super-secure-api-key-here           # Primary API key for faucet requests
JWT_SECRET=your-jwt-secret-for-admin-auth        # JWT signing secret (256-bit recommended)

# Admin Panel Access  
ADMIN_USERNAME=admin                             # Admin dashboard username
ADMIN_PASSWORD=your-very-secure-password         # Strong password for admin access
```

### 🌊 Sui Blockchain Configuration
```bash
# Network Settings
SUI_NETWORK=testnet                              # Network: testnet, devnet, mainnet
SUI_RPC_URL=https://fullnode.testnet.sui.io/    # Custom RPC endpoint (optional)

# Wallet Mode (Optional - enables direct transactions)
SUI_PRIVATE_KEY=suiprivkey1...                  # Sui wallet private key
FAUCET_AMOUNT=1000000000                        # Amount per request (in MIST, 1 SUI = 1B MIST)

# Rate Limiting
RATE_LIMIT_PER_WALLET=1                         # Requests per wallet per hour
RATE_LIMIT_PER_IP=50                            # Requests per IP per hour
RATE_LIMIT_WINDOW_MS=3600000                    # Rate limit window (1 hour in ms)
```

### 💾 Database Configuration
```bash
# PostgreSQL (Optional - enables transaction history)
DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_POOL_SIZE=10                                 # Connection pool size
DB_SSL=true                                     # Enable SSL connections

# SQLite (Alternative - for single instance)
DATABASE_URL=sqlite:./faucet.db                # SQLite file path
```

### ⚡ Redis Configuration
```bash
# Redis (Optional - enables enhanced rate limiting and caching)
REDIS_URL=redis://localhost:6379               # Redis connection string
REDIS_TTL=3600                                 # Default TTL for cache entries (seconds)
REDIS_PASSWORD=your-redis-password             # Redis password (if required)
```

### 🤖 Discord Bot Configuration
```bash
# Discord Integration
DISCORD_TOKEN=your-discord-bot-token           # Bot token from Discord Developer Portal
DISCORD_CLIENT_ID=your-discord-client-id      # Application client ID
DISCORD_GUILD_ID=your-server-id               # Specific server ID (optional)
```

### 🚀 Server Configuration
```bash
# Application Settings
PORT=3001                                      # Server port
NODE_ENV=production                            # Environment: development, production
LOG_LEVEL=info                                 # Logging level: error, warn, info, debug

# CORS Settings
CORS_ORIGIN=https://your-frontend-domain.com   # Allowed origins for CORS
TRUSTED_PROXIES=1                              # Number of trusted proxy servers

# Health Check
HEALTH_CHECK_INTERVAL=30000                    # Health check interval (ms)
```

---

## � Deployment Options

### 🐳 Docker Deployment (Recommended)

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  faucet:
    image: sui-fx:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - API_KEY=${API_KEY}
      - SUI_PRIVATE_KEY=${SUI_PRIVATE_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=suifx
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
volumes:
  postgres_data:
```

### ☁️ Cloud Deployment

#### AWS ECS with Terraform
```bash
# Initialize and deploy infrastructure
cd terraform/
terraform init
terraform plan -var-file="environments/production.tfvars"
terraform apply -var-file="environments/production.tfvars"
```

#### Manual Cloud Setup
1. **Container Registry**: Push Docker image to ECR/Docker Hub
2. **Database**: Set up RDS PostgreSQL instance  
3. **Cache**: Configure ElastiCache Redis cluster
4. **Load Balancer**: Set up ALB with health checks
5. **Auto Scaling**: Configure ECS service with auto scaling
6. **Monitoring**: Set up CloudWatch logs and metrics

### 🖥️ VPS/Dedicated Server
```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm postgresql redis-server nginx

# Clone and setup
git clone https://github.com/charan0318/sui-fx.git
cd sui-fx
npm install

# Configure environment
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your settings

# Build and start
npm run build
sudo npm install -g pm2
pm2 start ecosystem.config.js

# Setup reverse proxy (nginx)
sudo ln -s /path/to/sui-fx/nginx/nginx.conf /etc/nginx/sites-enabled/sui-fx
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Analytics

### 🔍 Health Monitoring
- **Health Endpoint**: `/api/v1/health` - Service status and dependencies
- **Metrics Endpoint**: `/api/v1/metrics` - Prometheus format metrics
- **Admin Dashboard**: Real-time system status and analytics

### 📈 Key Metrics Tracked
- **Request Metrics**: Total requests, success rate, response times
- **Faucet Metrics**: Tokens distributed, wallet balance, failed transactions
- **System Metrics**: CPU, memory, database connections, cache hit ratio
- **User Metrics**: Active users, rate limit hits, geographic distribution

### 🚨 Alerting
Configure alerts for:
- Faucet wallet balance below threshold
- High error rate (>5% in 5 minutes)
- Response time degradation (>5s average)
- Service unavailability
- Database connection issues

### 📊 Grafana Dashboard
Import the provided dashboard from `monitoring/grafana/` for:
- Real-time request monitoring
- Faucet usage analytics  
- System performance metrics
- Error tracking and debugging

---

## �📚 Documentation

- [API Client Management](./API_CLIENT_MANAGEMENT.md) - OAuth-style client registration system
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [GitHub Secrets Setup](./docs/GITHUB_SECRETS_SETUP.md) - Configure required secrets
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [API Documentation](http://localhost:3001/docs) - Interactive Swagger UI (when running)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](./docs/) directory
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately to security@yourdomain.com
