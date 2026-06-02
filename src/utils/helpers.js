// Utility functions for validation, error handling, and data operations

export const ValidationUtils = {
  // Email validation
  isValidEmail: (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email?.toLowerCase().trim());
  },

  // PIN validation
  isValidPin: (pin) => {
    return /^\d{4}$/.test(pin?.toString());
  },

  // Phone validation
  isValidPhone: (phone) => {
    return /^[0-9\s\-\+\(\)]{7,}$/.test(phone?.toString());
  },

  // Required fields check
  hasRequiredFields: (obj, fields) => {
    return fields.every(field => obj[field] && obj[field].toString().trim() !== '');
  },

  // Quantity validation
  isValidQuantity: (qty) => {
    const num = parseInt(qty);
    return !isNaN(num) && num > 0;
  },

  // Cost validation
  isValidCost: (cost) => {
    const num = parseFloat(cost);
    return !isNaN(num) && num >= 0;
  }
};

export const StorageUtils = {
  // Safe localStorage get
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return defaultValue;
    }
  },

  // Safe localStorage set
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  // Safe localStorage remove
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      return false;
    }
  },

  // Clear all data
  clearAll: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

export const ErrorHandler = {
  // Log errors
  log: (level, message, error = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, error: error?.toString() };
    
    console.log(`[${level}] ${message}`, error);
    
    // Store logs in localStorage for debugging
    try {
      const logs = StorageUtils.getItem('flowledger_error_logs', []);
      logs.push(logEntry);
      if (logs.length > 100) logs.shift(); // Keep only last 100 logs
      StorageUtils.setItem('flowledger_error_logs', logs);
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  },

  error: (message, error = null) => ErrorHandler.log('ERROR', message, error),
  warn: (message, error = null) => ErrorHandler.log('WARN', message, error),
  info: (message, error = null) => ErrorHandler.log('INFO', message, error)
};

export const DateUtils = {
  // Format date
  format: (date, format = 'short') => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    if (format === 'short') return d.toLocaleDateString();
    if (format === 'time') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (format === 'long') return d.toLocaleString();
    return d.toISOString();
  },

  // Get elapsed time
  getElapsed: (startDate) => {
    if (!startDate) return '';
    const now = new Date();
    const start = new Date(startDate);
    const diff = now - start;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
};

export const NumberUtils = {
  // Format currency
  formatCurrency: (amount, currency = 'PHP') => {
    if (!amount && amount !== 0) return `${currency} 0.00`;
    const num = parseFloat(amount);
    if (isNaN(num)) return `${currency} 0.00`;
    return `${currency} ${num.toFixed(2)}`;
  },

  // Format percentage
  formatPercentage: (value, decimals = 0) => {
    if (value === null || value === undefined) return '0%';
    const num = parseFloat(value);
    if (isNaN(num)) return '0%';
    return `${num.toFixed(decimals)}%`;
  },

  // Round number
  round: (num, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
};

export const ArrayUtils = {
  // Group array by property
  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const groupKey = item[key];
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    }, {});
  },

  // Filter and map
  filterMap: (arr, predicate, mapper) => {
    return arr.filter(predicate).map(mapper);
  },

  // Get unique values
  unique: (arr, key = null) => {
    if (!key) return [...new Set(arr)];
    return [...new Map(arr.map(item => [item[key], item])).values()];
  },

  // Sum values
  sum: (arr, key = null) => {
    if (!key) return arr.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return arr.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
  }
};

export const StringUtils = {
  // Capitalize
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Truncate
  truncate: (str, length = 50) => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Generate ID
  generateId: (prefix = '') => {
    return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  },

  // Slugify
  slugify: (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  }
};

export default {
  ValidationUtils,
  StorageUtils,
  ErrorHandler,
  DateUtils,
  NumberUtils,
  ArrayUtils,
  StringUtils
};
