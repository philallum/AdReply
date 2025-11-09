// Check Storage - Run this in browser console to see what's actually stored

async function checkStorage() {
    console.log('=== CHECKING STORAGE ===\n');
    
    // Get all storage
    const allStorage = await chrome.storage.local.get(null);
    
    console.log('📦 All storage keys:', Object.keys(allStorage));
    
    // Check templates
    if (allStorage.templates) {
        console.log('\n✅ Templates found in storage');
        console.log('   Total templates:', allStorage.templates.length);
        console.log('   Template IDs:', allStorage.templates.map(t => t.id));
        console.log('   Template labels:', allStorage.templates.map(t => t.label));
        
        // Check for duplicates
        const labels = allStorage.templates.map(t => t.label);
        const uniqueLabels = new Set(labels);
        if (labels.length !== uniqueLabels.size) {
            console.warn('⚠️ Duplicate labels found!');
            const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
            console.warn('   Duplicates:', duplicates);
        }
        
        // Group by category
        const byCategory = {};
        allStorage.templates.forEach(t => {
            const cat = t.category || 'custom';
            byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
        console.log('\n📁 Templates by category:', byCategory);
        
    } else {
        console.log('\n❌ No templates in storage');
    }
    
    // Check license
    if (allStorage.licenseData) {
        console.log('\n🔐 License data found');
        console.log('   Status:', allStorage.licenseData.status);
        console.log('   Tier:', allStorage.licenseData.tier);
        console.log('   Plan:', allStorage.licenseData.plan);
    }
    
    // Check custom categories
    if (allStorage.customCategories) {
        console.log('\n📁 Custom categories:', allStorage.customCategories.length);
        console.log('   Categories:', allStorage.customCategories.map(c => c.name));
    }
    
    console.log('\n=== END STORAGE CHECK ===');
}

async function clearTemplates() {
    const confirm = window.confirm('⚠️ This will DELETE ALL templates. Are you sure?');
    if (!confirm) return;
    
    await chrome.storage.local.set({ templates: [] });
    console.log('✅ All templates cleared');
    window.location.reload();
}

async function showTemplateDetails() {
    const storage = await chrome.storage.local.get(['templates']);
    if (!storage.templates || storage.templates.length === 0) {
        console.log('No templates found');
        return;
    }
    
    console.log('=== TEMPLATE DETAILS ===\n');
    storage.templates.forEach((t, i) => {
        console.log(`${i + 1}. ${t.label}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   Category: ${t.category}`);
        console.log(`   Keywords: ${t.keywords?.slice(0, 5).join(', ')}...`);
        console.log(`   Created: ${t.createdAt}`);
        console.log('');
    });
}

// Export functions
window.checkStorage = checkStorage;
window.clearTemplates = clearTemplates;
window.showTemplateDetails = showTemplateDetails;

console.log('Storage check functions loaded!');
console.log('Commands:');
console.log('  await checkStorage()         - Check what\'s in storage');
console.log('  await showTemplateDetails()  - Show all template details');
console.log('  await clearTemplates()       - Clear all templates (careful!)');
