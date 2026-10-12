#!/usr/bin/env bash
# AquaBuddy - Automated 1-Click Installer for macOS (Universal: Intel & Apple Silicon)
# Removes Gatekeeper quarantine and installs directly to Applications

set -e

echo ""
echo "💧 =========================================="
echo "    AquaBuddy - Desktop Hydration Reminder   "
echo "    Universal macOS Installer (Intel & M-series)"
echo "=========================================="
echo ""

# Close any running instances before replacing
pkill -f "AquaBuddy" 2>/dev/null || true

# Determine install location
if [ -w "/Applications" ]; then
  APP_DIR="/Applications"
else
  APP_DIR="$HOME/Applications"
  mkdir -p "$APP_DIR"
fi

TARGET_APP="$APP_DIR/AquaBuddy.app"
TMP_DIR=$(mktemp -d)
ZIP_FILE="$TMP_DIR/AquaBuddy.zip"

DOWNLOAD_URL="https://github.com/RintuKT/AquaBuddy/releases/download/v1.0.3/AquaBuddy-1.0.3-universal-mac.zip"

echo "📦 1. Downloading AquaBuddy Universal for macOS..."
curl -fSL "$DOWNLOAD_URL" -o "$ZIP_FILE"

echo "📂 2. Installing to $APP_DIR..."
if [ -d "$TARGET_APP" ]; then
  rm -rf "$TARGET_APP"
fi

unzip -q "$ZIP_FILE" -d "$TMP_DIR"
cp -R "$TMP_DIR/AquaBuddy.app" "$TARGET_APP"

echo "🛡️  3. Removing Gatekeeper quarantine and setting permissions..."
xattr -cr "$TARGET_APP" 2>/dev/null || true
xattr -d com.apple.quarantine "$TARGET_APP" 2>/dev/null || true
chmod -R 755 "$TARGET_APP" 2>/dev/null || true

echo "🚀 4. Launching AquaBuddy..."
open "$TARGET_APP"

rm -rf "$TMP_DIR"

echo ""
echo "✨ =========================================="
echo "    🎉 AquaBuddy successfully installed!     "
echo "    Look at your menu bar for the 💧 icon.    "
echo "=========================================="
echo ""
