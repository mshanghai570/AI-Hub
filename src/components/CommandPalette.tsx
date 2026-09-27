import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ExternalLink, 
  RotateCw, 
  Plus, 
  Columns, 
  FileText, 
  Command, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AIService } from '../types/service';
import { ServiceIcon } from './ServiceIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  services: AIService[];
  activeServiceId: string;
  onSelectService: (id: string) => void;
  onAddService: () => void;
  onToggleSplitView: () => void;
  onOpenScratchpad: () => void;
  onOpenLoginModal?: () => void;
  onOpenSwiftViewer?: () => void;
  onReload: () => void;
  onOpenInBrowser: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  services,
  activeServiceId,
  onSelectService,
  onAddService,
  onToggleSplitView,
  onOpenScratchpad,
  onOpenLoginModal,
  onOpenSwiftViewer,
  onReload,
  onOpenInBrowser,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter services
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.displayUrl.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  // Quick actions
  const actions = [
    {
      id: 'action_login',
      title: 'Login & Session Manager',
      category: 'Actions',
      shortcut: 'Auth',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      run: () => { onOpenLoginModal?.(); onClose(); }
    },
    {
      id: 'action_swift',
      title: 'View Native macOS Swift Code (Apple HIG)',
      category: 'Actions',
      shortcut: 'Swift',
      icon: <Command className="w-4 h-4 text-cyan-400" />,
      run: () => { onOpenSwiftViewer?.(); onClose(); }
    },
    {
      id: 'action_add',
      title: 'Add New AI Service',
      category: 'Actions',
      shortcut: '⌘N',
      icon: <Plus className="w-4 h-4 text-cyan-400" />,
      run: () => { onAddService(); onClose(); }
    },
    {
      id: 'action_split',
      title: 'Toggle Dual Split View',
      category: 'Actions',
      shortcut: '⌘D',
      icon: <Columns className="w-4 h-4 text-indigo-400" />,
      run: () => { onToggleSplitView(); onClose(); }
    },
    {
      id: 'action_scratchpad',
      title: 'Open Prompt Scratchpad',
      category: 'Actions',
      shortcut: '⌘P',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      run: () => { onOpenScratchpad(); onClose(); }
    },
    {
      id: 'action_browser',
      title: 'Open Active in Default Browser',
      category: 'Actions',
      shortcut: '⌘O',
      icon: <ExternalLink className="w-4 h-4 text-emerald-400" />,
      run: () => { onOpenInBrowser(); onClose(); }
    },
    {
      id: 'action_reload',
      title: 'Reload Current Service',
      category: 'Actions',
      shortcut: '⌘R',
      icon: <RotateCw className="w-4 h-4 text-blue-400" />,
      run: () => { onReload(); onClose(); }
    },
  ].filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const totalItems = filteredServices.length + actions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredServices.length) {
        const target = filteredServices[selectedIndex];
        if (target) {
          onSelectService(target.id);
          onClose();
        }
      } else {
        const actionIndex = selectedIndex - filteredServices.length;
        const targetAction = actions[actionIndex];
        if (targetAction) {
          targetAction.run();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#1C1C20] border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a service name or action..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.08] text-neutral-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {totalItems === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching services or actions found
            </div>
          )}

          {/* Services group */}
          {filteredServices.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                AI Services
              </div>
              {filteredServices.map((service, index) => {
                const isSelected = selectedIndex === index;
                const isCurrent = service.id === activeServiceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      onSelectService(service.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-neutral-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${service.color}25` }}
                      >
                        <ServiceIcon iconKey={service.iconKey} color={service.color} size={14} />
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-white">{service.name}</span>
                        <span className="text-neutral-500 ml-2 font-mono text-[11px]">
                          {service.displayUrl}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCurrent && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          Active
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions group */}
          {actions.length > 0 && (
            <div className="pt-1">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Quick Commands
              </div>
              {actions.map((action, idx) => {
                const globalIndex = filteredServices.length + idx;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.run}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-neutral-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
                        {action.icon}
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>

                    <kbd className="font-mono text-[10px] text-neutral-400 bg-white/[0.08] px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-[#141416] flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[10px]">AI Hub Spotlight</span>
        </div>
      </div>
    </div>
  );
};
