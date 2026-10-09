const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const zipFile = path.join(distDir, 'aquabuddy-chrome-extension.zip');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('[AquaBuddy] Creating Chrome Extension ZIP package...');

try {
  // Zip manifest, background, content, popup, icons, and assets
  const cmd = `zip -r "${zipFile}" manifest.json background.js content popup icons assets -x "*.DS_Store"`;
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  console.log(`[AquaBuddy] Extension successfully packaged: ${zipFile}`);
} catch (e) {
  console.error('[AquaBuddy] Failed to package extension:', e.message);
}
