// Simple test to verify extension is working
// Run this in Facebook console to test extension communication

console.log('Testing AdReply extension...');

// Test 1: Check if content script is loaded
if (typeof stealthIntegration !== 'undefined') {
  console.log('✅ Content script loaded successfully');
} else {
  console.log('❌ Content script not found');
}

// Test 2: Send message to background script
chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
  if (response && response.active) {
    console.log('✅ Background script responding');
  } else {
    console.log('❌ Background script not responding');
  }
});

// Test 3: Check if we're on a group page
if (window.location.pathname.includes('/groups/')) {
  console.log('✅ On Facebook group page');
  
  // Extract group ID
  const match = window.location.pathname.match(/\/groups\/([^\/]+)/);
  if (match) {
    console.log('✅ Group ID detected:', match[1]);
  }
} else {
  console.log('❌ Not on Facebook group page');
}

console.log('Extension test complete. Check results above.');