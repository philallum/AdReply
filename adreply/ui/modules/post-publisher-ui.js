/**
 * Post Publisher UI Integration
 * Adds "Post as Content" buttons to template cards and editor
 */

class PostPublisherUI {
    constructor(postPublisher) {
        this.postPublisher = postPublisher;
        this.isProcessing = false;
    }

    /**
     * Add "Post as Content" button to template card
     * @param {HTMLElement} cardElement - Template card element
     * @param {string} templateText - Template text
     * @param {string} templateLabel - Template label for feedback
     */
    addButtonToCard(cardElement, templateText, templateLabel) {
        // Check if button already exists
        if (cardElement.querySelector('.post-as-content-btn')) {
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.className = 'post-as-content-btn';
        button.textContent = '📝 Post as Content';
        button.title = 'Copy template and open Facebook post composer';
        
        // Add styles
        button.style.cssText = `
            margin-top: 8px;
            padding: 6px 12px;
            background: #1877f2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            width: 100%;
            transition: background 0.2s;
        `;

        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = '#166fe5';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = '#1877f2';
        });

        // Click handler
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.handlePostAsContent(templateText, templateLabel, button);
        });

        // Find the copy button and add after it
        const copyBtn = cardElement.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.parentNode.insertBefore(button, copyBtn.nextSibling);
        } else {
            // Fallback: append to card
            cardElement.appendChild(button);
        }
    }

    /**
     * Add "Post as Content" button to template editor
     * @param {HTMLElement} editorElement - Template editor element
     * @param {Function} getTemplateText - Function to get current template text
     */
    addButtonToEditor(editorElement, getTemplateText) {
        // Check if button already exists
        if (editorElement.querySelector('.post-as-content-editor-btn')) {
            return;
        }

        // Find the save button area
        const saveBtn = editorElement.querySelector('#saveTemplateBtn');
        if (!saveBtn) {
            console.warn('PostPublisherUI: Could not find save button in editor');
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.className = 'post-as-content-editor-btn btn secondary';
        button.textContent = '📝 Post as Content';
        button.title = 'Copy template and open Facebook post composer';
        button.type = 'button'; // Prevent form submission
        
        // Add styles to match existing buttons
        button.style.cssText = `
            margin-left: 8px;
            background: #1877f2;
            color: white;
            border: none;
        `;

        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = '#166fe5';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = '#1877f2';
        });

        // Click handler
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const templateText = getTemplateText();
            if (!templateText || templateText.trim().length === 0) {
                this.showToast('Please enter template content first', 'warning');
                return;
            }
            
            await this.handlePostAsContent(templateText, 'Current Template', button);
        });

        // Insert after save button
        saveBtn.parentNode.insertBefore(button, saveBtn.nextSibling);
    }

    /**
     * Handle post as content action
     * @param {string} templateText - Template text
     * @param {string} templateLabel - Template label for feedback
     * @param {HTMLElement} buttonElement - Button element for visual feedback
     */
    async handlePostAsContent(templateText, templateLabel, buttonElement) {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        const originalText = buttonElement.textContent;
        const originalBackground = buttonElement.style.background;

        try {
            // Show loading state
            buttonElement.textContent = '⏳ Processing...';
            buttonElement.disabled = true;
            buttonElement.style.background = '#6c757d';

            // Call post publisher
            const result = await this.postPublisher.postAsContent(templateText);

            if (result.success) {
                // Show success feedback
                buttonElement.textContent = '✓ Copied!';
                buttonElement.style.background = '#28a745';
                
                this.showToast(result.message || 'Template copied to clipboard!', 'success');

                // Reset button after delay
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.style.background = originalBackground;
                    buttonElement.disabled = false;
                }, 2000);
            } else {
                // Show error feedback
                buttonElement.textContent = '✗ Failed';
                buttonElement.style.background = '#dc3545';
                
                this.showToast(result.error || 'Failed to post template', 'error');

                // Reset button after delay
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.style.background = originalBackground;
                    buttonElement.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('PostPublisherUI: Error handling post as content:', error);
            
            buttonElement.textContent = '✗ Error';
            buttonElement.style.background = '#dc3545';
            
            this.showToast('An error occurred: ' + error.message, 'error');

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.style.background = originalBackground;
                buttonElement.disabled = false;
            }, 2000);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
     */
    showToast(message, type = 'success') {
        // Remove any existing toast
        const existingToast = document.querySelector('.post-publisher-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'post-publisher-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        toast.style.backgroundColor = colors[type] || colors.success;
        if (type === 'warning') {
            toast.style.color = '#212529';
        }

        toast.textContent = message;

        // Add animation styles if not already present
        if (!document.querySelector('#post-publisher-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'post-publisher-toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Initialize post publisher UI for all template cards
     * @param {NodeList|Array} cardElements - Template card elements
     * @param {Function} getTemplateText - Function to get template text from card
     * @param {Function} getTemplateLabel - Function to get template label from card
     */
    initializeCards(cardElements, getTemplateText, getTemplateLabel) {
        cardElements.forEach((card, index) => {
            const templateText = getTemplateText(card, index);
            const templateLabel = getTemplateLabel(card, index);
            
            if (templateText) {
                this.addButtonToCard(card, templateText, templateLabel);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostPublisherUI;
}
