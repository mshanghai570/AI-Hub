//
//  Theme.swift
//  AI Hub — iOS
//
//  One place for every colour the app draws, so contrast can be audited by
//  reading this file instead of hunting through views for `.white.opacity(...)`.
//  The app is dark-only (see `UIUserInterfaceStyle` in Info.plist), so the text
//  tiers below are quoted against the two surfaces they actually sit on:
//
//    textPrimary   on surface #141416 → 18.9:1
//    textSecondary on surfaceRaised   →  8.4:1
//    textTertiary  on surface          →  5.5:1
//
//  All three clear the 4.5:1 minimum for body text, which the previous raw
//  values did not: the nav bar's domain label used 45% white at 10pt and
//  measured about 4.4:1.
//

import SwiftUI

extension Color {
    /// Parses "#RRGGBB" (or "RRGGBB"). Unparseable input falls back to white
    /// rather than black so a bad hex never silently hides a provider.
    init(hex: String) {
        let cleaned = hex
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")
            .uppercased()

        var value: UInt64 = 0
        guard cleaned.count == 6, Scanner(string: cleaned).scanHexInt64(&value) else {
            self = .white
            return
        }

        self.init(
            .sRGB,
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255,
            opacity: 1
        )
    }
}

enum Theme {
    // MARK: Surfaces

    static let background = Color(hex: "#0B0B0D")
    static let surface = Color(hex: "#141416")
    static let surfaceRaised = Color(hex: "#1C1C1F")

    /// Hairline used for every divider and border in the app, so separators
    /// never differ subtly between screens.
    static let hairline = Color.white.opacity(0.09)

    // MARK: Text

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.68)
    static let textTertiary = Color.white.opacity(0.55)

    /// For glyphs that are intentionally quiet but still need to read as tappable.
    static let textInteractive = Color.white.opacity(0.85)

    /// Disabled controls are exempt from contrast minimums, but they still need
    /// to be visible enough to be recognisable as disabled controls.
    static let textDisabled = Color.white.opacity(0.28)

    // MARK: Semantics

    /// The hub's own green. Mirrors `AccentColor` in Assets.xcassets, so views
    /// can tint explicitly without depending on the ambient accent colour.
    static let accent = Color(hex: "#10A37F")

    /// Session-related actions that are reversible but still deserve a warning
    /// colour, distinct from the red used for deleting a provider outright.
    static let warning = Color(hex: "#FF9F0A")

    static let danger = Color(hex: "#FF453A")
}

// MARK: - Interaction feedback

/// Press feedback for the app's custom controls.
///
/// SwiftUI's `.plain` button style draws nothing at all while pressed, which on
/// a dark surface reads as a dropped tap — the user presses a provider chip and
/// nothing visibly happens until the pane swaps. This style adds the small
/// scale-and-dim that iOS uses for its own controls, and drops the movement
/// (keeping the dim) when Reduce Motion is on.
struct PressableButtonStyle: ButtonStyle {
    var scale: CGFloat = 0.96
    var pressedOpacity: Double = 0.72

    func makeBody(configuration: ButtonStyleConfiguration) -> some View {
        PressableLabel(
            configuration: configuration,
            scale: scale,
            pressedOpacity: pressedOpacity
        )
    }

    private struct PressableLabel: View {
        let configuration: ButtonStyleConfiguration
        let scale: CGFloat
        let pressedOpacity: Double

        @Environment(\.accessibilityReduceMotion) private var reduceMotion

        var body: some View {
            configuration.label
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : scale)
                .opacity(configuration.isPressed ? pressedOpacity : 1)
                .animation(.spring(response: 0.24, dampingFraction: 0.72), value: configuration.isPressed)
        }
    }
}

/// A circular icon button at the 44pt minimum touch target, with a proper
/// accessibility label. Icon-only controls are the easiest thing in an app to
/// ship unlabelled, so they all go through here.
struct IconButton: View {
    let system: String
    let label: String
    var size: CGFloat = 17
    var tint: Color = Theme.textInteractive
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.system(size: size, weight: .medium))
                .foregroundStyle(isEnabled ? tint : Theme.textDisabled)
                // 44pt target, drawn around a much smaller glyph.
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(PressableButtonStyle(scale: 0.9))
        .disabled(!isEnabled)
        .accessibilityLabel(label)
    }
}

