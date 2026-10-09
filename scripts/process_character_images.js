const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const walkingJpg = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/mascot_walking_1791446358088.jpg';
const celebratingJpg = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/mascot_celebrating_1791446380382.jpg';
const cryingJpg = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/mascot_crying_1791450952822.jpg';

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function removeWhiteBg(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const threshold = 240; // white threshold

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    // If pixel is near pure white
    if (brightness >= threshold && diff < 18) {
      if (brightness >= 252) {
        data[i + 3] = 0; // Fully transparent
      } else {
        const factor = (255 - brightness) / (255 - threshold);
        data[i + 3] = Math.round(255 * factor);
      }
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved transparent PNG: ${outputPath}`);
}

async function run() {
  await removeWhiteBg(walkingJpg, path.join(assetsDir, 'character_walk.png'));
  await removeWhiteBg(celebratingJpg, path.join(assetsDir, 'character_celebrate.png'));
  await removeWhiteBg(cryingJpg, path.join(assetsDir, 'character_crying.png'));
}

run().catch(console.error);
