// Minimal content script for testing
console.log('AdReply: Minimal content script loaded!');
window.adReplyMinimalLoaded = true;

// Test if we're on Facebook
if (window.location.hostname.includes('facebook.com')) {
    console.log('AdReply: On Facebook domain');
    window.adReplyOnFacebook = true;
    
    // Test if we're on groups
    if (window.location.pathname.includes('/groups/')) {
        console.log('AdReply: On Facebook groups page');
        window.adReplyOnGroups = true;
        
        // Extract group ID
        const match = window.location.pathname.match(/\/groups\/([^\/]+)/);
        if (match) {
            console.log('AdReply: Group ID detected:', match[1]);
            window.adReplyGroupId = match[1];
        }
    }
}

// Test Chrome API access
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('AdReply: Chrome API available');
    window.adReplyChromeAPI = true;
} else {
    console.log('AdReply: Chrome API NOT available');
    window.adReplyChromeAPI = false;
}