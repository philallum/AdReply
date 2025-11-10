// Settings and license management
class SettingsManager {
    constructor() {
        this.isProLicense = false;
    }



    async checkLicense() {
        try {
            // Try background script first with timeout
            const response = await Promise.race([
                chrome.runtime.sendMessage({ type: 'CHECK_LICENSE' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
            
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
        } catch (error) {
            console.warn('⚠️ Background script not responding for license check, checking storage directly:', error.message);
        }
        
        // Fallback: Check storage directly
        try {
            const storage = await chrome.storage.local.get(['adreply_license', 'licenseToken', 'entitlements']);
            
            // Check new format first
            if (storage.adreply_license && storage.adreply_license.status === 'pro') {
                this.isProLicense = true;
                return {
                    isValid: true,
                    tier: storage.adreply_license.tier || 'pro',
                    plan: storage.adreply_license.plan || 'pro',
                    status: 'pro',
                    features: storage.adreply_license.entitlements?.features || ['unlimited_templates', 'unlimited_categories'],
                    templateLimit: Infinity,
                    activationInfo: null,
                    entitlements: storage.adreply_license.entitlements
                };
            }
            // Check old format
            else if (storage.entitlements && storage.entitlements.plan === 'pro') {
                this.isProLicense = true;
                return {
                    isValid: true,
                    tier: 'pro',
                    plan: 'pro',
                    status: 'pro',
                    features: storage.entitlements.features || ['unlimited_templates', 'unlimited_categories'],
                    templateLimit: Infinity,
                    activationInfo: null,
                    entitlements: storage.entitlements
                };
            }
            // Check if license token exists
            else if (storage.licenseToken) {
                this.isProLicense = true;
                return {
                    isValid: true,
                    tier: 'pro',
                    plan: 'pro',
                    status: 'pro',
                    features: ['unlimited_templates', 'unlimited_categories'],
                    templateLimit: Infinity,
                    activationInfo: null,
                    entitlements: { plan: 'pro', features: ['unlimited_templates'] }
                };
            }
        } catch (storageError) {
            console.error('Error checking storage for license:', storageError);
        }
        
        // No license found
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

    async activateLicense(licenseKey) {
        if (!licenseKey) {
            throw new Error('Please enter a license key');
        }
        
        const token = licenseKey.trim();
        
        try {
            // Try background script first with timeout
            const response = await Promise.race([
                chrome.runtime.sendMessage({
                    type: 'SET_LICENSE',
                    token: token
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Background script timeout')), 3000))
            ]);
            
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
            // If background script fails, try direct storage activation
            if (error.message.includes('timeout') || error.message.includes('background')) {
                console.warn('⚠️ Background script not responding, activating license directly...');
                return await this.activateLicenseDirectly(token);
            }
            
            this.isProLicense = false;
            throw error;
        }
    }
    
    async activateLicenseDirectly(token) {
        try {
            // Decode JWT to validate and get info
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid license key format');
            }
            
            const payload = JSON.parse(atob(parts[1]));
            
            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                throw new Error('License has expired');
            }
            
            // Encrypt token for storage (same method as ChromeStorageManager)
            const encryptToken = (text) => {
                const key = 'adreply_extension_key_2024';
                let encrypted = '';
                for (let i = 0; i < text.length; i++) {
                    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                    encrypted += String.fromCharCode(charCode);
                }
                return btoa(encrypted);
            };
            
            // Create license data
            const licenseData = {
                token: encryptToken(token),
                status: 'pro',
                tier: 'pro',
                plan: payload.plan || 'pro',
                entitlements: {
                    plan: payload.plan || 'pro',
                    features: ['unlimited_templates', 'unlimited_categories', 'ai_features']
                },
                expiresAt: new Date(payload.exp * 1000).toISOString(),
                lastVerification: Date.now()
            };
            
            // Save to storage
            await chrome.storage.local.set({
                adreply_license: licenseData,
                licenseToken: token,
                entitlements: licenseData.entitlements
            });
            
            this.isProLicense = true;
            
            console.log('✅ License activated directly (bypassed background script)');
            
            return {
                success: true,
                plan: payload.plan || 'pro',
                direct: true
            };
            
        } catch (error) {
            this.isProLicense = false;
            throw new Error('Failed to activate license: ' + error.message);
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