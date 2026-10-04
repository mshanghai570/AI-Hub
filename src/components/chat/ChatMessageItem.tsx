import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Bot, 
  User, 
  FileCode, 
  Plug, 
  ChevronDown, 
  ChevronRight,
  Terminal
} from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { CHAT_MODELS } from './ChatGPTHeader';
import { BACKEND_MODEL, PERSONA_NOTE } from '../../constants/chatBackend';

const personaName = (id?: string): string =>
  CHAT_MODELS.find(m => m.id === id)?.name || 'Assistant';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isToolDetailsOpen, setIsToolDetailsOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown & Code block renderer
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // A language tag only counts when the fence declares one on its own
        // line (```ts\ncode\n```). A one-line ```code``` block is just code.
        const body = part.slice(3, -3);
        const match = body.match(/^(?:[ \t]*([A-Za-z0-9_+#.-]{1,20}))?\n([\s\S]*)$/);
        const language = match && match[1] ? match[1] : 'code';
        const codeContent = match ? match[2].replace(/\n$/, '') : body;

        return (
          <div key={index} className="my-3 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#141414] shadow-lg">
            {/* Code Block Titlebar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1F1F1F] border-b border-white/[0.08] text-xs select-none">
              <span className="font-mono text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
                {language}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(codeContent)}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy code'}</span>
              </button>
            </div>
            {/* Code Body */}
            <pre className="p-4 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed select-text">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Format bold, italics, bullets, headers
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-sm">
          {part}
        </div>
      );
    });
  };

  return (
    <div className={`py-5 px-4 md:px-6 flex justify-center ${isUser ? '' : 'bg-[#1e1e1e]/40'}`}>
      <div className="w-full max-w-3xl flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* User Name & Model Tag */}
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 select-none">
            <span>{isUser ? 'You' : (personaName(message.model))}</span>
            {!isUser && (
              <span className="text-[10px] font-mono font-normal text-neutral-500" title={PERSONA_NOTE}>
                {BACKEND_MODEL}
              </span>
            )}
            {!isUser && message.pluginsUsed && message.pluginsUsed.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25"
                  title="Connector tool names were sent to the model. No tools were executed."
                >
                  <Plug className="w-3 h-3" />
                  {message.pluginsUsed.length} tools shared (simulated)
                </div>
            )}
          </div>

          {/* Attached Photos & Files Grid (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {/* Photo Attachments Grid (only images still carrying inline data) */}
              {message.attachments.some(a => a.isImage && (a.previewUrl || a.data)) && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {message.attachments.filter(a => a.isImage && (a.previewUrl || a.data)).map((imgAtt) => (
                    <div 
                      key={imgAtt.id}
                      onClick={() => setSelectedPhoto(imgAtt.previewUrl || imgAtt.data)}
                      className="group relative rounded-2xl overflow-hidden border border-white/[0.12] cursor-pointer hover:border-cyan-400 transition-all shadow-md"
                    >
                      <img
                        src={imgAtt.previewUrl || imgAtt.data}
                        alt={imgAtt.name}
                        className="w-36 h-36 object-cover bg-black/40 group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white truncate font-medium">
                        {imgAtt.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Code / Document Attachments Chips (plus images whose payload wasn't persisted) */}
              {message.attachments.some(a => !a.isImage || (!a.previewUrl && !a.data)) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {message.attachments.filter(a => !a.isImage || (!a.previewUrl && !a.data)).map((fileAtt) => (
                    <div
                      key={fileAtt.id}
                      className="flex items-center gap-2 p-2 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-200 max-w-sm"
                    >
                      <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{fileAtt.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {(fileAtt.size / 1024).toFixed(1)} KB · {fileAtt.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assistant Tool Execution Badge (MCP) */}
          {!isUser && message.pluginsUsed && message.pluginsUsed.length > 0 && (
            <div className="border border-purple-500/20 bg-purple-950/20 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsToolDetailsOpen(!isToolDetailsOpen)}
                className="w-full flex items-center justify-between p-2 px-3 text-purple-300 hover:text-purple-200 font-medium text-left"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Simulated MCP Tools (not executed)</span>
                </div>
                {isToolDetailsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isToolDetailsOpen && (
                <div className="p-3 pt-0 border-t border-purple-500/10 font-mono text-[11px] text-neutral-300 space-y-1">
                  {message.pluginsUsed.map(tool => (
                    <div key={tool} className="flex items-center gap-1.5 text-neutral-300">
                      <Check className="w-3 h-3 text-neutral-500" />
                      <span>Shared with model: <strong>{tool}</strong></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Text Message Content */}
          <div className="text-neutral-200">
            {renderFormattedContent(message.content)}
          </div>

          {/* Bottom Action Bar (Assistant message) */}
          {!isUser && (
            <div className="flex items-center gap-2 pt-1 text-neutral-400 select-none">
              <button
                type="button"
                onClick={() => handleCopy(message.content)}
                title="Copy Response"
                className="p-1 rounded-lg hover:text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for Photos */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Enlarged preview"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
