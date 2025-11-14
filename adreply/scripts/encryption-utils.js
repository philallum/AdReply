/**
 * Encryption Utilities for AdReply v2.0
 * Provides secure API key encryption/decryption using Web Crypto API
 */

/**
 * Encrypt an API key using AES-GCM with PBKDF2 key derivation
 * @param {string} apiKey - The API key to encrypt
 * @returns {Promise<Object>} - Object containing encrypted data and IV
 */
async function encryptAPIKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('API key must be a non-empty string');
    }

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        
        // Use extension ID as key derivation material for consistency
        const extensionId = chrome.runtime.id;
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(extensionId),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derive encryption key using PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('adreply-v2-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        // Generate random IV for this encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the data
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        
        // Return encrypted data and IV as arrays for JSON serialization
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt API key: ' + error.message);
    }
}

/**
 * Decrypt an API key using AES-GCM with PBKDF2 key derivation
 * @param {Object} encryptedData - Object containing encrypted data and IV
 * @returns {Promise<string>} - The decrypted API key
 */
async function decryptAPIKey(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv) {
        throw new Error('Invalid encrypted data format');
    }

    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Use extension ID as key derivation material (same as encryption)
        const extensionId = chrome.runtime.id;
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(extensionId),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derive decryption key using PBKDF2 (same parameters as encryption)
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('adreply-v2-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        // Convert arrays back to Uint8Array
        const encryptedArray = new Uint8Array(encryptedData.encrypted);
        const ivArray = new Uint8Array(encryptedData.iv);
        
        // Decrypt the data
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivArray },
            key,
            encryptedArray
        );
        
        // Convert decrypted data back to string
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt API key: ' + error.message);
    }
}

/**
 * Clear API key from memory by overwriting the variable
 * @param {string} apiKey - The API key to clear
 */
function clearAPIKeyFromMemory(apiKey) {
    if (typeof apiKey === 'string') {
        // Overwrite the string in memory (best effort)
        apiKey = '\0'.repeat(apiKey.length);
    }
}

/**
 * Test encryption/decryption round-trip
 * @param {string} testKey - Test API key
 * @returns {Promise<boolean>} - True if round-trip successful
 */
async function testEncryptionRoundTrip(testKey = 'test-api-key-12345') {
    try {
        // Encrypt
        const encrypted = await encryptAPIKey(testKey);
        
        // Decrypt
        const decrypted = await decryptAPIKey(encrypted);
        
        // Verify
        const success = decrypted === testKey;
        
        if (success) {
            console.log('✅ Encryption round-trip test passed');
        } else {
            console.error('❌ Encryption round-trip test failed: decrypted value does not match');
        }
        
        return success;
    } catch (error) {
        console.error('❌ Encryption round-trip test failed:', error);
        return false;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encryptAPIKey,
        decryptAPIKey,
        clearAPIKeyFromMemory,
        testEncryptionRoundTrip
    };
}
