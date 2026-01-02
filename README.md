# MyTeleprompter 🎤

A professional, feature-rich teleprompter application built with Next.js, React, and TypeScript. Perfect for speakers, presenters, video creators, and anyone who needs to deliver scripted content flawlessly.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 Core Teleprompter Features
- **Auto-Scrolling** - Smooth, adjustable speed control (5-100 units)
- **Default Content** - Loads speech-content.txt automatically on start
- **Multiple Input Methods** - Upload .txt files or paste text directly
- **Progress Tracking** - Real-time progress bar, WPM counter, word count
- **Theme Options** - Dark, Light, Sepia, and Blue themes
- **Font Customization** - Adjustable font sizes (12px - 72px)
- **Fullscreen Mode** - Distraction-free reading experience
- **Mirror Mode** - Flip text horizontally for teleprompter mirrors
- **Wake Lock** - Keeps screen on during presentations

### 📚 Script Library Management
- **Save Scripts** - Save unlimited scripts with custom titles
- **Folder Organization** - Create and manage folders/categories
- **Search Functionality** - Find scripts by title or content
- **Filter by Folder** - Organize and filter scripts
- **Export Scripts** - Download scripts as .txt files
- **Script Metadata** - Track creation and update timestamps
- **Local Storage** - All data stored locally for privacy

### 🎮 Integrated Controls
- **Home Button** - Return to landing page from teleprompter
- **Upload Button** - Upload new content while in teleprompter
- **Save Button** - Save current script to library
- **All controls integrated** - Seamlessly built into control panel

### ⌨️ Keyboard Shortcuts
- **Space** - Play/Pause
- **R** - Reset to beginning
- **F** - Toggle fullscreen
- **M** - Toggle mirror mode
- **C** - Hide/Show controls
- **S** - Save current position
- **↑/↓** - Adjust scrolling speed
- **1-4** - Switch themes (1=Dark, 2=Light, 3=Sepia, 4=Blue)

### 🔒 Privacy & Security
- **Local Processing** - All content stays on your device
- **No Cloud Uploads** - Complete privacy for sensitive content
- **LocalStorage Only** - Data persists locally
- **No Tracking** - Zero analytics or data collection
- **No Server Required** - Fully client-side application

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mytelepromptor.git
   cd mytelepromptor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📖 How to Use

### Getting Started

1. **Landing Page** - Default speech content loads automatically
2. **Three Ways to Start:**
   - Click "Start Now" with default content
   - Upload a .txt file
   - Paste your own text
   - Load a saved script from library

### Using the Teleprompter

#### Control Panel (Top Bar)
- **Play/Pause** - Start/stop scrolling
- **Reset** - Return to beginning
- **Bookmark** - Save current position
- **Home** - Return to landing page
- **Upload** - Load new content
- **Save** - Save to script library
- **Speed Slider** - Adjust scrolling speed
- **Font Slider** - Change text size
- **Theme Selector** - Choose visual theme
- **Mirror** - Flip text horizontally
- **Fullscreen** - Enter/exit fullscreen
- **Hide Controls** - Minimize control panel

#### Progress Bar (Bottom)
- Shows completion percentage
- Real-time WPM (words per minute)
- Words read vs total words
- Estimated total time

### Script Library

#### Saving Scripts
1. Click **Save** button in teleprompter
2. Enter a title for your script
3. Select or create a folder
4. Click Save

#### Managing Scripts
1. Click **Script Library** on landing page
2. **Search** - Find scripts by title or content
3. **Filter** - Select folder to filter
4. **Load** - Open script in teleprompter
5. **Export** - Download as .txt file
6. **Delete** - Remove unwanted scripts

#### Organizing with Folders
- Create folders when saving scripts
- Filter library by folder
- Keep scripts organized by topic/event

## 🎨 Themes

