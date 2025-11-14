/**
 * UI Polish and User Experience Module
 * Provides toast notifications, tooltips, loading states, and other UI enhancements
 */

class UIPolish {
    constructor() {
        this.toastContainer = null;
        this.toastQueue = [];
        this.activeToasts = new Set();
        this.maxToasts = 3;
        this.init();
    }

    init() {
        // Create toast container
        this.createToastContainer();
        
        // Initialize keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Initialize accessibility features
        this.initAccessibility();
    }

    /**
     * Create toast notification container
     */
    createToastContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            this.toastContainer.setAttribute('role', 'region');
            this.toastContainer.setAttribute('aria-label', 'Notifications');
            this.toastContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: success, error, warning, info
     * @param {Object} options - Additional options
     */
    showToast(message, type = 'info', options = {}) {
        const {
            title = '',
            duration = 5000,
            closable = true,
            icon = this.getDefaultIcon(type)
        } = options;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        // Build toast HTML
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            ${closable ? '<button class="toast-close" aria-label="Close notification">&times;</button>' : ''}
            ${duration > 0 ? '<div class="toast-progress"><div class="toast-progress-fill"></div></div>' : ''}
        `;

        // Add close handler
        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.removeToast(toast));
        }

        // Add to container
        this.toastContainer.appendChild(toast);
        this.activeToasts.add(toast);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        // Limit number of toasts
        if (this.activeToasts.size > this.maxToasts) {
            const oldestToast = Array.from(this.activeToasts)[0];
            this.removeToast(oldestToast);
        }

        return toast;
    }

    /**
     * Remove toast notification
     * @param {HTMLElement} toast - Toast element to remove
     */
    removeToast(toast) {
        if (!toast || !this.activeToasts.has(toast)) return;

        toast.classList.add('toast-exit');
        this.activeToasts.delete(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 200);
    }

    /**
     * Get default icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon HTML
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Show loading overlay
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
     * @returns {HTMLElement} Loading overlay element
     */
    showLoading(container, message = 'Loading...', subtext = '') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-busy', 'true');

        overlay.innerHTML = `
            <div class="spinner spinner-large"></div>
            <div class="loading-overlay-text">${this.escapeHtml(message)}</div>
            ${subtext ? `<div class="loading-overlay-subtext">${this.escapeHtml(subtext)}</div>` : ''}
            <span class="sr-only">Loading, please wait</span>
        `;

        container.style.position = 'relative';
        container.appendChild(overlay);

        return overlay;
    }

    /**
     * Hide loading overlay
     * @param {HTMLElement} overlay - Loading overlay element
     */
    hideLoading(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    /**
     * Add character counter to input/textarea
     * @param {HTMLElement} input - Input element
     * @param {number} maxLength - Maximum length
     * @param {Object} options - Additional options
     */
    addCharacterCounter(input, maxLength, options = {}) {
        const {
            minLength = 0,
            showProgress = true,
            warningThreshold = 0.8,
            container = input.parentElement
        } = options;

        // Create counter wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'char-counter-wrapper';

        // Create counter display
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.setAttribute('aria-live', 'polite');
        counter.innerHTML = `
            <span>
                <span class="char-counter-current">0</span> / ${maxLength} characters
                ${minLength > 0 ? ` (minimum ${minLength})` : ''}
            </span>
        `;

        // Create progress bar if enabled
        let progressBar = null;
        if (showProgress) {
            progressBar = document.createElement('div');
            progressBar.className = 'char-progress-bar';
            progressBar.innerHTML = '<div class="char-progress-fill"></div>';
        }

        // Update counter function
        const updateCounter = () => {
            const length = input.value.length;
            const currentSpan = counter.querySelector('.char-counter-current');
            currentSpan.textContent = length;

            // Update counter class
            counter.classList.remove('warning', 'error', 'success');
            if (length > maxLength) {
                counter.classList.add('error');
            } else if (length >= maxLength * warningThreshold) {
                counter.classList.add('warning');
            } else if (minLength > 0 && length >= minLength) {
                counter.classList.add('success');
            }

            // Update progress bar
            if (progressBar) {
                const fill = progressBar.querySelector('.char-progress-fill');
                const percentage = Math.min((length / maxLength) * 100, 100);
                fill.style.width = `${percentage}%`;
                
                fill.classList.remove('warning', 'error', 'success');
                if (length > maxLength) {
                    fill.classList.add('error');
                } else if (length >= maxLength * warningThreshold) {
                    fill.classList.add('warning');
                } else if (minLength > 0 && length >= minLength) {
                    fill.classList.add('success');
                }
            }
        };

        // Attach event listener
        input.addEventListener('input', updateCounter);

        // Append elements
        container.appendChild(counter);
        if (progressBar) {
            container.appendChild(progressBar);
        }

        // Initial update
        updateCounter();

        return { counter, progressBar, updateCounter };
    }

    /**
     * Add tooltip to element
     * @param {HTMLElement} element - Element to add tooltip to
     * @param {string} content - Tooltip content
     * @param {Object} options - Additional options
     */
    addTooltip(element, content, options = {}) {
        const {
            position = 'top',
            multiline = false,
            delay = 200
        } = options;

        // Create wrapper if needed
        let wrapper = element.parentElement;
        if (!wrapper.classList.contains('tooltip-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = `tooltip-wrapper tooltip-${position}`;
            if (multiline) {
                wrapper.classList.add('tooltip-multiline');
            }
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

        // Create tooltip content
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-content';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.textContent = content;

        wrapper.appendChild(tooltip);

        // Add ARIA attributes
        const tooltipId = `tooltip-${Date.now()}`;
        tooltip.id = tooltipId;
        element.setAttribute('aria-describedby', tooltipId);

        return tooltip;
    }

    /**
     * Add help icon with tooltip
     * @param {string} content - Help text
     * @param {Object} options - Additional options
     * @returns {HTMLElement} Help icon element
     */
    createHelpIcon(content, options = {}) {
        const wrapper = document.createElement('span');
        wrapper.className = 'tooltip-wrapper tooltip-top tooltip-multiline';

        const icon = document.createElement('span');
        icon.className = 'help-icon';
        icon.textContent = '?';
        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        icon.setAttribute('aria-label', 'Help');

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-content';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.textContent = content;

        const tooltipId = `help-${Date.now()}`;
        tooltip.id = tooltipId;
        icon.setAttribute('aria-describedby', tooltipId);

        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);

        return wrapper;
    }

    /**
     * Show progress bar
     * @param {HTMLElement} container - Container element
     * @param {number} percentage - Progress percentage (0-100)
     * @param {Object} options - Additional options
     * @returns {Object} Progress bar elements
     */
    showProgress(container, percentage = 0, options = {}) {
        const {
            label = '',
            indeterminate = false,
            showPercentage = true
        } = options;

        const wrapper = document.createElement('div');
        wrapper.className = 'progress-bar-wrapper';

        if (label || showPercentage) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'progress-bar-label';
            labelDiv.innerHTML = `
                <span>${this.escapeHtml(label)}</span>
                ${showPercentage ? `<span class="progress-bar-percentage">${percentage}%</span>` : ''}
            `;
            wrapper.appendChild(labelDiv);
        }

        const progressContainer = document.createElement('div');
        progressContainer.className = `progress-bar-container ${indeterminate ? 'progress-indeterminate' : ''}`;
        progressContainer.setAttribute('role', 'progressbar');
        progressContainer.setAttribute('aria-valuenow', percentage);
        progressContainer.setAttribute('aria-valuemin', '0');
        progressContainer.setAttribute('aria-valuemax', '100');

        if (!indeterminate) {
            const fill = document.createElement('div');
            fill.className = 'progress-bar-fill';
            fill.style.width = `${percentage}%`;
            progressContainer.appendChild(fill);
        }

        wrapper.appendChild(progressContainer);
        container.appendChild(wrapper);

        return {
            wrapper,
            container: progressContainer,
            update: (newPercentage) => {
                if (!indeterminate) {
                    const fill = progressContainer.querySelector('.progress-bar-fill');
                    fill.style.width = `${newPercentage}%`;
                    progressContainer.setAttribute('aria-valuenow', newPercentage);
                    
                    if (showPercentage) {
                        const percentageSpan = wrapper.querySelector('.progress-bar-percentage');
                        if (percentageSpan) {
                            percentageSpan.textContent = `${newPercentage}%`;
                        }
                    }
                }
            }
        };
    }

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input, [type="search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape: Close modals/dropdowns
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.show');
                if (activeModal) {
                    const closeBtn = activeModal.querySelector('.close-modal, [data-dismiss="modal"]');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }

            // Ctrl/Cmd + /: Show keyboard shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    /**
     * Show keyboard shortcuts modal
     */
    showKeyboardShortcuts() {
        const shortcuts = [
            { keys: ['Ctrl', 'K'], description: 'Focus search' },
            { keys: ['Escape'], description: 'Close modal or dropdown' },
            { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
            { keys: ['Tab'], description: 'Navigate between elements' },
            { keys: ['Enter'], description: 'Activate focused element' }
        ];

        // Create modal content
        let content = '<div class="shortcut-list">';
        shortcuts.forEach(shortcut => {
            content += `
                <div class="shortcut-item">
                    <span class="shortcut-description">${shortcut.description}</span>
                    <div class="shortcut-keys">
                        ${shortcut.keys.map(key => `<kbd class="kbd">${key}</kbd>`).join(' + ')}
                    </div>
                </div>
            `;
        });
        content += '</div>';

        // Show in a toast or modal (implementation depends on existing modal system)
        this.showToast('Keyboard shortcuts available', 'info', {
            title: 'Keyboard Shortcuts',
            duration: 8000
        });
    }

    /**
     * Initialize accessibility features
     */
    initAccessibility() {
        // Add skip link if not present
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Detect keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Add ARIA labels to unlabeled interactive elements
        this.enhanceAccessibility();
    }

    /**
     * Enhance accessibility of existing elements
     */
    enhanceAccessibility() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                const title = button.getAttribute('title');
                if (title) {
                    button.setAttribute('aria-label', title);
                }
            }
        });

        // Add role to navigation elements
        document.querySelectorAll('nav:not([role])').forEach(nav => {
            nav.setAttribute('role', 'navigation');
        });

        // Add role to main content
        const main = document.querySelector('main:not([role])');
        if (main) {
            main.setAttribute('role', 'main');
            main.id = 'main-content';
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show skeleton loading state
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeleton items
     * @returns {HTMLElement} Skeleton container
     */
    showSkeleton(container, count = 3) {
        const skeletonContainer = document.createElement('div');
        skeletonContainer.className = 'skeleton-container';
        skeletonContainer.setAttribute('aria-busy', 'true');
        skeletonContainer.setAttribute('aria-label', 'Loading content');

        for (let i = 0; i < count; i++) {
            const item = document.createElement('div');
            item.className = 'skeleton-item';
            item.innerHTML = `
                <div class="skeleton skeleton-text long"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-text short"></div>
            `;
            skeletonContainer.appendChild(item);
        }

        container.appendChild(skeletonContainer);
        return skeletonContainer;
    }

    /**
     * Hide skeleton loading state
     * @param {HTMLElement} skeleton - Skeleton container
     */
    hideSkeleton(skeleton) {
        if (skeleton && skeleton.parentNode) {
            skeleton.parentNode.removeChild(skeleton);
        }
    }
}

// Create global instance
const uiPolish = new UIPolish();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIPolish;
} else {
    window.UIPolish = UIPolish;
    window.uiPolish = uiPolish;
}
