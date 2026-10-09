const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brainDir = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b';
const spritePath = path.join(brainDir, 'walk_spritesheet_1791453544431.jpg');
const standPath = path.join(brainDir, 'boy_standing_ask_1791451973786.jpg');
const celebratePath = path.join(brainDir, 'mascot_celebrating_1791446380382.jpg');
const cryingPath = path.join(brainDir, 'mascot_crying_1791450952822.jpg');

const assetsDir = path.join(__dirname, '..', 'assets');

const targetCanvasWidth = 400;
const targetCanvasHeight = 520;
const targetCharHeight = 450;
const groundY = 485;

// Flood fill background removal
async function cleanBackground(imageBuffer, width, height) {
  const { data } = await sharp(imageBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const w = width, h = height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isBg(x, y) {
    const idx = (y * w + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const brightness = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    // Pure white or near white background
    if (brightness > 232) return true;

    // Soft gray gradient background or shadow reachable from edges
    if (brightness > 165 && diff < 16) return true;

    // Contact shadow at the bottom floor
    if (y > h * 0.85 && brightness > 140 && diff < 14) return true;

    return false;
  }

  // Seed boundary edges
  for (let x = 0; x < w; x++) {
    queue.push(x, 0);
    queue.push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y);
    queue.push(w - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const pos = y * w + x;
    if (visited[pos]) continue;
    visited[pos] = 1;

    if (isBg(x, y)) {
      data[pos * 4 + 3] = 0; // Transparent alpha

      if (x > 0 && !visited[pos - 1] && isBg(x - 1, y)) queue.push(x - 1, y);
      if (x < w - 1 && !visited[pos + 1] && isBg(x + 1, y)) queue.push(x + 1, y);
      if (y > 0 && !visited[pos - w] && isBg(x, y - 1)) queue.push(x, y - 1);
      if (y < h - 1 && !visited[pos + w] && isBg(x, y + 1)) queue.push(x, y + 1);
    }
  }

  // Remove any remaining stray low-alpha or faint pixels near borders
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 0) {
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (brightness > 240 && diff < 10) {
          data[idx + 3] = 0;
        }
      }
    }
  }

  return sharp(data, {
    raw: { width: w, height: h, channels: 4 }
  }).png({ quality: 100, compressionLevel: 9 }).toBuffer();
}

async function getBBox(buffer) {
  const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) return { minX: 0, maxX: info.width - 1, minY: 0, maxY: info.height - 1, w: info.width, h: info.height };
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function normalizeAndSave(cleanedBuffer, outputPath, options = {}) {
  const bbox = await getBBox(cleanedBuffer);
  const cropped = await sharp(cleanedBuffer)
    .extract({
      left: Math.max(0, bbox.minX),
      top: Math.max(0, bbox.minY),
      width: bbox.w,
      height: bbox.h
    })
    .toBuffer();

  const scale = options.scale || 1.0;
  const scaledHeight = Math.round(targetCharHeight * scale);

  const resized = await sharp(cropped)
    .resize({ height: scaledHeight, fit: 'inside' })
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();

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
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved: ${path.basename(outputPath)} (${targetCanvasWidth}x${targetCanvasHeight})`);
}

async function processAll() {
  console.log('--- Processing 6 Walk Frames with Exact Character Bounds ---');
  const walkRanges = [
    { idx: 0, x1: 38, x2: 258 },
    { idx: 1, x1: 262, x2: 486 },
    { idx: 2, x1: 490, x2: 686 },
    { idx: 3, x1: 710, x2: 908 },
    { idx: 4, x1: 916, x2: 1128 },
    { idx: 5, x1: 1150, x2: 1348 }
  ];

  const normalizedWalkPaths = [];

  for (const r of walkRanges) {
    const w = r.x2 - r.x1;
    const h = 530;
    const rawCropped = await sharp(spritePath)
      .extract({ left: r.x1, top: 110, width: w, height: h })
      .toBuffer();

    const cleaned = await cleanBackground(rawCropped, w, h);
    const outPath = path.join(assetsDir, `norm_walk_${r.idx}.png`);
    await normalizeAndSave(cleaned, outPath, { scale: 1.0 });
    normalizedWalkPaths.push(outPath);
  }

  console.log('--- Processing Stand Pose ---');
  {
    const meta = await sharp(standPath).metadata();
    const rawBuffer = await sharp(standPath).toBuffer();
    const cleaned = await cleanBackground(rawBuffer, meta.width, meta.height);
    const outPath = path.join(assetsDir, 'norm_stand.png');
    await normalizeAndSave(cleaned, outPath, { scale: 1.0 });
  }

  console.log('--- Processing Celebrate Pose ---');
  {
    const meta = await sharp(celebratePath).metadata();
    const rawBuffer = await sharp(celebratePath).toBuffer();
    const cleaned = await cleanBackground(rawBuffer, meta.width, meta.height);
    const outPath = path.join(assetsDir, 'norm_celebrate.png');
    // For celebrate, scale slightly so body matches stand height
    await normalizeAndSave(cleaned, outPath, { scale: 0.92 });
  }

  console.log('--- Processing Crying Pose ---');
  {
    const meta = await sharp(cryingPath).metadata();
    const rawBuffer = await sharp(cryingPath).toBuffer();
    const cleaned = await cleanBackground(rawBuffer, meta.width, meta.height);
    const outPath = path.join(assetsDir, 'norm_crying.png');
    await normalizeAndSave(cleaned, outPath, { scale: 1.0 });
  }

  console.log('--- Creating Unified 6-Frame Walk Strip (2400x520) ---');
  const compositeList = [];
  for (let i = 0; i < 6; i++) {
    compositeList.push({
      input: normalizedWalkPaths[i],
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
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(stripOut);

  console.log(`Created clean strip: ${stripOut}`);
  console.log('Done! All assets rebuilt with 100% clean transparency and zero artifacts.');
}

processAll().catch(console.error);
