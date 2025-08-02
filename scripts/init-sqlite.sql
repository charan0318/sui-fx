-- SUI-FX SQLite Database Initialization Script
-- This creates the essential tables for the faucet system

-- Faucet Requests Table
CREATE TABLE IF NOT EXISTS faucet_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'sui-testnet',
    amount INTEGER NOT NULL,
    transaction_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activities Table
CREATE TABLE IF NOT EXISTS admin_activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    admin_user TEXT NOT NULL,
    operation TEXT NOT NULL,
    details TEXT, -- JSON string
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key_type TEXT NOT NULL, -- 'wallet', 'ip', 'global'
    key_value TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start DATETIME NOT NULL,
    window_end DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- System Metrics Table
CREATE TABLE IF NOT EXISTS system_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_type TEXT NOT NULL, -- 'counter', 'gauge', 'histogram'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT -- JSON string
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faucet_requests_wallet ON faucet_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_faucet_requests_created ON faucet_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_faucet_requests_status ON faucet_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_activities_user ON admin_activities(admin_user);
CREATE INDEX IF NOT EXISTS idx_admin_activities_timestamp ON admin_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key_type, key_value);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);

-- Insert initial admin API key
INSERT OR IGNORE INTO api_keys (key_name, key_hash, is_active) 
VALUES (
    'SUI-FX Production Key',
    'b7d0c5a3f2e1d8c9a6b4e7f3a2d9c8b5e1f4a7d6c3b8e5f2a9d7c4b1e8f5a3d0',
    1
);

-- Insert initial system metrics
INSERT OR IGNORE INTO system_metrics (metric_name, metric_value, metric_type) VALUES
    ('drops_total', 0, 'counter'),
    ('drops_today', 0, 'counter'),
    ('errors_total', 0, 'counter'),
    ('rate_limited_requests', 0, 'counter'),
    ('active_wallets', 0, 'gauge');
