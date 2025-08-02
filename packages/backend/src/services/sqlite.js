// SQLite Database Service for SUI-FX
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      logger.info('✅ SQLite database connected successfully');
      return true;
    } catch (error) {
      logger.error('❌ SQLite connection failed:', error);
      this.connected = false;
      return false;
    }
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

  // Query method to mimic PostgreSQL interface
  async query(text, params = []) {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    try {
      // Convert PostgreSQL $1, $2, $3 placeholders to SQLite ? placeholders
      let sqliteQuery = text.replace(/\$(\d+)/g, '?');
      
      // Handle SELECT queries
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sqliteQuery);
        const rows = stmt.all(params);
        return { rows };
      }
      
      // Handle INSERT/UPDATE/DELETE queries
      if (sqliteQuery.includes('RETURNING')) {
        // Split the query to remove RETURNING clause
        const parts = sqliteQuery.split(/RETURNING\s+\*/i);
        const insertQuery = parts[0].trim();
        
        const stmt = this.db.prepare(insertQuery);
        const result = stmt.run(params);
        
        // Get the inserted record
        if (result.lastInsertRowid) {
          // Extract table name from INSERT statement
          const tableMatch = insertQuery.match(/INSERT INTO (\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`);
            const rows = [selectStmt.get(result.lastInsertRowid)];
            return { rows };
          }
        }
        
        return { rows: [], rowCount: result.changes };
      }
      
      // Regular INSERT/UPDATE/DELETE without RETURNING
      const stmt = this.db.prepare(sqliteQuery);
      const result = stmt.run(params);
      
      return { 
        rows: [], 
        rowCount: result.changes,
        insertId: result.lastInsertRowid 
      };
    } catch (error) {
      logger.error('SQLite query error:', error);
      throw error;
    }
  }

  // Specific method for API clients
  async createApiClient(clientData) {
    const {
      name,
      description,
      homepage_url,
      callback_url,
      client_id,
      client_secret,
      api_key
    } = clientData;

    const query = `
      INSERT INTO api_clients (
        id, name, description, homepage_url, callback_url,
        client_id, client_secret, api_key, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `;

    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.query(query, [
        id, name, description, homepage_url, callback_url,
        client_id, client_secret, api_key
      ]);

      // Return the created client
      const selectQuery = `SELECT * FROM api_clients WHERE client_id = ?`;
      const result = await this.query(selectQuery, [client_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating API client:', error);
      throw error;
    }
  }
}

export const sqliteService = new SQLiteService();
