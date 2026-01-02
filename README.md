# MyTeleprompter 🎤

A professional, feature-rich teleprompter application built with Next.js, React, and TypeScript. Perfect for speakers, presenters, video creators, and anyone who needs to deliver scripted content flawlessly.

![MyTeleprompter](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 Core Functionality
- **Smooth Auto-Scrolling** - Adjustable speed control (1-100 WPM)
- **Multiple Themes** - Dark, Light, Sepia, and Blue themes
- **Fullscreen Mode** - Distraction-free reading experience
- **Font Customization** - Adjustable font sizes (16px - 48px)
- **Progress Tracking** - Real-time WPM, word count, and time estimates

### 🎨 User Interface
- **Modern Design** - Beautiful gradient backgrounds and animations
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Visual Guide Line** - Colored horizontal line to track reading position
- **Bookmark Support** - Mark important sections in your script
- **Theme Switcher** - Quick theme changes with visual preview

### ⌨️ Keyboard Shortcuts
- **Space** - Play/Pause
- **R** - Reset to beginning
- **F** - Toggle fullscreen
- **↑/↓** - Adjust scrolling speed
- **+/-** - Adjust font size
- **1-4** - Switch themes (1=Dark, 2=Light, 3=Sepia, 4=Blue)

### 🔒 Privacy & Security
- **Local Processing** - All content stays on your device
- **No Cloud Uploads** - Complete privacy for sensitive content
- **Session Storage** - Temporary authentication for secure access
- **No Tracking** - Zero analytics or data collection

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

### Method 1: Upload a Text File
1. Click on the upload area on the home page
2. Select a `.txt` file containing your speech
3. The teleprompter will launch automatically

### Method 2: Paste Your Text
1. Paste your speech content into the text area
2. Click "Start Teleprompter"
3. Adjust settings as needed

### Method 3: Try the Demo
1. Click "Try Demo" on the home page
2. Experience the teleprompter with sample content
3. Familiarize yourself with all features

## 🎛️ Controls & Settings

### Speed Control
- Use the slider or arrow keys to adjust scrolling speed
- Range: 1-100 words per minute
- Real-time speed adjustment while scrolling

### Font Size
- Adjust from 16px to 48px
- Use +/- keys for quick changes
- Perfect for different viewing distances

### Themes
- **Dark** - Black background, white text, green guide line
- **Light** - Light gray background, dark text, blue guide line
- **Sepia** - Warm beige background, brown text, orange guide line
- **Blue** - Deep blue background, light text, cyan guide line

### Fullscreen Mode
- Press 'F' or click the fullscreen button
- Removes all distractions
- Perfect for presentations and recordings

## 🏗️ Project Structure

```
mytelepromptor/
├── app/
│   ├── page.tsx              # Landing page with upload functionality
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

## 🎨 Customization

### Changing the Default Password
Edit `app/speech/page.tsx`:
```typescript
const CORRECT_PASSWORD = "your-password-here";
```

### Adding Custom Themes
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

### Modifying Default Content
Replace `public/speech-content.txt` with your default speech content.

## 📱 Use Cases

- **Public Speaking** - Deliver speeches with confidence
- **Video Production** - Create professional video content
- **Presentations** - Business and educational presentations
- **Live Streaming** - Scripted content for streamers
- **Podcasting** - Stay on track with your podcast script
- **Training** - Educational and training sessions

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
No environment variables required! Everything runs locally.

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

---

**Made with ❤️ for speakers who demand excellence**

🌟 If you find this project helpful, please consider giving it a star!
