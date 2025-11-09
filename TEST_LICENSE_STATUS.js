// Test License Status - Run this in the browser console

// Test 1: Check license status via background script
async function testLicenseStatus() {
    console.log('=== Testing License Status ===\n');
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_LICENSE'
        });
        
        console.log('✅ License Check Response:', response);
        console.log('\nLicense Details:');
        console.log('- Valid:', response.valid);
        console.log('- Tier:', response.status?.tier);
        console.log('- Plan:', response.status?.plan);
        console.log('- Status:', response.status?.status);
        console.log('- Template Limit:', response.status?.templateLimit);
        console.log('- Features:', response.status?.features);
        console.log('- Activation Info:', response.status?.activationInfo);
        console.log('- Entitlements:', response.entitlements);
        
        if (response.valid) {
            console.log('\n✅ PRO LICENSE ACTIVE');
            console.log('You should see "unlimited" in the template count');
        } else {
            console.log('\n⚠️ FREE LICENSE');
            console.log('Template limit:', response.status?.templateLimit || 10);
        }
        
    } catch (error) {
        console.error('❌ Error checking license:', error);
    }
}

// Test 2: Check storage directly
async function testStorage() {
    console.log('\n=== Testing Storage ===\n');
    
    try {
        const result = await chrome.storage.local.get(null);
        console.log('All storage data:', result);
        
        if (result.licenseData) {
            console.log('\n✅ License Data Found:');
            console.log('- Token:', result.licenseData.token ? 'Present' : 'Missing');
            console.log('- Status:', result.licenseData.status);
            console.log('- Tier:', result.licenseData.tier);
            console.log('- Plan:', result.licenseData.plan);
            console.log('- Features:', result.licenseData.features);
            console.log('- Entitlements:', result.licenseData.entitlements);
        } else {
            console.log('⚠️ No license data in storage');
        }
    } catch (error) {
        console.error('❌ Error reading storage:', error);
    }
}

// Test 3: Force refresh UI
async function refreshUI() {
    console.log('\n=== Refreshing UI ===\n');
    
    // Trigger a tab change to force refresh
    const licenseTab = document.querySelector('[data-tab="license"]');
    const templatesTab = document.querySelector('[data-tab="templates"]');
    
    if (licenseTab && templatesTab) {
        licenseTab.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        templatesTab.click();
        console.log('✅ UI refreshed');
    } else {
        console.log('⚠️ Could not find tabs');
    }
}

// Test 4: Check template count element
function checkTemplateCountElement() {
    console.log('\n=== Checking Template Count Element ===\n');
    
    const countEl = document.getElementById('templateCount');
    if (countEl) {
        console.log('✅ Template count element found');
        console.log('Current text:', countEl.textContent);
        console.log('Color:', countEl.style.color);
        
        if (countEl.textContent.includes('unlimited')) {
            console.log('✅ Shows unlimited - Pro license active!');
        } else {
            console.log('⚠️ Shows limited - Free license or not updated');
        }
    } else {
        console.log('❌ Template count element not found');
    }
}

// Run all tests
async function runAllTests() {
    await testLicenseStatus();
    await testStorage();
    checkTemplateCountElement();
    await refreshUI();
    
    console.log('\n=== Tests Complete ===');
    console.log('If you see "unlimited" in the template count, Pro license is working!');
    console.log('If not, try running: await refreshUI()');
}

// Export functions for manual use
window.testLicense = {
    status: testLicenseStatus,
    storage: testStorage,
    refresh: refreshUI,
    checkElement: checkTemplateCountElement,
    runAll: runAllTests
};

console.log('License test functions loaded!');
console.log('Run: await testLicense.runAll()');
console.log('Or individual tests:');
console.log('  - await testLicense.status()');
console.log('  - await testLicense.storage()');
console.log('  - await testLicense.refresh()');
console.log('  - testLicense.checkElement()');
