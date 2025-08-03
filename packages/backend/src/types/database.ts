export interface DatabaseConfig {
  type: 'sqlite';
  path: string;
}

export interface Transaction {
  id?: number;
  wallet_address: string;
  amount: string;
  transaction_hash?: string;
  success: boolean;
  error_message?: string;
  ip_address: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyMetrics {
  id?: number;
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_amount_distributed: string;
  unique_users: number;
  rate_limit_errors: number;
  network_errors: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiClient {
  id?: number;
  client_id: string;
  client_name: string;
  api_key: string;
  rate_limit: number;
  requests_made: number;
  last_request_at?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Setting {
  id?: number;
  setting_name: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
}
