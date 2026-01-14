# llm_providers/xai_provider.py
from openai import OpenAI, APIError, AuthenticationError
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any

# xAI API Constants
DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1"

class XAIProvider(BaseLLMProvider):
    """
    LLM provider implementation for xAI (Grok) using OpenAI-compatible API.
    """
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("xAI API key is required.")
        self.api_key = api_key
        self.base_url = DEFAULT_XAI_BASE_URL

    def _get_client(self) -> OpenAI:
        """Creates an OpenAI client configured for xAI API."""
        return OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the xAI (Grok) API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            options: Dictionary of options including 'model', 'temperature', 'max_tokens', etc.
            
        Returns:
            The LLM's response as a string
            
        Raises:
            ValueError: If required options are missing or API call fails
        """
        client = self._get_client()
        model_name = options.get('model')

        if not model_name:
            raise ValueError("Missing required option 'model' for XAIProvider.")

        completion_kwargs = {
            "model": model_name,
            "messages": messages,
        }
        
        # Add optional parameters
        if 'temperature' in options:
            completion_kwargs['temperature'] = options['temperature']
        if 'max_tokens' in options:
            completion_kwargs['max_tokens'] = options['max_tokens']
        if 'top_p' in options:
            completion_kwargs['top_p'] = options['top_p']

        try:
            response = client.chat.completions.create(**completion_kwargs)
            if response.choices:
                message = response.choices[0].message
                content = message.content.strip() if message.content else ''
                
                # Check for reasoning in JSON response
                reasoning = None
                if hasattr(message, 'reasoning') and message.reasoning:
                    reasoning = message.reasoning
                elif hasattr(message, 'reasoning_content') and message.reasoning_content:
                    reasoning = message.reasoning_content
                
                # Return dict with thought if reasoning exists, otherwise just string
                if reasoning:
                    return {
                        'thought': reasoning,
                        'response': content
                    }
                else:
                    return content
            else:
                raise ValueError("xAI API returned an empty response.")
        except AuthenticationError:
            raise ValueError("Invalid xAI API Key (Authentication failed).")
        except APIError as e:
            raise ValueError(f"xAI API error: Status={e.status_code}, Message={e.message}")
        except Exception as e:
            raise ValueError(f"Error communicating with xAI API: {e}")

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates an xAI API key by attempting to list models.
        """
        try:
            temp_client = OpenAI(
                api_key=api_key,
                base_url=DEFAULT_XAI_BASE_URL,
            )
            temp_client.models.list()
            return True
        except AuthenticationError:
            return False
        except Exception:
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from xAI API.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            client = self._get_client()
            models_response = client.models.list()
            
            models = []
            for model in models_response.data:
                models.append({
                    "label": model.id,
                    "value": model.id
                })
            
            # Sort alphabetically
            models.sort(key=lambda x: x["label"].lower())
            return models
        except Exception as e:
            raise ValueError(f"Error fetching models from xAI: {e}")