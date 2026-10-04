Native macOS app that puts several AI chat providers behind one launcher, each
in its own isolated WebKit session.

**This build is unsigned.** macOS will block it on first launch. After dragging
AI Hub to Applications, either right-click the app and choose **Open**, or run:

```
xattr -dr com.apple.quarantine /Applications/AIHub.app
```

Requires macOS 14 or later — `WKWebsiteDataStore(forIdentifier:)`, which keeps
each provider's login separate, is a macOS 14+ API.

Universal binary: runs natively on both Intel and Apple Silicon.

## Verifying the download

```
shasum -a 256 -c AIHub.dmg.sha256
```