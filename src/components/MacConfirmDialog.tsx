import React from 'react';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface MacConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: 'warning' | 'info' | 'help';
}

export const MacConfirmDialog: React.FC<MacConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  icon = 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-sm bg-[#1E1E22] border border-white/[0.14] rounded-2xl shadow-2xl p-5 text-neutral-200 animate-in zoom-in-95 duration-100 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive 
              ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
              : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
          }`}>
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : icon === 'info' ? (
              <Info className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* macOS Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm transition-all ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
