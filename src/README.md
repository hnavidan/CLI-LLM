# CLI-LLM Panel

A [Grafana](https://grafana.com) plugin that provides an interface for interacting with Large Language Models (LLMs) directly within dashboards, enabling closed-loop decision making by forwarding LLM responses to endpoints and supporting various backends or API providers.

![LLM Panel - Control](https://raw.githubusercontent.com/hnavidan/CLI-LLM/refs/heads/main/src/img/panel-control.png)
![LLM Panel - Data insight](https://raw.githubusercontent.com/hnavidan/CLI-LLM/refs/heads/main/src/img/panel-analysis.png)


## Features
- **Multi-Provider Support**: Compatible with various LLM providers including Google, OpenAPI, Glama and others, plus support for local LLM deployment
- **Interactive Interface**: Chat-like interface for natural language interactions with LLM models
- **Data Source Integration**: Automatically reads data from different Grafana data sources over various time periods with automatic updates
- **Closed-Loop Decision Making**: Forward LLM responses to external endpoints for automated actions and decision implementation

## Configuration Options

The CLI-LLM Panel offers configuration options accessible through the panel editor:

### Basic Settings
![Basic Settings](https://raw.githubusercontent.com/hnavidan/CLI-LLM/refs/heads/main/src/img/config-general.png)
![Models](https://raw.githubusercontent.com/hnavidan/CLI-LLM/refs/heads/main/src/img/models.png)


- **Backend Address**: Configure the endpoint URL for your LLM backend service. In case of commercial APIs it has to be the address a message forwarder. Click [here](https://github.com/hnavidan/CLI-LLM/tree/main/backend) for more information.
- **API Provider**: Select from the list of supported API Provider.
- **API Key**: Enter the corresponding API key.
- **Model**: Choose the specific AI model to use.
- **Context**: Set the context or system prompt for the LLM.

### Advanced Settings
![Control Settings](https://raw.githubusercontent.com/hnavidan/CLI-LLM/refs/heads/main/src/img/config-control.png)

- **Control Endpoint URL**: Configure the endpoint to forward LLM responses for decision-making applications. 
- **Control Endpoint Method**: Configure HTTP method (POST or PUT) to send the messages
- **Control Endpoint Headers**: Add custom headers for authentication or other customization

## Getting Started

1. **Install the Plugin**: Add the CLI-LLM Panel to your Grafana instance. See the [main readme](https://github.com/hnavidan/CLI-LLM/blob/main/README.md) for more information.
2. **Configure Backend**: Set up the backend service using the provided [script or docker](https://github.com/hnavidan/CLI-LLM/tree/main/backend).
3. **Add Panel**: Create a new panel and select "LLM-Panel" as the visualization type
4. **Configure**: Configure the LLM panel based on your requirements
5. **(Optional) Set Control Endpoint**: For real-time decision making
6. **Start Chatting**: Begin interacting with AI directly in your dashboard