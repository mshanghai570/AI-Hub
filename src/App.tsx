import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIService, ViewMode } from './types/service';
import { INITIAL_SERVICES } from './constants/defaultServices';
import { MacTitleBar } from './components/MacTitleBar';
import { MacSidebar } from './components/MacSidebar';
import { ServiceWebView } from './components/ServiceWebView';
import { SplitViewContainer } from './components/SplitViewContainer';
import { AddServiceModal } from './components/AddServiceModal';
import { CommandPalette } from './components/CommandPalette';
import { PromptScratchpad } from './components/PromptScratchpad';
import { DesktopExportModal } from './components/DesktopExportModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { LoginSessionModal } from './components/LoginSessionModal';
import { NativeSwiftViewerModal } from './components/NativeSwiftViewerModal';
import { MacConfirmDialog } from './components/MacConfirmDialog';

// ChatGPT / Codex UI Components
import { Conversation, ChatMessage, Attachment, MCPConnector } from './types/chat';
import { DEFAULT_MCP_CONNECTORS } from './constants/mcpConnectors';
import { ChatGPTHeader } from './components/chat/ChatGPTHeader';
import { ChatGPTSidebarDropdown } from './components/chat/ChatGPTSidebarDropdown';
import { ChatGPTCanvas } from './components/chat/ChatGPTCanvas';
import { MCPPluginsModal } from './components/chat/MCPPluginsModal';
import { ChatSettingsModal } from './components/chat/ChatSettingsModal';

const STORAGE_KEYS = {
  SERVICES: 'ai_hub_services_v1',
  ACTIVE_ID: 'ai_hub_active_service_id',
  SPLIT_ID: 'ai_hub_split_service_id',
  SIDEBAR_COLLAPSED: 'ai_hub_sidebar_collapsed',
  SCRATCHPAD: 'ai_hub_scratchpad_draft',
  VIEW_MODE: 'ai_hub_view_mode',
  UI_MODE: 'ai_hub_ui_mode', // 'chatgpt' or 'web-container'
  CONVERSATIONS: 'ai_hub_conversations_v1',
  ACTIVE_CONV_ID: 'ai_hub_active_conversation_id',
  CHAT_MODEL: 'ai_hub_chat_model',
  MCP_CONNECTORS: 'ai_hub_mcp_connectors_v1',
};

