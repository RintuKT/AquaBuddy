const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const frames = [
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/pixar_chair_1792059788339.jpg',
    output: path.join(__dirname, '..', 'assets', 'pixar_chair.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/leo_carry_chair_1792059815970.jpg',
    output: path.join(__dirname, '..', 'assets', 'pixar_carry_chair.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/leo_sit_chair_1792059835204.jpg',
    output: path.join(__dirname, '..', 'assets', 'pixar_sit_chair.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/leo_throw_chair_1792059854173.jpg',
    output: path.join(__dirname, '..', 'assets', 'pixar_throw_chair.png')
  }
];

async function removeWhiteBgAndClean(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const threshold = 238;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    // White background detection
    if (brightness >= threshold && diff < 20) {
      if (brightness >= 248) {
        data[i + 3] = 0; // Completely transparent
      } else {
        const factor = (255 - brightness) / (255 - threshold);
        data[i + 3] = Math.round(255 * factor * factor);
      }
    }
  }

  // Also trim excess transparent borders and resize to standard height
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .trim()
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved clean transparent PNG: ${outputPath}`);
}

async function run() {
  for (const item of frames) {
    await removeWhiteBgAndClean(item.input, item.output);
  }
  console.log('All walk & chair assets successfully processed!');
}

run().catch(console.error);
