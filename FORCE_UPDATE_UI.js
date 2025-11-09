// Force Update UI - Run this in the browser console to manually update the template count

async function forceUpdateTemplateCount() {
    console.log('🔄 Forcing template count update...\n');
    
    try {
        // Step 1: Check license status
        const licenseResponse = await chrome.runtime.sendMessage({
            type: 'CHECK_LICENSE'
        });
        
        console.log('License Status:', licenseResponse);
        
        const isProLicense = licenseResponse.valid;
        const templateLimit = licenseResponse.status?.templateLimit;
        
        // Step 2: Get template count
        const storage = await chrome.storage.local.get(['templates']);
        const templates = storage.templates || [];
        const userTemplates = templates.filter(t => !t.isPrebuilt);
        const prebuiltTemplates = templates.filter(t => t.isPrebuilt);
        
        console.log('Templates:', {
            user: userTemplates.length,
            prebuilt: prebuiltTemplates.length,
            total: templates.length
        });
        
        // Step 3: Update the UI element directly
        const countEl = document.getElementById('templateCount');
        
        if (!countEl) {
            console.error('❌ Template count element not found!');
            return;
        }
        
        if (isProLicense || templateLimit === Infinity || templateLimit === 'unlimited') {
            countEl.textContent = `${userTemplates.length} custom templates (unlimited categories & templates) + ${prebuiltTemplates.length} prebuilt`;
            countEl.style.color = '#28a745';
            countEl.style.fontWeight = '500';
            console.log('✅ Updated to PRO display');
        } else {
            countEl.textContent = `${userTemplates.length}/${templateLimit} custom templates (1 category max) + ${prebuiltTemplates.length} prebuilt`;
            countEl.style.color = '#6c757d';
            countEl.style.fontWeight = 'normal';
            console.log('✅ Updated to FREE display');
        }
        
        console.log('\n✅ Template count updated!');
        console.log('Current display:', countEl.textContent);
        
    } catch (error) {
        console.error('❌ Error updating template count:', error);
    }
}

async function forceUpdateLicenseStatus() {
    console.log('🔄 Forcing license status update...\n');
    
    try {
        const licenseResponse = await chrome.runtime.sendMessage({
            type: 'CHECK_LICENSE'
        });
        
        const statusEl = document.getElementById('licenseStatus');
        const detailsEl = document.getElementById('licenseDetails');
        
        if (!statusEl || !detailsEl) {
            console.error('❌ License status elements not found!');
            return;
        }
        
        if (licenseResponse.valid) {
            const plan = licenseResponse.status?.tier || licenseResponse.status?.plan || 'Pro';
            const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
            
            statusEl.textContent = `License Status: ${planDisplay} (Active)`;
            statusEl.className = 'license-status valid';
            
            let details = `✓ Unlimited custom templates\n✓ Unlimited categories\n✓ All premium features`;
            
            if (licenseResponse.status?.activationInfo) {
                const { currentActivations, maxActivations } = licenseResponse.status.activationInfo;
                if (maxActivations !== Infinity && maxActivations > 0) {
                    details += `\n✓ Device activations: ${currentActivations}/${maxActivations}`;
                }
            }
            
            detailsEl.textContent = details;
            detailsEl.style.whiteSpace = 'pre-line';
            detailsEl.style.color = '#28a745';
            
            console.log('✅ Updated to PRO license display');
        } else {
            statusEl.textContent = 'License Status: Free';
            statusEl.className = 'license-status invalid';
            detailsEl.textContent = 'Free license: 10 templates maximum, 1 category only';
            detailsEl.style.color = '#6c757d';
            
            console.log('✅ Updated to FREE license display');
        }
        
        console.log('\n✅ License status updated!');
        
    } catch (error) {
        console.error('❌ Error updating license status:', error);
    }
}

async function forceUpdateAll() {
    console.log('🔄 Forcing complete UI update...\n');
    await forceUpdateLicenseStatus();
    await forceUpdateTemplateCount();
    console.log('\n✅ All updates complete!');
}

// Export functions
window.forceUpdate = {
    templateCount: forceUpdateTemplateCount,
    licenseStatus: forceUpdateLicenseStatus,
    all: forceUpdateAll
};

console.log('Force update functions loaded!');
console.log('Run: await forceUpdate.all()');
console.log('Or individual updates:');
console.log('  - await forceUpdate.templateCount()');
console.log('  - await forceUpdate.licenseStatus()');
