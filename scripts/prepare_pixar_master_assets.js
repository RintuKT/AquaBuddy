const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');

// Standard canvas definition
const CANVAS_W = 600;
const CANVAS_H = 650;
const GROUND_Y = 610; // Feet touch here
const TARGET_STAND_BODY_H = 550; // Head-to-toe height for standing character

async function findBBox(buffer, width, height) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = buffer[(y * width + x) * 4 + 3];
      if (alpha > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

async function processImage(filename, outName, options = {}) {
  const filePath = path.join(assetsDir, filename);
  const outPath = path.join(assetsDir, outName);

  const { data, info } = await sharp(filePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const bbox = await findBBox(data, info.width, info.height);

  // Extract character cropped
  const cropped = await sharp(filePath)
    .extract({
      left: bbox.minX,
      top: bbox.minY,
      width: bbox.w + 1,
      height: bbox.h + 1
    })
    .toBuffer();

  // Determine scaling
  let targetH = TARGET_STAND_BODY_H;
  if (options.scaleFactor) {
    targetH = Math.round(targetH * options.scaleFactor);
  }

  const resized = await sharp(cropped)
    .resize({ height: targetH, fit: 'inside' })
    .toBuffer();

  const resMeta = await sharp(resized).metadata();

  // Position: feet contact at GROUND_Y, centered horizontally or aligned
  const top = options.offsetY ? GROUND_Y - resMeta.height + options.offsetY : GROUND_Y - resMeta.height;
  const left = Math.round((CANVAS_W - resMeta.width) / 2) + (options.offsetX || 0);

  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: resized, top: Math.max(0, top), left: Math.max(0, left) }])
  .png({ quality: 100 })
  .toFile(outPath);

  console.log(`Successfully generated ${outName} (${CANVAS_W}x${CANVAS_H})`);
}

async function main() {
  // 1. Stand: Leo facing user, raising blue HYDRATE bottle, fox looking at user
  await processImage('character_stand.png', 'pixar_stand.png', {
    scaleFactor: 1.0,
    offsetY: 0,
    offsetX: 0
  });

  // 2. Walk: Leo walking forward in stride with blue bottle and perked fox
  await processImage('character_walk.png', 'pixar_walk.png', {
    scaleFactor: 1.0,
    offsetY: 0,
    offsetX: 0
  });

  // 3. Celebrate: Leo jumping with thumbs up and bottle held high ("Yey!")
  await processImage('character_celebrate.png', 'pixar_celebrate.png', {
    scaleFactor: 0.95,
    offsetY: -15, // Floating slightly in jump pose
    offsetX: 0
  });

  // 4. Crying: Leo sad with falling tears, drooping shoulders, sad fox ("Aww...")
  await processImage('character_crying.png', 'pixar_crying.png', {
    scaleFactor: 0.98,
    offsetY: 4, // Slight slouch
    offsetX: 0
  });

  console.log('All 4 Pixar master assets normalized!');
}

main().catch(console.error);
