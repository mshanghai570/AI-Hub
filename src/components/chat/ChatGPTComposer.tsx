import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  FileCode, 
  Plug, 
  StopCircle
} from 'lucide-react';
import { Attachment, MCPConnector } from '../../types/chat';

interface ChatGPTComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  mcpConnectors: MCPConnector[];
  onToggleMCPConnector: (id: string) => void;
}

export const ChatGPTComposer: React.FC<ChatGPTComposerProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  mcpConnectors,
  onToggleMCPConnector,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          data: result,
          isImage,
          previewUrl: isImage ? result : undefined,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        // For text/code documents
        reader.readAsText(file);
      }
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) {
      onStopGeneration?.();
      return;
    }
    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* MCP Quick Plugins Bar */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-xs select-none">
        <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
          <Plug className="w-3 h-3 text-purple-400" />
          <span>MCP Tools:</span>
        </span>
        {mcpConnectors.map((connector) => {
          const isActive = connector.isConnected && connector.isEnabledForChat;
          return (
            <button
              key={connector.id}
              type="button"
              onClick={() => onToggleMCPConnector(connector.id)}
              title={`${connector.name} - ${connector.description}`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                isActive
                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-xs'
                  : 'bg-white/[0.04] text-neutral-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-neutral-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-purple-400' : 'bg-neutral-600'}`} />
              <span>{connector.name.replace(' Server', '').replace(' Connector', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Main Composer Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-[#2F2F2F] border rounded-3xl p-3 shadow-xl transition-all ${
          isDragging
            ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-[#353535]'
            : 'border-white/[0.1] focus-within:border-white/[0.2]'
        }`}
      >
        {/* Attachment Previews Tray */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-1.5 bg-[#212121]/60 rounded-2xl border border-white/[0.06]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-white/[0.12] bg-[#1a1a1a] flex items-center p-1.5 pr-2 gap-2 text-xs"
              >
                {att.isImage ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-10 h-10 rounded-lg object-cover bg-black/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/60 flex items-center justify-center text-cyan-300">
                    <FileCode className="w-5 h-5" />
                  </div>
                )}
                <div className="max-w-[120px] truncate text-left">
                  <p className="text-white text-xs truncate font-medium">{att.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {(att.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 rounded-full bg-black/60 hover:bg-red-500 text-neutral-300 hover:text-white transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT or Codex... (paste code, attach photos or ask MCP tools)"
          rows={1}
          className="w-full bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-none resize-none max-h-48 leading-relaxed px-1"
        />

        {/* Bottom Toolbar: Paperclip + Send Button */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/[0.06]">
          {/* File & Photo Attachment Trigger */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photos, images, code files, or documents"
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-colors flex items-center gap-1.5 text-xs"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline text-neutral-400">Attach</span>
            </button>

            {/* Hidden Input for Files & Photos */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv,.swift,.cpp,.c,.html,.css"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Submit / Stop Button */}
          <div>
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                title="Stop Generating"
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-md"
              >
                <StopCircle className="w-4 h-4 fill-black" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!text.trim() && attachments.length === 0}
                title="Send Message (Enter)"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  text.trim() || attachments.length > 0
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
                    : 'bg-white/[0.1] text-neutral-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-neutral-500 mt-2">
        AI Hub can make mistakes. Verify important code, system commands, and data.
      </p>
    </div>
  );
};
