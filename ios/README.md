# AI Hub — iOS

Native iOS app that puts several AI chat providers behind one launcher, each in
its own isolated WebKit session.

This is separate from `macos/`, which holds the original macOS-only SwiftUI
files (they use `NSWorkspace`, `NavigationSplitView` and a `Settings` scene, so
they cannot compile for iOS). Nothing in `macos/` was modified.

## Why sessions don't bleed between providers

Every provider gets its own persistent `WKWebsiteDataStore`:

```swift
configuration.websiteDataStore = WKWebsiteDataStore(forIdentifier: service.storeUUID)
```

`storeUUID` is derived from the provider id via FNV-1a (`Models.swift`), not
`String.hashValue` — Swift seeds string hashing per process, so using it would
silently rotate a custom provider's partition on every launch and log the user
out. `WKWebsiteDataStore(forIdentifier:)` is iOS 17+, which is why the
deployment target is 17.0.

## Project layout

| Path | Purpose |
| --- | --- |
| `project.yml` | Source of truth for the Xcode project (XcodeGen) |
| `AIHub/` | App sources |
| `AIHub/Models.swift` | Provider model, store-UUID derivation, catalogue |
| `AIHub/WebEngine.swift` | One isolated `WKWebView` per provider |
| `AIHub/AppModel.swift` | Services, persistence, engine registry |
| `AIHub/ContentView.swift` | Navigation bar, panes, provider dock |
| `AIHub/ServicePane.swift` | SwiftUI bridge + loading/error overlays |
| `AIHub/Theme.swift` | Colour tokens, press feedback, the in-app hub mark |
| `AIHub/SettingsView.swift` | Provider list, reordering, session management |
| `AIHub/WelcomeView.swift` | First-run explanation of session isolation |
| `Artwork/app-icon-source.png` | Master icon artwork (1254×1254) |
| `scripts/make-app-icon.swift` | Turns the master artwork into the app icon |
| `scripts/build-ipa.sh` | Builds the unsigned sideloading IPA |
| `scripts/run-simulator.sh` | Builds, installs and launches on a simulator |

## The app icon

`Artwork/app-icon-source.png` is the master artwork. iOS needs a 1024×1024 PNG
with **no alpha channel**, so `scripts/make-app-icon.swift` does two things
during every IPA build rather than just resizing:

1. **Trims to the opaque bounds.** The master is a rounded square on a
transparent field. iOS applies its own corner mask, so shipping the baked-in
rounding would double-round it. The trim is measured from the alpha channel, not
hard-coded.
2. **Flattens.** App icons must be opaque — App Store validation rejects them
otherwise, and iOS composites any soft edges against black. The trim re-exposes
transparent corners, so the art is drawn over the colour sampled from just
inside its own top edge before being written.

```bash
# Standalone, if you ever need to rebuild the icon without a full build:
swiftc -O ios/scripts/make-app-icon.swift -o /tmp/make-app-icon
/tmp/make-app-icon ios/Artwork/app-icon-source.png \
                    ios/AIHub/Assets.xcassets/AppIcon.appiconset
```

Use `swiftc` and run the binary — do **not** run it with `swift file.swift`.
The interpreter discards file writes in some sandboxed environments and exits 0,
which looks exactly like success while writing nothing.

The generated PNG is committed, so a machine without a Swift toolchain can still
build the app. `build-ipa.sh` fails the build if an icon with an alpha channel
ever reaches the bundle.

`AIHub.xcodeproj` is **generated** and gitignored. Never hand-edit it — change
`project.yml` and regenerate:

```bash
brew install xcodegen          # one-time
xcodegen generate --spec ios/project.yml --project ios
```

## Build for a simulator (fastest loop)

```bash
ios/scripts/run-simulator.sh "iPhone 17 Pro"
```

## Build the unsigned IPA for sideloading

```bash
ios/scripts/build-ipa.sh
# -> build/AIHub.ipa   (arm64, PLATFORM_IOS, unsigned, minos 17.0)
```

The output is deliberately unsigned, because sideloading tools replace the
signature with your own Apple ID (or a TrollStore fakesign) anyway. Hand the
`.ipa` to Sideloadly or AltStore and sign it with your Apple ID.

To check a build really is a device build and not a simulator build:

```bash
otool -l Payload/AIHub.app/AIHub | grep -A6 LC_BUILD_VERSION | grep platform
# platform 2 == PLATFORM_IOS (device); platform 7 means simulator
```

## Running from Xcode instead

Open `ios/AIHub.xcodeproj`, pick your team under *Signing & Capabilities*, and
run — the project ships with automatic signing and no entitlements file, since
the app needs no special capabilities (outbound networking is unrestricted on
iOS, unlike the macOS App Sandbox).

## UI conventions

Everything visual goes through `AIHub/Theme.swift`, so contrast and touch
targets can be checked in one file instead of by reading views:

- **Colours are tokens, not literals.** No view writes `.white.opacity(...)` or
  `.orange`. The three text tiers (`textPrimary`, `textSecondary`,
  `textTertiary`) are all ≥ 4.5:1 against the surfaces they are used on, which
  is noted next to them in the source.
- **Text sizes use Dynamic Type styles** (`.subheadline`, `.caption`, …), not
  `.system(size:)`. The only fixed sizes left are SF Symbol glyph sizes, which
  should scale in their own increments rather than with body text.
- **Every touch target is at least 44pt.** Controls whose drawn shape is smaller
  — provider chips, colour swatches, the add button — pad out to 44pt around
  that shape.
- **Every icon-only control is labelled.** They route through `IconButton`, or
  carry an explicit `.accessibilityLabel`, because an unlabelled `Image` is read
  by VoiceOver as just "button".
- **Selection is announced, not just coloured.** The active provider is exposed
  with the `.isSelected` trait in the dock and in both lists.
- **Motion respects Reduce Motion.** Press feedback and the provider-switch
  crossfade both drop their movement when it is on.

## Known gaps

- **No test target.** `project.yml` builds the app only, so the layout and
  session-isolation changes are verified by building and running, not by tests.
- **Never run.** The app compiles, links and installs, but it has not been
  launched even once, so every layout decision in it is reasoned-about rather
  than observed. On the machine this was written on, the simulator's userspace
  does not start: `simctl boot` is flaky and, when it does report `Booted`, the
  screen is black with a spinner because SpringBoard never comes up. Symptoms:

  - `xcrun simctl launch <device> <any bundle id>` hangs forever — including
    `com.apple.Preferences`, so this is not our app.
  - `xcrun simctl io <device> screenshot` intermittently writes a 0-byte file.
  - Each `Devices/<UDID>/data` directory had been deleted, which `xcrun simctl
    erase <device>` does repair. That fix is real and worth keeping; it just is
    not sufficient on its own here.

  What to try before concluding the app is at fault: reboot the Mac (this
  clears the stale launchd session the simulator fails to bind), then
  `ios/scripts/run-simulator.sh`. `scripts/run-simulator.sh` prints the correct
  repair commands if a device's data directory is missing again.
- **Cloudflare.** Some providers may treat a `WKWebView` as a non-standard
  browser and show a challenge or an "unsupported browser" page. The app does
  not forge a user agent, since the default already identifies as mobile Safari.
