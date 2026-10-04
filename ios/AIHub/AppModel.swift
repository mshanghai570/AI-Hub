//
//  AppModel.swift
//  AI Hub — iOS
//
//  Owns the provider list, persisted preferences, and the live WebEngine per
//  provider. Engines are created lazily on first visit and then kept alive, so
//  switching providers never reloads a page or loses a half-typed prompt.
//

import Foundation
import SwiftUI

final class AppModel: ObservableObject {

    @Published var services: [AIServiceItem]
    @Published var activeServiceId: String
    @Published private(set) var mountedServiceIds: Set<String> = []

    @Published var isShowingPicker = false
    @Published var isShowingAddService = false
    @Published var isShowingScratchpad = false
    @Published var isShowingSettings = false

    /// Shown once, on first launch, to explain what makes this app different
    /// from just keeping five browser tabs open.
    @Published var isShowingWelcome: Bool {
        // Observers do not fire during init, so constructing the model does not
        // itself mark the guide as seen.
        didSet { defaults.set(true, forKey: Keys.hasSeenWelcome) }
    }

    /// Destructive actions are triggered from menus and swipe gestures that have
    /// nowhere to put an alert, so the request is parked here and `ContentView`
    /// presents the confirmation. Nothing is destroyed until the user confirms.
    @Published var pendingRemoval: AIServiceItem?
    @Published var pendingSignOut: AIServiceItem?

    @Published var scratchpadText: String {
        didSet { defaults.set(scratchpadText, forKey: Keys.scratchpad) }
    }

    private let defaults = UserDefaults.standard

    /// WebEngine instances, one per provider that has been visited. Deliberately
    /// not @Published: `mountedServiceIds` is what drives rendering, and it is
    /// always updated in the same turn as the engine is inserted.
    private var engines: [String: WebEngine] = [:]

    private enum Keys {
        static let services = "aihub_services"
        static let selectedService = "aihub_selected_service"
        static let scratchpad = "aihub_scratchpad"
        static let hasSeenWelcome = "aihub_has_seen_welcome"
    }

    init() {
        let stored = Self.loadServices(from: defaults)
        self.services = stored

        let savedId = defaults.string(forKey: Keys.selectedService)
        let resolvedId = stored.contains(where: { $0.id == savedId })
            ? savedId!
            : (stored.first?.id ?? "chatgpt")
        self.activeServiceId = resolvedId

        self.scratchpadText = defaults.string(forKey: Keys.scratchpad) ?? ""
        self.isShowingWelcome = !defaults.bool(forKey: Keys.hasSeenWelcome)

        // Create the first engine up front so the initial render has content.
        // Property observers do not fire during init, so persist explicitly.
        mount(resolvedId)
        defaults.set(resolvedId, forKey: Keys.selectedService)
    }

    // MARK: - Derived state

    var activeService: AIServiceItem {
        services.first { $0.id == activeServiceId } ?? services.first ?? Catalogue.defaults[0]
    }

    var activeEngine: WebEngine? { engines[activeServiceId] }

    func engine(for id: String) -> WebEngine? { engines[id] }

    var defaultServices: [AIServiceItem] { services.filter(\.isDefault) }
    var customServices: [AIServiceItem] { services.filter { !$0.isDefault } }

    /// Providers that deserve a pane, in catalogue order.
    var mountedServices: [AIServiceItem] {
        services.filter { mountedServiceIds.contains($0.id) }
    }

    // MARK: - Selection

    func select(_ service: AIServiceItem) {
        activeServiceId = service.id
        defaults.set(service.id, forKey: Keys.selectedService)
        mount(service.id)
    }

    /// Ensures a provider has an engine and a mounted pane. Safe to call often.
    func mount(_ id: String) {
        guard let service = services.first(where: { $0.id == id }) else { return }
        if engines[id] == nil {
            engines[id] = WebEngine(service: service)
        }
        // Publishing this is what triggers the pane to appear.
        if !mountedServiceIds.contains(id) {
            mountedServiceIds.insert(id)
        }
    }

    // MARK: - Mutations

    func addService(name: String, urlString: String, colorHex: String, iconSymbol: String) {
        guard let url = Self.normaliseURL(urlString) else { return }

        // Derive a readable domain for the address label.
        let domain = url.host ?? urlString
        let id = uniqueId(basedOn: domain)

        let service = AIServiceItem(
            id: id,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            urlString: url.absoluteString,
            displayDomain: domain,
            colorHex: colorHex,
            iconSymbol: iconSymbol,
            isDefault: false
        )

        services.append(service)
        saveServices()
        select(service)
    }

    func add(_ preset: Catalogue.Preset) {
        guard !services.contains(where: { $0.id == preset.id }) else { return }
        services.append(AIServiceItem(
            id: preset.id,
            name: preset.name,
            urlString: preset.urlString,
            displayDomain: preset.displayDomain,
            colorHex: preset.colorHex,
            iconSymbol: preset.iconSymbol,
            isDefault: false
        ))
        saveServices()
        select(services.last!)
    }