### Available Themes
- **Dark** - Black background, white text, green guide line
- **Light** - Light gray background, dark text, blue guide line
- **Sepia** - Warm beige background, brown text, orange guide line
- **Blue** - Deep blue background, light text, cyan guide line

### Switching Themes
- Use theme selector in control panel
- Or press 1-4 keys for quick switching
- Theme preference is saved automatically

## 🏗️ Project Structure

```
mytelepromptor/
├── app/
│   ├── page.tsx              # Landing page with script library
│   ├── speech/
│   │   └── page.tsx          # Password-protected speech page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── Teleprompter.tsx      # Main teleprompter component
├── public/
│   └── speech-content.txt    # Default speech content
├── package.json
└── README.md
```

## 🛠️ Technologies Used

- **Framework**: Next.js 16.1.1 (with Turbopack)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.19
- **Icons**: Lucide React
- **Build Tool**: Turbopack (Next.js built-in)

## 🎯 Use Cases

- **Public Speaking** - Deliver speeches with confidence
- **Video Production** - Create professional video content
- **Presentations** - Business and educational presentations
- **Live Streaming** - Scripted content for streamers
- **Podcasting** - Stay on track with your podcast script
- **Training** - Educational and training sessions
- **Interviews** - Prepare and deliver interview responses
- **Announcements** - Corporate or event announcements

## 💡 Tips & Best Practices

### For Best Results
1. **Prepare Your Script** - Format with clear sections
2. **Practice First** - Use countdown timer to prepare
3. **Adjust Speed** - Find comfortable reading pace
4. **Use Bookmarks** - Mark important sections
5. **Save Position** - Resume where you left off
6. **Choose Theme** - Select based on lighting conditions
7. **Organize Scripts** - Use folders for different events

### Script Formatting
- Use clear paragraphs for natural pauses
- Add section markers with `[Section Name]` for auto-pause
- Keep sentences concise for easier reading
- Use line breaks for emphasis

### Performance Tips
- Close unnecessary browser tabs
- Use fullscreen mode for presentations
- Enable wake lock to prevent screen sleep
- Save position frequently for long scripts

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
No environment variables required! Everything runs locally.

### Customization

#### Changing Default Content
Replace `public/speech-content.txt` with your default speech.

#### Adding Custom Themes
Edit `components/Teleprompter.tsx`:
```typescript
const themes = {
  yourtheme: { 
    bg: "bg-your-color", 
    text: "text-your-color", 
    line: "bg-your-color" 
  },
};
```

#### Modifying Default Settings
Edit default values in `components/Teleprompter.tsx`:
```typescript
defaultSpeed = 30,      // Adjust default speed
defaultFontSize = 24,   // Adjust default font size
```

## 📱 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ Wake Lock API may not work in all browsers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues for solutions

## 🎉 Features Roadmap

### Planned Features
- [ ] Cloud sync (optional)
- [ ] Collaboration features
- [ ] Voice control
- [ ] Video recording integration
- [ ] AI script analysis
- [ ] Mobile app (iOS/Android)
- [ ] Remote control via phone
- [ ] Multi-language support

## 📊 Stats

- **Lines of Code**: ~1,500+
- **Components**: 2 main components
- **Themes**: 4 built-in themes
- **Keyboard Shortcuts**: 10+
- **Storage**: LocalStorage (unlimited scripts)

---

**Made with ❤️ for speakers who demand excellence**

🌟 If you find this project helpful, please consider giving it a star!

## 🔥 Quick Start Guide

### First Time Users

1. **Open the app** → Default content loads automatically
2. **Click "Start Now"** → Teleprompter launches
3. **Press Space** → Start scrolling
4. **Adjust speed** → Use slider or ↑/↓ keys
5. **Save your work** → Click Save button
6. **Organize** → Create folders in Script Library

### Power Users

- Use keyboard shortcuts for everything
- Create folders for different events
- Save positions to resume later
- Export scripts for backup
- Use mirror mode with physical teleprompter
- Customize themes for different lighting

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅
