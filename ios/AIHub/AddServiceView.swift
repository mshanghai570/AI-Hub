//
//  AddServiceView.swift
//  AI Hub — iOS
//

import SwiftUI

struct AddServiceView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var urlString = ""
    @State private var colorHex = Catalogue.colorChoices[0]
    @State private var iconSymbol = Catalogue.iconChoices[0]

    private var parsedURL: URL? { AppModel.normaliseURL(urlString) }

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSave: Bool { !trimmedName.isEmpty && parsedURL != nil }

    /// Only surface the address complaint once there is something to complain
    /// about — an error under an untouched field reads as a telling-off.
    private var showsAddressError: Bool { !urlString.isEmpty && parsedURL == nil }

    /// Presets that are not already in the provider list.
    private var availablePresets: [Catalogue.Preset] {
        Catalogue.presets.filter { preset in
            !model.services.contains { $0.id == preset.id }
        }
    }

    /// Six swatches across on a phone is 6*44 + 5*10 = 314pt, which overflows the
    /// inset width of a compact iPhone. Adaptive columns reflow to five or four
    /// instead of clipping the last swatch.
    private let swatchColumns = [GridItem(.adaptive(minimum: 46), spacing: 10)]

    var body: some View {
        NavigationStack {
            Form {
                if !availablePresets.isEmpty {
                    Section {
                        ForEach(availablePresets) { preset in
                            Button {
                                model.add(preset)
                                dismiss()
                            } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: preset.iconSymbol)
                                        .foregroundStyle(Color(hex: preset.colorHex))
                                        .frame(width: 24)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(preset.name)
                                            .font(.subheadline)
                                            .foregroundStyle(Theme.textPrimary)
                                        Text(preset.displayDomain)
                                            .font(.caption.monospaced())
                                            .foregroundStyle(Theme.textSecondary)
                                    }
                                    Spacer()
                                    Image(systemName: "plus.circle")
                                        .foregroundStyle(Theme.accent)
                                        .accessibilityHidden(true)
                                }
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Add \(preset.name)")
                            .accessibilityHint(preset.displayDomain)
                        }
                    } header: {
                        Text("Quick add")
                    } footer: {
                        Text("Tap to add instantly. These get their own isolated session, same as the built-in providers.")
                    }
                }

                Section {
                    TextField("Name", text: $name)
                        .textInputAutocapitalization(.words)

                    TextField("chat.example.com", text: $urlString)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Custom provider")
                } footer: {
                    if showsAddressError {
                        Label(
                            "That doesn't look like a web address. Try chat.example.com",
                            systemImage: "exclamationmark.triangle.fill"
                        )
                        .font(.footnote)
                        .foregroundStyle(Theme.danger)
                    } else {
                        Text("Any https:// address works — including a self-hosted or private one.")
                    }
                }

                Section("Icon") {
                    LazyVGrid(columns: swatchColumns, spacing: 10) {
                        ForEach(Catalogue.iconChoices, id: \.self) { symbol in
                            Button {
                                iconSymbol = symbol
                            } label: {
                                Image(systemName: symbol)
                                    .font(.system(size: 16))
                                    .foregroundStyle(symbol == iconSymbol
                                                     ? Color(hex: colorHex)
                                                     : Theme.textSecondary)
                                    .frame(width: 44, height: 44)
                                    .background(
                                        symbol == iconSymbol
                                            ? Color(hex: colorHex).opacity(0.22)
                                            : Color.secondary.opacity(0.12),
                                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                                            .stroke(symbol == iconSymbol ? Color(hex: colorHex) : .clear,
                                                    lineWidth: 1.5)
                                    )
                                    .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                            .buttonStyle(PressableButtonStyle(scale: 0.9))
                            .accessibilityLabel(symbol)
                            .accessibilityAddTraits(symbol == iconSymbol ? [.isButton, .isSelected] : .isButton)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Accent colour") {
                    LazyVGrid(columns: swatchColumns, spacing: 10) {
                        ForEach(Catalogue.colorChoices, id: \.self) { hex in
                            Button {
                                colorHex = hex
                            } label: {
                                Circle()
                                    .fill(Color(hex: hex))
                                    .frame(width: 30, height: 30)
                                    .overlay(
                                        Circle().strokeBorder(
                                            .white.opacity(hex == colorHex ? 0.95 : 0),
                                            lineWidth: 2
                                        )
                                    )
                                    // A 30pt dot is below the touch minimum, so
                                    // the circle is centred in a 44pt target.
                                    .frame(width: 44, height: 44)
                                    .contentShape(Circle())
                            }
                            .buttonStyle(PressableButtonStyle(scale: 0.9))
                            .accessibilityLabel("Colour \(hex)")
                            .accessibilityAddTraits(hex == colorHex ? [.isButton, .isSelected] : .isButton)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Preview") {
                    HStack(spacing: 10) {
                        Image(systemName: iconSymbol)
                            .foregroundStyle(Color(hex: colorHex))
                            .frame(width: 24)
                        Text(trimmedName.isEmpty ? "New provider" : trimmedName)
                            .foregroundStyle(trimmedName.isEmpty ? Theme.textTertiary : Theme.textPrimary)
                        Spacer()
                        Text(parsedURL?.host ?? "—")
                            .font(.caption.monospaced())
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .navigationTitle("Add provider")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        model.addService(name: name, urlString: urlString, colorHex: colorHex, iconSymbol: iconSymbol)
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }
}
