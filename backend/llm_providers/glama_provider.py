# llm_providers/glama_provider.py
import os
from openai import OpenAI, APIError, AuthenticationError
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any

# --- MODIFICATION START ---
# Use the correct, working Glama API endpoint base URL
DEFAULT_GLAMA_BASE_URL = "https://glama.ai/api/gateway/openai/v1"
# --- MODIFICATION END ---

class GlamaProvider(BaseLLMProvider):
    """
    LLM provider implementation for Glama.ai using its OpenAI-compatible API.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Use environment variable for base URL if set, otherwise use the (now corrected) default
        self.base_url = os.getenv("GLAMA_API_BASE_URL", DEFAULT_GLAMA_BASE_URL)

    def _get_client(self) -> OpenAI:
        """Creates an OpenAI client configured for Glama.ai."""
        # This will now use the corrected self.base_url
        return OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the Glama.ai API.
        # ... (rest of the function remains the same) ...
        """
        client = self._get_client()
        model_name = options.get('model')

        if not model_name:
            raise ValueError("Missing required option 'model' for GlamaProvider.")

        completion_kwargs = {
            "model": model_name,
            "messages": messages,
        }
        if 'temperature' in options: completion_kwargs['temperature'] = options['temperature']
        if 'max_tokens' in options: completion_kwargs['max_tokens'] = options['max_tokens']

        try:
            # This call should now go to the correct endpoint, e.g.,
            # https://api.glama.ai/api/gateway/openai/v1/chat/completions
            response = client.chat.completions.create(**completion_kwargs)
            if response.choices:
                return response.choices[0].message.content.strip()
            else:
                raise ValueError("Glama API returned an empty response.")
        except AuthenticationError:
             # This error should hopefully not occur now with the correct base URL
             raise ValueError("Invalid Glama API Key (Authentication failed).")
        except APIError as e:
            # More specific API errors (rate limits, bad requests post-auth)
             raise ValueError(f"Glama API error: Status={e.status_code}, Message={e.message}")
        except Exception as e:
            raise ValueError(f"Error communicating with Glama API: {e}")

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates a Glama API key by attempting to list models.
        """
        # This validation also needs to use the correct base URL
        base_url_to_validate = os.getenv("GLAMA_API_BASE_URL", DEFAULT_GLAMA_BASE_URL)
        try:
            temp_client = OpenAI(
                api_key=api_key,
                base_url=base_url_to_validate, # Use the same (corrected) base URL
            )
            temp_client.models.list() # Check against the correct endpoint
            return True
        except AuthenticationError:
            return False
        except Exception:
             # Network error, incorrect base URL, etc.
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from Glama API.
        
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
            raise ValueError(f"Error fetching models from Glama: {e}")