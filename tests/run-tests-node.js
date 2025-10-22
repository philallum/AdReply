#!/usr/bin/env node

/**
 * Node.js Test Runner for AdReply Unit Tests
 * Runs the browser-based tests in a Node.js environment
 */

// Mock browser APIs for Node.js environment
global.window = {};
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  })
};
global.chrome = {
  storage: {
    local: {
      get: (keys, callback) => callback({}),
      set: (data, callback) => callback(),
      remove: (keys, callback) => callback(),
      clear: (callback) => callback()
    }
  }
};
global.btoa = (str) => Buffer.from(str).toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString();

// Load dependencies and make them globally available
const dataModels = require('../storage/data-models.js');
const IndexedDBManager = require('../storage/indexeddb-manager.js');
const ChromeStorageManager = require('../storage/chrome-storage-manager.js');
const StorageManager = require('../storage/storage-manager.js');
const LicenseManager = require('../scripts/license-manager.js');
const TemplateEngine = require('../scripts/template-engine.js');

// Make classes globally available for tests
global.TemplateEngine = TemplateEngine;
global.LicenseManager = LicenseManager;
global.StorageManager = StorageManager;
global.IndexedDBManager = IndexedDBManager;
global.ChromeStorageManager = ChromeStorageManager;

// Make data models globally available
global.Template = dataModels.Template;
global.License = dataModels.License;
global.Settings = dataModels.Settings;
global.AISettings = dataModels.AISettings;
global.GroupHistory = dataModels.GroupHistory;
global.DataMigration = dataModels.DataMigration;

// Load test framework
const { TestRunner, Assert, MockHelpers } = require('./test-runner.js');
global.TestRunner = TestRunner;
global.Assert = Assert;
global.MockHelpers = MockHelpers;

// Load test suites
const runLicenseManagerTests = require('./license-manager.test.js');
const runStorageManagerTests = require('./storage-manager.test.js');
const runTemplateEngineTests = require('./template-engine.test.js');
const runTemplateMatchingTests = require('./template-matching.test.js');
const runStorageValidationTests = require('./storage-validation.test.js');
const runLicenseValidationTests = require('./license-validation.test.js');
const runFacebookIntegrationTests = require('./facebook-integration.test.js');
const runAIServiceIntegrationTests = require('./ai-service-integration.test.js');
const runImportExportIntegrationTests = require('./import-export-integration.test.js');
const runEndToEndTests = require('./end-to-end.test.js');

async function runAllTests() {
  console.log('🧪 Running AdReply Unit Tests in Node.js Environment\n');
  
  const results = [];
  
  try {
    console.log('📋 Running Template Engine Tests...');
    const templateResults = await runTemplateEngineTests();
    results.push(templateResults);
    
    console.log('\n🎯 Running Template Matching Tests...');
    const templateMatchingResults = await runTemplateMatchingTests();
    results.push(templateMatchingResults);
    
    console.log('\n💾 Running Storage Manager Tests...');
    const storageResults = await runStorageManagerTests();
    results.push(storageResults);
    
    console.log('\n🔍 Running Storage Validation Tests...');
    const storageValidationResults = await runStorageValidationTests();
    results.push(storageValidationResults);
    
    console.log('\n🔐 Running License Manager Tests...');
    const licenseResults = await runLicenseManagerTests();
    results.push(licenseResults);
    
    console.log('\n🛡️ Running License Validation Tests...');
    const licenseValidationResults = await runLicenseValidationTests();
    results.push(licenseValidationResults);
    
    console.log('\n🌐 Running Facebook Integration Tests...');
    const facebookIntegrationResults = await runFacebookIntegrationTests();
    results.push(facebookIntegrationResults);
    
    console.log('\n🤖 Running AI Service Integration Tests...');
    const aiServiceIntegrationResults = await runAIServiceIntegrationTests();
    results.push(aiServiceIntegrationResults);
    
    console.log('\n📦 Running Import/Export Integration Tests...');
    const importExportIntegrationResults = await runImportExportIntegrationTests();
    results.push(importExportIntegrationResults);
    
    console.log('\n🎭 Running End-to-End Tests...');
    const endToEndResults = await runEndToEndTests();
    results.push(endToEndResults);
    
    // Print summary
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const passedTests = results.reduce((sum, r) => sum + r.passed, 0);
    const failedTests = results.reduce((sum, r) => sum + r.failed, 0);
    
    console.log('\n📊 Overall Test Summary:');
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      results.forEach(result => {
        result.errors.forEach(({ test, error }) => {
          console.log(`  - ${test}: ${error}`);
        });
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = runAllTests;