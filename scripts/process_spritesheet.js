const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const spritePath = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/walk_spritesheet_1791453544431.jpg';
const assetsDir = path.join(__dirname, '..', 'assets');

async function processSpriteSheet() {
  const metadata = await sharp(spritePath).metadata();
  console.log(`Sprite Dimensions: ${metadata.width}x${metadata.height}`);

  const image = sharp(spritePath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const threshold = 240;

  // Make white background transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    if (brightness >= threshold && diff < 15) {
      if (brightness >= 248) {
        data[i + 3] = 0;
      } else {
        const factor = (255 - brightness) / (255 - threshold);
        data[i + 3] = Math.round(255 * factor * factor);
      }
    }
  }

  // Save full transparent spritesheet
  const transparentBuffer = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toBuffer();

  const fullSpriteOut = path.join(assetsDir, 'walk_spritesheet.png');
  fs.writeFileSync(fullSpriteOut, transparentBuffer);
  console.log(`Saved transparent spritesheet to ${fullSpriteOut}`);

  // Now split into 6 individual frames with equal widths
  const frameWidth = Math.floor(info.width / 6);
  const frameHeight = info.height;

  for (let frameIndex = 0; frameIndex < 6; frameIndex++) {
    const left = frameIndex * frameWidth;
    const frameBuffer = await sharp(transparentBuffer)
      .extract({ left: left, top: 0, width: frameWidth, height: frameHeight })
      .png({ quality: 100 })
      .toBuffer();

    const outFramePath = path.join(assetsDir, `walk_frame_${frameIndex}.png`);
    fs.writeFileSync(outFramePath, frameBuffer);
    console.log(`Extracted Frame ${frameIndex} to ${outFramePath} (${frameWidth}x${frameHeight})`);
  }
}

processSpriteSheet().catch(console.error);
