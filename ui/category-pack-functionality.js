/**
 * Category Pack Import/Export Functionality
 * Handles category pack operations in the UI
 */

// Global category pack manager instance
let categoryPackManager = null;

/**
 * Initialize category pack functionality
 */
async function initializeCategoryPackManager() {
    try {
        if (!window.CategoryPackManager) {
            console.error('CategoryPackManager not loaded');
            return false;
        }

        // Initialize storage components
        const storageManager = new StorageManager();
        await storageManager.initialize();
        
        const categoryManager = new CategoryManager(storageManager);
        await categoryManager.initialize();
        
        const templateDatabaseManager = new TemplateDatabaseManager(storageManager, categoryManager);
        await templateDatabaseManager.initialize();

        // Create category pack manager
        categoryPackManager = new CategoryPackManager(storageManager, categoryManager, templateDatabaseManager);
        
        return true;
    } catch (error) {
        console.error('Failed to initialize category pack manager:', error);
        return false;
    }
}

/**
 * Validate category pack structure
 * @param {Object} packData - Category pack data to validate
 * @returns {Object} Validation result
 */
function validateCategoryPackStructure(packData) {
    if (!categoryPackManager) {
        return { isValid: false, errors: ['Category pack manager not initialized'] };
    }
    
    return categoryPackManager.validateCategoryPack(packData);
}

/**
 * Process category pack file
 * @param {File} file - Selected file
 */
async function processCategoryPackFile(file) {
    try {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showErrorMessage('File size exceeds 10MB limit');
            return;
        }
        
        // Show file name
        const fileNameDisplay = document.getElementById('selectedFileName');
        fileNameDisplay.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
        fileNameDisplay.classList.remove('hidden');
        
        // Read and parse file
        const fileContent = await readFileAsText(file);
        
        if (!categoryPackManager) {
            const initialized = await initializeCategoryPackManager();
            if (!initialized) {
                showErrorMessage('Failed to initialize category pack system');
                return;
            }
        }
        
        // Parse and validate the pack
        const parseResult = await categoryPackManager.parsePackFile(fileContent);
        
        if (!parseResult.success) {
            showErrorMessage(`Invalid Category Pack: ${parseResult.error}`);
            return;
        }
        
        // Show preview
        await showCategoryPackPreview(parseResult.packData, parseResult.metadata);
        
        // Enable import button
        const startBtn = document.getElementById('startImportBtn');
        startBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to process Category Pack file:', error);
        showErrorMessage('Failed to read Category Pack file. Please ensure it\'s a valid JSON file.');
    }
}

/**
 * Show category pack import preview
 * @param {Object} packData - Category pack data
 * @param {Object} metadata - Pack metadata
 */
