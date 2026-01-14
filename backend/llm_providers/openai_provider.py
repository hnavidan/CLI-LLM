# llm_providers/openai_provider.py
from openai import OpenAI, APIError, AuthenticationError
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any

class OpenAIProvider(BaseLLMProvider):
    """
    LLM provider implementation for OpenAI GPT models.
    """
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("OpenAI API key is required.")
        self.api_key = api_key
        self.client = OpenAI(api_key=api_key)

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the OpenAI API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            options: Dictionary of options including 'model', 'temperature', 'max_tokens', etc.
            
        Returns:
            The LLM's response as a string
            
        Raises:
            ValueError: If required options are missing or API call fails
        """
        model_name = options.get('model', 'gpt-3.5-turbo')

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
            response = self.client.chat.completions.create(**completion_kwargs)
            if response.choices:
                message = response.choices[0].message
                content = message.content.strip() if message.content else ''
                
                # Check for reasoning in JSON response (e.g., gpt-o1 models)
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
                raise ValueError("OpenAI API returned an empty response.")
        except AuthenticationError:
            raise ValueError("Invalid OpenAI API Key (Authentication failed).")
        except APIError as e:
            raise ValueError(f"OpenAI API error: {e}")
        except Exception as e:
            raise ValueError(f"Error communicating with OpenAI API: {e}")
            
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates an OpenAI API key by attempting to list models.
        """
        try:
            temp_client = OpenAI(api_key=api_key)
            temp_client.models.list()
            return True
        except AuthenticationError:
            return False
        except Exception:
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from OpenAI API.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            models_response = self.client.models.list()
            
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
            raise ValueError(f"Error fetching models from OpenAI: {e}")