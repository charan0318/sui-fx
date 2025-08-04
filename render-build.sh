#!/bin/bash
# Render.com build script for SUI-FX Backend

echo "🚀 Starting Render build for SUI-FX Backend..."

# Navigate to backend directory
cd packages/backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"
