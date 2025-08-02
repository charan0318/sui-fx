@echo off
REM Sui Faucet Startup Script for Windows
REM This script ensures all services are properly initialized

echo 🚀 Starting Sui Faucet initialization...

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env from template...
    copy .env.example .env
    echo ⚠️  Please configure your .env file before continuing!
    exit /b 1
)

echo 🔧 Installing dependencies...
call npm install

echo 🏗️  Building backend...
cd packages\backend
call npm run build
cd ..\..

echo 🏗️  Building Discord bot...
cd packages\discord-bot
call npm run build
cd ..\..

echo ✅ Initialization complete!
echo.
echo 🚀 To start the services:
echo    Backend:     npm run dev --workspace=packages/backend
echo    Discord Bot: npm run dev --workspace=packages/discord-bot
echo.
echo 🐳 Or use Docker:
echo    docker-compose up -d

if "%1"=="start" (
    echo.
    echo 🚀 Starting all services...
    
    echo Starting backend...
    start "Sui Faucet Backend" cmd /k "cd packages\backend && npm run start"
    
    echo Starting Discord bot...
    start "Sui Faucet Discord Bot" cmd /k "cd packages\discord-bot && npm run start"
    
    echo ✅ Services started in separate windows!
    echo.
    echo 📊 Health check: http://localhost:3001/api/v1/health
    echo 📖 API docs: http://localhost:3001/docs
)

pause
