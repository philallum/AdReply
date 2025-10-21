// AdReply Background Service Worker
// Handles extension lifecycle, license validation, and side panel management

// Import required modules
importScripts(
  'storage/chrome-storage-manager.js',
  'storage/data-models.js',
  'storage/storage-manager.js',
  'license-manager.js',
  'error-handler.js',
  'logger.js',
  'error-integration.js'
);

console.log('AdReply background service worker loaded');

// Initialize enhanced managers with error handling and logging
let storageManager;
let licenseManager;
let logger;
let errorHandler;

// Initialize managers
async function initializeManagers() {
  try {
    // Initialize logging system first
    const logging = initializeLogging({
      component: 'Background',
      debugMode: false // Set to true for development
    });
    
    logger = logging.logger;
    errorHandler = new ErrorHandler();
    
    logger.info('Initializing AdReply background service worker');
    
    // Initialize enhanced storage manager
    storageManager = new EnhancedStorageManager();
    await storageManager.initialize();
    
    // Initialize enhanced license manager
    licenseManager = new EnhancedLicenseManager(storageManager);
    await licenseManager.initialize();
    
    logger.info('All managers initialized successfully');
  } catch (error) {
    if (logger) {
      logger.error('Failed to initialize managers', { error: error.message });
    } else {
      console.error('Failed to initialize managers:', error);
    }
    
    // Try to handle the error if error handler is available
    if (errorHandler) {
      await errorHandler.handleError(error, 'manager_initialization');
    }
  }
}

// Initialize extension on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('AdReply extension started');
  await initializeManagers();
  await performStartupLicenseCheck();
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AdReply extension installed:', details.reason);
  
  await initializeManagers();
  
  // Set up default settings on first install
  if (details.reason === 'install') {
    await initializeDefaultSettings();
  }
  
  // Perform license check on install/update
  await performStartupLicenseCheck();
});

// Handle action button click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  // Open side panel for the current tab
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Initialize default settings
async function initializeDefaultSettings() {
  const defaultSettings = {
    ai: {
      provider: "off",
      geminiApiKey: "",
      openaiApiKey: "",
      enabled: false
    },
    ui: {
      sidebarWidth: 320,
      theme: "light",
      showUpgradePrompts: true
    },
    templates: {
      maxSuggestions: 3,
      enableRotation: true,
      preventRepetition: true
    }
  };
  
  const defaultLicense = {
    token: '',
    status: "free",
    tier: "free",
    plan: null,
    expiresAt: null,
    lastValidatedAt: new Date().toISOString(),
    gracePeriodEnds: null,
    features: []
  };
  
  try {
    await chrome.storage.local.set({
      settings: defaultSettings,
      license: defaultLicense
    });
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
}

// Perform startup license check
async function performStartupLicenseCheck() {
  if (!licenseManager) {
    console.warn('License manager not initialized');
    return;
  }
  
  try {
    const licenseData = await storageManager.getLicenseData();
    
    if (!licenseData || !licenseData.token) {
      console.log('No license token found, using free tier');
      return;
    }
    
    // Validate existing token
    const validation = await licenseManager.validateLicense(licenseData.token);
    
    if (!validation.isValid) {
      console.log('License validation failed:', validation.error);
      
      if (validation.error.includes('expired')) {
        await handleExpiredLicense(licenseData);
      } else {
        // Invalid token, downgrade to free
        await licenseManager.downgradeLicense();
      }
      return;
    }
    
    // Update license data with latest validation
    const updatedLicense = {
      ...licenseData,
      ...validation.license,
      lastValidatedAt: new Date().toISOString()
    };
    
    await storageManager.saveLicenseData(updatedLicense);
    console.log('License validated successfully:', updatedLicense.tier);
    
  } catch (error) {
    console.error('Startup license check failed:', error);
  }
}

// Handle expired license
async function handleExpiredLicense(licenseData) {
  try {
    // Check if already in grace period
    const gracePeriod = await licenseManager.getGracePeriodStatus();
    
    if (!gracePeriod.inGracePeriod) {
      // Start grace period
      await licenseManager.startGracePeriod();
      console.log('Started grace period for expired license');
    } else if (gracePeriod.daysRemaining <= 0) {
      // Grace period ended, downgrade to free
      await licenseManager.downgradeLicense();
      console.log('Grace period ended, downgraded to free tier');
    } else {
      console.log(`License in grace period, ${gracePeriod.daysRemaining} days remaining`);
    }
  } catch (error) {
    console.error('Failed to handle expired license:', error);
    // Fallback to downgrade
    await licenseManager.downgradeLicense();
  }
}

// Set up periodic license validation (daily)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyLicenseCheck') {
    await performDailyLicenseCheck();
  }
});

