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

echo "🔍 1. Locating newest AquaBuddy release from GitHub..."

# Resolve latest release tag via GitHub redirect (bypasses API rate limits)
LATEST_TAG=$(curl -sIL https://github.com/RintuKT/AquaBuddy/releases/latest 2>/dev/null | grep -i "location:" | tail -n 1 | tr -d '\r' | awk -F'/' '{print $NF}')

if [ -z "$LATEST_TAG" ] || [ "$LATEST_TAG" = "latest" ]; then
  # Fallback to API if redirect was not present
  LATEST_TAG=$(curl -fsSL https://api.github.com/repos/RintuKT/AquaBuddy/releases/latest 2>/dev/null | grep '"tag_name":' | head -n 1 | cut -d '"' -f 4 || true)
fi

# Fallback to current repository version
if [ -z "$LATEST_TAG" ]; then
  LATEST_TAG="v1.0.9"
fi

VERSION_NUM="${LATEST_TAG#v}"
DOWNLOAD_URL="https://github.com/RintuKT/AquaBuddy/releases/download/${LATEST_TAG}/AquaBuddy-${VERSION_NUM}-universal-mac.zip"

echo "📦 2. Downloading AquaBuddy ${LATEST_TAG} Universal for macOS..."
echo "    URL: $DOWNLOAD_URL"

# Download with fallback to latest available release asset if the latest tag is still building
if ! curl -fSL "$DOWNLOAD_URL" -o "$ZIP_FILE" 2>/dev/null; then
  echo "⚠️  Primary asset not ready, finding latest available release asset..."
  FALLBACK_URL=$(curl -fsSL https://api.github.com/repos/RintuKT/AquaBuddy/releases 2>/dev/null | grep "browser_download_url.*universal.*\.zip" | head -n 1 | cut -d '"' -f 4 || true)
  if [ -n "$FALLBACK_URL" ]; then
    echo "    Downloading: $FALLBACK_URL"
    curl -fSL "$FALLBACK_URL" -o "$ZIP_FILE"
  else
    echo "❌ Failed to download AquaBuddy release. Please check your internet connection."
    rm -rf "$TMP_DIR"
    exit 1
  fi
fi

echo "📂 3. Installing to $APP_DIR..."
# Ensure any running AquaBuddy instance is stopped to prevent file locks in /Applications
pkill -f "AquaBuddy" 2>/dev/null || true
killall AquaBuddy 2>/dev/null || true
sleep 1

if [ -d "$TARGET_APP" ]; then
  rm -rf "$TARGET_APP" 2>/dev/null || sudo rm -rf "$TARGET_APP" 2>/dev/null || true
fi

unzip -q "$ZIP_FILE" -d "$TMP_DIR"
cp -R "$TMP_DIR/AquaBuddy.app" "$TARGET_APP"

echo "🛡️  4. Removing Gatekeeper quarantine and setting permissions..."
xattr -cr "$TARGET_APP" 2>/dev/null || true
xattr -d com.apple.quarantine "$TARGET_APP" 2>/dev/null || true
chmod -R 755 "$TARGET_APP" 2>/dev/null || true

echo "🚀 5. Launching AquaBuddy..."
open "$TARGET_APP"

rm -rf "$TMP_DIR"

echo ""
echo "✨ =========================================="
echo "    🎉 AquaBuddy ${LATEST_TAG} successfully installed!  "
echo "    Look at your menu bar for the 💧 icon.    "
echo "=========================================="
echo ""
