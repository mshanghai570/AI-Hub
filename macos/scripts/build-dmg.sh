#!/usr/bin/env bash
#
# Build AI Hub for macOS and package it as a .dmg.
#
# Usage:
#   ./macos/scripts/build-dmg.sh              # build and package
#   ./macos/scripts/build-dmg.sh --no-build   # repackage the existing .app only
#   ./macos/scripts/build-dmg.sh --launch     # also launch the app to smoke-test
#
# This mirrors what .github/workflows/build-macos-dmg.yml does on a CI runner, so
# a green local run is a real preview of the CI result.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MACOS_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$MACOS_DIR")"
PROJECT="$MACOS_DIR/AIHub.xcodeproj"
APP_NAME="AIHub"
DMG_NAME="AIHub"
DERIVED="$ROOT_DIR/build/macos-derived"
STAGE="$ROOT_DIR/build/dmg-stage"
OUTPUT_DIR="$ROOT_DIR/build"
DO_BUILD=1
DO_LAUNCH=0

for arg in "$@"; do
  case "$arg" in
    --no-build) DO_BUILD=0 ;;
    --launch)   DO_LAUNCH=1 ;;
    -h|--help)  sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

command -v xcodegen >/dev/null 2>&1 || die \
  "xcodegen not found. Install it with: brew install xcodegen"

# The project file is generated from project.yml and gitignored, so it is
# regenerated on every run rather than trusted to be current.
if [[ "$DO_BUILD" -eq 1 ]]; then
  log "Generating Xcode project from project.yml"
  ( cd "$MACOS_DIR" && xcodegen generate --spec project.yml --project . >/dev/null )

  log "Building Release configuration (universal x86_64 + arm64)"
  # ARCHS is pinned explicitly: the default follows the build machine, which
  # would silently produce an Intel-only DMG when run on this Mac.
  xcodebuild \
    -project "$PROJECT" \
    -scheme "$APP_NAME" \
    -configuration Release \
    -derivedDataPath "$DERIVED" \
    ARCHS="x86_64 arm64" \
    ONLY_ACTIVE_ARCH=NO \
    build
fi

APP="$DERIVED/Build/Products/Release/$APP_NAME.app"
[[ -d "$APP" ]] || die "No .app at $APP — run without --no-build."

# A missing app icon is easy to miss and only shows up as a blank grid icon
# after the user has already mounted the DMG.
[[ -f "$APP/Contents/Resources/Assets.car" ]] || die "App bundle has no Assets.car — the asset catalog did not compile."

log "Laying out DMG contents"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$APP" "$STAGE/"
# The Applications symlink is what makes drag-to-install work; hdiutil cannot
# create it for us.
ln -s /Applications "$STAGE/Applications"

DMG_PATH="$OUTPUT_DIR/$DMG_NAME.dmg"
rm -f "$DMG_PATH"

log "Creating $DMG_NAME.dmg"
# -srcfolder copies the tree, so the staged symlink and app are preserved
# without needing a separate -format step.
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGE" \
  -ov \
  -format UDZO \
  "$DMG_PATH" >/dev/null

# Unsigned apps carry a quarantine flag once downloaded, and double-clicking
# one hits Gatekeeper. A verified checksum is worth more than silence here.
shasum -a 256 "$DMG_PATH" > "$DMG_PATH.sha256"

log "Done"
ls -lh "$DMG_PATH"
echo
echo "Install: open $DMG_PATH, drag AI Hub onto Applications."
echo "Unsigned, so macOS will block the first launch. Either right-click the"
echo "app and choose Open, or run:"
echo "    xattr -dr com.apple.quarantine /Applications/$APP_NAME.app"

if [[ "$DO_LAUNCH" -eq 1 ]]; then
  log "Smoke-testing launch"
  # Clear quarantine so the launch test exercises the real UI rather than
  # bouncing off Gatekeeper.
  xattr -cr "$APP" 2>/dev/null || true
  open "$APP"
  sleep 6
  if pgrep -fl "$APP_NAME.app" >/dev/null; then
    echo "Launched successfully."
    pkill -f "$APP_NAME.app" || true
  else
    die "App did not stay running — check the crash log in ~/Library/Logs/DiagnosticReports"
  fi
fi