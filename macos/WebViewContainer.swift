//
//  WebViewContainer.swift
//  AI Hub - Personal Mac Desktop AI Launcher
//  Native Apple macOS WebKit Container with Isolated Data Stores
//

import SwiftUI
import WebKit

struct WebViewContainer: NSViewRepresentable {
    let service: AIServiceItem
    @EnvironmentObject var model: AIHubViewModel
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        
        // Critical: Provide isolated, persistent WKWebsiteDataStore per AI service
        // This ensures ChatGPT, Claude, Gemini, etc. never share cookies or storage
        if #available(macOS 14.0, *) {
            config.websiteDataStore = WKWebsiteDataStore(forIdentifier: service.storeUUID)
        } else {
            config.websiteDataStore = .default()
        }
        
        // Optimize WebKit preferences for macOS desktop
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs
        
        // Desktop Safari User Agent so AI websites provide their full macOS desktop interface
        config.applicationNameForUserAgent = "Version/17.5 Safari/605.1.15 AIHub/1.0"

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        
        // Transparent dark background
        webView.setValue(false, forKey: "drawsBackground")

        // Load initial service request
        var request = URLRequest(url: service.url)
        request.cachePolicy = .useProtocolCachePolicy
        webView.load(request)
        
        DispatchQueue.main.async {
            model.activeWebView = webView
        }

        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        // If service URL changed, load new request
        if nsView.url != service.url && nsView.url?.host != service.url.host {
            nsView.load(URLRequest(url: service.url))
        }
        
        if model.selectedServiceId == service.id {
            DispatchQueue.main.async {
                model.activeWebView = nsView
            }
        }
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebViewContainer

        init(_ parent: WebViewContainer) {
            self.parent = parent
        }

        // Handle target="_blank" and login popups within same webview or external browser
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                // If it is an OAuth login link or external link, open in current webview or Safari
                if let url = navigationAction.request.url {
                    // If login popup for Google/Apple/OAuth, navigate within current webview
                    if url.host?.contains("accounts.google.com") == true ||
                       url.host?.contains("appleid.apple.com") == true ||
                       url.host?.contains("auth0.com") == true {
                        webView.load(navigationAction.request)
                    } else {
                        NSWorkspace.shared.open(url)
                    }
                }
            }
            return nil
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Page finished loading
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            // Handle loading error gracefully
        }
    }
}
