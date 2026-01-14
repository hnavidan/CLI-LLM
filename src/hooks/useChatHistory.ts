import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/index';

/**
 * Hook for managing chat history with localStorage persistence
 * @param context - Initial system context message
 * @param panelId - Unique identifier for the panel instance to isolate chat history
 */
export const useChatHistory = (context?: string, panelId?: string | number) => {
  // Create a unique storage key per panel instance
  const storageKey = panelId ? `chatHistory_${panelId}` : 'chatHistory';
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(storageKey);
    const initialHistory = saved ? JSON.parse(saved) : [];
    if (initialHistory.length === 0 && context) {
      return [{
        role: 'system' as const,
        content: context,
        timestamp: Date.now(),
      }];
    }
    return initialHistory;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
  }, [chatHistory, storageKey]);

  const handleResetChat = useCallback((context?: string) => {
    const newHistory: ChatMessage[] = context
      ? [{
          role: 'system',
          content: context,
          timestamp: Date.now(),
          
        }]
      : [];
    setChatHistory(newHistory);
    localStorage.setItem(storageKey, JSON.stringify(newHistory));
  }, [storageKey]);

  return {
    chatHistory,
    setChatHistory,
    handleResetChat,
  };
};
