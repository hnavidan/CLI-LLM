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
