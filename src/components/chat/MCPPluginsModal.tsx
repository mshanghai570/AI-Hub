import React, { useState } from 'react';
import { 
  X, 
  Plug, 
  Check, 
  Plus, 
  Terminal, 
  Folder, 
  Globe, 
  Database, 
  FileText, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { MCPConnector } from '../../types/chat';

interface MCPPluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectors: MCPConnector[];
  onToggleConnector: (id: string) => void;
  onAddCustomConnector: (newConnector: MCPConnector) => void;
}

export const MCPPluginsModal: React.FC<MCPPluginsModalProps> = ({
  isOpen,
  onClose,
  connectors,
  onToggleConnector,
  onAddCustomConnector,
}) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTransport, setCustomTransport] = useState<'stdio' | 'sse'>('stdio');
  const [customCommand, setCustomCommand] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCommand.trim()) return;

    const newConnector: MCPConnector = {
      id: `custom_mcp_${Date.now()}`,
      name: customName.trim(),
      description: 'Custom Model Context Protocol (MCP) server integration.',
      icon: 'terminal',
      category: 'custom',
      transport: customTransport,
      commandOrUrl: customCommand.trim(),
      isConnected: true,
      isEnabledForChat: true,
      tools: [
        { name: 'execute_mcp_command', description: 'Query custom MCP endpoint or tool' },
      ],
    };

    onAddCustomConnector(newConnector);
    setCustomName('');
    setCustomCommand('');
    setShowAddCustom(false);
  };

  const testConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#1E1E22] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#18181B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Plug className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Model Context Protocol (MCP) & App Plugins</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Claude & ChatGPT Compatible
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Extend AI Hub with GitHub, Local Filesystem, Code Interpreter, and Custom MCP servers
              </p>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Installed MCP Connectors ({connectors.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Custom MCP Server</span>
            </button>
          </div>

          {/* Add Custom Form Drawer */}
          {showAddCustom && (
            <form 
              onSubmit={handleCreateCustom}
              className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.1] space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white">Configure New MCP Connector</h4>
                <button 
                  type="button" 
                  onClick={() => setShowAddCustom(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Connector Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Slack MCP, Linear MCP, Notion"
                  className="w-full px-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Transport</label>
                  <select
                    value={customTransport}
                    onChange={(e) => setCustomTransport(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="stdio">stdio (Command / Subprocess)</option>
                    <option value="sse">SSE (HTTP / Server-Sent Events)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Command or SSE URL</label>
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder={customTransport === 'stdio' ? 'npx -y @modelcontextprotocol/...' : 'https://api.example.com/sse'}
                    className="w-full px-3 py-2 bg-[#121214] border border-white/[0.1] rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md"
                >
                  Save Connector
                </button>
              </div>
            </form>
          )}

          {/* Connectors List */}
          <div className="space-y-2.5">
            {connectors.map((c) => {
              const isTesting = testingId === c.id;
              const isEnabled = c.isConnected && c.isEnabledForChat;

              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                    isEnabled
                      ? 'bg-purple-950/20 border-purple-500/30'
                      : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isEnabled ? 'bg-purple-500/20 text-purple-300' : 'bg-white/[0.06] text-neutral-400'
                    }`}>
                      <Plug className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{c.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-neutral-300">
                          {c.transport}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {c.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-neutral-400">
                        <span className="truncate max-w-xs">{c.commandOrUrl}</span>
                        <span>· {c.tools.length} tools</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => testConnection(c.id)}
                      title="Test MCP handshake & tools"
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-purple-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleConnector(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isEnabled
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300'
                      }`}
                    >
                      {isEnabled ? 'Active in Chat' : 'Enable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-neutral-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Model Context Protocol (Anthropic & OpenAI Standard):</strong> MCP allows AI Hub to safely connect external data sources and execution sandboxes without hardcoding API keys.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141416] flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            {connectors.filter(c => c.isConnected && c.isEnabledForChat).length} of {connectors.length} MCP Connectors Enabled
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
