#!/bin/bash

# SUI-FX Production Setup Script
# This script sets up the production environment for SUI-FX

set -e

echo "🚀 Setting up SUI-FX Production Environment..."

# Check if running as root (for system services)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root for security reasons"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
if [[ "$(echo "$NODE_VERSION 18.0.0" | tr " " "\n" | sort -V | head -n1)" != "18.0.0" ]]; then
    echo "❌ Node.js version 18+ is required. Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION found"

# Check npm
if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm --version) found"

# Install Redis if not present
if ! command_exists redis-server; then
    echo "📦 Installing Redis..."
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y redis-server
    elif command_exists yum; then
        sudo yum install -y redis
    elif command_exists brew; then
        brew install redis
    else
        echo "⚠️  Please install Redis manually: https://redis.io/download"
        echo "   Redis is required for caching and rate limiting"
    fi
else
    echo "✅ Redis found"
fi

# Install PostgreSQL if not present
if ! command_exists psql; then
    echo "📦 PostgreSQL not found. You can:"
    echo "   1. Install locally: https://postgresql.org/download"
    echo "   2. Use cloud service (AWS RDS, etc.)"
    echo "   3. Use Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15"
    echo "⚠️  The application will continue without database (using fallback)"
else
    echo "✅ PostgreSQL found"
fi

# Setup project
echo "📦 Setting up project..."

# Copy environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  IMPORTANT: Edit .env file with your production values"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Start Redis if installed
if command_exists redis-server; then
    echo "🔄 Starting Redis..."
    # Check if Redis is already running
    if ! pgrep -x "redis-server" > /dev/null; then
        redis-server --daemonize yes
        echo "✅ Redis started"
    else
        echo "✅ Redis already running"
    fi
fi

# Database setup (if PostgreSQL is available)
if command_exists psql; then
    echo "🔄 Setting up database..."
    echo "ℹ️  You may need to run database migrations manually"
    echo "   Example: npm run db:migrate"
fi

echo ""
echo "🎉 SUI-FX Production Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Edit .env file with your production values:"
echo "   - SUI_PRIVATE_KEY: Your actual Sui testnet private key"
echo "   - API_KEY: Secure API key for faucet access"
echo "   - JWT_SECRET: Secure JWT secret for admin auth"
echo "   - DATABASE_URL: Your PostgreSQL connection string"
echo "   - REDIS_URL: Your Redis connection string"
echo ""
echo "2. Start the service:"
echo "   npm start"
echo ""
echo "3. Test the endpoints:"
echo "   curl http://localhost:3001/api/v1/health"
echo "   curl http://localhost:3001/api/v1/docs"
echo ""
echo "📊 Monitoring endpoints:"
echo "   Health: http://localhost:3001/api/v1/health"
echo "   Metrics: http://localhost:3001/api/v1/metrics"
echo "   API Docs: http://localhost:3001/api/v1/docs"
echo ""
echo "🔧 For production deployment, consider:"
echo "   - Setting up process manager (PM2, systemd)"
echo "   - Configuring reverse proxy (nginx)"
echo "   - Setting up SSL certificates"
echo "   - Monitoring with Prometheus/Grafana"
echo ""
