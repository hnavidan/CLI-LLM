import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { css } from '@emotion/css';
import { SimpleOptions, ChatMessage } from '../types/index';
import { ChatInterface } from './ChatInterface';
import { ControlPanel } from './ControlPanel';
import { useChatHistory } from '../hooks/useChatHistory';
import { useAvailableFields } from '../hooks/useAvailableFields';
import { sendChatRequest, forwardResponseToEndpoint } from '../services/apiService';
import { DataProcessor } from '../services/dataProcessor';
import { takeScreenshot, getHiddenPrompt } from '../utils/dataUtils';

interface Props extends PanelProps<SimpleOptions> {}

export const LLMPanel: React.FC<Props> = ({ options, data, width, height, timeRange }) => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [includePanel, setIncludePanel] = useState(false);
  const [selectedTimeRangeType, setSelectedTimeRangeType] = useState<'dashboard' | 'relative' | 'absolute'>('dashboard');
  const [relativeTime, setRelativeTime] = useState('5m');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [absoluteTimeRange, setAbsoluteTimeRange] = useState<{ from: number; to: number }>({
    from: Date.now() - 3600000, // 1 hour ago
    to: Date.now(),
  });
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(false);
  const [isAutoForwardingEnabled, setIsAutoForwardingEnabled] = useState(false);

  // Refs for managing state
  const lastSentTimestampRef = useRef<number | null>(null);
  const isProcessingDataUpdate = useRef(false);

  // Custom hooks
  const { chatHistory, setChatHistory, handleResetChat } = useChatHistory(options.context);
  const { availableFields, fieldOptions } = useAvailableFields(data);

  // Setter for last sent timestamp
  const setLastSentTimestamp = useCallback((ts: number | null) => {
    lastSentTimestampRef.current = ts;
  }, []);

  // Handle manual form submission
  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const userDisplayPrompt = prompt;
    let screenshotBase64 = null;
    
    if (includeScreenshot) {
      screenshotBase64 = await takeScreenshot();
      if (!screenshotBase64) {
        setError('Failed to capture screenshot.');
        setLoading(false);
        return;
      }
    }

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userDisplayPrompt,
      timestamp: Date.now(),
      screenshot: screenshotBase64 || undefined,
    };
    setChatHistory((prevHistory) => [...prevHistory, newUserMessage]);
    setPrompt('');

    try {
      let panelData = null;
      let initialLatestTimestamp: number | null = null;

      if (includePanel && selectedFieldIds.length > 0) {
        const result = DataProcessor.logPanelData(
          data,
          includePanel,
          selectedFieldIds,
          timeRange,
          selectedTimeRangeType,
          relativeTime,
          absoluteTimeRange,
          null,
          null
        );
        
        if (result) {
          panelData = result.data;
          initialLatestTimestamp = result.latestTimestamp;
          console.log('Initial Data Sent:', JSON.stringify(panelData, null, 2));
        }
      }

      let hiddenContent = '';
      if (includeScreenshot) {
        hiddenContent = getHiddenPrompt(includeScreenshot, selectedFieldIds);
      }
      if (includePanel && panelData) {
        hiddenContent += `\n\nData (JSON):\n${JSON.stringify(panelData, null, 2)}`;
      }
      const apiPromptContent = hiddenContent ? hiddenContent + '\n\nUser prompt: ' + prompt : prompt;

      const userMessage: ChatMessage = { role: 'user', content: apiPromptContent, timestamp: Date.now() };
      const apiMessages = [...chatHistory, userMessage];
      const baseAddr = options.backendAddr || 'http://localhost:5000/';
      const backendUrl = `${baseAddr.replace(/\/$/, '')}/chat`;

      const responseData = await sendChatRequest(
        backendUrl,
        options.apiKey,
        options.llmProvider,
        apiMessages,
        screenshotBase64,
        panelData,
        options.model
      );

      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseData.response,
        timestamp: Date.now(),
      };
      setChatHistory((prevHistory) => [...prevHistory, newAssistantMessage]);

      if (initialLatestTimestamp !== null) {
        setLastSentTimestamp(initialLatestTimestamp);
        console.log(`Set initial lastSentTimestamp to: ${new Date(initialLatestTimestamp).toISOString()}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-update effect
  useEffect(() => {
    if (!isAutoUpdateEnabled || !includePanel || selectedFieldIds.length === 0 || 
        lastSentTimestampRef.current === null || isProcessingDataUpdate.current) {
      return;
    }

    const result = DataProcessor.processIncrementalData(data, selectedFieldIds, lastSentTimestampRef.current);
    const panelData = result.incrementalData;
    const newLatestTimestamp = result.latestTimestampInBatch;

    if (newLatestTimestamp !== null && Object.keys(panelData).length > 0) {
      isProcessingDataUpdate.current = true;
      console.log(`Auto-update: Found new data up to ${new Date(newLatestTimestamp).toISOString()}`);

      const processUpdate = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const hiddenContent = `Incremental Data Update (JSON):\n${JSON.stringify(panelData, null, 2)}`;
          const apiPromptContent = hiddenContent + '\n\n';
          const userMessage: ChatMessage = { role: 'user', content: apiPromptContent, timestamp: Date.now() };
          const apiMessages = [...chatHistory, userMessage];
          
          const baseAddr = options.backendAddr || 'http://localhost:5000/';
          const backendUrl = `${baseAddr.replace(/\/$/, '')}/chat`;

          const responseData = await sendChatRequest(
            backendUrl,
            options.apiKey,
            options.llmProvider,
            apiMessages,
            undefined,
            panelData,
            options.model
          );

          const userMarkerMessage: ChatMessage = {
            role: 'user',
            content: `(Data automatically updated to ${new Date(newLatestTimestamp).toLocaleTimeString()})`,
            timestamp: Date.now(),
          };
          
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: responseData.response,
            timestamp: Date.now(),
          };

          setChatHistory(prev => [...prev, userMarkerMessage, assistantMessage]);

          if (isAutoForwardingEnabled && options.controlEndpointUrl) {
            await forwardResponseToEndpoint(
              responseData.response,
              options.controlEndpointUrl,
              options.controlEndpointMethod || 'POST',
              options.controlEndpointHeaders || ''
            );
          }

          setLastSentTimestamp(newLatestTimestamp);
        } catch (err: any) {
          console.error('Auto-update Error:', err.message);
          setError(`Auto-update failed: ${err.message}`);
        } finally {
          isProcessingDataUpdate.current = false;
          setLoading(false);
        }
      };

      processUpdate();
    }
  }, [
    data, 
    includePanel, 
    selectedFieldIds, 
    options.apiKey, 
    options.llmProvider, 
    options.backendAddr, 
    options.model, 
    chatHistory, 
    isAutoUpdateEnabled, 
    isAutoForwardingEnabled, 
    options.controlEndpointUrl, 
    options.controlEndpointMethod, 
    options.controlEndpointHeaders
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.shiftKey) {
        e.preventDefault();
        const target = e.currentTarget;
        const cursorPosition = target.selectionStart;
        setPrompt(prompt.substring(0, cursorPosition) + '\n' + prompt.substring(cursorPosition));
        setTimeout(() => {
          target.selectionStart = cursorPosition + 1;
          target.selectionEnd = cursorPosition + 1;
        }, 0);
      } else {
        e.preventDefault();
        if (prompt.trim() && !loading) {
          handleSubmit();
        }
      }
    }
  };

  const handleSelectAllFields = () => {
    if (selectedFieldIds.length === availableFields.length) {
      setSelectedFieldIds([]);
    } else {
      const allIds = availableFields.map(field => field.id);
      setSelectedFieldIds(allIds);
    }
  };

  return (
    <div className={css`width: ${width}px; height: ${height}px; display: flex; flex-direction: row; padding: 16px; gap: 16px;`}>
      <ChatInterface
        chatHistory={chatHistory}
        prompt={prompt}
        setPrompt={setPrompt}
        loading={loading}
        error={error}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        handleResetChat={() => handleResetChat(options.context)}
        enlargedImage={enlargedImage}
        setEnlargedImage={setEnlargedImage}
      />
      
      <ControlPanel
        includePanel={includePanel}
        setIncludePanel={setIncludePanel}
        fieldOptions={fieldOptions}
        selectedFieldIds={selectedFieldIds}
        setSelectedFieldIds={setSelectedFieldIds}
        availableFields={availableFields}
        handleSelectAllFields={handleSelectAllFields}
        selectedTimeRangeType={selectedTimeRangeType}
        setSelectedTimeRangeType={setSelectedTimeRangeType}
        relativeTime={relativeTime}
        setRelativeTime={setRelativeTime}
        absoluteTimeRange={absoluteTimeRange}
        setAbsoluteTimeRange={setAbsoluteTimeRange}
        includeScreenshot={includeScreenshot}
        setIncludeScreenshot={setIncludeScreenshot}
        isAutoUpdateEnabled={isAutoUpdateEnabled}
        setIsAutoUpdateEnabled={setIsAutoUpdateEnabled}
        isAutoForwardingEnabled={isAutoForwardingEnabled}
        setIsAutoForwardingEnabled={setIsAutoForwardingEnabled}
        hasControlEndpoint={!!options.controlEndpointUrl}
      />
    </div>
  );
};
