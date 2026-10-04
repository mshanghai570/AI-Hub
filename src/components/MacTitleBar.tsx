import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  ExternalLink, 
  PanelLeftClose, 
  PanelLeft, 
  Columns, 
  FileText, 
  Search, 
  Lock, 
  Check, 
  Copy,
  Laptop,
  Minimize2,
  X,
  Minus,
  Plus,
  KeyRound,
  Apple
} from 'lucide-react';
import { AIService, ViewMode } from '../types/service';

interface MacTitleBarProps {
  activeService: AIService;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onReload: () => void;
  onOpenInBrowser: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onOpenCommandPalette: () => void;
  onOpenScratchpad: () => void;
  onOpenDesktopExport: () => void;
  onOpenLoginModal: () => void;
  onOpenSwiftViewer: () => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const MacTitleBar: React.FC<MacTitleBarProps> = ({
  activeService,
  sidebarCollapsed,
  onToggleSidebar,
  onReload,
  onOpenInBrowser,
  viewMode,
  onToggleViewMode,
  onOpenCommandPalette,
  onOpenScratchpad,
  onOpenDesktopExport,
  onOpenLoginModal,
  onOpenSwiftViewer,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeService.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-11 bg-[#1A1A1D]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-3.5 select-none shrink-0 z-30 transition-colors">
      {/* Left zone: macOS Traffic Lights + Navigation Controls */}
      <div className="flex items-center gap-3">
        {/* macOS Traffic Lights */}
        <div 
          className="flex items-center gap-2 group mr-1 cursor-pointer"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          {/* Close */}
          <button 
            type="button"
            onClick={onToggleSidebar}
            title="Toggle Window Sidebar (⌘B)"
            className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center transition-all hover:brightness-110 active:brightness-90"
          >
            {isHoveringControls && <X className="w-2 h-2 text-[#4c0000] stroke-[2.5]" />}
          </button>

          {/* Minimize */}
          <button 
            type="button"
            onClick={onToggleSidebar}
            title="Minimize / Toggle Sidebar (⌘M)"
            className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center transition-all hover:brightness-110 active:brightness-90"
          >
            {isHoveringControls && <Minus className="w-2 h-2 text-[#5c3c00] stroke-[2.5]" />}
          </button>

          {/* Zoom / Fullscreen */}
          <button 
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (⌃⌘F)"}
            className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center transition-all hover:brightness-110 active:brightness-90"
          >
            {isHoveringControls && (
              isFullscreen 
                ? <Minimize2 className="w-2 h-2 text-[#003b00] stroke-[2.5]" />
                : <Plus className="w-2 h-2 text-[#003b00] stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Show Sidebar (⌘B)" : "Hide Sidebar (⌘B)"}
          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.08] active:bg-white/[0.12] rounded-md transition-all ml-1"
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* History Navigation: Back, Forward, Reload */}
        <div className="flex items-center gap-0.5 border-l border-white/[0.08] pl-2">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
              title="Go Back"
            className={`p-1.5 rounded-md transition-colors ${
              canGoBack 
                ? 'text-neutral-300 hover:text-white hover:bg-white/[0.08]' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onForward}
            disabled={!canGoForward}
              title="Go Forward"
            className={`p-1.5 rounded-md transition-colors ${
              canGoForward 
                ? 'text-neutral-300 hover:text-white hover:bg-white/[0.08]' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReload}
            title="Reload Service (⌘R)"
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] rounded-md transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle zone: Native macOS Address Bar & Active Service Pill */}
      <div className="flex-1 max-w-md mx-3">
        <div className="flex items-center justify-between bg-[#121214]/80 border border-white/[0.08] hover:border-white/[0.16] transition-colors rounded-lg px-2.5 py-1 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span 
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activeService.color }}
            />
            <Lock className="w-3 h-3 text-emerald-400/80 shrink-0" />
            <span className="font-medium text-neutral-200 truncate">{activeService.name}</span>
            <span className="text-neutral-500 font-mono text-[11px] truncate hidden sm:inline">
              {activeService.displayUrl}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              title="Copy URL"
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={activeService.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Browser (⌘O)"
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Right zone: Quick Switcher, Split View, Scratchpad, Login & Swift */}
      <div className="flex items-center gap-1.5">
        {/* Login & Session Center */}
        <button
          type="button"
          onClick={onOpenLoginModal}
          title="Login Capabilities & Session Manager"
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-md transition-all shadow-sm font-medium"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">Logins</span>
        </button>

        {/* Apple Swift Code Viewer */}
        <button
          type="button"
          onClick={onOpenSwiftViewer}
          title="Apple Senior Developer · Native macOS Swift & SwiftUI Source Code"
          className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-md transition-all shadow-sm"
        >
          <Apple className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline text-[11px]">Swift</span>
        </button>

        {/* Quick Switcher / Command Palette button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Search & Quick Switch (⌘K)"
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] rounded-md transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-mono text-[11px] text-neutral-400">⌘K</span>
        </button>

        {/* Split View Toggle */}
        <button
          type="button"
          onClick={onToggleViewMode}
          title={viewMode === 'split' ? "Exit Split View (⌘D)" : "Dual Split View (⌘D)"}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'split' 
              ? 'bg-white/[0.15] text-white font-medium shadow-sm' 
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08]'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Split</span>
        </button>

        {/* Prompt Scratchpad */}
        <button
          type="button"
          onClick={onOpenScratchpad}
          title="Quick Prompt Scratchpad (⌘P)"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] rounded-md transition-colors"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Mac Desktop Export / App Packaging */}
        <button
          type="button"
          onClick={onOpenDesktopExport}
          title="Mac App Desktop Launcher & Packaging"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 rounded-md transition-all shadow-sm"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Mac App</span>
        </button>
      </div>
    </header>
  );
};
