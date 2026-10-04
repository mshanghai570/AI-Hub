import React, { useState } from 'react';
import { 
  X, 
  SquarePen, 
  MessageSquare, 
  Search, 
  Trash2, 
  Settings, 
  Plug, 
  Edit2,
  Check
} from 'lucide-react';
import { Conversation } from '../../types/chat';
import { AIService } from '../../types/service';
import { ServiceIcon } from '../ServiceIcon';

interface ChatGPTSidebarDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenMCPModal: () => void;
  onOpenSettings: () => void;
  onSwitchToService: (service: AIService) => void;
  services: AIService[];
}

export const ChatGPTSidebarDropdown: React.FC<ChatGPTSidebarDropdownProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenMCPModal,
  onOpenSettings,
  onSwitchToService,
  services,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  // Filter conversations
  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by time
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const todayChats = filtered.filter(c => now - c.updatedAt < oneDay);
  const yesterdayChats = filtered.filter(c => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay);
  const olderChats = filtered.filter(c => now - c.updatedAt >= 2 * oneDay);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (convId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const isEditing = editingId === conv.id;

    if (isEditing) {
      return (
        <form 
          key={conv.id} 
          onSubmit={(e) => saveRename(conv.id, e)}
          className="px-2 py-1 flex items-center gap-1"
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
            className="flex-1 bg-[#171717] border border-white/[0.2] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            className="p-1 rounded bg-white/[0.1] text-emerald-400 hover:text-white"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div 
        key={conv.id}
        className="relative group px-1.5 py-0.5"
      >
        <div
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
            isActive
              ? 'bg-[#2F2F2F] text-white font-medium shadow-sm'
              : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onSelectConversation(conv.id);
              onClose();
            }}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
          >
            <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{conv.title}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => startRename(conv, e)}
              title="Rename Chat"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.1] cursor-pointer focus:outline-none"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              title="Delete Chat"
              className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-white/[0.1] cursor-pointer focus:outline-none"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
        onClick={onClose}
      />

      {/* Slide-out / Drop-down Drawer */}
      <aside 
        className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#171717] border-r border-white/[0.08] shadow-2xl flex flex-col select-none text-neutral-200 animate-in slide-in-from-left duration-200"
      >
        {/* Top Header */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white tracking-tight">ChatGPT · Codex</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Chat button */}
        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold shadow-sm transition-all border border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <SquarePen className="w-4 h-4 text-emerald-400" />
              <span>New Chat</span>
            </div>
            <kbd className="text-[10px] font-mono text-neutral-400 bg-white/[0.08] px-1.5 py-0.5 rounded">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-[#212121] border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-1.5 space-y-3">
          {todayChats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Today
              </div>
              {todayChats.map(renderConvItem)}
            </div>
          )}

          {yesterdayChats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Yesterday
              </div>
              {yesterdayChats.map(renderConvItem)}
            </div>
          )}

          {olderChats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Previous 7 Days
              </div>
              {olderChats.map(renderConvItem)}
            </div>
          )}

          {conversations.length === 0 && (
            <div className="p-6 text-center text-xs text-neutral-500">
              No conversations yet. Start a new chat!
            </div>
          )}
        </div>

        {/* AI Hub Consumer Services Quick Launcher */}
        <div className="p-2 border-t border-white/[0.06] bg-[#141414]">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
            <span>AI Hub Services</span>
            <span className="text-[9px] text-neutral-400">Web Portal</span>
          </div>
          <div className="grid grid-cols-5 gap-1 py-1 px-1">
            {services.slice(0, 5).map(service => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  onSwitchToService(service);
                  onClose();
                }}
                title={`Open ${service.name} consumer web interface`}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] transition-colors"
              >
                <ServiceIcon iconKey={service.iconKey} color={service.color} size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Menu Items: MCP, Settings, Account */}
        <div className="p-2 border-t border-white/[0.08] bg-[#121212] space-y-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              onOpenMCPModal();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Plug className="w-3.5 h-3.5 text-purple-400" />
              <span>MCP & App Plugins</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>Settings & Preferences</span>
          </button>
        </div>
      </aside>
    </>
  );
};
