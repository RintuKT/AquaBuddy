# AquaBuddy 💧 - Desktop App (Mac & Windows) & Chrome Extension

A cross-platform desktop application and browser extension that reminds you to drink water with an animated mascot character that physically **walks across your screen from the left** holding a water bottle!

[![Live Web Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=googlechrome)](https://rintukt.github.io/AquaBuddy/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

🌐 **Try the Live Interactive Web Version**: [https://rintukt.github.io/AquaBuddy/](https://rintukt.github.io/AquaBuddy/)

---

## 🌟 Key Features

### 🚶 1. Animated Walking Mascot on Desktop
- The character **walks across the bottom-left of your desktop screen** over any open window (browsers, IDEs, games, full-screen apps) with an animated walking gait (alternating stepping boots, body bobbing, natural arm swing, and water bottle sloshing).
- It stops, looks at you, waves, lifts the water bottle, and pops open the interactive question toast:
  **"Did you drink water?"**

### 📐 2. Adjustable Character Size
- Easily customize the animated character size in the **Preferences & Character Size** window:
  - **Presets**: Small (0.9x), Medium (1.2x), Large (1.4x default), Extra Large (1.8x)
  - **Custom Scale Slider**: Continuous zoom from `0.8x` to `2.2x` with real-time live preview.

### ✨ 3. Interactive Answer Responses
- **"Yes, I drank! ✨"**:
  - Mascot's eyes turn into sparkling stars, gives a big joyful smile, and jumps up celebrating!
  - Displays *"Good Job! 🌟 Stay fresh & energized!"* with `+1 Glass logged`.
  - Plays a celebratory audio chime and automatically schedules the next reminder in **30 minutes**.
  - Mascot happily waves and walks out to the right.
- **"Remind me later ⏰"**:
  - Mascot nods gently (*"Got it! I will be back in 10 minutes!"*).
  - Automatically reschedules a snooze check-in in **10 minutes**, then continues the normal 30-minute interval.
  - Mascot turns around and walks back out to the left.

### 🖥️ 4. System Tray & Menu Bar Integration
- Runs quietly in your macOS Menu Bar or Windows System Tray.
- Shows time remaining until next water break and today's glass count.
- **"🚶 Test Walking Mascot Animation"** trigger button to test the walk anytime with 1 click.

---

## 📦 Download Standalone Applications

You can download pre-built standalone applications without needing terminal or developer tools:

### ⚡ 1-Line Instant Install for macOS (Zero Warnings)
To install directly to `/Applications` with automatic security unblocking:
```bash
curl -fsSL https://raw.githubusercontent.com/RintuKT/AquaBuddy/main/install.sh | bash
```

### 📥 Manual Downloads

| Platform | Download Format | Description |
| :--- | :--- | :--- |
| **macOS** (Native Installer) | [**AquaBuddy-1.0.0.pkg**](https://github.com/RintuKT/AquaBuddy/releases) | Double-click to install into `/Applications` |
| **macOS** (Portable Bundle) | [**AquaBuddy-1.0.0-arm64-mac.zip**](https://github.com/RintuKT/AquaBuddy/releases) | Unzip and double-click `Open AquaBuddy.command` |
| **macOS** (Disk Image) | [**AquaBuddy-1.0.0-arm64.dmg**](https://github.com/RintuKT/AquaBuddy/releases) | Drag to Applications |
| **Windows** (64-bit PC / Laptop) | [**AquaBuddy-1.0.0-win.zip**](https://github.com/RintuKT/AquaBuddy/releases) | Extract and double-click `AquaBuddy.exe` to run |
| **Chrome / Edge Extension** | [**aquabuddy-chrome-extension.zip**](https://github.com/RintuKT/AquaBuddy/releases) | Unzip and Load Unpacked in `chrome://extensions` |

> *To build these installer packages yourself on your machine:*
> ```bash
> npm run dist:mac    # Builds macOS DMG & ZIP
> npm run dist:win    # Builds Windows 64-bit ZIP with AquaBuddy.exe
> npm run dist:all    # Builds all platforms and Chrome Extension ZIP
> ```

---

## 💻 How to Run from Source (Mac & Windows)

### Prerequisites
- Node.js installed on your machine.

### Start App
Open your terminal in this directory and run:
```bash
npm install
npm start
```
The app will launch in your menu bar / system tray and open the **Preferences & Character Size** dashboard. Click **"🚶 Test Walk"** to watch the character walk across your screen immediately!

---

## 🌐 How to Load as a Chrome Extension (Optional)

If you also want to run it as a browser extension inside Google Chrome / Edge:
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** (top left).
4. Select this directory: `/Users/rintukt/Desktop/Project reminder`.
