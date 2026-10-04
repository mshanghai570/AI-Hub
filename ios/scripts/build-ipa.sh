#!/usr/bin/env bash
#
# Builds an unsigned .ipa for sideloading (Sideloadly, AltStore, TrollStore).
#
# The output is intentionally NOT signed. Sideloading tools strip and replace
# the signature with the user's own Apple ID (or a TrollStore fakesign) anyway,
# so producing an unsigned device build is both simpler and more portable than
# shipping a development-signed one.
#
# Usage: ios/scripts/build-ipa.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$IOS_DIR/.." && pwd)"

PROJECT="$IOS_DIR/AIHub.xcodeproj"
SCHEME="AIHub"
CONFIG="Release"
DERIVED_DATA="$ROOT_DIR/build/ios-device"
STAGING="$ROOT_DIR/build/ipa-staging"
OUTPUT="$ROOT_DIR/build/AIHub.ipa"
BUNDLE_ID="com.aihub.app"
# Must match ASSETCATALOG_COMPILER_APPICON_NAME in ios/project.yml.
APPICON_NAME="AppIcon"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "error: xcodegen not found. Install it with: brew install xcodegen" >&2
  exit 1
fi

echo "==> Generating Xcode project from ios/project.yml"
xcodegen generate --spec "$IOS_DIR/project.yml" --project "$IOS_DIR"

# Rebuild the icon from the master art so the shipped icon can never drift from
# ios/Artwork/app-icon-source.png. Output is committed too, so a machine without
# a Swift toolchain still builds.
ICON_SOURCE="$IOS_DIR/Artwork/app-icon-source.png"
ICON_APPICONSET="$IOS_DIR/AIHub/Assets.xcassets/AppIcon.appiconset"
if [[ -f "$ICON_SOURCE" ]]; then
  echo "==> Rendering the app icon from Artwork/app-icon-source.png"
  ICON_TOOL_DIR="$(mktemp -d)"
  # Compiled rather than run with `swift file.swift`: the interpreter discards
  # file writes in some sandboxed environments, which fails silently.
  swiftc -O "$SCRIPT_DIR/make-app-icon.swift" -o "$ICON_TOOL_DIR/make-app-icon"
  "$ICON_TOOL_DIR/make-app-icon" "$ICON_SOURCE" "$ICON_APPICONSET"
  rm -rf "$ICON_TOOL_DIR"
else
  echo "warning: $ICON_SOURCE is missing; using the committed icon" >&2
fi

echo "==> Building $SCHEME ($CONFIG) for device, unsigned"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED_DATA" \
  ONLY_ACTIVE_ARCH=NO \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGN_ENTITLEMENTS="" \
  build

APP="$DERIVED_DATA/Build/Products/$CONFIG-iphoneos/$SCHEME.app"
if [[ ! -d "$APP" ]]; then
  echo "error: expected app bundle not found at $APP" >&2
  exit 1
fi

echo "==> Verifying the bundle is built for device (not simulator)"
# Read the load commands once into a variable. Piping otool into `grep -q`
# looks equivalent but is not: grep exits on the first match, otool then dies of
# SIGPIPE, and `set -o pipefail` reports the whole pipeline as failed — so the
# check fired on exactly the bundles it was meant to pass.
LOAD_COMMANDS="$(otool -l "$APP/$SCHEME" 2>/dev/null || true)"
PLATFORM="$(printf '%s\n' "$LOAD_COMMANDS" | grep -A4 LC_BUILD_VERSION | grep -o 'platform [0-9]*' | head -1 || true)"
if [[ -z "$LOAD_COMMANDS" ]]; then
  echo "warning: could not read the Mach-O load commands from $APP/$SCHEME" >&2
elif [[ "$PLATFORM" != "platform 2" ]]; then
  echo "warning: Mach-O platform is '${PLATFORM:-unknown}', expected 'platform 2' (PLATFORM_IOS)" >&2
fi

echo "==> Verifying the icon made it into the bundle"
if [[ "$(/usr/libexec/PlistBuddy -c "Print :CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconName" \
        "$APP/Info.plist" 2>/dev/null)" != "$APPICON_NAME" ]]; then
  echo "error: the app bundle does not declare $APPICON_NAME as its primary icon" >&2
  exit 1
fi
if ! ls "$APP"/"$APPICON_NAME"*.png >/dev/null 2>&1; then
  echo "error: no $APPICON_NAME*.png files were emitted into the bundle" >&2
  exit 1
fi

# An app icon with an alpha channel is rejected by App Store validation and
# darkens soft edges at render time, so fail loudly rather than ship one.
for icon in "$APP"/*.png; do
  [[ -e "$icon" ]] || continue
  if [[ "$(sips -g hasAlpha "$icon" 2>/dev/null | tail -1)" == *"yes"* ]]; then
    echo "error: $icon has an alpha channel" >&2
    exit 1
  fi
done

echo "==> Packaging Payload/$SCHEME.app into AIHub.ipa"
rm -rf "$STAGING"
mkdir -p "$STAGING/Payload"
cp -R "$APP" "$STAGING/Payload/"
rm -f "$OUTPUT"
# zip must store the Payload directory at the archive root; -y preserves the
# symlinks inside the .app bundle.
( cd "$STAGING" && zip -qry "$OUTPUT" Payload )
rm -rf "$STAGING"

SIZE="$(du -h "$OUTPUT" | cut -f1)"
echo
echo "==> Done"
echo "    IPA:       $OUTPUT"
echo "    Size:      $SIZE"
echo "    Bundle id: $BUNDLE_ID"
echo
echo "Install it with a sideloading tool of your choice, for example:"
echo "    ios-deploy --bundle \"$APP\"        # already-signed setups only"
echo "    Sideloadly / AltStore: drag $OUTPUT in and sign with your Apple ID"
