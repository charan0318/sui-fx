// PM2 Ecosystem Configuration for SUI-FX Production Deployment
module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'sui-fx-backend',
      script: './packages/backend/dist/index.js',
      cwd: './',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      
      // Advanced settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    
    {
      // Discord Bot
      name: 'sui-fx-discord-bot',
      script: './packages/discord-bot/dist/index.js',
      cwd: './',
      instances: 1, // Discord bots should run single instance
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
      },
      
      // Logging
      log_file: './logs/discord-combined.log',
      out_file: './logs/discord-out.log',
      error_file: './logs/discord-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      
      // Advanced settings
      kill_timeout: 5000,
      autorestart: true,
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production.server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/charan0318/sui-fx.git',
      path: '/var/www/sui-fx',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'git clone https://github.com/charan0318/sui-fx.git /var/www/sui-fx'
    },
    
    staging: {
      user: 'deploy',
      host: ['staging.server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/charan0318/sui-fx.git',
      path: '/var/www/sui-fx-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'git clone https://github.com/charan0318/sui-fx.git /var/www/sui-fx-staging'
    }
  }
};
