//
//  ServicePickerSheet.swift
//  AI Hub — iOS
//

import SwiftUI

struct ServicePickerSheet: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var serviceToRemove: AIServiceItem?
    @State private var isAddingProvider = false

    /// Provider count captured when the add sheet opens, so the picker can tell
    /// whether something was actually added and close itself in that case.
    @State private var countBeforeAdding = 0

    var body: some View {
        NavigationStack {
            List {
                Section("Built-in") {
                    ForEach(model.defaultServices) { row(for: $0) }
                }

                if !model.customServices.isEmpty {
                    Section("Your providers") {
                        ForEach(model.customServices) { service in
                            row(for: service)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        serviceToRemove = service
                                    } label: {
                                        Label("Remove", systemImage: "trash")
                                    }
                                }
                        }
                    }
                }

                Section {
                    Button {
                        countBeforeAdding = model.providerCount
                        isAddingProvider = true
                    } label: {
                        Label("Add a provider", systemImage: "plus")
                    }
                } footer: {
                    Text("Every provider keeps its own cookies and storage on this device, so signing into one never signs you into another.")
                }
            }
            .navigationTitle("Providers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            // Presented from inside this sheet rather than by flipping the
            // model flags, so dismissing one sheet and presenting the other
            // never has to happen in the same update.
            .sheet(isPresented: $isAddingProvider, onDismiss: {
                if model.providerCount != countBeforeAdding { dismiss() }
            }) {
                AddServiceView()
            }
            .alert(
                "Remove \(serviceToRemove?.name ?? "provider")?",
                isPresented: Binding(
                    get: { serviceToRemove != nil },
                    set: { if !$0 { serviceToRemove = nil } }
                ),
                presenting: serviceToRemove
            ) { service in
                Button("Remove", role: .destructive) { model.deleteService(service) }
                Button("Cancel", role: .cancel) {}
            } message: { service in
                Text("\(service.name) will be removed and signed out — its saved cookies and site data are deleted too. You can add it back at any time.")
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func row(for service: AIServiceItem) -> some View {
        Button {
            model.select(service)
            dismiss()
        } label: {
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
                        // The row carries `.isSelected` instead.
                        .accessibilityHidden(true)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(service.id == model.activeServiceId
                                ? [.isButton, .isSelected]
                                : .isButton)
        .accessibilityHint(service.id == model.activeServiceId
                           ? "Currently open"
                           : "Switches to this provider")
    }
}
