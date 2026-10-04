//
//  WebEngine.swift
//  AI Hub — iOS
//
//  One WebEngine per provider. Each owns a WKWebView backed by its own
//  WKWebsiteDataStore partition, so ChatGPT, Claude, Gemini and friends never
//  share cookies, localStorage or credentials.
//

import Combine
import UIKit
import WebKit

final class WebEngine: NSObject, ObservableObject {

    let service: AIServiceItem
    let webView: WKWebView

    @Published private(set) var canGoBack = false
    @Published private(set) var canGoForward = false
    @Published private(set) var isLoading = false
    @Published private(set) var progress: Double = 0
    @Published private(set) var pageTitle = ""
    @Published private(set) var loadError: String?

    private var cancellables = Set<AnyCancellable>()

    /// Hosts that are part of an interactive sign-in flow. A `target="_blank"`
    /// link to one of these is followed inside the pane so the OAuth round-trip
    /// finishes in the same cookie partition; anything else leaves the app.
    private static let inAppAuthHosts = [
        "accounts.google.com",
        "appleid.apple.com",
        "login.microsoftonline.com",
        "auth0.com",
        "okta.com",
        "github.com",
        "openai.com",
        "anthropic.com",
    ]

    init(service: AIServiceItem) {
        self.service = service

        let configuration = WKWebViewConfiguration()

        // The whole point of this app: a persistent, isolated data store per
        // provider. `forIdentifier:` is iOS 17+, so the deployment target
        // guarantees availability and no runtime check is needed.
        configuration.websiteDataStore = WKWebsiteDataStore(forIdentifier: service.storeUUID)

        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        // Note: no custom user agent is set. WebKit's default identifies as
        // mobile Safari, which is what these sites expect; forging a desktop UA
        // makes them serve a desktop layout that is unusable on a phone.

        self.webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()

        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = true
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black

        bindWebViewState()
        loadInitialPage()
    }

    // MARK: - State observation

    /// Mirrors WKWebView's KVO-observable properties into @Published state so
    /// SwiftUI can drive the address bar. `.receive(on: RunLoop.main)` keeps the
    /// writes on the main thread regardless of which queue WebKit notifies on.
    private func bindWebViewState() {
        webView.publisher(for: \.canGoBack)
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.canGoBack = $0 }
            .store(in: &cancellables)

        webView.publisher(for: \.canGoForward)
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.canGoForward = $0 }
            .store(in: &cancellables)

        webView.publisher(for: \.isLoading)
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.isLoading = $0 }
            .store(in: &cancellables)

        webView.publisher(for: \.estimatedProgress)
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.progress = $0 }
            .store(in: &cancellables)

        webView.publisher(for: \.title)
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.pageTitle = $0 ?? "" }
            .store(in: &cancellables)
    }

    // MARK: - Actions

    func loadInitialPage() {
        guard webView.url == nil else { return }
        webView.load(URLRequest(url: service.url, cachePolicy: .useProtocolCachePolicy))
    }

    func goBack() {
        if webView.canGoBack { webView.goBack() }
    }

    func goForward() {
        if webView.canGoForward { webView.goForward() }
    }

    func reload() {
        if webView.url == nil {
            loadInitialPage()
        } else {
            webView.reload()
        }
    }

    func stopLoading() {
        webView.stopLoading()
    }

    /// Wipes this provider's cookies, caches and storage, then returns to its
    /// home page. Because the partition is per-provider, this is a targeted
    /// "sign out of this one" rather than a global reset.
    func clearSessionData() {
        let store = webView.configuration.websiteDataStore
        store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                         modifiedSince: .distantPast) { [weak self] in
            DispatchQueue.main.async {
                guard let self else { return }
                self.webView.load(URLRequest(url: self.service.url))
            }
        }
    }

    /// Erases a provider's partition without instantiating a web view for it.
    /// Settings needs this to sign out of providers the user has not opened
    /// during the current launch and which therefore have no live engine.
    /// The store is captured by the completion handler so it outlives the call.
    static func purgeStoredData(for service: AIServiceItem) {
        let store = WKWebsiteDataStore(forIdentifier: service.storeUUID)
        store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                         modifiedSince: .distantPast) {
            _ = store
        }
    }

    // MARK: - Helpers

    private static func isAuthHost(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return inAppAuthHosts.contains { host == $0 || host.hasSuffix("." + $0) }
    }

    private var presentedViewController: UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }

        var controller = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
        while let presented = controller?.presentedViewController {
            controller = presented
        }
        return controller
    }
}

// MARK: - WKNavigationDelegate

extension WebEngine: WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else {
            decisionHandler(.allow)
            return
        }

        // WebKit handles these natively; every other scheme (mailto:, tel:,
        // itms-apps:, custom provider schemes) belongs to the OS.
        let webSchemes: Set<String> = ["http", "https", "about", "blob", "data", "javascript", "file"]
        if webSchemes.contains(scheme) {
            decisionHandler(.allow)
        } else {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        loadError = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loadError = nil
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        record(error)
    }

    func webView(_ webView: WKWebView,
                 didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        record(error)
    }

    /// WebKit kills its content process under memory pressure on iOS far more
    /// readily than on macOS. Without this the pane just goes blank forever.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        loadError = "This provider's web content was reloaded to free up memory."
        webView.reload()
    }

    private func record(_ error: Error) {
        // -999 is "cancelled", which fires constantly during normal navigation.
        let nsError = error as NSError
        guard !(nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled) else { return }
        loadError = nsError.localizedDescription
    }
}

// MARK: - WKUIDelegate

extension WebEngine: WKUIDelegate {

    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = navigationAction.request.url else { return nil }

        if Self.isAuthHost(url) {
            // Sign-in flows must stay in this partition so the callback lands
            // on a cookie jar this provider can actually see.
            webView.load(navigationAction.request)
        } else {
            UIApplication.shared.open(url)
        }
        return nil
    }

    // Several providers still use blocking JS dialogs for confirmations. The
    // default WKWebView behaviour is to drop them silently, which looks like a
    // frozen button, so they are surfaced as native alerts.

    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: service.name, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        guard let presenter = presentedViewController else {
            completionHandler()
            return
        }
        presenter.present(alert, animated: true)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: service.name, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        guard let presenter = presentedViewController else {
            completionHandler(false)
            return
        }
        presenter.present(alert, animated: true)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: service.name, message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
        guard let presenter = presentedViewController else {
            completionHandler(nil)
            return
        }
        presenter.present(alert, animated: true)
    }
}
