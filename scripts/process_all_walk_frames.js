const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const frames = [
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/boy_walk_left_stride_1791451931858.jpg',
    output: path.join(__dirname, '..', 'assets', 'character_walk_step1.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/boy_walk_right_stride_1791451952623.jpg',
    output: path.join(__dirname, '..', 'assets', 'character_walk_step2.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/boy_standing_ask_1791451973786.jpg',
    output: path.join(__dirname, '..', 'assets', 'character_stand.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/mascot_celebrating_1791446380382.jpg',
    output: path.join(__dirname, '..', 'assets', 'character_celebrate.png')
  },
  {
    input: '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/mascot_crying_1791450952822.jpg',
    output: path.join(__dirname, '..', 'assets', 'character_crying.png')
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

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved clean transparent PNG: ${outputPath}`);
}

async function run() {
  for (const item of frames) {
    await removeWhiteBgAndClean(item.input, item.output);
  }
}

run().catch(console.error);
