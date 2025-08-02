-- Create missing database tables for Sui Faucet

-- Faucet metrics table for daily aggregated data
CREATE TABLE IF NOT EXISTS faucet_metrics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    total_amount_distributed BIGINT NOT NULL DEFAULT 0,
    rate_limit_errors INTEGER NOT NULL DEFAULT 0,
    network_errors INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recent transactions table (auto-expire after 7 days)
CREATE TABLE IF NOT EXISTS recent_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    amount BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limit settings table
CREATE TABLE IF NOT EXISTS rate_limit_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean')),
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faucet_metrics_date ON faucet_metrics(date);
CREATE INDEX IF NOT EXISTS idx_recent_transactions_created ON recent_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_settings_name ON rate_limit_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_rate_limit_settings_active ON rate_limit_settings(is_active);

-- Insert default rate limit settings
INSERT INTO rate_limit_settings (setting_name, setting_value, setting_type, description, category, updated_by) VALUES
('faucet_mode', 'sui_sdk', 'string', 'Faucet mode: wallet (use private key) or sui_sdk (use official faucet)', 'faucet', 'system'),
('max_requests_per_ip', '50', 'number', 'Maximum requests per IP address per window', 'rate_limit', 'system'),
('max_requests_per_wallet', '1', 'number', 'Maximum requests per wallet address per window', 'rate_limit', 'system'),
('rate_limit_window_ms', '3600000', 'number', 'Rate limit window in milliseconds (1 hour)', 'rate_limit', 'system'),
('rate_limit_enabled', 'true', 'boolean', 'Enable/disable rate limiting globally', 'rate_limit', 'system')
ON CONFLICT (setting_name) DO NOTHING;

-- Auto-cleanup function for recent_transactions
CREATE OR REPLACE FUNCTION cleanup_recent_transactions()
RETURNS void AS $$
BEGIN
    DELETE FROM recent_transactions WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension or external cron job)
-- This is just for reference - implement via cron job or app logic
-- SELECT cron.schedule('cleanup-recent-transactions', '0 2 * * *', 'SELECT cleanup_recent_transactions();');
