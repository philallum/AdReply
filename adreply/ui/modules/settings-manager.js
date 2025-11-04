// Settings and license management
class SettingsManager {
    constructor() {
        this.isProLicense = false;
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