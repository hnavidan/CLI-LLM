# llm_providers/vllm_provider.py
import os
import requests
from openai import OpenAI
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any


class VLLMProvider(BaseLLMProvider):
    """
    LLM provider implementation for vLLM using its OpenAI-compatible API.
    vLLM provides an OpenAI-compatible server that can serve various open-source models.
    """
    def __init__(self, base_url: str, api_key: str = "EMPTY"):
        """
        Initialize the vLLM provider.
        
        Args:
            base_url: The base URL of the vLLM server (e.g., "http://localhost:8000/v1")
            api_key: API key for authentication (default "EMPTY" as vLLM typically doesn't require auth)
        """
        if not base_url:
            raise ValueError("base_url is required for vLLM.")
        
        # Ensure base_url ends with /v1 for OpenAI compatibility
        if not base_url.endswith('/v1'):
            base_url = base_url.rstrip('/') + '/v1'
            
        self.base_url = base_url
        self.api_key = api_key or "EMPTY"
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key
        )

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates the vLLM server URL.
        For vLLM, the 'api_key' parameter is actually the server URL.
        We just check if it's provided and is a valid string.
        """
        return bool(api_key and isinstance(api_key, str) and api_key.strip())

    @staticmethod
    def validate_connection(base_url: str, api_key: str = "EMPTY") -> bool:
        """
        Validates the connection to a vLLM server.
        
        Args:
            base_url: The base URL of the vLLM server
            api_key: API key (optional, defaults to "EMPTY")
            
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            # Ensure base_url ends with /v1
            if not base_url.endswith('/v1'):
                base_url = base_url.rstrip('/') + '/v1'
                
            client = OpenAI(base_url=base_url, api_key=api_key or "EMPTY")
            client.models.list()
            return True
        except Exception:
            return False

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the vLLM API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            options: Dictionary of options including 'model', 'temperature', 'max_tokens', etc.
            
        Returns:
            The LLM's response as a string
            
        Raises:
            ValueError: If required options are missing or API call fails
        """
        model_name = options.get('model')
        if not model_name:
            raise ValueError("Model is required for vLLM.")

        # Build the completion kwargs
        completion_kwargs = {
            "model": model_name,
            "messages": messages,
        }

        # Add optional parameters
        if 'temperature' in options:
            completion_kwargs['temperature'] = float(options['temperature'])
        if 'max_tokens' in options:
            completion_kwargs['max_tokens'] = int(options['max_tokens'])
        if 'top_p' in options:
            completion_kwargs['top_p'] = float(options['top_p'])
        if 'frequency_penalty' in options:
            completion_kwargs['frequency_penalty'] = float(options['frequency_penalty'])
        if 'presence_penalty' in options:
            completion_kwargs['presence_penalty'] = float(options['presence_penalty'])
        if 'stop' in options:
            completion_kwargs['stop'] = options['stop']

        try:
            response = self.client.chat.completions.create(**completion_kwargs)
            
            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
            else:
                raise ValueError("vLLM API returned an empty response.")
        except Exception as e:
            raise ValueError(f"Error communicating with vLLM API: {e}")

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from the vLLM server.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            models_response = self.client.models.list()
            
            models = []
            for model in models_response.data:
                if hasattr(model, 'id') and model.id:
                    models.append({
                        "label": model.id,
                        "value": model.id
                    })
            
            # Sort alphabetically
            models.sort(key=lambda x: x["label"].lower())
            return models
        except Exception as e:
            raise ValueError(f"Error fetching models from vLLM: {e}")
