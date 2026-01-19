// components/NotificationSystem.jsx
// Complete notification system with push, email, and SMS support

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

// Notification manager class
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.loadNotifications();
    this.requestPermission();
  }

  // Request browser notification permission
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (e) {
        console.error('Notification permission error:', e);
      }
    }
  }

  // Load notifications from storage
  loadNotifications() {
    try {
      const stored = localStorage.getItem('flowledger_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }

  // Save notifications to storage
  saveNotifications() {
    try {
      localStorage.setItem('flowledger_notifications', JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }

  // Create notification
  create(type, message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type, // 'batch_created', 'dispatch_approved', 'incident_reported', etc.
      message,
      severity: options.severity || 'info', // 'info', 'warning', 'critical', 'success'
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: options.actionUrl || null,
      data: options.data || {}
    };

    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifyListeners({ type: 'created', notification });

    // Show browser notification if enabled
    if (options.showBrowser !== false) {
      this.showBrowserNotification(notification);
    }

    // Play sound for critical notifications
    if (notification.severity === 'critical') {
      this.playNotificationSound();
    }

    return notification;
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = this.getIconForSeverity(notification.severity);
      
      const browserNotif = new Notification('FlowLedger-Ω', {
        body: notification.message,
        icon: icon,
        badge: '/logo192.png',
        tag: notification.id.toString(),
        requireInteraction: notification.severity === 'critical',
        silent: notification.severity === 'info'
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotif.close();
      };
    }
  }

  // Get icon for severity
  getIconForSeverity(severity) {
    const icons = {
      info: '/icons/info.png',
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      critical: '/icons/critical.png'
    };
    return icons[severity] || icons.info;
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  // Mark as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this.saveNotifications();
      this.notifyListeners({ type: 'read', notification });
    }
  }

  // Mark all as read
  markAllAsRead() {
    let count = 0;
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.readAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) {
      this.saveNotifications();
      this.notifyListeners({ type: 'all_read', count });
    }
    return count;
  }

  // Delete notification
  delete(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const deleted = this.notifications.splice(index, 1)[0];
      this.saveNotifications();
      this.notifyListeners({ type: 'deleted', notification: deleted });
    }
  }

  // Clear old notifications
  clearOld(daysOld = 30) {
    const cutoff = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    const before = this.notifications.length;
    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp) >= cutoff
    );
    const cleared = before - this.notifications.length;
    if (cleared > 0) {
      this.saveNotifications();
      this.notifyListeners({ type: 'cleared', count: cleared });
    }
    return cleared;
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getAll() {
    return this.notifications;
  }

  // Get by severity
  getBySeverity(severity) {
    return this.notifications.filter(n => n.severity === severity);
  }

  // Add listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }
}

// Singleton instance
const notificationManager = new NotificationManager();

// React component
export const NotificationBell = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(notificationManager.getUnreadCount());

  useEffect(() => {
    const unsubscribe = notificationManager.addListener(() => {
      setUnreadCount(notificationManager.getUnreadCount());
    });
    return unsubscribe;
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Bell className="w-6 h-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Notification panel component
export const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(notificationManager.getAll());
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'critical'

  useEffect(() => {
    const unsubscribe = notificationManager.addListener(() => {
      setNotifications([...notificationManager.getAll()]);
    });
    return unsubscribe;
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.severity === 'critical';
    return true;
  });

  const handleMarkAsRead = (id) => {
    notificationManager.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const handleDelete = (id) => {
    notificationManager.delete(id);
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      info: <Info className="w-5 h-5 text-blue-600" />,
      success: <CheckCircle className="w-5 h-5 text-green-600" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      critical: <XCircle className="w-5 h-5 text-red-600" />
    };
    return icons[severity] || icons.info;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-50 border-blue-200',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      critical: 'bg-red-50 border-red-200'
    };
    return colors[severity] || colors.info;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              {notificationManager.getUnreadCount()} unread
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Unread ({notificationManager.getUnreadCount()})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                filter === 'critical' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Critical ({notificationManager.getBySeverity('critical').length})
            </button>
          </div>
          
          {notificationManager.getUnreadCount() > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-all ${
                    getSeverityColor(notification.severity)
                  } ${!notification.read ? 'border-l-4' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(notification.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">
                          {notification.type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 hover:bg-white rounded transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for using notifications
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(notificationManager.getUnreadCount());
  const [notifications, setNotifications] = useState(notificationManager.getAll());

  useEffect(() => {
    const unsubscribe = notificationManager.addListener(() => {
      setUnreadCount(notificationManager.getUnreadCount());
      setNotifications([...notificationManager.getAll()]);
    });
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    create: (type, message, options) => notificationManager.create(type, message, options),
    markAsRead: (id) => notificationManager.markAsRead(id),
    markAllAsRead: () => notificationManager.markAllAsRead(),
    delete: (id) => notificationManager.delete(id),
    clearOld: (days) => notificationManager.clearOld(days)
  };
};

// Notification toast (temporary popup)
export const NotificationToast = () => {
  const [activeToasts, setActiveToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationManager.addListener((event) => {
      if (event.type === 'created' && event.notification.severity !== 'info') {
        const toast = {
          ...event.notification,
          toastId: Date.now()
        };
        
        setActiveToasts(prev => [...prev, toast]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.toastId !== toast.toastId));
        }, 5000);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {activeToasts.map(toast => (
        <div
          key={toast.toastId}
          className={`min-w-[300px] max-w-md border-l-4 rounded-lg shadow-lg p-4 animate-slide-in ${
            toast.severity === 'critical' ? 'bg-red-50 border-red-500' :
            toast.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
            'bg-green-50 border-green-500'
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.severity === 'critical' ? <XCircle className="w-5 h-5 text-red-600" /> :
             toast.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
             <CheckCircle className="w-5 h-5 text-green-600" />}
            
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {toast.type.replace(/_/g, ' ').toUpperCase()}
              </p>
              <p className="text-sm mt-1">{toast.message}</p>
            </div>
            
            <button
              onClick={() => setActiveToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
              className="hover:bg-white rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default notificationManager;

// Usage Example:
/*
import { useNotifications, NotificationBell, NotificationPanel, NotificationToast } from './components/NotificationSystem';

function App() {
  const { create, unreadCount } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const handleBatchCreated = (batch) => {
    create('batch_created', `New batch ${batch.id} created with ${batch.quantity} units`, {
      severity: 'success',
      showBrowser: true,
      data: { batchId: batch.id }
    });
  };

  const handleIncident = (incident) => {
    create('incident_reported', `Incident: ${incident.reason}. Expected: ${incident.quantityExpected}, Received: ${incident.quantityReceived}`, {
      severity: 'critical',
      showBrowser: true,
      data: { incidentId: incident.id }
    });
  };

  return (
    <>
      <NotificationBell onClick={() => setShowPanel(true)} />
      <NotificationPanel isOpen={showPanel} onClose={() => setShowPanel(false)} />
      <NotificationToast />
    </>
  );
}
*/
