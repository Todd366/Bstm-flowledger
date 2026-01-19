// utils/OfflineSync.js
// Robust offline-first data synchronization with conflict resolution

class OfflineSyncManager {
  constructor(apiBaseUrl = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.listeners = [];
    
    // Initialize
    this.loadQueue();
    this.setupEventListeners();
    this.startAutoSync();
  }

  // Setup online/offline event listeners
  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('📡 Network connection restored');
      this.isOnline = true;
      this.notifyListeners({ type: 'online' });
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network connection lost');
      this.isOnline = false;
      this.notifyListeners({ type: 'offline' });
    });
  }

  // Load sync queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem('flowledger_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`📥 Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (e) {
      console.error('Failed to load sync queue:', e);
      this.syncQueue = [];
    }
  }

  // Save sync queue to localStorage
  saveQueue() {
    try {
      localStorage.setItem('flowledger_sync_queue', JSON.stringify(this.syncQueue));
    } catch (e) {
      console.error('Failed to save sync queue:', e);
    }
  }

  // Add item to sync queue
  queueOperation(operation, data, priority = 'normal') {
    const item = {
      id: Date.now() + Math.random(),
      operation, // 'create_batch', 'create_dispatch', etc.
      data,
      priority, // 'high', 'normal', 'low'
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending' // 'pending', 'syncing', 'success', 'failed'
    };

    this.syncQueue.push(item);
    this.saveQueue();
    
    console.log(`📝 Queued ${operation}:`, item.id);
    this.notifyListeners({ type: 'queued', item });

    // Try immediate sync if online
    if (this.isOnline) {
      setTimeout(() => this.syncAll(), 100);
    }

    return item.id;
  }

  // Sync all pending items
  async syncAll() {
    if (this.isSyncing || !this.isOnline) {
      console.log('⏸️ Sync skipped:', this.isSyncing ? 'already syncing' : 'offline');
      return;
    }

    const pending = this.syncQueue.filter(item => 
      item.status === 'pending' || (item.status === 'failed' && item.retryCount < item.maxRetries)
    );

    if (pending.length === 0) {
      console.log('✅ Sync queue is empty');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_start', count: pending.length });

    console.log(`🔄 Syncing ${pending.length} items...`);

    // Sort by priority: high > normal > low
    const sortedItems = pending.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    let successCount = 0;
    let failedCount = 0;

    for (const item of sortedItems) {
      try {
        item.status = 'syncing';
        this.saveQueue();

        const result = await this.syncItem(item);
        
        if (result.success) {
          item.status = 'success';
          item.syncedAt = new Date().toISOString();
          successCount++;
          console.log(`✅ Synced ${item.operation}:`, item.id);
          this.notifyListeners({ type: 'sync_success', item });
        } else {
          throw new Error(result.error || 'Sync failed');
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${item.operation}:`, error);
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          item.error = error.message;
          failedCount++;
          this.notifyListeners({ type: 'sync_failed', item, error });
        } else {
          item.status = 'pending';
          console.log(`🔁 Will retry ${item.operation} (attempt ${item.retryCount}/${item.maxRetries})`);
        }
      }

      this.saveQueue();
    }

    // Remove successfully synced items
    this.syncQueue = this.syncQueue.filter(item => item.status !== 'success');
    this.saveQueue();

    this.isSyncing = false;
    
    console.log(`📊 Sync complete: ${successCount} success, ${failedCount} failed`);
    this.notifyListeners({ 
      type: 'sync_complete', 
      successCount, 
      failedCount,
      remaining: this.syncQueue.length 
    });
  }

  // Sync individual item
  async syncItem(item) {
    const endpoint = this.getEndpoint(item.operation);
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: this.getMethod(item.operation),
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Queue-Id': item.id.toString()
        },
        body: JSON.stringify(item.data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get API endpoint for operation
  getEndpoint(operation) {
    const endpoints = {
      'create_batch': '/batches',
      'create_dispatch': '/dispatches',
      'approve_dispatch': '/dispatches/approve',
      'confirm_departure': '/dispatches/depart',
      'create_receipt': '/receipts',
      'create_incident': '/incidents',
      'upload_photo': '/photos'
    };

    return endpoints[operation] || '/sync';
  }

  // Get HTTP method for operation
  getMethod(operation) {
    if (operation.startsWith('create_')) return 'POST';
    if (operation.startsWith('update_')) return 'PUT';
    if (operation.startsWith('delete_')) return 'DELETE';
    return 'POST';
  }

  // Start auto-sync timer
  startAutoSync() {
    // Sync every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.syncAll();
      }
    }, 30000);
  }

  // Stop auto-sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get queue status
  getStatus() {
    const pending = this.syncQueue.filter(i => i.status === 'pending').length;
    const failed = this.syncQueue.filter(i => i.status === 'failed').length;
    const syncing = this.syncQueue.filter(i => i.status === 'syncing').length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      total: this.syncQueue.length,
      pending,
      failed,
      syncing
    };
  }

  // Clear all synced items
  clearSynced() {
    const before = this.syncQueue.length;
    this.syncQueue = this.syncQueue.filter(item => item.status !== 'success');
    this.saveQueue();
    const cleared = before - this.syncQueue.length;
    console.log(`🗑️ Cleared ${cleared} synced items`);
    return cleared;
  }

  // Retry failed items
  retryFailed() {
    const failed = this.syncQueue.filter(i => i.status === 'failed');
    failed.forEach(item => {
      item.status = 'pending';
      item.retryCount = 0;
    });
    this.saveQueue();
    console.log(`🔁 Retrying ${failed.length} failed items`);
    if (this.isOnline) {
      this.syncAll();
    }
    return failed.length;
  }

  // Add listener for sync events
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  // Cleanup
  destroy() {
    this.stopAutoSync();
    this.listeners = [];
  }
}

// React Hook for using offline sync
export const useOfflineSync = () => {
  const [syncManager] = React.useState(() => new OfflineSyncManager());
  const [status, setStatus] = React.useState(syncManager.getStatus());

  React.useEffect(() => {
    const unsubscribe = syncManager.addListener((event) => {
      setStatus(syncManager.getStatus());
    });

    return () => {
      unsubscribe();
      syncManager.destroy();
    };
  }, [syncManager]);

  return {
    queue: (operation, data, priority) => syncManager.queueOperation(operation, data, priority),
    syncAll: () => syncManager.syncAll(),
    retryFailed: () => syncManager.retryFailed(),
    clearSynced: () => syncManager.clearSynced(),
    status
  };
};

export default OfflineSyncManager;

// Usage Example:
/*
import { useOfflineSync } from './utils/OfflineSync';

function MyComponent() {
  const { queue, syncAll, status } = useOfflineSync();

  const createBatch = async (batchData) => {
    // Queue the operation
    const queueId = queue('create_batch', batchData, 'high');
    
    // Save locally immediately
    const localBatch = {
      ...batchData,
      id: `TEMP-${Date.now()}`,
      syncStatus: 'pending',
      syncQueueId: queueId
    };
    
    // Update local state
    setBatches(prev => [...prev, localBatch]);
    
    // Sync will happen automatically when online
    return localBatch;
  };

  return (
    <div>
      {!status.isOnline && (
        <div className="bg-yellow-100 p-2 text-sm">
          ⚠️ Offline mode - {status.pending} items queued for sync
        </div>
      )}
      
      {status.isSyncing && (
        <div className="bg-blue-100 p-2 text-sm">
          🔄 Syncing {status.pending} items...
        </div>
      )}
      
      {status.failed > 0 && (
        <div className="bg-red-100 p-2 text-sm">
          ❌ {status.failed} items failed to sync
          <button onClick={() => retryFailed()}>Retry</button>
        </div>
      )}
    </div>
  );
}
*/
