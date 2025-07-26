# llm_providers/base_provider.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseLLMProvider(ABC):
    """
    Abstract base class for all LLM providers.
    """

    @abstractmethod
    def generate_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> str:
        """
        Generates a response from the LLM based on the given messages.

        Args:
            messages: A list of message dictionaries, typically following OpenAI's
                      format (e.g., [{'role': 'user', 'content': 'Hi'}, {'role': 'assistant', 'content': 'Hello!'}]).
                      Providers might need to adapt this format internally if their API differs.
            options: A dictionary of provider-specific options (e.g., temperature, max_tokens, model).

        Returns:
            The LLM's response as a string. Raises an exception on error.
        """
        pass

    @staticmethod
    @abstractmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validates an API key. The implementation can be different for the different models

        Args:
            api_key: The API key to check

        Returns:
            True if it is a valid API Key. False otherwise.
        """
        pass

    @abstractmethod
    def get_models(self) -> List[Dict[str, str]]:
        """
        Fetches available models from the provider.

        Returns:
            A list of model dictionaries with 'label' and 'value' keys.
        """
        pass