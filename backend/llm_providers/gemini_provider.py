# llm_providers/gemini_provider.py
import google.generativeai as genai
from .base_provider import BaseLLMProvider
from typing import List, Dict, Any

class GeminiProvider(BaseLLMProvider):
    """
    LLM provider implementation for Google Gemini models.
    """
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Google API key is required.")
        genai.configure(api_key=api_key)
        self.api_key = api_key

    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response using the Google Gemini API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            options: Dictionary of options including 'model', 'temperature', 'max_tokens', etc.
            
        Returns:
            The LLM's response as a string
            
        Raises:
            ValueError: If required options are missing or API call fails
        """
        model_name = options.get('model', 'gemini-2.0-flash')
        
        try:
            model = genai.GenerativeModel(model_name)
            
            # Convert messages to Gemini format
            # For now, concatenate all messages into a single prompt
            # TODO: Implement proper conversation history handling
            prompt_parts = []
            for message in messages:
                role = message.get('role', 'user')
                content = message.get('content', '')
                if role == 'system':
                    prompt_parts.append(f"System: {content}")
                elif role == 'user':
                    prompt_parts.append(f"User: {content}")
                elif role == 'assistant':
                    prompt_parts.append(f"Assistant: {content}")
            
            full_prompt = "\n".join(prompt_parts)
            
            # Generate response
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            raise ValueError(f"Gemini API error: {e}")

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates a Google API key by making a simple request.
        """
        try:
            genai.configure(api_key=api_key)
            list(genai.list_models())  # Convert generator to list to trigger API call
            return True
        except Exception:
            return False

    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from Google Gemini API.
        
        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        try:
            models_list = list(genai.list_models())
            
            models = []
            for model in models_list:
                # Filter for models that support generateContent
                if hasattr(model, 'supported_generation_methods') and \
                   'generateContent' in model.supported_generation_methods:
                    display_name = getattr(model, 'display_name', model.name.split('/')[-1])
                    models.append({
                        "label": display_name,
                        "value": model.name
                    })
            
            # Sort alphabetically
            models.sort(key=lambda x: x["label"].lower())
            return models
        except Exception as e:
            raise ValueError(f"Error fetching models from Google Gemini: {e}")