async function showCategoryPackPreview(packData, metadata) {
    const previewSection = document.getElementById('importPreview');
    const statsDiv = document.getElementById('previewStats');
    const templatesDiv = document.getElementById('previewTemplates');
    
    // Get import preview from manager
    const preview = await categoryPackManager.getImportPreview(packData);
    
    if (!preview.valid) {
        showErrorMessage(`Category Pack validation failed: ${preview.errors.join(', ')}`);
        return;
    }
    
    // Show stats
    const { category, templates, warnings } = preview.preview;
    
    statsDiv.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between items-center">
                <span><strong>${templates.total}</strong> templates</span>
                <span><strong>${templates.new}</strong> new, <strong>${templates.duplicates}</strong> duplicates</span>
            </div>
            <div class="text-sm">
                <div><strong>Category:</strong> ${escapeHtml(category.name)} ${category.exists ? '(exists)' : '(new)'}</div>
                <div><strong>Pack:</strong> ${escapeHtml(packData.name)} v${escapeHtml(packData.version)}</div>
            </div>
            ${warnings.length > 0 ? `
                <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div class="font-medium text-yellow-800 mb-1">⚠️ Warnings:</div>
                    ${warnings.map(warning => `<div class="text-yellow-700">• ${escapeHtml(warning)}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Show template preview (first 5 templates)
    const previewTemplates = packData.templates.slice(0, 5);
    templatesDiv.innerHTML = previewTemplates.map(template => `
        <div class="bg-white border border-gray-200 rounded p-2">
            <div class="text-sm font-medium text-gray-900">${escapeHtml(template.label)}</div>
            <div class="text-xs text-gray-600 mt-1 line-clamp-2">${escapeHtml(template.template)}</div>
            <div class="flex items-center space-x-2 mt-2">
                <span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                    ${escapeHtml(template.category)}
                </span>
                ${template.keywords.slice(0, 2).map(keyword => 
                    `<span class="inline-block bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs">
                        ${escapeHtml(keyword)}
                    </span>`
                ).join('')}
                ${template.keywords.length > 2 ? `<span class="text-xs text-gray-500">+${template.keywords.length - 2} more</span>` : ''}
            </div>
        </div>
    `).join('');
    
    if (packData.templates.length > 5) {
        templatesDiv.innerHTML += `
            <div class="text-center text-xs text-gray-500 py-2">
                ... and ${packData.templates.length - 5} more templates
            </div>
        `;
    }
    
    previewSection.classList.remove('hidden');
}

/**
 * Start category pack import process
 */
async function startCategoryPackImport() {
    try {
        // Get file and options
        const fileInput = document.getElementById('adPackFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showErrorMessage('Please select a Category Pack file');
            return;
        }
        
        const options = {
            skipDuplicates: document.getElementById('skipDuplicates').checked,
            allowPrebuiltOverwrite: document.getElementById('allowPrebuiltOverwrite').checked,
            updateExisting: document.getElementById('updateExisting').checked
        };
        
        // Show progress
        showImportProgress();
        
        // Read and parse file
        const fileContent = await readFileAsText(file);
        
        if (!categoryPackManager) {
            const initialized = await initializeCategoryPackManager();
            if (!initialized) {
                throw new Error('Failed to initialize category pack system');
            }
        }
        
        // Parse the pack
        const parseResult = await categoryPackManager.parsePackFile(fileContent);
        
        if (!parseResult.success) {
            throw new Error(parseResult.error);
        }
        
        // Perform import
        updateImportProgress(0, 1, 'Importing category pack...');
        const result = await categoryPackManager.importCategoryPack(parseResult.packData, options);
        updateImportProgress(1, 1, 'Import completed!');
        
        // Show results
        showCategoryPackImportResults(result);
        
        // Refresh UI if any templates were imported
        if (result.imported > 0) {
            await loadTemplates();
            await loadCategories();
            await updateTemplateLimitDisplay();
        }
        
    } catch (error) {
        console.error('Category pack import failed:', error);
        showErrorMessage('Import failed: ' + error.message);
        hideImportProgress();
    }
}

/**
 * Show category pack import results
 * @param {Object} results - Import results
 */
function showCategoryPackImportResults(results) {
    const resultsSection = document.getElementById('importResults');
    const statsDiv = document.getElementById('resultsStats');
    const errorsDiv = document.getElementById('resultsErrors');
    const errorsList = document.getElementById('errorsList');
    
    // Show stats
    statsDiv.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-lg font-semibold text-green-600">${results.imported}</div>
                    <div class="text-xs text-gray-600">Imported</div>
                </div>
                <div>
                    <div class="text-lg font-semibold text-yellow-600">${results.skipped}</div>
                    <div class="text-xs text-gray-600">Skipped</div>
                </div>
                <div>
                    <div class="text-lg font-semibold text-red-600">${results.errors.length}</div>
                    <div class="text-xs text-gray-600">Errors</div>
                </div>
            </div>
            ${results.categoryCreated ? `
                <div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                    ✅ New category created successfully
                </div>
            ` : ''}
            ${results.categoryUpdated ? `
                <div class="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                    ℹ️ Existing category updated
                </div>
            ` : ''}
        </div>
    `;
    
    // Show errors if any
    if (results.errors.length > 0) {
        errorsList.innerHTML = results.errors.map(error => 
            `<div class="text-sm">${escapeHtml(error)}</div>`
        ).join('');
        errorsDiv.classList.remove('hidden');
    } else {
        errorsDiv.classList.add('hidden');
    }
    
    resultsSection.classList.remove('hidden');
    
    // Update button
    const startBtn = document.getElementById('startImportBtn');
    startBtn.textContent = 'Import Complete';
    
    // Show success message
    if (results.success && results.imported > 0) {
        showSuccessMessage(`Successfully imported ${results.imported} templates into category!`);
    } else if (!results.success) {
        showErrorMessage(results.error || 'Import failed');
    }
}

/**
 * Export category as category pack
 * @param {string} categoryId - Category ID to export
 * @param {Object} options - Export options
 */
async function exportCategoryPack(categoryId, options = {}) {
    try {
        if (!categoryPackManager) {
            const initialized = await initializeCategoryPackManager();
            if (!initialized) {
                throw new Error('Failed to initialize category pack system');
            }
        }
        
        // Generate category pack file
        const fileData = await categoryPackManager.generateCategoryPackFile(categoryId, options);
        
        // Create and download file
        const blob = new Blob([fileData.content], { type: fileData.mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        showSuccessMessage(`Category pack exported: ${fileData.filename}`);
        
    } catch (error) {
        console.error('Category pack export failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

/**
 * Get exportable categories for dropdown
 * @returns {Promise<Array>} Array of exportable categories
 */
async function getExportableCategories() {
    try {
        if (!categoryPackManager) {
            const initialized = await initializeCategoryPackManager();
            if (!initialized) {
                return [];
            }
        }
        
        return await categoryPackManager.getExportableCategories({ nonEmpty: true });
    } catch (error) {
        console.error('Failed to get exportable categories:', error);
        return [];
    }
}

/**
 * Populate export category dropdown
 */
async function populateExportCategoryDropdown() {
    try {
        const categorySelect = document.getElementById('exportCategorySelect');
        if (!categorySelect) return;
        
        const categories = await getExportableCategories();
        
        // Clear existing options (except first one)
        categorySelect.innerHTML = '<option value="">Select a category...</option>';
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name} (${category.totalTemplates} templates)`;
            if (category.customTemplates > 0) {
                option.textContent += ` - ${category.customTemplates} custom`;
            }
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Failed to populate export categories:', error);
    }
}

