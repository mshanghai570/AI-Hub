import React, { useState } from 'react';
import { 
  X, 
  Apple, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileCode
} from 'lucide-react';

interface NativeSwiftViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SWIFT_FILES = [
  {
    name: 'AIHubApp.swift',
    title: 'Main App Entry & Menu Commands',
    code: `//
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
            CommandGroup(replacing: .newItem) {
                Button("Add AI Service...") {
                    model.isShowingAddServiceSheet = true
                }.keyboardShortcut("n", modifiers: [.command])

                Button("Quick Switcher / Spotlight...") {
                    model.isShowingCommandPalette = true
                }.keyboardShortcut("k", modifiers: [.command])
            }
            CommandMenu("Services") {
                ForEach(Array(model.services.prefix(9).enumerated()), id: \\.element.id) { idx, s in
                    Button(s.name) { model.selectService(s) }
                        .keyboardShortcut(KeyEquivalent(Character(UnicodeScalar(0x31 + idx)!)), modifiers: [.command])
                }
            }
        }
    }
}`
  },
  {
    name: 'WebViewContainer.swift',
    title: 'Isolated WKWebsiteDataStore Partitioning',
    code: `//
//  WebViewContainer.swift
//  WKWebView with dedicated WKWebsiteDataStore per AI service
//

import SwiftUI
import WebKit

struct WebViewContainer: NSViewRepresentable {
    let service: AIServiceItem
    @EnvironmentObject var model: AIHubViewModel

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Core Requirement: Partition cookie jars so ChatGPT, Claude, and Gemini never share data
        if #available(macOS 14.0, *) {
            config.websiteDataStore = WKWebsiteDataStore(forIdentifier: service.storeUUID)
        } else {
            config.websiteDataStore = .default()
        }

        config.applicationNameForUserAgent = "Version/17.5 Safari/605.1.15 AIHub/1.0"

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.load(URLRequest(url: service.url))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}`
  },
  {
    name: 'AIHubViewModel.swift',
    title: 'State & Session Partition Management',
    code: `//
//  AIHubViewModel.swift
//

import SwiftUI
import WebKit

struct AIServiceItem: Identifiable, Codable {
    let id: String
    var name: String
    var urlString: String
    var displayDomain: String
    var colorHex: String
    var iconSymbol: String
    var isDefault: Bool
    
    var url: URL { URL(string: urlString)! }
    var storeUUID: UUID {
        // Deterministic UUID for permanent isolated cookie store
        switch id {
        case "chatgpt": return UUID(uuidString: "A1B2C3D4-0001-4000-8000-000000000001")!
        case "claude": return UUID(uuidString: "A1B2C3D4-0002-4000-8000-000000000002")!
        case "gemini": return UUID(uuidString: "A1B2C3D4-0003-4000-8000-000000000003")!
        case "perplexity": return UUID(uuidString: "A1B2C3D4-0004-4000-8000-000000000004")!
        default: return UUID()
        }
    }
}`
  }
];

export const NativeSwiftViewerModal: React.FC<NativeSwiftViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = SWIFT_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-[#1A1A1E] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/[0.1] flex items-center justify-center text-white shadow-sm">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Apple Senior Developer · Native macOS Swift Code</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 font-mono">
                  SwiftUI + WebKit
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                True native macOS architecture with WKWebsiteDataStore persistent partitioned cookies
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] px-6 bg-[#161619] gap-2 overflow-x-auto py-2">
          {SWIFT_FILES.map((file, idx) => (
            <button
              key={file.name}
              type="button"
              onClick={() => setSelectedFileIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                selectedFileIndex === idx
                  ? 'bg-white/[0.14] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-300">
              {currentFile.title}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Swift Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 bg-[#101013] border border-white/[0.08] rounded-xl p-4 font-mono text-[11px] text-cyan-300 overflow-y-auto leading-relaxed select-text">
            {currentFile.code}
          </pre>

          <div className="mt-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-neutral-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-medium">Apple WebKit Isolation Note:</strong> In macOS 14+,{' '}
              <code className="text-cyan-300 font-mono">WKWebsiteDataStore(forIdentifier: UUID)</code> gives each AI provider its own sandboxed cookies, localStorage, and caches directly on your Mac SSD.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#141417] flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            Location: /macos/{currentFile.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
