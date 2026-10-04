//
//  ContentView.swift
//  AI Hub - Personal Mac Desktop AI Launcher
//  Native Apple macOS UI
//

import SwiftUI
import WebKit

struct ContentView: View {
    @EnvironmentObject var model: AIHubViewModel
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    @State private var showingDeleteAlert = false
    @State private var serviceToDelete: AIServiceItem?

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // Sidebar
            SidebarView(serviceToDelete: $serviceToDelete, showingDeleteAlert: $showingDeleteAlert)
                .navigationSplitViewColumnWidth(min: 190, ideal: 220, max: 280)
        } detail: {
            // Main Content Area
            ZStack {
                Color(nsColor: .windowBackgroundColor)
                    .ignoresSafeArea()

                if model.isSplitViewActive {
                    // Dual Split View
                    HSplitView {
                        serviceView(for: model.currentService)
                            .frame(minWidth: 350)
                        serviceView(for: model.secondaryService)
                            .frame(minWidth: 350)
                    }
                } else {
                    // Single View with persistent instances (visited services stay
                    // in memory; unvisited ones are never created or loaded)
                    ForEach(model.services.filter { model.mountedServiceIds.contains($0.id) }) { service in
                        WebViewContainer(service: service)
                            .opacity(model.selectedServiceId == service.id ? 1 : 0)
                            .allowsHitTesting(model.selectedServiceId == service.id)
                    }
                }
                
                // Prompt Scratchpad Drawer
                if model.isShowingScratchpad {
                    HStack {
                        Spacer()
                        ScratchpadDrawer()
                            .frame(width: 360)
                            .transition(.move(edge: .trailing))
                            .zIndex(10)
                    }
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .navigation) {
                    Button(action: { model.activeWebView?.goBack() }) {
                        Image(systemName: "chevron.left")
                    }
                    .disabled(model.activeWebView?.canGoBack == false)
                    .help("Go Back (⌘[)")

                    Button(action: { model.activeWebView?.goForward() }) {
                        Image(systemName: "chevron.right")
                    }
                    .disabled(model.activeWebView?.canGoForward == false)
                    .help("Go Forward (⌘])")

                    Button(action: { model.reloadCurrent() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .help("Reload (⌘R)")
                }

                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: model.currentService.colorHex))
                            .frame(width: 8, height: 8)
                        
                        Text(model.currentService.name)
                            .font(.system(size: 13, weight: .semibold))
                        
                        Text(model.currentService.displayDomain)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color(nsColor: .controlBackgroundColor).opacity(0.8))
                    .cornerRadius(8)
                }

                ToolbarItemGroup(placement: .primaryAction) {
                    Button(action: { model.isSplitViewActive.toggle() }) {
                        Image(systemName: model.isSplitViewActive ? "rectangle.split.2x1.fill" : "rectangle.split.2x1")
                    }
                    .help("Toggle Split View (⌘D)")

                    Button(action: { model.isShowingScratchpad.toggle() }) {
                        Image(systemName: "doc.text")
                    }
                    .help("Toggle Scratchpad (⌘P)")

                    Button(action: { model.openInDefaultBrowser() }) {
                        Image(systemName: "safari")
                    }
                    .help("Open in Safari (⌘O)")
                }
            }
        }
        .sheet(isPresented: $model.isShowingAddServiceSheet) {
            AddServiceSheet()
                .environmentObject(model)
        }
        .alert("Remove Service", isPresented: $showingDeleteAlert, presenting: serviceToDelete) { service in
            Button("Remove", role: .destructive) {
                model.deleteService(service)
            }
            Button("Cancel", role: .cancel) {}
        } message: { service in
            Text("Are you sure you want to remove \(service.name) from AI Hub?")
        }
    }

    @ViewBuilder
    private func serviceView(for service: AIServiceItem) -> some View {
        VStack(spacing: 0) {
            HStack {
                Circle()
                    .fill(Color(hex: service.colorHex))
                    .frame(width: 8, height: 8)
                Text(service.name)
                    .font(.caption)
                    .fontWeight(.medium)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(nsColor: .controlBackgroundColor))

            WebViewContainer(service: service)
        }
    }
}

struct SidebarView: View {
    @EnvironmentObject var model: AIHubViewModel
    @Binding var serviceToDelete: AIServiceItem?
    @Binding var showingDeleteAlert: Bool

    var body: some View {
        List(selection: $model.selectedServiceId) {
            Section("Primary AI") {
                ForEach(model.services.filter { $0.isDefault }) { service in
                    serviceRow(service)
                }
            }

            let customs = model.services.filter { !$0.isDefault }
            if !customs.isEmpty {
                Section("Custom AI") {
                    ForEach(customs) { service in
                        serviceRow(service)
                            .contextMenu {
                                Button("Remove Service", role: .destructive) {
                                    serviceToDelete = service
                                    showingDeleteAlert = true
                                }
                            }
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .safeAreaInset(edge: .bottom) {
            Button(action: { model.isShowingAddServiceSheet = true }) {
                Label("Add AI Service", systemImage: "plus")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
            .padding(10)
        }
    }

    @ViewBuilder
    private func serviceRow(_ service: AIServiceItem) -> some View {
        HStack(spacing: 8) {
            Image(systemName: service.iconSymbol)
                .foregroundColor(Color(hex: service.colorHex))
                .frame(width: 16)
            Text(service.name)
                .font(.system(size: 13))
            Spacer()
        }
        .tag(service.id)
    }
}

struct ScratchpadDrawer: View {
    @EnvironmentObject var model: AIHubViewModel
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Prompt Scratchpad", systemImage: "doc.text")
                    .font(.headline)
                Spacer()
                Button(action: { model.isShowingScratchpad = false }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }

            TextEditor(text: $model.scratchpadText)
                .font(.system(.body, design: .monospaced))
                .padding(4)
                .background(Color(nsColor: .controlBackgroundColor))
                .cornerRadius(8)

            HStack {
                Button(action: {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(model.scratchpadText, forType: .string)
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        copied = false
                    }
                }) {
                    Label(copied ? "Copied!" : "Copy Prompt", systemImage: copied ? "checkmark" : "doc.on.doc")
                }
                Spacer()
            }
        }
        .padding()
        .background(Color(nsColor: .windowBackgroundColor))
        .border(Color.secondary.opacity(0.2), width: 1)
    }
}

struct AddServiceSheet: View {
    @EnvironmentObject var model: AIHubViewModel
    @Environment(\.dismiss) var dismiss
    @State private var name: String = ""
    @State private var urlString: String = ""
    @State private var colorHex: String = "#10A37F"
    @State private var iconSymbol: String = "bubble.left.and.bubble.right.fill"

    var body: some View {
        VStack(spacing: 16) {
            Text("Add New AI Service")
                .font(.headline)

            Form {
                TextField("Service Name", text: $name)
                TextField("Website URL", text: $urlString, prompt: Text("https://chat.mistral.ai"))
            }

            HStack {
                Button("Cancel") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Add to AI Hub") {
                    model.addService(name: name, urlString: urlString, colorHex: colorHex, iconSymbol: iconSymbol)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .disabled(name.isEmpty || urlString.isEmpty)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .frame(width: 420)
    }
}

struct SettingsView: View {
    @EnvironmentObject var model: AIHubViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("AI Hub Preferences")
                .font(.headline)
            
            Text("Sessions are isolated per AI service using WKWebsiteDataStore.")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(24)
    }
}

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted))
        var int: UInt64 = 0
        scanner.scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 7: // #RRGGBB
            (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}
