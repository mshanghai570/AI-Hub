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

### 3. Apple Human Interface Guidelines (HIG)
- Native macOS `NavigationSplitView` with customizable sidebar width.
- Native toolbar with SF Symbols (`chevron.left`, `chevron.right`, `arrow.clockwise`, `doc.text`, `safari`).
- Native keyboard shortcuts (`⌘1`–`⌘5`, `⌘K`, `⌘N`, `⌘D`, `⌘P`, `⌘R`, `⌘O`).

---

## Building & Running in Xcode

1. Open **Xcode** on your Mac (Version 15 or 16).
2. Choose **File > New > Project...**
3. Select **macOS > App**.
4. Set:
   - Product Name: `AI Hub`
   - Interface: `SwiftUI`
   - Language: `Swift`
5. Replace the generated files with:
   - `AIHubApp.swift`
   - `AIHubViewModel.swift`
   - `WebViewContainer.swift`
   - `ContentView.swift`
6. In **Signing & Capabilities**:
   - Check **Outgoing Connections (Client)** under App Sandbox so WebKit can reach `chatgpt.com`, `claude.ai`, `gemini.google.com`, etc.
7. Press **⌘R** to build and run!
