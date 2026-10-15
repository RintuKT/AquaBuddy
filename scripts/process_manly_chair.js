const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputJpg = '/Users/rintukt/.gemini/antigravity-ide/brain/2973dc1d-b1eb-4dea-b75e-5dfa7d0a0a2b/leo_carry_chair_manly_1792068255670.jpg';
const outputPng = path.join(__dirname, '..', 'assets', 'pixar_carry_chair.png');
const outputWebp = path.join(__dirname, '..', 'assets', 'pixar_carry_chair.webp');

async function processManlyChair() {
  const image = sharp(inputJpg);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // Flood fill / BFS from edges to only remove white background connected to edges/open spaces
  // This prevents accidentally removing light pixels inside the character or chair
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qHead = 0;
  let qTail = 0;

  function isBackgroundCandidate(idx) {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    const brightness = (r + g + b) / 3;
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return brightness >= 235 && diff < 20;
  }

  // Seed boundary pixels
  for (let x = 0; x < width; x++) {
    // top row
    const topIdx = x;
    if (isBackgroundCandidate(topIdx)) {
      visited[topIdx] = 1;
      queue[qTail++] = x;
      queue[qTail++] = 0;
    }
    // bottom row
    const bottomIdx = (height - 1) * width + x;
    if (isBackgroundCandidate(bottomIdx)) {
      visited[bottomIdx] = 1;
      queue[qTail++] = x;
      queue[qTail++] = height - 1;
    }
  }

  for (let y = 0; y < height; y++) {
    // left column
    const leftIdx = y * width;
    if (!visited[leftIdx] && isBackgroundCandidate(leftIdx)) {
      visited[leftIdx] = 1;
      queue[qTail++] = 0;
      queue[qTail++] = y;
    }
    // right column
    const rightIdx = y * width + (width - 1);
    if (!visited[rightIdx] && isBackgroundCandidate(rightIdx)) {
      visited[rightIdx] = 1;
      queue[qTail++] = width - 1;
      queue[qTail++] = y;
    }
  }

  // Also seed chair leg openings or open spaces between limbs if white
  // Let's run BFS
  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && isBackgroundCandidate(nIdx)) {
          visited[nIdx] = 1;
          queue[qTail++] = nx;
          queue[qTail++] = ny;
        }
      }
    }
  }

  // Also check interior holes (e.g., between chair legs and wheels)
  // If a pixel is pure white (>=250) and diff < 10, mark it
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) {
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        const brightness = (r + g + b) / 3;
        if (brightness >= 252) {
          data[idx * 4 + 3] = 0;
        } else if (brightness >= 235) {
          const factor = (255 - brightness) / 20;
          data[idx * 4 + 3] = Math.round(255 * factor * factor);
        }
      } else {
        // Unvisited pure white pockets (e.g. between chair wheel spokes)
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        const brightness = (r + g + b) / 3;
        const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (brightness >= 252 && diff < 8) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
  }

  const trimmedSharp = sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  }).trim();

  // Save PNG
  await trimmedSharp
    .clone()
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPng);

  console.log(`Saved clean transparent PNG: ${outputPng}`);

  // Save WebP (high quality, low size)
  await trimmedSharp
    .clone()
    .webp({ quality: 92, effort: 6 })
    .toFile(outputWebp);

  console.log(`Saved optimized WebP: ${outputWebp}`);
}

processManlyChair().catch(err => {
  console.error(err);
  process.exit(1);
});
