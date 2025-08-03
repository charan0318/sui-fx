// Simple SQLite Database Service for SUI-FX (PostgreSQL removed)
import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../utils/logger.js';

class SQLiteService {
  constructor() {
    this.db = null;
    this.connected = false;
  }

  async connect() {
    try {
      const dbPath = path.resolve('./suifx.db');
      logger.info(`Connecting to SQLite database at: ${dbPath}`);
      this.db = new Database(dbPath);
      this.connected = true;
      await this.initializeTables();
      logger.info('✅ SQLite database connected successfully');
      return true;
    } catch (error) {
      logger.error('❌ SQLite connection failed:', error);
      this.connected = false;
      return false;
    }
  }

  async initializeTables() {
    if (!this.db) return;

    const tables = [
      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        transaction_hash TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        ip_address TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Daily metrics table
      `CREATE TABLE IF NOT EXISTS faucet_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        total_requests INTEGER DEFAULT 0,
        successful_requests INTEGER DEFAULT 0,
        failed_requests INTEGER DEFAULT 0,
        total_amount_distributed TEXT DEFAULT '0',
        unique_users INTEGER DEFAULT 0,
        rate_limit_errors INTEGER DEFAULT 0,
        network_errors INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_name TEXT NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Admin users table
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      this.db.exec(sql);
    }
    logger.info('SQLite tables initialized');
  }

  isConnected() {
    return this.connected && this.db;
  }

  async disconnect() {
    if (this.db) {
      this.db.close();
      this.connected = false;
      logger.info('SQLite database disconnected');
    }
  }

  // Simple query method for SQLite
  query(text, params = []) {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    try {
      // Convert PostgreSQL $1, $2, $3 placeholders to SQLite ? placeholders
      let sqliteQuery = text.replace(/\$(\d+)/g, '?');
      
      // Replace PostgreSQL NOW() with SQLite CURRENT_TIMESTAMP
      sqliteQuery = sqliteQuery.replace(/NOW\(\)/g, "datetime('now')");
      
      // Replace PostgreSQL UPSERT with SQLite INSERT OR REPLACE
      sqliteQuery = sqliteQuery.replace(/ON CONFLICT.*DO UPDATE SET/g, 'ON CONFLICT DO UPDATE SET');
      
      // Handle SELECT queries
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sqliteQuery);
        const rows = stmt.all(params);
        return { rows, rowCount: rows.length };
      }
      
      // Handle INSERT/UPDATE/DELETE queries
      const stmt = this.db.prepare(sqliteQuery);
      const result = stmt.run(params);
      return { 
        rows: [], 
        rowCount: result.changes,
        insertId: result.lastInsertRowid 
      };
      
    } catch (error) {
      logger.error('SQLite query error:', { 
        query: text, 
        params, 
        error: error.message,
        code: error.code 
      });
      throw error;
    }
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();
export default SQLiteService;
