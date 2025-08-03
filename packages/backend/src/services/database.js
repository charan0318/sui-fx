// Simplified SQLite-only Database Service for SUI-FX
import { logger } from '../utils/logger.js';
import { sqliteService } from './sqlite.js';

export class DatabaseService {
  constructor() {
    this.sqlite = sqliteService;
  }

  async connect() {
    try {
      logger.info('Initializing SQLite database...');
      const connected = await this.sqlite.connect();
      if (connected) {
        logger.info('✅ Database service initialized successfully');
        return true;
      } else {
        logger.error('❌ Database connection failed');
        return false;
      }
    } catch (error) {
      logger.error('Database connection error:', error);
      return false;
    }
  }

  async disconnect() {
    await this.sqlite.disconnect();
  }

  // Wrapper methods for SQLite queries
  async query(text, params = []) {
    return this.sqlite.query(text, params);
  }

  // Transaction methods
  async saveTransaction(data) {
    try {
      const sql = `
        INSERT INTO transactions (wallet_address, amount, transaction_hash, success, error_message, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.wallet_address,
        data.amount,
        data.transaction_hash || null,
        data.success ? 1 : 0,
        data.error_message || null,
        data.ip_address
      ];
      
      const result = this.sqlite.query(sql, params);
      logger.info('Transaction saved to database', { wallet_address: data.wallet_address, success: data.success });
      return result;
    } catch (error) {
      logger.error('Failed to save transaction:', error);
      throw error;
    }
  }

  async getTransactions(limit = 100) {
    try {
      const sql = 'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?';
      const result = this.sqlite.query(sql, [limit]);
      return result.rows || [];
    } catch (error) {
      logger.error('Failed to get transactions:', error);
      return [];
    }
  }

  // Metrics methods
  async updateDailyMetrics(date, updates) {
    try {
      // First, try to get existing metrics
      const existingMetrics = await this.getDailyMetrics(date);
      
      if (existingMetrics) {
        // Update existing record
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
          if (key !== 'date') {
            updateFields.push(`${key} = ?`);
            updateValues.push(updates[key]);
          }
        });
        
        const sql = `
          UPDATE faucet_metrics 
          SET ${updateFields.join(', ')}, updated_at = datetime('now')
          WHERE date = ?
        `;
        updateValues.push(date);
        
        this.sqlite.query(sql, updateValues);
      } else {
        // Insert new record
        const fields = ['date', ...Object.keys(updates).filter(k => k !== 'date')];
        const values = [date, ...Object.keys(updates).filter(k => k !== 'date').map(k => updates[k])];
        const placeholders = fields.map(() => '?').join(', ');
        
        const sql = `
          INSERT INTO faucet_metrics (${fields.join(', ')})
          VALUES (${placeholders})
        `;
        
        this.sqlite.query(sql, values);
      }
      
      logger.info('Daily metrics updated', { date, updates });
    } catch (error) {
      logger.error('Failed to update daily metrics:', error);
      throw error;
    }
  }

  async getDailyMetrics(date) {
    try {
      const sql = 'SELECT * FROM faucet_metrics WHERE date = ?';
      const result = this.sqlite.query(sql, [date]);
      return result.rows?.[0] || null;
    } catch (error) {
      logger.error('Failed to get daily metrics:', error);
      return null;
    }
  }

  async getAllMetrics() {
    try {
      const sql = 'SELECT * FROM faucet_metrics ORDER BY date DESC';
      const result = this.sqlite.query(sql);
      return result.rows || [];
    } catch (error) {
      logger.error('Failed to get all metrics:', error);
      return [];
    }
  }

  // Simple metrics tracking method
  async saveMetrics(type, date, data) {
    try {
      // Define the base structure
      const baseMetrics = {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        rate_limit_errors: 0,
        network_errors: 0,
        unique_users: 0,
        total_amount_distributed: '0'
      };

      // Update based on the type
      const updates = { ...baseMetrics };
      
      if (type === 'faucet_request') {
        updates.total_requests = 1;
        if (data.success) {
          updates.successful_requests = 1;
          updates.total_amount_distributed = data.amount || '0';
        } else {
          updates.failed_requests = 1;
          if (data.error && data.error.includes('rate limit')) {
            updates.rate_limit_errors = 1;
          } else if (data.error && (data.error.includes('network') || data.error.includes('connection'))) {
            updates.network_errors = 1;
          }
        }
        updates.unique_users = 1;
      }

      await this.updateDailyMetrics(date, updates);
    } catch (error) {
      logger.error('Failed to save metrics:', { error: error.message, date });
      // Don't throw - metrics are not critical
    }
  }

  // Settings methods
  async getSetting(name) {
    try {
      const sql = 'SELECT setting_value FROM settings WHERE setting_name = ?';
      const result = this.sqlite.query(sql, [name]);
      return result.rows?.[0]?.setting_value || null;
    } catch (error) {
      logger.error('Failed to get setting:', { name, error: error.message });
      return null;
    }
  }

  async setSetting(name, value) {
    try {
      const sql = `
        INSERT INTO settings (setting_name, setting_value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(setting_name) DO UPDATE SET
        setting_value = ?,
        updated_at = datetime('now')
      `;
      this.sqlite.query(sql, [name, value, value]);
      logger.info('Setting updated', { name, value });
    } catch (error) {
      logger.error('Failed to set setting:', { name, error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default DatabaseService;
