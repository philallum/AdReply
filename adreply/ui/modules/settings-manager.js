// Settings and license management
class SettingsManager {
    constructor() {
        this.isProLicense = false;
    }



    async checkLicense() {
        try {
            // Check license status with background script
            const response = await chrome.runtime.sendMessage({
                type: 'CHECK_LICENSE'
            });
            
            if (response && response.success) {
                this.isProLicense = response.valid;
                
                return {
                    isValid: response.valid,
                    tier: response.status?.tier || 'free',
                    plan: response.status?.tier || 'free',
                    status: response.status?.status || 'free',
                    features: response.status?.features || [],
                    templateLimit: response.status?.templateLimit || 10,
                    activationInfo: response.status?.activationInfo || null,
                    entitlements: response.entitlements || null
                };
            }
            
            // Fallback to free tier
            this.isProLicense = false;
            return {
                isValid: false,
                tier: 'free',
                plan: 'free',
                status: 'free',
                features: [],
                templateLimit: 10,
                activationInfo: null,
                entitlements: null
            };
        } catch (error) {
            console.error('Failed to check license:', error);
            this.isProLicense = false;
            return {
                isValid: false,
                tier: 'free',
                plan: 'free',
                status: 'free',
                features: [],
                templateLimit: 10,
                activationInfo: null,
                entitlements: null
            };
        }
    }

    async activateLicense(licenseKey) {
        if (!licenseKey) {
            throw new Error('Please enter a license key');
        }
        
        try {
            // Activate license with background script
            const response = await chrome.runtime.sendMessage({
                type: 'SET_LICENSE',
                token: licenseKey.trim()
            });
            
            if (response && response.valid) {
                this.isProLicense = true;
                return { 
                    success: true,
                    plan: response.entitlements?.plan || 'pro',
                    activationInfo: response.activationInfo
                };
            } else {
                this.isProLicense = false;
                
                // Check if it's an activation limit error
                if (response.activationInfo) {
                    throw new Error(`Activation limit reached (${response.activationInfo.currentActivations}/${response.activationInfo.maxActivations} devices). Please request an unlock in your account dashboard.`);
                }
                
                throw new Error(response.error || 'License activation failed');
            }
        } catch (error) {
            this.isProLicense = false;
            throw error;
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