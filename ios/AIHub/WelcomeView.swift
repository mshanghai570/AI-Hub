//
//  WelcomeView.swift
//  AI Hub — iOS
//
//  Shown once on first launch. The app's premise — that each provider gets its
//  own sealed session — is invisible in use, so a new user has no way to tell
//  it apart from a pile of browser tabs unless it is said out loud.
//

import SwiftUI

struct WelcomeView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 16)

            HubMark(size: 128)

            VStack(spacing: 10) {
                Text("AI Hub")
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(Theme.textPrimary)

                // No hard line break: it has to survive larger text sizes, so
                // the wrap point is left to the layout.
                Text("Every AI in one app — and none of them can see each other.")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.textSecondary)
                    .lineSpacing(2)
                    .frame(maxWidth: 320)
            }
            .padding(.top, 22)
            .padding(.horizontal, 24)

            // At accessibility text sizes the three points no longer fit beside
            // the sign-off button, so they scroll rather than clip.
            ScrollView {
                VStack(spacing: 18) {
                    Point(
                        system: "lock.shield.fill",
                        hex: "#10A37F",
                        title: "A separate sign-in for each provider",
                        detail: "Cookies and storage live in their own sealed store, so signing into one never signs you into another."
                    )
                    Point(
                        system: "rectangle.on.rectangle.angled",
                        hex: "#3B82F6",
                        title: "Switch without losing your place",
                        detail: "Every provider you open stays loaded in the background — including unfinished prompts."
                    )
                    Point(
                        system: "plus.circle.fill",
                        hex: "#DA7756",
                        title: "Bring your own",
                        detail: "Add any AI that has a web address, and it gets the same isolation as the built-ins."
                    )
                }
                .padding(.horizontal, 24)
                .padding(.top, 30)
            }
            .scrollBounceBehavior(.basedOnSize)

            Spacer(minLength: 12)

            Button {
                dismiss()
            } label: {
                Text("Get started")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(PressableButtonStyle(scale: 0.98))
            .padding(.horizontal, 24)
            .padding(.bottom, 18)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background)
        .preferredColorScheme(.dark)
        .accessibilityElement(children: .contain)
    }

    private struct Point: View {
        let system: String
        let hex: String
        let title: String
        let detail: String

        @Environment(\.dynamicTypeSize) private var dynamicTypeSize

        var body: some View {
            // Side by side while the text is small; stacked once it grows, so
            // the copy keeps a usable measure instead of a narrow column.
            let layout = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8))
                : AnyLayout(HStackLayout(alignment: .top, spacing: 14))

            layout {
                Image(systemName: system)
                    .font(.system(size: 19))
                    .foregroundStyle(Color(hex: hex))
                    .frame(width: 28, height: 28)
                    // Decorative: the title carries the meaning.
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.textPrimary)

                    Text(detail)
                        .font(.footnote)
                        .foregroundStyle(Theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .combine)
        }
    }
}
