import React from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  Info,
  Cookie,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AIService } from '../types/service';
import { ServiceIcon } from './ServiceIcon';

interface LoginSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: AIService[];
  activeService: AIService;
  onSelectService: (id: string) => void;
  onOpenInBrowser: (service: AIService) => void;
}

export const LoginSessionModal: React.FC<LoginSessionModalProps> = ({
  isOpen,
  onClose,
  services,
  activeService,
  onSelectService,
  onOpenInBrowser,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#18181C] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Login & Session Capabilities</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                  Isolated Sessions Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Log into your personal accounts directly with OpenAI, Anthropic, Google, Perplexity, and xAI
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Executive Overview Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-medium text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Full Consumer Account Logins Supported (Free & Paid Tiers)</span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              <strong>Yes, login is 100% supported!</strong> You log in using your regular personal credentials (Google Sign-In, Apple ID, Microsoft, or Email/Password) directly with each provider. No API keys are required.
            </p>
          </div>

          {/* Session Isolation Guarantee */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cookie className="w-3.5 h-3.5 text-cyan-400" />
              Session & Cookie Isolation Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Independent Cookies
                </span>
                <p className="text-[11px] text-neutral-400">
                  Each provider runs in its own sandboxed frame, and cookies are isolated by origin. One provider's session is never visible to another.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  Zero Credentials Stored
                </span>
                <p className="text-[11px] text-neutral-400">
                  AI Hub collects no telemetry of its own. Logins happen directly with the provider's website, and your chat history stays in local storage. Chat prompts are sent to Google's Gemini API to generate replies.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-purple-400" />
                  Persistent State
                </span>
                <p className="text-[11px] text-neutral-400">
                  Once logged into a service, switching between sidebar items maintains your session without needing to re-login.
                </p>
              </div>
            </div>
          </div>

          {/* Service-by-Service Quick Login & Launch Portals */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-2.5">
              Current Configured Services & Direct Login Portals
            </h3>
            <div className="space-y-2">
              {services.map((service) => {
                const isCurrent = service.id === activeService.id;
                return (
                  <div
                    key={service.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isCurrent
                        ? 'bg-white/[0.08] border-cyan-500/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${service.color}25` }}
                      >
                        <ServiceIcon iconKey={service.iconKey} color={service.color} size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{service.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">({service.displayUrl})</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectService(service.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 text-xs font-medium transition-colors"
                      >
                        Switch To
                      </button>

                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                      >
                        <span>Open & Log In</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser IFrame Security & Native macOS Note */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-neutral-300 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>How Web Browsers Handle Cross-Origin Iframes vs Native Mac App</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Some consumer websites (like Google Accounts or ChatGPT login) deploy <code className="text-amber-300 font-mono">X-Frame-Options: DENY</code> to prevent third parties from phishing them in frames. 
              In the web container and Electron builds, click <strong>"Open & Log In"</strong> to authenticate in a tab/window when a site refuses to load in a frame; cookies are retained afterwards.
              The native SwiftUI build loads each site directly in its own WKWebView, so it has no framing restrictions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141417] flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            AI Hub Personal Container · No telemetry of its own · Chat prompts go to Google Gemini
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
