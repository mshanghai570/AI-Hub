//
//  AIHubApp.swift
//  AI Hub - Personal Mac Desktop AI Launcher
//  Native Apple macOS (Sonoma & Sequoia)
//  Written in Swift 6 & SwiftUI
//

import SwiftUI
import WebKit

@main
struct AIHubApp: App {
    @StateObject private var model = AIHubViewModel()
    @AppStorage("aihub_window_width") private var windowWidth: Double = 1280
    @AppStorage("aihub_window_height") private var windowHeight: Double = 840

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .frame(minWidth: 900, minHeight: 600)
                .preferredColorScheme(.dark)
        }
        .windowStyle(.hiddenTitleBar)
        .windowToolbarStyle(.unified(showsTitle: false))
        .commands {
            // macOS Native Menu Bar Commands
            CommandGroup(replacing: .newItem) {
                Button("Add AI Service...") {
                    model.isShowingAddServiceSheet = true
                }
                .keyboardShortcut("n", modifiers: [.command])

                Button("Quick Switcher / Command Palette...") {
                    model.isShowingCommandPalette = true
                }
                .keyboardShortcut("k", modifiers: [.command])
                
                Divider()
                
                Button("Toggle Prompt Scratchpad") {
                    model.isShowingScratchpad.toggle()
                }
                .keyboardShortcut("p", modifiers: [.command])
                
                Button("Toggle Dual Split View") {
                    model.isSplitViewActive.toggle()
                }
                .keyboardShortcut("d", modifiers: [.command])
            }

            CommandMenu("Services") {
                ForEach(Array(model.services.prefix(9).enumerated()), id: \.element.id) { index, service in
                    Button(service.name) {
                        model.selectService(service)
                    }
                    .keyboardShortcut(KeyEquivalent(Character(UnicodeScalar(0x31 + index)!)), modifiers: [.command])
                }
                
                Divider()
                
                Button("Reload Current Service") {
                    model.reloadCurrent()
                }
                .keyboardShortcut("r", modifiers: [.command])

                Button("Open in Default Browser (Safari)") {
                    model.openInDefaultBrowser()
                }
                .keyboardShortcut("o", modifiers: [.command])
            }
        }

        #if os(macOS)
        Settings {
            SettingsView()
                .environmentObject(model)
                .frame(width: 480, height: 320)
        }
        #endif
    }
}