// Create daily license check alarm
async function setupPeriodicLicenseCheck() {
  // Clear existing alarm
  await chrome.alarms.clear('dailyLicenseCheck');
  
  // Create new alarm for daily checks
  await chrome.alarms.create('dailyLicenseCheck', {
    delayInMinutes: 60, // First check in 1 hour
    periodInMinutes: 24 * 60 // Then every 24 hours
  });
  
  console.log('Periodic license check scheduled');
}

// Perform daily license check
async function performDailyLicenseCheck() {
  if (!licenseManager) {
    console.warn('License manager not initialized for daily check');
    return;
  }
  
  try {
    const licenseData = await storageManager.getLicenseData();
    
    if (!licenseData || licenseData.tier === 'free') {
      return; // No need to check free licenses
    }
    
    // Check if we need to validate (monthly validation)
    const lastValidated = licenseData.lastValidatedAt ? new Date(licenseData.lastValidatedAt) : null;
    const now = new Date();
    const daysSinceValidation = lastValidated ? 
      Math.floor((now - lastValidated) / (1000 * 60 * 60 * 24)) : 30;
    
    if (daysSinceValidation >= 30) {
      console.log('Performing monthly license validation');
      await performMonthlyLicenseValidation(licenseData);
    }
    
    // Check for expiration
    if (licenseData.expiresAt) {
      const expiryDate = new Date(licenseData.expiresAt);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        await handleExpiredLicense(licenseData);
      } else if (daysUntilExpiry <= 7) {
        console.log(`License expires in ${daysUntilExpiry} days`);
        // Could send notification to user here
      }
    }
    
  } catch (error) {
    console.error('Daily license check failed:', error);
  }
}

// Perform monthly license validation with server
async function performMonthlyLicenseValidation(licenseData) {
  try {
    console.log('Starting monthly license validation');
    
    // Attempt server validation
    const serverValidation = await validateLicenseWithServer(licenseData.token);
    
    if (serverValidation.success) {
      // Update license data with server response
      const updatedLicense = {
        ...licenseData,
        status: serverValidation.license.status,
        tier: serverValidation.license.tier,
        features: serverValidation.license.features,
        lastValidatedAt: new Date().toISOString(),
        gracePeriodEnds: null // Clear grace period on successful validation
      };
      
      await storageManager.saveLicenseData(updatedLicense);
      console.log('Monthly license validation successful');
      
    } else {
      console.warn('Server license validation failed:', serverValidation.error);
      
      // Handle different failure scenarios
      if (serverValidation.error === 'network_error') {
        // Network error - extend grace period if not already in one
        await handleOfflineLicenseValidation(licenseData);
      } else if (serverValidation.error === 'license_revoked') {
        // License revoked - immediate downgrade
        await licenseManager.downgradeLicense();
        console.log('License revoked by server, downgraded to free');
      } else {
        // Other errors - start grace period
        await licenseManager.startGracePeriod();
        console.log('License validation failed, started grace period');
      }
    }
    
  } catch (error) {
    console.error('Monthly license validation error:', error);
    await handleOfflineLicenseValidation(licenseData);
  }
}

// Validate license with server
async function validateLicenseWithServer(token) {
  const licenseServerUrl = 'https://teamhandso.me/api/license/validate';
  
  try {
    const response = await fetch(licenseServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        token: token,
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version
      })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'license_revoked',
          message: 'License token is invalid or revoked'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          error: 'license_expired',
          message: 'License has expired'
        };
      } else {
        return {
          success: false,
          error: 'server_error',
          message: `Server error: ${response.status}`
        };
      }
    }
    
    const data = await response.json();
    
    // Validate server response structure
    if (!data.license || !data.license.status || !data.license.tier) {
      return {
        success: false,
        error: 'invalid_response',
        message: 'Invalid server response format'
      };
    }
    
    return {
      success: true,
      license: {
        status: data.license.status,
        tier: data.license.tier,
        plan: data.license.plan,
        features: data.license.features || [],
        expiresAt: data.license.expiresAt,
        userId: data.license.userId
      }
    };
    
  } catch (error) {
    console.error('Network error during license validation:', error);
    return {
      success: false,
      error: 'network_error',
      message: error.message
    };
  }
}

