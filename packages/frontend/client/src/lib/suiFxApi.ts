// SUI-FX API Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'suisuisui';

export interface FaucetRequest {
  address: string;
}

export interface FaucetResponse {
  success: boolean;
  transactionHash?: string;
  amount?: number;
  message?: string;
  walletAddress?: string;
  faucetAddress?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: string;
  services: {
    database: string;
    redis: string;
    sui: string;
  };
}

class SuiFxApi {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Faucet API
  async requestTokens(address: string): Promise<FaucetResponse> {
    return this.request<FaucetResponse>('/faucet/request', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  // Health API
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Admin API (requires JWT token)
  async adminLogin(username: string, password: string): Promise<{ token: string }> {
    return this.request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getAdminDashboard(token: string): Promise<any> {
    return this.request<any>('/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

export const suiFxApi = new SuiFxApi();
export default SuiFxApi;
