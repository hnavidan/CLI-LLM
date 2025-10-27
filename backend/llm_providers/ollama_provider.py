# llm_providers/ollama_provider.py
import os
import ollama
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any

class OllamaProvider(BaseLLMProvider):
    """
    LLM provider implementation for Ollama models.
    """
    def __init__(self, host: str = None):
        host = host or os.environ.get("OLLAMA_HOST")
        if not host:
            raise ValueError("OLLAMA_HOST environment variable or host parameter is required.")
        self.client = ollama.Client(host=host)

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates the connection to an Ollama host.
        For Ollama, the 'api_key' parameter is actually the host URL.
        Since Ollama doesn't require authentication, we just check if it's provided.
        """
        return bool(api_key and isinstance(api_key, str) and api_key.strip())

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the Ollama API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            options: Dictionary of options including 'model'
            
        Returns:
            The LLM's response as a string
            
        Raises:
            ValueError: If required options are missing or API call fails
        """
        model_name = options.get('model')
        if not model_name:
            raise ValueError("Model is required for Ollama.")

        completion_kwargs = {
            "model": model_name,
            "messages": messages,
            "options": {}
        }
        
        # Add optional parameters from the broader options dictionary
        # This is more flexible than hardcoding each parameter
        for key, value in options.items():
            if key not in ['model', 'max_tokens']: # Already handled or mapped
                completion_kwargs['options'][key] = value

        if 'max_tokens' in options:
            completion_kwargs['options']['num_predict'] = options['max_tokens']

        try:
            response = self.client.chat(**completion_kwargs)
            if response and 'message' in response and 'content' in response['message']:
                return response['message']['content'].strip()
            else:
                raise ValueError("Ollama API returned an empty or invalid response.")
        except Exception as e:
            raise ValueError(f"Error communicating with Ollama API: {e}")
            
    @staticmethod
    def validate_connection(host: str) -> bool:
        """
        Validates the connection to an Ollama host.
        """
        try:
            client = ollama.Client(host=host)
            client.list()
            return True
        except Exception:
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from Ollama.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            models_response = self.client.list()
            
            models = []
            # The ollama client returns a ListResponse object with a 'models' attribute
            models_list = getattr(models_response, 'models', [])
            
            if models_list:
                for model in models_list:
                    # The Model object has a 'model' attribute (not 'name')
                    model_name = getattr(model, 'model', None)
                    
                    if model_name:
                        models.append({
                            "label": model_name,
                            "value": model_name
                        })
            
            # Sort alphabetically
            models.sort(key=lambda x: x["label"].lower())
            return models
        except Exception as e:
            raise ValueError(f"Error fetching models from Ollama: {e}")
