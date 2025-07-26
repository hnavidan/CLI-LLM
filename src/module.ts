import { PanelPlugin, SelectableValue } from '@grafana/data';
import { SimpleOptions } from './types';
import { LLMPanel } from './components/LLMPanel';

const fetchModelsFromBackend = async (
  provider: string | undefined,
  apiKey: string | undefined,
  backendAddr: string | undefined
): Promise<Array<SelectableValue<string>>> => {

  // Basic validation before calling backend
  if (!provider) { return [{ label: 'Select a provider', value: '' }]; }
  if (!apiKey) { return [{ label: 'Enter API Key', value: '' }]; }
  if (!backendAddr) { return [{ label: 'Enter Backend Address', value: '', description: 'Required to fetch models' }]; }

  // Construct URL to your backend's new /models endpoint
  // Ensure backendAddr includes protocol (e.g., http://localhost:5000)
  let modelsUrl = '';
  try {
     // Basic check if backendAddr looks like a valid URL start
     if (!backendAddr.match(/^https?:\/\//)) {
         throw new Error('Backend Address must include http:// or https://');
     }
     modelsUrl = `${backendAddr.replace(/\/$/, '')}/models`; // Remove trailing slash if exists
  } catch (e: any) {
      console.error("Invalid Backend Address:", backendAddr, e);
      return [{ label: 'Invalid Backend Address', value: '', description: e?.message || 'Check format (e.g., http://host:port)'}];
  }


  try {
      const response = await fetch(modelsUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              // Add any other headers your backend might require, if any
          },
          body: JSON.stringify({ provider, apiKey }), // Send provider and key in body
      });

      if (!response.ok) {
          let errorMsg = `Error fetching models (Backend): ${response.statusText || response.status}`;
          try {
              const errorBody = await response.json();
              errorMsg = errorBody?.error || errorMsg; // Use error message from backend if available
          } catch (_) { /* Ignore if response body is not JSON */ }
          console.error('Error response from backend /models:', errorMsg);
          throw new Error(errorMsg);
      }

      // Expect the backend to return the already formatted SelectableValue array
      const models: Array<SelectableValue<string>> = await response.json();

      if (!Array.isArray(models)) {
           console.error('Invalid response format from backend /models:', models);
           throw new Error('Backend returned invalid format.');
      }

      if (models.length === 0) {
           // Backend might return empty if no models found, or could indicate an issue
           return [{ label: 'No models found or error', value: '', description: 'Check backend logs or API key.' }];
      }

      return models;

  } catch (error) {
      console.error('Failed to fetch models from backend:', error);
      return [{ label: 'Failed to fetch models', value: '', description: `Error: ${error instanceof Error ? error.message : String(error)}` }];
  }
};

export const plugin = new PanelPlugin<SimpleOptions>(LLMPanel).setPanelOptions((builder, context) => {
  const providersWithModels = ['glama', 'google', 'chatgpt', 'grok', 'anthropic'];

  return builder
    .addTextInput({
      path: 'backendAddr',
      name: 'Backend Address',
      description: 'Enter the address of the backend server. (e.g, http://localhost:5000)',
      defaultValue: 'localhost', // Default to localhost
    })
    .addSelect({
      path: 'llmProvider',
      name: 'API Provider',
      description: 'Select the API Provider',
      settings: {
        options: [
          { label: 'Glama', value: 'glama' },
          { label: 'xAI (Grok)', value: 'grok' },
          { label: 'OpenAI', value: 'chatgpt' },
          { label: 'Google', value: 'google' },
          { label: 'Anthropic', value: 'anthropic' },
        ],
      },
      defaultValue: 'google',
    })
    .addTextInput({
      path: 'apiKey',
      name: 'API Key',
      description: 'Enter your API key',
      defaultValue: '',
      settings: {
        secure: true,
      },
    })
    .addSelect({
      path: 'model',
      name: 'Model',
      description: 'Select the specific model (fetched via backend)',
      settings: {
        options: [],
        getOptions: async () => {
          const llmProvider = context.options?.llmProvider ?? '';
          const apiKey = context.options?.apiKey ?? '';
          const backendAddr = context.options?.backendAddr ?? '';          
          if (providersWithModels.includes(llmProvider)) {
              return fetchModelsFromBackend(llmProvider, apiKey, backendAddr);
          } else {
               return [{ label: 'Model selection not applicable', value: '' }];
          }
        },
      },
      // Show only if the provider is known to support models
      showIf: (config) => providersWithModels.includes(config.llmProvider),
      defaultValue: '',
    })
    .addTextInput({
      path: 'context',
      name: 'Context',
      description: 'Enter the context or the hidden prompt for the LLM model.',
      defaultValue: '',
      settings: {
        rows: 5, // Initial height in rows
        placeholder: 'e.g., "You are an expert in analyzing Grafana dashboards. Provide concise insights."',
        useTextarea: true, 
      },
    })
    .addTextInput({
      path: 'controlEndpointUrl',
      name: 'Control Endpoint URL',
      description: 'Optional URL to send LLM responses to.',
      category: ['Control Endpoint'],
      defaultValue: '',
    })
    .addSelect({
      path: 'controlEndpointMethod',
      name: 'HTTP Method',
      description: 'HTTP method to use for the control endpoint.',
      category: ['Control Endpoint'],
      settings: {
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
        ],
      },
      defaultValue: 'POST',
    })
    .addTextInput({
      path: 'controlEndpointHeaders',
      name: 'HTTP Headers (Optional)',
      description: 'Optional headers (one per line, e.g., "Authorization: Bearer xyz"). Content-Type: application/json is added if method is POST/PUT and body is sent.',
      category: ['Control Endpoint'],
      settings: {
        useTextarea: true,
        rows: 3,
      },
      defaultValue: '',
    });
});
