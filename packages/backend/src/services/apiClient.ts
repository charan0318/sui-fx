import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { databaseService } from './database.js';

export interface ApiClient {
  id: string;
  name: string;
  description?: string;
  homepage_url?: string;
  callback_url?: string;
  client_id: string;
  client_secret: string;
  api_key: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_used_at?: Date;
  usage_count: number;
  rate_limit_override?: number;
  metadata?: any;
}

export interface CreateApiClientRequest {
  name: string;
  description?: string;
  homepage_url?: string;
  callback_url?: string;
  rate_limit_override?: number;
}

export interface ApiClientStats {
  total_requests: number;
  requests_today: number;
  last_24h_requests: number;
  avg_response_time: number;
}

class ApiClientService {
  /**
   * Generate a secure random string
   */
  private generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate client credentials
   */
  private generateClientCredentials() {
    return {
      client_id: `suifx_${this.generateSecureToken(16)}`,
      client_secret: `suifx_secret_${this.generateSecureToken(32)}`,
      api_key: `suifx_${this.generateSecureToken(24)}`
    };
  }

  /**
   * Create a new API client
   */
  async createClient(data: CreateApiClientRequest): Promise<ApiClient> {
    try {
      if (!databaseService.isConnected()) {
        throw new Error('Database not available - API client management requires database connection');
      }

      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Application name is required');
      }

      // Validate URLs if provided
      if (data.homepage_url && !this.isValidUrl(data.homepage_url)) {
        throw new Error('Invalid homepage URL');
      }
      
      if (data.callback_url && !this.isValidUrl(data.callback_url)) {
        throw new Error('Invalid callback URL');
      }

      const credentials = this.generateClientCredentials();
      
      const query = `
        INSERT INTO api_clients (
          name, description, homepage_url, callback_url, 
          client_id, client_secret, api_key, rate_limit_override
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        data.name.trim(),
        data.description?.trim() || null,
        data.homepage_url || null,
        data.callback_url || null,
        credentials.client_id,
        credentials.client_secret,
        credentials.api_key,
        data.rate_limit_override || null
      ];

      const result = await databaseService.query(query, values);
      const client = result.rows ? result.rows[0] : result[0];

      logger.info('API client created', {
        client_id: client.client_id,
        name: client.name,
        homepage_url: client.homepage_url
      });

      return client;
    } catch (error) {
      logger.error('Failed to create API client', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get client by API key
   */
  async getClientByApiKey(apiKey: string): Promise<ApiClient | null> {
    try {
      if (!databaseService.isConnected()) {
        return null;
      }

      const query = 'SELECT * FROM api_clients WHERE api_key = $1 AND is_active = true';
      const result = await databaseService.query(query, [apiKey]);
      
      return (result.rows ? result.rows[0] : result[0]) || null;
    } catch (error) {
      logger.error('Failed to get client by API key', { error: error.message });
      return null;
    }
  }

  /**
   * Get client by client ID
   */
  async getClientById(clientId: string): Promise<ApiClient | null> {
    try {
      if (!databaseService.isConnected()) {
        return null;
      }

      const query = 'SELECT * FROM api_clients WHERE client_id = $1';
      const result = await databaseService.query(query, [clientId]);
      
      return (result.rows ? result.rows[0] : result[0]) || null;
    } catch (error) {
      logger.error('Failed to get client by ID', { error: error.message });
      return null;
    }
  }

  /**
   * List all clients (for admin)
   */
  async listClients(limit: number = 50, offset: number = 0): Promise<ApiClient[]> {
    try {
      if (!databaseService.isConnected()) {
        return [];
      }

      const query = `
        SELECT * FROM api_clients 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await databaseService.query(query, [limit, offset]);
      
      return result.rows || result;
    } catch (error) {
      logger.error('Failed to list clients', { error: error.message });
      return [];
    }
  }

  /**
   * Update client usage statistics
   */
  async recordUsage(apiKey: string, endpoint: string, method: string, responseStatus: number, responseTime: number, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      if (!databaseService.isConnected()) {
        return;
      }

      // Update client usage count and last used
      const updateClientQuery = `
        UPDATE api_clients 
        SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP 
        WHERE api_key = $1
      `;
      await databaseService.query(updateClientQuery, [apiKey]);

      // Log detailed usage
      const logUsageQuery = `
        INSERT INTO api_client_usage (client_id, endpoint, method, ip_address, user_agent, response_status, response_time_ms)
        SELECT client_id, $2, $3, $4, $5, $6, $7 
        FROM api_clients 
        WHERE api_key = $1
      `;
      await databaseService.query(logUsageQuery, [apiKey, endpoint, method, ipAddress, userAgent, responseStatus, responseTime]);
    } catch (error) {
      logger.error('Failed to record usage', { error: error.message });
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(clientId: string): Promise<ApiClientStats | null> {
    try {
      if (!databaseService.isConnected()) {
        return null;
      }

      const query = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as requests_today,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h_requests,
          COALESCE(AVG(response_time_ms), 0) as avg_response_time
        FROM api_client_usage 
        WHERE client_id = $1
      `;
      const result = await databaseService.query(query, [clientId]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get client stats', { error: error.message });
      return null;
    }
  }

  /**
   * Deactivate a client
   */
  async deactivateClient(clientId: string): Promise<boolean> {
    try {
      if (!databaseService.isConnected()) {
        return false;
      }

      const query = 'UPDATE api_clients SET is_active = false WHERE client_id = $1';
      const result = await databaseService.query(query, [clientId]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to deactivate client', { error: error.message });
      return false;
    }
  }

  /**
   * Regenerate API key for a client
   */
  async regenerateApiKey(clientId: string): Promise<string | null> {
    try {
      if (!databaseService.isConnected()) {
        return null;
      }

      const newApiKey = `suifx_${this.generateSecureToken(24)}`;
      const query = 'UPDATE api_clients SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE client_id = $2 RETURNING api_key';
      const result = await databaseService.query(query, [newApiKey, clientId]);
      
      return result.rows[0]?.api_key || null;
    } catch (error) {
      logger.error('Failed to regenerate API key', { error: error.message });
      return null;
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClientService = new ApiClientService();
