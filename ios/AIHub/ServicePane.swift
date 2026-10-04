//
//  ServicePane.swift
//  AI Hub — iOS
//

import SwiftUI
import WebKit

/// Bridges an existing WKWebView into SwiftUI. The view is *not* created here:
/// the engine owns it, so SwiftUI re-rendering can never swap out the page the
/// provider is currently showing.
struct WebViewRepresentable: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView { webView }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct ServicePane: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    let service: AIServiceItem
    let isActive: Bool

    private var tint: Color { Color(hex: service.colorHex) }

    var body: some View {
        ZStack {
            Theme.background

            if let engine = model.engine(for: service.id) {
                WebViewRepresentable(webView: engine.webView)
                    .ignoresSafeArea(edges: .bottom)

                if engine.isLoading && engine.progress < 1 {
                    LoadingBar(progress: engine.progress, tint: tint)
                        .frame(maxHeight: .infinity, alignment: .top)
                        .allowsHitTesting(false)
                }

                if let error = engine.loadError, !engine.isLoading {
                    ErrorOverlay(
                        service: service,
                        message: error,
                        onRetry: { engine.reload() }
                    )
                }
            } else {
                ProgressView().tint(Theme.textTertiary)
            }
        }
        // Inactive panes stay in the hierarchy so their pages keep their state,
        // but are invisible and untouchable. The fade moves a provider swap from
        // a hard cut to a transition; Reduce Motion keeps the hard cut, since
        // the crossfade is decorative rather than explanatory.
        .opacity(isActive ? 1 : 0)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.18), value: isActive)
        .allowsHitTesting(isActive)
        .accessibilityHidden(!isActive)
        .zIndex(isActive ? 1 : 0)
    }
}

/// Purely decorative: it reports the same load the nav bar's stop button does,
/// so VoiceOver has nothing to gain from it.
private struct LoadingBar: View {
    let progress: Double
    let tint: Color

    var body: some View {
        GeometryReader { geometry in
            Rectangle()
                .fill(tint)
                .frame(width: geometry.size.width * max(0.02, progress), height: 2)
                .animation(.linear(duration: 0.2), value: progress)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(height: 2)
        .accessibilityHidden(true)
    }
}

private struct ErrorOverlay: View {
    let service: AIServiceItem
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 34, weight: .regular))
                .foregroundStyle(Theme.danger)
                // Decorative: the headline directly below says the same thing.
                .accessibilityHidden(true)

            Text("Couldn't load \(service.name)")
                .font(.headline)
                .foregroundStyle(Theme.textPrimary)
                .multilineTextAlignment(.center)

            Text(message)
                .font(.footnote)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 8) {
                Button(action: onRetry) {
                    Label("Try again", systemImage: "arrow.clockwise")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(Theme.accent)

                // Some providers block embedded web views outright. Sending the
                // user to Safari is a better ending than a dead end.
                Button {
                    UIApplication.shared.open(service.url)
                } label: {
                    Label("Open in Safari", systemImage: "safari")
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
                .tint(Theme.textInteractive)
            }
            .padding(.top, 2)
        }
        .padding(24)
        .frame(maxWidth: 320)
        .background(
            Theme.surfaceRaised.opacity(0.96),
            in: RoundedRectangle(cornerRadius: 20, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Theme.hairline, lineWidth: 1)
        )
        .padding(28)
        // One element, so VoiceOver reads the failure as a single message
        // rather than four fragments.
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Couldn't load \(service.name). \(message)")
    }
}