// MARK: - App mark

/// The app mark: one hub ringed by providers, each in its own colour.
///
/// This is an abstraction of the icon artwork in `ios/Artwork/app-icon-source.png`,
/// not a copy of it — the artwork carries eight provider glyphs and a wordmark
/// that turn to mud below ~100pt, so in-app the mark keeps only the composition:
/// a lit hub on spokes with satellites on an orbit.
struct HubMark: View {
    var size: CGFloat = 96

    private static let satellites: [(degrees: Double, hex: String)] = [
        (45, "#3B82F6"),
        (135, "#E5E7EB"),
        (225, "#DA7756"),
        (315, "#22C55E"),
    ]

    var body: some View {
        Canvas { context, canvasSize in
            let side = min(canvasSize.width, canvasSize.height)
            guard side > 0 else { return }

            // Proportions are quoted against the 1024pt icon canvas.
            let unit = side / 1024
            let centre = CGPoint(x: canvasSize.width / 2, y: canvasSize.height / 2)
            let hubRadius = 140 * unit
            let orbitDistance = 330 * unit
            let orbitRadius = 70 * unit

            // The orbit ring the artwork draws behind the satellites.
            context.stroke(
                Path(ellipseIn: CGRect(x: centre.x - (orbitDistance + orbitRadius),
                                       y: centre.y - (orbitDistance + orbitRadius),
                                       width: (orbitDistance + orbitRadius) * 2,
                                       height: (orbitDistance + orbitRadius) * 2)),
                with: .color(Theme.accent.opacity(0.14)),
                lineWidth: 6 * unit
            )

            for satellite in Self.satellites {
                let radians = satellite.degrees * .pi / 180
                let dx = cos(radians)
                let dy = sin(radians)

                var spoke = Path()
                spoke.move(to: CGPoint(x: centre.x + dx * hubRadius,
                                       y: centre.y + dy * hubRadius))
                spoke.addLine(to: CGPoint(x: centre.x + dx * (orbitDistance - orbitRadius),
                                          y: centre.y + dy * (orbitDistance - orbitRadius)))
                context.stroke(
                    spoke,
                    with: .color(Theme.accent.opacity(0.55)),
                    style: StrokeStyle(lineWidth: 18 * unit, lineCap: .round)
                )
            }

            for satellite in Self.satellites {
                let radians = satellite.degrees * .pi / 180
                let origin = CGPoint(x: centre.x + cos(radians) * orbitDistance,
                                     y: centre.y + sin(radians) * orbitDistance)
                context.fill(
                    Path(ellipseIn: CGRect(x: origin.x - orbitRadius,
                                           y: origin.y - orbitRadius,
                                           width: orbitRadius * 2,
                                           height: orbitRadius * 2)),
                    with: .color(Color(hex: satellite.hex))
                )
            }

            // Lit hub, echoing the pale sphere at the centre of the artwork.
            context.fill(
                Path(ellipseIn: CGRect(x: centre.x - hubRadius,
                                       y: centre.y - hubRadius,
                                       width: hubRadius * 2,
                                       height: hubRadius * 2)),
                with: .radialGradient(
                    Gradient(colors: [Color(hex: "#EDEFEA"), Color(hex: "#B9C4B9")]),
                    center: CGPoint(x: centre.x - hubRadius * 0.28, y: centre.y - hubRadius * 0.3),
                    startRadius: 0,
                    endRadius: hubRadius * 1.45
                )
            )

            // The wordmark is only worth drawing once the hub is big enough to
            // hold it — below that it reads as a smudge rather than a name.
            if hubRadius > 34 {
                context.draw(
                    Text("AIHub")
                        .font(.system(size: hubRadius * 0.5, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color(hex: "#2C3A34")),
                    at: CGPoint(x: centre.x, y: centre.y),
                    anchor: .center
                )
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}
