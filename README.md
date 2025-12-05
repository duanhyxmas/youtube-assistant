# Youtube Assistant

A powerful desktop application built with Electron for managing and downloading YouTube videos.

## Features

- 🎥 **YouTube Video Management** - Browse, search, and organize YouTube videos
- ⬇️ **Video Download** - Download videos using yt-dlp with progress tracking
- 🔍 **Smart Search** - Search YouTube with autocomplete suggestions
- 📱 **Embedded Player** - Watch videos directly in the app using YouTube Player API
- 🌐 **Cross-platform** - Supports Windows and macOS
- 🍪 **Browser Cookie Support** - Import cookies for accessing age-restricted content
- 🗄️ **Local Database** - SQLite-based storage for favorites and downloads

## Tech Stack

- **Framework**: Electron + Vite
- **Frontend**: React + TypeScript + Ant Design
- **Backend**: Node.js
- **Database**: better-sqlite3
- **Video Download**: yt-dlp-wrap
- **YouTube API**: youtubei.js

## Prerequisites

- Node.js 16+
- npm or yarn
- yt-dlp binary (included in resources/bin)

## Installation

```bash
# Clone the repository
git clone https://github.com/duanhyxmas/youtube-assistant.git
cd youtube-assistant

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:mac    # macOS
npm run build:win    # Windows
```

## Development

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Type check
npm run typecheck

# Format code
npm run format
```

## Project Structure

```
youtube-assistant/
├── src/
│   ├── main/           # Electron main process
│   │   ├── helpers/    # Helper classes (download, database, etc.)
│   │   └── index.ts    # Main entry point
│   ├── preload/        # Preload scripts
│   └── renderer/       # React frontend
│       ├── components/ # React components
│       ├── pages/      # Page components
│       └── utils/      # Utility functions
├── resources/          # Static resources
│   └── bin/           # yt-dlp binaries
└── build/             # Build configuration
```

## Configuration

The app stores data in the following locations:
- **macOS**: `~/Library/Application Support/youtube-assistant`
- **Windows**: `%APPDATA%/youtube-assistant`

## Known Issues

- **macOS Code Signing**: If you encounter "code signature not valid" errors, the app includes the necessary entitlements to load yt-dlp
- **Windows Process Termination**: Download cancellation uses `taskkill` for proper cleanup

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This means you can:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately
- ✅ Sublicense

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Video download engine
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [React](https://reactjs.org/) - UI framework
- [Ant Design](https://ant.design/) - UI component library

## Disclaimer

This tool is for personal use only. Please respect YouTube's Terms of Service and copyright laws. The developers are not responsible for any misuse of this software.

---

Made with ❤️ by the community