    func deleteService(_ service: AIServiceItem) {
        guard !service.isDefault else { return }

        // Removing a provider also signs it out: leaving credentials behind for
        // a provider the user can no longer see anywhere in the app would be a
        // privacy wart, and the confirmation dialog says so up front.
        WebEngine.purgeStoredData(for: service)

        services.removeAll { $0.id == service.id }
        mountedServiceIds.remove(service.id)
        engines[service.id] = nil
        saveServices()

        if activeServiceId == service.id {
            let fallback = services.first?.id ?? "chatgpt"
            activeServiceId = fallback
            defaults.set(fallback, forKey: Keys.selectedService)
            mount(fallback)
        }
    }

    /// Destroys the provider's on-disk store as well as its in-memory engine.
    /// `removeDataStoreForIdentifier` is required because merely dropping the
    /// engine would leave the partition's cookies behind on disk for a provider
    /// the user believes they removed.
    func forgetServiceData(_ service: AIServiceItem) {
        if let engine = engines[service.id] {
            engine.clearSessionData()
        } else {
            // Nothing mounted, but the partition is still on disk from an
            // earlier run — clearing it is the whole point of the action.
            WebEngine.purgeStoredData(for: service)
        }
    }

    func moveServices(fromOffsets: IndexSet, toOffset: Int) {
        services.move(fromOffsets: fromOffsets, toOffset: toOffset)
        saveServices()
    }

    /// True when the provider list has drifted from the shipped catalogue, which
    /// is when offering a reset is actually useful.
    var hasCustomProviders: Bool { services.contains { !$0.isDefault } }

    var providerCount: Int { services.count }

    /// Signs out of every provider at once. Providers opened during this launch
    /// are cleared through their live engine; the rest are cleared through their
    /// partition directly, which is the case that matters for a provider the
    /// user signed into in an earlier run and has not revisited since.
    func clearAllSessionData() {
        for service in services {
            if let engine = engines[service.id] {
                engine.clearSessionData()
            } else {
                WebEngine.purgeStoredData(for: service)
            }
        }
    }

    /// Returns the provider list to the shipped built-ins. Custom providers are
    /// dropped and their stored sessions are erased, so this is a real reset
    /// rather than just tidying the dock.
    func restoreDefaultProviders() {
        let stockIds = Set(Catalogue.defaults.map(\.id))
        let dropped = services.filter { !stockIds.contains($0.id) }

        for service in dropped {
            if let engine = engines[service.id] {
                engine.clearSessionData()
            } else {
                WebEngine.purgeStoredData(for: service)
            }
            engines[service.id] = nil
            mountedServiceIds.remove(service.id)
        }

        services = Catalogue.defaults
        saveServices()

        let fallback = Catalogue.defaults[0].id
        activeServiceId = fallback
        defaults.set(fallback, forKey: Keys.selectedService)
        mount(fallback)
    }

    // MARK: - Persistence

    private func saveServices() {
        guard let data = try? JSONEncoder().encode(services) else { return }
        defaults.set(data, forKey: Keys.services)
    }

    private static func loadServices(from defaults: UserDefaults) -> [AIServiceItem] {
        guard let data = defaults.data(forKey: Keys.services),
              let decoded = try? JSONDecoder().decode([AIServiceItem].self, from: data),
              !decoded.isEmpty
        else {
            return Catalogue.defaults
        }
        return decoded.sanitised()
    }

    private func uniqueId(basedOn domain: String) -> String {
        let slug = domain
            .lowercased()
            .replacingOccurrences(of: "www.", with: "")
            .replacingOccurrences(of: ".", with: "_")
        if !services.contains(where: { $0.id == slug }) { return slug }

        // Slug collision: keep the readable stem and disambiguate. The suffix
        // feeds the FNV hash, so a stable id still means a stable partition.
        var counter = 2
        while services.contains(where: { $0.id == "\(slug)_\(counter)" }) {
            counter += 1
        }
        return "\(slug)_\(counter)"
    }

    static func normaliseURL(_ raw: String) -> URL? {
        var text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }

        if !text.lowercased().hasPrefix("http://") && !text.lowercased().hasPrefix("https://") {
            text = "https://" + text
        }
        guard let url = URL(string: text), let host = url.host, host.contains(".") else {
            return nil
        }
        return url
    }
}

// MARK: - Stored-data sanitation

private extension Array where Element == AIServiceItem {
    /// Merges the shipped default providers into stored data: a user upgrading
    /// from an older build should pick up newly added built-ins without losing
    /// their custom entries.
    func sanitised() -> [AIServiceItem] {
        var result = self
        let existingIds = Set(result.map(\.id))
        for service in Catalogue.defaults where !existingIds.contains(service.id) {
            result.append(service)
        }
        return result
    }
}
