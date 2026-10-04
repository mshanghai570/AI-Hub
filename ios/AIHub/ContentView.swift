//
//  ContentView.swift
//  AI Hub — iOS
//
//  Phone-shaped layout: a navigation bar for the active provider, the mounted
//  provider panes, and a bottom dock for switching between them.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

    /// Both destructive confirmations are driven by one value. Stacking two
    /// `.alert` modifiers on the same view is unreliable in SwiftUI — whichever
    /// is attached last tends to win — so they are merged here.
    private enum Confirmation {
        case remove(AIServiceItem)
        case signOut(AIServiceItem)
    }

    private var confirmation: Confirmation? {
        if let service = model.pendingRemoval { return .remove(service) }
        if let service = model.pendingSignOut { return .signOut(service) }
        return nil
    }

    var body: some View {
        VStack(spacing: 0) {
            ActiveServiceBar()

            Divider().overlay(Theme.hairline)

            ZStack {
                ForEach(model.mountedServices) { service in
                    ServicePane(
                        service: service,
                        isActive: service.id == model.activeServiceId
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Divider().overlay(Theme.hairline)

            ServiceDock()
        }
        .background(Theme.background)
        .preferredColorScheme(.dark)
        .sensoryFeedback(.selection, trigger: model.activeServiceId)
        // Safety net: if anything sets a service id without going through
        // select(_:), the pane still gets created.
        .task(id: model.activeServiceId) {
            model.mount(model.activeServiceId)
        }
        .sheet(isPresented: $model.isShowingPicker) { ServicePickerSheet() }
        .sheet(isPresented: $model.isShowingAddService) { AddServiceView() }
        .sheet(isPresented: $model.isShowingScratchpad) { ScratchpadView() }
        .sheet(isPresented: $model.isShowingSettings) { SettingsView() }
        .sheet(isPresented: $model.isShowingWelcome) { WelcomeView() }
        .alert(
            alertTitle,
            isPresented: Binding(
                get: { confirmation != nil },
                set: { if !$0 { clearConfirmation() } }
            ),
            presenting: confirmation
        ) { pending in
            switch pending {
            case .remove(let service):
                Button("Remove", role: .destructive) { model.deleteService(service) }
            case .signOut(let service):
                Button("Clear session", role: .destructive) { model.forgetServiceData(service) }
            }
            Button("Cancel", role: .cancel) {}
        } message: { pending in
            Text(alertMessage(for: pending))
        }
    }

    private var alertTitle: String {
        switch confirmation {
        case .remove(let service): return "Remove \(service.name)?"
        case .signOut(let service): return "Sign out of \(service.name)?"
        case .none: return ""
        }
    }

    private func alertMessage(for confirmation: Confirmation) -> String {
        switch confirmation {
        case .remove(let service):
            return "\(service.name) will be removed from AI Hub and signed out — its saved cookies and site data are deleted too. You can add it back at any time."
        case .signOut(let service):
            return "Cookies and stored data for \(service.name) will be deleted, and the page will reload to its sign-in screen. Other providers are unaffected."
        }
    }

    private func clearConfirmation() {
        model.pendingRemoval = nil
        model.pendingSignOut = nil
    }
}

// MARK: - Navigation bar

private struct ActiveServiceBar: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        HStack(spacing: 2) {
            if let engine = model.activeEngine {
                IconButton(system: "chevron.left", label: "Back", tint: Theme.textInteractive, isEnabled: engine.canGoBack) {
                    engine.goBack()
                }
                IconButton(system: "chevron.right", label: "Forward", tint: Theme.textInteractive, isEnabled: engine.canGoForward) {
                    engine.goForward()
                }

                providerChip(engine: engine)

                // One slot, two meanings: while a page is loading the refresh
                // icon becomes a stop button, which is also the app's only
                // signal that a load is in flight.
                if engine.isLoading {
                    IconButton(system: "xmark", label: "Stop loading", tint: Theme.textInteractive) {
                        engine.stopLoading()
                    }
                } else {
                    IconButton(system: "arrow.clockwise", label: "Reload page", tint: Theme.textInteractive) {
                        engine.reload()
                    }
                }

                optionsMenu()
            } else {
                Text(model.activeService.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.textPrimary)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(Theme.surface)
    }

    private func providerChip(engine: WebEngine) -> some View {
        Button {
            model.isShowingPicker = true
        } label: {
            HStack(spacing: 7) {
                Circle()
                    .fill(Color(hex: model.activeService.colorHex))
                    .frame(width: 8, height: 8)

                VStack(spacing: 0) {
                    Text(model.activeService.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.textPrimary)
                        .lineLimit(1)

                    // Was 10pt at 45% white — about 4.4:1, under the 4.5:1
                    // floor for body text. Both are raised here.
                    Text(model.activeService.displayDomain)
                        .font(.caption.monospaced())
                        .foregroundStyle(Theme.textSecondary)
                        .lineLimit(1)
                }

                Image(systemName: "chevron.down")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .frame(minHeight: 40)
            .background(Theme.surfaceRaised, in: Capsule())
            .overlay(Capsule().stroke(Theme.hairline, lineWidth: 1))
            .contentShape(Capsule())
        }
        .buttonStyle(PressableButtonStyle(scale: 0.97))
        .frame(maxWidth: .infinity)
        .accessibilityLabel("Provider: \(model.activeService.name). \(model.activeService.displayDomain)")
        .accessibilityHint("Opens the provider list")
        .accessibilityAddTraits(.isButton)
    }

    private func optionsMenu() -> some View {
        Menu {
            Button("Prompt Scratchpad", systemImage: "doc.text") {
                model.isShowingScratchpad = true
            }
            Button("Add provider", systemImage: "plus") {
                model.isShowingAddService = true
            }

            Divider()

            Button("Open in Safari", systemImage: "safari") {
                UIApplication.shared.open(model.activeService.url)
            }
            Button("Reload page", systemImage: "arrow.clockwise") {
                model.activeEngine?.reload()
            }

            Divider()

            Button("Clear session", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) {
                model.pendingSignOut = model.activeService
            }

            Divider()

            Button("Settings", systemImage: "gearshape") {
                model.isShowingSettings = true
            }
        } label: {
            Image(systemName: "ellipsis.circle")
                .font(.system(size: 19))
                .foregroundStyle(Theme.textInteractive)
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .accessibilityLabel("More options")
    }
}

// MARK: - Provider dock

private struct ServiceDock: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(model.services) { service in
                        ProviderChip(
                            service: service,
                            isActive: service.id == model.activeServiceId
                        ) {
                            model.select(service)
                        }
                        .id(service.id)
                        .contextMenu {
                            Button("Reload", systemImage: "arrow.clockwise") {
                                model.engine(for: service.id)?.reload()
                            }
                            Button("Open in Safari", systemImage: "safari") {
                                UIApplication.shared.open(service.url)
                            }
                            Button("Clear session", systemImage: "rectangle.portrait.and.arrow.right") {
                                model.pendingSignOut = service
                            }
                            if !service.isDefault {
                                Divider()
                                Button("Remove provider", systemImage: "trash", role: .destructive) {
                                    model.pendingRemoval = service
                                }
                            }
                        }
                    }

                    Button {
                        model.isShowingAddService = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.textInteractive)
                            .frame(width: 34, height: 34)
                            .background(Theme.surfaceRaised, in: Circle())
                            .overlay(Circle().strokeBorder(Theme.hairline, lineWidth: 1))
                            // Keeps the drawn circle at 34pt while the touch
                            // target reaches the 44pt minimum.
                            .frame(width: 44, height: 44)
                            .contentShape(Circle())
                    }
                    .buttonStyle(PressableButtonStyle(scale: 0.92))
                    .accessibilityLabel("Add provider")
                    .keyboardShortcut("n", modifiers: .command)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
            }
            // A provider chosen from the picker can sit off-screen in a long
            // dock, so bring it into view rather than silently selecting it.
            .onChange(of: model.activeServiceId) { _, newValue in
                withAnimation(.easeInOut(duration: 0.25)) {
                    proxy.scrollTo(newValue, anchor: .center)
                }
            }
        }
        .background(Theme.surface)
        .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
    }
}

private struct ProviderChip: View {
    let service: AIServiceItem
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        let tint = Color(hex: service.colorHex)

        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: service.iconSymbol)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isActive ? tint : tint.opacity(0.75))

                Text(service.name)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(isActive ? Theme.textPrimary : Theme.textSecondary)
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                isActive ? tint.opacity(0.2) : Theme.surfaceRaised,
                in: Capsule()
            )
            .overlay(
                Capsule().stroke(isActive ? tint.opacity(0.55) : Theme.hairline, lineWidth: 1)
            )
            .fixedSize()
            // 44pt tall target around a 34pt capsule.
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(PressableButtonStyle())
        .accessibilityLabel(service.name)
        .accessibilityValue(service.displayDomain)
        .accessibilityHint("Switches to this provider")
        // Lets VoiceOver announce which provider is currently showing, which
        // colour alone was previously the only signal for.
        .accessibilityAddTraits(isActive ? [.isButton, .isSelected] : .isButton)
    }
}
