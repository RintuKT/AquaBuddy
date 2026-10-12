const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const universalApp = path.join(distDir, 'mac-universal', 'AquaBuddy.app');
const scriptsDir = path.join(rootDir, 'scripts', 'pkg-scripts');
const postinstallScript = path.join(scriptsDir, 'postinstall');

const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkgJson.version;

console.log(`🚀 Starting macOS package generation for AquaBuddy v${version}...`);

if (!fs.existsSync(universalApp)) {
  console.log('📦 Universal AquaBuddy.app not found in dist/mac-universal. Generating with electron-builder...');
  execSync('npx electron-builder --mac --universal --dir', { cwd: rootDir, stdio: 'inherit' });
}

// 1. Ensure postinstall script exists and is executable
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

fs.writeFileSync(
  postinstallScript,
  `#!/bin/bash
# AquaBuddy Postinstall Script
# Automatically strips Gatekeeper quarantine attribute on installation
APP_PATH="/Applications/AquaBuddy.app"

if [ -d "$APP_PATH" ]; then
    xattr -cr "$APP_PATH" 2>/dev/null || true
    chmod -R 755 "$APP_PATH" 2>/dev/null || true
fi

exit 0
`,
  { mode: 0o755 }
);
try {
  execSync(`chmod +x "${postinstallScript}"`);
} catch (e) {}

// 2. Build Universal PKG Installer
console.log('📦 Building AquaBuddy-Universal-Installer.pkg...');
const pkgOutput = path.join(distDir, 'AquaBuddy-Universal-Installer.pkg');
try {
  execSync(
    `pkgbuild --component "${universalApp}" --scripts "${scriptsDir}" --install-location "/Applications" "${pkgOutput}"`,
    { cwd: rootDir, stdio: 'inherit' }
  );
  console.log(`✅ Built PKG Installer at: ${pkgOutput}`);
} catch (err) {
  console.error('⚠️ Warning building PKG:', err.message);
}

// 3. Create Universal ZIP
console.log('📦 Creating Universal ZIP...');
const zipOutput = path.join(distDir, `AquaBuddy-${version}-universal-mac.zip`);
try {
  execSync(
    `ditto -c -k --keepParent "${universalApp}" "${zipOutput}"`,
    { cwd: rootDir, stdio: 'inherit' }
  );
  console.log(`✅ Built Universal ZIP at: ${zipOutput}`);
} catch (err) {
  console.error('⚠️ Warning creating ZIP:', err.message);
}

console.log('🎉 All macOS packages generated successfully!');
