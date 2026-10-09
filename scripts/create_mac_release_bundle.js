const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appSource = path.join(distDir, 'mac-arm64', 'AquaBuddy.app');
const bundleDir = path.join(distDir, 'AquaBuddy-mac-package');

if (!fs.existsSync(appSource)) {
  console.error('AquaBuddy.app not found in dist/mac-arm64');
  process.exit(1);
}

if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true });
}
fs.mkdirSync(bundleDir, { recursive: true });

console.log('[AquaBuddy] Creating seamless macOS distribution bundle...');

// Copy AquaBuddy.app into bundle
execSync(`cp -R "${appSource}" "${bundleDir}/AquaBuddy.app"`, { stdio: 'inherit' });

// Ad-hoc sign the bundle
execSync(`codesign --force --deep --sign - "${bundleDir}/AquaBuddy.app"`, { stdio: 'inherit' });

// Create 1-click launcher "Open AquaBuddy.command"
const launcherPath = path.join(bundleDir, 'Open AquaBuddy.command');
const launcherScript = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "💧 Launching AquaBuddy..."
xattr -cr "$DIR/AquaBuddy.app" 2>/dev/null || true
open "$DIR/AquaBuddy.app"
echo "✅ AquaBuddy is running! Check your menu bar for the 💧 icon."
osascript -e 'tell application "Terminal" to close (every window whose name contains "Open AquaBuddy")' & exit
`;

fs.writeFileSync(launcherPath, launcherScript, { mode: 0o755 });

// Create Readme note inside the bundle
const readmePath = path.join(bundleDir, 'HOW_TO_OPEN.txt');
fs.writeFileSync(readmePath, `AquaBuddy for macOS
===================
1. Double-click "Open AquaBuddy.command" to open the app directly.
   OR
2. Drag "AquaBuddy.app" into your Applications folder.

If macOS ever says the app is damaged because it is not signed by Apple:
Double-click "Open AquaBuddy.command" to unblock it instantly.
`);

// Create zip package
const zipTarget = path.join(distDir, 'AquaBuddy-1.0.0-arm64-mac.zip');
if (fs.existsSync(zipTarget)) fs.unlinkSync(zipTarget);

execSync(`cd "${bundleDir}" && zip -r -X "${zipTarget}" "AquaBuddy.app" "Open AquaBuddy.command" "HOW_TO_OPEN.txt"`, { stdio: 'inherit' });

console.log(`[AquaBuddy] Created auto-unblocking release zip at ${zipTarget}`);
