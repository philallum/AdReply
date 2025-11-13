/**
 * Keyword Performance Dashboard Module
 * Displays keyword statistics and learning data
 */

class KeywordPerformanceDashboard {
  constructor(learningEngine, storageManager) {
    this.learningEngine = learningEngine;
    this.storageManager = storageManager;
    this.currentSort = { field: 'score', direction: 'desc' };
    this.currentFilter = 'all'; // all, learning, performing, underperforming
  }

  /**
   * Render the dashboard UI
   * @param {HTMLElement} container - Container element to render into
   */
  async render(container) {
    container.innerHTML = `
      <div class="keyword-dashboard">
        <div class="dashboard-header">
          <h2>Keyword Performance Dashboard</h2>
          <p class="dashboard-description">
            Track how well your keywords are performing based on user interactions
          </p>
        </div>

        <div class="dashboard-filters">
          <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">All Keywords</button>
            <button class="filter-btn" data-filter="learning">Learning</button>
            <button class="filter-btn" data-filter="performing">Performing</button>
            <button class="filter-btn" data-filter="underperforming">Underperforming</button>
          </div>
        </div>

        <div class="dashboard-summary">
          <div class="summary-card">
            <div class="summary-value" id="totalKeywords">0</div>
            <div class="summary-label">Total Keywords</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" id="avgScore">0%</div>
            <div class="summary-label">Avg Score</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" id="learningCount">0</div>
            <div class="summary-label">Learning</div>
          </div>
          <div class="summary-card">
            <div class="summary-value" id="underperformingCount">0</div>
            <div class="summary-label">Underperforming</div>
          </div>
        </div>

        <div class="dashboard-table-container">
          <table class="keyword-table">
            <thead>
              <tr>
                <th class="sortable" data-field="keyword">
                  Keyword <span class="sort-icon">↕</span>
                </th>
                <th class="sortable" data-field="category">
                  Category <span class="sort-icon">↕</span>
                </th>
                <th class="sortable" data-field="matches">
                  Matches <span class="sort-icon">↕</span>
                </th>
                <th class="sortable" data-field="chosen">
                  Chosen <span class="sort-icon">↕</span>
                </th>
                <th class="sortable" data-field="ignored">
                  Ignored <span class="sort-icon">↕</span>
                </th>
                <th class="sortable active" data-field="score">
                  Score <span class="sort-icon">↓</span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="keywordTableBody">
              <tr>
                <td colspan="7" class="loading-row">Loading keyword data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachEventListeners(container);

    // Load and display data
    await this.loadData();
  }

  /**
   * Attach event listeners to dashboard elements
   */
  attachEventListeners(container) {
    // Filter buttons
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTable();
      });
    });

    // Sort headers
    const sortHeaders = container.querySelectorAll('.sortable');
    sortHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        const field = e.currentTarget.dataset.field;
        
        // Toggle direction if same field, otherwise default to desc
        if (this.currentSort.field === field) {
          this.currentSort.direction = this.currentSort.direction === 'desc' ? 'asc' : 'desc';
        } else {
          this.currentSort.field = field;
          this.currentSort.direction = 'desc';
        }

        // Update UI
        sortHeaders.forEach(h => h.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        const icon = e.currentTarget.querySelector('.sort-icon');
        icon.textContent = this.currentSort.direction === 'desc' ? '↓' : '↑';

        this.renderTable();
      });
    });
  }

  /**
   * Load keyword performance data
   */
  async loadData() {
    try {
      this.report = await this.learningEngine.getPerformanceReport();
      this.categories = await this.loadCategories();
      this.renderSummary();
      this.renderTable();
    } catch (error) {
      console.error('Error loading keyword data:', error);
      this.showError('Failed to load keyword data');
    }
  }

  /**
   * Load category names for display
   */
  async loadCategories() {
    try {
      const categories = await this.storageManager.getCategories();
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
      return categoryMap;
    } catch (error) {
      console.error('Error loading categories:', error);
      return {};
    }
  }

  /**
   * Render summary statistics
   */
  renderSummary() {
    const summary = this.report.summary;
    
    document.getElementById('totalKeywords').textContent = summary.totalKeywords;
    document.getElementById('avgScore').textContent = 
      (summary.averageScore * 100).toFixed(1) + '%';
    document.getElementById('learningCount').textContent = summary.learningKeywords;
    document.getElementById('underperformingCount').textContent = 
      summary.underperformingKeywords;
  }

  /**
   * Render the keyword table
   */
  renderTable() {
    const tbody = document.getElementById('keywordTableBody');
    
    // Collect all keywords from all categories
    const allKeywords = [];
    for (const categoryId in this.report.categories) {
      const categoryData = this.report.categories[categoryId];
      categoryData.keywords.forEach(kw => {
        allKeywords.push({
          ...kw,
          categoryId: categoryId,
          categoryName: this.categories[categoryId] || categoryId
        });
      });
    }

    // Filter keywords
    let filteredKeywords = allKeywords;
    if (this.currentFilter !== 'all') {
      filteredKeywords = allKeywords.filter(kw => kw.status === this.currentFilter);
    }

    // Sort keywords
    filteredKeywords.sort((a, b) => {
      const field = this.currentSort.field;
      let aVal = a[field];
      let bVal = b[field];

      // Handle category sorting by name
      if (field === 'category') {
        aVal = a.categoryName;
        bVal = b.categoryName;
      }

      // String comparison
      if (typeof aVal === 'string') {
        return this.currentSort.direction === 'desc' 
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }

      // Numeric comparison
      return this.currentSort.direction === 'desc' 
        ? bVal - aVal
        : aVal - bVal;
    });

    // Render rows
    if (filteredKeywords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-row">
            No keywords found for the selected filter
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredKeywords.map(kw => this.renderKeywordRow(kw)).join('');

    // Attach action button listeners
    this.attachActionListeners();
  }

  /**
   * Render a single keyword row
   */
  renderKeywordRow(keyword) {
    const scorePercent = (keyword.score * 100).toFixed(1);
    const scoreClass = this.getScoreClass(keyword.score, keyword.matches);
    const statusBadge = this.getStatusBadge(keyword.status);

    return `
      <tr class="keyword-row">
        <td>
          <div class="keyword-cell">
            <span class="keyword-text">${this.escapeHtml(keyword.keyword)}</span>
            ${statusBadge}
          </div>
        </td>
        <td>
          <span class="category-badge">${this.escapeHtml(keyword.categoryName)}</span>
        </td>
        <td class="numeric-cell">${keyword.matches}</td>
        <td class="numeric-cell">${keyword.chosen}</td>
        <td class="numeric-cell">${keyword.ignored}</td>
        <td class="numeric-cell">
          <span class="score-indicator ${scoreClass}">${scorePercent}%</span>
        </td>
        <td class="actions-cell">
          <button class="action-btn reset-btn" 
                  data-keyword="${this.escapeHtml(keyword.keyword)}"
                  data-category="${keyword.categoryId}"
                  title="Reset statistics">
            ↻
          </button>
          <button class="action-btn remove-btn" 
                  data-keyword="${this.escapeHtml(keyword.keyword)}"
                  data-category="${keyword.categoryId}"
                  title="Remove keyword">
            ✕
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Get CSS class for score indicator
   */
  getScoreClass(score, matches) {
    if (matches < 10) return 'score-learning';
    if (score >= 0.5) return 'score-good';
    if (score >= 0.3) return 'score-medium';
    if (score >= 0.1) return 'score-low';
    return 'score-poor';
  }

  /**
   * Get status badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      learning: '<span class="status-badge badge-learning">Learning</span>',
      performing: '<span class="status-badge badge-performing">Performing</span>',
      underperforming: '<span class="status-badge badge-underperforming">Underperforming</span>',
      normal: ''
    };
    return badges[status] || '';
  }

  /**
   * Attach listeners to action buttons
   */
  attachActionListeners() {
    // Reset buttons
    document.querySelectorAll('.reset-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const keyword = e.target.dataset.keyword;
        const categoryId = e.target.dataset.category;
        await this.handleReset(keyword, categoryId);
      });
    });

    // Remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const keyword = e.target.dataset.keyword;
        const categoryId = e.target.dataset.category;
        await this.handleRemove(keyword, categoryId);
      });
    });
  }

  /**
   * Handle reset action
   */
  async handleReset(keyword, categoryId) {
    if (!confirm(`Reset statistics for keyword "${keyword}"?`)) {
      return;
    }

    try {
      const success = await this.learningEngine.resetKeywordStats(categoryId, keyword);
      if (success) {
        this.showSuccess(`Statistics reset for "${keyword}"`);
        await this.loadData();
      } else {
        this.showError('Failed to reset keyword statistics');
      }
    } catch (error) {
      console.error('Error resetting keyword:', error);
      this.showError('Failed to reset keyword statistics');
    }
  }

  /**
   * Handle remove action
   */
  async handleRemove(keyword, categoryId) {
    if (!confirm(`Remove keyword "${keyword}" from tracking?\n\nNote: This only removes the statistics. The keyword will still exist in your templates.`)) {
      return;
    }

    try {
      const success = await this.learningEngine.removeKeywordStats(categoryId, keyword);
      if (success) {
        this.showSuccess(`Keyword "${keyword}" removed from tracking`);
        await this.loadData();
      } else {
        this.showError('Failed to remove keyword');
      }
    } catch (error) {
      console.error('Error removing keyword:', error);
      this.showError('Failed to remove keyword');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `dashboard-notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeywordPerformanceDashboard;
} else {
  window.KeywordPerformanceDashboard = KeywordPerformanceDashboard;
}
