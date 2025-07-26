import React from 'react';
import { css } from '@emotion/css';
import { Button, useTheme2, IconButton } from '@grafana/ui';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types/index';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  prompt: string;
  setPrompt: (prompt: string) => void;
  loading: boolean;
  error: string | null;
  handleSubmit: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleResetChat: () => void;
  enlargedImage: string | null;
  setEnlargedImage: (image: string | null) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatHistory,
  prompt,
  setPrompt,
  loading,
  error,
  handleSubmit,
  handleKeyDown,
  handleResetChat,
  enlargedImage,
  setEnlargedImage,
}) => {
  const theme = useTheme2();

  return (
    <>
      <div className={css`display: flex; flex-direction: column; flex: 3; height: 100%;`}>
        <div
          className={css`
            flex: 1; overflow-y: auto; margin-bottom: 16px; border: 1px solid ${theme.colors.border.medium};
            padding: 8px; white-space: pre-wrap; display: flex; flex-direction: column; position: relative;
          `}
        >
          <IconButton
            name="trash-alt"
            tooltip="Reset Chat"
            onClick={handleResetChat}
            className={css`position: fixed; top: 0px; left: 22px; z-index: 1;`}
          />
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: theme.colors.error.text }}>Error: {error}</p>}
          {chatHistory.filter(msg => msg.role !== 'system').length === 0 && !loading && !error && (
            <p style={{ color: theme.colors.text.secondary }}>Start a new conversation...</p>
          )}
          {chatHistory
            .filter(msg => msg.role !== 'system')
            .map((message, index) => (
              <div
                key={index}
                className={css`
                  margin-bottom: 8px;
                  background-color: ${message.role === 'user' ? theme.colors.background.secondary : theme.isLight ? '#e6f7ff' : '#0d2e4e'};
                  color: ${theme.colors.text.primary};
                  padding: 10px;
                  border-radius: 8px;
                  max-width: 80%;
                  align-self: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
                  & p {
                    margin-top: 0.2em;
                    margin-bottom: 0.1em;
                  }
                `}
              >
                <strong>{message.role === 'user' ? 'You: ' : 'AI: '}</strong>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {message.screenshot && (
                  <div className={css`margin-top: 8px; position: relative; z-index: 10;`}>
                    <img
                      src={message.screenshot}
                      alt="User screenshot"
                      className={css`
                        max-width: 200px;
                        max-height: 200px;
                        cursor: pointer;
                        border-radius: 4px;
                        object-fit: contain;
                        display: block;
                        z-index: 11;
                        pointer-events: auto !important;
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnlargedImage(message.screenshot ?? null);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
        
        <div className={css`position: relative; width: 100%; display: flex; flex-direction: column; border: 1px solid ${theme.colors.border.medium}; border-radius: 4px; overflow: hidden;`}>
          <textarea
            className={css`
              width: 100%; padding: 8px; padding-right: 60px; padding-bottom: 12px; border: none;
              resize: vertical; min-height: 60px; background: ${theme.colors.background.primary};
              color: ${theme.colors.text.primary}; box-sizing: border-box; &:focus { outline: none; }
            `}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt..."
          />
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="primary"
            className={css`position: absolute; right: 8px; bottom: 8px; min-width: 0; padding: 4px 12px;`}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>

      {enlargedImage && (
        <div
          className={css`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
          `}
          onClick={() => setEnlargedImage(null)}
        >
          <img
            src={enlargedImage}
            alt="Enlarged screenshot"
            className={css`
              max-width: 90%;
              max-height: 90%;
              object-fit: contain;
            `}
          />
        </div>
      )}
    </>
  );
};
