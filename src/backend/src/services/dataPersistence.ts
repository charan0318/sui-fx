/**
 * SUI-FX Data Persistence Layer
 * Original database management with custom query patterns
 */

import { Pool, QueryResult } from 'pg';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import bcrypt from 'bcrypt';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// SUI-FX Data Structures
export interface DropLogEntry {
  id?: string;
  request_id: string;
  wallet_address: string;
  drop_amount: string;
  tx: string;
  network: string;
  status: 'success' | 'failed' | 'pending';
  error_details?: string;
  ip_address: string;
  user_agent?: string;
  logged_at: string;
}

export interface SystemLogEntry {
  id?: string;
  request_id: string;
  endpoint: string;
  method: string;
  client_ip: string;
  user_agent?: string;
  response_status: number;
  execution_time: number;
  logged_at: string;
}

export interface AdminActivity {
  id?: string;
  admin_user: string;
  operation: string;
  operation_details?: string;
  client_ip: string;
  user_agent?: string;
  logged_at?: string;
}

export interface AdminAccount {
  id?: string;
  username: string;
  password_hash: string;
  email?: string;
  role: 'admin' | 'superadmin';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  id?: number;
  metric_type: string;
  metric_value: number;
  metric_data?: object;
  period_start: string;
  period_end: string;
  logged_at: string;
}

class DataPersistenceLayer {
  private connectionPool?: Pool;
  private sqliteDb?: Database;
  private connectionEstablished = false;
  private isUsingSqlite = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Check if using SQLite or PostgreSQL
    this.isUsingSqlite = config.database.url.startsWith('sqlite:');
    
