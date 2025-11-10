// TEST IF BACKGROUND SCRIPT IS WORKING
// Run this in the console

(async function testBackground() {
    console.log('=== TESTING BACKGROUND SCRIPT ===\n');
    
    console.log('Step 1: Testing PING...');
    try {
        const pingResponse = await Promise.race([
            chrome.runtime.sendMessage({ type: 'PING' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000))
        ]);
        console.log('✅ PING successful:', pingResponse);
    } catch (error) {
        console.error('❌ PING failed:', error.message);
        console.log('\n🔧 SOLUTION:');
        console.log('1. Go to chrome://extensions/');
        console.log('2. Find AdReply extension');
        console.log('3. Click "service worker" link to see background console');
        console.log('4. Check for errors there');
        console.log('5. Click reload icon for the extension');
        return;
    }
    
    console.log('\n✅ Background script is working!');
    console.log('Now we can activate the license...');
})();
