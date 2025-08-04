#!/usr/bin/env node

/**
 * SUI-FX Backend Startup Script
 * Simplified startup with environment validation
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if .env file exists (optional in production)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('📄 Loading .env file');
  dotenv.config({ path: envPath });
} else if (process.env.NODE_ENV !== 'production') {
  console.error('❌ .env file not found. Please copy .env.example to .env and configure it.');
  process.exit(1);
} else {
  console.log('🌐 Production mode - using environment variables');
}

// Validate required environment variables
const required = ['API_KEY', 'SUI_PRIVATE_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please check your .env file configuration.');
  process.exit(1);
}

console.log('✅ Environment configuration validated');
console.log('🚀 Starting SUI-FX backend...');

// Start the application
const child = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('❌ Failed to start backend:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
    process.exit(code);
  }
});
