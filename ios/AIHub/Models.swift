//
//  Models.swift
//  AI Hub — iOS
//
//  Provider model plus the deterministic data-store identifier that gives each
//  provider its own cookie jar. Ported from macos/AIHubViewModel.swift; the
//  storeUUID derivation is unchanged so a session that works on one platform's
//  partition scheme stays stable.
//

import Foundation

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

    /// Stable, per-provider `WKWebsiteDataStore` partition identifier.
    var storeUUID: UUID {
        UUID(uuidString: Self.deterministicUUID(for: id)) ?? UUID()
    }

    /// Maps a provider id to a fixed UUID, hashing unknown ids with FNV-1a.
    ///
    /// FNV-1a is used rather than `String.hashValue` because Swift seeds string
    /// hashing randomly per process; using it would rotate every custom
    /// provider's data-store partition on each launch and silently drop the
    /// user's logged-in session.
    static func deterministicUUID(for id: String) -> String {
        switch id {
        case "chatgpt":    return "A1B2C3D4-0001-4000-8000-000000000001"
        case "claude":     return "A1B2C3D4-0002-4000-8000-000000000002"
        case "gemini":     return "A1B2C3D4-0003-4000-8000-000000000003"
        case "perplexity": return "A1B2C3D4-0004-4000-8000-000000000004"
        case "grok":       return "A1B2C3D4-0005-4000-8000-000000000005"
        default:
            var hash: UInt64 = 0xcbf2_9ce4_8422_2325
            for byte in id.utf8 {
                hash ^= UInt64(byte)
                hash = hash &* 0x0000_0100_0000_01b3
            }
            return String(format: "A1B2C3D4-0099-4000-8000-%012llx", hash & 0x0000_FFFF_FFFF_FFFF)
        }
    }
}

// MARK: - Catalogue

enum Catalogue {
    static let defaults: [AIServiceItem] = [
        AIServiceItem(
            id: "chatgpt", name: "ChatGPT", urlString: "https://chatgpt.com",
            displayDomain: "chatgpt.com", colorHex: "#10A37F",
            iconSymbol: "bubble.left.and.bubble.right.fill", isDefault: true),
        AIServiceItem(
            id: "claude", name: "Claude", urlString: "https://claude.ai",
            displayDomain: "claude.ai", colorHex: "#DA7756",
            iconSymbol: "sparkles", isDefault: true),
        AIServiceItem(
            id: "gemini", name: "Google Gemini", urlString: "https://gemini.google.com",
            displayDomain: "gemini.google.com", colorHex: "#3B82F6",
            iconSymbol: "star.fill", isDefault: true),
        AIServiceItem(
            id: "perplexity", name: "Perplexity", urlString: "https://www.perplexity.ai",
            displayDomain: "perplexity.ai", colorHex: "#22C55E",
            iconSymbol: "magnifyingglass", isDefault: true),
        AIServiceItem(
            id: "grok", name: "Grok", urlString: "https://grok.com",
            displayDomain: "grok.com", colorHex: "#E5E7EB",
            iconSymbol: "bolt.fill", isDefault: true),
    ]

    /// One-tap adds offered in the "Add Service" sheet, mirroring the web app's
    /// POPULAR_PRESETS list.
    struct Preset: Identifiable, Hashable {
        let id: String
        let name: String
        let urlString: String
        let displayDomain: String
        let colorHex: String
        let iconSymbol: String
    }

    static let presets: [Preset] = [
        Preset(id: "deepseek", name: "DeepSeek", urlString: "https://chat.deepseek.com",
               displayDomain: "chat.deepseek.com", colorHex: "#0284C7",
               iconSymbol: "brain.head.profile"),
        Preset(id: "mistral", name: "Mistral Le Chat", urlString: "https://chat.mistral.ai",
               displayDomain: "chat.mistral.ai", colorHex: "#F97316",
               iconSymbol: "flame.fill"),
        Preset(id: "copilot", name: "Microsoft Copilot", urlString: "https://copilot.microsoft.com",
               displayDomain: "copilot.microsoft.com", colorHex: "#0EA5E9",
               iconSymbol: "cpu"),
        Preset(id: "notebooklm", name: "NotebookLM", urlString: "https://notebooklm.google.com",
               displayDomain: "notebooklm.google.com", colorHex: "#8B5CF6",
               iconSymbol: "book.fill"),
        Preset(id: "poe", name: "Poe", urlString: "https://poe.com",
               displayDomain: "poe.com", colorHex: "#EC4899",
               iconSymbol: "text.bubble.fill"),
        Preset(id: "v0", name: "v0 by Vercel", urlString: "https://v0.dev",
               displayDomain: "v0.dev", colorHex: "#FFFFFF",
               iconSymbol: "chevron.left.forwardslash.chevron.right"),
    ]

    /// SF Symbols offered when adding a custom provider.
    static let iconChoices: [String] = [
        "sparkle", "bubble.left.and.bubble.right.fill", "sparkles", "star.fill",
        "bolt.fill", "magnifyingglass", "brain.head.profile", "flame.fill",
        "cpu", "book.fill", "text.bubble.fill", "wand.and.stars",
        "lightbulb.fill", "globe", "cube.fill", "atom",
    ]

    /// Swatches offered when adding a custom provider.
    static let colorChoices: [String] = [
        "#10A37F", "#DA7756", "#3B82F6", "#22C55E", "#E5E7EB", "#8B5CF6",
        "#F97316", "#EC4899", "#0EA5E9", "#FACC15", "#EF4444", "#14B8A6",
    ]
}
