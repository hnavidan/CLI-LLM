# llm_providers/anthropic_provider.py
from anthropic import Anthropic, APIError, AuthenticationError
from .base_provider import BaseLLMProvider
from typing import Dict, Any, List

# Anthropic API Constants
DEFAULT_ANTHROPIC_MODEL = "claude-3-sonnet-20240229"
DEFAULT_MAX_TOKENS = 2048

class AnthropicProvider(BaseLLMProvider):
    """
    LLM provider implementation for Anthropic (Claude) models.
    """
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Anthropic API key is required.")
        self.api_key = api_key
        self.client = Anthropic(api_key=api_key)

    def generate_response(self, messages: List[Dict[str, Any]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the Anthropic API.

        Args:
            messages: List of message dictionaries (must have 'role' and 'content').
                      Roles 'user' and 'assistant' are expected. 'system' messages
                      will be handled separately.
            options: Dictionary of options, must include 'model'. Can also include
                     'temperature', 'max_tokens', etc.

        Returns:
            The LLM's response text.

        Raises:
            ValueError: If required options are missing or API call fails.
        """
        model_name = options.get('model')
        if not model_name:
            raise ValueError("Missing required option 'model' for AnthropicProvider.")

        # Prepare messages and system prompt for Anthropic
        system_prompt = None
        anthropic_messages = []
        for message in messages:
            role = message.get('role')
            content = message.get('content')

            if not role or content is None:
                raise ValueError(f"Invalid message format: {message}")

            if role == 'system':
                # Anthropic uses a top-level 'system' parameter
                if system_prompt is None:
                    system_prompt = content
                # Skip adding system messages to the main messages list
                continue
            elif role == 'model':
                # Map 'model' role to 'assistant'
                anthropic_messages.append({"role": "assistant", "content": content})
            elif role == 'user':
                anthropic_messages.append({"role": "user", "content": content})
            elif role == 'assistant':
                anthropic_messages.append({"role": "assistant", "content": content})
            else:
                raise ValueError(f"Unsupported role for Anthropic: {role}")

        # Prepare parameters
        max_tokens = options.get('max_tokens', DEFAULT_MAX_TOKENS)
        message_kwargs = {
            "model": model_name,
            "max_tokens": max_tokens,
            "messages": anthropic_messages,
        }
        
        if system_prompt:
            message_kwargs["system"] = system_prompt
        if 'temperature' in options:
            message_kwargs['temperature'] = options['temperature']
        if 'top_p' in options:
            message_kwargs['top_p'] = options['top_p']
        if 'top_k' in options:
            message_kwargs['top_k'] = options['top_k']

        try:
            response = self.client.messages.create(**message_kwargs)
            
            # Extract content from response
            if response.content and len(response.content) > 0:
                # Anthropic returns a list of content blocks
                text_content = ""
                for content_block in response.content:
                    if hasattr(content_block, 'text'):
                        text_content += content_block.text
                return text_content.strip()
            else:
                raise ValueError("Anthropic API returned an empty response.")

        except AuthenticationError:
            raise ValueError("Invalid Anthropic API Key (Authentication failed).")
        except APIError as e:
            raise ValueError(f"Anthropic API error: {e}")
        except Exception as e:
            raise ValueError(f"Error communicating with Anthropic API: {e}")

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates an Anthropic API key by attempting to list models.
        """
        if not api_key:
            return False

        try:
            temp_client = Anthropic(api_key=api_key)
            # Try to list models to validate the key
            temp_client.models.list()
            return True
        except AuthenticationError:
            return False
        except Exception:
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from Anthropic API.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            models_response = self.client.models.list()
            
            models = []
            for model in models_response.data:
                models.append({
                    "label": getattr(model, 'display_name', model.id),
                    "value": model.id
                })
            
            # Sort alphabetically
            models.sort(key=lambda x: x["label"].lower())
            return models
        except Exception as e:
            raise ValueError(f"Error fetching models from Anthropic: {e}")