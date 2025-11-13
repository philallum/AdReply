/**
 * Post Publisher Module
 * Converts templates into Facebook posts with clipboard and auto-fill support
 */

class PostPublisher {
    constructor() {
        // Facebook post composer selectors (may need updates as Facebook changes)
        this.composerSelectors = [
            // Main post composer
            '[role="textbox"][contenteditable="true"][aria-label*="What\'s on your mind"]',
            '[role="textbox"][contenteditable="true"][aria-label*="Write something"]',
            '[role="textbox"][contenteditable="true"][data-lexical-editor="true"]',
            
            // Group post composer
            '[role="textbox"][contenteditable="true"][aria-label*="Write something in"]',
            '[aria-label*="Create a public post"] [role="textbox"][contenteditable="true"]',
            
            // Alternative selectors
            'div[contenteditable="true"][data-text*="What\'s on your mind"]',
            'div[contenteditable="true"][data-text*="Write something"]',
            '.notranslate[contenteditable="true"][role="textbox"]',
            
            // Fallback selectors
            '[data-testid="status-attachment-mentions-input"]',
            'div[contenteditable="true"][aria-multiline="true"]'
        ];
    }

    /**
     * Copy text to clipboard using Clipboard API
     * @param {string} text - Text to copy
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('PostPublisher: Text copied to clipboard');
            return { success: true };
        } catch (error) {
            console.error('PostPublisher: Clipboard copy failed:', error);
            
            // Fallback: Try using document.execCommand (deprecated but still works)
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    console.log('PostPublisher: Text copied using fallback method');
                    return { success: true };
                } else {
                    throw new Error('execCommand failed');
                }
            } catch (fallbackError) {
                console.error('PostPublisher: Fallback copy failed:', fallbackError);
                return { 
                    success: false, 
                    error: 'Clipboard access denied. Please enable clipboard permissions.' 
                };
            }
        }
    }

    /**
     * Find Facebook post composer element
     * @returns {Promise<{success: boolean, element?: HTMLElement, error?: string}>}
     */
    async findComposer() {
        return new Promise((resolve) => {
            // Send message to content script to find composer
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve({ 
                        success: false, 
                        error: 'No active tab found' 
                    });
                    return;
                }

                const activeTab = tabs[0];
                
                // Check if we're on Facebook
                if (!activeTab.url || !activeTab.url.includes('facebook.com')) {
                    resolve({ 
                        success: false, 
                        error: 'Not on Facebook. Please navigate to Facebook first.' 
                    });
                    return;
                }

                // Send message to content script
                chrome.tabs.sendMessage(
                    activeTab.id,
                    { type: 'FIND_COMPOSER', selectors: this.composerSelectors },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('PostPublisher: Error finding composer:', chrome.runtime.lastError);
                            resolve({ 
                                success: false, 
                                error: 'Could not communicate with Facebook page. Please refresh the page.' 
                            });
                            return;
                        }

                        resolve(response || { success: false, error: 'No response from content script' });
                    }
                );
            });
        });
    }

    /**
     * Fill composer with text using React-compatible input handling
     * @param {string} text - Text to fill
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async fillComposer(text) {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve({ 
                        success: false, 
                        error: 'No active tab found' 
                    });
                    return;
                }

                const activeTab = tabs[0];

                // Send message to content script to fill composer
                chrome.tabs.sendMessage(
                    activeTab.id,
                    { 
                        type: 'FILL_COMPOSER', 
                        text: text,
                        selectors: this.composerSelectors 
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('PostPublisher: Error filling composer:', chrome.runtime.lastError);
                            resolve({ 
                                success: false, 
                                error: 'Could not communicate with Facebook page' 
                            });
                            return;
                        }

                        resolve(response || { success: false, error: 'No response from content script' });
                    }
                );
            });
        });
    }

    /**
     * Show tooltip near composer element
     * @param {string} message - Tooltip message
     * @param {string} type - Tooltip type ('success', 'info', 'error')
     * @returns {Promise<{success: boolean}>}
     */
    async showTooltip(message, type = 'info') {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve({ success: false });
                    return;
                }

                const activeTab = tabs[0];

                // Send message to content script to show tooltip
                chrome.tabs.sendMessage(
                    activeTab.id,
                    { 
                        type: 'SHOW_TOOLTIP', 
                        message: message,
                        tooltipType: type 
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('PostPublisher: Error showing tooltip:', chrome.runtime.lastError);
                        }
                        resolve(response || { success: false });
                    }
                );
            });
        });
    }

    /**
     * Handle React-compatible input for Facebook's composer
     * This is executed in the content script context
     * @param {HTMLElement} element - Input element
     * @param {string} value - Value to set
     */
    static setReactValue(element, value) {
        // Get the native input value setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
        } else {
            element.value = value;
        }

        // Dispatch input event for React
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);

        // Also dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
    }

    /**
     * Post template as content (main entry point)
     * @param {string} templateText - Template text to post
     * @param {Object} options - Options for posting
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async postAsContent(templateText, options = {}) {
        try {
            console.log('PostPublisher: Starting post as content flow');

            // Step 1: Copy to clipboard
            const copyResult = await this.copyToClipboard(templateText);
            if (!copyResult.success) {
                return {
                    success: false,
                    error: copyResult.error || 'Failed to copy to clipboard'
                };
            }

            // Step 2: Try to find and fill composer
            const composerResult = await this.findComposer();
            
            if (composerResult.success && composerResult.found) {
                // Composer found, try to fill it
                console.log('PostPublisher: Composer found, attempting to fill');
                
                const fillResult = await this.fillComposer(templateText);
                
                if (fillResult.success) {
                    // Show success tooltip
                    await this.showTooltip('Template inserted! Review and click Post.', 'success');
                    
                    return {
                        success: true,
                        message: 'Template copied and inserted into composer. Review and click Post.'
                    };
                } else {
                    // Fill failed, but clipboard succeeded
                    await this.showTooltip('Template copied! Paste it into the composer (Ctrl+V or Cmd+V).', 'info');
                    
                    return {
                        success: true,
                        message: 'Template copied to clipboard. Paste it into the composer.'
                    };
                }
            } else {
                // Composer not found, clipboard only
                console.log('PostPublisher: Composer not found, clipboard only');
                
                return {
                    success: true,
                    message: 'Template copied to clipboard. Navigate to Facebook and paste it into a post composer.'
                };
            }
        } catch (error) {
            console.error('PostPublisher: Error in postAsContent:', error);
            return {
                success: false,
                error: 'Failed to post template: ' + error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostPublisher;
}
