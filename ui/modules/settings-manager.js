// Settings and license management
class SettingsManager {
    constructor() {
        this.isProLicense = false;
    }

    async loadAISettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get([
                'aiProvider', 'geminiApiKey', 'openaiApiKey', 
                'enableRephrasing', 'enableGeneration', 'enableEnhancedMatching', 
                'defaultUrl'
            ], (result) => {
                resolve(result);
            });
        });
    }

    async saveAISettings(settings) {
        const { defaultUrl, aiProvider } = settings;
        
        // Validate default URL if provided
        if (defaultUrl && !this.isValidUrl(defaultUrl)) {
            throw new Error('Please enter a valid default URL');
        }
        
        // Only check Pro license for AI features, not for default URL
        if (aiProvider !== 'off' && !this.isProLicense) {
            throw new Error('AI features require a Pro license');
        }
        
        try {
            await chrome.storage.local.set(settings);
            return { success: true };
        } catch (error) {
            throw new Error('Failed to save settings');
        }
    }

    async checkLicense() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['licenseKey', 'licenseStatus'], (result) => {
                const isValid = result.licenseKey && result.licenseStatus === 'valid';
                this.isProLicense = isValid;
                
                resolve({
                    isValid,
                    licenseKey: result.licenseKey,
                    status: result.licenseStatus
                });
            });
        });
    }

    async activateLicense(licenseKey) {
        if (!licenseKey) {
            throw new Error('Please enter a license key');
        }
        
        // Simple validation - in real app this would validate with server
        if (licenseKey.length >= 16) {
            try {
                await chrome.storage.local.set({ 
                    licenseKey, 
                    licenseStatus: 'valid' 
                });
                
                this.isProLicense = true;
                return { success: true };
            } catch (error) {
                throw new Error('Failed to save license');
            }
        } else {
            throw new Error('Invalid license key format');
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    getProLicenseStatus() {
        return this.isProLicense;
    }

    setProLicenseStatus(status) {
        this.isProLicense = status;
    }
}

export default SettingsManager;