import React, { useState } from 'react';
import { 
  X, 
  Laptop, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Apple, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import appIconImg from '../assets/images/ai_hub_app_icon_1790529438612.jpg';

interface DesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'electron' | 'tauri'>('pwa');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const electronCommand = `# 1. Install Electron in project
npm install --save-dev electron

# 2. Launch AI Hub as a native Mac window
npx electron electron-main.cjs

# 3. Optional: Package into a macOS .app or .dmg
npx electron-builder --mac`;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#1A1A1E] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={appIconImg} 
              alt="AI Hub" 
              className="w-8 h-8 rounded-xl shadow-md border border-white/[0.1] object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Run AI Hub as a Mac Desktop App</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  macOS Native
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Turn AI Hub into an installed Mac app in your Dock with persistent isolated sessions
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-6 bg-[#161619] gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pwa'
                ? 'border-cyan-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>macOS Web App (Instant / Zero Install)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('electron')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'electron'
                ? 'border-cyan-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Electron Native Wrapper (Bypasses all CSP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tauri')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'tauri'
                ? 'border-cyan-400 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Tauri / Rust App</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'pwa' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-neutral-200">
                <h3 className="font-semibold text-cyan-300 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Easiest Method: Add to macOS Dock (Safari or Chrome)
                </h3>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  macOS supports installing web apps directly to your Mac Dock as independent desktop applications.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">1</span>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">In Safari (macOS Sonoma / Sequoia):</h4>
                    <p className="text-neutral-400 text-[11px]">
                      Click <strong className="text-neutral-200">File</strong> in the macOS menu bar → select <strong className="text-neutral-200">Add to Dock...</strong> → click Add.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">2</span>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">In Chrome, Brave, or Edge:</h4>
                    <p className="text-neutral-400 text-[11px]">
                      Click the <strong className="text-neutral-200">Install AI Hub</strong> icon in the address bar (or Menu → Save and Share → Install page as app).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">3</span>
                  <div>
                    <h4 className="font-medium text-white mb-0.5">Result:</h4>
                    <p className="text-neutral-400 text-[11px]">
                      AI Hub opens in its own window without browser tabs or address bars, maintains its own window position, and shows the custom AI Hub icon in your Mac Dock!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-4 text-xs">
              <p className="text-neutral-300 text-xs">
                AI Hub already includes the complete <code className="text-cyan-300 font-mono">electron-main.cjs</code> entry point in the repository. Running it with Electron creates a true macOS desktop window with partitioned webviews:
              </p>

              <div className="relative">
                <pre className="bg-[#101013] border border-white/[0.1] rounded-xl p-3.5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  {electronCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(electronCommand, 'electron')}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/[0.1] hover:bg-white/[0.2] text-xs text-neutral-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode === 'electron' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-neutral-400 text-[11px] space-y-1">
                <p className="font-semibold text-neutral-200">How Electron handles sessions:</p>
                <p>• Uses <code className="text-cyan-400">partition: "persist:chatgpt"</code> and separate partitions per provider.</p>
                <p>• Cookies and logins are stored permanently in macOS Application Support.</p>
                <p>• Zero CSP or X-Frame-Options blocking.</p>
              </div>
            </div>
          )}

          {activeTab === 'tauri' && (
            <div className="space-y-4 text-xs">
              <p className="text-neutral-300 text-xs">
                For a lightweight native Swift/Rust app with native macOS WKWebView:
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <h4 className="font-medium text-white">Tauri 2.0 Setup</h4>
                <p className="text-neutral-400 text-[11px]">
                  1. Run <code className="text-cyan-300 font-mono">npx @tauri-apps/cli init</code><br />
                  2. Set web dev URL to <code className="text-cyan-300 font-mono">http://localhost:3000</code><br />
                  3. Run <code className="text-cyan-300 font-mono">cargo tauri build</code> to produce a native 15MB Mac <code className="text-cyan-300 font-mono">.dmg</code> file!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141416] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% private, no backend telemetry, local-first storage</span>
          </div>
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
