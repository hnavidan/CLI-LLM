# backend.py
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import requests
from llm_providers.gemini_provider import GeminiProvider
from llm_providers.openai_provider import OpenAIProvider
from llm_providers.xai_provider import XAIProvider  # Updated import
from llm_providers.anthropic_provider import AnthropicProvider
from llm_providers.glama_provider import GlamaProvider 
from typing import Dict, Any, List # Import List
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

load_dotenv()

PROVIDER_API_CONFIG = {
    "google": {
        "url_template": "https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
        "method": "GET",
        "auth_type": "query_param", # Key goes in URL
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/models",
        "method": "GET",
        "auth_type": "header",
        "headers": {
            "x-api-key": "{api_key}",
            "anthropic-version": "2023-06-01", # Use a recent version
            "Content-Type": "application/json",
        }
    },
    "chatgpt": { # OpenAI
        "url": "https://api.openai.com/v1/models",
        "method": "GET",
        "auth_type": "bearer", # Authorization: Bearer {api_key}
    },
    "grok": { # xAI
        "url": "https://api.x.ai/v1/models", # Updated to correct xAI URL
        "method": "GET",
        "auth_type": "bearer",
    },
     "glama": {
        "url": "https://glama.ai/api/gateway/openai/v1/models", # Glama's specific endpoint
        "method": "GET",
        "auth_type": "bearer",
    },
    # Add other providers if needed
}

def fetch_and_format_models(provider: str, api_key: str) -> List[Dict[str, str]]:
    """Fetches models from the provider API and formats for Grafana Select."""
    config = PROVIDER_API_CONFIG.get(provider)
    if not config:
        raise ValueError(f"Configuration not found for provider: {provider}")

    url = config.get("url")
    url_template = config.get("url_template")
    headers = config.get("headers", {}).copy() # Copy to avoid modifying template
    auth_type = config.get("auth_type")
    method = config.get("method", "GET") # Default to GET

    # Prepare URL and Headers based on auth type
    request_url = url
    if url_template:
        request_url = url_template.format(api_key=api_key) # For query param auth

    if auth_type == "bearer":
        headers["Authorization"] = f"Bearer {api_key}"
    elif auth_type == "header":
        # Substitute api_key placeholder in headers
        for key, value in headers.items():
            if isinstance(value, str):
                headers[key] = value.format(api_key=api_key)
    elif auth_type != "query_param": # query_param handled in url_template
         raise ValueError(f"Unsupported auth_type for {provider}: {auth_type}")

    # Make the request from the backend server
    try:
        response = requests.request(method, request_url, headers=headers, timeout=15) # Added timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        # Parse the response based on provider structure
        models_data = []
        if provider == "google":
            models_data = data.get("models", [])
            # Filter and map Google models
            formatted_models = [
                {
                    "label": m.get("displayName", m.get("name", "").split('/')[-1]),
                    "value": m.get("name")
                }
                for m in models_data
                if m.get("name") and "generateContent" in m.get("supportedGenerationMethods", [])
            ]
        elif provider == "anthropic":
            models_data = data.get("data", [])
            # Map Anthropic models
            formatted_models = [
                {
                    "label": m.get("display_name", m.get("id")),
                    "value": m.get("id")
                }
                for m in models_data if m.get("id")
            ]
        else: # OpenAI, Grok, DeepSeek, Glama (assume { data: [{ id: ... }] })
            models_data = data.get("data", [])
             # Map standard list models
            formatted_models = [
                {"label": m.get("id"), "value": m.get("id")}
                for m in models_data if m.get("id")
            ]

        # Sort alphabetically by label
        formatted_models.sort(key=lambda x: x.get("label", "").lower())
        return formatted_models

    except requests.exceptions.Timeout:
         raise ConnectionError(f"Timeout connecting to {provider} API at {request_url}")
    except requests.exceptions.RequestException as e:
        # Try to get more specific error from response if available
        error_detail = ""
        try:
            if e.response is not None:
                 error_detail = e.response.text[:500] # Limit error detail length
        except Exception:
            pass # Ignore errors during error handling
        raise ConnectionError(f"Error fetching models from {provider}: {e}. Detail: {error_detail}")
    except Exception as e:
        raise ValueError(f"Error processing response from {provider}: {e}")
    
