# AdReply Chrome Extension

AdReply is a Chrome extension that assists small business owners, creators, and marketers in advertising effectively within Facebook Groups. The system provides contextually relevant advertisement-style comment suggestions based on viewed posts.

## Project Structure

```
adreply-chrome-extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── scripts/
│   ├── background.js         # Service worker for background tasks
│   └── content.js           # Content script for Facebook integration
├── ui/
│   ├── sidepanel.html       # Side panel HTML structure
│   ├── sidepanel.js         # Side panel JavaScript logic
│   └── styles.css           # Side panel CSS styles
├── assets/
│   └── icons/               # Extension icons (16, 32, 48, 128px)
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
└── README.md                # This file
```

## Features

- **Local Privacy**: All data stored locally in browser
- **Facebook Integration**: Seamless integration with Facebook Groups
- **Template Management**: Create and manage advertisement templates
- **Smart Matching**: Keyword-based template matching
- **Anti-Spam Rotation**: Prevents repetitive comments
- **Pro Features**: AI-powered enhancements with subscription
- **License Management**: JWT-based Pro license validation

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The AdReply extension should now be installed

## Development

This extension is built using Manifest V3 and includes:

- **Service Worker**: Handles background tasks and extension lifecycle
- **Content Scripts**: Integrates with Facebook's DOM
- **Side Panel**: Provides the main user interface
- **Local Storage**: Uses IndexedDB and Chrome storage APIs

## Permissions

The extension requires the following permissions:
- `storage`: For local data persistence
- `activeTab`: For accessing the current Facebook tab
- `scripting`: For injecting content scripts
- `unlimitedStorage`: For storing large template libraries

## License

This project is part of the AdReply system and follows the licensing terms defined in the main application.