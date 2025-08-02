#!/bin/bash

# Sui Faucet Startup Script
# This script ensures all services are properly initialized

set -e

echo "🚀 Starting Sui Faucet initialization..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file before continuing!"
    exit 1
fi

# Load environment variables
source .env

echo "🔧 Installing dependencies..."
npm install

echo "🏗️  Building backend..."
cd packages/backend
npm run build
cd ../..

echo "🏗️  Building Discord bot..."
cd packages/discord-bot
npm run build
cd ../..

# Check PostgreSQL connection
echo "🐘 Checking PostgreSQL connection..."
if ! nc -z localhost 5432; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   Docker: docker-compose up -d postgres"
    exit 1
fi

# Check Redis connection
echo "🔴 Checking Redis connection..."
if ! nc -z localhost 6379; then
    echo "❌ Redis is not running. Please start Redis first."
    echo "   Docker: docker-compose up -d redis"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database setup..."
if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" < scripts/create-missing-tables.sql
    echo "✅ Database tables created"
else
    echo "⚠️  psql not found. Please run database setup manually:"
    echo "   psql \$DATABASE_URL < scripts/create-missing-tables.sql"
fi

echo "✅ Initialization complete!"
echo ""
echo "🚀 To start the services:"
echo "   Backend:     npm run dev --workspace=packages/backend"
echo "   Discord Bot: npm run dev --workspace=packages/discord-bot"
echo ""
echo "🐳 Or use Docker:"
echo "   docker-compose up -d"

# Start services based on argument
if [ "$1" = "start" ]; then
    echo ""
    echo "🚀 Starting all services..."
    
    # Start backend in background
    echo "Starting backend..."
    cd packages/backend
    npm run start &
    BACKEND_PID=$!
    cd ../..
    
    # Start Discord bot in background
    echo "Starting Discord bot..."
    cd packages/discord-bot
    npm run start &
    BOT_PID=$!
    cd ../..
    
    echo "✅ Services started!"
    echo "   Backend PID: $BACKEND_PID"
    echo "   Bot PID: $BOT_PID"
    echo ""
    echo "📊 Health check: http://localhost:3001/api/v1/health"
    echo "📖 API docs: http://localhost:3001/docs"
    
    # Handle shutdown
    trap 'echo "Shutting down..."; kill $BACKEND_PID $BOT_PID; wait' EXIT
    
    # Wait for processes
    wait
fi
