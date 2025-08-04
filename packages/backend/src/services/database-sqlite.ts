import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import type { Transaction, ApiClient, DailyMetrics } from '../types/database.js';

type ClientRegistration = ApiClient;
type FaucetMetrics = DailyMetrics;

export class SQLiteDatabaseService {
  private db: Database.Database | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || 'suifx.db';
      this.db = new Database(dbPath);

      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');
      this.db.pragma('mmap_size = 268435456'); // 256MB

      logger.info('✅ SQLite database connected successfully', { path: dbPath });
      this.isConnected = true;

      await this.initializeTables();
    } catch (error) {
      logger.error('Failed to connect to SQLite database', error);
      throw error;
    }
  }

  private async initializeTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const tables = [
      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_hash TEXT UNIQUE NOT NULL,
        wallet_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        network TEXT NOT NULL DEFAULT 'testnet',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        gas_used TEXT,
        gas_price TEXT,
        block_number TEXT,
        confirmation_time INTEGER
      )`,

      // API clients table
      `CREATE TABLE IF NOT EXISTS api_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        homepage_url TEXT,
        callback_url TEXT,
        client_secret TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1,
        rate_limit_override INTEGER,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        metadata TEXT DEFAULT '{}'
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_name TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Rate limit logs table
      `CREATE TABLE IF NOT EXISTS rate_limit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        wallet_address TEXT,
        endpoint TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rate_limit_type TEXT DEFAULT 'ip'
      )`,

      // Faucet metrics table
      `CREATE TABLE IF NOT EXISTS faucet_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        total_requests INTEGER DEFAULT 0,
        successful_requests INTEGER DEFAULT 0,
        failed_requests INTEGER DEFAULT 0,
        rate_limit_errors INTEGER DEFAULT 0,
        network_errors INTEGER DEFAULT 0,
        total_amount_distributed TEXT DEFAULT '0',
        unique_users INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Admin users table
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Admin activities table
      `CREATE TABLE IF NOT EXISTS admin_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      try {
        this.db.exec(tableSQL);
      } catch (error) {
        logger.error('Failed to create table', { error, sql: tableSQL });
        throw error;
      }
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip ON rate_limit_logs(ip_address)',
      'CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_wallet ON rate_limit_logs(wallet_address)',
      'CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created ON rate_limit_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_faucet_metrics_date ON faucet_metrics(date)',
      'CREATE INDEX IF NOT EXISTS idx_api_clients_active ON api_clients(is_active)'
    ];

    for (const indexSQL of indexes) {
      try {
        this.db.exec(indexSQL);
      } catch (error) {
        logger.warn('Failed to create index', { error, sql: indexSQL });
      }
    }

    logger.info('✅ SQLite tables and indexes initialized successfully');
    
    // Create default admin user if it doesn't exist
    await this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser(): Promise<void> {
    try {
      // Check if admin user already exists
      const existingAdmin = this.db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
      
      if (!existingAdmin) {
        const bcrypt = await import('bcrypt');
        const saltRounds = 12;
        const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-secure-password';
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
        
        this.db.prepare(`
          INSERT INTO admin_users (username, password_hash, email, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(['admin', passwordHash, null, 1, new Date().toISOString(), new Date().toISOString()]);
        
        logger.info('✅ Default admin user created successfully');
      }
    } catch (error) {
      logger.warn('Failed to create default admin user', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isConnected = false;
      logger.info('SQLite database disconnected');
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      // Convert PostgreSQL-style parameter placeholders ($1, $2, etc.) to SQLite placeholders (?)
      let convertedSql = sql;
      for (let i = params.length; i >= 1; i--) {
        convertedSql = convertedSql.replace(new RegExp(`\\$${i}`, 'g'), '?');
      }
      
      const stmt = this.db.prepare(convertedSql);
      
      if (sql.trim().toLowerCase().startsWith('select') || sql.trim().toLowerCase().startsWith('pragma')) {
        return stmt.all(params);
      } else {
        const result = stmt.run(params);
        return [{ 
          changes: result.changes, 
          lastInsertRowid: result.lastInsertRowid,
          id: result.lastInsertRowid 
        }];
      }
    } catch (error) {
      logger.error('SQLite query error', { error, sql, params });
      throw error;
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<any | null> {
    try {
      const admin = this.db.prepare('SELECT * FROM admin_users WHERE username = ? AND is_active = 1').get(username);
      
      if (!admin) {
        return null;
      }
      
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      
      if (!isValidPassword) {
        return null;
      }
      
      // Update last login
      this.db.prepare('UPDATE admin_users SET last_login = ? WHERE id = ?')
        .run(new Date().toISOString(), admin.id);
      
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        is_active: admin.is_active,
        last_login: admin.last_login,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      };
    } catch (error) {
      logger.error('Admin authentication error', { error, username });
      return null;
    }
  }

  async saveAdminActivity(activity: any): Promise<void> {
    try {
      const sql = `
        INSERT INTO admin_activities (
          admin_username, action, details, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      const params = [
        activity.admin_username,
        activity.action,
        activity.details || null,
        activity.ip_address || null,
        activity.created_at || new Date().toISOString()
      ];
      
      this.db.prepare(sql).run(params);
      logger.debug('Admin activity saved to SQLite', { username: activity.admin_username, action: activity.action });
    } catch (error) {
      logger.error('Failed to save admin activity to SQLite', { error, activity });
      // Don't throw the error - admin login should continue working even if activity logging fails
    }
  }

  async saveTransaction(transaction: any): Promise<void> {
    try {
      const sql = `
        INSERT INTO transactions (
          transaction_hash, wallet_address, amount, status, network,
          gas_used, gas_price, block_number, confirmation_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        transaction.transaction_hash || '',
        transaction.wallet_address || transaction.recipient_address || '',
        transaction.amount || '0',
        transaction.status || 'pending',
        transaction.network || 'testnet',
        transaction.gas_used || null,
        transaction.gas_price || null,
        transaction.block_number || null,
        transaction.confirmation_time || null,
        transaction.created_at || new Date().toISOString(),
        transaction.updated_at || new Date().toISOString()
      ];
      
      this.db.prepare(sql).run(params);
      logger.debug('Transaction saved to SQLite', { hash: transaction.transaction_hash });
    } catch (error) {
      logger.error('Failed to save transaction to SQLite', { error, transaction });
      // Don't throw the error - the faucet should continue working even if database save fails
    }
  }

  async updateTransactionStatus(
    transactionHash: string,
    status: string,
    gasUsed?: string,
    gasPrice?: string,
    blockNumber?: string,
    confirmationTime?: number
  ): Promise<void> {
    const sql = `
      UPDATE transactions SET 
        status = ?,
        gas_used = COALESCE(?, gas_used),
        gas_price = COALESCE(?, gas_price),
        block_number = COALESCE(?, block_number),
        confirmation_time = COALESCE(?, confirmation_time),
        updated_at = datetime('now')
      WHERE transaction_hash = ?
    `;

    await this.query(sql, [status, gasUsed, gasPrice, blockNumber, confirmationTime, transactionHash]);
  }

  async getTransactionHistory(limit: number = 100, offset: number = 0): Promise<Transaction[]> {
    const sql = `
      SELECT * FROM transactions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const rows = await this.query(sql, [limit, offset]);
    return rows as Transaction[];
  }

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const sql = 'SELECT * FROM transactions WHERE transaction_hash = ?';
    const rows = await this.query(sql, [hash]);
    return rows.length > 0 ? rows[0] as Transaction : null;
  }

  async saveApiClient(client: Omit<ClientRegistration, 'id' | 'created_at'>): Promise<void> {
    const sql = `
      INSERT INTO api_clients (client_id, client_name, api_key, is_active, rate_limit)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.query(sql, [
      client.client_id,
      client.client_name,
      client.api_key,
      client.is_active ? 1 : 0,
      client.rate_limit || 50
    ]);
  }

  async getApiClient(clientId: string): Promise<ClientRegistration | null> {
    const sql = 'SELECT * FROM api_clients WHERE client_id = ? AND is_active = 1';
    const rows = await this.query(sql, [clientId]);
    return rows.length > 0 ? rows[0] as ClientRegistration : null;
  }

  async validateApiKey(apiKey: string): Promise<ClientRegistration | null> {
    const sql = 'SELECT * FROM api_clients WHERE api_key = ? AND is_active = 1';
    const rows = await this.query(sql, [apiKey]);
    return rows.length > 0 ? rows[0] as ClientRegistration : null;
  }

  async logRateLimit(ipAddress: string, endpoint: string, walletAddress?: string): Promise<void> {
    const sql = `
      INSERT INTO rate_limit_logs (ip_address, wallet_address, endpoint, rate_limit_type)
      VALUES (?, ?, ?, ?)
    `;

    await this.query(sql, [
      ipAddress,
      walletAddress || null,
      endpoint,
      walletAddress ? 'wallet' : 'ip'
    ]);
  }

  async saveMetrics(date: string, metrics: Partial<FaucetMetrics>): Promise<void> {
    const sql = `
      INSERT INTO faucet_metrics (
        date, total_requests, successful_requests, failed_requests,
        rate_limit_errors, network_errors, total_amount_distributed, unique_users
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_requests = excluded.total_requests,
        successful_requests = excluded.successful_requests,
        failed_requests = excluded.failed_requests,
        rate_limit_errors = excluded.rate_limit_errors,
        network_errors = excluded.network_errors,
        total_amount_distributed = excluded.total_amount_distributed,
        unique_users = excluded.unique_users,
        updated_at = datetime('now')
    `;

    await this.query(sql, [
      date,
      metrics.total_requests || 0,
      metrics.successful_requests || 0,
      metrics.failed_requests || 0,
      metrics.rate_limit_errors || 0,
      metrics.network_errors || 0,
      metrics.total_amount_distributed || '0',
      metrics.unique_users || 0
    ]);
  }

  async updateDailyMetrics(date: string, field: keyof FaucetMetrics, increment: number = 1): Promise<void> {
    // First, ensure the record exists
    const insertSQL = `
      INSERT OR IGNORE INTO faucet_metrics (date, total_requests, successful_requests, failed_requests, rate_limit_errors, network_errors, total_amount_distributed, unique_users)
      VALUES (?, 0, 0, 0, 0, 0, '0', 0)
    `;
    await this.query(insertSQL, [date]);

    // Then update the specific field
    const updateSQL = `
      UPDATE faucet_metrics SET 
        ${String(field)} = ${String(field)} + ?,
        updated_at = datetime('now')
      WHERE date = ?
    `;

    await this.query(updateSQL, [increment, date]);
  }

  async getMetrics(days: number = 30): Promise<FaucetMetrics[]> {
    const sql = `
      SELECT * FROM faucet_metrics 
      WHERE date >= date('now', '-${days} days')
      ORDER BY date DESC
    `;

    const rows = await this.query(sql);
    return rows as FaucetMetrics[];
  }

  async getTotalStats(): Promise<{
    totalTransactions: number;
    totalAmountDistributed: string;
    totalUniqueUsers: number;
    successRate: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CAST(amount as INTEGER)) as total_amount,
        COUNT(DISTINCT wallet_address) as unique_users,
        ROUND(
          (CAST(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)) * 100,
          2
        ) as success_rate
      FROM transactions
    `;

    const rows = await this.query(sql);
    const stats = rows[0];

    return {
      totalTransactions: stats.total_transactions || 0,
      totalAmountDistributed: (stats.total_amount || 0).toString(),
      totalUniqueUsers: stats.unique_users || 0,
      successRate: stats.success_rate || 0
    };
  }

  async getSetting(name: string): Promise<string | null> {
    const sql = 'SELECT setting_value FROM settings WHERE setting_name = ?';
    const rows = await this.query(sql, [name]);
    return rows.length > 0 ? rows[0].setting_value : null;
  }

  async setSetting(name: string, value: string): Promise<void> {
    const sql = `
      INSERT INTO settings (setting_name, setting_value)
      VALUES (?, ?)
      ON CONFLICT(setting_name) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = datetime('now')
    `;

    await this.query(sql, [name, value]);
  }

  async cleanupOldRecords(): Promise<void> {
    const queries = [
      "DELETE FROM rate_limit_logs WHERE created_at < datetime('now', '-7 days')",
      "DELETE FROM transactions WHERE created_at < datetime('now', '-90 days') AND status != 'confirmed'"
    ];

    for (const sql of queries) {
      try {
        await this.query(sql);
      } catch (error) {
        logger.warn('Failed to cleanup old records', { error, sql });
      }
    }

    logger.info('✅ Old records cleanup completed');
  }

  get connected(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      if (!this.db) {
        return { status: 'disconnected' };
      }

      // Test query
      await this.query('SELECT 1');
      
      return { 
        status: 'healthy',
        details: {
          type: 'sqlite',
          connected: this.isConnected
        }
      };
    } catch (error) {
      return { 
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export singleton instance
export const databaseService = new SQLiteDatabaseService();
