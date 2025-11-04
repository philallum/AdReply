/**
 * Category Selection Functionality for AdReply
 * Handles category dropdown and preference storage
 */

// Global variables
let categoryManager = null;
let storageManager = null;

/**
 * Initialize category functionality
 */
async function initializeCategoryFunctionality() {
    try {
        // Initialize storage and category managers
        storageManager = new StorageManager();
        categoryManager = new CategoryManager(storageManager);
        await categoryManager.initialize();
        
        // Load categories and set up event listeners
        await loadCategories();
        setupCategoryEventListeners();
        
        // Load saved category preference
        await loadSavedCategoryPreference();
        
        console.log('Category functionality initialized successfully');
    } catch (error) {
        console.error('Failed to initialize category functionality:', error);
        showErrorMessage('Failed to initialize category system');
    }
}

/**
 * Load and populate categories in the dropdown
 */
async function loadCategories() {
    try {
        const categories = await categoryManager.getAllCategories();
        const categorySelect = document.getElementById('categorySelect');
        
        if (categorySelect) {
            // Clear existing options except "All Categories"
            categorySelect.innerHTML = '<option value="">All Categories</option>';
            
            // Add categories to dropdown
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                option.title = category.description;
                categorySelect.appendChild(option);
            });
            
            console.log(`Loaded ${categories.length} categories`);
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        showErrorMessage('Failed to load categories');
    }
}

/**
 * Set up event listeners for category functionality
 */
function setupCategoryEventListeners() {
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            handleCategoryChange(selectedCategory);
        });
    }
}

/**
 * Handle category selection change
 */
async function handleCategoryChange(categoryId) {
    try {
        // Save the category preference using Chrome storage API
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || { templates: {} };
        
        if (!settings.templates) {
            settings.templates = {};
        }
        
        settings.templates.preferredCategory = categoryId;
        await chrome.storage.local.set({ settings });
        
        // Show feedback to user
        const categorySelect = document.getElementById('categorySelect');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        const categoryName = selectedOption.textContent;
        
        if (categoryId) {
            showSuccessMessage(`Category preference set to: ${categoryName}`);
        } else {
            showSuccessMessage('Category preference cleared - showing all categories');
        }
        
        console.log('Category preference saved:', categoryId);
    } catch (error) {
        console.error('Failed to save category preference:', error);
        showErrorMessage('Failed to save category preference');
    }
}

/**
 * Load saved category preference
 */
async function loadSavedCategoryPreference() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        const settings = result.settings || {};
        
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect && settings.templates?.preferredCategory) {
            categorySelect.value = settings.templates.preferredCategory;
            
            const selectedOption = categorySelect.options[categorySelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                console.log(`Loaded saved category preference: ${selectedOption.textContent}`);
            }
        }
    } catch (error) {
        console.error('Failed to load saved category preference:', error);
    }
}

/**
 * Get current selected category
 */
function getCurrentSelectedCategory() {
    const categorySelect = document.getElementById('categorySelect');
    return categorySelect ? categorySelect.value : '';
}

/**
 * Show success message (fallback implementation)
 */
function showSuccessMessage(message) {
    console.log('SUCCESS:', message);
    // Try to use existing notification system if available
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        // Fallback: show alert or create simple notification
        alert(message);
    }
}

/**
 * Show error message (fallback implementation)
 */
function showErrorMessage(message) {
    console.error('ERROR:', message);
    // Try to use existing notification system if available
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        // Fallback: show alert or create simple notification
        alert('Error: ' + message);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCategoryFunctionality);
} else {
    // DOM is already loaded
    initializeCategoryFunctionality();
}

// Export functions for use by other modules
window.CategoryFunctionality = {
    initializeCategoryFunctionality,
    loadCategories,
    handleCategoryChange,
    getCurrentSelectedCategory
};