import React, { useState } from 'react';
import { 
  AppWindow, 
  ExternalLink, 
  RotateCw, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { AIService } from '../types/service';
import { ServiceIcon } from './ServiceIcon';

interface SplitViewContainerProps {
  services: AIService[];
  primaryServiceId: string;
  secondaryServiceId: string;
  onSelectPrimaryService: (id: string) => void;
  onSelectSecondaryService: (id: string) => void;
  onOpenInBrowser: (service: AIService) => void;
  onOpenDedicatedWindow: (service: AIService) => void;
  onCloseSplitView: () => void;
}

export const SplitViewContainer: React.FC<SplitViewContainerProps> = ({
  services,
  primaryServiceId,
  secondaryServiceId,
  onSelectPrimaryService,
  onSelectSecondaryService,
  onOpenInBrowser,
  onOpenDedicatedWindow,
  onCloseSplitView,
}) => {
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [leftReloadKey, setLeftReloadKey] = useState(0);
  const [rightReloadKey, setRightReloadKey] = useState(0);

  const primaryService = services.find(s => s.id === primaryServiceId) || services[0];
  const secondaryService = services.find(s => s.id === secondaryServiceId) || services[1] || services[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = document.getElementById('split-view-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (newPercent >= 25 && newPercent <= 75) {
        setSplitPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderPaneHeader = (
    service: AIService,
    isPrimary: boolean,
    onSelect: (id: string) => void,
    onReload: () => void
  ) => {
    return (
      <div className="h-9 bg-[#18181B] border-b border-white/[0.08] px-3 flex items-center justify-between text-xs select-none">
        {/* Service Selector Dropdown */}
        <div className="relative group flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${service.color}25` }}
          >
            <ServiceIcon iconKey={service.iconKey} color={service.color} size={12} />
          </div>

          <select
            value={service.id}
            onChange={(e) => onSelect(e.target.value)}
            className="bg-transparent text-neutral-200 font-medium text-xs border-0 focus:ring-0 cursor-pointer pr-4 appearance-none hover:text-white"
          >
            {services.map(s => (
              <option key={s.id} value={s.id} className="bg-[#1C1C20] text-neutral-200">
                {s.name} ({s.displayUrl})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-0 pointer-events-none" />
        </div>

        {/* Pane Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenDedicatedWindow(service)}
            title="Open Dedicated Window"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <AppWindow className="w-3.5 h-3.5" />
          </button>
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Browser"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onReload}
            title="Reload Pane"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {!isPrimary && (
            <button
              type="button"
              onClick={onCloseSplitView}
              title="Close Split View"
              className="p-1 ml-1 rounded text-neutral-400 hover:text-red-400 hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      id="split-view-container" 
      className="absolute inset-0 flex bg-[#0C0C0E] select-none"
    >
      {/* Left Pane */}
      <div 
        className="flex flex-col relative h-full overflow-hidden"
        style={{ width: `${splitPercent}%` }}
      >
        {renderPaneHeader(
          primaryService, 
          true, 
          onSelectPrimaryService, 
          () => setLeftReloadKey(k => k + 1)
        )}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`left-${primaryService.id}-${leftReloadKey}`}
            src={primaryService.url}
            title={primaryService.name}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Resizer Divider Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1.5 hover:w-2 bg-[#222227] hover:bg-cyan-500 cursor-col-resize flex items-center justify-center transition-all z-20 ${
          isDragging ? 'bg-cyan-500 w-2' : ''
        }`}
      >
        <div className="w-0.5 h-8 bg-neutral-500 rounded-full" />
      </div>

      {/* Right Pane */}
      <div 
        className="flex flex-col relative h-full overflow-hidden"
        style={{ width: `${100 - splitPercent}%` }}
      >
        {renderPaneHeader(
          secondaryService, 
          false, 
          onSelectSecondaryService, 
          () => setRightReloadKey(k => k + 1)
        )}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`right-${secondaryService.id}-${rightReloadKey}`}
            src={secondaryService.url}
            title={secondaryService.name}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
