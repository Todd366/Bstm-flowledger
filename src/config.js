// Configuration for FlowLedger Enterprise
export const CONFIG = {
  APP_NAME: 'FlowLedger-Ω',
  APP_VERSION: '2.0.0-enterprise',
  
  // Subscription tiers
  SUBSCRIPTION_TIERS: {
    STARTUP: {
      id: 'startup',
      name: 'Startup',
      price: 299,
      users: 5,
      features: ['basic_tracking', 'photo_capture'],
      color: 'blue'
    },
    PROFESSIONAL: {
      id: 'professional',
      name: 'Professional',
      price: 799,
      users: 25,
      features: ['basic_tracking', 'photo_capture', 'analytics', 'live_map', 'incident_reporting'],
      color: 'purple'
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'custom',
      users: 999,
      features: ['all'],
      color: 'gradient'
    }
  },

  // User roles & permissions
  ROLES: {
    STOREKEEPER: {
      id: 'storekeeper',
      name: 'Storekeeper',
      permissions: ['create_batch', 'prepare_dispatch', 'view_inventory']
    },
    DISPATCHER: {
      id: 'dispatcher',
      name: 'Dispatcher',
      permissions: ['approve_dispatch', 'assign_transporter', 'view_pending']
    },
    DRIVER: {
      id: 'driver',
      name: 'Driver',
      permissions: ['confirm_departure', 'view_my_deliveries']
    },
    RECEIVER: {
      id: 'receiver',
      name: 'Receiver',
      permissions: ['complete_receipt', 'report_incident']
    },
    MANAGER: {
      id: 'manager',
      name: 'Manager',
      permissions: ['view_all', 'analytics', 'reports', 'manage_users', 'view_incidents']
    },
    ADMIN: {
      id: 'admin',
      name: 'Administrator',
      permissions: ['all']
    }
  },

  // Storage keys
  STORAGE_KEYS: {
    VERIFIED_EMAIL: 'flowledger_verified_email',
    PENDING_REQUESTS: 'flowledger_pending_requests',
    ACCESS_LOGS: 'flowledger_access_logs',
    APP_DATA: 'flowledger_data',
    COMPANY_DATA: 'flowledger_company_data',
    SUBSCRIPTION: 'flowledger_subscription',
    SETTINGS: 'flowledger_settings'
  },

  // API configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },

  // Admin configuration
  ADMIN: {
    EMAIL: 'bstm366@gmail.com',
    SECRET_KEY: 'flowledger-omega-2026-myrah-78355551'
  },

  // Validation rules
  VALIDATION: {
    PIN_LENGTH: 4,
    PIN_MIN: 1000,
    PIN_MAX: 9999,
    PASSWORD_MIN_LENGTH: 8,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^[0-9\s\-\+\(\)]{7,}$/
  },

  // Feature flags
  FEATURES: {
    ENABLE_DEMO: true,
    ENABLE_ANALYTICS: true,
    ENABLE_PDF_EXPORT: true,
    ENABLE_REAL_CAMERA: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_INCIDENT_TRACKING: true
  },

  // Demo credentials
  DEMO_USERS: [
    { id: 1, name: 'John Keeper', role: 'storekeeper', pin: '1111', company: 'Demo Co', trustScore: 98 },
    { id: 2, name: 'Mary Dispatch', role: 'dispatcher', pin: '2222', company: 'Demo Co', trustScore: 95 },
    { id: 3, name: 'Peter Driver', role: 'driver', pin: '3333', company: 'Demo Co', trustScore: 92 },
    { id: 4, name: 'Sarah Receiver', role: 'receiver', pin: '4444', company: 'Demo Co', trustScore: 96 },
    { id: 5, name: 'Owner Boss', role: 'manager', pin: '5555', company: 'Demo Co', trustScore: 100 }
  ]
};

export default CONFIG;
