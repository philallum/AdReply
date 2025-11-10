// Connection and communication with background script
class ConnectionManager {
    constructor() {
        this.isConnected = false;
    }

    async testConnection() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'PING' });
            this.isConnected = response && response.success;
            return this.isConnected;
        } catch (error) {
            this.isConnected = false;
            return false;
        }
    }

    async getRecentPosts() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_RECENT_POSTS' });
            
            if (response && response.success && response.posts && response.posts.length > 0) {
                return response.posts[0]; // Return most recent post
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async getCurrentGroup() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_GROUP' });
            if (response && response.success) {
                return response.groupInfo;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async clearPosts() {
        try {
            return await Promise.race([
                chrome.runtime.sendMessage({ type: 'CLEAR_POSTS' }),
                new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
            ]);
        } catch (error) {
            console.warn('⚠️ Background not responding for clearPosts, continuing anyway');
            return { success: true };
        }
    }

    async storePost(postData) {
        try {
            return await Promise.race([
                chrome.runtime.sendMessage({
                    type: 'NEW_POST',
                    data: postData
                }),
                new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
            ]);
        } catch (error) {
            console.warn('⚠️ Background not responding for storePost, continuing anyway');
            return { success: true };
        }
    }
}

export default ConnectionManager;