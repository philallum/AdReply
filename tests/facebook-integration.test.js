/**
 * Integration Tests for Facebook DOM Integration
 * Tests Facebook content script integration, DOM manipulation, and event handling
 */

// Test suite for Facebook Integration
async function runFacebookIntegrationTests() {
  const runner = new TestRunner();
  
  // Mock DOM environment for Facebook integration testing
  const mockDOM = {
    elements: new Map(),
    eventListeners: new Map(),
    
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        textContent: '',
        value: '',
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        setAttribute: () => {},
        getAttribute: () => null,
        addEventListener: (event, handler) => {
          if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
          }
          this.eventListeners.get(event).push(handler);
        },
        removeEventListener: () => {},
        appendChild: () => {},
        removeChild: () => {},
        getBoundingClientRect: () => ({
          top: 100,
          left: 100,
          width: 200,
          height: 50,
          bottom: 150,
          right: 300
        }),
        focus: () => {},
        blur: () => {},
        click: () => {}
      };
    },
    
    querySelector(selector) {
      return this.elements.get(selector) || null;
    },
    
    querySelectorAll(selector) {
      const element = this.elements.get(selector);
      return element ? [element] : [];
    },
    
    getElementById(id) {
      return this.elements.get(`#${id}`) || null;
    },
    
    setElement(selector, element) {
      this.elements.set(selector, element);
    },
    
    simulateEvent(selector, eventType, data = {}) {
      const element = this.elements.get(selector);
      if (element && element.eventListeners && element.eventListeners.has(eventType)) {
        const handlers = element.eventListeners.get(eventType);
        handlers.forEach(handler => handler(data));
      }
    }
  };
  
  // Mock Facebook page environment
  const mockFacebookPage = {
    url: 'https://www.facebook.com/groups/test-group-123',
    groupId: 'test-group-123',
    groupName: 'Test Facebook Group',
    
    createCommentBox() {
      const commentBox = mockDOM.createElement('div');
      commentBox.setAttribute('contenteditable', 'true');
      commentBox.setAttribute('data-testid', 'comment-box');
      commentBox.textContent = '';
      return commentBox;
    },
    
    createPost(content) {
      const post = mockDOM.createElement('div');
      post.setAttribute('data-testid', 'post');
      post.innerHTML = `<div class="post-content">${content}</div>`;
      return post;
    },
    
    simulateNavigation(newUrl) {
      this.url = newUrl;
      const match = newUrl.match(/\/groups\/([^\/\?]+)/);
      this.groupId = match ? match[1] : null;
    }
  };

  // Test: Facebook Group Detection
  runner.test('FacebookIntegration - Detect Facebook groups correctly', async () => {
    // Mock FacebookIntegration class (simplified version)
    class MockFacebookIntegration {
      constructor() {
        this.currentUrl = mockFacebookPage.url;
      }
      
      extractGroupId() {
        const url = this.currentUrl;
        const groupMatch = url.match(/\/groups\/([^\/\?]+)/);
        return groupMatch ? groupMatch[1] : null;
      }
      
      extractGroupName() {
        // Simulate extracting group name from page
        return mockFacebookPage.groupName;
      }
      
      isInFacebookGroup() {
        return this.currentUrl.includes('/groups/');
      }
    }
    
    const integration = new MockFacebookIntegration();
    
    // Test group detection
    Assert.true(integration.isInFacebookGroup(), 'Should detect Facebook group page');
    Assert.equal(integration.extractGroupId(), 'test-group-123', 'Should extract correct group ID');
    Assert.equal(integration.extractGroupName(), 'Test Facebook Group', 'Should extract group name');
    
    // Test non-group page
    integration.currentUrl = 'https://www.facebook.com/feed';
    Assert.false(integration.isInFacebookGroup(), 'Should not detect group on feed page');
    Assert.equal(integration.extractGroupId(), null, 'Should return null for non-group page');
  });

  // Test: Post Content Extraction
  runner.test('FacebookIntegration - Extract post content accurately', async () => {
    class MockPostExtractor {
      extractPostContent(postElement) {
        if (!postElement) return '';
        
        const contentElement = postElement.querySelector('.post-content');
        return contentElement ? contentElement.textContent : '';
      }
      
      findVisiblePosts() {
        // Simulate finding posts on page
        return mockDOM.querySelectorAll('[data-testid="post"]');
      }
    }
    
    const extractor = new MockPostExtractor();
    
    // Create test posts
    const post1 = mockFacebookPage.createPost('Looking for a good exhaust system for my motorcycle.');
    const post2 = mockFacebookPage.createPost('Need help with my fitness routine. Any trainers?');
    
    mockDOM.setElement('[data-testid="post"]', post1);
    
    const content1 = extractor.extractPostContent(post1);
    Assert.equal(content1, 'Looking for a good exhaust system for my motorcycle.', 'Should extract post content correctly');
    
    const posts = extractor.findVisiblePosts();
    Assert.greaterThan(posts.length, 0, 'Should find visible posts');
  });

  // Test: Comment Box Detection and Insertion
  runner.test('FacebookIntegration - Detect and insert into comment boxes', async () => {
    class MockCommentInserter {
      findCommentBoxes() {
        return mockDOM.querySelectorAll('[data-testid="comment-box"]');
      }
      
      isCommentBoxVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0;
      }
      
      insertComment(element, text) {
        if (element.getAttribute('contenteditable') === 'true') {
          element.textContent = text;
          return true;
        }
        return false;
      }
      
      triggerInputEvent(element) {
        // Simulate triggering input event for Facebook's change detection
        if (element.eventListeners && element.eventListeners.has('input')) {
          const handlers = element.eventListeners.get('input');
          handlers.forEach(handler => handler({ target: element }));
        }
      }
    }
    
    const inserter = new MockCommentInserter();
    
    // Create comment box
    const commentBox = mockFacebookPage.createCommentBox();
    mockDOM.setElement('[data-testid="comment-box"]', commentBox);
    
    // Test comment box detection
    const commentBoxes = inserter.findCommentBoxes();
    Assert.greaterThan(commentBoxes.length, 0, 'Should find comment boxes');
    
    // Test visibility check
    const isVisible = inserter.isCommentBoxVisible(commentBox);
    Assert.true(isVisible, 'Should detect visible comment box');
    
    // Test comment insertion
    const testComment = 'Great post! Check out our services at example.com';
    const inserted = inserter.insertComment(commentBox, testComment);
    Assert.true(inserted, 'Should successfully insert comment');
    Assert.equal(commentBox.textContent, testComment, 'Should set comment text correctly');
  });

  // Test: Navigation Detection
  runner.test('FacebookIntegration - Detect page navigation correctly', async () => {
    class MockNavigationDetector {
      constructor() {
        this.currentUrl = mockFacebookPage.url;
        this.navigationCallbacks = [];
      }
      
      onNavigationChange(callback) {
        this.navigationCallbacks.push(callback);
      }
      
      simulateNavigation(newUrl) {
        const oldUrl = this.currentUrl;
        this.currentUrl = newUrl;
        
        // Trigger navigation callbacks
        this.navigationCallbacks.forEach(callback => {
          callback({
            oldUrl,
            newUrl,
            isGroupChange: this.isGroupChange(oldUrl, newUrl)
          });
        });
      }
      
      isGroupChange(oldUrl, newUrl) {
        const oldGroup = this.extractGroupFromUrl(oldUrl);
        const newGroup = this.extractGroupFromUrl(newUrl);
        return oldGroup !== newGroup;
      }
      
      extractGroupFromUrl(url) {
        const match = url.match(/\/groups\/([^\/\?]+)/);
        return match ? match[1] : null;
      }
    }
    
    const detector = new MockNavigationDetector();
    let navigationDetected = false;
    let groupChanged = false;
    
    detector.onNavigationChange((event) => {
      navigationDetected = true;
      groupChanged = event.isGroupChange;
    });
    
    // Test same group navigation
    detector.simulateNavigation('https://www.facebook.com/groups/test-group-123/posts/456');
    Assert.true(navigationDetected, 'Should detect navigation');
    Assert.false(groupChanged, 'Should not detect group change for same group');
    
    // Test group change navigation
    navigationDetected = false;
    detector.simulateNavigation('https://www.facebook.com/groups/different-group-456');
    Assert.true(navigationDetected, 'Should detect navigation to different group');
    Assert.true(groupChanged, 'Should detect group change');
  });

  // Test: Event Handling and Cleanup
  runner.test('FacebookIntegration - Handle events and cleanup properly', async () => {
    class MockEventManager {
      constructor() {
        this.eventListeners = [];
        this.observers = [];
      }
      
      addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
      }
      
      createMutationObserver(callback) {
        const observer = {
          observe: () => {},
          disconnect: () => {},
          callback
        };
        this.observers.push(observer);
        return observer;
      }
      
      cleanup() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        
        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
      }
    }
    
    const eventManager = new MockEventManager();
    
    // Add some event listeners
    const element1 = mockDOM.createElement('div');
    const element2 = mockDOM.createElement('div');
    
    eventManager.addEventListener(element1, 'click', () => {});
    eventManager.addEventListener(element2, 'scroll', () => {});
    
    Assert.equal(eventManager.eventListeners.length, 2, 'Should track event listeners');
    
    // Create mutation observer
    const observer = eventManager.createMutationObserver(() => {});
    Assert.equal(eventManager.observers.length, 1, 'Should track mutation observers');
    
    // Test cleanup
    eventManager.cleanup();
    Assert.equal(eventManager.eventListeners.length, 0, 'Should remove all event listeners');
    Assert.equal(eventManager.observers.length, 0, 'Should disconnect all observers');
  });

  // Test: Integration with Template Engine
  runner.test('FacebookIntegration - Integrate with template engine correctly', async () => {
    const mockStorageManager = MockHelpers.createMockStorageManager();
    const templateEngine = new TemplateEngine(mockStorageManager);
    
    // Add test templates
    await mockStorageManager.saveTemplate({
      id: 'integration_test_1',
      label: 'Integration Test Template',
      template: 'Great post! Check out our services - {site}',
      keywords: ['great', 'post', 'services'],
      verticals: ['general']
    });
    
    class MockFacebookTemplateIntegration {
      constructor(templateEngine) {
        this.templateEngine = templateEngine;
      }
      
      async processPost(postContent, groupId) {
        const suggestions = await this.templateEngine.getSuggestions(postContent, groupId);
        return suggestions;
      }
      
      async recordUsage(suggestion, groupId) {
        await this.templateEngine.recordSuggestionUsage(suggestion, groupId);
      }
    }
    
    const integration = new MockFacebookTemplateIntegration(templateEngine);
    
    // Test post processing
    const postContent = 'This is a great post about services!';
    const groupId = 'integration_test_group';
    
    const suggestions = await integration.processPost(postContent, groupId);
    Assert.true(Array.isArray(suggestions), 'Should return suggestions array');
    
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      Assert.true(typeof suggestion.text === 'string', 'Should have suggestion text');
      Assert.true(typeof suggestion.templateId === 'string', 'Should have template ID');
      
      // Test usage recording
      await integration.recordUsage(suggestion, groupId);
      
      // Verify usage was recorded
      const groupHistory = await mockStorageManager.getGroupHistory(groupId);
      Assert.equal(groupHistory.lastTemplateId, suggestion.templateId, 'Should record template usage');
    }
  });

  // Test: Error Handling in DOM Operations
  runner.test('FacebookIntegration - Handle DOM errors gracefully', async () => {
    class MockDOMErrorHandler {
      safeQuerySelector(selector) {
        try {
          return mockDOM.querySelector(selector);
        } catch (error) {
          console.warn('Query selector failed:', error);
          return null;
        }
      }
      
      safeInsertText(element, text) {
        try {
          if (!element) return false;
          element.textContent = text;
          return true;
        } catch (error) {
          console.warn('Text insertion failed:', error);
          return false;
        }
      }
      
      safeAddEventListener(element, event, handler) {
        try {
          if (!element || typeof element.addEventListener !== 'function') {
            return false;
          }
          element.addEventListener(event, handler);
          return true;
        } catch (error) {
          console.warn('Event listener addition failed:', error);
          return false;
        }
      }
    }
    
    const errorHandler = new MockDOMErrorHandler();
    
    // Test with null element
    const nullResult = errorHandler.safeQuerySelector('non-existent-selector');
    Assert.equal(nullResult, null, 'Should handle non-existent selectors gracefully');
    
    // Test text insertion with null element
    const insertResult = errorHandler.safeInsertText(null, 'test text');
    Assert.false(insertResult, 'Should handle null element gracefully');
    
    // Test event listener with invalid element
    const eventResult = errorHandler.safeAddEventListener(null, 'click', () => {});
    Assert.false(eventResult, 'Should handle invalid element gracefully');
    
    // Test with valid element
    const validElement = mockDOM.createElement('div');
    const validInsert = errorHandler.safeInsertText(validElement, 'test text');
    Assert.true(validInsert, 'Should succeed with valid element');
    Assert.equal(validElement.textContent, 'test text', 'Should set text correctly');
  });

  // Test: Performance with Multiple Posts
  runner.test('FacebookIntegration - Handle multiple posts efficiently', async () => {
    class MockMultiPostProcessor {
      constructor() {
        this.processedPosts = new Set();
      }
      
      async processPosts(posts) {
        const startTime = Date.now();
        const results = [];
        
        for (const post of posts) {
          if (!this.processedPosts.has(post.id)) {
            const content = this.extractContent(post);
            const processed = await this.processPost(content);
            results.push(processed);
            this.processedPosts.add(post.id);
          }
        }
        
        const processingTime = Date.now() - startTime;
        return { results, processingTime };
      }
      
      extractContent(post) {
        return post.content || '';
      }
      
      async processPost(content) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return { content, processed: true };
      }
    }
    
    const processor = new MockMultiPostProcessor();
    
    // Create multiple test posts
    const posts = [];
    for (let i = 0; i < 50; i++) {
      posts.push({
        id: `post_${i}`,
        content: `Test post content ${i}`
      });
    }
    
    const { results, processingTime } = await processor.processPosts(posts);
    
    Assert.equal(results.length, 50, 'Should process all posts');
    Assert.lessThan(processingTime, 1000, 'Should process posts efficiently');
    
    // Test duplicate processing prevention
    const { results: duplicateResults } = await processor.processPosts(posts);
    Assert.equal(duplicateResults.length, 0, 'Should not reprocess same posts');
  });

  return await runner.run();
}

// Export test function
if (typeof window !== 'undefined') {
  window.runFacebookIntegrationTests = runFacebookIntegrationTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = runFacebookIntegrationTests;
}