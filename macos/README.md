# AI Hub - Native macOS Application
**Built with Apple Swift 6, SwiftUI, and WebKit**

## Overview
AI Hub for macOS is a native Mac desktop application that provides a unified launcher and container for consumer AI web chats (**ChatGPT**, **Claude**, **Google Gemini**, **Perplexity**, **Grok**, and custom services).

Unlike standard browsers or cross-origin iframes, the native macOS application leverages Apple's `WKWebsiteDataStore(forIdentifier:)` API to achieve **true origin and cookie isolation** per provider.

---

## Key Native Apple Architecture

### 1. Isolated `WKWebsiteDataStore` Partitioning
In `WebViewContainer.swift`:
```swift
// Each service gets its own sandboxed data store identified by a unique UUID
config.websiteDataStore = WKWebsiteDataStore(forIdentifier: service.storeUUID)
```
- **ChatGPT** sessions and cookies are permanently stored in their own partition.
- **Claude** sessions and cookies are completely isolated.
- **Google Gemini** sessions never mix with other Google cookies.
- No cookies, credentials, or localStorage are shared across providers.
- Logins persist across restarts in macOS `~/Library/Application Support`.

### 2. Multi-Service In-Memory State
In `ContentView.swift`:
- Services are retained in memory within a `ZStack` so switching between ChatGPT and Claude is instantaneous and never loses ongoing chat drafts or stream states.

### 3. Lazy WebView Mounting
Services get a `WKWebView` the first time you visit them and stay mounted
afterwards, so switching back is instant and in-page state survives. Creating
one per service up front would load every provider's site at launch.

### 4. Apple Human Interface Guidelines (HIG)
- Native macOS `NavigationSplitView` with customizable sidebar width.
- Native toolbar with SF Symbols (`chevron.left`, `chevron.right`, `arrow.clockwise`, `doc.text`, `safari`).
- Native keyboard shortcuts (`⌘1`–`⌘5`, `⌘K`, `⌘N`, `⌘D`, `⌘P`, `⌘R`, `⌘O`).

---

## Building & Running

The Xcode project is generated from `project.yml` by
[XcodeGen](https://github.com/yonaskolb/XcodeGen), so the project file itself is
gitignored and never hand-edited. Install the generator once:

```sh
brew install xcodegen
```

### Run in Xcode

```sh
xcodegen generate --spec macos/project.yml --project macos
open macos/AIHub.xcodeproj
```

Then press **⌘R**. Change `project.yml` rather than the project file — your
edits would be lost the next time the project is regenerated.

### Build a .dmg

```sh
./macos/scripts/build-dmg.sh            # build and package
./macos/scripts/build-dmg.sh --launch   # also smoke-test that it launches
./macos/scripts/build-dmg.sh --no-build # repackage the existing .app
```

This produces `build/AIHub.dmg` (plus a `.sha256` checksum) as a universal
binary covering both Intel and Apple Silicon. It is the same pipeline
`.github/workflows/build-macos-dmg.yml` runs, so a green local run predicts a
green CI run, and vice versa.

### Unsigned builds

`project.yml` signs ad-hoc (`CODE_SIGN_IDENTITY: "-"`), so there is no
certificate to configure. macOS will still block the first launch of a
downloaded DMG. Either right-click the app and choose **Open**, or:

```sh
xattr -dr com.apple.quarantine /Applications/AIHub.app
```

To distribute it properly, set `CODE_SIGN_IDENTITY` to a **Developer ID**
identity and `DEVELOPMENT_TEAM` to your team, then enable
`ENABLE_HARDENED_RUNTIME` and notarize before release.
