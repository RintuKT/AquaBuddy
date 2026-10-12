const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.join(rootDir, 'icons');

async function buildIcons() {
  console.log('[AquaBuddy] Generating tray and app icons featuring Leo & Fox heads...');

  const standImg = path.join(rootDir, 'assets', 'pixar_stand.png');
  
  // Crop precisely to Leo and Fox heads
  const headsBuffer = await sharp(standImg)
    .extract({ left: 188, top: 35, width: 247, height: 165 })
    .png()
    .toBuffer();

  // 1. Create transparent tray icons for macOS / Windows notification bar
  await sharp(headsBuffer)
    .resize(32, 22, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'tray-icon.png'));

  await sharp(headsBuffer)
    .resize(64, 44, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'tray-icon@2x.png'));

  // 2. Standard icons for browser extension & alerts
  await sharp(headsBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'icon16.png'));

  await sharp(headsBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'icon48.png'));

  await sharp(headsBuffer)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'icon128.png'));

  // 3. Create 512x512 master App Icon with rounded background and Leo & Fox heads
  const backgroundSvg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0284c7" />
          <stop offset="50%" stop-color="#0369a1" />
          <stop offset="100%" stop-color="#082f49" />
        </linearGradient>
        <linearGradient id="border" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="472" height="472" rx="115" fill="url(#bg)" stroke="url(#border)" stroke-width="8" />
      <circle cx="256" cy="270" r="185" fill="#38bdf8" opacity="0.15" />
    </svg>
  `);

  const bgBuffer = await sharp(backgroundSvg).png().toBuffer();
  const heads512 = await sharp(headsBuffer)
    .resize(420, 280, { fit: 'contain' })
    .toBuffer();

  const icon512Path = path.join(iconsDir, 'icon.png');
  await sharp(bgBuffer)
    .composite([
      { input: heads512, top: 120, left: 46 }
    ])
    .png()
    .toFile(icon512Path);

  console.log('[AquaBuddy] Saved 512x512 icon to', icon512Path);

  // 4. Generate .icns for macOS using native iconutil
  const iconsetDir = path.join(iconsDir, 'AquaBuddy.iconset');
  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true });
  }
  fs.mkdirSync(iconsetDir, { recursive: true });

  const sizes = [16, 32, 64, 128, 256, 512];
  for (const s of sizes) {
    await sharp(icon512Path).resize(s, s).toFile(path.join(iconsetDir, `icon_${s}x${s}.png`));
    if (s <= 256) {
      await sharp(icon512Path).resize(s * 2, s * 2).toFile(path.join(iconsetDir, `icon_${s}x${s}@2x.png`));
    }
  }

  try {
    const icnsPath = path.join(iconsDir, 'icon.icns');
    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' });
    console.log('[AquaBuddy] Generated native macOS icon.icns at', icnsPath);
  } catch (e) {
    console.log('[AquaBuddy] iconutil note:', e.message);
  } finally {
    if (fs.existsSync(iconsetDir)) {
      fs.rmSync(iconsetDir, { recursive: true });
    }
  }
}

buildIcons().catch(console.error);
