/**
 * License Utilities for AdReply Extension
 * Helper functions for license-related operations across the extension
 */

class LicenseUtils {
  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature to check
   * @returns {Promise<boolean>}
   */
  static async checkFeatureAccess(feature) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'checkFeatureAccess',
        feature: feature
      });
      
      return response.success ? response.hasAccess : false;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  /**
   * Get current license status
   * @returns {Promise<Object>}
   */
  static async getLicenseStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'getLicenseStatus'
      });
      
      return response.success ? response.status : null;
    } catch (error) {
      console.error('Failed to get license status:', error);
      return null;
    }
  }

  /**
   * Validate license manually
   * @returns {Promise<Object>}
   */
  static async validateLicense() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'validateLicense'
      });
      
      return response;
    } catch (error) {
      console.error('Failed to validate license:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upgrade to Pro license
   * @param {string} token - Pro license token
   * @returns {Promise<Object>}
   */
  static async upgradeToPro(token) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'upgradeLicense',
        token: token
      });
      
      return response;
    } catch (error) {
      console.error('Failed to upgrade license:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate license on current device
   * @returns {Promise<Object>}
   */
  static async deactivateLicense() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DEACTIVATE_LICENSE'
      });
      
      return response;
    } catch (error) {
      console.error('Failed to deactivate license:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template limit for current license
   * @returns {Promise<number>}
   */
  static async getTemplateLimit() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'getTemplateLimit'
      });
      
      return response.success ? response.limit : 10; // Default to free limit
    } catch (error) {
      console.error('Failed to get template limit:', error);
      return 10;
    }
  }

  /**
   * Check if user can add more templates
   * @returns {Promise<boolean>}
   */
  static async canAddTemplate() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'canAddTemplate'
      });
      
      return response.success ? response.canAdd : false;
    } catch (error) {
      console.error('Failed to check template capacity:', error);
      return false;
    }
  }

  /**
   * Show upgrade prompt if needed
   * @param {string} feature - Feature that requires upgrade
   * @param {HTMLElement} container - Container to show prompt in
   */
  static async showUpgradePromptIfNeeded(feature, container) {
    const hasAccess = await this.checkFeatureAccess(feature);
    
    if (!hasAccess) {
      this.showUpgradePrompt(feature, container);
      return false;
    }
    
    return true;
  }

  /**
   * Show upgrade prompt UI
   * @param {string} feature - Feature that requires upgrade
   * @param {HTMLElement} container - Container to show prompt in
   */
  static showUpgradePrompt(feature, container) {
    const featureNames = {
      unlimited_templates: 'Unlimited Templates',
      ai_integration: 'AI Integration',
      ad_packs: 'Ad Pack Import',
      priority_support: 'Priority Support'
    };
    
    const featureName = featureNames[feature] || feature;
    
    const promptHTML = `
      <div class="upgrade-prompt bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-lg">Upgrade to Pro</h3>
            <p class="text-sm opacity-90">${featureName} requires a Pro license</p>
          </div>
          <button class="upgrade-btn bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    `;
    
    // Remove existing prompts
    const existingPrompts = container.querySelectorAll('.upgrade-prompt');
    existingPrompts.forEach(prompt => prompt.remove());
    
    // Add new prompt
    container.insertAdjacentHTML('afterbegin', promptHTML);
    
    // Add click handler for upgrade button
    const upgradeBtn = container.querySelector('.upgrade-btn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        this.openUpgradeFlow(feature);
      });
    }
  }

  /**
   * Open upgrade flow
   * @param {string} feature - Feature that triggered upgrade
   */
  static openUpgradeFlow(feature) {
    // In a real implementation, this would open the upgrade page
    // For now, we'll just show an alert with instructions
    const upgradeUrl = 'https://teamhandso.me/extensions/adreply';
    
    if (confirm(`To access ${feature}, you need to upgrade to Pro.\n\nWould you like to visit the upgrade page?`)) {
      chrome.tabs.create({ url: upgradeUrl });
    }
  }

  /**
   * Format license status for display
   * @param {Object} status - License status object
   * @returns {Object} Formatted status
   */
  static formatLicenseStatus(status) {
    if (!status) {
      return {
        displayText: 'Free',
        statusClass: 'text-gray-600',
        badgeClass: 'bg-gray-100 text-gray-800'
      };
    }
    
    switch (status.status) {
      case 'pro':
        return {
          displayText: 'Pro',
          statusClass: 'text-green-600',
          badgeClass: 'bg-green-100 text-green-800',
          expiresAt: status.expiresAt
        };
        
      case 'expired':
        const gracePeriod = status.gracePeriod;
        if (gracePeriod) {
          return {
            displayText: `Expired (${gracePeriod.daysRemaining} days grace)`,
            statusClass: 'text-orange-600',
            badgeClass: 'bg-orange-100 text-orange-800'
          };
        } else {
          return {
            displayText: 'Expired',
            statusClass: 'text-red-600',
            badgeClass: 'bg-red-100 text-red-800'
          };
        }
        
      case 'revoked':
        return {
          displayText: 'Revoked',
          statusClass: 'text-red-600',
          badgeClass: 'bg-red-100 text-red-800'
        };
        
      default:
        return {
          displayText: 'Free',
          statusClass: 'text-gray-600',
          badgeClass: 'bg-gray-100 text-gray-800'
        };
    }
  }

  /**
   * Get feature availability summary
   * @returns {Promise<Object>} Feature availability
   */
  static async getFeatureAvailability() {
    const features = ['unlimited_templates', 'ai_integration', 'ad_packs', 'priority_support'];
    const availability = {};
    
    for (const feature of features) {
      availability[feature] = await this.checkFeatureAccess(feature);
    }
    
    return availability;
  }

  /**
   * Check if template limit is reached
   * @param {number} currentCount - Current template count
   * @returns {Promise<Object>} Limit check result
   */
  static async checkTemplateLimit(currentCount) {
    const limit = await this.getTemplateLimit();
    const canAdd = await this.canAddTemplate();
    
    return {
      limit: limit,
      current: currentCount,
      canAdd: canAdd,
      isAtLimit: currentCount >= limit,
      remaining: Math.max(0, limit - currentCount)
    };
  }

  /**
   * Show template limit warning
   * @param {HTMLElement} container - Container to show warning in
   * @param {Object} limitInfo - Template limit information
   */
  static showTemplateLimitWarning(container, limitInfo) {
    if (limitInfo.isAtLimit) {
      const warningHTML = `
        <div class="template-limit-warning bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg mb-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span class="font-medium">Template limit reached (${limitInfo.current}/${limitInfo.limit})</span>
          </div>
          <p class="text-sm mt-1">Upgrade to Pro for unlimited templates</p>
        </div>
      `;
      
      // Remove existing warnings
      const existingWarnings = container.querySelectorAll('.template-limit-warning');
      existingWarnings.forEach(warning => warning.remove());
      
      // Add new warning
      container.insertAdjacentHTML('afterbegin', warningHTML);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicenseUtils;
} else {
  window.LicenseUtils = LicenseUtils;
}