# SUI-FX Production Deployment Script (PowerShell)
# Handles Priority 1 & 2 setup for production launch on Windows

param(
    [switch]$SkipRedis,
    [switch]$SkipPostgreSQL,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
SUI-FX Production Deployment Script

Usage: .\deploy-production.ps1 [options]

Options:
  -SkipRedis       Skip Redis installation
  -SkipPostgreSQL  Skip PostgreSQL setup  
  -Help           Show this help message

This script automates Priority 1 & 2 production setup:
- Infrastructure setup (Redis, PostgreSQL)
- Security configuration (API keys, passwords)
- Application building and process monitoring
"@ -ForegroundColor Cyan
    exit 0
}

Write-Host "🚀 SUI-FX Production Deployment Starting..." -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to generate secure password
function New-SecurePassword {
    param([int]$Length = 32)
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    $password = ''
    for ($i = 0; $i -lt $Length; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $password
}

# Check Node.js version
Write-Host "`n📋 Checking Node.js..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Install Node.js 18+ first" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node --version).TrimStart('v')
$requiredVersion = [version]"18.0.0"
$currentVersion = [version]$nodeVersion

if ($currentVersion -lt $requiredVersion) {
    Write-Host "❌ Node.js 18+ required. Current: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $nodeVersion validated" -ForegroundColor Green

# Setup Redis
if (-not $SkipRedis) {
    Write-Host "`n📦 Setting up Redis..." -ForegroundColor Yellow
    
    if (Test-Command "redis-server") {
        Write-Host "✅ Redis already installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis not found. Options:" -ForegroundColor Yellow
        Write-Host "   1. Download from: https://redis.io/download" -ForegroundColor Gray
        Write-Host "   2. Use Docker: docker run -d --name redis -p 6379:6379 redis:alpine" -ForegroundColor Gray
        Write-Host "   3. Use cloud service (AWS ElastiCache, Azure Redis, etc.)" -ForegroundColor Gray
        Write-Host "   4. Use Windows Subsystem for Linux (WSL)" -ForegroundColor Gray
        Write-Host "`n   The application will continue without Redis (using fallback)" -ForegroundColor Yellow
    }
}

# Setup PostgreSQL  
if (-not $SkipPostgreSQL) {
    Write-Host "`n🗄️  Setting up PostgreSQL..." -ForegroundColor Yellow
    
    if (Test-Command "psql") {
        Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL not found. Options:" -ForegroundColor Yellow
        Write-Host "   1. Download from: https://postgresql.org/download" -ForegroundColor Gray
        Write-Host "   2. Use Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15" -ForegroundColor Gray  
        Write-Host "   3. Use cloud service (AWS RDS, Azure Database, etc.)" -ForegroundColor Gray
        Write-Host "`n   The application will continue without database (using fallback)" -ForegroundColor Yellow
    }
}

# Setup environment configuration
Write-Host "`n🔐 Configuring production environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.production") {
        Copy-Item ".env.production" ".env"
        Write-Host "✅ Copied production environment template" -ForegroundColor Green
    } else {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Copied example environment template" -ForegroundColor Green
    }
    
    # Generate secure values
    $apiKey = "suifx-prod-$(Get-Date -Format 'yyyyMMddHHmmss')-$(Get-Random -Maximum 99999)"
    $jwtSecret = "suifx-jwt-secret-$(New-SecurePassword -Length 64)"
    $adminPassword = New-SecurePassword -Length 24
    
    # Update .env with secure values
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "suifx-prod-api-key-2025-secure-change-me", $apiKey
    $envContent = $envContent -replace "suifx-jwt-secret-2025-production-change-me", $jwtSecret
    $envContent = $envContent -replace "secure-admin-password-change-me", $adminPassword
    Set-Content ".env" $envContent
    
    Write-Host "✅ Generated secure API keys and passwords" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Save these credentials securely!" -ForegroundColor Yellow
    Write-Host "   API Key: $apiKey" -ForegroundColor Gray
    Write-Host "   Admin Password: $adminPassword" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Build application
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install --production=false
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build TypeScript
Write-Host "Compiling TypeScript..." -ForegroundColor Gray
npm run build
Write-Host "✅ TypeScript compiled successfully" -ForegroundColor Green

# Verify build
if (-not (Test-Path "dist\index.js")) {
    Write-Host "❌ Build failed - dist\index.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Application build completed" -ForegroundColor Green

# Setup process monitoring
Write-Host "`n📊 Setting up process monitoring..." -ForegroundColor Yellow

# Install PM2 if not present
if (-not (Test-Command "pm2")) {
    npm install -g pm2
    Write-Host "✅ PM2 process manager installed" -ForegroundColor Green
} else {
    Write-Host "✅ PM2 already installed" -ForegroundColor Green
}

# Create PM2 ecosystem file
$ecosystemConfig = @"
module.exports = {
  apps: [{
    name: 'suifx-faucet',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log', 
    log_file: './logs/combined.log',
    time: true
  }]
}
"@

Set-Content "ecosystem.config.js" $ecosystemConfig

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs" | Out-Null
}

Write-Host "✅ PM2 configuration created" -ForegroundColor Green

# Completion message
Write-Host "`n🎉 SUI-FX Production Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Ready for launch! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🔑 Configure SUI private key:" -ForegroundColor White
Write-Host "   Edit .env file and set SUI_PRIVATE_KEY=your_testnet_private_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🚀 Start the service:" -ForegroundColor White
Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host "   pm2 save" -ForegroundColor Gray
Write-Host "   pm2 startup" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🧪 Test the deployment:" -ForegroundColor White
Write-Host "   curl http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:3001/api/v1/metrics" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 📊 Monitor the service:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   pm2 logs suifx-faucet" -ForegroundColor Gray
Write-Host "   pm2 monit" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   API: http://localhost:3001/" -ForegroundColor Gray
Write-Host "   Health: http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "   Metrics: http://localhost:3001/api/v1/metrics" -ForegroundColor Gray
Write-Host "   Docs: http://localhost:3001/api/v1/docs" -ForegroundColor Gray
Write-Host "   Swagger: http://localhost:3001/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Don't forget to:" -ForegroundColor Yellow
Write-Host "  - Set up SSL/HTTPS for production" -ForegroundColor Gray
Write-Host "  - Configure Windows Firewall rules" -ForegroundColor Gray
Write-Host "  - Set up log rotation" -ForegroundColor Gray
Write-Host "  - Configure backup for database (if used)" -ForegroundColor Gray
Write-Host ""
