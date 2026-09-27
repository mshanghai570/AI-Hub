import React from 'react';
import { X, Settings, ShieldCheck, Moon, Laptop, Palette, Terminal, KeyRound } from 'lucide-react';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllChats: () => void;
  onOpenLoginModal: () => void;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  onClearAllChats,
  onOpenLoginModal,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#1E1E22] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">ChatGPT & Codex Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Theme & Appearance */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-neutral-400" />
                Color Theme
              </span>
              <span className="text-[11px] font-mono text-cyan-300">Dark (Codex Obsidian)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Native high-contrast dark theme optimized for coding, photos, and long sessions.
            </p>
          </div>

          {/* Model Context Protocol Status */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                MCP Connectors & Plugins
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              GitHub, Local Filesystem, Code Interpreter, and Web Search are enabled.
            </p>
          </div>

          {/* Login & Consumer Sessions */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                Consumer AI Accounts
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenLoginModal();
                  onClose();
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
              >
                Manage Logins
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              Sessions for ChatGPT, Claude, Gemini, and Perplexity are partitioned and persistent.
            </p>
          </div>

          {/* Data Controls */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClearAllChats();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
            >
              Clear Conversation History
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#141416] flex justify-end">
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
