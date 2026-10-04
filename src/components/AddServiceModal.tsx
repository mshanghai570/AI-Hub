import React, { useState } from 'react';
import { X, Plus, Globe, AlertCircle, Check } from 'lucide-react';
import { AIService } from '../types/service';
import { POPULAR_PRESETS } from '../constants/defaultServices';
import { ServiceIcon } from './ServiceIcon';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (newService: AIService) => void;
  existingServices: AIService[];
}

const COLOR_PRESETS = [
  '#10A37F', // OpenAI Green
  '#DA7756', // Claude Terracotta
  '#3B82F6', // Gemini Royal Blue
  '#22C55E', // Perplexity Mint
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#E5E7EB', // Slate/White
  '#FBBF24', // Amber
];

const ICON_OPTIONS = [
  'bot',
  'sparkles',
  'gemini',
  'search',
  'zap',
  'brain',
  'flame',
  'cpu',
  'book',
  'code',
  'message-square',
  'globe',
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
  existingServices,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [iconKey, setIconKey] = useState('bot');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    let trimmedUrl = url.trim();

    if (!trimmedName) {
      setError('Please enter a service name.');
      return;
    }

    if (!trimmedUrl) {
      setError('Please enter a website URL.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    let parsedDomain = '';
    try {
      const parsed = new URL(trimmedUrl);
      parsedDomain = parsed.hostname;
    } catch {
      setError('Please enter a valid website URL (e.g. https://chat.mistral.ai)');
      return;
    }

    const id = `custom_${Date.now()}_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const newService: AIService = {
      id,
      name: trimmedName,
      url: trimmedUrl,
      displayUrl: parsedDomain,
      description: description.trim() || 'Custom AI Chat Service',
      color,
      iconKey,
      isDefault: false,
      createdAt: Date.now(),
    };

    onAddService(newService);
    handleReset();
    onClose();
  };

  const handleSelectPreset = (preset: Omit<AIService, 'id'>) => {
    const alreadyExists = existingServices.some(s => s.url.includes(preset.displayUrl));
    if (alreadyExists) {
      setError(`${preset.name} is already in your service list.`);
      return;
    }

    setName(preset.name);
    setUrl(preset.url);
    setDescription(preset.description);
    setColor(preset.color);
    setIconKey(preset.iconKey);
    setError(null);
  };

  const handleReset = () => {
    setName('');
    setUrl('');
    setDescription('');
    setColor(COLOR_PRESETS[0]);
    setIconKey('bot');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#18181B] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Add AI Service</h2>
              <p className="text-[11px] text-neutral-400">Connect any consumer AI chat website to AI Hub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick Presets Carousel */}
          <div>
            <span className="text-[11px] font-medium text-neutral-400 block mb-2">
              Popular Presets (1-Click Fill)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_PRESETS.map((preset) => {
                const isCurrent = name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                      isCurrent
                        ? 'bg-white/[0.14] border-cyan-500/50 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] text-neutral-300'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${preset.color}25` }}
                    >
                      <ServiceIcon iconKey={preset.iconKey} color={preset.color} size={13} />
                    </div>
                    <span className="truncate font-medium">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Service Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mistral Le Chat, DeepSeek, v0"
                  className="w-full px-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://chat.mistral.ai"
                    className="w-full pl-9 pr-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  The consumer web chat URL. No API keys are required.
                </p>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Notes / Description <span className="text-neutral-500 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. My primary research assistant"
                  className="w-full px-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Color & Icon Selector */}
              <div className="grid grid-cols-2 gap-4">
                {/* Brand Color Picker */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                          color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#18181B]' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((key) => {
                      const isSelected = iconKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIconKey(key)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-white/[0.2] border border-cyan-400 text-cyan-300'
                              : 'bg-white/[0.04] border border-white/[0.08] text-neutral-400 hover:text-white'
                          }`}
                        >
                          <ServiceIcon iconKey={key} color={isSelected ? color : undefined} size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to AI Hub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
