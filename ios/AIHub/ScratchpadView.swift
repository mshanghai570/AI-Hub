//
//  ScratchpadView.swift
//  AI Hub — iOS
//

import SwiftUI

/// Draft a prompt once, copy it, then paste it into whichever provider the user
/// switches to. The text is persisted by AppModel, so it survives relaunches.
struct ScratchpadView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var didCopy = false
    @State private var copyResetTask: Task<Void, Never>?

    private var isEmpty: Bool {
        model.scratchpadText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 0) {
                TextEditor(text: $model.scratchpadText)
                    .font(.system(.body, design: .monospaced))
                    .scrollContentBackground(.hidden)
                    .padding(10)
                    .background(Theme.surfaceRaised, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Theme.hairline, lineWidth: 1)
                    )
                    .overlay(alignment: .topLeading) {
                        if model.scratchpadText.isEmpty {
                            Text("Draft a prompt here, then copy it into any provider.")
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(Theme.textTertiary)
                                .padding(.horizontal, 15)
                                .padding(.vertical, 18)
                                .allowsHitTesting(false)
                        }
                    }
                    .accessibilityLabel("Prompt scratchpad")

                HStack {
                    Text("\(model.scratchpadText.count) characters")
                        .font(.footnote)
                        .foregroundStyle(Theme.textSecondary)
                        .monospacedDigit()

                    Spacer()

                    Button("Clear") {
                        model.scratchpadText = ""
                    }
                    .font(.footnote.weight(.medium))
                    .frame(minHeight: 44)
                    .disabled(isEmpty)
                    .accessibilityLabel("Clear scratchpad")
                }
            }
            .padding(16)
            .background(Theme.background)
            .navigationTitle("Prompt Scratchpad")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        UIPasteboard.general.string = model.scratchpadText
                        didCopy = true

                        // Restart the reset timer on every copy, so rapid taps
                        // cannot let an earlier timer clear a later "Copied".
                        copyResetTask?.cancel()
                        copyResetTask = Task {
                            try? await Task.sleep(nanoseconds: 1_500_000_000)
                            guard !Task.isCancelled else { return }
                            didCopy = false
                        }
                    } label: {
                        Label(didCopy ? "Copied" : "Copy",
                              systemImage: didCopy ? "checkmark" : "doc.on.doc")
                            .contentTransition(.symbolEffect(.replace))
                    }
                    .disabled(isEmpty)
                }
            }
            .animation(.snappy(duration: 0.2), value: didCopy)
            .sensoryFeedback(trigger: didCopy) { _, isCopied in
                isCopied ? .success : nil
            }
            .onDisappear { copyResetTask?.cancel() }
        }
    }
}
