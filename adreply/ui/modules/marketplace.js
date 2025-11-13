/**
 * Template Marketplace Module
 * Handles browsing, previewing, and importing Ad Packs
 */

class TemplateMarketplace {
  constructor(storageManager, packManager) {
    this.storageManager = storageManager;
    this.packManager = packManager;
    this.packs = [];
    this.filteredPacks = [];
    this.currentPreview = null;
    
    // CDN URL for marketplace index (can be configured)
    this.indexUrl = 'https://cdn.example.com/adreply/marketplace/index.json';
    
    // Cache settings
    this.cacheKey = 'marketplace_index_cache';
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize marketplace
   */
  async initialize() {
    try {
      await this.fetchIndex();
      this.setupEventListeners();
      this.displayPacks(this.packs);
    } catch (error) {
      console.error('Marketplace: Initialization error:', error);
      this.showError('Failed to load marketplace. Please try again later.');
    }
  }

  /**
   * Fetch marketplace index from CDN
   * @param {boolean} forceRefresh - Force refresh from CDN
   * @returns {Promise<Array>} Array of available packs
   */
  async fetchIndex(forceRefresh = false) {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedIndex();
        if (cached) {
          this.packs = cached;
          this.filteredPacks = cached;
          return cached;
        }
      }

      // Fetch from CDN
      const response = await fetch(this.indexUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.packs || !Array.isArray(data.packs)) {
        throw new Error('Invalid marketplace index format');
      }

      this.packs = data.packs;
      this.filteredPacks = data.packs;

      // Cache the index
      await this.cacheIndex(data.packs);

      return data.packs;

    } catch (error) {
      console.error('Marketplace: Error fetching index:', error);
      
      // Try to use cached data as fallback
      const cached = await this.getCachedIndex();
      if (cached) {
        console.log('Marketplace: Using cached index as fallback');
        this.packs = cached;
        this.filteredPacks = cached;
        return cached;
      }

      throw error;
    }
  }

  /**
   * Get cached marketplace index
   * @returns {Promise<Array|null>} Cached packs or null
   */
  async getCachedIndex() {
    try {
      const result = await chrome.storage.local.get([this.cacheKey]);
      const cache = result[this.cacheKey];

      if (!cache) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - cache.timestamp > this.cacheExpiry) {
        return null;
      }

      return cache.packs;

    } catch (error) {
      console.error('Marketplace: Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache marketplace index
   * @param {Array} packs - Packs to cache
   */
  async cacheIndex(packs) {
    try {
      const cache = {
        packs: packs,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ [this.cacheKey]: cache });

    } catch (error) {
      console.error('Marketplace: Error caching index:', error);
    }
  }

  /**
   * Display packs in the UI
   * @param {Array} packs - Packs to display
   */
  displayPacks(packs) {
    const container = document.getElementById('packs-container');
    if (!container) return;

    if (packs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No packs found matching your criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = packs.map(pack => this.createPackCard(pack)).join('');

    // Attach event listeners to pack cards
    this.attachPackCardListeners();
  }

  /**
   * Create HTML for a pack card
   * @param {Object} pack - Pack data
   * @returns {string} HTML string
   */
  createPackCard(pack) {
    return `
      <div class="pack-card" data-pack-id="${pack.id}">
        <div class="pack-header">
          <h3 class="pack-name">${this.escapeHtml(pack.name)}</h3>
          <span class="pack-niche">${this.escapeHtml(pack.niche)}</span>
        </div>
        <p class="pack-description">${this.escapeHtml(pack.description || 'No description available')}</p>
        <div class="pack-stats">
          <span class="stat">
            <span class="stat-icon">📁</span>
            ${pack.categoryCount || 0} categories
          </span>
          <span class="stat">
            <span class="stat-icon">📝</span>
            ${pack.templateCount || 0} templates
          </span>
        </div>
        <div class="pack-meta">
          <span class="pack-version">v${pack.version}</span>
          <span class="pack-downloads">↓ ${pack.downloadCount || 0}</span>
        </div>
        <div class="pack-actions">
          <button class="btn-secondary preview-pack" data-pack-id="${pack.id}">
            Preview
          </button>
          <button class="btn-primary import-pack" data-pack-id="${pack.id}">
            Import
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to pack cards
   */
  attachPackCardListeners() {
    // Preview buttons
    document.querySelectorAll('.preview-pack').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packId = e.target.dataset.packId;
        this.previewPack(packId);
      });
    });

    // Import buttons
    document.querySelectorAll('.import-pack').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packId = e.target.dataset.packId;
        this.showImportDialog(packId);
      });
    });
  }

  /**
   * Preview a pack in a modal
   * @param {string} packId - Pack ID to preview
   */
  async previewPack(packId) {
    try {
      const pack = this.packs.find(p => p.id === packId);
      if (!pack) {
        throw new Error('Pack not found');
      }

      // Show loading state
      this.showPreviewModal(pack, null, true);

      // Fetch full pack data
      const response = await fetch(pack.downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const packData = await response.json();
      this.currentPreview = packData;

      // Display preview
      this.showPreviewModal(pack, packData, false);

    } catch (error) {
      console.error('Marketplace: Error previewing pack:', error);
      this.showError('Failed to load pack preview. Please try again.');
      this.closePreviewModal();
    }
  }

  /**
   * Show preview modal
   * @param {Object} pack - Pack metadata
   * @param {Object} packData - Full pack data
   * @param {boolean} loading - Loading state
   */
  showPreviewModal(pack, packData, loading = false) {
    const modal = document.getElementById('preview-modal');
    if (!modal) return;

    const content = modal.querySelector('.preview-content');
    if (!content) return;

    if (loading) {
      content.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pack preview...</p>
        </div>
      `;
      modal.classList.add('active');
      return;
    }

    // Build preview content
    let previewHtml = `
      <div class="preview-header">
        <h2>${this.escapeHtml(pack.name)}</h2>
        <button class="close-modal" id="close-preview">&times;</button>
      </div>
      <div class="preview-body">
        <div class="preview-info">
          <p class="preview-description">${this.escapeHtml(pack.description || 'No description available')}</p>
          <div class="preview-stats">
            <span><strong>Niche:</strong> ${this.escapeHtml(pack.niche)}</span>
            <span><strong>Version:</strong> ${pack.version}</span>
            <span><strong>Categories:</strong> ${packData.categories.length}</span>
            <span><strong>Templates:</strong> ${packData.metadata.totalTemplates}</span>
          </div>
        </div>
        <div class="preview-categories">
          <h3>Categories</h3>
    `;

    // Show category samples
    packData.categories.forEach((category, index) => {
      if (index < 3) { // Show first 3 categories
        previewHtml += `
          <div class="category-preview">
            <h4>${this.escapeHtml(category.name)}</h4>
            <p class="category-description">${this.escapeHtml(category.description || '')}</p>
            <p class="template-count">${category.templates.length} templates</p>
        `;

        // Show first 2 templates
        if (category.templates.length > 0) {
          previewHtml += '<div class="template-samples">';
          category.templates.slice(0, 2).forEach(template => {
            const preview = template.content.substring(0, 150) + (template.content.length > 150 ? '...' : '');
            previewHtml += `
              <div class="template-sample">
                <strong>${this.escapeHtml(template.title)}</strong>
                <p>${this.escapeHtml(preview)}</p>
              </div>
            `;
          });
          previewHtml += '</div>';
        }

        previewHtml += '</div>';
      }
    });

    if (packData.categories.length > 3) {
      previewHtml += `<p class="more-categories">+ ${packData.categories.length - 3} more categories</p>`;
    }

    previewHtml += `
        </div>
      </div>
      <div class="preview-footer">
        <button class="btn-secondary" id="cancel-preview">Cancel</button>
        <button class="btn-primary" id="import-from-preview" data-pack-id="${pack.id}">Import Pack</button>
      </div>
    `;

    content.innerHTML = previewHtml;
    modal.classList.add('active');

    // Attach event listeners
    document.getElementById('close-preview')?.addEventListener('click', () => this.closePreviewModal());
    document.getElementById('cancel-preview')?.addEventListener('click', () => this.closePreviewModal());
    document.getElementById('import-from-preview')?.addEventListener('click', () => {
      this.closePreviewModal();
      this.showImportDialog(pack.id);
    });
  }

  /**
   * Close preview modal
   */
  closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.currentPreview = null;
  }

  /**
   * Show import dialog with merge strategy options
   * @param {string} packId - Pack ID to import
   */
  async showImportDialog(packId) {
    const pack = this.packs.find(p => p.id === packId);
    if (!pack) {
      this.showError('Pack not found');
      return;
    }

    const modal = document.getElementById('import-modal');
    if (!modal) return;

    const content = modal.querySelector('.import-content');
    if (!content) return;

    content.innerHTML = `
      <div class="import-header">
        <h2>Import "${this.escapeHtml(pack.name)}"</h2>
        <button class="close-modal" id="close-import">&times;</button>
      </div>
      <div class="import-body">
        <p>Choose how to import this pack:</p>
        <div class="import-options">
          <label class="import-option">
            <input type="radio" name="import-strategy" value="merge" checked>
            <div class="option-details">
              <strong>Merge with existing</strong>
              <p>Add new categories and templates without removing your existing content</p>
            </div>
          </label>
          <label class="import-option">
            <input type="radio" name="import-strategy" value="replace">
            <div class="option-details">
              <strong>Replace existing</strong>
              <p>Remove all your custom templates and categories, then import this pack</p>
            </div>
          </label>
        </div>
      </div>
      <div class="import-footer">
        <button class="btn-secondary" id="cancel-import">Cancel</button>
        <button class="btn-primary" id="confirm-import" data-pack-id="${pack.id}">Import</button>
      </div>
    `;

    modal.classList.add('active');

    // Attach event listeners
    document.getElementById('close-import')?.addEventListener('click', () => this.closeImportModal());
    document.getElementById('cancel-import')?.addEventListener('click', () => this.closeImportModal());
    document.getElementById('confirm-import')?.addEventListener('click', () => {
      const strategy = document.querySelector('input[name="import-strategy"]:checked')?.value || 'merge';
      this.importPackWithStrategy(packId, strategy);
    });
  }

  /**
   * Close import modal
   */
  closeImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Import pack with selected strategy
   * @param {string} packId - Pack ID to import
   * @param {string} strategy - Import strategy ('merge' or 'replace')
   */
  async importPackWithStrategy(packId, strategy) {
    try {
      const pack = this.packs.find(p => p.id === packId);
      if (!pack) {
        throw new Error('Pack not found');
      }

      // Close import modal and show progress
      this.closeImportModal();
      this.showImportProgress(pack.name);

      // Fetch pack data
      const response = await fetch(pack.downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const packData = await response.json();

      // Import using pack manager
      const results = await this.packManager.importPack(packData, strategy);

      // Hide progress and show results
      this.hideImportProgress();
      this.showImportResults(results, pack.name);

      // Refresh the page data if needed
      if (window.uiManager) {
        await window.uiManager.loadTemplates();
      }

    } catch (error) {
      console.error('Marketplace: Error importing pack:', error);
      this.hideImportProgress();
      this.showError(`Failed to import pack: ${error.message}`);
    }
  }

  /**
   * Show import progress indicator
   * @param {string} packName - Pack name being imported
   */
  showImportProgress(packName) {
    const progress = document.getElementById('import-progress');
    if (!progress) return;

    progress.innerHTML = `
      <div class="progress-content">
        <div class="spinner"></div>
        <p>Importing "${this.escapeHtml(packName)}"...</p>
      </div>
    `;
    progress.classList.add('active');
  }

  /**
   * Hide import progress indicator
   */
  hideImportProgress() {
    const progress = document.getElementById('import-progress');
    if (progress) {
      progress.classList.remove('active');
    }
  }

  /**
   * Show import results
   * @param {Object} results - Import results
   * @param {string} packName - Pack name
   */
  showImportResults(results, packName) {
    const message = `
      Successfully imported "${packName}"!
      
      Categories: ${results.categories.imported} imported, ${results.categories.skipped} skipped
      Templates: ${results.templates.imported} imported, ${results.templates.skipped} skipped
      
      ${results.categories.errors.length > 0 ? `\nErrors: ${results.categories.errors.join(', ')}` : ''}
      ${results.templates.errors.length > 0 ? `\nTemplate errors: ${results.templates.errors.join(', ')}` : ''}
    `;

    this.showSuccess(message);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('pack-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterPacks(e.target.value, null);
      });
    }

    // Niche filter
    const nicheFilter = document.getElementById('niche-filter');
    if (nicheFilter) {
      nicheFilter.addEventListener('change', (e) => {
        const searchTerm = document.getElementById('pack-search')?.value || '';
        this.filterPacks(searchTerm, e.target.value);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-marketplace');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshMarketplace();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-setup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.showExportDialog();
      });
    }

    // Upload button
    const uploadBtn = document.getElementById('upload-pack');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        document.getElementById('pack-file-input')?.click();
      });
    }

    // File input
    const fileInput = document.getElementById('pack-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files[0]);
      });
    }
  }

  /**
   * Filter packs by search term and niche
   * @param {string} searchTerm - Search term
   * @param {string} niche - Niche filter
   */
  filterPacks(searchTerm, niche) {
    let filtered = this.packs;

    // Filter by search term
    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pack =>
        pack.name.toLowerCase().includes(term) ||
        pack.description?.toLowerCase().includes(term) ||
        pack.niche.toLowerCase().includes(term)
      );
    }

    // Filter by niche
    if (niche && niche !== 'all') {
      filtered = filtered.filter(pack => pack.niche === niche);
    }

    this.filteredPacks = filtered;
    this.displayPacks(filtered);
  }

  /**
   * Refresh marketplace from CDN
   */
  async refreshMarketplace() {
    try {
      const refreshBtn = document.getElementById('refresh-marketplace');
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
      }

      await this.fetchIndex(true);
      this.displayPacks(this.packs);

      this.showSuccess('Marketplace refreshed successfully');

    } catch (error) {
      console.error('Marketplace: Error refreshing:', error);
      this.showError('Failed to refresh marketplace');
    } finally {
      const refreshBtn = document.getElementById('refresh-marketplace');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
      }
    }
  }

  /**
   * Show export dialog
   */
  async showExportDialog() {
    try {
      // Get all categories
      const categories = await this.storageManager.getCategories();
      const userCategories = categories.filter(cat => !cat.isPrebuilt);

      if (userCategories.length === 0) {
        this.showError('No custom categories to export');
        return;
      }

      const modal = document.getElementById('export-modal');
      if (!modal) return;

      const content = modal.querySelector('.export-content');
      if (!content) return;

      content.innerHTML = `
        <div class="export-header">
          <h2>Export Your Setup</h2>
          <button class="close-modal" id="close-export">&times;</button>
        </div>
        <div class="export-body">
          <div class="form-group">
            <label for="export-name">Pack Name</label>
            <input type="text" id="export-name" placeholder="My Ad Pack" required>
          </div>
          <div class="form-group">
            <label for="export-niche">Niche</label>
            <input type="text" id="export-niche" placeholder="e.g., real-estate, fitness" required>
          </div>
          <div class="form-group">
            <label for="export-description">Description (optional)</label>
            <textarea id="export-description" rows="3" placeholder="Describe your pack..."></textarea>
          </div>
          <div class="form-group">
            <label>Select Categories</label>
            <div class="category-checkboxes">
              ${userCategories.map(cat => `
                <label class="checkbox-label">
                  <input type="checkbox" name="export-category" value="${cat.id}" checked>
                  ${this.escapeHtml(cat.name)} (${cat.templateCount || 0} templates)
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="export-footer">
          <button class="btn-secondary" id="cancel-export">Cancel</button>
          <button class="btn-primary" id="confirm-export">Export</button>
        </div>
      `;

      modal.classList.add('active');

      // Attach event listeners
      document.getElementById('close-export')?.addEventListener('click', () => this.closeExportModal());
      document.getElementById('cancel-export')?.addEventListener('click', () => this.closeExportModal());
      document.getElementById('confirm-export')?.addEventListener('click', () => this.exportSetup());

    } catch (error) {
      console.error('Marketplace: Error showing export dialog:', error);
      this.showError('Failed to show export dialog');
    }
  }

  /**
   * Close export modal
   */
  closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Export user setup as Ad Pack
   */
  async exportSetup() {
    try {
      const name = document.getElementById('export-name')?.value.trim();
      const niche = document.getElementById('export-niche')?.value.trim();
      const description = document.getElementById('export-description')?.value.trim();

      if (!name || !niche) {
        this.showError('Please fill in pack name and niche');
        return;
      }

      // Get selected categories
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="export-category"]:checked')
      ).map(input => input.value);

      if (selectedCategories.length === 0) {
        this.showError('Please select at least one category');
        return;
      }

      // Export using pack manager
      const blob = await this.packManager.exportPack(selectedCategories, {
        name,
        niche,
        description
      });

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-pack.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.closeExportModal();
      this.showSuccess('Pack exported successfully!');

    } catch (error) {
      console.error('Marketplace: Error exporting setup:', error);
      this.showError(`Failed to export pack: ${error.message}`);
    }
  }

  /**
   * Handle local pack file upload
   * @param {File} file - Uploaded file
   */
  async handleFileUpload(file) {
    if (!file) return;

    try {
      // Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Please upload a JSON file');
      }

      // Read file
      const text = await file.text();
      const packData = JSON.parse(text);

      // Validate pack
      const validation = this.packManager.validatePack(packData);
      if (!validation.isValid) {
        throw new Error(`Invalid pack file: ${validation.errors.join(', ')}`);
      }

      // Show import dialog
      this.showLocalPackImportDialog(packData);

    } catch (error) {
      console.error('Marketplace: Error uploading pack:', error);
      this.showError(`Failed to upload pack: ${error.message}`);
    }
  }

  /**
   * Show import dialog for locally uploaded pack
   * @param {Object} packData - Pack data
   */
  showLocalPackImportDialog(packData) {
    const modal = document.getElementById('import-modal');
    if (!modal) return;

    const content = modal.querySelector('.import-content');
    if (!content) return;

    content.innerHTML = `
      <div class="import-header">
        <h2>Import "${this.escapeHtml(packData.name)}"</h2>
        <button class="close-modal" id="close-import">&times;</button>
      </div>
      <div class="import-body">
        <div class="pack-info">
          <p><strong>Niche:</strong> ${this.escapeHtml(packData.niche)}</p>
          <p><strong>Categories:</strong> ${packData.categories.length}</p>
          <p><strong>Templates:</strong> ${packData.metadata.totalTemplates}</p>
        </div>
        <p>Choose how to import this pack:</p>
        <div class="import-options">
          <label class="import-option">
            <input type="radio" name="import-strategy" value="merge" checked>
            <div class="option-details">
              <strong>Merge with existing</strong>
              <p>Add new categories and templates without removing your existing content</p>
            </div>
          </label>
          <label class="import-option">
            <input type="radio" name="import-strategy" value="replace">
            <div class="option-details">
              <strong>Replace existing</strong>
              <p>Remove all your custom templates and categories, then import this pack</p>
            </div>
          </label>
        </div>
      </div>
      <div class="import-footer">
        <button class="btn-secondary" id="cancel-import">Cancel</button>
        <button class="btn-primary" id="confirm-local-import">Import</button>
      </div>
    `;

    modal.classList.add('active');

    // Attach event listeners
    document.getElementById('close-import')?.addEventListener('click', () => this.closeImportModal());
    document.getElementById('cancel-import')?.addEventListener('click', () => this.closeImportModal());
    document.getElementById('confirm-local-import')?.addEventListener('click', async () => {
      const strategy = document.querySelector('input[name="import-strategy"]:checked')?.value || 'merge';
      await this.importLocalPack(packData, strategy);
    });
  }

  /**
   * Import locally uploaded pack
   * @param {Object} packData - Pack data
   * @param {string} strategy - Import strategy
   */
  async importLocalPack(packData, strategy) {
    try {
      this.closeImportModal();
      this.showImportProgress(packData.name);

      // Import using pack manager
      const results = await this.packManager.importPack(packData, strategy);

      // Hide progress and show results
      this.hideImportProgress();
      this.showImportResults(results, packData.name);

      // Refresh the page data if needed
      if (window.uiManager) {
        await window.uiManager.loadTemplates();
      }

    } catch (error) {
      console.error('Marketplace: Error importing local pack:', error);
      this.hideImportProgress();
      this.showError(`Failed to import pack: ${error.message}`);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // Use existing toast notification system if available
    if (window.uiManager && window.uiManager.showToast) {
      window.uiManager.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    // Use existing toast notification system if available
    if (window.uiManager && window.uiManager.showToast) {
      window.uiManager.showToast(message, 'success');
    } else {
      alert(message);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateMarketplace;
} else {
  window.TemplateMarketplace = TemplateMarketplace;
}
