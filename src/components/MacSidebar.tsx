import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  RotateCw, 
  Trash2, 
  ShieldCheck, 
  MoreHorizontal,
  AppWindow,
  KeyRound
} from 'lucide-react';
import { AIService } from '../types/service';
import { ServiceIcon } from './ServiceIcon';
import appIconImg from '../assets/images/ai_hub_app_icon_1790529438612.jpg';

interface MacSidebarProps {
  services: AIService[];
  activeServiceId: string;
  onSelectService: (serviceId: string) => void;
  onAddService: () => void;
  onOpenInBrowser: (service: AIService) => void;
  onOpenDedicatedWindow: (service: AIService) => void;
  onReloadService: (service: AIService) => void;
  onRequestDeleteService: (service: AIService) => void;
  onOpenLoginModal: () => void;
  collapsed: boolean;
}

export const MacSidebar: React.FC<MacSidebarProps> = ({
  services,
  activeServiceId,
  onSelectService,
  onAddService,
  onOpenInBrowser,
  onOpenDedicatedWindow,
  onReloadService,
  onRequestDeleteService,
  onOpenLoginModal,
  collapsed,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const defaultServices = services.filter(s => s.isDefault);
  const customServices = services.filter(s => !s.isDefault);

  const getShortcut = (index: number) => {
    if (index < 9) {
      return `⌘${index + 1}`;
    }
    return '';
  };

  const renderServiceItem = (service: AIService, globalIndex: number) => {
    const isActive = service.id === activeServiceId;
    const shortcut = getShortcut(globalIndex);
    const isMenuOpen = menuOpenId === service.id;

    if (collapsed) {
      return (
        <div key={service.id} className="relative group flex justify-center py-1">
          <button
            type="button"
            onClick={() => onSelectService(service.id)}
            title={`${service.name} (${shortcut || service.displayUrl})`}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
              isActive
                ? 'bg-white/[0.16] shadow-sm text-white'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <ServiceIcon iconKey={service.iconKey} color={service.color} size={18} />
            {isActive && (
              <span 
                className="absolute -left-1 top-2.5 bottom-2.5 w-1 rounded-r-full"
                style={{ backgroundColor: service.color }}
              />
            )}
          </button>
        </div>
      );
    }

    return (
      <div 
        key={service.id} 
        className="relative group px-2 py-0.5"
        onMouseLeave={() => {
          if (menuOpenId === service.id) setMenuOpenId(null);
        }}
      >
        <div
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
            isActive
              ? 'bg-white/[0.14] text-white shadow-sm font-medium'
              : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <button
            type="button"
            onClick={() => onSelectService(service.id)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
          >
            <div 
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: `${service.color}22` }}
            >
              <ServiceIcon iconKey={service.iconKey} color={service.color} size={14} />
            </div>
            <span className="truncate text-xs tracking-tight">{service.name}</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {shortcut && (
              <span className={`text-[10px] font-mono px-1 rounded transition-opacity ${
                isActive ? 'text-neutral-200 bg-white/[0.12]' : 'text-neutral-500 opacity-60 group-hover:opacity-100'
              }`}>
                {shortcut}
              </span>
            )}

            {/* Quick action 3-dot menu trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : service.id);
              }}
              title="Service Options"
              className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-white rounded hover:bg-white/[0.1] transition-opacity cursor-pointer focus:outline-none"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown menu for item */}
        {isMenuOpen && (
          <div 
            className="absolute right-2 top-8 w-44 bg-[#1F1F24] border border-white/[0.12] rounded-lg shadow-2xl p-1 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                onReloadService(service);
                setMenuOpenId(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.08] text-neutral-200 transition-colors text-left"
            >
              <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Reload Service</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenDedicatedWindow(service);
                setMenuOpenId(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.08] text-neutral-200 transition-colors text-left"
            >
              <AppWindow className="w-3.5 h-3.5 text-neutral-400" />
              <span>Open Dedicated Window</span>
            </button>
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpenId(null)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.08] text-neutral-200 transition-colors text-left"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Open in Browser</span>
            </a>

            {!service.isDefault && (
              <>
                <div className="my-1 border-t border-white/[0.08]" />
                <button
                  type="button"
                  onClick={() => {
                    onRequestDeleteService(service);
                    setMenuOpenId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Service</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      className={`h-full bg-[#161618]/95 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between select-none transition-all duration-200 shrink-0 ${
        collapsed ? 'w-13' : 'w-52'
      }`}
    >
      {/* Top Section: App Branding & Service List */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-2">
        {/* App Title Branding */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3.5 pb-3 pt-1 border-b border-white/[0.06] mb-2">
            <img 
              src={appIconImg} 
              alt="AI Hub" 
              className="w-6 h-6 rounded-lg shadow-sm border border-white/[0.1] object-cover"
            />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sm tracking-tight text-white">AI Hub</span>
              <span className="text-[10px] uppercase font-mono px-1 rounded bg-white/[0.08] text-neutral-400">
                Mac
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pb-2 pt-1 border-b border-white/[0.06] mb-2">
            <img 
              src={appIconImg} 
              alt="AI Hub" 
              className="w-6 h-6 rounded-lg shadow-sm border border-white/[0.1] object-cover"
            />
          </div>
        )}

        {/* Section Label: Primary AI Services */}
        {!collapsed && (
          <div className="px-3.5 pt-1.5 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <span>Primary AI</span>
            <span>{defaultServices.length}</span>
          </div>
        )}

        {/* Primary Services List */}
        <div className="space-y-0.5">
          {defaultServices.map((service, index) => renderServiceItem(service, index))}
        </div>

        {/* Section Label: Custom Services (if any) */}
        {customServices.length > 0 && (
          <>
            {!collapsed ? (
              <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-1">
                <span>Custom AI</span>
                <span>{customServices.length}</span>
              </div>
            ) : (
              <div className="my-2 border-t border-white/[0.08]" />
            )}

            <div className="space-y-0.5">
              {customServices.map((service, index) => 
                renderServiceItem(service, defaultServices.length + index)
              )}
            </div>
          </>
        )}

        {/* Add Service Button */}
        <div className={`mt-2 ${collapsed ? 'px-1.5 flex justify-center' : 'px-2'}`}>
          <button
            type="button"
            onClick={onAddService}
            title="Add New Service (⌘N)"
            className={`flex items-center gap-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] border border-dashed border-white/[0.12] hover:border-white/[0.24] transition-all ${
              collapsed ? 'w-9 h-9 justify-center p-0' : 'w-full px-2.5 py-1.5'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>Add Service</span>
                <span className="text-[10px] font-mono text-neutral-500">⌘N</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Footer: Session Isolation Indicator & Login Portal Button */}
      <div className="p-2 border-t border-white/[0.06] bg-[#121214]/60">
        <button
          type="button"
          onClick={onOpenLoginModal}
          className={`w-full flex items-center rounded-lg p-1 text-[11px] text-neutral-400 hover:text-emerald-300 hover:bg-white/[0.05] transition-all ${
            collapsed ? 'justify-center' : 'gap-2 px-1.5'
          }`}
          title="Click to view Login Status & Isolated Sessions"
        >
          <div className="relative shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/90" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Sessions Isolated</span>
              <KeyRound className="w-3 h-3 text-neutral-500" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
