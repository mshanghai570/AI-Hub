import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ 1 - 9', desc: 'Switch between AI services (web container mode)' },
    { key: '⌘ K', desc: 'Open Command Palette & Quick Switcher' },
    { key: '⌘ N', desc: 'New chat / Add AI service' },
    { key: '⌘ D', desc: 'Toggle Dual Split View (side-by-side comparison)' },
    { key: '⌘ P', desc: 'Toggle Prompt Scratchpad drawer' },
    { key: '⌘ B', desc: 'Toggle Sidebar / History' },
    { key: '⌘ R', desc: 'Reload active service frame' },
    { key: '⌘ O', desc: 'Open active service in default browser' },
    { key: 'Esc', desc: 'Close modals / panels' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#18181B] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Mac Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto divide-y divide-white/[0.06] text-xs">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-neutral-300">{sc.desc}</span>
              <kbd className="font-mono text-[11px] text-cyan-300 bg-white/[0.08] border border-white/[0.08] px-2 py-0.5 rounded-md shrink-0 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#121214] text-center text-[11px] text-neutral-500">
          Tip: On Windows or Linux keyboards, substitute <kbd className="font-mono text-neutral-300">Ctrl</kbd> for <kbd className="font-mono text-neutral-300">⌘</kbd>.
        </div>
      </div>
    </div>
  );
};
