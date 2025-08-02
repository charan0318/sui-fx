/**
 * SUI-FX Simple Data Store
 * Temporary in-memory storage for quick setup
 */

export interface AdminActivity {
  admin_user: string;
  operation: string;
  details?: string;
  timestamp?: string;
}

export interface SystemMetrics {
  drops_total: number;
  drops_today: number;
  errors_total: number;
  rate_limited_requests: number;
  active_wallets: number;
}

class SimpleDataStore {
  private adminActivities: AdminActivity[] = [];
  private metrics: SystemMetrics = {
    drops_total: 0,
    drops_today: 0,
    errors_total: 0,
    rate_limited_requests: 0,
    active_wallets: 0
  };

  async authenticateAdminUser(username: string, password: string): Promise<boolean> {
    // Simple hardcoded admin for quick setup
    return username === 'suifx_admin' && password === 'SuiFX2025Admin!';
  }

  async logAdminOperation(activity: AdminActivity): Promise<void> {
    this.adminActivities.push({
      ...activity,
      timestamp: new Date().toISOString()
    });
  }

  async generateSystemMetrics(): Promise<SystemMetrics> {
    return { ...this.metrics };
  }

  async performHealthCheck(): Promise<{ status: string; details: any }> {
    return {
      status: 'healthy',
      details: {
        database: 'SimpleDataStore (in-memory)',
        activities_logged: this.adminActivities.length,
        metrics_available: true
      }
    };
  }

  async incrementMetric(metricName: keyof SystemMetrics, amount: number = 1): Promise<void> {
    if (metricName in this.metrics) {
      (this.metrics as any)[metricName] += amount;
    }
  }

  async getAdminActivities(limit: number = 50): Promise<AdminActivity[]> {
    return this.adminActivities.slice(-limit);
  }
}

export const simpleDataStore = new SimpleDataStore();
