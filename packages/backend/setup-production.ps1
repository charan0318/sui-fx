# SUI-FX Production Setup Script (PowerShell)
# This script sets up the production environment for SUI-FX on Windows

Write-Host "🚀 Setting up SUI-FX Production Environment..." -ForegroundColor Green

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

# Check dependencies
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node --version).TrimStart('v')
$requiredVersion = [version]"18.0.0"
$currentVersion = [version]$nodeVersion

if ($currentVersion -lt $requiredVersion) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green

# Check npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version
Write-Host "✅ npm $npmVersion found" -ForegroundColor Green

# Check for Redis (optional)
if (-not (Test-Command "redis-server")) {
    Write-Host "⚠️  Redis not found. Options:" -ForegroundColor Yellow
    Write-Host "   1. Install Redis: https://redis.io/download" -ForegroundColor Yellow
    Write-Host "   2. Use Docker: docker run -d --name redis -p 6379:6379 redis:alpine" -ForegroundColor Yellow
    Write-Host "   3. Use cloud service (AWS ElastiCache, etc.)" -ForegroundColor Yellow
    Write-Host "   The application will continue without Redis (using fallback)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Redis found" -ForegroundColor Green
}

# Check for PostgreSQL (optional)
if (-not (Test-Command "psql")) {
    Write-Host "⚠️  PostgreSQL not found. Options:" -ForegroundColor Yellow
    Write-Host "   1. Install locally: https://postgresql.org/download" -ForegroundColor Yellow
    Write-Host "   2. Use cloud service (AWS RDS, Azure Database, etc.)" -ForegroundColor Yellow
    Write-Host "   3. Use Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15" -ForegroundColor Yellow
    Write-Host "   The application will continue without database (using fallback)" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
}

# Setup project
Write-Host "📦 Setting up project..." -ForegroundColor Yellow

# Copy environment file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Edit .env file with your production values" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "🎉 SUI-FX Production Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your production values:" -ForegroundColor White
Write-Host "   - SUI_PRIVATE_KEY: Your actual Sui testnet private key" -ForegroundColor Gray
Write-Host "   - API_KEY: Secure API key for faucet access" -ForegroundColor Gray
Write-Host "   - JWT_SECRET: Secure JWT secret for admin auth" -ForegroundColor Gray
Write-Host "   - DATABASE_URL: Your PostgreSQL connection string" -ForegroundColor Gray
Write-Host "   - REDIS_URL: Your Redis connection string" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the service:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the endpoints:" -ForegroundColor White
Write-Host "   curl http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "   curl http://localhost:3001/api/v1/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Monitoring endpoints:" -ForegroundColor Cyan
Write-Host "   Health: http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "   Metrics: http://localhost:3001/api/v1/metrics" -ForegroundColor Gray
Write-Host "   API Docs: http://localhost:3001/api/v1/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 For production deployment, consider:" -ForegroundColor Cyan
Write-Host "   - Setting up process manager (PM2, Windows Service)" -ForegroundColor Gray
Write-Host "   - Configuring reverse proxy (IIS, nginx)" -ForegroundColor Gray
Write-Host "   - Setting up SSL certificates" -ForegroundColor Gray
Write-Host "   - Monitoring with Prometheus/Grafana" -ForegroundColor Gray
Write-Host ""
