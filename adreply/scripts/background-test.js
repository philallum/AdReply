// Minimal test background script to isolate the issue
console.log('TEST: Background script starting...');

// Test 1: Basic logging works
console.log('TEST 1: ✅ Basic logging works');

// Test 2: Chrome APIs available
console.log('TEST 2: chrome.sidePanel available?', !!chrome.sidePanel);
console.log('TEST 2: chrome.runtime available?', !!chrome.runtime);

// Test 3: Try to set side panel behavior
try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => {
      console.log('TEST 3: ✅ Side panel behavior set successfully');
    })
    .catch((error) => {
      console.error('TEST 3: ❌ Failed to set side panel behavior:', error);
    });
} catch (error) {
  console.error('TEST 3: ❌ Exception setting side panel behavior:', error);
}

// Test 4: Try importing first script
console.log('TEST 4: Attempting to import indexeddb-manager.js...');
try {
  importScripts('../storage/indexeddb-manager.js');
  console.log('TEST 4: ✅ indexeddb-manager.js loaded');
} catch (error) {
  console.error('TEST 4: ❌ Failed to load indexeddb-manager.js:', error);
}

// Test 5: Try importing second script
console.log('TEST 5: Attempting to import chrome-storage-manager.js...');
try {
  importScripts('../storage/chrome-storage-manager.js');
  console.log('TEST 5: ✅ chrome-storage-manager.js loaded');
} catch (error) {
  console.error('TEST 5: ❌ Failed to load chrome-storage-manager.js:', error);
}

// Test 6: Try importing data-models.js
console.log('TEST 6: Attempting to import data-models.js...');
try {
  importScripts('../storage/data-models.js');
  console.log('TEST 6: ✅ data-models.js loaded');
  console.log('TEST 6: Template class available?', typeof Template !== 'undefined');
  console.log('TEST 6: License class available?', typeof License !== 'undefined');
} catch (error) {
  console.error('TEST 6: ❌ Failed to load data-models.js:', error);
}

// Test 7: Try importing storage-manager.js
console.log('TEST 7: Attempting to import storage-manager.js...');
try {
  importScripts('../storage/storage-manager.js');
  console.log('TEST 7: ✅ storage-manager.js loaded');
  console.log('TEST 7: StorageManager class available?', typeof StorageManager !== 'undefined');
} catch (error) {
  console.error('TEST 7: ❌ Failed to load storage-manager.js:', error);
}

// Test 8: Try importing storage-migration-v2.js
console.log('TEST 8: Attempting to import storage-migration-v2.js...');
try {
  importScripts('../storage/storage-migration-v2.js');
  console.log('TEST 8: ✅ storage-migration-v2.js loaded');
  console.log('TEST 8: StorageMigrationV2 class available?', typeof StorageMigrationV2 !== 'undefined');
} catch (error) {
  console.error('TEST 8: ❌ Failed to load storage-migration-v2.js:', error);
}

// Test 9: Try importing license-manager.js
console.log('TEST 9: Attempting to import license-manager.js...');
try {
  importScripts('license-manager.js');
  console.log('TEST 9: ✅ license-manager.js loaded');
  console.log('TEST 9: LicenseManager class available?', typeof LicenseManager !== 'undefined');
} catch (error) {
  console.error('TEST 9: ❌ Failed to load license-manager.js:', error);
}

console.log('TEST: All import tests complete');