@app.route('/models', methods=['POST'])
def get_models():
    """Endpoint called by Grafana frontend to fetch models."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        api_key = data.get('apiKey')
        provider = data.get('provider')

        if not api_key or not provider:
            return jsonify({"error": "Missing required parameters (apiKey, provider)"}), 400

        # Try using provider's get_models method first (more reliable)
        try:
            provider_instance = create_llm_provider(provider, api_key)
            models_list = provider_instance.get_models()
            return jsonify(models_list)
        except Exception as provider_error:
            app.logger.warning(f"Provider method failed for {provider}: {provider_error}, falling back to API approach")
            
            # Fallback to direct API call approach
            models_list = fetch_and_format_models(provider, api_key)
            return jsonify(models_list)

    except (ValueError, ConnectionError) as e:
         # Handle known errors (bad provider, connection issues, API errors)
        app.logger.error(f"Error fetching models for {data.get('provider')}: {e}")
        return jsonify({"error": str(e)}), 400 # Use 400 for client-related errors or config issues
    except Exception as e:
        # Catch unexpected server errors
        app.logger.error(f"Unexpected error in /models: {e}", exc_info=True) # Log stack trace
        return jsonify({"error": "An internal server error occurred while fetching models."}), 500


def create_llm_provider(provider_name: str, api_key: str):
    """Factory function to create LLM provider instances."""
    if provider_name == "google":
        if not GeminiProvider.validate_api_key(api_key):
            raise ValueError("Invalid Google API Key")
        return GeminiProvider(api_key)
    elif provider_name == "chatgpt": # Assuming maps to OpenAIProvider
        # Make sure OpenAIProvider exists and follows the pattern
        if not OpenAIProvider.validate_api_key(api_key):
            raise ValueError("Invalid OpenAI API Key")
        return OpenAIProvider(api_key)
    elif provider_name == "grok":
         # Make sure XAIProvider exists and follows the pattern
        if not XAIProvider.validate_api_key(api_key):
            raise ValueError("Invalid xAI API Key")
        return XAIProvider(api_key)
    elif provider_name == "anthropic":
         # Make sure AnthropicProvider exists and follows the pattern
        if not AnthropicProvider.validate_api_key(api_key):
            raise ValueError("Invalid Anthropic API Key")
        return AnthropicProvider(api_key)
    elif provider_name == "glama": # <-- Add Glama case
        if not GlamaProvider.validate_api_key(api_key):
            raise ValueError("Invalid Glama API Key")
        return GlamaProvider(api_key)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_name}")

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        api_key = data.get('apiKey')
        provider_name = data.get('llmProvider')
        messages_input = data.get('messages') # Original messages from frontend
        screenshot_base64 = data.get('screenshot')
        # panel_data = data.get('panelData') # Keep if needed, maybe append to last message?
        options = data.get('options', {}) # Includes model for Glama

        if not api_key or not provider_name or not messages_input:
            return jsonify({"error": "Missing required parameters (apiKey, llmProvider, messages)"}), 400

        # --- Centralized Message Preparation ---
        prepared_messages: List[Dict[str, Any]] = []

        # Handle potential screenshot (currently only for Google Gemini)
        image_part = None
        if screenshot_base64 and provider_name == "google":
            try:
                # Ensure correct padding for base64
                screenshot_data = screenshot_base64.split(',', 1)[1]
                missing_padding = len(screenshot_data) % 4
                if missing_padding:
                    screenshot_data += '='* (4 - missing_padding)
                image_data = base64.b64decode(screenshot_data)
                image_part = {"mime_type": "image/png", "data": image_data}
                # Note: Error handling for invalid base64 might be needed
            except Exception as e:
                 return jsonify({"error": f"Failed to decode screenshot: {e}"}), 400

        # Convert input messages to the target format (list of dicts)
        for i, message in enumerate(messages_input):
            role = message.get('role')
            content = message.get('content')

            if not role or content is None:
                 return jsonify({"error": f"Invalid message format at index {i}: {message}"}), 400

            # Adjust roles if needed (e.g., Gemini specific adjustments)
            if provider_name == "google":
                # Gemini uses 'user' and 'model'. Map 'system' to 'user'.
                # The first message can often be 'system', treat it as 'user'.
                # Subsequent system messages might need careful handling depending on context.
                # Let's map system -> user for simplicity here.
                 target_role = 'user' if role in ['user', 'system'] else 'model'
            elif provider_name == "glama" or provider_name == "chatgpt":
                 # OpenAI/Glama typically use 'user', 'assistant', 'system'
                 # Keep roles as they are, assuming frontend sends compatible roles
                 target_role = role
            else:
                 # Default behavior for other providers (Grok, Deepseek)
                 # Assuming they can handle 'user', 'assistant', 'system' or adapt internally
                 target_role = role


            # Structure for the provider
            message_dict = {"role": target_role}

            # Add image part to the *last* message if it exists (Gemini logic)
            if image_part and i == len(messages_input) - 1 and provider_name == "google":
                 message_dict["parts"] = [{"text": content}, image_part]
            else:
                 if provider_name == "google":
                     # Gemini needs parts structure
                     message_dict["parts"] = [{"text": content}]
                     # If image is present and it's the last message, add it
                     if image_part and i == len(messages_input) - 1:
                         message_dict["parts"].append(image_part)

                 else:
                     # Standard OpenAI/Glama format
                     message_dict["content"] = content
                     # Handle potential image for OpenAI compatible vision models later if needed

            prepared_messages.append(message_dict)


        # --- Panel Data Handling (Example: Append to last message content) ---
        panel_data = data.get('panelData')
        if panel_data and prepared_messages:
            last_message = prepared_messages[-1]
            context_appendix = f"\n\n--- Additional Context ---\n{panel_data}"
            if 'parts' in last_message and isinstance(last_message['parts'], list): # Gemini format
                 # Find the text part and append to it
                 found_text = False
                 for part in last_message['parts']:
                     if 'text' in part:
                         part['text'] += context_appendix
                         found_text = True
                         break
                 if not found_text: # Should not happen if formatted correctly
                     last_message['parts'].append({'text': context_appendix})
            elif 'content' in last_message: # OpenAI/Glama format
                last_message['content'] += context_appendix
            # Else: Decide how to handle for other formats if necessary


        # --- Provider Instantiation and Call ---
        # Check for Glama required option *before* creating provider
        if provider_name == "glama" and not options.get('model'):
             return jsonify({"error": "Missing 'model' in options for Glama provider"}), 400

        llm_provider = create_llm_provider(provider_name, api_key)

        # The `generate_response` method now expects the prepared_messages list
        response_text = llm_provider.generate_response(prepared_messages, options)

        return jsonify({"response": response_text})

    except ValueError as e:
        # Catch specific errors like invalid keys, missing options, API errors raised as ValueError
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Catch unexpected server errors
        import traceback
        print(f"An unexpected error occurred: {traceback.format_exc()}") # Log stack trace
        return jsonify({"error": f"An internal server error occurred: {e}"}), 500


if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0", port=5000)