//
//  AIHubViewModel.swift
//  AI Hub - Personal Mac Desktop AI Launcher
//  Native Apple macOS
//

import SwiftUI
import WebKit
import Combine

struct AIServiceItem: Identifiable, Codable, Equatable, Hashable {
    let id: String
    var name: String
    var urlString: String
    var displayDomain: String
    var colorHex: String
    var iconSymbol: String
    var isDefault: Bool
    
    var url: URL {
        URL(string: urlString) ?? URL(string: "https://chatgpt.com")!
    }
    
    // Generates a stable deterministic UUID for WKWebsiteDataStore partition
    var storeUUID: UUID {
        UUID(uuidString: deterministicUUID(from: id)) ?? UUID()
    }
    
    private func deterministicUUID(from string: String) -> String {
        // Fallback or mapped UUIDs for default providers
        switch id {
        case "chatgpt": return "A1B2C3D4-0001-4000-8000-000000000001"
        case "claude": return "A1B2C3D4-0002-4000-8000-000000000002"
        case "gemini": return "A1B2C3D4-0003-4000-8000-000000000003"
        case "perplexity": return "A1B2C3D4-0004-4000-8000-000000000004"
        case "grok": return "A1B2C3D4-0005-4000-8000-000000000005"
        default:
            // FNV-1a 64-bit hash: stable across launches, unlike String.hashValue
            // which is randomly seeded per process and would silently rotate the
            // data store partition (dropping the session) on every app start.
            var hash: UInt64 = 0xcbf29ce484222325
            for byte in string.utf8 {
                hash ^= UInt64(byte)
                hash = hash &* 0x100000001b3
            }
            return "A1B2C3D4-0099-4000-8000-\(String(format: "%012llx", hash & 0x0000_FFFF_FFFF_FFFF))"
        }
    }
}

@MainActor
final class AIHubViewModel: ObservableObject {
    @Published var services: [AIServiceItem] = []
    @Published var selectedServiceId: String = "chatgpt" {
        didSet {
            UserDefaults.standard.set(selectedServiceId, forKey: "aihub_selected_service_id")
            mountedServiceIds.insert(selectedServiceId)
        }
    }
    // Services get a WKWebView only once visited (and stay mounted afterwards
    // so their in-page state survives switching) — creating one per service up
    // front loads every provider's site at launch.
    @Published var mountedServiceIds: Set<String> = []
    @Published var secondaryServiceId: String = "claude"
    @Published var isSplitViewActive: Bool = false
    @Published var isShowingAddServiceSheet: Bool = false
    @Published var isShowingCommandPalette: Bool = false
    @Published var isShowingScratchpad: Bool = false
    @Published var scratchpadText: String = "" {
        didSet {
            UserDefaults.standard.set(scratchpadText, forKey: "aihub_scratchpad")
        }
    }
    
    // WebView references to allow reload/navigation
    var activeWebView: WKWebView?
    
    init() {
        loadServices()
        if let savedId = UserDefaults.standard.string(forKey: "aihub_selected_service_id") {
            self.selectedServiceId = savedId
        }
        // didSet observers don't fire during init, so register explicitly
        self.mountedServiceIds.insert(self.selectedServiceId)
        if let savedScratchpad = UserDefaults.standard.string(forKey: "aihub_scratchpad") {
            self.scratchpadText = savedScratchpad
        }
    }
    
    var currentService: AIServiceItem {
        services.first(where: { $0.id == selectedServiceId }) ?? defaultServices[0]
    }
    
    var secondaryService: AIServiceItem {
        services.first(where: { $0.id == secondaryServiceId }) ?? (services.count > 1 ? services[1] : currentService)
    }
    
    func selectService(_ service: AIServiceItem) {
        selectedServiceId = service.id
    }
    
    func addService(name: String, urlString: String, colorHex: String, iconSymbol: String) {
        var cleanUrl = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanUrl.hasPrefix("http://") && !cleanUrl.hasPrefix("https://") {
            cleanUrl = "https://" + cleanUrl
        }
        guard let url = URL(string: cleanUrl), let host = url.host else { return }
        
        let newId = "custom_\(Date().timeIntervalSince1970)"
        let newService = AIServiceItem(
            id: newId,
            name: name,
            urlString: cleanUrl,
            displayDomain: host,
            colorHex: colorHex,
            iconSymbol: iconSymbol,
            isDefault: false
        )
        services.append(newService)
        saveServices()
        selectedServiceId = newId
    }
    
    func deleteService(_ service: AIServiceItem) {
        guard !service.isDefault else { return }
        services.removeAll(where: { $0.id == service.id })
        saveServices()
        if selectedServiceId == service.id {
            selectedServiceId = services.first?.id ?? "chatgpt"
        }
    }
    
    func reloadCurrent() {
        activeWebView?.reload()
    }
    
    func openInDefaultBrowser() {
        if let url = URL(string: currentService.urlString) {
            NSWorkspace.shared.open(url)
        }
    }
    
    private var defaultServices: [AIServiceItem] {
        [
            AIServiceItem(id: "chatgpt", name: "ChatGPT", urlString: "https://chatgpt.com", displayDomain: "chatgpt.com", colorHex: "#10A37F", iconSymbol: "bubble.left.and.bubble.right.fill", isDefault: true),
            AIServiceItem(id: "claude", name: "Claude", urlString: "https://claude.ai", displayDomain: "claude.ai", colorHex: "#DA7756", iconSymbol: "sparkles", isDefault: true),
            AIServiceItem(id: "gemini", name: "Google Gemini", urlString: "https://gemini.google.com", displayDomain: "gemini.google.com", colorHex: "#3B82F6", iconSymbol: "star.fill", isDefault: true),
            AIServiceItem(id: "perplexity", name: "Perplexity", urlString: "https://perplexity.ai", displayDomain: "perplexity.ai", colorHex: "#22C55E", iconSymbol: "magnifyingglass", isDefault: true),
            AIServiceItem(id: "grok", name: "Grok", urlString: "https://grok.com", displayDomain: "grok.com", colorHex: "#E5E7EB", iconSymbol: "bolt.fill", isDefault: true)
        ]
    }
    
    private func loadServices() {
        if let data = UserDefaults.standard.data(forKey: "aihub_custom_services"),
           let decoded = try? JSONDecoder().decode([AIServiceItem].self, from: data) {
            self.services = decoded
        } else {
            self.services = defaultServices
        }
    }
    
    private func saveServices() {
        if let data = try? JSONEncoder().encode(services) {
            UserDefaults.standard.set(data, forKey: "aihub_custom_services")
        }
    }
}
