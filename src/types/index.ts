export interface SimpleOptions {
  backendAddr?: string;
  llmProvider: string;
  apiKey: string;
  model?: string;
  context?: string; 
  controlEndpointUrl?: string;
  controlEndpointMethod?: 'POST' | 'PUT'; 
  controlEndpointHeaders?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  screenshot?: string;
}

export interface CustomDateTimePickerProps {
  date: any;
  onChange: (date: any) => void;
}

export interface FieldOption {
  id: string;
  title: string;
}

export interface TimeRangeOption {
  label: string;
  value: string;
}

export interface SerializationResult {
  data: Record<string, any>;
  latestTimestamp: number | null;
}

export interface IncrementalDataResult {
  incrementalData: any;
  latestTimestampInBatch: number | null;
}
