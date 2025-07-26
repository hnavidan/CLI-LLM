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
    └── glama_provider.py   # Glama implementation
```

## Installation & Setup

### Prerequisites

- Python 3.8+

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

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 llm-backend
   ```

#### Option 3: Kubernetes Deployment

```bash
kubectl apply -f backend.yaml
```

## Port Configuration
If you wish to change the port, you must also change it within the Dockerfile and backend.yaml as well.

## License

This service is part of the CLI-LLM project and follows the same licensing terms as the main project.
