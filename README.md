# YouTube Shorts Blocker

A Chrome extension that lets you customize YouTube by hiding Shorts, Explore, and other sections with granular controls.

## Features

### Shorts Blocking
- **Block Shorts URLs**: Automatically redirects `/shorts/*` URLs to the YouTube homepage
- **Hide Shorts Button**: Removes the Shorts button from the sidebar navigation
- **Hide Shorts Shelves**: Removes Shorts sections from homepage and other pages

### Sidebar Customization
- **Hide "Explore"**: Removes the Explore section (Music, Movies, Gaming, etc.)
- **Hide "More from YouTube"**: Removes the More from YouTube section (YouTube Studio, Music, Kids, etc.)

### General
- **Granular Control**: Enable/disable each feature independently
- **Dark Mode**: Automatically follows your system theme
- **SPA-aware**: Works with YouTube's single-page app navigation
- **Lightweight**: Minimal permissions, no data collection

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `youtube-shorts-blocker-v7` folder

### From Chrome Web Store

*Coming soon*

## Usage

Click the extension icon to open the settings panel with five toggles organized in two sections:

### Shorts Blocking
| Setting | Description | Default |
|---------|-------------|---------|
| **Block Shorts URLs** | Redirects `/shorts/` pages to homepage | ON |
| **Hide Shorts Button** | Removes Shorts from sidebar menu | ON |
| **Hide Shorts Shelves** | Hides Shorts sections on pages | ON |

### Sidebar Sections
| Setting | Description | Default |
|---------|-------------|---------|
| **Hide "Explore"** | Hides Music, Movies, Gaming, etc. | OFF |
| **Hide "More from YouTube"** | Hides YouTube Studio, Music, Kids, etc. | OFF |

Changes take effect immediately.

## How It Works

The extension uses multiple approaches:

1. **Declarative Net Request (DNR)**: Intercepts direct navigation to Shorts URLs
2. **Content Script CSS**: Hides elements that can be targeted by CSS selectors
3. **Content Script JS**: Finds and hides sidebar sections by their title text
4. **Background Service Worker**: Manages DNR rules when URL blocking is toggled

## Permissions

| Permission | Purpose |
|------------|---------|
| `declarativeNetRequest` | URL redirects for Shorts pages |
| `storage` | Save your preferences |
| `host_permissions` on `youtube.com` | Content script injection |

## Project Structure

```
youtube-shorts-blocker-v7/
├── manifest.json              # Extension manifest (MV3)
├── rules/
│   └── redirect_rules.json    # DNR redirect rules
├── src/
│   ├── background/
│   │   └── service-worker.js  # DNR rule management
│   ├── content/
│   │   └── content.js         # DOM hiding & settings
│   └── popup/
│       ├── popup.html         # Settings UI (with dark mode)
│       └── popup.js           # Settings logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License - see [LICENSE](LICENSE) file

## Contributing

Issues and pull requests are welcome.

## Changelog

### v7.0.0
- Refined localized section detection to avoid hiding "Moje" on Slovak UI

### v6.0.0
- Improved sidebar section detection for localized YouTube (including Slovak)

### v5.0.0
- Hide the remaining Shorts shelf header/buttons on Subscriptions

### v4.0.0
- Added dark mode support (follows system preference)
- Improved Shorts shelf hiding on subscriptions page

### v3.0.0
- Added "Hide Explore" option for sidebar
- Added "Hide More from YouTube" option for sidebar
- Reorganized settings into categories

### v2.0.0
- Added granular controls for individual features
- New settings panel with three toggles
- Background service worker for DNR rule management

### v1.0.0
- Initial release
- Block Shorts URL navigation
- Hide Shorts UI elements
- Simple enable/disable toggle
