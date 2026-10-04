import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { BACKEND_MODEL } from './src/constants/chatBackend';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Only accept /api requests from this app's own origin. Non-browser clients
// (curl) send no Origin header; the server is bound to 127.0.0.1 so only
// local processes can reach it anyway.
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return next();
    }
  } catch {
    // fall through to 403
  }
  return res.status(403).json({ error: 'Forbidden' });
});

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface AttachmentPayload {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data url or text
  isImage?: boolean;
}

interface MessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: AttachmentPayload[];
}

// Assistant personas style the system prompt only; routing is always BACKEND_MODEL.
const PERSONA_PROMPTS: Record<string, string> = {
  'chatgpt-4o': 'Adopt a balanced, helpful generalist persona: clear structure, practical detail.',
  'openai-codex': 'Adopt a code-focused engineering persona: concise prose, lead with code, prefer diffs and exact fixes.',
  'claude-3-5-sonnet': 'Adopt a nuanced, detailed long-form persona: thorough explanations and careful reasoning.',
  'gemini-2-5-flash': 'Adopt a fast, direct persona: short answers, bullet points, minimal preamble.',
  'perplexity-pro': 'Adopt a research-oriented persona: ground answers strictly in provided context and never invent citations.',
};

// POST /api/chat - ChatGPT / Codex / Claude AI engine with Multimodal attachments and MCP plugins
app.post('/api/chat', async (req, res) => {
  const { messages, model = 'chatgpt-4o', activePlugins } = req.body as {
    messages: MessagePayload[];
    model: string;
    activePlugins: unknown;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required.' });
  }

  const plugins: string[] = Array.isArray(activePlugins)
    ? activePlugins.filter((p): p is string => typeof p === 'string').slice(0, 50)
    : [];

  try {
    // Generate context for MCP plugins
    let mcpToolNotice = '';
    if (plugins.length > 0) {
      const pluginNames = plugins.join(', ');
      mcpToolNotice = `Active Model Context Protocol (MCP) Connectors & Plugins: [${pluginNames}]. If relevant, simulate execution of these tools with realistic structured JSON or tool results before providing the final answer.`;
    }

    const persona = PERSONA_PROMPTS[model] || PERSONA_PROMPTS['chatgpt-4o'];

    const systemPrompt = `You are the AI Hub assistant, an ultra-competent, highly intelligent assistant specializing in world-class coding, system architecture, creative problem-solving, and analysis.
${persona}
When analyzing images, screenshots, code files, or documents, inspect them thoroughly and provide structured, precise observations.
When providing code, use clean modern syntax with language tags for syntax highlighting.
${mcpToolNotice}`;

    // Check if Gemini API Key is available
    if (process.env.GEMINI_API_KEY) {
      // Build a role-tagged conversation: Gemini requires {role, parts}
      // contents, alternating 'user' / 'model'. Adjacent same-role messages
      // (e.g. an attachment part followed by its text) are merged into one.
      type GeminiContent = { role: 'user' | 'model'; parts: any[] };
      const contents: GeminiContent[] = [];
      let currentContent: GeminiContent | null = null;
      const pushContent = (role: 'user' | 'model', parts: any[]) => {
        if (parts.length === 0) return;
        if (currentContent && currentContent.role === role) {
          currentContent.parts.push(...parts);
          return;
        }
        if (currentContent) contents.push(currentContent);
        currentContent = { role, parts: [...parts] };
      };

      // Include recent conversation context (last 5 messages)
      const contextMessages = messages.slice(-5);
      for (const msg of contextMessages) {
        const parts: any[] = [];

        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            if (att.isImage && att.data) {
              // Extract base64
              const base64Data = att.data.includes(',')
                ? att.data.split(',')[1]
                : att.data;
              const mimeType = att.type || 'image/png';
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            } else if (att.data) {
              parts.push({
                text: `[Attached File: ${att.name} (${att.size} bytes)]:\n${att.data.slice(0, 8000)}`,
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        } else if (parts.length === 0) {
          parts.push({ text: 'Please analyze the attached files.' });
        }

        pushContent(msg.role === 'assistant' ? 'model' : 'user', parts);
      }

      if (!currentContent) {
        return res.status(400).json({ error: 'Messages are required.' });
      }
      contents.push(currentContent);

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: BACKEND_MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I've analyzed your input and files.";
      return res.json({
        content: responseText,
        model,
        pluginsUsed: plugins,
      });
    }

    // No API key configured: fail honestly instead of fabricating a reply
    return res.status(503).json({
      error: 'No AI provider configured. Set GEMINI_API_KEY in .env to enable chat.',
    });
  } catch (err) {
    console.error('Chat generation error:', err);
    return res.status(500).json({
      error: 'Error generating AI response. See server logs for details.',
    });
  }
});

// Setup Vite middlewares for SSR/dev server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Bind to loopback only: the chat endpoint spends a real API key, so it
  // must not be reachable from other machines on the network.
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`AI Hub server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
