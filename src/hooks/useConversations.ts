import { useCallback, useEffect, useMemo } from 'react';
import { usePersistentState, nonEmptyArray, rawString, rawStringify } from './usePersistentState';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { newId } from '../utils/ids';
import { Conversation } from '../types/chat';

export const makeConversation = (title: string, model: string): Conversation => ({
  id: newId('conv'),
  title,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  model,
  messages: [],
});

// Conversation history persists metadata only — base64 attachment payloads
// (image `data` / `previewUrl`) are session-scoped and would blow the quota.
const serializeConversations = (conversations: Conversation[]): string =>
  JSON.stringify(conversations, (key, value) =>
    key === 'data' || key === 'previewUrl' ? undefined : value
  );

// Stable last-resort conversation; never synthesized inline (an inline object
// gets a fresh id every render, so message writes silently match nothing).
const EMPTY_CONVERSATION: Conversation = makeConversation('New Chat', 'chatgpt-4o');

export function useConversations(chatModel: string) {
  const [conversations, setConversations] = usePersistentState<Conversation[]>(
    STORAGE_KEYS.CONVERSATIONS,
    () => [makeConversation('Welcome to ChatGPT & Codex', 'chatgpt-4o')],
    { parse: nonEmptyArray<Conversation>, stringify: serializeConversations }
  );

  const [activeConversationId, setActiveConversationId] = usePersistentState<string>(
    STORAGE_KEYS.ACTIVE_CONV_ID,
    () => conversations[0]?.id ?? EMPTY_CONVERSATION.id,
    { parse: rawString, stringify: rawStringify }
  );

  // Drop stale conversation ids left behind by deletes in a prior session
  useEffect(() => {
    if (conversations.length > 0 && !conversations.some(c => c.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId)
      || conversations[0]
      || EMPTY_CONVERSATION;
  }, [conversations, activeConversationId]);

  const handleNewChat = useCallback(() => {
    const newConv = makeConversation('New Chat', chatModel);
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, [chatModel, setConversations, setActiveConversationId]);

  // Always leaves exactly one conversation, and keeps activeConversationId
  // pointed at a conversation that still exists.
  const handleDeleteConversation = useCallback((id: string) => {
    const remaining = conversations.filter(c => c.id !== id);

    if (remaining.length === 0) {
      const fresh = makeConversation('New Chat', chatModel);
      setConversations([fresh]);
      setActiveConversationId(fresh.id);
      return;
    }

    setConversations(remaining);
    if (activeConversationId === id) {
      setActiveConversationId(remaining[0].id);
    }
  }, [activeConversationId, conversations, chatModel, setConversations, setActiveConversationId]);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  }, [setConversations]);

  const handleClearAllConversations = useCallback(() => {
    const freshConv = makeConversation('New Chat', chatModel);
    setConversations([freshConv]);
    setActiveConversationId(freshConv.id);
  }, [chatModel, setConversations, setActiveConversationId]);

  return {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    currentConversation,
    handleNewChat,
    handleDeleteConversation,
    handleRenameConversation,
    handleClearAllConversations,
  };
}
