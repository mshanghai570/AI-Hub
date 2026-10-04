//
//  AIHubApp.swift
//  AI Hub — iOS
//
//  Native iOS app: one container, many AI providers, each in its own isolated
//  WebKit session.
//

import SwiftUI

@main
struct AIHubApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .preferredColorScheme(.dark)
        }
    }
}
