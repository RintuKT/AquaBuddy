const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const targetCanvasWidth = 400;
const targetCanvasHeight = 520;
const targetCharHeight = 460;
const groundY = 490; // Where the bottom of the shoes touch

async function findBBox(buffer, width, height) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = buffer[(y * width + x) * 4 + 3];
      if (alpha > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

async function normalizeImage(inputPath, outputPath, isCelebrate = false) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const bbox = await findBBox(data, info.width, info.height);

  // Extract just the character bounding box
  const cropped = await sharp(inputPath)
    .extract({
      left: Math.max(0, bbox.minX),
      top: Math.max(0, bbox.minY),
      width: Math.min(info.width - bbox.minX, bbox.w + 1),
      height: Math.min(info.height - bbox.minY, bbox.h + 1)
    })
    .toBuffer();

  // Resize so character height matches targetCharHeight
  // For celebrate (where bottle is raised high above head), scale based on body proportion
  const scale = isCelebrate ? 0.88 : 1.0;
  const scaledHeight = Math.round(targetCharHeight * scale);

  const resized = await sharp(cropped)
    .resize({ height: scaledHeight, fit: 'inside' })
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();

  // Place on targetCanvasWidth x targetCanvasHeight canvas, aligned with groundY
  const top = Math.max(0, groundY - resizedMeta.height);
  const left = Math.round((targetCanvasWidth - resizedMeta.width) / 2);

  await sharp({
    create: {
      width: targetCanvasWidth,
      height: targetCanvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: resized, top: top, left: left }])
  .png({ quality: 100 })
  .toFile(outputPath);

  console.log(`Normalized ${path.basename(outputPath)} -> ${targetCanvasWidth}x${targetCanvasHeight}`);
}

async function run() {
  // Normalize Walk Frames 0-5
  const normalizedWalkFrames = [];
  for (let i = 0; i < 6; i++) {
    const inPath = path.join(assetsDir, `walk_frame_${i}.png`);
    const outPath = path.join(assetsDir, `norm_walk_${i}.png`);
    await normalizeImage(inPath, outPath);
    normalizedWalkFrames.push(outPath);
  }

  // Normalize Stand
  await normalizeImage(path.join(assetsDir, 'character_stand.png'), path.join(assetsDir, 'norm_stand.png'));

  // Normalize Celebrate
  await normalizeImage(path.join(assetsDir, 'character_celebrate.png'), path.join(assetsDir, 'norm_celebrate.png'), true);

  // Normalize Crying
  await normalizeImage(path.join(assetsDir, 'character_crying.png'), path.join(assetsDir, 'norm_crying.png'));

  // Create combined 6-frame walk strip (2400 x 520)
  const compositeList = [];
  for (let i = 0; i < 6; i++) {
    compositeList.push({
      input: normalizedWalkFrames[i],
      left: i * targetCanvasWidth,
      top: 0
    });
  }

  const stripOut = path.join(assetsDir, 'norm_walk_strip.png');
  await sharp({
    create: {
      width: targetCanvasWidth * 6,
      height: targetCanvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite(compositeList)
  .png({ quality: 100 })
  .toFile(stripOut);

  console.log(`Created normalized 6-frame sprite strip: ${stripOut}`);
}

run().catch(console.error);
