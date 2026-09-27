export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 or text string
  isImage: boolean;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  model?: string;
  pluginsUsed?: string[];
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface MCPConnector {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'developer' | 'filesystem' | 'search' | 'database' | 'productivity' | 'custom';
  transport: 'stdio' | 'sse' | 'builtin';
  commandOrUrl: string;
  isConnected: boolean;
  isEnabledForChat: boolean;
  tools: MCPTool[];
}
