// Authentication and Subscription Management
import { StorageUtils, ErrorHandler, ValidationUtils } from './helpers';
import CONFIG from '../config';

const KEYS = CONFIG.STORAGE_KEYS;

export const AuthService = {
  // Set verified email (after access gate approval)
  setVerifiedEmail: (email) => {
    if (!ValidationUtils.isValidEmail(email)) {
      ErrorHandler.warn('Invalid email format', email);
      return false;
    }
    return StorageUtils.setItem(KEYS.VERIFIED_EMAIL, email.toLowerCase().trim());
  },

  // Get verified email
  getVerifiedEmail: () => {
    return StorageUtils.getItem(KEYS.VERIFIED_EMAIL);
  },

  // Check if email is verified
  isEmailVerified: () => {
    const email = AuthService.getVerifiedEmail();
    return email && ValidationUtils.isValidEmail(email);
  },

  // Login user
  login: (pin) => {
    if (!ValidationUtils.isValidPin(pin)) {
      ErrorHandler.warn('Invalid PIN format');
      return null;
    }

    const users = StorageUtils.getItem(KEYS.APP_DATA, {})?.users || CONFIG.DEMO_USERS;
    const user = users.find(u => u.pin === pin);

    if (user) {
      ErrorHandler.info('User login successful', user.name);
      StorageUtils.setItem('flowledger_current_user', user);
      return user;
    }

    ErrorHandler.warn('Failed login attempt with PIN', pin);
    return null;
  },

  // Logout user
  logout: () => {
    StorageUtils.removeItem('flowledger_current_user');
    ErrorHandler.info('User logout');
  },

  // Get current user
  getCurrentUser: () => {
    return StorageUtils.getItem('flowledger_current_user');
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!AuthService.getCurrentUser();
  },

  // Check permission
  hasPermission: (permission) => {
    const user = AuthService.getCurrentUser();
    if (!user) return false;

    const role = CONFIG.ROLES[user.role.toUpperCase()];
    if (!role) return false;

    if (role.permissions.includes('all')) return true;
    return role.permissions.includes(permission);
  },

  // Check feature access
  hasFeatureAccess: (feature) => {
    if (!CONFIG.FEATURES[`ENABLE_${feature.toUpperCase()}`]) return false;
    
    const subscription = SubscriptionService.getSubscription();
    if (!subscription) return false;

    const tier = CONFIG.SUBSCRIPTION_TIERS[subscription.tier.toUpperCase()];
    if (!tier) return false;

    if (tier.features.includes('all')) return true;
    return tier.features.includes(feature.toLowerCase());
  }
};

export const SubscriptionService = {
  // Get subscription
  getSubscription: () => {
    return StorageUtils.getItem(KEYS.SUBSCRIPTION, {
      tier: 'STARTUP',
      status: 'active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usersLimit: 5,
      usersCount: 1
    });
  },

  // Set subscription
  setSubscription: (subscription) => {
    if (!subscription.tier || !subscription.status) {
      ErrorHandler.warn('Invalid subscription data');
      return false;
    }
    return StorageUtils.setItem(KEYS.SUBSCRIPTION, subscription);
  },

  // Check if subscription is active
  isActive: () => {
    const subscription = SubscriptionService.getSubscription();
    if (!subscription) return false;

    const expiryDate = new Date(subscription.expiryDate);
    const now = new Date();

    return subscription.status === 'active' && expiryDate > now;
  },

  // Check if subscription expired
  isExpired: () => {
    return !SubscriptionService.isActive();
  },

  // Get remaining days
  getRemainingDays: () => {
    const subscription = SubscriptionService.getSubscription();
    if (!subscription) return 0;

    const expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    const diff = expiryDate - now;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  // Check user limit
  canAddUser: () => {
    const subscription = SubscriptionService.getSubscription();
    if (!subscription) return false;

    return subscription.usersCount < subscription.usersLimit;
  },

  // Get tier info
  getTierInfo: () => {
    const subscription = SubscriptionService.getSubscription();
    const tier = CONFIG.SUBSCRIPTION_TIERS[subscription.tier.toUpperCase()];
    return tier || CONFIG.SUBSCRIPTION_TIERS.STARTUP;
  }
};

export const CompanyService = {
  // Get company data
  getCompany: () => {
    return StorageUtils.getItem(KEYS.COMPANY_DATA, {
      name: 'Demo Company',
      email: 'company@demo.com',
      phone: '',
      address: '',
      industry: '',
      createdAt: new Date().toISOString()
    });
  },

  // Set company data
  setCompany: (company) => {
    if (!company.name || !company.email) {
      ErrorHandler.warn('Invalid company data');
      return false;
    }

    if (!ValidationUtils.isValidEmail(company.email)) {
      ErrorHandler.warn('Invalid company email');
      return false;
    }

    return StorageUtils.setItem(KEYS.COMPANY_DATA, company);
  },

  // Get company name
  getCompanyName: () => {
    return CompanyService.getCompany().name;
  }
};

export const SettingsService = {
  // Get settings
  getSettings: () => {
    return StorageUtils.getItem(KEYS.SETTINGS, {
      theme: 'light',
      language: 'en',
      notifications: true,
      autoLogout: 15,
      dataRetention: 365
    });
  },

  // Set settings
  setSettings: (settings) => {
    return StorageUtils.setItem(KEYS.SETTINGS, settings);
  },

  // Update single setting
  updateSetting: (key, value) => {
    const settings = SettingsService.getSettings();
    settings[key] = value;
    return SettingsService.setSettings(settings);
  },

  // Get theme
  getTheme: () => {
    return SettingsService.getSettings().theme;
  },

  // Get language
  getLanguage: () => {
    return SettingsService.getSettings().language;
  },

  // Check notifications enabled
  isNotificationsEnabled: () => {
    return SettingsService.getSettings().notifications;
  },

  // Get auto logout time (in minutes)
  getAutoLogoutTime: () => {
    return SettingsService.getSettings().autoLogout;
  }
};

export default {
  AuthService,
  SubscriptionService,
  CompanyService,
  SettingsService
};
