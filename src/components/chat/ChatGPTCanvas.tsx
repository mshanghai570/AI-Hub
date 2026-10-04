import React, { useRef, useEffect } from 'react';
import { 
  Bot, 
  Code2, 
  Image as ImageIcon, 
  Terminal, 
  Plug
} from 'lucide-react';
import { Conversation, Attachment, MCPConnector } from '../../types/chat';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatGPTComposer } from './ChatGPTComposer';

interface ChatGPTCanvasProps {
  conversation: Conversation;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  mcpConnectors: MCPConnector[];
  onToggleMCPConnector: (id: string) => void;
  currentModel: string;
}

export const ChatGPTCanvas: React.FC<ChatGPTCanvasProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  onStopGeneration,
  mcpConnectors,
  onToggleMCPConnector,
  currentModel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track whether the user is already at the bottom so we don't yank them
  // away from scrolled-up history when a reply lands.
  const nearBottomRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  // Auto-scroll to bottom on new messages (only if already near the bottom)
  useEffect(() => {
    if (scrollRef.current && nearBottomRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation.messages, isLoading]);

  // Switching conversation always starts at the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    nearBottomRef.current = true;
  }, [conversation.id]);

  const isCodex = currentModel.toLowerCase().includes('codex');

  const QUICK_PROMPTS = [
    {
      title: 'Analyze Photo or Architecture Diagram',
      desc: 'Attach an image or screenshot for deep visual inspection',
      prompt: 'Please analyze this attached screenshot or diagram and explain the key components:',
      icon: <ImageIcon className="w-4 h-4 text-emerald-400" />
    },
    {
      title: 'Codex Code Refactor & Debug',
      desc: 'Review, optimize and format code with best practices',
      prompt: 'Please review and refactor this code for performance, readability, and modern best practices:',
      icon: <Code2 className="w-4 h-4 text-cyan-400" />
    },
    {
      title: 'Ask With MCP Connectors',
      desc: 'Reference your enabled (simulated) connectors in the prompt',
      prompt: 'Using my active MCP connectors as context, list what project files you would inspect first:',
      icon: <Plug className="w-4 h-4 text-purple-400" />
    },
    {
      title: 'Generate Full-Stack Architecture',
      desc: 'Design database schemas, API routes, and components',
      prompt: 'Design a clean, modular full-stack architecture with TypeScript and React:',
      icon: <Terminal className="w-4 h-4 text-amber-400" />
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden relative">
      {/* Scrollable Chat Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        {conversation.messages.length === 0 ? (
          /* Empty State Welcome Screen (ChatGPT / Codex Landing) */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto select-none">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xl border ${
              isCodex 
                ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300' 
                : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
            }`}>
              {isCodex ? <Code2 className="w-7 h-7" /> : <Bot className="w-7 h-7" />}
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isCodex ? 'Coding Workspace' : 'What can I help you with today?'}
            </h2>
            <p className="text-xs text-neutral-400 mt-2 max-w-md leading-relaxed">
              Drop photos, attach source files, or reference your enabled (simulated) MCP connectors in this unified canvas.
            </p>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full text-left">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(qp.prompt, [])}
                  className="p-3.5 rounded-2xl bg-[#282828] hover:bg-[#303030] border border-white/[0.06] hover:border-white/[0.14] transition-all text-xs group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {qp.icon}
                    <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {qp.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {qp.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <div className="py-4 space-y-1">
            {conversation.messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {/* Streaming / Loading Indicator */}
            {isLoading && (
              <div className="py-5 px-4 md:px-6 flex justify-center bg-[#1e1e1e]/40">
                <div className="w-full max-w-3xl flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400 text-xs py-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-200" />
                    <span className="ml-1 text-[11px] font-mono">Thinking & generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Composer Bar */}
      <div className="shrink-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-4">
        <ChatGPTComposer
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onStopGeneration={onStopGeneration}
          mcpConnectors={mcpConnectors}
          onToggleMCPConnector={onToggleMCPConnector}
        />
      </div>
    </div>
  );
};
