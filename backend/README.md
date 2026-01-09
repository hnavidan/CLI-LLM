# CLI-LLM Backend

A Flask-based backend service that provides a unified API interface for multiple LLM providers. This service acts as a middleware between the Grafana panel and various LLM providers like OpenAI, Google Gemini, Anthropic Claude, xAI Grok, and Glama.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Grafana Panel  │────│  Flask Backend  │────│  LLM Providers  │
│    (Frontend)   │    │   (main.py)     │    │   (APIs)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Provider       │
                    │  Abstraction    │
                    │  Layer          │
                    └─────────────────┘
```

## Supported LLM Providers

- [Google Gemini](https://ai.google.dev/gemini-api/docs)
- [OpenAI](https://openai.com/api/)
- [Anthropic](https://www.anthropic.com/api)
- [xAI (Grok)](https://x.ai/api)
- [Glama](https://glama.ai/gateway/docs/api)
- [Ollama](https://ollama.ai/) - Local models
- [vLLM](https://docs.vllm.ai/) - High-performance inference server with OpenAI-compatible API


## Project Structure

```
backend/
├── main.py                 # Main Flask application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker container configuration
├── backend.yaml           # Kubernetes deployment config
├── README.md              # This documentation
└── llm_providers/         # Provider abstraction layer
    ├── __init__.py
    ├── base_provider.py    # Abstract base class
    ├── openai_provider.py  # OpenAI/ChatGPT implementation
    ├── gemini_provider.py  # Google Gemini implementation
    ├── anthropic_provider.py # Anthropic Claude implementation
    ├── xai_provider.py     # xAI Grok implementation
    ├── glama_provider.py   # Glama implementation
    ├── ollama_provider.py  # Ollama local models implementation
    └── vllm_provider.py    # vLLM inference server implementation
```

## Installation & Setup

### Prerequisites

- Python 3.8+

### Environment Variables (API Keys)

You can configure API keys as environment variables instead of entering them in the Grafana panel. The backend supports the following environment variables:

- `GOOGLE_API_KEY` - For Google Gemini API
- `OPENAI_API_KEY` - For OpenAI API  
- `ANTHROPIC_API_KEY` - For Anthr
- `OLLAMA_HOST` - For Ollama server (e.g., `http://localhost:11434`)
- `VLLM_BASE_URL` - For vLLM server (e.g., `http://localhost:8000/v1`)opic Claude API
- `XAI_API_KEY` - For xAI Grok API
- `GLAMA_API_KEY` - For Glama API

**Setting Environment Variables:**

**On Windows (PowerShell):**
```powershell
$env:GOOGLE_API_KEY="your_google_api_key_here"
$env:OPENAI_API_KEY="your_openai_api_key_here"
$env:ANTHROPIC_API_KEY="your_anthropic_api_key_here"
$env:OLLAMA_HOST="http://localhost:11434" 
$env:VLLM_BASE_URL="http://localhost:8000/v1"
$env:XAI_API_KEY="your_xai_api_key_here"
$env:GLAMA_API_KEY="your_glama_api_key_here"
```

**On Linux/macOS:**
```bash
export GOOGLE_API_KEY="your_google_api_key_here"
export OLLAMA_HOST="http://localhost:11434"
export VLLM_BASE_URL="http://localhost:8000/v1"
export OPENAI_API_KEY="your_openai_api_key_here"
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
export XAI_API_KEY="your_xai_api_key_here"
export GLAMA_API_KEY="your_glama_api_key_here"
```

**Using .env file:**
Create a `.env` file in the backend directory:
```env
GOOGLE_API_KEY=your_google_api_key_here
OLLAMA_HOST=http://localhost:11434
VLLM_BASE_URL=http://localhost:8000/v1
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
XAI_API_KEY=your_xai_api_key_here
GLAMA_API_KEY=your_glama_api_key_here
```

> **Note:** If an API key is provided in the Grafana panel, it will override the environment variable.

#### Option 1: Using Python

1. **Clone and navigate to backend directory:**
   ```bash
   cd CLI-LLM/backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the development server:**
   ```bash
   python main.py
   ```

   The server will start on `http://localhost:5000`

#### Option 2: Using Docker

1. **Build the Docker image:**
   ```bash
   docker build -t llm-backend .
   ```

2. **Run the container with environment variables:**
   ```bash
   do-e OLLAMA_HOST="http://host.docker.internal:11434" \
     -e VLLM_BASE_URL="http://host.docker.internal:8000/v1" \
     cker run -p 5000:5000 \
     -e GOOGLE_API_KEY="your_google_api_key_here" \
     -e OPENAI_API_KEY="your_openai_api_key_here" \
     -e ANTHROPIC_API_KEY="your_anthropic_api_key_here" \
     -e XAI_API_KEY="your_xai_api_key_here" \
     -e GLAMA_API_KEY="your_glama_api_key_here" \
     llm-backend
   ```

   **Or using an .env file:**
   ```bash
   docker run -p 5000:5000 --env-file .env llm-backend
   ```

#### Option 3: Kubernetes Deployment

1. **Create a Secret for API keys (recommended):**
   ```bash \
     --from-literal=OLLAMA_HOST="http://ollama-service:11434" \
     --from-literal=VLLM_BASE_URL="http://vllm-service:8000/v1"
   kubectl create secret generic llm-api-keys \
     --from-literal=GOOGLE_API_KEY="your_google_api_key_here" \
     --from-literal=OPENAI_API_KEY="your_openai_api_key_here" \
     --from-literal=ANTHROPIC_API_KEY="your_anthropic_api_key_here" \
     --from-literal=XAI_API_KEY="your_xai_api_key_here" \
     --from-literal=GLAMA_API_KEY="your_glama_api_key_here"
   ```

2. **Deploy the application:**
   ```bash
   kubectl apply -f backend.yaml
   ```

## Port Configuration
If you wish to change the port, you must also change it within the Dockerfile and backend.yaml as well.

## License

This service is part of the CLI-LLM project and follows the same licensing terms as the main project.