export default function App() {
  // UI Mode: 'chatgpt' (ChatGPT/Codex UI) or 'web-container' (Multi-provider launcher)
  const [uiMode, setUiMode] = useState<'chatgpt' | 'web-container'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.UI_MODE) as 'chatgpt' | 'web-container') || 'chatgpt';
  });

  // Services state with persistent storage
  const [services, setServices] = useState<AIService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SERVICES;
  });

  // Active service selection (for web container)
  const [activeServiceId, setActiveServiceId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || 'chatgpt';
  });

  const [secondaryServiceId, setSecondaryServiceId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SPLIT_ID) || 'claude';
  });

  // Web container view mode (single or split)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode) || 'single';
  });

  // Web container sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
  });

  // ChatGPT 3-line hamburger sidebar dropdown state
  const [isChatGPTDropdownOpen, setIsChatGPTDropdownOpen] = useState(false);

  // ChatGPT Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const initialConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'Welcome to ChatGPT & Codex',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'chatgpt-4o',
      messages: [],
    };
    return [initialConv];
  });

  // Active Conversation ID
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONV_ID);
    return saved || (conversations[0]?.id || `conv_${Date.now()}`);
  });

  // Active Chat Model
  const [chatModel, setChatModel] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CHAT_MODEL) || 'chatgpt-4o';
  });

  // MCP Connectors & App Plugins
  const [mcpConnectors, setMcpConnectors] = useState<MCPConnector[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MCP_CONNECTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MCP_CONNECTORS;
  });

  // Chat loading / generation state
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Prompt Scratchpad content
  const [scratchpadContent, setScratchpadContent] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SCRATCHPAD) || '';
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isDesktopExportOpen, setIsDesktopExportOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSwiftViewerOpen, setIsSwiftViewerOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);

  // Safe delete dialog state
  const [serviceToDelete, setServiceToDelete] = useState<AIService | null>(null);

  // Reload trigger key per service
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({});

  // Sync states to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UI_MODE, uiMode);
  }, [uiMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeServiceId);
  }, [activeServiceId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPLIT_ID, secondaryServiceId);
  }, [secondaryServiceId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, scratchpadContent);
  }, [scratchpadContent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONV_ID, activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_MODEL, chatModel);
  }, [chatModel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MCP_CONNECTORS, JSON.stringify(mcpConnectors));
  }, [mcpConnectors]);

  // Current active conversation
  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || conversations[0] || {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: chatModel,
      messages: [],
    };
  }, [conversations, activeConversationId, chatModel]);

  // Find active service object
  const activeService = useMemo(() => {
    return services.find(s => s.id === activeServiceId) || services[0] || INITIAL_SERVICES[0];
  }, [services, activeServiceId]);

  // Handle New Chat
  const handleNewChat = useCallback(() => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: chatModel,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, [chatModel]);

  // Handle Delete Conversation
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const fresh: Conversation = {
          id: `conv_${Date.now()}`,
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: chatModel,
          messages: [],
        };
        return [fresh];
      }
      return filtered;
    });
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      }
    }
  }, [activeConversationId, conversations, chatModel]);

  // Handle Rename Conversation
  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  }, []);

  // Handle Toggle MCP Connector
  const handleToggleMCPConnector = useCallback((id: string) => {
    setMcpConnectors(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.isEnabledForChat;
        return { ...c, isConnected: nextState, isEnabledForChat: nextState };
      }
      return c;
    }));
  }, []);

  // Handle Add Custom MCP Connector
  const handleAddCustomMCPConnector = useCallback((newConnector: MCPConnector) => {
    setMcpConnectors(prev => [...prev, newConnector]);
  }, []);

  // Handle Send Message (With Vision / Photo Attachments & MCP Plugins)
  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Update conversation title if this is the first message
    const updatedMessages = [...currentConversation.messages, userMessage];
    const isFirstUserMessage = currentConversation.messages.filter(m => m.role === 'user').length === 0;
    const newTitle = isFirstUserMessage 
      ? (text.slice(0, 36) || attachments[0]?.name || 'Chat with Files')
      : currentConversation.title;

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversation.id) {
        return {
          ...c,
          title: newTitle,
          updatedAt: Date.now(),
          messages: updatedMessages,
        };
      }
      return c;
    }));

    setIsLoadingChat(true);

    try {
      const activePlugins = mcpConnectors
        .filter(c => c.isConnected && c.isEnabledForChat)
        .map(c => c.id);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments?.map(a => ({
              name: a.name,
              type: a.type,
              size: a.size,
              data: a.data,
              isImage: a.isImage,
            })),
          })),
          model: chatModel,
          activePlugins,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.content || data.fallback || "I've analyzed your prompt and files.",
        timestamp: Date.now(),
        model: chatModel,
        pluginsUsed: data.pluginsUsed || activePlugins,
      };

      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...updatedMessages, assistantMessage],
          };
        }
        return c;
      }));
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `I received your request: "${text}". Note: If using advanced vision or live search, verify network or MCP tool settings.`,
        timestamp: Date.now(),
        model: chatModel,
        error: err.message,
      };

      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...updatedMessages, errorMessage],
          };
        }
        return c;
      }));
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Switch to specific web service in container mode
  const handleSwitchToService = (service: AIService) => {
    setActiveServiceId(service.id);
    setUiMode('web-container');
  };

  // Web container handlers
  const handleSelectService = useCallback((id: string) => {
    setActiveServiceId(id);
  }, []);

  const handleReload = useCallback(() => {
    setReloadKeys(prev => ({
      ...prev,
      [activeServiceId]: (prev[activeServiceId] || 0) + 1,
    }));
  }, [activeServiceId]);

  const handleOpenInBrowser = useCallback((service?: AIService) => {
    const target = service || activeService;
    window.open(target.url, '_blank', 'noopener,noreferrer');
  }, [activeService]);

  const handleOpenDedicatedWindow = useCallback((service?: AIService) => {
    const target = service || activeService;
    const windowName = `ai_hub_window_${target.id}`;
    const windowFeatures = 'width=1240,height=880,left=120,top=60,menubar=no,toolbar=no,location=no,status=no';
    window.open(target.url, windowName, windowFeatures);
  }, [activeService]);

  const handleAddService = useCallback((newService: AIService) => {
    setServices(prev => [...prev, newService]);
    setActiveServiceId(newService.id);
  }, []);

  const handleRequestDeleteService = useCallback((service: AIService) => {
    setServiceToDelete(service);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!serviceToDelete) return;
    const delId = serviceToDelete.id;
    setServices(prev => prev.filter(s => s.id !== delId));
    if (activeServiceId === delId) {
      setActiveServiceId('chatgpt');
    }
    setServiceToDelete(null);
  }, [serviceToDelete, activeServiceId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      if (e.metaKey || e.ctrlKey) {
        // ⌘B: Toggle sidebar / hamburger dropdown
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          if (uiMode === 'chatgpt') {
            setIsChatGPTDropdownOpen(prev => !prev);
          } else {
            setSidebarCollapsed(prev => !prev);
          }
          return;
        }

        // ⌘N: New Chat or Add Service
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (uiMode === 'chatgpt') {
            handleNewChat();
          } else {
            setIsAddModalOpen(true);
          }
          return;
        }

        // ⌘K: Command Palette
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsCommandPaletteOpen(prev => !prev);
          return;
        }

        // ⌘P: Prompt Scratchpad
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setIsScratchpadOpen(prev => !prev);
          return;
        }

        // ⌘D: Dual Split View (in web container)
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setViewMode(prev => prev === 'single' ? 'split' : 'single');
          return;
        }
      }

      if (e.key === 'Escape') {
        setIsChatGPTDropdownOpen(false);
        setIsCommandPaletteOpen(false);
        setIsAddModalOpen(false);
        setIsScratchpadOpen(false);
        setIsDesktopExportOpen(false);
        setIsShortcutsModalOpen(false);
        setIsLoginModalOpen(false);
        setIsSwiftViewerOpen(false);
        setIsMCPModalOpen(false);
        setIsChatSettingsOpen(false);
        setServiceToDelete(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiMode, handleNewChat]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#212121] text-neutral-200 overflow-hidden font-sans select-none">
      {/* View Mode: ChatGPT / Codex Native Interface */}
      {uiMode === 'chatgpt' ? (
        <div className="flex flex-col h-full w-full overflow-hidden relative">
          {/* ChatGPT / Codex Header with top-left 3-line hamburger button */}
          <ChatGPTHeader
            model={chatModel}
            onChangeModel={setChatModel}
            onToggleSidebar={() => setIsChatGPTDropdownOpen(prev => !prev)}
            onNewChat={handleNewChat}
            onOpenMCPModal={() => setIsMCPModalOpen(true)}
            onSwitchToWebContainer={() => setUiMode('web-container')}
            mcpConnectors={mcpConnectors}
            isSidebarOpen={isChatGPTDropdownOpen}
          />

          {/* ChatGPT Conversation History Dropdown / Drawer (Triggered by Hamburger Button) */}
          <ChatGPTSidebarDropdown
            isOpen={isChatGPTDropdownOpen}
            onClose={() => setIsChatGPTDropdownOpen(false)}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            onOpenMCPModal={() => setIsMCPModalOpen(true)}
            onOpenSettings={() => setIsChatSettingsOpen(true)}
            onSwitchToService={handleSwitchToService}
            services={services}
          />

          {/* Master Chat Canvas (Welcome screen, messages, file/photo attachments, MCP execution, composer) */}
          <ChatGPTCanvas
            conversation={currentConversation}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            onStopGeneration={() => setIsLoadingChat(false)}
            mcpConnectors={mcpConnectors}
            onToggleMCPConnector={handleToggleMCPConnector}
            currentModel={chatModel}
          />
        </div>
      ) : (
        /* View Mode: Consumer Web Container Launcher (ChatGPT.com, Claude.ai, Gemini, etc.) */
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Native macOS Titlebar */}
          <MacTitleBar
            activeService={activeService}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
            onReload={handleReload}
            onOpenInBrowser={() => handleOpenInBrowser()}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(prev => prev === 'single' ? 'split' : 'single')}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
            onOpenDesktopExport={() => setIsDesktopExportOpen(true)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onOpenSwiftViewer={() => setIsSwiftViewerOpen(true)}
          />

          {/* Multi-Service Main Workspace */}
          <div className="flex flex-1 overflow-hidden relative">
            <MacSidebar
              services={services}
              activeServiceId={activeServiceId}
              onSelectService={handleSelectService}
              onAddService={() => setIsAddModalOpen(true)}
              onOpenInBrowser={handleOpenInBrowser}
              onOpenDedicatedWindow={handleOpenDedicatedWindow}
              onReloadService={() => handleReload()}
              onRequestDeleteService={handleRequestDeleteService}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              collapsed={sidebarCollapsed}
            />

            <main className="flex-1 relative overflow-hidden bg-[#0C0C0E]">
              {/* Floating Return Button to ChatGPT / Codex Mode */}
              <div className="absolute top-2.5 right-3 z-30">
                <button
                  type="button"
                  onClick={() => setUiMode('chatgpt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg transition-all border border-emerald-400/30"
                >
                  <span>ChatGPT & Codex Mode</span>
                </button>
              </div>

              {viewMode === 'single' ? (
                services.map((service) => (
                  <ServiceWebView
                    key={service.id}
                    service={service}
                    isActive={service.id === activeServiceId}
                    onOpenInBrowser={handleOpenInBrowser}
                    onOpenDedicatedWindow={handleOpenDedicatedWindow}
                    onOpenLoginModal={() => setIsLoginModalOpen(true)}
                    reloadKey={reloadKeys[service.id] || 0}
                  />
                ))
              ) : (
                <SplitViewContainer
                  services={services}
                  primaryServiceId={activeServiceId}
                  secondaryServiceId={secondaryServiceId}
                  onSelectPrimaryService={setActiveServiceId}
                  onSelectSecondaryService={setSecondaryServiceId}
                  onOpenInBrowser={handleOpenInBrowser}
                  onOpenDedicatedWindow={handleOpenDedicatedWindow}
                  onCloseSplitView={() => setViewMode('single')}
                />
              )}
            </main>

            <PromptScratchpad
              isOpen={isScratchpadOpen}
              onClose={() => setIsScratchpadOpen(false)}
              content={scratchpadContent}
              onChangeContent={setScratchpadContent}
              activeService={activeService}
              onOpenDedicatedWindow={handleOpenDedicatedWindow}
            />
          </div>
        </div>
      )}

      {/* Global Modals & Dialogs */}
      <MCPPluginsModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        connectors={mcpConnectors}
        onToggleConnector={handleToggleMCPConnector}
        onAddCustomConnector={handleAddCustomMCPConnector}
      />

      <ChatSettingsModal
        isOpen={isChatSettingsOpen}
        onClose={() => setIsChatSettingsOpen(false)}
        onClearAllChats={() => {
          const freshConv: Conversation = {
            id: `conv_${Date.now()}`,
            title: 'New Chat',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: chatModel,
            messages: [],
          };
          setConversations([freshConv]);
          setActiveConversationId(freshConv.id);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddService={handleAddService}
        existingServices={services}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        services={services}
        activeServiceId={activeServiceId}
        onSelectService={handleSelectService}
        onAddService={() => setIsAddModalOpen(true)}
        onToggleSplitView={() => setViewMode(prev => prev === 'single' ? 'split' : 'single')}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenSwiftViewer={() => setIsSwiftViewerOpen(true)}
        onReload={handleReload}
        onOpenInBrowser={() => handleOpenInBrowser()}
      />

      <DesktopExportModal
        isOpen={isDesktopExportOpen}
        onClose={() => setIsDesktopExportOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <LoginSessionModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        services={services}
        activeService={activeService}
        onSelectService={handleSelectService}
        onOpenInBrowser={handleOpenInBrowser}
      />

      <NativeSwiftViewerModal
        isOpen={isSwiftViewerOpen}
        onClose={() => setIsSwiftViewerOpen(false)}
      />

      <MacConfirmDialog
        isOpen={serviceToDelete !== null}
        title="Remove AI Service?"
        message={`Are you sure you want to remove "${serviceToDelete?.name}" from AI Hub? You can re-add it at any time.`}
        confirmLabel="Remove Service"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
}
