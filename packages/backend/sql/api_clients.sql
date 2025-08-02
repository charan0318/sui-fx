-- API Clients Management Schema for SUI-FX
-- This creates the tables needed for API client registration and management

-- API Clients table
CREATE TABLE IF NOT EXISTS api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    homepage_url VARCHAR(500),
    callback_url VARCHAR(500),
    client_id VARCHAR(64) UNIQUE NOT NULL,
    client_secret VARCHAR(128) NOT NULL,
    api_key VARCHAR(128) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    rate_limit_override INTEGER, -- Custom rate limit for this client
    metadata JSONB DEFAULT '{}'::jsonb
);

-- API Client Usage Logs
CREATE TABLE IF NOT EXISTS api_client_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(64) REFERENCES api_clients(client_id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    response_status INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_clients_client_id ON api_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_api_clients_api_key ON api_clients(api_key);
CREATE INDEX IF NOT EXISTS idx_api_clients_active ON api_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_api_client_usage_client_id ON api_client_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_api_client_usage_created_at ON api_client_usage(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_clients_updated_at 
    BEFORE UPDATE ON api_clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