// Handle offline license validation
async function handleOfflineLicenseValidation(licenseData) {
  try {
    // Check if we're already in a grace period
    const gracePeriod = await licenseManager.getGracePeriodStatus();
    
    if (gracePeriod.inGracePeriod) {
      if (gracePeriod.daysRemaining <= 0) {
        // Grace period expired, downgrade to free
        await licenseManager.downgradeLicense();
        console.log('Grace period expired during offline validation, downgraded to free');
      } else {
        console.log(`Offline validation - continuing grace period, ${gracePeriod.daysRemaining} days remaining`);
      }
    } else {
      // Start grace period for offline validation
      await licenseManager.startGracePeriod();
      console.log('Started grace period due to offline license validation');
    }
    
  } catch (error) {
    console.error('Failed to handle offline license validation:', error);
    // Fallback to downgrade
    await licenseManager.downgradeLicense();
  }
}

// Handle license server communication errors
function handleLicenseServerError(error, context) {
  console.error(`License server error in ${context}:`, error);
  
  // Log error for debugging (in production, this could be sent to analytics)
  const errorInfo = {
    context: context,
    error: error.message,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // Store error for potential retry or user notification
  chrome.storage.local.get(['licenseErrors'], (result) => {
    const errors = result.licenseErrors || [];
    errors.push(errorInfo);
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    chrome.storage.local.set({ licenseErrors: errors });
  });
}

// Retry license validation with exponential backoff
async function retryLicenseValidation(token, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await validateLicenseWithServer(token);
      
      if (result.success || result.error !== 'network_error') {
        return result; // Success or non-network error (don't retry)
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`License validation attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`License validation attempt ${attempt} error:`, error);
      
      if (attempt === maxRetries) {
        return {
          success: false,
          error: 'network_error',
          message: 'All retry attempts failed'
        };
      }
    }
  }
}

// Manual license validation (triggered by user)
async function performManualLicenseValidation() {
  if (!licenseManager) {
    return {
      success: false,
      error: 'License manager not initialized'
    };
  }
  
  try {
    const licenseData = await storageManager.getLicenseData();
    
    if (!licenseData || !licenseData.token) {
      return {
        success: false,
        error: 'No license token found'
      };
    }
    
    // First validate token locally
    const localValidation = await licenseManager.validateLicense(licenseData.token);
    
    if (!localValidation.isValid) {
      return {
        success: false,
        error: localValidation.error
      };
    }
    
    // Then validate with server (with retries)
    const serverValidation = await retryLicenseValidation(licenseData.token);
    
    if (serverValidation.success) {
      // Update license data
      const updatedLicense = {
        ...licenseData,
        ...serverValidation.license,
        lastValidatedAt: new Date().toISOString(),
        gracePeriodEnds: null
      };
      
      await storageManager.saveLicenseData(updatedLicense);
      
      return {
        success: true,
        license: updatedLicense
      };
    } else {
      return {
        success: false,
        error: serverValidation.error,
        message: serverValidation.message
      };
    }
    
  } catch (error) {
    console.error('Manual license validation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async response
});

// Handle different message types
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'validateLicense':
        const validation = await performManualLicenseValidation();
        sendResponse(validation);
        break;
        
      case 'getLicenseStatus':
        const status = await licenseManager.getLicenseStatusSummary();
        sendResponse({ success: true, status });
        break;
        
      case 'upgradeLicense':
        const upgrade = await licenseManager.upgradeToPro(message.token);
        sendResponse(upgrade);
        break;
        
      case 'checkFeatureAccess':
        const hasAccess = await licenseManager.checkFeatureAccess(message.feature);
        sendResponse({ success: true, hasAccess });
        break;
        
      case 'getTemplateLimit':
        const limit = await licenseManager.getTemplateLimit();
        sendResponse({ success: true, limit });
        break;
        
      case 'canAddTemplate':
        const canAdd = await licenseManager.canAddTemplate();
        sendResponse({ success: true, canAdd });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Initialize periodic checks when managers are ready
initializeManagers().then(() => {
  setupPeriodicLicenseCheck();
});