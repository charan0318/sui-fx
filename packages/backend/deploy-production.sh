#!/bin/bash

# SUI-FX Production Deployment Script
# Handles Priority 1 & 2 setup for production launch

set -e

echo "🚀 SUI-FX Production Deployment Starting..."
echo "=========================================="

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security"
   exit 1
fi

# Check Node.js version
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Install Node.js 18+ first"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js 18+ required. Current: $NODE_VERSION"
        exit 1
    fi
    
    print_status "Node.js $NODE_VERSION validated"
}

# Install and configure Redis
setup_redis() {
    echo ""
    echo "📦 Setting up Redis..."
    
    if command -v redis-server &> /dev/null; then
        print_status "Redis already installed"
    else
        print_warning "Installing Redis..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y redis-server
        elif command -v yum &> /dev/null; then
            sudo yum install -y redis
        elif command -v brew &> /dev/null; then
            brew install redis
        else
            print_warning "Please install Redis manually:"
            echo "  - Ubuntu/Debian: sudo apt-get install redis-server"
            echo "  - CentOS/RHEL: sudo yum install redis"
            echo "  - macOS: brew install redis"
            echo "  - Docker: docker run -d --name redis -p 6379:6379 redis:alpine"
        fi
    fi
    
    # Start Redis service
    if command -v systemctl &> /dev/null; then
        sudo systemctl enable redis
        sudo systemctl start redis
        print_status "Redis service started and enabled"
    elif command -v service &> /dev/null; then
        sudo service redis start
        print_status "Redis service started"
    else
        print_warning "Start Redis manually: redis-server --daemonize yes"
    fi
}

# Setup PostgreSQL
setup_postgresql() {
    echo ""
    echo "🗄️  Setting up PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL client found"
    else
        print_warning "PostgreSQL not found. Options:"
        echo "  1. Install locally: https://postgresql.org/download"
        echo "  2. Use cloud service (AWS RDS, Digital Ocean, etc.)"
        echo "  3. Docker: docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15"
        echo ""
        echo "  The application will continue without database (using fallback mode)"
    fi
}

# Generate secure environment configuration
setup_environment() {
    echo ""
    echo "🔐 Configuring production environment..."
    
    # Create production .env if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            cp .env.production .env
            print_status "Copied production environment template"
        else
            cp .env.example .env
            print_status "Copied example environment template"
        fi
        
        # Generate secure values
        API_KEY="suifx-prod-$(date +%s)-$(openssl rand -hex 8)"
        JWT_SECRET="$(openssl rand -hex 64)"
        ADMIN_PASSWORD="$(openssl rand -base64 32)"
        
        # Update .env with secure values
        sed -i.bak "s/suifx-prod-api-key-2025-secure-change-me/$API_KEY/" .env
        sed -i.bak "s/suifx-jwt-secret-2025-production-change-me/$JWT_SECRET/" .env
        sed -i.bak "s/secure-admin-password-change-me/$ADMIN_PASSWORD/" .env
        
        print_status "Generated secure API keys and passwords"
        print_warning "IMPORTANT: Save these credentials securely!"
        echo "  API Key: $API_KEY"
        echo "  Admin Password: $ADMIN_PASSWORD"
        echo ""
    else
        print_status ".env file already exists"
    fi
}

# Build and prepare application
build_application() {
    echo ""
    echo "🔨 Building application..."
    
    # Install dependencies
    npm install --production=false
    print_status "Dependencies installed"
    
    # Build TypeScript
    npm run build
    print_status "TypeScript compiled successfully"
    
    # Verify build
    if [ ! -f "dist/index.js" ]; then
        print_error "Build failed - dist/index.js not found"
        exit 1
    fi
    
    print_status "Application build completed"
}

# Setup process monitoring
setup_monitoring() {
    echo ""
    echo "📊 Setting up process monitoring..."
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        print_status "PM2 process manager installed"
    else
        print_status "PM2 already installed"
    fi
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
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
EOF
    
    # Create logs directory
    mkdir -p logs
    
    print_status "PM2 configuration created"
}

# Main execution
main() {
    echo "Starting SUI-FX production setup..."
    
    # Change to backend directory
    if [ -d "packages/backend" ]; then
        cd packages/backend
    fi
    
    check_nodejs
    setup_redis
    setup_postgresql
    setup_environment
    build_application
    setup_monitoring
    
    echo ""
    echo "🎉 SUI-FX Production Setup Complete!"
    echo "===================================="
    echo ""
    print_status "Ready for launch! Next steps:"
    echo ""
    echo "1. 🔑 Configure SUI private key:"
    echo "   Edit .env file and set SUI_PRIVATE_KEY=your_testnet_private_key"
    echo ""
    echo "2. 🚀 Start the service:"
    echo "   pm2 start ecosystem.config.js"
    echo "   pm2 save"
    echo "   pm2 startup"
    echo ""
    echo "3. 🧪 Test the deployment:"
    echo "   curl http://localhost:3001/api/v1/health"
    echo "   curl http://localhost:3001/api/v1/metrics"
    echo ""
    echo "4. 📊 Monitor the service:"
    echo "   pm2 status"
    echo "   pm2 logs suifx-faucet"
    echo "   pm2 monit"
    echo ""
    echo "📋 Service URLs:"
    echo "   API: http://localhost:3001/"
    echo "   Health: http://localhost:3001/api/v1/health"
    echo "   Metrics: http://localhost:3001/api/v1/metrics"
    echo "   Docs: http://localhost:3001/api/v1/docs"
    echo "   Swagger: http://localhost:3001/docs"
    echo ""
    print_warning "Don't forget to:"
    echo "  - Set up SSL/HTTPS for production"
    echo "  - Configure firewall rules"
    echo "  - Set up log rotation"
    echo "  - Configure backup for database (if used)"
    echo ""
}

# Run main function
main "$@"
