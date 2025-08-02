-- SUI-FX Original Database Schema
-- Complete database restructure for original implementation

-- Drop existing tables if they exist
DROP TABLE IF EXISTS sui_faucet_logs CASCADE;
DROP TABLE IF EXISTS sui_ratelimit_cache CASCADE;
DROP TABLE IF EXISTS sui_admin_users CASCADE;
DROP TABLE IF EXISTS sui_system_metrics CASCADE;

-- Main transaction logging table (renamed from transactions)
CREATE TABLE sui_faucet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    drop_amount BIGINT NOT NULL,
    tx TEXT UNIQUE NOT NULL,
    network TEXT NOT NULL DEFAULT 'testnet',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    
    -- Indexing for performance
    CONSTRAINT sui_faucet_logs_wallet_address_idx UNIQUE (wallet_address, logged_at)
);

-- Rate limiting cache table (renamed from rate_limits)
CREATE TABLE sui_ratelimit_cache (
    cache_key TEXT PRIMARY KEY,
    hit_count INTEGER NOT NULL DEFAULT 0,
    reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Admin users management (enhanced)
CREATE TABLE sui_admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics tracking (new)
CREATE TABLE sui_system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_value BIGINT NOT NULL,
    metric_data JSONB DEFAULT '{}'::jsonb,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sui_faucet_logs_wallet ON sui_faucet_logs(wallet_address);
CREATE INDEX idx_sui_faucet_logs_logged_at ON sui_faucet_logs(logged_at);
CREATE INDEX idx_sui_faucet_logs_status ON sui_faucet_logs(status);
CREATE INDEX idx_sui_faucet_logs_ip ON sui_faucet_logs(ip_address);

CREATE INDEX idx_sui_ratelimit_cache_reset_time ON sui_ratelimit_cache(reset_time);
CREATE INDEX idx_sui_ratelimit_cache_logged_at ON sui_ratelimit_cache(logged_at);

CREATE INDEX idx_sui_system_metrics_type ON sui_system_metrics(metric_type);
CREATE INDEX idx_sui_system_metrics_logged_at ON sui_system_metrics(logged_at);

-- Insert default admin user (password: admin123)
INSERT INTO sui_admin_users (username, password_hash, email, role) 
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqI8QhpM.0QZtW', 
    'admin@sui-fx.local',
    'superadmin'
);

-- Initialize system metrics
INSERT INTO sui_system_metrics (metric_type, metric_value, period_start, period_end)
VALUES 
    ('total_drops', 0, NOW() - INTERVAL '1 hour', NOW()),
    ('unique_wallets', 0, NOW() - INTERVAL '1 hour', NOW()),
    ('total_sui_distributed', 0, NOW() - INTERVAL '1 hour', NOW());

COMMIT;
