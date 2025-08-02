-- SUI-FX Database Initialization Script
-- This creates the essential tables for the faucet system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Faucet Requests Table
CREATE TABLE IF NOT EXISTS faucet_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(66) NOT NULL,
    network VARCHAR(20) NOT NULL DEFAULT 'sui-testnet',
    amount BIGINT NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_faucet_requests_wallet (wallet_address),
    INDEX idx_faucet_requests_created (created_at),
    INDEX idx_faucet_requests_status (status),
    INDEX idx_faucet_requests_ip (ip_address)
);

-- Admin Activities Table
CREATE TABLE IF NOT EXISTS admin_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_admin_activities_user (admin_user),
    INDEX idx_admin_activities_timestamp (timestamp),
    INDEX idx_admin_activities_operation (operation)
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_type VARCHAR(20) NOT NULL, -- 'wallet', 'ip', 'global'
    key_value VARCHAR(100) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for rate limiting
    UNIQUE(key_type, key_value, window_start),
    
    -- Indexes
    INDEX idx_rate_limits_key (key_type, key_value),
    INDEX idx_rate_limits_window (window_start, window_end)
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(256) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_api_keys_hash (key_hash),
    INDEX idx_api_keys_active (is_active)
);

-- System Metrics Table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB,
    
    -- Indexes
    INDEX idx_system_metrics_name (metric_name),
    INDEX idx_system_metrics_timestamp (timestamp),
    INDEX idx_system_metrics_type (metric_type)
);

-- Insert initial admin API key (hash of 'suifx-prod-key-2025-secure')
INSERT INTO api_keys (key_name, key_hash, is_active) 
VALUES (
    'SUI-FX Production Key',
    'b7d0c5a3f2e1d8c9a6b4e7f3a2d9c8b5e1f4a7d6c3b8e5f2a9d7c4b1e8f5a3d0',
    true
) ON CONFLICT (key_hash) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_faucet_requests_updated_at 
    BEFORE UPDATE ON faucet_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for daily statistics
CREATE OR REPLACE VIEW daily_faucet_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_drops,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_requests,
    SUM(amount) FILTER (WHERE status = 'completed') as total_sui_dropped,
    COUNT(DISTINCT wallet_address) as unique_wallets
FROM faucet_requests 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Insert initial system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_type) VALUES
    ('drops_total', 0, 'counter'),
    ('drops_today', 0, 'counter'),
    ('errors_total', 0, 'counter'),
    ('rate_limited_requests', 0, 'counter'),
    ('active_wallets', 0, 'gauge')
ON CONFLICT DO NOTHING;
