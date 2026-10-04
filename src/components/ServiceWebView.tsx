import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  RotateCw, 
  ShieldCheck, 
  ArrowUpRight,
  LogIn,
  Eye
} from 'lucide-react';
import { AIService } from '../types/service';
import { ServiceIcon } from './ServiceIcon';

interface ServiceWebViewProps {
  service: AIService;
  isActive: boolean;
  onOpenInBrowser: (service: AIService) => void;
  onOpenDedicatedWindow: (service: AIService) => void;
  onOpenLoginModal?: () => void;
  reloadKey: number;
}

export const ServiceWebView: React.FC<ServiceWebViewProps> = ({
  service,
  isActive,
  onOpenInBrowser,
  onOpenDedicatedWindow,
  onOpenLoginModal,
  reloadKey,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewModeState, setViewModeState] = useState<'frame' | 'portal'>('frame');

  useEffect(() => {
    if (isActive) {
      setIframeKey(k => k + 1);
    }
  }, [reloadKey]);

  // Specific official login URLs
  const getLoginUrl = (srv: AIService): string => {
    switch (srv.id) {
      case 'chatgpt': return 'https://chatgpt.com/auth/login';
      case 'claude': return 'https://claude.ai/login';
      case 'gemini': return 'https://gemini.google.com';
      case 'perplexity': return 'https://www.perplexity.ai';
      case 'grok': return 'https://grok.com';
      default: return srv.url;
    }
  };

  return (
    <div 
      className={`absolute inset-0 flex flex-col bg-[#0F0F11] ${
        isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* Service Sub-header / Status Toolbar */}
      <div className="h-9 bg-[#161619] border-b border-white/[0.06] flex items-center justify-between px-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${service.color}25` }}
          >
            <ServiceIcon iconKey={service.iconKey} color={service.color} size={12} />
          </div>
          <span className="font-medium text-neutral-200 truncate">{service.name}</span>
          <span className="text-neutral-500 font-mono text-[11px] truncate hidden md:inline">
            {service.url}
          </span>
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
            title="Click to view Login & Session Isolation Details"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Login Supported</span>
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewModeState(v => v === 'frame' ? 'portal' : 'frame')}
            title="Toggle between in-app frame and session launch card"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 transition-colors text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{viewModeState === 'frame' ? 'Card' : 'Frame'}</span>
          </button>

          <a
            href={getLoginUrl(service)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official login portal in browser"
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white transition-all text-xs font-medium border border-white/[0.08]"
          >
            <LogIn className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Sign In</span>
          </a>

          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in default browser (⌘O)"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 transition-colors text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Browser</span>
          </a>

          <button
            type="button"
            onClick={() => setIframeKey(k => k + 1)}
            title="Reload frame (⌘R)"
            className="p-1 rounded hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full h-full bg-[#0C0C0E] overflow-hidden">
        {viewModeState === 'frame' ? (
          <>
            {/* The Sandboxed IFrame */}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={service.url}
              title={service.name}
              className="w-full h-full border-0 bg-transparent"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
              allow="clipboard-read; clipboard-write; microphone; camera; display-capture; autoplay; encrypted-media"
              referrerPolicy="no-referrer"
            />

            {/* Quick Session & Login Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-xl w-[calc(100%-2rem)] bg-[#1A1A1E]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl p-3 shadow-2xl flex items-center justify-between gap-3 text-xs z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${service.color}25` }}
                >
                  <ServiceIcon iconKey={service.iconKey} color={service.color} size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-100">{service.name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      Isolated Cookies
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    Log in with your existing account. If browser security blocks iframe embedding, click Sign In below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getLoginUrl(service)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In / Launch</span>
                </a>
              </div>
            </div>
          </>
        ) : (
          /* Native Mac Style Session Portal Card */
          <div className="h-full flex items-center justify-center p-6 bg-[#0D0D10]">
            <div className="max-w-md w-full bg-[#18181C] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4 text-center">
              <div 
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-white/[0.1]"
                style={{ backgroundColor: `${service.color}20` }}
              >
                <ServiceIcon iconKey={service.iconKey} color={service.color} size={30} />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">{service.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 font-mono">{service.displayUrl}</p>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{service.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Account Type:</span>
                  <span className="text-neutral-200 font-medium">Free, Plus, Pro, or Team</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Auth Providers:</span>
                  <span className="text-neutral-200 font-medium">Google, Apple, Microsoft, Email</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Session Security:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Strict Origin Partition
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={getLoginUrl(service)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log Into {service.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setViewModeState('frame')}
                  className="w-full py-2 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white font-medium text-xs transition-colors"
                >
                  Switch to In-App Webview Frame
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