    if (this.isUsingSqlite) {
      await this.initializeSqlite();
    } else {
      this.initializePostgreSQL();
    }
  }

  private async initializeSqlite(): Promise<void> {
    try {
      const dbPath = config.database.url.replace('sqlite:', '');
      
      this.sqliteDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Initialize database schema
      const initScript = fs.readFileSync(
        path.join(process.cwd(), '../../scripts/init-sqlite.sql'), 
        'utf8'
      );
      
      await this.sqliteDb.exec(initScript);
      
      this.connectionEstablished = true;
      logger.info('[SUI-FX] SQLite database initialized successfully', { 
        path: dbPath 
      });
    } catch (error) {
      logger.error('[SUI-FX] SQLite initialization failed', { error });
      throw error;
    }
  }

  private initializePostgreSQL(): void {
    this.connectionPool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Enhanced connection event handling
    this.connectionPool.on('connect', (client) => {
      logger.info('[SUI-FX] PostgreSQL connection established');
      this.connectionEstablished = true;
    });

    this.connectionPool.on('error', (err) => {
      logger.error('[SUI-FX] PostgreSQL connection error', { error: err.message });
      this.connectionEstablished = false;
    });

    this.connectionPool.on('remove', () => {
      logger.debug('[SUI-FX] PostgreSQL connection removed from pool');
    });
  }

  async establishConnection(): Promise<void> {
    try {
      if (this.isUsingSqlite) {
        // Test SQLite connection
        const result = await this.sqliteDb!.get('SELECT datetime("now") as current_time');
        logger.info('[SUI-FX] ✅ SQLite connection verified', {
          timestamp: result.current_time,
          database: 'SQLite'
        });
        this.connectionEstablished = true;
      } else {
        // Test PostgreSQL connection
        const testResult = await this.connectionPool!.query('SELECT NOW() as current_time, version() as db_version');
        
        if (testResult.rows.length > 0) {
          const { current_time, db_version } = testResult.rows[0];
          logger.info('[SUI-FX] ✅ PostgreSQL connection verified', {
            timestamp: current_time,
            version: db_version.split(' ')[0]
          });
          this.connectionEstablished = true;
        }
      }
    } catch (error) {
      logger.error('[SUI-FX] Database connection failed', { error });
      throw error;
    }
  }

  async terminateConnection(): Promise<void> {
    try {
      await this.connectionPool.end();
      this.connectionEstablished = false;
      logger.info('[SUI-FX] Database connections terminated');
    } catch (error) {
      logger.error('[SUI-FX] Error terminating database connections', { error });
    }
  }

  // Custom method: Record token drop with enhanced data
  async recordTokenDrop(dropData: DropLogEntry): Promise<string> {
    const query = `
      INSERT INTO sui_faucet_logs (
        request_id, wallet_address, drop_amount, tx, network, 
        status, error_details, ip_address, user_agent, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      dropData.request_id,
      dropData.wallet_address,
      dropData.drop_amount,
      dropData.tx,
      dropData.network || 'testnet',
      dropData.status,
      dropData.error_details,
      dropData.ip_address,
      dropData.user_agent,
      dropData.logged_at
    ];

    try {
      const result = await this.connectionPool.query(query, values);
      const logId = result.rows[0]?.id;
      
      logger.info('[SUI-FX] Token drop recorded', {
        logId,
        wallet: dropData.wallet_address,
        status: dropData.status,
        tx: dropData.tx
      });

      return logId;
    } catch (error) {
      logger.error('[SUI-FX] Failed to record token drop', {
        error,
        wallet: dropData.wallet_address
      });
      throw error;
    }
  }

  // Custom method: Get wallet drop history with advanced filtering
  async retrieveWalletDropHistory(
    walletAddress: string, 
    limit = 10, 
    offset = 0
  ): Promise<DropLogEntry[]> {
    const query = `
      SELECT 
        id, request_id, wallet_address, drop_amount, tx, network,
        status, error_details, ip_address, user_agent, logged_at
      FROM sui_faucet_logs 
      WHERE wallet_address = $1 
      ORDER BY logged_at DESC 
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await this.connectionPool.query(query, [walletAddress, limit, offset]);
      
      logger.debug('[SUI-FX] Retrieved wallet drop history', {
        wallet: walletAddress,
        count: result.rows.length
      });

      return result.rows.map(row => ({
        id: row.id,
        request_id: row.request_id,
        wallet_address: row.wallet_address,
        drop_amount: row.drop_amount,
        tx: row.tx,
        network: row.network,
        status: row.status,
        error_details: row.error_details,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        logged_at: row.logged_at
      }));
    } catch (error) {
      logger.error('[SUI-FX] Failed to retrieve wallet history', {
        error,
        wallet: walletAddress
      });
      return [];
    }
  }

  // Custom method: Check recent wallet activity with time-based logic
  async checkRecentWalletActivity(walletAddress: string, hoursBack = 24): Promise<{
    hasRecentActivity: boolean;
    lastDropTime?: string;
    dropCount: number;
  }> {
    const query = `
      SELECT COUNT(*) as drop_count, MAX(logged_at) as last_drop
      FROM sui_faucet_logs 
      WHERE wallet_address = $1 
        AND logged_at > NOW() - INTERVAL '${hoursBack} hours'
        AND status = 'success'
    `;

    try {
      const result = await this.connectionPool.query(query, [walletAddress]);
      const row = result.rows[0];
      
      const dropCount = parseInt(row.drop_count, 10);
      const hasActivity = dropCount > 0;
      
      logger.debug('[SUI-FX] Wallet activity check', {
        wallet: walletAddress,
        hoursBack,
        dropCount,
        hasActivity
      });

      return {
        hasRecentActivity: hasActivity,
        lastDropTime: row.last_drop,
        dropCount
      };
    } catch (error) {
      logger.error('[SUI-FX] Failed to check wallet activity', {
        error,
        wallet: walletAddress
      });
      return {
        hasRecentActivity: false,
        dropCount: 0
      };
    }
  }

  // Custom method: Generate system metrics with aggregation
  async generateSystemMetrics(periodHours = 24): Promise<{
    totalDrops: number;
    successfulDrops: number;
    failedDrops: number;
    uniqueWallets: number;
    totalSuiDistributed: string;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_drops,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_drops,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_drops,
        COUNT(DISTINCT wallet_address) as unique_wallets,
        COALESCE(SUM(CASE WHEN status = 'success' THEN drop_amount::bigint ELSE 0 END), 0) as total_distributed
      FROM sui_faucet_logs 
      WHERE logged_at > NOW() - INTERVAL '${periodHours} hours'
    `;

    try {
      const result = await this.connectionPool.query(query);
      const metrics = result.rows[0];

      logger.info('[SUI-FX] System metrics generated', {
        periodHours,
        totalDrops: metrics.total_drops,
        successRate: `${Math.round((metrics.successful_drops / metrics.total_drops) * 100)}%`
      });

      return {
        totalDrops: parseInt(metrics.total_drops, 10),
        successfulDrops: parseInt(metrics.successful_drops, 10),
        failedDrops: parseInt(metrics.failed_drops, 10),
        uniqueWallets: parseInt(metrics.unique_wallets, 10),
        totalSuiDistributed: metrics.total_distributed.toString()
      };
    } catch (error) {
      logger.error('[SUI-FX] Failed to generate metrics', { error });
      return {
        totalDrops: 0,
        successfulDrops: 0,
        failedDrops: 0,
        uniqueWallets: 0,
        totalSuiDistributed: '0'
      };
    }
  }

  // Custom method: Admin authentication with enhanced security
  async authenticateAdminUser(username: string, password: string): Promise<{
    authenticated: boolean;
    user?: AdminAccount;
    error?: string;
  }> {
    const query = `
      SELECT id, username, password_hash, email, role, is_active, last_login, created_at, updated_at
      FROM sui_admin_users 
      WHERE username = $1 AND is_active = true
    `;

    try {
      const result = await this.connectionPool.query(query, [username]);
      
      if (result.rows.length === 0) {
        logger.warn('[SUI-FX] Admin login attempt - user not found', { username });
        return {
          authenticated: false,
          error: 'Invalid credentials'
        };
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        logger.warn('[SUI-FX] Admin login attempt - invalid password', { username });
        return {
          authenticated: false,
          error: 'Invalid credentials'
        };
      }

      // Update last login timestamp
      await this.connectionPool.query(
        'UPDATE sui_admin_users SET last_login = NOW(), updated_at = NOW() WHERE username = $1',
        [username]
      );

      logger.info('[SUI-FX] Admin user authenticated', {
        username,
        role: user.role
      });

      return {
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          password_hash: user.password_hash,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      };
    } catch (error) {
      logger.error('[SUI-FX] Admin authentication error', {
        error,
        username
      });
      return {
        authenticated: false,
        error: 'Authentication service error'
      };
    }
  }

  // Custom method: Log admin operations with detailed tracking
  async logAdminOperation(activityData: AdminActivity): Promise<void> {
    const query = `
      INSERT INTO sui_admin_activities (
        admin_user, operation, operation_details, client_ip, user_agent, logged_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    const values = [
      activityData.admin_user,
      activityData.operation,
      activityData.operation_details,
      activityData.client_ip,
      activityData.user_agent
    ];

    try {
      await this.connectionPool.query(query, values);
      
      logger.info('[SUI-FX] Admin operation logged', {
        admin: activityData.admin_user,
        operation: activityData.operation
      });
    } catch (error) {
      logger.error('[SUI-FX] Failed to log admin operation', {
        error,
        admin: activityData.admin_user,
        operation: activityData.operation
      });
    }
  }

  // Custom method: Execute raw query with error handling
  async executeCustomQuery(queryText: string, params: any[] = []): Promise<QueryResult> {
    try {
      const result = await this.connectionPool.query(queryText, params);
      
      logger.debug('[SUI-FX] Custom query executed', {
        rowCount: result.rowCount,
        paramCount: params.length
      });

      return result;
    } catch (error) {
      logger.error('[SUI-FX] Custom query failed', {
        error,
        query: queryText.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  // Utility method: Check database health
  async checkDatabaseHealth(): Promise<{
    healthy: boolean;
    details: {
      connected: boolean;
      responseTime: number;
      poolStats: object;
    };
  }> {
    const startTime = Date.now();
    
    try {
      await this.connectionPool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        details: {
          connected: this.connectionEstablished,
          responseTime,
          poolStats: {
            totalCount: this.connectionPool.totalCount,
            idleCount: this.connectionPool.idleCount,
            waitingCount: this.connectionPool.waitingCount
          }
        }
      };
    } catch (error) {
      logger.error('[SUI-FX] Database health check failed', { error });
      
      return {
        healthy: false,
        details: {
          connected: false,
          responseTime: Date.now() - startTime,
          poolStats: {}
        }
      };
    }
  }
}

// Export singleton instance
export const dataPersistenceService = new DataPersistenceLayer();

// Backward compatibility
export const databaseService = dataPersistenceService;
