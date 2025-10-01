/**
 * Offline Storage Service - IndexedDB Management
 * Handles offline data synchronization with local storage
 */

interface DBConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: Array<{ name: string; keyPath: string; unique: boolean }>;
  }[];
}

interface ScanData {
  id: string;
  toolId: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  timestamp: number;
  synced: boolean;
}

interface ToolExecution {
  id: string;
  toolId: string;
  toolName: string;
  parameters: any;
  result?: any;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  synced: boolean;
}

interface CachedData {
  id: string;
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private dbConfig: DBConfig = {
    dbName: 'SunziCerebroOfflineDB',
    version: 1,
    stores: [
      {
        name: 'pendingScans',
        keyPath: 'id',
        indexes: [
          { name: 'status', keyPath: 'status', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'synced', keyPath: 'synced', unique: false }
        ]
      },
      {
        name: 'pendingExecutions',
        keyPath: 'id',
        indexes: [
          { name: 'toolId', keyPath: 'toolId', unique: false },
          { name: 'status', keyPath: 'status', unique: false },
          { name: 'synced', keyPath: 'synced', unique: false }
        ]
      },
      {
        name: 'pendingAnalytics',
        keyPath: 'id',
        indexes: [
          { name: 'eventType', keyPath: 'eventType', unique: false },
          { name: 'synced', keyPath: 'synced', unique: false }
        ]
      },
      {
        name: 'cachedTools',
        keyPath: 'id',
        indexes: [
          { name: 'category', keyPath: 'category', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      {
        name: 'cachedScans',
        keyPath: 'id',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      {
        name: 'cachedData',
        keyPath: 'key',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
        ]
      },
      {
        name: 'strategicModules',
        keyPath: 'id',
        indexes: [
          { name: 'moduleId', keyPath: 'moduleId', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      {
        name: 'securityAlerts',
        keyPath: 'id',
        indexes: [
          { name: 'priority', keyPath: 'priority', unique: false },
          { name: 'read', keyPath: 'read', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      }
    ]
  };

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.dbName, this.dbConfig.version);

      request.onerror = () => {
        console.error('[OfflineStorage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineStorage] Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        console.log('[OfflineStorage] Upgrading database schema...');

        // Create object stores
        this.dbConfig.stores.forEach((storeConfig) => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const objectStore = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath
            });

            // Create indexes
            storeConfig.indexes?.forEach((indexConfig) => {
              objectStore.createIndex(
                indexConfig.name,
                indexConfig.keyPath,
                { unique: indexConfig.unique }
              );
            });

            console.log('[OfflineStorage] Created object store:', storeConfig.name);
          }
        });
      };
    });
  }

  /**
   * Add pending scan to offline queue
   */
  async addPendingScan(scan: ScanData): Promise<void> {
    await this.put('pendingScans', scan);
    console.log('[OfflineStorage] Added pending scan:', scan.id);
  }

  /**
   * Get all pending scans
   */
  async getPendingScans(): Promise<ScanData[]> {
    return this.getAll('pendingScans');
  }

  /**
   * Get unsynced scans
   */
  async getUnsyncedScans(): Promise<ScanData[]> {
    return this.getByIndex('pendingScans', 'synced', false);
  }

  /**
   * Mark scan as synced
   */
  async markScanSynced(scanId: string): Promise<void> {
    const scan = await this.get('pendingScans', scanId);
    if (scan) {
      scan.synced = true;
      await this.put('pendingScans', scan);
      console.log('[OfflineStorage] Marked scan as synced:', scanId);
    }
  }

  /**
   * Delete synced scan
   */
  async deleteScan(scanId: string): Promise<void> {
    await this.delete('pendingScans', scanId);
    console.log('[OfflineStorage] Deleted scan:', scanId);
  }

  /**
   * Add pending tool execution
   */
  async addPendingExecution(execution: ToolExecution): Promise<void> {
    await this.put('pendingExecutions', execution);
    console.log('[OfflineStorage] Added pending execution:', execution.id);
  }

  /**
   * Get all pending executions
   */
  async getPendingExecutions(): Promise<ToolExecution[]> {
    return this.getAll('pendingExecutions');
  }

  /**
   * Get unsynced executions
   */
  async getUnsyncedExecutions(): Promise<ToolExecution[]> {
    return this.getByIndex('pendingExecutions', 'synced', false);
  }

  /**
   * Mark execution as synced
   */
  async markExecutionSynced(executionId: string): Promise<void> {
    const execution = await this.get('pendingExecutions', executionId);
    if (execution) {
      execution.synced = true;
      await this.put('pendingExecutions', execution);
      console.log('[OfflineStorage] Marked execution as synced:', executionId);
    }
  }

  /**
   * Delete execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    await this.delete('pendingExecutions', executionId);
    console.log('[OfflineStorage] Deleted execution:', executionId);
  }

  /**
   * Add analytics event
   */
  async addAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    await this.put('pendingAnalytics', event);
  }

