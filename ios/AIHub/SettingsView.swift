//
//  SettingsView.swift
//  AI Hub — iOS
//
//  The one place to see the whole provider list at once, put it in the order you
//  want, sign out of everything, and get back to a known-good state. Session
//  data is the only thing this app stores beyond your provider list, so that is
//  what most of this screen manages.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    /// A single alert driven by one value, rather than three alerts competing on
    /// the same view — SwiftUI only reliably presents one at a time.
    private enum Confirmation {
        case signOutAll
        case restoreDefaults
        case signOut(AIServiceItem)
    }

    @State private var confirmation: Confirmation?
    @State private var isAddingProvider = false

    private var version: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(short) (\(build))"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    ForEach(model.services) { service in
                        Button {
                            model.select(service)
                            dismiss()
                        } label: {
                            row(for: service)
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(service.id == model.activeServiceId
                                                ? [.isButton, .isSelected]
                                                : .isButton)
                        .accessibilityHint(service.id == model.activeServiceId
                                           ? "Currently open"
                                           : "Switches to this provider")
                        .swipeActions(edge: .trailing) {
                            Button {
                                confirmation = .signOut(service)
                            } label: {
                                Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            }
                            .tint(Theme.warning)
                        }
                    }
                    // Backs the dock's left-to-right order, so the one list the
                    // user actually stares at can be arranged deliberately.
                    .onMove(perform: model.moveServices)

                    Button {
                        isAddingProvider = true
                    } label: {
                        Label("Add provider", systemImage: "plus")
                    }
                } header: {
                    Text("Providers")
                } footer: {
                    Text("Tap to switch. Drag to reorder — the dock follows this order. Swipe a row to sign out of just that provider.")
                }

                Section {
                    Button(role: .destructive) {
                        confirmation = .signOutAll
                    } label: {
                        Label("Sign out of all providers", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                } header: {
                    Text("Sessions")
                } footer: {
                    Text("Deletes saved cookies and site data for every provider in the list. You'll need to sign in again next time.")
                }

                Section {
                    Button {
                        model.isShowingWelcome = true
                    } label: {
                        Label("How AI Hub works", systemImage: "questionmark.circle")
                    }

                    Button(role: .destructive) {
                        confirmation = .restoreDefaults
                    } label: {
                        Label("Restore built-in providers", systemImage: "arrow.counterclockwise")
                    }
                    .disabled(!model.hasCustomProviders)
                } header: {
                    Text("General")
                } footer: {
                    Text(model.hasCustomProviders
                         ? "Restoring removes the providers you added and erases their saved sessions."
                         : "You're already using the standard provider list.")
                }

                Section {
                    LabeledContent("Version", value: version)
                    LabeledContent("Providers", value: "\(model.providerCount)")
                } header: {
                    Text("About")
                } footer: {
                    Text("AI Hub is a thin, honest shell: it shows each provider's own website in an isolated WebKit session. It is not affiliated with, or endorsed by, any provider it opens.")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                // Standard iOS affordance: reveals the reorder grips on demand
                // instead of leaving the list permanently in edit mode, which
                // would cost row taps and the swipe action.
                ToolbarItem(placement: .topBarLeading) {
                    EditButton()
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            // Nested inside this sheet rather than swapping the model's sheet
            // flags, which would mean dismissing and presenting in the same
            // update — the case SwiftUI gets wrong.
            .sheet(isPresented: $isAddingProvider) { AddServiceView() }
            .alert(
                alertTitle,
                isPresented: Binding(
                    get: { confirmation != nil },
                    set: { if !$0 { confirmation = nil } }
                ),
                presenting: confirmation
            ) { pending in
                switch pending {
                case .signOutAll:
                    Button("Sign out everywhere", role: .destructive) {
                        model.clearAllSessionData()
                    }
                case .restoreDefaults:
                    Button("Restore", role: .destructive) {
                        model.restoreDefaultProviders()
                    }
                case .signOut(let service):
                    Button("Sign out", role: .destructive) {
                        model.forgetServiceData(service)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: { pending in
                Text(alertMessage(for: pending))
            }
        }
    }

    private var alertTitle: String {
        switch confirmation {
        case .signOutAll: return "Sign out of all providers?"
        case .restoreDefaults: return "Restore built-in providers?"
        case .signOut(let service): return "Sign out of \(service.name)?"
        case .none: return ""
        }
    }

    private func alertMessage(for confirmation: Confirmation) -> String {
        switch confirmation {
        case .signOutAll:
            return "Every provider's cookies and stored data will be deleted, and the pages will reload to their sign-in screens."
        case .restoreDefaults:
            return "The providers you added will be removed and their saved sessions erased. The built-in providers stay."
        case .signOut(let service):
            return "Cookies and stored data for \(service.name) will be deleted. Other providers are unaffected."
        }
    }

    @ViewBuilder
    private func row(for service: AIServiceItem) -> some View {
        HStack(spacing: 12) {
            Image(systemName: service.iconSymbol)
                .font(.system(size: 15))
                .foregroundStyle(Color(hex: service.colorHex))
                .frame(width: 26)

            VStack(alignment: .leading, spacing: 2) {
                Text(service.name)
                    .font(.subheadline)
                    .foregroundStyle(Theme.textPrimary)
                Text(service.displayDomain)
                    .font(.caption.monospaced())
                    .foregroundStyle(Theme.textSecondary)
            }

            Spacer()

            if service.id == model.activeServiceId {
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.accent)
                    // The row already carries the `.isSelected` trait, so the
                    // glyph would only be read as a stray "checkmark".
                    .accessibilityHidden(true)
            }
        }
        .contentShape(Rectangle())
    }
}
