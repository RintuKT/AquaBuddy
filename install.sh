#!/usr/bin/env bash
# AquaBuddy - Automated 1-Click Installer for macOS
# Unblocks Gatekeeper quarantine and installs directly to /Applications

set -e

echo ""
echo "💧 ========================================="
echo "    AquaBuddy - Desktop Hydration Reminder   "
echo "========================================="
echo ""

APP_DIR="/Applications"
TARGET_APP="$APP_DIR/AquaBuddy.app"
TMP_DIR=$(mktemp -d)
ZIP_FILE="$TMP_DIR/AquaBuddy.zip"

DOWNLOAD_URL="https://github.com/RintuKT/AquaBuddy/releases/download/v1.0.0/AquaBuddy-1.0.0-arm64-mac.zip"

echo "📦 1. Downloading AquaBuddy for macOS..."
curl -fsSL "$DOWNLOAD_URL" -o "$ZIP_FILE"

echo "📂 2. Installing to /Applications..."
if [ -d "$TARGET_APP" ]; then
  rm -rf "$TARGET_APP"
fi

unzip -q "$ZIP_FILE" -d "$TMP_DIR"
cp -R "$TMP_DIR/AquaBuddy.app" "$TARGET_APP"

echo "🛡️  3. Removing Gatekeeper quarantine attributes..."
xattr -cr "$TARGET_APP"

echo "🚀 4. Launching AquaBuddy..."
open "$TARGET_APP"

rm -rf "$TMP_DIR"

echo ""
echo "✨ ========================================="
echo "    🎉 AquaBuddy successfully installed!    "
echo "    Look at your menu bar for the 💧 icon.   "
echo "========================================="
echo ""