/**
 * Handle export type change for category pack
 */
function handleExportTypeChange() {
    const exportType = document.querySelector('input[name="exportType"]:checked')?.value;
    const categorySelection = document.getElementById('categorySelection');
    
    if (exportType === 'category') {
        categorySelection.classList.remove('hidden');
        populateExportCategoryDropdown();
    } else {
        categorySelection.classList.add('hidden');
    }
}

/**
 * Handle category pack export
 */
async function handleCategoryPackExport() {
    try {
        const exportType = document.querySelector('input[name="exportType"]:checked')?.value;
        
        if (exportType === 'category') {
            const categoryId = document.getElementById('exportCategorySelect').value;
            if (!categoryId) {
                showErrorMessage('Please select a category to export');
                return;
            }
            
            const options = {
                packName: document.getElementById('exportTitle').value || undefined,
                excludePrebuilt: document.getElementById('excludePrebuiltTemplates').checked,
                removeInternalFields: document.getElementById('removeInternalFields').checked,
                metadata: {
                    description: document.getElementById('exportDescription').value || undefined
                }
            };
            
            await exportCategoryPack(categoryId, options);
            closeExportModal();
        } else {
            // Handle other export types with original functionality
            if (typeof handleOriginalExport === 'function') {
                await handleOriginalExport();
            }
        }
        
    } catch (error) {
        console.error('Export failed:', error);
        showErrorMessage('Export failed: ' + error.message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await initializeCategoryPackManager();
    
    // Add event listeners for export functionality
    const exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
    exportTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleExportTypeChange);
    });
    
    // Override export button handler
    const startExportBtn = document.getElementById('startExportBtn');
    if (startExportBtn) {
        // Remove existing listeners and add new one
        const newBtn = startExportBtn.cloneNode(true);
        startExportBtn.parentNode.replaceChild(newBtn, startExportBtn);
        
        newBtn.addEventListener('click', handleCategoryPackExport);
    }
});