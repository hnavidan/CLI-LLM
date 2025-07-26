import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/index';

/**
 * Hook for managing chat history with localStorage persistence
 */
export const useChatHistory = (context?: string) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chatHistory');
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
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleResetChat = useCallback((context?: string) => {
    const newHistory: ChatMessage[] = context
      ? [{
          role: 'system',
          content: context,
          timestamp: Date.now(),
        }]
      : [];
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  }, []);

  return {
    chatHistory,
    setChatHistory,
    handleResetChat,
  };
};
