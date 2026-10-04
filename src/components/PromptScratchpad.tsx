import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import { AIService } from '../types/service';

interface PromptScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onChangeContent: (text: string) => void;
  activeService: AIService;
  onOpenDedicatedWindow: (service: AIService) => void;
}

const TEMPLATES = [
  {
    label: 'Deep Critique',
    text: 'Analyze the following text objectively. Point out logical flaws, unexamined assumptions, and areas that can be made significantly more rigorous and clear:\n\n'
  },
  {
    label: 'Code Refactor',
    text: 'Please review and refactor the following code for clarity, performance, and best practices. Explain the architectural tradeoffs made:\n\n'
  },
  {
    label: 'Executive Summary',
    text: 'Provide a structured executive briefing of the following material. Highlight key takeaways, critical risks, and actionable recommendations in bullet points:\n\n'
  },
  {
    label: 'Multi-Perspective',
    text: 'Explore this problem from 3 distinct expert perspectives (Engineering, Product Strategy, and End User). Synthesize the best compromise solution:\n\n'
  }
];

export const PromptScratchpad: React.FC<PromptScratchpadProps> = ({
  isOpen,
  onClose,
  content,
  onChangeContent,
  activeService,
  onOpenDedicatedWindow,
}) => {
  const [copied, setCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyTemplate = (templateText: string) => {
    onChangeContent(templateText);
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 z-40 w-96 bg-[#18181B]/95 backdrop-blur-2xl border-l border-white/[0.1] shadow-2xl flex flex-col text-neutral-200 animate-in slide-in-from-right duration-200"
    >
      {/* Scratchpad Header */}
      <div className="h-11 px-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Prompt Scratchpad</span>
          <span className="text-[10px] font-mono text-neutral-500">⌘P</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Textarea */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <p className="text-[11px] text-neutral-400 mb-2">
          Draft your prompt once here, copy with 1 click, and send to {activeService.name} or compare across models.
        </p>

        <textarea
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Draft your query, context, or code here..."
          className="flex-1 w-full bg-[#121214] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed transition-colors"
        />

        {/* Character & Word count + Clear confirm */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-2 px-1">
          <span>{content.length} characters · {content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
          {content.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-neutral-400">Clear?</span>
                <button
                  type="button"
                  onClick={() => {
                    onChangeContent('');
                    setShowClearConfirm(false);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-neutral-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )
          )}
        </div>

        {/* Quick Templates */}
        <div className="mt-3">
          <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider block mb-1.5">
            Quick Templates
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tmpl.text)}
                className="px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-left text-[11px] text-neutral-300 hover:text-white truncate transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/[0.08] bg-[#141416] flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!content.trim()}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            copied
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white/[0.1] hover:bg-white/[0.18] text-white disabled:opacity-40 disabled:pointer-events-none'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>

        <a
          href={activeService.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCopy}
          title={`Copy prompt and focus ${activeService.name}`}
          className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <span>Open {activeService.name}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
