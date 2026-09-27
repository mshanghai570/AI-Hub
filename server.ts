import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

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

// POST /api/chat - ChatGPT / Codex / Claude AI engine with Multimodal attachments and MCP plugins
app.post('/api/chat', async (req, res) => {
  const { messages, model = 'chatgpt-4o', activePlugins = [] } = req.body as {
    messages: MessagePayload[];
    model: string;
    activePlugins: string[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required.' });
  }

  const lastMessage = messages[messages.length - 1];

  try {
    // Generate context for MCP plugins
    let mcpToolNotice = '';
    if (activePlugins && activePlugins.length > 0) {
      const pluginNames = activePlugins.join(', ');
      mcpToolNotice = `Active Model Context Protocol (MCP) Connectors & Plugins: [${pluginNames}]. If relevant, simulate execution of these tools with realistic structured JSON or tool results before providing the final answer.`;
    }

    const systemPrompt = `You are ${
      model.toLowerCase().includes('codex') ? 'OpenAI Codex' : 'ChatGPT (GPT-4o)'
    }, an ultra-competent, highly intelligent AI assistant specializing in world-class coding, system architecture, creative problem-solving, and analysis.
When analyzing images, screenshots, code files, or documents, inspect them thoroughly and provide structured, precise observations.
When providing code, use clean modern syntax with language tags for syntax highlighting.
${mcpToolNotice}`;

    // Check if Gemini API Key is available
    if (process.env.GEMINI_API_KEY) {
      // Build content parts
      const contentsParts: any[] = [];

      // Include recent conversation context (last 5 messages)
      const contextMessages = messages.slice(-5);
      for (const msg of contextMessages) {
        if (msg.role === 'user') {
          // If attachments are present
          if (msg.attachments && msg.attachments.length > 0) {
            for (const att of msg.attachments) {
              if (att.isImage && att.data) {
                // Extract base64
                const base64Data = att.data.includes(',')
                  ? att.data.split(',')[1]
                  : att.data;
                const mimeType = att.type || 'image/png';
                contentsParts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                });
              } else if (att.data) {
                contentsParts.push({
                  text: `[Attached File: ${att.name} (${att.size} bytes)]:\n${att.data.slice(0, 8000)}`,
                });
              }
            }
          }
          contentsParts.push({ text: msg.content || 'Please analyze the attached files.' });
        } else if (msg.role === 'assistant') {
          contentsParts.push({ text: `Assistant: ${msg.content}` });
        }
      }

      // Call Gemini API (using gemini-flash-latest)
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: contentsParts,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I've analyzed your input and files.";
      return res.json({
        content: responseText,
        model,
        pluginsUsed: activePlugins,
      });
    }

    // Fallback if no API key is set
    const fallbackResponse = `### ${model.toUpperCase()} Assistant Response

I received your prompt:
> "${lastMessage.content}"

${lastMessage.attachments && lastMessage.attachments.length > 0 
  ? `**Files & Attachments Analyzed (${lastMessage.attachments.length}):**\n` + 
    lastMessage.attachments.map(a => `- **${a.name}** (${(a.size / 1024).toFixed(1)} KB, ${a.type})`).join('\n') + '\n\n'
  : ''}
${activePlugins.length > 0 
  ? `**MCP Connectors Active:** ${activePlugins.map(p => `\`mcp://${p}\``).join(', ')}\n\n` 
  : ''}
Everything is running smoothly inside your personal AI Hub container!`;

    return res.json({
      content: fallbackResponse,
      model,
      pluginsUsed: activePlugins,
    });
  } catch (err: any) {
    console.error('Chat generation error:', err);
    return res.status(500).json({
      error: err.message || 'Error generating AI response.',
      fallback: `I received your request: "${lastMessage.content}". Please verify your attached files or model settings.`,
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`AI Hub server running on port ${PORT}`);
  });
}

startServer();