  /**
   * Get unsynced analytics events
   */
  async getUnsyncedAnalytics(): Promise<AnalyticsEvent[]> {
    return this.getByIndex('pendingAnalytics', 'synced', false);
  }

  /**
   * Mark analytics event as synced
   */
  async markAnalyticsSynced(eventId: string): Promise<void> {
    const event = await this.get('pendingAnalytics', eventId);
    if (event) {
      event.synced = true;
      await this.put('pendingAnalytics', event);
    }
  }

  /**
   * Cache tool data
   */
  async cacheTool(tool: any): Promise<void> {
    await this.put('cachedTools', {
      ...tool,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached tool
   */
  async getCachedTool(toolId: string): Promise<any> {
    return this.get('cachedTools', toolId);
  }

  /**
   * Get all cached tools
   */
  async getAllCachedTools(): Promise<any[]> {
    return this.getAll('cachedTools');
  }

  /**
   * Cache scan results
   */
  async cacheScan(scan: any): Promise<void> {
    await this.put('cachedScans', {
      ...scan,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached scan
   */
  async getCachedScan(scanId: string): Promise<any> {
    return this.get('cachedScans', scanId);
  }

  /**
   * Cache generic data with expiration
   */
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const cachedData: CachedData = {
      id: this.generateId(),
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    await this.put('cachedData', cachedData);
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any> {
    const cached = await this.get('cachedData', key);

    if (!cached) {
      return null;
    }

    // Check expiration
    if (cached.expiresAt < Date.now()) {
      await this.delete('cachedData', key);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    const allCached = await this.getAll('cachedData');
    const now = Date.now();

    for (const item of allCached) {
      if (item.expiresAt < now) {
        await this.delete('cachedData', item.key);
      }
    }

    console.log('[OfflineStorage] Cleared expired cache entries');
  }

  /**
   * Cache strategic module data
   */
  async cacheStrategicModule(module: any): Promise<void> {
    await this.put('strategicModules', {
      ...module,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached strategic module
   */
  async getCachedStrategicModule(moduleId: string): Promise<any> {
    return this.getByIndex('strategicModules', 'moduleId', moduleId);
  }

  /**
   * Get all cached strategic modules
   */
  async getAllCachedStrategicModules(): Promise<any[]> {
    return this.getAll('strategicModules');
  }

  /**
   * Add security alert
   */
  async addSecurityAlert(alert: any): Promise<void> {
    await this.put('securityAlerts', {
      ...alert,
      id: alert.id || this.generateId(),
      read: false,
      timestamp: Date.now()
    });
  }

  /**
   * Get unread security alerts
   */
  async getUnreadAlerts(): Promise<any[]> {
    return this.getByIndex('securityAlerts', 'read', false);
  }

  /**
   * Mark alert as read
   */
  async markAlertRead(alertId: string): Promise<void> {
    const alert = await this.get('securityAlerts', alertId);
    if (alert) {
      alert.read = true;
      await this.put('securityAlerts', alert);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const stats: any = {
      stores: {},
      totalRecords: 0
    };

    for (const storeConfig of this.dbConfig.stores) {
      const count = await this.count(storeConfig.name);
      stats.stores[storeConfig.name] = count;
      stats.totalRecords += count;
    }

    return stats;
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAllData(): Promise<void> {
    for (const storeConfig of this.dbConfig.stores) {
      await this.clear(storeConfig.name);
    }

    console.log('[OfflineStorage] All data cleared');
  }

  // ============================================================================
  // Generic IndexedDB Operations
  // ============================================================================

  /**
   * Put data into object store
   */
  private async put(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from object store
   */
  private async get(storeName: string, key: string): Promise<any> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from object store
   */
  private async getAll(storeName: string): Promise<any[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data by index
   */
  private async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from object store
   */
  private async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in object store
   */
  private async count(storeName: string): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear object store
   */
  private async clear(storeName: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  offlineStorageService.initialize().catch(console.error);
}

export default offlineStorageService;
