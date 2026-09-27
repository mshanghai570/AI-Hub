import React from 'react';
import { 
  Menu, 
  SquarePen, 
  ChevronDown, 
  Sparkles, 
  Code2, 
  Cpu, 
  Globe, 
  Bot, 
  Layers, 
  Plug, 
  Laptop,
  Compass,
  ArrowRightLeft
} from 'lucide-react';
import { MCPConnector } from '../../types/chat';

interface ChatGPTHeaderProps {
  model: string;
  onChangeModel: (model: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenMCPModal: () => void;
  onSwitchToWebContainer: () => void;
  mcpConnectors: MCPConnector[];
  isSidebarOpen: boolean;
}

export const CHAT_MODELS = [
  {
    id: 'chatgpt-4o',
    name: 'ChatGPT 4o',
    badge: 'Omni Reasoning',
    description: 'Fast, intelligent flagship multimodal model with vision & code',
    icon: <Bot className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'openai-codex',
    name: 'OpenAI Codex',
    badge: 'Coding Specialist',
    description: 'Advanced code generation, debugging, refactoring & architecture',
    icon: <Code2 className="w-4 h-4 text-cyan-400" />
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    badge: 'Deep Writing & Artifacts',
    description: 'Nuanced writing, system design, and large document comprehension',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Google Gemini 2.5 Flash',
    badge: 'Fast Multimodal',
    description: 'High-speed reasoning, deep search grounding, and image comprehension',
    icon: <Cpu className="w-4 h-4 text-blue-400" />
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    badge: 'Live Citations',
    description: 'Real-time web research engine with direct source citations',
    icon: <Globe className="w-4 h-4 text-teal-400" />
  }
];

export const ChatGPTHeader: React.FC<ChatGPTHeaderProps> = ({
  model,
  onChangeModel,
  onToggleSidebar,
  onNewChat,
  onOpenMCPModal,
  onSwitchToWebContainer,
  mcpConnectors,
  isSidebarOpen,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
  const currentModelObj = CHAT_MODELS.find(m => m.id === model) || CHAT_MODELS[0];
  const activeMCPCount = mcpConnectors.filter(c => c.isConnected && c.isEnabledForChat).length;

  return (
    <header className="h-12 bg-[#212121] border-b border-white/[0.08] flex items-center justify-between px-3 text-neutral-200 select-none shrink-0 z-20 transition-colors">
      {/* Top Left: 3-line Hamburger button + New Chat */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close Sidebar (⌘B)" : "Open Sidebar & History (⌘B)"}
          className={`p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center ${
            isSidebarOpen ? 'bg-white/[0.1] text-white' : ''
          }`}
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={onNewChat}
          title="New Chat (⌘N)"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <SquarePen className="w-4 h-4" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.08] text-sm font-semibold text-neutral-100 transition-colors group"
          >
            <div className="flex items-center gap-1.5">
              {currentModelObj.icon}
              <span className="tracking-tight">{currentModelObj.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform duration-150" />
          </button>

          {isModelDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsModelDropdownOpen(false)} 
              />
              <div className="absolute left-0 top-11 w-72 bg-[#282828] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Select Model / AI Persona
                </div>
                <div className="space-y-1">
                  {CHAT_MODELS.map((item) => {
                    const isSelected = item.id === model;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onChangeModel(item.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-white/[0.12] text-white'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="mt-0.5">{item.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-white">{item.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Right: MCP Connectors Pill + Web Container Mode Switcher */}
      <div className="flex items-center gap-2">
        {/* MCP Connectors & App Plugins Button */}
        <button
          type="button"
          onClick={onOpenMCPModal}
          title="Manage Model Context Protocol (MCP) Connectors & App Plugins"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-xs font-medium transition-all shadow-sm"
        >
          <Plug className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">MCP Plugins</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[10px] font-mono font-bold text-purple-300">
            {activeMCPCount}
          </span>
        </button>

        {/* Switch to Web Container View */}
        <button
          type="button"
          onClick={onSwitchToWebContainer}
          title="Switch to original Web Container (ChatGPT.com, Claude.ai, etc.)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition-all"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Web Container</span>
        </button>
      </div>
    </header>
  );
};
